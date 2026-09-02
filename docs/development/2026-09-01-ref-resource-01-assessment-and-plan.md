# REF-RESOURCE-01 assessment and plan — 2026-09-01

**Status:** Proposal

## Objective

Add the next independent `ENGINE-REFERENCE-01` LEGO: a deterministic CUDA-free Resource oracle for the direct `SPEC-0011` requirements classified to `ENGINE-REFERENCE-01`, without consuming unmerged `REF-EVALUATOR-01`, choosing CUDA mechanisms, or absorbing contributor policy.

Exact construction base: `experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`.

Parent issues: #36 and #142.

## Assess

The live issue text still describes Graph/Evaluator as candidate work, but Graph RECLAIM/advance-occurrence PRs #147-#149 and Evaluator fixture PR #162 are already integrated in the experimental portfolio. `REF-EVALUATOR-01` PR #160 is author-side ready at exact head `d340e1dc6bae1c7cb556c28636786353640e404c` and awaits its explicit independent-review/owner-authorization gate; this Resource leaf must remain independent of that unmerged reference implementation.

The requirement-coverage registry classifies these `SPEC-0011` families directly to `ENGINE-REFERENCE-01`:

- `RESOURCE-ADMIT-001..011` — 11;
- `RESOURCE-PRESSURE-001..007` — 7;
- `RESOURCE-EXHAUST-001..008` — 8;
- `RESOURCE-LIFE-001..006` — 6;
- `RESOURCE-CLEANUP-001..002` — 2.

Total direct obligations: **34**.

Other Resource families already have different primary owners:

- profile/IR/security normalization -> `IR-RESOURCE-01` / schema+Composer;
- composition/reserve structure -> deterministic composition / `IR-RESOURCE-01` with supporting reference evidence;
- physical pre-ignition allocation feasibility -> `ENGINE-NATIVE-01`;
- compatibility/deletion identity -> `IR-DELETION-ID-01`.

The reference must consume those normalized facts rather than recreate their authority.

## Research findings

`SPEC-0011` owns exactly one total-plan admission/accounting boundary. A successful reservation creates one stale-safe lease; compound admission is all-or-none; claimed/published/retired-unreclaimed/quarantined units remain conserved; retired is not free; pressure is a typed fact and never chooses semantic victims; first terminal resource cause is immutable; counters/generations do not wrap; root/session/work epochs remain explicit; cleanup must disposition every lease/transaction/retired/quarantined range and retained ledger artifact.

The current Composer already normalizes three materially different Resource profiles:

1. `resource.synthetic-evaluator-absent`;
2. `resource.synthetic-evaluator-workspace`;
3. `resource.synthetic-live-session`.

They provide exact contributors, classes, pools/partitions, reserves, admission groups, ledgers, watermarks, exhaustion metadata, lifecycle, ports and cleanup contracts. The reference should project these exact normalized profiles and operate only on those public facts.

## Reassess

A new allocator, graph reclamation model, scheduler, output policy, CUDA-JS provider abstraction or product-specific resource manager would violate LEGO ownership. The smallest sufficient reference is an in-memory semantic ledger that:

- validates exact profile/class/lease/transaction identity at its public methods;
- represents only semantic states and checked decimal arithmetic;
- consumes injected owner/quiescence/recoverability facts instead of interpreting contributor internals;
- records first cause/high-water/failed admissions deterministically;
- has deliberate mutation switches only for oracle-sensitivity tests;
- supports complete zero-residue cleanup.

The reference may use ordinary JavaScript `Map`, `Set` and `BigInt`; those are oracle mechanisms, not production layout choices.

## Plan

### 1. Exact profile projection

Add `export-resource-profiles.mjs` beside the existing Domain/Graph/Policy projectors. Rebuild Domain/Graph/Evaluator/Policy inputs through the current Composer-normalizer path, normalize the three Resource profiles, assert their identities equal the Composer-published Resource identities, and emit one immutable projection plus projection identity.

### 2. Resource oracle

Add an owner-local `resource.mjs` under `experiments/search-semantics-reference/src/` with bounded operations corresponding to Resource-owned semantic transitions:

- single and compound reserve;
- claim -> published;
- release;
- retire -> retired-unreclaimed;
- reclaim accounting only with injected owner-quiescent proof;
- quarantine;
- pressure observation;
- terminal exhaustion/first-cause capture;
- root-update compound admission without authority mutation;
- deterministic teardown/cleanup.

No raw addresses, CUDA/provider objects, graph victim choice, evaluator eviction choice, policy stop choice or host-progress loop enters the oracle.

### 3. Direct case bank

Create a finite case bank covering every direct requirement and the Section 14 falsifiers owned by this reference, including at minimum:

- failed single admission consumes no capacity;
- compound failure rolls back every provisional claim;
- claim/publish/retire/reclaim conservation under deterministic interleavings;
- retired storage is unavailable until owner-quiescent reclaim;
- quarantine remains visible and unavailable;
- terminal/progress/root reserves cannot be consumed by ordinary admission;
- pressure states publish typed facts while response remains owner-attributed;
- pressure observation is non-mutating;
- first terminal exhaustion cause is immutable;
- counter/identity exhaustion is distinct from capacity exhaustion and never wraps;
- exhaustion exposes only ready semantic facts and never fabricates a value;
- failed root-update compound admission leaves current authority/ledger unchanged;
- lifecycle rejects admission after draining begins;
- teardown leaves zero runtime residue or explicit retained evidence;
- removed optional contributor has zero owner-local runtime residue;
- sensitivity mutant that skips conservation/retired-quiescence validation is detected.

The runner must derive the 34 direct requirement IDs from `SPEC-0011`, verify the coverage registry count/owner, require every direct requirement to map to at least one case, and require the checked-in expected case bank to match discovery exactly.

### 4. Permanent qualification

Add a `Resource reference` job to the permanent workflow. The job runs Composer -> Resource projection -> Resource reference and retains its evidence. Add it to the fail-closed aggregate `verify` dependency/result set in the same change.

### 5. Review and integration

Require:

- focused Resource run;
- full permanent PR workflow on exact head, including Windows/Ubuntu existing lanes;
- complete author-side exact-head diff/spec review;
- independent review when triggered by conservation/concurrency/exhaustion consequences;
- merge only with expected-head guard and configured squash/rebase method;
- post-merge target/readback and source-branch cleanup.

## Falsifiers / stop conditions

Stop and reassess if:

- a required behavior cannot be expressed from normalized Resource facts without importing private contributor semantics;
- a natural generic GPU mechanism is needed to decide semantic truth rather than native realization;
- a direct requirement is actually owned by another contract and would create duplicate authority;
- the case bank needs a first-product/first-GPU numeric limit;
- any repair would weaken Composer/schema drift checks or existing fail-closed jobs.

## Cleanup disposition

- generated `build/` artifacts: disposable / CI-retained evidence only;
- temporary transport mechanisms: remove before durable commit;
- `ref/resource-01`: retain only while PR/review is active, delete after integration/rejection;
- protected `main`: unchanged;
- `ref/evaluator-01`: protected unchanged while independent review is pending.
