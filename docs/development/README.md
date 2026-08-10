# Development Method

**Status:** Accepted

The canonical development system is [`../../agent_files/README.md`](../../agent_files/README.md). It applies to humans and automated agents.

The project method is:

- proportional adversarial assessment before planning substantial or critical work;
- proportional sanity checking with exact claims, semantic interrogation, boundary/path reconciliation, and durable findings;
- exact-head author-side PR review, independent review when triggered, a separate guarded merge transaction, and verified target integration;
- purpose, bounds, and contextual design weighting before architecture;
- LEGO component ownership, SOLID internal responsibilities, CUPID implementation quality, and simplest sufficient total-system design;
- mature-scale organization from the first implementation;
- reusable contracts with specialized internals;
- coherent work by ownership boundary;
- specification-first foundational changes;
- evidence-first debugging and performance work;
- validation gates that are never weakened for convenience;
- explicit memory, lifecycle, failure, and recovery behavior;
- provenance-preserving documentation and handoffs.

Assessment and planning are governed by [`../decisions/ADR-0006-adversarial-assessment-and-planning.md`](../decisions/ADR-0006-adversarial-assessment-and-planning.md) and [`../../agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](../../agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md).

Sanity checking is governed by [`../decisions/ADR-0007-proportional-sanity-checking.md`](../decisions/ADR-0007-proportional-sanity-checking.md), [`../../agent_files/general_foundation/SANITY_CHECKING.md`](../../agent_files/general_foundation/SANITY_CHECKING.md), and [`../../agent_files/general_foundation/SEMANTIC_INTERROGATION.md`](../../agent_files/general_foundation/SEMANTIC_INTERROGATION.md).

PR review and merge are governed by [`../decisions/ADR-0008-exact-head-pr-review-and-guarded-merge.md`](../decisions/ADR-0008-exact-head-pr-review-and-guarded-merge.md) and [`../../agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](../../agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md).

Design is governed by [`../decisions/ADR-0005-lego-design-hierarchy.md`](../decisions/ADR-0005-lego-design-hierarchy.md) and [`../../agent_files/general_foundation/PRINCIPLES.md`](../../agent_files/general_foundation/PRINCIPLES.md).

Organization is governed by [`../decisions/ADR-0004-large-project-organization.md`](../decisions/ADR-0004-large-project-organization.md), [`../../agent_files/general_foundation/PROJECT_ORGANIZATION.md`](../../agent_files/general_foundation/PROJECT_ORGANIZATION.md), and [`../../agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](../../agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

Project-specific guardrails are in [`../../agent_files/application_specific/UMCGS_PROFILE.md`](../../agent_files/application_specific/UMCGS_PROFILE.md).

Use the combined assessment template only when durable planning is needed. Use sanity and PR-review templates only when the claim, independence, consequence, dispute, or cross-session continuation requires persistent evidence. Routine self-sanity and author-side PR review belong in the PR/task result.
