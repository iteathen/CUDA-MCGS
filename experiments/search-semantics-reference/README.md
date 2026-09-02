# CUDA-MCGS search-semantics reference experiment

**Status:** Informational

This CUDA-free experiment is the behavioral/reference evidence lane for `ENGINE-REFERENCE-01`. Each brick is owner-local and replaceable: it consumes normalized identities or public facts owned elsewhere, proves one semantic boundary, and leaves native/CUDA realization downstream.

## Current portfolio state

Protected semantic authority remains:

`main@3ecac11e3576bd063760bc9572f79bea78acd031`

The integrated candidate/reference line is:

`experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`

It contains the current Graph reference chain plus Policy, Evaluator, Resource, corrected Progress, Output and Framework evidence, and the integrated complete Session-absent terminal slice from #184. Candidate integration is not protected #122 acceptance.

## Integrated terminal slice

`REF-TERMINAL-SLICE-01` / #184 is complete. Authorized source `547e4632aa9e3d4b3cd45db8056f215d6212de5c` was reviewed on PR #187 and transported unchanged through PR #188 to integration commit `3766353d5fa264067e33ae6798c632ffd65494ef`; the integrated tree exactly matched the authorized source tree.

The slice proves a finite product-neutral CUDA-free lifecycle across public Domain/Graph/Policy/Evaluator/Resource/Progress/Output/Framework facts, including cancellation/must-drain, Resource conservation, terminal publication ordering, terminal borrow cleanup, multiple legal schedules, evaluator-selected/absent variants and exact Session/Stage/Channel/first-product deletion. It does not introduce a universal scheduler or native mechanism.

## Active Session brick

Issue #181 / branch `ref/session-01` constructs `REF-SESSION-01` from exact integrated base:

`experimental/portfolio@079e80a4f30f34c1e534b3b6456d8a6f4d2d31cd`

Exact semantic head before the current-state-only reconciliation:

`c554e51423600f1c6bd7f52b5ee1fb6a2b7826fa`

Semantic tree:

`a9ae9970fe2b9e37a2223bb89c19942ba6d1e5bc`

Session owns only external command ordering/replay/idempotence/provenance, Session identity/incarnation, initial-root authority coordination, already-ready successor advance, reroot transaction coordination, attention provenance, bounded observation request/borrow coordination, cancellation/completion, finite counters and cleanup. Runtime search identity/incarnation are injected public provenance facts used only to reject foreign Output publications.

It does **not** own Domain root validity, Graph occurrence/storage/reclamation, source reuse semantics, Resource accounting, Progress scheduling/closure, Output payload/snapshot/publication semantics, Framework lifecycle, CUDA mechanism or product meaning.

## Current Session qualification

The exact semantic head `c554e514…` passed PR Session workflow `33689816193`, Terminal Slice `33689816259`, and Framework `33689816270`. Its documentation-only reconciliation follows this semantic qualification and must be requalified on the final exact head.

- CI self-verifier: pass;
- Composer: `881/881`;
- all required owner profile projections: pass;
- Session advance/teardown boundary gate: pass;
- terminal Session-absent coupled regression: `6/6`;
- Session cases: `22/22`;
- direct SPEC-0006 ENGINE-REFERENCE obligations: `38/38`;
- Session evidence: `9bca68e4cf19ea62742a606a75bab82c1146a832c6cf9ef57ef9cf0bd6a1c431` (`16175` canonical bytes);
- PR artifact `9869565953`, digest `sha256:e32621394f322273146336f17e8233867d26634a4408a9b6f67cf27e55976c55`.

The whole semantic diff is confined to the Session Composer projection/export, Session owner-local oracle/cases/runner, public wrappers and permanent Session CI gate. No native code, private sibling-owner interpreter, product fixture or host progression loop was introduced.

## Red-before-green provenance

Useful review-discovered red seams are retained in the permanent bank/gates:

1. advance incorrectly consumed a new root incarnation — `dc5b2c363933476b9580c267ba58c6f79ee56966`, run `33682215069`;
2. Session invented runtime Output observation truth instead of consuming Output-owned publication facts — `1341d784329c03b7f697fa62a5dc6fba1237cd4f`, run `33682862655`;
3. completion could publish terminal provenance with a live observation borrow — `f7a78dda0e9be4bd52a8dd28db82710be059c5e2`, run `33683367794`;
4. cancellation could mutate prepared reroot state before command admission succeeded — `f4a8d21dd2c53dceba3ec1cdbdbf371f05598f94`, run `33684006773`;
5. the permanent Session gate could conditionally skip its runner and merely warn on missing evidence — `46d105821be7a49063f0bc91cce0ebe4acf570a7`, run `33684533233`;
6. malformed untrusted command identity could mutate counters before semantic validation — `d74ab8b9efd5df68e47d7099081c58f743dea12a`, run `33684937813`;
7. a same-epoch publication from a foreign Output profile could be admitted as current Session observation evidence — `3f0e86f871795a5c26a7277210e2685f4264cb80`, run `33688752675`, artifact `9869167043`, digest `sha256:dfc5da2562a399e0550b6af7e139c1bc65e5b4508f87b0d93fe409e8c01e4c48`;
8. after that repair, a same-profile/same-epoch publication from a foreign Session identity could still be admitted — `d569fd1cbb3374697751e1b9772bd43c1fbd845b`, run `33689574707`, artifact `9869474428`, digest `sha256:1ed1b6427c45afd57dc7f418ccee98297e42439c462aa7ca76ae3fcdb8783c7d`.

The green repair keeps the selected Session observation profile as coordination authority while requiring the Output-owned ready publication to bind to the normalized top-level Output profile and the exact injected search/Session provenance before Session request state can mutate. Session does not reconstruct or reinterpret Output payload/snapshot meaning.

## Run

Use Node.js 26 or newer:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-session-profiles.mjs
node scripts/run-terminal-slice-reference.mjs
node scripts/run-session-reference.mjs
```

The permanent CI lane additionally runs `scripts/verify-session-ci-gate.mjs` and `scripts/verify-session-advance-boundary.mjs` before the Session reference.

Generated `build/` evidence is disposable. Checked-in fixtures/source, workflow artifacts, exact source SHAs and content-sensitive evidence identities are the durable coordinates.

## Current gate

This README and the other current-state files are intentionally updated after the final review-discovered provenance repair. Their commit advances the candidate head without changing the qualified Session behavior above.

The resulting documentation-inclusive #181 PR head must rerun the permanent Session, Terminal Slice, Framework and full repository/documentation PR gates, then receive a fresh complete-diff author review. Stop after that at the exact-head repository-owner authorization boundary. The known draft-state connector defect may require a same-head/same-base transport only **after** authorization; transport does not substitute for review or authorization.

## Next semantic seam

Only after #181 is separately authorized, guarded-integrated and read back does #30 / `REF-STAGE-01` become dependency-ready. Then #33 Channel evidence, #36 final reference integration and #122 protected atomic acceptance follow.

## Claim limits

Passing these CUDA-free references does not establish protected proposal acceptance, production lowering, native CUDA behavior, CUDA-JS compatible-pair support, physical scheduling, performance, stable SDK/release readiness or product/chess/UCI/model/Book Forge/Timing Evidence/tablebase behavior.
