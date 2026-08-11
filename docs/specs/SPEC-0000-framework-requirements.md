# CUDA-MCGS Framework Specification Map

**Status:** Proposal

This document defines the scope and common invariants that detailed versioned CUDA-MCGS specifications must cover. Existing UMCGS ADR/specification identifiers remain authoritative while the product-facing name transitions to CUDA-MCGS. This file is not yet a complete implementable specification.

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS engine with schema-backed extension support.**

## 1. Conformance model

A concrete CUDA-MCGS engine is produced from four independent search contracts, a finite resource profile, and zero or more optional extension fragments:

1. **Domain contract** — state, action, transition, identity, node roles, terminal, history, stochasticity/observation, and cycles.
2. **Search-policy contract** — selection, reservation, widening, statistics, backup, root ranking, and termination.
3. **Evaluator contract** — encoding, resident execution behavior, proposals/evaluation outputs, batching, workspace, perspective, and publication.
4. **Search execution/storage contract** — graph arenas, queues, transposition lookup/publication, path records, device-owned search scheduling, lifecycle, pressure, and output.
5. **Resource profile** — concrete finite capacities and pressure/failure behavior.
6. **Extension fragments** — optional device behavior bound before ignition to compatible semantic Extension Points exposed by the selected search.

The mandatory contracts define the search. Optional extensions may influence or augment behavior only through explicitly exposed point contracts; they do not replace the requirement to define domain, search-policy, evaluator, and execution semantics.

The compiler/composer lowers these inputs into:

- a versioned Search IR;
- a resolved Search Extension Surface;
- a finite search/model/extension memory plan;
- generated search layouts and point-specific glue;
- specialized device code with selected fragments physically composed where practical;
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
- whether and where its Search Extension Surface is exposed;
- the exact production evidence required for any claimed zero-overhead specialization.

## 4. Search Extension Surface specification family

CUDA-MCGS MUST define one common extension protocol rather than one framework-wide callback ABI for every optimization or secondary search technique.

A selected search realization exposes an **Extension Surface** containing zero or more **Extension Points**. Each point MUST have:

- stable namespaced point identifier and contract version;
- semantic purpose and exact location in the search lifecycle/decision flow;
- invocation cardinality and scope (thread, warp, block, grid, logical task, node, edge, batch, or another explicitly defined scope);
- a point-specific **Context Schema**;
- readable facts/capabilities;
- writable facts/capabilities and mutation constraints;
- bounded control/result signals where control-flow influence is permitted;
- preserved core invariants;
- memory-space, aliasing, lifetime, and publication semantics;
- synchronization/precondition/postcondition requirements;
- scratch/shared/global workspace and queue/resource bounds;
- failure behavior;
- compatibility/versioning policy.

The point contract defines **where and what the point means**. The Context Schema defines **what representation is available there**. A Context Schema MUST NOT be interpreted as a runtime instruction to discover an attachment location.

Extension Points SHOULD be semantic and optimization-neutral. For example, a candidate-scoring point may enable virtual-loss adjustments, progressive bias, a learned heuristic, or a future technique without adding one public interface for each algorithm.

An Extension Point MUST NOT become a generic unrestricted capability to mutate arbitrary search state. Capabilities and effects are explicit and least-authority for that point.

## 5. Extension Fragment specification family

An **Extension Fragment** is an optional device implementation intended to bind to one or more compatible Extension Points under an explicit manifest.

Each fragment manifest MUST define at least:

- fragment namespaced identity and version;
- exact source/artifact/provenance identity;
- target point ID/version or bounded compatible set;
- required Context Schema fields/capabilities and their semantic/type/range requirements;
- requested read/write/control permissions;
- architecture, CUDA/toolchain, and compile/link capability requirements;
- static configuration inputs;
- persistent state, scratch, shared-memory, global workspace, model, queue, or other finite resource requirements;
- concurrency, synchronization, and publication requirements;
- known incompatibilities/composition constraints;
- deterministic specialization/cache identity inputs;
- error disposition when binding is impossible.

The Search Composer MUST fail closed before ignition when a fragment's contract, schema, permissions, capability profile, version, or resource requirements are incompatible.

A fragment MUST NOT rely on host callbacks, host registry lookup, filesystem/network access, late compilation, or CPU-produced intermediate decisions during active search.

A fragment MAY be bound but inactive at ignition and later become active/inactive based solely on device-resident state and rules already present in the Search Image.

## 6. Search Composer requirements

CUDA-MCGS MUST own the semantic **Search Composer** that transforms universal contracts into one finite specialized engine.

The Composer MUST:

- validate/normalize mandatory contracts and schemas;
- produce the canonical Search IR;
- resolve the concrete Extension Surface for the selected search realization;
- validate all selected Extension Fragments against point contracts and context schemas;
- resolve concrete layouts, widths, ranges, alignment, and generated point adapters;
- compute finite graph/search/evaluator/extension/workspace/output capacities;
- select graph/transposition/cycle/reclamation/reduction/scheduling strategies from accepted capabilities;
- compose selected mandatory and optional device behavior;
- generate complete compilation/link/load inputs without requiring CUDA-JS to interpret Search IR;
- produce complete deterministic artifact/cache identity;
- emit the CUDA-MCGS-to-CUDA-JS execution package and result contract.

CUDA-JS MAY supply generic NVRTC/nvJitLink and other compiler/runtime mechanisms. CUDA-JS MUST NOT own or infer Extension Point meaning, Search IR, search scheduling policy, or search-resource semantics.

## 7. Specialization and extension-cost requirements

Production engine realizations MUST NOT use a universal runtime callback table, service locator, arbitrary function-pointer registry, schema interpreter, or equivalent hot-path mechanism as the default universality strategy.

The production target is:

> **Unbound extension points shall impose zero abstraction overhead in the realized search image. Bound extensions shall impose no generic dispatch overhead beyond the intrinsic work and resource cost of their implementation.**

For an unbound point, the realized production image MUST NOT retain solely for that point:

- a generic enable/disable branch;
- callback/function-pointer lookup;
- registry or schema lookup;
- generic context packing/construction;
- reserved extension-owned state or workspace;
- synchronization required only by the absent extension.

For a bound point, the production path MUST avoid generic runtime dispatch unless an explicitly accepted profile proves that the dispatch is necessary and meets the same performance contract. Device LTO, generated direct composition, templates/code generation, or precompiled specialization are candidate mechanisms; the semantic contract MUST remain independent of one linker technique.

Evidence for this requirement MUST include, where the toolchain permits:

- final or near-final emitted-code inspection (for example PTX/LTO IR/cubin/SASS or equivalent relevant evidence);
- baseline versus unbound-point comparison;
- bound-fragment comparison that separates abstraction cost from fragment-intrinsic work;
- representative performance/resource measurements including registers, occupancy/shared memory/code size where material.

Source structure alone is insufficient evidence.

## 8. Required CUDA-MCGS specification families

Detailed specifications are expected for:

- Search IR and versioning;
- domain contract and device realization;
- search-policy contract and device realization;
- evaluator/model contract and resident device realization;
- Search Extension Surface, Extension Point, Context Schema, Extension Fragment manifest, and composition rules;
- state/action variable-storage model;
- graph node, edge, path, identity, and transposition semantics;
- cycle and history handling;
- generated search-layout description;
- memory planner and pressure state machine;
- device-owned search scheduler and work queues;
- result/output schema;
- CUDA-MCGS-to-CUDA-JS execution-package and adapter contract;
- specialization/cache identity, including exact extension inputs and compatible CUDA-JS runtime/artifact identity;
- conformance-domain/reference interface;
- diagnostics and reproducibility.

These are specification families, not a requirement to create one runtime interface or source component per bullet.

Generic Driver entry-point schemas, CPU call ABI/JIT bindings, generic memory allocation APIs, NVRTC/nvJitLink plumbing, stream/event wrappers, Node event-loop delivery, and generic context teardown belong to CUDA-JS and are not CUDA-MCGS specification families.

## 9. CUDA-MCGS-to-CUDA-JS execution package

The version-zero interop specification MUST define:

- required CUDA-JS public contract version and capability/evidence profile;
- device-module source/LTO/binary forms and complete compilation/link/cache inputs;
- all selected Extension Fragment identities and composition inputs material to the device artifact;
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
- zero, one, or multiple Extension Points without forcing one universal runtime context layout.

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
- extension persistent state/workspace/queues
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
- Search IR and extension-contract conformance;
- search-package generation and manifest correctness;
- fragment compatibility/rejection behavior;
- device closure and search-quality equivalence;
- finite search-memory and pressure behavior;
- zero-abstraction-cost evidence for the production extension realization.

CUDA-JS owns generic runtime/ABI/resource/lifetime/compile/link/load/launch/completion/error/teardown conformance.

A small cross-repository compatibility capsule validates exact released revision/artifact pairs and the public package contract. It MUST NOT duplicate both complete suites or let one repository's mock become the other's semantic oracle.

## 15. Required experiment gates before production commitment

The plan should include bounded experiments for unresolved implementation choices rather than silently promoting them to architecture:

- **EXT-LTO-001** — prove one optional Extension Fragment can be composed through the exact CUDA-JS compiler/link path; compare no-point/bound/unbound realizations and inspect emitted code sufficiently to test the zero-abstraction-cost claim.
- **EXT-LTO-002** — compose multiple representative fragments and measure link/cache identity, register/code-size/shared-memory/occupancy effects, plus compatibility rejection behavior.
- **EXT-CONTRACT-001** — reject wrong point versions, context types/ranges, permissions, resource budgets, architecture requirements, and incompatible fragment combinations before ignition.
- **SCHED-001** — compare credible device-owned scheduling realizations on representative irregular-search plus resident-evaluator/secondary-work workloads; device closure is invariant, scheduler topology is the measured variable.
- **TT-001** — compare cuCollections/reference structures against a CUDA-MCGS-specific transposition-table design for collision verification, concurrent publication, generations/reclamation, finite capacity, and representative performance before selecting reuse/adaptation/custom implementation.

Each experiment requires exact hardware/toolchain/workload identity, semantic equivalence, resource accounting, promotion/rejection criteria, and cleanup/disposition.

## 16. Open decisions

Before production implementation, accepted specifications/evidence are still required for:

- the canonical Search IR representation;
- the canonical Extension Surface/Point/Context Schema/Fragment manifest representation;
- CUDA-MCGS-to-CUDA-JS package and compatibility contract;
- first production fragment-composition realization and its zero-cost evidence;
- initial device-owned scheduling backend/profile-selection rules;
- node/edge identity and generation encoding;
- transposition-table publication protocol and TT-001 reuse decision;
- variable-size arena model;
- reroot/reclamation baseline;
- evaluator resident-fragment ABI/contract;
- reference backend and synthetic conformance suite;
- responsibility boundaries between CUDA-MCGS-generated diagnostics and CUDA-JS generic diagnostics.
