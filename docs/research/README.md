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

The current research conclusion is that no reviewed search framework supplies the complete CUDA-MCGS boundary, but proven CUDA composition/collection mechanisms substantially reduce the amount that must be invented. The plan therefore favors methodology reuse, selective explicitly governed source reuse, and local ownership of search-critical semantics/execution rather than mandatory higher-level runtime dependencies.

Research follows [`../../agent_files/application_specific/RESEARCH_POLICY.md`](../../agent_files/application_specific/RESEARCH_POLICY.md).
