# REF-EVALUATOR-01 mutable-state cache qualification — 2026-09-01

**Status:** Informational

## Scope

This record covers the SPEC-0009 `evaluator-cache-mutable-state-invalidation` gap in draft PR #160 after PR #162 was integrated into `experimental/portfolio` as `95fdda77d002cc899a6534f02a6c2af0580303af`. It changes only the deterministic CUDA-free Evaluator reference. It does not authorize production lowering, native CUDA execution, CUDA-JS-Tensor realization, performance claims, or chess/product semantics.

## Assess

PR #160 was reconstructed onto exact `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`. The old pre-reconstruction head is preserved at `checkpoint/ref-evaluator-01-pre-162-rebase-20260901`.

SPEC-0009 section 18 requires a finite resumable evaluator under cache interaction and explicitly requires `evaluator-cache-mutable-state-invalidation`. EVAL-CACHE-008 requires result-affecting mutable evaluator-state changes to invalidate or version affected cache entries before new results publish.

## Research

The corrected Composer authority from PR #162 makes `evaluator.synthetic-batch-sensitive-resumable` simultaneously select mutable state, bounded continuation, and cache with `state-generation` in the cache key.

The existing Evaluator oracle already owned both relevant operations:

- `commitMutableState()` validates the active batch, stale-work state, certainty, exact retry identity, and monotonic state generation;
- `invalidateCacheFact()` makes entries whose declared key fact differs from the new value immediately non-hittable while preserving protection by moving protected entries to `retiring`.

Before this repair, `commitMutableState()` advanced `mutableGeneration` without invoking the existing cache transition.

## Reassess and plan

No new cache API, state machine, owner, or cross-component mechanism was needed. The smallest sufficient owner-local repair was:

1. add the required combined conformance case to the existing Evaluator case bank;
2. rebind the Evaluator fixture to the qualified post-#162 Composer/profile projection identities;
3. prove the new case fails for the expected semantic reason;
4. inside `commitMutableState()`, reuse `invalidateCacheFact({ fact: 'state-generation', nextValue })` immediately before publishing the new mutable generation when that fact is part of the selected cache key; and
5. rerun focused then full permanent qualification.

This keeps one Evaluator owner, preserves exact retry idempotence, reuses the existing cache lifecycle, and avoids duplicate machinery.

## Falsification

Commits `060a3bc64c4126ba963d329fca8bf84238d3339f` and `63e0b372aa4e7a5be829d66c6f0a22c75d9f7cab` added the required expected case and combined falsifier.

After rebinding the post-#162 Evaluator profile projection in `42819c9f1f46b5ff6fe4dc26cfb7f0ed023ccfaa`, permanent workflow `33552079770` reached the semantic case with Composer still `881/881` and Evaluator `29/30`. The sole Evaluator failure was:

`cache entry bound to state-generation 0 must become non-hittable when mutable state commits generation 1` (`hit !== miss`).

The qualified Evaluator profile projection used by that run is:

- SHA-256: `1e3da52e43c498b0e53107383a9ff48345e71d097208ddb7c414cef06e5c7fa1`;
- canonical bytes: `155494`.

## Implemented repair

Semantic repair commit: `97b1a0ee782f627c2e97fffa90e048ce5c71727c`.

`commitMutableState()` now invalidates the existing `state-generation` cache fact before assigning the new mutable generation when the selected cache declares that key fact. Exact retry remains idempotent because previously committed `updateIdentity` values return before the invalidation path.

A bounded branch-only transport workflow was used because the connected file mutation interface replaces whole large files. It required one exact source match, ran `git diff --check`, ran the focused Composer/export/Evaluator falsifier, removed itself, and committed only the three-line semantic repair plus its own deletion. Workflow `33552200681` passed. The temporary workflow is absent from the net PR diff.

## Focused evidence

Workflow `33552200681` passed the exact case:

`evaluator-cache-mutable-state-invalidation`

against the post-#162 Composer authority before committing the semantic repair.

## Cleanup and claim limits

- temporary repair workflow: removed;
- pre-reconstruction branch state: retained only on the named checkpoint for rollback/audit;
- protected `main`: unchanged;
- `experimental/portfolio`: unchanged by this PR until review/merge;
- no native/CUDA, Tensor, product, or scheduler mechanism added.

The next gate is the ordinary permanent PR workflow on the exact user-originated documented head. It must pass the full Evaluator reference, Composer, Windows/Ubuntu Search IR, governance, Policy, all Graph references, and aggregate fail-closed `verify`. After that, PR #160 still requires whole-spec author review and whatever independent-review requirement remains applicable before merge.
