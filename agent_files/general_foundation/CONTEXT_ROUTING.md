# Context Routing

**Scope:** Reusable foundation.

## Goal

Load the smallest authoritative context sufficient for the task. Repeatedly reading every historical file increases drift and allows stale proposals to regain authority.

## Retrieval sequence

1. Read root `AGENTS.md` and canonical agent rules.
2. Read `STATUS.md` and `next_step.yaml` for current state.
3. Identify the exact product area, component, and ownership boundary in `SYSTEM_REGISTRY.md`.
4. For structural work, read the general and application-specific organization guides plus affected component manifests.
5. Read accepted ADRs that govern the boundary.
6. Read the accepted specification for the behavior.
7. Inspect implementation, persistent state, tests, and benchmarks owned by that component.
8. Read architecture or research only when rationale, alternatives, or external facts are material.
9. Consult archive only for provenance.

## Freshness checks

Before relying on a document, confirm:

- it has a recognized status where status applies;
- it is linked from a current index or registry;
- no later ADR/spec supersedes it;
- current observed behavior does not contradict it;
- its scope actually owns the question;
- the referenced component manifest and path still match the repository.

When uncertain, cite the conflict and apply the reasoning gate.

## Task-local note

For long work, retain a compact note containing task, product area/component, authority read, files in/out of scope, public/dependency effects, success evidence, and unresolved assumptions. Temporary scratch notes are not durable authority.
