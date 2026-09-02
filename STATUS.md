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

`REF-TERMINAL-SLICE-01` / #184 is complete and integrated. Its authorized source head was `547e4632aa9e3d4b3cd45db8056f215d6212de5c`; PR #187 is the exact-head review record, PR #188 is the authorized same-head transport, and the integration commit is `3766353d5fa264067e33ae6798c632ffd65494ef`. The later state-only portfolio frontier `079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd` advances work selection to Session without changing that terminal-slice semantic tree.

#184 proved one complete finite Session-absent, extension-absent CUDA-free lifecycle through public owner facts, including evaluator-present/absent variants, materially different legal schedules, cancellation/must-drain behavior, Resource conservation/cleanup reserve, terminal Output ordering/borrow cleanup, exact Session/Stage/Channel deletion and no host observe-decide-write/relaunch requirement. It remains candidate/reference evidence only.

## Active candidate — #181 / REF-SESSION-01

Branch:

`ref/session-01`

Exact integrated base:

`experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`

Exact semantic head before this current-state-only reconciliation:

`c554e51423600f1c6bd7f52b5ee1fb6a2b7826fa`

Semantic tree:

`a9ae9970fe2b9e37a2223bb89c19942ba6d1e5bc`

Session owns external command order/replay/idempotence/provenance, Session identity/incarnation, initial-root authority coordination, already-ready successor advance authority/provenance, reroot transaction coordination, attention provenance, bounded observation coordination, cancellation/completion, finite Session counters and Session cleanup. Search identity/incarnation are injected public provenance facts used only to bind Output publications to the active execution. Session does not duplicate Domain root validity, Graph occurrence/storage/reclamation, source-owner reuse meaning, Resource accounting, Progress scheduling/closure, Output payload/snapshot/publication authority, Framework lifecycle, CUDA-JS mechanisms or product semantics.

The branch adds no native code, scheduler, workflow DSL, product meaning or private sibling-owner state.

## Session semantic qualification at c554e514…

The exact semantic head passed PR Session workflow `33689816193`, Terminal Slice `33689816259`, and Framework `33689816270`. The documentation/current-state reconciliation after that semantic head must receive its own final exact-head full matrix.

- CI self-verification gate: pass;
- Composer: `881/881`;
- Domain/Graph/Policy/Evaluator/Resource/Progress/Output/Session normalized profile exports: pass;
- Session advance/teardown boundary gate: pass;
- coupled terminal Session-absent regression: `6/6`;
- Session behavioral reference: `22/22`;
- direct SPEC-0006 ENGINE-REFERENCE obligations: `38/38` executed and covered;
- Session evidence: `9bca68e4cf19ea62742a606a75bab82c1146a832c6cf9ef57ef9cf0bd6a1c431` (`16175` canonical bytes);
- artifact: `9869565953`;
- artifact digest: `sha256:e32621394f322273146336f17e8233867d26634a4408a9b6f67cf27e55976c55`.

## Preserved Session red-before-green evidence

The permanent case bank/gates retain the useful review falsifiers rather than weakening them for green:

- advance incorrectly changed root incarnation — test-only head `dc5b2c363933476b9580c267ba58c6f79ee56966`, run `33682215069`, artifact `9866689484`;
- Session invented a parallel Output observation-publication contract instead of consuming Output-owned facts — test-only head `1341d784329c03b7f697fa62a5dc6fba1237cd4f`, run `33682862655`, artifact `9866932885`;
- Session could publish terminal provenance with a live observation borrow — test-only head `f7a78dda0e9be4bd52a8dd28db82710be059c5e2`, run `33683367794`, artifact `9867120969`;
- cancellation could abort prepared reroot state before command admission succeeded — test-only head `f4a8d21dd2c53dceba3ec1cdbdbf371f05598f94`, run `33684006773`, artifact `9867359227`;
- the permanent Session CI runner could be conditionally skipped and missing evidence only warned — test-only head `46d105821be7a49063f0bc91cce0ebe4acf570a7`, run `33684533233`;
- malformed untrusted command identity could advance counters before semantic validation — test-only head `d74ab8b9efd5df68e47d7099081c58f743dea12a`, run `33684937813`, artifact `9867706099`, digest `sha256:0aae20cbc391c87b86a82e11d1a1cd09027f0a37abf319da91516b11a4a62409`;
- a same-epoch publication from a foreign Output profile could be admitted as current Session observation evidence — test-only head `3f0e86f871795a5c26a7277210e2685f4264cb80`, run `33688752675`, artifact `9869167043`, digest `sha256:dfc5da2562a399e0550b6af7e139c1bc65e5b4508f87b0d93fe409e8c01e4c48`;
- after that repair, a same-profile/same-epoch publication from a foreign Session identity could still be admitted — test-only head `d569fd1cbb3374697751e1b9772bd43c1fbd845b`, run `33689574707`, artifact `9869474428`, digest `sha256:1ed1b6427c45afd57dc7f418ccee98297e42439c462aa7ca76ae3fcdb8783c7d`.

The current green implementation keeps those boundaries explicit: advance stays within one root incarnation, Session consumes Output-owned ready-publication facts and binds them to the normalized Output profile plus exact injected Session/search provenance before state mutation, completion waits for borrow quiescence, cancellation admission precedes mutation, the CI gate is non-bypassable, and command validation precedes state mutation.

## Current gate

This file, `next_step.yaml`, and the experiment README/RESULTS are current-state-only reconciliation after the final review-discovered provenance repair. Their final reconciliation commit necessarily advances the branch head without changing the qualified Session semantics above.

The resulting documentation-inclusive exact head must therefore:

1. pass the permanent Session, Framework, terminal-slice and full repository/documentation PR gates on that exact head;
2. receive a fresh whole-diff author review with no blocking finding;
3. stop for **fresh repository-owner authorization for that exact head and exact base** before any integration.

If the known connector draft-state defect prevents clearing the reviewed PR's draft bit, preserve the draft PR as the reviewed record and use only the accepted same-head/same-base transport after authorization. Transport is never authorization.

## Remaining reference sequence

After separately authorized guarded integration and readback of #181:

1. #30 / `REF-STAGE-01` — eight-route Stage gap audit/reference.
2. #33 / `REF-CHANNEL-EVIDENCE-01` — reuse/gap-audit the existing 41-route Channel logical oracle; no second interpreter.
3. #36 / `REF-INTEGRATE-01` — reconcile one exact product-neutral Search IR/Composer/reference packet.
4. #122 — protected atomic semantic acceptance; no production lowering before protected readback.

Downstream chess/UCI/model/Book Forge/Timing Evidence/tablebase/product meaning remains in downstream products such as UCI-Arena-Vector. Generic CUDA mechanisms remain CUDA-JS-owned; generic dense Tensor mathematics remain CUDA-JS-Tensor-owned.
