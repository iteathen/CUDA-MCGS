# ADR-0006: Assessment Before Planning with Adversarial Synthesis

**Status:** Accepted

**Date:** 2026-08-10

## Context

A plan can be detailed and executable while still solving the wrong problem, assigning ownership incorrectly, hiding essential complexity, or embedding accidental limits. The full shape of foundational work often emerges only when a credible critic attacks the premise, boundaries, resource model, failure behavior, and alleged simplicity.

At the same time, forcing every task through a large administrative process creates its own complexity and encourages agents to optimize for completed forms rather than sound engineering.

## Decision

UMCGS will separate assessment from planning.

For substantial and critical work, agents will answer the core questions in [`../../agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](../../agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md), perform an explicit steelmanned adversarial pass, synthesize the result, and only then produce the executable plan.

Simplicity is applied only after sound fundamentals—authority, ownership, contracts, ranges, resources, lifecycle, failure, compatibility, and evidence—are established.

Administrative depth is proportional to risk, irreversibility, blast radius, and handoff need:

- routine reversible work requires no durable assessment artifact;
- substantial work records a compact assessment in one canonical place;
- critical/foundational work preserves the full decision-relevant adversarial analysis and evidence.

Each material question must be resolved, assigned a bounded experiment, accepted as an owned risk, declared blocked, or marked not applicable with a reason. Plans may not hide material unknowns behind “TBD.”

## Rationale

The method protects against both common failure directions:

- **simplistic underdesign** — omitting fundamentals because the smaller local design looks easier;
- **administrative or architectural overdesign** — introducing components, abstractions, records, reviews, or process that protect no invariant or decision.

Adversarial reasoning is required to steelman concrete counterexamples and alternatives, not to stage endless debate. A stop rule ends the process when all material questions have dispositions and another pass reveals no new decision-relevant issue.

## Consequences

- Assessment becomes an explicit phase before design commitment and implementation planning.
- Foundational plans contain falsifiers, alternatives, pressure/failure behavior, and revisit triggers.
- One canonical plan/assessment is linked rather than duplicated across issue, PR, handoff, and documentation.
- Routine work remains lightweight.
- Empirical unknowns become bounded experiments rather than speculative architecture.
- Review can reject a plan that is administratively complete but substantively one-sided.

## Alternatives considered

### Planning checklist without adversarial challenge

Rejected because agents can answer a checklist from the assumptions of their first design and never expose a wrong premise or boundary.

### Mandatory independent reviewer for every plan

Rejected as excessive administrative overhead. One agent may perform a credible adversarial pass unless risk or explicit policy requires independent review.

### Simplicity-first planning

Rejected because “simple” often means required lifecycle, resource, compatibility, or failure behavior was omitted or moved elsewhere.

### Full durable assessment for every task

Rejected because the process cost would exceed the decisions protected for routine reversible work.

## Validation

A conforming substantial or critical plan must show:

- the assessed problem and governing evidence;
- ownership and design-principle alignment;
- dispositions for the core questions;
- a credible strongest counterargument and resulting synthesis;
- executable coherent steps with validation and rollback;
- a proportional record rather than duplicated administrative artifacts.

## Revisit triggers

Revisit if the method creates repeated low-value paperwork, fails to expose consequential design mistakes, or does not scale to multi-agent implementation. Changes must preserve the soundness-before-simplicity rule and explicit treatment of material unknowns.
