# Tensor Math, Evaluator Batching and Prospective Search in Universal MCGS

**Status:** Research Note

**Inspected:** 2026-08-25

**Question:** Which CUDA-MCGS work can naturally benefit from tensor-shaped execution, evaluator batching or prospective evaluation without making hardware shape, one evaluator, one speculative algorithm, fixed actions or dense-tree assumptions part of the universal framework?

This note records evidence beneath accepted [`ADR-0023`](../decisions/ADR-0023-parallel-first-native-execution.md). Its tensor disposition is adopted by [`ADR-0024`](../decisions/ADR-0024-first-class-neural-evaluator-and-tensor-acceleration.md), while [`ADR-0025`](../decisions/ADR-0025-framework-versus-technique-ownership-for-prospective-evaluation.md) separates reusable framework seams from particular prospective-search techniques. This note does not itself authorize implementation, amend an evaluator or scheduler contract, require a CUDA-JS capability, or block the current reference/native path.

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

## Batching, incomplete-work and speculation evidence

The sources below were inspected after prospective look-ahead, adaptive frontier width and continuous batch refill were proposed in design discussion. They establish useful mechanisms and counterexamples, but no reviewed work establishes the complete proposed combination for a persistent GPU-resident transposition graph.

| Source | Verified observation or author claim | CUDA-MCGS inference | Provenance |
|---|---|---|---|
| [Cazenave, Batch Monte Carlo Tree Search](https://arxiv.org/abs/2104.04278), arXiv `2104.04278v1`, 2021 | The author builds inference batches from search-selected unknown states, keeps neural results in a transposition table separate from MCTS tree statistics, and uses temporary batch-tree statistics while results are unknown. | Search-selected cache-before-main-tree evaluation is supported prior art. It does not establish arbitrary deep prospective expansion or a universal materialization policy. | Primary paper; CC BY 4.0 publication; Go/MobileNet results not reproduced. |
| [Liu et al., WU-UCT](https://arxiv.org/abs/1810.11755), arXiv `1810.11755v5`, 2020 revision | The authors track ongoing incomplete simulations as "unobserved samples" and modify selection statistics; they report near-linear speedup with limited performance loss on their benchmarks. | In-flight evaluator work must have explicit search-visible disposition. An implementation cannot merely enqueue unknown work and let other workers behave as if it does not exist. | Primary paper; publication only; author claims not reproduced. |
| [Meng et al., adaptive DNN-MCTS parallelism](https://arxiv.org/abs/2310.05313), arXiv `2310.05313v1`, 2023 | The authors model and empirically tune CPU/GPU inference batch size. Their selected batch size changes with worker count, and both very small and full batches lose through different latency/overlap costs. | No static universal batch threshold is justified. A selected implementation must measure its request-arrival, inference, overlap and quality behavior on the exact profile. | Primary paper; Gomoku CPU/GPU results not reproduced. |
| [Cheng et al., Speculative MCTS](https://proceedings.neurips.cc/paper_files/paper/2024/file/a19940b01b77b6acd41ff8b32b334e7c-Paper-Conference.pdf), NeurIPS 2024 | The authors pipeline future game decisions predicted from partial MCTS results, reuse neural-cache entries after misprediction, and report Go/NoGo training speedups. They also model flush/resource costs and report an out-of-memory configuration. | Speculation can have value and cache reuse can salvage some discarded work. This is inter-decision game speculation, not evidence for a deep mixed-frontier reservoir within one continuously active MCGS graph. | Primary conference paper; performance/resource claims not reproduced. |
| [Yu et al., ORCA](https://www.usenix.org/conference/osdi22/presentation/yu), OSDI 2022 | The authors use iteration-level scheduling so a transformer-serving batch can change between iterations; they report higher throughput at comparable latency. | Continuous refill is a credible scheduling pattern for iterative GPU work, but transformer request semantics do not establish MCGS selection, backup, transposition or stale-work correctness. | Primary systems paper; serving results not reproduced. |
| [Yang et al., streaming batched beam search](https://aclanthology.org/2020.emnlp-main.366/), EMNLP 2020 | The authors refill variable-width decoding batches as candidates terminate or are pruned and report runtime reductions while matching their decoding baseline. | Variable-width/refill techniques are useful analogies for a future strategy implementation. Autoregressive decoding is not a universal MCGS oracle, and its beam must not become core terminology or behavior. | Primary conference paper; CC BY 4.0 publication; results not reproduced. |
| [Couetoux et al., Continuous RAVE](https://proceedings.mlr.press/v20/couetoux11.html), 2011 | The paper applies progressive widening so the number of considered actions grows with state visits in large or continuous action spaces. | Progressive widening is the established search-policy concept for controlling active branching. It remains policy-owned and must not be silently replaced by hardware batch-fill pressure. | Primary conference paper; experimental claims not reproduced. |

### Evidence limit

The research supports batched evaluation, explicit incomplete-work accounting, evaluation caches separate from tree statistics, measured batch sizing, policy-owned progressive widening and bounded experiments with speculation. It does **not** establish:

- a universal prospective frontier;
- a useful depth of 40 or any other fixed depth;
- an adaptive width/depth rule suitable across MCGS domains;
- batch occupancy as a valid substitute for search value;
- policy-head redundancy after deeper value evaluation; or
- a continuously maintained mixed-depth speculative reservoir for a persistent transposition graph.

These remain hypotheses. Absence of prior validation does not disprove them, but it prevents them from becoming framework requirements or defaults before representative evidence exists.

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
| Demand-driven evaluator batching and exact-key result caching | **Universal framework support** | Finite request/result lifecycles, compatibility, cache identity, incomplete work, cancellation and scatter are broadly useful evaluator/progress/resource concerns already represented by proposed `SPEC-0009`. |
| Prospective cache-before-node evaluation | **Future strategy experiment** | Search-selected one-level precedent exists, but candidate choice, depth, materialization and value belong to a selected strategy rather than universal evaluator or graph meaning. |
| Adaptive prospective depth or width | **Future strategy experiment** | Research demonstrates workload-specific adaptation in adjacent domains, not a universal MCGS rule. Search policy owns semantic widening; an implementation may use idle-capacity admission only within an explicit strategy contract. |
| Inter-decision speculation | **Downstream product/strategy technique** | It depends on a sequence of externally realized decisions and prediction/flush meaning that many MCGS uses do not have. |

## Framework versus future implementation ownership

CUDA-MCGS should make advanced batching and prospective techniques expressible without implementing any particular technique as universal behavior.

The universal framework owns only reusable contracts and composition needed by materially different techniques:

- finite evaluator requests, results, compatible batching, workspaces and exact scatter;
- explicit in-flight, pending, cancelled, stale and ready lifecycles;
- evaluation cache identity and reuse independent from authoritative graph-node materialization;
- policy-owned candidate purpose, widening and result consumption;
- graph-owned identity, storage, protection, publication and reclamation;
- Progress/Resource-owned bounded admission, service, pressure, stopping and cleanup;
- pre-ignition selection and specialization so unselected capabilities leave no hot-path or resource residue; and
- bounded observations sufficient to measure batch fill, wait, reuse, waste, staleness, memory and search effect without host-directed progress.

The universal framework does not own or directly implement:

- a prospective frontier, beam, reservoir or look-ahead tree;
- candidate ranking, speculative depth/width or confidence formulas;
- a rule that spends spare tensor capacity on speculative work;
- prediction, flush or recovery policy after a speculative miss;
- domain/model-specific encodings, priors or materialization decisions; or
- a default claim that speculative work improves search.

Those algorithms belong to selected future CUDA-MCGS strategy/profile implementations, downstream products or isolated experiments consuming public framework contracts. Their code and terminology must not leak into universal owners. If a technique later has an independent package or repository lifecycle, that boundary requires its own decision; this note does not create one.

The architectural test is deletion: removing every prospective strategy must leave the neural connector, evaluator-free and non-neural profiles, core graph search, reference semantics and generated engine complete. Conversely, a strategy should be implementable without private CUDA-MCGS imports or changes to universal semantic owners. If it cannot, the missing piece must first be classified as either a genuinely reusable CUDA-MCGS contract gap or a consumer-neutral CUDA-JS mechanism gap.

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

## Prospective-strategy research sequence

This is a non-gating future implementation lane. It begins only after the ordinary parallel engine and evaluator connector expose representative demand and shape evidence.

1. Establish demand-driven batching with exact in-flight accounting and evaluation caching as the baseline. Measure whether normal continuous parallel search already fills useful batches.
2. Record request-arrival distribution, queue delay, batch occupancy, inference service curve, blocked-search time, cache reuse, stale work after `advance`, memory high-water and search quality at fixed wall time/work.
3. Compare one-level search-selected cache-before-node evaluation against the unchanged baseline under the same policy, model, resources and stop conditions.
4. Only if one-level speculation wins, compare shallow fixed depths/widths. Do not begin with adaptive control or depth 40.
5. Consider adaptive admission only after fixed experiments identify reproducible signals. Required work must remain distinguishable from anticipatory/speculative work, and hardware occupancy must not silently redefine policy semantics.
6. Promote a technique only into its selected strategy/profile boundary after materially different domain/evaluator instances show repeatable benefit and complete failure, cancellation, `advance`, finite-resource and cleanup behavior.

Failure at any step retires or narrows that technique without changing universal framework completeness.

## Unknowns and revisit triggers

Current evidence does not establish:

- whether representative CUDA-MCGS evaluators produce batches large and regular enough to amortize waiting and packing;
- whether action-feature or reduction shapes are sufficiently regular across intended products;
- whether a derived graph view can be reused enough to repay translation while the graph grows;
- which precision classes preserve each selected evaluator/policy's quality contract;
- whether Tensor Core work would contend with an already Tensor-Core-heavy evaluator; or
- which public CUDA-JS operation boundary would be smallest and sufficient for a successful selected experiment.

It also does not establish whether ordinary continuous GPU-resident search supplies enough natural evaluator demand to make speculation unnecessary, how often prospective results survive `advance`, or whether reusable transpositions repay discarded speculative work across materially different domains.

Revisit when reference/native profiles provide representative shape and evaluator-demand telemetry, a second natural evaluator/policy instance supports the same owner-local operation, CUDA-JS exposes a relevant consumer-neutral operation, or new primary evidence demonstrates dynamic transposition-graph gains with transformation and lifecycle costs included.
