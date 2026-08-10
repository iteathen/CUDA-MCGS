# Engineering Principles

**Scope:** Reusable foundation.

## Purpose before principle

Establish purpose, operating environment, expected ranges, correctness and safety tolerances, performance/memory limits, recovery, observability, and dominant concerns before choosing an architecture.

Correctness, performance, safety, recoverability, usability, trust, and architecture are sibling concerns. Their weights are contextual.

## Organize for mature scale from the first implementation

Repository and component organization should assume the project will become very large even when it currently contains few files.

Create stable product areas, ownership boundaries, dependency direction, public surfaces, registries, and validation homes early. Do not wait for root clutter, deep imports, and mixed ownership to force a disruptive reorganization.

This is not permission to build speculative runtime abstractions. **Organizational readiness and implementation complexity are separate decisions.** Establish the correct place and boundary now; implement only the behavior currently justified.

## Domain-appropriate foundations

Foundational schemas, ranges, numeric types, identifiers, capacities, and interfaces must survive likely expansion within reasonable performance and complexity bounds. Do not encode accidental limits from the first example.

YAGNI may reject speculative features. It may not justify an obviously narrow foundation that cannot represent expected domains or a flat organization that cannot represent expected project scale.

## LEGO architecture

At system boundaries:

- inject dependencies;
- use explicit ports/adapters;
- make configuration and policy data-driven;
- version contracts;
- keep components replaceable and reusable;
- minimize the radius of change.

Inside a component, prefer simple, idiomatic, cohesive code. Do not create micro-abstractions solely to imitate boundary modularity.

## Universal boundaries, specialized internals

Universality belongs in contracts, schemas, and compilation. A concrete runtime should eliminate unused fields, branches, layouts, and abstractions. Permanent runtime interpretation or oversized universal records require measured justification.

## Trustworthy uncertainty

Hard or open problems are not reasons to stop. Work them. But label assumptions, incomplete evidence, and uncertainty rather than manufacturing confidence.
