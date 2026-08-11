# Architecture

**Status:** Informational

Architecture documents explain CUDA-MCGS/UMCGS search boundaries, data flow, specialization, schema-backed extension composition, finite memory planning, generated Search Images, peer-runtime integration, and device-owned execution models. They are normative only when reflected in an accepted ADR and specification.

The generic Node/CUDA runtime boundary is accepted through ADR-0014. Detailed Search IR, Extension Surface representation, package contract, graph/transposition implementation, and scheduling remain proposal/experiment work.

## Current documents

- [`REPOSITORY_TOPOLOGY.md`](REPOSITORY_TOPOLOGY.md) — accepted peer-repository ownership and artifact-flow explanation, refreshed for the current public CUDA-JS peer.
- [`FRAMEWORK_OVERVIEW.md`](FRAMEWORK_OVERVIEW.md) — proposed contract/schema/Search Composer model, schema-backed Extension Surface/Point/Fragment composition, finite specialized Search Image, CUDA-MCGS adapter, and external CUDA-JS runtime boundary.

The current integration boundary is the version-zero extension composition plus CUDA-MCGS-to-CUDA-JS Search Image/package contract described in [`../../next_step.yaml`](../../next_step.yaml). Device LTO is the preferred first composition experiment, while scheduler topology and transposition-table implementation remain evidence-selected rather than architecture-fixed.
