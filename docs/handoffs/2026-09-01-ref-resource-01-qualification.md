# REF-RESOURCE-01 qualification record — 2026-09-01

**Status:** Informational; current-portfolio reconstruction is semantically qualified and awaiting final documentation-head qualification plus fresh exact-head review/authorization.

## Current-portfolio reconstruction — 2026-09-01/02

The historical construction record below remains valid for the original Resource leaf, but its old base, Composer identity, projection identity and qualification run are not the current integration subject.

The Resource leaf has now been deliberately reconstructed from accepted:

`experimental/portfolio@f2fa9d0676c770cb19f1cc754ce9db56d2048394`.

The historical reviewed/repaired head `081b2f1bf49d906a400f9010ce1ba2ee61f5ceb1` is preserved at:

`checkpoint/ref-resource-01-pre-current-portfolio-reconstruction-20260901`.

### Reconstruction method

The 14 non-workflow Resource-owned semantic/reference/provenance files were replayed byte-for-byte from the historical reviewed head. The permanent workflow was not replayed wholesale because the current portfolio already includes accepted Evaluator qualification. Instead, Resource was composition-added as a peer to the current workflow and aggregate `verify` now requires both Evaluator and Resource.

No current Composer, Evaluator, Graph, Policy, Progress or production implementation source was replaced.

### Deliberate stale-provenance falsifier

First reconstruction probe:

`ref/resource-01@0d8b00698778c68d063e949e6277cfe036c10d2d`

Normal workflow `33585794667`: **expected failure**.

Every accepted current peer job was green, including Governance, Windows and Ubuntu Search IR, every integrated Graph reference, Policy and Evaluator. Only Resource failed, and aggregate `verify` failed solely because Resource is a required peer.

Before stopping, the current Composer/Resource projection generated successfully:

- Composer: `881/881`;
- representation/composition evidence: `00045fcb77d8690bfc44bcb5b8d46d55f92db7a924203fff5c8e12b1c8710eb0` / `727811` canonical bytes;
- Resource profile projection: `6bc217079b56e0d377ab8bb5f29bda47e551fab0fccbda59e12624daa5b3bd70` / `983107` canonical bytes / three profiles.

Resource then stopped at the exact Composer-evidence assertion because its checked-in fixture still named historical `1285fa9a...`. No Resource semantic case ran under stale provenance.

### Provenance-only rebind and semantic qualification

Commit:

`65c99981cfbd0d0cfc62fe4bc75dfc74c91d2b0d`

changed only the two frozen SHA-256 identities in `fixtures/resource-cases.json`:

- Composer `1285fa9a...` -> `00045fcb...`;
- Resource projection `a4a9f371...` -> `6bc21707...`.

Schema identities, canonical byte lengths and all 23 expected case IDs remained unchanged. No Resource semantic implementation or case source changed.

Normal workflow `33585922613` on that exact semantic checkpoint: **success**.

All current merge-gate jobs passed, including Evaluator, Resource and aggregate `verify`. Resource job `100109931659` recorded:

- expected/discovered/executed/passed: `23/23/23/23`;
- failed/not-discovered/not-executed: `0/0/0`;
- all `34/34` direct SPEC-0011 Resource reference obligations mapped and exercised;
- Resource evidence SHA-256 `698dce4bea176d43a510b61bbabc8f9cf31d20ae1f882505b5babc575f15d40c`;
- Resource evidence canonical bytes `12512`.

Retained artifact:

- name: `resource-reference`;
- artifact ID: `9830059175`;
- archive digest: `sha256:9675fef24a698fe067d48ba6689eff23c3f695058319469d54d761abeafdcb8a`;
- archive size: `147424` bytes.

This proves the previously reviewed Resource semantics survive the accepted Evaluator + shared Progress authority. No new Resource semantic repair was required during reconstruction.

### Current review seam

The documentation-only reconciliation commits that mark the original assessment historical and add this current reconstruction record necessarily create a new exact head. The final exact documentation/review head and its normal workflow are recorded in PR #166 after that run completes; embedding them here would require another self-invalidating documentation commit.

Before integration, the final head still requires:

1. one complete normal workflow with all current peer jobs and aggregate `verify` green;
2. whole-diff review from exact current portfolio;
3. fresh exact-head repository-owner/independent authorization under repository policy; and
4. guarded integration/readback.

The current reconstruction does not establish #122 atomic production acceptance, CUDA allocation/atomics/fences, compatible-pair native qualification, Progress scheduling/fairness, product behavior, performance, physical support or release readiness.

---

## Historical construction scope

The remainder of this record preserves the original construction/qualification facts from the pre-Evaluator/pre-shared-Progress-authority portfolio. Exact hashes and runs in this historical section are evidence of that development cycle, not current integration coordinates.

The original leaf was based on exact `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af` and tracked by #36/#142.

The leaf owns only the 34 direct `SPEC-0011` requirements classified to `ENGINE-REFERENCE-01`:

- `RESOURCE-ADMIT-001..011`;
- `RESOURCE-PRESSURE-001..007`;
- `RESOURCE-EXHAUST-001..008`;
- `RESOURCE-LIFE-001..006`;
- `RESOURCE-CLEANUP-001..002`.

Profile/schema normalization, deterministic composition/reserve structure, deletion identity, physical CUDA-JS plan feasibility, contributor response policy, Progress scheduling and native/CUDA realization remain separate owners.

## Historical assess

The repository already normalized three materially different Resource profiles but did not yet have an independent runtime-semantic reference for reservation/lease accounting, compound atomicity, conservation, pressure, exhaustion, lifecycle and teardown.

The requirement-coverage registry classified 34 requirements directly to `ENGINE-REFERENCE-01`. That made Resource the next dependency-ready reference LEGO that could proceed independently while `REF-EVALUATOR-01` PR #160 remained frozen for its independent-review/owner-authorization gate.

## Historical research

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

## Historical reassess and plan

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

## Historical exact normalized inputs

Composer was:

- `881/881` passed;
- representation/composition evidence `1285fa9abdf70ba6902aae0d0f86a14b9a23b2c56b2aa8f5168970c0003124f2`;
- `727811` canonical bytes.

Resource profile projection was:

- schema `cuda-mcgs.search-ir-composer-resource-profile-projection/0.2.0`;
- three exact normalized Resource profiles;
- SHA-256 `a4a9f3710c1e06ea543af821308825d655bbc96527218a9100ecdb91d351d218`;
- `983107` canonical bytes.

## Historical falsification and repairs

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

### 8. Compound admission could partially commit duplicate logical lease identity

Later independent technical review of the historical review head found an additional `RESOURCE-ADMIT-003` defect: compound preflight checked each reservation against authoritative state independently, so two members could use one logical `leaseId` and both pass preflight before sequential commit caused partial mutation.

The reviewed repair in historical final head `081b2f1bf49d906a400f9010ce1ba2ee61f5ceb1` adds one transaction-local logical lease-ID set before the first commit. A compound transaction may contain at most one reservation for one logical `leaseId`, regardless of generation. Duplicate exact identity and two-generation reuse therefore reject with `RESOURCE_REFERENCE_TRANSACTION_LEASE_IDENTITY` before any ledger mutation. The stable `resource-compound-admission-rollback` case additionally proves live count, live accounting and authoritative lease set remain unchanged across those rejections, while ordinary all-or-none success still works.

Historical normal workflow `33580789813` passed on that exact repaired head, including the permanent Resource job and aggregate `verify`.

## Historical qualified semantic evidence

An earlier qualified semantic checkpoint was:

`ref/resource-01@faac7776c11d4f6f77f8b94059ab063a67d992b7`.

Permanent workflow run `33557945030` passed completely on that exact checkpoint, including governance, Windows and Ubuntu Search IR, Policy, all integrated Graph references, Resource, and aggregate `verify`.

Resource job `100023251557` recorded:

- expected/discovered/executed/passed: `23/23/23/23`;
- failed/not-discovered/not-executed: `0/0/0`;
- all `34/34` direct Resource reference obligations mapped to checked cases;
- historical Resource evidence SHA-256 `68ba1f464574a253144d9bae78729bfb425037adbe49234237a9d2a2de2fe2fb`;
- historical Resource evidence canonical bytes `12512`.

The later compound-admission repair head `081b2f1b...` superseded that earlier semantic checkpoint as the historical reviewed source for reconstruction and passed normal workflow `33580789813`.

## Permanent gate

`.github/workflows/docs.yml` contains a peer `Resource reference` job that runs:

```text
Composer -> Resource profile projection -> Resource reference
```

It retains `resource-profiles.json` and `resource-evidence.json`. In the current reconstruction aggregate `verify` requires Resource alongside the accepted Evaluator peer, governance, Windows/Ubuntu Search IR, Policy and all integrated Graph peer jobs.

## Cleanup and claim limits

Historical cleanup performed:

- temporary Resource probe/repair/wiring/lease-authority workflows were removed; only permanent `docs.yml` remained;
- generated `build/` artifacts remained disposable and were not checked in;
- runtime contributor-removal mutation was removed rather than retained as dead compatibility surface.

Current reconstruction cleanup/disposition:

- historical reviewed head retained only at `checkpoint/ref-resource-01-pre-current-portfolio-reconstruction-20260901` while the reconstructed PR is active;
- active `ref/resource-01` is the current reconstruction branch;
- generated Resource evidence remains CI-retained/disposable, not checked in;
- `experimental/portfolio` remains unchanged until fresh exact-head review/authorization and guarded integration;
- protected `main` is unaffected by this Resource reference lane.

This evidence does **not** establish #122 atomic contract acceptance, physical CUDA allocation feasibility, concurrent native atomics/fences, CUDA-JS compatible-pair qualification, Progress scheduling/fairness, product behavior, performance, release readiness, physical support or protected-main acceptance.
