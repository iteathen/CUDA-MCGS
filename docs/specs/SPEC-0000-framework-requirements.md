# CUDA-MCGS Framework Specification Map

**Status:** Proposal

This document defines the scope and common invariants that detailed versioned CUDA-MCGS specifications must cover. Existing UMCGS ADR/specification identifiers remain authoritative while the product-facing name transitions to CUDA-MCGS. This file is not yet a complete implementable specification.

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS engine with schema-backed extension support.**

## 1. Conformance model

A concrete CUDA-MCGS engine is produced from four independent search contracts, a finite resource profile, and a finite operational Search Stage graph:

1. **Domain contract** — state, action, transition, identity, node roles, terminal, history, stochasticity/observation, and cycles.
2. **Search-policy contract** — selection, reservation, widening, statistics, backup, root ranking, and termination.
3. **Evaluator contract** — encoding, resident execution behavior, proposals/evaluation outputs, batching, workspace, perspective, and publication.
4. **Search execution/storage contract** — graph arenas, queues, transposition lookup/publication, path records, device-owned search scheduling, lifecycle, pressure, and output.
5. **Resource profile** — concrete finite capacities and pressure/failure behavior.
6. **Search Stage graph and capability sets** — finite operational search states, legal transitions, stable entry/exit surfaces, and optional behavior composed before ignition only where a stage contract/schema calls for it.

The mandatory contracts define the search. Optional stage capabilities may influence or augment behavior only through explicitly exposed stable stage checkpoints; they do not replace domain, search-policy, evaluator, or execution semantics and may not observe incomplete stage mutation.

The compiler/composer lowers these inputs into:

- a versioned Search IR;
- a finite validated Search Stage graph;
- resolved stage-owned entry/exit surfaces and Async Stage Channels;
- a finite search/model/stage-capability/channel memory plan;
- generated search layouts and checkpoint-specific glue;
- specialized device code with at most one optional composed Stage PTX input per stage that requires capabilities;
- a versioned CUDA-MCGS-to-CUDA-JS execution package;
- a CUDA-MCGS host adapter package and result contract;
- deterministic specialization/cache/provenance identity.

The independent CUDA-JS repository owns generic Node/CUDA Driver execution, NVRTC/nvJitLink, generic device-artifact handling, launch/completion, resource lifetime, and runtime conformance. CUDA-MCGS specifications own the semantic content of the search package and the stronger device-closure/search requirements imposed on its use.

## 2. Contract and schema relationship

CUDA-MCGS specifications MUST treat schemas as machine-verifiable representation inside a broader behavioral contract.

A contract MUST define every material semantic property not safely expressible as data shape alone, including:

- meaning and perspective;
- ownership and lifetime;
- allowed reads/writes/effects;
- invariants and pre/postconditions;
- concurrency, ordering, synchronization, and publication;
- bounded resources, pressure, and saturation behavior;
- cancellation, failure, recovery, and compatibility.

A referenced schema MUST define the representation facts needed to make that contract machine-verifiable, including namespaced identity/version, fields, type widths, ranges, precision, alignment, normalization, unknown-field/enum policy, and compatibility/migration rules where applicable.

A schema-valid implementation that violates the behavioral contract is non-conforming.

## 3. Common mandatory engine properties

Every concrete engine specification MUST define:

- type widths, ranges, precision, alignment, and endianness where observable;
- one source of truth for search layouts and generated ABI;
- state identity and collision verification;
- transposition and cycle/history semantics;
- parent-edge versus state-node statistics ownership;
- action enumeration/proposal continuation behavior;
- evaluator capabilities and absent-output behavior;
- path and backup perspective/transform semantics;
- concurrency and publication state machines;
- finite capacities, watermarks, overflow, and exhaustion;
- cancellation, completion, error, and result publication;
- compatibility and version negotiation;
- deterministic conformance tests;
- required CUDA-JS contract version/capabilities and exact execution-package identity;
- the boundary between CUDA-MCGS semantic errors and CUDA-JS generic runtime/context errors;
- its finite operational Search Stage graph and legal transitions;
- which stages expose entry and/or exit surfaces and which capabilities share each surface;
- all cross-stage Async Stage Channels, readiness dependencies, progress and deadlock outcomes;
- the exact production evidence required for any claimed zero-overhead specialization.

## 4. Search Stage and Stage Extension Surface specification family

CUDA-MCGS MUST define a finite operational Search Stage graph rather than a fixed game-shaped phase pipeline or a framework-wide callback ABI.

A **Search Stage** owns one stable operational search state and one complete mutation interval for one logical work item. A stage transition is semantic and per work item; it MUST NOT imply a global barrier, kernel boundary, CUDA Graph node, or host transition.

A stage MAY expose a stage-owned **Stage Extension Surface** at stable `entry`, stable `exit`, both, or neither. The surface MUST NOT cross a stage boundary or exist inside the stage's incomplete mutation interval. Each checkpoint MUST define:

- stable namespaced stage/checkpoint identifier and contract version;
- semantic purpose and invocation scope;
- checkpoint-specific Context Schema;
- least-authority readable/writable facts and bounded control signals;
- core-owned invariants and mutation exclusions;
- memory-space, aliasing, lifetime, ordering and publication;
- finite state, scratch, workspace and queue contributions;
- failure, cancellation, pressure and compatibility behavior.

Several capabilities required at one stage MUST share that stage's surface, generated context and composition unit. They MUST NOT multiply runtime extension objects, independently callable PTX fragments, or attachment points.

If optional behavior must participate inside an invariant-forming operation, it belongs in the mandatory stage implementation. If it creates a new stable operational state, it becomes a stage. A context schema describes representation at an already-defined checkpoint; it MUST NOT discover an attachment location at runtime.

## 5. Async Stage Channel specification family

Cross-stage and cross-surface dataflow MAY use finite **Async Stage Channels**. Cross-stage and cross-surface blocking is prohibited.

Each channel MUST define at least:

- namespaced identity/version and producer/consumer stage roles;
- item/correlation identity and generation;
- request/result schema, ownership and lifetime;
- release/acquire publication ordering and CUDA scope;
- readiness, completion, failure and cancellation states;
- capacity, backpressure, expiry, reclamation and stale-result behavior;
- required/optional/advisory consumption and fallback/skip/defer behavior;
- progress, starvation and deadlock outcomes.

A stage MAY publish bounded work for a later stage. Output storage MUST be independently owned, and the producer MUST NOT expose incomplete stage-owned mutation. When a required result is unavailable, the logical consumer enters an explicit pending state and releases the worker and stage resources. The scheduler executes other ready work, including the producer. No worker may spin or synchronously wait for the result.

If no producer can become runnable, capacity forms an unresolved cycle, or a result expires, the engine MUST produce a typed outcome rather than wait indefinitely.

[`SPEC-0003`](SPEC-0003-search-stage-and-extension-surface.md) and [`SPEC-0004`](SPEC-0004-async-stage-channels.md) contain the detailed proposal boundaries.

## 6. Search Composer requirements

CUDA-MCGS MUST own the semantic **Search Composer** that transforms universal contracts into one finite specialized engine.

The Composer MUST:

- validate/normalize mandatory contracts and schemas;
- produce the canonical Search IR;
- construct and validate the finite operational Search Stage graph;
- choose useful stable stage boundaries without confusing them with global phases or kernels;
- resolve each stage's entry/exit surface and normalized capability set;
- validate all capabilities and Async Stage Channels against checkpoint contracts and context schemas;
- resolve concrete layouts, widths, ranges, alignment, and generated checkpoint/channel adapters;
- compute finite graph/search/evaluator/stage-capability/channel/workspace/output capacities;
- select graph/transposition/cycle/reclamation/reduction/scheduling strategies from accepted capabilities;
- compose selected mandatory and optional device behavior;
- generate complete compilation/link/load inputs without requiring CUDA-JS to interpret Search IR;
- produce complete deterministic artifact/cache identity;
- emit the CUDA-MCGS-to-CUDA-JS execution package and result contract.

CUDA-JS MAY supply generic NVRTC/nvJitLink and other compiler/runtime mechanisms. CUDA-JS MUST NOT own or infer stage/checkpoint/capability/channel meaning, Search IR, search scheduling policy, or search-resource semantics.

## 7. Specialization and extension-cost requirements

Production engine realizations MUST NOT use a universal runtime callback table, service locator, arbitrary function-pointer registry, schema interpreter, per-capability fragment loop, or equivalent hot-path mechanism as the default universality strategy.

The production target is:

> **A stage with no selected optional capability shall retain no extension-abstraction residue. All capabilities selected for one stage shall share one composed Stage PTX input and no generic runtime dispatch.**

For a stage with no selected capability, the realized production image MUST NOT retain solely for optional extension:

- a generic enable/disable branch;
- callback/function-pointer lookup;
- registry or schema lookup;
- generic context packing/construction;
- reserved extension-owned state, channel or workspace;
- synchronization required only by the absent capability.

For a non-empty stage capability set, version zero generates exactly one relocatable Stage PTX input containing the complete optional behavior for that stage. If both entry and exit checkpoints are selected, their symbols belong to the same Stage PTX input. The Search Image may link all stage inputs together; Stage PTX does not prescribe a module, kernel, launch or scheduler topology.

Capabilities are declarative composition inputs, not independently callable runtime fragments. Generated direct composition, precompiled specialization or another future mechanism may realize the same semantic contract later; LTO is not the selected version-zero dependency.

Evidence for this requirement MUST include, where the toolchain permits:

- emitted PTX plus final or near-final cubin/SASS inspection, or equivalent evidence for a later accepted profile;
- baseline versus empty-capability-stage comparison;
- composed Stage PTX versus equivalent fused/generated control comparison;
- representative performance/resource measurements including registers, occupancy/shared memory/code size where material.

Source structure alone is insufficient evidence.

## 8. Required CUDA-MCGS specification families

Detailed specifications are expected for:

- Search IR and versioning;
- domain contract and device realization;
- search-policy contract and device realization;
- evaluator/model contract and resident device realization;
- operational Search Stage graph, useful boundary selection, and Stage Extension Surface rules;
- Async Stage Channels, readiness, progress and reclamation;
- Stage PTX composition, checkpoint ABI and Search Image identity;
- state/action variable-storage model;
- graph node, edge, path, identity, and transposition semantics;
- cycle and history handling;
- generated search-layout description;
- memory planner and pressure state machine;
- device-owned search scheduler and work queues;
- result/output schema;
- CUDA-MCGS-to-CUDA-JS execution-package and adapter contract;
- specialization/cache identity, including exact stage/capability/channel inputs and compatible CUDA-JS runtime/artifact identity;
- conformance-domain/reference interface;
- diagnostics and reproducibility.

These are specification families, not a requirement to create one runtime interface or source component per bullet.

Generic Driver entry-point schemas, CPU call ABI/JIT bindings, generic memory allocation APIs, NVRTC/nvJitLink plumbing, stream/event wrappers, Node event-loop delivery, and generic context teardown belong to CUDA-JS and are not CUDA-MCGS specification families.

## 9. CUDA-MCGS-to-CUDA-JS execution package

The version-zero interop specification MUST define:

- required CUDA-JS public contract version and capability/evidence profile;
- relocatable PTX, source, and binary module forms plus complete compilation/link/cache inputs;
- PTX ISA version, virtual target, address size, declared imports/exports and signatures, content digest, compiler/toolkit provenance and options, final GPU target, and link options where material to compatibility or identity;
- the finite stage graph, checkpoint/context identities, capability sets, Async Stage Channels, and ordered Stage PTX inputs material to the device artifact;
- opaque resource and memory requirements without exposing CUDA-JS private handles in persistent CUDA-MCGS schemas;
- function/argument/launch descriptions and allowed execution dependencies;
- initial input/configuration/model/state upload;
- one-way cancellation request semantics;
- completion, diagnostics, and CUDA-MCGS result publication;
- generic runtime versus semantic error classification;
- teardown and partial-creation rollback;
- package manifest, checksums, provenance, and compatibility negotiation;
- exact compatible-pair conformance ownership.

The package MUST contain or reference every device behavior required for active search. CUDA-JS MUST NOT call back into CUDA-MCGS/JavaScript for intermediate search decisions.

## 10. Universality constraints

The Search IR MUST represent at least:

- fixed, variable-blob, delta, and custom state storage;
- exhaustive, paged, sparse top-k, sampled, and custom action proposal;
- deterministic and stochastic transitions;
- decision, chance, terminal, observation, and custom node roles;
- scalar, categorical, vector, distributional, or absent evaluator outputs;
- tree, DAG, and cyclic graph semantics;
- atomic-commutative, segmented-associative, and ordered-owner backup modes;
- best action, top-k, evaluation, sequence, and custom fixed-bounded outputs;
- zero, one, or multiple stage surfaces/capabilities/channels without forcing one universal runtime context layout or fixed stage catalogue.

A concrete engine MAY support a subset, but its capability profile MUST say so before composition/compilation.

The CUDA-JS public runtime cannot become the representation of these search semantics. It receives opaque modules/artifacts, memory requirements, arguments, launches, and completion contracts.

## 11. Device closure

The production execution plan MUST be closed over all data and behavior needed during active search.

Before ignition, CUDA-MCGS/CUDA-JS may perform configuration, schema validation, composition, compilation/linking, allocation, module load, initial upload, and launch preparation.

After ignition, host callbacks, host-controlled phase progression, extension discovery/binding, late code loading, polling that supplies a decision, filesystem/network access, or CPU-computed intermediate results are non-conforming unless the engine is explicitly labeled a diagnostic/reference backend.

CUDA-JS may perform generic submission, one-way cancellation, and completion delivery. CUDA-MCGS may not rely on repeated host relaunches when those relaunches are required to choose or advance the next active-search step.

Device closure MUST NOT imply one mandatory kernel topology. Persistent-kernel, cooperative, device-launched graph, conditional-graph, multi-kernel device-owned, or future mechanisms may conform when they preserve device-owned progress and meet the resource/performance contract.

## 12. Finite memory

The CUDA-MCGS memory plan MUST account for:

```text
available device memory reported/validated through CUDA-JS
- safety reserve
- resident evaluator/model
- evaluator workspace
- stage-capability and Async Stage Channel persistent state/workspace/queues
- generic CUDA-JS/runtime/code requirements
- graph/search storage
- output and diagnostics
```

CUDA-MCGS MUST derive capacities rather than assume allocation success. CUDA-JS MUST provide generic allocation/lifetime outcomes under its public contract. High-watermark and critical-watermark search behavior MUST be deterministic and testable.

Managed memory cannot be assumed as the universal search arena. Memory kind, addressability, mapping, coherence, synchronization, migration, lifetime, and transfer behavior are explicit package/runtime capabilities.

## 13. Ownership and third-party reuse

CUDA-MCGS MUST own its search-semantic and search-critical execution contracts. Higher-level external libraries MUST NOT become mandatory active-search dependencies without an explicit dependency decision that evaluates API/ABI/lifecycle, transitive build/runtime/memory cost, update risk, failure behavior, security, performance, replacement strategy, and loss of local control.

Preferred reuse order:

1. methodology/design/test reuse;
2. independent implementation of CUDA-MCGS-owned semantics;
3. selective permissively licensed source adaptation after exact revision/license/provenance review;
4. vendored/pinned source with an owned patch/update path;
5. external higher-level runtime dependency only when measured benefit outweighs the ownership cost.

CUDA platform/toolchain facilities may be dependencies when recreating them would duplicate the CUDA platform. cuVS, cuFFT, cuCollections, RAPIDS, or another higher-level search/framework runtime are not baseline active-search dependencies.

Any copied/adapted third-party source MUST follow the repository's third-party provenance and reuse policy.

## 14. Test and compatibility ownership

CUDA-MCGS owns:

- semantic reference interpretation;
- synthetic search domains;
- Search IR and stage/surface/channel contract conformance;
- search-package generation and manifest correctness;
- capability/Stage PTX compatibility and rejection behavior;
- device closure and search-quality equivalence;
- finite search-memory and pressure behavior;
- exact empty-capability disappearance and representative Stage PTX cost evidence.

CUDA-JS owns generic runtime/ABI/resource/lifetime/compile/link/load/launch/completion/error/teardown conformance.

A small cross-repository compatibility capsule validates exact released revision/artifact pairs and the public package contract. It MUST NOT duplicate both complete suites or let one repository's mock become the other's semantic oracle.

## 15. Required experiment gates before production commitment

The plan should include bounded experiments for unresolved implementation choices rather than silently promoting them to architecture:

- **EXT-PTX-001 (completed bounded discovery)** — direct relocatable PTX composition, exact unused disappearance, negative contracts, and a one-to-eight-operation granularity matrix passed 42/42 portable and 25/25 Windows-native cases. It rejected tiny fine PTX calls as the default but did not establish a production Stage PTX envelope.
- **STAGE-PTX-001** — generate one Stage PTX containing multiple real capabilities at entry/exit, compare it with an equivalent fused control in representative search/evaluator work, and inspect final calls, code size, registers, occupancy, memory and GPU timing.
- **STAGE-CONTRACT-001** — reject wrong stage/checkpoint/context versions, permissions, resources, ordering and illegal mid-stage/cross-stage mutation before ignition; prove useful boundaries in two materially different domains.
- **CHANNEL-001** — prove required and optional cross-stage/cross-surface dataflow, release/acquire publication, pending/ready rescheduling, saturation, cancellation, stale generations, deadlock outcome and cleanup without worker or host blocking.
- **SCHED-001** — compare credible device-owned scheduling realizations on representative irregular-search plus resident-evaluator/secondary-work workloads; device closure is invariant, scheduler topology is the measured variable.
- **TT-001** — compare cuCollections/reference structures against a CUDA-MCGS-specific transposition-table design for collision verification, concurrent publication, generations/reclamation, finite capacity, and representative performance before selecting reuse/adaptation/custom implementation.

Each experiment requires exact hardware/toolchain/workload identity, semantic equivalence, resource accounting, promotion/rejection criteria, and cleanup/disposition.

## 16. Open decisions

Before production implementation, accepted specifications/evidence are still required for:

- the canonical Search IR representation;
- the complete operational Search Stage graph and useful-boundary representation;
- the accepted Stage Extension Surface/capability/context representation;
- the Async Stage Channel/readiness/progress representation;
- CUDA-MCGS-to-CUDA-JS package and compatibility contract;
- the Stage PTX checkpoint ABI, generator and representative cost envelope;
- initial device-owned scheduling backend/profile-selection rules;
- node/edge identity and generation encoding;
- transposition-table publication protocol and TT-001 reuse decision;
- variable-size arena model;
- reroot/reclamation baseline;
- evaluator resident execution/task ABI/contract;
- reference backend and synthetic conformance suite;
- responsibility boundaries between CUDA-MCGS-generated diagnostics and CUDA-JS generic diagnostics.
