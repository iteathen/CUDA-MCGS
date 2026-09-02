# CUDA-MCGS search-semantics reference experiment

**Status:** Informational

This CUDA-free experiment is the behavioral/reference evidence lane for `ENGINE-REFERENCE-01`. Each brick is owner-local and replaceable: it consumes normalized identities or public facts owned elsewhere, proves one semantic boundary, and leaves native/CUDA realization downstream.

## Authority and integrated base

Protected semantic authority remains `main@3ecac11e3576bd063760bc9572f79bea78acd031`.

The integrated candidate/reference base remains `experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`. Candidate integration is not protected #122 acceptance.

`REF-TERMINAL-SLICE-01` / #184 is already integrated: authorized source `547e4632aa9e3d4b3cd45db8056f215d6212de5c`, review PR #187, transport PR #188, integration `3766353d5fa264067e33ae6798c632ffd65494ef` with exact authorized-tree equality.

## Active Session brick

Issue #181 / `ref/session-01` constructs `REF-SESSION-01` from exact base `079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`.

Qualified semantic checkpoint before the current tracker-only reconciliation:

`9447146093aa993eb98d0de24db0e9a9a26fef11`

tree `9e28e0b67a37aba277155f992b489ad3dc891681`.

Session owns command ordering/replay/idempotence/provenance, Session identity/incarnation, initial-root and advance authority coordination, reroot transaction coordination, attention provenance, bounded observation coordination, cancellation/completion, finite counters, and cleanup. Current root authority plus search/session identity are public provenance inputs, not replacement Domain/Graph/Output authority.

Session does not own Domain validity, Graph storage/reclamation, source reuse meaning, Resource accounting, Progress scheduling/closure, Output payload/snapshot/publication semantics, Framework lifecycle, CUDA mechanisms, or product meaning.

## Qualification

Permanent Session workflow `33690701083` checked out exact semantic checkpoint `94471460…` and passed:

- CI self-gate: pass;
- Composer `881/881`;
- all required owner projections: pass;
- Session advance/reroot/teardown boundary gate: pass;
- terminal Session-absent coupled reference `6/6`;
- Session reference `23/23`;
- all 38 direct SPEC-0006 ENGINE-REFERENCE routes executed;
- evidence `eb6fb96a0d3e14908189ede8f065d0863b19065bc717ce0b3c351fe0e79fd3c7` over `16913` canonical bytes;
- artifact `9869899487`, digest `sha256:af2d6595dcf6257e9dce933f22cb37d59d695d1c11c78f12cde9d54d2c38c1d4`.

Generated `build/` evidence remains disposable; checked-in sources/cases, workflow artifacts and evidence identities are the durable coordinates.

## Decisive red seams retained

The permanent case/gate bank retains review-discovered failures for root-incarnation preservation, Output publication ownership/profile/session provenance, observation borrow quiescence, cancellation admission, CI-gate integrity, pre-mutation validation, stale advance authority, normalized teardown order, and stale reroot authority.

The latest stale-reroot falsifier is test-only head `5e3864f854483d989815044ce7f5fd4aa36d4438`, Session run `33690463348`. The strict owner repair then exposed stale ordinary case composition at `9edc258b7aa3336a1c868c1d779baaecac0f3809` / run `33690589366`; `94471460…` fixes only the composition by supplying current public authority by default while explicit stale-authority inputs still override it.

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

The current tracker reconciliation does not change semantic sources covered by the evidence key. Freeze the resulting documentation-inclusive PR head, prove its semantic sources are unchanged from `94471460…`, run/verify the full repository/documentation matrix on that exact head, then perform one fresh complete-diff author review.

Stop after a clean review for fresh repository-owner authorization of that exact head/base. PR #189 remains the draft review record; the known draft-state connector defect does not authorize integration.

Only after guarded #181 integration/readback does #30 Stage become dependency-ready, followed by #33 Channel evidence, #36 final reference integration and #122 protected atomic semantic acceptance.

## Claim limits

This is CUDA-free product-neutral reference evidence. It does not establish protected proposal acceptance, production lowering, native CUDA behavior, physical concurrency/performance, stable SDK support, or chess/UCI/model/Book Forge/Timing Evidence/tablebase behavior.
