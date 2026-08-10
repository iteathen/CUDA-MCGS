# Semantic Interrogation

**Scope:** Risk-proportional review of one coherent semantic code unit during sanity checking, implementation self-review, PR review, debugging, or audit.

## Purpose

Agents often review code descriptively: they explain what a block appears to do without challenging its authority, ownership, assumptions, state changes, callers, resources, failures, design-principle alignment, or system consequences.

Review the smallest semantic unit that preserves meaningful context. It may be:

- a function, method, branch, loop, callback, kernel, or state transition;
- a parser, validator, serializer, migration, or generator rule;
- a schema or public contract fragment;
- a build, layout, JIT/link, cache, or configuration rule;
- a queue, allocation, publication, cancellation, or resource-lifecycle protocol;
- a domain, policy, evaluator, output, graph, transposition, or memory-planning operation;
- a tightly coupled cluster that cannot be split without destroying the mechanism being judged.

A semantic unit is not necessarily one lexical block. Include enough surrounding contract, state, callers, dependencies, and terminal behavior to judge it. Do not review arbitrary line ranges that sever meaning, and do not group unrelated operations merely because they share a file.

## Answer states

Each material question ends as:

- `supported` — authority and evidence support the behavior;
- `supported_with_limits` — behavior is coherent within explicitly stated limits;
- `violated` — behavior conflicts with the governing invariant;
- `blocked` — required access, authority, or decisive evidence is missing;
- `not_applicable` — the concern cannot affect this unit, with a short reason;
- `invalidated` — the reviewed revision or dependency changed.

Silence is not `not_applicable`.

## Mandatory core

Every material semantic unit must answer the complete core below. Answers may be concise, but none may be silently skipped.

1. **Purpose and authority** — What exact result is intended? Which accepted specification, contract, schema, ADR, test oracle, or invariant authorizes it? Is the unit solving that requirement rather than a nearby or convenient one?
2. **Owner, layer, and LEGO boundary** — Which component owns the behavior, authoritative state, rules, and lifecycle? Is the unit in the correct product area and public/internal layer? Is it reaching through another owner or creating a second source of truth?
3. **Inputs, outputs, and effects** — What explicit and material implicit inputs exist? What values, mutations, host/device state, side effects, allocations, generated artifacts, resource transfers, and observable outputs result?
4. **Caller and dependency assumptions** — Who invokes or consumes it? What do callers assume? Which explicit dependencies are used, and what stale, partial, delayed, missing, reordered, incompatible, or failing behavior can they introduce?
5. **State, identity, and lifetime** — What authoritative or derived state is read or written? What identity, equality, collision, generation, continuity, and staleness rules apply? When is the state valid, visible, reusable, reclaimable, or released?
6. **Contract and foundational alignment** — Are semantic meaning, units, ranges, precision, cardinality, alignment, version, memory space, nullability, capacity, and defaults domain-appropriate and consistent with schemas, specifications, generated forms, callers, and consumers?
7. **Design-principle alignment** — Does the unit preserve singular ownership, LEGO ports/adapters/dependency direction, justified SOLID responsibilities, CUPID composability/predictability/idiom/domain naming, maximum accurate generality, second-instance behavior, first-consumer deletion, and simplest sufficient total-system design?
8. **Ordering, resources, and pressure** — What ordering, synchronization, publication, memory, queue, time, bandwidth, occupancy, contention, or backpressure assumptions exist? What happens at normal, high, critical, saturated, and unavailable-resource states?
9. **Failure, cancellation, cleanup, and terminal behavior** — How can the unit reject, partially succeed, retry, cancel, interrupt, overflow, saturate, fail asynchronously, or terminate? Can invalid state, leaked resources, stranded work, stale handles, partial publication, or false success escape?
10. **Simplest credible counterexample** — What smallest realistic input, schedule, capacity, version, second consumer, second domain, alternate evaluator, device profile, or failure would make the claimed behavior or boundary wrong?
11. **Cheapest decisive evidence** — Which focused authority inspection, test, trace, sanitizer, artifact comparison, reference result, or measurement distinguishes correct from incorrect behavior at the mechanism being claimed?
12. **Wider consequence horizon** — Which contracts, callers, generated forms, sibling implementations, runtime paths, resources, compatibility promises, lifecycle stages, or future intended consumers can be affected? What changes at roughly ten times scale, and where could complexity have been exported elsewhere?

The mandatory core is specifically designed to keep code aligned with accepted design principles and specifications. Triggered modules add detail; they do not replace the core.

## Triggered modules

Use a deeper module when the unit changes, depends on, or makes a material claim about that concern.

### Design principles, universality, and specialization

Trigger for framework contracts, Search IR, schemas, compiler/layout generation, public SDK, generic runtime, adapter contracts, shared primitives, or reusable names.

Check:

- Which first-domain, first-model, first-policy, first-output, first-consumer, or first-GPU assumptions could have leaked into names, schemas, defaults, layouts, tests, or failure behavior?
- Is the intended equivalence class explicit and truthfully named?
- Are permitted variation and excluded cases explicit?
- Does a second intended consumer/domain/hardware profile fit through configuration, profile, adapter, or already-authorized extension rather than foundational redesign?
- If the first consumer disappears, does the concept remain coherent and correctly owned?
- Can unused capabilities, fields, branches, and layouts be specialized away?
- Is variation represented by bounded contracts rather than arbitrary objects, strings, flags, callbacks, reflection, or a broad manager?
- Does physical fusion or inlining preserve conceptual ownership and contract conformance?
- Is the implementation the simplest sufficient total system, or has complexity merely moved to callers, generated code, memory, synchronization, migration, diagnostics, tests, or operations?

### Persistence, migration, cache, and recovery

Trigger for persisted state, schemas, versioned artifacts, generated-engine caches, model packages, save/load, migration, rollback, or recovery.

Check canonical schema/version, compatibility window, unknown values, deterministic and resumable migration, partial migration, durability before advancement, rollback/recovery, data-loss boundaries, complete cache identity, and silent reinterpretation of old state.

### Security, trust, privacy, native execution, and credentials

Trigger for untrusted input, authorization, secrets, permissions, privacy, JIT code, native capabilities, modules, files, network input, or executable artifacts.

Check caller authority, validation and resource bounds, authorization before effect, secret/address/generated-code exposure, capability lifetime/revocation, executable-memory policy, denial of service, cache/provenance identity, and fail-closed behavior.

### Concurrency, ordering, publication, and progress

Trigger for shared mutable state, atomics, multiple producers/consumers, asynchronous execution, wakeups, cancellation, graph execution, callbacks, worker threads, or host/device interaction.

Check execution owner, required order, linearization point, visibility and memory scope, fences/barriers, stale/duplicate/delayed/lost work, partial initialization, wakeups, output publication, cancellation cleanup, bounded backpressure, deadlock/livelock, occupancy constraints, and progress guarantees.

### External I/O, resources, and cleanup

Trigger for files, processes, sockets, databases, services, handles, listeners, locks, ports, accounts, or remote resources.

Check exact resource and owner, acquisition, bounds/timeouts/cancellation, partial failure, cleanup on every terminal path, idempotent release, external verification, and retained-state triggers.

### Performance and hot path

Trigger for latency, throughput, allocation, memory, contention, scale, batching, occupancy, or quality claims.

Check workload and synchronization boundary, measured baseline, same-work/quality/resource equivalence, repeated work, memory traffic, transfers, launch overhead, atomics, contention, divergence, batching, cache/TLB behavior, bounded degradation, cold preparation, profiler evidence, regression threshold, and search-quality preservation.

### Identity and lineage

Trigger for persisted identity, replacement/incarnation, stale handles, cross-boundary references, hashing, allocation, or reclamation.

Check identity domain, equality and continuity, state-derived versus continuing identity, collision/reuse/staleness/forgery, generation/incarnation, persistence horizon, and whether independent identity is actually required.

### Compatibility and public contract

Trigger for public API, schema, packet, data format, configuration, extension point, cache, model package, or promised compatibility.

Check old/new contract, producer/consumer and adapter behavior, version negotiation, migration, deprecation/removal, defaults, unknown values, silent reinterpretation, representative second consumers, and placement of compatibility logic behind owned adapters.

### Provenance, generated content, JIT, and ABI

Trigger for external source, donor material, generated code/data/layouts, build artifacts, JIT/linking, native interfaces, licenses, or packaged output.

Check exact source and revision, permission/license, canonical source versus generated output, deterministic regeneration, drift detection, schema/toolchain/runtime/cache identity, type widths, alignment, calling convention, architecture capability, ABI probes, package contents, attribution, and prohibited/quarantined material exclusion.

### Destructive or difficult-to-reverse behavior

Trigger for deletion, force update, history rewrite, irreversible migration, publication, revocation, compaction without recovery, or difficult reconstruction.

Check exact authority and target identity, required checkpoint, demonstrated recovery tier, point of no return, races, partial-failure intervals, rollback/recovery, post-operation verification, and disposition of superseded state.

### GPU, device closure, and finite resources

Trigger for kernels, device queues, memory, CUDA graph/stream execution, driver APIs, launch/callback behavior, device allocations, or active search control.

Check memory-space ownership, lifetime, transfer and synchronization boundaries, driver/device capability, launch and asynchronous errors, device loss, queue/arena/table/path/workspace limits, memory-plan completeness including fragmentation/diagnostics, pressure state machine, cancellation, completion, teardown, progress under occupancy/resource reservation, and whether active progress secretly depends on host computation, polling, allocation, inference submission, or tactical/domain work.

### Graph and search semantics

Trigger for state/action identity, transpositions, cycles, paths, nodes/edges, expansion, selection, reservation, backup, rerooting, terminal/proof state, stopping, or output ranking.

Check state identity/history/collision verification, state-node versus parent-edge ownership, transpositions, path/graph cycles, node roles, action production, transition semantics, selection/reservation, duplicate work, backup perspective/discount/reduction/proof semantics, evaluator interaction, solved/terminal propagation, reroot/reachability/reclamation, outstanding-path safety, stopping, and output ranking.

### Evaluator, model, and numeric semantics

Trigger for evaluator contracts, encoders/decoders, resident model execution, batching, policy/proposal output, value/distribution output, uncertainty, or auxiliary tensors.

Check declared capabilities including absent outputs, shapes/layouts/dtypes, units, perspective, normalization, masking, calibration, legal-action mapping, model/code/workspace residency, batch profiles and tail handling, queue starvation, NaN/infinity/overflow/underflow/invalid probabilities, storage versus accumulation precision, policy-only/value-only/non-neural/alternate-output cases, deterministic tolerances, and search-quality consequences.

### Diagnostics and accountability

Trigger for logs, traces, metrics, snapshots, reports, assertions, audit state, or debug instrumentation.

Check whether each diagnostic answers a real question; volume, cardinality, memory, synchronization, retention, and drop behavior; timing/ordering perturbation; leakage; whether diagnostics remain derived rather than becoming a second authority/control plane; and whether temporary diagnostics are removed or adopted with an owner and budget.

## Exhaustive depth

Exhaustive interrogation is justified only for critical trust/data-loss boundaries, incidents, hostile audits, difficult concurrency/recovery, unusually opaque high-blast-radius code, or an explicitly selected critical coverage branch.

State why exhaustive depth is necessary, which decision it supports, and which additional question families or complete enumerations are required. Do not equate questionnaire length with review quality.

## Findings

A semantic finding states:

- exact frozen revision, coverage branch, and semantic unit;
- governing specification, contract, schema, ADR, or invariant;
- expected behavior;
- actual conflicting or uncertain mechanism;
- consequence and affected callers, paths, resources, and lifecycle;
- decisive evidence and confidence;
- blocking classification and severity;
- smallest acceptable remediation or evidence requirement;
- wider manifestations and owning component;
- affected review branches and validation required after remediation.

Find the earliest failed invariant. Avoid prescribing broad redesign when a smaller owner-level correction is sufficient. Do not hide findings in a mostly empty questionnaire.

## Completion

The unit is reviewed when:

- all mandatory core questions are answered;
- every objectively triggered module is resolved or explicitly blocked;
- material counterexamples were tested or bounded;
- specifications and design principles were compared to the actual mechanism rather than merely cited;
- findings and uncertainty are exact;
- wider consequences and reconciliation obligations are recorded;
- the conclusion is no broader than the evidence;
- the frozen revision remains valid.

Use [`../templates/semantic-review.template.yaml`](../templates/semantic-review.template.yaml) only when the branch is critical, independently assigned, or must survive a context/session boundary.
