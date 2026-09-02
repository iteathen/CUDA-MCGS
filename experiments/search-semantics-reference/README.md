# CUDA-MCGS search-semantics reference experiment

**Status:** Informational

This CUDA-free experiment is the behavioral/reference evidence lane for `ENGINE-REFERENCE-01`. Each brick is owner-local and replaceable: it consumes normalized identities or public facts owned elsewhere, proves one semantic boundary, and leaves native/CUDA realization downstream.

## Authority and integrated base

Protected semantic authority remains `main@3ecac11e3576bd063760bc9572f79bea78acd031`.

The integrated candidate/reference base remains `experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`. Candidate integration is not protected #122 acceptance.

`REF-TERMINAL-SLICE-01` / #184 is already integrated: authorized source `547e4632aa9e3d4b3cd45db8056f215d6212de5c`, review PR #187, transport PR #188, integration `3766353d5fa264067e33ae6798c632ffd65494ef` with exact authorized-tree equality.

## Active Session brick

Issue #181 / `ref/session-01` constructs `REF-SESSION-01` from exact base `079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`.

Latest fully qualified content checkpoint before this tracker-only finalization:

`61fce562f97d475c140ac33e9e5c9f226abef570`

tree `d6681d2c441453266fcfd4b8c696db7bb72d1a64`.

That tree is exactly equal to the prior documentation-inclusive `bc4902aad716cb8daf7dcafc0d5058c885399659` tree despite preserved exploratory/revert history between them.

Session owns command ordering/replay/idempotence/provenance, Session identity/incarnation, initial-root and advance authority coordination, reroot transaction coordination, attention provenance, bounded observation coordination, cancellation/completion, finite counters, and cleanup. Current root authority plus search/session identity are public provenance inputs, not replacement Domain/Graph/Output authority.

Session does not own Domain validity, Graph storage/reclamation, source reuse meaning, Resource accounting, Progress scheduling/closure, Output payload/snapshot/publication semantics, Framework lifecycle, CUDA mechanisms, or product meaning.

## Exact-head qualification

PR workflows on exact head `61fce562…` passed:

- Session behavioral reference `33692905307`;
- Terminal slice `33692905267`;
- Framework lifecycle `33692905299`;
- full repository/documentation matrix `33692905302`.

The Session workflow proved:

- CI self-gate: pass;
- Composer `881/881`;
- all required owner projections: pass;
- advance/reroot/teardown boundary gate: pass;
- terminal Session-absent coupled reference `6/6`;
- Session reference `25/25`;
- all 38 direct SPEC-0006 ENGINE-REFERENCE routes executed;
- evidence `850ec70294295a605ee3f449c1dccb91d87795a00b6bf966cde36f8fcc76f6bf` over `18579` canonical bytes;
- artifact `9870707549`, digest `sha256:381746482638e01643935b787d867a869c3969da10e68f293d2e1982ccac13d1`.

The permanent case bank includes rejected-command replay: an exact replay after a typed terminal rejection returns the original typed outcome, while changed input under the same command ID is rejected. This permanently covers the replay defect exposed at `31dd36d918c062750361b5ed9fe227854e2c9280` / run `33691410709`.

Generated `build/` evidence remains disposable; checked-in sources/cases, workflow artifacts and evidence identities are the durable coordinates.

## Invalid exploratory probe retained as history

A later exploratory test at `87c135ba905ff340f575df3448463f727bdc7d33` tried to interpret normalized `commands.capacity` as a lifetime replay-history bound and counted rejected initial-root requests against it. That assumption was not supported by the normalized profile: the field is sourced from Progress external-wait `maxPendingCommands`, while initial-root establishment is a separate pre-ignition lifecycle operation.

The test run `33692373122` and attempted repair run `33692621320` are therefore diagnostic history, not accepted conformance reds. Forward revert `61fce562…` restored the exact prior reviewed tree; no branch history was rewritten.

## Decisive red seams retained

The permanent cases/gates retain the valid review-discovered failures for root-incarnation preservation, Output publication ownership/profile/session provenance, observation borrow quiescence, cancellation admission, CI-gate integrity, pre-mutation validation, stale advance/reroot authority, normalized teardown order, typed authority validation, and rejected-command replay.

No accepted falsifier was weakened to obtain the 25-case green result.

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

The semantic/reference content has completed exact-head qualification and fresh author-side whole-diff review with no blocker. This tracker-only finalization must itself pass the permanent Session, Terminal, Framework and full repository/documentation workflows.

Then stop for fresh repository-owner authorization of that exact final head/base. PR #189 remains the draft review record; the known draft-state connector defect does not authorize integration.

Only after guarded #181 integration/readback does #30 Stage become dependency-ready, followed by #33 Channel evidence, #36 final reference integration and #122 protected atomic semantic acceptance.

## Claim limits

This is CUDA-free product-neutral reference evidence. It does not establish protected proposal acceptance, production lowering, native CUDA behavior, physical concurrency/performance, stable SDK support, or chess/UCI/model/Book Forge/Timing Evidence/tablebase behavior.
