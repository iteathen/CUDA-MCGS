# CUDA-MCGS Graph cleanup falsifier checkpoint — 2026-08-28

## Stop point

Stop immediately at the repository state frozen for this handoff. No semantic change, merge, PR action, issue closure, cleanup deletion, branch rewrite, or protected-branch mutation was performed by this checkpoint operation.

Dedicated recovery/checkpoint branch:

`checkpoint/graph-cleanup-falsifier-handoff-20260828`

The branch was created from the exact observed head of the active Graph cleanup branch:

`ref/graph-cleanup-acceptance-01@c901e880de9183868c0d0e773d27c3e2f484acdd`

At the freeze point:

- `experimental/portfolio@422fe99bf51c1f48cda480a6a6d98f641fb2599d`;
- protected `main@ee4434be0ae927c4ae1d5c106f91503d28b1aa01`;
- `main` remained protected with required `verify` context;
- the isolated experimental portfolio remained unchanged while the focus branch carried unintegrated Graph cleanup work.

Do not promote the checkpoint branch itself. It exists as recovery/continuation state only.

## Important branch-state contradiction discovered

The prior handoff at:

`ref/graph-cleanup-acceptance-01@cdc51b12f822b6b61801ba0109c40486f764f5ce`

stated that no Graph cleanup semantic/source change had been made and that the next session should begin by testing the `GRAPH-CLEANUP-002` publication-conflict falsifier.

Inspection showed that this description was already stale relative to its own branch history: commits preceding `cdc51b12...` contained Graph cleanup semantic/test work. During the present inspection, the same branch then advanced again from `cdc51b12...` to `c901e880...`, ending 26 commits beyond `cdc51b12...`.

Because the branch moved materially during review, later commits are **not reviewed or qualified by this handoff**. The safe continuation point is therefore the frozen checkpoint branch, with a fresh exact-head review required before accepting any of the newer work.

## Confirmed falsifier result against the clean experimental baseline

The governing requirement in `SPEC-0010` is:

`GRAPH-CLEANUP-002`: publication conflict, equality inconsistency, generation alias, or uncertain owner cleanup must quarantine affected objects/arena and invalidate dependent evidence; recovery cannot guess which payload/reference is authoritative.

The clean integrated experimental baseline at `422fe99bf51c1f48cda480a6a6d98f641fb2599d` did **not** satisfy the publication-conflict portion of that requirement.

In the baseline `experiments/search-semantics-reference/src/graph-node.mjs`:

1. conflicting re-publication of an already-ready node throws `GRAPH_NODE_PUBLICATION_CONFLICT`;
2. no arena/object quarantine is installed;
3. `observeClaim` continues to report the prior claim as `ready`;
4. `readyPayload` remains readable;
5. later semantic use can therefore continue despite the unresolved publication inconsistency.

That is a confirmed semantic/reference gap relative to `GRAPH-CLEANUP-002`, not merely missing test coverage.

## Initial review findings on the pre-advance residue

Before the branch moved to `c901e880...`, the then-visible cleanup work had the correct broad direction—arena quarantine and dependent-evidence invalidation—but was not acceptable as-is.

Three concrete blockers were identified:

1. **NODE regression contradiction** — the existing `graph-node-conflicting-ready-publication-is-fatal` case still asserted that the claim remained `ready` after the conflict, contradicting the newly introduced quarantine semantics.
2. **LEGO ownership leak** — the cleanup reconciliation helper exposed downstream realization terminology/state such as `nativeResourcesDestroyed` / `ready-for-native-destruction`, even though Graph owns semantic cleanup readiness and does not own CUDA-JS/native destruction.
3. **Retention compatibility weakness** — retained-artifact validation required non-empty profile/package identity strings but did not itself prove that those identities matched the exact compatible profile/package expected by the evidence consumer.

These findings were made against the earlier branch state and must not be assumed to remain true at `c901e880...` without reinspection.

## Branch movement observed after those findings

The active focus branch advanced materially while the inspection was in progress. The compare from `cdc51b12...` to `c901e880...` reported 26 additional commits.

At least one subsequently observed commit explicitly addressed the ownership concern:

`252c61aa1be2b197eb5890ad71035ad11a9ed004` — `fix(graph-cleanup): keep release and retention contracts owner-neutral`

The final observed focus-branch commit was:

`c901e880de9183868c0d0e773d27c3e2f484acdd` — `docs(coverage): bind Graph cleanup reference evidence`

Those later changes were not given a complete semantic, LEGO, evidence, workflow, or author-side review before the stop request. Their presence is evidence of active remediation, not qualification.

## Required resume procedure

Resume from the checkpoint branch, not from memory and not from the stale earlier handoff description.

1. Verify the exact heads of:
   - `checkpoint/graph-cleanup-falsifier-handoff-20260828`;
   - `ref/graph-cleanup-acceptance-01`;
   - `experimental/portfolio`;
   - protected `main`.
2. If `ref/graph-cleanup-acceptance-01` has moved beyond `c901e880...`, treat that as a new review subject. Do not silently merge the new delta into this checkpoint claim.
3. Review the complete effective diff from `experimental/portfolio@422fe99...` to the chosen final Graph cleanup head.
4. Re-test the confirmed `GRAPH-CLEANUP-002` publication-conflict gap first and prove that conflict makes further semantic use impossible and invalidates dependent evidence.
5. Reconcile the old NODE owner case so it expresses the composed Graph cleanup meaning rather than the obsolete “fatal but still ready” behavior.
6. Verify all Graph cleanup helpers remain owner-neutral. Graph may report semantic cleanup/release readiness; CUDA-JS/native destruction remains downstream realization ownership.
7. Verify retained artifact evidence proves exact compatibility/identity rather than accepting arbitrary non-empty identity labels.
8. Review `GRAPH-CLEANUP-001..004` coverage for truthful scope. Reuse NODE/EDGE/REF/PATH/ROOT/RECLAIM/ADVANCE evidence rather than creating a second monolithic Graph model.
9. Keep `GRAPH-RESOURCE-*` with `IR-RESOURCE-01` and `GRAPH-LIFE-*` native-compatible-pair qualification with `ENGINE-NATIVE-01`.
10. Require the owner-local cleanup capsule, all affected upstream Graph capsules, the cleanup peer CI lane, aggregate `verify`, exact-head author review, guarded merge into `experimental/portfolio`, and post-merge readback before any Graph semantic closure claim.
11. Keep protected `main` untouched while this experimental portfolio line remains isolated.

## LEGO / ownership constraints to preserve

- Graph owns product-neutral graph/storage/reference/lifetime/cleanup semantics.
- Session owns current-root/root-epoch/advance/reroot/attention/supersession classification.
- Resource owns composed admission/watermark/pressure policy.
- Progress owns scheduling/fairness/device-progress policy.
- CUDA-JS owns generic CUDA/native realization primitives and resource destruction mechanisms.
- CUDA-JS-Tensor owns generic tensor math, not Graph lifetime semantics.
- Product/chess/UCI/Book Forge/Timing Evidence/tablebase behavior remains downstream.

No C/C++, CUDA C++, native addon/FFI, embedded CUDA, hand-authored PTX, private CUDA-JS access, or Python belongs in this CUDA-MCGS semantic/reference leaf.

If a naturally generic GPU primitive is missing from public CUDA-JS, stop and classify a CUDA-JS capability gap rather than building local native glue.

## Validation and claim limits

This checkpoint records inspection findings only. It does **not** claim that `c901e880...` passes local tests, CI, Graph cleanup coverage, author review, merge readiness, or semantic closure.

No test run was performed after the branch advanced to `c901e880...` during this inspection. No PR was created or merged. No issue was closed. No cleanup branch was deleted.

The only durable action of this stop operation is preservation of the exact observed focus-branch state plus this handoff on the dedicated checkpoint branch.

## Cleanup disposition

- `checkpoint/graph-cleanup-falsifier-handoff-20260828` — retain as recovery/continuation evidence until the resumed Graph cleanup leaf is either integrated or explicitly superseded and the handoff is no longer needed.
- `ref/graph-cleanup-acceptance-01` — protect unchanged by this checkpoint operation; it may have concurrent/independent work.
- `experimental/portfolio` — protect unchanged.
- protected `main` — protect unchanged.
- pre-existing cleanup debt recorded by the project remains outside this stop operation.

## Resume sentence

Resume by freezing the current `ref/graph-cleanup-acceptance-01` head, comparing it to checkpointed `c901e880de9183868c0d0e773d27c3e2f484acdd` and `experimental/portfolio@422fe99bf51c1f48cda480a6a6d98f641fb2599d`, then perform a complete exact-head review of the Graph cleanup diff before running the focused `GRAPH-CLEANUP-002` falsifier and the owning cleanup capsule.