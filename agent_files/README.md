# Agent Documentation

**Scope:** CUDA-MCGS-specific support material plus retained historical agent guidance.

Universal reusable engineering and agent doctrine lives in [`iteathen/.github/AGENTS.md`](https://github.com/iteathen/.github/blob/main/AGENTS.md). The repository entry point is [`AGENT_LOCAL.md`](../AGENT_LOCAL.md), which routes agents to CUDA-MCGS-specific authority. This directory must not act as a competing universal agent manual.

The project-specific registry, validation policy, application profiles, and templates remain local because they describe CUDA-MCGS facts or repository workflows. Older general design/process cards are retained for historical rationale and migration reference; where they overlap reusable doctrine, the account-global authority governs.

## Current local routing

- [`SYSTEM_REGISTRY.md`](SYSTEM_REGISTRY.md) — repository ownership and source-of-truth registry.
- [`VALIDATION_POLICY.md`](VALIDATION_POLICY.md) — repository-specific evidence and completion requirements.
- [`application_specific/CUDA_MCGS_PROFILE.md`](application_specific/CUDA_MCGS_PROFILE.md) — current CUDA-MCGS project profile.
- [`application_specific/REPOSITORY_ORGANIZATION.md`](application_specific/REPOSITORY_ORGANIZATION.md) — repository-specific organization facts.
- [`application_specific/ARCHITECTURE_GUARDRAILS.md`](application_specific/ARCHITECTURE_GUARDRAILS.md) — CUDA-MCGS-specific architecture constraints.
- [`application_specific/MEMORY_AND_PERFORMANCE.md`](application_specific/MEMORY_AND_PERFORMANCE.md) — CUDA-MCGS-specific memory/performance context.
- [`application_specific/RESEARCH_POLICY.md`](application_specific/RESEARCH_POLICY.md) — repository-specific research routing.

## Retained legacy guidance

The following files predate the account-global authority. They remain available for historical rationale or migration comparison, but they are not a second universal instruction chain:

- [`AI_RULES.md`](AI_RULES.md)
- [`DESIGN_ALIGNMENT_CARD.md`](DESIGN_ALIGNMENT_CARD.md)
- [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md)
- [`general_foundation/NO_PYTHON_POLICY.md`](general_foundation/NO_PYTHON_POLICY.md)
- [`general_foundation/ENGINEERING_JUDGMENT.md`](general_foundation/ENGINEERING_JUDGMENT.md)
- [`general_foundation/ASSESSMENT_AND_PLANNING.md`](general_foundation/ASSESSMENT_AND_PLANNING.md)
- [`general_foundation/FOCUS_BRANCHES.md`](general_foundation/FOCUS_BRANCHES.md)
- [`general_foundation/TOKEN_DISCIPLINE.md`](general_foundation/TOKEN_DISCIPLINE.md)
- [`general_foundation/SPEC_AND_AGENT_FILE_READING.md`](general_foundation/SPEC_AND_AGENT_FILE_READING.md)
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
- [`general_foundation/DEVELOPMENT.md`](general_foundation/DEVELOPMENT.md)
- [`general_foundation/PLANS_AND_HANDOFFS.md`](general_foundation/PLANS_AND_HANDOFFS.md)
- [`general_foundation/ACCOUNTABILITY.md`](general_foundation/ACCOUNTABILITY.md)
- [`general_foundation/SECURITY.md`](general_foundation/SECURITY.md)
- [`general_foundation/CHANGE_MANAGEMENT.md`](general_foundation/CHANGE_MANAGEMENT.md)
- [`general_foundation/REVIEW.md`](general_foundation/REVIEW.md)
- [`general_foundation/DOCUMENTATION_GOVERNANCE.md`](general_foundation/DOCUMENTATION_GOVERNANCE.md)

## Other application profiles

- [`application_specific/UMCGS_PROFILE.md`](application_specific/UMCGS_PROFILE.md) — retained historical/adjacent profile; it does not supersede CUDA-MCGS current authority.

## Templates

Use [`templates/`](templates/) when a repository-specific task benefits from a durable structured artifact. Templates are starting structures, not independent authority and not substitutes for the account-global process guidance.

Tool adapters such as `CLAUDE.md`, `GEMINI.md`, and `.github/copilot-instructions.md` must point to the account-global authority and `AGENT_LOCAL.md`; they must remain thin.