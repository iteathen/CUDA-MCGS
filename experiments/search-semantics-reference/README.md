# CUDA-MCGS search-semantics reference experiment

**Status:** Informational

This CUDA-free experiment is the behavioral reference/conformance capsule for `ENGINE-REFERENCE-01`. It is intentionally composed from owner-local LEGO bricks rather than one reference engine. Each brick consumes only normalized or already-qualified inputs owned elsewhere, proves one semantic ownership boundary, and leaves native/CUDA mechanism selection downstream.

## Current portfolio state

The isolated `experimental/portfolio` authority currently includes the accepted Graph owner chain through cleanup, the Policy reference, and the corrected shared Evaluator fixture from PR #162. Protected `main` is a separate release surface and is not changed by this experiment lane.

The active candidate is `REF-EVALUATOR-01`:

- source authority: `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`;
- candidate branch: `ref/evaluator-01`;
- qualified semantic/documentation checkpoint: `5172dfc822d2164250f57b7f4fd68fc31fdff2c1`;
- permanent qualification run: `33552385704`.

That checkpoint passed the complete permanent gate, including the Evaluator reference, Windows and Ubuntu Search IR references, governance, Policy, every Graph owner reference, and aggregate fail-closed `verify`. `REF-EVALUATOR-01` remains a candidate until exact-head review/authorization and isolated-portfolio integration are complete.

## Evaluator ownership boundary

The Evaluator reference directly owns the 37 `SPEC-0009` requirements classified to `ENGINE-REFERENCE-01`:

- `EVAL-REQUEST-001..010` — stale-safe request/incarnation lifecycle, atomic admission, coalescing, readiness and exact terminal disposition;
- `EVAL-BATCH-001..010` — finite batching, batch-sensitive/independent semantics, continuation/workspace ownership, failure domains, stale-safe scatter and mutable-state ordering;
- `EVAL-CACHE-001..008` — optional zero-residue cache selection, complete result-affecting keys, collision verification, lifecycle/generation, freshness, pressure/protection and invalidation;
- `EVAL-REUSE-001..006` — explicit reroot reuse dispositions, root/history/artifact semantics, admitted reroot actions and non-wrapping generations;
- `EVAL-CLEANUP-001..003` — complete runtime disposition, quarantine of uncertain/conflicting evidence and zero residue after evaluator/capability removal.

It does **not** own Resource admission policy, Progress scheduling/fairness, Session root authority, Output publication/ranking, Domain/Graph identity, Policy backup meaning, CUDA-JS mechanism realization or CUDA-JS-Tensor math. Those are injected facts or downstream owners.

Other SPEC-0009 requirement families such as proposal/open-action-space semantics, structural profile normalization, resident/native execution and cross-owner integration remain governed by their declared Composer, cross-specification, native or later `ENGINE-REFERENCE-01` evidence owners. Passing this Evaluator leaf is not full SPEC-0009 acceptance.

## Evaluator profile binding

The reference does not invent a second evaluator schema. It first runs the exact Search IR Composer and exports the normalized Evaluator profiles into an owner-local immutable projection. The projection must match Composer-published profile identities exactly before semantic cases run.

Current qualified bindings are:

- Composer representation/composition evidence: `1285fa9abdf70ba6902aae0d0f86a14b9a23b2c56b2aa8f5168970c0003124f2` (`727811` canonical bytes);
- Evaluator profile projection: `1e3da52e43c498b0e53107383a9ff48345e71d097208ddb7c414cef06e5c7fa1` (`155494` canonical bytes).

The projection contains five normalized synthetic Evaluator profiles: combined/cached, proposal-only/stateless, proof-evaluation, analytic-evaluation, and a batch-sensitive resumable evaluator that simultaneously selects mutable state and cache with `state-generation` in the cache key.

## Run

Use Node.js 26 or newer.

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-evaluator-profiles.mjs
node scripts/run-evaluator-reference.mjs
```

Focused cases use the same exact upstream projection, for example:

```bash
node scripts/run-evaluator-reference.mjs --case evaluator-scatter-incarnation
node scripts/run-evaluator-reference.mjs --case evaluator-cache-full-key-collision
node scripts/run-evaluator-reference.mjs --case evaluator-cache-mutable-state-invalidation
```

Generated machine evidence under `build/` is disposable. Checked-in fixtures/source, retained workflow artifacts and exact evidence identities are the durable coordinates.

## Case-bank structure

The Evaluator cases are split by semantic responsibility instead of one oversized test file:

- request lifecycle/readiness;
- batch/workspace/continuation semantics;
- cache correctness, protection and invalidation;
- reroot reuse and cleanup/quarantine;
- lifecycle edge cases;
- mutation sensitivity.

Explicit mutants remove the stale-incarnation scatter fence, required-capability readiness fence and cache full-key verification. The normal suite must distinguish each mutant, so a green result is evidence that the reference detects those semantic failures rather than merely exercising happy paths.

## Current result

Permanent workflow `33552385704` on exact checkpoint `5172dfc822d2164250f57b7f4fd68fc31fdff2c1` recorded:

- Composer `881/881`;
- Evaluator `30/30` expected/discovered/executed/passed;
- all `37/37` direct Evaluator requirements covered;
- `0` failed or skipped cases;
- Evaluator evidence `4a6c5d85fa7fc87b900ff81b4e86d99984eb49bcb531b696d4754236fbcad6af` (`18051` canonical bytes).

The required `evaluator-cache-mutable-state-invalidation` falsifier now proves that committing a new mutable evaluator-state generation makes old-generation cache entries non-hittable while protected entries remain safely retiring until protection drains.

See [`RESULTS.md`](RESULTS.md) and [`../../docs/handoffs/2026-09-01-ref-evaluator-01-mutable-cache-qualification.md`](../../docs/handoffs/2026-09-01-ref-evaluator-01-mutable-cache-qualification.md) for exact evidence and the development-cycle record.

## Claim limits

Passing this reference proves only the bounded CUDA-free Evaluator semantics above. It does not qualify a native evaluator, CUDA memory ordering/atomics, CUDA-JS execution, CUDA-JS-Tensor kernels, physical scheduling, performance, search strength, production lowering, SDK/release readiness, protected-main acceptance or multi-GPU behavior.
