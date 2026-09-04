# CUDA-MCGS Status

**Status:** Active

**Updated:** 2026-09-04

## Protected semantic state

Protected `main@c10c616058e7e492e130e5ff14fa41402290d5b4`, tree `49ed0a56cdb2214dbdac84af11f349ce62643a63`, contains the accepted universal semantic/reference packet plus #199 operation-local resource access and #202 bounded external-control sideband projection.

The accepted packet contains 12 contracts, 989/989 classified Composer requirements, 937 `accepted-reference`, exactly 52 `deferred-native`, 0 pending, and the complete 393/393 CUDA-free reference route packet. Composer qualification is 883/883 after the permanent #202 authority falsifiers. This does not claim native GPU correctness, physical publication/memory-order qualification, performance, stable SDK, multi-GPU support, product behavior, or an exact CUDA-JS compatible pair.

## Current production-ownership transaction

**#205 / PR #206 — promote canonical Search IR/composition implementation into production component ownership** is the active protected-integration candidate before any later #125 work is reconsidered.

The candidate promotes the exact canonical normalization/composition source bytes from `experiments/search-ir-composer-reference/src/` to `components/search-compiler/` as component `tool.search-compiler`, moves fixture/catalog/deletion/mutation/export evidence support to `conformance/search-compiler/`, and removes the old experiment path without a compatibility shim. The 14 canonical implementation blobs remain byte-identical to protected `main@c10c616058e7e492e130e5ff14fa41402290d5b4`.

Semantic authority remains the accepted specs/schemas. The production component is pre-ignition and stateless; it does not own CUDA-JS runtime/provider/resource lifecycle, a GPU scheduler, native code, product semantics, or the stable public SDK. #109 remains the public facade/resolver owner.

## Production connector seam

#125 remains the future `integration.cuda-js` owner and is blocked until #205 is protected-integrated. Its lower baseline remains public `cuda-js@0.1.0-alpha.18` at `iteathen/CUDA-JS@49a2f77d2c8364d67030fbc1c2e870e58e70d334`. After #205 integration, #125's complete independent prerequisite set must be reassessed from live authority and issue state before deciding whether implementation is dependency-ready; any implementation must consume only versioned public CUDA-JS contracts.

## Immediate dependency chain

1. Complete exact-head qualification and author review of PR #206, including the byte-identity promotion proof, 883/883 Composer capsule, full Engine/reference packet, CI trigger ownership, and repository governance/source-boundary gates.
2. Stop for fresh protected-integration authorization for the exact #205 head/tree/base tuple.
3. After protected #205 integration, reconcile #205/status and reassess #125 against all live independent prerequisites from the new protected base.
4. Only if #125 is dependency-ready, refresh its implementation branch from the durable production Search Compiler surface and continue the public CUDA-JS adapter transaction.
5. CUDA-JS #32 owns later exact compatible-pair/native publication, race, cancellation and teardown evidence through the eventual adapter implementation; #109 independently owns the stable public library/resolver facade.

## Ownership boundary

CUDA-MCGS owns Search IR, Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel semantics, finite search resource/pressure policy, deterministic restricted Search Program generation, selected search physical-profile policy, execution-package meaning and its canonical pre-ignition implementation.

CUDA-JS owns actual lower request vocabulary, device/context/memory/compiler/artifact/module/function/operation/publication/provider mechanisms, lower validity/compatibility facts, errors/health and lower resource lifecycle. CUDA-JS-Tensor owns generic Tensor mathematics/device-callable Tensor semantics. Product meaning remains downstream.

A need for native/private lower escape code is a missing-library-capability diagnostic, not permission to bypass the owning library.

## Current-state governance

Protected `STATUS.md` and `next_step.yaml` own the live execution seam. Issues own durable obligations and evidence. No protected integration occurs without exact-head qualification, review and fresh authorization.
