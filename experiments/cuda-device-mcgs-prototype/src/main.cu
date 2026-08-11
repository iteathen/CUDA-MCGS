#include <cuda_runtime.h>
#include <cuda/atomic>

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstdio>
#include <cstring>

namespace {

constexpr const char* kPrototypeId = "cuda-device-mcgs-v0";
constexpr int kMaxNodes = 16;
constexpr int kMaxActions = 2;
constexpr int kMaxEdges = kMaxNodes * kMaxActions;
constexpr int kHashCapacity = 32;
constexpr int kMaxDepth = 16;
constexpr int kEmpty = -1;
constexpr int kPending = -1;
constexpr int kFailed = -2;
constexpr float kExploration = 1.10F;

enum SearchStatus : int {
  kSearchOk = 0,
  kNodeCapacity = 1,
  kHashCapacityExceeded = 2,
  kPublicationFailure = 3,
};

enum SchedulerKind : int {
  kGlobalTicket = 0,
  kWarpTicketBatch = 1,
};

struct SearchStorage {
  int status;
  int node_limit;
  int next_simulation;
  int completed_simulations;
  int node_count;
  int scheduler_claims;
  int transposition_hits;
  int cycle_cutoffs;
  int depth_cutoffs;
  int capacity_failures;

  int hash_keys[kHashCapacity];
  int hash_nodes[kHashCapacity];

  int node_state[kMaxNodes];
  int node_expansion[kMaxNodes];
  int node_action_count[kMaxNodes];
  int node_visits[kMaxNodes];

  int edge_action[kMaxEdges];
  int edge_child[kMaxEdges];
  int edge_visits[kMaxEdges];
  float edge_value_sum[kMaxEdges];

  // Keep diagnostics after the searched columns so instrumentation does not shift their offsets.
  int diagnostic_edge;
  int diagnostic_parent_state;
  int diagnostic_action;
  int diagnostic_expected_child;
  int diagnostic_observed_child;
};

static_assert(kHashCapacity > kMaxNodes);
static_assert(kMaxActions == 2, "The synthetic-domain specialization assumes two action slots.");

__host__ __device__ constexpr int edge_index(int node, int slot) {
  return node * kMaxActions + slot;
}

__device__ unsigned hash_state(int state) {
  unsigned value = static_cast<unsigned>(state) * 0x9E3779B9U;
  value ^= value >> 16U;
  return value;
}

__device__ int load_int(int* value) {
  return atomicAdd(value, 0);
}

__device__ float load_float(float* value) {
  return atomicAdd(value, 0.0F);
}

__device__ int load_acquire(int* value) {
  cuda::atomic_ref<int, cuda::thread_scope_device> publication(*value);
  return publication.load(cuda::memory_order_acquire);
}

__device__ void store_release(int* value, int desired) {
  cuda::atomic_ref<int, cuda::thread_scope_device> publication(*value);
  publication.store(desired, cuda::memory_order_release);
}

__device__ void publish_status(SearchStorage* storage, SearchStatus status) {
  atomicCAS(&storage->status, kSearchOk, static_cast<int>(status));
}

__device__ int reserve_node_slot(SearchStorage* storage) {
  int count = load_int(&storage->node_count);
  while (count < storage->node_limit && count < kMaxNodes) {
    const int observed = atomicCAS(&storage->node_count, count, count + 1);
    if (observed == count) {
      return count;
    }
    count = observed;
  }
  return kFailed;
}

__device__ int find_or_insert_node(SearchStorage* storage, int state) {
  const unsigned start = hash_state(state) % kHashCapacity;

  for (int probe = 0; probe < kHashCapacity; ++probe) {
    const int slot = static_cast<int>((start + static_cast<unsigned>(probe)) % kHashCapacity);
    const int observed = atomicCAS(&storage->hash_keys[slot], kEmpty, state);

    if (observed == kEmpty) {
      const int node = reserve_node_slot(storage);
      if (node < 0) {
        atomicAdd(&storage->capacity_failures, 1);
        publish_status(storage, kNodeCapacity);
        __threadfence();
        atomicExch(&storage->hash_nodes[slot], kFailed);
        return kFailed;
      }

      storage->node_state[node] = state;
      storage->node_expansion[node] = 0;
      storage->node_action_count[node] = 0;
      storage->node_visits[node] = 0;
      for (int action = 0; action < kMaxActions; ++action) {
        const int edge = edge_index(node, action);
        storage->edge_action[edge] = kEmpty;
        storage->edge_child[edge] = kEmpty;
        storage->edge_visits[edge] = 0;
        storage->edge_value_sum[edge] = 0.0F;
      }

      store_release(&storage->hash_nodes[slot], node);
      return node;
    }

    if (observed == state) {
      atomicAdd(&storage->transposition_hits, 1);
      int node = load_acquire(&storage->hash_nodes[slot]);
      while (node == kPending && load_int(&storage->status) == kSearchOk) {
        node = load_acquire(&storage->hash_nodes[slot]);
      }
      return node;
    }
  }

  publish_status(storage, kHashCapacityExceeded);
  return kFailed;
}

__device__ int domain_action_count(int state) {
  switch (state) {
    case 0:
    case 1:
    case 2:
    case 5:
      return 2;
    default:
      return 0;
  }
}

__device__ int domain_transition(int state, int action) {
  if (state == 0) {
    return action == 0 ? 1 : 2;
  }
  if (state == 1) {
    return action == 0 ? 3 : 4;
  }
  if (state == 2) {
    return action == 0 ? 4 : 5;
  }
  if (state == 5) {
    return action == 0 ? 6 : 2;
  }
  return kFailed;
}

__device__ bool domain_terminal_value(int state, float* value) {
  if (state == 3) {
    *value = 1.0F;
    return true;
  }
  if (state == 4) {
    *value = 0.25F;
    return true;
  }
  if (state == 6) {
    *value = -0.5F;
    return true;
  }
  return false;
}

__device__ float domain_leaf_value(int state) {
  float value = 0.0F;
  if (domain_terminal_value(state, &value)) {
    return value;
  }

  // This deliberately tiny resident evaluator is part of the specialized domain.
  if (state == 1) {
    return 0.10F;
  }
  if (state == 2) {
    return -0.05F;
  }
  if (state == 5) {
    return -0.10F;
  }
  return 0.0F;
}

__device__ bool ensure_expanded(SearchStorage* storage, int node) {
  cuda::atomic_ref<int, cuda::thread_scope_device> publication(storage->node_expansion[node]);
  int expected = 0;
  if (publication.compare_exchange_strong(
          expected,
          1,
          cuda::memory_order_acq_rel,
          cuda::memory_order_acquire)) {
    const int state = storage->node_state[node];
    const int action_count = domain_action_count(state);
    storage->node_action_count[node] = action_count;
    for (int action = 0; action < action_count; ++action) {
      storage->edge_action[edge_index(node, action)] = action;
    }
    publication.store(2, cuda::memory_order_release);
    return true;
  }

  int expansion = expected;
  while (expansion == 1 && load_int(&storage->status) == kSearchOk) {
    expansion = publication.load(cuda::memory_order_acquire);
  }
  return expansion == 2;
}

struct ReservedEdge {
  int edge;
  int previous_visits;
};

__device__ ReservedEdge select_and_reserve(SearchStorage* storage, int node, int ticket) {
  const int action_count = storage->node_action_count[node];
  const int first_slot = ticket % action_count;

  // Prefer an unvisited action, rotating the first probe to reduce the initial stampede.
  for (int offset = 0; offset < action_count; ++offset) {
    const int slot = (first_slot + offset) % action_count;
    const int edge = edge_index(node, slot);
    if (load_int(&storage->edge_visits[edge]) == 0) {
      return {edge, atomicAdd(&storage->edge_visits[edge], 1)};
    }
  }

  const int parent_visits = load_int(&storage->node_visits[node]);
  float best_score = -1.0e30F;
  int best_edge = edge_index(node, first_slot);

  for (int offset = 0; offset < action_count; ++offset) {
    const int slot = (first_slot + offset) % action_count;
    const int edge = edge_index(node, slot);
    const int visits = max(1, load_int(&storage->edge_visits[edge]));
    const float mean = load_float(&storage->edge_value_sum[edge]) / static_cast<float>(visits);
    const float exploration = kExploration *
        sqrtf(logf(static_cast<float>(parent_visits) + 2.0F) / static_cast<float>(visits));
    const float score = mean + exploration;
    if (score > best_score) {
      best_score = score;
      best_edge = edge;
    }
  }

  return {best_edge, atomicAdd(&storage->edge_visits[best_edge], 1)};
}

__device__ bool path_contains(const int* path_nodes, int path_node_count, int node) {
  for (int index = 0; index < path_node_count; ++index) {
    if (path_nodes[index] == node) {
      return true;
    }
  }
  return false;
}

__device__ void run_simulation(SearchStorage* storage, int root, int ticket) {
  int path_nodes[kMaxDepth + 1];
  int path_edges[kMaxDepth];
  int path_node_count = 1;
  int path_edge_count = 0;
  path_nodes[0] = root;

  int node = root;
  float leaf_value = 0.0F;
  bool stopped = false;

  for (int depth = 0; depth < kMaxDepth; ++depth) {
    const int state = storage->node_state[node];
    if (domain_terminal_value(state, &leaf_value)) {
      stopped = true;
      break;
    }

    if (!ensure_expanded(storage, node)) {
      stopped = true;
      break;
    }

    const ReservedEdge reserved = select_and_reserve(storage, node, ticket + depth);
    path_edges[path_edge_count++] = reserved.edge;

    const int action = storage->edge_action[reserved.edge];
    const int child_state = domain_transition(state, action);
    const int child = find_or_insert_node(storage, child_state);
    if (child < 0) {
      stopped = true;
      break;
    }

    const int published_child = atomicCAS(&storage->edge_child[reserved.edge], kEmpty, child);
    if (published_child != kEmpty && published_child != child) {
      if (atomicCAS(&storage->diagnostic_edge, kEmpty, reserved.edge) == kEmpty) {
        storage->diagnostic_parent_state = state;
        storage->diagnostic_action = action;
        storage->diagnostic_expected_child = child;
        storage->diagnostic_observed_child = published_child;
        __threadfence();
      }
      publish_status(storage, kPublicationFailure);
      stopped = true;
      break;
    }

    if (path_contains(path_nodes, path_node_count, child)) {
      atomicAdd(&storage->cycle_cutoffs, 1);
      leaf_value = 0.0F;
      stopped = true;
      break;
    }

    path_nodes[path_node_count++] = child;
    node = child;

    if (reserved.previous_visits == 0) {
      leaf_value = domain_leaf_value(child_state);
      stopped = true;
      break;
    }
  }

  if (!stopped) {
    atomicAdd(&storage->depth_cutoffs, 1);
    leaf_value = 0.0F;
  }

  for (int index = 0; index < path_edge_count; ++index) {
    atomicAdd(&storage->edge_value_sum[path_edges[index]], leaf_value);
  }
  for (int index = 0; index < path_node_count; ++index) {
    atomicAdd(&storage->node_visits[path_nodes[index]], 1);
  }
  atomicAdd(&storage->completed_simulations, 1);
}

__global__ void initialize_search(SearchStorage* storage, int node_limit) {
  if (blockIdx.x != 0 || threadIdx.x != 0) {
    return;
  }

  storage->status = kSearchOk;
  storage->node_limit = node_limit;
  storage->next_simulation = 0;
  storage->completed_simulations = 0;
  storage->node_count = 0;
  storage->scheduler_claims = 0;
  storage->transposition_hits = 0;
  storage->cycle_cutoffs = 0;
  storage->depth_cutoffs = 0;
  storage->capacity_failures = 0;
  storage->diagnostic_edge = kEmpty;
  storage->diagnostic_parent_state = kEmpty;
  storage->diagnostic_action = kEmpty;
  storage->diagnostic_expected_child = kEmpty;
  storage->diagnostic_observed_child = kEmpty;

  for (int slot = 0; slot < kHashCapacity; ++slot) {
    storage->hash_keys[slot] = kEmpty;
    storage->hash_nodes[slot] = kPending;
  }
  for (int node = 0; node < kMaxNodes; ++node) {
    storage->node_state[node] = kEmpty;
    storage->node_expansion[node] = 0;
    storage->node_action_count[node] = 0;
    storage->node_visits[node] = 0;
  }
  for (int edge = 0; edge < kMaxEdges; ++edge) {
    storage->edge_action[edge] = kEmpty;
    storage->edge_child[edge] = kEmpty;
    storage->edge_visits[edge] = 0;
    storage->edge_value_sum[edge] = 0.0F;
  }

  const int root = find_or_insert_node(storage, 0);
  if (root != 0) {
    publish_status(storage, kPublicationFailure);
  }
}

__global__ void search_global_ticket(SearchStorage* storage, int simulation_budget) {
  const int root = 0;
  while (load_int(&storage->status) == kSearchOk) {
    atomicAdd(&storage->scheduler_claims, 1);
    const int ticket = atomicAdd(&storage->next_simulation, 1);
    if (ticket >= simulation_budget) {
      return;
    }
    run_simulation(storage, root, ticket);
  }
}

__global__ void search_warp_ticket_batch(SearchStorage* storage, int simulation_budget) {
  const int root = 0;
  const int lane = static_cast<int>(threadIdx.x & (warpSize - 1));
  while (load_int(&storage->status) == kSearchOk) {
    const unsigned active = __activemask();
    const int leader = __ffs(static_cast<int>(active)) - 1;
    const int active_count = __popc(active);
    int first_ticket = 0;
    if (lane == leader) {
      atomicAdd(&storage->scheduler_claims, 1);
      first_ticket = atomicAdd(&storage->next_simulation, active_count);
    }
    first_ticket = __shfl_sync(active, first_ticket, leader);
    const unsigned lower_lanes = lane == 0 ? 0U : ((1U << lane) - 1U);
    const int rank = __popc(active & lower_lanes);
    const int ticket = first_ticket + rank;
    if (ticket >= simulation_budget) {
      return;
    }
    run_simulation(storage, root, ticket);
  }
}

const char* status_name(int status) {
  switch (status) {
    case kSearchOk:
      return "ok";
    case kNodeCapacity:
      return "node-capacity";
    case kHashCapacityExceeded:
      return "hash-capacity";
    case kPublicationFailure:
      return "publication-failure";
    default:
      return "unknown";
  }
}

bool cuda_ok(cudaError_t error, const char* operation) {
  if (error == cudaSuccess) {
    return true;
  }
  std::fprintf(stderr, "CUDA error during %s: %s\n", operation, cudaGetErrorString(error));
  return false;
}

struct CaseOutput {
  bool runtime_ok = false;
  SearchStorage storage{};
  float kernel_ms = 0.0F;
  long long free_memory_delta = 0;
};

const char* scheduler_name(SchedulerKind scheduler) {
  return scheduler == kWarpTicketBatch ? "warp-ticket-batch" : "global-ticket";
}

struct DeviceResources {
  SearchStorage* storage = nullptr;
  cudaEvent_t start = nullptr;
  cudaEvent_t stop = nullptr;

  ~DeviceResources() {
    if (stop != nullptr) {
      cudaEventDestroy(stop);
    }
    if (start != nullptr) {
      cudaEventDestroy(start);
    }
    if (storage != nullptr) {
      cudaFree(storage);
    }
  }
};

CaseOutput run_case(
    const char* name,
    int simulation_budget,
    int blocks,
    int threads,
    int node_limit,
    SchedulerKind scheduler) {
  CaseOutput output;
  DeviceResources resources;
  std::size_t free_before = 0;
  std::size_t total_before = 0;
  std::size_t free_after = 0;
  std::size_t total_after = 0;

  if (!cuda_ok(cudaMemGetInfo(&free_before, &total_before), "querying memory before case") ||
      !cuda_ok(cudaMalloc(reinterpret_cast<void**>(&resources.storage), sizeof(SearchStorage)),
               "allocating search storage") ||
      !cuda_ok(cudaEventCreate(&resources.start), "creating start event") ||
      !cuda_ok(cudaEventCreate(&resources.stop), "creating stop event")) {
    return output;
  }

  initialize_search<<<1, 1>>>(resources.storage, node_limit);
  if (!cuda_ok(cudaGetLastError(), "launching initialization") ||
      !cuda_ok(cudaDeviceSynchronize(), "synchronizing initialization")) {
    return output;
  }

  if (!cuda_ok(cudaEventRecord(resources.start), "recording search start")) {
    return output;
  }
  if (scheduler == kWarpTicketBatch) {
    search_warp_ticket_batch<<<blocks, threads>>>(resources.storage, simulation_budget);
  } else {
    search_global_ticket<<<blocks, threads>>>(resources.storage, simulation_budget);
  }
  if (!cuda_ok(cudaGetLastError(), "launching active search") ||
      !cuda_ok(cudaEventRecord(resources.stop), "recording search stop") ||
      !cuda_ok(cudaEventSynchronize(resources.stop), "synchronizing active search") ||
      !cuda_ok(cudaEventElapsedTime(&output.kernel_ms, resources.start, resources.stop), "reading elapsed time") ||
      !cuda_ok(cudaMemcpy(&output.storage, resources.storage, sizeof(SearchStorage), cudaMemcpyDeviceToHost),
               "copying completed search result")) {
    return output;
  }

  // Release case-owned state before checking the post-case memory observation.
  bool cleanup_ok = cuda_ok(cudaEventDestroy(resources.stop), "destroying stop event");
  resources.stop = nullptr;
  cleanup_ok = cuda_ok(cudaEventDestroy(resources.start), "destroying start event") && cleanup_ok;
  resources.start = nullptr;
  cleanup_ok = cuda_ok(cudaFree(resources.storage), "freeing search storage") && cleanup_ok;
  resources.storage = nullptr;
  if (!cleanup_ok) {
    return output;
  }

  if (!cuda_ok(cudaMemGetInfo(&free_after, &total_after), "querying memory after case")) {
    return output;
  }

  output.free_memory_delta = static_cast<long long>(free_after) - static_cast<long long>(free_before);
  output.runtime_ok = total_before == total_after;

  const double simulations_per_second = output.kernel_ms > 0.0F
      ? static_cast<double>(output.storage.completed_simulations) * 1000.0 / output.kernel_ms
      : 0.0;
  std::printf(
      "case=%s scheduler=%s launches=1 blocks=%d threads=%d budget=%d node_limit=%d status=%s "
      "completed=%d nodes=%d scheduler_claims=%d transposition_hits=%d cycle_cutoffs=%d depth_cutoffs=%d "
      "capacity_failures=%d kernel_ms=%.3f simulations_per_second=%.0f free_memory_delta=%lld\n",
      name,
      scheduler_name(scheduler),
      blocks,
      threads,
      simulation_budget,
      node_limit,
      status_name(output.storage.status),
      output.storage.completed_simulations,
      output.storage.node_count,
      output.storage.scheduler_claims,
      output.storage.transposition_hits,
      output.storage.cycle_cutoffs,
      output.storage.depth_cutoffs,
      output.storage.capacity_failures,
      output.kernel_ms,
      simulations_per_second,
      output.free_memory_delta);

  if (output.storage.diagnostic_edge != kEmpty) {
    std::printf(
        "  first_publication_failure edge=%d parent_state=%d action=%d expected_child=%d "
        "observed_child=%d expected_state=%d observed_state=%d\n",
        output.storage.diagnostic_edge,
        output.storage.diagnostic_parent_state,
        output.storage.diagnostic_action,
        output.storage.diagnostic_expected_child,
        output.storage.diagnostic_observed_child,
        output.storage.diagnostic_expected_child >= 0
            ? output.storage.node_state[output.storage.diagnostic_expected_child]
            : kFailed,
        output.storage.diagnostic_observed_child >= 0
            ? output.storage.node_state[output.storage.diagnostic_observed_child]
            : kFailed);
  }

  return output;
}

int bounded_node_count(const SearchStorage& storage) {
  return std::max(0, std::min({storage.node_count, storage.node_limit, kMaxNodes}));
}

int find_node(const SearchStorage& storage, int state) {
  const int count = bounded_node_count(storage);
  for (int node = 0; node < count; ++node) {
    if (storage.node_state[node] == state) {
      return node;
    }
  }
  return kFailed;
}

int count_nodes(const SearchStorage& storage, int state) {
  int matches = 0;
  const int count = bounded_node_count(storage);
  for (int node = 0; node < count; ++node) {
    matches += storage.node_state[node] == state ? 1 : 0;
  }
  return matches;
}

bool best_root_action_is(const SearchStorage& storage, int expected_action, bool report) {
  const int root = find_node(storage, 0);
  if (root < 0 || storage.node_action_count[root] != 2) {
    if (report) {
      std::printf("  failure: root/action layout was not published\n");
    }
    return false;
  }

  int best_action = kFailed;
  float best_mean = -1.0e30F;
  for (int slot = 0; slot < 2; ++slot) {
    const int edge = edge_index(root, slot);
    const int visits = storage.edge_visits[edge];
    const float mean = visits > 0 ? storage.edge_value_sum[edge] / static_cast<float>(visits) : -1.0e30F;
    if (report) {
      std::printf(
          "  root action=%d visits=%d mean=%.6f child_state=%d\n",
          storage.edge_action[edge],
          visits,
          mean,
          storage.edge_child[edge] >= 0 ? storage.node_state[storage.edge_child[edge]] : kFailed);
    }
    if (mean > best_mean) {
      best_mean = mean;
      best_action = storage.edge_action[edge];
    }
  }

  if (report && best_action != expected_action) {
    std::printf("  failure: best root action was %d, expected %d\n", best_action, expected_action);
  }
  return best_action == expected_action;
}

bool ordinary_invariants(const SearchStorage& storage, int simulation_budget) {
  const int root = find_node(storage, 0);
  if (storage.status != kSearchOk || storage.completed_simulations != simulation_budget ||
      storage.node_count != 7 || root < 0 || storage.scheduler_claims <= 0 ||
      storage.depth_cutoffs != 0 || storage.capacity_failures != 0 ||
      storage.diagnostic_edge != kEmpty) {
    return false;
  }

  for (int state = 0; state <= 6; ++state) {
    if (count_nodes(storage, state) != 1) {
      return false;
    }
    const int node = find_node(storage, state);
    const bool terminal = state == 3 || state == 4 || state == 6;
    if (terminal) {
      if (storage.node_expansion[node] != 0 || storage.node_action_count[node] != 0) {
        return false;
      }
    } else if (storage.node_expansion[node] != 2 || storage.node_action_count[node] != 2 ||
               storage.edge_action[edge_index(node, 0)] != 0 ||
               storage.edge_action[edge_index(node, 1)] != 1) {
      return false;
    }
  }

  const int root_visits =
      storage.edge_visits[edge_index(root, 0)] + storage.edge_visits[edge_index(root, 1)];
  return root_visits == simulation_budget &&
      storage.node_visits[root] == simulation_budget &&
      storage.transposition_hits > 0 && storage.cycle_cutoffs > 0;
}

bool validate_transposition_ownership(const CaseOutput& output) {
  const SearchStorage& storage = output.storage;
  const int state_1 = find_node(storage, 1);
  const int state_2 = find_node(storage, 2);
  const int state_4 = find_node(storage, 4);
  const int from_state_1 = state_1 >= 0 ? edge_index(state_1, 1) : kFailed;
  const int from_state_2 = state_2 >= 0 ? edge_index(state_2, 0) : kFailed;
  const bool passed = output.runtime_ok && count_nodes(storage, 4) == 1 &&
      state_4 >= 0 && from_state_1 >= 0 && from_state_2 >= 0 &&
      from_state_1 != from_state_2 &&
      storage.edge_child[from_state_1] == state_4 &&
      storage.edge_child[from_state_2] == state_4 &&
      storage.edge_visits[from_state_1] > 0 && storage.edge_visits[from_state_2] > 0;
  std::printf("test=transposition-node-edge-ownership result=%s\n", passed ? "pass" : "fail");
  return passed;
}

bool validate_path_cycle(const CaseOutput& output) {
  const SearchStorage& storage = output.storage;
  const int state_2 = find_node(storage, 2);
  const int state_5 = find_node(storage, 5);
  const int cycle_edge = state_5 >= 0 ? edge_index(state_5, 1) : kFailed;
  const bool passed = output.runtime_ok && state_2 >= 0 && cycle_edge >= 0 &&
      storage.edge_action[cycle_edge] == 1 && storage.edge_child[cycle_edge] == state_2 &&
      storage.cycle_cutoffs > 0 && count_nodes(storage, 2) == 1;
  std::printf("test=path-local-cycle-after-identity result=%s\n", passed ? "pass" : "fail");
  return passed;
}

bool partial_graph_is_bounded(const SearchStorage& storage, int node_limit) {
  if (storage.node_count != node_limit || node_limit < 0 || node_limit > kMaxNodes) {
    return false;
  }
  for (int slot = 0; slot < kHashCapacity; ++slot) {
    const int node = storage.hash_nodes[slot];
    if (node != kPending && node != kFailed && (node < 0 || node >= node_limit)) {
      return false;
    }
  }
  for (int edge = 0; edge < kMaxEdges; ++edge) {
    const int child = storage.edge_child[edge];
    if (child != kEmpty && (child < 0 || child >= node_limit)) {
      return false;
    }
  }
  return true;
}

bool validate_normal_case(const char* name, const CaseOutput& output, int simulation_budget) {
  bool passed = output.runtime_ok && ordinary_invariants(output.storage, simulation_budget);
  passed = best_root_action_is(output.storage, 0, true) && passed;
  std::printf("test=%s result=%s\n", name, passed ? "pass" : "fail");
  return passed;
}

bool validate_capacity_case(const CaseOutput& output, int simulation_budget, int node_limit) {
  const SearchStorage& storage = output.storage;
  const bool passed = output.runtime_ok &&
      storage.status == kNodeCapacity &&
      storage.capacity_failures > 0 &&
      storage.completed_simulations < simulation_budget &&
      partial_graph_is_bounded(storage, node_limit);
  std::printf("test=node-capacity result=%s\n", passed ? "pass" : "fail");
  return passed;
}

bool validate_scheduler_comparison(
    const CaseOutput& global_ticket,
    const CaseOutput& warp_ticket,
    int simulation_budget) {
  const bool passed = global_ticket.runtime_ok && warp_ticket.runtime_ok &&
      ordinary_invariants(global_ticket.storage, simulation_budget) &&
      ordinary_invariants(warp_ticket.storage, simulation_budget) &&
      warp_ticket.storage.scheduler_claims < global_ticket.storage.scheduler_claims;
  std::printf(
      "test=scheduler-ticket-claim-mechanism result=%s global_claims=%d warp_claims=%d\n",
      passed ? "pass" : "fail",
      global_ticket.storage.scheduler_claims,
      warp_ticket.storage.scheduler_claims);
  return passed;
}

}  // namespace

int main(int argc, char** argv) {
  bool sanitizer_workload = false;
  if (argc == 2 && std::strcmp(argv[1], "--sanitizer-workload") == 0) {
    sanitizer_workload = true;
  } else if (argc != 1) {
    std::fprintf(stderr, "usage: cuda_device_mcgs [--sanitizer-workload]\n");
    return 2;
  }

  int device = 0;
  cudaDeviceProp properties{};
  int runtime_version = 0;
  int driver_version = 0;

  if (!cuda_ok(cudaSetDevice(device), "selecting device") ||
      !cuda_ok(cudaGetDeviceProperties(&properties, device), "querying device") ||
      !cuda_ok(cudaRuntimeGetVersion(&runtime_version), "querying CUDA Runtime version") ||
      !cuda_ok(cudaDriverGetVersion(&driver_version), "querying CUDA Driver version")) {
    return 2;
  }

  std::printf(
      "prototype=%s built=%sT%s device=\"%s\" compute_capability=%d.%d runtime=%d driver=%d "
      "storage_bytes=%zu max_nodes=%d max_edges=%d hash_capacity=%d max_depth=%d\n",
      kPrototypeId,
      __DATE__,
      __TIME__,
      properties.name,
      properties.major,
      properties.minor,
      runtime_version,
      driver_version,
      sizeof(SearchStorage),
      kMaxNodes,
      kMaxEdges,
      kHashCapacity,
      kMaxDepth);

  const int normal_budget = sanitizer_workload ? 4096 : 200000;
  const int capacity_budget = sanitizer_workload ? 1024 : 10000;

  const CaseOutput serial =
      run_case("serial-baseline", normal_budget, 1, 1, kMaxNodes, kGlobalTicket);
  const CaseOutput parallel =
      run_case("parallel-contention", normal_budget, 8, 128, kMaxNodes, kGlobalTicket);
  const CaseOutput warp_ticket =
      run_case("warp-ticket-contention", normal_budget, 8, 128, kMaxNodes, kWarpTicketBatch);
  const CaseOutput capacity =
      run_case("node-capacity", capacity_budget, 2, 128, 3, kGlobalTicket);

  int passed = 0;
  passed += validate_normal_case("serial-baseline", serial, normal_budget) ? 1 : 0;
  passed += validate_normal_case("parallel-contention", parallel, normal_budget) ? 1 : 0;
  passed += validate_normal_case("warp-ticket-contention", warp_ticket, normal_budget) ? 1 : 0;
  passed += validate_transposition_ownership(parallel) ? 1 : 0;
  passed += validate_path_cycle(parallel) ? 1 : 0;
  passed += validate_capacity_case(capacity, capacity_budget, 3) ? 1 : 0;
  passed += validate_scheduler_comparison(parallel, warp_ticket, normal_budget) ? 1 : 0;

  const bool sensitivity = serial.runtime_ok && !best_root_action_is(serial.storage, 1, false);
  std::printf("test=oracle-sensitivity result=%s\n", sensitivity ? "pass" : "fail");
  passed += sensitivity ? 1 : 0;

  constexpr int kExpected = 8;
  const int failed = kExpected - passed;
  std::printf(
      "capsule=cuda-device-mcgs expected=%d discovered=%d executed=%d passed=%d failed=%d "
      "required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=0\n",
      kExpected,
      kExpected,
      kExpected,
      passed,
      failed);

  const bool reset_ok = cuda_ok(cudaDeviceReset(), "resetting CUDA device context");
  return failed == 0 && reset_ok ? 0 : 1;
}
