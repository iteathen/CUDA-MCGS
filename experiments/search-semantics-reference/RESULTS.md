# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-09-02

## Integrated reference baseline

Current integrated candidate/reference line:

`experimental/portfolio@d8b2f617abcc4a02719499b2beb6c1b15b9896fe`

Protected semantic authority remains separate at:

`main@3ecac11e3576bd063760bc9572f79bea78acd031`

`REF-OUTPUT-01` is integrated through PR #182. Its reviewed/authorized source head `a6b4d6f9795191c057dd477e5e571aa570f8a842` and integrated commit have the same tree. Output retained 25/25 cases, 51/51 direct SPEC-0013 obligations and evidence `c3e07a14aac198ae6dede35e6606a60e1e9e0965687508db4608c97508faed5c`.

## Active Framework lifecycle candidate

Issue #183 / draft PR #185 owns `REF-FRAMEWORK-LIFE-01` on branch `ref/framework-life-01`, based exactly on the Output-integrated candidate line above.

The owner maps exactly 15 direct SPEC-0000 ENGINE-REFERENCE obligations:

- `FRAMEWORK-LIFE-001..009`;
- `FRAMEWORK-PERSIST-001..002`;
- `FRAMEWORK-CLEANUP-001..004`.

The checked-in case bank has 18 cases and remains owner-local. It consumes public lifecycle/disposition facts rather than copying Domain, Graph, Policy, Evaluator, Resource, Progress or Output private state.

## Preserved red evidence

Exact red head:

`191add5a0e72e2c19e6e862676baf0251c593a95`

Workflow `33651637686` produced:

- Composer: 881/881 pass;
- Framework: 18 discovered / 18 executed / 16 pass / 2 fail;
- only failing cases: `framework-first-stop-cause` and `framework-cancellation-idempotent`;
- cause: a later stop/cancellation signal overwrote the first authoritative stop cause.

Red Framework evidence:

`594cb620885df781a795912e6365db771bdde435cf297ba6241834b527a19c6e`

Retained artifact:

- artifact `9855005183`;
- archive SHA-256 `a8ce1cc1b2133bff7cdf655b163fdd6f4487cd94369ea38e553789c9a7b65cbb`.

The repair preserves the first cause. The red cases were not weakened or reinterpreted.

## Review-driven hardening

The first green implementation was not accepted as semantic proof merely because CI passed. Fresh exact-head review found four Framework-owned evidence gaps:

1. cancellation did not yet prove owner-declared abandon/must-drain/release plus conserved reservation/resource accounting, no partial backup and no premature teardown;
2. completion did not prove exact coverage of every declared result-visible owner;
3. selected persistence did not yet declare authorization/recovery/rollback or revalidate semantic/profile/package identity on restore; and
4. cleanup/readback did not enumerate the full task-created lifecycle surface required by SPEC-0000.

The candidate was hardened in the same Framework owner. Current falsifiers now cover exact completion owner sets, cancellation accounting/drain truth, persistence absence and selected restore quarantine, generated source/package/cache and persisted-artifact ownership, local state/process/transfer/credential/external-coordination cleanup, and exact final disposition readback.

No scheduler, CUDA implementation, persistence storage backend, product semantics or other owner-private state was added.

## Pre-documentation semantic qualification

Exact semantic head before this documentation reconciliation:

`7934537fa331b074a12d7725ba6bc0087134a7ce`

Permanent Framework workflow `33653132339` passed:

- Composer: 881/881;
- Framework lifecycle: 18/18;
- direct SPEC-0000 Framework routes: 15/15;
- Framework evidence: `8ba3f17858a4452f919fbea02bb822860ed13388748f11c9feacc757c63492c6`;
- canonical evidence bytes: 6517.

Retained artifact:

- artifact `9855587220`;
- archive SHA-256 `ff38b018a82c04b66ae28fde17c672163ba764161cc9ec104da779c9bb16b583`.

The complete repository documentation/semantic workflow `33653132386` also passed on that semantic head.

This current-state documentation reconciliation advances the branch after that evidence. Therefore the numbers above are preserved pre-documentation provenance, not a claim that the new final head has already been qualified. Final exact-head CI and whole-diff review must rerun.

## Next evidence gates

After #183 reaches one exact green/reviewed head and receives separate repository-owner authorization:

1. guarded-integrate #183 and read back `experimental/portfolio`;
2. execute #184 `REF-TERMINAL-SLICE-01` as the complete finite session-absent/extension-absent CUDA-free lifecycle integration slice;
3. then #181 Session, #30 Stage, #33 Channel evidence, #36 `REF-INTEGRATE-01` and #122 protected atomic semantic acceptance.

No candidate evidence here authorizes production lowering or native implementation.

## Claim limits

This evidence concerns CUDA-free Framework/reference semantics only. It does not prove production runtime behavior, native CUDA memory ordering/concurrency, physical device support, CUDA-JS compatible-pair support, performance, release readiness, multi-GPU support or downstream product/chess/UCI/model semantics.
