# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-09-02

## Authority lanes

Protected semantic authority remains `main@3ecac11e3576bd063760bc9572f79bea78acd031`.

The integrated CUDA-free candidate/reference line remains `experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`. Candidate/reference integration is not protected #122 acceptance, native CUDA qualification, production readiness, or product support.

`REF-TERMINAL-SLICE-01` / #184 is complete and integrated. Its authorized source was `547e4632aa9e3d4b3cd45db8056f215d6212de5c`; PR #187 is the review record, PR #188 the authorized same-head transport, and integration commit `3766353d5fa264067e33ae6798c632ffd65494ef` has the authorized tree.

## Active candidate — #181 / REF-SESSION-01

Branch: `ref/session-01`

Exact base: `experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`

Review PR: #189 (draft review record)

Latest fully qualified content checkpoint before this tracker-only finalization:

`61fce562f97d475c140ac33e9e5c9f226abef570`

tree:

`d6681d2c441453266fcfd4b8c696db7bb72d1a64`

That tree is byte-for-byte identical to the previously documentation-inclusive `bc4902aad716cb8daf7dcafc0d5058c885399659` tree. Four intervening exploratory/revert commits produce zero net file differences from `bc4902…`; no branch force-reset was used.

Session remains a bounded external-lifecycle owner. It owns command order/replay/idempotence/provenance, Session identity/incarnation, root/advance authority coordination, reroot transaction coordination, attention provenance, bounded observation coordination, cancellation/completion, finite counters, and cleanup. Domain validity, Graph storage/reclamation, Resource accounting, Progress scheduling/closure, Output snapshot/publication meaning, Framework lifecycle, CUDA mechanisms, and product semantics remain with their natural owners.

No native code, product semantics, generic scheduler, workflow DSL, or host observe-decide-write/relaunch loop was introduced.

## Exact-head qualification at 61fce562…

All PR workflows passed on exact head `61fce562f97d475c140ac33e9e5c9f226abef570`:

- Session behavioral reference `33692905307` — success;
- Terminal slice `33692905267` — success;
- Framework lifecycle `33692905299` — success;
- full repository/documentation matrix `33692905302` — success.

The Session run proved:

- Session CI self-gate: pass;
- Composer: `881/881`;
- all required owner profile projections: pass;
- advance/reroot/teardown boundary gate: pass;
- terminal Session-absent regression: `6/6`;
- Session reference: `25/25`;
- direct SPEC-0006 ENGINE-REFERENCE obligations: `38/38`;
- Session evidence: `850ec70294295a605ee3f449c1dccb91d87795a00b6bf966cde36f8fcc76f6bf` (`18579` canonical bytes);
- artifact: `9870707549`;
- artifact digest: `sha256:381746482638e01643935b787d867a869c3969da10e68f293d2e1982ccac13d1`.

## Invalid exploratory capacity probe

During final review, an exploratory falsifier at `87c135ba905ff340f575df3448463f727bdc7d33` attempted to treat `profile.commands.capacity` as a lifetime replay-ledger bound and to count rejected pre-ignition initial-root identities against it. Run `33692373122` failed only the new Session case.

A narrow attempted repair at `7576aed00a14456ef9a029d436a651d87b0c2f11` then caused legal observation traffic to pressure before the Output observation profile's own pending-request limit; run `33692621320` isolated that contradiction to the Session reference.

Reassessment against SPEC-0006 and the normalized Composer profile showed the premise was wrong: `commands.capacity` is sourced from Progress external-wait `maxPendingCommands`, while initial-root establishment is a separate pre-ignition lifecycle operation. The invalid test and repair were removed by forward revert `61fce562…`, restoring the exact prior reviewed tree. These two failed runs are preserved as diagnostic history, not accepted conformance reds.

## Preserved decisive reds

The permanent gates/cases retain the valid review-discovered failures rather than weakening them:

- advance changed root incarnation — `dc5b2c363933476b9580c267ba58c6f79ee56966`, run `33682215069`;
- Session invented Output observation truth — `1341d784329c03b7f697fa62a5dc6fba1237cd4f`, run `33682862655`;
- completion allowed a live observation borrow — `f7a78dda0e9be4bd52a8dd28db82710be059c5e2`, run `33683367794`;
- cancellation mutated reroot before admission — `f4a8d21dd2c53dceba3ec1cdbdbf371f05598f94`, run `33684006773`;
- Session CI runner could be skipped — `46d105821be7a49063f0bc91cce0ebe4acf570a7`, run `33684533233`;
- malformed command identity mutated counters before validation — `d74ab8b9efd5df68e47d7099081c58f743dea12a`, run `33684937813`;
- foreign Output profile provenance was accepted — `3f0e86f871795a5c26a7277210e2685f4264cb80`, run `33688752675`;
- foreign Session provenance was accepted — `d569fd1cbb3374697751e1b9772bd43c1fbd845b`, run `33689574707`;
- stale advance authority was accepted — `3a00cacb58cc244b0b1918e3d40dc18ea3448875`, run `33690115667`;
- stale reroot authority was accepted — `5e3864f854483d989815044ce7f5fd4aa36d4438`, run `33690463348`;
- strict reroot authority exposed stale case composition — `9edc258b7aa3336a1c868c1d779baaecac0f3809`, run `33690589366`;
- invalid reroot authority leaked harness canonicalization instead of typed Session rejection — `2a6fe270d44a1cd91dd72de13b066200988f2c92`, run `33690963232`;
- changed replay after typed command rejection was accepted — `31dd36d918c062750361b5ed9fe227854e2c9280`, run `33691410709`.

## Current gate

The Session semantic/reference content has completed exact-head qualification and author-side whole-diff review with no remaining blocker. This tracker-only finalization must itself pass the full exact-head workflows.

After that, stop for fresh repository-owner authorization of the exact final head against exact base `079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`. A clean author review is not authorization.

PR #189 remains the draft review record. If the known connector draft-state defect prevents clearing the draft flag, preserve #189 and use only the accepted same-head/same-base replacement transport after explicit authorization.

Do not start #30 Stage or integrate #181 before that authorization.

## Remaining reference sequence

After separately authorized guarded integration/readback of #181: #30 Stage → #33 Channel evidence → #36 final reference integration → #122 protected atomic semantic acceptance.
