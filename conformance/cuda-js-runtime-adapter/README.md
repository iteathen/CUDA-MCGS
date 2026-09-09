# CUDA-JS adapter conformance

Exercises compatibility admission, translation, operation lifecycle, failure projection, terminal output delivery, and cleanup against a fake of the public CUDA-JS interface.

## Run

Use Node.js 24 or newer from a repository checkout. No GPU is required; passing does not qualify the physical library pair or change its Node/platform requirements.

From the repository root:

```bash
node scripts/run-cuda-js-runtime-adapter.mjs
```

Generated evidence stays in ignored build storage. See the [owning interface/contracts](../../adapters/runtimes/cuda-js/README.md) for exact meaning and [current status](../../STATUS.md) for outstanding work.
