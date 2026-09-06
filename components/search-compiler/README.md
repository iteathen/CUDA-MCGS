# Search Compiler

The implemented `tool.search-compiler` component normalizes accepted framework/profile selections and composes deterministic restricted Device-JS search programs before execution.

It is stateless across calls and owns no GPU runtime or post-launch search scheduler. Invalid or incompatible input produces no partial valid composition. Schemas and specifications define the semantics it implements.

## Entry points

- [Public component port](index.mjs), also exposed as `cuda-mcgs/search-compiler`.
- [Convenience library facade](../library-interface/README.md).
- [Governing contracts](../../docs/specs/README.md).
- [Owner conformance](../../conformance/search-compiler/README.md).

`src/` is private implementation; `testing.mjs` is conformance-only. CUDA-JS runtime realization is a separate [adapter](../../adapters/runtimes/cuda-js/README.md).

The prerelease API may change. Compiler/reference evidence does not establish native GPU execution.
