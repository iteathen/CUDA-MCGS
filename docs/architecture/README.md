# Architecture

**Status:** Informational

Architecture documents explain CUDA-MCGS search boundaries, data flow, specialization, memory planning, generated device programs, peer-runtime integration, and execution models. They are normative only when reflected in an accepted ADR and specification. Device publication, graph identity/edge ownership, path-cycle ordering, finite-resource exhaustion, partial-result validity, and scheduler-neutral conformance are governed by [`SPEC-0001`](../specs/SPEC-0001-device-search-publication-and-resources.md); the concrete backend-neutral Search IR 0.1.0 and deterministic reference semantics are governed by [`SPEC-0002`](../specs/SPEC-0002-search-ir-and-reference-semantics.md).

The generic Node/CUDA runtime boundary is accepted through ADR-0014. Detailed CUDA-MCGS production component decomposition, lowering, package contract, and scheduling remain proposal work.

## Current documents

- [`REPOSITORY_TOPOLOGY.md`](REPOSITORY_TOPOLOGY.md) — accepted peer-repository ownership and artifact-flow explanation.
- [`FRAMEWORK_OVERVIEW.md`](FRAMEWORK_OVERVIEW.md) — proposed search compiler, generated device program, UMCGS adapter, and external CUDA-JS runtime model.

The next boundary is the remaining domain, policy, evaluator, full resource/memory, output, and execution-package composition assessment described in [`../../next_step.yaml`](../../next_step.yaml), followed by focused specifications and the version-zero CUDA-MCGS-to-CUDA-JS compatibility contract.
