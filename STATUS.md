# CUDA-MCGS Status

**Status:** Active

**Updated:** 2026-09-04

## Protected state

Protected `main@5bdfa7b63d9a2f19e26e862e5c217ee717af12b0`, tree `a2a2b154375dec372746368da0ac589384f1954e`, contains the accepted universal semantic/reference packet, #199 operation-local resource access, #202 bounded external-control sideband projection, and the #205 production ownership promotion.

`tool.search-compiler` is now the durable production owner for the canonical pre-ignition Search IR/profile normalization and composition implementation under `components/search-compiler/`. The 14 canonical implementation modules are byte-identical to their protected pre-promotion sources. Fixture/catalog/deletion/mutation/export/reference support is separated under `conformance/search-compiler/`; the old Composer experiment implementation path is absent and there is no compatibility shim or second semantic interpreter.

The accepted packet remains 12 contracts, 989/989 classified Composer requirements, 937 `accepted-reference`, exactly 52 `deferred-native`, 0 pending, 883/883 Composer cases, and 393/393 CUDA-free reference routes. This still does not claim native GPU correctness, physical publication/memory-order qualification, performance, stable SDK, multi-GPU support, product behavior, or an exact CUDA-JS compatible pair.

## Current production seam

**#125 — implement the public CUDA-JS runtime adapter for accepted execution packages** is the next P0 owner, but the next action is a fresh assess/research pass rather than implementation by assumption.

The live prerequisite reassessment after #205 found #122, #193, CUDA-JS #178/#179/#180/#181, CUDA-JS-Tensor #40/#44/#45, #199, #202/#204 and #205/#206 closed or protected-dispositioned. The stale paused `impl/125-public-cuda-js-runtime-adapter` branch must not be reused.

The controlling #193 disposition remains:

- CUDA-MCGS owns Search Program/package meaning, MCGS finite resource/layout requirements, operation-local semantic access, selected search physical-profile policy, bounded control/observation semantics and mapping lower failures into MCGS dispositions;
- `integration.cuda-js` constructs actual lower request objects from the installed/versioned public CUDA-JS contract;
- CUDA-JS owns lower request validity/ranges, device/target selection, compilation/linking, module/function/artifact resources, memory/allocation admission, prepared operations/DAGs, publication/synchronization, provider facts/lifecycle, errors/health and teardown;
- CUDA-JS #180 concluded existing compiler/module/function/prepared-DAG bricks are the correct LEGO composition; no new universal preparation transaction is required;
- CUDA-JS #181 preserves explicit expert grid/block control for materially selected MCGS topology; no required generic launch resolver was justified;
- public `cuda-js@0.1.0-alpha.18` ordinary allocation alignment remains a lower compatibility fact to validate against, not copy into MCGS authority.

Any newly demonstrated missing generic lower capability stops #125 and routes to CUDA-JS before workaround code.

## Immediate dependency chain

1. Reconcile post-#205 protected status through #207.
2. Start a fresh #125 focus branch from the reconciled protected main.
3. Assess AGENTS/ADRs/specs, current `integration.cuda-js` reservation, accepted execution-package surface, CUDA-JS alpha.18 public package, and lifecycle/failure tests before production mutation.
4. If the design survives and no lower gap appears, implement one replaceable adapter using only public CUDA-JS contracts and a fake injected runtime for portable lifecycle/failure qualification.
5. CUDA-JS #32 later owns exact compatible-pair/native publication, race, cancellation and teardown evidence through that adapter; #109 independently owns the stable public library/resolver facade.

## Ownership boundary

CUDA-MCGS owns Search IR, Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel semantics, finite search resource/pressure policy, deterministic restricted Search Program generation, selected search physical-profile policy, execution-package meaning and its canonical pre-ignition implementation.

CUDA-JS owns consumer-neutral device/context/memory/compiler/artifact/module/function/operation/publication/provider mechanisms, lower validity/compatibility facts, errors/health and lower resource lifecycle. CUDA-JS-Tensor owns generic Tensor mathematics/device-callable Tensor semantics. Product meaning remains downstream.

A need for native/private lower escape code is a missing-library-capability diagnostic, not permission to bypass the owning library.

## Current-state governance

Protected `STATUS.md` and `next_step.yaml` own the live execution seam. Issues own durable obligations and evidence. No protected integration occurs without exact-head qualification, complete review and fresh authorization.
