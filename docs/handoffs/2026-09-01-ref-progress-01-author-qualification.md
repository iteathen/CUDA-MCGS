# REF-PROGRESS-01 author-side qualification — 2026-09-01

**Status:** Informational

## Scope and disposition

This record captures author-side qualification of the `ENGINE-REFERENCE-01 / REF-PROGRESS-01` Progress semantic reference leaf for CUDA-MCGS issue #36.

It is **not** an acceptance record for issue #36 as a whole, issue #122 atomic semantic acceptance, CUDA/native realization, CUDA-JS integration, CUDA-JS-Tensor evaluation, Vector integration, or physical NVIDIA qualification.

The qualified leaf remains deliberately framework-only and CUDA-free. It owns scheduler-neutral work/readiness/accounting, finite continuation/yield behavior, service-opportunity fairness, typed no-progress classification, stop/drain/closure, epoch isolation, Progress-local lifecycle, cleanup and evidence. Domain, Graph, Policy, Evaluator, Resource, Output, Session and native/CUDA meanings remain separate owners.

## Frozen authority

- frozen integration base: `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`
- original secured construction handoff: `cf6271d92231a6d059708b6342c16d3a71ad4805`
- original semantic construction head: `889180f13e81bde977c6ad785fb5c735dbd3e5d1`
- qualified implementation/permanent-CI head before this documentation-only record: `65c7b643a72535413834942b3760f64bca037aef`
- draft PR: `#167`, base `experimental/portfolio`, head `ref/progress-01`

Sibling Evaluator and Resource leaves remained unmerged throughout this work and were not cherry-picked into Progress. Their implementations therefore did not become hidden Progress authority.

## Exact retained identities

The permanent `Progress reference` job in documentation run `33562317770` retained these exact identities from head `65c7b643a72535413834942b3760f64bca037aef`:

### Composer representation-composition evidence

```json
{
  "algorithm": "sha256",
  "byteLength": 727811,
  "sha256": "1285fa9abdf70ba6902aae0d0f86a14b9a23b2c56b2aa8f5168970c0003124f2"
}
```

### Progress profile projection

```json
{
  "algorithm": "sha256",
  "byteLength": 185510,
  "sha256": "e06cb2c9761b00d1694f01f9f60b95e831658d45f33d2b7a0b0f5eeb6f3ce4ed"
}
```

The projection contains exactly:

1. `progress.synthetic-evaluator-absent`
2. `progress.synthetic-evaluator-workspace`
3. `progress.synthetic-live-session`

### Progress reference evidence

```json
{
  "algorithm": "sha256",
  "byteLength": 11520,
  "sha256": "88ae953566836187c4e6c43ac3238aab3e0594c00b2d46d5928ae3a9e4d12773"
}
```

The evidence summary is:

- expected cases: 19
- discovered cases: 19
- executed cases: 19
- passed: 19
- failed: 0
- required skipped: 0
- conditional skipped: 0
- optional skipped: 0
- not discovered: 0
- not executed by selection: 0
- direct ENGINE-REFERENCE requirements planned: 31
- direct ENGINE-REFERENCE requirements executed: 31

## Direct requirement ownership

The runner derives and verifies the exact 31 direct Progress requirements from authoritative SPEC-0012 plus the requirement-coverage registry:

- `PROGRESS-WORK-001..007`
- `PROGRESS-FAIR-001..006`
- `PROGRESS-NOPROGRESS-001..007`
- `PROGRESS-STOP-001..007`
- `PROGRESS-LIFE-001..004`

The case registry fails closed if a case maps a non-owned requirement or if any direct requirement has no case evidence.

## Required conformance falsifiers

All 19 required falsifiers are checked in, discovered exactly, and green:

1. `progress-profile-strict-normalization`
2. `progress-ready-after-publication`
3. `progress-pending-yields-worker`
4. `progress-accounting-conservation`
5. `progress-producer-unblocking-fairness`
6. `progress-partial-batch-device-flush`
7. `progress-must-drain-priority`
8. `progress-starvation-contract`
9. `progress-resource-recovery-reserve`
10. `progress-scheduler-semantic-parity`
11. `progress-mandatory-wait-cycle`
12. `progress-deadlock-vs-quiescence`
13. `progress-livelock-potential`
14. `progress-first-stop-cause`
15. `progress-stale-epoch-isolation`
16. `progress-observation-no-progression`
17. `progress-closure-complete`
18. `progress-owner-deletion-zero-residue`
19. `progress-oracle-sensitivity`

The fixture order follows the modular case-bank discovery order; the required set is unchanged from the governing conformance plan.

## Red-before-green and falsification history

The red history was preserved and classified rather than repaired opportunistically:

1. `33560372823` on `9c0fded0fe169cdecbcfbf13eeb7d88d3a386314` — temporary projection qualification transport passed the exact Composer and all three Progress projections.
2. `33560919683` on `dc7ac4de6793cc95afac8864662b4d2d4cf003b0` — first complete runner attempt was red before evidence because the checked-in expected-case order did not match the modular discovery order. This was classified as a case-bank construction defect, not a semantic oracle defect.
3. `33561368306` on `a93ee5e2541cc0d63817458bba0aa2e62a7f8b78` — first evidence-producing semantic probe exposed the expected semantic reds plus additional failures.
4. `33561483837` on `d62ff437007ea810fb8c17f7f61f6e6220c40672` — all 19 cases were isolated. Ten were red. Nine shared an accidental test-helper assumption that ordinary work had zero dependencies; SPEC-0012 does not impose that restriction.
5. `33561648160` on `70701a7675ec796fc89f05cb55000a00d44c2649` — after removing only that accidental test limit, exactly four cases remained red and 15 passed: `progress-ready-after-publication`, `progress-pending-yields-worker`, `progress-starvation-contract`, and composite `progress-oracle-sensitivity`.
6. The three Progress-owner implementation defects were then repaired at `d4f2bf7e0e2e6e48b4371a4e1b21a52902e070e7`:
   - cooperative claim replay now returns the same claim result for the same cooperative claim identity and rejects a competing claim;
   - continuation depth is counted and rejected beyond the normalized finite `maxContinuationDepth` bound;
   - recorded starvation evidence is classified before the generic ready/claimed `progress available` guard, making starvation diagnosis reachable without relying on host time.
7. `33561886331` on `d4f2bf7e0e2e6e48b4371a4e1b21a52902e070e7` — full runner and all 19 focused falsifiers passed, including sensitivity.
8. The diagnostic workflow was replaced by the permanent `Progress reference` job in `.github/workflows/docs.yml`, wired into aggregate `verify`, and the diagnostic workflow was deleted.
9. `33562317770` on `65c7b643a72535413834942b3760f64bca037aef` — permanent production-shaped qualification passed governance, Progress, Search IR on Windows and Ubuntu, every existing Graph/Policy gate, and aggregate `verify`.

No valid semantic case was weakened to obtain green.

## Mechanism-neutral scheduler evidence

Two bounded schedule drivers exercise the same stable Progress semantics through distinct trajectories:

- `serial`
- `interleaved`

`progress-scheduler-semantic-parity` confirms their stable semantic invariants are equal. This proves only the scheduler-neutral reference obligation selected by SPEC-0012. It does not choose a production scheduler, worker topology, CUDA launch model, atomic strategy, or performance policy.

## High-risk evidence retained

The green case bank directly demonstrates, among other properties:

- incomplete payload/resource publication cannot become ready;
- stale incarnation claim cannot acquire current work;
- cooperative evaluator claim replay is idempotent and competing claim identity is rejected;
- continuation depth is finite (`64` in the selected synthetic profile) and yields release the worker;
- failed Resource admission and invalid owner admission do not enter admitted-work accounting;
- exact completion retry is idempotent and owner failure meaning is preserved;
- counter exhaustion requests typed stop before wrap;
- partial evaluator batching uses device-visible service opportunities and no host timeout;
- mandatory result-visible work survives stop until drained;
- starvation is detected by service-opportunity gap (`257` against the selected ordinary maximum `256`) and requests typed stop;
- mandatory wait cycles classify as deadlock while ordinary pending-producer and terminal-quiescent states remain distinct;
- bounded repeated no-potential-change transitions classify as livelock;
- first stop cause remains immutable;
- stale epoch work is disposed and cannot publish into the replacement incarnation;
- observation and legitimate external-wait classification do not advance Progress state;
- closure rejects live work or unresolved channel/owner/resource/output facts and cleanup leaves zero Progress runtime residue;
- deleting optional Evaluator/Session ownership leaves no phantom Progress classes or runtime residue;
- sensitivity kills the `allowIncompleteReady`, `skipFairness`, and `skipClosureCheck` weakened-oracle mutants.

## Governance correction

The historical checkpoint handoff originally used a descriptive `**Status:**` value that did not match the repository's accepted document-status vocabulary. Governance correctly failed on that document. Commit `6438388ceb9a5d8f3f4352ce1b9a073208632537` changed only the status metadata to `Informational` plus a separate historical checkpoint-state line; the checkpoint's substantive meaning was preserved. Governance then passed in permanent run `33562317770`.

## Cleanup and residue

At qualified implementation head `65c7b643a72535413834942b3760f64bca037aef`:

- the temporary projection workflow is absent;
- the temporary red/green diagnostic workflow is absent;
- the permanent Progress job lives only in `.github/workflows/docs.yml` and is part of aggregate `verify`;
- generated `build/` evidence is not checked into source;
- no CUDA C++, PTX, private CUDA escape path, production scheduler, product behavior, or sibling unmerged reference implementation was introduced by this leaf.

The Actions artifacts are evidence retention only and do not form source authority.

## Remaining review/acceptance boundary

This author-side packet makes PR #167 eligible for independent review once the documentation-only head carrying this record also passes the permanent workflow and the whole diff is rechecked against the frozen base.

Independent review must still decide whether this leaf is acceptable for later composition into `ENGINE-REFERENCE-01`. Merging this PR is not equivalent to closing #36, and no production engine lowering is authorized before the downstream atomic acceptance gate in #122.

Because a Git commit cannot record its own SHA or future Actions run without another mutation, the exact commit containing this qualification record, its final green workflow run, and the post-record whole-diff review result are to be recorded in PR #167's metadata/checkpoint after this document is committed. That final metadata update does not alter repository source.
