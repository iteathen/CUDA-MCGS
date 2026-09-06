# Persistent search session prototype

This disposable CUDA-free experiment tests continuous search, live ranking, reroot reuse, stale-work rejection, reclamation, and bounded memory on a small synthetic graph.

It includes transpositions and a cycle, explicit root epochs, slot generations, and finite-capacity failures. Its scalar maximizing policy is an experiment choice, not a universal framework assumption.

## Run

With Node.js available, run from the repository root:

```bash
node experiments/persistent-session-mcgs-prototype/run.mjs
```

The runner needs no network, GPU, or external service and reports discovered/executed case counts. [Results](RESULTS.md) retain the evidence; [run.mjs](run.mjs) contains the model and cases.

The prototype does not establish CUDA ordering, concurrent GPU safety, or performance. Its historical root-control terms do not supersede the [accepted session contracts](../../docs/specs/README.md). Production code must not import it.
