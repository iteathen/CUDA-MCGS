# Contributing to UMCGS

UMCGS is currently documentation-first. Read [`AGENTS.md`](AGENTS.md) and [`agent_files/README.md`](agent_files/README.md) before opening a change.

## Before production implementation

A change needs:

- a clear ownership boundary;
- a durable product-area/component home;
- accepted governing specifications, or an explicitly authorized disposable experiment;
- defined invariants, ranges, lifecycle, resource limits, and failure behavior;
- declared public/internal boundaries and dependencies;
- a validation plan;
- prior-art inspection when existing work may avoid duplication or change the design.

## Organization

UMCGS is organized as a very large project from inception. Follow [`agent_files/general_foundation/PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and [`agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

A new production component requires `README.md`, `component.yaml`, registry entry, dependency declaration, public contract, and validation ownership. Do not place production source at root or in catch-all helper directories.

## Documentation

Substantial Markdown below `docs/` must carry a recognized status. Update indexes and registry entries in the same change. Supersede or archive historically useful stale guidance rather than silently deleting it.

## Validation

Run:

```bash
./scripts/verify-docs.sh
```

Implementation changes will add boundary-specific validation under accepted specifications and component manifests.

## Pull requests

Explain objective, ownership, organizational placement, authority, public/internal boundary, dependencies, design, changes, validation, memory/performance effects, failure/exhaustion behavior, migration, and remaining risks. Do not describe local-only work as published.
