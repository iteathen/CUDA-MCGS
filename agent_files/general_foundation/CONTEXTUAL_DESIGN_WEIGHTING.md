# Contextual Design Weighting and Value Ordering

**Scope:** Selecting among valid engineering paths after authority, purpose, bounds, and hard requirements are known.

Use this as the compact companion to [`ENGINEERING_JUDGMENT.md`](ENGINEERING_JUDGMENT.md).

## Core rule

Correctness, safety, security, accuracy, performance, reliability, availability, recoverability, compatibility, usability, maintainability, observability, architecture, delivery speed, memory, token/context use, and process cost are sibling concerns **until the engineering contract assigns their role**.

Do not rank abstract nouns directly. Translate each concern into:

- a **hard gate** with a threshold or prohibited state;
- a **mission objective** to optimize;
- a **supporting quality** to improve;
- a **process cost or tie-breaker**.

A concern can change role by subsystem. A latency target can be optional in an offline tool and a correctness or safety gate in a real-time path. Accuracy can be a required tolerance, the product objective, or irrelevant to an exact operation.

## Required sequence

1. Define exact subsystem/task purpose and consumer.
2. Identify accepted authority and normalize material obligations.
3. Define semantics, bounds, finite resources, lifecycle, failure, recovery, cleanup, and evidence.
4. Classify each concern as gate, objective, supporting quality, or process cost.
5. Eliminate paths that fail a gate.
6. Look for a design that separates apparently conflicting concerns.
7. Order the remaining values for this subsystem.
8. Compare credible valid paths using evidence, consequence, uncertainty, reversibility, and total lifecycle cost.
9. Record tradeoffs, accepted owner, invalidation, and revisit triggers.
10. Validate the selected path against the same ordering.

## Default fallback order

When accepted authority and subsystem purpose do not define a more specific ordering, use:

1. authority, legality, and explicit ethical limits;
2. prevention of unacceptable irreversible harm: safety, security, privacy, data integrity, containment, and recoverability;
3. semantic correctness and explicit hard mission bounds, including required accuracy, deadlines, resources, determinism, or consistency;
4. mission-sustaining reliability, availability, compatibility, operability, and diagnosability;
5. mission quality and performance;
6. maintainability, architecture, usability, observability, portability, extensibility, and developer joy;
7. delivery speed, token/process cost, convenience, and cosmetic polish.

This order is a fallback, not a universal law. Purpose can promote another value into a gate. A deviation states the new order, authority, accepted consequence, evidence, owner, and revisit trigger.

## Hard gates before weights

Weighted scoring applies only after all hard gates pass. Never average a catastrophic safety, correctness, data-integrity, compatibility, or resource failure against performance or schedule benefits.

Prefer evidence-backed ordinal comparison over invented numeric precision. Use numeric weights only when metrics and stakeholder utility are real and comparable.

## Consequence and uncertainty factors

For each material tradeoff consider:

- severity;
- likelihood;
- exposure/frequency;
- blast radius;
- reversibility;
- detectability before harm;
- uncertainty/confidence;
- cost of delay;
- dependency impact;
- recovery cost.

High consequence, low reversibility, poor detectability, or low confidence favors stronger evidence, containment, reversible experiments, staged rollout, and recoverability.

## Avoid false tradeoffs

Before sacrificing one concern, consider:

- separate safe/fast or exact/approximate profiles;
- offline/online paths;
- adapter boundaries;
- generic contracts with specialized implementation;
- bounded approximation with explicit error limits;
- asynchronous work outside the critical path;
- staged rollout and rollback;
- fallback/reference paths;
- independent read/write or control/data planes.

A tradeoff is accepted only after credible separation alternatives are considered.

## Priority

Use:

- **P0:** contain active unacceptable state;
- **P1:** resolve a hard gate or foundational blocker;
- **P2:** maximize information, risk reduction, and dependency unlock;
- **P3:** deliver mission value and measured efficiency;
- **P4:** supporting quality and polish.

Within a class prioritize dependency unlock, consequence reduction, information value, cost of delay, exposure, reversibility/recovery cost, then effort.

## CUDA-MCGS examples

### Search IR and public schemas

Hard gates: semantic correctness, accurate generality, versioning, deterministic normalization, finite representable bounds, and conformance. Explicitness may outweigh brevity when it prevents first-domain assumptions.

### Device scheduler and graph store

Hard gates: device closure, publication correctness, bounded resources, pressure/exhaustion behavior, cancellation, teardown, and stale-reference safety. Mission objectives: search quality, throughput, latency, and memory efficiency within those bounds.

### CUDA-MCGS-to-CUDA-JS contract

Hard gates: one owner per field/lifecycle transition, one-way dependency direction, no private-source coupling, opaque runtime resources, complete compatibility/cache identity, and device-closure preservation. Delivery convenience and early performance optimization are lower-order concerns.

### Small reversible documentation correction

Hard gates: accuracy and current authority. Mission objective: discoverability. Process cost is weighted highly; formal architecture work is unnecessary unless meaning or ownership changes.

## Tradeoff record

A meaningful tradeoff records:

- value reduced and value gained;
- whether each is a gate/objective/supporting quality/process cost;
- exact operating boundary;
- worst credible consequence;
- accepting owner;
- evidence and confidence;
- detection, containment, rollback, and redesign trigger;
- expiration or revisit event;
- total memory/performance/testing/token/operational cost where material.

## Non-waivable boundaries

Weighting cannot waive owner instruction, accepted authority, explicit ownership/dependency direction, domain-appropriate foundations, device closure, finite-resource behavior, security/provenance, public/persisted versioning, exact evidence identity, honest claims, required validation, recovery, or cleanup.

Contextual weighting chooses among valid paths. It never makes an invalid path valid.
