# CUDA-MCGS Search IR reference experiment

This disposable, CUDA-free experiment implements the strict Search IR 0.1.0 normalizer and deterministic semantic reference required by [`SPEC-0002`](../../docs/specs/SPEC-0002-search-ir-and-reference-semantics.md).

Run it with exact Node 26.7.0:

```bash
node scripts/run-search-ir-reference.mjs
```

The capsule checks one canonical baseline, object-key and semantic-set ordering independence, minimum capacities, eight invalid mutations, and the seven stable SPEC-0001 conformance families. It writes ignored evidence to `experiments/search-ir-reference/build/evidence.json`.

The reference never imports the CUDA-only prototype, CUDA-JS, a GPU library, or a platform-specific representation. Matching Windows/Linux results prove only Search IR normalization and deterministic reference semantics. They do not prove CUDA lowering, native Linux CUDA, a production scheduler, performance, search quality, or a compatible runtime pair.

## Files

- `fixtures/baseline.search-ir.json` — canonical valid IR fixture;
- `fixtures/boundary-capacities.json` — minimum positive-capacity overlay;
- `fixtures/invalid-mutations.json` — stable fail-closed cases;
- `fixtures/expected-identity.json` — checked-in canonical digest;
- `src/normalize.mjs` — strict normalization and canonical identity;
- `src/reference.mjs` — independent deterministic graph/resource/publication reference;
- `run.mjs` — consolidated capsule and ignored evidence writer.

Production code must not import this experiment. It may be superseded only after accepted production owners provide equivalent or stronger conformance with provenance.
