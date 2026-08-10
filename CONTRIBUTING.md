# Contributing to UMCGS

UMCGS is currently private and documentation-first. Read [`AGENTS.md`](AGENTS.md), [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md), [`agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md), [`agent_files/general_foundation/PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md), [`agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md), and [`agent_files/README.md`](agent_files/README.md) before opening a material implementation change.

## Before production implementation

A change needs:

- a proportional assessment whose disposition permits implementation;
- the strongest credible objection and its resolution, evidence, experiment, or blocker;
- an accepted current plan version and an explicitly ready node;
- evidenced dependency outputs and current authority;
- a clear ownership boundary and durable product-area/component home;
- expected local/wider effects, outputs, acceptance, cheapest falsifier, rollback/safe stop, cleanup obligations, and material deviation conditions before mutation;
- a LEGO ownership boundary with one state/lifecycle/disposition owner, meaningful ports, injected dependencies, and owned adapters;
- domain-appropriate ranges and a total-system simplicity analysis including cleanup;
- accepted governing specifications, or an explicitly authorized disposable experiment;
- defined invariants, ranges, lifecycle, resource limits, pressure/failure behavior, teardown, and cleanup;
- declared public/internal boundaries and dependencies;
- protected pre-existing/user/shared/authority/evidence/recovery state;
- expected task-created local/remote/generated/sensitive/external state and planned disposition;
- validation and cleanup verification paired with each claimed mechanism;
- prior-art inspection and donor-artifact disposition when existing work may avoid duplication or change the design.

During execution, apply one coherent ownership-sized operation at a time, inspect actual effects immediately, register created/modified/obsolete state, reconcile wider consequences, and revise the plan for material deviation. Do not leave invalid partial state, abandoned resources, unowned residue, or false downstream preconditions.

## Cleanup and artifact disposition

Cleanup means intentional disposition, not deleting everything outside the final diff.

Protect user/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, and active dependents. For material state, choose and verify one disposition: remove, restore, retain as authority/evidence/recovery, archive, quarantine, transfer, supersede, retain temporarily with owner/trigger, or protect unchanged.

Account for local files/folders, tracked and generated files, build/test/cache/package output, branches/worktrees/stashes, remote branches/PRs/issues/reviews, processes/ports/containers/GPU state, credentials/permissions, persistence/backups, workflow/release artifacts, and external resources where triggered.

Historically useful stale material is archived with provenance instead of silently deleted. Secret exposure requires revocation or rotation. Cleanup debt is permitted only when immediate cleanup is less safe and the residue is exact, contained, owned, visible, objectively triggered, and independently actionable.

Routine task-owned scratch may be cleaned and reported inline. Use the cleanup template only when another consumer needs durable lifecycle evidence.

## Organization

UMCGS is organized as a very large project from inception. Follow [`agent_files/general_foundation/PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and [`agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

A new production component requires `README.md`, `component.yaml`, registry entry, dependency declaration, public contract, validation ownership, teardown, and disposition. Do not place production source at root or in catch-all helper directories.

## Documentation

Substantial Markdown below `docs/` must carry a recognized status. Update indexes, plan/execution/cleanup state, and registry entries in the same change. Archive historically useful stale guidance with date, reason, successor, and removal context rather than silently deleting it.

## Validation

Run:

```bash
./scripts/verify-docs.sh
```

Implementation changes add boundary-specific readiness, operation-level falsification, component/contract, integration, failure/pressure, cleanup, and sanity evidence under accepted specifications and component manifests.

## Pull requests

Follow [`agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md).

Before requesting review:

- record the exact ready-for-review head and intended base;
- ensure the PR is one coherent integration;
- account for the complete changed surface, plan-execution fidelity, cleanup/disposition, and affected contracts;
- run focused validation and proportional self-sanity;
- remove or safely track temporary local/remote state;
- disclose checks not run, retained state, cleanup debt, limitations, issue closure, local/remote branch/worktree effects, and proposed merge method.

Every material PR receives author-side complete-diff review. Independent review is required by phase, protection/CODEOWNERS, owner instruction, or objective consequence. A changed head invalidates affected review and cleanup evidence.

Merge is a separate guarded transaction. Revalidate the exact accepted head, target, checks/reviews/protection, discussion, mergeability, issue closure, local/remote branch/worktree/dependent-work effects, cleanup debt, and merge method; use an expected-head guard where supported; then verify the target/resulting SHA, tree, and post-merge cleanup through the owning systems.

Do not describe local-only work as published, author-side review as independent approval, a merge response as verified integration, or a successful cleanup command as verified final state.
