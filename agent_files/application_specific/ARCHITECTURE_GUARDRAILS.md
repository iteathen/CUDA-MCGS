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

The host owns lifecycle and narrow asynchronous interaction, not phase-by-phase search orchestration. Bounded coherent observation/result reads, externally supplied attention/control changes, cancellation, completion and teardown are permitted only when their absence does not block progress and they cannot form a host read-decide-write or polling/relaunch search loop.

## Production language and CUDA-JS boundary

Maintained CUDA-MCGS production source is JavaScript only: ordinary Node.js host source and restricted Device-JS device-program source consumed through versioned public CUDA-JS contracts. C/C++, CUDA C++, native addons, direct FFI/Driver calls, hand-authored PTX, embedded CUDA source and subprocess native search implementations are prohibited in CUDA-MCGS production. CUDA-JS is not subject to this restriction and may use JIT, native code and CUDA-specific implementation wherever needed or desired; its generated CUDA artifacts remain opaque dependency outputs to CUDA-MCGS.

Do not satisfy this rule by contorting a generic GPU mechanism around an inadequate current API. If natural expression would require material semantic distortion, host progression, unsafe synchronization, artificial kernel fragmentation, duplicated generic lifecycle or private CUDA-JS internals, stop at the boundary and classify a consumer-neutral CUDA-JS capability. Its contract must own bounded resources, synchronization, lifecycle, failure and qualification without knowing MCGS policy. If that separation is not natural, reconsider the CUDA-MCGS design.

The inclination to write native CUDA-MCGS code triggers this analysis immediately; it is a clue that CUDA-JS may be incomplete even before a workaround exists. Classify first, then either extend CUDA-JS, use an already natural public contract, or revise CUDA-MCGS policy/design.

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
- Define initial root, advance, reroot, attention, reclamation, stale references, cancellation, and teardown before relying on persistent state. Advance is only the bounded publication/adoption of an already ready realized successor: it preserves compatible descendant work, lazily supersedes occurrence-scoped sibling work, and performs no graph traversal, transformation, reset, resize, retained-state reclassification, reclamation, or eager cleanup. General root replacement/reconciliation belongs to reroot; directional weighting without authority change belongs to attention.

## Evaluator boundary

The evaluator contract must allow none, proposal-only, evaluation-only, combined, categorical, vector, distributional, uncertainty, and auxiliary outputs. It must declare resident weights/code/workspace, shape profiles, batching, encoding/decoding, and failure behavior.

## Scheduler neutrality before evidence

Do not hard-wire conditional graphs, device graph launch, persistent kernels, CDP, or another scheduler into universal contracts before capability restrictions and benchmark evidence are known. Search IR expresses logical phases and dependencies; the compiler selects an accepted backend.

Scheduler neutrality does not permit a serial-only production milestone. The first usable native engine must expose bounded useful GPU concurrency across selected Domain, Graph, Policy, Evaluator and device-progress work. Physical grid/block/warp/queue/kernel mapping remains profile-owned and independently qualified. Advanced CUDA-JS mechanisms and tensor-shaped execution require a concrete selected profile plus representative evidence; neither is assumed by the universal contracts.

## Performance changes

A hot-path optimization must demonstrate:

- the actual bottleneck;
- correctness and quality equivalence;
- memory effect;
- synchronization effect;
- architecture impact;
- reproducible results.

Do not optimize V8/host call overhead as though it is the principal search cost once one launch owns a move search.
