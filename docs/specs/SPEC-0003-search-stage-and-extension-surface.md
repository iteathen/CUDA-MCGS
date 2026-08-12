# SPEC-0003: Search Stages and Stage Extension Surfaces

**Status:** Proposal

**Draft version:** 0.1.0

**Owner:** CUDA-MCGS search execution semantics

**Consumers:** Search IR, Search Composer, scheduler, domain/policy/evaluator adapters, conformance, and generated device programs

This proposal defines the semantic stage boundary through which CUDA-MCGS may be extended without exposing incomplete search mutation. It does not authorize production lowering until accepted with its normative dependencies.

## 1. Normative references

- [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) owns publication channels, finite-resource behavior, stop and partial-result semantics.
- [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) owns the accepted foundational Search IR representation and deterministic reference semantics.
- [`SPEC-0004`](SPEC-0004-async-stage-channels.md) proposes cross-stage/cross-surface dataflow.
- [`SPEC-0005`](SPEC-0005-stage-ptx-and-search-image-composition.md) proposes the version-zero Stage PTX realization.

Where this proposal conflicts with accepted authority, accepted authority governs and this proposal must be revised.

## 2. Scope

This specification family owns:

- operational Search Stage identity and transition semantics;
- stage graph definition and validation;
- stable entry/exit checkpoint rules;
- Stage Extension Surface capability and mutation bounds;
- stage outcome, failure, cancellation and resource obligations;
- separation between semantic stages and physical CUDA execution topology.

It does not define one universal stage list, scheduler mechanism, CUDA ABI, domain state representation, graph-store layout, evaluator format, or host runtime.

## 3. Terms

### 3.1 Operational search state

The state of one logical search work item in the engine's execution protocol. It is not the searched domain state, a graph node, a CUDA thread state, or a host lifecycle state.

### 3.2 Search Stage

A namespaced, versioned handler for exactly one operational search state. It accepts a work item satisfying its entry predicate and produces one declared outcome after completing its owned mutation.

### 3.3 Stage transition

The committed change from one operational search state to another for one logical work item. A transition is semantic and does not imply a kernel launch, module boundary, global phase or grid barrier.

### 3.4 Stable checkpoint

An optional stage `entry` or `exit` boundary at which the facts exposed by the contract satisfy their declared invariants. A checkpoint is the only place a Stage Extension Surface may be invoked.

### 3.5 Stage Extension Surface

The least-authority optional capability surface owned by one Search Stage. A surface may expose entry, exit, both, or neither. It never spans two stages and has no mid-stage checkpoint.

### 3.6 Stage capability

A contract/schema-selected behavior allowed at a particular stage checkpoint. Several capabilities selected for the same stage form one capability set and share that stage's surface.

## 4. Finite stage graph

Before ignition, every concrete Search Image MUST contain a finite validated stage graph. Each stage definition MUST declare:

- namespaced stage ID and version;
- semantic purpose and owned invariant;
- work-item kind, identity and generation requirements;
- entry predicate and facts/capabilities consumed;
- mutation owned by the stage core;
- legal outcomes and target operational states;
- entry/exit publication dependencies;
- cancellation, pressure, exhaustion and error outcomes;
- bounded work, storage, scratch and queue contribution;
- whether entry and/or exit surfaces exist;
- compatibility and migration policy where identity persists.

Stage IDs MUST describe semantic operational states rather than one scheduler mechanism. A concrete engine MAY use reusable roles such as candidate production, selection, transition, transposition resolution, evaluation, propagation or output, but CUDA-MCGS MUST NOT impose one fixed AlphaZero, game, tree or bulk-synchronous pipeline.

A contract that introduces a new stable operational invariant or materially different readiness/lifecycle state MUST introduce or replace a stage rather than hide the state inside a mid-stage extension hook.

The composer MUST reject unreachable stages, illegal transitions, missing terminal/stop paths, unowned cycles, undeclared publication dependencies, and stage graphs whose finite resource plan cannot be established.

### 4.1 Semantic categories and boundary usefulness

A stage boundary is defined first by a coherent semantic category, owned invariant and validity transition. Usefulness is then a granularity check and tie-breaker among semantically valid placements; it is not independent authority to invent or erase a semantic state.

Within that ordering, candidate boundaries are compared by:

- whether they expose stable facts that several credible capabilities or scheduler decisions can reuse;
- whether required data is already materialized without duplicate packing, traversal or synchronization;
- whether ownership, publication, cancellation and resource lifetimes become clearer;
- whether the boundary creates useful ready/pending work for device scheduling;
- whether it avoids extra transitions, queue traffic, calls and code growth;
- whether it remains meaningful across materially different domains and policies;
- whether a second consumer can use it without gaining arbitrary mutation authority.

The engine MUST NOT create a stage for every internal variable change, source-code block or possible hook. It defines operational search states at useful stable semantic validity transitions. Conversely, usefulness MUST NOT merge states when doing so hides a materially different invariant, readiness condition, owner, failure mode or resource lifetime.

## 5. Stage mutation interval

The interval after entry commitment and before exit commitment is owned exclusively by the stage implementation.

- Extension code MUST NOT be invoked inside that interval.
- Other stages and extension surfaces MUST NOT observe partially established stage invariants through a public capability.
- A stage MUST NOT lend a mutable reference whose valid use can outlive the checkpoint contract.
- A failure or cancellation inside the interval MUST produce a declared rollback, tombstone, retryable state, or terminal outcome; it MUST NOT publish a success outcome over incomplete mutation.

“Opaque/atomic from the extension perspective” does not require a single hardware atomic instruction or global transaction. It requires that the public stage protocol expose only declared stable states with correct publication.

## 6. Stage Extension Surface

A stage surface contract MUST define for each exposed checkpoint:

- checkpoint ID: `entry` or `exit`;
- semantic purpose and invocation cardinality;
- work-item, node, edge, path, batch or other explicit scope;
- readable facts and their freshness/generation;
- writable facts, result signals and bounded control effects;
- facts and invariants that remain core-owned and immutable to the surface;
- memory space, layout, aliasing and lifetime;
- ordering, synchronization and publication obligations;
- scratch, persistent state, queue and workspace limits;
- failure, skip, fallback and cancellation behavior;
- deterministic capability-composition order where effects do not commute.

A context schema describes the representation available at an already-defined checkpoint. It MUST NOT be interpreted at runtime to discover where code attaches.

Capabilities MUST be optimization-neutral and least-authority. Capability names describe allowed semantic effects, not the name of one current optimization. Arbitrary address access, arbitrary search-state mutation, runtime reflection and unrestricted control transfer are non-conforming.

## 7. Capability composition

All capabilities required at the same stage MUST share one stage-owned surface. They MUST NOT become independently discovered runtime extensions or multiply the number of PTX composition inputs for that stage.

Before ignition, the Search Composer MUST:

1. normalize the requested capability set;
2. validate checkpoint, version, permission, resource and compatibility requirements;
3. prove that writes commute or impose a deterministic declared order;
4. generate the minimum shared checkpoint context;
5. account for the combined finite resource contribution;
6. reject cycles or dependencies that require synchronous cross-stage/cross-surface waiting;
7. omit the complete surface when no capability requires it.

An already-composed capability MAY be active or inactive according to device-resident rules. Activation is not late binding and MUST NOT create unplanned state, code, resources or host dependencies.

## 8. Stage outcomes and readiness

Every invocation MUST end in one declared outcome, such as:

- transition committed to a named next stage;
- terminal/result publication;
- typed finite-resource pressure or exhaustion;
- cancellation acknowledged;
- retryable work republished under a bounded retry policy;
- consumer moved to an explicit pending state governed by SPEC-0004;
- typed failure.

A stage MUST NOT synchronously wait for a later stage or surface. It MUST NOT retain a worker, lock, reservation, unpublished mutation, or stage-owned mutable lease while awaiting future data.

## 9. Scheduler neutrality

The semantic stage graph MUST NOT prescribe:

- one CUDA kernel per stage;
- one PTX module per stage;
- global phase ordering;
- a grid-wide barrier at transitions;
- persistent-kernel execution;
- CUDA Graph execution;
- device dynamic parallelism.

A scheduler may execute different work items in different stages concurrently when their contracts and resources allow it. Scheduler conformance is measured by semantic outcomes, publication, bounded progress and resource behavior rather than by reproducing one schedule.

## 10. Compatibility and identity

Stage ID/version, checkpoint set, context schema, capabilities, permissions, legal outcomes and publication contract are part of Search IR and Search Image identity. An incompatible change MUST invalidate generated artifacts and cached conformance evidence. Compatibility translation occurs before the current stage graph enters the core.

## 11. Failure and security

The composer MUST fail closed before ignition for unknown stages, checkpoints, capabilities, types, versions, permissions, resource requirements, transition targets or executable provenance.

Stage extension code is executable content. Production profiles MUST use trusted package sources, bounded capabilities, complete artifact identity and no ordinary raw-pointer capability. A capability failure MUST map to a declared stage outcome; it MUST NOT silently corrupt core state or fall back to host decision service.

## 12. Conformance requirements

At minimum, one consolidated stage-contract capsule MUST cover:

- zero, entry-only, exit-only and entry-plus-exit surfaces;
- multiple compatible capabilities sharing one surface;
- incompatible writes, versions, resources and ordering rejected before ignition;
- exact disappearance of an unused surface from generated context, state and calls;
- attempted mid-stage observation/mutation rejected structurally;
- per-work-item transitions without an implied global barrier;
- cancellation/failure before and after commitment;
- a required async result represented as pending rather than a worker wait;
- second-instance domains that falsify fixed games, fixed actions, scalar values and one stage list.

Reference tests own semantic outcomes. Native CUDA tests additionally own publication scope, race behavior, exact artifact identity, final-binary structure and resource/performance evidence.

## 13. Acceptance blockers

This proposal cannot become accepted until:

- its Search IR representation is specified and normalized;
- domain, policy, evaluator and execution contracts define the facts stages consume and publish;
- SPEC-0004 readiness/deadlock/resource behavior is accepted;
- representative stage graphs prove universality beyond the original fixed-domain prototype;
- producer/consumer contract tests and failure/pressure cases exist.
