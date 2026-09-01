# REF-PROGRESS-01 construction checkpoint / resume — 2026-09-01

**Status:** Informational

**Checkpoint state:** secured construction checkpoint; Progress semantics were not yet qualified at this historical seam.

## Purpose

This handoff freezes the exact stop seam for `ENGINE-REFERENCE-01/REF-PROGRESS-01` after initial construction began and before any Progress case-bank qualification, permanent CI wiring, or pull request was created.

Do not restart the Progress work from zero and do not treat the current oracle as accepted merely because it is checked in. Resume with the repository method:

**assess → research → reassess → plan → execute**

Issues, prior handoffs, branch names, and current source are evidence to inspect, not specifications or proof of correctness.

## Frozen authority and branch state

The Progress leaf was created directly from the dependency-frozen authority:

`experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`

The last semantic construction commit before this handoff is:

`ref/progress-01@889180f13e81bde977c6ad785fb5c735dbd3e5d1`

That source head is exactly four commits ahead of the frozen base and changes only four files:

1. `docs/development/2026-09-01-ref-progress-01-assessment-and-plan.md`
2. `experiments/search-ir-composer-reference/export-progress-profiles.mjs`
3. `scripts/export-search-ir-composer-progress-profiles.mjs`
4. `experiments/search-semantics-reference/src/progress.mjs`

No Progress workflow job, case fixture, case bank, runner, script wrapper, generated evidence, or PR exists yet on this branch.

There were **zero GitHub Actions workflow runs** attached to semantic source head `889180f13e81bde977c6ad785fb5c735dbd3e5d1` at checkpoint time. Therefore no green qualification claim is valid for the current Progress implementation.

## Completed prerequisite seams that must remain independent

Two sibling `ENGINE-REFERENCE-01` leaves are author-side ready but remain unmerged and must not be silently consumed as Progress authority:

### Evaluator

- issue: `#160`
- branch: `ref/evaluator-01`
- PR: `#161`
- author-review head at checkpoint: `a352314752ab1371634248f38e7dd3b1e3404208`
- latest author-review run recorded before this checkpoint: `33543571057`
- disposition: author-side ready, unmerged

### Resource

- issue: `#166`
- branch: `ref/resource-01`
- PR: `#165`
- author-review head at checkpoint: `4a6116e9581bdc33f31f7328945e51ee93069790`
- latest author-review run recorded before this checkpoint: `33555561872`
- disposition: author-side ready, unmerged

Progress must continue from the common frozen base and may inspect those leaves only as patterns/evidence. Do not merge or cherry-pick them into `ref/progress-01` merely for convenience.

## Governing Progress authority

The semantic authority is `docs/specs/SPEC-0012-device-owned-search-progress.md` plus the accepted Search IR/composer contract surface on the frozen base.

The current construction also relies on the frozen Composer output as an input contract. The expected representation-composition evidence key is:

```json
{
  "algorithm": "sha256",
  "byteLength": 727811,
  "sha256": "1285fa9abdf70ba6902aae0d0f86a14b9a23b2c56b2aa8f5168970c0003124f2"
}
```

The three exact Progress profiles to project are:

1. `progress.synthetic-evaluator-absent`
2. `progress.synthetic-evaluator-workspace`
3. `progress.synthetic-live-session`

## Direct ENGINE-REFERENCE obligations

`REF-PROGRESS-01` is directly responsible for exactly 31 requirements from SPEC-0012:

- `PROGRESS-WORK-001..007` — 7
- `PROGRESS-FAIR-001..006` — 6
- `PROGRESS-NOPROGRESS-001..007` — 7
- `PROGRESS-STOP-001..007` — 7
- `PROGRESS-LIFE-001..004` — 4

The reference leaf must not silently absorb structural/schema/native ownership such as:

- `PROGRESS-PROFILE-*`
- `PROGRESS-RESOURCE-*`
- `PROGRESS-SEC-*`
- `PROGRESS-COMPAT-*`
- `PROGRESS-IR-*`

Those obligations are evidence dependencies or downstream owners, not permission to widen this leaf.

## Required conformance falsifiers

The complete case bank must contain these 19 named falsifiers:

1. `progress-profile-strict-normalization`
2. `progress-ready-after-publication`
3. `progress-pending-yields-worker`
4. `progress-accounting-conservation`
5. `progress-mandatory-wait-cycle`
6. `progress-producer-unblocking-fairness`
7. `progress-partial-batch-device-flush`
8. `progress-must-drain-priority`
9. `progress-deadlock-vs-quiescence`
10. `progress-livelock-potential`
11. `progress-starvation-contract`
12. `progress-resource-recovery-reserve`
13. `progress-first-stop-cause`
14. `progress-stale-epoch-isolation`
15. `progress-observation-no-progression`
16. `progress-closure-complete`
17. `progress-scheduler-semantic-parity`
18. `progress-owner-deletion-zero-residue`
19. `progress-oracle-sensitivity`

The runner must discover the exact checked-in case set and fail closed on missing, duplicate, renamed, skipped, or unowned coverage.

## High-risk semantic falsifiers

The next session should pay particular attention to these failure modes before declaring Progress correct:

- a work item becomes ready before every required payload/resource/dependency write is visible;
- cooperative evaluator claim replay creates a second service owner rather than an idempotent replay;
- a continuation can loop or recurse without consuming a declared finite bound;
- failed Resource admission is accidentally counted as admitted Progress work;
- exact retry duplicates a completion/publication/release effect;
- mandatory drain work is cancelled after an irreversible result-visible transition;
- starvation is measured by host time instead of the selected device-visible service-opportunity contract;
- partial evaluator batches rely on a host timeout rather than a device-visible opportunity threshold;
- no-progress classification mistakes pending producers for deadlock or hides a mandatory wait-for cycle;
- fatal no-progress diagnosis fails to request stop or allows new ordinary admission afterward;
- epoch advance lets stale work publish into the new epoch;
- first stop cause is overwritten by a later failure;
- closure succeeds while admitted work, owner transitions, channels, resource conservation, or terminal output remain unresolved;
- observation/poll/ack becomes a prerequisite for internal closure;
- removing an optional owner leaves Progress classes/dependencies/runtime residue behind;
- scheduler mechanism/order changes alter stable semantic invariants even though the profile excludes scheduler identity;
- weakened oracle mutations are not caught by the case bank.

## LEGO ownership boundary

Progress owns only framework-neutral progress semantics:

- admitted/pending/ready/claimed/terminal accounting;
- bounded finite step/continuation/yield rules;
- fairness/service-opportunity contracts;
- typed no-progress classification;
- stop/drain/closure lifecycle;
- stale epoch isolation;
- Progress-local cleanup records and diagnostics.

Progress does **not** own:

- Domain payload meaning;
- Graph node/reference/path/reclaim semantics;
- Policy value or backup meaning;
- Evaluator value/policy semantics or workspace allocation;
- Resource capacity/allocation/release implementation;
- Output payload semantics;
- Session command/root-control meaning;
- CUDA/native scheduler selection, worker topology, atomics, launch mode, performance tuning, or device ABI.

Those remain injected dependencies or downstream realization owners. The reference must not grow a private CUDA escape path or choose a production scheduling mechanism.

## Current constructed files

At the frozen semantic construction head, the new Progress files are:

- `experiments/search-ir-composer-reference/export-progress-profiles.mjs`
- `scripts/export-search-ir-composer-progress-profiles.mjs`
- `experiments/search-semantics-reference/src/progress.mjs`

The assessment/plan is:

- `docs/development/2026-09-01-ref-progress-01-assessment-and-plan.md`

The projection exporter is intentionally a narrow independent seam: it binds the frozen Composer evidence identity and exports only the three Progress profiles listed above.

The oracle is intentionally mechanism-neutral. It models work identity/readiness/accounting, service opportunities, no-progress/stop/epoch/closure, and cleanup only. It contains no CUDA/native scheduling mechanism.

## Exact next construction sequence

Resume in this order:

1. Re-run/verify the exact Composer baseline and the new Progress profile projection from the frozen base contract.
2. Build the checked-in 19-case fixture/case bank independently of the current oracle.
3. Build a focused runner that:
   - binds exact Composer evidence;
   - binds exact Progress profile projection identity;
   - verifies all 31 direct requirement IDs from the authoritative spec/coverage registry;
   - discovers the exact checked-in case bank;
   - writes deterministic source-hashed evidence;
   - supports focused `--case` execution without weakening full discovery.
4. Build at least two mechanism-neutral schedule drivers/trajectories and compare stable semantic invariants rather than exact service order.
5. Run the complete case bank **before repairing any failures** and retain red evidence if the current oracle is falsified.
6. Classify each red as spec misunderstanding, test-construction defect, oracle defect, or ownership-boundary defect before changing code.
7. Repair the smallest owner-local cause; do not weaken a valid case to get green.
8. Add permanent CI only after the case bank/runner is coherent and green.
9. Re-run repository governance plus Composer plus full Progress reference on the exact final head.
10. Perform whole-diff author review against `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`.
11. Create/update the Progress PR and leave it for independent review; do not merge it merely because author-side qualification passes.

## Qualification contract

A credible author-side qualification packet must record at least:

- exact base and final source SHA;
- exact Composer evidence identity;
- exact Progress projection identity;
- exact Progress evidence identity;
- 19/19 required cases discovered and executed;
- 31/31 direct requirements covered;
- zero required skips/not-discovered cases;
- two mechanism-neutral schedule models with stable invariant parity;
- red-before-green history for any real defect found;
- green permanent CI on the exact final head;
- repository governance pass on the exact final head;
- whole-diff author review outcome;
- cleanup/disposition of temporary workflows/artifacts/branches;
- explicit statement that this qualifies only the Progress semantic reference leaf, not CUDA/native realization, #36 as a whole, #122 atomic acceptance, #49, #125, #124, Vector integration, or physical NVIDIA qualification.

## Current stop seam

Stop state recorded by this handoff:

- frozen base: `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`
- semantic construction head: `889180f13e81bde977c6ad785fb5c735dbd3e5d1`
- secured handoff head: `cf6271d92231a6d059708b6342c16d3a71ad4805`
- working branch: `ref/progress-01`
- checkpoint branch: `checkpoint/ref-progress-01-construction-handoff-20260901`
- semantic status: unfinished and unqualified
- PR status at checkpoint: none
- local-state dependency: none

The first safe next command/operation is the exact Composer + Progress projection qualification gate. Do not infer green Progress semantics from the existence of the current source alone.
