# SPEC-0004: Nonblocking Async Stage Channels

**Status:** Proposal

**Draft version:** 0.2.0

**Owner:** CUDA-MCGS device-resident internal dataflow and readiness semantics

**Consumers:** Search Stages, scheduler, evaluator, selected capabilities, secondary search tasks, resource planner, Search IR, conformance, and generated device programs

This proposal defines the **universal internal dataflow substrate** through which work/data may cross Search Stage and Stage Extension Surface boundaries without synchronous blocking. It does not define external Search Session control/observation, one product payload, one CUDA queue implementation, or one scheduler topology.

## 1. Normative references

- [`../decisions/ADR-0018-universal-core-extension-product-layering.md`](../decisions/ADR-0018-universal-core-extension-product-layering.md) owns core/extension/product separation.
- [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) owns publication-channel and finite-resource foundations.
- [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) owns foundational Search IR normalization/reference semantics.
- [`SPEC-0003`](SPEC-0003-search-stage-and-extension-surface.md) proposes stage/checkpoint/capability ownership.
- [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) proposes **external** Search Session control/observation semantics and remains a separate boundary.

## 2. Governing invariant

> **Internal cross-stage and cross-surface dataflow is allowed. Internal cross-stage and cross-surface blocking is forbidden.**

Logical dependency is not prohibited. A consumer may require a future result, but no GPU worker may synchronously wait/spin, hold a stage mutation open, or require a CPU-produced intermediate decision while the result is unavailable.

This invariant applies equally to universal and product-specific selected capabilities when they use internal channels.

## 3. Async Stage Channel

An **Async Stage Channel** is a finite pre-ignition-planned internal producer/consumer publication contract. It MUST define:

- namespaced channel ID/version and semantic owner;
- producer/consumer stages/checkpoints/capabilities;
- item identity/generation/correlation;
- request/result schemas, widths, ranges and memory spaces;
- single/multiple producer/consumer rules;
- reservation/ownership transfer/reclamation;
- readiness/completion/failure/cancellation states;
- required publication order/CUDA scope;
- capacity/watermarks/backpressure/exhaustion;
- duplicate/stale/late/out-of-order behavior;
- freshness/expiry policy;
- required/optional/best-effort/advisory consumption class;
- fallback/skip/defer/terminal behavior;
- diagnostics/bounded counters;
- compatibility/Search Image identity contribution.

The channel is semantic. A scheduler may realize it with a ring, work list, indexed slots, frontier, mailbox, arena records or another accepted bounded structure.

A product-specific capability may define a product-namespaced channel schema, but the channel mechanism remains universal and the product payload does not become universal Search IR core meaning.

## 4. Layering rules

CHANNEL-LAYER-001. An Async Stage Channel transports **internal search work/data** between declared device-resident producers/consumers. It is not automatically the external host↔Search Session sideband boundary.

CHANNEL-LAYER-002. External root updates, cancellation, live product observations and terminal result consumption are modeled under their Search Session/package contracts even if a lowering reuses mailbox/ring mechanics internally.

CHANNEL-LAYER-003. A product/capability channel MUST declare its product/capability semantic owner. Its payload fields are not added to universal base channel payloads for engines that do not select it.

CHANNEL-LAYER-004. Deleting the product/capability deletes solely product/capability-owned channel payload/state/resources. A universal scheduler/channel implementation must remain coherent.

CHANNEL-LAYER-005. A channel MUST NOT let a capability bypass SPEC-0003 least-authority surface rules or keep a mutable stage lease alive while asynchronous work is outstanding.

## 5. Producer rules

A stage/surface MAY initiate future work by publishing a bounded task descriptor to a channel.

The producer MUST:

- finish or explicitly roll back its current stage-owned mutation before publication makes dependent work eligible;
- write request payload/ownership metadata before publishing readiness with the declared release operation;
- publish only references whose lifetime/generation outlive the consumer contract;
- transfer/retain ownership explicitly;
- handle capacity failure under the declared pressure policy;
- release every reservation on cancellation/failure/teardown.

The producer MUST NOT expose incomplete stage-owned mutable state. Output storage for asynchronous work is separately owned, preallocated or validly reserved under channel/resource plans.

Starting work is a semantic enqueue/publication operation. It does not imply Dynamic Parallelism, device graph launch or a new kernel.

## 6. Consumer rules

A consumer may use a result only after:

1. matching channel/item/generation identity;
2. observing declared ready/completed state with matching acquire semantics/scope;
3. validating freshness, success class/schema version;
4. acquiring/borrowing payload ownership under declared lifetime.

A consumer MUST NOT poll tightly, block a worker, hold stage mutation open, or retain lock/reservation while waiting.

If a required result is not ready, the logical work item enters an explicit pending operational state and releases the worker/stage resources. It is re-enqueued/indexed for readiness-driven scheduling.

If an optional/advisory result is not ready, the contract selects one bounded behavior: skip, declared fallback, bounded defer/retry, or continue without it. Timing races MUST NOT silently select different search semantics unless explicitly part of the owning contract.

## 7. Required results and progress

A required result creates a readiness dependency, not a synchronous call.

Scheduler/resource plans MUST prove:

- at least one producer path can become runnable without consumer-held resources;
- correctness-required producers cannot be permanently starved by pending consumers;
- finite capacity cannot create an unhandled reservation cycle;
- cancellation/stop can retire request and pending consumer;
- deadlock/orphan/expiry/device-failure has a typed outcome.

When no ordinary work is ready but producers remain runnable, scheduler capacity is available to producer classes. When no producer can run and a required result cannot arrive, the engine produces typed failure/stop rather than waiting indefinitely.

Idle hardware awaiting a legitimate device-side dependency is not itself a violation. A worker-side wait, host decision dependency or unbounded unresolved state is.

## 8. Publication and memory ordering

Payload initialization/readiness publication follows SPEC-0001. Concrete lowering uses release after payload writes and matching acquire before payload reads at a scope covering all actual producers/consumers.

Relaxed atomics may reserve indices/update independent counters only when they do not substitute for payload publication. A readiness flag alone cannot validate non-atomic payload races.

Channel states are monotonic per generation or use an explicitly specified state machine. Reused storage changes generation before stale references could alias current work.

## 9. Capacity, pressure and fairness

Every channel has finite capacity in the Search Image plan. Failed reservations do not count as published work.

At high/critical watermarks, the selected channel/capability/resource contract defines deterministic actions such as:

- stop admitting optional tasks;
- reduce batch/proposal width;
- prioritize draining producer/result classes;
- use declared fallback;
- produce typed pressure/exhaustion;
- stop with valid partial/no-valid result.

Backpressure propagates as data/state, not as a producer blocking while holding mutable stage resources.

Fairness is profile-specific but prevents starvation of correctness-required producer classes under declared finite assumptions.

Product-specific channels consume product-budgeted resources; they may not silently cannibalize universal safety/root-admission capacity outside the resource plan.

## 10. Cancellation, expiry and reclamation

Each channel defines:

- queued work removal/tombstone/ignore-on-completion behavior;
- in-flight cancellation observation;
- late result classification/reclamation;
- pending consumer termination/fallback;
- owner of payload/task/result release;
- generation advancement/stale-handle rejection;
- teardown proof of no orphan reservation/slot/result.

Expiry may use engine-owned monotonic epoch, work budget or stage generation. Wall-clock host service is not required for active-search correctness.

A Search Session root epoch MAY be part of a channel item's validity key if the owning internal effect is root-relative. That does not convert the internal channel into the external root-update mechanism. Old-epoch channel work follows the owning stale disposition under SPEC-0006.

## 11. Cross-surface and capability use

An entry/exit surface MAY produce or consume a channel item when its SPEC-0003 capability grants that permission. The channel remains independently owned/versioned; it does not make the surface span stages.

Capability composition rejects cycles where two surfaces each require the other's unpublished result before either can commit. Advisory cycles are permitted only with bounded skip/fallback progress.

Namespaced capability-specific channel fields/resources disappear when the capability is absent. Shared universal channel metadata must not accumulate first-product payloads.

## 12. Compatibility and identity

Channel version/schemas/capacity/producer-consumer roles/publication scope/readiness/failure/freshness/retry/fallback rules and semantic owner are material Search Image identity.

An incompatible product channel change invalidates product Search Image/package evidence without requiring a universal channel-version change when universal channel meaning is unchanged.

## 13. Conformance requirements

One consolidated channel capsule MUST cover:

- ordinary request/result publication with matching generation;
- task initiated in one stage/consumed later;
- cross-surface producer/consumer without shared surface ownership;
- required-not-ready → pending with worker release;
- optional skip/fallback/defer;
- multiple ready work classes showing producer progress;
- full queue/failed reservation/deterministic pressure;
- stale/duplicate/late/wrong-generation/wrong-version results;
- cancellation before enqueue/queued/in flight/late completion;
- orphan/deadlock detection and typed terminal behavior;
- release/acquire/scope-sensitive native evidence;
- root-epoch-scoped internal work becoming stale after reroot without becoming an external session channel;
- a product-specific channel deleted with zero product payload/resource residue;
- a materially different non-product/universal capability using the same channel mechanics;
- teardown with exact accounting.

Reference tests assert ownership/state/progress/publication/conservation/terminal disposition, not one schedule.

## 14. Acceptance blockers

This proposal cannot become accepted until:

- at least one evaluator-like required-result flow and one optional secondary-work flow are represented in complete Search IR;
- at least one namespaced product/capability channel proves payload separation from universal channel meaning;
- scheduler/resource specs realize pending/ready/progress without host progression;
- SPEC-0006 root-epoch interaction is reconciled for root-relative internal work;
- native CUDA publication/race evidence exists on the selected Windows profile;
- cancellation/saturation/expiry/teardown cases have owned oracles;
- Linux native evidence is completed or explicitly excluded from the accepted profile.