# Research

**Status:** Informational

Research records external evidence that may affect CUDA-MCGS/UMCGS. It does not govern the project until converted into an accepted ADR or specification.

## CUDA-JS runtime boundary

- [`2026-08-10-cuda-js-assumption-audit.md`](2026-08-10-cuda-js-assumption-audit.md) — historical official-source audit of the initial CUDA-JS sketch, including Node-API/JIT boundaries, NVRTC scope, managed/mapped memory, host micro-batching, atomic publication, and CUDA context-health implications.
- [`2026-08-10-cuda-js-foundation-result.md`](2026-08-10-cuda-js-foundation-result.md) — historical exact local foundation result and experiment ordering that preceded the now-public CUDA-JS peer. Current peer state is tracked in `STATUS.md`, repository topology, and exact CUDA-JS revision evidence.

## Prior art

- [`prior-art/README.md`](prior-art/README.md) — review index and method.
- [`prior-art/2026-08-10-landscape.md`](prior-art/2026-08-10-landscape.md) — MCTS/MCGS/GPU framework assessment expanded on 2026-08-11 with cuVS JIT-LTO, cuFFT LTO callbacks, NVRTC/nvJitLink, CUDA Graphs, cuCollections, CCCL, an ownership-versus-dependency disposition, and the selected version-zero relocatable-PTX direction.
- [`prior-art/source-register.yaml`](prior-art/source-register.yaml) — machine-readable exact revisions, licenses/terms, inspected paths, dispositions, and revisit triggers.

## Stage-resident search execution

- [`2026-08-11-stage-resident-extension-assessment.md`](2026-08-11-stage-resident-extension-assessment.md) — official CUDA and primary-literature research plus a second-pass adversarial assessment of semantic Search Stages, stable entry/exit surfaces, one optional composed Stage PTX input per stage, and nonblocking cross-stage/cross-surface dataflow.

## Tensor-shaped MCGS execution

- [`2026-08-25-tensor-math-in-mcgs-assessment.md`](2026-08-25-tensor-math-in-mcgs-assessment.md) — evidence-backed disposition separating tensor-shaped batching from Tensor Core execution, identifying evaluator/model batching as the strongest owner-local candidate, and rejecting tensor-shaped live-graph foundations without representative end-to-end evidence.

The current research conclusion is that no reviewed search framework supplies the complete CUDA-MCGS boundary, but proven CUDA composition, task-parallel, publication and collection mechanisms substantially reduce the amount that must be invented. The stage reassessment retires fine independently callable PTX hooks in favor of useful semantic stage boundaries, shared stage capability sets, and bounded nonblocking dataflow while keeping physical scheduler topology experiment-selected.

Research follows [`../../agent_files/application_specific/RESEARCH_POLICY.md`](../../agent_files/application_specific/RESEARCH_POLICY.md).
