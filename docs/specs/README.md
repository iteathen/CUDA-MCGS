# Specifications

**Status:** Informational

This directory contains versioned normative contracts. No framework interface is accepted merely because it appears in architecture discussion or research.

Planned specification families:

- normalized Search IR;
- domain/state/action/transition contract;
- search-policy selection/reservation/backup contract;
- evaluator/model contract;
- resource and memory-plan contract;
- graph identity, transposition, history, and cycle semantics;
- execution/device-closure and scheduling contract;
- device module ABI and JIT/link contract;
- output, lifecycle, persistence, and reroot contract;
- conformance-domain and benchmark requirements.

Use [`../../agent_files/templates/specification.template.md`](../../agent_files/templates/specification.template.md). An accepted specification must define invariants, ranges, ownership, lifecycle, failures/exhaustion, compatibility, security, and validation.

## Current proposals

- [`SPEC-0000-framework-requirements.md`](SPEC-0000-framework-requirements.md) — specification map and cross-cutting conformance requirements; not yet an implementable accepted contract.
