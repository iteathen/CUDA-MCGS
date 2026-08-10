# Canonical Agent Operating Manual

**Scope:** All research, specification, implementation, review, debugging, documentation, and publication work in UMCGS.

## Mission

Produce trustworthy, reusable engineering progress without allowing the first domain, first model, first GPU, or first implementation shortcut to become an accidental universal constraint.

## Required orientation

1. Read the root `AGENTS.md` and `AI_RULES.md`.
2. Identify the task class: research, specification, decision, implementation, debugging, review, validation, migration, or publication.
3. Use `SYSTEM_REGISTRY.md` to identify the owning boundary and authoritative documents.
4. Inspect repository state and unrelated work before editing.
5. Establish purpose, expected ranges, invariants, resource limits, lifecycle, failures, and evidence requirements.
6. Apply the reasoning gate.

## Task routing

| Task | Required authority before editing |
|---|---|
| Research | Research policy, exact sources, revision and license |
| Foundational design | Charter, prior ADRs, decision-ready alternatives |
| Normative contract | Accepted owner direction and specification scope |
| Production implementation | Accepted specification for the owned boundary |
| Disposable experiment | Named question, disposal criteria, non-production label |
| Debugging | Expected behavior, reproducible symptom, trustworthy state |
| Performance work | Reproducible benchmark and profiler evidence |
| Migration | Source/target authority, compatibility and rollback plan |
| Publication | Clean scope, validation evidence, inspected diff |

## Reasoning levels

### Routine

Formatting, exact-link repair, mechanical index updates, and clearly specified local changes may proceed with ordinary reasoning after repository inspection.

### Substantial

Cross-file behavior, public interfaces, persistent formats, tests, dependency changes, and ownership movement require an explicit plan and focused validation.

### Critical

CUDA execution, synchronization, atomics, memory layout, allocator/reclamation behavior, JIT/ABI, schema semantics, state identity, transpositions, cycles, evaluator integration, numerical contracts, and hot-path optimization require high reasoning and evidence. If the agent cannot demonstrate both, it must not edit the boundary.

## Core execution loop

1. **Orient** — authority, state, scope, prior work.
2. **Bound** — purpose, ownership, contracts, ranges, failures, resources.
3. **Research** — inspect relevant prior art and platform constraints.
4. **Specify** — settle foundational behavior before production code.
5. **Plan** — one coherent change, validation, migration, documentation.
6. **Implement** — preserve ownership and avoid unrelated cleanup.
7. **Validate** — focused checks, integration, failure paths, complete relevant suite.
8. **Reconcile** — update authority, indexes, registry, and archived history.
9. **Publish** — inspect status/diff, commit coherently, record exact state.
10. **Hand off** — completed work, evidence, risks, and one next boundary.

Detailed procedures are in `general_foundation/WORKFLOW.md`; use `CONTEXT_ROUTING.md` to limit stale context and `REVIEW.md` before publication.

## Completion definition

A task is complete only when:

- the intended owned behavior exists;
- applicable invariants and failure behavior are verified;
- no test or gate was weakened to obtain success;
- authoritative documentation and registry entries agree with the result;
- superseded material is handled with provenance;
- repository state is intentional and reported accurately;
- unresolved work is explicit in `next_step.yaml` rather than hidden in prose.

## Source and claim discipline

Every important statement should be identifiable as one of:

- owner requirement;
- accepted specification or decision;
- verified observed behavior;
- inference from cited evidence;
- proposal;
- unresolved assumption.

Never present an inference as a measurement, a proposal as accepted, or a local commit as published remote state.
