# ADR-0015: Engineering Judgment, Specification Alignment, and Value Ordering

**Status:** Accepted

**Date:** 2026-08-10

## Context

UMCGS has strong doctrine for LEGO/SOLID/CUPID design, adversarial assessment, focus branches, token use, testing, execution, cleanup, sanity, and exact-head integration. A remaining gap is the explicit decision method connecting those disciplines:

- how agents translate specifications into engineering obligations;
- how they distinguish hard requirements from optimization objectives and preferences;
- how they reason from facts and evidence rather than implementation convenience;
- how they compare credible paths;
- how they prioritize work;
- how they rank safety, correctness, accuracy, speed, reliability, maintainability, delivery time, and other values when they conflict.

Without one method, agents can treat specifications as themes, count design principles as equal votes, declare abstract slogans such as “safety first” without defining a boundary, use weighted scores to hide failed requirements, optimize a local metric at the expense of the total system, or choose the easiest implementation instead of the best engineering path.

The project owner directed that agents be taught how to engineer, align to specifications and design principles, reason, select paths, prioritize, and order conflicting values.

## Source synthesis

This decision synthesizes:

- ADR-0005 and the LEGO → SOLID → CUPID → simplest-sufficient-total-system hierarchy;
- ADR-0006 adversarial assessment and planning;
- `CONTEXTUAL_DESIGN_WEIGHTING.md` and the owner’s rule that design concerns are siblings whose weight follows subsystem purpose and bounds;
- ADR-0007 through ADR-0013 evidence, focus, execution, token, testing, and cleanup disciplines;
- ADR-0014’s repository-boundary decision as a concrete example of first-consumer deletion, dependency direction, and total-lifecycle choice;
- the project owner’s established Domain-Appropriate Foundations and Contextual Design Weighting principles.

UMCGS’s doctrine is authoritative here. Earlier material records provenance and design intent rather than an external runtime dependency.

## Decision

UMCGS adopts the method in:

- `agent_files/general_foundation/ENGINEERING_JUDGMENT.md`;
- `agent_files/general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md`;
- `agent_files/templates/engineering-decision.template.yaml`.

### Engineering contract before implementation

Substantial and critical work must establish an engineering contract containing the owned outcome, authority, semantics, invariants, operating envelope, finite resources, lifecycle/failure/recovery/cleanup, compatibility, non-goals, and completion evidence.

### Specification traceability

Every material specification obligation is normalized and mapped to an owner, design mechanism, failure consequence, and evidence/test capsule. Existing code, tests, comments, plans, and agent output are evidence—not automatic authority.

Ambiguities, conflicts, gaps, stale authority, unimplementable obligations, and test-oracle mismatches may not be resolved silently in implementation. They are routed to the authoritative owner through a specification or ADR decision.

### Ordered design principles

Design follows:

```text
authority and domain truth
    → purpose, bounds, and value ordering
    → LEGO ownership and public boundaries
    → SOLID internal responsibility
    → CUPID implementation quality
    → simplest sufficient total system
    → measured evidence, integration, cleanup, and evolution
```

Principles are ordered lenses, not equal votes. Simplicity selects among sound paths and cannot waive required behavior.

### Value classification

Each material concern is classified as one of:

- hard gate;
- mission objective;
- supporting quality;
- process cost or tie-breaker.

Abstract values are translated into measurable thresholds, prohibited states, optimization directions, or explicit ordinal rules.

A concern can change role by subsystem. Latency can be a preference in an offline generator and a correctness/safety gate in a real-time path. Accuracy can be a minimum contract, the mission objective, or irrelevant to an exact symbolic operation.

### Two-stage value ordering

Candidate paths first pass hard gates. An option that violates authority, unacceptable harm boundaries, semantic correctness, an explicit accuracy/deadline/resource/compatibility bound, or required lifecycle/failure behavior is eliminated rather than compensated by another value.

Among valid paths, the subsystem-specific engineering contract governs. When no specific ordering exists, the fallback order is:

1. authority, legality, and explicit ethical limits;
2. prevention of unacceptable irreversible harm: safety, security, privacy, data integrity, containment, and recoverability;
3. semantic correctness and explicit hard mission bounds, including required accuracy, deadlines, resources, determinism, and consistency;
4. mission-sustaining reliability, availability, compatibility, operability, and diagnosability;
5. mission quality and performance;
6. maintainability, architecture, usability, observability, portability, extensibility, and developer joy;
7. delivery speed, token/process cost, convenience, and cosmetic polish.

This is a contextual fallback, not a universal immutable ranking. Purpose may promote any concern to a hard gate. Deviations require authority, consequence analysis, evidence, an accepting owner, and revisit triggers.

Weighted scoring is permitted only after hard gates. It cannot average away a red-line failure. Quantitative weights require real comparable metrics; otherwise evidence-backed ordinal comparison is preferred.

### Path selection

Agents compare credible no-change, minimal-change, proposed, materially different, boundary-split, experiment, staged, and fallback paths where applicable.

They:

1. eliminate gate failures;
2. eliminate Pareto-dominated valid paths;
3. resolve architecture-changing uncertainty through the cheapest decisive evidence when worthwhile;
4. consider reversibility and option value;
5. compare total lifecycle cost across callers, adapters, generated code, resources, synchronization, testing, migration, recovery, operations, cleanup, review, context, and second consumers;
6. choose the lowest complete path and record why alternatives lost.

### Prioritization

Work is ordered as:

- **P0:** contain active unacceptable state;
- **P1:** resolve a hard gate or foundational blocker;
- **P2:** maximize information, risk reduction, and dependency unlock;
- **P3:** deliver mission value and measured efficiency;
- **P4:** improve supporting quality and polish.

Within a class, priority follows dependency unlock, consequence/risk reduction, information value, cost of delay, exposure, reversibility/recovery cost, and effort. Ease, recency, file count, symptom loudness, and developer preference are not valid primary ordering rules.

### Execution alignment

Every material operation identifies the obligation/decision it implements, owner, expected effects, value ordering, falsifier, evidence, rollback, and cleanup. Actual effects are compared immediately. Shared authority or value-order changes invalidate dependent work and evidence.

## Proportional records

Routine mechanical work needs no standalone engineering-decision record when authority, gates, path, and validation are obvious.

Use `engineering-decision.template.yaml` for foundational, contested, cross-component, high-consequence, empirically uncertain, difficult-to-reverse, or cross-session decisions.

The record contains only unique engineering-contract, obligation, candidate, value-order, selection, tradeoff, priority, and revisit information. It does not duplicate the specification, assessment, plan, focus-branch packet, test record, PR, or handoff.

## Consequences

- Specifications become traceable obligations rather than aesthetic targets.
- Agents distinguish invalid paths from merely less-preferred paths.
- Safety, speed, accuracy, correctness, reliability, and cost are translated into subsystem-specific gates and objectives.
- Design principles are applied in a stable cascade.
- High-uncertainty irreversible decisions favor evidence and reversibility.
- Priority follows consequence, dependency, and information value rather than implementation convenience.
- Tradeoffs become explicit, owned, bounded, detectable, and revisitable.
- Review can challenge both the selected path and the value ordering that selected it.

## Alternatives considered

### Fixed universal ranking of all values

Rejected. Different subsystems have different missions, and values such as latency or availability can become correctness or safety gates in one context but remain preferences in another.

### Pure weighted scoring

Rejected. It can conceal hard failures, invent false precision, and compare incommensurable concerns.

### “Correctness and safety always first” without qualification

Rejected as too vague. Correctness must refer to an accepted contract, safety must define unacceptable harm, and the contract may include deadlines, approximation, availability, or other mission bounds.

### Let each agent use informal judgment

Rejected because value ordering, specification interpretation, and path selection would be invisible and difficult to review or invalidate.

### Require a formal decision matrix for every change

Rejected as administrative waste. The durable record is proportional to consequence and coordination needs.

### Follow the specification literally even when contradictory or impossible

Rejected. Agents must preserve authority while surfacing and resolving ambiguities, conflicts, gaps, stale meaning, and platform impossibility through the authoritative process.

## Validation

A conforming material decision demonstrates:

- owned outcome and engineering contract;
- exact authority and obligation traceability;
- explicit specification gaps/conflicts and their disposition;
- hard gates, mission objectives, supporting qualities, and process costs;
- credible alternatives and gate results;
- evidence and uncertainty handling;
- design-principle alignment;
- explicit value ordering and consequence factors;
- selected path, rejected-path rationale, priority, confidence, tradeoffs, rollback, and revisit triggers;
- implementation/test/integration/cleanup traceability;
- no weighted-score masking of a failed gate;
- no remaining decision-relevant unknown hidden as implementation detail.

Agent startup, principles, validation, review, workflow, plan/design/PR templates, status, indexes, current next-step state, and governance checks must link to this doctrine.

## Revisit triggers

Revisit when agents still choose convenient paths over valid ones, value ordering remains slogan-based, the fallback order misclassifies recurring subsystem concerns, decision records create disproportionate overhead, specification traceability becomes performative, or new evidence shows the path-selection method misses important consequence or uncertainty dimensions.
