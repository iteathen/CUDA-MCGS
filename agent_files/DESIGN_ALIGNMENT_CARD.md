# UMCGS Design Alignment Card

Read this before architecture, specification, component creation, implementation, or material design review. It intentionally repeats the rules most likely to prevent agent drift. Read deeper doctrine only when the task triggers it.

## Governing hierarchy

```text
project purpose, domain truth, and accepted authority
    → purpose, bounds, and contextual design weighting
    → LEGO component ownership and boundaries
    → SOLID responsibility structure inside each component
    → CUPID implementation quality
    → simplest sufficient total system
    → measured validation and evolution
```

A lower level may improve a design only inside the valid envelope established above it. “Simple” never means omitting required correctness, resources, lifecycle, compatibility, recovery, or expected-domain capacity.

## LEGO boundary

Every substantial component is a movable brick with:

- one coherent owned invariant or lifecycle responsibility;
- one visible owner for authoritative state and mutation;
- small meaningful domain-named ports;
- composition-visible injected dependencies;
- unstable platform, CUDA, version, format, persistence, and compatibility details behind adapters;
- explicit lifecycle, failure, cancellation, and finite-resource behavior where material;
- isolated contract tests and replaceability without consumer rewrites.

Consumers request changes through contracts. They do not mutate another component’s internals or deep-import private files.

## Universality without vagueness

UMCGS is universal at contracts and compilation boundaries, not through one giant generic runtime object.

- Name the widest truthful invariant, not the first domain or consumer.
- State intended members, permitted variation, and excluded cases.
- Apply the second-instance test: a second intended use should fit by configuration, profile, adapter, or already-permitted extension—not foundational redesign.
- Apply the first-consumer deletion test: a foundation should remain coherent if its first consumer disappears.
- Reject broad `Manager`, `System`, `Common`, `Shared`, `Generic`, `Data`, `Util`, and `Helper` owners that do not state one exact responsibility.

## Foundations and bounds

Before choosing a type, width, identity, schema, collection, queue, precision, or layout, define semantic meaning, units, valid range, cardinality/growth, lifetime, concurrency, persistence/versioning, failure behavior, and memory/performance budget.

Choose cheap durable capacity across the reasonably expected domain. Reject both ordinary-growth migration traps and speculative subsystems.

## Composition

The composition root selects concrete domain, policy, evaluator, CUDA/platform, persistence, and compatibility adapters. It owns wiring and lifecycle—not domain rules. Dependencies point toward stable contracts.

## Total-system simplicity

Measure complexity across callers, adapters, generation, persistence, migration, failure, recovery, operations, diagnostics, tests, and expected second instances. Complexity moved elsewhere is not removed.

Represent essential domain complexity directly. Remove accidental complexity. Reject ceremony that protects no invariant, boundary, responsibility, or operating property.

## UMCGS non-negotiables

- A concrete engine is finite and memory-planned.
- Active production search remains device-closed after ignition.
- Universal contracts do not embed chess, games, one evaluator shape, one action shape, one graph model, or one GPU.
- Generated hot paths may be highly specialized and may eliminate unused abstractions.
- No optimization is accepted without mechanism evidence and semantic/search-quality guardrails.

## Design stop conditions

Stop and resolve the boundary before implementation when ownership is ambiguous, dependencies cycle, a public contract leaks platform/private types, state has multiple writers, a name implies unsupported generality, the expected second instance forces redesign, resource exhaustion is undefined, or alleged simplicity merely exports the problem.

## Deeper doctrine

Start with [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md), then load only the detailed design documents relevant to the task.
