# REF-ROOT-CONTROL-01 reconciliation handoff — 2026-08-26

## Stop point

Stop on PR #127 after the adjacent root-authority reconciliation was fully proven in an ephemeral GitHub Actions checkout but **before those adjacent semantic edits were committed or pushed**.

Do not begin `REF-GRAPH-01`, do not merge PR #127, and do not treat the ephemeral v6 evidence identities as durable branch evidence yet.

Repository: `iteathen/CUDA-MCGS`

PR: #127 — `Reconcile Session root control and live ownership names`

Branch: `docs/ref-root-control-01-reconcile`

Protected-base input: `main@173765cf86fc6ab91364d8d52eb6a045dcbe2346`

## Exact checkpoint before this handoff commit

Branch head before adding this handoff document:

```text
97fb96d385eb0ca9e0b3f634f3bc9423d19b47b7
```

Last durable project checkpoint before the temporary adjacent-reconciliation workflows:

```text
d026ccbeaaefd13e53891c98dc98050916d46731
```

`d026ccbe...` is a no-tree-change exact-head validation trigger on the durable reconciliation tree produced by `3f7914637fd33db9fce430c2bc83c23814a642d5`.

A direct compare from `d026ccbe...` to `97fb96d...` shows exactly six added files and no other changes:

- `.github/workflows/reconcile-adjacent-root-authority.yml`
- `.github/workflows/reconcile-adjacent-root-authority-v2.yml`
- `.github/workflows/reconcile-adjacent-root-authority-v3.yml`
- `.github/workflows/reconcile-adjacent-root-authority-v4.yml`
- `.github/workflows/reconcile-adjacent-root-authority-v5.yml`
- `.github/workflows/reconcile-adjacent-root-authority-v6.yml`

Therefore **none of the later adjacent Policy/Evaluator/Graph/Resource/Output semantic reconciliation has landed on the branch**. The current durable project content remains the already-qualified root-control reconciliation plus temporary workflow scaffolding and this handoff document.

## Durable work already completed before the current temporary workflows

PR #127 already contains the durable `REF-ROOT-CONTROL-01` core reconciliation:

- CUDA-MCGS is the canonical live project/application-profile name, with the legacy UMCGS filename retained only as a compatibility pointer.
- Production chess-engine authority is explicitly externalized to `iteathen/UCI-Arena-Vector`; `CHESS-0001` remains a downstream CUDA-MCGS consumer/conformance profile.
- SPEC-0006 and Search IR 0.2.0 Session representation distinguish four operations:
  - initial root;
  - minimum-work advance;
  - general reroot;
  - non-structural attention.
- Advance cannot contain reroot-only admission, prepare/abort, transform/reset/reclassification, traversal, reclamation or eager cleanup.
- Reroot transaction commit order follows prepare order and abort is the exact reverse.
- Reroot work scopes exactly cover selected progress work classes and enforce authority-scope/stale-disposition consistency.
- Active Search IR schema repository identities and the Composer package authority use `iteathen/CUDA-MCGS` rather than `iteathen/UMCGS`.
- `CUDA_MCGS_NODE` is the primary validator override while `UMCGS_NODE` is preserved only as compatibility.
- Current routing/status docs were reconciled so `REF-GRAPH-01` remains blocked until PR #127 integrates to protected `main` and is read back.

The last durable reconciliation was validated with:

- Composer reference: 878/878;
- semantic reference: 49/49;
- accepted Search IR 0.1.0 regression: 18/18;
- full `scripts/verify-docs.sh` verification.

The durable evidence identities immediately before the adjacent semantic experiment were:

```text
representation/composition: b189211a774e6d4bd9b27ee8a744ed80743cfe45f3564be93deb310383efc906
Domain projection:          321f913bea8b74b9dfef3b01341b148734c0448cb97c69f7e2b170b9985f26a0
semantic reference:         7bdc38b6c1c12ed45cfeaeeb91546fb39ffd6d10117d1d8261be136d0062cd3c
```

These remain the branch's durable evidence until the adjacent reconciliation actually lands.

## Review finding that opened the current adjacent reconciliation

Author-side review found live proposal/registry vocabulary that still contradicted ADR-0022 even though Session itself was reconciled:

1. `agent_files/SYSTEM_REGISTRY.md` still described Session ownership as a generic structural root transaction.
2. SPEC-0008 Policy still described advance as performing reuse/reset/transform/invalidate classification.
3. SPEC-0009 Evaluator still described advance as performing evaluator-state/cache reuse classification.
4. SPEC-0011 and the Resource Search IR profile still used the generic resource purpose `root-update` for protected admission capacity.
5. Adjacent Graph/Output wording still inherited generic root-update/root-advance language that could imply the wrong owner or operation.

The intended correction is deliberately narrow and follows LEGO ownership boundaries:

- retained-state reuse/reset/transform/invalidate classification belongs to **reroot**;
- **advance performs no retained-state reclassification or allocation**;
- advance preserves only already-compatible selected-descendant state through existing provenance and lazily supersedes occurrence-scoped sibling state;
- protected capacity used to admit a structural authority change is a **reroot-admission reserve**, never an advance reserve;
- Output publication freshness across advance is determined from existing authority/provenance, not by invoking output-state reclassification;
- no new owner, operation or native mechanism is introduced.

## Ephemeral v6 proof — validated but not pushed

The most advanced one-shot workflow was:

```text
.github/workflows/reconcile-adjacent-root-authority-v6.yml
```

Workflow run:

```text
33035522196
```

Job:

```text
98397272232
```

That job successfully applied the intended adjacent semantic reconciliation in its ephemeral checkout, regenerated the full dependent identity chain, and reached all validation gates successfully.

Second-pass Composer result:

```text
expected=878 discovered=878 executed=878 passed=878 failed=0
```

Full semantic-reference result:

```text
expected=49 discovered=49 executed=49 passed=49 failed=0
```

Accepted Search IR 0.1.0 regression:

```text
expected=18 discovered=18 executed=18 passed=18 failed=0
```

Full repository verification also reported:

```text
documentation, selective-authority-reading, discoverability, organization,
engineering-judgment, focus-branch, universal-token-backpressure, testing,
agent-governance, and cleanup checks passed
```

The ephemeral adjacent-reconciliation identities were:

```text
contract set:               2a3ded0b25f59d6f6a5dfffefefceae73f25e9df0558953b0bea29201d47c10d
requirement coverage:       fe510fb69890b070ae6e7dfc60bd3e113a3f7e6354fa6bfcd8e48a6336c6c07a
framework selection:        7ca1ae5a7d2bc4cba7ba3187add38f233ec145bee1bf5d4959c7a217f2d958de
representation/composition: bbe8645637244392d0ffe9347417204dad3e675efccdc29043fd197e1d12cd56
Domain projection:          3ec9521040b12f69a3d5bcd308ec540c3d1c4d2d870f409c9027738c132423d8
semantic reference:         7afd8930a9af337be0ecbc5bff930ea21444ddb1afa6bf261c083db5cb95bd5b
```

These identities are useful expected outputs for the next run but **must not be cited as durable branch evidence until the resulting source/fixture changes are committed and pushed**.

## Exact remaining failure

v6 failed only after all validation completed, during temporary workflow cleanup:

```text
rm '.github/workflows/reconcile-adjacent-root-authority.yml'
fatal: pathspec '.github/workflows/reconcile-adjacent-root-authority.yml' did not match any files
```

Cause: the flattened wrapper retained the base workflow's self-delete and then appended a second cleanup command that attempted to remove the same path again. The first removal succeeded; the duplicate `git rm` failed under `set -euo pipefail`, so no commit or push occurred.

This is a **workflow-harness cleanup defect only**. Do not reopen or rewrite the proven semantic migration unless a subsequent clean run exposes a new semantic failure.

## Next safe action

Resume by fixing only the cleanup tail of the one-shot adjacent reconciliation.

Recommended approach:

1. Reuse the proven v6 semantic migration unchanged.
2. Replace all duplicate cleanup commands with one idempotent cleanup, for example a single `git rm --ignore-unmatch` covering every temporary `reconcile-adjacent-root-authority*.yml` workflow including the new wrapper itself.
3. Require the same fail-closed sequence:
   - first discovery Composer pass may expose stale selected-profile identities;
   - derive/update the framework-selection identities;
   - second Composer pass must be 878/878;
   - Domain projection export;
   - semantic reference must be 49/49;
   - accepted Search IR regression must remain 18/18 through `verify-docs`;
   - full repository verification must pass;
   - stale `root-update`, stale advance-reclassification wording and stale structural-root-transaction registry wording checks must pass;
   - remove all temporary workflows;
   - commit and push the durable reconciliation.
4. Confirm the branch ref actually advances and verify all temporary reconciliation workflows are absent from the durable tree.
5. Read back the durable evidence identities. They should match the v6 values above if no source semantics change.
6. Trigger ordinary exact-head PR validation on the durable tree, including Ubuntu and Windows Search IR jobs. A no-tree-change trigger commit is acceptable if needed.
7. Review PR #127 again against `main@173765cf86fc6ab91364d8d52eb6a045dcbe2346`.
8. Only after exact-head CI and review are clean should PR #127 leave draft/merge. After protected-main integration, read back the merge and exact evidence, then make `REF-GRAPH-01` dependency-ready.

## Do not do next

Do not:

- start `REF-GRAPH-01` before PR #127 integration/read-back;
- treat the v6 ephemeral identities as already integrated evidence;
- preserve the temporary one-shot workflow files in the final PR;
- weaken Session's four-operation separation;
- move reuse classification back into advance;
- let advance consume the reroot-admission reserve;
- add native code to solve this documentation/reference reconciliation;
- move production chess-engine ownership back into CUDA-MCGS;
- modify accepted Search IR 0.1.0 semantics or historical ADR/evidence records merely to match current proposal identities.

## Current PR state at checkpoint

PR #127 is still:

- open;
- draft;
- mergeable;
- based on `main@173765cf86fc6ab91364d8d52eb6a045dcbe2346`.

The ordinary documentation workflow on temporary head `97fb96d...` passed, but that is not final qualification because the durable adjacent reconciliation has not yet been pushed and the temporary workflow files remain on the branch.

This handoff is the stop point.