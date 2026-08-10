# Agent Documentation

**Scope:** Canonical developer and agent guidance for UMCGS.

This directory is the durable operating system for development. The root [`AGENTS.md`](../AGENTS.md) is the mandatory entry point; this directory provides the reusable foundation, UMCGS-specific constraints, and task templates.

## Canonical files

- [`AGENTS.md`](AGENTS.md) — operating manual and task routing.
- [`AI_RULES.md`](AI_RULES.md) — hard behavioral rules.
- [`SYSTEM_REGISTRY.md`](SYSTEM_REGISTRY.md) — ownership and source-of-truth registry.
- [`VALIDATION_POLICY.md`](VALIDATION_POLICY.md) — evidence and completion requirements.

## Reusable foundation

- [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md)
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

Use [`templates/`](templates/) for ADRs, specifications, component manifests, research, plans, handoffs, debugging, subsystem documentation, and benchmarks. Templates are starting structures, not substitutes for reasoning.

Tool adapters such as `CLAUDE.md`, `GEMINI.md`, and `.github/copilot-instructions.md` must point here and remain thin.
