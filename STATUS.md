# CUDA-MCGS Status

**Status:** Active

**Updated:** 2026-09-05

## Protected framework and public-library state

The current protected framework/runtime-adapter baseline is CUDA-MCGS `5b7b4c7e918ca3e8e812c6e22e58bf1621061bc6`, tree `c2083f90f449189c25b036c1c250351c16493193`. It includes the previously accepted public library boundary plus the protected #228 CUDA-JS adapter correction for publication packages.

The #109 / PR #225 implementation baseline remains durable public-library provenance: CUDA-MCGS `7c02c33373dd3aa517655965f10994a46bc6699a`, tree `7b620c68bedbbda55036557d8f2968f5fea06d39`. It contains the accepted `cuda-mcgs.library-interface/0.1.0` contract, production `interface.library` component, private development package/export map, owner-local Search Compiler resolver diagnostics and CUDA-free packed/installed package conformance.

These tuples are implementation provenance. They are **not** permanent physical CUDA-JS #32 execution labels. Any future physical compatible-pair run must re-read the then-live protected CUDA-MCGS and CUDA-JS heads immediately before execution and freeze the exact commit/tree/package/API tuple actually run.

The accepted semantic/reference packet remains 12 search contracts, 989/989 classified Composer requirements, 937 `accepted-reference`, exactly 52 `deferred-native`, 0 pending, 883/883 Composer cases, and 393/393 CUDA-free reference routes. The public-interface and adapter corrections do not reclassify those native-deferred search/runtime requirements.

`tool.search-compiler` remains the sole canonical pre-ignition semantic normalization/composition implementation. `interface.library` owns only progressive public call ergonomics and supported installed-package export closure. `integration.cuda-js` remains the production mechanical translation/lifecycle adapter onto an injected public CUDA-JS namespace. No second resolver, Composer, runtime, scheduler, provider registry, CUDA/PTX/FFI path or lower compatibility owner was added.

## #109 / PR #225 — protected prerelease public library interface

#109 is closed completed. PR #225 protected-integrated the accepted `SPEC-0014` interface boundary and a private development package identity `cuda-mcgs@0.0.0-dev.0`.

The package is intentionally private and unreleased. It exposes only:

- `cuda-mcgs` → `interface.library` root facade (`resolve`, `tryResolve`, `compose`, `tryCompose`, `referenceGenerator`, `libraryConstants`);
- `cuda-mcgs/search-compiler` → the complete existing public `tool.search-compiler` index;
- `cuda-mcgs/runtime/cuda-js` → the complete existing public `integration.cuda-js` index; and
- explicit versioned Search IR 0.2.0 schema subpaths.

The root facade defaults only the Search Compiler-owned neutral reference generator and otherwise forwards the canonical owner results unchanged. Search Compiler itself classifies accepted resolver validation failures through `tryCreateResolvedComposerInput`; unexpected exceptions propagate instead of being relabeled by the facade. Runtime realization is not a root-facade side effect.

The exact PR candidate `aed2d4602e06f873140f834b2d9523e031c38e90`, tree `7b620c68bedbbda55036557d8f2968f5fea06d39`, passed all 31 exact-head checks before integration, including the library-interface, runtime-adapter, portable exact-pair, Engine reference, documentation and CodeQL gates recorded in the PR. Protected merge `7c02c33373dd3aa517655965f10994a46bc6699a` then passed all 25 protected-head checks. These facts prove only the exact prerelease ESM package/export behavior and hosted CUDA-free/portable contracts exercised. They do **not** prove an npm release, stable 1.0 API, native CUDA execution, physical publication/order, Linux hardware support, performance, multi-GPU support or downstream product readiness.

## #228 — current public CUDA-JS adapter correction

Protected merge `5b7b4c7e918ca3e8e812c6e22e58bf1621061bc6` keeps `integration.cuda-js` on the public CUDA-JS surface while reconciling the adapter with the current accepted lower contracts. The bounded correction:

- selects CUDA-JS `headerProfile: "cuda-cccl"` when accepted publication requirements require release/acquire atomics;
- uses the public prepared Device-JS kernel name/function mapping rather than a stale interpretation of the lower record;
- selects the explicit capacity-two pending-operation profile required to keep terminal delivery and the main operation independently owned;
- allocates only resources actually bound to the operation or terminal deliveries while retaining unbound resource requirements as admitted package facts; and
- makes Search Compiler promotion-boundary hashing line-ending stable.

This is a mechanical public-adapter correction, not new search semantics or a native-support promotion. Its portable tests can falsify translation/lifecycle mistakes but still cannot replace physical #32 evidence.

## CUDA-JS #32 — parked physical compatible-pair gate

`iteathen/CUDA-JS#32 — CUDA-MCGS compatible-pair qualification through public CUDA-JS` remains open and runner-ready from the MCGS side, but there is no accepted directly exposed physical NVIDIA GPU available in the current execution environment. Portable/hosted/VM/mock evidence cannot substitute for that gate, so no further MCGS construction is authorized merely to make #32 easier.

Older recorded pair revisions are provenance only and are already superseded by protected source movement in both repositories. The protected runner remains:

`node --experimental-ffi scripts/run-cuda-js-compatible-pair.mjs native`

with exact `CUDA_MCGS_REVISION`, `CUDA_MCGS_TREE`, `CUDA_JS_SOURCE_ROOT`, `CUDA_JS_REVISION`, `CUDA_JS_TREE`, `CUDA_JS_PACKAGE`, and `CUDA_JS_API_SCHEMA`, using tracked-clean exact checkouts and the exact CUDA-JS checkout linked through the public `cuda-js` package.

Immediately before a future physical execution, re-read both live protected heads/trees plus CUDA-JS package/API identity and freeze that exact tuple. No generic lower CUDA-JS capability gap is currently demonstrated by the runner-ready pair or portable qualification. If a physical run demonstrates one, stop and route it to CUDA-JS; CUDA-MCGS must not grow a private/deep/native workaround. CUDA-JS #4 remains a separate native Ubuntu/NVIDIA support cell unless one exact physical run independently satisfies both issues' acceptance conditions.

## Current actionable lane — #123 CUDA-free external-consumer preparation

With the reusable public library surface complete and #32 hardware-blocked, the highest-value executable MCGS work remains the CUDA-free portion of #123: prove that a real downstream consumer can use the protected public package boundary without importing repository-private MCGS implementation or taking over lower CUDA-JS facts.

The first concrete consumer remains `iteathen/UCI-Arena-Vector`, but its protected state is now reconciled rather than stale. Vector PR #17 / merge `67b2512794c4389abdea22e7f353dac712f6c03d` freezes its first LatticeKnight model, records the current MCGS public-package lane explicitly, and separates the evaluator-free #123 falsifier from the independent Tensor/model path. Since that merge, CUDA-JS protected-completed the lower f32/f64 Device-JS tanh mechanism and CUDA-JS-Tensor accepted SPEC-0011; Tensor #61 owns the remaining generic Tensor tanh implementation. None of that blocks the deliberately evaluator-free #123 preparation slice.

The current #123 slice is therefore:

1. use Vector's current protected authority/contracts and package topology rather than re-solving already-reconciled upstream assumptions;
2. implement the smallest product-owned **evaluator-free** configuration/profile that exercises CUDA-MCGS through declared public package exports only;
3. pack the exact protected CUDA-MCGS development artifact and install/use it as an external package rather than deep-importing MCGS source;
4. exercise pre-ignition resolution/composition and inspect exact provenance/diagnostics with CUDA runtime ignition disabled;
5. falsify ownership leakage, private import dependence, invalid combinations, retryability and cleanup; and
6. route any demonstrated generic framework gap to CUDA-MCGS, generic lower CUDA gap to CUDA-JS, Tensor gap to CUDA-JS-Tensor, reusable NN/model gap to `cuda-nn`, and retain Vector product semantics downstream.

A successful CUDA-free Vector slice advances #123 but does **not** close it while CUDA-JS #32 remains physically unqualified. The evaluator-free dry-run does not require #124. Vector's separately selected neural/Tensor production profile still does.

## Ownership boundary

CUDA-MCGS owns Search IR, Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel semantics, finite search resource/pressure policy, deterministic restricted Search Program generation, selected search physical-profile policy, Program Package/execution-package meaning, canonical pre-ignition composition, `interface.library` public access policy, and translation of accepted meaning through `integration.cuda-js`.

CUDA-JS owns consumer-neutral device/context/memory/compiler/artifact/module/function/operation/publication/provider mechanisms, lower request validity/ranges, compatibility facts, errors/health and lower resource lifecycle. CUDA-JS-Tensor owns generic Tensor mathematics/device-callable Tensor semantics. Reusable NN/model semantics belong to `cuda-nn`. Product meaning remains downstream.

Protected integration requires exact-head qualification, complete review and applicable user authorization. Standing user authorization is active for this workstream; no authorization-only stop is permitted while exact source/base/tree, qualification and review invariants remain satisfied.
