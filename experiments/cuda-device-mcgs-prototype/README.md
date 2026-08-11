# CUDA Device-Resident MCGS Prototype

**Status:** Disposable experiment; no production authority

**Owner:** CUDA-MCGS search-experiment owner

**Repository boundary:** This is standalone CUDA-MCGS work in the historically named `iteathen/UMCGS` repository. It is CUDA C++ and has no Node.js dependency. It is not housed under, owned by, or implemented inside the peer CUDA-JS repository.

## Question

Can one finite, specialized CUDA program perform Monte Carlo Graph Search selection, expansion, transposition reuse, cycle handling, evaluation, backup, stopping, and result publication after a single active-search launch, without a host-produced intermediate search decision?

The secondary questions are what fails first when the same deliberately small mechanism moves from one CUDA thread to contended parallel workers, and whether warp-batched ticket admission changes the scheduling mechanism without changing search semantics.

## Decision and assessment

This is an explicitly authorized P2 information-gathering experiment under the project owner's 2026-08-11 direction. It is permitted by the project phase because it is isolated and disposable. It does not authorize production implementation or amend the proposal specifications.

The selected path is one specialized persistent search kernel over a synthetic graph. A one-thread run supplies a simple mechanism baseline; parallel global-ticket and warp-batched-ticket runs expose publication, scheduling, and atomic-contention behavior; a deliberately undersized node profile checks finite-capacity failure. This is the smallest path that exercises the architectural questions without creating a framework API, compiler, CUDA-JS adapter, evaluator ABI, or production component.

Rejected paths:

- CPU-only search: cannot answer device-closure or CUDA-publication questions.
- Host-phased kernel relaunch: cannot answer the device-owned progress question.
- A serial-only CUDA kernel: hides the concurrency mechanism most likely to reshape the design.
- CUDA Dynamic Parallelism, conditional graphs, or a reusable scheduler abstraction: premature before the baseline identifies a need.
- A universal node layout or callback framework: would turn prototype choices into accidental contracts.

Strongest adversarial limits:

- The synthetic domain and fixed two-action layout are intentionally specialized, so no universal-contract conclusion follows.
- A single hot root and global atomics may make the parallel result look worse than a batched/warp-owned design; that is useful scheduler evidence, not a verdict on GPU MCGS.
- Direct CUDA Runtime use is allowed only inside this experiment. Generic runtime behavior remains owned by CUDA-JS under ADR-0014.
- The prototype has no stochastic transitions, resident neural evaluator, progressive widening, cancellation, reclamation, multi-GPU behavior, or production error recovery.

## Experiment contract

Hard gates:

- active search is one kernel launch and contains no host callback or host-controlled phase transition;
- device allocations and search structures are finite before ignition;
- state-node identity is distinct from parent-edge search statistics;
- a deliberate transposition produces one shared state node;
- a deliberate graph cycle terminates through an explicit path-local cutoff;
- node-capacity exhaustion is reported as data rather than becoming out-of-bounds behavior;
- all task-owned CUDA events and allocations are released, and the CUDA context is reset at process exit.

Success evidence:

1. `serial-baseline`: the fixed graph is fully discovered, root accounting conserves the simulation budget, every ready payload is valid, and root action 0 has the stronger empirical mean.
2. `parallel-contention`: the same invariants hold with multiple resident CUDA workers and one active-search launch.
3. `warp-ticket-contention`: warp-batched ticket admission preserves the same stable semantic invariants.
4. `transposition-node-edge-ownership`: both incoming edges bind to one state-4 node while retaining distinct edge-local statistics.
5. `path-local-cycle-after-identity`: the state-5 back edge binds to the existing state-2 node before path-local cutoff accounting.
6. `node-capacity`: an undersized profile reports the expected capacity status, exact bounded node count, and only bounded references.
7. `scheduler-ticket-claim-mechanism`: warp batching performs fewer global ticket claims while preserving completed-work and graph invariants.
8. `oracle-sensitivity`: the validator rejects the deliberately wrong expected best root action.

The test capsule reports expected, discovered, executed, passed, failed, and skipped counts. Timing is informational; ticket-claim count demonstrates only the admission mechanism. This experiment makes no representative performance or production-scheduler claim.

## Specialized synthetic graph

```text
                 ┌── action 0 ──> state 3, terminal +1.00
root 0 ─> state 1
   │             └── action 1 ──> state 4, terminal +0.25
   │                                      ▲
   └────> state 2 ── action 0 ────────────┘  (transposition)
                 └── action 1 ──> state 5
                                      ├── action 0 ──> state 6, terminal -0.50
                                      └── action 1 ──> state 2 (cycle)
```

All decision nodes maximize the same scalar return. That is an experiment-specific domain contract, not a CUDA-MCGS default.

## Finite resource profile

The compiled profile uses:

- 16 node slots;
- 2 edge slots per node;
- 32 open-addressed identity slots;
- path depth 16;
- structure-of-arrays node/edge columns plus scheduler/diagnostic counters inside one device allocation;
- no active-search allocation, dynamic parallelism, managed memory, or raw-pointer persistence.

The binary prints the exact structure size, device, compute capability, Driver/Runtime versions, launch shape, simulation budget, kernel time, graph counters, and test summary.

The first executed evidence and resulting design lessons are recorded in [`RESULTS.md`](RESULTS.md).

## Build and run

From the repository root on a CUDA-capable machine:

```powershell
cmake -S experiments/cuda-device-mcgs-prototype -B experiments/cuda-device-mcgs-prototype/build -DCMAKE_CUDA_ARCHITECTURES=75
cmake --build experiments/cuda-device-mcgs-prototype/build --config Release
./experiments/cuda-device-mcgs-prototype/build/Release/cuda_device_mcgs.exe
```

The same binary accepts `--sanitizer-workload` to reduce simulation counts without changing compiled code or case structure. This exists only to bound sanitizer attempts; a passing reduced workload would not replace the ordinary capsule.

Choose the architecture appropriate to the target GPU. Compute capability `75` is the frozen first environment, not a framework limit.

## Disposal and promotion

Build output stays under the ignored local `build/` directory and is removed after evidence capture. Source and bounded results may remain temporarily as experiment evidence. The publication, graph, resource, and conformance lessons now have an accepted semantic owner in [`../../docs/specs/SPEC-0001-device-search-publication-and-resources.md`](../../docs/specs/SPEC-0001-device-search-publication-and-resources.md); concrete Search IR lowering and scheduler selection remain pending.

Nothing in this directory may be imported by production code. Promotion means re-deriving the useful invariant or test case in accepted contracts/components; it does not mean moving this implementation into `components/`.

Delete or archive the experiment when all retained lessons have durable owners, or when evidence falsifies the mechanism and no follow-up decision needs the reproducer.
