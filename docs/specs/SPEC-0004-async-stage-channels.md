# SPEC-0004: Nonblocking Async Stage Channels

**Status:** Proposal

**Draft version:** 0.3.0

**Owner:** CUDA-MCGS optional internal channel item/publication/ownership-transfer semantics

**Product area / durable path:** universal extension/composition substrate / `docs/specs/`

**Consumers:** selected Search Stages/surfaces/capabilities, evaluator-like and secondary work adapters, finite-resource and device-progress composition, Search IR, Search Composer, restricted Device-JS programs, conformance and package identity

This proposal defines an optional finite internal device-resident dataflow brick. It lets selected producers publish work/data for later selected consumers without keeping a worker blocked or exporting source-owner meaning into the channel. It is not the external Search Session sideband, a scheduler, an output transport, a CUDA queue implementation or a production runtime.

## 1. Authority, identity and applicability

Specification identity is `CUDA-MCGS-SPEC-0004@0.3.0-draft`.

Normative authority and dependencies are:

- [`ADR-0002`](../decisions/ADR-0002-universal-contracts-specialized-engines.md) for universal contracts and finite specialized engines;
- [`ADR-0003`](../decisions/ADR-0003-device-resident-active-search.md) for device-resident active search;
- [`ADR-0005`](../decisions/ADR-0005-lego-design-hierarchy.md) for LEGO ownership and deletion;
- [`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md) for optional extension/product separation;
- [`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) for JavaScript/restricted Device-JS CUDA-MCGS source and CUDA-JS capability escalation;
- accepted [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) for publication and finite-resource foundations;
- accepted [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) for normalized Search IR/reference foundations; and
- decision-complete proposal [`SPEC-0003`](SPEC-0003-search-stage-and-extension-surface.md) for optional stage/checkpoint/surface/capability permissions.

Decision-complete core proposals [`SPEC-0000`](SPEC-0000-framework-requirements.md), [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md), [`SPEC-0011`](SPEC-0011-finite-search-resources.md), [`SPEC-0012`](SPEC-0012-device-owned-search-progress.md) and [`SPEC-0013`](SPEC-0013-result-and-observation-publication.md) are coupled proposal inputs. They become normative dependencies through the later atomic semantic-acceptance gate. [`SPEC-0005`](SPEC-0005-stage-ptx-and-search-image-composition.md) is downstream composition adjacency. Accepted authority governs conflicts.

CHANNEL-AUTH-001. This specification applies only to channels selected by an extension profile. No selected channel means no channel schema instance, slot/item state, work class, context reference, resource, synchronization, diagnostic, restricted Device-JS behavior or package residue.

CHANNEL-AUTH-002. A channel transports source-owner payloads and effects but does not own their domain/policy/evaluator/output/product meaning. Selection requires an explicit semantic owner for each payload/effect.

CHANNEL-AUTH-003. This proposal does not authorize native implementation. Backend-neutral acceptance and concrete CUDA publication/operation qualification are separate gates.

## 2. Governing invariant, purpose and exclusions

> **Internal cross-stage/cross-surface dataflow is allowed. Internal cross-stage/cross-surface worker blocking is forbidden.**

An unavailable required result is a readiness dependency. The logical consumer becomes explicitly pending, releases its worker and mutable stage resources, and lets other ready device work—including a producer—receive service. No CPU-produced intermediate advances the dependency.

CHANNEL-SCOPE-001. This specification owns selected channel identity, finite item lifecycle, reservation/publication/claim/ownership-transfer/reclamation semantics, correlation/generation/freshness, consumption class, channel-local pressure/failure and exact deletion.

CHANNEL-SCOPE-002. SPEC-0011 owns aggregate resource normalization/admission/accounting/pressure/exhaustion, and SPEC-0012 owns composed readiness/service/fairness/no-progress/stop/drain/closure. A channel contributes descriptors and local transitions only.

CHANNEL-SCOPE-003. This specification does not own external root/control/cancellation/observation ports, terminal/live output publication, source payload meaning, stage permissions, CUDA atomics/queues/streams/events, one physical scheduler or host progress.

## 3. LEGO ownership and deletion

CHANNEL-LEGO-001. A channel is justified by an asynchronous lifetime/ownership/readiness boundary between independently progressing selected producers and consumers. A synchronous function call, shared local variable or first-product convenience is not sufficient.

CHANNEL-LEGO-002. Producer and consumer identities are explicit public roles. The channel cannot discover callbacks/providers or infer an owner from a payload shape at runtime.

CHANNEL-LEGO-003. A stage/surface uses a channel only when its SPEC-0003 profile grants the exact produce, claim, observe, complete, cancel or release permission. The channel does not widen surface authority or make one surface span stages.

CHANNEL-LEGO-004. Product/capability payload fields and resources remain namespaced. Shared channel metadata cannot accumulate evaluator, game, ranking, model, action or other first-consumer fields.

CHANNEL-LEGO-005. Deleting a product/capability removes its solely owned channel instances, payloads, roles, work descriptors, storage, counters, synchronization, diagnostics and package inputs. Shared mechanisms remain only when another selected owner independently requires them.

CHANNEL-LEGO-006. Deleting the first consumer leaves the channel invariant coherent for a materially different second use. If not, the channel contract remains product/capability-owned rather than universal extension machinery.

CHANNEL-LEGO-007. Deleting CUDA-MCGS leaves any public CUDA-JS publication/atomic/operation capability consumer-neutral. CUDA-JS never receives channel, stage, evaluator or search-policy meaning.

## 4. Terms and selected channel profile

An **Async Stage Channel** is one immutable normalized selected producer/consumer contract plus a finite set of generation-protected item slots or an equivalent bounded semantic realization. A **channel item** is one finite identity/correlation/payload lifecycle within that contract. A **producer** prepares/publishes an item or result. A **consumer** claims/borrows/consumes it under one declared mode. A **pending work item** is a logical consumer with no worker or mutable stage lease while its dependency is unavailable.

CHANNEL-PROFILE-001. A normalized selected channel declares, with no unknown fields:

- namespaced channel ID/version, semantic owner and compatibility policy;
- exact producer/consumer stage/checkpoint/capability roles and permissions;
- item identity, generation, correlation and optional source-owner validity key;
- request/result/payload schemas, ranges, alignment, memory-space class and immutability;
- producer/consumer multiplicity, ordering and claim/borrow mode;
- lifecycle states and legal transitions;
- publication/visibility requirements;
- capacity, watermarks, retry/fallback/expiry and finite contribution;
- consumption class and typed outcomes;
- cancellation, stale/late/duplicate/reclamation/teardown rules;
- diagnostics/counters and their finite exhaustion behavior; and
- required source-owner, progress/resource and public CUDA-JS capability identities.

CHANNEL-PROFILE-002. Unknown/missing fields, duplicate IDs/roles, incompatible schemas/versions, unowned payload/effects, ambiguous claim/ownership, insufficient bounds, impossible publication scope, resource overflow or progress dependency cycles reject before ignition.

CHANNEL-PROFILE-003. Unordered channel/role/schema selections normalize by raw JavaScript/Unicode code-unit order. Every semantically meaningful order is explicit. Defaults normalize to explicit canonical values.

CHANNEL-PROFILE-004. Every dimension is finite and checked: capacity, payload bytes, producer/consumer multiplicity, reservations, pending items, retries, age/expiry, generation/correlation width, counters, work per operation and cancellation-observation bound.

CHANNEL-PROFILE-005. Host normalization/composition may use ordinary Node.js. Active channel behavior is restricted Device-JS through public CUDA-JS contracts. CUDA-MCGS owns no C/C++, CUDA C++, native addon, FFI/Driver call, hand-written PTX, embedded CUDA source or native subprocess path.

CHANNEL-PROFILE-006. If a generic publication/synchronization/operation mechanism lacks a natural public CUDA-JS expression with explicit scope, resources, lifecycle and independent qualification, the affected native profile stops for CUDA-JS capability classification rather than using a local workaround.

CHANNEL-PROFILE-007. A selected channel has exactly one consumption class: `required`, `optional`, `advisory` or a namespaced class with equally complete ready/unavailable/failure semantics. Timing cannot silently switch the class.

CHANNEL-PROFILE-008. Channel selection and every meaning-affecting profile field participate in Search IR/Search Program/package identity. An unselected channel is canonical absence rather than an empty dispatcher/queue.

## 5. Item lifecycle, identity and ownership

CHANNEL-ITEM-001. Every item has channel identity, non-ambiguous finite generation and correlation identity sufficient to reject foreign, stale, duplicated and wrapped references before payload use.

CHANNEL-ITEM-002. Every channel state machine distinguishes at least `free`, `reserved-unpublished`, `ready`, `owned-or-borrowed`, `terminally-disposed` and `reclaimable`, even when a realization fuses states. Request/result profiles may add explicit `in-progress` and `result-ready` states.

CHANNEL-ITEM-003. Item transitions are monotonic within one generation or follow one explicitly validated finite state graph. A state never moves backward to reinterpret already published bytes.

CHANNEL-ITEM-004. Reservation grants one bounded initializer ownership and does not make the item visible. Failed reservation publishes no work and acquires no semantic count.

CHANNEL-ITEM-005. Ready publication transfers or exposes exactly the declared payload/ownership rights. Initialization ownership ends or narrows at publication; no producer may mutate immutable ready payload afterward.

CHANNEL-ITEM-006. A channel selects one claim mode: single-consumer transfer, finite multi-consumer immutable borrow with exact reference accounting, broadcast with predeclared recipients, or another completely specified bounded mode. Ambiguous mixed modes reject.

CHANNEL-ITEM-007. Every claim/borrow validates item/channel/generation/correlation/version/freshness and obtains the declared lifetime before payload access. A failed validation has no payload or ownership effect.

CHANNEL-ITEM-008. Completion records one typed success/failure/cancel/stale/expired disposition and assigns final payload/result release. Exactly one owner is responsible for every reservation, payload, result and borrow at each state.

CHANNEL-ITEM-009. Reclamation occurs only after terminal disposition, all borrows/claims and source-owner leases end, and progress/resource owners confirm no live reference. Reuse advances generation before a stale reference can alias new work.

CHANNEL-ITEM-010. Generation/correlation/counter exhaustion cannot wrap into ambiguity. The selected profile rejects further admission, drains/restarts or terminates with a typed cause before alias.

## 6. Producer contract

CHANNEL-PRODUCER-001. A producer may reserve and initialize only through a selected granted role and only within compound admission/resource bounds. It cannot allocate hidden storage or exceed planned multiplicity.

CHANNEL-PRODUCER-002. Before ready publication, the producer completes or explicitly rolls back its current stage-owned mutation, establishes source-owner payload validity and releases any mutable lease not transferred by the channel contract.

CHANNEL-PRODUCER-003. Payload, identity, ownership and source-validity metadata are completely initialized before the one declared ready publication transition.

CHANNEL-PRODUCER-004. Published references/handles remain valid through the maximum consumer/result lifetime or carry a source-owner lease/protection whose acquisition and release are explicit in the finite plan.

CHANNEL-PRODUCER-005. Capacity failure returns the selected typed pressure outcome and releases partial reservation state. A producer cannot block/spin while retaining stage mutation, locks, reservations or unpublished source-owner effects.

CHANNEL-PRODUCER-006. Duplicate production is either prevented by identity/claim state or classified under an explicit idempotent/coalesced/independent-duplicate rule owned by the payload semantic owner.

CHANNEL-PRODUCER-007. Starting channel work is semantic publication. It does not imply a kernel launch, dynamic parallelism, CUDA Graph node, host task or new operation.

## 7. Consumer and unavailable-result contract

CHANNEL-CONSUMER-001. A consumer may access payload only after matching identity/generation/version/freshness, observing declared ready state through the publication contract and acquiring the declared ownership/borrow.

CHANNEL-CONSUMER-002. If a required item/result is unavailable, the logical work item transitions to explicit pending state, records a bounded dependency descriptor, releases the worker/stage resources and becomes eligible again only through SPEC-0012-ready evidence or typed escape.

CHANNEL-CONSUMER-003. A pending item owns no spin loop, blocked worker, open stage mutation, lock, unpublished reservation or mutable source-owner lease merely to wait for future data.

CHANNEL-CONSUMER-004. An optional/advisory unavailable result follows exactly one selected bounded action: skip, owner-declared fallback, bounded defer/retry or typed terminal outcome. Observation timing cannot choose undeclared semantics.

CHANNEL-CONSUMER-005. Wrong-generation, stale, duplicate, late, expired, incompatible or failed results never publish source-owner success. They follow one selected reject/ignore/reclaim/fallback/terminal disposition with exact accounting.

CHANNEL-CONSUMER-006. Consumption cannot directly invoke a later producer, recursively progress another stage, call the host or hold a worker until completion. It may publish new ready work only through another admitted selected transition/channel.

CHANNEL-CONSUMER-007. Required result failure is mapped by its semantic owner to retry/fallback/partial/terminal meaning. The channel reports typed transport/lifecycle facts and does not invent evaluator/policy/product semantics.

## 8. Publication and synchronization semantics

CHANNEL-PUBLISH-001. Ready publication is one logical release operation ordered after complete payload/metadata initialization. Payload consumption begins only after a matching logical acquire operation observes the same generation-ready state.

CHANNEL-PUBLISH-002. The selected publication scope covers every actual device producer/consumer. Relaxed reservation/counter operations cannot substitute for the release/acquire edge protecting payload bytes.

CHANNEL-PUBLISH-003. Multi-word payload coherence derives from immutable initialization plus one matching release/acquire publication word/version protocol. Independent per-field atomics do not create a snapshot and cannot replace that protocol.

CHANNEL-PUBLISH-004. Concurrent non-atomic access to a location while another participant may mutate it is prohibited unless a separately accepted source-owner synchronization contract makes it safe.

CHANNEL-PUBLISH-005. Backend-neutral reference semantics model happens-before and reject stale/uninitialized payload reads independently of one CUDA spelling or queue layout.

CHANNEL-PUBLISH-006. Native restricted Device-JS qualification requires a public CUDA-JS capability that expresses the selected release/acquire order/scope naturally. [CUDA-JS #123](https://github.com/iteathen/CUDA-JS/issues/123) owns the currently identified device-scope helper gap; relaxed observation, fake RMW reads, undocumented fence recipes and CUDA-MCGS native code are non-conforming substitutes.

CHANNEL-PUBLISH-007. A profile using another future qualified CUDA-JS publication mechanism must bind its exact public contract/evidence identity without changing channel semantics or exposing CUDA internals in Search IR.

## 9. Readiness, dependency and progress composition

CHANNEL-PROGRESS-001. Every channel publishes exact work descriptors for producer, consumer, completion/reclamation and pending dependency classes consumed by SPEC-0012. The channel does not choose their service mechanism.

CHANNEL-PROGRESS-002. Every required pending dependency names at least one finite potential producer path or typed escape outcome. A dependency with no producer/escape rejects before ignition when statically knowable and becomes typed no-progress when dynamically established.

CHANNEL-PROGRESS-003. The composed dependency graph rejects synchronous cycles and resource-holding cycles in which no participant can publish. Advisory cycles are legal only when every cycle has a bounded skip/fallback escape.

CHANNEL-PROGRESS-004. Correctness-required producer and reclamation classes declare service/fairness obligations to SPEC-0012. Pending consumers cannot permanently starve their producers by consuming all worker/admission/resource capacity.

CHANNEL-PROGRESS-005. When no ordinary work is ready but a producer/escape is runnable, SPEC-0012 must be able to service it under the selected finite assumptions. When none can run, the engine reports typed no-progress/stop rather than waiting indefinitely.

CHANNEL-PROGRESS-006. Idle hardware while awaiting a legitimate device-side dependency is not itself failure. A worker-side wait, host decision dependency, unbounded unresolved item or unowned orphan is failure.

CHANNEL-PROGRESS-007. Schedule permutations may change permitted timing but not source-owner semantics, channel ownership conservation or terminal disposition unless an explicit selected owner contract makes timing a semantic input.

## 10. Capacity, pressure and resource accounting

CHANNEL-RESOURCE-001. Every channel contributes exact finite persistent item storage, payload/result storage, pending descriptors, reservations, borrows, counters, diagnostics, scratch/alignment and concurrency multiplicity to SPEC-0011.

CHANNEL-RESOURCE-002. Capacity and watermark selection is normalized before ignition and participates in identity. No hidden growth, heap allocation, spill, unplanned eviction or host-backed rescue is allowed.

CHANNEL-RESOURCE-003. Failed reservation has zero published-work and resource-count effect after rollback. Successful reservation, claim, completion, release and reclamation conserve exact item/resource accounting.

CHANNEL-RESOURCE-004. High/critical pressure uses explicit owner-selected actions such as stop optional admission, reduce bounded width, prioritize drain/reclamation, bounded fallback, typed exhaustion or valid partial/no-result stop. Pressure is data/state, never a blocking producer.

CHANNEL-RESOURCE-005. Product/capability channels consume their declared partitions/contributions and cannot silently consume graph safety, root-update or terminal-publication reserve outside the compound plan.

CHANNEL-RESOURCE-006. Cancellation/stop retains enough terminal reserve to classify every live item, release/retire it safely and publish allowed terminal output. Exhaustion cannot make cleanup unrepresentable.

## 11. Cancellation, stale work, expiry and teardown

CHANNEL-CANCEL-001. Each profile defines cancellation observation for reserved, ready, claimed/in-flight, result-ready, pending-consumer, terminal and late-completion states with one exact owner/disposition.

CHANNEL-CANCEL-002. Cancellation is idempotent, does not erase an earlier authoritative failure/stop cause, and does not publish success from an incomplete or stale item.

CHANNEL-CANCEL-003. Expiry uses a finite engine-owned epoch, work budget or generation rule unless an accepted owner explicitly supplies another device-resident time source. Host wall-clock polling is never required for active correctness.

CHANNEL-CANCEL-004. A source-owner validity key may include graph generation, policy/evaluator incarnation, output cut or Search Session root epoch. The source owner defines stale meaning; channel identity detects/carries it and progress owns service/abandon/closure.

CHANNEL-CANCEL-005. Optional SPEC-0006 coordinates root-transaction prepare/commit/abort and gathers owner stale dispositions. The channel does not become an external root-command transport or own reroot/reuse/reclamation policy.

CHANNEL-CANCEL-006. Late completion after cancel/stale/expiry follows one ignore/quarantine/reclaim/terminal-failure rule and cannot resurrect pending work or overwrite a newer generation.

CHANNEL-CANCEL-007. Teardown proves every reservation, item, payload/result, pending descriptor, borrow, source-owner lease and channel contribution is released, retired or explicitly quarantined under an owner before terminal zero residue is claimed.

## 12. External session, output and host boundaries

CHANNEL-BOUNDARY-001. External root/control commands, cancellation requests, observation requests/borrows and terminal result consumption are SPEC-0006/SPEC-0013/package operations, not Async Stage Channels, even if CUDA-JS realizes both with similar generic memory mechanisms.

CHANNEL-BOUNDARY-002. Terminal/live output publication remains SPEC-0013-owned. An internal channel may carry output work or source facts but cannot define payload selection, snapshot/cut consistency, slot publication or external borrow semantics.

CHANNEL-BOUNDARY-003. After ignition, no channel may depend on host micro-batching, callback progression, polling/relaunch, CPU-produced inference/selection or late allocation/compilation.

CHANNEL-BOUNDARY-004. Host observation of diagnostics or terminal state cannot reserve, claim, complete or otherwise advance an internal channel item unless an explicit bounded external semantic command under another owner authorizes the mutation.

## 13. Compatibility, failure and security

CHANNEL-IDENTITY-001. Channel compatibility requires matching ID/version, producer/consumer roles, payload schemas/owners, item state graph, generation/correlation/freshness, claim mode, publication requirements, capacity, consumption/fallback, cancellation/reclamation and public CUDA-JS capability requirements.

CHANNEL-IDENTITY-002. An incompatible change invalidates affected Search IR, generated source/package, reference and native evidence. Additive unselected channel definitions do not affect engines that do not select them.

CHANNEL-IDENTITY-003. Live channel items are never migrated or reinterpreted implicitly. A separately versioned pre-ignition migration may transform only terminal durable state under explicit validation/rollback authority.

CHANNEL-LIFE-001. Partial channel normalization/allocation/initialization publishes no valid channel and unwinds all task/runtime state under its owner. Previously valid immutable plans remain unchanged.

CHANNEL-LIFE-002. Unknown roles, schemas, permissions, generations, states, capabilities, resource/progress bindings or executable provenance fail closed before payload access or native work.

CHANNEL-LIFE-003. Public channel-facing records contain typed finite data and opaque owner handles only. They expose no raw CUDA pointer/handle, generated CUDA source/PTX/native artifact, unrestricted address authority or private source-owner representation.

CHANNEL-LIFE-004. Diagnostics are bounded, generation-correlated and cannot become a hidden unbounded log/queue or progression dependency. Counter exhaustion follows CHANNEL-ITEM-010.

## 14. Search IR, Composer and reference obligations

CHANNEL-IR-001. Search IR must represent every CHANNEL-PROFILE field, optional absence, item-state/role/permission graph, source-owner payload identity, finite contributions, progress descriptors, publication semantics, stale/cancel/expiry/reclaim behavior, compatibility and deletion inputs.

CHANNEL-IR-002. Normalization proves unique identities, role closure, legal state transitions, finite checked capacities, ownership conservation, matching publication scopes, required producer/escape paths, no resource-holding dependency cycle and exact absence when unselected.

CHANNEL-IR-003. The Composer emits selected restricted Device-JS behavior and public CUDA-JS capability requirements only through SPEC-0005. CUDA-JS owns atomic/publication lowering, native queues/operations/artifacts and their lifecycle.

CHANNEL-IR-004. Schema fields cannot replace missing owner semantics. An unowned payload, fallback, timing choice, stale rule or terminal disposition rejects rather than becoming implementation-defined.

## 15. Conformance and falsification

One consolidated CUDA-free channel capsule must cover at least:

1. unselected channel exact schema/source/resource/package absence;
2. ordinary single-producer/single-consumer publication with matching generation;
3. finite multi-producer and immutable multi-borrow modes with exact ownership accounting;
4. request/in-progress/result-ready correlation across stages/surfaces;
5. required unavailable result to pending with worker/mutable lease release;
6. optional skip, fallback and bounded defer/retry;
7. full capacity, failed reservation rollback and deterministic pressure;
8. producer progress while consumers are pending;
9. static dependency-cycle rejection and dynamic typed no-progress;
10. payload-before-ready/release and ready-before-payload-consume/acquire modeling;
11. mutation removing either publication edge causing oracle failure;
12. stale, duplicate, late, wrong-generation, wrong-version and expired result dispositions;
13. cancellation before reservation, reserved, ready, in-flight, result-ready and late completion;
14. root-epoch-scoped internal work becoming stale without becoming external session transport;
15. result/output work remaining internally carried while SPEC-0013 owns external publication;
16. product channel deletion with zero payload/resource residue;
17. materially different evaluator-like required flow and optional non-product secondary-work flow;
18. counter/generation exhaustion without alias;
19. host-progression and worker-spin mutations rejected; and
20. teardown with exact zero live channel/source-owner residue.

CHANNEL-CONFORMANCE-001. Reference cases assert semantic state, happens-before, ownership, conservation, progress and terminal disposition, not one schedule, ring layout, queue algorithm or CUDA topology.

CHANNEL-CONFORMANCE-002. Independent mutations must break generation checks, publication order, reservation rollback, claim accounting, pending-worker release, producer escape, stale rejection, cancellation and teardown and show the oracle fails.

CHANNEL-CONFORMANCE-003. Native qualification separately proves public CUDA-JS release/acquire lowering, actual device publication/races, selected operation/resource coexistence, cancellation/teardown and exact compatible-pair behavior. Portable/reference evidence is not native support.

## 16. Semantic acceptance blockers

This proposal cannot become accepted until:

- every normative requirement maps to strict normalized schema/validation and an independent CUDA-free reference case or explicit cross-specification proof;
- SPEC-0005 is decision-complete and its composition/package requirements agree with selected channel identity/deletion;
- SPEC-0011/0012/0006/0013 ownership boundaries are represented without duplicate channel authority;
- evaluator-like required-result and materially different optional secondary-work profiles pass, including first-consumer deletion;
- release/acquire, ownership, pressure, dependency/no-progress, stale, cancellation, counter exhaustion and teardown mutations fail independently; and
- `ENGINE-CONTRACT-ACCEPTANCE-01` accepts this contract atomically with its schemas, reference evidence and coupled proposal dependencies on one exact revision.

CUDA-JS #123 and an exact compatible pair remain mandatory before claiming a native internal-channel profile. Native publication/race, device progress/resource/performance, cancellation and platform evidence qualify concrete production profiles after semantic acceptance; they are not circular prerequisites for accepting backend-neutral channel meaning.
