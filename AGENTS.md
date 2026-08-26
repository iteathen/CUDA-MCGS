# CUDA-MCGS Agent Entry Point

This file is the mandatory first read for every human or automated developer. The canonical operating manual is [`agent_files/AGENTS.md`](agent_files/AGENTS.md). Tool-specific files are compatibility pointers only and may not create competing rules.

## Startup sequence

Before changing anything:

1. Read this file.
2. Read [`agent_files/AGENTS.md`](agent_files/AGENTS.md) and [`agent_files/AI_RULES.md`](agent_files/AI_RULES.md).
3. Read [`agent_files/DESIGN_ALIGNMENT_CARD.md`](agent_files/DESIGN_ALIGNMENT_CARD.md) and the compact doctrine in [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md).
4. For **every task**, apply [`agent_files/general_foundation/TOKEN_DISCIPLINE.md`](agent_files/general_foundation/TOKEN_DISCIPLINE.md): establish at least an implicit token posture, minimum practice floor, coherent scope, decisive evidence, reserve, and backpressure triggers before work expands.
5. For substantial or critical work, read [`agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md) before committing to a design or implementation sequence.
6. When the task is large, complex, cross-session, parallel, or cannot fit one focused context, read [`agent_files/general_foundation/FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md) and build the parent branch map before deep execution.
7. Before executing a material plan node, read [`agent_files/general_foundation/PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md).
8. Before creating exceptional local, remote, sensitive, retained, or external state—and before acceptance, handoff, closure, or merge—read [`agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md).
9. For a requested sanity check, audit, whole-project review, complete review, incident review, or release-readiness claim, read [`agent_files/general_foundation/SANITY_CHECKING.md`](agent_files/general_foundation/SANITY_CHECKING.md) and [`SEMANTIC_INTERROGATION.md`](agent_files/general_foundation/SEMANTIC_INTERROGATION.md) before deep inspection.
10. For PR readiness, review, approval, or merge work, read [`agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md) before acting on the PR.
11. Read [`agent_files/SYSTEM_REGISTRY.md`](agent_files/SYSTEM_REGISTRY.md) to identify the owning boundary and source of truth.
12. Read [`agent_files/general_foundation/PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and the CUDA-MCGS layout in [`agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md) before creating, moving, or splitting project artifacts.
13. Read the accepted ADRs and specifications relevant to the task. Load detailed design doctrine linked from `PRINCIPLES.md` when the task changes a component, contract, dependency, foundational representation, compatibility boundary, or reusable name.
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

A plan, budget, or focus-branch map organizes work beneath authority. Token pressure and cleanup also follow authority. Do not silently choose stale plan wording, branch-local convenience, destructive convenience, a soft token target, or a visually clean workspace over shared contracts, protected user state, evidence, rollback, ownership, or accepted authority. Stop affected work when the conflict changes correctness, architecture, safety, memory, synchronization, ABI, lifecycle, ownership, dependency direction, acceptance, branch inputs/outputs, evidence, cleanup disposition, or downstream results.

## Current phase

CUDA-MCGS is a **public pre-release repository** in documentation-first framework definition, specification, and bounded evidence gathering while defining a universal GPU-resident Monte Carlo Graph Search framework. Public visibility is established, but it does not authorize production implementation, create a stable API/support promise, or constitute a CUDA-MCGS product release. Production implementation may begin only for a clearly owned boundary with accepted governing specifications, an assessment disposition that permits implementation, and a dependency-ready plan/focus branch—or an explicitly authorized disposable experiment.

The first product is the generic framework, not a chess engine. Chess, Go, text search, planning, optimization, policy-only search, evaluation-only search, partially observable search, and other workloads are adapters or conformance domains. None may permanently shape the core.

`main` is the current integration trunk. Short-lived `feature/*` and `agent/*` Git branches target `main`; one coherent PR normally uses squash merge. A semantic focus branch is not automatically a Git branch. A different phase/branch model requires an explicit policy transition.

## Non-negotiable project invariants

- Assess substantial and critical work before planning; use a strong adversary to expose hidden assumptions, unsound simplicity, and unnecessary machinery.
- Apply token backpressure to **every task** from the first retrieval or mutation, including routine work.
- Token pressure controls scope, work in flight, duplication, context, repeated testing/retries, and ceremony. It does not lower the risk-appropriate minimum practice floor.
- Preserve at least the request/authority, relevant current-state inspection, coherent scope, expected result, decisive verification, actual-effect inspection, cleanup, and honest limits for every task.
- Reduce pressure in this order: duplication → evidence reuse → batching → context/output narrowing → optional breadth/polish → scope/claim reduction → split/handoff → blocker. Never cut required rigor first.
- Soft token estimates are replan signals rather than authority. Essential evidence, safety, correctness, cleanup, and handoff may justify an explicit extension or split.
- Reduced evidence narrows the claim; sampling or lower tiers may not preserve an unsupported full/release-grade claim.
- Decompose a large or complex task before attention degrades: one canonical parent/integration spine, semantic focus branches sized for full attention, exact branch contracts, explicit invalidation, constrained parallelism, and central reconciliation.
- A focus branch is not automatically a Git branch, issue, PR, component, directory, or document.
- Locally accepted focus branches do not prove parent completion; exact outputs must be integrated and reconciled against one final revision.
- Execute only a current dependency-ready plan node/focus branch under current authority; state expected effects, falsifier, rollback/safe stop, cleanup, and integration obligations before mutation.
- Inspect actual effects immediately after each coherent operation, classify deviations, and never accept invalid partial state or abandoned execution-created resources.
- Every material task-created, temporarily modified, superseded, partial, generated, local, remote, sensitive, external, and coordination item receives an explicit owner, disposition, and owning-system verification.
- Cleanup means remove, restore, retain with authority/evidence/recovery purpose, archive, quarantine, transfer, supersede, protect unchanged, or retain temporarily with an objective trigger—not blind deletion.
- User/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, and active dependents are never destroyed without exact authority.
- A sanity claim names an exact frozen revision or artifact and is explicitly `full`, `bounded`, or `sampled`; sampled evidence is never presented as complete coverage.
- Before detailed sanity review, split the complete semantic coverage map into leaf review branches small enough for one focused session and full attention to every material semantic unit.
- Full sanity means every declared surface is accounted for at risk-justified depth, followed by boundary, end-to-end, design, lifecycle, findings, and cleanup reconciliation—not exhaustive paperwork for every low-risk unit.
- Every material PR receives complete author-side review of one exact head; independent review is required when phase, policy, owner instruction, or objective consequence triggers it.
- Review approval and merge are separate transactions. A head, parent-plan, shared-contract, evidence-key, or material base change invalidates affected evidence, and merge uses an expected-head guard followed by target and cleanup verification.
- Apply the accepted design hierarchy: domain truth and authority → purpose/bounds/contextual weighting → LEGO boundaries → SOLID responsibilities → CUPID quality → simplest sufficient total system → measured validation.
- One authoritative fact/state/lifecycle has one visible owner; consumers use meaningful public contracts rather than internal mutation.
- Dependencies are explicit and injected; platform, compatibility, domain-instance, and model-instance details remain behind owned adapters.
- Organize the repository from the beginning as though it will become a very large project. Current file count is never justification for a flat, unowned, or temporary layout.
- Universal at contracts and compilation boundaries; specialized in generated hot paths.
- Every concrete engine is finite and has an explicit GPU-memory and resource plan.
- After search ignition, no active search decision may require a CPU-produced intermediate result.
- The selected search engine, evaluator/model, work queues, and mutable search state remain GPU-resident during active search.
- Maintained CUDA-MCGS production source is JavaScript only: ordinary Node.js for host lifecycle and restricted Device-JS for device programs, submitted only through versioned public CUDA-JS contracts. Do not add C/C++, CUDA C++, native addons, direct FFI/Driver access, hand-written PTX, embedded CUDA source, or a subprocess native search implementation to CUDA-MCGS. CUDA-JS may use JIT, native code and CUDA-specific implementation wherever needed or desired behind its consumer-neutral public contracts.
- Bounded asynchronous observation reads, externally supplied attention/control changes, cancellation, completion and teardown are the only post-ignition host interactions. They may not form a host read-decide-write, polling/relaunch or callback loop that advances internal search.
- Do not force an awkward CUDA-MCGS workaround around a missing generic CUDA-JS mechanism. When the current public surface cannot express a need naturally, safely and with bounded lifecycle/resource semantics, stop and classify a consumer-neutral CUDA-JS capability; keep MCGS/domain/product policy in CUDA-MCGS.
- Treat the inclination to write a native solution in CUDA-MCGS as an early diagnostic clue that CUDA-JS may be incomplete. Pause before design or implementation and perform the capability/ownership test; do not wait until a workaround has already been built.
- State identity, transpositions, history, cycles, action production, evaluation outputs, backup semantics, output semantics, and resource exhaustion are explicit contracts.
- Keep root control semantics distinct: `root` establishes initial authority; `advance` moves to an already ready realized successor with bounded state-independent publication and no traversal, transformation, reset, resize, reclassification, reclamation, or eager cleanup; `reroot` owns general root replacement/reconciliation; and `attention` changes direction without root change or work invalidation. Advance supersedes occurrences and occurrence-scoped work lazily, not shared graph nodes merely reached through an old path.
- No hidden assumption of a game, board, player count, zero-sum value, alternating turns, fixed action count, fixed state size, scalar value, deterministic transition, tree, DAG, rollout, or neural evaluator.
- Foundational ranges and representations may not encode accidental limits from the first domain or first GPU.
- Cross-component dependencies must be declared, acyclic, and made through public contracts rather than deep imports.
- Tests, safety checks, validation gates, branch protection, CODEOWNERS, cleanup safeguards, and benchmark requirements may not be weakened to save tokens or make a change pass, look clean, or merge.

See [`TOKEN_DISCIPLINE.md`](agent_files/general_foundation/TOKEN_DISCIPLINE.md), [`ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md), [`FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md), [`PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md), [`TESTING.md`](agent_files/general_foundation/TESTING.md), [`CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md), [`SANITY_CHECKING.md`](agent_files/general_foundation/SANITY_CHECKING.md), [`SEMANTIC_INTERROGATION.md`](agent_files/general_foundation/SEMANTIC_INTERROGATION.md), [`PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md), [`LEGO_ARCHITECTURE.md`](agent_files/general_foundation/LEGO_ARCHITECTURE.md), [`agent_files/application_specific/UMCGS_PROFILE.md`](agent_files/application_specific/UMCGS_PROFILE.md), [`ARCHITECTURE_GUARDRAILS.md`](agent_files/application_specific/ARCHITECTURE_GUARDRAILS.md), and [`REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

## Large-project organization rule

The organizational hierarchy is:

```text
repository
  -> product area
    -> component
      -> subsystem/module
        -> file
```

Every production artifact must have a declared home and owner. New components require a component manifest, README, registry entry, dependency declaration, and validation boundary in the same coherent change.

Do not create root-level source files, catch-all `utils`, `common`, `shared`, `misc`, or `helpers` dumping grounds, or cross-component deep imports. Organizational scaffolding is established early; runtime abstractions, extra repositories, and deployable services are created only when an independent lifecycle justifies them. Focus branches and token budgets organize work without inventing product ownership.

## Universal token-backpressure gate

For every task:

1. identify the exact outcome, owner/authority, current-state evidence, and smallest coherent useful scope;
2. state or infer the minimum practice floor required by the claim and consequence;
3. preserve enough reserve for actual-effect inspection, decisive verification, cleanup, and honest reporting;
4. identify optional breadth/polish and the signals that will defer it;
5. apply the reduction ladder before reserve erosion: remove duplication, reuse evidence, batch, narrow context/output, defer optional work, reduce scope/claim, split/handoff, or pause;
6. treat unchanged reads/retries, repeated repair cycles without better causal evidence, new owners/contracts, test-tier expansion, and loss of exact state as backpressure triggers;
7. never preserve the original broad claim by removing required evidence or good practice;
8. narrow or label sampled/bounded claims when evidence is reduced;
9. extend the soft budget when essential in-scope evidence or cleanup has high marginal value, and restore reserve through scope reduction or split;
10. checkpoint any budget extension, scope/claim change, deferral, split, or handoff;
11. do not continue because of sunk token cost.

Routine tasks use this gate implicitly without a separate ledger. A durable token-budget record is reserved for work with a real cross-session, cross-agent, telemetry, risk, or review consumer.

## Reasoning gate

Architecture, CUDA synchronization, memory layout, lifetimes, concurrency, JIT/ABI work, schemas, persistent state, hot-path changes, component creation, dependency-direction changes, repository splits, large-task branch maps, coordinated high-consequence plan execution, destructive cleanup, and full system-sanity claims require a completed critical assessment plus high-confidence reasoning supported by authority and evidence. An agent that cannot establish the required reasoning must not edit, delete, decompose, parallelize, or certify that boundary. It must record a decision-ready blocker and next action in `next_step.yaml`.

Token pressure cannot be used to bypass this gate. The gate is not permission to abandon hard work: research, inspect, test, narrow scope, split, or hand off first.

## Focus-branch gate

Before deep execution of a large or complex task:

1. define the canonical parent objective, authority, plan version, global invariants, shared vocabulary, closure criteria, and integration owner;
2. identify owners, contracts, paths, artifact families, unknowns, risks, dependencies, testing, and cleanup obligations;
3. create semantic focus branches with stable IDs, one primary owner/output, exact inputs, minimal context, scope/non-goals, write permissions, acceptance/falsifier, rollback, cleanup, and integration obligations;
4. prove every leaf fits one focused session with its required testing/validation/cleanup/handoff reserve;
5. split or combine by semantic ownership and validity transition—not equal file, line, token, or agent counts;
6. distinguish semantic focus branches from optional Git branches/PRs/issues/worktrees;
7. normally assign one active focus branch per agent and checkpoint before switching;
8. constrain parallel branches to non-overlapping owners/write surfaces, coordinated shared contracts, acyclic dependencies, independent acceptance/rollback/cleanup, and one integration owner;
9. route shared-contract changes through the integration spine and invalidate dependents explicitly;
10. refuse parent completion until every branch is accounted for and exact outputs, contradictions, boundaries, end-to-end behavior, resources, lifecycle, compatibility, security, performance, testing, and cleanup are reconciled against one final revision.

Use a durable focus-branch packet only when cross-session, parallel, high-consequence, or independent continuation/review requires it.

## Plan execution gate

Before executing a material node/focus branch:

1. identify the current parent plan/version, focus-branch ID, node ID, owner, Git branch/environment, and frozen head;
2. prove dependencies, expected revisions, authority, specifications, branch sizing, token/practice-floor readiness, environment, and operational preconditions;
3. load the minimal context packet and state the owned outcome, scope, non-goals, expected local/wider effects, output, acceptance, falsifier, rollback/safe stop, testing, cleanup, integration, and escalation conditions;
4. scan for newly triggered design, persistence, security, concurrency, memory, graph/search, evaluator, performance, generated/JIT/ABI, cleanup, sanity, packaging, or release doctrine;
5. perform one coherent ownership-sized operation inside the branch write boundary;
6. inspect exact actual effects immediately, compare expected and actual, and run the focused falsifier;
7. register created/modified/obsolete state and reconcile affected owners, contracts, callers, artifacts, runtime paths, resources, lifecycle, design principles, testing, cleanup, and integration consequences;
8. classify the outcome as continue, accept, pause, revise, rollback, fail, supersede, or integrate;
9. revise the parent plan and invalidate dependents for material deviations or shared-contract changes rather than silently expanding scope;
10. leave no invalid partial state, stale downstream assumption, abandoned resource, unowned cleanup residue, half-active branch, or material decision/test/token debt.

Routine reversible single-session work does not require separate branch, execution, token, or cleanup ledgers. Use durable records only when another consumer or consequence requires them.

## Cleanup and disposition gate

Before acceptance, handoff, PR readiness, closure, merge completion, release, pause, failure, or abandonment:

1. identify task-created, temporarily modified, superseded, partial, generated, diagnostic, local, remote, external, sensitive, and coordination state;
2. distinguish protected pre-existing/user/shared/authority/evidence/recovery state;
3. assign every material item a disposition;
4. order cleanup by dependencies so evidence, rollback, active focus/Git branches, PRs, tests, releases, and recovery are not destroyed early;
5. use exact targets and destructive safeguards;
6. verify local files/folders, Git/worktree/stash state, semantic/Git branches, remote PRs/issues/reviews, processes/ports/containers/device state, credentials/permissions, artifacts/caches/releases, persistence/backups, and external resources through their owning systems;
7. archive historically useful stale material with provenance;
8. record safe bounded cleanup debt only when immediate cleanup is less safe than retention;
9. update parent/focus-branch/plan/execution/PR/status/handoff records with anything that remains;
10. block completion when residue can corrupt behavior, expose data, incur uncontrolled cost, mislead authority, defeat recovery, or contaminate future work.

A successful command, clean diff, green test, exited process, or merged PR is not by itself proof of cleanup. Token pressure never justifies unsafe cleanup or omitted retained-state reporting.

## Sanity gate

When a sanity or audit claim is made:

1. freeze the exact revision/artifact and declare `full`, `bounded`, or `sampled`;
2. define included/excluded surfaces, authority, environment, external state, risks, and access limits;
3. build the complete coverage map by semantic owner and integration boundary rather than file count;
4. split the map into review branches small enough for one focused session and full attention;
5. inventory every material semantic unit in each leaf;
6. apply risk-justified depth;
7. interrogate material units against specifications, ownership, foundations, design, resources, failure/cleanup, counterexamples, evidence, and wider consequences;
8. reconcile component boundaries, end-to-end paths, focus-branch outputs, lifecycle, testing, cleanup, contradictions, invalidated evidence, and findings;
9. treat tools as evidence rather than substitutes for understanding;
10. disclose checks not run, dispose of review-created state, and give actionable independent findings durable disposition.

Review branches are specialized semantic focus branches, not automatically Git branches. Passing leaves do not prove integrated coherence. Token pressure may narrow the declared claim but may not silently sample a full claim.

## PR review and merge gate

Before approving or merging:

1. identify the PR, intended target, exact base/merge base, and exact reviewed head;
2. inspect ancestry, complete changed surface, parent/focus-branch map, branch outputs/statuses, token-backpressure/practice-floor decisions, semantic behavior, affected boundaries, discussion, execution fidelity, testing, cleanup plan, and current-head evidence;
3. label review independence honestly;
4. resolve blocking defects, questions, requested changes, review threads, invalidated/unintegrated branches, and material decision/test/token/cleanup debt;
5. invalidate affected review when head, parent plan, shared contract, evidence key, or material base changes;
6. immediately before merge, revalidate PR state, head, target, mergeability, checks/reviews/protection, closure, focus/Git branch and dependent-work effects, and conflicting work;
7. choose merge method deliberately and use an expected-head guard;
8. verify target SHA/tree, parent/focus-branch integration state, issue closure, branch/worktree disposition, dependents, permissions, artifacts, resources, and cleanup before claiming completion.

Never force-update the target, bypass protection, merge a different head, present author-side review as independent, erase useful history for cleanliness, or weaken required practice because review/merge consumes more tokens than expected.

## Work and evidence rules

- Work in the largest safe coherent semantic unit owned by one boundary, but let token backpressure cap work in flight.
- Decide artifact organizational home before writing it.
- Preserve one proportional assessment/plan and one canonical focus-branch map when triggered; link existing authority instead of duplicating ledgers.
- Preserve specialist branch/execution/token/cleanup/sanity/PR-review records only when another consumer or consequence needs unique evidence.
- Do not create one Git branch, issue, PR, document, worktree, token ledger, test, or cleanup form per trivial item.
- Before creating reusable concepts, state owned invariant, equivalence class, exclusions, second-instance result, and first-consumer deletion result.
- Before calling a design simple, account for complexity exported to callers, adapters, generated code, memory, synchronization, migration, recovery, cleanup, focus-branch coordination, operations, diagnostics, tests, and expected integrations.
- Diagnose before repairing; cluster failures before repeated testing; never apply speculative fixes or optimize unmeasured symptoms.
- Preserve raw evidence once and reuse it while its exact key remains valid.
- Performance claims require reproducible workload, profile, methodology, raw results, and comparison.
- Archive historically useful stale material with provenance.
- External implementation reuse requires exact revision and license review.

## Required validation

At the current stage, run:

```bash
./scripts/verify-docs.sh
```

Additional validation is determined by [`agent_files/VALIDATION_POLICY.md`](agent_files/VALIDATION_POLICY.md). A task is not complete merely because tokens were conserved, files were edited, tests were green, branches were locally accepted, a PR was approved, GitHub reported a merge, or a cleanup command returned success.
