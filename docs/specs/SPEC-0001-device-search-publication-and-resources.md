# SPEC-0001: Device Search Publication, Graph Identity, and Finite Resources

**Status:** Accepted

**Version:** 0.1.0

**Accepted:** 2026-08-11 under the project owner's explicit MCGS assessment-and-fix direction

**Owner:** CUDA-MCGS search-contract integration spine

## 1. Purpose and scope

This specification defines the backend-neutral semantic obligations for publication, graph identity, path cycles, search accounting, finite-resource reservation, exhaustion, partial results, and scheduler comparison in a device-resident CUDA-MCGS engine.

It applies to Search IR, generated device programs, reference interpreters, search conformance, and CUDA-MCGS execution-package semantics. A concrete engine may specialize or fuse representations, but it MUST preserve these observable semantics.

This specification does not define:

- a concrete Search IR serialization or generated ABI;
- a production scheduler, graph layout, transposition-table algorithm, or CUDA primitive;
- domain identity, transition, evaluator, backup-value, or output-ranking policy;
- generic CUDA compilation, memory allocation, launch, completion, or teardown behavior owned by CUDA-JS;
- multi-device publication, which requires an explicit scope profile beyond version 0.1.0.

Production lowering remains blocked until the consuming Search IR, domain, policy, evaluator, resource-profile, and execution-package specifications are accepted.

## 2. Normative authority

This specification is governed by:

- [`../PROJECT_CHARTER.md`](../PROJECT_CHARTER.md);
- [`../decisions/ADR-0002-universal-contracts-specialized-engines.md`](../decisions/ADR-0002-universal-contracts-specialized-engines.md);
- [`../decisions/ADR-0003-device-resident-active-search.md`](../decisions/ADR-0003-device-resident-active-search.md);
- [`../decisions/ADR-0014-extract-cuda-js-runtime.md`](../decisions/ADR-0014-extract-cuda-js-runtime.md).

[`SPEC-0000-framework-requirements.md`](SPEC-0000-framework-requirements.md) is proposal input and an index of future specification families; it is not normative authority over this accepted contract.

## 3. Terms and owners

- **Semantic state** is a contract-visible lifecycle state. Its numeric encoding is generated-layout detail.
- **Publication channel** is one producer-to-consumer visibility edge for a state and its owned payload.
- **Ready** means the complete payload is visible to an acquiring consumer and will not be reinterpreted for that incarnation.
- **Claim** is exclusive authority to initialize or mutate a not-yet-ready unit.
- **Incarnation** distinguishes reuse of a storage slot. A stale reference MUST NOT resolve to a later incarnation.
- **State identity** is domain-owned equality plus collision verification. A hash alone is not identity.
- **State node** is the graph-owned shared representative of one verified state identity.
- **Parent edge** is a policy-owned decision relationship and its incoming-edge-local statistics.
- **Active path** is the ordered node/edge sequence owned by one in-flight simulation or equivalent work item.
- **Partial result** is a terminal result derived only from completely published work after a non-normal stop.

Ownership is singular:

| Fact | Owner |
|---|---|
| State equality, identity inputs, and collision verification | Domain contract |
| State-node incarnation and graph validity | Graph/storage contract |
| Parent action, edge-local reservation, visits, values, and ranking inputs | Search-policy contract |
| Active-path membership and selected cycle response | Path and policy contracts |
| Evaluator request/output meaning | Evaluator contract |
| Capacity partition, admission, pressure, exhaustion, and partial-result class | Resource contract |
| Semantic publication channels and their lowering obligations | Search execution contract |
| CUDA atomics, fences, streams, events, and generic runtime lifecycle | Generated backend and CUDA-JS public runtime contracts, not the universal search contract |

## 4. General publication rules

PUB-001. Every payload read by another device participant MUST have one declared publication channel with producer, consumers, semantic states, payload owner, visibility scope, failure states, and progress rule.

PUB-002. A producer MUST fully initialize the payload before publishing `ready` with release semantics at the declared scope. A consumer MUST observe `ready` with acquire semantics at that scope before reading the payload.

PUB-003. In the v0.1.0 single-device profile, the visibility scope MUST include every participating thread on the search device. A block-only or warp-only edge is non-conforming when consumers can run outside that scope.

PUB-004. An implementation MAY use CUDA atomics, fences, ownership transfer, a queue protocol, or another proven mechanism. Public Search IR MUST express the semantic edge rather than require a particular backend atomic type or instruction.

PUB-005. A consumer MUST NOT infer readiness from allocation, a non-null reference, a claimed identity key, a visit count, queue presence, or a separately published field.

PUB-006. Waiters MUST also observe the channel's failed/cancelled state and the search stop state. A channel MUST NOT contain an unbounded wait whose producer can terminate without publishing a terminal state.

PUB-007. At most one terminal publication is authoritative for one channel incarnation. Conflicting ready payloads are a semantic publication failure and MUST produce bounded diagnostics without silently selecting one.

PUB-008. Reused storage MUST change incarnation or otherwise prove stale references impossible before a later payload can become ready.

## 5. Required publication channels

A concrete engine MUST declare every selected channel below. A capability that is absent is omitted explicitly rather than represented by an accidentally unused field.

| Channel | Minimum semantic states | Ready payload |
|---|---|---|
| Identity slot | `vacant → claimed → ready | failed` | verified identity and state-node reference/incarnation |
| State node | `reserved → initializing → ready | failed` | domain state representation and graph metadata required by consumers |
| Expansion | `unexpanded → claimed → ready | failed` | complete action range/proposal continuation and edge identities |
| Child binding | `unbound → ready | failed` | child state-node reference/incarnation for one parent edge |
| Evaluator output, when selected | `absent → claimed/queued → ready | failed | cancelled` | complete typed evaluator output and validity metadata |
| Backup eligibility | `reserved → value-ready → applied | abandoned` | path-local result and the accounting ownership needed for exactly-once disposition |
| Stop | `running → stop-requested → draining → terminal` | first authoritative cause plus drain/result disposition |
| Result | `unavailable → publishing → ready | failed` | bounded result, completion class, resource status, and diagnostics |

The generated lowering MAY collapse states only when the omitted distinction is impossible under the selected capabilities and the conformance evidence proves the same lifecycle and failure semantics.

## 6. Graph identity, edges, cycles, and backup

GRAPH-001. Transposition lookup MUST verify domain state identity before returning an existing state node. Hash equality without collision verification is insufficient.

GRAPH-002. One ready state identity maps to at most one live state-node incarnation in the selected transposition scope.

GRAPH-003. Incoming parent edges remain distinct even when they bind to the same state node. Edge-local visits, reservations, values, priors, proofs, or policy metadata MUST NOT be collapsed into node identity.

GRAPH-004. A transition resolves or creates child state identity before active-path cycle policy is applied. A globally known state is not automatically a cycle for the current path.

GRAPH-005. Path membership is evaluated against the active path and selected history semantics. The cycle response MUST state whether it cuts off, transforms a value, creates a repetition outcome, continues with bounded history, or fails the capability profile.

GRAPH-006. A graph cycle MAY remain as a valid published edge even when a particular active path cuts off at that edge.

GRAPH-007. Backup operates over the exact path-local edge/node sequence defined by the policy. Reserved/in-flight edge use and completed visit/value statistics MUST be distinguishable. A selection consumer MUST NOT treat an in-flight reservation as a completed value observation unless the policy explicitly defines that behavior.

GRAPH-008. Every reserved backup contribution terminates as exactly one of `applied` or `abandoned`. Completion, cancellation, exhaustion, and failure MUST preserve accounting conservation.

## 7. Finite-resource model

RES-001. Every concrete engine has an immutable pre-ignition capacity for each enabled resource class. At minimum, applicable classes include state nodes, parent edges, state bytes, action bytes, transposition slots, active paths/path depth, work queues, evaluator batches/workspace, outputs, and diagnostics.

RES-002. Admission MUST be atomic with respect to the resource's capacity. A successful reservation consumes only units inside the declared capacity. A failed reservation consumes no capacity and MUST NOT inflate a published/live count.

RES-003. One counter MUST NOT ambiguously represent reservation attempts, live reservations, ready objects, failures, retirements, and high-water state.

For each resource class, the engine MUST expose or derive the following meanings where applicable:

- immutable `capacity`;
- current `claimed` units not yet published;
- current `published` live units;
- current `retired_unreclaimed` units;
- cumulative `failed_reservations`;
- maximum observed live allocation `high_water`.

RES-004. The conservation invariant is:

```text
0 <= claimed + published + retired_unreclaimed <= capacity
high_water <= capacity
failed_reservations does not consume capacity
```

Specialized engines MAY omit a zero/impossible category, but MUST preserve the invariant and unambiguous meaning.

RES-005. Capacity, identifier width, generation width, and counter width are derived from the concrete resource profile. The v0.1.0 contract imposes no universal 16-node, two-action, 32-bit-index, or first-GPU limit.

RES-006. No active-search operation may allocate outside the accepted memory plan or write beyond a reserved range. Integer overflow in admission or accounting is a pre-ignition rejection or a typed terminal failure, never wraparound.

## 8. Pressure, exhaustion, stop, and partial results

STOP-001. Exhaustion is a typed semantic outcome identifying the exhausted resource class. It is not reduced to a generic CUDA allocation or launch error.

STOP-002. The safe v0 baseline on terminal exhaustion is:

1. reject the failed admission without consuming capacity;
2. publish the first authoritative stop cause;
3. admit no new work requiring the exhausted resource;
4. drain or abandon already claimed work according to its channel contract;
5. publish either a valid partial result or an explicit no-valid-result outcome;
6. publish terminal state only after all result-visible writes are ready.

A future policy MAY continue refining already published graph state under pressure, but it MUST define admission, fairness, stopping, and output validity explicitly.

STOP-003. A valid partial result contains only ready nodes, edges, evaluator outputs, and applied backup contributions. Claimed, failed, abandoned, or stale-incarnation data MUST NOT affect ranking or reported completed work.

STOP-004. A partial result MUST report its completion class, first stop cause, completed-work count, relevant capacities/high-water marks/failures, and whether the requested stopping budget was satisfied.

STOP-005. Schedule-dependent numbers of drained completions MAY vary after a concurrent stop. Capacity bounds, graph validity, accounting conservation, result class, and cause ownership MUST remain invariant.

## 9. Search IR and generated lowering

IR-001. Future Search IR MUST represent each selected publication channel by stable semantic identity, producer role, consumer role, payload owner, state transitions, required visibility scope, terminal/failure behavior, and progress/stop dependency.

IR-002. Future Search IR MUST represent graph identity ownership, parent-edge statistics ownership, active-path/history cycle policy, backup disposition, resource classes/capacities, counter meanings, pressure policy, stop causes, and partial-result classes.

IR-003. Search IR MUST NOT expose CUDA atomic classes, raw pointers, memory-order enum spellings, Worker/Node behavior, or CUDA-JS private handles as universal search meaning.

IR-004. Generated lowering MUST select mechanisms that implement the declared semantic edges for the target architecture/toolchain/profile. Its cache and evidence identity MUST include every input capable of changing those mechanisms or layouts.

IR-005. Lowering verification MUST reject an undeclared producer/consumer edge, insufficient visibility scope, a payload read before acquire, a wait without terminal progress, a counter without resource meaning, or an enabled resource without exhaustion behavior.

## 10. Scheduler neutrality and selection

SCHED-001. Search semantics MUST NOT require thread-per-simulation, global ticket atomics, warp ownership, block ownership, device graph launch, dynamic parallelism, or a persistent work queue.

SCHED-002. Scheduler candidates are compared under identical domain, policy, evaluator, resource profile, stopping budget, output oracle, and publication/resource obligations.

SCHED-003. Parallel correctness uses stable semantic invariants. Exact visit distribution, cycle count, drained-completion count after stop, or selected trajectory MUST NOT be required unless the policy explicitly guarantees determinism.

SCHED-004. A production scheduler selection requires representative workload and evaluator evidence, exact resource/memory effects, synchronization/contention/occupancy mechanism evidence, semantic and search-quality equivalence, and bounded cleanup. A toy scheduler comparison can reject or motivate mechanisms but cannot select production architecture.

## 11. Conformance

The owning search conformance capsule MUST provide stable case IDs and per-case discovery/skip accounting for:

1. `ordinary-serial` — ordinary completion and accounting conservation;
2. `parallel-publication` — contended publishers/consumers with valid ready payloads and no conflict;
3. `transposition-node-edge-ownership` — one shared state node reached by distinct parent edges with distinct edge-local statistics;
4. `path-cycle-after-identity` — identity resolution precedes a path-local cycle outcome;
5. `forced-resource-exhaustion` — deterministic typed exhaustion, bounded counters/references, and valid partial-result classification;
6. `scheduler-semantic-parity` — at least two scheduler mechanisms preserve the same stable invariants before a production selection;
7. `oracle-sensitivity` — a plausible identity, publication, accounting, or output violation is rejected.

Every enabled resource class MUST have boundary/exhaustion coverage before its production profile is accepted. Compatible cases SHOULD share one generated artifact/device setup while isolating mutable search state.

The exact evidence key includes CUDA-MCGS source and test revisions, generated binary/package identity, domain/policy/evaluator/resource profile, compiler/toolkit/driver/runtime, GPU architecture/device, build options, workload/seed or schedule policy, command, and test tier.

Native CUDA publication work requires the strongest available bounded race/memory checking appropriate to the claimed mechanism. Tool timeout, unsupported global-memory coverage, or incomplete schedules MUST be reported as incomplete evidence and MUST NOT be converted into a clean race claim.

## 12. Compatibility, failure ownership, and cleanup

This contract is versioned independently of a generated layout. A later version that changes semantic state meaning, graph ownership, counter conservation, exhaustion behavior, or partial-result validity is incompatible unless an accepted translation proves equivalence.

CUDA-MCGS owns semantic failures such as identity conflict, publication conflict, path/accounting violation, typed search-resource exhaustion, or invalid partial result. CUDA-JS owns generic compilation, allocation, module, launch, context-health, completion-delivery, and teardown failures under its public contract. One failure may cause the other boundary to stop, but ownership MUST remain attributable.

All task and runtime state receives an explicit disposition. Device allocations, queues, modules, events, diagnostics, and host resources are released or deliberately retained through their owning contract. Experiment source may be retained as bounded evidence but MUST NOT be imported by production components.

## 13. Current implementation disposition

The deleted CUDA-only prototype is summarized as non-executable historical provenance in [`../archive/experiments/2026-08-11-cuda-device-mcgs-prototype.md.txt`](../archive/experiments/2026-08-11-cuda-device-mcgs-prototype.md.txt). Its useful semantic findings are owned here and by CUDA-free Search IR/reference evidence; it is not a current mutation fixture, production lowering, scheduler, graph store, resource planner, conformance adapter or CUDA-JS integration.

No production implementation is authorized by this specification alone.
