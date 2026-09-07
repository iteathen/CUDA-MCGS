# Search Compiler

The implemented `tool.search-compiler` component is the **single public owner** of canonical pre-ignition normalization and deterministic Search Program/execution-package composition for accepted CUDA-MCGS contracts.

It is stateless across calls and owns no GPU runtime or post-ignition scheduler. Invalid or incompatible input produces no partial valid composition. Schemas and accepted specifications remain semantic authority; the compiler implements them rather than becoming a second semantic owner.

## Recursive private LEGO structure

The public Search Compiler is an encapsulated parent LEGO. Its `src/` modules are private child LEGOs with deliberately narrower reasoning surfaces; callers must not drill through the public parent to depend on them.

| Private child | Owned implementation responsibility |
| --- | --- |
| `accepted-authority.mjs` | normalize the accepted contract/catalog authority supplied to composition |
| `domain.mjs` | domain-profile normalization and canonical identity |
| `graph.mjs` | graph-profile normalization and canonical identity |
| `policy.mjs` | policy-profile normalization and canonical identity |
| `evaluator.mjs` | evaluator-profile normalization and canonical identity |
| `resource.mjs` | resource-profile normalization and canonical identity |
| `progress.mjs` | progress-profile normalization and canonical identity |
| `output.mjs` | output-profile normalization and canonical identity |
| `session.mjs`, `stage.mjs`, `channel.mjs` | optional session/stage/channel profile normalization |
| `program-package*.mjs` | canonical Program Package, Search Program and execution-package composition |
| `composer*.mjs` | composition orchestration/publication over the already-owned child results |
| `foundation.mjs`, `validation.mjs`, `diagnostics.mjs` | owner-local validation/foundation mechanics shared only inside the parent |

The child modules are **not public components** and do not gain independent package/API authority. Semantic lanes exchange normalized immutable values through the parent composition flow rather than importing neighboring semantic internals. A child should be split again only when its own complete working set no longer fits focused attention **and** a real semantic/lifecycle/resource/failure/testing seam exists. File length alone is not a split criterion.

This preserves one public canonical compiler while applying the accepted recursive/full-attention LEGO rule internally. It also avoids the rejected alternative of one public component per specification with duplicated foundation/identity logic.

## Entry points

- [Public component port](index.mjs), also exposed as `cuda-mcgs/search-compiler`.
- [Convenience library facade](../library-interface/README.md).
- [Governing contracts](../../docs/specs/README.md).
- [Owner conformance](../../conformance/search-compiler/README.md).

`src/` is private implementation; `testing.mjs` is conformance-only. CUDA-JS runtime realization is a separate [adapter](../../adapters/runtimes/cuda-js/README.md).

The prerelease API may change. Compiler/reference evidence does not establish native GPU execution.
