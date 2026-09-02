# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-09-01

## Current candidate

`REF-EVALUATOR-01` extends the isolated `ENGINE-REFERENCE-01` portfolio with the deterministic Evaluator semantic owner. It is based on exact `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`; protected `main` is not part of this candidate.

Qualified semantic/documentation checkpoint: `ref/evaluator-01@5172dfc822d2164250f57b7f4fd68fc31fdff2c1`.

Permanent workflow `33552385704` passed the full fail-closed gate on that checkpoint:

- Evaluator reference: success;
- governance verification: success;
- Search IR reference on Ubuntu: success;
- Search IR reference on Windows: success;
- Policy reference: success;
- Graph NODE, EDGE, REF, PATH, ROOT, RECLAIM, ADVANCE occurrence and CLEANUP: success;
- aggregate `verify`: success.

The Evaluator job used Node `26.7.0` on `ubuntu-latest` and recorded:

- `30/30` expected/discovered/executed/passed Evaluator cases;
- `0` failed, required-skipped, conditional-skipped, optional-skipped, undiscovered or selection-skipped cases;
- all `37/37` direct `SPEC-0009` `ENGINE-REFERENCE-01` obligations exercised.

## Exact evidence identities

Upstream Composer representation/composition evidence:

- SHA-256 `1285fa9abdf70ba6902aae0d0f86a14b9a23b2c56b2aa8f5168970c0003124f2`;
- `727811` canonical bytes;
- Composer `881/881` passed.

Evaluator normalized-profile projection:

- schema `cuda-mcgs.search-ir-composer-evaluator-profile-projection/0.2.0`;
- SHA-256 `1e3da52e43c498b0e53107383a9ff48345e71d097208ddb7c414cef06e5c7fa1`;
- `155494` canonical bytes;
- five exact Composer-normalized Evaluator profiles.

Evaluator semantic evidence:

- capsule `cuda-mcgs-evaluator-reference-v0.2.0`;
- scope `full-evaluator-reference`;
- SHA-256 `4a6c5d85fa7fc87b900ff81b4e86d99984eb49bcb531b696d4754236fbcad6af`;
- `18051` canonical bytes;
- status `pass`.

Retained workflow artifact from run `33552385704`: `evaluator-reference`, artifact `9817946620`, archive digest `sha256:a13f03c31e08f0ef92f37c1d58cf3fd0625c9647a394c28455a9bc27063bd6f5`.

## Direct requirement coverage

The evidence registry derives the owned requirement IDs directly from `SPEC-0009` and cross-checks them against `schemas/search-ir/0.2.0/requirement-coverage.json`:

- `EVAL-REQUEST-*`: `10/10`;
- `EVAL-BATCH-*`: `10/10`;
- `EVAL-CACHE-*`: `8/8`;
- `EVAL-REUSE-*`: `6/6`;
- `EVAL-CLEANUP-*`: `3/3`.

Any direct requirement missing a mapped case makes the reference fail before execution evidence can be accepted. Other SPEC-0009 families remain assigned to their declared structural, cross-specification, Composer, native, or later reference evidence owners; this leaf does not claim whole-contract acceptance.

## Important falsifiers passed

The current case bank proves, among other things:

- a stale batch result cannot mutate a replacement request/result-slot incarnation;
- a ready one-item partial batch progresses without a host flush despite a larger maximum batch size;
- batch and continuation workspace leases release exactly once and are bounded;
- exact continuation retries are idempotent and no-progress/conflicting resumes are rejected without state mutation;
- combined requests remain non-ready until every required capability is ready or terminally disposed;
- batch-independent grouping/order/inactive padding is semantically invariant while batch-sensitive context enters identity;
- item-independent and whole-batch failure domains remain distinct;
- cache hash collisions are resolved by complete canonical key comparison;
- failed, protected, retiring and invalidated cache entries cannot masquerade as ready hits;
- cache and epoch generations remain exact beyond 64-bit ranges rather than wrapping into stale aliases;
- the batch-sensitive resumable mutable evaluator exercises cache pressure and mutable-state cache invalidation together;
- committing mutable state generation `1` makes cache entries keyed to prior `state-generation` non-hittable before the new generation is published;
- reroot reuse actions are explicitly classified and failed reroot admission preserves prior accepted state;
- root advance consumes retained-validity facts without secretly rerunning reroot classification;
- conflicting publication and uncertain mutable-state updates quarantine evidence rather than manufacturing ready state;
- evaluator removal leaves zero runtime residue once owned state is terminal.

## Mutation sensitivity

Three deliberate mutants are required to diverge from the qualified behavior:

1. remove the request-incarnation fence before scatter — stale output mutates the replacement request;
2. allow incomplete required-capability readiness — a combined request becomes ready after one required capability;
3. trust a cache hash without full-key verification — a forced collision returns the wrong entry.

All three mutants are detected by the checked-in case bank.

## Development-cycle falsification record

After PR #162 made the fifth Composer evaluator simultaneously resumable, mutable and cached, PR #160 initially remained bound to the old profile projection. That identity-only mismatch was rebound first.

Permanent workflow `33552079770` then reached the new `evaluator-cache-mutable-state-invalidation` case and failed `29/30` because an old `state-generation` cache entry remained a hit after mutable state advanced. The repair reused the existing Evaluator-owned `invalidateCacheFact` lifecycle inside `commitMutableState()` rather than adding a new cache mechanism. The focused falsifier passed in workflow `33552200681`, and the full final checkpoint subsequently passed `30/30` in workflow `33552385704`.

See [`../../docs/handoffs/2026-09-01-ref-evaluator-01-mutable-cache-qualification.md`](../../docs/handoffs/2026-09-01-ref-evaluator-01-mutable-cache-qualification.md) for the exact assess → research → reassess → plan → implement → qualification record.

## Ownership / claim limits

This evidence is intentionally narrower than a production evaluator. It proves only Evaluator-owned request/incarnation, finite batch/workspace, cache, reroot-reuse and cleanup semantics for the 37 direct `ENGINE-REFERENCE-01` obligations.

Domain/Graph identity and ready-input facts, Resource admission/pressure, Progress service opportunity, Session advance facts and Policy consumption are injected immutable facts. Proposal/open-space completion beyond the existing cross-owner checks, external Output publication/ranking, native release/acquire and atomic realization, CUDA-JS mechanisms, CUDA-JS-Tensor math, physical scheduling, performance, search strength, production lowering, protected-main acceptance and multi-GPU behavior remain downstream.
