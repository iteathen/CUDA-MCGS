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

Qualified semantic checkpoint before this tracker reconciliation:

`9447146093aa993eb98d0de24db0e9a9a26fef11`

tree:

`9e28e0b67a37aba277155f992b489ad3dc891681`

Session remains a bounded external-lifecycle owner. It owns command order/replay/idempotence/provenance, Session identity/incarnation, root/advance authority coordination, reroot transaction coordination, attention provenance, bounded observation coordination, cancellation/completion, finite counters, and cleanup. Injected search identity/incarnation are public provenance guards only. Domain root validity, Graph storage/reclamation, Resource accounting, Progress scheduling/closure, Output snapshot/publication meaning, Framework lifecycle, CUDA mechanisms, and product semantics remain with their natural owners.

No native code, product semantics, generic scheduler, workflow DSL, or host observe-decide-write/relaunch loop was introduced.

## Qualification at 94471460…

Permanent Session workflow `33690701083` checked out exact head `9447146093aa993eb98d0de24db0e9a9a26fef11` and passed:

- Session CI self-gate: pass;
- Composer: `881/881`;
- all required owner profile projections: pass;
- advance/reroot/teardown boundary gate: pass;
- terminal Session-absent regression: `6/6`;
- Session reference: `23/23`;
- direct SPEC-0006 ENGINE-REFERENCE obligations: `38/38`;
- Session evidence: `eb6fb96a0d3e14908189ede8f065d0863b19065bc717ce0b3c351fe0e79fd3c7` (`16913` canonical bytes);
- artifact: `9869899487`;
- artifact digest: `sha256:af2d6595dcf6257e9dce933f22cb37d59d695d1c11c78f12cde9d54d2c38c1d4`.

The current case bank includes stale-authority rejection for advance, normalized teardown order, exact Output/Session/search provenance, and the earlier lifecycle/resource/borrow/cancellation cases.

## Preserved decisive reds

The permanent gates/cases retain the useful failures rather than weakening them:

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
- strict reroot authority initially exposed six stale case-composition callsites — `9edc258b7aa3336a1c868c1d779baaecac0f3809`, run `33690589366`, artifact `9869859986`.

The `94471460…` case-support repair supplies current public authority to normal reroot histories while explicit stale-authority inputs still override it for negative tests.

## Current gate

This file and the other current-state trackers are documentation-only reconciliation after the qualified semantic checkpoint. Evidence reuse is valid only because the Session evidence key is content-sensitive to its semantic source set and those sources are unchanged by tracker edits.

Before #181 can integrate:

1. freeze the resulting documentation-inclusive head and verify the full repository/documentation PR matrix on that exact head;
2. verify the frozen diff from base and confirm the semantic source tree still matches the qualified `94471460…` checkpoint except for tracker-only changes;
3. complete fresh author-side whole-diff review with no blocker;
4. stop for fresh repository-owner authorization for that exact head/base.

PR #189 remains the draft review record. If the known connector draft-state defect prevents clearing the draft flag, preserve #189 and use only the accepted same-head/same-base transport after authorization.

## Remaining reference sequence

After separately authorized guarded integration/readback of #181: #30 Stage → #33 Channel evidence → #36 final reference integration → #122 protected atomic semantic acceptance.
