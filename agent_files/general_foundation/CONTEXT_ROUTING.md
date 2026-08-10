# Context Routing

**Scope:** Reusable foundation.

## Goal

Load the smallest authoritative context sufficient for the task. Repeatedly reading every historical file increases drift and allows stale proposals to regain authority.

## Retrieval sequence

1. Read root `AGENTS.md` and canonical agent rules.
2. Read `STATUS.md` and `next_step.yaml` for current state.
3. Identify the exact ownership boundary.
4. Read accepted ADRs that govern it.
5. Read the accepted specification for the behavior.
6. Inspect implementation, persistent state, and tests owned by that boundary.
7. Read architecture or research only when rationale, alternatives, or external facts are material.
8. Consult archive only for provenance.

## Freshness checks

Before relying on a document, confirm:

- it has a recognized status;
- it is linked from a current index or registry;
- no later ADR/spec supersedes it;
- current observed behavior does not contradict it;
- its scope actually owns the question.

When uncertain, cite the conflict and apply the reasoning gate.

## Task-local note

For long work, retain a compact note containing task, boundary, authority read, files in/out of scope, success evidence, and unresolved assumptions. Temporary scratch notes are not durable authority.
