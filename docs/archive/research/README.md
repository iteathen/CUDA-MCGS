# Archived research evidence

**Status:** Informational

This directory preserves useful research evidence from superseded branches without restoring their stale decision numbering, control-plane state, or implementation authority.

## PR #126 preservation

`2026-08-25-tensor-math-in-mcgs-assessment.md.txt` is a byte-for-byte archival snapshot from `docs/external-engine-readiness-2026-08-26@304b0be8ad9a3ca33015ff471cc77a3af79a8bb4` (PR #126).

The snapshot contains useful research on neural evaluators, CUDA-JS-Tensor ownership, demand-driven batching, prospective/speculative search techniques, grouped execution, and the distinction between tensor-shaped work and Tensor Core acceleration. It is retained because that evidence remains useful to later Evaluator and performance work.

It is **not active authority**. PR #126 also carried stale `STATUS.md`/`next_step.yaml` state and ADR numbering that conflicts with later accepted decisions. Do not use the archived snapshot to override the active tree. Current ownership and execution authority come from the active `STATUS.md`, `next_step.yaml`, accepted ADRs, and current specs.

The other stale control-state and draft-decision material from PR #126 remains recoverable from Git history and the PR itself and is intentionally not duplicated here.
