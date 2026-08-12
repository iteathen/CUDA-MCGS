# Specifications

**Status:** Informational

This directory contains versioned normative UMCGS/CUDA-MCGS search contracts. CUDA-MCGS is the product-facing name; existing accepted UMCGS identifiers remain authoritative until a separate naming/repository migration is accepted. No interface is accepted merely because it appears in architecture discussion, research, implementation, tests, a plan, or an example.

Read specifications through [`../../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md`](../../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md): verify status, owner, scope, version, exact revision, and supersession; follow normative references; read governing requirements to semantic closure; inspect material producer/consumer/lifecycle/test adjacency; and refresh when scope or authority changes.

Accepted status governs only within declared scope. Proposal specifications support drafting, review, and explicitly authorized experiments; they do not authorize production implementation by themselves.

## Current accepted contracts

- [`SPEC-0001-device-search-publication-and-resources.md`](SPEC-0001-device-search-publication-and-resources.md) — backend-neutral publication, graph identity/edge ownership, path-cycle ordering, finite-resource exhaustion, partial-result validity, and scheduler-neutral conformance, version 0.1.0.
- [`SPEC-0002-search-ir-and-reference-semantics.md`](SPEC-0002-search-ir-and-reference-semantics.md) — the foundational Search IR 0.1.0 representation, strict normalization, canonical identity, and deterministic CUDA-free reference semantics for the SPEC-0001 boundary.

These contracts do not authorize production CUDA lowering, a generated ABI, the complete extension-capable Search IR, a production scheduler or graph store, or CUDA-JS integration.

## Planned CUDA-MCGS specification families

- normalized Search IR;
- domain/state/action/transition contract and device realization;
- search-policy selection/reservation/backup contract and device realization;
- evaluator/model semantic and resident-device contract;
- operational Search Stage graph, semantic boundary selection, and stage-owned entry/exit surfaces;
- stage capability composition and optional Stage PTX realization;
- nonblocking Async Stage Channels, readiness, progress, cancellation, expiry, and reclamation;
- Search Composer lowering, compatibility, finite resource planning, and deterministic specialization identity;
- search resource and finite memory-plan contract, including stage capability/channel state and workspace;
- graph identity, transposition, publication, history, and cycle semantics;
- device-owned search scheduling, stopping, and device-closure contract;
- search-specific generated layout/device-module/Search Image contract;
- CUDA-MCGS-to-CUDA-JS execution-package, capability, compatibility, error, and lifecycle contract;
- output, persistence, reroot, and reclamation contract;
- synthetic conformance-domain, stage/channel/Stage PTX cost, search-quality, and benchmark requirements.

Generic CUDA Driver symbol schemas, host-call ABI/JIT bindings, memory-provider implementation, NVRTC/nvJitLink plumbing, stream/event wrappers, Node event-loop delivery, and generic context teardown are CUDA-JS specification families and do not live here.

Use [`../../agent_files/templates/specification.template.md`](../../agent_files/templates/specification.template.md) together with its governing reading, engineering, contract, compatibility, testing, and documentation methods. An accepted CUDA-MCGS specification must define applicability, normative references, invariants, ranges, ownership, lifecycle, failures/exhaustion, compatibility, security, generated/cache identity, testing, cleanup, downstream invalidation, and peer-runtime effects.

## Current proposals

- [`SPEC-0000-framework-requirements.md`](SPEC-0000-framework-requirements.md) — framework specification map and cross-cutting conformance requirements, including the schema-backed extension model and zero-abstraction-cost target; not yet an implementable accepted contract.
- [`SPEC-0003-search-stage-and-extension-surface.md`](SPEC-0003-search-stage-and-extension-surface.md) — operational Search Stage graph, semantic/useful boundary selection, stable entry/exit checkpoints, shared stage capability sets, and no mid-stage extension mutation.
- [`SPEC-0004-async-stage-channels.md`](SPEC-0004-async-stage-channels.md) — bounded cross-stage/cross-surface dataflow, required-result pending states, release/acquire publication, progress, pressure, cancellation and reclamation without worker blocking.
- [`SPEC-0005-stage-ptx-and-search-image-composition.md`](SPEC-0005-stage-ptx-and-search-image-composition.md) — zero-or-one optional composed Stage PTX input per stage, checkpoint ABI, empty-capability disappearance, compatible-pair identity, and representative cost gates.

SPEC-0003 through SPEC-0005 are proposal outputs of the stage-model reassessment; they do not authorize production lowering. The next accepted boundary must extend Search IR 0.1.0 with stage/channel representations and complete the dependent domain, policy, evaluator, graph/storage, scheduler, resource and output contracts described in [`../../next_step.yaml`](../../next_step.yaml). The current CUDA-JS peer is public and has bounded F1-F9 evidence; source-authored Stage PTX also depends on reassessing the relocatable-device-code work after the active CUDA-JS compiler/LTO work finishes.
