# Contributing to UMCGS

UMCGS is currently documentation-first. Read [`AGENTS.md`](AGENTS.md) and [`agent_files/README.md`](agent_files/README.md) before opening a change.

## Before production implementation

A change needs:

- a clear ownership boundary;
- accepted governing specifications, or an explicitly authorized disposable experiment;
- defined invariants, ranges, lifecycle, resource limits, and failure behavior;
- a validation plan;
- prior-art inspection when existing work may avoid duplication or change the design.

## Documentation

Substantial Markdown below `docs/` must carry a recognized status. Update indexes and registry entries in the same change. Supersede or archive historically useful stale guidance rather than silently deleting it.

## Validation

Run:

```bash
./scripts/verify-docs.sh
```

Implementation changes will add boundary-specific validation under the accepted specifications.

## Pull requests

Explain objective, ownership, authority, design, changes, validation, memory/performance effects, failure/exhaustion behavior, migration, and remaining risks. Do not describe local-only work as published.
