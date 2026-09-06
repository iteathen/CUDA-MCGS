# Connect Four MCGS prototype

This disposable CUDA-free experiment implements standard 7-by-6 Connect Four and a bounded Monte Carlo Graph Search baseline for testing domain and search behavior.

It includes exact transposition identity, parent-edge statistics, seeded rollouts, finite node/edge limits, read-only root ranking, and reroot reuse. It deliberately omits search-strength optimizations and learned evaluation.

## Run

Requires Node.js; the recorded experiment used Node 22.16.0. From the repository root:

```bash
node experiments/connect4-mcgs-prototype/run.mjs
```

The runner prints case results and an execution summary. See [the implementation and cases](run.mjs) and [results](RESULTS.md) for details.

This is a product-specific reference, not a production component or evidence of native CUDA, optimal play, or performance. Its historical reroot behavior does not define the framework's current root-control contracts. Future promotion requires independent review under the [accepted specifications](../../docs/specs/README.md).
