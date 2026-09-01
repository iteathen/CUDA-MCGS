# REF-PROGRESS-01 construction checkpoint / resume — 2026-09-01

**Status:** secured construction checkpoint; Progress semantics are not yet qualified.

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

PR #160 — `REF-EVALUATOR-01: deterministic evaluator reference`

- open, non-draft, mergeable;
- reviewed head: `ref/evaluator-01@d340e1dc6bae1c7cb556c28636786353640e404c`;
- base: `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`;
- final permanent workflow: `33553072545` green;
- Evaluator reference: `30/30`;
- still requires independent exact-head review or explicit repository-owner exact-head authorization under repository policy before integration.

### Resource

PR #166 — `REF-RESOURCE-01: finite Resource reference`

- open, non-draft, mergeable;
- reviewed head: `ref/resource-01@4a6116e9581bdc33f31f7328945e51ee93069790`;
- qualified semantic source: `faac7776c11d4f6f77f8b94059ab063a67d992b7`;
- base: `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`;
- final permanent workflow: `33558158145` green;
- Resource reference: `23/23`, with `34/34` direct Resource obligations mapped;
- still requires independent exact-head review or explicit repository-owner exact-head authorization under repository policy before integration.

Progress was deliberately started from the common frozen portfolio base, not from either unmerged PR branch. Their implementation structure may be consulted as a pattern, but their source is not part of the Progress authority unless separately integrated and rebound.

## Progress scope established before checkpoint

`SPEC-0012` assigns the following **31 direct requirements** to `ENGINE-REFERENCE-01`:

- `PROGRESS-WORK-001..007` — 7;
- `PROGRESS-FAIR-001..006` — 6;
- `PROGRESS-NOPROGRESS-001..007` — 7;
- `PROGRESS-STOP-001..007` — 7;
- `PROGRESS-LIFE-001..004` — 4.

The following remain with their declared structural, normalization, cross-specification, deletion/identity, or native owners and must not be opportunistically absorbed into this leaf:

- `PROGRESS-PROFILE-*`;
- `PROGRESS-GRAPH-*`;
- `PROGRESS-RESOURCE-*`;
- `PROGRESS-SEC-*`;
- `PROGRESS-COMPAT-*`;
- `PROGRESS-IR-*`.

The authoritative SPEC-0012 conformance table requires these mechanism-neutral cases:

- `progress-profile-strict-normalization`;
- `progress-ready-after-publication`;
- `progress-pending-yields-worker`;
- `progress-accounting-conservation`;
- `progress-mandatory-wait-cycle`;
- `progress-producer-unblocking-fairness`;
- `progress-partial-batch-device-flush`;
- `progress-must-drain-priority`;
- `progress-deadlock-vs-quiescence`;
- `progress-livelock-potential`;
- `progress-starvation-contract`;
- `progress-resource-recovery-reserve`;
- `progress-first-stop-cause`;
- `progress-stale-epoch-isolation`;
- `progress-observation-no-progression`;
- `progress-closure-complete`;
- `progress-scheduler-semantic-parity`;
- `progress-owner-deletion-zero-residue`;
- `progress-oracle-sensitivity`.

The case bank must cover those required falsifiers and map all 31 direct requirements without claiming ownership of adjacent requirement families.

## Research conclusions already established

The normalized Progress profile already exists in the Composer and supplies the semantic inputs needed by this reference. The exact frozen base exposes three materially distinct Progress profiles:

1. `progress.synthetic-evaluator-absent`;
2. `progress.synthetic-evaluator-workspace`;
3. `progress.synthetic-live-session`.

The normalized profiles already declare:

- work classes, owners, kinds, resource claims, finite step/retry/continuation bounds, terminal states and stop dispositions;
- exact producer/dependency edges, required versus advisory waits, escapes and no-worker-hold constraints;
- closure-priority and ordinary fairness classes with finite service-opportunity bounds;
- evaluator device-flush batching with no host timeout;
- typed no-progress vocabulary and bounded potential/repeated-transition evidence;
- stop lifecycle `running → stop-requested → draining → terminal`;
- closure predicates over work, channels, owner transitions, resources and terminal output;
- Resource-plan identity and predeclared closure reserves; and
- compatibility that explicitly excludes scheduler identity.

The correct LEGO boundary is therefore an in-memory deterministic semantic oracle that consumes those immutable normalized facts. No new public schema, production queue, persistent-kernel design, worker topology, CUDA Graph choice, stream topology, work-stealing algorithm, or native primitive is justified by this leaf.

## Construction completed so far

### 1. Assessment and plan

Commit `839523c76039a06e01ac303a44319047457de57a` added:

`docs/development/2026-09-01-ref-progress-01-assessment-and-plan.md`

It records the 31 direct obligations, ownership exclusions, required conformance themes, immutable-profile approach, two-schedule requirement, red-before-green intent, and claim limits.

### 2. Exact Progress-profile projection

Commit `f9a695ce4adb8b8031b2bdf4cb624d18eb3da313` added:

`experiments/search-ir-composer-reference/export-progress-profiles.mjs`

The exporter rebuilds the frozen Composer chain through Domain → Graph → Evaluator → Policy → Resource → Progress using the existing normalizers/fixtures, then requires the reconstructed Progress identities to match `composerEvidence.progressProfileIdentities` exactly before writing `build/progress-profiles.json`.

This is intended to prevent the Progress reference from inventing a private profile or drifting from Composer authority.

**Important:** this exporter has not yet been executed or qualified on the Progress branch.

### 3. Projection entrypoint

Commit `17d6e965713405d66584a0768d2659d881b56068` added:

`scripts/export-search-ir-composer-progress-profiles.mjs`

It is only the repository entrypoint for the exporter above.

### 4. Initial deterministic Progress oracle

Commit `889180f13e81bde977c6ad785fb5c735dbd3e5d1` added:

`experiments/search-semantics-reference/src/progress.mjs`

The current oracle is approximately 462 lines and is intentionally owner-local. It currently models, among other things:

- immutable normalized Progress profile authority;
- canonical arbitrary-width work incarnation and `{root, work}` epoch handling;
- class/owner/epoch-bound work lookup;
- admission and class counters;
- injected Resource-admission facts;
- pending/ready/claimed/terminal accounting;
- readiness/dependency state;
- claim/service ownership;
- finite continuation/yield/terminal transitions;
- service-opportunity/fairness accounting;
- typed fatal no-progress causes;
- stop request and immutable first stop cause;
- stale-epoch behavior;
- closure/lifecycle state; and
- schedule-neutral state observation.

This file has **not yet been tested by a Progress case bank**. Treat every behavior in it as provisional and falsifiable.

## What is deliberately NOT done

Do not infer completion from source volume. At the checkpoint, the following work had not been constructed:

- checked-in Progress expected-case fixture;
- Progress case-support helpers;
- work/readiness cases;
- fairness/schedule cases;
- no-progress cases;
- stop/closure/lifecycle cases;
- sensitivity mutants;
- two independent mechanism-neutral schedule drivers with semantic parity assertions;
- `run-progress.mjs` evidence runner;
- `scripts/run-progress-reference.mjs` wrapper;
- source-hash/evidence identity plumbing;
- focused or full Progress execution;
- red-before-green defect classification;
- permanent `Progress reference` CI job;
- aggregate `verify` dependency on Progress;
- draft Progress PR;
- qualification record;
- whole-spec/whole-diff author review.

No generated `build/` output or temporary workflow was added to the branch before checkpoint.

## Exact safe resume procedure

1. Fetch the checkpoint branch named in this handoff and verify it still resolves to the handoff commit. Do not begin from protected `main` or from an arbitrary newer branch.
2. Verify the frozen dependency authority still exists at `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af` and compare it to the checkpoint before changing source.
3. Re-read root `AGENTS.md`, SPEC-0012, the requirement-coverage registry and `docs/development/2026-09-01-ref-progress-01-assessment-and-plan.md` before editing.
4. Inspect `experiments/search-semantics-reference/src/progress.mjs` as untrusted implementation. Do not assume its state machine is correct simply because the design intent is recorded here.
5. Execute the existing Composer reference first, then execute `scripts/export-search-ir-composer-progress-profiles.mjs`. The projection must fail closed unless all three Progress identities exactly match the Composer evidence.
6. Construct the independent expected-case fixture and case bank from the SPEC-0012 conformance table and the 31 direct requirement IDs. The case registry must reject uncovered direct requirements and reject mappings to non-owned requirements.
7. Add at least two mechanism-neutral schedule drivers. Their exact interleavings may differ, but stable semantic/accounting/closure invariants must match. Do not turn either schedule into a production scheduler claim.
8. Run the first full Progress probe before repairing semantic failures. Preserve any genuine red case as falsification evidence and classify the ownership boundary before changing source.
9. Fix only Progress-owned defects. If a failure proves the normalized Progress profile is missing a generic representation, stop and route that gap to its true owner rather than patching around it in the oracle.
10. Only after the case bank is coherent and full Progress evidence is green should the permanent peer `Progress reference` job be added to `.github/workflows/docs.yml` and included in fail-closed aggregate `verify`.
11. Open a draft PR from `ref/progress-01` to the exact intended portfolio base, run the complete permanent workflow on an exact head, perform whole-spec/whole-diff author review, record repairs/evidence, remove any temporary transport, then mark review-ready without merging unless independent review/owner authorization permits it.

## High-risk semantic questions to falsify early

Prioritize tests that can prove the current oracle wrong in these areas:

- admission conservation under failed/stale/counter-exhausted admission;
- full stale-safe identity on every mutating work operation, not only lookup;
- readiness publication only after complete prerequisite publication;
- pending/yield paths releasing worker/resource authority needed by producers;
- cooperative claims remaining idempotent and exclusive claims remaining single-owner;
- continuation/retry not duplicating owner-visible effects;
- fairness bounds measured in device-visible service opportunities rather than wall time;
- closure-priority work not starving ordinary work indefinitely and ordinary priority not starving sole producers/releases;
- partial evaluator batches flushing without a host timeout;
- deadlock versus terminal quiescence versus legitimate live-session external wait;
- livelock proof using declared finite potential/repetition bounds rather than search-quality heuristics;
- starvation classification relative to the selected fairness class only;
- Resource recovery remaining injected Resource authority and using only declared reserve facts;
- first fatal/stop cause remaining immutable;
- old-epoch work never publishing into new-epoch state;
- host observation/read/ack never advancing internal progress;
- closure failing closed while any admitted work, required waiter/channel, owner transition, Resource reconciliation or terminal-output obligation remains unresolved;
- counter exhaustion terminating before alias/wrap;
- deletion/absence of evaluator/live observation/capability leaving zero solely owned Progress residue; and
- sensitivity mutants actually turning red when readiness/fairness/closure protections are removed.

## Claim limits

This checkpoint contains construction only. It proves no Progress requirement, no engine-level acceptance, no native/CUDA scheduler behavior, no performance property, no CUDA-JS compatible pair, no product behavior and no release readiness.

Progress must remain scheduler-neutral. A successful serial, round-robin, priority or other deterministic oracle schedule is semantic evidence only, not authority to select a production execution mechanism.

No native code should be introduced to solve a missing generic capability in this leaf. A genuinely missing consumer-neutral GPU primitive should be classified as a CUDA-JS library gap with bounded requirements and separate qualification.

## Cleanup state at checkpoint

- protected `main` was not modified by this Progress construction;
- `experimental/portfolio` was not modified by this Progress construction;
- PR #160 and PR #166 were not modified by this Progress construction;
- no temporary Progress workflow branch is required to resume;
- no Progress PR exists yet;
- no generated evidence is relied on outside GitHub source history.

The handoff/checkpoint branch is the durable resume authority for this unfinished Progress leaf.