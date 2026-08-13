# CUDA Isolation Plan Amendment — Superseded Pointer

**Status:** Superseded

The exact owner-directed amendment is preserved at [`../archive/plans/2026-08-12-cuda-isolation-plan-amendment.md`](../archive/plans/2026-08-12-cuda-isolation-plan-amendment.md).

It was archived on 2026-08-12 after CUDA-JS protected `main` `fe9ed78939d3876790291421cec367fde58a8310` integrated accepted portable/software SPEC-0013 Device-JS. The amendment's completed dependency step is therefore historical, but its **owner-directed production invariant remains active**:

> CUDA-MCGS owns what search/domain algorithms mean and their restricted Device-JS/Search Program source; CUDA-JS owns CUDA-specific syntax, lowering, generated CUDA/PTX/cubin/LTO artifacts, CUDA compiler/ABI/runtime mechanics, and generic GPU primitives.

Maintained CUDA-MCGS production must not require a local CUDA-specific implementation escape path. Missing generic GPU primitives route to CUDA-JS.

The unfinished neutral native Device-JS proof, Connect Four external deletion, semantic Search Program/package boundary, and exact compatible-pair work continue through [`2026-08-12-v0-forward-plan.md`](2026-08-12-v0-forward-plan.md).
