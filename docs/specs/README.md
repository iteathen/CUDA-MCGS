# Specifications

**Status:** Informational

This directory contains versioned normative UMCGS search contracts. No interface is accepted merely because it appears in architecture discussion, research, implementation, tests, a plan, or an example.

Read specifications through [`../../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md`](../../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md): verify status, owner, scope, version, exact revision, and supersession; follow normative references; read governing requirements to semantic closure; inspect material producer/consumer/lifecycle/test adjacency; and refresh when scope or authority changes.

Accepted status governs only within declared scope. Proposal specifications support drafting, review, and explicitly authorized experiments; they do not authorize production implementation by themselves.

Planned UMCGS specification families:

- normalized Search IR;
- domain/state/action/transition contract;
- search-policy selection/reservation/backup contract;
- evaluator/model semantic and resident-fragment contract;
- search resource and finite memory-plan contract;
- graph identity, transposition, history, and cycle semantics;
- device-owned search scheduling, stopping, and device-closure contract;
- search-specific generated layout/device-module contract;
- UMCGS-to-CUDA-JS execution-package, capability, compatibility, error, and lifecycle contract;
- output, persistence, reroot, and reclamation contract;
- synthetic conformance-domain, search-quality, and benchmark requirements.

Generic CUDA Driver symbol schemas, host-call ABI/JIT bindings, memory-provider implementation, NVRTC plumbing, stream/event wrappers, Node event-loop delivery, and generic context teardown are CUDA-JS specification families and do not live here.

Use [`../../agent_files/templates/specification.template.md`](../../agent_files/templates/specification.template.md) together with its governing reading, engineering, contract, compatibility, testing, and documentation methods. An accepted UMCGS specification must define applicability, normative references, invariants, ranges, ownership, lifecycle, failures/exhaustion, compatibility, security, generated/cache identity, testing, cleanup, downstream invalidation, and peer-runtime effects.

## Current proposals

- [`SPEC-0000-framework-requirements.md`](SPEC-0000-framework-requirements.md) — UMCGS specification map and cross-cutting conformance requirements; not yet an implementable accepted contract.

The next specification boundary is the version-zero UMCGS-to-CUDA-JS package and compatibility contract described in [`../../next_step.yaml`](../../next_step.yaml). Its cross-repository authority closure remains bounded until the private CUDA-JS repository and accepted public runtime contract exist.
