# CUDA-MCGS Status

**Status:** Active

**Updated:** 2026-09-05

## Protected framework and public-library state

The protected #109 / PR #225 implementation baseline is CUDA-MCGS `7c02c33373dd3aa517655965f10994a46bc6699a`, tree `7b620c68bedbbda55036557d8f2968f5fea06d39`, sole parent `eebb7779909a64dc581b607133b5a28f0eedc5cd`. It is GitHub-verified and contains the accepted `cuda-mcgs.library-interface/0.1.0` contract, production `interface.library` component, private development package/export map, owner-local Search Compiler resolver diagnostics and CUDA-free packed/installed package conformance.

This tuple is implementation provenance. It is **not** a permanent physical CUDA-JS #32 execution label. This state-reconciliation transaction necessarily changes protected `main`; any future physical compatible-pair run must re-read the then-live protected CUDA-MCGS and CUDA-JS heads immediately before execution and freeze the exact commit/tree/package/API tuple actually run.

The accepted semantic/reference packet remains 12 search contracts, 989/989 classified Composer requirements, 937 `accepted-reference`, exactly 52 `deferred-native`, 0 pending, 883/883 Composer cases, and 393/393 CUDA-free reference routes. #225 adds an accepted public-interface contract without reclassifying those native-deferred search/runtime requirements.

`tool.search-compiler` remains the sole canonical pre-ignition semantic normalization/composition implementation. `interface.library` owns only progressive public call ergonomics and supported installed-package export closure. `integration.cuda-js` remains the production mechanical translation/lifecycle adapter onto an injected public CUDA-JS namespace. No second resolver, Composer, runtime, scheduler, provider registry, CUDA/PTX/FFI path or lower compatibility owner was added.

## #109 / PR #225 — protected prerelease public library interface

#109 is closed completed. PR #225 protected-integrated the accepted `SPEC-0014` interface boundary and a private development package identity `cuda-mcgs@0.0.0-dev.0`.

The package is intentionally private and unreleased. It exposes only:

- `cuda-mcgs` → `interface.library` root facade (`resolve`, `tryResolve`, `compose`, `tryCompose`, `referenceGenerator`, `libraryConstants`);
- `cuda-mcgs/search-compiler` → the complete existing public `tool.search-compiler` index;
- `cuda-mcgs/runtime/cuda-js` → the complete existing public `integration.cuda-js` index; and
- explicit versioned Search IR 0.2.0 schema subpaths.

The root facade defaults only the Search Compiler-owned neutral reference generator and otherwise forwards the canonical owner results unchanged. Search Compiler itself classifies accepted resolver validation failures through `tryCreateResolvedComposerInput`; unexpected exceptions propagate instead of being relabeled by the facade. Runtime realization is not a root-facade side effect.

The exact PR candidate `aed2d4602e06f873140f834b2d9523e031c38e90`, tree `7b620c68bedbbda55036557d8f2968f5fea06d39`, passed all 31 exact-head checks before integration, including:

- `library-interface` workflow `33982472940`: exact `npm pack`, temporary external-consumer installation and public-package exercise on Windows and Ubuntu;
- `cuda-js-runtime-adapter` workflow `33982472946`;
- portable `cuda-js-compatible-pair` workflow `33982472937`;
- Engine reference workflow `33982472932`;
- documentation workflow `33982472963`, including required `verify` job `101350117259`; and
- CodeQL with no new changed-code alerts.

Protected merge `7c02c33373dd3aa517655965f10994a46bc6699a` then passed post-integration qualification:

- `library-interface` push workflow `33982644840`: Windows job `101350502540` and Ubuntu job `101350502659` success;
- `cuda-js-runtime-adapter` push workflow `33982644809`: Windows `101350502403` and Ubuntu `101350502313` success;
- portable `cuda-js-compatible-pair` push workflow `33982644772`: Windows `101350502303` and Ubuntu `101350502413` success;
- documentation/reference workflow `33982644767`, including Governance verification `101350502427` and required `verify` `101350562478`, success; and
- CodeQL Actions `101350504197` and JavaScript/TypeScript `101350504041`, success.

All 25 protected-head check runs were terminal and successful. These facts prove only the exact prerelease ESM package/export behavior and hosted CUDA-free/portable contracts exercised. They do **not** prove an npm release, stable 1.0 API, native CUDA execution, physical publication/order, Linux hardware support, performance, multi-GPU support or downstream product readiness.

## CUDA-JS #32 — parked physical compatible-pair gate

`iteathen/CUDA-JS#32 — CUDA-MCGS compatible-pair qualification through public CUDA-JS` remains open and runner-ready from the MCGS side, but there is no accepted directly exposed physical NVIDIA GPU available in the current execution environment. Portable/hosted/VM/mock evidence cannot substitute for that gate, so no further MCGS construction is authorized merely to make #32 easier.

The currently recorded lower provenance is protected CUDA-JS `2ec2b9e7ffd3b6b5fe8d14364e2d758065d90e5c`, tree `05fe89ff91e538aedf003a17c5b8d40c725a4b24`, package `cuda-js@0.1.0-alpha.18`, public API schema 1. These values must be re-read before a future physical execution; they are not permanent compatibility constants.

The protected runner remains:

`node --experimental-ffi scripts/run-cuda-js-compatible-pair.mjs native`

with exact `CUDA_MCGS_REVISION`, `CUDA_MCGS_TREE`, `CUDA_JS_SOURCE_ROOT`, `CUDA_JS_REVISION`, `CUDA_JS_TREE`, `CUDA_JS_PACKAGE`, and `CUDA_JS_API_SCHEMA`, using tracked-clean exact checkouts and the exact CUDA-JS checkout linked through the public `cuda-js` package.

No generic lower CUDA-JS capability gap has been demonstrated by the runner-ready pair or its portable qualification, so CUDA-JS #198 remains inactive. If a later physical run demonstrates a generic lower defect, stop and route it to CUDA-JS; CUDA-MCGS must not grow a private/deep/native workaround. CUDA-JS #4 remains a separate native Ubuntu/NVIDIA support cell unless one exact physical run independently satisfies both issues' acceptance conditions.

## Current actionable lane — #123 CUDA-free external-consumer preparation

With #109 complete and #32 hardware-blocked, the highest-value executable work is the CUDA-free portion of #123: prove that a real downstream consumer can use the protected public package boundary without importing repository-private MCGS implementation or taking over lower CUDA-JS facts.

The first concrete consumer is `iteathen/UCI-Arena-Vector`. Its current protected state predates the accepted CUDA-MCGS #122/#109 and current CUDA-JS alpha.18 provenance, so its own authority, contracts, issue tracker and CI must be reassessed before mutation. Stale downstream tracker text is evidence to reconcile, not permission to bypass that repository's ownership rules.

The intended preparation slice is deliberately narrower than #123 completion:

1. re-read Vector's protected authority, public/product contracts, package topology, relevant issues/PRs and CI;
2. determine the smallest product-owned configuration/profile that exercises CUDA-MCGS through declared public package exports only;
3. pack the exact protected CUDA-MCGS development artifact and install/use it as an external package rather than deep-importing MCGS source;
4. exercise pre-ignition resolution/composition and inspect exact provenance/diagnostics with CUDA runtime ignition disabled;
5. falsify ownership leakage, private import dependence, stale upstream identities, invalid combinations, retryability and cleanup; and
6. route any demonstrated generic framework gap to CUDA-MCGS, generic lower CUDA gap to CUDA-JS, Tensor gap to CUDA-JS-Tensor, reusable NN/model gap to `cuda-nn`, and retain Vector product semantics downstream.

A successful CUDA-free Vector slice makes the eventual physical run the remaining evidence dependency; it does **not** close #123 while CUDA-JS #32 remains physically unqualified. #124 matters only if Vector actually selects the optional Tensor evaluator path.

## Ownership boundary

CUDA-MCGS owns Search IR, Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel semantics, finite search resource/pressure policy, deterministic restricted Search Program generation, selected search physical-profile policy, Program Package/execution-package meaning, canonical pre-ignition composition, `interface.library` public access policy, and translation of accepted meaning through `integration.cuda-js`.

CUDA-JS owns consumer-neutral device/context/memory/compiler/artifact/module/function/operation/publication/provider mechanisms, lower request validity/ranges, compatibility facts, errors/health and lower resource lifecycle. CUDA-JS-Tensor owns generic Tensor mathematics/device-callable Tensor semantics. Reusable NN/model semantics belong to `cuda-nn`. Product meaning remains downstream.

Protected integration requires exact-head qualification, complete review and applicable user authorization. Standing user authorization is active for this workstream; no authorization-only stop is permitted while exact source/base/tree, qualification and review invariants remain satisfied.
