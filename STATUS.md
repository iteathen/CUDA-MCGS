# CUDA-MCGS Status

**Status:** Active — design-principle alignment

**Updated:** 2026-09-06

## Current execution seam

The active CUDA-MCGS maintenance lane is **#245 — design-principle alignment before further runtime expansion**.

By explicit owner instruction, **#124 remains open and valid but is not active work**. Do not resume evaluator request accumulation, batching, scatter/readiness/publication or search-lifecycle expansion until #245 is completed or explicitly superseded. The already-qualified #124 foundations are preserved unchanged.

## Current protected foundation

PR #244 is protected-complete. Current protected `main` is `3c82dc430730fe88207e6d5f94040421686b2c0f`, tree `be30d8ae638ea61afd6f8818dfdc5df70e0e1df7`. The rebase-merged protected tree is identical to the exact qualified PR head tree.

That foundation includes:

- public CUDA-JS dense Device-JS scalar/pointer parity for `f64`, `f16` and `bf16`;
- identity-material typed resource subviews with compiler-owned validation/identity;
- public CUDA-JS memory-view translation with view-relative access and truthful child-before-parent cleanup/quarantine;
- richer stateless public Tensor callable/resource descriptor preservation needed by a future evaluator binding;
- portable falsifiers only; no physical/native/provider promotion.

PR #241 remains the protected external Device-JS import-composition foundation. These are foundations only; full #124 runtime composition remains paused.

## Alignment goals

Issue #245 owns the current maintenance pass:

1. **Current-state ownership:** CUDA-MCGS owns its own readiness and work ordering. CUDA-JS and CUDA-JS-Tensor may expose producer capability/qualification facts but must not gate CUDA-MCGS on a downstream product oracle.
2. **Recursive LEGO implementation:** keep `tool.search-compiler` as the single public canonical pre-ignition owner, while splitting private implementation only at real semantic/resource/failure/attention seams where the complete working set has become too large.
3. **Evidence maintenance:** preserve exact committed frozen evidence and independent checking while replacing avoidable manual transitive hash bookkeeping with a mechanical fail-closed maintenance path.
4. **Adapter ownership/lifecycle:** verify `integration.cuda-js` and `integration.cuda-js-tensor` remain translators of public facts rather than second semantic/runtime/lifecycle owners.
5. **Behavior preservation:** alignment must not change accepted public semantics merely for cleanliness; exact-head qualification remains required.

## Stable ownership boundary

CUDA-MCGS owns Search IR, Graph, Policy, Evaluator, Resource, Progress, Output, Session, Stage, Channel, finite search-resource/pressure policy, deterministic restricted Search Program generation and canonical pre-ignition composition.

CUDA-JS owns consumer-neutral device/context/memory/compiler/artifact/module/function/operation/publication/provider mechanisms and lower lifecycle/compatibility facts. CUDA-JS-Tensor owns generic Tensor mathematics/planning/device-callable item/workspace semantics. Product/model/checkpoint/domain numerical meaning remains downstream.

A producer repository owns the public facts it exposes. The consuming repository owns whether those facts are sufficient. No sibling repository may become a second owner of CUDA-MCGS readiness.

## Physical evidence

Direct physical NVIDIA qualification remains deferred, not waived. CUDA-JS #32, CUDA-MCGS #37 and CUDA-MCGS #105 remain separate resumable evidence cells. Portable, hosted, VM, mock and package evidence may prove only the semantics they execute.

## Hard limits

- No C/C++/CUDA/PTX/native FFI maintained in CUDA-MCGS.
- No Python.
- No private/deep CUDA-JS or CUDA-JS-Tensor imports.
- No product semantics moved upstream.
- No #124 feature expansion inside the design-alignment pass.
- No public schema/API churn solely to reduce file size.
- No weakening of exact evidence, lifecycle, cleanup or compatibility gates.
- Protected integration requires exact-head qualification, complete review, exact base/tree validation and protected read-back.
