# Agent Documentation

**Scope:** Canonical developer and agent guidance for UMCGS.

This directory is the durable operating system for development. The root [`AGENTS.md`](../AGENTS.md) is the mandatory entry point; this directory provides the reusable foundation, UMCGS-specific constraints, and task templates.

## Canonical files

- [`AGENTS.md`](AGENTS.md) — operating manual and task routing.
- [`AI_RULES.md`](AI_RULES.md) — hard behavioral rules.
- [`SYSTEM_REGISTRY.md`](SYSTEM_REGISTRY.md) — ownership and source-of-truth registry.
- [`VALIDATION_POLICY.md`](VALIDATION_POLICY.md) — evidence and completion requirements.
- [`DESIGN_ALIGNMENT_CARD.md`](DESIGN_ALIGNMENT_CARD.md) — compact mandatory design and integration alignment.

## Reusable foundation

- [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md) — compact mandatory design hierarchy.
- [`general_foundation/ASSESSMENT_AND_PLANNING.md`](general_foundation/ASSESSMENT_AND_PLANNING.md) — proportional adversarial assessment and executable planning.
- [`general_foundation/FOCUS_BRANCHES.md`](general_foundation/FOCUS_BRANCHES.md) — parent-task integration spines, full-attention branch sizing, context packets, parallelism, invalidation, and reconciliation for large or complex work.
- [`general_foundation/PLAN_EXECUTION.md`](general_foundation/PLAN_EXECUTION.md) — readiness proof, coherent operations, expected-versus-actual inspection, deviation handling, recovery, and acceptance.
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
- [`general_foundation/CONTEXT_ROUTING.md`](general_foundation/CONTEXT_ROUTING.md)
- [`general_foundation/DEVELOPMENT.md`](general_foundation/DEVELOPMENT.md)
- [`general_foundation/TESTING.md`](general_foundation/TESTING.md)
- [`general_foundation/DEBUGGING.md`](general_foundation/DEBUGGING.md)
- [`general_foundation/PLANS_AND_HANDOFFS.md`](general_foundation/PLANS_AND_HANDOFFS.md)
- [`general_foundation/ACCOUNTABILITY.md`](general_foundation/ACCOUNTABILITY.md)
- [`general_foundation/SECURITY.md`](general_foundation/SECURITY.md)
- [`general_foundation/CHANGE_MANAGEMENT.md`](general_foundation/CHANGE_MANAGEMENT.md)
- [`general_foundation/REVIEW.md`](general_foundation/REVIEW.md)
- [`general_foundation/DOCUMENTATION_GOVERNANCE.md`](general_foundation/DOCUMENTATION_GOVERNANCE.md)

## UMCGS application profile

- [`application_specific/UMCGS_PROFILE.md`](application_specific/UMCGS_PROFILE.md)
- [`application_specific/REPOSITORY_ORGANIZATION.md`](application_specific/REPOSITORY_ORGANIZATION.md)
- [`application_specific/ARCHITECTURE_GUARDRAILS.md`](application_specific/ARCHITECTURE_GUARDRAILS.md)
- [`application_specific/MEMORY_AND_PERFORMANCE.md`](application_specific/MEMORY_AND_PERFORMANCE.md)
- [`application_specific/RESEARCH_POLICY.md`](application_specific/RESEARCH_POLICY.md)

## Templates

Use [`templates/`](templates/) for ADRs, specifications, component manifests, combined assessment/plans, durable focus-branch packets, governed plan execution, cleanup/disposition, sanity checks, critical semantic reviews, durable PR reviews, design reviews, naming analysis, research, handoffs, debugging, subsystem documentation, and benchmarks. Templates are starting structures, not substitutes for reasoning.

Routine task-owned scratch cleanup, single-session execution, simple focus branches, self-sanity, and ordinary PR review should remain in the canonical issue/plan/PR rather than forcing standalone artifacts. Use the focus-branch template only for branches that cross sessions/agents, run in parallel, carry high consequence, or need independent continuation/review. Use the cleanup template only when shared, external, sensitive, retained, recovery-critical, long-lived, atomic, or independently blocked state requires durable lifecycle evidence.

Tool adapters such as `CLAUDE.md`, `GEMINI.md`, and `.github/copilot-instructions.md` must point here and remain thin.
