# ADR-0001: Build UMCGS as a New Framework

**Status:** Accepted

**Date:** 2026-08-10

## Context

UMCGS requires a universal, schema-driven, finite-memory, GPU-resident Monte Carlo Graph Search framework. Existing MCTS, MCGS, CUDA, accelerator, game, POMDP, and non-game projects were reviewed before establishing the framework architecture.

Evidence and exact revisions are recorded in [`../research/prior-art/2026-08-10-landscape.md`](../research/prior-art/2026-08-10-landscape.md) and [`../research/prior-art/source-register.yaml`](../research/prior-art/source-register.yaml).

## Decision

Build UMCGS as a new framework rather than fork a reviewed candidate.

Reuse existing work as bounded references and benchmarks:

- Mctx for batched compiled search contracts;
- MCTS-NC and GPU-MCTS literature for CUDA phase/memory experiments;
- CrazyAra and MCGS research for transposition and solved-state semantics;
- LightZero for algorithm taxonomy and benchmark organization;
- OpenSpiel and Pgx for domain capability/conformance cases;
- POMCGraphSearch for partial observability, graph folding, and progressive widening;
- CuFusion-MCTS as a current fused-kernel/persistent-RNG hypothesis to investigate.

Do not copy implementation from GPL, Creative Commons software, uncertain-license, or otherwise incompatible sources without a separate explicit licensing decision. Permissive-source reuse still requires attribution and architectural fit.

## Rationale

No reviewed public implementation combines:

- graph/transposition and cycle/history semantics;
- complete device-resident search after ignition;
- resident evaluator/model execution;
- generic domain, policy, evaluator, resource, and output contracts;
- fixed, lazy, sampled, and continuous action production;
- explicit finite-memory planning and exhaustion behavior;
- generated specialization without permanent universal hot-path cost;
- public code suitable for adoption under a compatible architecture/license.

Forking the nearest candidates would require replacing their core data and execution models, creating a derivative while preserving little of the original foundation.

## Consequences

- The Search IR and contracts precede production code.
- Prior-art projects become benchmark, conformance, and design references rather than hidden dependencies.
- Synthetic domains must prove that the core has no first-domain assumptions.
- UMCGS must justify its complexity with measured GPU baselines.
- Exact source and licensing provenance are mandatory for implementation-level reuse.
- The project license must be selected before importing external code.

## Alternatives considered

### Fork Mctx

Rejected because dense fixed-action tree storage and single-parent topology are foundational JAX design choices, not superficial details.

### Fork MCTS-NC

Rejected because its game-shaped interface, rollout/multiple-tree model, fixed bounds, host-controlled phase loop, and lack of graph/evaluator contracts require foundational replacement.

### Fork CrazyAra

Rejected because it is tied to one production domain, host-search oriented, and GPL-3.0.

### Fork LightZero

Rejected because it is a heterogeneous MCTS/RL toolkit rather than a finite all-device graph runtime.

### Adopt CuFusion-MCTS

Not currently possible: no public implementation was located, and available descriptions do not demonstrate the complete UMCGS boundary.

## Revisit triggers

Re-evaluate this decision if a candidate publishes inspectable code that demonstrates the missing combined boundary, or if UMCGS specifications reveal that a mature permissive component can own a complete subsystem unchanged.
