# SPEC-0004: Nonblocking Async Stage Channels

**Status:** Proposal

**Draft version:** 0.1.0

**Owner:** CUDA-MCGS device-resident dataflow and readiness semantics

**Consumers:** Search stages, scheduler, evaluator, secondary search tasks, resource planner, Search IR, conformance, and generated device programs

This proposal defines how work and data may cross Search Stage and Stage Extension Surface boundaries without synchronous blocking. It does not select a CUDA queue implementation or scheduler topology.

## 1. Normative references

- [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) owns publication-channel and finite-resource foundations.
- [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) owns foundational Search IR normalization and reference semantics.
- [`SPEC-0003`](SPEC-0003-search-stage-and-extension-surface.md) proposes stage and checkpoint ownership.

## 2. Governing invariant

> Cross-stage and cross-surface dataflow is allowed. Cross-stage and cross-surface blocking is forbidden.

Logical dependency is not prohibited. A consumer may require a future result, but no GPU worker may wait synchronously, spin on readiness, hold a stage mutation open, or require a CPU-produced decision while that result is unavailable.

## 3. Async Stage Channel

An **Async Stage Channel** is a finite pre-ignition-planned producer/consumer publication channel. Its contract MUST define:

- namespaced channel ID and version;
- producer and consumer roles, stages and checkpoints;
- item identity, generation and correlation;
- request and result schemas, widths, ranges and memory spaces;
- single/multiple producer and consumer rules;
- reservation, ownership transfer and reclamation protocol;
- readiness, completion, failure and cancellation states;
- required publication order and CUDA thread scope;
- capacity, watermarks, backpressure and exhaustion;
- duplicate, stale, late and out-of-order behavior;
- freshness/expiry policy;
- whether consumption is required, optional, best-effort or advisory;
- fallback, skip, defer or terminal behavior;
- diagnostics and bounded counters;
- compatibility and cache identity contribution.

The channel is semantic. A scheduler may realize it with a ring, work list, indexed slots, frontier, mailbox, arena records or another accepted bounded structure.

## 4. Producer rules

A stage or surface MAY initiate future work by publishing a bounded task descriptor to a channel.

The producer MUST:

- finish or explicitly roll back its current stage-owned mutation before publication makes dependent work eligible;
- write request payload and ownership metadata before publishing readiness with the specified release operation;
- publish only references whose lifetime and generation outlive the consumer contract;
- transfer or retain ownership explicitly;
- handle capacity failure according to the declared pressure policy;
- release every reservation on cancellation, failure and teardown.

The producer MUST NOT expose a pointer or lease to incomplete stage-owned mutable state. Output storage for an asynchronous task MUST be separately owned, preallocated or validly reserved under the channel/resource plan.

Starting work is a semantic enqueue/publication operation. It does not require CUDA Dynamic Parallelism, a device graph launch or a new kernel.

## 5. Consumer rules

A consumer may use a result only after:

1. matching channel/item/generation identity;
2. observing the declared ready/completed state with the matching acquire operation and scope;
3. validating freshness, success type and schema version;
4. acquiring or borrowing payload ownership under the declared lifetime.

A consumer MUST NOT poll in a tight loop, block a worker, hold a stage mutation open, or retain a lock/reservation while waiting.

If a required result is not ready, the logical work item transitions to an explicit pending operational state. It is re-enqueued or indexed for readiness-driven scheduling, and the worker becomes available for other runnable work.

If an optional/advisory result is not ready, the contract MUST select one bounded behavior: skip, use a declared fallback, defer once under a retry bound, or continue without the result. Timing races MUST NOT silently choose different search semantics unless that nondeterminism is explicitly part of the contract.

## 6. Required results and progress

A required result creates a declared readiness dependency, not a synchronous call.

The scheduler and resource plan MUST prove that:

- at least one producer path can become runnable without the consumer holding its resources;
- producer queues/workspaces cannot be permanently starved by pending consumers;
- bounded capacity cannot form an unhandled reservation cycle;
- cancellation/stop can retire both request and pending consumer;
- the dependency graph has a typed response to deadlock, orphaned producer, expiry and device failure.

When no ordinary work is ready but producers remain runnable, scheduler capacity MUST be available to producers. When no producer can run and a required result cannot arrive, the engine MUST produce a typed failure/stop outcome rather than wait indefinitely.

Idle hardware while awaiting a legitimate external device operation is not itself a contract violation. A worker-side wait, host decision dependency, or unbounded unresolved state is.

## 7. Publication and memory ordering

Payload initialization and readiness publication MUST follow SPEC-0001. The concrete lowering MUST use a release operation after payload writes and a matching acquire operation before payload reads, with a thread scope that includes every actual producer and consumer.

Relaxed atomics may reserve indices or update independent counters only when they do not substitute for payload publication. A readiness flag alone does not make non-atomic payload races valid.

Channel state transitions MUST be monotonic within one generation or use an explicitly specified compare/exchange state machine. Reused slots MUST change generation before stale references could be mistaken for current work.

## 8. Capacity, pressure and fairness

Every channel has finite capacity included in the Search Image resource plan. Reservation MUST NOT count failed claims as published work.

At high and critical watermarks, the contract MUST define one or more deterministic actions:

- stop admitting optional tasks;
- reduce batch or proposal width;
- prioritize draining producers/results;
- use a declared fallback;
- produce typed pressure/exhaustion;
- stop with a valid partial result.

Backpressure MUST propagate as data/state, not as a producer blocking while holding mutable stage resources.

Fairness guarantees are profile-specific but MUST be strong enough to prevent starvation of correctness-required producer classes under the selected finite workload/resource assumptions.

## 9. Cancellation, expiry and reclamation

Cancellation is a published one-way request. Each channel contract MUST define:

- whether queued work can be removed, tombstoned or merely ignored on completion;
- how in-flight producer work observes cancellation;
- how late results are classified and reclaimed;
- how pending consumers terminate or fall back;
- which owner releases payload, task and result storage;
- generation advancement and stale-handle rejection;
- teardown proof that no reservation, slot or result remains orphaned.

Expiry may be based on an engine-owned monotonic epoch, work budget or stage generation. Wall-clock host service MUST NOT be required for active-search correctness.

## 10. Cross-surface use

An entry or exit surface MAY produce or consume a channel item when its Stage Extension Surface contract grants that capability. The channel remains independently owned and versioned; it does not make the surface span stages.

Capability composition MUST reject cycles in which two surfaces each require the other's unpublished result before either can commit. Advisory cycles are permitted only when skip/fallback behavior guarantees bounded progress.

## 11. Compatibility and identity

Channel version, schemas, capacity profile, producer/consumer roles, publication scope, readiness/failure states, freshness, retry and fallback rules are material Search Image identity. An incompatible change invalidates generated artifacts, cached memory plans and conformance evidence.

## 12. Conformance requirements

One consolidated channel capsule MUST cover:

- ordinary request/result publication with matching generation;
- a task initiated in one stage and consumed in a later stage;
- cross-surface producer/consumer use without shared surface ownership;
- required-not-ready transition to pending with worker release;
- optional skip/fallback/defer behavior;
- multiple ready work classes demonstrating producer progress;
- full queue, failed reservation and deterministic pressure propagation;
- stale, duplicate, late, wrong-generation and wrong-version results;
- cancellation before enqueue, while queued, in flight and after late completion;
- orphan/deadlock detection and typed terminal behavior;
- release/acquire and scope-sensitive native CUDA evidence;
- teardown with exact slot/reservation/resource accounting.

Reference tests MUST avoid asserting one schedule. They assert ownership, legal state transitions, bounded progress, publication visibility, conservation and terminal disposition.

## 13. Acceptance blockers

This proposal cannot become accepted until:

- at least one evaluator-like required-result flow and one optional secondary-work flow are modeled in Search IR;
- scheduler and resource specifications prove the pending/ready/progress rules can be realized without host progression;
- native CUDA publication/race evidence exists on the selected Windows profile;
- Linux native evidence remains either completed or explicitly excluded from the accepted profile;
- cancellation, saturation, expiry and teardown cases have owned oracles.
