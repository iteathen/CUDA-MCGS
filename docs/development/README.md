# Development Method

**Status:** Accepted

The canonical development system is [`../../agent_files/README.md`](../../agent_files/README.md). It applies to humans and automated agents.

The project method is:

- selective authority reading: mandatory kernel, target-path instruction chains, direct governing authority, required normative references, triggered specialist doctrine, material adjacency, and final refresh;
- engineering contracts and specification-obligation mapping before implementation selection;
- contextual value ordering that distinguishes hard gates, mission objectives, supporting qualities, and process costs;
- credible candidate-path comparison, decisive evidence, reversibility, explicit tradeoffs, and P0–P4 priority;
- proportional adversarial assessment before planning substantial or critical work;
- semantic focus-branch decomposition for large/complex tasks, with one parent integration spine, exact branch contracts, invalidation, constrained parallelism, and central reconciliation;
- universal token backpressure from the first retrieval or mutation of every task, including routine work;
- a risk-appropriate minimum practice floor that token pressure cannot waive;
- a reduction ladder that removes duplication, reuses evidence, batches work, narrows context/output, defers optional breadth/polish, reduces scope/claim, and splits/hands off before rigor is cut;
- explicit reserves and green/yellow/red/emergency behavior for substantial/critical work, with budget elasticity for essential evidence and cleanup;
- testing discipline that captures intents, consolidates owning capsules, shares setup, preserves case identity, reuses exact evidence, and clusters failures by root cause;
- governed plan execution through ready nodes, expected-versus-actual inspection, evidence-driven deviations, and no invalid partial state;
- explicit cleanup and artifact disposition across local, Git, GitHub, device, credential, generated, retained, remote, and external state;
- proportional sanity checking with exact claims, semantic interrogation, boundary/path/lifecycle/cleanup reconciliation, and durable findings;
- exact-head author-side PR review, independent review when triggered, guarded merge, verified target integration, and post-merge cleanup;
- LEGO component ownership, SOLID internal responsibilities, CUPID implementation quality, and simplest sufficient total-system design;
- mature-scale organization, specification-first foundations, test architecture defined with contracts, evidence-first debugging/performance, and provenance-preserving documentation/handoffs.

Public repository collaboration, security, CI/protection expectations, and the visibility-transition checklist are documented in [`PUBLIC_REPOSITORY.md`](PUBLIC_REPOSITORY.md), [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md), and [`../../SECURITY.md`](../../SECURITY.md). Public visibility is independent from a CUDA-MCGS product release.

Selective specification and agent-file reading are governed by [`../decisions/ADR-0017-selective-spec-and-agent-file-reading.md`](../decisions/ADR-0017-selective-spec-and-agent-file-reading.md), [`../../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md`](../../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md), [`../../agent_files/general_foundation/CONTEXT_ROUTING.md`](../../agent_files/general_foundation/CONTEXT_ROUTING.md), and [`../../agent_files/general_foundation/DOCUMENTATION_GOVERNANCE.md`](../../agent_files/general_foundation/DOCUMENTATION_GOVERNANCE.md).

Engineering judgment and value ordering are governed by [`../decisions/ADR-0015-engineering-judgment-and-value-ordering.md`](../decisions/ADR-0015-engineering-judgment-and-value-ordering.md), [`../../agent_files/general_foundation/ENGINEERING_JUDGMENT.md`](../../agent_files/general_foundation/ENGINEERING_JUDGMENT.md), and [`../../agent_files/general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md`](../../agent_files/general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md).

Assessment and planning are governed by [`../decisions/ADR-0006-adversarial-assessment-and-planning.md`](../decisions/ADR-0006-adversarial-assessment-and-planning.md) and [`../../agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](../../agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md).

Focus-branch decomposition and integration are governed by [`../decisions/ADR-0011-focus-branch-decomposition-and-integration.md`](../decisions/ADR-0011-focus-branch-decomposition-and-integration.md) and [`../../agent_files/general_foundation/FOCUS_BRANCHES.md`](../../agent_files/general_foundation/FOCUS_BRANCHES.md).

Token discipline is governed by [`../decisions/ADR-0012-token-use-and-context-discipline.md`](../decisions/ADR-0012-token-use-and-context-discipline.md), [`../decisions/ADR-0016-token-backpressure-and-practice-floor.md`](../decisions/ADR-0016-token-backpressure-and-practice-floor.md), and [`../../agent_files/general_foundation/TOKEN_DISCIPLINE.md`](../../agent_files/general_foundation/TOKEN_DISCIPLINE.md).

Routine tasks use an implicit reading route and micro-budget without separate ledgers. They still read the mandatory kernel, target-path instructions, current owner authority, and any objectively triggered doctrine. Substantial/critical/cross-repository work preserves exact applicability, reading depth, revisions, invalidation, and final refresh when another consumer needs it.

Testing/repair-loop discipline remains governed by ADR-0013 and its foundation files. Plan execution, cleanup, sanity, PR integration, design, and organization remain governed by ADR-0009/0010/0007/0008/0005/0004 and the canonical agent foundation.

Use the combined assessment template only when durable planning is needed. Use `document-reading.template.yaml` only for cross-session, cross-agent, cross-repository, critical, disputed, or review-sensitive authority coverage. Use `engineering-decision.template.yaml` only for foundational, contested, cross-component, high-consequence, empirically uncertain, difficult-to-reverse, or cross-session decisions. Use focus-branch, token-budget, test-batch, execution, cleanup, sanity, and PR-review records only when their unique evidence has a real consumer. Routine reading, judgment, token posture, focus branches, tests, execution, scratch cleanup, self-sanity, and author-side PR review belong in the parent issue, plan, PR, or task result.

## Current cross-repository plan amendment

[`2026-08-12-cuda-isolation-plan-amendment.md`](2026-08-12-cuda-isolation-plan-amendment.md) records the owner-directed production boundary that CUDA-specific implementation knowledge belongs exclusively to CUDA-JS. CUDA-MCGS owns GPU search semantics and restricted Device-JS search programs; CUDA-JS owns CUDA lowering, generated CUDA/PTX/cubin artifacts, compiler/runtime mechanics, and generic GPU helpers. Where older planning assigns CUDA/PTX authoring directly to CUDA-MCGS, the amendment supersedes that planning assumption without silently changing accepted semantic specifications.
