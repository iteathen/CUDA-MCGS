# Contributing to UMCGS

UMCGS is private and documentation-first. Read [`AGENTS.md`](AGENTS.md), [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md), [`ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md), [`FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md), [`TOKEN_DISCIPLINE.md`](agent_files/general_foundation/TOKEN_DISCIPLINE.md), [`CONTEXT_ROUTING.md`](agent_files/general_foundation/CONTEXT_ROUTING.md), [`PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md), [`CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md), and [`agent_files/README.md`](agent_files/README.md) before a material change.

## Before production implementation

A change needs:

- a proportional assessment whose disposition permits implementation;
- the strongest credible objection and its resolution, evidence, experiment, or blocker;
- a clear product-area/component owner and accepted contract authority;
- a current plan version and dependency-ready node;
- a focus-branch map when work exceeds one focused session or spans semantic owners/contracts/paths/unknowns;
- for each material focus branch: stable ID, owner/output, exact input revision, minimal context, write authority, dependencies, acceptance/falsifier, rollback, cleanup, and integration obligation;
- a context/token strategy that preserves enough capacity for actual-effect inspection, validation, integration, cleanup, review, recovery, and handoff;
- expected local/wider effects and downstream output revisions;
- a LEGO ownership boundary with explicit ports, injected dependencies, and adapters;
- domain-appropriate ranges and total-system simplicity, including branch coordination, context reconstruction, and cleanup;
- defined lifecycle, resource pressure, failure, recovery, teardown, compatibility, and cleanup;
- validation capable of falsifying local branch outputs and final integrated behavior;
- prior-art/provenance inspection where it can reshape the design.

A focus branch is semantic. Do not create a Git branch, issue, PR, component, directory, or document merely because a semantic branch exists.

## Token and context discipline

Optimize verified coherent progress per lifecycle token—not shortest output or most code.

For substantial work, preserve roughly 30% of usable context for proof, integration, cleanup, review, and handoff. For critical, large, or cross-branch work, preserve roughly 40% after loading the branch packet unless a different reserve is demonstrably sufficient.

Load context in layers: operating kernel, owning authority, local mechanism, material consequence horizon, then rationale/provenance. Search before broad reading, prefer exact diffs/ranges, batch independent retrievals, and keep large logs, profiler traces, datasets, model packages, and generated engines outside prompt context when exact identity and targeted sections suffice.

Do not open new scope in yellow context state. Stop new mutation in red state. Checkpoint exact authority, revisions, decisions, contradictions, failed hypotheses, partial state, checks run/not run, cleanup, and next action before branch switches or compaction.

A summary is not authority. Material token debt that forces another agent to repeat research or guess unsafe state blocks completion.

Routine work needs no formal token ledger. Use the token-budget template only when another session/agent or high-consequence gate consumes its unique reserve/compaction evidence.

## Focus-branch execution

For large or complex work:

- keep one canonical parent task and integration spine;
- size leaves for full attention, including validation/cleanup/handoff reserve;
- normally assign one active branch per agent and checkpoint before switching;
- parallelize only non-overlapping owners/write surfaces under one compatible parent version;
- route shared-contract changes through the integration spine and invalidate dependents explicitly;
- distinguish locally `accepted` branches from parent `integrated` branches;
- reconcile exact outputs, contradictions, boundaries, lifecycle, resources, compatibility, security, performance, cleanup, and token debt before parent completion.

## Cleanup and artifact disposition

Protect user/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, and active dependents.

For material state, choose and verify one disposition: remove, restore, retain authority/evidence/recovery, archive, quarantine, transfer, supersede, retain temporarily with owner/trigger, or protect unchanged.

Account for local files/folders, semantic/Git branches, worktrees/stashes, remote PR/issues/reviews, generated/build/cache/package output, processes/ports/containers/GPU state, credentials/permissions, persistence/backups, artifacts/releases, and external resources where triggered.

## Organization

UMCGS is organized for large-project scale from inception. Follow [`PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and [`REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

New production components require `README.md`, `component.yaml`, registry entry, dependency declaration, public contract, validation ownership, teardown, and disposition. Focus branches and token budgets do not justify new components by themselves.

## Documentation and validation

Substantial Markdown below `docs/` must carry a recognized status. Update indexes, parent/focus-branch/token/plan/execution/cleanup state, and registry entries in the same coherent change. Link authority rather than copying it; archive useful stale guidance rather than keeping competing active versions.

Run:

```bash
./scripts/verify-docs.sh
```

Implementation adds branch-specific readiness/falsification, component/contract, integration, failure/pressure, token-reserve, cleanup, and sanity evidence under accepted specifications and manifests.

## Pull requests

Follow [`PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md).

Before requesting review:

- record exact head and intended base;
- ensure the PR is one coherent integration;
- account for complete changed surface, parent/focus-branch map, branch statuses/outputs, token/context discipline, execution fidelity, cleanup, and affected contracts;
- rerun evidence invalidated by head, base, parent-plan, shared-contract, or source-revision changes;
- run focused validation and proportional self-sanity;
- disclose checks not run, token/context limits, unintegrated/deferred branches, cleanup debt, issue closure, Git branch/worktree effects, and merge method.

Every material PR receives author-side complete-diff review. Independent review is triggered by phase, policy, owner instruction, or objective consequence. Merge is a separate expected-head transaction followed by target, focus-branch integration, dependency, token-debt, and cleanup verification.

Do not describe branch-local work as integrated, a short output as token-efficient without lifecycle evidence, local-only work as published, author-side review as independent approval, a merge response as verified integration, or a cleanup command as verified final state.
