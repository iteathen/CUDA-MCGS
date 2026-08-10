# ADR-0011: Focus-Branch Decomposition and Integration

**Status:** Accepted

**Date:** 2026-08-10

## Context

Large or complex tasks create two opposite failure modes. An agent may keep the entire task nominally active and lose detail through skimming, sampling, stale context, and attention dilution. Or it may split work into local pieces that appear correct independently but no longer share authority, terminology, ownership, resource assumptions, or integration meaning.

UMCGS already requires focused semantic review branches for system-wide sanity work, governed dependency-ready plan nodes, exact-head PR integration, and explicit cleanup. The same full-attention and reconciliation principles must govern large research, design, specification, implementation, migration, debugging, validation, and release tasks before they reach review.

The project owner directed that agents be taught to use focus branches when a task is large or complex.

## Source adaptation

This decision generalizes and adapts:

- UMCGS ADR-0007 and `agent_files/general_foundation/SANITY_CHECKING.md`, especially semantic review branches, the full-attention sizing rule, invalidation, and central reconciliation;
- UMCGS ADR-0009 and `PLAN_EXECUTION.md`, especially dependency-ready nodes, coherent operations, immediate inspection, parallel write-surface rules, and exact output revisions;
- UMCGS ADR-0010 and `CLEANUP_AND_DISPOSITION.md`, especially explicit branch/worktree/artifact lifecycle and verified final state;
- `iteathen/Ars-Thaumaturgica` `docs/foundation/multi-scale-synthesis.md`, which requires exact local anchors, widening only to material consequences, and returning broad conclusions to concrete owners and evidence;
- Ars Thaumaturgica `docs/foundation/github-backed-work-coordination.md`, which preserves one canonical work truth and uses branches/issues/PRs only when collaboration, continuation, risk, or lifecycle justify them.

UMCGS adds a general parent-task/integration-spine model, explicit focus-branch contracts, shared-contract invalidation, context packets, and UMCGS-specific contract/device/search integration requirements. The UMCGS doctrine is authoritative here; the source material records provenance rather than an external dependency.

## Decision

UMCGS adopts semantic focus-branch decomposition for large and complex tasks.

A **focus branch** is a bounded semantic workstream with one primary question or outcome, one primary owner, a minimal context packet, explicit inputs and outputs, independent evidence, and a declared integration obligation.

A focus branch is not automatically a Git branch, issue, PR, component, or document. Git topology is used only when isolation, parallel work, review, transport, rollback, experiment, release, migration, audit, or recovery requires it.

Every decomposed task must retain one canonical parent task and integration spine. The parent owns the final outcome, authority, global invariants, shared vocabulary, branch map, dependency graph, integration owner, invalidation, contradictions, global validation, cleanup, and closure decision.

## Trigger

A focus-branch map is required before deep execution when the task exceeds one focused session’s active context, spans multiple semantic owners/contracts/paths/artifact families, contains independent unknowns or specialist risks, crosses agents/sessions, permits parallel work, requires different validation or rollback boundaries, or would otherwise force sampling, skimming, or delayed attention.

Routine reversible single-owner work remains one coherent node without artificial decomposition.

## Full-attention sizing

A leaf focus branch is valid only when one qualified agent can retain without sampling or skimming:

- its question, output, authority, owner, scope, and exclusions;
- inputs, dependencies, consumers, and shared invariants;
- local mechanism, state, identity, lifetime, ordering, resources, failure, recovery, and cleanup;
- applicable specialist doctrine;
- falsifier, acceptance evidence, consequence horizon, and integration obligation.

Branches are split by semantic ownership, independent output, validation, rollback, cleanup, and consequence—not by equal file counts, line counts, agent counts, or arbitrary size.

Branches are combined when they are one indivisible owner or validity transition and separation would create invalid intermediate state, duplicate context, or constant cross-branch coupling.

## Branch contract and status

Each material branch records stable ID, parent-plan version, type, status, owner, integration owner, authority and exact revisions, context packet, scope/non-goals, write permissions, global invariants, dependencies, expected output, downstream consumers, acceptance/falsifier, reconciliation, rollback/recovery, cleanup, and handoff.

Statuses distinguish local acceptance from parent integration: `planned`, `ready`, `active`, `paused`, `blocked`, `accepted`, `invalidated`, `superseded`, `integrated`, and `archived`.

A locally accepted branch does not prove the parent task complete.

## Shared contracts and invalidation

A branch may not silently redefine parent-level terminology, ownership, schema meaning, ABI, identity, units, ranges, resource budgets, compatibility promises, or acceptance criteria.

A discovered shared-contract change pauses the branch and routes the decision to the integration spine or authoritative owner. An accepted change produces a new parent/contract version and explicitly invalidates every dependent branch and evidence set.

## Parallel work

Parallel focus branches require one compatible parent-plan version, non-overlapping primary owners and write surfaces, frozen or coordinated shared contracts/generated sources, independent acceptance/rollback/cleanup, acyclic dependencies, and one integration owner.

Branches that repeatedly need each other’s in-progress state are one branch or an explicit atomic group rather than independent parallel work.

## Integration

The integration spine reconciles rather than concatenates branch outputs. It verifies exact revisions, authority, assumptions, terminology, ownership, dependency direction, units/ranges/precision/identity/version/memory-space meaning, lifecycle, publication, failure, recovery, cleanup, public contracts, generated forms, persistence, compatibility, security, provenance, resource budgets, performance, and search-quality effects.

Every planned branch must be integrated, blocked, invalidated, superseded, authoritatively deferred, or removed from scope with a reason. Parent closure requires cross-branch contradiction resolution, rerun of invalidated evidence, boundary and end-to-end validation, cleanup, and proof against one exact final revision or artifact.

## Context and handoff

Each branch receives the smallest context packet that preserves soundness: parent objective, branch question, exact authority/revisions, relevant global invariants, dependency outputs, local anchors, expected output/falsifier/acceptance, cleanup, consequence horizon, and prohibited scope expansion.

Branch switching requires a continuation checkpoint. No agent should retain several half-active branches only in memory.

## Proportional records

One canonical parent task and branch map is the default. Simple branches remain sections in that record.

Use `agent_files/templates/focus-branch.template.yaml` only when a branch crosses sessions or agents, runs in parallel, has high consequence, or needs independent continuation/review.

Separate issues, Git branches, PRs, documents, or worktrees are created only when owner, deliverable, priority, risk, dependency, closure, isolation, review, transport, or rollback is independently meaningful.

## UMCGS-specific consequences

Focus branches must prevent independent drift across Search IR, domain/graph/policy/evaluator/resource contracts, generated schema/JIT/ABI/cache identity, host/device lifecycle, CUDA capability assumptions, device closure, finite memory, pressure, cancellation, teardown, conformance, and search-quality semantics.

An illustrative branch map is not an accepted component decomposition. Current authority and assessment determine the actual map.

## Consequences

- Large tasks are decomposed before attention degrades.
- Agents normally own one active focus branch at a time.
- Branch outputs are exact, independently falsifiable, and integration-ready.
- Shared-contract drift invalidates dependent work rather than being silently absorbed.
- Parallelism is constrained by ownership and write surfaces rather than available agent count.
- Passing local branches cannot substitute for central system integration.
- Git branch count does not become architecture or project-management theater.
- Completed branches, worktrees, claims, and artifacts receive normal cleanup/disposition.

## Alternatives considered

### Keep the entire task in one context

Rejected for tasks whose mechanism and consequence horizon exceed full attention. Apparent global context becomes shallow and unreliable.

### Split by file, directory, or equal workload

Rejected because physical size does not represent semantic ownership, output, risk, or integration.

### Create a Git branch or issue for every subtask

Rejected as administrative and merge overhead. Focus branches are semantic first; durable GitHub objects are proportional.

### Allow branches to adjust shared contracts independently

Rejected because this creates multiple sources of truth and delayed integration failure.

### Accept the parent when every leaf passes

Rejected because locally valid outputs may contradict or compose into an invalid system.

## Validation

A conforming large/complex task must show:

- canonical parent objective, authority, invariants, branch map, dependency graph, integration owner, and closure criteria;
- leaf branches sized for full attention;
- complete branch contracts and exact statuses;
- exact dependency inputs and accepted output revisions;
- explicit shared-contract change and invalidation handling;
- safe parallel ownership/write surfaces where used;
- branch handoffs and cleanup state;
- central contradiction, boundary, end-to-end, and lifecycle reconciliation;
- one exact final revision or artifact supporting parent closure.

Agent routing, assessment/planning, plan execution, validation, review, PR templates, work packets, status, indexes, and governance checks must link to the doctrine.

## Revisit triggers

Revisit when agents still lose detail on large tasks, focus branches create repeated cross-coupling, branch maps produce excessive paperwork, parallel work collides, integration defects escape despite accepted leaves, or tooling can automate branch dependency/invalidation without weakening semantic ownership and central reconciliation.
