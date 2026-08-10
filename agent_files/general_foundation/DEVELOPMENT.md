# Development Rules

**Scope:** Reusable foundation.

## Placement before implementation

Before writing a production artifact, identify its product area, component, owner, lifecycle, public surface, dependencies, validation, and durable path.

The repository is organized for expected mature scale rather than current file count. A convenient temporary root path is not an acceptable first home when the durable ownership boundary is already knowable.

Follow [`PROJECT_ORGANIZATION.md`](PROJECT_ORGANIZATION.md).

## Ownership over file locality

Behavior may cross many files. The owner is the component or contract responsible for the behavior, not the file where the symptom appears. Repair the owning boundary and update all dependent representations together.

A component should be independently understandable through its README and manifest. Other components consume its public contract, not its internal file layout.

## Coherent progress

Use the largest safe coherent batch. Repeated tiny passes force agents to reread stale context and increase drift. A tiny restart is appropriate only when test state is contaminated or a boundary must be isolated.

When a change creates or moves a boundary, update its component manifest, registry, public interfaces, tests, documentation, and migration in the same coherent change.

## Interfaces and state

- Make ownership, lifetime, nullability, errors, cancellation, and resource exhaustion explicit.
- Prefer stable identifiers/capabilities over leaked raw implementation addresses.
- Keep persistent formats versioned and migratable.
- Preserve one source of truth; derived state must be clearly derived and regenerable.
- Avoid hidden globals and cross-layer reach-through.
- Keep public contract and internal implementation distinguishable.
- Do not deep-import another component's internals.

## Dependencies

Introduce a dependency only when its ownership, versioning, licensing, failure behavior, platform support, and replacement boundary are understood. Do not couple the generic core to a domain convenience library.

Component dependencies must be declared, directional, and acyclic. Shared behavior belongs in a deliberately named owner component with a narrow contract—not in a generic dumping ground.

## Compatibility

When changing a public or persistent contract, define compatibility, migration, deprecation, and rollback. Silent reinterpretation of stored state is prohibited.

## Comments and documentation

Document why a non-obvious constraint exists, the invariant it protects, and the authority behind it. Do not narrate obvious syntax or leave stale speculative comments as design truth.
