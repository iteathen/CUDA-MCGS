# Semantic Interrogation

**Scope:** Risk-proportional review of one coherent semantic unit during sanity checking, implementation self-review, PR review, debugging, or audit.

## Purpose

Agents often read code or schemas descriptively: they explain what a unit appears to do without challenging its authority, assumptions, state changes, callers, failures, resources, and consequences.

Review the smallest semantic unit that preserves meaningful context. It may be:

- a function, method, branch, loop, callback, or state transition;
- a parser, validator, serializer, migration, or generator rule;
- a schema or public contract fragment;
- a build, layout, JIT/link, cache, or configuration rule;
- a queue, publication, cancellation, or resource-lifecycle operation;
- a domain, policy, evaluator, output, graph, or memory-planning operation.

It is not necessarily one lexical block. Include enough surrounding contract, state, callers, dependencies, and terminal behavior to judge the unit.

## Answer states

Each material question ends as:

- `supported` — authority/evidence supports the behavior;
- `violated` — behavior conflicts with the governing invariant;
- `blocked` — required access, authority, or decisive evidence is missing;
- `not_applicable` — the concern cannot affect this unit, with a short reason;
- `invalidated` — the reviewed revision or dependency changed.

Silence is not `not_applicable`.

## Mandatory core

For every material semantic unit, answer:

1. **Purpose and authority** — What result is intended, and which specification, contract, schema, ADR, test oracle, or invariant authorizes it?
2. **Owner and boundary** — Which component owns the behavior, state, and lifecycle? Is the unit in the correct layer and public/internal boundary?
3. **Inputs, outputs, state, and effects** — What explicit and material implicit inputs exist? What values, mutations, device/host state, side effects, resources, and observable outputs result?
4. **Caller and dependency assumptions** — Who invokes it, what do callers assume, which dependencies are used, and what stale/partial/delayed/missing/failing behavior can they introduce?
5. **Failure and terminal behavior** — How can it reject, partially succeed, retry, cancel, overflow, saturate, interrupt, or terminate? Can invalid or unreleased state escape?
6. **Simplest credible counterexample** — What smallest realistic case would make the claimed behavior or boundary wrong?
7. **Cheapest decisive evidence** — Which focused inspection, test, trace, sanitizer, artifact comparison, or measurement distinguishes correct from incorrect behavior?
8. **Wider impact** — Which contracts, callers, generated forms, runtime paths, resources, compatibility promises, lifecycle, or future intended consumers can be affected?

Do not answer an irrelevant question merely to fill a form. Do not omit a material question because it is inconvenient.

## Triggered modules

Use a deeper module only when the unit changes, depends on, or makes a material claim about that concern.

### Persistence, migration, and recovery

Check canonical schema/version, compatibility window, unknown values, deterministic and resumable migration, partial migration, durability before advancement, rollback/recovery, and data-loss boundaries.

### Security, trust, privacy, and executable capability

Check caller authority, untrusted input, validation and resource bounds, authorization before effect, secret/native-address/generated-code exposure, capability lifetime/revocation, denial of service, and fail-closed behavior.

### Concurrency, ordering, and publication

Check execution owner, required order, linearization point, visibility/fences, stale/duplicate/delayed/lost work, wakeups, output publication, cancellation cleanup, bounded backpressure, and progress guarantees.

### External I/O, resources, and cleanup

Check exact resource and owner, acquisition, bounds/timeouts/cancellation, partial failure, cleanup on every terminal path, idempotent release, external verification, and retained-state trigger.

### Performance and hot path

Check workload and synchronization boundary, measured baseline, same-work/quality/resource equivalence, repeated work, memory traffic, contention, divergence, batching, occupancy, bounded degradation, cold preparation, profiler evidence, and regression threshold.

### Identity and lineage

Check identity domain, equality and continuity, state-derived versus continuing identity, collision/reuse/staleness/forgery, generation/incarnation, persistence horizon, and whether independent identity is actually required.

### Compatibility and public contract

Check old/new contract, producer/consumer and adapter behavior, version negotiation, migration, deprecation/removal, defaults, unknown values, silent reinterpretation, and representative second consumers.

### Provenance, generated content, JIT, and ABI

Check exact source and revision, license/provenance, canonical source versus generated output, deterministic regeneration, drift detection, schema/toolchain/runtime/cache identity, type widths, alignment, calling convention, architecture capability, and forbidden/quarantined material exclusion.

### Destructive or difficult-to-reverse behavior

Check exact authority and target identity, required checkpoint, point of no return, races, partial failure intervals, recovery, post-operation verification, and disposition of superseded state.

### GPU, device closure, and finite resources

Check memory-space ownership, lifetime, transfer/synchronization boundaries, driver/device capability, launch and asynchronous error handling, device loss, queue/arena/table/path limits, pressure state machine, cancellation, completion, teardown, and whether active progress secretly depends on host computation or polling.

### Graph and search semantics

Check state identity and history, collision verification, state-node versus parent-edge ownership, transpositions, path/graph cycles, node roles, action production, selection/reservation, evaluator capability and perspective, backup/reduction semantics, solved/terminal propagation, reroot/persistence, stopping, and output ranking.

## Exhaustive depth

Exhaustive interrogation is justified only for critical trust/data-loss boundaries, incidents, hostile audits, difficult concurrency/recovery, unusually opaque high-blast-radius code, or an explicitly selected critical coverage leaf.

State why exhaustive depth is necessary, which decision it supports, and which additional question families or exhaustive enumeration are required. Do not equate questionnaire length with review quality.

## Findings

A semantic finding states:

- exact revision and unit;
- governing invariant;
- actual conflicting or uncertain mechanism;
- consequence;
- decisive evidence and confidence;
- blocking classification;
- smallest acceptable outcome or evidence requirement;
- wider manifestations and owner.

Find the earliest failed invariant. Avoid prescribing a broad redesign when a smaller owner-level correction is sufficient.

## Completion

The unit is reviewed when:

- the mandatory core is answered;
- every objectively triggered module is resolved or explicitly blocked;
- material counterexamples were tested or bounded;
- findings and uncertainty are exact;
- the conclusion is no broader than the evidence;
- the revision remains valid.

Use [`../templates/semantic-review.template.yaml`](../templates/semantic-review.template.yaml) only when the leaf is critical, independently assigned, or must survive a context/session boundary.