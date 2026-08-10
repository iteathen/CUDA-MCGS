# UMCGS Architecture Guardrails

**Scope:** Project-specific architectural constraints for specifications, components, generated engines, adapters, and runtime work.

## LEGO ownership map

UMCGS contracts and components must remain independently owned bricks. In particular:

- schema/IR meaning is owned separately from parsing, compilation, generated layout, and execution;
- the composition/compiler layer selects concrete domain, policy, evaluator, storage, scheduling, and resource implementations but does not own their domain rules;
- graph storage owns node/edge/state/action arena validity, not selection or domain semantics;
- transposition behavior owns lookup/claim/publication/collision contracts, not domain identity itself;
- domain adapters own state identity, transition, terminal, history, and cycle meaning;
- search-policy adapters own selection, reservation, widening, backup, and ranking meaning;
- evaluator adapters own encoding, resident execution contract, and output interpretation;
- host lifecycle owns loading/allocation/launch/cancellation/completion, not active-search decisions;
- diagnostics observe bounded facts and never become a second control plane or state owner.

Concrete implementations may be linked/inlined into one generated binary without erasing these ownership boundaries. Physical fusion is permitted when measured; semantic ownership and contracts remain separate.

## Universal core boundary

The core may know about generic search concepts only through accepted contracts and Search IR. It must not embed:

- chess or board-game rules;
- player count or alternation;
- zero-sum negation;
- fixed legal-action count;
- fixed state size;
- deterministic transition;
- scalar value;
- policy/value neural output;
- tree-only or DAG-only storage;
- rollout-only evaluation;
- one CUDA architecture or memory capacity.

Domain-specific behavior belongs in adapters or specialized generated code.

## Device closure

After ignition, production active search must not wait for CPU-generated intermediate decisions. Device-resident behavior includes all selected domain transitions, action production, identity, terminal/cycle handling, evaluator execution, selection, expansion, backup, scheduling, stopping, and output ranking.

The host owns lifecycle and asynchronous control, not phase-by-phase search orchestration.

## Finite specialization

A compiled engine has bounded state/action/path/queue/output capacities and an explicit memory plan. Specialization may:

- eliminate unused fields/capabilities;
- choose index and generation widths;
- choose precision and layouts;
- inline domain/policy/evaluator operations;
- select scheduling and reduction strategies;
- emit architecture-specific device code.

Universality is not a mandate for one oversized runtime object or permanent dynamic dispatch.

## Large-project component boundaries

The repository organization is governed by [`REPOSITORY_ORGANIZATION.md`](REPOSITORY_ORGANIZATION.md).

Cross-component dependencies must be public, declared, directional, and acyclic. In particular:

- schemas and normalized IR must not depend on compiler/runtime implementation;
- adapter contracts must not depend on one domain or model implementation;
- compiler/tooling may consume schemas/contracts but must not become the runtime source of truth;
- host runtime must not inspect adapter internals;
- device runtime primitives must not embed a first policy/domain/evaluator;
- adapters depend on stable SDK/contracts, not compiler or runtime private files;
- examples and conformance suites consume public surfaces only;
- diagnostics cannot become an alternate control plane.

Do not create generic `common`, `shared`, or `utils` components to conceal unclear ownership. Do not create a broad `SearchManager`, service locator, callback registry, or universal event bus to bypass explicit composition.

## Graph semantics

Specifications must separate state-node-shared data from parent-edge-specific search statistics. State identity, collision verification, history, transpositions, path cycles, graph cycles, and backup paths are domain/policy contracts rather than inferred defaults.

## Memory and lifecycle

- Allocate permanent large resources before active search.
- Use bounded device arenas rather than unbounded per-object allocation.
- Define publication states and visibility ordering.
- Use stable index/generation references unless another representation is accepted.
- Treat queue/table/arena saturation as specified behavior.
- Define reroot, reclamation, stale references, cancellation, and teardown before relying on persistent state.

## Evaluator boundary

The evaluator contract must allow none, proposal-only, evaluation-only, combined, categorical, vector, distributional, uncertainty, and auxiliary outputs. It must declare resident weights/code/workspace, shape profiles, batching, encoding/decoding, and failure behavior.

## Scheduler neutrality before evidence

Do not hard-wire conditional graphs, device graph launch, persistent kernels, CDP, or another scheduler into universal contracts before capability restrictions and benchmark evidence are known. Search IR expresses logical phases and dependencies; the compiler selects an accepted backend.

## Performance changes

A hot-path optimization must demonstrate:

- the actual bottleneck;
- correctness and quality equivalence;
- memory effect;
- synchronization effect;
- architecture impact;
- reproducible results.

Do not optimize V8/host call overhead as though it is the principal search cost once one launch owns a move search.
