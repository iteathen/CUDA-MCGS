# UMCGS Framework Specification Map

**Status:** Proposal

This document defines the scope and common invariants that detailed versioned specifications must cover. It is not yet a complete implementable specification.

## 1. Conformance model

A UMCGS engine is produced from four independent contracts plus a finite resource profile:

1. **Domain contract** — state, action, transition, identity, node roles, terminal, history, and cycles.
2. **Search-policy contract** — selection, reservation, widening, statistics, backup, root ranking, and termination.
3. **Evaluator contract** — encoding, resident execution fragment, proposals/evaluation outputs, batching, workspace, and publication.
4. **Execution/storage contract** — graph arenas, queues, transposition lookup, path records, scheduling backend, lifecycle, and output.
5. **Resource profile** — concrete finite capacities and pressure/failure behavior.

The compiler lowers these inputs into a versioned Search IR, a memory plan, generated layouts, specialized device code, and a host lifecycle package.

## 2. Common mandatory properties

Every concrete engine specification MUST define:

- type widths, ranges, precision, alignment, and endianness where observable;
- one source of truth for layouts and ABI;
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
- deterministic conformance tests.

## 3. Required specification families

Detailed specifications are expected for:

- Search IR and versioning;
- domain plug-in ABI;
- search-policy plug-in ABI;
- evaluator/model ABI and graph fragment;
- state/action variable-storage model;
- graph node, edge, path, and transposition semantics;
- cycle and history handling;
- generated layout description;
- memory planner and pressure state machine;
- device scheduler and work queues;
- result/output schema;
- host lifecycle and CUDA Driver API boundary;
- specialization cache identity;
- conformance-domain interface;
- diagnostics and reproducibility.

## 4. Universality constraints

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

## 5. Device closure

The production execution plan MUST be closed over all data and behavior needed during active search. Host callbacks, polling, filesystem/network access, or CPU-computed intermediate decisions are non-conforming unless the engine is explicitly labeled a diagnostic/reference backend.

## 6. Finite memory

The memory plan MUST account for:

```text
available device memory
- safety reserve
- resident evaluator/model
- evaluator workspace
- runtime and code
- graph/search storage
- output and diagnostics
```

It MUST derive capacities rather than assume allocation success. High-watermark and critical-watermark behavior MUST be deterministic and testable.

## 7. Open decisions

Before implementation, accepted specifications are still required for:

- the canonical Search IR representation;
- module composition and device linking;
- initial scheduler backend;
- node/edge identity and generation encoding;
- transposition-table publication protocol;
- variable-size arena model;
- reroot/reclamation baseline;
- evaluator graph-fragment ABI;
- reference backend and synthetic conformance suite.
