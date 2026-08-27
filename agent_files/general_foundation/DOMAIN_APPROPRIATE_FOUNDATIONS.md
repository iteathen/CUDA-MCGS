# Domain-Appropriate Foundations

**Scope:** Foundational types, schemas, identity, numeric representation, capacities, collections, layouts, and public ranges.

## Purpose before representation

Before choosing a type or layout, define the domain it must survive:

- semantic meaning and unit;
- valid negative, zero, and positive states;
- smallest meaningful increment and required precision;
- practical and hard limits;
- expected cardinality, growth, and distribution;
- persistence and compatibility horizon;
- concurrency, publication, and lifetime;
- performance sensitivity and access pattern;
- finite memory/resource budget;
- invalid, overflow, saturation, and exhaustion behavior.

## Accidental limits

Do not encode the first observed case as the system limit. CUDA-MCGS examples include:

- node/action/path IDs sized only for the first GPU profile;
- a fixed policy width derived from chess or Go;
- state storage assuming a board rather than declared storage capability;
- scalar evaluation because the first model has one value head;
- tree-only references because the first conformance domain lacks transpositions;
- path depth chosen from one game;
- precision that cannot represent declared statistics or resource counters;
- generated layouts treated as permanent public meaning.

## Anti-YAGNI boundary

YAGNI is not a valid objection when a cheap foundational property prevents an ordinary-growth migration. It remains valid against speculative subsystems, unused alternate architectures, and abstraction with no demonstrated invariant.

Ask:

> Is this cheap durable capacity in the foundation, or a separate speculative mechanism?

Choose cheap durable capacity. Reject speculative machinery.

## Bounded universality

Universality is bounded by declared contracts and finite hardware. Every collection, graph, queue, traversal, evaluator batch, diagnostic stream, and output has a capacity or degradation strategy.

The universal framework must represent required range families; each concrete engine chooses the smallest safe specialized representation from its resource plan.

For example, 32-bit indices may be correct for one generated engine when capacity proves they are sufficient. They may not become a permanent universal assumption.

## Identity

Create independent identity only when it preserves a real distinction: continuity, external reference, persistence, replacement/incarnation, stale-reference protection, or diagnostics. Canonical immutable state may itself define semantic identity.

State equality, history dependence, hash collision verification, and generation reuse are separate contracts and must not be inferred from an integer ID.

## Measurement and invalidation

Where storage or performance affects the choice, measure representative and boundary cases. Record assumptions, invalidation signals, and migration/redesign triggers. Preserve bounded instrumentation capable of detecting when assumptions stop being true.
