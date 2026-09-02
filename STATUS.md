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

Qualified semantic checkpoint before final tracker reconciliation:

`51b596ecdc2da1ff2c9c69b4974858d9a42dec88`

tree:

`9eaff501ff5e14479bae81f3dca8c08b8dafb148`

Session remains a bounded external-lifecycle owner. It owns command order/replay/idempotence/provenance, Session identity/incarnation, root/advance authority coordination, reroot transaction coordination, attention provenance, bounded observation coordination, cancellation/completion, finite counters, and cleanup. Current root authority and injected search/session identity are public provenance guards only. Domain validity, Graph storage/reclamation, Resource accounting, Progress scheduling/closure, Output snapshot/publication meaning, Framework lifecycle, CUDA mechanisms, and product semantics remain with their natural owners.

No native code, product semantics, generic scheduler, workflow DSL, or host observe-decide-write/relaunch loop was introduced.

## Qualification at 51b596ec…

Exact-head PR workflows passed:

- Session behavioral reference `33691899626` — success;
- Terminal slice `33691899620` — success;
- Framework lifecycle `33691899664` — success.

The Session run proved:

- Session CI self-gate: pass;
- Composer: `881/881`;
- all required owner profile projections: pass;
- advance/reroot/teardown boundary gate: pass;
- terminal Session-absent regression: `6/6`;
- Session reference: `25/25`;
- direct SPEC-0006 ENGINE-REFERENCE obligations: `38/38`;
- Session evidence: `06232b783f4b60cd61874f885840191497443139517d62c4b98f0855f4286417` (`20380` canonical bytes);
- artifact: `9870343695`;
- artifact digest: `sha256:f35baa0ccb332ec5f5bd58e095269d128eaf0c423768f5d40342d9ad7c1704f1`.

The 25th permanent case proves the replay contract after typed terminal rejection: exact replay returns the original typed outcome, while changed input under the same command ID is rejected. This is the durable case for the earlier replay defect exposed at `31dd36d918c062750361b5ed9fe227854e2c9280` / run `33691410709`.

## Preserved decisive reds

The permanent gates/cases retain the review-discovered failures rather than weakening them:

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

The current-state trackers are being reconciled after the exact semantic checkpoint above. Their commits must not change Session semantic/test/workflow sources.

Before #181 can integrate:

1. freeze the resulting documentation-inclusive head and compare it to `51b596ec…`; only `STATUS.md`, `next_step.yaml`, and the experiment `README.md`/`RESULTS.md` may differ after the semantic checkpoint;
2. require the full repository/documentation PR matrix to pass on that exact final head;
3. complete one fresh author-side whole-diff review of PR #189 with no blocker;
4. stop for fresh repository-owner authorization for that exact head/base.

PR #189 remains the draft review record. If the known connector draft-state defect prevents clearing the draft flag, preserve #189 and use only the accepted same-head/same-base transport after authorization.

## Remaining reference sequence

After separately authorized guarded integration/readback of #181: #30 Stage → #33 Channel evidence → #36 final reference integration → #122 protected atomic semantic acceptance.
