# REF-PROGRESS-01 qualification and blocker record — 2026-09-01

**Status:** Informational

## Current disposition

`ENGINE-REFERENCE-01 / REF-PROGRESS-01` is **direct-leaf green but not author-ready for acceptance**.

The Progress-owned CUDA-free reference semantics now pass the permanent repository gate on the exact implementation/test head recorded below. A later whole-spec author review also found a separate contradiction in the frozen Composer/profile authority: a work class may normalize with `stopDisposition: "abandon"` while its declared `terminalStates` omit `abandoned`. Because that contradiction is owned by the shared Composer/profile normalization seam, PR #167 remains draft and must not repair it privately inside the Progress oracle.

This record supersedes the earlier readiness wording in this file. It is not acceptance of issue #36, #122, CUDA/native realization, CUDA-JS integration, CUDA-JS-Tensor evaluation, Vector integration, or physical NVIDIA qualification.

## Frozen authority and branches

- frozen integration base: `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`
- original secured construction handoff: `cf6271d92231a6d059708b6342c16d3a71ad4805`
- original semantic construction head: `889180f13e81bde977c6ad785fb5c735dbd3e5d1`
- Progress working branch: `ref/progress-01`
- Progress draft PR: `#167`, base `experimental/portfolio`
- latest direct-leaf green implementation/test head before this documentation update: `769fd34419f01a7521202cf3a46022f4eefe8688`
- separate shared-authority correction branch: `fix/36-progress-stop-disposition-authority`, created directly from the frozen base

Sibling Evaluator and Resource leaves remain unmerged and were not cherry-picked into Progress.

## Direct Progress ownership

The leaf owns only framework-neutral Progress semantics:

- admitted/pending/ready/claimed/terminal accounting;
- finite step/continuation/yield behavior;
- service-opportunity fairness;
- typed no-progress classification;
- stop/drain/closure and first-cause behavior;
- stale epoch isolation;
- Progress-local lifecycle/cleanup/evidence.

It does not own Domain payload meaning, Graph lifetime/reclaim meaning, Policy values, Evaluator semantics/workspace allocation, Resource capacity/allocation/release, Output payload semantics, Session command/root meaning, CUDA/native mechanisms, scheduler topology, atomics, launch policy, or product behavior.

## Direct requirements and case bank

The runner derives and verifies exactly 31 direct `ENGINE-REFERENCE-01` obligations from SPEC-0012 plus the requirement-coverage registry:

- `PROGRESS-WORK-001..007`
- `PROGRESS-FAIR-001..006`
- `PROGRESS-NOPROGRESS-001..007`
- `PROGRESS-STOP-001..007`
- `PROGRESS-LIFE-001..004`

The checked-in bank contains exactly the required 19 falsifiers and fails closed on missing, duplicate, renamed, skipped, or non-owned coverage:

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

Two mechanism-neutral schedule models, `serial` and `interleaved`, prove stable semantic-invariant parity without selecting a production scheduler.

## First red → green chain

The original construction was deliberately falsified before being treated as qualified:

1. Run `33560372823` on `9c0fded0fe169cdecbcfbf13eeb7d88d3a386314` proved the frozen Composer and exact three-profile Progress projection.
2. Run `33560919683` on `dc7ac4de6793cc95afac8864662b4d2d4cf003b0` failed before evidence because expected-case order did not match modular discovery order. This was classified as a test-construction defect.
3. Run `33561483837` on `d62ff437007ea810fb8c17f7f61f6e6220c40672` isolated all 19 cases. Nine extra reds shared an invalid test-helper assumption that ordinary work must have zero dependencies.
4. Run `33561648160` on `70701a7675ec796fc89f05cb55000a00d44c2649`, after removing only that accidental limit, left exactly four reds: `progress-ready-after-publication`, `progress-pending-yields-worker`, `progress-starvation-contract`, and composite sensitivity.
5. Commit `d4f2bf7e0e2e6e48b4371a4e1b21a52902e070e7` repaired only the three underlying Progress defects: cooperative-claim replay, finite continuation depth, and reachable starvation classification.
6. Run `33561886331` passed the full runner and all 19 focused falsifiers.
7. Temporary diagnostic workflows were removed and the permanent `Progress reference` job was added to `.github/workflows/docs.yml` and aggregate `verify`.
8. Run `33562317770` on `65c7b643a72535413834942b3760f64bca037aef` passed governance, Progress, both Windows/Ubuntu Search-IR jobs, all existing Graph/Policy jobs, and aggregate `verify`.

No valid semantic case was weakened to obtain green.

## Whole-spec post-review falsification

A whole-spec author review after the first green packet found three additional direct-leaf gaps. Existing required cases were strengthened rather than adding private acceptance semantics:

- fatal starvation blocked mandatory drain/recovery service as well as ordinary work;
- irreversible result-visible owner failure became ordinary `failed` rather than typed fatal `quarantined`;
- closure could jump from `stop-requested` directly to `terminal` without the required `draining` state.

Commit `11dc7a682aec57f36d486e1e96ccc084534c93c2` added only the targeted falsifiers. Permanent run `33563159059` was an exact red: 19 discovered/executed, 16 passed, and only the three intended cases failed. Its failing Progress evidence identity was:

```json
{
  "algorithm": "sha256",
  "byteLength": 11971,
  "sha256": "3096b3a6b8c245717f76a10679039d9d30b2b4a7abf2f57a0b26ebbb93ec524e"
}
```

Commit `7ef75c71aae4ce1d77224e3cb3522cb1bcc2ce34` repaired only those Progress-owned causes:

- starvation now prevents ordinary service while preserving service for `mustDrainKinds`;
- irreversible result-visible owner failure terminates the item as `quarantined`, preserves owner failure detail, and requests immutable first fatal `progress-internal-failure` stop;
- closure now requires the explicit `draining` lifecycle.

The first repair run exposed only a test-order mistake: once `draining` became mandatory, the closure case had to assert lifecycle rejection before live-work rejection. Commits `b25b202c2c905837065837b94a63aee3e644876a` and `769fd34419f01a7521202cf3a46022f4eefe8688` corrected those assertion sequences without weakening the oracle.

## Latest direct-leaf green evidence

Permanent documentation run `33563669994` on exact head `769fd34419f01a7521202cf3a46022f4eefe8688` passed:

- governance verification;
- Progress reference;
- Search IR reference on Windows and Ubuntu;
- all existing Graph and Policy reference jobs;
- aggregate `verify`.

The Progress job reported:

- expected: 19
- discovered: 19
- executed: 19
- passed: 19
- failed: 0
- required skipped: 0
- conditional skipped: 0
- optional skipped: 0
- not discovered: 0
- not executed by selection: 0
- direct requirements planned/executed: 31/31

Retained identities for that exact head:

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

### Progress reference evidence

```json
{
  "algorithm": "sha256",
  "byteLength": 13447,
  "sha256": "1f0d01a55b78f0061210b3fd718b2ff7bd4616573910f946f021840271456647"
}
```

## Remaining shared-authority blocker

The frozen Composer/profile authority currently constructs work classes with:

- `stopDisposition: "abandon"` for ordinary work; while
- the same class declares terminal states `completed`, `failed`, `cancelled`, `stale-disposed`, and `quarantined`, omitting `abandoned`.

This conflicts with the governing semantic distinction between `abandoned` and `cancelled`, and with SPEC-0012's owner-declared abandon/cancel/stale stop dispositions. The Search-IR Progress schema already admits the `abandoned` terminal state, so this is not a schema-capability gap; it is a Composer/profile normalization-authority contradiction.

The Progress oracle still maps normalized `abandon` to `cancelled` only because the frozen normalized profile cannot yet lawfully target `abandoned`. That mapping must **not** be accepted as final semantics and must **not** be repaired privately on `ref/progress-01` before the shared authority is corrected.

The separate branch `fix/36-progress-stop-disposition-authority` was therefore created from the frozen base. Its correction must:

1. make fixture/profile construction declare a terminal state compatible with each selected stop disposition;
2. make Progress profile normalization fail closed when a selected stop disposition cannot reach its required terminal state;
3. qualify the Composer/profile identity change and its downstream identity cascade independently;
4. remain a separate draft review seam;
5. after that shared authority is accepted, rebind `ref/progress-01`, change `abandon` service to the authoritative `abandoned` terminal state, add the corresponding Progress falsifier, and regenerate exact projection/evidence identities.

Until that occurs, PR #167 remains draft and is **not** author-ready despite the direct-leaf green run.

## Cleanup and residue

Current Progress source contains no temporary projection/red-green workflows and no checked-in generated `build/` evidence. The permanent Progress gate exists only in `.github/workflows/docs.yml` and aggregate `verify`. No CUDA C++, PTX, private CUDA escape path, production scheduler, product-specific behavior, or sibling unmerged reference implementation was introduced by this leaf.

Actions artifacts are evidence retention only and are not source authority.

## Acceptance boundary

Independent review is still required after the shared authority blocker is resolved and the Progress leaf is rebound/qualified against that accepted authority. Merging a Progress reference PR is not equivalent to closing #36. No production engine lowering is authorized before the downstream atomic acceptance gate in #122.