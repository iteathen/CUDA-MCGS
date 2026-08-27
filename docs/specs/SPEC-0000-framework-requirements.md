# CUDA-MCGS Framework Composition and Ownership Map

**Status:** Proposal

**Draft version:** 0.1.0

**Owner:** CUDA-MCGS universal framework composition, ownership and conformance map

**Consumers:** Search IR; Search Composer; CUDA-MCGS-to-CUDA-JS packaging; extension and product specifications; deterministic reference, native and compatible-pair conformance

This proposal defines how independently owned CUDA-MCGS semantic contracts compose into finite specialized GPU-resident engines. It owns the cross-contract map, dependency law, engine identity, top-level lifecycle coordination, deletion requirements and integrated conformance obligations. It does **not** redefine domain, graph, policy, evaluator, output, resource, progress, Search Session, extension, product or CUDA-JS meaning.

> **For one normalized engine identity, every material fact, mutation and lifecycle has one visible semantic owner; composition connects only versioned public ports, rejects missing/ambiguous/cyclic authority, specializes away unselected owners and capabilities, and leaves active search device-owned after ignition.**

## 1. Authority, identity and applicability

Specification identity is `CUDA-MCGS-SPEC-0000@0.1.0-draft`.

Accepted [`ADR-0002`](../decisions/ADR-0002-universal-contracts-specialized-engines.md), [`ADR-0003`](../decisions/ADR-0003-device-resident-active-search.md), [`ADR-0005`](../decisions/ADR-0005-lego-design-hierarchy.md), [`ADR-0014`](../decisions/ADR-0014-extract-cuda-js-runtime.md), [`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md), [`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md), [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) and [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) govern this proposal.

The integrated semantic owner proposals consumed by this map are:

- optional Search Session [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md);
- domain [`SPEC-0007`](SPEC-0007-domain-state-action-and-transition.md);
- search policy [`SPEC-0008`](SPEC-0008-search-policy-and-backup.md);
- optional evaluator [`SPEC-0009`](SPEC-0009-evaluator-contract.md);
- graph/storage [`SPEC-0010`](SPEC-0010-graph-storage-and-reclamation.md);
- finite search resources [`SPEC-0011`](SPEC-0011-finite-search-resources.md);
- device-owned progress [`SPEC-0012`](SPEC-0012-device-owned-search-progress.md); and
- result/observation output [`SPEC-0013`](SPEC-0013-result-and-observation-publication.md).

Extension-substrate proposals [`SPEC-0003`](SPEC-0003-search-stage-and-extension-surface.md), [`SPEC-0004`](SPEC-0004-async-stage-channels.md) and [`SPEC-0005`](SPEC-0005-stage-ptx-and-search-image-composition.md) are optional downstream composition adjacency. Production products remain external and are not framework authority.

Accepted authority governs conflicts. This proposal neither accepts the listed proposals nor authorizes production implementation.

FRAMEWORK-AUTH-001. A concrete engine selects one normalized framework profile and exact compatible versions/digests of every selected owner contract. A proposal label, matching filename or matching JavaScript object shape is not compatibility.

FRAMEWORK-AUTH-002. Framework composition cannot weaken an owner invariant, infer an omitted owner disposition or convert an informative example/experiment/product into normative meaning.

FRAMEWORK-AUTH-003. Semantic acceptance, native profile qualification, exact CUDA-JS compatible-pair qualification, performance support and product conformance are distinct gates and claims.

FRAMEWORK-AUTH-004. Production lowering remains prohibited until the integrated contract/schema/reference acceptance gate authorizes it for the selected boundary.

## 2. Three-layer conformance model

### 2.1 Universal MCGS semantic core

The universal core consists of independently meaningful semantic owner bricks. A finite engine selects one conforming domain, graph, policy, output, resource and progress profile; it selects evaluator present/absent and Search Session present/absent explicitly.

The core assumes no game, board, player count, turn structure, zero-sum value, scalar value, deterministic transition, fixed state/action size, exhaustive action count, tree, DAG, rollout, neural evaluator, ranked result, live observation, root advance or physical scheduler.

### 2.2 Universal extension/composition substrate

The optional extension substrate composes selected namespaced capabilities through accepted stable attachment/dataflow contracts. It may contribute owner-declared semantic adapters, work classes, resources and restricted Device-JS programs; it cannot create a second authority for a core fact.

An engine with no selected extension capability contains exact zero extension-only field, port, branch, context, channel, resource, diagnostic, program or synchronization residue.

### 2.3 Downstream domain/search products

A product selects core profiles and optional capabilities, then owns product semantics, adapters, outputs, quality/support targets and compatibility in its owning repository.

FRAMEWORK-LAYER-001. Universal core contracts remain coherent when every extension capability and product is deleted.

FRAMEWORK-LAYER-002. Extension contracts remain product-neutral at their public attachment/composition boundary even when their first consumer is product-specific.

FRAMEWORK-LAYER-003. Product schema fields remain namespaced specialization inputs and never become mandatory universal Search IR fields by use or popularity.

FRAMEWORK-LAYER-004. Deleting the first product removes its adapters, schemas, resources, programs, outputs, diagnostics and tests without changing universal owner contracts.

## 3. LEGO owner and dependency map

Each row is an independently meaningful owner with one invariant and public semantic ports. Physical fusion, shared storage or one generated Device-JS program does not merge authority.

| Owner brick | Owns | Consumes through public contracts | Explicitly does not own |
|---|---|---|---|
| Domain | State/action/transition/identity/history/role/terminal meaning | Selected product-domain profile | Graph objects, policy, evaluator, output or CUDA representation |
| Graph/storage | Object/reference/path/transposition/publication/reclamation validity | Domain identity/equality; opaque selected owner-region layouts | Domain equality meaning, policy statistics, evaluator meaning, root epoch or resource policy |
| Evaluator, optional | Capability/request/input/artifact/workspace/batch/cache/result meaning | Domain views and selected requester-purpose/input adapters | Policy choice, graph storage, public output, progress or CUDA compilation/allocation |
| Search policy | Selection/reservation/widening/records/value algebra/backup/stopping/reuse meaning | Domain/graph facts and selected evaluator or other value-source adapters | Graph storage, evaluator execution, external publication, resources, progress or session commit |
| Result/observation output | Bounded payload/source/cut/slot/sequence/borrow/publication meaning | Ready facts from selected owners | Source semantics, policy ranking meaning, session control or CUDA transfer |
| Finite search resources | Contribution normalization, partitions/reserves, compound admission, accounting, pressure/exhaustion | Finite contribution descriptors from every selected owner/capability/product | Semantic victim/policy choice or CUDA allocation mechanism |
| Device-owned progress | Work readiness/dependency/service/fairness/no-progress/stop/drain/closure | Owner work descriptors and admitted resource transitions | Work payload meaning, one scheduler topology, session control or CUDA execution mechanism |
| Search Session, optional | External transaction/root-epoch boundary and bounded control/observation-request lifecycle coordination | All selected owner prepare/reuse/stale/cleanup/publication ports | Source-owner semantics, output payload publication, resource/progress policy or CUDA sideband mechanism |

FRAMEWORK-OWNER-001. Every material fact/state/mutation/lifecycle/publication/resource/work/failure/cleanup item declares exactly one semantic owner and any storage/mechanism owner separately.

FRAMEWORK-OWNER-002. Cross-owner access names versioned public semantic ports and permissions. Deep imports, private state mutation, raw pointer sharing and inferred neighboring layout are non-conforming.

FRAMEWORK-OWNER-003. Dependency direction is acyclic at semantic authority. Neutral composition may bind mutually relevant profile identities without permitting either owner to reinterpret the other.

FRAMEWORK-OWNER-004. Search Composer may fuse, split, inline or eliminate physical operations only while owner-visible meaning, ordering, accounting, diagnostics and cleanup remain independently testable.

FRAMEWORK-OWNER-005. A shared representation has one layout/storage owner and distinct non-overlapping semantic owner regions or field ownership. Byte adjacency does not authorize cross-owner mutation.

FRAMEWORK-OWNER-006. Optional evaluator, live output, Search Session, extension and product selections each pass a zero-residue deletion test in normalized schema, layout, generated source/package, resource plan, progress plan, runtime state and diagnostics.

FRAMEWORK-OWNER-007. Removing one optional owner/capability cannot leave a dangling dependency, empty runtime dispatcher, hidden reserve or compatibility requirement.

FRAMEWORK-OWNER-008. A capability needed by only one current consumer is reusable only when its invariant, owner, bounded lifecycle and plausible second consumer remain meaningful after deleting that consumer; otherwise it remains product-owned.

FRAMEWORK-OWNER-009. This is the simplest sufficient total ownership system: merging rows would create competing semantic/storage/lifecycle authority, while splitting a row requires a new independently meaningful invariant, lifecycle and replacement boundary rather than a file-size or first-implementation preference.

## 4. Normalized framework profile

A **framework profile** is the strict canonical pre-ignition selection of owner profiles, product/capability inputs, cross-owner bindings, finite plans, public CUDA-JS requirements and compatibility identity for one engine equivalence class.

The top-level semantic ports are `normalizeFrameworkProfile`, `composeSearchIR`, `admitEngineResources`, `createExecutionPackage`, `initializeEngine`, `igniteSearch`, `requestCancellation`, `awaitCompletion`, `acquireTerminalResult`, `releaseTerminalResult` and `teardownEngine`. They are not mandatory functions, modules, kernels, callbacks or ABI symbols.

FRAMEWORK-PROFILE-001. The profile declares, with no unknown fields:

- framework ID/version and accepted-authority baseline;
- exact selected contract/profile/schema identities and compatibility relations;
- evaluator present/absent, live-output present/absent, Search Session present/absent, extension capability set and product identity;
- every public producer/consumer port binding, owner permission and semantic dependency;
- all widths/ranges/precision/alignment/arithmetic/randomness/determinism selections;
- composed resource, progress, output, cancellation, completion, failure, diagnostics and cleanup plans;
- required public CUDA-JS capability/version/evidence profile without private mechanism fields;
- package/cache/provenance identity inputs; and
- deletion manifests for every optional selection.

FRAMEWORK-PROFILE-002. Normalization rejects unknown/duplicate owner/profile/schema/capability/product identities, competing fact owners, missing producer/consumer ports, permission escalation, semantic dependency cycles, ambiguous order/units/perspective, insufficient ranges, unbounded work/resources/queues/borrows, host-progress dependencies, missing cleanup or incompatible CUDA-JS requirements.

FRAMEWORK-PROFILE-003. Meaning-insensitive maps/sets normalize canonically. Every order that affects semantics is represented explicitly. Equivalent inputs yield byte-identical normalized profiles and identity; any semantic change changes identity.

FRAMEWORK-PROFILE-004. Every concrete range and capacity is derived from declared finite maxima/formulas with checked arithmetic. The first domain, product, GPU or experiment cannot establish a foundational limit.

FRAMEWORK-PROFILE-005. An optional absent profile is represented by canonical absence and generates no placeholder object, default buffer, no-op work class or dormant branch.

FRAMEWORK-PROFILE-006. A profile may support a bounded subset of valid contract families, but unsupported cases fail before ignition with a typed reason and do not narrow universal meaning.

FRAMEWORK-PROFILE-007. Validation errors identify owner, field/port, expected contract identity and bounded cause without exposing arbitrary domain/model bytes, executable source or private CUDA-JS data.

FRAMEWORK-PROFILE-008. Profile normalization is ordinary Node.js work. Device programs are restricted Device-JS inputs; neither layer may rely on CUDA-MCGS-maintained C/C++ or a private CUDA escape path.

## 5. Search IR and Search Composer

Search IR is the normalized semantic representation; Search Composer validates and specializes it. They integrate owner meaning but do not create it.

FRAMEWORK-IR-001. Complete Search IR contains or references every selected owner profile required by SPEC-0006 through SPEC-0013 and every selected namespaced extension/product input.

FRAMEWORK-IR-002. Cross-owner bindings name semantic port IDs/versions, producer/consumer roles, permission, representation/layout ownership, lifecycle/epoch, resource contribution and progress dependency without deep source paths or runtime object references.

FRAMEWORK-IR-003. Search IR represents optional absence explicitly and supports structural deletion inspection for evaluator, live output, Search Session, capability and product residue.

FRAMEWORK-IR-004. Search IR contains no mandatory first-product state, action, actor, ranking, value, evaluator or live-session field and no CUDA pointer, handle, stream, event, atomic spelling, PTX, ABI layout or scheduler topology.

FRAMEWORK-IR-005. Search Composer produces:

- canonical normalized Search IR and complete semantic identity;
- selected owner-region and public package layout descriptions;
- composed finite resource/admission/pressure plan;
- composed work/readiness/progress/stop/closure plan;
- terminal and selected live-output/session manifests;
- selected extension/product composition plan when present;
- restricted Device-JS/Search Program inputs;
- a versioned CUDA-MCGS-to-CUDA-JS execution package containing only public mechanism requirements;
- compatibility/provenance/deletion manifests; and
- bounded diagnostics and teardown/rollback plan.

FRAMEWORK-IR-006. Search Composer cannot discover semantic owners, attachment points, capability code, schemas or product behavior after ignition. No runtime service locator, callback registry or schema interpreter substitutes for specialization.

FRAMEWORK-IR-007. Generated source may specialize/fuse owners but its trace/provenance maps every material generated region and package requirement back to normalized owner/profile/port identity.

FRAMEWORK-IR-008. CUDA-JS receives restricted Device-JS and consumer-neutral compile/link/resource/operation/sideband requirements. It never receives authority to interpret MCGS, domain, graph, policy, evaluator, output, resource, progress, session, extension or product meaning.

## 6. Engine lifecycle and transaction coordination

The composed engine lifecycle is `unnormalized → normalized → plans-admitted → packaged → instantiated → initialized → ignited/running → stop-requested/draining → terminal → released`, with typed pre-ignition failure, runtime failure and quarantine. `plans-admitted` means the semantic/resource/progress/output/lifecycle plans and public mechanism requirements fit the declared target bounds; actual CUDA-JS resources are created during instantiation. Owner lifecycles refine these states without creating competing top-level authority.

FRAMEWORK-LIFE-001. Admission succeeds only after all selected owner profiles, compound resources, progress graph, terminal-output reserve, package compatibility and cleanup/rollback paths validate for one exact engine identity.

FRAMEWORK-LIFE-002. Initialization publishes each owner state in dependency order and records exact created resources. Failure rolls back partial creation in reverse dependency order without presenting the engine as ignitable.

FRAMEWORK-LIFE-003. Ignition has one logical boundary after which no active search decision requires a CPU-produced intermediate, host callback, polling/relaunch loop, filesystem/network service, late schema/code discovery or CUDA-MCGS-native helper.

FRAMEWORK-LIFE-004. The first authoritative stop cause is preserved. Selected policy stop, resource exhaustion, external cancellation/session control, semantic failure and CUDA-JS failure remain distinct typed causes coordinated through progress drain/closure.

FRAMEWORK-LIFE-005. Completion is published only after progress closure and every result-visible owner reaches ready, terminally absent or typed failed/quarantined disposition; output owns the immutable terminal envelope/payload.

FRAMEWORK-LIFE-006. Cancellation is idempotent, cannot erase an earlier cause, and follows owner-declared abandon/must-drain/release rules. It does not authorize partial backup, lost reservation/resource accounting or premature teardown.

FRAMEWORK-LIFE-007. Terminal-result borrow may outlive semantic search completion. Teardown preserves it until output/CUDA-JS owners prove dependent reads/transfers released or terminal.

FRAMEWORK-LIFE-008. Teardown closes inputs, drains/abandons/quarantines work, releases borrows/protections and owner resources in dependency order, tears down opaque CUDA-JS operations/resources, and leaves no live task-created device/host/external state.

FRAMEWORK-LIFE-009. Applicable statuses include `invalid-framework-profile`, `framework-owner-conflict`, `framework-dependency-cycle`, `framework-profile-incompatible`, `framework-plan-admission`, `framework-package-incompatible`, `framework-initialization-failed`, `framework-device-closure`, `framework-cancelling`, `framework-terminal` and `framework-internal-failure`, with exact pre-ignition reject, recoverable pending/pressure, stop, fatal/quarantine and terminal meaning.

## 7. Device closure and CUDA-JS boundary

FRAMEWORK-DEVICE-001. The selected domain, graph, policy, evaluator, output, resource, progress, session and capability/product device behavior and mutable active-search state are resident or device-accessible according to the finite plan before ignition.

FRAMEWORK-DEVICE-002. Device-owned progress, not a named scheduler mechanism, owns active readiness/service/fairness/no-progress/stop semantics. Persistent kernels, device-owned multi-kernel execution, CUDA Graphs, cooperative launch or later mechanisms qualify only selected profiles.

FRAMEWORK-DEVICE-003. Bounded asynchronous observation reads, externally supplied root/attention/control changes, cancellation, completion and teardown are the only post-ignition host interactions. They cannot supply internal work selection/evaluation/backup decisions or acknowledge internal progress.

FRAMEWORK-DEVICE-004. Maintained CUDA-MCGS production source is ordinary Node.js plus restricted Device-JS submitted through versioned public CUDA-JS contracts. C/C++, CUDA C++, `.cu`/`.cuh`, hand PTX, embedded CUDA source, native addons, direct FFI/Driver access, raw CUDA handles and subprocess native search are non-conforming.

FRAMEWORK-DEVICE-005. CUDA-JS may use JIT, native code and CUDA-specific implementation wherever needed or desired behind its consumer-neutral public contracts. Its generated CUDA/PTX/cubin/LTO/native artifacts are opaque dependency outputs, not CUDA-MCGS source or semantic authority.

FRAMEWORK-DEVICE-006. An inclination to add a native CUDA-MCGS solution triggers immediate capability classification. If a generic need lacks a natural public CUDA-JS expression with clear owner, bounded resources, synchronization, lifecycle, cleanup and independent qualification, the affected profile stops for a CUDA-JS capability proposal; CUDA-MCGS semantics are not distorted to avoid that stop.

## 8. Finite resources, progress and output closure

FRAMEWORK-RESOURCE-001. Every selected semantic/capability/product owner contributes exact finite classes/formulas/maxima/lifetimes to SPEC-0011; absent selections contribute zero. CUDA-JS mechanism overhead is separately declared and included before admission.

FRAMEWORK-RESOURCE-002. The composed plan covers graph/path/policy/evaluator/work/output/session/extension/product/diagnostic state, recovery and terminal reserve, concurrent multiplicity, alignment/fragmentation and checked arithmetic within an exact device/runtime budget.

FRAMEWORK-RESOURCE-003. Every compound operation admits all required classes atomically before semantic mutation. No owner may allocate hidden overflow, host spill, emergency buffer or unplanned retry state.

FRAMEWORK-RESOURCE-004. Pressure/exhaustion preserves semantic owner choice: resource composition reports admissibility and cause; the owning policy/profile selects bounded retry/degrade/reclaim/reject/stop behavior and cannot silently change search meaning.

FRAMEWORK-RESOURCE-005. Progress accounts for every admitted work/resource/result-visible obligation. `pending` has a possible producer/escape; ready work receives declared service; terminal closure cannot strand leases, reservations, publications or required cleanup.

## 9. Optional extension substrate

FRAMEWORK-EXT-001. Core owner profiles and reference semantics are complete without Search Stages, extension surfaces, Async Stage Channels or optional capability programs.

FRAMEWORK-EXT-002. When selected, extension attachment points, permissions, contexts, channels, programs, resources and compatibility are normalized before ignition through the accepted SPEC-0003/0004/0005 family or successor.

FRAMEWORK-EXT-003. A capability that affects domain/policy/evaluator/output/resource/progress/session meaning selects a namespaced adapter/profile governed by that owner. An extension surface cannot redefine the fact.

FRAMEWORK-EXT-004. Extension dataflow cannot synchronously block a device worker on unavailable work, create host progress, bypass compound admission or weaken cancellation/cleanup.

FRAMEWORK-EXT-005. An unselected capability contributes exact zero extension-only runtime and package residue. Selected capabilities use the accepted statically specialized composition profile without a universal hot-path callback/dispatch registry.

FRAMEWORK-EXT-006. Extension mechanism and representative cost evidence qualify the selected substrate but cannot prove core semantics or promote one capability/product payload into the framework.

## 10. Product boundary and universality

FRAMEWORK-PRODUCT-001. Product profiles declare exact domain/policy/evaluator/output/session/capability adapters, support/quality targets and namespaced identity; the framework validates their owner bindings without interpreting product bytes.

FRAMEWORK-PRODUCT-002. The framework supports materially different profiles including fixed/variable states, exhaustive/lazy/sampled actions, deterministic/stochastic transitions, custom roles, tree/DAG/cyclic graphs, evaluator absent/present with scalar/vector/distribution/proof/custom output, commutative/ordered backup, terminal/live/no observation and session absent/present.

FRAMEWORK-PRODUCT-003. A concrete engine may reject unsupported combinations before ignition, but a product limitation cannot narrow a universal range, identity, owner or conformance class.

FRAMEWORK-PRODUCT-004. Product-specific ranking, selection, outcome and presentation outputs exist only when selected policy/product/output contracts define them.

## 11. Compatibility, persistence, security and diagnostics

FRAMEWORK-COMPAT-001. Framework semantic compatibility requires compatible identities for every selected owner profile/schema/port binding, resource/progress/output/session plan, extension/product input, arithmetic/determinism choice and cleanup disposition. Matching package version or byte layout alone is insufficient.

FRAMEWORK-COMPAT-002. The execution-package identity additionally binds restricted Device-JS sources/imports, target constraints, selected public CUDA-JS capability requirements, layout/resource/launch manifests and provenance digests. CUDA-JS artifact/runtime identity remains opaque and separately bound.

FRAMEWORK-COMPAT-003. A compatible pair records exact CUDA-MCGS revision/package identity, CUDA-JS revision/package/native artifact identity, platform/device/toolchain/runtime profile and passed evidence capsule. Portable behavior alone is not native qualification.

FRAMEWORK-COMPAT-004. Changing an owner invariant/profile/schema, cross-owner binding, resource/progress/output/session semantics, extension/product selection, generated input or CUDA-JS requirement invalidates every affected normalized IR, package/cache, persisted state, reference/native evidence and review approval unless explicit compatibility/migration proves otherwise.

FRAMEWORK-COMPAT-005. Version negotiation occurs before allocation/ignition and fails closed. Runtime fallback cannot silently select a weaker semantic, synchronization, range, resource or evidence profile.

FRAMEWORK-PERSIST-001. Persistence is absent by default. A selected persistence owner defines canonical encoding, compatibility/migration, authorization, recovery/rollback, retention and cleanup; raw pointers, CUDA handles, in-flight work/transactions and active borrows are never durable authority.

FRAMEWORK-PERSIST-002. Restored state revalidates every semantic/profile/package identity, finite resource plan, incarnation/generation and stale-reference protection before becoming authoritative. Failure leaves a typed non-ignited or quarantined state.

FRAMEWORK-SEC-001. Profiles, schemas, product inputs, restricted Device-JS, packages and restored state are untrusted until strict field/range/permission/digest/provenance/resource validation. They cannot inject callbacks, filesystem/network access, raw pointers/handles or private provider paths.

FRAMEWORK-SEC-002. Least authority applies to every port and generated program. A consumer receives only required public facts/effects; physical addressability or shared layout never expands semantic permission.

FRAMEWORK-SEC-003. Diagnostics are finite, namespaced and provenance-linked. They distinguish semantic owner failure, composition error, pressure/stop/cancellation and opaque CUDA-JS failure without leaking arbitrary domain/model/device memory or fabricating recovery.

## 12. Cleanup and disposition

FRAMEWORK-CLEANUP-001. Every normalized profile, generated source/package/cache, allocation, operation, work item, reservation, transaction, borrow, diagnostic, persisted artifact and coordination record has an owner and release/retain/archive/quarantine/transfer disposition.

FRAMEWORK-CLEANUP-002. Partial composition/initialization failure removes or quarantines task-created state in reverse dependency order while preserving decisive evidence and protected pre-existing/user/shared state.

FRAMEWORK-CLEANUP-003. Normal completion does not imply resource cleanup; owning-system read-back must prove local files/Git state, processes/device resources, CUDA-JS operations, transfers/borrows, caches/artifacts, credentials and external coordination are intentionally disposed.

FRAMEWORK-CLEANUP-004. Retained state records authority, owner, recovery/evidence purpose, sensitivity, compatibility key, location and objective removal/review trigger. Clean appearance is not authority for deletion.

## 13. CUDA-MCGS-to-CUDA-JS execution package

The versioned package contains or references:

- normalized framework/Search IR identity and selected owner/profile digests;
- restricted Device-JS/Search Program inputs and typed public imports/exports;
- finite layout/resource/launch/operation requirements;
- initialization uploads and immutable resident asset identities;
- selected consumer-neutral sideband/transfer/atomic-observation requirements;
- cancellation/completion/diagnostic/terminal-output requirements;
- failure and partial-creation rollback classification;
- teardown order and retained terminal-result transfer/borrow obligations;
- package checksums/provenance/compatibility negotiation; and
- exact compatible-pair evidence requirements.

FRAMEWORK-PACKAGE-001. The package is finite, canonical, self-identifying and sufficient for CUDA-JS to realize the selected execution without interpreting Search IR or calling JavaScript for active-search decisions.

FRAMEWORK-PACKAGE-002. Private CUDA-JS handles, ABI structs, compiler flags, CUDA source/PTX and mechanism-specific synchronization do not enter persistent CUDA-MCGS semantic schemas. Public capability parameters may enter only through their versioned consumer-neutral contracts.

FRAMEWORK-PACKAGE-003. Missing/incompatible public CUDA-JS capability rejects the affected package/profile before ignition with a typed requirement. Optional profiles that do not select it remain independently composable.

## 14. Integrated conformance requirements

One consolidated CUDA-free framework capsule MUST include stable cases for:

1. canonical normalization of a minimal terminal-only evaluator-absent session-absent engine;
2. order-independent input normalization producing byte-identical identity;
3. unknown/duplicate owner or schema rejection;
4. competing fact owners and semantic dependency cycle rejection;
5. missing producer/consumer port or permission escalation rejection;
6. insufficient range/capacity and arithmetic overflow rejection;
7. fixed-state exhaustive deterministic tree profile;
8. variable-state lazy/sampled stochastic DAG profile;
9. history-sensitive cyclic profile with identity-before-cycle semantics;
10. scalar, vector/distribution/proof/custom and ordered-backup policy/value profiles;
11. evaluator absent, proposal-only, evaluation-only and combined profiles;
12. terminal envelope-only, structured result, live observation and no-live-observation profiles;
13. evaluator/live-output/Search-Session/extension/product deletion with exact zero residue;
14. bounded live-session root/attention/observation coordination without host progress;
15. finite ordinary, high, critical, recoverable-pressure and terminal-exhaustion behavior;
16. compound admission failure at each owner leaving no partial semantic mutation;
17. serial and parallel schedule models preserving stable semantics/accounting/closure;
18. cancellation during selection/evaluation/backup/output/session transaction with exact dispositions;
19. first authoritative stop cause and valid-partial/no-valid-result classification;
20. partial package/engine initialization rollback and cleanup;
21. terminal borrow/transfer quiescence before backing-state release;
22. extension-absent zero residue and selected extension unable to override an owner;
23. first-product deletion plus a materially different product/profile composition;
24. no required host callback/poll/relaunch/internal decision after ignition;
25. maintained-source rejection for C/C++, CUDA C++, PTX, FFI, native addon or subprocess search;
26. missing generic CUDA-JS mechanism producing capability-classification stop, not semantic workaround;
27. persistence absent with zero residue and selected restore rejecting stale/incompatible authority;
28. semantic/package/compatible-pair identity changing for every material input class;
29. unknown/incompatible CUDA-JS capability failing before ignition without blocking unselected profiles;
30. complete owner/resource/work/result/transaction/borrow cleanup and residue inventory; and
31. oracle sensitivity for ownership, deletion, identity, admission, device closure, stale isolation, publication and teardown guards.

Each detailed owner capsule remains authoritative for its own semantic cases. The framework capsule proves composition, boundary and end-to-end coherence; it cannot replace leaf evidence by merely invoking it.

Native qualification additionally proves actual publication/memory ordering, concurrent progress/fairness, device closure, resource conservation, cancellation/error/teardown, final generated artifacts and cleanup for one exact CUDA-MCGS/CUDA-JS/platform pair. Performance/search-quality claims freeze complete semantic/resource/workload/toolchain identity and remain separate.

## 15. Acceptance blockers and downstream handoff

This proposal cannot become accepted until:

- SPEC-0006 through SPEC-0013 have no unresolved ownership contradiction with this map;
- the extension-substrate proposals are reconciled as optional downstream composition without making core meaning depend on them;
- complete schema/metaschema and normalization implement every selected owner identity, binding, range, deletion, resource, progress, output, session, package and cleanup obligation;
- the consolidated CUDA-free owner and framework reference capsules pass atomically on one exact revision with oracle sensitivity;
- the CUDA-MCGS-to-CUDA-JS package contract names only public consumer-neutral requirements and preserves the JavaScript/restricted Device-JS source boundary; and
- every proposal branch, issue, invalidation, generated artifact and cleanup disposition is reconciled on the integration spine.

Production framework lowering remains prohibited until that integrated acceptance. Native execution, compatible-pair, performance, optional live-session and product qualification follow as separately declared gates unless required to decide semantic meaning.

A change to this framework's owner map, dependency law, normalized profile, lifecycle coordination, deletion rule, device boundary, package identity, compatibility or cleanup semantics invalidates affected owner/extension/product proposals, Search IR/schema/normalizers, generated packages, persisted state, reference/native evidence and approvals. The `ENGINE-CONTRACT-01` integration spine records and reconciles the change before dependents continue.

Implementation, testing, review, persistence, security, generated/JIT/ABI, performance/search-quality and cleanup work triggers the specialist doctrine routed from root `AGENTS.md` and `agent_files/AGENTS.md`.
