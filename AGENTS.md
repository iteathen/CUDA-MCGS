# UMCGS Agent Entry Point

This file is the mandatory first read for every human or automated developer. The canonical operating manual is [`agent_files/AGENTS.md`](agent_files/AGENTS.md). Tool-specific files are compatibility pointers only and may not create competing rules.

## Startup sequence

Before changing anything:

1. Read this file.
2. Read [`agent_files/AGENTS.md`](agent_files/AGENTS.md) and [`agent_files/AI_RULES.md`](agent_files/AI_RULES.md).
3. Read [`agent_files/DESIGN_ALIGNMENT_CARD.md`](agent_files/DESIGN_ALIGNMENT_CARD.md) and the compact doctrine in [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md).
4. For substantial or critical work, read [`agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md) before committing to a design or implementation sequence.
5. For a requested sanity check, audit, whole-project review, complete review, incident review, or release-readiness claim, read [`agent_files/general_foundation/SANITY_CHECKING.md`](agent_files/general_foundation/SANITY_CHECKING.md) and [`SEMANTIC_INTERROGATION.md`](agent_files/general_foundation/SEMANTIC_INTERROGATION.md) before deep inspection.
6. For PR readiness, review, approval, or merge work, read [`agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md) before acting on the PR.
7. Read [`agent_files/SYSTEM_REGISTRY.md`](agent_files/SYSTEM_REGISTRY.md) to identify the owning boundary and source of truth.
8. Read [`agent_files/general_foundation/PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and the UMCGS layout in [`agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md) before creating, moving, or splitting project artifacts.
9. Read the accepted ADRs and specifications relevant to the task. Load detailed design doctrine linked from `PRINCIPLES.md` when the task changes a component, contract, dependency, foundational representation, compatibility boundary, or reusable name.
10. Inspect repository status, existing work, and current project state.
11. Apply the reasoning gate before editing.

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
10. Archived or superseded material.

Do not silently resolve a contradiction in favor of the easiest implementation. Report it and stop at the reasoning gate when it affects correctness, architecture, safety, memory, synchronization, ABI, lifecycle, ownership, or dependency direction.

## Current phase

UMCGS is private, pre-release, documentation-first, and defining a universal GPU-resident Monte Carlo Graph Search framework. Production implementation may begin only for a clearly owned boundary with accepted governing specifications or an explicitly authorized disposable experiment.

The first product is the generic framework, not a chess engine. Chess, Go, text search, planning, optimization, policy-only search, evaluation-only search, partially observable search, and other workloads are adapters or conformance domains. None may permanently shape the core.

`main` is the current integration trunk. Short-lived `feature/*` and `agent/*` branches target `main`; one coherent PR normally uses squash merge. A different phase/branch model requires an explicit policy transition.

## Non-negotiable project invariants

- Assess substantial and critical work before planning; use a strong adversary to expose hidden assumptions, unsound simplicity, and unnecessary machinery.
- A sanity claim names an exact frozen revision or artifact and is explicitly `full`, `bounded`, or `sampled`; sampled evidence is never presented as complete coverage.
- Full sanity means every declared surface is accounted for at risk-justified depth, followed by boundary, end-to-end, lifecycle, and findings reconciliation—not exhaustive paperwork for every low-risk leaf.
- Every material PR receives complete author-side review of one exact head; independent review is required when phase, policy, owner instruction, or objective consequence triggers it.
- Review approval and merge are separate transactions. A head change invalidates affected review, and merge uses an expected-head guard where supported followed by target verification.
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
- Tests, safety checks, validation gates, branch protection, CODEOWNERS, and benchmark requirements may not be weakened to make a change pass or merge.

See [`agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md), [`SANITY_CHECKING.md`](agent_files/general_foundation/SANITY_CHECKING.md), [`PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md), [`LEGO_ARCHITECTURE.md`](agent_files/general_foundation/LEGO_ARCHITECTURE.md), [`agent_files/application_specific/UMCGS_PROFILE.md`](agent_files/application_specific/UMCGS_PROFILE.md), [`ARCHITECTURE_GUARDRAILS.md`](agent_files/application_specific/ARCHITECTURE_GUARDRAILS.md), and [`REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

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

Architecture, CUDA synchronization, memory layout, lifetimes, concurrency, JIT/ABI work, schemas, persistent state, hot-path changes, component creation, dependency-direction changes, and repository splits require a completed critical assessment plus high-confidence reasoning supported by authority and evidence. An agent that cannot establish the required reasoning must not edit that boundary. It must record a decision-ready blocker and next action in `next_step.yaml`.

The gate is not permission to abandon hard work. Research, inspect, test, and narrow the uncertainty first.

## Sanity gate

When a sanity or audit claim is made:

1. freeze the exact revision/artifact and declare `full`, `bounded`, or `sampled`;
2. map coverage by semantic owner and integration boundary rather than file count;
3. apply core, triggered-module, or exhaustive depth according to risk;
4. interrogate material semantic units rather than merely describing them;
5. reconcile component boundaries, critical end-to-end paths, cross-cutting lifecycle, contradictions, and findings;
6. treat tests, analyzers, sanitizers, and benchmarks as evidence rather than substitutes for understanding;
7. disclose checks not run, access limits, invalidated evidence, and claim limits;
8. give actionable independent findings durable disposition instead of quietly repairing them.

Routine implementation self-sanity may stay in the PR/task record. Use a separate sanity record only when the claim, duration, independence, parallelism, or continuation requires it.

## PR review and merge gate

Before approving or merging:

1. identify the PR, intended target, exact base/merge base when material, and exact reviewed head;
2. inspect actual ancestry, complete changed-file surface, semantic behavior, affected boundaries, discussion, and current-head evidence—not only the PR description;
3. label review honestly as author-side, independent, or exact-head owner authorization;
4. classify and resolve blocking defects, questions, requested changes, and review threads;
5. invalidate affected review when the head or material base state changes;
6. immediately before merge, revalidate PR state, head, target, mergeability, required checks/reviews/protection, closure effects, dependent branches, and conflicting work;
7. choose squash, rebase, or merge commit deliberately and use an expected-head guard where supported;
8. verify the resulting target SHA/tree, issue closure, branch disposition, and dependent work before claiming completion.

Never force-update the target, bypass protection, merge a different head from the reviewed one, or present author-side review as independent approval.

## Work and evidence rules

- Work in the largest safe coherent unit owned by one boundary; avoid repeated tiny passes that cause context drift.
- Decide the artifact's organizational home before writing it.
- Preserve one proportional assessment/plan by default; link existing authority rather than creating duplicate administrative ledgers.
- Preserve one proportional sanity or PR-review record only when the claim needs one; do not create one form per file or function.
- Before creating a reusable concept, state its owned invariant, intended equivalence class, exclusions, second-instance result, and first-consumer deletion result.
- Before calling a design simple, account for complexity exported to callers, adapters, generated code, device memory, synchronization, migration, recovery, operations, diagnostics, testing, and expected integrations.
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

Additional validation is determined by [`agent_files/VALIDATION_POLICY.md`](agent_files/VALIDATION_POLICY.md). A task is not complete merely because files were edited, a PR was approved, or GitHub reported a merge response.
