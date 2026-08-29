# CUDA-MCGS search-semantics reference experiment

**Status:** Informational

This CUDA-free experiment is the behavioral reference/conformance capsule for `ENGINE-REFERENCE-01`. It is intentionally composed from owner-local LEGO bricks rather than one reference engine. Each brick consumes only normalized or already-qualified inputs owned elsewhere, proves one semantic ownership boundary, and leaves native/CUDA mechanism selection downstream.

## Current portfolio state

The isolated `experimental/portfolio` authority currently includes the accepted Graph owner chain through cleanup plus the Policy reference. Protected `main` is a separate release surface and is not changed by this experiment lane.

The active candidate is `REF-EVALUATOR-01`:

- source authority: `experimental/portfolio@9d87a0004565041cac3c476afef8cde5c6f34eb0`;
- candidate branch: `ref/evaluator-01`;
- first projection checkpoint: `91f753061f82f7b61e262d9564fa13a6232f71f7`;
- semantic checkpoint: `96984afb1ea34dd09cecbd62bc0bc623895da33e`;
- exact Node 26.7.0 qualification run: `33257574891`;
- ordinary documentation/reference workflow on the same semantic checkpoint: `33257574895`.

`REF-EVALUATOR-01` remains a candidate until its permanent peer-CI wiring, documentation, review and isolated-portfolio integration are complete.

## Evaluator ownership boundary

The Evaluator reference directly owns the 37 `SPEC-0009` requirements classified to `ENGINE-REFERENCE-01`:

- `EVAL-REQUEST-001..010` — stale-safe request/incarnation lifecycle, atomic admission, coalescing, readiness and exact terminal disposition;
- `EVAL-BATCH-001..010` — finite batching, batch-sensitive/independent semantics, continuation/workspace ownership, failure domains, stale-safe scatter and mutable-state ordering;
- `EVAL-CACHE-001..008` — optional zero-residue cache selection, complete result-affecting keys, collision verification, lifecycle/generation, freshness, pressure/protection and invalidation;
- `EVAL-REUSE-001..006` — explicit reroot reuse dispositions, root/history/artifact semantics, admitted reroot actions and non-wrapping generations;
- `EVAL-CLEANUP-001..003` — complete runtime disposition, quarantine of uncertain/conflicting evidence and zero residue after evaluator/capability removal.

It does **not** own Resource admission policy, Progress scheduling/fairness, Session root authority, Output publication/ranking, Domain/Graph identity, Policy backup meaning, CUDA-JS mechanism realization or CUDA-JS-Tensor math. Those are injected facts or downstream owners.

## Evaluator profile binding

The reference does not invent a second evaluator schema. It first runs the exact Search IR Composer and exports the normalized Evaluator profiles into an owner-local immutable projection. The projection must match Composer-published profile identities exactly before semantic cases run.

Current retained bindings:

- Composer representation/composition evidence: `115cceb16db3e4a99944c7228e1d5dff7047f342ddbe63a3e695c027d33e85c8` (`727811` canonical bytes);
- Evaluator profile projection: `705f8357a2edfbbbc84f9daae42e601b089778ef5f09b2284a2d2079d4b797a1` (`151720` canonical bytes).

The projection contains the five normalized synthetic Evaluator profiles used by the Composer reference, including combined/cached, proposal-only/stateless, proof-evaluation, analytic-evaluation and batch-sensitive/resumable shapes.

## Run

Use Node.js 26 or newer.

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-evaluator-profiles.mjs
node scripts/run-evaluator-reference.mjs
```

Focused cases use the same exact upstream projection:

```bash
node scripts/run-evaluator-reference.mjs --case evaluator-scatter-incarnation
node scripts/run-evaluator-reference.mjs --case evaluator-request-readiness-completeness
node scripts/run-evaluator-reference.mjs --case evaluator-cache-full-key-collision
```

Generated machine evidence under `build/` is disposable. Checked-in fixtures/source, retained workflow artifacts and exact evidence identities are the durable coordinates.

## Case-bank structure

The Evaluator cases are split by semantic responsibility instead of one oversized test file:

- request lifecycle/readiness;
- batch/workspace/continuation semantics;
- cache correctness and reclamation;
- reroot reuse and cleanup/quarantine;
- mutation sensitivity.

Three explicit mutants remove the stale-incarnation scatter fence, required-capability readiness fence and cache full-key verification. The normal suite must detect each mutant, so a green result is evidence that the reference distinguishes the intended semantics rather than merely exercising happy paths.

## Current result

The exact semantic checkpoint passed `21/21` cases and exercised all `37/37` direct requirements with zero skipped or undiscovered cases. The retained Evaluator evidence identity is:

`71320ee94aa0b1eafb8fe403750caffce10046ad3f688fb57c657406e0df2314` (`11956` canonical bytes).

See [`RESULTS.md`](RESULTS.md) for the exact qualification record and claim limits.

## Claim limits

Passing this reference proves only the bounded CUDA-free Evaluator semantics above. It does not qualify a native evaluator, CUDA memory ordering/atomics, CUDA-JS execution, CUDA-JS-Tensor kernels, physical scheduling, performance, search strength, production lowering, SDK/release readiness, protected-main acceptance or multi-GPU behavior.
