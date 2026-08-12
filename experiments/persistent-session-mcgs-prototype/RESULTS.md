# SESSION-001 Results

**Status:** Bounded experiment evidence; no production authority

**Date:** 2026-08-12

## Exact local evidence

Environment:

- Linux x86-64, kernel `6.18.35`;
- Node.js `v22.16.0`;
- no CUDA or CUDA-JS execution in this slice;
- command: `node experiments/persistent-session-mcgs-prototype/run.mjs`.

The repository-wide validation policy requires Node 26 or newer. This Node 22 run is therefore evidence for this isolated experiment only, not a substitute for repository validation.

Result:

```text
capsule=session-001 expected=10 discovered=10 executed=10 passed=10 failed=0 required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=0
```

Representative case observations:

```text
live-ranking-running:                 completed=512  nodes=7 evals=3 publishes=8
ranking-cadence-decoupled:            eager_publishes=512 batched_publishes=8 same_search=true
reroot-reuses-retained-state:         epoch=2 completed=1280 nodes=7 evals=3
stale-work-rejected-after-reroot:     stale_abandoned=32 completed_statistics_unchanged=true
reclamation-defers-and-reuses:        reclaimed=3 replacement_root=10 final_nodes=7
many-epoch-bounded-memory:            epoch=1002 reroots=1001 completed=9032 nodes=7 allocations=7 evals=3
```

A root-ranking trajectory also showed the expected stronger action becoming increasingly dominant without requiring every-backup publication. At 512 completed simulations from state 0 the prototype had 505 completed visits on action 0 versus 7 on action 1. This number is synthetic-domain evidence only, not a search-quality benchmark.

## Sensitivity evidence

Two mutations were applied only to throwaway copies; neither mutation is retained.

### Remove root-epoch commit rejection

Mutation: disable the `work.epoch !== rootEpoch` guard before backup publication.

Result:

```text
expected=10 executed=10 passed=8 failed=2
failed: stale-work-rejected-after-reroot
failed: reclamation-defers-and-reuses-generations
```

The old-epoch work was applied and the reclamation precondition was violated. The test capsule therefore detects the stale-publication failure it is meant to guard.

### Remove slot generation advance on reclaim

Mutation: reclaim a slot without incrementing its generation before reuse.

Result:

```text
expected=10 executed=10 passed=9 failed=1
failed: reclamation-defers-and-reuses-generations
```

The reused slot resurrected a stale reference. Generation safety is therefore observable rather than decorative in this model.

## What the prototype taught us

### 1. Reroot and reclamation should be separate state transitions

The simplest safe model reroots immediately by changing the logical root plus root epoch, while reclamation waits until older outstanding work has either committed under the old epoch or been abandoned as stale. This avoids making graph cleanup part of the latency-critical root switch.

For a native implementation this resembles an epoch/grace-period problem more than a reason to stop and rebuild the search. The exact CUDA mechanism remains unselected.

### 2. Root epoch belongs at the publication/commit boundary

Merely tagging the current root is insufficient. Work that began under an older root epoch must be prevented from publishing root-relative completed statistics into the new epoch. In this model, 32 simultaneously outstanding work items could be abandoned with exact reservation conservation and zero completed-stat contamination.

The later scheduler/reference/native capsules should therefore test epoch capture at admission and epoch validation at every root-relative publication boundary, not only at work selection.

### 3. Live ranking can be decoupled from every backup

For identical deterministic search work, publishing/sorting every backup and every 64 backups produced identical search state and the same top action. The latter performed 8 ranking sorts instead of 512: a 64x reduction in ranking-publication operations for this case.

This is not a timing or production performance claim. It is strong semantic evidence that ranking publication can be a policy-controlled snapshot process rather than part of every backup mutation.

### 4. Old complete ranking snapshots are useful and safe when epoch-tagged

After reroot, the previous immutable snapshot can remain readable until a new snapshot is published. It is unambiguously stale because its `rootEpoch` no longer matches the accepted root epoch. This supports snapshot publication without requiring a stop-the-world ranking handoff.

### 5. Retained graph/evaluator state can survive many root changes

After the seven-node synthetic graph was learned, 1001 additional reroots between already-known states plus continued search caused:

- zero additional node allocations;
- zero additional cached evaluator computations;
- no node-count growth beyond seven.

This is the behavior the long-lived session plan wants. It is only established for this fixed Markov graph and simple evaluator.

### 6. Generation-safe reclamation is not optional

The generation-removal mutation reproduced stale-reference ABA immediately when a reclaimed slot was reused. A production arena may choose a different encoding or reclamation algorithm, but it still needs an equivalent stale-identity proof.

### 7. Finite epoch/generation exhaustion needs an explicit policy

The prototype fails closed before wrapping tiny configured root-epoch or ranking-generation limits. Silent wrap would make stale work or stale snapshots potentially indistinguishable from a later incarnation. The production contracts should choose widths large enough for intended session lifetime and still define exhaustion/restart behavior.

## Limits and unanswered questions

This experiment deliberately does **not** answer:

- CUDA release/acquire/system-scope ordering;
- real concurrent GPU work queues or scheduler fairness;
- multiple CUDA workers observing a root epoch change simultaneously;
- live host/device ranking transport while a kernel or device-owned workflow remains active;
- CUDA-JS long-lived-operation/sideband design from CUDA-JS issue #38;
- history-sensitive or partially observable reuse semantics;
- stochastic transitions;
- variable/large/continuous action spaces;
- top-K maintenance cost at large roots;
- neural evaluator batching/workspace interaction;
- reclamation while new-epoch work is concurrently traversing retained nodes;
- performance, occupancy, cache behavior, or search quality on representative workloads.

The most important next native question is **not** whether rerooting itself can be cheap; this prototype says its semantic state transition can be. The next question is how to realize root-epoch publication, old-work drain/abandonment, ranking snapshots, and reclamation safely under actual CUDA concurrency and through a consumer-neutral CUDA-JS sideband mechanism.

## Disposition

Keep `SESSION-001` as bounded learning evidence while its lessons are folded into:

- graph/reroot/reclamation work in issue #24;
- policy/live-ranking work in issue #34;
- scheduler/progress work in issue #33;
- Search IR/Composer work in issue #35;
- reference/native conformance work in issue #36;
- CUDA-JS generic long-lived sideband research in `iteathen/CUDA-JS#38`.

Do not promote the implementation itself.
