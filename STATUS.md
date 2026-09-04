# CUDA-MCGS Status

**Status:** Active

**Updated:** 2026-09-04

## Protected semantic/runtime state

The protected post-#125 runtime baseline is `main@67d16badb6dd65be9c96c4198b4451b1edb82f57`, tree `750a2a7ee7c519241c82e180cf84c76f3d5ee398`. It contains the accepted universal semantic/reference packet, #199 operation-local resource access, #202 bounded external-control sideband projection, the durable `tool.search-compiler` production owner, and the #125 production `integration.cuda-js` adapter integrated through PR #210.

`integration.cuda-js` lives under `adapters/runtimes/cuda-js` and translates accepted finite CUDA-MCGS execution packages onto versioned public CUDA-JS contracts only. The integrated v0 adapter targets the exact protected peer `iteathen/CUDA-JS@49a2f77d2c8364d67030fbc1c2e870e58e70d334`, tree `b67890e2499f04ab3b81b8f4a72dab38a5281c7e`, package `cuda-js@0.1.0-alpha.18`. It fail-closes public-peer/capability admission, validates the complete resource/scalar binding set before the first lower mutation, constructs lower requests through public contracts, exposes only accepted bounded controls/observations, projects lower failure truth, and closes children before the parent runtime while retaining orphan/restart-required truth where terminality is unproved.

Protected-main post-integration qualification repeated successfully: `cuda-js-runtime-adapter` workflow `33915951068` passed and `documentation` workflow `33915951020` passed. This is portable/public-contract evidence only. It does **not** claim exact native compatible-pair correctness, physical publication/memory-order qualification, performance, stable SDK support, multi-GPU support, or downstream product behavior.

The accepted semantic/reference packet remains 12 contracts, 989/989 classified Composer requirements, 937 `accepted-reference`, exactly 52 `deferred-native`, 0 pending, 883/883 Composer cases, and 393/393 CUDA-free reference routes. The 52 native-deferred requirements remain deferred until exact compatible-pair/native evidence proves them.

## Current reconciliation seam

**#211 — reconcile protected state after #125 runtime adapter integration** is the active docs/governance-only transaction. Its source base is the exact protected post-#125 runtime baseline above. It may update only governance/state documentation; it must not change semantic, adapter, native, or evidence-oracle behavior.

After #211 is qualified, completely reviewed, freshly authorized, and protected-integrated, the next P0 assess/research seam is **CUDA-JS #32 — exact CUDA-MCGS/CUDA-JS compatible-pair qualification through the public adapter**. #125 has removed the CUDA-MCGS-owned adapter prerequisite, but #32 is not pre-authorized to claim native success: it must first re-read the new protected CUDA-MCGS head, the exact protected CUDA-JS peer, the selected provider/device/target/toolkit facts, the public adapter call surface, and all governing native-evidence requirements.

Any newly demonstrated generic lower capability gap routes to CUDA-JS before a consumer-local workaround or native bypass. CUDA-MCGS must not acquire private CUDA-JS imports, generated-artifact inspection, direct CUDA/PTX/FFI realization, or a second lower request/lifecycle interpreter.

## Parallel and downstream work

- **#109** remains independent post-acceptance public facade/resolver/diagnostics/SDK ergonomics work over the one canonical pre-ignition path. Its older pre-#125 dependency wording is stale and must not be read as a reason to rebuild Composer or create a second runtime.
- **#123** remains the external-consumer acceptance capsule and waits on the usable public #109 surface plus exact compatible-pair evidence from CUDA-JS #32; #124 is relevant only if the selected consumer chooses the optional Tensor evaluator path.
- CUDA-JS #32 is the evidence owner for the first exact native pair. Native proof must run through `integration.cuda-js`, not a diagnostic bypass.

## Immediate dependency chain

1. Qualify and completely review docs-only #211 on its exact head; stop for fresh protected-integration authorization.
2. After #211 integration, read back the new protected CUDA-MCGS commit/tree before creating any #32 qualification branch or capsule.
3. Perform a fresh CUDA-JS #32 assess/research pass against that exact CUDA-MCGS revision and protected `CUDA-JS@49a2f77d2c8364d67030fbc1c2e870e58e70d334`; do not assume portable #125 evidence implies native compatibility.
4. If the design survives, execute the smallest exact compatible-pair/native capsule entirely through public CUDA-JS contracts and the production adapter, recording provider/device/target/toolkit/artifact identity, useful bounded device progress, publication/order, pressure/failure/health, cancellation/timeout disposition, and terminal cleanup truth.
5. Route any generic CUDA gap to CUDA-JS before proceeding. Keep every unproved native requirement deferred.
6. Continue #109 independently, then use #123 to prove an installed external consumer once both the public surface and exact compatible-pair path are ready.

## Ownership boundary

CUDA-MCGS owns Search IR, Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel semantics, finite search resource/pressure policy, deterministic restricted Search Program generation, selected search physical-profile policy, execution-package meaning, canonical pre-ignition composition, and translation of that accepted meaning through `integration.cuda-js`.

CUDA-JS owns consumer-neutral device/context/memory/compiler/artifact/module/function/operation/publication/provider mechanisms, lower request validity and ranges, compatibility facts, errors/health, and lower resource lifecycle. CUDA-JS-Tensor owns generic Tensor mathematics/device-callable Tensor semantics. Product meaning remains downstream.

A need for native/private lower escape code is a missing-library-capability diagnostic, not permission to bypass the owning library.

## Current-state governance

Protected `STATUS.md` and `next_step.yaml` own the live execution seam. Issues own durable obligations and evidence. No protected integration occurs without exact-head qualification, complete review, and fresh authorization. A docs-only reconciliation must read back its resulting protected commit/tree before the next semantic/native branch is created.
