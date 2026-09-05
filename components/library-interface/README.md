# Library Interface

`interface.library` is CUDA-MCGS's prerelease progressive-disclosure boundary. It owns public call ergonomics only; it does not normalize search semantics, create a runtime, own CUDA-JS compatibility, or participate after ignition.

The package-root facade exposes `resolve`, `tryResolve`, `compose`, `tryCompose`, `referenceGenerator`, and `libraryConstants`.

- `resolve(profileTemplate)` uses only the Search Compiler-owned neutral `referenceGenerator`.
- `resolve(profileTemplate, generator)` passes the explicit generator to the same canonical Search Compiler path.
- `tryResolve` delegates validation classification to Search Compiler and returns no partial result on failure.
- `compose` and `tryCompose` are direct re-exports of the canonical Search Compiler functions, not wrappers or alternate implementations.

Complete consumers may bypass/delete the facade and import `cuda-mcgs/search-compiler`. Runtime realization is selected independently through `cuda-mcgs/runtime/cuda-js`, which remains the public `integration.cuda-js` adapter and still requires an injected public CUDA-JS namespace when used. Versioned Search IR schemas are available through the package's explicit schema subpaths.

This component is governed by [`SPEC-0014`](../../docs/specs/SPEC-0014-public-library-interface.md) and [`ADR-0020`](../../docs/decisions/ADR-0020-complete-library-and-resolved-defaults.md).

Qualification:

```bash
node scripts/run-library-interface.mjs
```

The capsule packs and installs the exact candidate into a temporary external-consumer directory. It is CUDA-free evidence only. It does not qualify native execution, physical GPU behavior, a released npm package, stable 1.0 SDK compatibility, performance, or product readiness.
