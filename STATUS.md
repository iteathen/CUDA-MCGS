# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-09-02

## Authority lanes

Protected semantic authority remains:

`main@3ecac11e3576bd063760bc9572f79bea78acd031`

The integrated CUDA-free candidate/reference line is:

`experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`

Candidate/reference integration is not protected #122 acceptance. Production lowering, native CUDA qualification, an exact CUDA-JS compatible pair, performance and downstream product behavior remain separate later gates.

## Integrated reference frontier

The experimental line contains the current product-neutral Graph reference chain plus Policy, Evaluator, Resource, corrected Progress, Output and Framework reference evidence.

`REF-TERMINAL-SLICE-01` / #184 is also complete and integrated. Its authorized source head was `547e4632aa9e3d4b3cd45db8056f215d6212de5c`; PR #187 is the exact-head review record, PR #188 is the authorized same-head transport, and the integration commit is `3766353d5fa264067e33ae6798c632ffd65494ef`. The later state-only portfolio frontier `079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd` advances work selection to Session without changing that terminal-slice semantic tree.

#184 proved one complete finite Session-absent, extension-absent CUDA-free lifecycle through public owner facts, including evaluator-present/absent variants, materially different legal schedules, cancellation/must-drain behavior, Resource conservation/cleanup reserve, terminal Output ordering/borrow cleanup, exact Session/Stage/Channel deletion and no host observe-decide-write/relaunch requirement. It remains candidate/reference evidence only.

## Active candidate — #181 / REF-SESSION-01

Branch:

`ref/session-01`

Exact integrated base:

`experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`

Exact semantic head before this current-state-only reconciliation:

`2ed5bccd04ed95e96fc8bc2a5e957daef339db2e`

Semantic tree:

`3b57fb0998e8f7b271c58a90e2f5df3b5fa7798c`

Session owns only external command order/replay/idempotence/provenance, initial-root authority coordination, already-ready successor advance authority/provenance, reroot transaction coordination, attention provenance, bounded observation coordination, cancellation/completion, finite Session counters and Session cleanup. It does not duplicate Domain root validity, Graph occurrence/storage/reclamation, source-owner reuse meaning, Resource accounting, Progress scheduling/closure, Output payload/snapshot/publication authority, Framework lifecycle, CUDA-JS mechanisms or product semantics.

The complete branch diff from the exact base is confined to the Session profile projection/export, Session owner-local oracle/case bank/runner, public wrappers and permanent Session CI gate. It adds no native code, scheduler, workflow DSL, product meaning or private sibling-owner state.

## Session semantic qualification at 2ed5bccd…

Permanent Session workflow `33685204052` passed on the exact semantic head:

- CI self-verification gate: pass;
- Composer: `881/881`;
- Domain/Graph/Policy/Evaluator/Resource/Progress/Output/Session normalized profile exports: pass;
- Session advance boundary: pass;
- coupled terminal Session-absent regression: `6/6`, evidence `6bf37be20b02051f30aafec4c50c1d3262af28b41bf537f8825679fa5667e4c3`;
- Session behavioral reference: `20/20`;
- direct SPEC-0006 ENGINE-REFERENCE obligations: `38/38` executed and covered;
- Session evidence: `dc737cdf719e51298271209f63941f7c1e8af6426466a1f4dc7fdb7bc72018f3` (`8647` canonical bytes);
- Composer evidence: `a6abe9cb7b22f15b4e57fb89cbe0dd0a22e8539beff3e98f9f18f67c421e2bfe` (`727811` canonical bytes);
- artifact: `9867807703`;
- artifact digest: `sha256:03af6fbf452426726b5d1c08a80b952fb5f2f576578391db55da1edbd7fa74e6`.

## Preserved Session red-before-green evidence

The permanent case bank/gates retain the useful review falsifiers rather than weakening them for green:

- advance incorrectly changed root incarnation — test-only head `dc5b2c363933476b9580c267ba58c6f79ee56966`, run `33682215069`, artifact `9866689484`;
- Session invented a parallel Output observation-publication contract instead of consuming Output-owned facts — test-only head `1341d784329c03b7f697fa62a5dc6fba1237cd4f`, run `33682862655`, artifact `9866932885`;
- Session could publish terminal provenance with a live observation borrow — test-only head `f7a78dda0e9be4bd52a8dd28db82710be059c5e2`, run `33683367794`, artifact `9867120969`;
- cancellation could abort prepared reroot state before command admission succeeded — test-only head `f4a8d21dd2c53dceba3ec1cdbdbf371f05598f94`, run `33684006773`, artifact `9867359227`;
- the permanent Session CI runner could be conditionally skipped and missing evidence only warned — test-only head `46d105821be7a49063f0bc91cce0ebe4acf570a7`, run `33684533233`; this red intentionally failed before Session evidence generation;
- malformed untrusted command identity could advance counters before semantic validation — test-only head `d74ab8b9efd5df68e47d7099081c58f743dea12a`, run `33684937813`, artifact `9867706099`, digest `sha256:0aae20cbc391c87b86a82e11d1a1cd09027f0a37abf319da91516b11a4a62409`.

The current green implementation keeps those boundaries explicit: advance stays within one root incarnation, runtime observation freshness comes from Output publication metadata plus the normalized selected observation profile, completion waits for borrow quiescence, cancellation admission precedes mutation, the CI gate is non-bypassable, and command validation precedes state mutation.

## Current gate

This file, `next_step.yaml`, and the experiment README/RESULTS are current-state-only reconciliation after semantic qualification. Their commit necessarily advances the branch head without changing Session semantics.

The resulting documentation-inclusive exact head must therefore:

1. be opened as the #181 review candidate against exact base `experimental/portfolio@079e80a4…`;
2. pass the permanent Session workflow and the full repository/documentation PR matrix on that exact head;
3. receive a fresh whole-diff author review with no blocking finding;
4. stop for **fresh repository-owner authorization for that exact head and exact base** before any integration.

If the known connector draft-state defect prevents clearing the reviewed PR's draft bit, preserve the draft PR as the reviewed record and use only the accepted same-head/same-base transport after authorization. Transport is never authorization.

## Remaining reference sequence

After separately authorized guarded integration and readback of #181:

1. #30 / `REF-STAGE-01` — eight-route Stage gap audit/reference.
2. #33 / `REF-CHANNEL-EVIDENCE-01` — reuse/gap-audit the existing 41-route Channel logical oracle; no second interpreter.
3. #36 / `REF-INTEGRATE-01` — reconcile one exact product-neutral Search IR/Composer/reference packet.
4. #122 — protected atomic semantic acceptance; no production lowering before protected readback.

Downstream chess/UCI/model/Book Forge/Timing Evidence/tablebase/product meaning remains in downstream products such as UCI-Arena-Vector. Generic CUDA mechanisms remain CUDA-JS-owned; generic dense Tensor mathematics remain CUDA-JS-Tensor-owned.
