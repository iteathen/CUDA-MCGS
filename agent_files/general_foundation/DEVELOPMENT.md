# Development Rules

**Scope:** Reusable foundation.

## Ownership over file locality

Behavior may cross many files. The owner is the component or contract responsible for the behavior, not the file where the symptom appears. Repair the owning boundary and update all dependent representations together.

## Coherent progress

Use the largest safe coherent batch. Repeated tiny passes force agents to reread stale context and increase drift. A tiny restart is appropriate only when test state is contaminated or a boundary must be isolated.

## Interfaces and state

- Make ownership, lifetime, nullability, errors, cancellation, and resource exhaustion explicit.
- Prefer stable identifiers/capabilities over leaked raw implementation addresses.
- Keep persistent formats versioned and migratable.
- Preserve one source of truth; derived state must be clearly derived and regenerable.
- Avoid hidden globals and cross-layer reach-through.

## Dependencies

Introduce a dependency only when its ownership, versioning, licensing, failure behavior, platform support, and replacement boundary are understood. Do not couple the generic core to a domain convenience library.

## Compatibility

When changing a public or persistent contract, define compatibility, migration, deprecation, and rollback. Silent reinterpretation of stored state is prohibited.

## Comments and documentation

Document why a non-obvious constraint exists, the invariant it protects, and the authority behind it. Do not narrate obvious syntax or leave stale speculative comments as design truth.
