# Development Method

**Status:** Accepted

The canonical development system is [`../../agent_files/README.md`](../../agent_files/README.md). It applies to humans and automated agents.

The project method is:

- proportional adversarial assessment before planning substantial or critical work;
- governed plan execution through ready nodes, coherent operations, expected-versus-actual inspection, evidence-driven deviations, and no invalid partial state;
- explicit cleanup and artifact disposition across local, Git, GitHub, device, credential, generated, retained, remote, and external state;
- proportional sanity checking with exact claims, semantic interrogation, boundary/path/lifecycle/cleanup reconciliation, and durable findings;
- exact-head author-side PR review, independent review when triggered, a separate guarded merge transaction, verified target integration, and post-merge cleanup;
- purpose, bounds, contextual design weighting, lifecycle, and disposition before architecture;
- LEGO component ownership, SOLID internal responsibilities, CUPID implementation quality, and simplest sufficient total-system design;
- mature-scale organization from the first implementation;
- reusable contracts with specialized internals;
- coherent work by ownership boundary;
- specification-first foundational changes;
- evidence-first debugging and performance work;
- validation, protection, and cleanup gates that are never weakened for convenience;
- explicit memory, lifecycle, failure, recovery, teardown, and cleanup behavior;
- provenance-preserving documentation, archive, and handoffs.

Assessment and planning are governed by [`../decisions/ADR-0006-adversarial-assessment-and-planning.md`](../decisions/ADR-0006-adversarial-assessment-and-planning.md) and [`../../agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](../../agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md).

Plan execution is governed by [`../decisions/ADR-0009-governed-plan-execution.md`](../decisions/ADR-0009-governed-plan-execution.md) and [`../../agent_files/general_foundation/PLAN_EXECUTION.md`](../../agent_files/general_foundation/PLAN_EXECUTION.md).

Cleanup and disposition are governed by [`../decisions/ADR-0010-cleanup-reconciliation-and-artifact-disposition.md`](../decisions/ADR-0010-cleanup-reconciliation-and-artifact-disposition.md) and [`../../agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md`](../../agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md).

Sanity checking is governed by [`../decisions/ADR-0007-proportional-sanity-checking.md`](../decisions/ADR-0007-proportional-sanity-checking.md), [`../../agent_files/general_foundation/SANITY_CHECKING.md`](../../agent_files/general_foundation/SANITY_CHECKING.md), and [`../../agent_files/general_foundation/SEMANTIC_INTERROGATION.md`](../../agent_files/general_foundation/SEMANTIC_INTERROGATION.md).

PR review and merge are governed by [`../decisions/ADR-0008-exact-head-pr-review-and-guarded-merge.md`](../decisions/ADR-0008-exact-head-pr-review-and-guarded-merge.md) and [`../../agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](../../agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md).

Design is governed by [`../decisions/ADR-0005-lego-design-hierarchy.md`](../decisions/ADR-0005-lego-design-hierarchy.md) and [`../../agent_files/general_foundation/PRINCIPLES.md`](../../agent_files/general_foundation/PRINCIPLES.md).

Organization is governed by [`../decisions/ADR-0004-large-project-organization.md`](../decisions/ADR-0004-large-project-organization.md), [`../../agent_files/general_foundation/PROJECT_ORGANIZATION.md`](../../agent_files/general_foundation/PROJECT_ORGANIZATION.md), and [`../../agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](../../agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

Project-specific guardrails are in [`../../agent_files/application_specific/UMCGS_PROFILE.md`](../../agent_files/application_specific/UMCGS_PROFILE.md).

Use the combined assessment template only when durable planning is needed. Use the plan-execution template only when coordinated, cross-session, high-consequence, or invalid-intermediate-state execution needs unique operation evidence. Use the cleanup template only when shared, external, sensitive, retained, recovery-critical, long-lived, atomic, difficult-to-verify, or independently blocked state needs durable lifecycle evidence. Use sanity and PR-review templates only when the claim, independence, consequence, dispute, or cross-session continuation requires persistent evidence. Routine execution, task-owned scratch cleanup, self-sanity, and author-side PR review belong in the issue, PR, or task result.
