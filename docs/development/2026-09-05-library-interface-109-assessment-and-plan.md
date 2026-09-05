# #109 public library interface — assessment and execution plan

**Status:** Accepted

**Document type:** Execution packet

**Date:** 2026-09-05

**Protected input:** `main@eebb7779909a64dc581b607133b5a28f0eedc5cd`, tree `252d62615348a4f00659b2850461a34a71d4bc4d`

**Tracking:** CUDA-MCGS #109; downstream #123; CUDA-JS #32 remains a separate physical-evidence gate.

## Requested outcome

Advance #109 while no accepted physical NVIDIA host is available. The useful independent outcome is a prerelease public/installable CUDA-MCGS library surface that exposes the already-protected canonical pre-ignition path, owner-emitted diagnostics and inspectable resolution provenance without rebuilding Composer, creating a second runtime, absorbing CUDA-JS mechanisms, or claiming physical qualification.

The resulting packet must also make the future #123 external-consumer proof cheaper: a CUDA-free consumer must be able to install the packed artifact, use only package exports, construct the same resolved input and composed engine package as the canonical Search Compiler path, inspect material default provenance, and import the public CUDA-JS adapter port without executing or qualifying a physical GPU.

## Assessment

### Current state and demonstrated facts

1. `tool.search-compiler` is protected production code and is the canonical stateless owner of normalization, resolved Composer input, Search Program and execution-package composition.
2. PR #112 already proved the semantic work that #109 originally depended on: resolved-input provenance, convenience/explicit identity equivalence, removable-facade deletion, strict conflict rejection and failure-atomic publication. Repeating that resolver would create a second semantic path.
3. `integration.cuda-js` is protected production code and owns mechanical realization of accepted execution-package meaning through an injected public CUDA-JS namespace. It is not an SDK convenience implementation detail to move into a root facade.
4. `interface.library` exists only as a planned registry boundary under ADR-0020. There is no production component for it, no root package manifest, and no installed-package conformance capsule.
5. ADR-0020 requires progressive disclosure: convenience, complete composable surface and low-level tools converge on one canonical normalized path. It expressly rejects a separate simplified implementation.
6. Current issue #109 comments supersede stale dependency wording: production promotion and #125 are complete; #109 now owns only public facade/resolver/diagnostics/SDK ergonomics and installed-package surface work.
7. CUDA-JS #32 remains runner-ready but physically unqualified. Hosted/portable results cannot be promoted to physical/native support.

### Unproven assumptions before this packet

- That a root installable package can expose the required surfaces without creating new semantic ownership.
- That package export closure can prevent supported consumers from deep-importing production internals while still allowing the complete public Search Compiler and CUDA-JS adapter ports.
- That a packed/install-installed consumer can reproduce canonical resolver/composer identities without importing repository-private source.
- That resolver failures can be returned as owned diagnostics without `interface.library` learning Search Compiler private exception classes.

These assumptions are the primary falsification targets of the implementation and conformance work.

## Ownership decision

Create the already-planned `interface.library` production component. It owns only progressive public access and package-facing call ergonomics. It does not own semantic normalization, diagnostic classification, runtime creation, CUDA-JS compatibility, search lifecycle, resource policy or active-search progression.

The facade delegates to the public `tool.search-compiler` port. To avoid private exception coupling, Search Compiler receives one small owner-local addition: `tryCreateResolvedComposerInput`, which turns its own `ValidationError` into the same `{ code, message }` diagnostic shape already used by `tryComposeResolvedEngine`. The library facade forwards this result; it does not classify Search Compiler failures itself.

Package subpaths expose the existing complete public owners directly:

- package root → `interface.library` convenience facade;
- `cuda-mcgs/search-compiler` → existing `tool.search-compiler` public index;
- `cuda-mcgs/runtime/cuda-js` → existing `integration.cuda-js` public index;
- versioned Search IR schema files → low-level contract artifacts.

The package remains private/unpublished at this stage. `npm pack` is used only to exercise the installed artifact boundary. This creates an installable qualification artifact without making a release or stable-SDK claim.

## Alternatives rejected

### Put convenience behavior into Search Compiler

Rejected. Search Compiler explicitly excludes stable SDK policy and already has one coherent semantic responsibility. Adding root-package concerns there would collapse `interface.library` into a semantic owner and weaken the deletion test.

### Create a new Engine/runtime object

Rejected. It would risk a second lifecycle/runtime/composition owner, conflict with #109 non-goals, and obscure the existing `integration.cuda-js` injection boundary.

### Re-export every internal file from the package

Rejected. It would convert implementation topology into compatibility surface and defeat LEGO replacement. Only owner public indexes and versioned schemas are exported.

### Keep the repository non-installable and defer all package work to #123

Rejected. #109 explicitly owns installed-package surface outcomes, while #123 owns the external product contract and eventual physical compatible-pair execution. Deferring package wiring would make #123 rediscover an SDK boundary it does not own.

### Add TypeScript schema replicas now

Deferred. Hand-maintained broad types would duplicate versioned schema meaning and broaden the compatibility surface without a demonstrated consumer requirement. This packet keeps ordinary ESM JavaScript plus exact versioned schemas; later type generation requires an independently justified owner/consumer need.

## Execution plan

1. Accept `SPEC-0014` as the prerelease `interface.library` contract.
2. Add `tryCreateResolvedComposerInput` inside Search Compiler so failure classification remains with the semantic implementation owner.
3. Add `components/library-interface/` with manifest, README and a thin public index exposing resolver/composer ergonomics and the Search Compiler-owned reference generator.
4. Add a root `package.json` whose export map exposes only the facade, public owner indexes and versioned schemas. Keep the package private and development-versioned so no release claim is implied.
5. Add `conformance/library-interface/` plus a script/workflow entry. Build a real valid canonical pair fixture using existing conformance construction, pack/install the exact candidate, dynamically import it through the package specifier, and prove exact resolved/composed identities against the canonical production path.
6. Falsify missing/invalid input, private deep import, facade deletion and diagnostics/provenance behavior. Import the CUDA-JS adapter subpath but do not instantiate a native runtime.
7. Update registry, specs index, README/status/next-step truth and #109/#123 tracking only after exact-head qualification.
8. Perform complete author-side review of the exact final diff; do not represent it as independent review. Merge only with an expected-head guard and standing authorization if the protected base is unchanged and all required checks are green.
9. Read back protected commit/tree, run/inspect post-integration checks, delete the task branch, and reconcile tracker state.

## Acceptance and falsifiers

The packet is accepted only if all of the following are demonstrated on one exact candidate head:

- root facade resolution with omitted neutral generator and explicit equivalent generator produces the same canonical resolved-input identity;
- root facade explicit resolution and composition of a real valid profile produce the same identities as direct public Search Compiler calls;
- material owner/reason/version/revision provenance remains present and unchanged;
- invalid/missing profile input returns a Search Compiler-owned diagnostic through `tryResolve` with no partial result;
- `tryCompose` preserves Search Compiler-owned failure diagnostics;
- deleting/bypassing the root convenience facade leaves `cuda-mcgs/search-compiler` complete and usable;
- a consumer installed from the exact packed candidate imports only declared package exports;
- a private/deep package path is rejected by Node package export closure;
- the public CUDA-JS adapter subpath imports without importing CUDA-JS itself or making a native/physical claim;
- existing Search Compiler, CUDA-JS adapter, exact-pair portable, documentation, source-boundary and CodeQL checks remain green;
- no production source imports `experiments/`, `conformance/`, CUDA-JS private source, native addons, FFI, CUDA or PTX.

## Claim limits

This work proves only a prerelease public/installable ESM surface and CUDA-free installed-consumer compatibility on qualified hosted environments. It does not prove released npm availability, stable 1.0 SDK compatibility, native CUDA execution, physical publication/ordering, Linux hardware support, performance, product readiness, or UCI Arena Vector acceptance. CUDA-JS #32 remains open until an accepted physical NVIDIA run exists.