# UMCGS Agent Entry Point

This file is the mandatory first read for every human or automated developer. The canonical operating manual is [`agent_files/AGENTS.md`](agent_files/AGENTS.md). Tool-specific files are compatibility pointers only and may not create competing rules.

## Startup sequence

Before changing anything:

1. Read this file.
2. Read [`agent_files/AGENTS.md`](agent_files/AGENTS.md) and [`agent_files/AI_RULES.md`](agent_files/AI_RULES.md).
3. Read [`agent_files/DESIGN_ALIGNMENT_CARD.md`](agent_files/DESIGN_ALIGNMENT_CARD.md) and [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md).
4. For **every task**, apply [`agent_files/general_foundation/TOKEN_DISCIPLINE.md`](agent_files/general_foundation/TOKEN_DISCIPLINE.md): establish at least an implicit token posture, minimum practice floor, coherent scope, decisive evidence, reserve, and backpressure triggers before work expands.
5. For substantial or critical work, read [`agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md) before committing to a design or implementation sequence.
6. When the task is large, complex, cross-session, parallel, or cannot fit one focused context, read [`agent_files/general_foundation/FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md) and build the parent branch map before deep execution.
7. Before executing a material plan node, read [`agent_files/general_foundation/PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md).
8. Before creating exceptional local, remote, sensitive, retained, or external state—and before acceptance, handoff, closure, or merge—read [`agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md).
9. For a requested sanity check, audit, whole-project review, complete review, incident review, or release-readiness claim, read [`agent_files/general_foundation/SANITY_CHECKING.md`](agent_files/general_foundation/SANITY_CHECKING.md) and [`SEMANTIC_INTERROGATION.md`](agent_files/general_foundation/SEMANTIC_INTERROGATION.md) before deep inspection.
10. For PR readiness, review, approval, or merge work, read [`agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md) before acting on the PR.
11. Read [`agent_files/SYSTEM_REGISTRY.md`](agent_files/SYSTEM_REGISTRY.md) to identify the owning boundary and source of truth.
12. Read [`agent_files/general_foundation/PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and [`agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md) before creating, moving, or splitting project artifacts.
13. Read accepted ADRs/specifications relevant to the task and load only objectively triggered detailed doctrine.
14. Inspect repository status, existing work, and current project state.
15. Apply the reasoning, token-backpressure, focus-branch, execution-readiness, testing, and cleanup gates before editing.

## Authority order

When instructions conflict, apply this order:

1. Explicit project-owner instruction for the current task.
2. This root `AGENTS.md` and `agent_files/AGENTS.md`.
3. Accepted ADRs in `docs/decisions/`.
4. Accepted normative specifications in `docs/specs/`.
5. `agent_files/AI_RULES.md`, `SYSTEM_REGISTRY.md`, and `VALIDATION_POLICY.md`.
6. The accepted project charter.
7. Accepted application-specific agent guidance.
8. Architecture explanations.
9. Research notes and proposals.
10. Plans, engineering-decision/focus-branch/token/test/execution/cleanup/review records, and summaries.
11. Archived or superseded material.

Plans, budgets, and branch maps organize work beneath authority. Token pressure cannot silently override accepted authority or objectively triggered good practice. Stop affected work when a conflict changes correctness, architecture, safety, memory, synchronization, ABI, lifecycle, ownership, dependency direction, acceptance, evidence, cleanup, or downstream results.

## Current phase

UMCGS is private, pre-release, documentation-first, and defining a universal GPU-resident Monte Carlo Graph Search framework. Production implementation may begin only for a clearly owned boundary with accepted governing specifications, an assessment disposition that permits implementation, and a dependency-ready plan/focus branch—or an explicitly authorized disposable experiment.

The first product is the generic framework, not a chess engine. Chess, Go, text search, planning, optimization, policy-only search, evaluation-only search, partially observable search, and other workloads are adapters or conformance domains. None may permanently shape the core.

`main` is the current integration trunk. Short-lived `feature/*` and `agent/*` Git branches target `main`; one coherent PR normally uses squash merge. A semantic focus branch is not automatically a Git branch. A different phase/branch model requires an explicit policy transition.

## Non-negotiable project invariants

- Assess substantial and critical work before planning; use a strong adversary to expose hidden assumptions, unsound simplicity, and unnecessary machinery.
- Apply token backpressure to **every** task from the first retrieval or mutation, including routine work.
- Token pressure controls scope, work in flight, duplication, context, testing, and ceremony. It does not lower the risk-appropriate minimum practice floor.
- Preserve at least the request/authority, current-state inspection, coherent scope, expected result, decisive verification, actual-effect inspection, cleanup, and honest limits for every task.
- Reduce pressure in this order: duplication → evidence reuse → batching → context/output narrowing → optional polish/breadth → scope/claim reduction → split/handoff → blocker. Never cut required rigor first.
- Soft token estimates are replan signals rather than authority. Essential evidence, safety, correctness, cleanup, and handoff may justify an explicit budget extension or split.
- Decompose a large or complex task before attention degrades: one canonical parent/integration spine, semantic focus branches sized for full attention, exact branch contracts, explicit invalidation, constrained parallelism, and central reconciliation.
- A focus branch is not automatically a Git branch, issue, PR, component, directory, or document.
- Locally accepted focus branches do not prove parent completion; exact outputs must be integrated and reconciled against one final revision.
- Execute only a current dependency-ready plan node/focus branch under current authority; state expected effects, falsifier, rollback/safe stop, cleanup, and integration obligations before mutation.
- Inspect actual effects immediately after each coherent operation, classify deviations, and never accept invalid partial state or abandoned execution-created resources.
- Every material task-created, temporarily modified, superseded, partial, generated, local, remote, sensitive, external, and coordination item receives an explicit owner, disposition, and owning-system verification.
- Cleanup means remove, restore, retain with authority/evidence/recovery purpose, archive, quarantine, transfer, supersede, protect unchanged, or retain temporarily with an objective trigger—not blind deletion.
- User/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, and active dependents are never destroyed without exact authority.
- A sanity claim names an exact frozen revision/artifact and is explicitly `full`, `bounded`, or `sampled`; reduced evidence narrows the claim rather than preserving unsupported breadth.
- Every material PR receives complete author-side review of one exact head; independent review is required when phase, policy, owner instruction, or objective consequence triggers it.
- Review approval and merge are separate transactions. A head, parent-plan, shared-contract, or material base change invalidates affected evidence, and merge uses an expected-head guard followed by target and cleanup verification.
- Apply the accepted design hierarchy: domain truth and authority → purpose/bounds/contextual weighting → LEGO boundaries → SOLID responsibilities → CUPID quality → simplest sufficient total system → measured validation.
- One authoritative fact/state/lifecycle has one visible owner; consumers use meaningful public contracts rather than internal mutation.
- Dependencies are explicit and injected; platform, compatibility, domain-instance, and model-instance details remain behind owned adapters.
- Organize the repository from the beginning as though it will become a very large project. Current file count is never justification for a flat, unowned, or temporary layout.
- Universal at contracts and compilation boundaries; specialized in generated hot paths.
- Every concrete engine is finite and has an explicit GPU-memory and resource plan.
- After search ignition, no active search decision may require a CPU-produced intermediate result.
- The selected search engine, evaluator/model, work queues, and mutable search state remain GPU-resident during active search.
- State identity, transpositions, history, cycles, action production, evaluation outputs, backup semantics, output semantics, and resource exhaustion are explicit contracts.
- No hidden assumption of a game, board, player count, zero-sum value, alternating turns, fixed action count, fixed state size, scalar value, deterministic transition, tree, DAG, rollout, or neural evaluator.
- Foundational ranges and representations may not encode accidental limits from the first domain or first GPU.
- Cross-component dependencies must be declared, acyclic, and made through public contracts rather than deep imports.
- Tests, safety checks, validation gates, branch protection, CODEOWNERS, cleanup safeguards, and benchmark requirements may not be weakened to save tokens or make a change pass.

See [`TOKEN_DISCIPLINE.md`](agent_files/general_foundation/TOKEN_DISCIPLINE.md), [`ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md), [`FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md), [`PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md), [`TESTING.md`](agent_files/general_foundation/TESTING.md), [`CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md), [`SANITY_CHECKING.md`](agent_files/general_foundation/SANITY_CHECKING.md), and [`PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md).

## Large-project organization rule

```text
repository
  -> product area
    -> component
      -> subsystem/module
        -> file
```

Every production artifact must have a declared home and owner. New components require a component manifest, README, registry entry, dependency declaration, and validation boundary in the same coherent change.

Do not create root-level source files, catch-all `utils`, `common`, `shared`, `misc`, or `helpers` dumping grounds, or cross-component deep imports. Focus branches and token budgets organize work without inventing product ownership.

## Universal token-backpressure gate

For every task:

1. identify the exact outcome, owner/authority, current-state evidence, and coherent scope;
2. state or infer the minimum practice floor required by the claim and consequence;
3. preserve enough reserve for actual-effect inspection, decisive verification, cleanup, and honest reporting;
4. identify optional breadth/polish and the signals that will defer it;
5. apply the reduction ladder before reserve erosion: remove duplication, reuse evidence, batch, narrow context/output, defer optional work, reduce scope/claim, split/handoff, or pause;
6. treat unchanged reads/retries, repeated repair cycles without better causal evidence, new owners/contracts, test-tier expansion, and loss of exact state as backpressure triggers;
7. never preserve the original broad claim by removing required evidence or good practice;
8. narrow or label sampled/bounded claims when evidence is reduced;
9. extend the soft budget when essential in-scope evidence or cleanup has high marginal value, and restore reserve through scope reduction or split;
10. checkpoint any budget extension, scope/claim change, deferral, split, or handoff.

Routine tasks use this gate implicitly without a separate ledger. A durable token-budget record is reserved for work with a real cross-session, cross-agent, telemetry, risk, or review consumer.

## Reasoning gate

Architecture, CUDA synchronization, memory layout, lifetimes, concurrency, JIT/ABI work, schemas, persistent state, hot-path changes, component creation, dependency-direction changes, repository splits, large-task branch maps, coordinated high-consequence plan execution, destructive cleanup, and full system-sanity claims require a completed critical assessment plus high-confidence reasoning supported by authority and evidence. Token pressure cannot be used to bypass this gate.

The gate is not permission to abandon hard work. Research, inspect, test, narrow scope, split, or hand off first.

## Focus-branch gate

Before deep execution of a large or complex task:

1. define the canonical parent objective, authority, plan version, global invariants, shared vocabulary, closure criteria, and integration owner;
2. identify owners, contracts, paths, artifact families, unknowns, risks, dependencies, testing, and cleanup obligations;
3. create semantic focus branches with stable IDs, one primary owner/output, exact inputs, minimal context, scope/non-goals, write permissions, acceptance/falsifier, rollback, cleanup, and integration obligations;
4. prove every leaf fits one focused session with its required testing/validation/cleanup/handoff reserve;
5. split or combine by semantic ownership and validity transition—not equal file, line, token, or agent counts;
6. normally assign one active focus branch per agent and checkpoint before switching;
7. constrain parallel branches to non-overlapping owners/write surfaces, coordinated shared contracts, acyclic dependencies, independent acceptance/rollback/cleanup, and one integration owner;
8. route shared-contract changes through the integration spine and invalidate dependents explicitly;
9. refuse parent completion until every branch is accounted for and exact outputs, contradictions, boundaries, end-to-end behavior, resources, lifecycle, compatibility, security, performance, testing, and cleanup are reconciled.

## Plan execution gate

Before executing a material node/focus branch:

1. identify the current parent plan/version, focus-branch ID, node ID, owner, Git branch/environment, and frozen head;
2. prove dependencies, expected revisions, authority, specifications, branch sizing, token/practice-floor readiness, environment, and operational preconditions;
3. load the minimal context packet and state the owned outcome, scope, non-goals, expected effects/output, acceptance, falsifier, rollback/safe stop, testing, cleanup, integration, and escalation conditions;
4. perform one coherent ownership-sized operation inside the branch write boundary;
5. inspect exact actual effects immediately, compare expected and actual, and run the focused falsifier;
6. register created/modified/obsolete state and reconcile owners, contracts, callers, artifacts, resources, lifecycle, design, testing, cleanup, and integration consequences;
7. classify continue, accept, pause, revise, rollback, fail, supersede, or integrate;
8. revise the parent plan and invalidate dependents for material deviations rather than silently expanding scope;
9. leave no invalid partial state, stale downstream assumption, abandoned resource, unowned residue, half-active branch, or material token/test/decision debt.

Routine reversible work does not require separate branch, execution, token, or cleanup ledgers.

## Cleanup and disposition gate

Before acceptance, handoff, PR readiness, closure, merge completion, release, pause, failure, or abandonment:

1. identify task-created, temporarily modified, superseded, partial, generated, diagnostic, local, remote, external, sensitive, and coordination state;
2. distinguish protected pre-existing/user/shared/authority/evidence/recovery state;
3. assign every material item a disposition;
4. order cleanup by dependencies so evidence, rollback, branches, PRs, tests, releases, and recovery are not destroyed early;
5. use exact targets and destructive safeguards;
6. verify local files, Git/worktree/stash state, remote PR/issue/review state, processes/ports/containers/device state, credentials/permissions, artifacts/caches/releases, persistence/backups, and external resources through owning systems;
7. archive useful stale material with provenance;
8. record bounded cleanup debt only when immediate cleanup is less safe;
9. block completion when residue threatens correctness, security, cost, authority, recovery, or future work.

A successful command, clean diff, green test, exited process, or merged PR is not by itself proof of cleanup.

## Sanity gate

A sanity/audit claim freezes the exact target, declares `full`, `bounded`, or `sampled`, accounts for the declared surface at risk-justified depth, uses full-attention review branches, interrogates material semantics, and reconciles components, paths, lifecycle, testing, cleanup, contradictions, invalidated evidence, and findings. Token pressure may narrow the declared claim but may not silently sample a full claim.

## PR review and merge gate

Before approving or merging:

1. identify PR, target, exact base/merge base, and reviewed head;
2. inspect complete changed surface, parent/branch state, token-backpressure/practice-floor decisions, semantic behavior, discussion, execution, tests, cleanup, and current-head evidence;
3. resolve blockers, questions, invalidated/unintegrated work, and material decision/test/token/cleanup debt;
4. invalidate affected review when head, parent plan, shared contract, evidence key, or material base changes;
5. immediately before merge, revalidate state, head, target, mergeability, checks/reviews/protection, closure, branch/dependent effects, and conflicts;
6. use an expected-head guard;
7. verify target SHA/tree, integration state, issue/branch/worktree disposition, dependents, resources, and cleanup.

Never weaken required practice because review or merge is consuming more tokens than expected.

## Work and evidence rules

- Work in the largest safe coherent semantic unit owned by one boundary, but let token backpressure cap work in flight.
- Decide artifact home before writing it.
- Preserve one proportional assessment/plan and one canonical branch map when triggered; link authority instead of duplicating ledgers.
- Do not create one branch, issue, PR, document, worktree, token ledger, test, or cleanup form per trivial item.
- Diagnose before repairing and cluster failures before repeated testing.
- Preserve raw evidence once and reuse it while its exact key remains valid.
- Archive useful stale material with provenance.
- External implementation reuse requires exact revision and license review.

## Required validation

At the current stage, run:

```bash
./scripts/verify-docs.sh
```

Additional validation is determined by [`agent_files/VALIDATION_POLICY.md`](agent_files/VALIDATION_POLICY.md). A task is not complete merely because tokens were conserved, files were edited, tests were green, branches were locally accepted, a PR was approved, GitHub reported a merge, or a cleanup command returned success.
