# Specifications

**Status:** Informational

This directory contains versioned normative UMCGS/CUDA-MCGS search contracts. CUDA-MCGS is the product-facing name; existing accepted UMCGS identifiers remain authoritative until a separate naming/repository migration is accepted. No interface is accepted merely because it appears in architecture discussion, research, implementation, tests, a plan, or an example.

Read specifications through [`../../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md`](../../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md): verify status, owner, scope, version, exact revision, and supersession; follow normative references; read governing requirements to semantic closure; inspect material producer/consumer/lifecycle/test adjacency; and refresh when scope or authority changes.

Accepted status governs only within declared scope. Proposal specifications support drafting, review, and explicitly authorized experiments; they do not authorize production implementation by themselves.

## Planned CUDA-MCGS specification families

- normalized Search IR;
- domain/state/action/transition contract and device realization;
- search-policy selection/reservation/backup contract and device realization;
- evaluator/model semantic and resident-device contract;
- Search Extension Surface, Extension Point, Extension Contract, Context Schema, Extension Fragment manifest, and composition rules;
- Search Composer lowering, compatibility, finite resource planning, and deterministic specialization identity;
- search resource and finite memory-plan contract, including extension state/workspace;
- graph identity, transposition, publication, history, and cycle semantics;
- device-owned search scheduling, stopping, and device-closure contract;
- search-specific generated layout/device-module/Search Image contract;
- CUDA-MCGS-to-CUDA-JS execution-package, capability, compatibility, error, and lifecycle contract;
- output, persistence, reroot, and reclamation contract;
- synthetic conformance-domain, extension-cost, search-quality, and benchmark requirements.

Generic CUDA Driver symbol schemas, host-call ABI/JIT bindings, memory-provider implementation, NVRTC/nvJitLink plumbing, stream/event wrappers, Node event-loop delivery, and generic context teardown are CUDA-JS specification families and do not live here.

Use [`../../agent_files/templates/specification.template.md`](../../agent_files/templates/specification.template.md) together with its governing reading, engineering, contract, compatibility, testing, and documentation methods. An accepted CUDA-MCGS specification must define applicability, normative references, invariants, ranges, ownership, lifecycle, failures/exhaustion, compatibility, security, generated/cache identity, testing, cleanup, downstream invalidation, and peer-runtime effects.

## Current proposals

- [`SPEC-0000-framework-requirements.md`](SPEC-0000-framework-requirements.md) — framework specification map and cross-cutting conformance requirements, including the schema-backed extension model and zero-abstraction-cost target; not yet an implementable accepted contract.

The next specification boundary is the canonical Extension Surface/Point/Context Schema/Fragment representation plus the minimum Search Image/CUDA-JS package contract described in [`../../next_step.yaml`](../../next_step.yaml). The current CUDA-JS peer is public and has bounded F1-F9 evidence; the remaining interop blocker is the exact CUDA-MCGS specification/experiment/compatible-pair evidence, not repository publication.
