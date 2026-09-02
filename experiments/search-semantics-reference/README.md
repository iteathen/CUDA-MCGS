# CUDA-MCGS search-semantics reference experiment

**Status:** Informational

This CUDA-free experiment is the behavioral/reference evidence lane for `ENGINE-REFERENCE-01`. Each brick is owner-local and replaceable: it consumes normalized identities or public facts owned elsewhere, proves one semantic boundary, and leaves native/CUDA realization downstream.

## Authority and integrated base

Protected semantic authority remains `main@3ecac11e3576bd063760bc9572f79bea78acd031`.

The integrated candidate/reference base remains `experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`. Candidate integration is not protected #122 acceptance.

`REF-TERMINAL-SLICE-01` / #184 is already integrated: authorized source `547e4632aa9e3d4b3cd45db8056f215d6212de5c`, review PR #187, transport PR #188, integration `3766353d5fa264067e33ae6798c632ffd65494ef` with exact authorized-tree equality.

## Active Session brick

Issue #181 / `ref/session-01` constructs `REF-SESSION-01` from exact base `079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`.

Qualified semantic checkpoint before final tracker reconciliation:

`51b596ecdc2da1ff2c9c69b4974858d9a42dec88`

tree `9eaff501ff5e14479bae81f3dca8c08b8dafb148`.

Session owns command ordering/replay/idempotence/provenance, Session identity/incarnation, initial-root and advance authority coordination, reroot transaction coordination, attention provenance, bounded observation coordination, cancellation/completion, finite counters, and cleanup. Current root authority plus search/session identity are public provenance inputs, not replacement Domain/Graph/Output authority.

Session does not own Domain validity, Graph storage/reclamation, source reuse meaning, Resource accounting, Progress scheduling/closure, Output payload/snapshot/publication semantics, Framework lifecycle, CUDA mechanisms, or product meaning.

## Qualification

Exact-head PR workflows on `51b596ec…` passed:

- Session behavioral reference `33691899626`;
- Terminal slice `33691899620`;
- Framework lifecycle `33691899664`.

The Session workflow proved:

- CI self-gate: pass;
- Composer `881/881`;
- all required owner projections: pass;
- advance/reroot/teardown boundary gate: pass;
- terminal Session-absent coupled reference `6/6`;
- Session reference `25/25`;
- all 38 direct SPEC-0006 ENGINE-REFERENCE routes executed;
- evidence `06232b783f4b60cd61874f885840191497443139517d62c4b98f0855f4286417` over `20380` canonical bytes;
- artifact `9870343695`, digest `sha256:f35baa0ccb332ec5f5bd58e095269d128eaf0c423768f5d40342d9ad7c1704f1`.

The permanent case bank now includes rejected-command replay: an exact replay after a typed terminal rejection returns the original typed outcome, while changed input under the same command ID is rejected. This permanently covers the replay defect exposed at `31dd36d918c062750361b5ed9fe227854e2c9280` / run `33691410709`.

Generated `build/` evidence remains disposable; checked-in sources/cases, workflow artifacts and evidence identities are the durable coordinates.

## Decisive red seams retained

The permanent cases/gates retain review-discovered failures for root-incarnation preservation, Output publication ownership/profile/session provenance, observation borrow quiescence, cancellation admission, CI-gate integrity, pre-mutation validation, stale advance/reroot authority, normalized teardown order, typed authority validation, and rejected-command replay.

No falsifier was weakened to obtain the 25-case green result.

## Run

Use Node.js 26 or newer:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-session-profiles.mjs
node scripts/run-terminal-slice-reference.mjs
node scripts/run-session-reference.mjs
```

The permanent Session lane additionally runs `scripts/verify-session-ci-gate.mjs` and `scripts/verify-session-advance-boundary.mjs`.

## Current gate

The current tracker reconciliation must not change semantic/test/workflow sources covered by the evidence key. Freeze the resulting documentation-inclusive PR head and compare it to `51b596ec…`; only `STATUS.md`, `next_step.yaml`, and this experiment's `README.md`/`RESULTS.md` may differ.

Then require the full repository/documentation matrix to pass on that exact final head and perform one fresh complete-diff author review of PR #189.

Stop after a clean review for fresh repository-owner authorization of that exact head/base. PR #189 remains the draft review record; the known draft-state connector defect does not authorize integration.

Only after guarded #181 integration/readback does #30 Stage become dependency-ready, followed by #33 Channel evidence, #36 final reference integration and #122 protected atomic semantic acceptance.

## Claim limits

This is CUDA-free product-neutral reference evidence. It does not establish protected proposal acceptance, production lowering, native CUDA behavior, physical concurrency/performance, stable SDK support, or chess/UCI/model/Book Forge/Timing Evidence/tablebase behavior.
