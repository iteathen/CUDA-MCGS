# Agent Documentation

**Scope:** Canonical developer and agent guidance for CUDA-MCGS.

This directory is the durable operating system for development. The root [`AGENTS.md`](../AGENTS.md) is the mandatory entry point; this directory provides the reusable foundation, CUDA-MCGS-specific constraints, and task templates.

## Canonical files

- [`AGENTS.md`](AGENTS.md) — operating manual and task routing.
- [`AI_RULES.md`](AI_RULES.md) — hard behavioral rules.
- [`SYSTEM_REGISTRY.md`](SYSTEM_REGISTRY.md) — ownership and source-of-truth registry.
- [`VALIDATION_POLICY.md`](VALIDATION_POLICY.md) — evidence and completion requirements.
- [`DESIGN_ALIGNMENT_CARD.md`](DESIGN_ALIGNMENT_CARD.md) — compact mandatory design and integration alignment.

## Reusable foundation

- [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md) — compact mandatory design hierarchy.
- [`general_foundation/NO_PYTHON_POLICY.md`](general_foundation/NO_PYTHON_POLICY.md) — accepted ecosystem-wide prohibition on Python source, tooling, dependencies, tests, CI, generators, experiments, packaging, and temporary scripts.
- [`general_foundation/ENGINEERING_JUDGMENT.md`](general_foundation/ENGINEERING_JUDGMENT.md) — specification alignment, reasoning, candidate-path selection, value ordering, tradeoffs, and priority.
- [`general_foundation/ASSESSMENT_AND_PLANNING.md`](general_foundation/ASSESSMENT_AND_PLANNING.md) — proportional adversarial assessment and executable planning.
- [`general_foundation/FOCUS_BRANCHES.md`](general_foundation/FOCUS_BRANCHES.md) — parent-task integration spines, full-attention branch sizing, context packets, parallelism, invalidation, and reconciliation for large or complex work.
- [`general_foundation/TOKEN_DISCIPLINE.md`](general_foundation/TOKEN_DISCIPLINE.md) — universal token backpressure, minimum practice floor, reduction ladder, reserves, context layers/bands, budget elasticity, lossless checkpoints, and token-debt prevention.
- [`general_foundation/SPEC_AND_AGENT_FILE_READING.md`](general_foundation/SPEC_AND_AGENT_FILE_READING.md) — instruction-chain discovery, specification applicability, trigger/adjacency scans, semantic closure, reading depth, and final authority refresh.
- [`general_foundation/CONTEXT_ROUTING.md`](general_foundation/CONTEXT_ROUTING.md) — authority-complete context loading, freshness, compaction, and retirement.
- [`general_foundation/PLAN_EXECUTION.md`](general_foundation/PLAN_EXECUTION.md) — readiness proof, coherent operations, expected-versus-actual inspection, deviation handling, recovery, and acceptance.
- [`general_foundation/TESTING.md`](general_foundation/TESTING.md) — accurate and complete test design, test-intent banking, consolidated capsules, no-repeat evidence, failure clustering, and efficient repair loops.
- [`general_foundation/DEBUGGING.md`](general_foundation/DEBUGGING.md) — first-divergence diagnosis and root-cause repair using the testing discipline.
- [`general_foundation/CLEANUP_AND_DISPOSITION.md`](general_foundation/CLEANUP_AND_DISPOSITION.md) — local/remote cleanup, protected state, artifact disposition, GitHub lifecycle, destructive safeguards, verification, and cleanup debt.
- [`general_foundation/SANITY_CHECKING.md`](general_foundation/SANITY_CHECKING.md) — proportional coverage-accounted sanity checks and audit claims.
- [`general_foundation/SEMANTIC_INTERROGATION.md`](general_foundation/SEMANTIC_INTERROGATION.md) — semantic-leaf review core and triggered risk modules.
- [`general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md) — exact-head PR review, guarded merge, post-merge verification, and branch/coordination disposition.
- [`general_foundation/LEGO_ARCHITECTURE.md`](general_foundation/LEGO_ARCHITECTURE.md)
- [`general_foundation/COMPONENT_STANDARD.md`](general_foundation/COMPONENT_STANDARD.md)
- [`general_foundation/CONTRACT_STANDARD.md`](general_foundation/CONTRACT_STANDARD.md)
- [`general_foundation/COMPOSITION_AND_DEPENDENCIES.md`](general_foundation/COMPOSITION_AND_DEPENDENCIES.md)
- [`general_foundation/DOMAIN_APPROPRIATE_FOUNDATIONS.md`](general_foundation/DOMAIN_APPROPRIATE_FOUNDATIONS.md)
- [`general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md`](general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md)
- [`general_foundation/MAXIMUM_ACCURATE_GENERALITY.md`](general_foundation/MAXIMUM_ACCURATE_GENERALITY.md)
- [`general_foundation/COMPATIBILITY_AND_EVOLUTION.md`](general_foundation/COMPATIBILITY_AND_EVOLUTION.md)
- [`general_foundation/FORBIDDEN_DESIGN_PATTERNS.md`](general_foundation/FORBIDDEN_DESIGN_PATTERNS.md)
- [`general_foundation/PROJECT_ORGANIZATION.md`](general_foundation/PROJECT_ORGANIZATION.md)
- [`general_foundation/WORKFLOW.md`](general_foundation/WORKFLOW.md)
- [`general_foundation/DEVELOPMENT.md`](general_foundation/DEVELOPMENT.md)
- [`general_foundation/PLANS_AND_HANDOFFS.md`](general_foundation/PLANS_AND_HANDOFFS.md)
- [`general_foundation/ACCOUNTABILITY.md`](general_foundation/ACCOUNTABILITY.md)
- [`general_foundation/SECURITY.md`](general_foundation/SECURITY.md)
- [`general_foundation/CHANGE_MANAGEMENT.md`](general_foundation/CHANGE_MANAGEMENT.md)
- [`general_foundation/REVIEW.md`](general_foundation/REVIEW.md)
- [`general_foundation/DOCUMENTATION_GOVERNANCE.md`](general_foundation/DOCUMENTATION_GOVERNANCE.md)

## CUDA-MCGS application profile

- [`application_specific/CUDA_MCGS_PROFILE.md`](application_specific/CUDA_MCGS_PROFILE.md) — canonical current project profile.
- [`application_specific/CUDA_MCGS_PROFILE.md`](application_specific/CUDA_MCGS_PROFILE.md) — compatibility-only pointer for the former project name; do not use for new references.
- [`application_specific/REPOSITORY_ORGANIZATION.md`](application_specific/REPOSITORY_ORGANIZATION.md)
- [`application_specific/ARCHITECTURE_GUARDRAILS.md`](application_specific/ARCHITECTURE_GUARDRAILS.md)
- [`application_specific/MEMORY_AND_PERFORMANCE.md`](application_specific/MEMORY_AND_PERFORMANCE.md)
- [`application_specific/RESEARCH_POLICY.md`](application_specific/RESEARCH_POLICY.md)

## Templates

Use [`templates/`](templates/) for engineering decisions, ADRs, specifications, component manifests, combined assessment/plans, durable focus-branch packets, token/context budgets, document-reading/applicability maps, consolidated test batches, governed plan execution, cleanup/disposition, sanity checks, critical semantic reviews, durable PR reviews, design reviews, naming analysis, research, handoffs, debugging, subsystem documentation, and benchmarks. Templates are starting structures, not substitutes for reasoning.

Universal token backpressure applies to every task, but routine work uses an implicit micro-budget and no token ledger. Use [`templates/token-budget.template.yaml`](templates/token-budget.template.yaml) only when cross-session/agent continuation, telemetry, high consequence, parallelism, repeated pressure, or audit/review gives the record a real consumer.

Selective document reading also applies to every task, but routine work needs no standalone applicability ledger when the instruction chain and governing authority are obvious. Use [`templates/document-reading.template.yaml`](templates/document-reading.template.yaml) only for substantial, critical, cross-session, cross-agent, cross-repository, disputed, or review-sensitive work whose exact authority coverage and invalidation state must survive.

Routine work needs no engineering-decision or test ledger. Use [`templates/engineering-decision.template.yaml`](templates/engineering-decision.template.yaml) for foundational, contested, cross-component, high-consequence, empirically uncertain, difficult-to-reverse, or cross-session choices. Use [`templates/test-batch.template.yaml`](templates/test-batch.template.yaml) when several test intents must be accumulated/consolidated, expensive setup must be shared, a failure cluster crosses sessions/agents, or completeness/skip/invalidation evidence has a real consumer. Routine task-owned scratch cleanup, single-session execution, simple focus branches, self-sanity, and ordinary PR review should remain in the canonical issue/plan/PR rather than forcing standalone artifacts.

Token backpressure and selective reading should reduce duplicate context and records. They must not add a mandatory form to every task, weaken the practice floor, or permit shallow interpretation of governing authority.

Tool adapters such as `CLAUDE.md`, `GEMINI.md`, and `.github/copilot-instructions.md` must point here and remain thin.
