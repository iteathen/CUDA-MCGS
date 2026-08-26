# SPEC-0003: Search Stages and Stage Extension Surfaces

**Status:** Proposal

**Draft version:** 0.3.0

**Owner:** CUDA-MCGS optional stage/surface/capability semantics

**Product area / durable path:** universal extension/composition substrate / `docs/specs/`

**Consumers:** Search IR, Search Composer, optional Async Stage Channels, capability/product providers, finite-resource and device-progress composition, restricted Device-JS Search Program generation, conformance and package identity

This proposal defines the optional LEGO brick through which selected behavior may attach at stable operational checkpoints without exposing partial mutation, taking ownership from universal core contracts or promoting the first product into the framework. It defines semantic composition boundaries, not a workflow engine, fixed search pipeline, scheduler, CUDA ABI or production implementation.

## 1. Authority, identity and applicability

Specification identity is `CUDA-MCGS-SPEC-0003@0.3.0-draft`.

Normative authority and dependencies are:

- [`ADR-0002`](../decisions/ADR-0002-universal-contracts-specialized-engines.md) for universal contracts and finite specialized engines;
- [`ADR-0003`](../decisions/ADR-0003-device-resident-active-search.md) for device-resident active search;
- [`ADR-0005`](../decisions/ADR-0005-lego-design-hierarchy.md) for LEGO ownership and deletion tests;
- [`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md) for optional extension-substrate and product separation;
- [`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) for ordinary Node.js/restricted Device-JS CUDA-MCGS source and CUDA-JS capability escalation;
- accepted [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) for publication, finite-resource, stop and partial-result foundations; and
- accepted [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) for normalized Search IR and deterministic reference foundations.

Decision-complete proposals [`SPEC-0000`](SPEC-0000-framework-requirements.md) and [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) through [`SPEC-0013`](SPEC-0013-result-and-observation-publication.md) are coupled proposal inputs. They become normative dependencies only through the later atomic semantic-acceptance gate. [`SPEC-0004`](SPEC-0004-async-stage-channels.md) and [`SPEC-0005`](SPEC-0005-stage-ptx-and-search-image-composition.md) are downstream proposal siblings. Accepted authority governs every conflict.

EXT-AUTH-001. This specification applies only when a finite engine profile selects the extension substrate. An engine with no selected extension capability has no extension profile, stage graph, checkpoint surface, extension base context, capability contribution or solely extension-owned source/state/resource/package residue.

EXT-AUTH-002. Selecting the extension substrate does not amend or supersede a source-owner contract. Domain, graph, policy, evaluator, output, resource, progress and optional Search Session meaning remains authoritative under its owning selected profile.

EXT-AUTH-003. This proposal is not production implementation authority. Its acceptance requires the schema/reference evidence in Section 15; native profile qualification remains separately gated.

## 2. Purpose, required outcome and exclusions

The required outcome is one bounded optional composition boundary through which unrelated capabilities can reuse stable operational checkpoints while receiving only declared facts and permissions. The boundary succeeds only if deleting the first product, every optional capability or the complete substrate leaves the universal core coherent, and a materially different non-game capability can use the same checkpoint semantics without changing their meaning.

EXT-SCOPE-001. This specification owns operational stage identity, stable checkpoint meaning, stage-local surface permissions, capability attachment requirements, selected-only context contribution, semantic outcome/transition declarations and extension-profile identity.

EXT-SCOPE-002. This specification does not own domain state/action/transition meaning, graph objects/reclamation, policy statistics/backup, evaluator results, output payload/publication, finite-resource policy, global readiness/progress/fairness/closure, external session transactions, CUDA-JS syntax/lowering/runtime mechanisms or product meaning.

EXT-SCOPE-003. This specification defines no universal stage catalogue, evaluator requirement, action/value shape, ranked output, persistent kernel, CUDA Graph, module boundary, kernel-per-stage topology, global phase or runtime callback registry.

## 3. LEGO invariant and ownership boundary

The owned invariant is:

> For one immutable selected extension-profile identity, every materialized stage surface invokes only at a declared stable entry/exit checkpoint, grants only declared least authority, composes a finite deterministic selected capability set, and leaves no solely extension- or capability-owned residue when absent.

EXT-LEGO-001. A Search Stage owns only the operational work-item state, its entry/exit invariants and commitment of one operational transition. It may coordinate source-owner semantic ports, but it does not acquire ownership of the facts or mutations those ports define.

EXT-LEGO-002. If a behavior participates inside formation of a domain, graph, policy, evaluator, output, resource, progress or session invariant, it belongs to that selected owner's implementation or a newly declared stable operational stage; it cannot be injected as a mid-mutation extension hook.

EXT-LEGO-003. A stage/checkpoint is reusable only when its semantic purpose remains coherent after deleting the first capability/product. A boundary created solely to expose one product detail belongs to that product capability, not the universal stage catalogue.

EXT-LEGO-004. Reuse by several products does not promote their facts, permissions or resource state into universal base context. Promotion requires a separate authority change under ADR-0018.

EXT-LEGO-005. The extension substrate depends on public source-owner contracts. Core owners never depend on a stage/surface/capability definition for their own semantic completeness.

EXT-LEGO-006. Deleting CUDA-MCGS must leave every CUDA-JS capability selected by a concrete realization consumer-neutral. No stage, surface, capability or product term may enter CUDA-JS public meaning.

## 4. Terms and semantic model

### 4.1 Extension profile

An **extension profile** is an immutable normalized selection of a finite operational stage graph, stable checkpoint schemas, capability bindings, permissions, contribution schemas, finite bounds and version identities. It exists only when at least one capability is selected.

### 4.2 Operational work item and state

An **operational work item** is one finite unit of engine progress with explicit identity/generation and one declared operational state. Operational state is not domain state, graph node identity, CUDA thread state, host session state or product UI state.

### 4.3 Search Stage and transition

A **Search Stage** is a namespaced/versioned handler for one operational state. A **stage transition** is the committed per-work-item change from one declared operational state/outcome to another after the stage's source-owner operations and owned bookkeeping satisfy their exit predicates. Neither implies a physical launch, module, grid barrier or global phase.

### 4.4 Stable checkpoint and surface

A **stable checkpoint** is a selected stage `entry` or `exit` boundary at which every exposed fact satisfies its source-owner publication/validity contract. A **Stage Extension Surface** is the stage-owned least-authority invocation boundary at one such checkpoint. A surface never spans stages and has no mid-stage checkpoint.

### 4.5 Capability and context

A **stage capability** is a namespaced/versioned, profile-selected behavior bound to one compatible surface. A **base checkpoint context** is the minimum extension-only view of already-owned stable facts required by every selected capability at that surface. A **capability contribution** is namespaced configuration/context/state/workspace/channel/resource data required only by that selected capability.

EXT-TERM-001. Context representation does not transfer semantic ownership. Every base or contributed fact names its source owner, validity/generation, access permission, representation, lifetime and publication requirement.

EXT-TERM-002. A schema describes a pre-ignition selected representation. Device code cannot interpret schemas or discover attachment points at runtime.

## 5. Normalized extension profile

EXT-PROFILE-001. A normalized extension profile declares, with no unknown fields:

- extension-profile ID/version and compatibility policy;
- finite stage and transition definitions;
- selected checkpoints/surfaces and base-context schemas;
- selected capability IDs/versions/semantic owners/bindings;
- capability configuration/context/state/workspace/channel/resource contributions;
- deterministic capability ordering constraints;
- all widths, ranges, capacities, alignments, generations and exhaustion behavior;
- required source-owner profile versions and public CUDA-JS capability profile; and
- provenance, trust, diagnostics, schema and generator identities.

EXT-PROFILE-002. Unknown/missing fields, duplicate IDs, incompatible versions, unowned semantics, impossible transitions, unrepresentable bounds, permission escalation, resource-plan overflow or dependency cycles reject before ignition.

EXT-PROFILE-003. Unordered selections normalize by raw JavaScript/Unicode code-unit string order. Semantically ordered fields preserve declared order. Defaults become explicit canonical values; ambient locale, object insertion order, filesystem order and provider discovery are not semantic authority.

EXT-PROFILE-004. Every profile ID changes when an input capable of changing stage/checkpoint/capability meaning, permissions, context layout, ordering, resources, failure, lifecycle or emitted restricted Device-JS behavior changes.

EXT-PROFILE-005. Every selected stage/surface/capability invocation has finite declared work, read/write, scratch, publication and cancellation-observation bounds. Larger work uses an explicit finite resumable protocol under progress/resource owners; unbounded loops or waits are prohibited.

EXT-PROFILE-006. Host-side profile validation/normalization/composition may use ordinary Node.js. Maintained active-search behavior is restricted Device-JS submitted only through versioned public CUDA-JS contracts. This specification authorizes no C/C++, CUDA C++, native addon, direct FFI/Driver access, hand-written PTX or embedded CUDA source in CUDA-MCGS.

EXT-PROFILE-007. If a required generic GPU mechanism cannot be expressed naturally through a public CUDA-JS contract with clear ownership, finite resources, synchronization, lifecycle and independent qualification, implementation stops for CUDA-JS capability classification. A private import, native escape or distorted Device-JS encoding is non-conforming.

EXT-PROFILE-008. A profile selecting zero capabilities normalizes to absence of the complete extension substrate rather than an empty runtime framework. No enable flag, stage dispatch, context, channel, storage, synchronization, diagnostic or package dependency remains solely to represent emptiness.

## 6. Finite stage graph and transitions

EXT-STAGE-001. Every materialized stage declares a namespaced ID/version, semantic purpose, owned operational invariant, work-item kind/identity/generation, entry predicate, legal outcomes/transitions, cancellation/error behavior, finite contribution and selected entry/exit checkpoints.

EXT-STAGE-002. A stage exists because a distinct stable operational validity, readiness, ownership or lifecycle state is needed by selected behavior. Source layout, a variable change, optimization boundary, possible hook, CUDA function or first-product pipeline step is not sufficient.

EXT-STAGE-003. Candidate boundaries use cross-consumer usefulness only as a granularity test among semantically valid states: reusable stable facts, already-materialized data, clearer lifecycle/publication ownership, useful ready/pending work and avoided duplicate packing/synchronization. Usefulness cannot invent a product-shaped stage.

EXT-STAGE-004. The finite graph may use roles such as candidate production, selection, transition, identity resolution, evaluation, propagation or output publication only when the selected contracts require those states. No AlphaZero/game/tree/BSP list is universal.

EXT-STAGE-005. The graph rejects unreachable stages, undeclared targets, missing reachable stop/terminal paths, cycles without a finite progress/resource invariant, transitions without source-owner publication dependencies, and states whose resource contribution cannot be composed under SPEC-0011.

EXT-STAGE-006. A transition is per operational work item. Different items may inhabit different stages concurrently, and conforming executions may choose different legal schedules while preserving source-owner outcomes, publication, resources and SPEC-0012 progress.

EXT-STAGE-007. A stage transition does not require one kernel per stage, one artifact/module per stage, global phase ordering, grid-wide barriers, persistent execution, CUDA Graphs, cooperative execution or device dynamic parallelism.

EXT-STAGE-008. The mandatory selected stage implementation exclusively owns the interval after entry commitment and before exit commitment. No extension surface invokes in that interval and no public capability observes an incompletely established invariant.

EXT-STAGE-009. Failure/cancellation during that interval returns one declared rollback, tombstone, retryable/pending or terminal outcome without publishing success over incomplete mutation. Source-owner contracts govern rollback/publication of their facts; the stage owns only operational disposition.

EXT-STAGE-010. A stage cannot lend a mutable reference or permission whose valid use outlives the checkpoint contract. Immutable handles/views remain generation- and lifetime-bounded by their source owner.

EXT-STAGE-011. Adding, splitting or merging a stage is identity-affecting and requires proof that source-owner semantics, selected capability permissions, progress, resource conservation, failure and deletion behavior remain coherent.

## 7. Stable checkpoint and surface contract

EXT-SURFACE-001. A surface materializes only when at least one selected capability binds to it. A potential checkpoint with no selected binding contributes no surface invocation, base-context packing, permission record, synchronization, code or resource residue.

EXT-SURFACE-002. Each materialized surface declares stage/checkpoint ID/version, semantic purpose, invocation scope/cardinality, base readable facts, base writable result/control ports, immutable facts, context layout/aliasing/lifetime, ordering/publication, finite bounds and failure/skip/cancellation behavior.

EXT-SURFACE-003. Every exposed fact is already stable under its source owner at invocation. Entry exposure occurs only after entry commitment; exit exposure occurs only after the stage's source-owner operations have reached their declared stable result and before operational transition publication as specified by the surface.

EXT-SURFACE-004. Base context is the least common authority required by the selected set at that checkpoint, not a catalogue of all potentially useful engine state. A capability receives no undeclared read, write, control, allocation, synchronization or traversal authority.

EXT-SURFACE-005. Writable access is through typed bounded source-owner ports or capability-owned storage. Arbitrary address access, raw pointers, runtime reflection, deep imports, unrestricted graph traversal and direct mutation of another owner's representation are prohibited.

EXT-SURFACE-006. Surface invocation cannot allocate unplanned memory, discover providers, compile/link/load code, call the host, wait for another stage, advance a session transaction or publish an output payload outside the owning selected contract.

EXT-SURFACE-007. Several capabilities at one checkpoint share one stage-owned invocation/composition boundary. The semantic surface is not one runtime call, callback or native artifact per capability.

EXT-SURFACE-008. Entry-only, exit-only and entry-plus-exit profiles are allowed when their stable predicates and permissions are explicit. A mid-stage surface is never allowed.

EXT-SURFACE-009. Capability effects that do not commute use one declared deterministic order. Effects that claim commutativity must be falsified under permitted schedules and representative values before acceptance.

EXT-SURFACE-010. Surface failure maps to a declared stage outcome and exact capability-owned cleanup. Silent skip, host fallback, partial success publication or mutation outside the authorized source owner is prohibited.

## 8. Capability contract and selected-only composition

EXT-CAP-001. Every selected capability declares a namespaced ID/version, semantic owner, required stage/checkpoint/version, required base facts/permissions, namespaced contribution schemas, finite resource contribution, semantic effects, ordering, failure/cancellation and deletion behavior.

EXT-CAP-002. Every semantic effect names the selected domain/policy/evaluator/output/session/product or other accepted owner that authorizes it. A capability with unowned meaning rejects before ignition.

EXT-CAP-003. A capability cannot redefine state identity, graph ownership/reclamation, policy value/backup, evaluator publication, output semantics, resource accounting, device progress, Search Session transactions or another capability's private state through extension code.

EXT-CAP-004. Capability context/configuration/state/workspace/channel/diagnostic fields are namespaced and exist only when selected. Their types, alignment, width, range, lifetime, generation, aliasing and cleanup are explicit.

EXT-CAP-005. Several selected capabilities may share a source-owner fact or universal channel mechanism only through separately declared compatible permissions. Sharing storage does not merge semantic ownership or resource accounting.

EXT-CAP-006. Before ignition, selection validates versions, checkpoint compatibility, permissions, source owners, finite resources, channel contracts, effect ordering, provenance/trust and complete deletion behavior.

EXT-CAP-007. There is no active-search capability discovery, registry, schema interpreter, callback table, function-pointer lookup, fragment loop, dynamic code generation, late binding or host callback progression.

EXT-CAP-008. A composed capability may be device-resident active/inactive only under a finite preplanned selected rule. Inactivation does not remove its preplanned resource/code footprint, and activation cannot acquire new code/state/resources or change semantic identity.

EXT-CAP-009. Deleting a capability removes its solely owned context, configuration, state, workspace, channels, diagnostics, code behavior, synchronization, resources and package inputs. Shared artifacts remain only when another selected owner independently requires them.

EXT-CAP-010. Deleting the first product/capability leaves the checkpoint purpose, source-owner contracts and extension mechanism coherent. A materially different second capability must bind without adding first-consumer facts to base context.

EXT-CAP-011. Capability source/provenance is trusted according to the selected profile, but product ownership grants no extra permissions, native authority or access to CUDA-JS-private artifacts/handles.

## 9. Outcomes, readiness and progress delegation

EXT-OUTCOME-001. Every selected stage/surface invocation ends in one declared operational outcome: named transition, pending, bounded retry publication, typed pressure/exhaustion, cancellation acknowledged, generic source-owner publication work, terminal stop or typed failure.

EXT-OUTCOME-002. A stage/surface never synchronously waits or spins for later data and never retains a worker, lock, unpublished mutation, reservation or mutable lease while pending. Required future data uses SPEC-0004 pending/readiness semantics when that optional channel profile is selected.

EXT-OUTCOME-003. SPEC-0012 owns composed-engine readiness, finite service/fairness, no-progress/deadlock, stopping, drain and closure. This specification declares stage-local ready/pending transitions and contributions only; it does not select or own a scheduler.

EXT-OUTCOME-004. SPEC-0011 owns aggregate planning/admission/accounting/pressure/exhaustion. Stages and capabilities contribute exact finite requirements and typed local pressure outcomes but cannot allocate outside or reinterpret the composed plan.

EXT-OUTCOME-005. Timing or schedule races cannot silently change selected domain/policy/evaluator/output semantics. Any timing-dependent choice must be an explicit owner-defined bounded semantic option included in identity.

## 10. External session, output and internal-channel boundaries

EXT-BOUNDARY-001. External root/attention commands, cancellation requests, observation requests/borrows and terminal result consumption are not Stage Extension Surfaces. Optional SPEC-0006 coordinates their distinct root-transaction/attention-publication lifecycles; SPEC-0013 owns result/observation payload publication.

EXT-BOUNDARY-002. A capability may consume root-epoch or immutable observation facts only when its selected source-owner contract and surface grant them. It cannot turn an internal checkpoint into host-driven search progression or an output read into search mutation.

EXT-BOUNDARY-003. Internal cross-stage/cross-surface work/data uses selected SPEC-0004 channels. A channel does not make one surface span stages and does not transfer global progress/resource/output/session ownership to this specification.

EXT-BOUNDARY-004. After ignition, no stage, surface or capability may require a CPU-produced intermediate, host polling/relaunch decision, callback progression, late compilation or native code outside CUDA-JS public operations.

## 11. Identity, compatibility and migration

EXT-IDENTITY-001. Material extension identity includes profile/schema version, stage graph/transitions, checkpoint/base-context schemas, selected capabilities and owners, contribution schemas, permissions, ordering, finite resources, outcomes, required channels, restricted Device-JS semantic source identity, diagnostics and required public CUDA-JS capability profile.

EXT-IDENTITY-002. Stage/checkpoint/base-context or capability changes are compatible only when every existing selected input retains identical normalized meaning, permission, layout, outcome, lifecycle and deletion behavior. Additive optional definitions do not affect an engine that does not select them.

EXT-IDENTITY-003. An incompatible change invalidates affected Search IR, generated source/package, reference and native evidence. It cannot silently migrate live operational items, capability state or persisted identity.

EXT-IDENTITY-004. If migration is supported, a separately versioned pre-ignition migration contract names source/target identities, finite transformation, validation, failure and rollback. Active-search reinterpretation is prohibited.

## 12. Failure, security, lifecycle and cleanup

EXT-LIFE-001. Unknown/incompatible stages, transitions, checkpoints, capabilities, schemas, permissions, semantic owners, contributions, resources, public dependencies or provenance fail closed before ignition and before valid package publication.

EXT-LIFE-002. Partial profile normalization/composition publishes no valid extension profile or package and leaves no task-created generated artifact/resource. A previously valid immutable profile remains unchanged.

EXT-LIFE-003. Capability execution failure cannot silently corrupt core state, widen authority, call a host decision service or switch to undeclared semantics. The declared outcome owns cleanup/diagnostics and source-owner invalidation.

EXT-LIFE-004. Cancellation, stop and teardown identify every in-flight stage item, pending channel item, capability-owned reservation/state and source-owner lease. Each reaches one exact terminal disposition under its owner; zero live residue is required before terminal cleanup is claimed.

EXT-LIFE-005. Counters, generations, IDs and cursors are finite. Exhaustion/wrap cannot alias live or stale state; the profile declares reject, drain/restart or terminal failure before ambiguity.

EXT-LIFE-006. Executable capability input is schema-, permission-, digest-, provenance-, trust- and resource-validated before native work. Public results expose no raw pointer, CUDA handle, generated CUDA source/PTX/native bytes or another owner's private representation.

## 13. Search IR and Composer obligations

EXT-IR-001. Search IR must represent optional whole-substrate presence, every normalized EXT-PROFILE field, stage/transition/checkpoint/surface identity, base-context source-owner mapping, selected capability binding/contribution, finite resources, outcomes, permissions, ordering, deletion and compatibility inputs.

EXT-IR-002. Normalization must prove zero-capability equivalence to absent substrate, canonical ordering, unique IDs, complete source-owner references, legal graph reachability/closure, permission/resource composition and no unknown residue before source generation.

EXT-IR-003. The Composer emits only selected restricted Device-JS behavior and declared public CUDA-JS dependencies. SPEC-0005 owns deterministic program/package composition; CUDA-JS owns Device-JS validation/lowering and all CUDA-specific artifacts.

EXT-IR-004. A schema cannot supply missing semantics. Any field whose lifecycle, owner, failure or deletion meaning is absent from this contract or another selected owner causes rejection rather than implementation-defined interpretation.

## 14. Conformance and falsification

One consolidated CUDA-free stage-contract capsule must cover at least:

1. no selected capability normalizes to complete substrate absence and byte-identical core semantic/package input;
2. entry-only, exit-only and entry-plus-exit surfaces;
3. multiple compatible capabilities sharing one surface and deterministic effect order;
4. incompatible writes, permissions, versions, owners, channels and resources rejected before ignition;
5. base context unchanged after first-product capability deletion;
6. namespaced contribution present only when selected and exact full deletion when absent;
7. whole-substrate deletion leaving core semantics/execution coherent;
8. attempted mid-stage observation/mutation rejected structurally;
9. source-owner invariant mutation without an authorized port rejected;
10. per-item transitions under several legal schedules with no implied global barrier;
11. unreachable stage, undeclared target, unowned cycle and missing stop path rejection;
12. failure/cancellation before entry, during owned mutation, at checkpoint and after transition publication;
13. required unavailable result becoming pending with worker/resources released;
14. pressure/exhaustion routed through exact stage contribution and SPEC-0011 outcome;
15. root/session/output operations remaining outside surfaces;
16. unknown or unqualified CUDA-JS capability requirement failing before ignition;
17. product capability and materially different non-game/universal capability using one checkpoint without changing base meaning;
18. fixed game/action/scalar value/ranking/evaluator/stage-list assumptions rejected;
19. stale generation/counter exhaustion without alias; and
20. teardown with exact work/contribution/channel/source-owner disposition.

EXT-CONFORMANCE-001. Reference cases assert semantic state/outcomes, owner boundaries, permissions, conservation, progress and deletion rather than one schedule or native topology.

EXT-CONFORMANCE-002. Mutation tests must independently break checkpoint stability, permission checks, source-owner identity, ordering, deletion, pending-worker release, cycle closure and capability provenance and show the oracle fails.

EXT-CONFORMANCE-003. Native qualification later owns actual CUDA publication scope/races, generated artifact inspection, device resource/occupancy/performance effects, cancellation/teardown and exact compatible-pair evidence. Portable/reference success is not a native support claim.

## 15. Semantic acceptance blockers

This proposal cannot become accepted until:

- every normative requirement above maps to a strict normalized schema/validator and independent CUDA-free reference case or explicit cross-specification proof;
- SPEC-0004 and SPEC-0005 are decision-complete and their requirement IDs/dependencies agree with this contract;
- the source-owner proposal packet is represented without stage-owned semantic duplication;
- whole-substrate, zero-capability and first-consumer deletion pass exactly;
- at least two materially different non-product-shaped stage graphs/capabilities falsify one fixed pipeline/context/output/value assumption;
- permission, ordering, failure, pressure, pending, cancellation, counter exhaustion and cleanup mutations fail under independent oracles; and
- `ENGINE-CONTRACT-ACCEPTANCE-01` accepts this specification atomically with its schemas, reference evidence and coupled proposal dependencies on one exact revision.

Native CUDA-JS-generated artifact disappearance, publication/race behavior, representative cost/occupancy/performance and exact compatible-pair teardown remain mandatory only for production profiles that claim them. They are not circular prerequisites for backend-neutral semantic acceptance.
