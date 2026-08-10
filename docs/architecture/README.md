# Architecture

**Status:** Informational

Architecture documents explain UMCGS search boundaries, data flow, specialization, memory planning, generated device programs, peer-runtime integration, and execution models. They are normative only when reflected in an accepted ADR and specification.

The generic Node/CUDA runtime boundary is accepted through ADR-0014. Detailed UMCGS component decomposition, Search IR, package contract, and scheduling remain proposal work.

## Current documents

- [`REPOSITORY_TOPOLOGY.md`](REPOSITORY_TOPOLOGY.md) — accepted peer-repository ownership and artifact-flow explanation.
- [`FRAMEWORK_OVERVIEW.md`](FRAMEWORK_OVERVIEW.md) — proposed search compiler, generated device program, UMCGS adapter, and external CUDA-JS runtime model.

The next boundary is the version-zero UMCGS-to-CUDA-JS package/compatibility contract and revised SPEC-V0 branch/test map described in [`../../next_step.yaml`](../../next_step.yaml).