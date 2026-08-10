# Forbidden Design Patterns

**Scope:** Patterns rejected unless an accepted ADR defines a bounded exception and validation.

## Ownership and boundaries

- multiple authoritative writers for one fact;
- consumers mutating another component’s internals;
- deep imports across component boundaries;
- domain/search policy in adapters, composition roots, transport handlers, diagnostics, or UI;
- hidden required globals, service locators, reflection, load-order authority, or ambient CUDA state;
- circular dependencies hidden behind callbacks or registries.

## False universality

- one oversized universal node/edge/state record containing fields for every imagined domain;
- a generic manager accepting arbitrary objects, strings, flags, callbacks, and platform handles;
- naming reusable architecture after its first game, model, algorithm, consumer, or CUDA mechanism;
- broadening a name without broadening the contract, ranges, tests, and implementation;
- fixed action/state/value/graph assumptions in the universal core;
- optional-field schemas used to avoid defining capability contracts;
- shared/common/util/helper dumping grounds presented as foundation.

## False simplicity and speculative architecture

- omitting required correctness, lifecycle, failure, compatibility, recovery, or bounds and calling the result simple;
- exporting complexity to every caller or adapter and counting only local code;
- event buses, workflow engines, identity registries, plugin systems, expression languages, or repository splits before a shared invariant and benefit are demonstrated;
- abstraction for symmetry, class-count reduction, or imagined future use alone;
- preserving a prototype’s shortcuts as production design authority.

## Dependencies and compatibility

- core components constructing concrete adapters or external infrastructure;
- unstable CUDA/platform/model/domain types leaking through core contracts;
- legacy and version conditionals scattered through current domain/runtime logic;
- optional integrations required for core startup;
- dependencies without purpose, owner, version/licensing risk, lifecycle, cost, and replacement strategy.

## Resources, concurrency, and device closure

- unbounded queues, arenas, diagnostics, retries, traversals, or action materialization;
- resource acquisition without terminal-path release;
- implicit publication ordering, stale references, lost wakeups, duplicate execution, or cancellation;
- host-generated intermediate decisions on the production active-search path;
- general device allocation in a demonstrated hot path without an accepted bounded allocator design;
- dynamic dispatch or runtime interpretation in hot paths without measured necessity;
- saturation treated as an impossible exception rather than specified behavior.

## Performance and evidence

- optimization without a measured system effect and semantic/search-quality equivalence;
- benchmark success treated as semantic proof;
- host-call micro-optimization presented as the principal search gain after one launch owns the search;
- first-GPU constants promoted to universal limits;
- profiler or log output without a discriminating mechanism question.

## Exception standard

A bounded exception requires an accepted ADR stating owner, exact need, alternatives, scope, limits, lifecycle, validation, and removal/revisit trigger. Convenience and current small project size are not sufficient reasons.
