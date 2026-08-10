# Development Method

**Status:** Accepted

The canonical development system is [`../../agent_files/README.md`](../../agent_files/README.md). It applies to humans and automated agents.

The project method is:

- proportional adversarial assessment before planning substantial or critical work;
- semantic focus-branch decomposition for large/complex tasks, with one parent integration spine, full-attention leaves, exact branch contracts, explicit invalidation, constrained parallelism, and central reconciliation;
- token-use discipline that optimizes verified lifecycle progress, reserves capacity for evidence/integration/cleanup/handoff, loads context in layers, checkpoints losslessly, and blocks token debt;
- governed plan execution through ready nodes, coherent operations, expected-versus-actual inspection, evidence-driven deviations, and no invalid partial state;
- explicit cleanup and artifact disposition across local, Git, GitHub, device, credential, generated, retained, remote, and external state;
- proportional sanity checking with exact claims, semantic interrogation, boundary/path/lifecycle/cleanup reconciliation, and durable findings;
- exact-head author-side PR review, independent review when triggered, a separate guarded merge transaction, verified target integration, and post-merge cleanup;
- purpose, bounds, contextual design weighting, lifecycle, and disposition before architecture;
- LEGO component ownership, SOLID internal responsibilities, CUPID implementation quality, and simplest sufficient total-system design;
- mature-scale organization from the first implementation;
- reusable contracts with specialized internals;
- coherent work by semantic ownership boundary rather than physical file count;
- specification-first foundational changes;
- evidence-first debugging and performance work;
- validation, protection, token-reserve, and cleanup gates that are never weakened for convenience;
- explicit memory, lifecycle, failure, recovery, teardown, and cleanup behavior;
- provenance-preserving documentation, archive, checkpoints, and handoffs.

Assessment and planning are governed by [`../decisions/ADR-0006-adversarial-assessment-and-planning.md`](../decisions/ADR-0006-adversarial-assessment-and-planning.md) and [`../../agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](../../agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md).

Focus-branch decomposition and integration are governed by [`../decisions/ADR-0011-focus-branch-decomposition-and-integration.md`](../decisions/ADR-0011-focus-branch-decomposition-and-integration.md) and [`../../agent_files/general_foundation/FOCUS_BRANCHES.md`](../../agent_files/general_foundation/FOCUS_BRANCHES.md).

Token-use and context discipline are governed by [`../decisions/ADR-0012-token-use-and-context-discipline.md`](../decisions/ADR-0012-token-use-and-context-discipline.md), [`../../agent_files/general_foundation/TOKEN_DISCIPLINE.md`](../../agent_files/general_foundation/TOKEN_DISCIPLINE.md), and [`../../agent_files/general_foundation/CONTEXT_ROUTING.md`](../../agent_files/general_foundation/CONTEXT_ROUTING.md).

Plan execution is governed by [`../decisions/ADR-0009-governed-plan-execution.md`](../decisions/ADR-0009-governed-plan-execution.md) and [`../../agent_files/general_foundation/PLAN_EXECUTION.md`](../../agent_files/general_foundation/PLAN_EXECUTION.md).

Cleanup and disposition are governed by [`../decisions/ADR-0010-cleanup-reconciliation-and-artifact-disposition.md`](../decisions/ADR-0010-cleanup-reconciliation-and-artifact-disposition.md) and [`../../agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md`](../../agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md).

Sanity checking is governed by [`../decisions/ADR-0007-proportional-sanity-checking.md`](../decisions/ADR-0007-proportional-sanity-checking.md), [`../../agent_files/general_foundation/SANITY_CHECKING.md`](../../agent_files/general_foundation/SANITY_CHECKING.md), and [`../../agent_files/general_foundation/SEMANTIC_INTERROGATION.md`](../../agent_files/general_foundation/SEMANTIC_INTERROGATION.md).

PR review and merge are governed by [`../decisions/ADR-0008-exact-head-pr-review-and-guarded-merge.md`](../decisions/ADR-0008-exact-head-pr-review-and-guarded-merge.md) and [`../../agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](../../agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md).

Design is governed by [`../decisions/ADR-0005-lego-design-hierarchy.md`](../decisions/ADR-0005-lego-design-hierarchy.md) and [`../../agent_files/general_foundation/PRINCIPLES.md`](../../agent_files/general_foundation/PRINCIPLES.md).

Organization is governed by [`../decisions/ADR-0004-large-project-organization.md`](../decisions/ADR-0004-large-project-organization.md), [`../../agent_files/general_foundation/PROJECT_ORGANIZATION.md`](../../agent_files/general_foundation/PROJECT_ORGANIZATION.md), and [`../../agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](../../agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

Project-specific guardrails are in [`../../agent_files/application_specific/UMCGS_PROFILE.md`](../../agent_files/application_specific/UMCGS_PROFILE.md).

Use the combined assessment template only when durable planning is needed. Use the focus-branch template only when a branch crosses sessions/agents, runs in parallel, carries high consequence, or needs independent continuation/review. Use the token-budget template only when cross-session/agent work, exact telemetry, high consequence, parallelism, or repeated context pressure makes reserve/compaction state decision-relevant. Use the plan-execution template only when coordinated, cross-session, high-consequence, or invalid-intermediate-state execution needs unique operation evidence. Use the cleanup template only when material lifecycle evidence is required. Routine focus branches, token budgeting, execution, scratch cleanup, self-sanity, and author-side PR review belong in the parent issue, plan, PR, or task result.
