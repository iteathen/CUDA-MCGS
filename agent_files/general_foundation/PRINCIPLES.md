# Engineering Principles

**Scope:** Compact mandatory design alignment for UMCGS. Read this during startup, then load only the detailed doctrine triggered by the task.

This design system is adapted from the project owner’s Ars Thaumaturgica foundation at commit `c3e25ad1032a1927c9709580fb415ffc48b91020`. UMCGS files are authoritative here; the source repository records provenance rather than an external dependency.

## Governing design hierarchy

```text
domain truth and project authority
        ↓
purpose, bounds, and contextual design weighting
        ↓
LEGO component ownership and boundaries
        ↓
SOLID internal responsibility structure
        ↓
CUPID implementation quality
        ↓
sound fundamentals verified
        ↓
simplest sufficient total system
        ↓
measured validation and evolution
```

A lower level may improve a design only inside the valid envelope established above it. Soundness is a gate, not a preference: “simple” never means omitting required correctness, finite-resource behavior, lifecycle, compatibility, recovery, or expected-domain capacity.

## Purpose before architecture

Establish outcome, authority, owner, operating environment, intended equivalence class, expected ranges, correctness/safety tolerances, finite memory/performance limits, lifecycle, recovery, compatibility, observability, and dominant concerns before selecting a representation or component structure.

## Assessment before planning

For substantial and critical work, do not promote the first plausible idea directly into an implementation plan. Assess authority, evidence, ownership, domain foundations, alternatives, resources, failures, and validation; then attack the answers from the strongest credible opposing position. Resolve valid objections by changing the design, narrowing the scope, running an experiment, or rejecting the proposal.

Simplicity is considered only after the fundamentals are sound. Administrative accounting is itself system complexity: keep one authoritative assessment/plan by default, link existing facts, group related answers, and preserve only information that changes decisions, enables execution, supports validation, or prevents costly reconstruction.

See [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md).

## LEGO boundary

Every substantial component is a movable brick with:

- one coherent owned invariant or lifecycle responsibility;
- one visible owner for authoritative state and mutation;
- small meaningful domain-named ports;
- constructor- or composition-visible dependencies;
- unstable platform, CUDA, version, format, domain-instance, and model-instance details behind adapters;
- explicit lifecycle, cancellation, failure, and resource behavior where material;
- isolated contract tests and replaceability without consumer rewrites.

Consumers request changes through contracts. They do not mutate another component’s internals or deep-import private files.

## SOLID and CUPID inside the brick

SOLID separates responsibilities where meaning, ownership, change, testing, substitution, concurrency, or lifetime requires it. It does not require ceremonial decomposition.

CUPID makes the valid implementation composable, idiomatic, predictable, domain-based, and pleasant to work with.

## Universal without vague genericity

UMCGS is universal at contracts and compilation boundaries, not through one giant optional-field runtime object.

- Name the widest truthful invariant, not the first domain or consumer.
- State intended members, permitted variation, and excluded cases.
- Apply the second-instance test: another intended use should fit by configuration, profile, adapter, or an already-permitted extension—not foundational redesign.
- Apply the first-consumer deletion test: a foundation should remain meaningful if its first consumer disappears.
- Reject broad `Manager`, `System`, `Common`, `Shared`, `Generic`, `Data`, `Util`, `Helper`, `Processor`, or `Handler` owners that do not state one exact responsibility.

## Domain-appropriate foundations

Before choosing a type, width, identity, schema, collection, queue, precision, or layout, define semantic meaning, units, valid range, cardinality/growth, lifetime, concurrency, persistence/versioning, failure behavior, and memory/performance budget.

Choose cheap durable capacity across the reasonably expected domain. Reject both ordinary-growth migration traps and speculative subsystems.

## Composition and adapters

The composition root selects concrete domain, policy, evaluator, CUDA/platform, persistence, and compatibility adapters. It owns wiring and lifecycle, not domain/search rules. Dependencies point toward stable contracts.

Physical inlining or linking into a generated engine does not erase conceptual ownership or contract conformance.

## Simplest sufficient total system

Measure complexity across callers, adapters, generation, persistence, migration, failure, recovery, operations, diagnostics, tests, device memory, synchronization, and expected second instances. Complexity moved elsewhere is not removed.

Represent essential domain complexity directly. Remove accidental complexity. Reject ceremony that protects no invariant, boundary, responsibility, or useful operating property.

## UMCGS non-negotiables

- Concrete engines are finite and memory-planned.
- Production active search remains device-closed after ignition.
- Universal contracts do not embed chess, games, one evaluator shape, one action shape, one graph model, or one GPU.
- Generated hot paths may be highly specialized and may eliminate unused abstractions.
- Performance changes require measured mechanism evidence plus semantic and search-quality guardrails.

## Design stop conditions

Stop and resolve the boundary before implementation when ownership is ambiguous, dependencies cycle, a public contract leaks unstable/private types, state has multiple writers, a name implies unsupported generality, the expected second instance forces redesign, resource exhaustion is undefined, or alleged simplicity merely exports the problem.

## Triggered detailed doctrine

- [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md)
- [`LEGO_ARCHITECTURE.md`](LEGO_ARCHITECTURE.md)
- [`COMPONENT_STANDARD.md`](COMPONENT_STANDARD.md)
- [`CONTRACT_STANDARD.md`](CONTRACT_STANDARD.md)
- [`COMPOSITION_AND_DEPENDENCIES.md`](COMPOSITION_AND_DEPENDENCIES.md)
- [`DOMAIN_APPROPRIATE_FOUNDATIONS.md`](DOMAIN_APPROPRIATE_FOUNDATIONS.md)
- [`CONTEXTUAL_DESIGN_WEIGHTING.md`](CONTEXTUAL_DESIGN_WEIGHTING.md)
- [`MAXIMUM_ACCURATE_GENERALITY.md`](MAXIMUM_ACCURATE_GENERALITY.md)
- [`COMPATIBILITY_AND_EVOLUTION.md`](COMPATIBILITY_AND_EVOLUTION.md)
- [`FORBIDDEN_DESIGN_PATTERNS.md`](FORBIDDEN_DESIGN_PATTERNS.md)

Use [`../templates/design-review.template.md`](../templates/design-review.template.md) for a durable design review and [`../templates/naming-analysis.template.yaml`](../templates/naming-analysis.template.yaml) for foundational reusable names.
