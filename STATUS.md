# CUDA-MCGS Status

**Status:** Design-principle alignment complete — documentation next

**Updated:** 2026-09-06

## Current execution seam

The existing-code design-alignment pass tracked by **#245** is complete on the integration candidate. The next owner-directed work is **documentation**.

By explicit owner instruction, **#124 remains open, valid, and paused**. Completion of #245 does **not** automatically resume evaluator request accumulation, batching, scatter/readiness/publication, or search-lifecycle work. Resume #124 only from a later explicit owner instruction.

## Preserved #124 foundation

PR #244 remains the protected evaluator device-binding foundation. Its protected integration before this alignment pass was `main@3c82dc430730fe88207e6d5f94040421686b2c0f`, tree `be30d8ae638ea61afd6f8818dfdc5df70e0e1df7`, with the qualified PR-head tree preserved exactly by integration.

That foundation includes:

- public CUDA-JS dense Device-JS scalar/pointer parity for `f64`, `f16`, and `bf16`;
- identity-material typed resource subviews with compiler-owned validation/identity;
- public CUDA-JS memory-view translation with view-relative access and truthful child-before-parent cleanup/quarantine;
- richer stateless public Tensor callable/resource descriptor preservation for a future evaluator binding;
- portable falsifiers only; no physical/native/provider promotion.

PR #241 remains the protected external Device-JS import-composition foundation. Neither foundation was expanded into full #124 runtime composition during the alignment pass.

## Alignment result

1. **Current-state ownership corrected.** CUDA-MCGS owns its own readiness and work ordering. CUDA-JS and CUDA-JS-Tensor own producer capability/qualification facts and no longer gate CUDA-MCGS on a downstream product oracle.
2. **Search Compiler reassessed rather than mechanically split.** `tool.search-compiler` remains one coherent public canonical pre-ignition owner. Existing semantic source modules already form private recursive child LEGOs; no source split was justified merely by file length.
3. **Evidence maintenance mechanized without weakening evidence.** Frozen committed reference identities remain independent expectations. A fail-closed maintenance tool derives/checks recognized locks only from successful producer evidence, while the final integration gate retains an explicit required-owner set and mutation matrix.
4. **Runtime adapter lifecycle corrected.** A failed public child disposal no longer permits parent disposal underneath unproved state; failed disposal is not implicitly retried; repeated close preserves the original quarantined truth. The correction follows accepted CUDA-JS disposal semantics and has focused regression coverage.
5. **Tensor adapter audit found no ownership defect requiring source change.** The connector remains a stateless projection of public Tensor callable/resource facts and does not become a second Tensor planner/runtime or evaluator lifecycle owner.

## Stable ownership boundary

CUDA-MCGS owns Search IR, Graph, Policy, Evaluator, Resource, Progress, Output, Session, Stage, Channel, finite search-resource/pressure policy, deterministic restricted Search Program generation, and canonical pre-ignition composition.

CUDA-JS owns consumer-neutral device/context/memory/compiler/artifact/module/function/operation/publication/provider mechanisms and lower lifecycle/compatibility facts. CUDA-JS-Tensor owns generic Tensor mathematics/planning/device-callable item/workspace semantics. Product/model/checkpoint/domain numerical meaning remains downstream.

A producer repository owns the public facts it exposes. The consuming repository owns whether those facts are sufficient. No sibling repository is a second owner of CUDA-MCGS readiness.

## Portfolio remainder

The dormant/reserved CUDA semantic repositories remain activation-gated and gained no production code during this pass. CUDA-MM remains an unactivated reserved physical-policy owner; its live repository governance issue #2 still truthfully records that `main` protection is not yet aligned. That external repository-setting deficit does not authorize a hidden CUDA-MM dependency or new CUDA-MCGS capability.

Direct physical NVIDIA qualification also remains deferred, not waived. Portable, hosted, VM, mock, and package evidence prove only the semantics they execute.

## Hard limits

- No C/C++/CUDA/PTX/native FFI maintained in CUDA-MCGS.
- No Python.
- No private/deep CUDA-JS or CUDA-JS-Tensor imports.
- No product semantics moved upstream.
- No #124 feature expansion in the alignment pass.
- No public schema/API churn solely to reduce file size.
- No weakening of exact evidence, lifecycle, cleanup, or compatibility gates.
- Documentation is the next owner-directed seam; #124 stays paused until explicitly resumed.
