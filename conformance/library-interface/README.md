# Public library interface conformance

This capsule qualifies `interface.library` against `SPEC-0014` using an exact packed/installed candidate. It is intentionally CUDA-free.

The runner:

1. freezes the exact CUDA-MCGS Git revision/tree and uses the currently recorded CUDA-JS metadata only as product-neutral compatible-pair fixture input;
2. builds the already-governed exact-pair Search Compiler capsule to obtain real canonical resolved/composition/package identities without executing CUDA-JS;
3. runs `npm pack` for the exact candidate and installs that tarball into a temporary external-consumer directory;
4. imports `cuda-mcgs`, `cuda-mcgs/search-compiler`, and `cuda-mcgs/runtime/cuda-js` only through package exports;
5. proves facade/direct resolver equivalence, reference-default equivalence, material provenance, content-sensitive identity, owner-classified failure diagnostics, direct compose-function identity, and real Search Program/execution-package construction through the installed complete surface;
6. resolves an explicit versioned Search IR schema;
7. proves private/deep and testing-only package paths are rejected by Node export closure; and
8. removes the temporary pack/install/shim state.

Run:

```bash
node scripts/run-library-interface.mjs
```

A pass does **not** prove a released package, stable 1.0 API, CUDA-JS native execution, physical GPU support, performance, product acceptance, or CUDA-JS #32 completion.
