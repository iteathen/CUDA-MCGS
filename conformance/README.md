# CUDA-MCGS conformance

This directory contains reference, package, adapter, and compatible-pair checks. Conformance code is evidence support and is not a production dependency.

| Check | Scope |
| --- | --- |
| [Search Compiler](search-compiler/README.md) | CUDA-free normalization, composition, identity, and deletion |
| [Library interface](library-interface/README.md) | Packed/installed public exports and facade equivalence |
| [CUDA-JS adapter](cuda-js-runtime-adapter/README.md) | Portable compatibility, translation, failure, and cleanup |
| [Exact compatible pair](cuda-js-compatible-pair/README.md) | Portable falsifiers and the separate physical GPU runner |

The [Search IR reference](../experiments/search-ir-reference/README.md) and [behavioral reference](../experiments/search-semantics-reference/README.md) supply additional CUDA-free evidence.

Each linked README gives prerequisites and its entry point. Portable passes do not establish native CUDA support, performance, or product readiness.

For adding cases and retaining evidence, follow the [testing policy](../agent_files/general_foundation/TESTING.md).
