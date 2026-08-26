# Tensor Math in Universal MCGS

**Status:** Research Note

**Inspected:** 2026-08-25

**Question:** Which CUDA-MCGS work can naturally benefit from tensor-shaped execution or NVIDIA Tensor Cores without making hardware shape, one evaluator, fixed actions or dense-tree assumptions part of the universal framework?

This note records evidence beneath accepted [`ADR-0023`](../decisions/ADR-0023-parallel-first-native-execution.md). Its architectural disposition is adopted by [`ADR-0024`](../decisions/ADR-0024-first-class-neural-evaluator-and-tensor-acceleration.md), which makes qualified tensor acceleration and the neural evaluator connector first-class optional core features. This note does not itself authorize implementation, amend an evaluator or scheduler contract, require a CUDA-JS capability, or block the current reference/native path.

## Terminology boundary

Tensor-shaped programming and Tensor Core execution are different claims. Array/tensor libraries can batch indexing, selection, mutation and reduction on ordinary CUDA cores. NVIDIA Tensor Cores principally reward sufficiently regular matrix multiply-accumulate work with compatible shapes, precision and arithmetic intensity.

CUDA-MCGS therefore optimizes useful search outcomes rather than Tensor Core utilization. A tensor path is valid only as an optional implementation of an already owned semantic operation. The non-tensor profile remains complete, and selecting or deleting the tensor path cannot change universal Domain, Graph, Policy, Evaluator, Resource, Progress, root-control or result meaning.

## Evidence

No source implementation was copied or adapted. Published performance claims below have not been reproduced by CUDA-MCGS.

| Source | Verified observation or author claim | CUDA-MCGS inference | Provenance |
|---|---|---|---|
| [NVIDIA matrix-multiplication performance guide](https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/index.html), last updated 2023-02-01 | NVIDIA documents that matrix-vector work is memory-bound, larger GEMMs usually obtain greater arithmetic intensity, and alignment plus tile/wave quantization materially affects Tensor Core efficiency. | Small irregular selection formulas must not be padded into matrix work merely to exercise Tensor Cores. Packing, inactive lanes and tail waves belong inside the measured boundary. | Official documentation; NVIDIA documentation/toolkit terms; inspected 2026-08-25. |
| [CUTLASS grouped-kernel scheduler](https://docs.nvidia.com/cutlass/latest/media/docs/cpp/grouped_scheduler.html), current documentation | CUTLASS can schedule groups of independent GEMM problems, including differing problem sizes, through a persistent grouped kernel. | Grouped GEMM is a plausible mechanism for shape-bucketed evaluator or learned-policy work, not a universal graph/search representation. | Official NVIDIA documentation; current page inspected 2026-08-25; no source reuse decision. |
| [Baláž and Tarábek, tensor MCTS](https://doi.org/10.3390/app13031406), 2023 | The authors process many independent MCTS trees as GPU tensor operations for a MuZero workload. They explicitly target many unique roots rather than one continuously reused tree and report favorable scaling and speedups on an RTX 2080 Ti. | Independent roots can supply a natural batch dimension. Dense fixed-action tree tensors do not establish suitability for a persistent variable-action transposition graph, and tensor-library use does not by itself prove Tensor Core MMA execution. | Primary paper; CC BY 4.0 publication; performance claim not reproduced. |
| [Mctx](https://github.com/google-deepmind/mctx), revision `b53073fd5035618228a717e29254e36ceb6f0645` | JAX-native MCTS operates on batches of inputs for accelerators using dense fixed node/action storage. | Useful reference for batched independent searches and differential tests; not a foundation for CUDA-MCGS graph, cycle, transposition or finite-pressure semantics. | Author repository; Apache-2.0; paths and revision already registered in the prior-art source register. |
| [Cazenave, Batch Monte Carlo Tree Search](https://arxiv.org/abs/2104.04278), 2021 | The author batches neural-network inference and combines tree statistics with transposition-table inference results for a Go workload. | Evaluator batching can coexist with transposition-aware search, but the paper does not establish whole-graph Tensor Core execution or universal evaluator semantics. | Primary paper; publication only; performance claim not reproduced. |
| [TC-GNN](https://arxiv.org/abs/2112.02052), revision 4 / USENIX ATC 2023 | The authors translate sparse graph work into Tensor-Core-suitable dense blocks and combine CUDA-core data management with Tensor Core computation; they report an average 1.70x speedup over DGL. | Irregular graph work can benefit only after explicit translation and hybrid execution. Translation/reordering is unlikely to suit a constantly growing authoritative MCGS graph unless a stable owner-local slice is reused enough to amortize it. | Primary paper; publication only; performance claim not reproduced. |
| [Dakkak et al., Tensor Core reduction and scan](https://arxiv.org/abs/1811.09736), revision 2 / ICS 2019 | The authors express reduction and scan as matrix multiplication and report substantial gains for small segments on Volta-era hardware. | Selection, backup or compaction reductions are legitimate experiments only where value algebra, order and precision permit them. They must beat current warp/block baselines on representative hardware. | Primary paper; publication only; performance claim not reproduced. |
| [NVIDIA cuSPARSELt workflow](https://docs.nvidia.com/cuda/cusparselt/getting_started.html), current documentation | Structured sparse matrix multiplication requires problem definition, planning, pruning/compression, workspace and execution lifecycle. | Arbitrary evolving MCGS adjacency does not naturally satisfy structured sparsity. Setup, compression and workspace costs prohibit assuming sparse Tensor Core suitability. | Official NVIDIA documentation; current page inspected 2026-08-25. |

## Owner-by-owner disposition

| Semantic owner or work family | Disposition | Reason |
|---|---|---|
| Learned evaluator/model execution | **Primary candidate** | Dense inference is the most natural high-arithmetic-intensity operation. Evaluator owns input/output, numeric tolerance, batching, assets, workspace and failure meaning already. |
| Batched independent roots or replicas | **Primary candidate when naturally supplied** | Roots form a batch dimension without changing one search's graph semantics. Single persistent search remains complete, and multi-GPU replicas remain a separate selected profile. |
| Learned policy/action-feature scoring | **Conditional experiment** | Shape-bucketed grouped GEMM may fit when the selected policy naturally defines substantial fixed-coordinate math. Simple score formulas remain CUDA-core work. |
| Learned Domain transition/dynamics | **Conditional adapter experiment** | A selected Domain/model adapter may naturally own batchable dense computation. No learned or fixed-shape transition becomes universal. |
| Selection, backup, allocation and queue reductions/scans | **Measured implementation experiment only** | Some algebra can map to matrix operations, but segments are often small or irregular and order/precision may be semantic. Modern warp/block primitives are the required baseline. |
| Frozen or slowly changing owner-local graph views | **Distant experiment** | A derived frontier/tile view may amortize translation in a special profile. It never becomes authoritative graph identity or storage. |
| Live graph adjacency, transposition lookup/publication, allocation, reclamation, root control and cancellation | **Reject as tensor design targets** | These are irregular identity, ownership, atomic, lifecycle and control operations. Tensor conversion would add work and leak hardware shape into universal semantics. |

## Architecture disposition

1. Tensor acceleration is a first-class optional core capability implemented behind an existing semantic owner. It is strongly recommended for eligible qualified workloads, while non-tensor engines remain complete. CUDA-MCGS does not add a general tensor subsystem or tensor-shaped universal graph.
2. Evaluator/model batching is the first and strongest candidate. The evaluator owns semantic compatibility, numeric class, batch sensitivity, padding-lane isolation, scatter identity, artifacts, workspace, failures and cleanup; Progress owns service/fairness rather than evaluator grouping meaning.
3. Independent search batching is an optional engine/product profile. It does not require multiple roots, fixed action widths or replica merging in the universal core.
4. Graph translation, fixed-width child tensors and whole-search dense layouts are rejected as foundations. A later derived view must be owner-local, finite, disposable and justified by reuse.
5. Tensor and non-tensor implementations must be observationally equivalent under the selected exact/tolerance/stochastic contract. Visit counts, publication generations, ownership and other exact control facts do not silently adopt reduced precision.
6. Runtime selection must not add a decision tax to every node. Prefer preselected profile variants or bounded device-owned batching decisions; `advance`, attention and other root-control paths gain no packing, rebuilding or tensor synchronization.
7. CUDA-JS capability work begins only after a selected experiment identifies a consumer-neutral missing mechanism. CUDA-MCGS retains all search, evaluator, policy, batching and resource meaning.

## Required experiment sequence

Tensor work begins only after a representative parallel engine can expose or replay real work shapes.

1. Record owner-local distributions: evaluator batch fill and tail latency, action degree, feature dimensions, path depth, segment sizes, arithmetic intensity, divergence, contention, bytes moved and workspace high-water marks.
2. Reproduce captured shapes with five comparable paths: scalar/SIMT, warp/block cooperative, batched CUDA-core, Tensor Core, and adaptive hybrid.
3. Begin with evaluator batching. Consider learned policy scoring next. Reduction/scan follows only if profiles expose sufficient repeated work. Derived graph tiles are last.
4. Measure the complete boundary: device-side queueing, batch delay, packing, padding, conversion, workspace, synchronization, scatter, failure/cancellation and cleanup—not isolated matrix throughput.
5. Compare search throughput and useful completed work, quality at fixed wall time and fixed work budget, numeric equivalence, tail latency, memory high-water, resource pressure and regressions across unrelated product-neutral profiles.

Promotion requires a repeatable end-to-end benefit over the best credible non-tensor parallel baseline on the exact selected workload/hardware/profile, with semantic, quality, finite-resource, lifecycle and cleanup equivalence. A failed experiment is retained as evidence against repeating the same transformation; it does not weaken the complete non-tensor engine.

## Unknowns and revisit triggers

Current evidence does not establish:

- whether representative CUDA-MCGS evaluators produce batches large and regular enough to amortize waiting and packing;
- whether action-feature or reduction shapes are sufficiently regular across intended products;
- whether a derived graph view can be reused enough to repay translation while the graph grows;
- which precision classes preserve each selected evaluator/policy's quality contract;
- whether Tensor Core work would contend with an already Tensor-Core-heavy evaluator; or
- which public CUDA-JS operation boundary would be smallest and sufficient for a successful selected experiment.

Revisit when reference/native profiles provide representative shape telemetry, a second natural evaluator/policy instance supports the same owner-local operation, CUDA-JS exposes a relevant consumer-neutral operation, or new primary evidence demonstrates dynamic transposition-graph gains with transformation and lifecycle costs included.
