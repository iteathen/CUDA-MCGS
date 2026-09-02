# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-09-02

## Active candidate

`REF-FRAMEWORK-LIFE-01` is the active CUDA-free owner reference on draft PR #185, branch `ref/framework-life-01`, exact base:

`experimental/portfolio@d8b2f617abcc4a02719499b2beb6c1b15b9896fe`

It covers exactly 15 direct SPEC-0000 ENGINE-REFERENCE routes and introduces no native/runtime/product authority.

## First red proof — first stop cause

Exact red head:

`191add5a0e72e2c19e6e862676baf0251c593a95`

Workflow `33651637686` preserved the intentional last-stop-wins defect. Composer stayed 881/881; all 18 Framework cases executed; exactly `framework-first-stop-cause` and `framework-cancellation-idempotent` failed.

- red Framework evidence: `594cb620885df781a795912e6365db771bdde435cf297ba6241834b527a19c6e`;
- artifact: `9855005183`;
- archive SHA-256: `a8ce1cc1b2133bff7cdf655b163fdd6f4487cd94369ea38e553789c9a7b65cbb`.

The repair preserved the first authoritative cause without changing the falsifiers.

## Second red proof — review-discovered cleanup/rollback truth

Literal SPEC-0000 review later found two facts that the earlier green suite did not make explicit:

- CLEANUP-002 required partial initialization failure to prove task-created-state disposal/quarantine **and** preservation of protected pre-existing/user/shared state;
- CLEANUP-003 required owning-system readback to distinguish local files from Git state.

Test-only red head:

`47bd5f1326d47ce1a955b55d9f5c0e13334145da`

Framework workflow `33659024252` kept Composer 881/881 green and ran all 18 Framework cases. Six failures were direct consequences of those two missing facts; no unrelated wiring or coverage failure appeared.

- red Framework evidence: `2c3e22a634eb004cbcd249712cc079a41e8a84116296fff0d204a49202fa35f2`;
- canonical bytes: `8349`;
- artifact: `9857898880`;
- archive SHA-256: `c6f4cac791297168b91cad2a1f4025a2bb96343b7b96796b75aec6fdfaa8ccc8`.

Green repair head `7eb25f17481fea6a925d6d0e29baa06473ee2bff` adds only Framework-owned public rollback/preservation validation and separate local-files/Git-state cleanup facts.

## Semantic qualification at 7eb25f17…

Framework workflow `33659209749` succeeded:

### Composer

- capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- cases: `881/881`;
- representation/composition SHA-256: `a6abe9cb7b22f15b4e57fb89cbe0dd0a22e8539beff3e98f9f18f67c421e2bfe`;
- canonical bytes: `727811`.

### Framework lifecycle

- capsule: `cuda-mcgs-framework-lifecycle-reference-v0.2.0`;
- scope: `full-framework-lifecycle-reference`;
- expected/discovered/executed/passed: `18/18/18/18`;
- failed/skipped/undiscovered: `0`;
- direct SPEC-0000 routes: `15/15`;
- Framework evidence SHA-256: `a8f17027993720c4fe61a76ce060c46206a73f36926dc280d1659c7759e0e0ad`;
- canonical bytes: `6517`;
- artifact: `9857969833`;
- archive SHA-256: `03c553a341b8c8314167d2ddba7536892fe9a3a1ee21b2985077d6260485f90d`.

### Full repository matrix

Workflow `33659209933` succeeded across:

- Governance verification;
- Search IR on Ubuntu;
- Search IR on Windows;
- Graph NODE, EDGE, REF, PATH, ROOT, RECLAIM, ADVANCE occurrence and CLEANUP;
- Policy reference;
- Evaluator reference;
- Resource reference;
- Progress reference;
- Output reference;
- aggregate `verify`.

## Ownership review result at semantic head

The complete executable Framework brick remains bounded to public lifecycle/disposition coordination. The runner derives the exact 15-route registry from authoritative SPEC-0000 and requirement coverage; the checked-in 18-case bank cannot silently omit or invent a direct route. Fixtures are synthetic and product-neutral. No sibling-owner private state, physical scheduler, CUDA mechanism, persistence storage backend, Tensor assumption or product semantic was introduced.

The latest repair did not change Composer or sibling owner identities; only Framework source/evidence changed, so no dependent upstream evidence rebind was appropriate.

## Final documentation-inclusive gate

This RESULTS file and the repository current-state files are intentionally updated after semantic qualification. That documentation-only reconciliation changes the PR head but not Framework semantics. The resulting exact head must rerun the permanent Framework workflow and full repository matrix, then receive a fresh complete-diff author review before any integration authorization request.

PR #185 remains a candidate. No merge or protected/native/performance/product claim is authorized by these results.

## Next after authorized integration

After exact-head repository-owner authorization, guarded integration and target readback, #184 / `REF-TERMINAL-SLICE-01` is the next dependency-ready reference leaf. Do not skip directly to Session.
