# ADR-0005: LEGO Design Hierarchy

**Status:** Accepted

**Date:** 2026-08-10

## Context

UMCGS must remain universal at its framework boundaries while producing highly specialized, finite, performance-sensitive GPU implementations. Coding agents need one design hierarchy that prevents local simplicity, premature genericity, platform convenience, or the first domain from overriding ownership and domain truth.

The project owner directed UMCGS to use the LEGO design approach already developed in Ars Thaumaturgica. The adapted doctrine is recorded under `agent_files/general_foundation/` so UMCGS does not depend on another repository for its operating authority.

Source provenance for the adaptation:

- `iteathen/Ars-Thaumaturgica` at `c3e25ad1032a1927c9709580fb415ffc48b91020`;
- `FOUNDATION.md`;
- `docs/foundation/lego-architecture.md`;
- `docs/foundation/component-standard.md`;
- `docs/foundation/contract-standard.md`;
- `docs/foundation/domain-appropriate-foundations.md`;
- `docs/foundation/composition-and-dependencies.md`;
- `docs/foundation/compatibility-and-evolution.md`;
- `docs/foundation/contextual-design-weighting.md`;
- `docs/foundation/maximum-accurate-generality.md`.

The UMCGS files are adapted to GPU graph-search, schema/compiler, device-runtime, resource-planning, and adapter concerns; they are not a blind copy of game-mod-specific rules.

## Decision

UMCGS adopts this design order:

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
simplest sufficient total system
        ↓
measured validation and evolution
```

Lower-level preferences cannot override higher-level authority or constraints.

At the macroscopic level, every substantial component must have one coherent purpose, singular visible state ownership, explicit injected dependencies, narrow meaningful ports, replaceable adapters, explicit lifecycle/resources/failure behavior where material, and independent testability/replacement.

Inside a valid boundary, SOLID separates real responsibilities without ceremonial decomposition, and CUPID guides implementation quality. Simplicity is judged across the complete affected lifecycle, not by local line count.

Reusable concepts use maximum accurate generality: broad enough for the intended substitution class, narrow enough to exclude unrelated meanings, and specific enough to imply a contract. Foundational representations use declared domain ranges and finite resource behavior rather than first-example limits.

## Authoritative doctrine

The compact mandatory doctrine is:

- `agent_files/DESIGN_ALIGNMENT_CARD.md`;
- `agent_files/general_foundation/PRINCIPLES.md`

Detailed triggered doctrine is:

- `LEGO_ARCHITECTURE.md`;
- `COMPONENT_STANDARD.md`;
- `CONTRACT_STANDARD.md`;
- `COMPOSITION_AND_DEPENDENCIES.md`;
- `DOMAIN_APPROPRIATE_FOUNDATIONS.md`;
- `CONTEXTUAL_DESIGN_WEIGHTING.md`;
- `MAXIMUM_ACCURATE_GENERALITY.md`;
- `COMPATIBILITY_AND_EVOLUTION.md`;
- `FORBIDDEN_DESIGN_PATTERNS.md`.

## Consequences

- `PRINCIPLES.md` becomes part of mandatory agent orientation.
- Component and contract work must demonstrate LEGO ownership, domain-appropriate foundations, and total-system simplicity.
- Broad managers, hidden dependencies, service locators, catch-all shared code, first-domain universal schemas, and unbounded resources are rejected by default.
- Static specialization remains compatible with universality because universality resides in accurate contracts.
- A design can be locally elegant and still be rejected for invalid ownership, dependency direction, lifecycle, compatibility, or resource behavior.
- Design reviews use the shared design and naming analysis templates.

## Alternatives considered

### Use only SOLID

Rejected because SOLID primarily governs responsibility and dependencies inside a component; it does not by itself establish macroscopic ownership, ports/adapters, composition, and domain-wide universality.

### Treat simplicity as the highest principle

Rejected because local simplicity can omit required domain truth or export complexity to callers, generated code, memory pressure, recovery, migration, diagnostics, and future adapters.

### One highly generic runtime framework

Rejected because arbitrary generic interfaces and oversized universal records hide ownership and impose permanent GPU memory/dispatch costs.

### Copy Ars Thaumaturgica doctrine verbatim

Rejected because UMCGS needs CUDA, device closure, generated specialization, graph semantics, evaluator, and finite-memory examples and constraints.

## Validation

Agent documentation checks must require the doctrine files and ADR. Implementation/specification templates and review guidance must prompt for the hierarchy where a design boundary is changed.

## Revisit triggers

Revisit when measured project experience demonstrates a conflict, missing scale, or design category that cannot be resolved within the hierarchy. Changes require explicit owner authority and a superseding ADR; individual components may strengthen but not silently weaken the hierarchy.
