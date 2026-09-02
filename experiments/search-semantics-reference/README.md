# CUDA-MCGS search-semantics reference experiment

**Status:** Informational

This CUDA-free experiment is the behavioral/reference evidence lane for `ENGINE-REFERENCE-01`. It is composed from owner-local LEGO bricks: each reference consumes normalized or already-qualified facts owned elsewhere, proves one semantic boundary, and leaves native/CUDA realization downstream.

## Current portfolio state

`experimental/portfolio@80cbc05a54234ae41201e90db8737472db62fff8` contains the accepted Graph reference chain through cleanup, Policy reference, and `REF-EVALUATOR-01` from PR #160. Protected `main` is a separate release/authority surface.

The active integration candidate is shared Composer/Progress authority PR #169 on branch `fix/36-progress-stop-disposition-authority`.

The candidate changes one shared normalization invariant:

- `abandon` requires terminal `abandoned`;
- `cancel` requires terminal `cancelled`;
- `stale-dispose` requires terminal `stale-disposed`;
- `service` and `drain` remain service/drain contracts and do not gain an immediate terminal mapping.

The correction is owned by Composer/Profile normalization. It does not move Progress reference behavior, Evaluator semantics, scheduler topology, native/CUDA mechanisms, or product policy into that owner.

## Evaluator provenance under the shared correction

Because the integrated Evaluator reference binds exact Composer evidence, #169 deliberately revalidated that dependency after the portfolio base advanced.

The first reconstructed head `f72f16d2a4c26ab14fcd195451388cec59ae4d8d` ran the normal repository workflow without changing the Evaluator fixture. Run `33583664572` proved:

- Composer/Domain/Policy/Graph semantics remained green;
- the Progress stop-disposition authority falsifier passed;
- Composer representation/composition evidence changed to `00045fcb77d8690bfc44bcb5b8d46d55f92db7a924203fff5c8e12b1c8710eb0` (`727811` canonical bytes);
- the regenerated Evaluator profile projection changed to `3c3609a53177401270da372add3c9ca56dfef1442e571b591efe9093b1bc17f2` (`155494` canonical bytes);
- Evaluator stopped before semantic execution because its checked-in fixture still named the old Composer evidence.

That was the intended fail-closed provenance falsifier, not an Evaluator semantic failure.

The next head `df8241020340eaec55656972fad3e98f43b321d9` changed only those two frozen Evaluator provenance identities. No Evaluator oracle/source, case list, mutable-state/cache behavior, or ownership rule changed.

Normal workflow `33583779152` then passed the complete gate, including Windows/Ubuntu Search IR, Governance, Policy, all Graph reference jobs, Evaluator, and aggregate `verify`.

Current exact Evaluator bindings under the shared Progress authority are:

- Composer evidence: `00045fcb77d8690bfc44bcb5b8d46d55f92db7a924203fff5c8e12b1c8710eb0` (`727811` bytes);
- Evaluator profile projection: `3c3609a53177401270da372add3c9ca56dfef1442e571b591efe9093b1bc17f2` (`155494` bytes);
- Evaluator evidence: `c1229a47e9c4b036bd9e20af7f8f3fd8827c60f8cdf82d0cb55a4f0231050635` (`18051` bytes);
- Evaluator cases: `30/30` passed, covering all `37/37` direct SPEC-0009 Evaluator reference obligations.

Retained Evaluator artifact from run `33583779152`: artifact `9829312993`, archive digest `sha256:d9f1d724edf229820ccce79c6cc4b3da611354d6293a7e500e97eb5a7d67bd1c`.

## Evaluator ownership boundary

The Evaluator reference owns only the direct `EVAL-REQUEST-*`, `EVAL-BATCH-*`, `EVAL-CACHE-*`, `EVAL-REUSE-*`, and `EVAL-CLEANUP-*` behavior assigned to `ENGINE-REFERENCE-01`. Domain/Graph identity, Resource admission/pressure, Progress service opportunities, Session advance facts, Policy consumption, Output publication, CUDA-JS realization, and CUDA-JS-Tensor math remain separate owners or injected facts.

The shared Composer correction changing an exact upstream identity therefore requires an Evaluator evidence rebind, not an Evaluator semantic rewrite.

## Run

Use Node.js 26 or newer.

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-evaluator-profiles.mjs
node scripts/run-evaluator-reference.mjs
```

Generated `build/` evidence is disposable. Checked-in fixtures/source, retained workflow artifacts, and exact evidence identities are the durable coordinates.

## Historical evidence

The original `REF-EVALUATOR-01` qualification and its development cycle remain preserved in `docs/handoffs/2026-09-01-ref-evaluator-01-mutable-cache-qualification.md`. That handoff is historical evidence and is not rewritten when later shared authority changes provenance.

## Claim limits

Passing these CUDA-free references does not establish #122 production contract acceptance, native CUDA realization, CUDA-JS compatible-pair qualification, physical scheduling, performance, search strength, stable SDK/release readiness, or product behavior. PR #169 is a shared semantic-authority integration candidate until its final exact head is independently reviewed/authorized and integrated.