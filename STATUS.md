# CUDA-MCGS Status

**Status:** Active

**Updated:** 2026-09-06

## Protected framework and public-library state

The protected framework/runtime-adapter implementation provenance remains CUDA-MCGS `5b7b4c7e918ca3e8e812c6e22e58bf1621061bc6`, tree `c2083f90f449189c25b036c1c250351c16493193`, including the accepted public library boundary and #228 public CUDA-JS adapter correction. The current protected branch identity must be read from GitHub when exact integration identity matters; dated tuples here are provenance, not self-updating physical-run labels.

The #109 / PR #225 public-library baseline remains `7c02c33373dd3aa517655965f10994a46bc6699a`, tree `7b620c68bedbbda55036557d8f2968f5fea06d39`. It provides the prerelease `cuda-mcgs.library-interface/0.1.0` boundary, private development package/export map, owner-local Search Compiler resolver diagnostics and CUDA-free packed/installed package conformance.

Protected #236 accepted `SPEC-0015-native-boundary-and-js-only-implementation.md`: maintained CUDA-MCGS source remains JavaScript/TypeScript plus restricted Device-JS through public CUDA-JS contracts, and CUDA-JS remains the sole native CUDA/provider owner. Protected #237 accepted `SPEC-0016-cuda-mm-physical-policy-composition.md`: CUDA-MM is only the reserved optional owner for reusable cross-domain physical memory policy; no production CUDA-MM dependency is selected and search-specific resource/liveness/reclamation semantics remain CUDA-MCGS-owned. Neither ownership addendum establishes native support, hardware qualification or product readiness.

The accepted semantic/reference packet remains 12 search contracts, 989/989 classified Composer requirements, 937 `accepted-reference`, exactly 52 `deferred-native`, 0 pending, 883/883 Composer cases, and 393/393 CUDA-free reference routes. None of the downstream Tensor/model work reclassifies those native-deferred framework requirements.

`tool.search-compiler` remains the sole canonical pre-ignition semantic normalization/composition implementation. `interface.library` owns public package ergonomics/export closure. `integration.cuda-js` owns only mechanical translation/lifecycle onto an injected public CUDA-JS namespace. No second resolver, runtime, scheduler, provider registry, CUDA/PTX/FFI path or lower compatibility owner is authorized.

## Protected public CUDA-JS adapter correction

Protected #228 remains the current adapter-mechanics provenance. It:

- selects the accepted `cuda-cccl` header profile for release/acquire publication packages;
- uses the public prepared Device-JS kernel name/function mapping;
- selects the capacity-two pending-operation profile required for main operation plus terminal delivery;
- allocates only resources actually bound to operation/delivery while retaining other admitted requirements as package facts; and
- keeps Search Compiler promotion-boundary hashing line-ending stable.

This is public-adapter maintenance, not new search semantics or native-support promotion.

## CUDA-JS #32 — parked physical compatible-pair gate

`iteathen/CUDA-JS#32` remains open and runner-ready from the CUDA-MCGS side. It is still blocked on an accepted directly exposed physical NVIDIA environment. Hosted, portable, VM, mock, Tensor, product or DevBridge evidence cannot substitute for that physical gate.

The protected runner remains:

`node --experimental-ffi scripts/run-cuda-js-compatible-pair.mjs native`

Immediately before any future physical execution, re-read both live protected CUDA-MCGS and CUDA-JS heads/trees plus package/API/toolchain/environment identity and freeze the exact tuple actually executed. Older tuples remain provenance only.

No generic lower CUDA-JS capability gap is currently demonstrated by the runner-ready pair or by the first real-model Tensor campaign. If a physical run demonstrates one, stop and route it to CUDA-JS; CUDA-MCGS must not grow a private/deep/native workaround.

## Current downstream Tensor/model state

The old “Tensor #61 still needs implementation” wording is superseded.

CUDA-JS protected-completed the required f32/f64 Device-JS tanh implementation, then protected the finite Device-JS/compiler admission correction needed by the first real Tensor leaf as CUDA-JS #213 / PR #216, merge `45a9ef15537b52d6fd7c615b7e596676dfd00587`.

CUDA-JS-Tensor then protected the exact dependency refresh as PR #68 / merge `0da2c70a0a10df908a33e842aa4ba3dbd7605c48`, selecting that lower CUDA-JS revision without changing Tensor mathematics or callable semantics.

UCI-Arena-Vector PR #24 subsequently protected the frozen LatticeKnight-4M FP32 TensorProgram/TensorPlan and public callable/resource gate as merge `ca3cce162a73a664a789f6a27a819097ec994bd6`, tree `2182527aa9cd058824d3658a549a2f8224d18db5`. Its protected post-merge `Repository quality` run `34023725885` and `Model Tensor Coverage` run `34023725845` succeeded.

The relevant generic result now exists:

- exact mixed TensorProgram contract is accepted and realized through public Tensor/CUDA-JS only;
- callable ABI/resource coverage is frozen;
- Tensor workspace is 33,194,524 bytes/item;
- capacity 2 is 66,389,048 bytes and remains within the selected finite ceiling;
- capacity 3 fails closed at the Tensor-owned `TENSOR_DEVICE_WORKSPACE_LIMIT` pressure boundary; and
- no new generic CUDA-MCGS, Tensor or CUDA-JS capability gap is demonstrated by that resource mapping.

Vector PR #25 and Tensor PR #69 reconciled protected control state afterward. The **only remaining first-model correctness seam is the independent checkpoint-bound policy/value numerical oracle owned by UCI-Arena-Vector #3**. The existing Vector coverage predicate reporting `covered_real_model` is capability/resource truth only, not model numerical parity or evaluator readiness.

CUDA-MCGS #124 must therefore not invent model expected outputs or absorb Tensor/model semantics. It consumes only public generic callable/resource facts after the product-owned numerical gate is complete, while retaining evaluator request identity, batching/scatter, readiness/publication and search lifecycle ownership.

## CUDA-MCGS #123 — CUDA-free downstream slice protected-complete

UCI-Arena-Vector #27 / PR #29 now protects the first real unrelated-repository installed-package falsifier for the public CUDA-MCGS composition boundary. Protected Vector `main` contains squash merge `cf07cb51e868a002dffaf178c769b21f16b63c9e`, tree `0b8649efadd10086cba1c0687d3b2ab07c87f2c2`; its final requalified candidate was `ce4abc0d27dc3316528c4c177b7c9599788d0767` against Vector base `97e0673258afadfdae4582362f1ece3bccdbaf5d`.

The falsifier froze exact CUDA-MCGS package revision `e4ff2614006dea054359560827dda9b93d9fe6cd` and installed it through `github:iteathen/CUDA-MCGS#e4ff2614006dea054359560827dda9b93d9fe6cd`. Final current-base qualification passed Vector Repository quality `34054854320` and CUDA-MCGS External Consumer `34054854364` on Ubuntu and Windows. The exact package artifact had 52 entries, 221,896 packed bytes, 1,223,579 unpacked bytes and shasum `9ec4d8f006ccb9edd4e416971aa542905d2bd8b0`.

That protected slice proves public Domain/Graph/Policy/Resource/Progress/Output normalization, packaged accepted authority, public composition-context construction, root resolve/compose plus direct Search Compiler identity equivalence, fail-closed stale/wrong authority with corrected retry, rejected private/testing exports, physical absence of installed conformance/testing source, and cleanup. Its profile is evaluator-absent, stateless Graph, session/stage/channel absent and pre-ignition.

This completes the CUDA-free downstream consumer preparation slice of #123, but **does not close #123**. Its remaining completion gate is the separately owned directly exposed physical NVIDIA compatible-pair evidence in CUDA-JS #32. No additional hosted/mock/package falsifier is authorized merely to compensate for unavailable physical hardware, and this result establishes no native/provider/hardware readiness.

No generic CUDA-MCGS source defect is demonstrated by the completed slice. The next executable non-hardware product path remains outside CUDA-MCGS in Vector #3's independent numerical oracle; CUDA-MCGS #124 stays downstream of that product-owned correctness gate. When accepted physical hardware becomes available, re-read the live protected CUDA-MCGS/CUDA-JS identities before executing #32 rather than reusing the frozen `e4ff261...` package tuple as a hardware label.

## Ownership boundary

CUDA-MCGS owns Search IR, Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel semantics, finite search resource/pressure policy, deterministic restricted Search Program generation, selected search physical-profile policy, Program Package/execution-package meaning, canonical pre-ignition composition, `interface.library` public access policy, and translation through `integration.cuda-js`.

CUDA-JS owns consumer-neutral device/context/memory/compiler/artifact/module/function/operation/publication/provider mechanisms and lower lifecycle/compatibility facts. CUDA-JS-Tensor owns generic Tensor mathematics/device-callable Tensor semantics. Reusable NN/model semantics belong to `cuda-nn`. CUDA-MM is reserved only for optional reusable cross-domain physical memory policy if separately activated. Product meaning remains downstream.

Protected integration requires exact-head qualification, complete review and applicable user authorization. Standing user authorization is active for this workstream; no authorization-only stop is permitted while exact source/base/tree, qualification and review invariants remain satisfied.
