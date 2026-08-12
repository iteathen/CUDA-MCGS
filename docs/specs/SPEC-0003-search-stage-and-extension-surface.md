# SPEC-0003: Search Stages and Stage Extension Surfaces

**Status:** Proposal

**Draft version:** 0.2.0

**Owner:** CUDA-MCGS search execution semantics

**Consumers:** Search IR, Search Composer, scheduler, domain/policy/evaluator/product adapters, conformance, capability providers, and generated device programs

This proposal defines the **universal extension/composition substrate** through which CUDA-MCGS may be extended without exposing incomplete search mutation or promoting first-product semantics into the universal core. It does not authorize production lowering until accepted with its normative dependencies.

## 1. Normative references

- [`../decisions/ADR-0018-universal-core-extension-product-layering.md`](../decisions/ADR-0018-universal-core-extension-product-layering.md) owns universal-core / extension-substrate / product separation.
- [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) owns publication channels, finite-resource behavior, stop and partial-result foundations.
- [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) owns the accepted foundational Search IR representation and deterministic reference semantics.
- [`SPEC-0004`](SPEC-0004-async-stage-channels.md) proposes internal cross-stage/cross-surface dataflow.
- [`SPEC-0005`](SPEC-0005-stage-ptx-and-search-image-composition.md) proposes the version-zero Stage PTX realization.
- [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) proposes external Search Session control/observation semantics and keeps them distinct from internal extension callbacks.

Where this proposal conflicts with accepted authority, accepted authority governs and this proposal must be revised.

## 2. Scope

This specification family owns:

- operational Search Stage identity and transition semantics;
- finite stage graph definition and validation;
- stable entry/exit checkpoint rules;
- the universal Stage Extension Surface mechanism;
- universal base checkpoint context and least-authority permissions;
- namespaced capability attachment/composition rules;
- capability-specific specialization-only context/resource contribution;
- stage outcome, failure, cancellation and resource obligations;
- separation between semantic stages and physical CUDA topology;
- separation between universal extension mechanics and product/capability semantics.

It does not define one universal stage list, scheduler mechanism, CUDA ABI, domain state representation, graph layout, evaluator format, host runtime, chess concept, ranked-move output, or fixed capability catalogue.

## 3. Terms

### 3.1 Operational search state

The state of one logical search work item in the engine's execution protocol. It is not the searched domain state, a graph node, a CUDA thread state, a host lifecycle state, or a product UI state.

### 3.2 Search Stage

A namespaced, versioned handler for exactly one operational search state. It accepts a work item satisfying its entry predicate and produces one declared outcome after completing its owned mutation.

### 3.3 Stage transition

The committed change from one operational search state to another for one logical work item. A transition is semantic and does not imply a kernel launch, module boundary, global phase or grid barrier.

### 3.4 Stable checkpoint

An optional stage `entry` or `exit` boundary at which exposed facts satisfy their declared invariants. A checkpoint is the only place a Stage Extension Surface may be invoked.

### 3.5 Stage Extension Surface

The universal least-authority extension mechanism owned by one Search Stage. A surface may expose entry, exit, both, or neither. It never spans two stages and has no mid-stage checkpoint.

A surface is universal because its **checkpoint semantics and permission model** are reusable. It does not make every capability bound to it universal core meaning.

### 3.6 Stage capability

A namespaced/versioned contract/schema-selected behavior allowed at a particular stage checkpoint. Several selected capabilities at the same stage form one capability set and share that stage's surface/composition unit.

Capabilities may be reusable framework capabilities or domain/search-product capabilities. Semantic ownership remains with the capability and its selected domain/policy/evaluator/output/product contract.

### 3.7 Base checkpoint context

The **base checkpoint context** is the minimal universally meaningful set of stable facts the stage surface can expose independent of any first consumer.

### 3.8 Capability context contribution

A selected capability MAY add namespaced context fields, configuration, state, workspace or channel references required only by that capability. Those contributions exist only in specialized Search Images that select the capability. They are not automatically fields of the universal base context or mandatory Search IR core.

## 4. Layering and ownership invariants

EXT-LAYER-001. A Search Stage is justified by a universal operational invariant/readiness transition, not by a desire to create an attachment point for one product.

EXT-LAYER-002. Deleting the first product/capability that uses a stage or surface MUST leave the stage's semantic purpose coherent. Otherwise the stage belongs to that product/capability rather than the universal stage graph.

EXT-LAYER-003. A capability MUST NOT redefine state identity, graph ownership, resource conservation, publication correctness, Search Session lifecycle or another core invariant through its extension code.

EXT-LAYER-004. When a capability changes selected domain/policy/evaluator/output/session meaning, that semantic change MUST be represented by the owning selected contract/profile and included in Search IR/Search Image identity. The Stage Extension Surface only supplies the safe execution/composition boundary.

EXT-LAYER-005. A capability-specific context contribution MUST be absent when the capability is absent. The universal base context MUST NOT accumulate chess fields, model-specific fields, ranking fields, tablebase fields, optimization-specific fields, or other first-consumer baggage.

EXT-LAYER-006. Reuse by multiple products does not automatically promote a capability field/effect into base context. Promotion follows ADR-0018's explicit universal-core promotion rule.

EXT-LAYER-007. Product capability IDs/schemas are namespaced independently from universal stage/checkpoint IDs. A product may depend on a universal checkpoint; the checkpoint does not depend on the product.

## 5. Finite stage graph

Before ignition, every concrete Search Image using the stage substrate MUST contain a finite validated stage graph. Each stage definition MUST declare:

- namespaced stage ID/version;
- semantic purpose and owned invariant;
- work-item kind, identity and generation requirements;
- entry predicate and base facts consumed;
- mutation owned by the stage core;
- legal outcomes and target operational states;
- entry/exit publication dependencies;
- cancellation, pressure, exhaustion and error outcomes;
- bounded work/storage/scratch/queue contribution;
- whether entry and/or exit surfaces exist;
- compatibility/migration policy where identity persists.

Stage IDs describe semantic operational states rather than scheduler mechanisms or one product. A concrete engine MAY use reusable roles such as candidate production, selection, transition, identity/transposition resolution, evaluation, propagation or generic output publication, but CUDA-MCGS MUST NOT impose one AlphaZero/game/chess/tree/bulk-synchronous pipeline.

A contract that introduces a new stable operational invariant or materially different readiness/lifecycle state MUST introduce or replace a stage rather than hide the state inside a mid-stage extension hook.

The Composer rejects unreachable stages, illegal transitions, missing terminal/stop paths, unowned cycles, undeclared publication dependencies, and graphs whose finite resource plan cannot be established.

### 5.1 Semantic categories and boundary usefulness

A stage boundary is defined first by a coherent semantic category, owned invariant and validity transition. Usefulness is a granularity check/tie-breaker among semantically valid placements; it is not authority to invent a product-shaped stage.

Candidate boundaries are compared by:

- stable facts several credible **materially different** capabilities/policies/schedulers could reuse;
- data already materialized without duplicate packing/traversal/synchronization;
- clearer ownership/publication/cancellation/resource lifetimes;
- useful ready/pending work for device scheduling;
- avoidance of extra transitions/queue traffic/calls/code growth;
- meaning across materially different domains/products;
- ability for a second consumer to use the checkpoint without gaining arbitrary authority.

The engine MUST NOT create a stage for every variable change, source block, optimization or possible hook. Conversely, usefulness MUST NOT merge states when doing so hides a materially different invariant, readiness condition, owner, failure mode or resource lifetime.

## 6. Stage mutation interval

The interval after entry commitment and before exit commitment is owned exclusively by the mandatory stage implementation.

- Extension code MUST NOT be invoked inside that interval.
- Other stages/surfaces MUST NOT observe partially established invariants through public capabilities.
- A stage MUST NOT lend a mutable reference whose valid use outlives the checkpoint contract.
- Failure/cancellation inside the interval MUST produce a declared rollback, tombstone, retryable state or terminal outcome; it MUST NOT publish success over incomplete mutation.

Opaque/atomic from the extension perspective does not require one hardware atomic instruction or global transaction. It requires only declared stable public states with correct publication.

## 7. Stage Extension Surface contract

A stage surface MUST define for each exposed checkpoint:

- checkpoint ID: `entry` or `exit`;
- semantic purpose and invocation cardinality;
- work-item/node/edge/path/batch or other explicit scope;
- universal base readable facts and freshness/generation;
- universal base writable facts/result signals/bounded control effects;
- facts/invariants that remain core-owned and immutable;
- memory space/layout/aliasing/lifetime;
- ordering/synchronization/publication;
- base scratch/state/queue/workspace limits;
- failure/skip/fallback/cancellation;
- composition order requirements.

The surface additionally defines **how selected capabilities declare specialization-only context contributions** without widening the base context for absent capabilities.

A context schema describes representation at an already-defined checkpoint. It MUST NOT be interpreted at runtime to discover where code attaches.

Base capabilities are least-authority. Arbitrary address access, arbitrary search-state mutation, runtime reflection and unrestricted control transfer are non-conforming.

## 8. Capability contract and composition

Every selected capability MUST declare:

- namespaced capability ID/version and semantic owner;
- required stage/checkpoint/version;
- required base facts/permissions;
- capability-specific context/configuration schemas;
- semantic effects and the owning selected contract/profile that authorizes those effects;
- persistent/scratch/workspace/channel resource contribution;
- compatibility/provenance/security identity;
- deterministic effect ordering when effects do not commute;
- failure/skip/fallback/cancellation behavior;
- deletion behavior when absent.

All capabilities required at the same stage share one stage-owned surface and one optional composition unit. They do not become independently discovered runtime extensions or one PTX input/call per feature.

Before ignition, the Search Composer MUST:

1. normalize the requested capability set;
2. validate checkpoint/version/permission/resource/semantic-owner requirements;
3. prove writes commute or impose deterministic declared order;
4. generate the minimum universal base context plus only the selected namespaced capability contributions;
5. account for combined finite resources;
6. validate selected Async Stage Channels;
7. reject cycles requiring synchronous cross-stage/cross-surface waiting;
8. reject a capability whose semantic effect has no owning selected contract/profile;
9. omit complete capability-specific context/state/code/resources when absent.

An already-composed capability MAY be active/inactive according to device-resident rules. Activation is not late binding and MUST NOT create unplanned state/code/resources/host dependencies.

## 9. Stage outcomes and readiness

Every invocation ends in one declared outcome, such as:

- transition committed to a named next stage;
- generic result/publication work;
- typed finite-resource pressure/exhaustion;
- cancellation acknowledged;
- retryable work republished under a bounded retry policy;
- consumer moved to an explicit pending state governed by SPEC-0004;
- typed failure.

A stage MUST NOT synchronously wait for a later stage/surface. It MUST NOT retain a worker, lock, reservation, unpublished mutation or stage-owned mutable lease while awaiting future data.

Product-specific output meaning is not implied by a generic output/publication outcome.

## 10. Scheduler neutrality

The semantic stage graph MUST NOT prescribe:

- one CUDA kernel per stage;
- one PTX module per stage;
- global phase ordering;
- a grid-wide barrier at transitions;
- persistent-kernel execution;
- CUDA Graph execution;
- device dynamic parallelism.

Different work items may occupy different stages concurrently. Scheduler conformance is measured by semantic outcomes, publication, bounded progress and resources rather than reproducing one schedule.

## 11. Search Session boundary

External Search Session root-update/control/observation ports are not Stage Extension Surfaces merely because a physical implementation may use similar memory/mailbox mechanisms.

- A root update is external session/domain input governed by SPEC-0006.
- A live product observation is governed by SPEC-0006 plus its selected output/product schema.
- Internal extension callbacks MUST NOT be used to smuggle host-owned search progression into the engine.
- Session observation MUST remain read-only with respect to search-semantic state unless another selected contract truthfully classifies the operation as a semantic input/mutation instead.

## 12. Compatibility and identity

Stage ID/version, checkpoint set, **base** context schema, selected capability IDs/schemas/context contributions, permissions, legal outcomes and publication contract are Search IR/Search Image identity as applicable.

An incompatible change invalidates generated artifacts/cached conformance evidence. Product capability schema evolution occurs under the product/capability owner and cannot silently reinterpret universal base context.

## 13. Failure and security

The Composer fails closed before ignition for unknown stages, checkpoints, capabilities, types, versions, permissions, semantic owners, resource requirements, transition targets or executable provenance.

Stage extension code is executable content. Production profiles use trusted package sources, bounded capabilities, complete artifact identity and no ordinary raw-pointer authority. Capability failure maps to a declared stage outcome; it MUST NOT silently corrupt core state or fall back to host decision service.

A product capability receives no authority merely because product code generated it.

## 14. Conformance requirements

One consolidated stage-contract capsule MUST cover:

- zero, entry-only, exit-only and entry-plus-exit surfaces;
- multiple compatible capabilities sharing one surface;
- universal base context unchanged when a product capability is deleted;
- namespaced capability-specific context appears only when selected;
- incompatible writes/versions/resources/semantic-owner declarations rejected before ignition;
- exact disappearance of an unused capability/surface contribution from generated context/state/calls/resources;
- attempted mid-stage observation/mutation rejected structurally;
- per-work-item transitions without implied global barrier;
- cancellation/failure before/after commitment;
- required async result represented as pending rather than worker wait;
- second-instance domains/products falsifying fixed games/actions/scalar values/ranked outputs/one stage list;
- a chess/product capability and a materially different non-chess capability using the same universal surface without changing base stage meaning.

Reference tests own semantic outcomes. Native CUDA tests additionally own publication scope/races/exact artifact/final-binary/resource/performance evidence.

## 15. Acceptance blockers

This proposal cannot become accepted until:

- its stage/surface/capability representation is normalized in the complete Search IR;
- domain, policy, evaluator, graph/resource/session/output contracts define facts stages consume/publish;
- SPEC-0004 readiness/deadlock/resource behavior is accepted;
- capability-specific context contribution has a deterministic schema/identity/deletion model;
- representative stage graphs prove universality beyond the original fixed-domain prototype and beyond chess;
- producer/consumer/failure/pressure/security tests exist;
- first-consumer deletion proves the extension substrate remains coherent without the first product.