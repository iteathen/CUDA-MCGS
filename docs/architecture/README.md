# Architecture

**Status:** Informational

Architecture documents explain CUDA-MCGS/UMCGS search boundaries, data flow, specialization, schema-backed extension composition, finite memory planning, generated Search Images, peer-runtime integration, and device-owned execution models. They are normative only when reflected in an accepted ADR and specification. Device publication, graph identity/edge ownership, path-cycle ordering, finite-resource exhaustion, partial-result validity, and scheduler-neutral conformance are governed by [`SPEC-0001`](../specs/SPEC-0001-device-search-publication-and-resources.md). The foundational backend-neutral Search IR 0.1.0 slice and deterministic reference semantics for that boundary are governed by [`SPEC-0002`](../specs/SPEC-0002-search-ir-and-reference-semantics.md).

The generic Node/CUDA runtime boundary is accepted through ADR-0014. The complete stage/channel-capable Search IR, Stage Extension Surface/Stage PTX representation, package contract, production graph/transposition implementation, and scheduling remain proposal/experiment work.

## Current documents

- [`REPOSITORY_TOPOLOGY.md`](REPOSITORY_TOPOLOGY.md) — accepted peer-repository ownership and artifact-flow explanation, refreshed for the current public CUDA-JS peer.
- [`FRAMEWORK_OVERVIEW.md`](FRAMEWORK_OVERVIEW.md) — proposed contract/schema/Search Composer model, semantic Search Stages, stable entry/exit surfaces, Async Stage Channels, optional composed Stage PTX, finite specialized Search Image, CUDA-MCGS adapter, and external CUDA-JS runtime boundary.

The current integration boundary extends the accepted 0.1.0 foundation with Search Stage/channel semantics and version-zero Stage PTX composition plus the CUDA-MCGS-to-CUDA-JS Search Image/package contract described in [`../../next_step.yaml`](../../next_step.yaml). Relocatable PTX is selected instead of LTO. Scheduler topology and transposition-table implementation remain evidence-selected rather than architecture-fixed.
