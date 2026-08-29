# CUDA-MCGS Evaluator author-review remediation checkpoint — 2026-08-29

## Purpose

Preserve the exact safe state and the unqualified author-review remediation material discovered after the last fully green Evaluator head. This checkpoint is recovery/continuation state only. Do not merge or promote it directly.

## Last fully green active head

`ref/evaluator-01@d32aea7d54075515c2f3b842417591a608a21b8c`

This head completed the permanent `documentation` workflow run `33258260326` successfully, including the Evaluator peer job, the complete existing Graph/Policy regressions, Windows and Ubuntu Search IR, and aggregate `verify`.

PR #160 targets `experimental/portfolio`; protected `main` remains out of scope.

## Why work continued after green CI

Author-side semantic review correctly treated green CI as evidence rather than proof and found additional SPEC-0009 gaps:

1. request binding needed to preserve requester identity, result-slot identity, input-lease identity, admission reservation, graph reference, root epoch, work epoch and exact normalized input/compatibility/coalescing keys;
2. request coalescing needed explicit purpose/root/work/capability-set fencing, not only a convenient shared identity;
3. `EVAL-BATCH-003` required a richer compatibility packet covering selected capability/output set, input shape class, artifact/state generation, precision/execution semantics, batch-sensitive context and workspace/resource class.

These findings invalidate any merge-readiness claim for `d32aea7d...` even though that head is a safe green recovery point.

## Preserved remediation artifacts

This checkpoint makes the unattached candidate blobs reachable under `docs/handoffs/checkpoint-artifacts/2026-08-29-evaluator-author-review/`.

- `evaluator.mjs.candidate` — blob `98cf91b2ebed4cdbe0048434a99867d6ff711278`; contains the intended request-binding/coalescing/batch-compatibility hardening, but **must not be used as-is** because author pre-commit review found a shadowed `capability` identifier in `selectedCapabilityProfiles` and an omitted `state-generation` field in `expectedBatchCompatibility`.
- `evaluator-case-support.mjs.candidate` — blob `b66d9fdafb86f41501d2d4d75d4ad90f3e42f26d`; corrected fixture/helper packet including explicit state generation and richer batch compatibility construction.
- `evaluator-request-cases.mjs.candidate` — blob `d2ebfec14da324bac0600dac952afecfffed147e`; strengthened request tests for exact binding, invalid compatibility rejection, coalescing epoch/capability fences and cancellation cleanup.

Earlier intermediate helper blobs `0603c822cbfd05c55f5720fae15074569d02e112` and `7aa60fe3332c174aa7991bfaf3d7822c905d3b03` are superseded by `b66d9fda...` and need not be promoted.

## Exact correction still required before the candidate can replace the green head

In `evaluator.mjs.candidate`:

1. rewrite `selectedCapabilityProfiles` so the callback destructures `capability` as a distinct `capabilityId`, looks up `profileCapabilities.get(capabilityId)`, reports the ID on failure, and returns the looked-up capability object;
2. add `stateGeneration: inputKey['state-generation'] ?? null` to the normalized batch compatibility packet alongside artifact generation.

Then attach the corrected oracle plus the two candidate case/helper modules to `ref/evaluator-01`, run the full permanent workflow, and restart author-side whole-diff review from the new exact head. Any previous review/green-head merge readiness is invalidated by that head change.

## Review gate

Even after a corrected head is fully green, this leaf must not be self-merged. Project review policy requires independent review for difficult publication/cancellation semantics. REF-EVALUATOR-01 directly exercises stale publication, request incarnation, cancellation and reuse safety, so independent review is an objective gate.

## Ownership constraints

Evaluator owns evaluator-local request/incarnation, batch/workspace, cache, reuse and cleanup semantics only. Resource retains global admission/watermark/pressure policy; Progress retains scheduling/fairness/no-progress; Session retains root authority; Output retains external publication; Domain/Graph/Policy retain their own semantics; CUDA-JS owns generic native/CUDA realization; CUDA-JS-Tensor owns generic tensor mathematics.

No native/CUDA code, CUDA-JS private access, Tensor search ownership, product/chess/UCI semantics or protected-main mutation is authorized by this checkpoint.

## Safe resume

Resume from the green `ref/evaluator-01@d32aea7d...`, reconstruct only the two explicit corrections above into the preserved remediation candidate, attach the corrected three-file remediation as one coherent commit, rerun exact-head CI, then redo complete author review and obtain independent review before any merge to `experimental/portfolio`.
