# Change Management

**Scope:** Reusable foundation.

## Git discipline

- inspect `git status` and the full diff before staging;
- preserve unrelated work;
- stage explicit intended paths when the worktree is mixed;
- use a coherent branch/commit for one ownership boundary;
- verify tests before publication;
- verify the remote commit/PR after pushing;
- never describe a local-only commit as published.

## Structural changes

Creating, moving, splitting, merging, or extracting a component requires:

- source and target owner;
- governing ADR/specification;
- component manifest and registry updates;
- dependency and consumer inventory;
- public contract and compatibility plan;
- build/test/benchmark/tooling/documentation migration;
- persistent/generated-state handling;
- rollback;
- archive/supersession provenance.

Do not leave shadow copies, duplicate sources of truth, or indefinite compatibility shims.

## Migrations

State source version, target version, compatibility window, data transformation, validation, rollback, and failure recovery. Preserve old readers/writers only when explicitly required.

## Supersession

Accepted records are not rewritten to hide history. Add a superseding ADR/spec and link both directions. Archive stale material with original location, date, revision, reason, and replacement authority.

## Scope control

Do not mix broad cleanup with a behavior change unless both are required by the same ownership boundary. Record deferred work rather than smuggling it into the current change.
