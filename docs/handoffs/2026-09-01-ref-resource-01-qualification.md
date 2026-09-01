# REF-RESOURCE-01 qualification record — 2026-09-01

**Status:** Informational

## Scope

This record covers the CUDA-free `ENGINE-REFERENCE-01/REF-RESOURCE-01` leaf on `ref/resource-01`, based on exact `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af` and tracked by #36/#142.

The leaf owns only the 34 direct `SPEC-0011` requirements classified to `ENGINE-REFERENCE-01`:

- `RESOURCE-ADMIT-001..011`;
- `RESOURCE-PRESSURE-001..007`;
- `RESOURCE-EXHAUST-001..008`;
- `RESOURCE-LIFE-001..006`;
- `RESOURCE-CLEANUP-001..002`.

Profile/schema normalization, deterministic composition/reserve structure, deletion identity, physical CUDA-JS plan feasibility, contributor response policy, Progress scheduling and native/CUDA realization remain separate owners.

## Assess

The repository already normalized three materially different Resource profiles but did not yet have an independent runtime-semantic reference for reservation/lease accounting, compound atomicity, conservation, pressure, exhaustion, lifecycle and teardown.

The requirement-coverage registry classified 34 requirements directly to `ENGINE-REFERENCE-01`. That made Resource the next dependency-ready reference LEGO that could proceed independently while `REF-EVALUATOR-01` PR #160 remained frozen for its independent-review/owner-authorization gate.

## Research

`SPEC-0011` requires one finite Resource owner with exact checked arithmetic and these core truths:

- failed reservations consume no live capacity;
- compound admission is all-or-none;
- claimed/published/retired-unreclaimed/quarantined capacity remains conserved;
- retired is not free until the semantic owner proves quiescence/disposition;
- pressure is a typed fact and never chooses Graph/Evaluator/Output/Policy response;
- first terminal Resource exhaustion cause is immutable;
- counter/identity/generation exhaustion never wraps into aliases;
- terminal exhaustion closes ordinary admission while preserving predeclared terminal/progress closure reserves;
- root/session/work epochs remain exact until owner disposition;
- teardown cannot silently balance ledgers by inventing another owner's disposition.

The existing Composer Resource profiles supply exact contributors, classes, pools/partitions, reserves, admission groups, ledgers, watermarks, exhaustion metadata, lifecycle and cleanup contracts. The reference therefore consumes those normalized facts rather than defining an allocator, scheduler or new Resource schema.

## Reassess and plan

The smallest sufficient reference is an in-memory deterministic semantic ledger using ordinary JavaScript `Map`, `Set` and `BigInt` as oracle mechanisms only. Production layout, CUDA atomics, memory ordering and allocation remain downstream.

The plan implemented:

1. rebuild Domain -> Graph -> Evaluator -> Policy -> Resource through the existing normalizers;
2. assert all three Resource identities equal Composer-published identities;
3. project those exact normalized profiles into an immutable Resource reference input;
4. implement one owner-local Resource oracle for leases, compound transactions, accounting, pressure, exhaustion and cleanup;
5. derive the 34 direct requirement IDs from `SPEC-0011`, cross-check their registry owner/count, and require every one to map to the checked-in case bank;
6. add explicit sensitivity mutants for retired-capacity/quiescence failures;
7. add a peer permanent `Resource reference` workflow job and include it in aggregate fail-closed `verify`.

## Exact normalized inputs

Composer remains:

- `881/881` passed;
- representation/composition evidence `1285fa9abdf70ba6902aae0d0f86a14b9a23b2c56b2aa8f5168970c0003124f2`;
- `727811` canonical bytes.

Resource profile projection:

- schema `cuda-mcgs.search-ir-composer-resource-profile-projection/0.2.0`;
- three exact normalized Resource profiles;
- SHA-256 `a4a9f3710c1e06ea543af821308825d655bbc96527218a9100ecdb91d351d218`;
- `983107` canonical bytes.

## Falsification and repairs

### 1. Terminal exhaustion did not close admission

The first full Resource probe executed `23` discovered cases and passed `22/23`.

Sole failure: `resource-terminal-exhaustion-drain`.

The oracle recorded an authoritative terminal Resource cause but left lifecycle `active`, so ordinary new reservations could still enter. The owner-local repair transitions `active -> draining` when terminal Resource exhaustion publishes. `draining` rejects ordinary admission but permits only explicitly bound reserves whose normalized purpose is `terminal-result` or `progress-cleanup`.

No scheduler, allocator, victim policy or host callback was added.

### 2. Teardown could silently release foreign-owner state

Author-side semantic review found that `cleanup()` released claimed/published, retired-unreclaimed and quarantined leases without explicit proof that the semantic owner had disposed the work/quiescence/recovery state. That could make counters balance by stealing Graph/Evaluator/Output lifecycle authority.

The repair requires explicit injected teardown facts:

- `ownerWorkDisposed` for claimed/published owner work;
- `retiredReleaseAuthorized` for retired-unreclaimed capacity after owner quiescence/disposition;
- `quarantineReleaseAuthorized` for quarantined capacity recovery.

The teardown case now proves each missing authority fails closed before the final fully authorized release.

### 3. Resource invented a Policy-owned status

The oracle initially mapped normalized exhaustion cause `policy-budget` to an invented `resource-policy-budget` status that is absent from the Resource status table. Resource owns the exact cause but not Policy's budget-status vocabulary.

The repair preserves `policy-budget` as the exact typed cause and returns no Resource-owned status code for that cause. The focused falsifier asserts this explicitly.

## Current semantic evidence

Semantic checkpoint before this documentation commit:

`ref/resource-01@bcd36f10b94198d0dc5a704326a84a9e9803bec6`.

Focused and full qualification on the final semantic sources passed:

- expected/discovered/executed/passed: `23/23/23/23`;
- failed: `0`;
- all `34/34` direct Resource reference obligations have mapped case coverage;
- Resource evidence SHA-256 `6501158672c1a54f023947215128e9d00ac4cb7cc2914381ab660f1ca65f1c30`;
- Resource evidence canonical bytes `12343`.

The case bank covers single/compound admission, claim/publish/release, retired-not-free, quarantine visibility, exact lease generations/epochs, closure reserves, pressure ownership/recovery, exact exhaustion causes, first-cause immutability, counter-vs-capacity exhaustion, ready-only partial facts, terminal draining, no host growth, schedule-invariant conservation, lifecycle closure, root-update reject/no-mutation, explicit teardown authority, arbitrary-width counters, evaluator-absent zero residue, and sensitivity mutants.

## Permanent gate

`.github/workflows/docs.yml` now contains a peer `Resource reference` job that runs:

```text
Composer -> Resource profile projection -> Resource reference
```

It retains `resource-profiles.json` and `resource-evidence.json`. Aggregate `verify` now fails closed unless the Resource job succeeds alongside governance, Windows/Ubuntu Search IR, Policy and all integrated Graph peer jobs.

This documentation commit is intentionally user-originated so the ordinary PR workflow can qualify one exact final head after the preceding self-cleaning repair workflows, whose `GITHUB_TOKEN` pushes do not constitute the final PR gate.

## Cleanup and claim limits

Cleanup performed:

- all temporary Resource probe/repair/wiring workflows removed from the Resource branch;
- failed disposable automation finalizer branch deleted;
- generated `build/` artifacts remain disposable and are not checked in;
- protected `main` unchanged;
- `experimental/portfolio` unchanged until reviewed integration;
- `ref/evaluator-01`/#160 unchanged by this Resource leaf.

This evidence does **not** establish #122 atomic contract acceptance, physical CUDA allocation feasibility, concurrent native atomics/fences, CUDA-JS compatible-pair qualification, Progress scheduling/fairness, product behavior, performance, release readiness or protected-main acceptance.

The next gate is the complete ordinary permanent PR workflow on the exact user-originated head containing this record, followed by whole-diff author review and the independent-review/owner-authorization requirement appropriate to Resource conservation/exhaustion semantics.
