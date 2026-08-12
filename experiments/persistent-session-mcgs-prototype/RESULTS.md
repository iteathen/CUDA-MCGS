# SESSION-001 Results and Learnings

**Status:** Bounded experiment evidence; no production authority  
**Date:** 2026-08-12

## Exact local experiment run

Environment: Linux x86-64, kernel `6.18.35`, Node.js `v22.16.0`. No CUDA or CUDA-JS execution occurs in this slice.

Command:

```bash
node experiments/persistent-session-mcgs-prototype/run.mjs
```

Final Node-only result:

```text
capsule=session-001 expected=13 discovered=13 executed=13 passed=13 failed=0 required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=0
```

Node 22 is sufficient for this isolated experiment, but repository-wide validation requires Node 26 or newer. This result is not a substitute for `./scripts/verify-docs.sh`.

One intermediate scratch rewrite was accidentally performed with Python during review, violating the repository's no-Python rule. That run was discarded and is not counted as evidence; the same probe and final 13/13 capsule were reproduced with Node-only tooling.

## Quantitative observations

For identical deterministic search work, publishing/sorting the root ranking every backup versus every 64 backups produced identical search state and the same top action. The batched case performed **8 ranking sorts instead of 512**, a 64x operation-count reduction for this synthetic case. This is not a timing or production-performance claim.

After the seven-node synthetic graph and three nonterminal evaluations were learned, **1001 additional reroots** between already-known states plus continued search reached root epoch 1002 and 9032 completed simulations with node count 7, node allocations 7, and evaluator computations 3.

## Mutation sensitivity

Four throwaway mutations were tested and are not retained.

1. Remove root-epoch validation at commit: stale work and reclamation cases fail because old-root work publishes after reroot.
2. Remove slot-generation advance on reclaim: a reused slot resurrects a stale reference.
3. Remove pre-mutation root-update admission while retaining the later epoch check: an exhausted root update mutates graph state before failing.
4. Make ranking publication expand an unexpanded root: `ranking-publication-readonly` fails because observation materializes search state.

The third and fourth mutations each exposed a real first-pass coupling defect and changed the final prototype.

## Lessons worth carrying forward

### Reroot and reclamation are different transitions

The simplest safe baseline changes logical root + root epoch immediately, then reclaims only after older outstanding work has committed or been abandoned stale. Cleanup does not belong on the latency-critical root switch by default. Native realization resembles an epoch/grace-period problem more than a stop-and-rebuild requirement; the exact CUDA mechanism remains unselected.

### Root epoch must guard publication, not just selection

Work captures the root epoch when admitted. Old-epoch work is prevented from publishing root-relative completed statistics after reroot, while already-materialized graph-global state can remain reusable. Later scheduler/reference/native tests should exercise epoch checks at every root-relative publication boundary.

### Live ranking should be a read-only snapshot process

The first compact publisher expanded an unexpanded root merely to publish its ranking. The final prototype instead publishes an empty coherent snapshot until actual search has materialized root edges. Ranking observation therefore does not itself advance search state. Ranking cadence can also be policy-controlled and independent of every backup in this profile.

### Root-update validation belongs before mutation

Invalid actions and unknown replacement states now fail without expanding, allocating, changing the root epoch, or changing accepted search state. Epoch exhaustion is checked before root-update-specific mutation as well. Admission/validation comes first; graph mutation comes second; root-epoch publication comes last.

### Finite capacity is a real root-update question

With all seven node slots occupied, a valid replacement root that is not already represented is rejected with typed `NODE_CAPACITY` and leaves the current root/session unchanged. This is safe for the prototype, but it exposes an unresolved production requirement: if external root updates are authoritative and cannot simply be refused, the resource contract must provide a bounded strategy such as reserved root-update capacity, a reclamation/retirement transition, or an explicit session failure/recovery outcome. SESSION-001 does not select that strategy.

### Generation-safe reclamation is essential

Removing generation advance reproduced stale-reference ABA on slot reuse. Production may use a different encoding or reclamation algorithm, but it needs an equivalent stale-identity proof.

### Counter exhaustion needs policy, even with wide counters

Silent root-epoch or ranking-generation wrap can make old work/snapshots alias a later incarnation. Production should choose widths suitable for intended session lifetime and still define exhaustion/restart behavior.

## Important semantic limit

SESSION-001 reuses node/outgoing-edge statistics across reroots as one synthetic profile. The future domain/policy contracts still own which facts/statistics are root-independent, retained, reset, transformed, or invalidated. This toy must not define that universally.

## What this does not answer

SESSION-001 does not establish CUDA memory ordering, concurrent GPU scheduler fairness, simultaneous worker response to reroot, live host/device ranking transport, CUDA-JS issue #38's long-lived sideband design, history-sensitive/POMDP reuse semantics, stochastic transitions, large/continuous action-space ranking cost, evaluator batching, concurrent reclamation, performance, occupancy, or representative search quality. Slot-generation exhaustion itself is also not modeled; only stale-generation reuse is.

The highest-value next native experiment is to realize **root-epoch publication + old-work drain/abandonment + coherent read-only ranking snapshots + generation-safe reclamation under actual CUDA concurrency**, while keeping external control/observation consumer-neutral at the CUDA-JS boundary. The root-update capacity-pressure case should be carried into that work rather than hidden by unplanned allocation.

## Disposition

Keep this experiment only as bounded learning evidence while lessons are folded into issues #24, #33, #34, #35, #36 and CUDA-JS #38. Do not promote the implementation itself.
