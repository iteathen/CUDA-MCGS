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
- a lease binds owner, class, generation and exact engine/session/root/work incarnation identity;
- retired is not free until the semantic owner proves quiescence/disposition;
- pressure is a typed fact and never chooses Graph/Evaluator/Output/Policy response;
- Resource exhaustion diagnostics are bound to the immutable normalized class/owner/pool/partition plan rather than accepting invented runtime coordinates;
- failed admission exposes those same normalized coordinates rather than a weaker parallel error shape;
- first terminal Resource exhaustion cause is immutable;
- counter/identity/generation exhaustion never wraps into aliases;
- terminal exhaustion closes ordinary admission while preserving predeclared terminal/progress closure reserves;
- root/session/work epochs remain exact until owner disposition;
- teardown cannot silently balance ledgers by inventing another owner's disposition; and
- the normalized Resource plan is immutable for one engine incarnation rather than mutated by runtime contributor deletion.

The existing Composer Resource profiles supply exact contributors, classes, pools/partitions, reserves, admission groups, ledgers, watermarks, exhaustion metadata, lifecycle and cleanup contracts. The reference therefore consumes those normalized facts rather than defining an allocator, scheduler or new Resource schema.

## Reassess and plan

The smallest sufficient reference is an in-memory deterministic semantic ledger using ordinary JavaScript `Map`, `Set` and `BigInt` as oracle mechanisms only. Production layout, CUDA atomics, memory ordering and allocation remain downstream.

The implemented plan:

1. rebuild Domain -> Graph -> Evaluator -> Policy -> Resource through the existing normalizers;
2. assert all three Resource identities equal Composer-published identities;
3. project those exact normalized profiles into an immutable Resource reference input;
4. implement one owner-local Resource oracle for leases, compound transactions, accounting, pressure, exhaustion and cleanup;
5. derive the 34 direct requirement IDs from `SPEC-0011`, cross-check their registry owner/count, and require every one to map to the checked-in case bank;
6. add explicit sensitivity mutants for retired-capacity/quiescence failures;
7. add a peer permanent `Resource reference` workflow job and include it in aggregate fail-closed `verify`; and
8. perform whole-owner author review after green permanent runs instead of treating CI as proof.

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

The teardown case proves each missing authority fails closed before the final fully authorized release.

### 3. Resource invented a Policy-owned status

The oracle initially mapped normalized exhaustion cause `policy-budget` to an invented `resource-policy-budget` status that is absent from the Resource status table. Resource owns the exact cause but not Policy's budget-status vocabulary.

The repair preserves `policy-budget` as the exact typed cause and returns no Resource-owned status code for that cause. The falsifier asserts this explicitly.

### 4. Lease lookup did not authenticate the full stale-safe identity

Whole-owner author review then found that a lease stored class, owner and engine/session/root/work epochs, but `findLease()` originally authenticated only `leaseId + generation`. A forged reference carrying a valid id/generation pair could therefore attempt to release, retire, reclaim or quarantine another owner's or another epoch's lease.

That violated `RESOURCE-ADMIT-004` and weakened `RESOURCE-LIFE-002`.

The repair keeps `leaseId + generation` as the lookup coordinate but requires the reference to match the authoritative:

- Resource class;
- owner; and
- canonical `{engine, session, root, work}` epoch tuple.

Epoch admission itself is strict: exactly those four fields, each a canonical arbitrary-width decimal. The case bank proves wrong owner, wrong class and wrong root epoch all fail before accounting mutation. Canonical-byte comparison is used so semantic identity is independent of JavaScript property order.

### 5. Runtime contributor removal contradicted the immutable Resource plan

Author review also found an unused `removeContributor()` runtime API that mutated the active Resource class set. SPEC-0011 requires plan capacity/ownership to remain immutable for one engine incarnation; contributor/capability/product deletion is a specialization/deletion test that produces a different normalized profile, not an in-place runtime reconfiguration port.

The API and its mutable `removedContributors` bookkeeping were deleted. The existing structural `resource-absent-owner-zero-residue` / Composer deletion evidence remains the correct owner for contributor absence. This reduces the reference surface and removes a second source of plan authority rather than adding compatibility machinery around an invalid abstraction.

### 6. Exhaustion facts were not bound to the normalized Resource plan

Clause-level author review found that `recordExhaustion()` accepted an arbitrary `classId` and returned only cause/status information. A caller could therefore publish a Resource-looking exhaustion fact for a class not present in the immutable plan, and even valid class failures omitted the normalized owner/pool/partition coordinates required by `RESOURCE-EXHAUST-001` diagnostics.

A test-only change at `1584cbe02599a9156f583cb1cbdb802923db9c10` strengthened `resource-exhaustion-diagnostics`. Permanent workflow `33557190444` reached the new falsifier with all other Resource cases green and failed `22/23` because `classId` was absent from the returned fact (`undefined` instead of `resource.synthetic-evaluator-absent.class-output-working`). The same case also requires unknown classes and negative diagnostic quantities to fail closed.

The owner-local repair at `f8d2dc994bd3faaa3da3a943e63aa4d44470c864`:

- indexes the immutable normalized `partition` by class;
- validates any non-null exhaustion class through the existing Resource class authority;
- derives owner, partition and pool from that normalized plan rather than accepting caller-provided ownership/location claims;
- canonicalizes non-null requested/available quantities as unsigned decimal Resource units; and
- preserves `null` plan coordinates for genuinely global causes such as Policy-owned budget satisfaction.

No allocator placement, physical address, CUDA provider detail or semantic response policy was introduced.

### 7. Failed admission still exposed a weaker exhaustion shape

The clause-level pass then traced `RESOURCE-EXHAUST-001` through the real reservation failure path rather than only through explicit `recordExhaustion()` calls. `failAdmission()` still returned class/requested/available/watermark/recoverability but omitted the immutable owner/partition/pool coordinates now required from Resource exhaustion facts.

A test-only change at `d867f9c23e24fbd9782bd0c64e37cf61e3c49bf3` extended `resource-single-admission-atomicity` to require the real over-capacity reservation outcome to contain the exact normalized class, owner, partition and pool plus requested/available quantities. Permanent workflow `33557782673` reached that falsifier with every other Resource case green and failed `22/23` because `owner` was `undefined` instead of `owner.output.synthetic-evaluator-absent`.

The owner-local repair at `faac7776c11d4f6f77f8b94059ab063a67d992b7` makes `failAdmission()` derive its diagnostic coordinates from the same immutable class/partition authority used by `recordExhaustion()`. It adds no alternate error schema and no physical layout authority; both explicit exhaustion and failed reservation now expose one consistent semantic coordinate set.

## Qualified semantic evidence

Qualified semantic head:

`ref/resource-01@faac7776c11d4f6f77f8b94059ab063a67d992b7`.

Permanent workflow run `33557945030` passed completely on that exact head, including:

- governance verification;
- Windows and Ubuntu Search IR reference;
- Policy reference;
- Graph NODE, EDGE, REF, PATH, ROOT, RECLAIM, ADVANCE occurrence and CLEANUP references;
- Resource reference; and
- aggregate fail-closed `verify`.

Resource job `100023251557` recorded:

- expected/discovered/executed/passed: `23/23/23/23`;
- failed/not-discovered/not-executed: `0/0/0`;
- all `34/34` direct Resource reference obligations mapped to checked cases;
- Resource evidence SHA-256 `68ba1f464574a253144d9bae78729bfb425037adbe49234237a9d2a2de2fe2fb`;
- Resource evidence canonical bytes `12512`.

The case bank covers single/compound admission, exact failed-admission coordinates, claim/publish/release, retired-not-free, quarantine visibility, complete stale-safe lease identity, exact arbitrary-width generations/epochs, closure reserves, pressure ownership/recovery, plan-bound exact exhaustion diagnostics, first-cause immutability, counter-vs-capacity exhaustion, ready-only partial facts, terminal draining, no host growth, schedule-invariant conservation, lifecycle closure, root-update reject/no-mutation, explicit teardown authority, arbitrary-width counters, evaluator-absent zero residue, and sensitivity mutants.

## Permanent gate

`.github/workflows/docs.yml` contains a peer `Resource reference` job that runs:

```text
Composer -> Resource profile projection -> Resource reference
```

It retains `resource-profiles.json` and `resource-evidence.json`. Aggregate `verify` fails closed unless the Resource job succeeds alongside governance, Windows/Ubuntu Search IR, Policy and all integrated Graph peer jobs.

This documentation update changes no semantic source. It exists to bind the review record to the final qualified semantic head and evidence. The resulting docs-only PR head must still pass the ordinary permanent workflow before author review is frozen.

## Cleanup and claim limits

Cleanup performed:

- all temporary Resource probe/repair/wiring/lease-authority workflows removed from the Resource branch; only permanent `docs.yml` remains under `.github/workflows/`;
- failed disposable automation/finalizer state removed;
- generated `build/` artifacts remain disposable and are not checked in;
- runtime contributor-removal mutation removed rather than retained as dead compatibility surface;
- protected `main` unchanged;
- `experimental/portfolio` unchanged until reviewed integration;
- `ref/evaluator-01`/#160 unchanged by this Resource leaf.

This evidence does **not** establish #122 atomic contract acceptance, physical CUDA allocation feasibility, concurrent native atomics/fences, CUDA-JS compatible-pair qualification, Progress scheduling/fairness, product behavior, performance, release readiness or protected-main acceptance.

The next gate is the complete ordinary permanent PR workflow on the exact docs-only head containing this record, followed by final whole-diff author review. Because the leaf owns conservation, exhaustion, lease identity and lifecycle behavior, author review is not independent approval; integration still requires the independent-review or explicit repository-owner exact-head authorization allowed by repository policy.