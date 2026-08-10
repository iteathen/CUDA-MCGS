# ADR-0010: Cleanup, Reconciliation, and Artifact Disposition

**Status:** Accepted

**Date:** 2026-08-10

## Context

Agent work creates state beyond the intended durable result: local files and folders, generated output, caches, logs, patches, worktrees, stashes, branches, PRs, comments, processes, ports, containers, device resources, backups, credentials, permissions, remote artifacts, external services, and partially completed transitions.

Without a governed lifecycle, this residue can become accidental authority, contaminate later builds or tests, expose secrets, incur cost, block collaboration, defeat rollback, preserve false GitHub state, or make continuation depend on an originating agent’s memory.

The opposite failure is indiscriminate cleanup: deleting user work, evidence, rollback state, useful history, active branches, remote artifacts, or shared resources merely to produce a visually clean workspace.

The project owner directed that agents clean up after themselves across local and remote state, including files, folders, branches, pull requests, and any other task-created or task-obsoleted state.

## Source adaptation

This decision adapts the mature cleanup doctrine from:

- `iteathen/Ars-Thaumaturgica` commit `0016f18bb541431315e5a185481de978b1213586`, which introduced the full execution-cleanup and artifact-disposition doctrine;
- current `docs/foundation/execution-cleanup-and-artifact-disposition.md` on Ars Thaumaturgica;
- current `.agents/templates/cleanup-disposition.yaml`;
- current `.github/ISSUE_TEMPLATE/cleanup-debt.yml`;
- associated Ars integration into governed execution, sanity checking, PR review, validation, and work coordination.

UMCGS adds explicit cleanup rules for generated search engines and caches, CUDA/device state, model/profile artifacts, exact-head PR integration, remote branches and workflow artifacts, and universal-framework authority. UMCGS files are authoritative here; Ars Thaumaturgica is provenance rather than a dependency.

## Decision

UMCGS adopts cleanup as a required final reconciliation of every material task.

Every task-created, temporarily modified, superseded, generated, diagnostic, local, remote, external, sensitive, partial, and coordination item must have:

- an exact identity and location;
- an owner;
- a known pre-existing/shared/dependent status;
- a purpose and expected lifetime;
- one explicit disposition;
- a dependency-safe trigger and method;
- required authority and destructive safeguards;
- verification through the owning system;
- visible cleanup debt when final disposition cannot safely complete.

Permitted dispositions are removal, restoration, retention as authority, bounded evidence, or recovery state, archive, quarantine, ownership transfer, supersession, temporary retention with an owner and objective trigger, or protection unchanged.

Cleanup does not authorize unrelated repository beautification or deletion of unfamiliar state. Historically useful stale material is archived with date, location, reason, successor, and removal context rather than silently erased. Pure task-owned scratch with no authority, evidence, recovery, provenance, or continuation value is removed.

## Protected state

Agents may not destructively clean user/pre-existing uncommitted work, active shared resources, project authority, required evidence/provenance/security state, rollback/recovery checkpoints, externally owned persisted state, protected/default/shared branches, or branches/PRs/issues/artifacts with active dependents without exact authority.

Ambiguous state is preserved safely and made visible rather than guessed away.

## Local and remote scope

The cleanup obligation includes, where applicable:

- tracked repository files and remote repository artifacts;
- untracked/ignored local files and directories;
- build, test, coverage, cache, package, release, and generated output;
- local branches, worktrees, stashes, refs, remotes, hooks, config, and interrupted Git operations;
- remote branches, tags, workflow artifacts/caches, releases, packages, and uploaded files;
- PRs, issues, reviews, threads, requests, assignments, labels, milestones, claims, closure effects, and dependencies;
- processes, ports, containers, jobs, mounts, locks, leases, services, databases, queues, and paid resources;
- GPU contexts, modules, allocations, IPC handles, shared memory, and diagnostic buffers;
- credentials, sessions, accounts, permissions, keys, certificates, private data, and provenance exceptions;
- migrations, backups, checkpoints, test data, compatibility forms, and recovery artifacts;
- research, prototypes, donor material, datasets, evidence, and instrumentation.

## GitHub lifecycle

GitHub history is preserved; current state is reconciled.

- A merged PR remains as history.
- An abandoned or superseded PR is closed only after reason, successor, useful discussion, and unmerged work are preserved.
- An issue closes only when its full acceptance criteria are satisfied, not merely because a related PR merged.
- Blocking review concerns are resolved or transferred with evidence, not cleared for dashboard cleanliness.
- Stale ownership signals—review requests, assignments, labels, milestones, claims, and dependency links—are updated when they no longer describe reality.
- Task-owned local and remote branches/worktrees are removed after merge, closure, supersession, or abandonment only when no stacked/dependent PR, recovery, audit, release, automation, or user requirement remains.
- Protected, default, release, recovery, and shared integration branches are never deleted as ordinary cleanup.
- Every remote mutation is verified after the command/API response.

## Destructive safeguards

Before destructive cleanup, agents must verify exact target identity, owner, dependents, authority, working directory/selector, rollback/evidence needs, and expected verification. Narrow selectors and previews are preferred.

Broad recursive deletion, unverified `git clean -fdx`, `git reset --hard`, stash destruction, force-push, deletion of shared/protected branches, release/package removal, issue/PR closure for cosmetic reasons, evidence deletion, and secret deletion without rotation are prohibited shortcuts.

## Cleanup debt

Cleanup debt is allowed only when immediate cleanup is less safe than retention and the residue is exact, contained, owned, non-accidental, protected from ordinary consumption, objectively triggered for later removal/restoration/transfer/expiry, and independently actionable.

Cleanup debt blocks parent acceptance when it can corrupt behavior, expose data, incur uncontrolled cost, mislead authority, defeat rollback/recovery, or contaminate tests, builds, releases, caches, or generated output.

Use `.github/ISSUE_TEMPLATE/cleanup-debt.yml` only when durable independent tracking is warranted. Ordinary incomplete work is not cleanup debt.

## Proportional record policy

Routine local scratch and ordinary branch cleanup may be handled and reported inline.

Use `agent_files/templates/cleanup-disposition.template.yaml` when state is shared, pre-existing, external, sensitive, retained, rollback/recovery critical, difficult to verify, long-lived, atomic, or independently blocked.

The cleanup record holds only unique lifecycle and verification evidence. It does not duplicate the issue, plan, execution record, PR, sanity record, or handoff.

## Consequences

- Cleanup begins during preflight rather than as an afterthought.
- Newly created or discovered residue is registered during execution.
- Node acceptance, PR readiness, merge completion, release, failure, pause, and handoff all reconcile local and remote state.
- Commands and API success are not accepted as proof when state is asynchronous, remote, shared, sensitive, cached, or eventually consistent.
- Temporary branches, PR state, worktrees, processes, device allocations, credentials, artifacts, and external resources cannot be silently abandoned.
- Useful history is archived or preserved; unrelated and user-owned state remains protected.
- Cleanup remains proportional and does not create mandatory paperwork for ordinary scratch.

## Alternatives considered

### Delete everything not in the final diff

Rejected because evidence, rollback state, user work, remote resources, useful history, and external dependents may not appear in the diff.

### Leave cleanup to future maintainers

Rejected because the creating agent has the best information about ownership, purpose, dependencies, and safe disposition.

### Clean only local repository files

Rejected because branches, PRs, processes, credentials, devices, workflow artifacts, releases, packages, databases, and external resources can outlive a clean workspace.

### Keep all evidence and artifacts indefinitely

Rejected because unbounded retention creates security, cost, provenance, authority, and discoverability problems.

### Require a cleanup ledger for every task

Rejected as administrative overhead. Formal records are triggered by consequence and lifecycle complexity.

## Validation

A conforming material task must show, where triggered:

- protected pre-state and cleanup inventory;
- explicit disposition for every material local, remote, external, sensitive, generated, partial, and coordination item;
- dependency-safe cleanup order;
- destructive safeguards;
- local and remote verification;
- exact retained authority/evidence/recovery state with owners and triggers;
- truthful branch, PR, issue, review, claim, and closure state;
- no abandoned process, device allocation, credential, permission, artifact, or paid resource;
- safe, bounded, visible cleanup debt;
- cleanup-aware handoff and completion evidence.

Agent routing, AI rules, principles, plan execution, sanity, PR review/merge, workflow, validation, review, templates, issue forms, status, indexes, and governance checks must link to this doctrine.

## Revisit triggers

Revisit when agents repeatedly leave remote or local residue, cleanup causes data loss, branch/PR lifecycle remains misleading, formal records create disproportionate work, or new external/device/package systems require additional categories. Changes must preserve protected-state safety, explicit disposition, verified owning-system state, and honest cleanup debt.
