# Contextual Design Weighting

**Scope:** Selecting among valid designs and evidence paths after purpose and bounds are known.

Correctness, performance, safety, recoverability, usability, trust, architecture, delivery value, memory, and process cost are sibling concerns. No concern dominates every subsystem.

Process cost includes agent context/tokens, latency, operator attention, record maintenance, CI resources, review burden, and drift risk. It cannot waive a critical safeguard but counts against controls that reduce no identified risk.

## Required sequence

1. Define subsystem/task purpose and owner.
2. Define operating bounds, tolerances, and resource budget.
3. Identify failure modes, consequence, reversibility, opacity, and affected consumers.
4. Weight concerns for this context.
5. Select the lowest complete design and validation rigor.
6. Record meaningful tradeoffs and invalidation signals.
7. Validate against the chosen weights.

## UMCGS examples

### Search IR and public schemas

Highest weight: semantic correctness, accurate generality, compatibility, deterministic normalization, and conformance. A slightly more explicit schema is preferable to implicit first-domain assumptions.

### Device scheduler and graph store

Highest weight: correctness, bounded measured performance, memory use, publication ordering, saturation behavior, and recoverability/teardown. Ergonomic abstraction cannot hide synchronization or allocation.

### CUDA Driver adapter

Highest weight: ABI correctness, capability/version handling, security of native capabilities, replaceability, and failure diagnostics. Compatibility details remain in the adapter.

### Component-local offline generator

Highest weight: determinism, traceability, maintainability, and clear failure. Runtime latency may be secondary.

### Small reversible documentation correction

Highest weight: accuracy, discoverability, and low process cost. Formal architecture work is waste unless the correction changes authority.

## Tradeoff record

A meaningful tradeoff states:

- concern reduced;
- benefit gained;
- conditions under which it remains valid;
- evidence or measurement;
- invalidation signal;
- rollback/redesign trigger;
- memory/performance/process cost when material.

## Non-waivable boundaries

Weighting cannot waive explicit ownership, dependency direction, domain-appropriate ranges, device closure, finite resource behavior, security/provenance, versioning of public/persisted meaning, exact revision evidence, or honest claims.

Weighting chooses among valid designs. It does not authorize invalid architecture or ceremony with no purpose.
