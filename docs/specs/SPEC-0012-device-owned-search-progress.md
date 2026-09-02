# SPEC-0012: Device-Owned Search Progress and Closure

**Status:** Proposal

**Draft version:** 0.1.0

**Owner:** CUDA-MCGS universal device-owned progress semantics

**Product area / durable path:** universal MCGS semantic core / `docs/specs/`

**Consumers:** Search Session and framework contracts; Search IR; Search Composer; every selected work producer/consumer; deterministic reference and native conformance

This proposal defines the product-neutral progress brick that owns device-side work readiness, service/fairness, typed no-progress, stopping/drain and closure semantics. It does not select a persistent kernel, queue, CUDA Graph, cooperative launch, stream topology, exact interleaving or host relaunch loop.

## 1. Authority, identity, and applicability

Specification identity is `CUDA-MCGS-SPEC-0012@0.1.0-draft`.

Every finite engine selects exactly one normalized progress profile covering every selected domain, graph, policy, evaluator, output, resource, session and capability/product work class. A removed owner contributes no work class, readiness edge, resource or dispatcher residue.

Normative dependencies are ADR-0002, ADR-0003, ADR-0005, ADR-0018 and ADR-0019; accepted [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) and [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md); and integrated proposals [`SPEC-0007`](SPEC-0007-domain-state-action-and-transition.md), [`SPEC-0008`](SPEC-0008-search-policy-and-backup.md), [`SPEC-0009`](SPEC-0009-evaluator-contract.md), [`SPEC-0010`](SPEC-0010-graph-storage-and-reclamation.md), [`SPEC-0011`](SPEC-0011-finite-search-resources.md) and [`SPEC-0013`](SPEC-0013-result-and-observation-publication.md).

Proposal [`SPEC-0004`](SPEC-0004-async-stage-channels.md) is informative extension-dataflow adjacency; it does not own engine-wide progress. Proposal [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) is informative external-lifecycle adjacency. Accepted authority governs conflicts. This proposal authorizes no production implementation.

## 2. Purpose and reading map

The required outcome is one semantic owner proving that after ignition every admitted work item either receives permitted device-side service and reaches a terminal disposition, remains legitimately pending on a producer/control fact with a finite escape, or produces a typed no-progress outcome—without host participation or physical scheduler meaning leaking into core contracts.

Sections 3 through 10 form one coupled normative contract; sections 11 through 14 govern identity, conformance and invalidation.

The contract must support single/multiple work classes, evaluator absence, batching, cycles/transpositions, resource recovery, one-shot and optional live sessions, schedule-dependent policies and distinct physical schedulers while preserving stable semantic invariants.

## 3. LEGO ownership and public boundary

The progress invariant is:

> Every admitted work incarnation has one declared readiness/dependency/service/terminal lifecycle; every pending dependency has a possible finite producer or terminal escape, ready work cannot be stranded by the progress profile, must-drain work reaches completion or typed fatal quarantine, and terminal closure is published only after all result-visible obligations are resolved.

Progress owns work-class descriptors, ready/pending/service states, readiness propagation, fairness/service guarantees, no-progress classification, stop/drain ordering, closure detection and progress diagnostics. It does not own work payload meaning, policy choice, resource capacity, graph reclamation, evaluator batching semantics, output payload, session control, or CUDA execution mechanisms.

The semantic ports are `admitWork`, `publishReady`, `claimReady`, `yieldPending`, `completeWork`, `failWork`, `cancelWork`, `observeProgress`, `requestStop`, `classifyNoProgress` and `publishClosure`. They are not mandatory functions, kernels or ABI symbols.

Injected dependencies are public owner transitions, resource leases/pressure, stop/control epochs and selected finite profile constants. Progress cannot inspect private payloads, invent semantic work, allocate outside the plan, use raw CUDA pointers, call host callbacks or deep-import CUDA-JS.

Deleting chess, evaluator, live observation, optional capabilities, a queue implementation or one scheduler leaves progress coherent. Splitting readiness from closure would create competing liveness truth; merging semantic work policy or physical scheduling into progress would couple independent bricks.

## 4. Terms

A **work class** is a normalized owner-defined finite transition kind with input readiness, output/terminal states, resource needs, cancellation points and service contract. A **work incarnation** is one stale-safe admitted instance.

`pending` means a declared prerequisite is not ready and a producer/escape remains possible. `ready` means all service prerequisites and resources required to claim are available. `claimed/running` means one device participant owns the service attempt. `terminal` means completed, failed, cancelled, abandoned, stale-disposed or, for irreversible result-visible work, quarantined exactly once. `quarantined` is the typed fatal terminal disposition used when such work cannot safely report completion.

A **progress step** is a finite owner transition that completes work, changes a dependency/readiness/resource fact, advances a bounded continuation, or contributes to stop/drain/closure. A **service opportunity** is a scheduler-neutral chance for a ready class/item to attempt such a step.

**Deadlock** is a nonterminal wait-for set with no possible producer/escape. **Livelock** is boundedly detected repeated service without declared semantic potential change. **Starvation** is ready work denied the selected fairness guarantee. **Quiescence** is no ready/running work; it is terminal only when no legitimate pending producer/control obligation remains.

## 5. Profile normalization and work graph

PROGRESS-PROFILE-001. The profile declares every work class ID/version/owner, input/output states, readiness predicate, dependencies/producers, resource claim, finite step/continuation, service/fairness class, cancellation/stale/stop behavior, diagnostics and cleanup.

PROGRESS-PROFILE-002. Unknown/duplicate owners/classes, ambiguous readiness, missing producer/terminal escape, cyclic mandatory wait, unbounded step/wait/retry, resource-less recovery, fairness contradiction, insufficient counter width or missing closure condition rejects specialization.

PROGRESS-PROFILE-003. Meaning-insensitive classes/edges normalize canonically; owner-required order/priority remains explicit. Every progress-affecting input contributes to profile identity.

PROGRESS-PROFILE-004. Host composition may use Node.js. Active progress uses restricted Device-JS/Search Program through public CUDA-JS. CUDA-MCGS may not use native code, direct FFI, hand PTX, a subprocess or host launch/poll callbacks to advance work.

PROGRESS-PROFILE-005. A missing naturally generic GPU progress/synchronization/lifecycle primitive stops for consumer-neutral CUDA-JS capability classification with bounded resources and qualification; no awkward CUDA-MCGS workaround is allowed.

PROGRESS-GRAPH-001. Every pending edge names exact producer class/fact, publication/incarnation, failure/cancel/stop escape and whether the dependency is required/advisory.

PROGRESS-GRAPH-002. Mandatory wait cycles are rejected unless at least one finite independently ready transition breaks the cycle. Advisory cycles require bounded skip/fallback.

PROGRESS-GRAPH-003. A class cannot require its own output or unavailable resource to publish the fact that releases that resource. Recovery/drain paths use reserved capacity from SPEC-0011.

PROGRESS-GRAPH-004. Work production is bounded per step and admission. Fan-out, retries and continuations have finite maxima/accounting; logical open search does not create unbounded instantaneous work.

PROGRESS-GRAPH-005. A removed owner/capability deletes its classes/edges/counters/resources/code; remaining closure does not wait for absent work.

## 6. Admission, readiness and service

PROGRESS-WORK-001. Admission validates class/profile, owner payload reference/incarnation, root/work epoch, required resources and representable identity before publishing a work incarnation.

PROGRESS-WORK-002. Admission/accounting conserves `admitted = pending + ready + claimed/running + terminal`; failed admission is not live work and each admitted item reaches exactly one terminal disposition. Each normalized work-class declaration includes every terminal disposition reachable from that class's generic Progress operations, result-visibility semantics and selected stop disposition; `service` and `drain` stop behavior do not invent an additional terminal state.

PROGRESS-WORK-003. Ready publication follows complete prerequisite writes with required visibility. Queue presence, reserved resources, non-null payload or producer start never imply ready.

PROGRESS-WORK-004. Claiming ready work atomically validates readiness/incarnation and grants one service owner or an explicitly idempotent cooperative claim. Failed/stale claims do not mutate owner payload.

PROGRESS-WORK-005. Each service attempt performs one finite step, publishes a continuation/terminal state, or yields pending with exact dependency; it cannot busy-wait while holding a worker/resource needed by its producer.

PROGRESS-WORK-006. Retry/resumption has stale-safe identity and idempotence. It cannot duplicate domain transition, graph publication, evaluator result, policy backup, output capture or resource release.

PROGRESS-WORK-007. Owner failure meaning is preserved. Progress routes/terminates it but cannot reinterpret failure as domain outcome, policy value, resource exhaustion or valid output.

## 7. Fairness and scheduler-neutrality

PROGRESS-FAIR-001. The profile selects and precisely defines fairness per class: bounded service gap, weak fairness for continuously ready work, strong fairness for repeatedly ready work, explicit priority with starvation escape, or another finite testable contract.

PROGRESS-FAIR-002. Must-drain, producer-unblocking, stop/cleanup and terminal-output work receive sufficient service to preserve closure; ordinary priority cannot starve the only producer or release path.

PROGRESS-FAIR-003. Batching cannot wait forever for an unattainable size. A ready partial batch/item receives service under a declared device-visible threshold/opportunity rule without host timeout.

PROGRESS-FAIR-004. Priority/attention changes are bounded external control inputs applied at a declared device-side point. They may reweight service within profile bounds but cannot specify internal next steps or become a host micro-scheduler.

PROGRESS-FAIR-005. Correctness and stable result/resource/publication invariants do not require exact visit distribution, trajectory, item order or drained count unless a selected policy explicitly guarantees it.

PROGRESS-FAIR-006. Persistent kernels, global queues/tickets, work stealing, per-block/warp ownership, CUDA Graphs, dynamic/cooperative launch, streams or multiple operations are optional later mechanisms, never semantic requirements.

## 8. No-progress classification

PROGRESS-NOPROGRESS-001. When no work is ready, the device-visible classifier accounts for every admitted pending/running item, possible producer, external-control wait permitted by session, resource-recovery path, stop/drain obligation and terminal fact.

PROGRESS-NOPROGRESS-002. Outcomes distinguish `terminal-quiescent`, `legitimate-external-wait`, `recoverable-resource-wait`, `producer-pending`, `deadlock`, `livelock`, `starvation`, `orphaned-work`, `stale-only`, `counter-exhausted` and namespaced exact equivalents.

PROGRESS-NOPROGRESS-003. Legitimate external wait exists only for a selected live-session state explicitly awaiting optional root/attention input; it cannot hold active internal search work that requires the host to continue.

PROGRESS-NOPROGRESS-004. Deadlock proof uses the normalized wait-for graph/current terminal states and publishes bounded owner/class/dependency evidence. Absence of queue entries alone is insufficient.

PROGRESS-NOPROGRESS-005. Livelock detection uses a finite declared potential/progress epoch or bounded repeated-transition counter. A schedule-dependent search trajectory is not livelock merely because a chosen metric did not improve.

PROGRESS-NOPROGRESS-006. Starvation detection is relative to the selected fairness contract and service-opportunity accounting, not wall-clock host observation.

PROGRESS-NOPROGRESS-007. A fatal no-progress outcome requests stop, prevents new ordinary admission, preserves first cause, services mandatory drain/cleanup/output and cannot wait for host diagnosis.

## 9. Stop, cancellation, epochs and closure

PROGRESS-STOP-001. Stop lifecycle is `running → stop-requested → draining → terminal`. First authoritative cause is immutable; later failures are separate dispositions.

PROGRESS-STOP-002. After stop, no new ordinary resource-dependent search work is admitted. Ready/must-drain/release/terminal-output work receives service; other work follows owner-declared abandon/cancel/stale disposition.

PROGRESS-STOP-003. Once irreversible result-visible backup/publication begins, must-drain reaches complete or typed fatal quarantine. Cancellation cannot create false completion.

PROGRESS-STOP-004. Root/session epoch change atomically changes admission authority; old work cannot publish into new-epoch state and is drained/discarded/reused only under owner classifications.

PROGRESS-STOP-005. Closure requires every admitted work item terminal/disposed, every required channel producer/waiter terminal, all result-visible owner transitions ready/quarantined, resource conservation reconciled and terminal output publishable.

PROGRESS-STOP-006. Observation request/read/ack, host polling and transfer completion are never prerequisites for internal closure, except bounded teardown of an already authorized output borrow after search has semantically ended.

PROGRESS-STOP-007. Generation/progress/service counters never wrap; before alias the engine restarts/new-incarnates or terminates typed.

## 10. Resources, lifecycle and security

PROGRESS-RESOURCE-001. Progress contributes finite descriptors/queues/frontiers/claims/continuations, readiness bits, fairness/service counters, wait-graph/no-progress state, stop/drain/closure records, diagnostics and per-worker scratch.

PROGRESS-RESOURCE-002. SPEC-0011 owns capacities/reserves/admission. Progress cannot create hidden queues, spill to host, consume terminal reserve or strand cleanup behind ordinary saturation.

PROGRESS-LIFE-001. Lifecycle is `profile-normalized → resources-admitted → initialized → running → draining → terminal → released`, with fatal/quarantine paths.

PROGRESS-LIFE-002. Teardown stops admission, terminally disposes all work/waiters/claims, reconciles resources and final diagnostics, then releases opaque CUDA-JS operations/resources in dependency order.

PROGRESS-LIFE-003. Applicable statuses include `invalid-progress-profile`, `work-capacity`, `work-stale`, `producer-unavailable`, `progress-deadlock`, `progress-livelock`, `progress-starvation`, `orphaned-work`, `progress-counter-exhausted`, `progress-cancelled` and `progress-internal-failure` with exact pending/stop/fatal meaning.

PROGRESS-SEC-001. Profiles/descriptors/control inputs are untrusted until strict owner/schema/version/range/resource/permission validation. Work receives least-authority typed views, never raw pointers/CUDA handles/callbacks/private paths.

PROGRESS-SEC-002. Bounded diagnostics expose work class/owner/state/dependency/counter/cause without arbitrary payload/device memory. Corrupt accounting or conflicting closure quarantines evidence; recovery cannot edit counters to appear complete.

PROGRESS-LIFE-004. No universal worker count, queue depth, service quantum, step count, fairness bound, counter width or first-GPU limit is imposed; each finite profile selects ranges or rejects specialization.

## 11. Compatibility and Search IR

PROGRESS-COMPAT-001. Compatibility requires matching class/owner/dependency/readiness, step/continuation, fairness/priority, no-progress, stop/drain/closure, resource and epoch meaning—not one scheduler name.

PROGRESS-COMPAT-002. Package identity binds normalized work graph/profile, bounds/resources, fairness/no-progress/closure and restricted Device-JS inputs. CUDA-JS scheduler/artifact/ABI identity remains opaque and separately bound.

PROGRESS-IR-001. Search IR represents every work class, readiness/dependency/producer/terminal edge, resource claim, service/fairness class, retry/cancel/stale, no-progress and stop/drain/closure obligation.

PROGRESS-IR-002. Search IR contains no raw pointer, CUDA atomic/queue/stream/event/Graph/cooperative spelling, kernel topology, exact worker mapping or host callback.

PROGRESS-IR-003. Normalization rejects missing producer/escape, mandatory wait cycle, unbounded step/retry/wait, fairness starvation, missing cleanup reserve, counter insufficiency and closure that ignores selected work.

PROGRESS-IR-004. Work owners retain payload semantics; resource owns capacity; session owns external control; progress consumes only public transitions. Removing owners deletes their progress residue.

## 12. Conformance and oracles

The CUDA-free reference is authoritative for work-graph/readiness/fairness/no-progress/closure semantics under declared schedules. Native evidence later proves real device progress/publication/cancellation/teardown for an exact CUDA-JS pair. Throughput or one successful kernel is not a liveness oracle.

Required cases include:

| Case ID | Required falsifier |
|---|---|
| `progress-profile-strict-normalization` | Missing producer/escape/fairness/closure or reachable terminal disposition is accepted. |
| `progress-ready-after-publication` | Work runs on incomplete payload. |
| `progress-pending-yields-worker` | Waiter spins while blocking producer. |
| `progress-accounting-conservation` | Admitted work disappears/duplicates. |
| `progress-mandatory-wait-cycle` | Cyclic unpublished requirements start. |
| `progress-producer-unblocking-fairness` | Consumers starve their producer. |
| `progress-partial-batch-device-flush` | Evaluator requires host timeout/launch. |
| `progress-must-drain-priority` | Stop starves irreversible backup. |
| `progress-deadlock-vs-quiescence` | No queue entry falsely claims terminal/deadlock. |
| `progress-livelock-potential` | Repeated no-effect work runs forever. |
| `progress-starvation-contract` | Continuously ready class violates declared fairness. |
| `progress-resource-recovery-reserve` | Saturation prevents freeing capacity. |
| `progress-first-stop-cause` | Later cause overwrites first. |
| `progress-stale-epoch-isolation` | Old work publishes into new epoch. |
| `progress-observation-no-progression` | Host read/ack unlocks search. |
| `progress-closure-complete` | Terminal publishes with live work/waiter/resource. |
| `progress-scheduler-semantic-parity` | Two mechanisms violate stable invariants. |
| `progress-owner-deletion-zero-residue` | Removed evaluator/observation/capability leaves work. |
| `progress-oracle-sensitivity` | Removing readiness/fairness/closure or terminal-transition guards still passes. |

Fixtures cover serial and parallel schedules, evaluator absence/batching, graph cycles, resource pressure/recovery, stop during backup, stale root-advance work, optional observation, deadlock/livelock/starvation and at least two mechanism-neutral scheduler models.

Native qualification additionally verifies visibility, contended claims, fairness/no-progress bounds, stop/root/cancel races, device closure, resource conservation and cleanup. Production scheduler selection requires representative workload/search-quality/occupancy/contention evidence while freezing semantics.

## 13. Examples (informative)

A serial dispatcher, persistent work loop, statically fused stepper or multi-operation schedule may conform. A policy-only engine omits evaluator work; a full batch that never fills still services a partial batch by its device-visible rule. None selects the production scheduler.

## 14. Acceptance blockers and invalidation

Decision completeness requires no unresolved work owner/readiness/dependency, fairness, no-progress, stop/drain/closure, epoch, resource, range, compatibility, security or cleanup ambiguity.

Acceptance remains blocked until Search IR represents all PROGRESS-IR obligations; deterministic reference executes all cases under multiple schedules and oracle mutation; Search Session reconciles external wait/control/epochs; deletion checks pass; natural profiles are classified against public CUDA-JS without native workaround; the integrated packet is reviewed at `ENGINE-CONTRACT-ACCEPTANCE-01`; and documentation validation passes.

Production lowering remains prohibited. Native mechanism/performance evidence qualifies selected scheduler profiles later.

Changing work ownership/readiness/dependency, fairness, no-progress, stop/drain/closure, epoch or resource meaning invalidates session/framework contracts, Search IR/normalizers, generated packages, scheduler evidence and approvals. The integration spine reconciles invalidation.

Implementation, testing, review, security, generated/JIT/ABI, performance and cleanup trigger specialist doctrine from root agent authority.
