# Prior-Art Landscape: Universal GPU-Resident MCGS

**Status:** Research Note

**Inspected:** 2026-08-10

## Question

Has an existing public project already implemented the framework UMCGS intends to build, and if so, is it sufficiently complete and well-designed to adopt or fork rather than build a new core?

## Target criteria

A candidate foundation was assessed for the combined presence of:

1. graph/transposition semantics and explicit cycle/history behavior;
2. complete device closure after search ignition;
3. resident evaluator/model execution in the same workflow;
4. domain-, objective-, action-, value-, and output-neutral contracts;
5. fixed, lazy, sampled, or continuous action support;
6. explicit finite GPU-memory planning and exhaustion behavior;
7. specialization that removes unused hot-path cost;
8. persistence/rerooting and device-maintained results where selected;
9. public implementation suitable for inspection, maintenance, and licensing.

No single criterion is enough. A CUDA rollout engine is not automatically a universal MCGS runtime; a generic MCTS API is not automatically device-resident; a graph-search paper is not automatically reusable software.

## Conclusion

**No reviewed project is adequate as the UMCGS foundation.** Several projects solve important parts well and should be used as references, conformance sources, or benchmarks. Forking any reviewed implementation would require replacing its foundational data or execution model, leaving a derivative that retains little of the original core.

This is a bounded conclusion about the sources reviewed, not proof that no private or obscure implementation exists. Revisit it when a candidate publishes materially new architecture or code.

## Candidate assessment

| Candidate | What it does well | Foundational gaps against UMCGS | Disposition |
|---|---|---|---|
| **Mctx** (`google-deepmind/mctx`, `b53073f`) | Mature Apache-2.0 JAX-native, JIT-compiled, batch-oriented AlphaZero/MuZero/Gumbel MuZero search with replaceable selection/recurrent functions | Dense fixed `[batch,nodes,actions]` tree storage, one parent per node, fixed discrete action width, simulation-count-sized allocation, no transposition/cycle contract, no UMCGS memory-pressure/reclamation model, no native schema-specialized CUDA runtime | Reference and differential/conformance benchmark; do not fork core |
| **MCTS-NC** (`pklesk/mcts_numba_cuda`, `533b0c2`) | CUDA-parallel selection, expansion, playout, backup; multiple parallelization levels; explicit device-memory sizing; useful reduction patterns | Game/board-shaped interface, fixed maxima, multiple trees and random playout design, no resident learned evaluator contract, no transposition graph, host-language loop launches/synchronizes phases and moves some data, CC BY 4.0 software licensing concern | Kernel/memory benchmark reference; no code reuse without explicit legal decision |
| **CrazyAra / AlphaZero MCGS** (`QueensGambit/CrazyAra`, `bb3b5b6`) | Real MCGS/transposition semantics, terminal solving, policy/value guidance, mature chess/crazyhouse behavior | CPU C++ search threads, locks/barriers/inference queue, GPU used as inference backend rather than all-device search, game-specific data model, GPL-3.0 | Primary graph-semantics and playing-strength reference; no default code reuse |
| **LightZero** (`opendilab/LightZero`, `78cd91a`) | Broad active MCTS+RL toolkit, many algorithm families, model/policy/MCTS modularity, unified benchmark mindset | Heterogeneous PyTorch/C++ and host-language orchestration, RL-centric abstractions, tree implementations rather than universal GPU-resident graph runtime, no finite schema-generated engine model | Algorithm taxonomy and benchmark organization reference |
| **OpenSpiel** (`google-deepmind/open_spiel`, `112b777`) | Excellent general game contracts: player counts, chance, simultaneous actions, imperfect information, general-sum/cooperative settings | Games rather than arbitrary graph search; CPU C++ with scripting-language bindings; not a device-resident MCGS runtime | Domain capability taxonomy and conformance corpus |
| **Pgx** (`sotetsuk/pgx`, `87278d2`) | JAX-native, vectorized, accelerator-friendly game transitions for chess, Go, and many other environments | Environment simulator rather than search; no graph storage, memory planner, or universal MCGS policy/runtime | Accelerator-domain adapter and conformance reference |
| **POMCGraphSearch.jl** (`ori-goals/POMCGraphSearch.jl`, `e4e3813`) | Monte Carlo graph search for POMDPs, finite-state-controller output, continuous/discrete domains, belief merging, progressive widening | CPU Julia offline planner, POMDP-specific objective/data model, no GPU-resident evaluator/runtime or schema specialization | Graph folding, partial-observability, and progressive-widening reference |
| **CuFusion-MCTS paper** (ICCIDS 2026, DOI `10.1109/ICCIDS69108.2026.11407819`) | Describes fused CUDA selection/UCB/Gumbel work and persistent RNG; claims GPU-native high utilization and large speedups across several workloads | No public implementation located; available abstract/secondary summaries do not establish transposition graph semantics, resident neural evaluation, universal schemas, finite resource contracts, rerooting, or full target workflow | Track and seek full paper/code; not adoptable as current foundation |
| **Large-Scale Parallel MCTS on GPU** (IPDPSW 2011) | Early evidence that MCTS phases and simulations can be mapped to GPU hardware | Historical domain implementation, not a universal graph/evaluator/resource framework | Literature baseline only |

Exact source revisions and licenses are in [`source-register.yaml`](source-register.yaml).

## Verified implementation observations

### Mctx

The Mctx tree module defines dense tree arrays such as `children_index`, priors, visits, rewards, discounts, and values with shape `[B, N, num_actions]`. It stores one parent and action-from-parent per node. Its search module allocates `num_simulations + 1` nodes and runs simulation, one-node expansion, and backward update in a loop. These choices are strong for static JAX trees but foundationally different from variable-degree transposition graphs and finite arena policies.

### MCTS-NC

The source defines board/action/depth/tree maxima and device game-mechanics functions. Its `run` workflow is host-controlled, launching separate CUDA stages with synchronization and selected host/device transfers. This is much closer to “GPU-accelerated phases” than to the UMCGS rule that no active search decision or phase orchestration depends on the host.

### CrazyAra

`engine/src/searchthread.cpp` contains CPU `SearchThread` traversal, node locks, state cloning/action application, virtual loss, a mutex-protected transposition map, batched input-plane preparation, barriers, and an inference queue. It validates MCGS ideas but not all-device search closure.

### LightZero, OpenSpiel, and Pgx

LightZero deliberately separates its PyTorch model and policy from mixed host/C++ MCTS components. OpenSpiel provides a broad procedural game API in C++ with scripting-language bindings. Pgx provides JIT-able vectorized accelerator environments. Each is valuable at a different boundary, but none is the combined runtime.

### POMCGraphSearch.jl

The implementation targets offline POMDP planning and emits finite-state controllers, with belief merging and progressive widening for large/continuous spaces. It broadens UMCGS conformance requirements but does not provide the CUDA runtime.

## What is reusable

- **Mctx:** functional batch contracts, selection-policy modularity, static array assertions, differential tests.
- **MCTS-NC:** CUDA phase decomposition, reductions, memory-accounting experiments, baseline workloads.
- **CrazyAra and the MCGS paper:** transposition/node-edge semantics, terminal/solved propagation, chess strength comparisons.
- **LightZero:** algorithm-family taxonomy, cross-domain benchmark structure, modular documentation.
- **OpenSpiel/Pgx:** domain capability matrix and deterministic/stochastic conformance environments.
- **POMCGraphSearch:** progressive widening, partial observability, belief/graph folding.
- **CuFusion-MCTS:** fused-kernel and persistent-RNG hypotheses to reproduce if full details/code become available.

Reuse should occur through clean contracts, tests, and independently implemented mechanisms unless a later licensing decision authorizes code adoption.

## Why a new framework is warranted

The missing part is not one kernel. It is the combination of:

- universal graph semantics;
- complete device-resident control and evaluator execution;
- bounded resource planning and safe pressure behavior;
- schema/Search-IR-driven specialization;
- generated layouts without permanent universal cost;
- explicit lifecycle, persistence, output, and conformance contracts.

Replacing these foundations inside any reviewed candidate would be a rewrite of its core. A clean project can still use mature references without preserving incompatible architecture.

## Required follow-up

1. Convert candidate gaps into conformance requirements and synthetic domains.
2. Reproduce representative Mctx and MCTS-NC workloads on target hardware.
3. Obtain and review the full CuFusion-MCTS paper/code if released.
4. Compose the accepted Search IR/publication/resource semantics with domain, policy, evaluator, full memory, output, and execution-package contracts before choosing CUDA scheduling machinery.
5. Choose the UMCGS project license before implementation-level reuse.
6. Revisit ADR-0001 if a candidate demonstrates the full combined boundary.

## Limitations

Repository and paper searches cannot prove nonexistence. Most published performance claims have not been independently reproduced here. Some paper details were available only through abstracts or secondary indexing, and are labeled accordingly.
