# CUDA-MCGS Stage-Resident Extension Assessment

**Status:** Research Note

**Disposition:** Second-pass assessment; non-normative

**Inspected:** 2026-08-11

**Exact CUDA-MCGS subject:** `69625c921f62e1f08c28543c1e29cece1d2c94f4` on `codex/ptx-granularity-exploration`

**Exact CUDA-JS peer:** `ad49a6c9b0cddb420e26e097180cf9c502060a65`

## Question

Can CUDA-MCGS expose a broad, universal optimization surface while keeping active search entirely GPU-resident, avoiding incomplete mid-operation mutation, avoiding cross-stage blocking, and limiting PTX composition overhead?

## Owner requirements assessed

- A search stage represents one stable operational search state. A change in operational search state changes the stage.
- Do not confuse operational search state with the searched domain state or graph node.
- An extension surface belongs to one stage and never crosses a stage boundary.
- A stage may expose a stable entry checkpoint, exit checkpoint, or both when its contract calls for them.
- No extension surface exists inside the stage's incomplete mutation interval.
- Multiple capabilities required at one stage share one surface and one composed PTX input; they do not become multiple runtime extensions.
- Cross-stage and cross-surface dataflow is allowed. Cross-stage and cross-surface blocking is forbidden.
- A stage may start bounded work whose result is published for a later stage, provided the producer does not expose incomplete stage-owned mutation and no GPU worker waits synchronously for the result.

## Initial assessment

The model is internally coherent if a stage is a semantic state transition for one logical search work item, not a global phase. The important separation is:

```text
domain/search graph state
        !=
operational stage state of one logical work item
        !=
physical CUDA kernel, module, grid, or graph node
```

The previous proposal allowed many semantic Extension Points and separately bound Extension Fragments. The PTX discovery showed that this can execute, but tiny separately callable functions retained calls and inflated code/register cost. The owner-defined stage model removes the need to optimize that flawed granularity: optional behavior is composed once at a stable stage boundary.

## External observations

Statement types are separated below. No external implementation was copied.

| Source | Verified source observation or author claim | CUDA-MCGS inference |
|---|---|---|
| [NVIDIA nvJitLink 13.3](https://docs.nvidia.com/cuda/nvjitlink/index.html) | nvJitLink accepts PTX, relocatable PTX and other device-code inputs and emits a linked cubin loadable by the Driver API. | A Search Image may link several stage-owned PTX inputs before ignition. One semantic Stage PTX need not mean one separately loaded module. |
| [NVIDIA NVCC separate compilation](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html) | Separate device compilation preserves relocatable code for a later device-link step. | PTX composition is supported, but separate compilation does not establish inlining or a free call boundary; final-binary evidence remains required. |
| [CUDA Graph conditional execution](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/cuda-graphs.html) | Conditional-node bodies restrict node kinds, and kernels in such bodies may not use CUDA Dynamic Parallelism or Device Graph Launch. Device graphs have their own restrictions. | CUDA Graphs are a candidate scheduler profile, not a universal semantic substrate. Stage contracts must not require nested graph execution. |
| [CUDA C++ memory model](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cuda-cpp-memory-model.html) | CUDA extends atomics with thread scopes; release/acquire synchronization is valid only when participating operations use compatible scopes. | Every stage/channel publication must name ordering and scope. A readiness flag without a matching publication contract is insufficient. |
| [Atos](https://arxiv.org/abs/2112.00132) | The paper's task-parallel GPU model uses workers consuming and producing queued tasks without global synchronization and evaluates persistent and discrete realizations. | Operational stages should be per-task states over bounded queues, not bulk-synchronous global phases. Persistent execution is one candidate mechanism, not the contract. |
| [Groute](https://www.research-collection.ethz.ch/entities/publication/cd5f374f-ba94-4afb-8ba8-2a2762de6ffe) | The authors present asynchronous graph processing over distributed work lists for irregular workloads. | Asynchronous producer/consumer dataflow is a credible pattern. Its multi-GPU mechanisms are not adopted and multi-GPU remains later scope. |
| [Gunrock](https://escholarship.org/uc/item/9gj6r1dj) | Gunrock is a data-centric GPU graph framework organized around frontier operations and bulk-synchronous composition. | Frontier/BSP execution is useful prior art and a scheduler comparison, but CUDA-MCGS stages must not imply global frontiers or barriers. |
| [Monte-Carlo Graph Search for AlphaZero](https://arxiv.org/abs/2012.11045) | The paper changes tree search into graph search with transpositions and modified forward/backpropagation behavior. | A fixed tree-shaped stage catalogue is not universal. Stage contracts must preserve explicit graph, edge, path, transposition and backup ownership. |
| [Continuous Monte Carlo Graph Search](https://arxiv.org/abs/2210.01426) | The paper applies graph search to continuous state/action control with state clustering and stochastic action bandits. | Stage IDs and contexts must not encode fixed discrete actions, board games, scalar zero-sum values, or one AlphaZero pipeline. |

## Prototype evidence reinterpreted

The retained experiment remains bounded Windows discovery evidence:

- portable capsule: 42/42, zero skips;
- native capsule: 25/25, zero skips;
- no-point and unbound artifacts were byte-identical with no extension symbol or call;
- two tiny PTX fragments retained two SASS calls and used 7,016 bytes/31 registers versus 4,520 bytes/17 registers for fused source;
- one coarse PTX call approached the inline control only after enough synthetic work to amortize the boundary;
- same-input PTX functions did not recover inlining on the exact profile.

This evidence rejects one PTX call per tiny hook. It does not reject one optional composed PTX unit per stage. The latter is closer to the measured coarse case and has a much smaller call surface, but still requires representative profiling before production acceptance.

## Second-pass adversarial assessment

### Strongest overengineering challenge

A programmable stage graph, capability schemas, asynchronous channels and a composer could become a general workflow engine whose machinery exceeds actual MCGS needs.

**Disposition:** constrain the model to a finite pre-ignition stage graph, stable entry/exit checkpoints, bounded typed channels, and capabilities demanded by real contracts. There is no runtime registry, mid-stage hook discovery, arbitrary coroutine system, or unbounded dynamic stage creation.

### Strongest underengineering challenge

Entry/exit-only extension cannot express an optimization that must observe or mutate a partially completed operation.

**Disposition:** this is a deliberate rejection. If behavior must participate inside an invariant-forming operation, it belongs in that stage's mandatory implementation. If it creates a new stable observable state, it becomes a new stage. Exposing incomplete mutation would make composition order, recovery and cross-capability correctness undefined.

### Required-result challenge

Some later stage may require a result produced asynchronously by an evaluator or secondary task. Calling that nonblocking can hide a logical dependency.

**Disposition:** logical dependency is allowed; synchronous worker blocking is not. The consumer moves to an explicit pending state. The scheduler executes other ready work, including the producer. A result is consumed only after versioned release/acquire publication. No runnable producer, capacity deadlock, expiry or cancellation produces a typed outcome rather than indefinite waiting.

### Stage-boundary challenge

Treating each stage change as a kernel boundary or grid barrier would recreate blocking and small-frontier overhead.

**Disposition:** a stage transition is semantic and per logical work item. A conforming scheduler may realize several stages in one persistent kernel, separate kernels, a device-owned graph, or another profile. Physical topology remains experiment-selected.

### Universality challenge

A fixed list such as selection/expansion/evaluation/backup could silently make AlphaZero-style MCGS the universal contract.

**Disposition:** Search IR defines a finite stage graph from domain, policy, evaluator and execution contracts. Standard semantic roles may be reusable templates, but stage identity and legal transitions are not a fixed game-shaped pipeline.

## Settled proposal

1. A **Search Stage** owns one semantic operational state and one complete state transition for a logical work item. Semantic category and owned invariant define the boundary; usefulness validates its granularity and selects among semantically valid placements.
2. A **Stage Extension Surface** is stage-owned and may expose `entry`, `exit`, both, or neither. No mid-stage checkpoint exists.
3. A non-empty stage capability set is composed before ignition into exactly one optional **Stage PTX** input for that stage. An empty set emits no extension PTX, context, call, state or synchronization residue.
4. Multiple capabilities share the stage surface, generated context, resource plan and Stage PTX. They are not separately called runtime fragments.
5. Stage PTX is an artifact/composition unit, not a kernel, module, launch or scheduler requirement. All stage inputs may be linked into one Search Image.
6. Cross-stage/cross-surface dataflow uses bounded **Async Stage Channels** with explicit ownership, generation, readiness, freshness, publication scope, pressure, cancellation, expiry and reclamation.
7. A consuming task may be logically pending, but no GPU worker may spin, wait, or hold stage-owned mutable resources while awaiting a later result.
8. Required mid-stage access means the capability belongs in the stage core; a newly stable invariant means a new stage.

## Can versus should

**Can:** use a global phase per stage, nest CUDA Graphs, keep one callable PTX fragment per feature, poll a readiness flag, expose arbitrary mutable context, or hand-write PTX.

**Should:** derive per-item stages from natural semantic categories, use usefulness as a granularity check, keep scheduling mechanism-neutral, compose one stage-owned PTX input only when demanded, publish versioned bounded data, reschedule pending consumers, expose least-authority stable checkpoint contexts, and generate PTX from owned schemas/contracts.

## Direction and blockers

The stage/surface/channel direction survives research and adversarial assessment. The changes are to the previous plan, not to the owner-defined direction:

- retire the fine Extension Point/Fragment runtime composition path;
- do not equate a stage with a global phase, barrier, kernel or CUDA Graph node;
- do not select CUDA Graphs as the universal scheduler;
- represent asynchronous work as scheduler-owned queued work and publication, not necessarily a nested device launch;
- defer production implementation until the proposal specifications and dependent domain/policy/evaluator/storage contracts are accepted.

CUDA-JS relocatable-device-code support remains a real peer dependency for source-authored modular PTX, tracked in CUDA-JS issue 35 and intentionally untouched while its compiler/LTO work is active. Native Linux CUDA composition, launch, cleanup and performance remain unqualified.

## Revisit triggers

- representative stage-level PTX evidence shows the boundary cannot be amortized;
- a required optimization cannot be expressed without violating the stable-checkpoint rule and cannot coherently own a stage;
- scheduler experiments show the finite stage graph prevents device-closed progress;
- CUDA Graph, dynamic-launch or toolchain capability changes remove or add material restrictions;
- a second non-game domain exposes a hidden fixed pipeline, action, value or evaluator assumption.
