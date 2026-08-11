# Prior-Art Landscape: Universal GPU-Resident MCGS

**Status:** Research Note

**Inspected:** 2026-08-10; composition/runtime evidence expanded 2026-08-11

## Question

Has an existing public project already implemented the framework CUDA-MCGS intends to build, or implemented a lower-level composition/search mechanism well enough that CUDA-MCGS should reuse its code or methodology rather than invent a new mechanism?

## Target criteria

A candidate framework foundation is assessed for the combined presence of:

1. graph/transposition semantics and explicit cycle/history behavior;
2. complete device closure after search ignition;
3. resident evaluator/model execution in the same workflow;
4. domain-, objective-, action-, value-, and output-neutral contracts;
5. fixed, lazy, sampled, or continuous action support;
6. explicit finite GPU-memory planning and exhaustion behavior;
7. specialization that removes unused hot-path cost;
8. persistence/rerooting and device-maintained results where selected;
9. schema/contract-backed extensibility without generic hot-path dispatch;
10. public implementation suitable for inspection, maintenance, and licensing.

Lower-level candidates are assessed separately for whether they provide proven compiler/linker, scheduling, synchronization, collection, or extension-composition methodology that CUDA-MCGS can reuse without adopting the whole framework.

## Conclusion

**No reviewed project is adequate as the CUDA-MCGS foundation.** Existing MCGS/MCTS frameworks each miss material parts of the combined boundary.

The 2026-08-11 expansion does, however, narrow the invention surface. NVIDIA already demonstrates important lower-level mechanisms that closely match the desired realization:

- cuVS uses planner-selected JIT-LTO fragments to avoid precompiling a combinatorial kernel matrix;
- cuFFT LTO callbacks bind typed user device routines to defined execution points before plan finalization and fold them into LTO kernels;
- nvJitLink supplies supported runtime device linking/LTO machinery;
- CUDA Graphs provide device-launch and conditional execution mechanisms that can participate in device-owned progression;
- cuCollections provides serious GPU concurrent hash-collection baselines;
- CCCL/libcu++/CUB provides CUDA-native low-level algorithms, atomics, and collectives.

The resulting design direction is **not** to depend on cuVS/cuFFT/cuCollections/RAPIDS as the CUDA-MCGS runtime. It is to reuse proven methodology and CUDA-platform primitives while owning the search-semantic contracts, Search Composer, extension model, graph/transposition semantics, memory planning, scheduler policy, and generated search image.

This is a bounded conclusion about the reviewed sources, not proof that no private or obscure implementation exists.

## Search-framework candidates

| Candidate | What it does well | Foundational gaps against CUDA-MCGS | Disposition |
|---|---|---|---|
| **Mctx** (`google-deepmind/mctx`, `b53073f`) | Mature Apache-2.0 JAX-native, JIT-compiled, batch-oriented AlphaZero/MuZero/Gumbel MuZero search with replaceable selection/recurrent functions | Dense fixed `[batch,nodes,actions]` tree storage, one parent per node, fixed discrete action width, simulation-count-sized allocation, no transposition/cycle contract, no CUDA-MCGS memory-pressure/reclamation model, no native schema-specialized CUDA runtime | Reference and differential/conformance benchmark; do not fork core |
| **MCTS-NC** (`pklesk/mcts_numba_cuda`, `533b0c2`) | CUDA-parallel selection, expansion, playout, backup; multiple parallelization levels; explicit device-memory sizing; useful reduction patterns | Game/board-shaped interface, fixed maxima, multiple trees/random playout model, no resident learned-evaluator contract, no transposition graph, host-controlled phase progression/transfers, licensing concern for software reuse | Kernel/memory benchmark reference; no code reuse without explicit decision |
| **CrazyAra / AlphaZero MCGS** (`QueensGambit/CrazyAra`, `bb3b5b6`) | Real MCGS/transposition semantics, terminal solving, policy/value guidance, mature chess/crazyhouse behavior | CPU search threads/locks/barriers/inference queue, GPU inference backend rather than all-device search, game-specific data model, GPL-3.0 | Primary graph-semantics and playing-strength reference; no default code reuse |
| **LightZero** (`opendilab/LightZero`, `78cd91a`) | Broad MCTS+RL algorithm taxonomy, model/policy/MCTS modularity, benchmark mindset | Heterogeneous host orchestration, RL-centric abstractions, tree implementations rather than universal GPU-resident graph runtime, no finite schema-generated engine model | Algorithm taxonomy and benchmark reference |
| **OpenSpiel** (`google-deepmind/open_spiel`, `112b777`) | Broad game contracts: chance, simultaneous actions, imperfect information, general-sum/cooperative settings | Games rather than arbitrary graph search; CPU-oriented; not a device-resident MCGS runtime | Domain-capability taxonomy and conformance corpus |
| **Pgx** (`sotetsuk/pgx`, `87278d2`) | JIT-able vectorized accelerator environments across many games | Environment simulator rather than graph search; no persistent graph storage, memory planner, or universal MCGS policy/runtime | Accelerator-domain adapter/conformance reference |
| **POMCGraphSearch.jl** (`ori-goals/POMCGraphSearch.jl`, `e4e3813`) | Monte Carlo graph search for POMDPs, continuous/discrete domains, belief merging, progressive widening | CPU Julia offline planner, POMDP-specific objective/data model, no GPU-resident evaluator/runtime or schema specialization | Graph folding, partial-observability, progressive-widening reference |
| **CuFusion-MCTS paper** (ICCIDS 2026, DOI `10.1109/ICCIDS69108.2026.11407819`) | Describes fused CUDA selection/UCB/Gumbel work and persistent RNG; claims GPU-native utilization/speedups | No public implementation located; available evidence does not establish universal transposition/evaluator/schema/resource/reroot workflow | Track full paper/code; not adoptable foundation |
| **Large-Scale Parallel MCTS on GPU** (IPDPSW 2011) | Historical evidence that MCTS phases/simulations can map to GPUs | Domain implementation, not universal graph/evaluator/resource framework | Literature baseline only |

## Composition and CUDA-mechanism prior art

### NVIDIA cuVS JIT-LTO

Inspected official `NVIDIA/cuvs` source at revision `abfb8b91c9f9bda1e568265b1d01b36250f43a8d` and the JIT-LTO guide. Relevant implementation paths include `cpp/include/cuvs/detail/jit_lto/AlgorithmPlanner.hpp`, `cpp/src/detail/jit_lto/AlgorithmPlanner.cpp`, and algorithm-specific planner files.

The important methodology is that reusable device fragments can be compiled independently, selected by a planner for a concrete configuration, linked with device LTO, and cached as a realized kernel rather than carrying all variant choices through runtime dispatch.

**Use for CUDA-MCGS:** direct methodology/reference for Search Composer planning, fragment identity, LTO composition, cache-key design, and adapter-fragment separation. Do not introduce cuVS/RAFT/RAPIDS as a mandatory active-search dependency.

### cuFFT LTO callbacks

CUDA Toolkit documentation describes typed LTO callbacks associated with defined load/store execution points before a cuFFT plan is finalized. User device code is supplied as LTO IR; planning/linking folds it into LTO kernels so preprocessing/postprocessing can avoid an extra standalone kernel.

**Use for CUDA-MCGS:** strong proof-of-pattern for a typed device Extension Point whose implementation is bound before execution and incorporated into optimized device code. CUDA-MCGS needs broader search semantics, point-specific Context Schemas, permissions, resource contracts, and many possible search points; it does not need to depend on cuFFT.

### nvJitLink and NVRTC

Official CUDA Toolkit 13.3 documentation supports runtime linking of device code including LTO IR and production of linked cubins. CUDA-JS already owns the generic NVRTC/nvJitLink provider, artifact/cache, module-load, and launch boundary, with its F6 compiler/linker evidence and F9 trusted-CCCL prerequisite.

**Use for CUDA-MCGS:** platform/toolchain substrate through CUDA-JS. CUDA-MCGS should own the semantic composition plan and emit complete inputs; CUDA-JS should own generic compilation/linking mechanics.

### CUDA Graphs and device launch/conditional execution

Official CUDA programming documentation separates graph definition, instantiation, and execution and supports device graph launch plus device-evaluated conditional execution in supported profiles.

**Use for CUDA-MCGS:** candidate device-owned scheduler realization. This is evidence against equating "GPU-resident" with "one persistent kernel." Graph structure/instantiation constraints must be measured against irregular search and resident evaluator/secondary work.

### cuCollections

Inspected `NVIDIA/cuCollections` `dev` at revision `1a1e640179e85139765a27d2d376e02628b2ccbc`; source is Apache-2.0. It provides mature concurrent GPU collection/hash-table implementations and device-side APIs.

**Use for CUDA-MCGS:** mandatory benchmark/reference candidate for the transposition-table work before writing an unmeasured custom hash table. Possible dispositions are methodology reuse, selective source adaptation/vendoring, or a CUDA-MCGS-specific implementation if collision verification, publication, generations, reclamation, memory layout, or performance requirements justify it. Do not make it a permanent dependency before TT evidence exists.

### CCCL / libcu++ / CUB

Inspected current `NVIDIA/cccl` source revision `a0c21d1ec5e8602dc85f9ab289006bf1a72e2f96` and the CUDA-JS F9 `cuda-cccl` compiler profile. CUDA-JS F9 has direct accepted evidence for compiling `<cuda/atomic>` through the public compiler/runtime path on its qualified Windows profile.

**Use for CUDA-MCGS:** treat CUDA-native atomics/collectives/low-level algorithms as platform/toolkit substrate where they fit. CUDA-MCGS should not recreate CUDA primitives merely to maximize line ownership; ownership should concentrate on search semantics and search-critical algorithms.

## Ownership versus dependency assessment

The strongest argument for importing higher-level libraries is engineering maturity: mature GPU hash tables, planner/linker patterns, collectives, and scheduling techniques can eliminate years of avoidable work.

The strongest argument against making them runtime dependencies is strategic control. CUDA-MCGS is a performance-critical framework intended to specialize aggressively across future search variants. A required upstream abstraction can constrain layouts, scheduling, compilation, release cadence, debugging, or the ability to repair a correctness/performance defect immediately.

The selected planning principle is therefore:

> **Reuse proven ideas aggressively. Reuse source selectively. Own the critical search execution architecture. Avoid higher-level runtime dependencies in the active-search path unless measured benefit clearly outweighs loss of control.**

Reuse preference:

1. methodology, algorithms, tests, and benchmarks as references;
2. independent implementation of CUDA-MCGS-owned semantics;
3. selective permissively licensed source adaptation after explicit review;
4. vendored/pinned source with local patch/update ownership;
5. external higher-level runtime dependency only after a documented dependency decision.

Any copied/adapted implementation must follow `third_party/README.md`: exact upstream revision, license, local modifications, update process, owning CUDA-MCGS component/tool, and explicit reuse decision.

A realized production Search Image should not need cuVS, cuFFT, cuCollections, RAPIDS, or another search/framework runtime to make progress unless a later accepted dependency decision explicitly changes that baseline.

## Verified observations retained from the original landscape

### Mctx

`mctx/_src/tree.py` defines dense tree arrays such as `children_index`, priors, visits, rewards, discounts, and values with shape `[B, N, num_actions]`. It stores one parent/action-from-parent per node. `mctx/_src/search.py` allocates `num_simulations + 1` nodes and performs simulation/expansion/backward update in a loop. These choices are strong for static JAX trees but foundationally different from variable-degree transposition graphs and finite arena policies.

### MCTS-NC

The source defines board/action/depth/tree maxima and device game-mechanics functions. Its workflow is host-controlled across CUDA stages with synchronization and selected host/device transfers. This is closer to GPU-accelerated phases than to device-closed search progress.

### CrazyAra

`engine/src/searchthread.cpp` contains CPU search traversal, node locks, state cloning/action application, virtual loss, a mutex-protected transposition map, batched inference-plane preparation, barriers, and an inference queue. It validates MCGS graph/solver ideas but not all-device search closure.

### POMCGraphSearch.jl

The implementation targets offline POMDP planning and finite-state-controller output, with belief merging and progressive widening. It broadens CUDA-MCGS conformance requirements but does not provide the CUDA runtime.

## What is reusable

- **Mctx:** functional batch contracts, selection-policy modularity, static-array assertions, differential tests.
- **MCTS-NC:** CUDA phase decomposition, reductions, memory-accounting experiments, baseline workloads.
- **CrazyAra and the MCGS paper:** transposition/node-edge semantics, terminal/solved propagation, strength references.
- **LightZero:** algorithm-family taxonomy and benchmark organization.
- **OpenSpiel/Pgx:** domain capability matrix and deterministic/stochastic conformance environments.
- **POMCGraphSearch:** progressive widening, partial observability, belief/graph folding.
- **CuFusion-MCTS:** fused-kernel and persistent-RNG hypotheses to reproduce if full details/code become available.
- **cuVS:** JIT-LTO fragment planning/composition/cache methodology.
- **cuFFT:** typed pre-plan LTO callback/extension-point methodology.
- **nvJitLink/NVRTC:** supported device-code composition substrate through CUDA-JS.
- **CUDA Graphs:** alternative device-owned execution/scheduling mechanisms to benchmark.
- **cuCollections:** transposition-table baseline and possible permissively licensed source donor.
- **CCCL/libcu++/CUB:** CUDA-native low-level primitives where their contracts fit.

## Why a CUDA-MCGS framework is still warranted

The missing part is not one kernel or linker. It is the combination of:

- universal graph semantics;
- complete device-resident control and evaluator execution;
- bounded resource planning and safe pressure behavior;
- contract/schema/Search-IR-driven specialization;
- a universal semantic Extension Surface without permanent runtime callback cost;
- generated layouts and fragment composition without unused hot-path cost;
- explicit lifecycle, persistence, output, ownership, and conformance contracts.

Replacing these foundations inside any reviewed search framework would rewrite its core. Depending directly on a general GPU library would not supply the missing search semantics. A clean CUDA-MCGS-owned layer can instead use mature CUDA mechanisms and donor implementations at their proper boundaries.

## Required follow-up

1. Convert candidate gaps into conformance requirements and synthetic domains.
2. Run `EXT-LTO-001`: prove extension-fragment composition and baseline/unbound/bound emitted-code behavior through the exact CUDA-JS compiler/link path.
3. Run `EXT-CONTRACT-001`: prove incompatible context schemas, versions, permissions, capabilities, and resources fail before ignition.
4. Run `SCHED-001`: compare persistent-kernel and credible device-owned multi-kernel/graph realizations on representative irregular search plus resident evaluator/secondary work.
5. Run `TT-001`: compare cuCollections against CUDA-MCGS-specific transposition-table requirements and decide methodology/source/vendor/custom disposition.
6. Reproduce representative search baselines on target hardware before architecture depends on performance claims.
7. Record explicit reuse decisions before any third-party source enters production.
8. Revisit ADR-0001 if a candidate demonstrates the full combined CUDA-MCGS boundary.

## Limitations

Repository/paper searches cannot prove nonexistence. Most third-party performance claims have not been independently reproduced on CUDA-MCGS target workloads. NVIDIA mechanisms prove that particular composition/scheduling techniques exist; they do not prove that CUDA-MCGS's proposed Extension Surface has zero overhead, that one scheduler is optimal, or that an external collection meets MCGS transposition semantics. Those claims remain experiment-gated.
