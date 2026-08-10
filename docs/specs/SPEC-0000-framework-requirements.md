# UMCGS Framework Specification Map

**Status:** Proposal

This document defines the scope and common invariants that detailed versioned UMCGS specifications must cover. It is not yet a complete implementable specification.

## 1. Conformance model

A UMCGS engine is produced from four independent search contracts plus a finite resource profile:

1. **Domain contract** — state, action, transition, identity, node roles, terminal, history, and cycles.
2. **Search-policy contract** — selection, reservation, widening, statistics, backup, root ranking, and termination.
3. **Evaluator contract** — encoding, resident execution fragment, proposals/evaluation outputs, batching, workspace, and publication.
4. **Search execution/storage contract** — graph arenas, queues, transposition lookup, path records, device-owned search scheduling, lifecycle, and output.
5. **Resource profile** — concrete finite capacities and pressure/failure behavior.

The compiler lowers these inputs into:

- a versioned Search IR;
- a finite search memory plan;
- generated search layouts and specialized device code;
- a versioned UMCGS-to-CUDA-JS execution package;
- an UMCGS host adapter package and result contract.

The independent CUDA-JS repository owns generic Node/CUDA Driver execution. UMCGS specifications own the semantic content of the package and the stronger device-closure/search requirements imposed on its use.

## 2. Common mandatory properties

Every concrete engine specification MUST define:

- type widths, ranges, precision, alignment, and endianness where observable;
- one source of truth for search layouts and generated ABI;
- state identity and collision verification;
- transposition and cycle semantics;
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
- the boundary between UMCGS semantic errors and CUDA-JS generic runtime/context errors.

## 3. Required UMCGS specification families

Detailed specifications are expected for:

- Search IR and versioning;
- domain plug-in ABI;
- search-policy plug-in ABI;
- evaluator/model ABI and resident graph fragment;
- state/action variable-storage model;
- graph node, edge, path, and transposition semantics;
- cycle and history handling;
- generated search-layout description;
- memory planner and pressure state machine;
- device-owned search scheduler and work queues;
- result/output schema;
- UMCGS-to-CUDA-JS execution-package and adapter contract;
- specialization/cache identity, including the compatible CUDA-JS runtime/artifact identity;
- conformance-domain interface;
- diagnostics and reproducibility.

Generic Driver entry-point schemas, CPU call ABI/JIT bindings, generic memory allocation APIs, NVRTC plumbing, stream/event wrappers, Node event-loop delivery, and generic context teardown belong to CUDA-JS and are not UMCGS specification families.

## 4. UMCGS-to-CUDA-JS execution package

The version-zero interop specification MUST define:

- required CUDA-JS public contract version and capability profile;
- device-module source/binary forms and complete compilation/link/cache inputs;
- opaque resource and memory requirements, without exposing CUDA-JS private handles in persistent UMCGS schemas;
- function/argument/launch descriptions and allowed execution dependencies;
- initial input/configuration upload;
- one-way cancellation request semantics;
- completion, diagnostics, and UMCGS result publication;
- generic runtime versus semantic error classification;
- teardown and partial-creation rollback;
- package manifest, checksums, provenance, and compatibility negotiation;
- conformance ownership and exact tested UMCGS/CUDA-JS revision pairs.

The package MUST contain every device behavior required for active search. CUDA-JS MUST NOT call back into UMCGS or JavaScript for intermediate search decisions.

## 5. Universality constraints

The Search IR MUST represent at least:

- fixed, variable-blob, delta, and custom state storage;
- exhaustive, paged, sparse top-k, sampled, and custom action proposal;
- deterministic and stochastic transitions;
- decision, chance, terminal, observation, and custom node roles;
- scalar, categorical, vector, distributional, or absent evaluator outputs;
- tree, DAG, and cyclic graph semantics;
- atomic-commutative, segmented-associative, and ordered-owner backup modes;
- best action, top-k, evaluation, sequence, and custom fixed-bounded outputs.

A concrete engine MAY support a subset, but its capability profile MUST say so before compilation.

The CUDA-JS public runtime cannot become the representation of these search semantics. It receives opaque modules, memory requirements, arguments, launches, and completion contracts.

## 6. Device closure

The production execution plan MUST be closed over all data and behavior needed during active search. Host callbacks, host-controlled phase progression, polling that supplies a decision, filesystem/network access, or CPU-computed intermediate results are non-conforming unless the engine is explicitly labeled a diagnostic/reference backend.

CUDA-JS may perform generic submission and completion delivery. UMCGS may not rely on repeated host relaunches when those relaunches are required to choose or advance the next active-search step.

## 7. Finite memory

The UMCGS memory plan MUST account for:

```text
available device memory reported/validated through CUDA-JS
- safety reserve
- resident evaluator/model
- evaluator workspace
- generic CUDA-JS/runtime/code requirements
- graph/search storage
- output and diagnostics
```

UMCGS MUST derive search capacities rather than assume allocation success. CUDA-JS MUST provide generic allocation/lifetime outcomes under its public contract. High-watermark and critical-watermark search behavior MUST be deterministic and testable.

Managed memory cannot be assumed as the universal search arena. Memory kind, addressability, mapping, coherence, synchronization, migration, lifetime, and transfer behavior are explicit package/runtime capabilities.

## 8. Test and compatibility ownership

UMCGS owns:

- semantic reference interpretation;
- synthetic search domains;
- search-package generation and manifest correctness;
- device closure and search-quality equivalence;
- finite search-memory and pressure behavior.

CUDA-JS owns generic runtime/ABI/resource/lifetime/compile/load/launch/completion/error/teardown conformance.

A small cross-repository compatibility capsule validates exact released revision/artifact pairs and the public package contract. It MUST NOT duplicate both complete suites or let one repository's mock become the other's semantic oracle.

## 9. Open decisions

Before production implementation, accepted specifications are still required for:

- the canonical Search IR representation;
- UMCGS-to-CUDA-JS package and compatibility contract;
- search module composition and device linking inputs;
- initial device-owned search scheduling backend;
- node/edge identity and generation encoding;
- transposition-table publication protocol;
- variable-size arena model;
- reroot/reclamation baseline;
- evaluator graph-fragment ABI;
- reference backend and synthetic conformance suite;
- responsibility boundaries between UMCGS-generated diagnostics and CUDA-JS generic diagnostics.