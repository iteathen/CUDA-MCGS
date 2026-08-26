# ADR-0025: Framework Versus Technique Ownership for Prospective Evaluation

**Status:** Accepted

**Date:** 2026-08-25

## Context

Research into neural evaluator batching, tensor execution, continuous batch refill, speculative MCTS and adaptive frontier control identified a potentially useful technique: use otherwise idle evaluator capacity for bounded policy-guided prospective evaluation, retain results in an exact-key cache independently from authoritative graph-node materialization, and materialize or consume them lazily when active search establishes demand.

The reviewed literature supports batched evaluation, explicit accounting for incomplete work, evaluation caches separate from tree statistics, measured batch sizing, policy-owned progressive widening and bounded speculation experiments. It does not establish one universal prospective frontier, useful look-ahead depth, adaptive width/depth rule, tensor-capacity-filling policy or persistent mixed-depth reservoir for CUDA-MCGS. The evidence and limits are recorded in [`2026-08-25-tensor-math-in-mcgs-assessment.md`](../research/2026-08-25-tensor-math-in-mcgs-assessment.md).

CUDA-MCGS is intended to be a universal framework. A promising first technique must not become an accidental universal algorithm, hot-path cost or release dependency. Conversely, the framework should expose enough accurately general capability that future implementations can test this technique and materially different evaluator/search strategies without private imports or foundational redesign.

## Decision

CUDA-MCGS owns reusable framework contracts and composition needed by materially different evaluator/search techniques. It does not implement one prospective-frontier, adaptive-depth/width, beam, reservoir, inter-decision speculation or tensor-capacity-filling algorithm as universal behavior.

The universal framework may own, through the already applicable semantic owners:

- finite evaluator requests, results, compatible batching, workspaces, exact scatter and cache identity;
- explicit in-flight, pending, cancelled, stale and ready lifecycles;
- policy-owned candidate purpose, widening and result consumption;
- graph-owned identity, storage, protection, publication and reclamation;
- Progress/Resource-owned bounded admission, service, pressure, stopping and cleanup;
- pre-ignition selection and specialization with exact unselected deletion; and
- bounded observations for batch fill, wait, reuse, waste, staleness, memory and search effect without host-directed progress.

Particular candidate-ranking, speculative-admission, look-ahead, materialization, prediction/flush and adaptive-control algorithms belong to selected future strategy/profile implementations, downstream products or bounded experiments. They consume public CUDA-MCGS contracts and, when needed, public CUDA-JS mechanisms. They may not require private imports, redefine universal owners, force their terminology into unrelated profiles or leave generated/runtime/resource residue when unselected.

The current proposed evaluator, policy, graph, progress, resource and extension contracts remain the candidate framework seams. This ADR does not amend their semantics or accept them. A future technique that cannot be expressed through accepted public contracts triggers an ownership test: add only a genuinely reusable CUDA-MCGS contract capability, classify a consumer-neutral CUDA-JS mechanism, or keep the technique outside the framework. Technique convenience is not authority to distort universal meaning.

## Consequences

- ADR-0024's neural connector and qualified tensor execution remain first-class optional framework features.
- Prospective evaluation and related adaptive strategies may be built on the framework without becoming universal behavior or release gates.
- Removing every prospective strategy must leave evaluator-free, non-neural and demand-driven profiles, core graph search, reference semantics and generated engines complete.
- Search policy semantics remain distinct from physical batch occupancy. An implementation may admit speculative work against otherwise idle capacity only through an explicit selected strategy with finite budgets and evidence.
- A strategy may specialize into a generated hot path after pre-ignition selection; universality does not require runtime callbacks, one giant options object or a permanent per-node abstraction tax.
- The current `ENGINE-REFERENCE-01` and first parallel correctness-engine targets remain unchanged.

## Future research and implementation lane

Prospective techniques are non-gating future work after ordinary parallel search and the evaluator connector expose representative demand and shape telemetry:

1. establish demand-driven batching with exact in-flight accounting and evaluation caching as the baseline;
2. measure natural batch occupancy, queue delay, blocked-search time, reuse, waste, stale work after `advance`, memory and search quality;
3. compare one-level search-selected cache-before-node evaluation against that unchanged baseline;
4. only after a win, compare shallow fixed depths/widths; and
5. consider adaptive control only after fixed experiments identify reproducible signals across materially different instances.

Each selected implementation owns its algorithm, configuration, evidence, failure/cancellation behavior and cleanup. A failed experiment narrows or retires that technique without weakening framework completeness.

## Alternatives considered

### Implement the prospective technique directly in CUDA-MCGS core

Rejected. Evidence is insufficient, the technique is not universal, and direct ownership would couple evaluator utilization to search semantics while imposing terminology and potential hot-path costs on unrelated profiles.

### Expose no framework support until one technique is proven

Rejected. Finite asynchronous evaluator work, batching, caches, stale-result disposition, policy-owned widening and bounded resources are independently useful across materially different strategies. They remain valid framework concerns without selecting this technique.

### Standardize speculative priority classes now

Rejected. Required, anticipatory and speculative work are useful experimental descriptions, but one discussion does not establish universal names or lifecycle meaning. A selected strategy may define them locally; promotion requires independent reuse and accepted contract work.

## Compatibility and sequencing

This ADR extends ADR-0018, ADR-0020, ADR-0023 and ADR-0024. It changes no accepted Search IR or production implementation authority.

`ENGINE-REFERENCE-01` remains the active target. `REF-EVALUATOR-01` later proves product-neutral evaluator semantics; `ENGINE-PERF-01` later qualifies the neural connector and representative tensor path. Neither target is required to implement prospective evaluation. Prospective techniques begin only through an explicitly selected future experiment/strategy lane after representative telemetry exists.

## Validation

Framework validation proves public composition, owner separation, finite lifecycle/resource behavior, device closure and exact unselected deletion without requiring a prospective strategy.

A future prospective implementation additionally proves against a frozen demand-driven baseline:

- semantic and search-quality equivalence or an explicitly declared approximation contract;
- useful-search benefit at fixed wall time and fixed work/resource budgets;
- exact in-flight, cache, transposition, cancellation, stale-result and `advance` behavior;
- bounded memory, queue, workspace, depth/width and cleanup;
- no starvation of required search work; and
- representative materially different domain/evaluator evidence before any broad recommendation.

## Revisit triggers

Revisit the framework boundary only when a second materially different technique cannot use the accepted public seams, representative evidence demonstrates a broadly reusable missing lifecycle/resource semantic, or a technique repeatedly requires private CUDA-MCGS access. Revisit technique promotion when ordinary continuous search telemetry and controlled experiments demonstrate repeatable benefit.

## Supersedes / superseded by

This ADR does not supersede ADR-0024. It extends ADR-0024 by separating its first-class neural/tensor framework capability from ownership of particular prospective/adaptive search techniques.
