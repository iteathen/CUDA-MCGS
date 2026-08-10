# Contributing to UMCGS

UMCGS is private and documentation-first. Read [`AGENTS.md`](AGENTS.md), [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md), [`ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md), [`FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md), [`TOKEN_DISCIPLINE.md`](agent_files/general_foundation/TOKEN_DISCIPLINE.md), [`TESTING.md`](agent_files/general_foundation/TESTING.md), [`DEBUGGING.md`](agent_files/general_foundation/DEBUGGING.md), [`CONTEXT_ROUTING.md`](agent_files/general_foundation/CONTEXT_ROUTING.md), [`PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md), [`CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md), and [`agent_files/README.md`](agent_files/README.md) before a material change.

## Before production implementation

A change needs:

- a proportional assessment whose disposition permits implementation;
- the strongest credible objection and its resolution, evidence, experiment, or blocker;
- a clear product-area/component owner and accepted contract authority;
- a current plan version and dependency-ready node;
- a focus-branch map when work exceeds one focused session or spans semantic owners/contracts/paths/unknowns;
- for each material focus branch: stable ID, owner/output, exact input revision, minimal context, write authority, dependencies, acceptance/falsifier, rollback, cleanup, and integration obligation;
- a context/token strategy that preserves enough capacity for actual-effect inspection, validation, integration, cleanup, review, recovery, and handoff;
- a test strategy tied to owned invariants, authoritative oracles, case-intent banking, owning capsules, evidence-key invalidation, escalation tiers, and test consolidation;
- expected local/wider effects and downstream output revisions;
- a LEGO ownership boundary with explicit ports, injected dependencies, and adapters;
- domain-appropriate ranges and total-system simplicity, including branch coordination, context reconstruction, test execution, and cleanup;
- defined lifecycle, resource pressure, failure, recovery, teardown, compatibility, and cleanup;
- validation capable of falsifying local branch outputs and final integrated behavior;
- prior-art/provenance inspection where it can reshape the design.

A focus branch is semantic. Do not create a Git branch, issue, PR, component, directory, or document merely because a semantic branch exists.

## Token and context discipline

Optimize verified coherent progress per lifecycle token—not shortest output or most code.

For substantial work, preserve roughly 30% of usable context for proof, integration, cleanup, review, and handoff. For critical, large, or cross-branch work, preserve roughly 40% after loading the branch packet unless a different reserve is demonstrably sufficient.

Load context in layers, search before broad reading, prefer exact diffs/ranges, batch independent retrievals, and keep large logs, profiler traces, datasets, model packages, and generated engines outside prompt context when exact identity and targeted sections suffice.

Do not open new scope in yellow context state. Stop new mutation in red state. Checkpoint exact authority, revisions, decisions, contradictions, failed hypotheses, partial state, checks run/not run, cleanup, and next action before branch switches or compaction.

Material token debt that forces another agent to repeat research or guess unsafe state blocks completion.

## Testing and repair-loop discipline

Capture a test intent immediately whenever a material invariant, regression, boundary, counterexample, or risk is discovered. During diagnosis, use the smallest provisional reproducer. Before branch acceptance, fold related intents into the canonical owning capsule.

A capsule should share expensive immutable setup—builds, generated artifacts, device/module/model loads, containers, datasets, and fixtures—while preserving stable case IDs, independent inputs/expected values, isolated mutable state, direct single-case selection, and per-case results.

Do not create one permanent test file or command per discovered example. Do not merge cases into one opaque assertion. Consolidate execution overhead, not semantic accountability.

Use the tiered loop:

1. preflight identity/discovery/static checks;
2. focused fast capsule for directly affected cases;
3. complete owner/contract capsule after a coherent repair batch;
4. affected integration smoke once;
5. deep/forensic evidence only when risk, mismatch, stabilization, or release requires it.

Do not run the full suite after every edit. Freeze one reproduction, cluster failures by first divergence and authoritative owner, repair one root cause coherently, rerun the affected cluster, then the owning capsule, then required integration.

An identical evidence key is not rerun without material invalidation, contamination/incompleteness, independent replication, or a statistical reason. A failed test or command is not retried without a changed hypothesis, input, code, environment, or transport.

Required tests must be discovered; required skips fail. Sampling is deterministic and disclosed. Existing tests and expected values are evidence—not automatic authority.

Routine changes need no test ledger. Use [`agent_files/templates/test-batch.template.yaml`](agent_files/templates/test-batch.template.yaml) when several intents are being accumulated/consolidated, a failure cluster crosses sessions or agents, expensive setup must be coordinated, or completeness/skip/invalidation state has a real consumer.

## Focus-branch execution

For large or complex work:

- keep one canonical parent task and integration spine;
- size leaves for full attention, including test/validation/cleanup/handoff reserve;
- normally assign one active branch per agent and checkpoint before switching;
- parallelize only non-overlapping owners/write surfaces under one compatible parent version;
- route shared-contract changes through the integration spine and invalidate dependent tests/evidence explicitly;
- distinguish locally `accepted` branches from parent `integrated` branches;
- reconcile exact outputs, test capsules, contradictions, boundaries, lifecycle, resources, compatibility, security, performance, cleanup, test debt, and token debt before parent completion.

## Cleanup and artifact disposition

Protect user/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, and active dependents.

For material state, choose and verify one disposition: remove, restore, retain authority/evidence/recovery, archive, quarantine, transfer, supersede, retain temporarily with owner/trigger, or protect unchanged.

Account for provisional test scripts, duplicate fixtures, generated/build/cache output, semantic/Git branches, worktrees/stashes, remote PR/issues/reviews, processes/ports/containers/GPU state, credentials/permissions, persistence/backups, artifacts/releases, and external resources where triggered.

## Organization

UMCGS is organized for large-project scale from inception. Follow [`PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and [`REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

New production components require `README.md`, `component.yaml`, registry entry, dependency declaration, public contract, validation/test ownership, canonical capsule commands, teardown, and disposition. Focus branches, token budgets, and test batches do not justify new components by themselves.

## Documentation and validation

Substantial Markdown below `docs/` must carry a recognized status. Update indexes, parent/focus-branch/token/test/plan/execution/cleanup state, and registry entries in the same coherent change. Link authority rather than copying it; archive useful stale guidance rather than keeping competing active versions.

Run:

```bash
./scripts/verify-docs.sh
```

Implementation adds branch-specific readiness/falsification, accurate owner/contract capsules, integration, failure/pressure, token-reserve, cleanup, and sanity evidence under accepted specifications and manifests.

## Pull requests

Follow [`PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md).

Before requesting review:

- record exact head and intended base;
- ensure the PR is one coherent integration;
- account for complete changed surface, parent/focus-branch map, branch statuses/outputs, token/context discipline, testing evidence, execution fidelity, cleanup, and affected contracts;
- disclose authoritative oracles, exact evidence keys, case/discovery/skip counts, test intents consolidated, failure clusters, test tiers run, unchanged evidence reused, and checks not run;
- rerun only evidence invalidated by head, base, parent-plan, shared-contract, source/test revision, generated artifact, model, environment, fixture, seed, or resource-profile changes;
- run focused validation and proportional self-sanity;
- disclose test debt, token/context limits, unintegrated/deferred branches, cleanup debt, issue closure, Git branch/worktree effects, and merge method.

Every material PR receives author-side complete-diff review. Independent review is triggered by phase, policy, owner instruction, or objective consequence. Merge is a separate expected-head transaction followed by target, focus-branch integration, test-evidence, dependency, token-debt, and cleanup verification.

Do not describe branch-local work as integrated, raw test count as completeness, a short output as token-efficient without lifecycle evidence, local-only work as published, author-side review as independent approval, a merge response as verified integration, or a cleanup command as verified final state.
