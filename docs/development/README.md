# Development Method

**Status:** Accepted

The canonical development system is [`../../agent_files/README.md`](../../agent_files/README.md). It applies to humans and automated agents.

The project method is:

- engineering contracts and specification-obligation mapping before implementation selection;
- contextual value ordering that distinguishes hard gates, mission objectives, supporting qualities, and process costs;
- credible candidate-path comparison, decisive evidence, reversibility, explicit tradeoffs, and P0–P4 priority;
- proportional adversarial assessment before planning substantial or critical work;
- semantic focus-branch decomposition for large/complex tasks, with one parent integration spine, exact branch contracts, invalidation, constrained parallelism, and central reconciliation;
- token-use discipline that reserves capacity for evidence/integration/cleanup/handoff and blocks token debt;
- testing discipline that captures intents, consolidates owning capsules, shares setup, preserves case identity, reuses exact evidence, and clusters failures by root cause;
- governed plan execution through ready nodes, expected-versus-actual inspection, evidence-driven deviations, and no invalid partial state;
- explicit cleanup and artifact disposition across local, Git, GitHub, device, credential, generated, retained, remote, and external state;
- proportional sanity checking with exact claims, semantic interrogation, boundary/path/lifecycle/cleanup reconciliation, and durable findings;
- exact-head author-side PR review, independent review when triggered, guarded merge, verified target integration, and post-merge cleanup;
- LEGO component ownership, SOLID internal responsibilities, CUPID implementation quality, and simplest sufficient total-system design;
- mature-scale organization, specification-first foundations, test architecture defined with contracts, evidence-first debugging/performance, and provenance-preserving documentation/handoffs.

Engineering judgment and value ordering are governed by [`../decisions/ADR-0015-engineering-judgment-and-value-ordering.md`](../decisions/ADR-0015-engineering-judgment-and-value-ordering.md), [`../../agent_files/general_foundation/ENGINEERING_JUDGMENT.md`](../../agent_files/general_foundation/ENGINEERING_JUDGMENT.md), and [`../../agent_files/general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md`](../../agent_files/general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md).

Assessment and planning are governed by [`../decisions/ADR-0006-adversarial-assessment-and-planning.md`](../decisions/ADR-0006-adversarial-assessment-and-planning.md) and [`../../agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](../../agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md).

Focus-branch decomposition and integration are governed by [`../decisions/ADR-0011-focus-branch-decomposition-and-integration.md`](../decisions/ADR-0011-focus-branch-decomposition-and-integration.md) and [`../../agent_files/general_foundation/FOCUS_BRANCHES.md`](../../agent_files/general_foundation/FOCUS_BRANCHES.md).

Token-use/context discipline and testing/repair-loop discipline are governed by ADR-0012/0013 and their linked foundation files. Plan execution, cleanup, sanity, PR integration, design, and organization remain governed by ADR-0009/0010/0007/0008/0005/0004 and the canonical agent foundation.

Use the combined assessment template only when durable planning is needed. Use `engineering-decision.template.yaml` only for foundational, contested, cross-component, high-consequence, empirically uncertain, difficult-to-reverse, or cross-session decisions. Use focus-branch, token-budget, test-batch, execution, cleanup, sanity, and PR-review records only when their unique evidence has a real consumer. Routine judgment, focus branches, tests, token budgeting, execution, scratch cleanup, self-sanity, and author-side PR review belong in the parent issue, plan, PR, or task result.
