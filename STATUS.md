# CUDA-MCGS Status

**Status:** Active

**Updated:** 2026-09-05

## Protected semantic/runtime state

The protected #221 implementation baseline recorded immediately after PR #222 integration is `dadf2b053016dafbb5ca56b79b09f72405d1214a`, tree `b000264125899e1769df51613a70f4f697a43bd2`, parent `85ee5d261fa50a4933e091cc993c60867158eea1`. It contains the runner-ready CUDA-JS #32 consumer capsule. This docs-only reconciliation is constructed from that baseline; after this reconciliation integrates, the exact physical pair must freeze the **live protected MCGS revision actually executed**, not reuse `dadf2b...` merely because it is the implementation provenance recorded here.

The accepted semantic/reference packet remains 12 contracts, 989/989 classified Composer requirements, 937 `accepted-reference`, exactly 52 `deferred-native`, 0 pending, 883/883 Composer cases, and 393/393 CUDA-free reference routes. The 52 native-deferred requirements remain deferred until exact compatible-pair/native evidence proves them.

`integration.cuda-js` remains the protected production boundary under `adapters/runtimes/cuda-js`. #221 did not change that production adapter or any CUDA-JS production/API surface. It continues to translate accepted finite CUDA-MCGS execution-package meaning onto an injected versioned public CUDA-JS namespace only, with fail-closed peer/capability admission, complete pre-mutation binding/range validation, bounded operation lifecycle, declared terminal delivery, and conservative child/runtime cleanup truth.

## #221 / PR #222 — protected runner-ready exact-pair capsule

#221 is closed completed. PR #222 integrated a conformance-owned capsule under `conformance/cuda-js-compatible-pair/` and a script entry at `scripts/run-cuda-js-compatible-pair.mjs`. This is evidence/qualification tooling, not a new production component, runtime, scheduler, or lower abstraction.

The fresh pair constructor flows through the canonical production path: `createResolvedComposerInput` → `composeResolvedEngine` → normalized Program Package → Search Program/execution package → production `integration.cuda-js`.

The first accepted workload is terminal-only and product-neutral: 4 blocks × 256 threads, exactly 1,024 useful u32 Output words, a 4,096-byte terminal Output delivery reserve, and distinct Channel-owned device-search storage for payload/readiness. SPEC-0004 Channel remains the semantic owner of producer payload write → `gpu.atomic.storeReleaseDevice(...)` → block sequencing → consumer `gpu.atomic.loadAcquireDevice(...)` → payload use. The barrier does not replace the release/acquire edge. Terminal host delivery occurs only after completed operation state through the protected Output-owned `deliver()` path.

The transparent recorder wraps only public CUDA-JS namespace/capability methods used by the production adapter. It correlates the same transaction's Device-JS compile input, compiler/linker artifact identity, module load, function submission, operation wait/status evidence, terminal D2H child, copied terminal bytes, capability cleanup, runtime description, and terminal runtime report. It neither inspects generated CUDA/PTX nor exposes raw handles/pointers nor launches a second compile/runtime path.

The native runner is fail-closed on exact repository/HEAD/tree/package/API identity, tracked-clean MCGS and CUDA-JS checkouts, public `cuda-js` root resolution into the exact CUDA-JS checkout, same-transaction compile→artifact→load identity, distinct Channel/Output capabilities, exact Output delivery range, deterministic terminal bytes/publication result, terminal transfer closure, and clean runtime terminal state. Portable failure-path evidence remains separate and is never relabeled physical.

Exact candidate head `54d86406e930c06087afe6d9125feeabdddccf8c` had the same tree as the protected #221 implementation baseline (`b000264125899e1769df51613a70f4f697a43bd2`) and passed:

- `cuda-js-compatible-pair` workflow `33970801963`: Windows and Ubuntu Node 26.7.0 exact-pair construction plus `PAIR-F01` through `PAIR-F16`, and the protected public-adapter regression in both matrix cells;
- `cuda-js-runtime-adapter` workflow `33970801982`;
- `documentation` workflow `33970802033`, including required `verify` job `101318925625`;
- CodeQL check `101318918746` with no new changed-code alerts.

These are hosted/portable qualification facts only. They do **not** prove native CUDA execution, physical publication/order, Linux hardware support, performance, stable SDK support, multi-GPU support, or product readiness.

## Current P0 — CUDA-JS #32 physical compatible-pair evidence

`iteathen/CUDA-JS#32 — CUDA-MCGS compatible-pair qualification through public CUDA-JS` remains open and is now runner-ready from the MCGS side.

The current recorded lower input is protected CUDA-JS `2ec2b9e7ffd3b6b5fe8d14364e2d758065d90e5c`, tree `05fe89ff91e538aedf003a17c5b8d40c725a4b24`, package `cuda-js@0.1.0-alpha.18`, public API schema 1. These are execution-pair provenance, not permanent compatibility constants; re-read CUDA-JS protected main immediately before execution and re-freeze if it moved.

For CUDA-MCGS, `dadf2b053016dafbb5ca56b79b09f72405d1214a` is the #221 implementation baseline, not a permanent physical-run label. After this docs-only reconciliation is protected, re-read MCGS `main` and use that exact live protected commit/tree as `CUDA_MCGS_REVISION` / `CUDA_MCGS_TREE` for the physical run. This prevents the state document itself from creating a stale self-reference.

No generic lower CUDA-JS capability gap has been demonstrated by #221 or its portable qualification. CUDA-JS #198 therefore remains inactive for this terminal-only pair. A real physical failure may route to CUDA-JS only if the evidence demonstrates a missing generic lower capability; CUDA-MCGS must not grow a private/native workaround.

The physical runner requires an exact protected CUDA-JS checkout linked as the public `cuda-js` package into the exact protected CUDA-MCGS checkout and runs Node with CUDA-JS's required FFI enablement. The canonical entry is:

`node --experimental-ffi scripts/run-cuda-js-compatible-pair.mjs native`

with exact `CUDA_MCGS_REVISION`, `CUDA_MCGS_TREE`, `CUDA_JS_SOURCE_ROOT`, `CUDA_JS_REVISION`, `CUDA_JS_TREE`, `CUDA_JS_PACKAGE`, and `CUDA_JS_API_SCHEMA` supplied as documented in `conformance/cuda-js-compatible-pair/README.md`.

A passing bundle qualifies only the exact recorded source/Node/ABI/OS/driver/provider/GPU/target/artifact/operation/delivery/lifecycle tuple. CUDA-JS #32 must remain open until that accepted physical evidence exists and is reviewed.

## Evidence split with CUDA-JS #4

CUDA-JS #4 remains an independent native Ubuntu 24.04 x86-64 hardware-support cell requiring a directly exposed physical NVIDIA GPU. A #32 pass on another exact profile does not automatically close #4, and a #4 lower-chain pass does not automatically prove the CUDA-MCGS pair.

## Parallel and downstream work

- **#109** remains independent public facade/resolver/diagnostics/SDK ergonomics work over the one canonical pre-ignition path. It must not rebuild Composer or create another runtime.
- **#123** remains downstream external-consumer acceptance and waits on the usable public #109 surface plus exact compatible-pair evidence from CUDA-JS #32; #124 matters only if a selected consumer chooses the optional Tensor evaluator path.
- Generic Tensor gaps route to CUDA-JS-Tensor; reusable NN/model semantics route to `cuda-nn`; product semantics remain downstream.

## Immediate execution chain

1. Complete this docs-only reconciliation, then read back the resulting protected CUDA-MCGS commit/tree. Immediately before physical execution also re-read protected CUDA-JS; freeze the exact live pair actually to be executed.
2. On an accepted physical NVIDIA host, use tracked-clean exact checkouts, install CUDA-JS dependencies in its own checkout, and link that checkout through the public `cuda-js` package as documented by the capsule.
3. Run the native pair entry with the exact pair environment and retain its complete JSON evidence bundle. Do not use the historical #125 fake or a copied/stale package.
4. Review the exact bundle against CUDA-JS #32: source/host/provider/device/target/program/artifact/module/launch/publication/progress/delivery/pressure/failure/timeout/cleanup truth must all be complete and internally correlated.
5. If the exact physical pair passes, update only the support/evidence facts actually proved. If execution instead demonstrates a generic lower defect, stop and route it to CUDA-JS, then re-freeze after that lower owner is corrected.
6. Keep CUDA-JS #4 separate unless the exact executed profile also satisfies that issue's native Ubuntu/NVIDIA acceptance requirements.

## Ownership boundary

CUDA-MCGS owns Search IR, Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel semantics, finite search resource/pressure policy, deterministic restricted Search Program generation, selected search physical-profile policy, execution-package meaning, canonical pre-ignition composition, explicit cross-owner package delivery connections, and translation of accepted meaning through `integration.cuda-js`.

CUDA-JS owns consumer-neutral device/context/memory/compiler/artifact/module/function/operation/publication/provider mechanisms, lower request validity and ranges, compatibility facts, errors/health, and lower resource lifecycle. CUDA-JS-Tensor owns generic Tensor mathematics/device-callable Tensor semantics. Product meaning remains downstream.

Protected integration requires exact-head qualification, complete review, and applicable user authorization. Standing user authorization is active for this workstream; no authorization-only stop is permitted while the exact subject/base/tree, qualification, and review invariants remain satisfied.
