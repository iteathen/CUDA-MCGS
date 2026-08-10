# UMCGS Agent Entry Point

This file is the mandatory first read for every human or automated developer. The canonical operating manual is [`agent_files/AGENTS.md`](agent_files/AGENTS.md). Tool-specific files are compatibility pointers only and may not create competing rules.

## Startup sequence

Before changing anything:

1. Read this file.
2. Read [`agent_files/AGENTS.md`](agent_files/AGENTS.md) and [`agent_files/AI_RULES.md`](agent_files/AI_RULES.md).
3. Read [`agent_files/DESIGN_ALIGNMENT_CARD.md`](agent_files/DESIGN_ALIGNMENT_CARD.md) and the compact doctrine in [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md).
4. For substantial or critical work, read [`agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md) before committing to a design or implementation sequence.
5. Before executing a material plan node, read [`agent_files/general_foundation/PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md).
6. Before creating exceptional local, remote, sensitive, retained, or external state—and before acceptance, handoff, closure, or merge—read [`agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md).
7. For a requested sanity check, audit, whole-project review, complete review, incident review, or release-readiness claim, read [`agent_files/general_foundation/SANITY_CHECKING.md`](agent_files/general_foundation/SANITY_CHECKING.md) and [`SEMANTIC_INTERROGATION.md`](agent_files/general_foundation/SEMANTIC_INTERROGATION.md) before deep inspection.
8. For PR readiness, review, approval, or merge work, read [`agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md) before acting on the PR.
9. Read [`agent_files/SYSTEM_REGISTRY.md`](agent_files/SYSTEM_REGISTRY.md) to identify the owning boundary and source of truth.
10. Read [`agent_files/general_foundation/PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and the UMCGS layout in [`agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md) before creating, moving, or splitting project artifacts.
11. Read the accepted ADRs and specifications relevant to the task. Load detailed design doctrine linked from `PRINCIPLES.md` when the task changes a component, contract, dependency, foundational representation, compatibility boundary, or reusable name.
12. Inspect repository status, existing work, and current project state.
13. Apply the reasoning, execution-readiness, and cleanup gates before editing.

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
10. Plans, execution records, cleanup records, and summaries.
11. Archived or superseded material.

A plan organizes work beneath authority. Cleanup also follows authority. Do not silently choose stale plan wording, destructive convenience, or a visually clean workspace over protected user state, evidence, rollback, ownership, or accepted contracts. Stop the affected work when the conflict changes correctness, architecture, safety, memory, synchronization, ABI, lifecycle, ownership, dependency direction, acceptance, cleanup disposition, or downstream outputs.

## Current phase

UMCGS is private, pre-release, documentation-first, and defining a universal GPU-resident Monte Carlo Graph Search framework. Production implementation may begin only for a clearly owned boundary with accepted governing specifications, an assessment disposition that permits implementation, and a dependency-ready plan node—or an explicitly authorized disposable experiment.

The first product is the generic framework, not a chess engine. Chess, Go, text search, planning, optimization, policy-only search, evaluation-only search, partially observable search, and other workloads are adapters or conformance domains. None may permanently shape the core.

`main` is the current integration trunk. Short-lived `feature/*` and `agent/*` branches target `main`; one coherent PR normally uses squash merge. A different phase/branch model requires an explicit policy transition.

## Non-negotiable project invariants

- Assess substantial and critical work before planning; use a strong adversary to expose hidden assumptions, unsound simplicity, and unnecessary machinery.
- Execute only a current dependency-ready plan node under current authority; state expected effects, falsifier, rollback/safe stop, and material stop conditions before mutation.
- Inspect actual effects immediately after each coherent operation, classify deviations, and never accept invalid partial state or abandoned execution-created resources.
- Every material task-created, temporarily modified, superseded, partial, generated, local, remote, sensitive, external, and coordination item receives an explicit owner, disposition, and owning-system verification.
- Cleanup means remove, restore, retain with authority/evidence/recovery purpose, archive, quarantine, transfer, supersede, protect unchanged, or retain temporarily with an objective trigger—not blind deletion.
- User/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, and active dependents are never destroyed without exact authority.
- A sanity claim names an exact frozen revision or artifact and is explicitly `full`, `bounded`, or `sampled`; sampled evidence is never presented as complete coverage.
- Before detailed sanity review, split the complete semantic coverage map into leaf review branches small enough for one focused session and full attention to every material semantic unit.
- Full sanity means every declared surface is accounted for at risk-justified depth, followed by boundary, end-to-end, design, lifecycle, findings, and cleanup reconciliation—not exhaustive paperwork for every low-risk unit.
- Every material PR receives complete author-side review of one exact head; independent review is required when phase, policy, owner instruction, or objective consequence triggers it.
- Review approval and merge are separate transactions. A head change invalidates affected review, and merge uses an expected-head guard where supported followed by target and cleanup verification.
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
- Tests, safety checks, validation gates, branch protection, CODEOWNERS, cleanup safeguards, and benchmark requirements may not be weakened to make a change pass, look clean, or merge.

See [`agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md), [`PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md), [`CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md), [`SANITY_CHECKING.md`](agent_files/general_foundation/SANITY_CHECKING.md), [`SEMANTIC_INTERROGATION.md`](agent_files/general_foundation/SEMANTIC_INTERROGATION.md), [`PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md), [`LEGO_ARCHITECTURE.md`](agent_files/general_foundation/LEGO_ARCHITECTURE.md), [`agent_files/application_specific/UMCGS_PROFILE.md`](agent_files/application_specific/UMCGS_PROFILE.md), [`ARCHITECTURE_GUARDRAILS.md`](agent_files/application_specific/ARCHITECTURE_GUARDRAILS.md), and [`REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

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

Do not create root-level source files, catch-all `utils`, `common`, `shared`, `misc`, or `helpers` dumping grounds, or cross-component deep imports. Organizational scaffolding is established early; runtime abstractions, extra repositories, and deployable services are created only when an independent lifecycle justifies them.

## Reasoning gate

Architecture, CUDA synchronization, memory layout, lifetimes, concurrency, JIT/ABI work, schemas, persistent state, hot-path changes, component creation, dependency-direction changes, repository splits, coordinated high-consequence plan execution, destructive cleanup, and full system-sanity claims require a completed critical assessment plus high-confidence reasoning supported by authority and evidence. An agent that cannot establish the required reasoning must not edit, delete, or certify that boundary. It must record a decision-ready blocker and next action in `next_step.yaml`.

The gate is not permission to abandon hard work. Research, inspect, test, and narrow the uncertainty first.

## Plan execution gate

Before executing a material node:

1. identify the current plan record, version, node ID, owner, branch, and frozen head;
2. prove dependencies, expected dependency revisions, authority, specifications, environment, and operational preconditions;
3. state the owned outcome, scope, non-goals, expected local/wider effects, acceptance criteria, cheapest decisive falsifier, rollback/safe stop, cleanup obligations, and escalation conditions;
4. scan for newly triggered design, persistence, security, concurrency, memory, graph/search, evaluator, performance, generated/JIT/ABI, cleanup, sanity, packaging, or release doctrine;
5. perform one coherent ownership-sized operation rather than an arbitrary file batch;
6. inspect exact actual effects immediately, compare expected and actual, and run the focused falsifier;
7. register created/modified/obsolete state and reconcile affected owners, contracts, callers, artifacts, runtime paths, resources, lifecycle, design principles, and cleanup dispositions;
8. classify the outcome as continue, accept, pause, revise, rollback, fail, or supersede;
9. revise the plan for material deviation rather than silently expanding scope;
10. leave no invalid partial state, stale downstream assumption, abandoned execution-created resource, or unowned cleanup residue.

Routine reversible single-session work does not require a separate execution or cleanup ledger. Use durable records only when coordination, continuation, invalid intermediate states, high consequence, external/sensitive state, or another evidence consumer requires them.

## Cleanup and disposition gate

Before acceptance, handoff, PR readiness, closure, merge completion, release, pause, failure, or abandonment:

1. identify task-created, temporarily modified, superseded, partial, generated, diagnostic, local, remote, external, sensitive, and coordination state;
2. distinguish protected pre-existing/user/shared/authority/evidence/recovery state;
3. assign every material item a disposition: remove, restore, retain authority/evidence/recovery, archive, quarantine, transfer, supersede, retain temporarily with owner/trigger, or protect unchanged;
4. order cleanup by dependencies so evidence, rollback, active PRs/branches, tests, releases, and recovery are not destroyed early;
5. use exact targets and destructive safeguards; never use broad deletion, hard reset/clean, force-push, branch deletion, PR/issue closure, secret deletion, or remote resource removal as cosmetic cleanup;
6. verify local files/folders, Git/worktree/stash state, remote branches/PRs/issues/reviews, processes/ports/containers/device state, credentials/permissions, artifacts/caches/releases, persistence/backups, and external resources through their owning systems;
7. archive historically useful stale material with provenance rather than silently deleting it;
8. record safe bounded cleanup debt only when immediate cleanup is less safe than retention;
9. update canonical issue, plan/execution, PR, status, and handoff records with anything that remains;
10. block completion when residue can corrupt behavior, expose data, incur uncontrolled cost, mislead authority, defeat recovery, or contaminate future work.

A successful command, clean diff, exited process, or merged PR is not by itself proof of cleanup.

## Sanity gate

When a sanity or audit claim is made:

1. freeze the exact revision/artifact and declare `full`, `bounded`, or `sampled`;
2. define included/excluded surfaces, authority, environment, external state, risks, and access limits;
3. build the complete coverage map by semantic owner and integration boundary rather than file count;
4. split the map into owner, boundary, path, cross-cutting, or artifact review branches small enough for one focused session and full attention without sampling or skimming;
5. inventory every material semantic unit in each leaf branch;
6. apply core, triggered-module, or exhaustive depth according to risk;
7. interrogate every material unit against specifications, ownership, foundations, LEGO/SOLID/CUPID, universality, resources, failure behavior, cleanup, counterexamples, evidence, and wider consequences;
8. reconcile component boundaries, critical end-to-end paths, design principles, cross-cutting lifecycle, cleanup state, contradictions, invalidated evidence, and findings;
9. treat tests, analyzers, sanitizers, and benchmarks as evidence rather than substitutes for understanding;
10. disclose checks not run, dispose of review-created state, and give actionable independent findings durable disposition instead of quietly repairing them.

A review branch is a semantic coverage packet, not automatically a Git branch. Passing leaf branches do not prove integrated system coherence. Routine implementation self-sanity may stay in the PR/task record; use a separate sanity record only when the claim, duration, independence, parallelism, or continuation requires it.

## PR review and merge gate

Before approving or merging:

1. identify the PR, intended target, exact base/merge base when material, and exact reviewed head;
2. inspect actual ancestry, complete changed-file surface, semantic behavior, affected boundaries, discussion, execution fidelity, cleanup plan, and current-head evidence—not only the PR description;
3. label review honestly as author-side, independent, or exact-head owner authorization;
4. classify and resolve blocking defects, questions, requested changes, review threads, and material cleanup debt;
5. invalidate affected review when the head or material base state changes;
6. immediately before merge, revalidate PR state, head, target, mergeability, required checks/reviews/protection, closure effects, dependent branches, and conflicting work;
7. choose squash, rebase, or merge commit deliberately and use an expected-head guard where supported;
8. verify the resulting target SHA/tree, issue closure, source/local/remote branch and worktree disposition, dependent work, temporary permissions, artifacts, and external resources before claiming completion.

Never force-update the target, bypass protection, merge a different head from the reviewed one, present author-side review as independent approval, or erase useful PR history for dashboard cleanliness.

## Work and evidence rules

- Work in the largest safe coherent unit owned by one boundary; avoid repeated tiny passes that cause context drift.
- Decide the artifact's organizational home before writing it.
- Preserve one proportional assessment/plan by default; link existing authority rather than creating duplicate administrative ledgers.
- Preserve one proportional execution, cleanup, sanity, or PR-review record only when another consumer or consequence gate needs its unique evidence.
- Do not create one cleanup form per ordinary temporary file or use cleanup debt to hide incomplete work.
- Before creating a reusable concept, state its owned invariant, intended equivalence class, exclusions, second-instance result, and first-consumer deletion result.
- Before calling a design simple, account for complexity exported to callers, adapters, generated code, device memory, synchronization, migration, recovery, cleanup, operations, diagnostics, testing, and expected integrations.
- Diagnose before repairing: observe, compare with the contract, locate ownership, make one coherent repair, retest.
- Never apply speculative fixes or optimize an unmeasured symptom.
- Preserve raw evidence and label claims as owner requirement, accepted authority, verified observation, inference, proposal, or unresolved assumption.
- Performance claims require reproducible workload, hardware/software profile, methodology, raw results, and comparison.
- Archive historically useful stale material with provenance rather than silently deleting it.
- External implementation reuse requires exact revision and license review before copying or adapting code.

## Required validation

At the current stage, run:

```bash
./scripts/verify-docs.sh
```

Additional validation is determined by [`agent_files/VALIDATION_POLICY.md`](agent_files/VALIDATION_POLICY.md). A task is not complete merely because files were edited, a PR was approved, GitHub reported a merge response, or a cleanup command returned success.
