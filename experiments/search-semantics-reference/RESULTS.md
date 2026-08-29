# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-08-29

## Current candidate

`REF-EVALUATOR-01` extends the isolated `ENGINE-REFERENCE-01` portfolio with the deterministic Evaluator semantic owner. It is based on exact `experimental/portfolio@9d87a0004565041cac3c476afef8cde5c6f34eb0`; protected `main` is not part of this candidate.

Semantic checkpoint: `ref/evaluator-01@96984afb1ea34dd09cecbd62bc0bc623895da33e`.

Exact qualification:

- Evaluator reference workflow run `33257574891`: success;
- ordinary documentation/reference workflow run `33257574895`: success;
- Node `26.7.0` on `ubuntu-latest` for the Evaluator reference job;
- `21/21` expected/discovered/executed/passed cases;
- `0` failed, required-skipped, conditional-skipped, optional-skipped, undiscovered or selection-skipped cases;
- all `37/37` direct `SPEC-0009` `ENGINE-REFERENCE-01` obligations exercised.

## Exact evidence identities

Upstream Composer representation/composition evidence:

- SHA-256 `115cceb16db3e4a99944c7228e1d5dff7047f342ddbe63a3e695c027d33e85c8`;
- `727811` canonical bytes.

Evaluator normalized-profile projection:

- schema `cuda-mcgs.search-ir-composer-evaluator-profile-projection/0.2.0`;
- SHA-256 `705f8357a2edfbbbc84f9daae42e601b089778ef5f09b2284a2d2079d4b797a1`;
- `151720` canonical bytes;
- five exact Composer-normalized Evaluator profiles.

Evaluator semantic evidence:

- capsule `cuda-mcgs-evaluator-reference-v0.2.0`;
- scope `full-evaluator-reference`;
- SHA-256 `71320ee94aa0b1eafb8fe403750caffce10046ad3f688fb57c657406e0df2314`;
- `11956` canonical bytes;
- status `pass`.

Retained workflow artifact: `evaluator-reference-evidence`, artifact `9716273696`, artifact digest `sha256:295ed141cc0df530a5c12d78a7c4839233a6703238eb486f7c3ba0b9fdb0e01b`.

## Direct requirement coverage

The evidence registry derives the owned requirement IDs directly from `SPEC-0009` and cross-checks them against `schemas/search-ir/0.2.0/requirement-coverage.json`:

- `EVAL-REQUEST-*`: `10/10`;
- `EVAL-BATCH-*`: `10/10`;
- `EVAL-CACHE-*`: `8/8`;
- `EVAL-REUSE-*`: `6/6`;
- `EVAL-CLEANUP-*`: `3/3`.

Any direct requirement missing a mapped case makes the reference fail before execution evidence can be accepted.

## Important falsifiers passed

The case bank includes the originally selected cross-cutting falsifier:

- a request slot is superseded/reused before an old batch result scatters;
- the stale result is rejected before it can mutate the replacement incarnation;
- a ready one-item partial batch progresses without a host flush despite a larger maximum batch size;
- batch and continuation workspace leases release exactly once;
- old request input/result ownership reaches terminal disposition without residue.

Additional correctness checks include:

- combined requests remain non-ready until every required capability is ready;
- batch-independent grouping/order/inactive padding is semantically invariant;
- batch-sensitive padding/context enters semantic identity;
- item-independent and whole-batch failure domains remain distinct;
- cache hash collisions are resolved by the complete normalized key;
- failed/protected/invalidated cache entries cannot masquerade as ready hits;
- cache and epoch generations remain exact beyond 64-bit ranges rather than wrapping into stale aliases;
- reroot reuse actions are explicitly classified and admission failure preserves prior accepted state;
- root advance consumes retained-validity facts without secretly rerunning reroot classification;
- conflicting publication and uncertain mutable-state updates quarantine evidence rather than manufacturing ready state;
- evaluator removal leaves zero runtime residue once owned state is terminal.

## Mutation sensitivity

Three deliberate mutants are required to diverge from the qualified behavior:

1. remove the request-incarnation fence before scatter — stale output mutates the replacement request;
2. allow incomplete required-capability readiness — a combined request becomes ready after one required capability;
3. trust a cache hash without full-key verification — a forced collision returns the wrong entry.

All three mutants are detected by the checked-in case bank.

## Ownership / claim limits

This evidence is intentionally narrower than a production evaluator. It proves only Evaluator-owned request/incarnation, finite batch/workspace, cache, reroot-reuse and cleanup semantics for the 37 direct `ENGINE-REFERENCE-01` obligations.

Domain/Graph identity and ready-input facts, Resource admission/pressure, Progress service opportunity, Session advance facts and Policy consumption are injected immutable facts. Output publication/ranking, native release/acquire and atomic realization, CUDA-JS mechanisms, CUDA-JS-Tensor math, physical scheduling, performance, search strength, production lowering, protected-main acceptance and multi-GPU behavior remain downstream.
