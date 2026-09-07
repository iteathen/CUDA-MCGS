# CUDA-MCGS Status

**Status:** Active

**Updated:** 2026-09-06

## Current execution seam

The active nonphysical CUDA-MCGS lane is **#124 — the optional generic device-resident Tensor evaluator connector**.

The external Device-JS import-composition prerequisite is now protected-complete through PR #241. The remaining #124 seam is evaluator-owned request accumulation, finite full/partial batching, request/item freshness, scatter/readiness/publication, pressure/failure/cancellation mapping, retryability, substitution/deletion and terminal cleanup through the already-protected public Tensor/CUDA-JS composition boundary.

Direct physical NVIDIA qualification is intentionally deferred for the current portfolio pass. CUDA-JS #32, CUDA-MCGS #37 and CUDA-MCGS #105 remain open/resumable evidence cells. Their absence does not block product-neutral semantic, package or runtime-composition work that can be qualified honestly without hardware. Portable, hosted, VM, mock and package evidence never becomes native/provider/hardware evidence.

No downstream product is an execution dependency for #124. Product-specific state, protocols, models, heads, numerical oracles and policies remain downstream and cannot become CUDA-MCGS authority.

## Protected framework state

Current protected framework/runtime-adapter implementation provenance is CUDA-MCGS `a1d2b93b0256929cac4bb76b765e7105b4714614`, tree `45e903c3cbee6ede51df8b99870c0282856672e7`. The current protected branch identity is still read from GitHub when exact integration identity matters.

The #109 public-library baseline remains `7c02c33373dd3aa517655965f10994a46bc6699a`. The accepted semantic/reference packet remains 12 search contracts, 989/989 classified Composer requirements, 937 accepted-reference, 52 deferred-native, 0 pending, 883/883 Composer cases and 393/393 CUDA-free reference routes.

Protected SPEC-0015 keeps maintained CUDA-MCGS source JavaScript/TypeScript plus restricted Device-JS through public CUDA-JS contracts, with CUDA-JS the sole native CUDA/provider owner. Protected SPEC-0016 reserves CUDA-MM only for optional separately activated cross-domain physical memory policy; no production CUDA-MM dependency is selected.

`tool.search-compiler` remains the sole canonical pre-ignition semantic normalization/composition implementation. `interface.library` owns public package ergonomics/export closure. `integration.cuda-js` owns mechanical translation/lifecycle onto an injected public CUDA-JS namespace. No second resolver, scheduler, provider registry, native/FFI path or private lower runtime is authorized.

## #123 external-consumer package evidence

The first unrelated-repository evaluator-free/CUDA-free installed-package falsifier is protected-complete. It proves public owner-profile normalization, accepted authority/context construction, root resolve/compose, fail-closed stale/wrong authority, retryability, private/testing export rejection, physical absence of installed conformance/testing source and cleanup.

That repository identity is historical evidence only. It is not a current product dependency or specification authority. #123 remains open only on separately deferred physical/ignition evidence.

## #124 generic Tensor evaluator connector

The accepted evaluator contract already owns product-neutral request identity, input encoding, queue/batch lifecycle, resident artifact meaning, workspace, result readiness, cache/reuse, cancellation/failure and cleanup. CUDA-JS-Tensor publicly owns TensorProgram/TensorPlan mathematics, item-axis independence, device-callable ABI and Tensor workspace.

The public Tensor package exposes `TensorDeviceProgram` / `compileTensorDeviceProgram` with:

- finite `itemCapacity`;
- typed inputs, outputs and workspace;
- exact total workspace bytes;
- device callable `tensorRunItem`;
- opaque public `DeviceJsLibrary` composition through `importAs()`; and
- compatibility identity/canonical description.

PR #241 protected the generic external-import composition seam without moving lower ownership: Program Package and Search Program may carry optional canonical identity-bound Device-JS import declarations, execution packages project those declarations to `integration.cuda-js`, and the adapter matches live opaque public `DeviceJsImport` values fail-closed before forwarding the exact imports to public `compileDeviceProgram({ imports })`. CUDA-MCGS does not own library artifact bytes, CUDA-JS remains the generic import/compiler owner, and CUDA-JS-Tensor remains the Tensor callable/library owner.

CUDA-MCGS #124 must consume only those public generic facts. It owns request accumulation, batch formation, request/item mapping, freshness, result scatter/readiness/publication, pressure/failure/cancellation mapping and terminal cleanup. It must not own Tensor mathematics or any product/model meaning.

The remaining bounded connector profile must prove:

- optional Tensor selection and complete evaluator-free deletion;
- public-package Tensor consumption only;
- finite capacity/workspace admission;
- full and partial batch identity preservation;
- stale-result rejection across slot reuse;
- explicit pressure, cancellation, failure and unavailable-capability dispositions;
- retryability after failed/cancelled work;
- terminal or truthful retained/orphan cleanup; and
- no host read-decide-write/relaunch progression required for active evaluator progress in the selected semantic profile.

Portable conformance for #124 is allowed and useful, but establishes only the semantics it executes.

## Ownership boundary

CUDA-MCGS owns Search IR, Graph, Policy, Evaluator, Resource, Progress, Output, Session, Stage, Channel, finite search resource/pressure policy, deterministic restricted Search Program generation, Program Package/execution-package meaning, canonical pre-ignition composition and translation through `integration.cuda-js`.

CUDA-JS owns consumer-neutral device/context/memory/compiler/artifact/module/function/operation/publication/provider mechanisms and lower lifecycle/compatibility facts. CUDA-JS-Tensor owns generic Tensor mathematics/planning/device-callable item semantics. Reusable NN/model semantics belong to `cuda-nn` only if independently justified. CUDA-MM remains optional/unactivated cross-domain physical-policy ownership. Product meaning remains downstream.

## Hard limits

- No C/C++/CUDA/PTX/native FFI maintained in CUDA-MCGS.
- No Python in this portfolio.
- No private/deep CUDA-JS or CUDA-JS-Tensor imports.
- No product semantics moved upstream for composition convenience.
- No host-produced active-search intermediate after ignition.
- No portable/package evidence promoted to physical/native/provider support.
- Protected integration requires exact-head qualification, complete review, exact base/tree validation and protected read-back.
