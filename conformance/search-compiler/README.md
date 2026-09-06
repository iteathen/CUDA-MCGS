# Search Compiler conformance

Validates Search IR normalization, composition, identity, deletion, and evidence obligations through the production Search Compiler's explicit testing port.

## Run

Use Node.js 26 or newer from a repository checkout. This is CUDA-free evidence; it does not qualify GPU execution.

From the repository root:

```bash
node scripts/run-search-ir-composer-reference.mjs
```

Generated evidence stays in ignored build storage. See the [owning interface/contracts](../../components/search-compiler/README.md) for exact meaning and [current status](../../STATUS.md) for outstanding work.

[Historical evidence notes](EVIDENCE_HISTORY.md) retain the earlier detailed case and integration record.
