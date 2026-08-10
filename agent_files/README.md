# Agent Documentation

**Scope:** Canonical developer and agent guidance for UMCGS.

The root [`AGENTS.md`](../AGENTS.md) is the mandatory entry point.

## Canonical files

- [`AGENTS.md`](AGENTS.md) — operating manual and task routing.
- [`AI_RULES.md`](AI_RULES.md) — hard behavioral rules.
- [`SYSTEM_REGISTRY.md`](SYSTEM_REGISTRY.md) — ownership/source-of-truth registry.
- [`VALIDATION_POLICY.md`](VALIDATION_POLICY.md) — evidence and completion requirements.
- [`DESIGN_ALIGNMENT_CARD.md`](DESIGN_ALIGNMENT_CARD.md) — compact design and integration alignment.

## Reusable foundation

- [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md)
- [`general_foundation/ENGINEERING_JUDGMENT.md`](general_foundation/ENGINEERING_JUDGMENT.md)
- [`general_foundation/ASSESSMENT_AND_PLANNING.md`](general_foundation/ASSESSMENT_AND_PLANNING.md)
- [`general_foundation/FOCUS_BRANCHES.md`](general_foundation/FOCUS_BRANCHES.md)
- [`general_foundation/TOKEN_DISCIPLINE.md`](general_foundation/TOKEN_DISCIPLINE.md) — universal token backpressure, minimum practice floor, reduction ladder, reserves, context bands, checkpoints, and token debt.
- [`general_foundation/CONTEXT_ROUTING.md`](general_foundation/CONTEXT_ROUTING.md)
- [`general_foundation/PLAN_EXECUTION.md`](general_foundation/PLAN_EXECUTION.md)
- [`general_foundation/TESTING.md`](general_foundation/TESTING.md)
- [`general_foundation/DEBUGGING.md`](general_foundation/DEBUGGING.md)
- [`general_foundation/CLEANUP_AND_DISPOSITION.md`](general_foundation/CLEANUP_AND_DISPOSITION.md)
- [`general_foundation/SANITY_CHECKING.md`](general_foundation/SANITY_CHECKING.md)
- [`general_foundation/SEMANTIC_INTERROGATION.md`](general_foundation/SEMANTIC_INTERROGATION.md)
- [`general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md)
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
- [`general_foundation/PLANS_AND_HANDOFFS.md`](general_foundation/PLANS_AND_HANDOFFS.md)
- [`general_foundation/ACCOUNTABILITY.md`](general_foundation/ACCOUNTABILITY.md)
- [`general_foundation/SECURITY.md`](general_foundation/SECURITY.md)
- [`general_foundation/CHANGE_MANAGEMENT.md`](general_foundation/CHANGE_MANAGEMENT.md)
- [`general_foundation/REVIEW.md`](general_foundation/REVIEW.md)
- [`general_foundation/DOCUMENTATION_GOVERNANCE.md`](general_foundation/DOCUMENTATION_GOVERNANCE.md)

## Application profile

See [`application_specific/`](application_specific/) for UMCGS-specific repository, architecture, memory/performance, and research constraints.

## Templates and proportionality

Use [`templates/`](templates/) only when another agent, session, tool, reviewer, or consequence gate needs exact durable state.

Routine work uses an implicit micro-budget and no token ledger. Use [`templates/token-budget.template.yaml`](templates/token-budget.template.yaml) only for cross-session/agent work, meaningful telemetry, high consequence, parallelism, repeated pressure, or audit/review.

Token backpressure should remove duplicate records and optional ceremony. It must not create one form per task, test case, or file.

Tool adapters such as `CLAUDE.md`, `GEMINI.md`, and `.github/copilot-instructions.md` must remain thin pointers to the canonical system.
