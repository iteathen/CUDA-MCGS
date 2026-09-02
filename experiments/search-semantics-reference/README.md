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

`2ed5bccd04ed95e96fc8bc2a5e957daef339db2e`

Semantic tree:

`3b57fb0998e8f7b271c58a90e2f5df3b5fa7798c`

Session owns only external command ordering/replay/idempotence/provenance, initial-root authority coordination, already-ready successor advance, reroot transaction coordination, attention provenance, bounded observation request/borrow coordination, cancellation/completion, finite counters and cleanup.

It does **not** own Domain root validity, Graph occurrence/storage/reclamation, source reuse semantics, Resource accounting, Progress scheduling/closure, Output payload/snapshot/publication semantics, Framework lifecycle, CUDA mechanism or product meaning.

## Current Session qualification

Permanent Session workflow `33685204052` passed on semantic head `2ed5bccd…`:

- CI self-verifier: pass;
- Composer: `881/881`;
- all required owner profile projections: pass;
- Session advance boundary: pass;
- terminal Session-absent coupled regression: `6/6`, evidence `6bf37be20b02051f30aafec4c50c1d3262af28b41bf537f8825679fa5667e4c3`;
- Session cases: `20/20`;
- direct SPEC-0006 ENGINE-REFERENCE obligations: `38/38`;
- Session evidence: `dc737cdf719e51298271209f63941f7c1e8af6426466a1f4dc7fdb7bc72018f3` (`8647` canonical bytes);
- artifact `9867807703`, digest `sha256:03af6fbf452426726b5d1c08a80b952fb5f2f576578391db55da1edbd7fa74e6`.

The whole semantic diff is confined to the Session Composer projection/export, Session owner-local oracle/cases/runner, public wrappers and permanent Session CI gate. No native code, private sibling-owner interpreter, product fixture or host progression loop was introduced.

## Red-before-green provenance

Useful review-discovered red seams are retained in the permanent bank/gates:

1. advance incorrectly consumed a new root incarnation — `dc5b2c363933476b9580c267ba58c6f79ee56966`, run `33682215069`;
2. Session invented runtime Output observation truth instead of consuming Output-owned publication facts — `1341d784329c03b7f697fa62a5dc6fba1237cd4f`, run `33682862655`;
3. completion could publish terminal provenance with a live observation borrow — `f7a78dda0e9be4bd52a8dd28db82710be059c5e2`, run `33683367794`;
4. cancellation could mutate prepared reroot state before command admission succeeded — `f4a8d21dd2c53dceba3ec1cdbdbf371f05598f94`, run `33684006773`;
5. the permanent Session gate could conditionally skip its runner and merely warn on missing evidence — `46d105821be7a49063f0bc91cce0ebe4acf570a7`, run `33684533233`;
6. malformed untrusted command identity could mutate counters before semantic validation — `d74ab8b9efd5df68e47d7099081c58f743dea12a`, run `33684937813`.

Neither the cases nor their owner boundaries were weakened for green.

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

This README and the other current-state files are intentionally updated after semantic qualification. Their commit advances the candidate head without changing Session semantics.

The resulting documentation-inclusive #181 PR head must pass both the permanent Session workflow and full repository/documentation PR matrix, then receive a fresh complete-diff author review. Stop after that at the exact-head repository-owner authorization boundary. The known draft-state connector defect may require a same-head/same-base transport only **after** authorization; transport does not substitute for review or authorization.

## Next semantic seam

Only after #181 is separately authorized, guarded-integrated and read back does #30 / `REF-STAGE-01` become dependency-ready. Then #33 Channel evidence, #36 final reference integration and #122 protected atomic acceptance follow.

## Claim limits

Passing these CUDA-free references does not establish protected proposal acceptance, production lowering, native CUDA behavior, CUDA-JS compatible-pair support, physical scheduling, performance, stable SDK/release readiness or product/chess/UCI/model/Book Forge/Timing Evidence/tablebase behavior.
