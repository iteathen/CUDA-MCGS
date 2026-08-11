# UMCGS Architecture

**Status:** Proposal

## Architectural thesis

UMCGS should be a **search compiler plus specialized device program**, consuming an independent generic CUDA-JS runtime rather than owning Node/CUDA Driver plumbing.

```text
Domain contract ─────────┐
Search-policy contract ──┼─► Search IR ─► validation/capability resolution
Evaluator contract ──────┤                    │
Resource profile ────────┘                    ▼
                                   search memory + layout plan
                                              │
                              search-specific device specialization
                                              │
                                    UMCGS execution package
                                              │
                                      UMCGS CUDA-JS adapter
                                              │
                                   versioned CUDA-JS contract
                                              │
                                         CUDA Driver / GPU
```

Universality is preserved in search contracts. Performance and memory efficiency come from specializing away unused capabilities. Generic native runtime concerns remain reusable and independently versioned in CUDA-JS.

## Proposed UMCGS layers

### 1. Search schema and contract layer

Versioned descriptions define domain, graph, policy, evaluator, outputs, search resources, and device-closure requirements. Human-readable schemas are validated and normalized into one Search IR.

### 2. Search planning/compiler layer

The UMCGS compiler:

- resolves domain/policy/evaluator/search capability compatibility;
- performs range and precision analysis;
- computes the finite search memory budget and capacities;
- generates structure-of-arrays and arena layouts required by the selected search contracts;
- chooses index/generation widths;
- selects search scheduling, reduction, transposition, cycle, and reclamation strategies;
- specializes and composes device search modules and resident evaluator fragments;
- emits a versioned CUDA-JS execution package and UMCGS result contract;
- builds a reproducible identity including every search and runtime specialization input.

It does not implement generic Driver symbol lookup, host-call ABI generation, external-buffer finalization, or native package compatibility.

### 3. Search-specific device program

The generated program owns:

- node, edge, state, action, and path arenas;
- transposition lookup and publication states;
- bounded search work queues;
- evaluator batch formation and result publication;
- backup scheduling;
- root/output publication;
- memory-pressure and search-stop state;
- search instrumentation boundaries;
- device-owned progress after ignition.

It does not know how Node.js locates CUDA Driver symbols or packages native/JIT bindings.

### 4. Specialized plug-ins

Domain, policy, and evaluator operations should be directly linked/inlined where practical. Runtime virtual dispatch in hot paths is not the universality mechanism.

### 5. UMCGS CUDA-JS adapter

The adapter converts the accepted UMCGS execution-package schema into CUDA-JS public operations. It owns compatibility negotiation and the semantic mapping between UMCGS package fields and opaque CUDA-JS resources.

The adapter may not make active search decisions. It may configure, compile/link/load, allocate, upload initial input/configuration, launch, request cancellation one-way, and consume completion.

### 6. External CUDA-JS runtime

CUDA-JS owns generic Driver entry points, binding backends, opaque resources, memory kinds, NVRTC/link/load, generic launches, completion delivery, normalized errors, context health, teardown, packaging, and runtime conformance. UMCGS treats it as a versioned peer product.

## Logical device pipeline

The publication, graph/path ownership, finite-resource, stop, partial-result, and scheduler-neutral semantic obligations across this pipeline are governed by [`../specs/SPEC-0001-device-search-publication-and-resources.md`](../specs/SPEC-0001-device-search-publication-and-resources.md). The concrete pipeline and scheduler below remain architectural proposals.

```text
select/reserve paths
        ↓
transition and transposition lookup/claim
        ↓
terminal/cycle classification
        ↓
action proposal and graph expansion
        ↓
evaluator request compaction and batching
        ↓
resident evaluator execution
        ↓
result publication and backup
        ↓
root/output update
        ↓
resource pressure and stop decision
        └────────────── loop on device
```

The eventual search scheduling backend is deliberately not accepted yet. The disposable global-ticket versus warp-ticket comparison changed ticket-claim count but established no stable timing win. Persistent kernels, supported graph/tail-launch mechanisms, cooperative ownership, or another device-owned strategy must be evaluated against representative capabilities, resource profiles, search-quality equivalence, and measured behavior. A host micro-batch relaunch loop is not conforming when UMCGS progress depends on the host between iterations.

## Data ownership

State-node-shared data may include canonical identity, state storage, terminal result, evaluator result, and generated-action range.

Parent-edge-specific data may include action, child reference, prior/proposal score, visits, reserved visits, accumulated return, and selection statistics.

This separation is required so transpositions share state/evaluation without incorrectly merging all incoming action statistics.

These are UMCGS-generated layouts. They are not CUDA-JS public memory structures.

## Memory strategy

- UMCGS plans all search/model/workspace/output capacities before engine creation.
- CUDA-JS performs generic allocations under explicit memory-kind and lifetime contracts.
- Active search allocates from bounded device arenas selected by UMCGS.
- References use indices plus generations unless an accepted profile proves another representation.
- Layouts contain only fields required by compiled search contracts.
- High pressure reduces or freezes expansion before unsafe allocation.
- The first reclamation design should favor correctness and explicit phases over arbitrary live-node eviction.
- Managed memory is not the foundational search arena; device-local hot state and bounded host-visible control/completion data are separate concerns.

## Reference backend

The CUDA-free deterministic Search IR 0.1.0 interpreter accepted by [`SPEC-0002`](../specs/SPEC-0002-search-ir-and-reference-semantics.md) is the current bounded CUDA-MCGS semantic oracle. It remains a disposable experiment rather than a production component. CUDA-JS may have its own mock/reference runtime for generic lifecycle behavior, but that backend does not define search semantics or production performance.

## Synthetic conformance domains

Before a production adapter, UMCGS should prove:

1. a fixed DAG with deliberate transpositions;
2. a cyclic graph with explicit cutoff semantics;
3. a lazy very-large action space with progressive widening;
4. a stochastic graph with chance nodes;
5. evaluator modes: none, proposal-only, value-only, combined;
6. the same generated-package semantics across the reference backend and a compatible CUDA-JS runtime pair.
