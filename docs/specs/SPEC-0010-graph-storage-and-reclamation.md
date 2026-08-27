# SPEC-0010: Graph Storage, References, Transpositions, Paths, and Reclamation

**Status:** Proposal

**Draft version:** 0.1.0

**Owner:** CUDA-MCGS universal graph/storage semantics

**Product area / durable path:** universal MCGS semantic core / `docs/specs/`

**Consumers:** search policy, evaluator, finite-resource, device-progress, result/observation and Search Session contracts; Search IR; Search Composer; domain/product adapters; deterministic reference and native conformance

This proposal defines the backend-neutral graph/storage brick that owns graph objects, typed references, transposition publication, active paths, storage incarnations and safe reclamation. It stores domain/policy/evaluator/output-owned values through declared layouts without interpreting their meaning and does not select a table, arena, allocator, scheduler, CUDA primitive or native implementation.

## 1. Authority, identity, and applicability

Specification identity is `CUDA-MCGS-SPEC-0010@0.1.0-draft`.

This specification applies when a finite CUDA-MCGS engine materializes or retains searched states, parent-local transitions, active paths or transposition identity. A profile that deliberately materializes no reusable graph still selects the zero/minimal applicable graph profile and proves that all inapplicable storage disappears without weakening reference/publication/resource obligations for retained work.

Normative dependencies are:

- [`ADR-0002`](../decisions/ADR-0002-universal-contracts-specialized-engines.md) for universal contracts and finite specialized engines;
- [`ADR-0003`](../decisions/ADR-0003-device-resident-active-search.md) for device-owned active search;
- [`ADR-0005`](../decisions/ADR-0005-lego-design-hierarchy.md) for one-owner LEGO boundaries;
- [`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md) for core/extension/product separation;
- [`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) for JavaScript/restricted Device-JS production ownership and CUDA-JS capability escalation;
- accepted [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) for publication, state-node/parent-edge ownership, identity-before-cycle ordering, finite-resource and stop foundations;
- accepted [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) for foundational normalized Search IR/reference meaning within its current scope; and
- proposal [`SPEC-0007`](SPEC-0007-domain-state-action-and-transition.md) for domain state/action identity, relevant history, roles, transitions and terminal outcomes.

Proposal [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) and retained SESSION-001 results are informative adjacency for root-advance/reclamation and stale-reference evidence. Implementations, experiments and products remain evidence beneath this proposal.

Accepted authority governs conflicts. This proposal does not supersede another specification and is not production implementation authority.

## 2. Purpose, reading map, and required outcome

The required outcome is one graph-owned semantic boundary through which unrelated domains and policies can share verified states, retain distinct parent edges, traverse path-local occurrences and reclaim finite storage safely without any storage mechanism becoming universal meaning.

Sections 3 through 15 form one coupled normative contract. Sections 16 through 20 govern compatibility, conformance, evidence and invalidation. A consumer of one graph object must also honor reference generations, publication, resource and reclamation rules.

The contract succeeds only if a transposing DAG, a cyclic/history-sensitive directed graph, a stochastic multigraph and a no-reclamation fixed-arena profile fit through different finite specializations without changing graph meaning.

## 3. LEGO ownership and design boundary

### 3.1 Exact owned invariant and state owner

The graph contract owns this invariant:

> Every live graph object and path occurrence has one finite storage incarnation, typed validity state and publication lifecycle; equal domain state views share at most one ready node in a declared transposition scope, unequal views never merge, parent-local edges remain distinct, and reclaimed storage cannot be reached through stale references.

The selected graph profile owns:

- state-node, parent-edge, expansion, active-path, transposition-entry and retirement-record storage identity;
- typed graph references, slots, generations/incarnations and validity checks;
- object reservation, initialization, publication, failure, retirement and reuse states;
- transposition lookup/claim/collision verification/publication mechanics at the semantic level;
- parent-edge linkage and child-reference publication;
- path-occurrence storage and lifetime protection;
- opaque owner-record storage ranges and layout binding;
- graph-root anchors/protection, not Search Session root policy/epoch meaning; and
- reclamation eligibility, quiescence proof, generation-safe slot reuse and storage cleanup.

### 3.2 Explicit non-ownership

The graph contract does not own:

- domain state/action/history/role/transition equality or interpretation;
- policy selection, widening decisions, cycle response, edge/node statistics, reservations, backup, stopping or reuse semantics;
- evaluator inputs/outputs, cache validity or proposal meaning;
- result/observation payload selection or publication semantics;
- Search Session root-update authority, root epoch, stale-work policy or external control;
- global resource partition policy, pressure strategy, scheduler/progress algorithm or cancellation policy;
- CUDA allocation, atomics, streams, events, kernels, Graphs, JIT/link/load, operation lifecycle or native teardown; or
- product concepts, extension payload meaning or persistent application data policy.

Graph storage may contain policy/evaluator/output/extension records only as declared opaque owner regions. Their owners define initialization, mutation, publication, reuse/reset/transform/invalidate and semantic cleanup. Physical fusion does not transfer that authority to graph storage.

### 3.3 Public semantic ports and injected dependencies

The universal graph ports are:

1. `lookupOrClaimNode` — use a domain identity key, verify candidates through `equalState`, reserve one node incarnation when absent and return typed winner/waiter/pressure outcomes;
2. `publishNode` / `failNode` — complete or terminally fail one reserved node incarnation;
3. `reserveEdge` — reserve one parent-local edge/owner-record range under a declared edge-admission identity;
4. `publishEdgeAction`, `publishEdgeChild` and `failEdge` — publish action and resolved child linkage in declared order;
5. `openExpansion`, `publishExpansionBatch` and `closeExpansion` — store finite action-production progress without interpreting its cursor or policy meaning;
6. `openPath`, `appendPathOccurrence`, `readPathView` and `closePath` — own finite active-path occurrences and their protection;
7. `protectRootAnchor` / `releaseRootAnchor` — protect a graph reference supplied/selected by Search Session or one-shot search lifecycle;
8. `retire`, `proveQuiescent` and `reclaim` — separate logical invalidation, safety proof and physical slot reuse; and
9. `validateReference` — reject wrong-kind, wrong-arena, wrong-incarnation, stale-generation, out-of-range or non-live references.

These are semantic ports, not mandatory unfused calls or ABI symbols. Search Composer may specialize/fuse/eliminate them while preserving observable meaning and owner boundaries.

Injected dependencies are public domain identity/equality/history ports, owner-declared record layouts/lifecycles, the composed finite resource plan, device-progress services and public CUDA-JS realization contracts. Graph storage must not inspect a provider's private type/module/path, discover dependencies, allocate outside the plan or call a host callback.

### 3.4 Equivalence class, deletion tests and total-system simplicity

Permitted realizations include open addressing, chaining, cuckoo-like or custom transposition indexes; packed or segmented arenas; fixed/variable records; reference counts, epochs, hazard/lease schemes or no reclamation; and fused or modular generated programs. None is contract meaning until selected and qualified for a concrete profile.

Deleting every production product, any particular output/evaluator shape, optional extensions, persistence, reclamation or transposition reuse leaves the applicable graph boundary coherent. Deleting graph storage from a stateless profile removes its solely owned residue; deleting it from a materializing profile removes the only owner of references/publication/reclamation and therefore invalidates that profile rather than transferring ownership.

Splitting references, transpositions and reclamation into independent authorities would create competing definitions of liveness and reuse. Merging policy/resource/session behavior into storage would make one representation decide unrelated semantics. This graph brick is the simplest sufficient owner.

## 4. Terms and object model

### 4.1 Graph profile and arena incarnation

A **graph profile** is the immutable normalized selection of object kinds, layouts, capacities, reference fields, transposition scope, publication transitions, path protection and reclamation mode for one engine/package identity.

An **arena incarnation** is one finite lifetime of admitted graph storage. It has a non-wrapping identity within its declared scope. Destroying/reinitializing an arena creates a distinct incarnation even if it reuses the same physical allocation.

### 4.2 State node

A **state node** is the graph-owned shared representative of one verified domain state-view identity in a declared transposition scope. It stores a declared domain payload region, graph metadata and zero or more opaque owner-record regions. It is not a path occurrence, parent edge, policy value or evaluator result.

### 4.3 Parent edge

A **parent edge** is one parent-local transition record containing a domain-valid action identity/occurrence, child-link publication state, graph metadata and declared opaque owner regions. Two parents may point to the same child node while retaining independent edges and policy-owned statistics.

### 4.4 Expansion

An **expansion record** is graph-owned storage/lifecycle for the currently published set/range of parent edges plus action-source progress such as a domain/evaluator-owned cursor. Graph owns completeness/publication state, not the cursor's meaning, widening/admission policy or action distribution.

### 4.5 Active path and occurrence

An **active path** is a finite ordered sequence of graph occurrences used by one logical in-flight search work item. Each occurrence references a state node and optional incoming edge plus declared domain-history and policy-owned path-local regions. The path protects referenced objects from reclamation but does not turn an occurrence into a unique node.

### 4.6 Transposition entry and scope

A **transposition entry** maps a domain identity-key candidate to one graph node incarnation and carries enough publication state to prevent readers from treating incomplete payload as ready. A **transposition scope** declares which engine/session/persistence namespace may reuse verified equal states.

### 4.7 Typed graph reference

A **typed graph reference** identifies object kind, arena/incarnation, slot or bounded offset and generation sufficient to reject stale aliasing. Its concrete encoding is profile-selected. A public or persistent reference is never a raw device/host pointer.

### 4.8 Retirement, quiescence and reclamation

**Retirement** prevents new semantic admissions to an object. **Quiescence** proves no protected root, active path, in-flight operation, owner lease/borrow, publication waiter or retained observation can access it. **Reclamation** runs owner dispositions, removes index reachability and makes storage eligible for generation-advanced reuse. These are distinct transitions.

## 5. Graph-profile normalization and validity

GRAPH-PROFILE-001. The normalized profile declares, with no unknown fields:

- stable profile ID/version and arena-incarnation scope;
- enabled object kinds and exact fixed/variable layout families;
- capacities, byte pools, alignments, units, identifier/offset/generation widths and checked formulas;
- typed reference encoding/validation and non-wrap exhaustion behavior;
- state-node, edge, expansion, path, transposition and retirement lifecycles;
- transposition identity-key schema, scope, collision-probe bound and full-index outcome;
- domain/policy/evaluator/output/extension owner-region schema IDs, layout digests and lifecycle ports;
- path depth/count/record bounds and protection semantics;
- reclamation mode, protection sources, retirement/quiescence/reuse rules and finite scratch;
- publication producer/consumer roles, visibility requirements and terminal states;
- failure codes, diagnostics and cleanup; and
- persistence/compatibility policy when selected.

GRAPH-PROFILE-002. Missing/unknown/duplicate fields, overlapping owner regions, misalignment, unit ambiguity, insufficient widths, impossible minima, arithmetic overflow, unreachable publication terminal state, unbounded probe/path/wait/reclamation work or undeclared pressure rejects specialization before ignition.

GRAPH-PROFILE-003. Meaning-insensitive collections normalize canonically; meaning-sensitive region/order fields preserve declared order. Defaults are explicit values. Every graph-meaning/layout-affecting field contributes to normalized identity.

GRAPH-PROFILE-004. Owner regions name stable public schema/layout/lifecycle identities, never a private implementation type, deep import, JavaScript object, CUDA pointer or current provider path.

GRAPH-PROFILE-005. Host validation/composition may use ordinary Node.js. Active graph work uses restricted Device-JS/Search Program inputs through public CUDA-JS contracts. CUDA-MCGS graph code may not use C/C++, CUDA C++, native addons/FFI, hand-written PTX, embedded CUDA source or CUDA-JS-private implementation.

GRAPH-PROFILE-006. If a safe graph realization needs a naturally generic GPU primitive that CUDA-JS cannot express directly with bounded resources, synchronization, lifecycle and qualification, work stops for CUDA-JS capability classification. It does not justify a native CUDA-MCGS implementation or distorted storage semantics.

## 6. Typed references, generations and validation

GRAPH-REF-001. Every reference-consuming port establishes kind, arena/incarnation, representable slot/offset, generation and applicable lifecycle validity before payload access or mutation. A generated internal access may discharge a check statically only when the compiler proves provenance and lifetime and conformance preserves that proof; externally supplied, persisted or otherwise untrusted references require runtime validation.

GRAPH-REF-002. A slot generation changes before a reclaimed slot can identify a new object. A reference to an older generation is `stale-reference` and can neither read, mutate, protect nor publish the replacement object.

GRAPH-REF-003. Generation/incarnation counters never silently wrap. At exhaustion the slot becomes non-reusable, the arena/session requires typed restart/replacement or the engine terminates according to the selected resource/session contract.

GRAPH-REF-004. Concrete references may compile to compact indices/offsets plus generations when the profile proves sufficient range and validation. This contract imposes no universal 32-bit index, pointer width, generation width or one-GPU limit.

GRAPH-REF-005. Raw addresses may exist only inside CUDA-JS-owned qualified realization and derived bounded internal access. They are not Search IR identity, persistent identity, domain data, diagnostics or public CUDA-MCGS API values.

GRAPH-REF-006. Failed validation has no graph-semantic side effect and returns a typed cause. Repeated stale/invalid access may escalate under security/failure policy but cannot be silently redirected to a current object.

GRAPH-REF-007. Owner-local references stored inside an opaque region declare whether graph reclamation must validate/fix/release them through an owner lifecycle port. Graph storage must not inspect or rewrite them by private layout knowledge.

GRAPH-REF-008. Acquiring a root/path/work/owner protection has one declared ordering point with retirement: it either validates a live incarnation and establishes protection before retirement can pass, or fails without protection. A check-then-pin race that can protect already-reclaimable storage is prohibited; releases are stale-safe and occur exactly once.

## 7. State-node lifecycle and transposition publication

GRAPH-NODE-001. A node incarnation follows `free → reserved → initializing → ready | failed → retiring → reclaimable → free-with-new-generation`, with inapplicable reclamation transitions removed only by profile specialization. No consumer reads domain or owner payload before `ready` acquire.

GRAPH-NODE-002. `lookupOrClaimNode` first uses the domain identity key to find candidates and calls domain `equalState` for collision verification. Hash/key equality alone cannot return an existing node.

GRAPH-NODE-003. Within one transposition scope, at most one ready live node incarnation represents one equal domain state view. Concurrent claimers either become the unique initializer, wait/pending-observe that incarnation's terminal publication, find a ready equal node or receive typed pressure/failure.

GRAPH-NODE-004. Node claim reserves all required graph/domain/owner byte ranges and transposition capacity through a declared compound admission protocol before ready publication. Partial reservation either rolls back exactly or remains an explicitly owned non-ready claim with bounded terminal resolution; it never appears as published capacity.

GRAPH-NODE-005. The unique initializer writes the complete immutable domain state/history payload and required graph metadata, invokes every owner initialization declared as structural-node-ready input through public lifecycle ports, publishes payload visibility and only then publishes node `ready`.

GRAPH-NODE-006. Initialization failure publishes `failed`, wakes/pends no consumer indefinitely, removes or terminally marks the transposition claim and dispositions every reservation. A conflicting ready payload for one incarnation is a fatal publication error.

GRAPH-NODE-007. Transposition index saturation/probe exhaustion returns typed `transposition-capacity`/`transposition-probe-exhausted`. It cannot silently overwrite, evict, merge, allocate overflow or treat an incomplete claim as absent.

GRAPH-NODE-008. A profile may disable transposition sharing or scope it narrowly, but equal-state uniqueness and collision verification remain exact within whatever scope it declares. A no-sharing profile may materialize separate nodes only by assigning distinct declared scopes/incarnations.

GRAPH-NODE-009. Graph node storage is immutable for domain state/history after ready. Opaque policy/evaluator regions may mutate only under their owning contracts and cannot change domain identity in place.

GRAPH-NODE-010. Node `ready` proves structural graph and required domain payload validity only. It does not imply that separately published policy/evaluator/output/extension records are ready; each such record retains its own channel/incarnation and consumer acquire requirement.

GRAPH-NODE-011. A transposition entry lifecycle is `empty → claimed → ready | failed/tombstone → empty-or-reused-incarnation`. Entry `ready` is published only after its referenced node is ready/acquirable; failed/tombstone entries cannot be returned as equal ready nodes.

## 8. Parent edges, action occurrences and expansion

GRAPH-EDGE-001. Every edge belongs to exactly one parent node incarnation. Edge identity includes the parent scope plus the composed domain-action identity/occurrence rule required by SPEC-0007 and the selected policy; graph storage does not decide whether repeated samples aggregate or remain distinct.

GRAPH-EDGE-002. One child node may have zero, one or many incoming parent edges. Policy-owned reservations, visits, values, priors or ranking inputs are parent-edge/node owner records and are never implicitly shared merely because child state is transposed.

GRAPH-EDGE-003. An edge lifecycle declares at least `free → reserved → action-ready → child-pending → ready | failed → retiring/reclaimable`, specialized only when equivalent publication/failure meaning is preserved.

GRAPH-EDGE-004. A domain-valid action/occurrence is completely published before a transition consumes it. The child reference is published only after transition output resolves/claims a ready or pending-valid child node under Section 7.

GRAPH-EDGE-005. Expansion publication exposes only complete action/edge records. A batch cursor/status remains owned by its domain/evaluator producer; graph records its bytes and generation while policy owns whether/when another batch is admitted.

GRAPH-EDGE-006. Unique-action modes reject a duplicate equal action under the same parent/expansion identity. Repeatable-sample/custom multiplicity follows the composed domain/policy rule and must be represented explicitly rather than inferred from byte duplication.

GRAPH-EDGE-007. Edge/expansion failure or cancellation publishes a terminal state, conserves reservations, leaves no ready child link to incomplete data and cannot strand policy/progress consumers in unbounded wait.

GRAPH-EDGE-008. Graph storage may use contiguous, indirect, segmented or another finite edge layout. No layout may make a later action batch impossible unless the normalized policy/resource profile explicitly declares that finite limit and pressure outcome.

GRAPH-EDGE-009. One parent expansion generation follows `unexpanded → claimed → open | complete | failed/cancelled`. Each published batch has a separate finite incarnation ending `ready` or terminal failure. At most one claimer advances the same expansion generation; consumers can distinguish an open producer from complete enumeration and observe failure/cancellation without waiting indefinitely.

GRAPH-EDGE-010. Structural edge `ready` proves its domain-valid action/occurrence and child-link payload only. Separately published policy/evaluator/output/extension owner regions retain their own readiness/failure channels and cannot be consumed merely because the edge is structurally ready.

## 9. Active paths, cycles and history projections

GRAPH-PATH-001. Every active path has a typed path reference/incarnation, finite capacity/depth and lifecycle `free → active → completing | abandoned | failed → released`. Path reuse advances a stale-safe generation when required by the profile.

GRAPH-PATH-002. Appending an occurrence validates all node/edge references, reserves path capacity, stores declared domain-history/policy-local regions and establishes reclamation protection before the occurrence becomes visible.

GRAPH-PATH-003. One graph node may occur multiple times on one path or across many paths. Node identity does not by itself decide cycle/repetition behavior.

GRAPH-PATH-004. Transition resolution obtains or claims the child domain identity/node before active-path relation handling. The graph then supplies a bounded public path view of domain identity/history projections to domain `classifyPathRelation`; policy owns cut/continue/transform/fail/backup response.

GRAPH-PATH-005. Graph storage does not interpret domain history bytes or policy path-local records. It owns bounds, references, publication, protection and ordered occurrence access only.

GRAPH-PATH-006. Path depth/capacity exhaustion returns typed pressure before an out-of-bounds occurrence or partial path publication. The policy/resource contract decides cutoff, stop or failure; graph does not silently truncate a semantically required path.

GRAPH-PATH-007. Closing/abandoning a path dispositions owner-local reservations, releases object protections exactly once and publishes a terminal path state before reuse.

GRAPH-PATH-008. A self-loop, directed cycle, DAG transposition, stochastic parallel transition and history-distinct equal-base-state case must all be representable without changing node/edge/path ownership.

## 10. Root anchors, root advance and retained graph state

GRAPH-ROOT-001. A graph root anchor is a protected typed node reference. Search Session or one-shot lifecycle owns which anchor is current, the root epoch and root-update commit; graph owns anchor validity/protection storage.

GRAPH-ROOT-002. Resolving a replacement root uses the same domain validation, compound graph admission, identity verification and publication rules as other nodes before Search Session commits a new current root.

GRAPH-ROOT-003. A rejected/full-capacity replacement-root attempt leaves the prior protected root and accepted graph/session state unchanged. Resource/session profiles may reserve root-admission capacity or choose typed failure/restart, but graph cannot allocate hidden capacity.

GRAPH-ROOT-004. Logical root advance and reclamation are separate transitions. Publishing a new root/epoch does not immediately prove old nodes unreachable or safe to reuse.

GRAPH-ROOT-005. Domain/policy/evaluator/output/extension owners classify retained records as retain, retain-if-key-valid, transform, reset or invalidate. Graph executes storage disposition through public lifecycle ports without inventing reuse semantics.

GRAPH-ROOT-006. Old-root/epoch work may still protect graph objects while its root-relative publications are rejected by Search Session/policy. Graph reclamation waits for protection/quiescence even when the work's semantic result will be abandoned.

## 11. Retirement, quiescence and reclamation

GRAPH-RECLAIM-001. Reclamation is optional. A no-reclamation profile retains all published objects until arena teardown and terminates/pressures at finite capacity; it contains no reclaim queues, generations or traversal residue used solely for reclamation.

GRAPH-RECLAIM-002. A reclamation-enabled profile declares the reachability/protection root set, traversal/incremental-work bounds, retirement ordering, quiescence mechanism, owner disposition ports, transposition removal/tombstone rule, slot generation advance and failure recovery.

GRAPH-RECLAIM-003. Retirement prevents new admissions/links/protections according to the profile but does not invalidate existing protected references. Readers see a typed retiring state and follow declared completion/abandonment behavior.

GRAPH-RECLAIM-004. An object is reclaimable only after no protected root, active path occurrence, in-flight producer/consumer, publication waiter, owner lease/borrow, retained observation/result or external/persistent reference can access it.

GRAPH-RECLAIM-005. Transposition/index reachability is removed or changed to a non-returnable tombstone before slot storage can represent another node. Concurrent lookup cannot observe the replacement under the old domain identity/generation.

GRAPH-RECLAIM-006. Owner regions complete retain/transform/reset/invalidate cleanup before the graph releases their storage. Graph may coordinate but cannot zero/free bytes while an owner-declared lease or cleanup effect remains live.

GRAPH-RECLAIM-007. Reclamation may run incrementally during active search only through device-owned progress with finite admitted work/scratch and without requiring host polling/relaunch. It cannot starve required search producers or block on a host observation consumer.

GRAPH-RECLAIM-008. Failure/cancellation during reclamation leaves each object in a valid retained, retiring, quarantined or reclaimable state with exact reservation accounting. Half-reused slots and ambiguous transposition entries are prohibited.

GRAPH-RECLAIM-009. Reclamation mechanism selection requires evidence for stale-reference/ABA safety, publication ordering, progress, occupancy interaction, cancellation and teardown. SESSION-001 supports the semantic need but does not qualify a native mechanism.

## 12. Lifecycle, ordering, concurrency and publication

GRAPH-LIFE-001. Graph lifecycle is `profile-normalized → resources-admitted → arena-initialized → active → draining → terminal → arena-released`, with typed failure/quarantine paths. No graph object outlives its arena incarnation unless a separately accepted persistence contract reconstructs it.

GRAPH-LIFE-002. Every object/channel declares producer, consumers, payload owner, initial/ready/terminal states, required visibility, bounded wait/progress and stop/cancellation behavior as required by SPEC-0001.

GRAPH-LIFE-003. Reservation and initialization writes remain private until release publication; consumers acquire readiness before payload access. The graph owns semantic state transitions, while CUDA-JS owns the qualified generic atomic/memory/operation realization.

GRAPH-LIFE-004. Concurrent operations may touch shared metadata only through declared atomic/reduction/ownership transitions. Opaque owner-region concurrency follows its own contract; graph access permission does not authorize semantic mutation.

GRAPH-LIFE-005. No blocking wait is permitted when a producer can fail/cancel/terminate without ready publication. Consumers move to explicit pending/terminal work states so device-owned progress can run required producers or stop handling.

GRAPH-LIFE-006. Cancellation and stop reject new resource-dependent admissions, allow declared ready/drain work, abandon unready work safely, terminate publication channels and preserve valid partial-result inputs according to SPEC-0001.

GRAPH-LIFE-007. Arena teardown begins only after active work/protection/owner leases are terminal or explicitly quarantined. CUDA-JS generic resources/operations are destroyed through public lifecycle contracts after graph-owned state can no longer access them.

## 13. Finite resources, pressure and failure

GRAPH-RESOURCE-001. The graph profile contributes finite units/formulas/maxima for all selected classes, including as applicable:

- state-node, parent-edge, expansion and transposition slots;
- domain state/history/action byte arenas;
- opaque policy/evaluator/output/extension record regions;
- active paths, occurrence depth/bytes and protection records;
- variable-record offset/index metadata and fragmentation reserve;
- free/reservation/initialization/publication state;
- retirement/quiescence/reclaim queues, marks and traversal scratch;
- root-anchor reserve;
- generations/incarnations/counters; and
- bounded diagnostics and owner-cleanup scratch.

GRAPH-RESOURCE-002. Graph contributions describe storage/protocol need but do not own global partition/admission policy or CUDA allocation. The finite-resource contract composes all owners before ignition.

GRAPH-RESOURCE-003. Compound reservations define an acyclic acquisition/rollback protocol or an equivalent atomic admission. Failure consumes no published capacity and releases every acquired unit exactly once.

GRAPH-RESOURCE-004. Each graph capacity exposes exact reserved/published/retired/available/exhausted accounting and a typed exhaustion cause. The finite-resource contract owns composed high/critical watermarks and response policy. Graph cannot use unplanned managed memory, host spill, allocation growth, silent eviction, unbounded probe/list/diagnostic or hidden emergency storage.

GRAPH-RESOURCE-005. Applicable graph failures include `invalid-graph-profile`, `invalid-reference`, `stale-reference`, `reference-kind-mismatch`, `arena-incarnation-mismatch`, `node-capacity`, `edge-capacity`, `state-byte-capacity`, `action-byte-capacity`, `path-capacity`, `path-depth`, `transposition-capacity`, `transposition-probe-exhausted`, `generation-exhausted`, `publication-conflict`, `owner-lifecycle-failure`, `reclamation-not-quiescent`, `cancelled` and `graph-internal-failure`.

GRAPH-RESOURCE-006. Policy/resource/progress/session owners decide whether recoverable pressure retries, degrades, stops with valid partial result, requires restart or fails. Graph never converts resource failure into a domain terminal outcome, policy value or implicit eviction.

GRAPH-RESOURCE-007. Checked arithmetic and bounds validation precede every reservation/access. Unsupported required ranges reject specialization rather than truncate. This contract imposes no universal node/edge/path/table count, byte width, offset width, generation width or first-GPU limit.

GRAPH-RESOURCE-008. Diagnostics are bounded, stale-safe and non-authoritative. They expose semantic references/counters rather than raw addresses or private owner payloads.

## 14. Recovery, cleanup and retained state

GRAPH-CLEANUP-001. Every failed/cancelled claim, edge, expansion, path and reclaim operation receives one terminal disposition; no non-ready reservation, waiter, protection, tombstone or owner lease is abandoned.

GRAPH-CLEANUP-002. A publication conflict, equality inconsistency, generation alias or uncertain owner cleanup quarantines affected objects/arena and invalidates dependent evidence. Recovery cannot continue by guessing which payload/reference is authoritative.

GRAPH-CLEANUP-003. Arena release reconciles object counts, byte ledgers, index entries, paths/protections, retirement queues, owner regions and diagnostics before CUDA-JS resource destruction. A clean process exit alone is not proof.

GRAPH-CLEANUP-004. Retained graph/persistence artifacts have explicit owner, compatible profile/package identity, recovery purpose and cleanup trigger. Temporary/generated/native evidence follows repository cleanup/provenance policy.

## 15. Security, trust and provenance

GRAPH-SEC-001. Graph profiles, persisted graph data, domain/owner layouts and incoming references are untrusted until strict schema/version/range/digest/provenance validation passes.

GRAPH-SEC-002. All memory access is derived from validated typed references and admitted ranges with checked arithmetic. Invalid/stale references fail closed before dereference or mutation.

GRAPH-SEC-003. Owner regions are least-authority: graph receives only layout/lifecycle ports needed for storage coordination; owners receive only declared object-local ranges/ports. Physical co-location does not authorize cross-region access.

GRAPH-SEC-004. Persistent or diagnostic forms cannot serialize raw pointers, credentials, private provider paths, unchecked executable schemas or unbounded private payloads.

GRAPH-SEC-005. Third-party table/arena/reclamation implementation reuse requires exact revision, license, provenance and security review. Methodology comparison does not authorize source adoption.

## 16. Compatibility, persistence and generated identity

GRAPH-COMPAT-001. Graph compatibility requires compatible graph-profile, domain-profile and every stored owner-layout/lifecycle identity. Matching slot counts or struct sizes is insufficient.

GRAPH-COMPAT-002. Search Composer/package/cache identity binds normalized graph semantics/layout, reference encoding, capacities, transposition/reclamation profiles, domain identity and owner-region digests. CUDA-JS native artifact/ABI identity remains opaque and separately bound by the execution package.

GRAPH-COMPAT-003. Changing reference fields/widths, generation behavior, object lifecycle, transposition scope/equality dependency, owner-region layout, path protection or reclamation invalidates generated packages, persisted graphs, caches, native/reference evidence and affected review approvals.

GRAPH-COMPAT-004. Persistence is optional. A persistent profile defines canonical relocation-safe encoding, namespace/version, integrity/checksum, crash-consistent publication, partial-write recovery, migration/rollback, reference reconstruction, owner-region persistence/cleanup and compatibility with domain/policy/evaluator/package identity.

GRAPH-COMPAT-005. In-memory layout and physical addresses are never automatically durable format. Loading validates every object/reference/index entry before publication; an invalid artifact is rejected/quarantined without partial live graph mutation.

GRAPH-COMPAT-006. Root-advance reuse within a live arena is not persistence and does not imply cross-engine/package compatibility.

## 17. Search IR, schema and downstream obligations

GRAPH-IR-001. Complete Search IR represents graph object kinds/lifecycles, typed reference/incarnation/generation semantics, layouts/owner regions, capacities, transposition scope/identity verification/publication, edge/expansion/path meaning, root protection, reclamation mode, failures, cleanup and persistence when selected.

GRAPH-IR-002. Search IR names semantic producer/consumer/owner identities and visibility without requiring an unfused call, C/C++ type, CUDA symbol, raw pointer, current JavaScript module, table algorithm, allocator or scheduler.

GRAPH-IR-003. Normalization rejects unknown/duplicate owners, overlapping/unaligned regions, ambiguous units, insufficient ranges, missing terminal publication/progress, unbounded probes/paths/reclamation and meaning-affecting identity omissions.

GRAPH-IR-004. Policy must declare edge/node/path-local owner records and multiplicity/reuse behavior without graph interpretation. Evaluator/output/extensions do the same for stored records/leases. Resource/progress/session contracts consume graph contributions/transitions rather than redefine them.

GRAPH-IR-005. Removing a product/capability/evaluator removes its owner regions, lifecycle ports, capacities and generated code when no other selected owner needs them. The universal graph representation remains complete.

## 18. Conformance and authoritative oracles

The deterministic CUDA-free reference is the authoritative oracle for normalized graph semantics. Native evidence later proves equivalent publication, atomics, races, progress, reclamation and teardown for one exact CUDA-JS compatible pair. Neither a toy layout nor a successful kernel run is universal authority.

Later `ENGINE-IR-COMPOSER-01` and `ENGINE-REFERENCE-01` must consolidate at least:

| Case ID | Required falsifier |
|---|---|
| `graph-profile-strict-normalization` | Ambiguous layout/range/lifecycle/protection data is accepted. |
| `graph-collision-unequal-states` | Same identity key merges unequal domain state views. |
| `graph-concurrent-equal-claim` | Concurrent equal claimers publish multiple ready nodes or wait forever. |
| `graph-failed-initializer-terminal` | A failed node claim remains visible/pending or leaks reservations. |
| `graph-transposition-distinct-parent-edges` | Shared child forces incoming edge/policy records to alias. |
| `graph-action-multiplicity` | Unique and repeatable-sample modes are conflated by storage. |
| `graph-edge-child-publication` | A child link becomes ready before action/child node payload publication. |
| `graph-variable-record-capacity` | Variable bytes overrun or create hidden overflow allocation. |
| `graph-compound-reservation-rollback` | Failed compound admission consumes published capacity. |
| `graph-identity-before-path-cycle` | Cycle policy runs before successor identity resolution. |
| `graph-history-sensitive-path` | Base-state equality discards domain-relevant history. |
| `graph-self-loop-cycle-dag-multigraph` | A non-tree graph shape requires ownership redesign. |
| `graph-path-capacity-no-truncation` | Path pressure silently truncates semantic history/occurrences. |
| `graph-root-advance-before-reclaim` | Logical root advance immediately reuses old storage without quiescence. |
| `graph-old-work-protection` | Stale-epoch work loses storage protection before termination. |
| `graph-protect-retire-race` | Concurrent protection acquisition succeeds after retirement has made an object reclaimable. |
| `graph-stale-generation-reuse` | A reference to reclaimed slot accesses its replacement. |
| `graph-generation-exhaustion` | Generation wrap aliases a prior incarnation. |
| `graph-observation-owner-lease` | Reclamation ignores a retained observation/result borrow. |
| `graph-reclaim-owner-disposition` | Owner bytes are reused before lifecycle cleanup completes. |
| `graph-no-reclamation-zero-residue` | A no-reclamation profile retains reclaim machinery or evicts silently. |
| `graph-table-full-deterministic` | A full/probe-exhausted table overwrites/grows, or the same declared reference schedule produces inconsistent first-cause/accounting. |
| `graph-owner-region-opacity` | Graph logic must interpret policy/evaluator bytes to remain correct. |
| `graph-product-extension-deletion` | Removing a product/evaluator/capability leaves solely owned graph residue. |
| `graph-oracle-sensitivity-generation` | Removing generation advance does not fail stale-reference cases. |

The minimum fixture set includes:

1. a collision-heavy transposing DAG with distinct incoming-edge records;
2. a self-loop/cyclic history-sensitive graph with multiple active paths;
3. a stochastic parallel-edge multigraph with repeatable action occurrences;
4. a fixed arena with no reclamation and deterministic saturation; and
5. a reclamation-enabled root-advance sequence with old work, retained observation borrow, retirement, quiescence and slot reuse.

Before selecting a production transposition/reclamation implementation, `TT-001` compares credible mechanisms under identical normalized domain/policy/resource/publication obligations and records methodology, workload, exact source/revision/license/provenance, memory, collision/load behavior, concurrency/progress, cleanup and result. That mechanism evidence is not a circular prerequisite for backend-neutral proposal authorship.

Native qualification additionally tests release/acquire correctness, duplicate claims, stale references/ABA, owner-region races, cancellation, progress/occupancy interaction, root-update pressure, reclamation and teardown on an exact platform/package pair. Performance claims use identical semantics and never relax collision verification or failure behavior.

## 19. Examples and rationale (informative)

A history-sensitive state reached by different transition sequences may share one node only when SPEC-0007 equality includes all behavior-relevant history, while each parent transition keeps a distinct edge. A planning DAG may have many incoming edges and structured policy records. A stochastic domain may retain parallel sampled transition occurrences. A one-shot bounded search may select no reclamation and stop cleanly at capacity.

These examples do not select a hash table, arena, reclamation algorithm, width, CUDA primitive or product reuse policy.

## 20. Acceptance blockers and downstream invalidation

This proposal is decision-complete only when review finds no unresolved owner, reference, identity/publication, edge/path, range, concurrency, pressure, reclamation, compatibility, security, persistence or cleanup ambiguity.

Acceptance remains blocked until:

1. normalized Search IR/schema represents every GRAPH-IR obligation and rejects semantic ambiguity;
2. the deterministic reference executes the required fixtures/cases and generation oracle-sensitivity mutation;
3. policy, evaluator, output, resource, progress and Search Session proposals reconcile owner regions, leases, reuse, pressure and lifecycle without cycles/duplicate authority;
4. product/evaluator/extension deletion checks pass;
5. the integrated semantic packet is reviewed on one exact revision at `ENGINE-CONTRACT-ACCEPTANCE-01`; and
6. required documentation/governance validation passes.

Production graph lowering or mechanism selection remains prohibited until that acceptance and the applicable `TT-001`/native profile gates. Native publication/reclamation/performance evidence qualifies a selected profile later unless required to decide semantic meaning.

A change to graph ownership, reference/incarnation/generation, identity verification, object lifecycle, edge/path meaning, transposition scope, owner-region layout, capacity/pressure, reclamation/protection, compatibility or oracle invalidates affected domain/policy/evaluator/output/resource/progress/session contracts, Search IR/schema/normalizers, reference/native evidence, generated packages, persisted graphs/caches and review approvals. The ENGINE-CONTRACT-01 integration spine records and reconciles invalidation before dependents continue.

Implementation, test, review, persistence, security, generated/JIT/ABI, performance and cleanup work triggers the specialist doctrine routed from root `AGENTS.md` and `agent_files/AGENTS.md`.
