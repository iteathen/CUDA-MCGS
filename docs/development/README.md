# Development Method

**Status:** Accepted

The canonical development system is [`../../agent_files/README.md`](../../agent_files/README.md). It applies to humans and automated agents.

The project method is:

- purpose and bounds before architecture;
- mature-scale organization from the first implementation;
- reusable contracts with specialized internals;
- coherent work by ownership boundary;
- specification-first foundational changes;
- evidence-first debugging and performance work;
- validation gates that are never weakened for convenience;
- explicit memory, lifecycle, failure, and recovery behavior;
- provenance-preserving documentation and handoffs.

Organization is governed by [`../decisions/ADR-0004-large-project-organization.md`](../decisions/ADR-0004-large-project-organization.md), [`../../agent_files/general_foundation/PROJECT_ORGANIZATION.md`](../../agent_files/general_foundation/PROJECT_ORGANIZATION.md), and [`../../agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](../../agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

Project-specific guardrails are in [`../../agent_files/application_specific/UMCGS_PROFILE.md`](../../agent_files/application_specific/UMCGS_PROFILE.md).
