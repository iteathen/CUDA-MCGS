# UMCGS Architecture

**Status:** Proposal

## Architectural thesis

UMCGS should be a **search compiler plus device runtime**, not one universal precompiled MCGS kernel.

```text
Domain contract ─────────┐
Search-policy contract ──┼─► Search IR ─► validation/capability resolution
Evaluator contract ──────┤                    │
Resource profile ────────┘                    ▼
                                   memory + layout compiler
                                              │
                              device code specialization/linking
                                              │
                                  execution graph + host package
                                              │
                                      finite GPU-resident engine
```

Universality is preserved at the contracts. Performance and memory efficiency come from specializing away unused capabilities.

## Proposed layers

### 1. Schema and contract layer

Versioned descriptions define domain, policy, evaluator, execution capabilities, outputs, and resources. Human-readable schemas are validated and normalized into one Search IR.

### 2. Planning/compiler layer

The compiler:

- resolves capability compatibility;
- performs range and precision analysis;
- computes the memory budget and capacities;
- generates structure-of-arrays and arena layouts;
- chooses index/generation widths;
- selects scheduling and reduction strategies;
- specializes and links device modules;
- emits host lifecycle bindings and diagnostics;
- builds a reproducible cache identity.

### 3. Device runtime layer

The minimal generic runtime owns:

- node, edge, state, action, and path arenas;
- transposition lookup and publication states;
- bounded work queues;
- evaluator batch formation and result publication;
- backup scheduling;
- output/top-k publication;
- memory-pressure and termination state;
- instrumentation boundaries.

It does not know what a chess move, token, player, or neural policy means.

### 4. Specialized plug-ins

Domain, policy, and evaluator operations should be directly linked/inlined where practical. Runtime virtual dispatch in hot paths is not the universality mechanism.

### 5. Host control plane

The host control plane loads schemas/modules/model, allocates permanent resources, instantiates execution, uploads initial input/configuration, launches once, requests cancellation one-way if needed, and consumes completion. It does not schedule active search phases.

## Logical device pipeline

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

The eventual CUDA scheduling backend is deliberately not accepted yet. Conditional graphs, self-tail-launched graphs, persistent kernels, or another mechanism must be evaluated against capability restrictions and measured behavior.

## Data ownership

State-node-shared data may include canonical identity, state storage, terminal result, evaluator result, and generated-action range.

Parent-edge-specific data may include action, child reference, prior/proposal score, visits, reserved visits, accumulated return, and selection statistics.

This separation is required so transpositions share state/evaluation without incorrectly merging all incoming action statistics.

## Memory strategy

- Permanent large allocations occur at engine creation.
- Active search allocates from bounded device arenas.
- References use indices plus generations unless an accepted profile proves another representation.
- Layouts contain only fields required by the compiled contracts.
- High pressure reduces or freezes expansion before unsafe allocation.
- The first reclamation design should favor correctness and explicit phases over arbitrary live-node eviction.

## Reference backend

A deterministic CPU interpreter of Search IR is proposed as a test oracle only. It is not part of production search and does not weaken the device-closure invariant.

## Synthetic conformance domains

Before a production adapter, the framework should prove:

1. a fixed DAG with deliberate transpositions;
2. a cyclic graph with explicit cutoff semantics;
3. a lazy very-large action space with progressive widening;
4. a stochastic graph with chance nodes;
5. evaluator modes: none, proposal-only, value-only, combined.
