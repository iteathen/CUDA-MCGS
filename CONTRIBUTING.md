# Contributing to UMCGS

UMCGS is private and documentation-first. Read [`AGENTS.md`](AGENTS.md), [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md), [`ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md), [`FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md), [`PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md), [`CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md), and [`agent_files/README.md`](agent_files/README.md) before a material change.

## Before production implementation

A change needs:

- a proportional assessment whose disposition permits implementation;
- the strongest credible objection and its resolution, evidence, experiment, or blocker;
- a clear product-area/component owner and accepted contract authority;
- a current plan version and dependency-ready node;
- a focus-branch map when the task exceeds one focused session, spans semantic owners/contracts/paths, contains independent unknowns, crosses sessions/agents, supports parallel work, or would require sampling/skimming;
- for each material focus branch: stable ID, one primary owner/output, exact input revision, minimal context, scope/non-goals, write authority, dependencies, output contract, acceptance/falsifier, rollback, cleanup, and integration obligation;
- expected local/wider effects and downstream output revisions;
- a LEGO ownership boundary with explicit ports, injected dependencies, and adapters;
- domain-appropriate ranges and total-system simplicity, including branch coordination and cleanup;
- defined lifecycle, resource pressure, failure, recovery, teardown, compatibility, and cleanup;
- validation capable of falsifying local branch outputs and final integrated behavior;
- prior-art/provenance inspection where it can reshape the design.

A focus branch is semantic. Do not create a Git branch, issue, PR, component, directory, or document merely because a semantic branch exists.

## Focus-branch execution

For large or complex work:

- keep one canonical parent task and integration spine;
- size leaves for full attention rather than equal file or agent counts;
- normally assign one active branch per agent and checkpoint before switching;
- parallelize only non-overlapping owners/write surfaces under one compatible parent version;
- route shared-contract changes through the integration spine and invalidate dependents explicitly;
- distinguish locally `accepted` branches from parent `integrated` branches;
- reconcile exact outputs, contradictions, boundaries, lifecycle, resources, compatibility, security, performance, and cleanup before parent completion.

Use the focus-branch template only when cross-session, parallel, high-consequence, or independent continuation/review needs a durable packet.

## Cleanup and artifact disposition

Protect user/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, and active dependents.

For material state, choose and verify one disposition: remove, restore, retain authority/evidence/recovery, archive, quarantine, transfer, supersede, retain temporarily with owner/trigger, or protect unchanged.

Account for local files/folders, semantic/Git branches, worktrees/stashes, remote PR/issues/reviews, generated/build/cache/package output, processes/ports/containers/GPU state, credentials/permissions, persistence/backups, artifacts/releases, and external resources where triggered.

Historically useful stale material is archived with provenance. Secret exposure requires revocation or rotation. Cleanup debt is allowed only when immediate cleanup is less safe and the residue is exact, contained, owned, visible, objectively triggered, and independently actionable.

## Organization

UMCGS is organized for large-project scale from inception. Follow [`PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and [`REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

New production components require `README.md`, `component.yaml`, registry entry, dependency declaration, public contract, validation ownership, teardown, and disposition. Focus branches do not justify new components by themselves.

## Documentation and validation

Substantial Markdown below `docs/` must carry a recognized status. Update indexes, parent/focus-branch/plan/execution/cleanup state, and registry entries in the same coherent change. Archive useful stale guidance rather than silently deleting it.

Run:

```bash
./scripts/verify-docs.sh
```

Implementation adds branch-specific readiness/falsification, component/contract, integration, failure/pressure, cleanup, and sanity evidence under accepted specifications and manifests.

## Pull requests

Follow [`PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md).

Before requesting review:

- record exact head and intended base;
- ensure the PR is one coherent integration;
- account for complete changed surface, parent/focus-branch map, branch statuses and exact outputs, execution fidelity, cleanup, and affected contracts;
- rerun evidence invalidated by head, base, parent-plan, or shared-contract changes;
- run focused validation and proportional self-sanity;
- disclose checks not run, unintegrated/deferred branches, cleanup debt, issue closure, Git branch/worktree effects, and merge method.

Every material PR receives author-side complete-diff review. Independent review is triggered by phase, policy, owner instruction, or objective consequence. Merge is a separate expected-head transaction followed by target, focus-branch integration, dependency, and cleanup verification.

Do not describe branch-local work as integrated, local-only work as published, author-side review as independent approval, a merge response as verified integration, or a cleanup command as verified final state.
