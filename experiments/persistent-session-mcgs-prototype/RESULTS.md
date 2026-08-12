# SESSION-001 Results and Learnings

**Status:** Bounded experiment evidence; no production authority  
**Date:** 2026-08-12

## Exact local experiment run

Environment: Linux x86-64, kernel `6.18.35`, Node.js `v22.16.0`. No CUDA or CUDA-JS execution occurs in this slice.

Command:

```bash
node experiments/persistent-session-mcgs-prototype/run.mjs
```

Result:

```text
capsule=session-001 expected=10 discovered=10 executed=10 passed=10 failed=0 required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=0
```

Node 22 is sufficient for this isolated experiment, but the repository-wide validator requires Node 26 or newer. This result is therefore not a substitute for `./scripts/verify-docs.sh`.

## Quantitative observations

For identical deterministic search work, publishing/sorting the root ranking every backup versus every 64 backups produced identical search state and the same top action. The batched case performed **8 ranking sorts instead of 512**, a 64x operation-count reduction for this synthetic case. This is not a timing or production-performance claim.

After the seven-node synthetic graph and three nonterminal evaluations were learned, **1001 additional reroots** between already-known states plus continued search reached root epoch 1002 and 9032 completed simulations with:

- node count still 7;
- node allocations still 7;
- cached evaluator computations still 3.

That is bounded evidence that retained graph/evaluator state can survive many root changes in this simple Markov profile.

## Mutation sensitivity

Three throwaway mutations were tested and are not retained.

1. **Remove root-epoch validation at commit:** capsule fell to 8/10. `stale-work-rejected` and reclamation failed because old-root work published after reroot.
2. **Remove slot-generation advance on reclaim:** capsule fell to 9/10. A reused slot resurrected a stale reference.
3. **Remove pre-mutation root-update admission checks while keeping the later epoch check:** capsule fell to 9/10. `epoch-exhaustion-no-side-effect` detected that a rejected reroot expanded/materialized graph state before failing.

The third mutation caught a real defect in the first prototype pass and changed the implementation ordering.

## Lessons worth carrying forward

### Reroot and reclamation are different transitions

The simplest safe baseline changes logical root + root epoch immediately, then reclaims only after older outstanding work has committed or been abandoned stale. Cleanup does not belong on the latency-critical root switch by default. Native realization looks more like an epoch/grace-period problem than a reason to stop and rebuild the graph; the exact CUDA mechanism remains unselected.

### Root epoch must guard publication, not just selection

Work captures the root epoch when admitted. Old-epoch work is prevented from publishing root-relative completed statistics after reroot, while already-materialized graph-global state can remain reusable. Later scheduler/reference/native tests should exercise epoch checks at every root-relative publication boundary.

### Live ranking should be a snapshot process

Ranking cadence can be policy-controlled and independent of every backup in this profile. Immutable snapshots can remain readable after reroot because the old `rootEpoch` makes staleness explicit until a new snapshot is published.

### External root updates need fail-closed admission before graph mutation

The first implementation checked epoch exhaustion too late. A rejected action reroot could expand the root and a rejected replacement root could allocate state before failing. The corrected rule is: **admit the root update first, then perform root-update-specific graph mutation, then publish the new root epoch**. A later epoch assertion is defense in depth, not the primary no-side-effect guard.

### Generation-safe reclamation is essential

Removing generation advance reproduced immediate stale-reference ABA on slot reuse. Production may use a different encoding or reclamation algorithm, but it needs an equivalent stale-identity proof.

### Counter exhaustion needs policy, even with wide counters

Silent root-epoch or ranking-generation wrap can make old work/snapshots alias a later incarnation. Production should choose widths suitable for intended session lifetime and still define exhaustion/restart behavior.

## What this does not answer

SESSION-001 does not establish CUDA memory ordering, concurrent GPU scheduler fairness, simultaneous worker response to reroot, live host/device ranking transport, CUDA-JS issue #38’s long-lived sideband design, history-sensitive/POMDP reuse semantics, stochastic transitions, large/continuous action-space ranking cost, evaluator batching, concurrent reclamation, performance, occupancy, or representative search quality.

The highest-value next native experiment is to realize **root-epoch publication + old-work drain/abandonment + live ranking snapshots + generation-safe reclamation under actual CUDA concurrency**, while keeping external control/observation consumer-neutral at the CUDA-JS boundary.

## Disposition

Keep this experiment only as bounded learning evidence while lessons are folded into issues #24, #33, #34, #35, #36 and CUDA-JS #38. Do not promote the implementation itself.
