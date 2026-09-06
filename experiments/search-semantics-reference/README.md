# Search semantics reference

Provides CUDA-free behavioral oracles and an integration gate for the accepted semantic/reference packet. The integration layer consumes owner evidence without becoming another search interpreter.

## Run

Use Node.js 26 or newer from a repository checkout. The command regenerates the evidence chain and runs the integration/mutation gates. Physical CUDA, performance, and product acceptance remain separate.

From the repository root:

```bash
node scripts/run-engine-reference-integration.mjs
```

Generated evidence stays in ignored build storage. See the [owning interface/contracts](../../docs/specs/README.md) for exact meaning and [current status](../../STATUS.md) for outstanding work.

[Historical evidence notes](EVIDENCE_HISTORY.md) retain the earlier detailed case and integration record.
