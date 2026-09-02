# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-09-01

## Current candidate

The current integration candidate is PR #169, the shared Composer/Progress stop-disposition authority correction, reconstructed from accepted `experimental/portfolio@80cbc05a54234ae41201e90db8737472db62fff8` after `REF-EVALUATOR-01` was integrated.

The semantic/evidence checkpoint before this documentation reconciliation is:

`fix/36-progress-stop-disposition-authority@df8241020340eaec55656972fad3e98f43b321d9`

Normal workflow `33583779152` passed the complete current fail-closed gate on that checkpoint:

- Governance verification: success;
- Search IR reference on Ubuntu: success;
- Search IR reference on Windows: success;
- Policy reference: success;
- Graph NODE, EDGE, REF, PATH, ROOT, RECLAIM, ADVANCE occurrence and CLEANUP: success;
- Evaluator reference: success;
- aggregate `verify`: success.

## Shared Progress authority result

The Composer/Profile authority now fails closed on stop-disposition/terminal-state mismatch:

- `abandon` -> `abandoned`;
- `cancel` -> `cancelled`;
- `stale-dispose` -> `stale-disposed`;
- `service` and `drain` remain nonterminal service/drain contracts.

The correction remains in the shared normalization owner. No Progress reference-consumer implementation or scheduler/native/product behavior is included.

## Red provenance falsifier

The first current-base reconstruction was:

`f72f16d2a4c26ab14fcd195451388cec59ae4d8d`

Normal workflow `33583664572` intentionally retained the newly integrated Evaluator fixture's old exact Composer identity. All shared semantic jobs remained green, while Evaluator stopped at its exact pre-semantic provenance guard.

The run established the new authoritative generated coordinates:

- Composer representation/composition evidence: `00045fcb77d8690bfc44bcb5b8d46d55f92db7a924203fff5c8e12b1c8710eb0` (`727811` canonical bytes);
- Evaluator normalized-profile projection: `3c3609a53177401270da372add3c9ca56dfef1442e571b591efe9093b1bc17f2` (`155494` canonical bytes).

The Evaluator fixture was then rebound only to those two exact identities. The case bank, oracle source, mutable-state/cache implementation, and expected cases remained unchanged.

## Exact current evidence

On `df8241020340eaec55656972fad3e98f43b321d9`, workflow `33583779152` recorded:

### Composer

- capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- cases: `881/881` passed;
- representation/composition SHA-256: `00045fcb77d8690bfc44bcb5b8d46d55f92db7a924203fff5c8e12b1c8710eb0`;
- canonical bytes: `727811`.

### Evaluator projection

- schema: `cuda-mcgs.search-ir-composer-evaluator-profile-projection/0.2.0`;
- SHA-256: `3c3609a53177401270da372add3c9ca56dfef1442e571b591efe9093b1bc17f2`;
- canonical bytes: `155494`;
- five exact Composer-normalized Evaluator profiles.

### Evaluator semantic evidence

- capsule: `cuda-mcgs-evaluator-reference-v0.2.0`;
- scope: `full-evaluator-reference`;
- cases: `30/30` expected/discovered/executed/passed;
- direct SPEC-0009 Evaluator requirements: `37/37` covered;
- failed/skipped/undiscovered: `0`;
- SHA-256: `c1229a47e9c4b036bd9e20af7f8f3fd8827c60f8cdf82d0cb55a4f0231050635`;
- canonical bytes: `18051`.

Retained workflow artifact:

- run: `33583779152`;
- artifact: `9829312993` (`evaluator-reference`);
- archive digest: `sha256:d9f1d724edf229820ccce79c6cc4b3da611354d6293a7e500e97eb5a7d67bd1c`.

## Evaluator semantic preservation

After the provenance-only rebind, all 30 Evaluator cases passed, including cache full-key collision, mutable-state cache invalidation, stale-incarnation scatter, batching/workspace continuation, quarantine, reroot reuse and cleanup. This demonstrates that #169 changes shared Composer identity/provenance but does not require a second Evaluator semantic repair.

## Historical Evaluator qualification

The earlier `REF-EVALUATOR-01` qualification at the pre-#169 Composer identity remains historical evidence. Its exact development record is preserved in `docs/handoffs/2026-09-01-ref-evaluator-01-mutable-cache-qualification.md`; it is not rewritten to impersonate current evidence.

## Remaining integration gates

PR #169 still requires:

1. final exact-head qualification after this informational documentation reconciliation;
2. fresh exact-head review/owner authorization because both base and SHA changed after the earlier review;
3. guarded integration to `experimental/portfolio`;
4. post-integration readback before dependent Progress/Resource reference branches are reconstructed.

## Claim limits

This packet proves only CUDA-free shared Composer/Progress authority coherence plus continued Evaluator semantic validity under the new exact provenance. It does not establish production lowering (#122), native CUDA/atomic behavior, CUDA-JS compatible-pair support, performance, physical scheduling, stable SDK/release readiness, or product/chess semantics.