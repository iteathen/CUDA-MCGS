# CUDA Device-Resident MCGS Prototype Results

**Evidence date:** 2026-08-11

**Claim:** Bounded experiment result, not production conformance, scheduler selection, or a representative benchmark

## Outcome

The strengthened prototype completed selection, expansion, identity lookup, transposition reuse, path-local cycle cutoff, resident evaluation, backup, finite-capacity stopping, and result publication inside one active-search CUDA launch.

The final ordinary capsule passed 8/8 cases. Five additional unchanged full-workload trials also passed 8/8. The new warp-ticket mechanism reduced global simulation-ticket claims, but it did not produce a stable timing improvement over the global-ticket baseline on this toy graph. That is useful negative scheduler evidence: ticket admission is not proven to be the limiting mechanism, and no production scheduler is selected.

## Exact evidence identity

- Repository base HEAD: `ffe218d58d14de3873e18945fb6fe0866d113421`; unrelated pre-existing working-tree changes remained protected.
- Prototype source SHA-256: `9D1F9F9C196531DDA241966761657760D96D9E3800B82EDEA617E1CB4E84EDA3`.
- CMake input SHA-256: `3D9C6C95D4F722992ED0D22C90802B82A67109F451FDA47F73367756B421C55D`.
- Executed Release binary SHA-256: `FE106092751A4E53C472B8B28E2833C1896C0FA220578B7CB0A6FB89429C1443`.
- Device: NVIDIA GeForce GTX 1660 Ti, compute capability 7.5, 6144 MiB.
- NVIDIA Driver API and CUDA Runtime versions reported by the binary: `13030` and `13030`.
- CUDA compiler: NVIDIA CUDA 13.3, `nvcc` 13.3.33.
- Host compiler: MSVC 19.50.35730.0.
- Build: CMake Visual Studio 18 2026 generator, Release, `CMAKE_CUDA_ARCHITECTURES=75`.
- Compiled search storage: 1084 bytes; 16 nodes, 32 parent edges, 32 identity slots, path depth 16.

The source and binary identities above supersede the predecessor source `8F2717A0F87CE4B145121C673EA46AC68F5CA2C810B17FC7CF8AFA034136E871` and binary `B507B78E1C2396767106CA6C12F9EFE41049220C9255D85186615C9CCE876FD0`. The predecessor remains relevant only to the defect provenance recorded below and in GitHub issue #24.

## Final ordinary capsule

Command:

```powershell
./experiments/cuda-device-mcgs-prototype/build/Release/cuda_device_mcgs.exe
```

Representative result:

```text
case=serial-baseline scheduler=global-ticket budget=200000 status=ok
  completed=200000 nodes=7 scheduler_claims=200001
  transposition_hits=399996 cycle_cutoffs=3 capacity_failures=0

case=parallel-contention scheduler=global-ticket budget=200000 status=ok
  completed=200000 nodes=7 scheduler_claims=201024
  transposition_hits=400225 cycle_cutoffs=164 capacity_failures=0

case=warp-ticket-contention scheduler=warp-ticket-batch budget=200000 status=ok
  completed=200000 nodes=7 scheduler_claims=7370
  transposition_hits=400222 cycle_cutoffs=119 capacity_failures=0

case=node-capacity scheduler=global-ticket budget=10000 node_limit=3
  status=node-capacity completed=258 nodes=3 scheduler_claims=258
  capacity_failures=3

test=serial-baseline result=pass
test=parallel-contention result=pass
test=warp-ticket-contention result=pass
test=transposition-node-edge-ownership result=pass
test=path-local-cycle-after-identity result=pass
test=node-capacity result=pass
test=scheduler-ticket-claim-mechanism result=pass
test=oracle-sensitivity result=pass
capsule=cuda-device-mcgs expected=8 discovered=8 executed=8 passed=8 failed=0
  required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=0
```

All ordinary cases reported `free_memory_delta=0`, and the process ended with a successful `cudaDeviceReset`. These observations support only the task-owned allocation/event lifecycle in this executable.

## Invariant coverage

The capsule now reports independent cases for:

- serial completion and root accounting conservation;
- parallel publication/layout validity without trajectory-specific counts;
- warp-ticket semantic parity;
- one shared transposition node with two distinct incoming edge-statistic owners;
- identity resolution before path-local cycle cutoff;
- typed node-capacity exhaustion, exact bounded count, and bounded graph references;
- fewer global ticket claims from warp batching without treating timing as an oracle;
- rejection of an intentionally wrong best-root-action expectation.

Exact visit distribution, transposition-hit count, cycle count, and timing remain schedule-sensitive and are not parallel correctness requirements.

## Bounded nondeterministic repetition

Five additional unchanged full-workload trials were run because publication under a nondeterministic schedule is the subject of the evidence. All five passed 8/8 with no publication diagnostic.

Across those trials:

- global-ticket claims were 201,024 in every parallel run;
- warp-ticket claims ranged from 7,298 to 7,830;
- global parallel cycle cutoffs ranged from 66 to 160;
- warp-ticket cycle cutoffs ranged from 112 to 192;
- global and warp timings overlapped and neither mechanism established a stable performance win.

This repetition supports bounded schedule variation only. It is not statistical scheduler qualification.

## Defect provenance and contract consequences

### Expansion publication

The predecessor parallel kernel intermittently observed an expansion state as published while reading stale `edge_action=-1`, then attempted a conflicting child publication:

```text
edge=4 parent_state=2 action=-1
expected_child=4 expected_state=5
observed_child=3 observed_state=4
```

Device-scope release/acquire publication for node identity/initialization and expansion eliminated the observed failure in the bounded trials. The durable consequence is now owned by [`../../docs/specs/SPEC-0001-device-search-publication-and-resources.md`](../../docs/specs/SPEC-0001-device-search-publication-and-resources.md): readiness is a semantic producer/consumer edge, not an integer convention or a side effect of allocation.

### Capacity accounting

The predecessor used an `atomicAdd` cursor that safely prevented out-of-bounds writes but reported six nodes for a three-node limit because failed claims inflated the count. A bounded CAS reservation now keeps `node_count == node_limit`, while `capacity_failures` counts rejected admission separately.

The accepted contract separates capacity, claimed/published/retired live units, failed reservations, and high-water meaning.

### Scheduler comparison

The global baseline claims one simulation ticket per worker iteration. The alternative lets one active warp leader claim a batch and distributes tickets with a warp shuffle. It changes only ticket admission; every lane still owns one simulation path, and all graph/policy atomics remain.

The mechanism reduced ticket claims by roughly an order of magnitude but did not improve timing reliably. Plausible explanations include root/edge atomics, path-local work, tiny hot data, launch shape, and measurement noise. A production comparison still needs representative evaluator batching, memory/resource profiles, profiler evidence, search-quality equivalence, and alternative path ownership—not more interpretation of this toy timing.

## Sanitizer result and limits

The exact final binary accepts `--sanitizer-workload`, reducing ordinary simulation budgets to 4,096 and the capacity budget to 1,024 while preserving all eight case identities. A direct reduced run passed 8/8.

An exact-final-binary Compute Sanitizer `memcheck` attempt using that workload produced no result after approximately 90 seconds and was terminated under the bounded test plan. It is incomplete evidence. It does not support a clean memcheck or race claim, and it was not retried unchanged.

Compute Sanitizer `racecheck` is not treated as proof for this global-memory publication protocol. No formal CUDA memory-model proof or exhaustive schedule exploration was performed.

## Remaining gaps

Not implemented or established by this experiment:

- concrete Search IR schema and lowering validation for SPEC-0001;
- deterministic independent host/Search-IR differential oracle;
- separation of in-flight reservations from completed visit exposure; the prototype intentionally reuses `edge_visits` during selection, which does not satisfy SPEC-0001 GRAPH-007 as production semantics;
- production graph, transposition, resource, evaluator, scheduler, output, cancellation, reclamation, reroot, or device-loss components;
- hash-table, edge/state/action/path/queue/evaluator/output capacity capsules beyond the node-capacity example;
- stochastic/chance nodes, variable actions/state, history dependence, progressive widening, multiple value perspectives, or resident model execution;
- representative occupancy, local-memory, contention, profiler, cross-GPU, search-quality, or performance evidence;
- CUDA-MCGS-to-CUDA-JS public adapter and exact compatible-pair evidence.

## Disposition

- Retain `README.md`, `RESULTS.md`, `CMakeLists.txt`, and `src/main.cu` as bounded decision evidence and a reproducer until Search IR/reference conformance owns equivalent cases.
- Keep the experiment non-authoritative and prohibit production imports or source promotion.
- The ignored `build/` directory was removed after final validation; the source, command, environment, and executed binary hash are recorded above.
- Revisit or archive the experiment when its remaining test intents move into accepted conformance or become irrelevant.
