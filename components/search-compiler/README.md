# Search Compiler

**Component ID:** `tool.search-compiler`  
**Status:** Production  
**Issue:** #205

## Purpose

Own the canonical pre-ignition implementation that normalizes accepted CUDA-MCGS framework selections and owner profiles, composes deterministic restricted Device-JS Search Programs, and emits accepted Program Package / execution-package meaning. Semantic authority remains in the accepted specifications and schemas; this component is their canonical implementation path.

## Owned invariant

For one complete accepted input set, there is one deterministic, fail-closed normalization/composition path from selected framework/profile meaning to canonical normalized profiles, Search Program and execution-package identities. Optional-owner deletion leaves only truthfully surviving meaning, and runtime realization facts are explicit before ignition.

## Public and internal boundary

- `index.mjs` is the repository-internal production port for canonical normalization/composition operations. It is pre-1.0 and is not the stable SDK promised by #109.
- `testing.mjs` is an explicit conformance-only port. Production components/adapters/examples must not depend on it.
- `src/` is private implementation. Consumers do not deep-import it.
- schemas and accepted specifications own semantic shapes; this component validates/implements them but does not replace their authority.
- CUDA-JS is not a dependency of this component. The future `integration.cuda-js` adapter (#125) consumes accepted execution-package meaning separately through versioned public CUDA-JS contracts.

## Dependencies

The component uses Node.js standard-library primitives and injected accepted schema/profile/catalog values. Its canonical owner modules are deliberately colocated because they share one pre-ignition composition lifecycle and a small foundation/validation substrate; splitting them into one component per SPEC owner would create either duplicated foundations or an artificial shared/common component.

Forbidden dependencies include `experiments/`, `conformance/`, CUDA-JS private/deep paths, native/FFI/CUDA source, product semantics, and runtime-owned GPU resource lifecycle.

## Lifecycle and failure

The component is stateless across calls. Inputs are normalized before ignition; invalid, incomplete, incompatible, unknown, cyclic, over-bound, or ownership-inconsistent inputs fail without publishing a partial valid composition. It allocates no GPU/native resources and owns no post-ignition scheduler or runtime lifecycle.

## Verification

The owner conformance capsule is `conformance/search-compiler/`, executed through `node scripts/run-search-ir-composer-reference.mjs`. Promotion qualification also runs the complete Engine reference integration and repository governance/source-boundary gates. The promotion verifier pins the pre-migration Git blob identities of all canonical source modules so #205 cannot smuggle semantic edits into a path move.

## LEGO/deletion result

Deleting CUDA-JS, Tensor, CUDA-NN, UCI products, or any one concrete domain does not remove this component: deterministic framework normalization/composition remains coherent for unrelated consumers. Deleting this component leaves the accepted specifications/schemas and independent semantic reference oracles intact, but removes the production implementation path. A second framework consumer uses the same accepted component ports without new foundational ownership.

## Governing authority

- ADR-0004 repository organization
- ADR-0005 LEGO design hierarchy
- ADR-0014 CUDA-JS runtime extraction
- ADR-0019 public CUDA-JS capability escalation
- ADR-0020 complete library / resolved defaults
- ADR-0024 framework-only production ownership
- SPEC-0000 and accepted SPEC-0003 through SPEC-0013 as applicable
- SPEC-0005 operation-local-access and external-control-sideband addenda
- issue #205

## Non-goals

No stable SDK, product/domain implementation, CUDA-JS runtime adapter, native CUDA code, GPU scheduler, provider registry, universal GPU IR, or second semantic interpreter is created here.
