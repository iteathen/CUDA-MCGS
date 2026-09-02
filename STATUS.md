# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-09-02

## Authority lanes

Protected semantic authority remains:

`main@3ecac11e3576bd063760bc9572f79bea78acd031`

The integrated CUDA-free candidate/reference line remains:

`experimental/portfolio@d8b2f617abcc4a02719499b2beb6c1b15b9896fe`

Candidate/reference integration is not protected #122 acceptance. Production lowering, native CUDA qualification, exact CUDA-JS compatible-pair support, performance and product behavior remain separate later gates.

## Integrated reference frontier

The experimental line contains the current product-neutral Graph reference chain plus Policy, Evaluator, Resource, corrected Progress and Output reference evidence. `REF-OUTPUT-01` is integrated through PR #182; the integrated tree matches reviewed/authorized Output source head `a6b4d6f9795191c057dd477e5e571aa570f8a842`.

## Active owner — #183 / REF-FRAMEWORK-LIFE-01

Draft PR #185 on `ref/framework-life-01` owns exactly the 15 direct SPEC-0000 ENGINE-REFERENCE routes:

- `FRAMEWORK-LIFE-001..009`;
- `FRAMEWORK-PERSIST-001..002`;
- `FRAMEWORK-CLEANUP-001..004`.

Framework coordinates top-level public owner lifecycle/disposition facts only: admission, initialization/reverse rollback, ignition/device closure, first authoritative stop cause, completion/cancellation, terminal borrow/teardown, optional persistence contract and complete cleanup/readback. Domain, Graph, Policy, Evaluator, Resource, Progress and Output retain their private semantic state. No scheduler topology, CUDA mechanism, persistence storage backend or product meaning is introduced here.

Exact integrated base:

`experimental/portfolio@d8b2f617abcc4a02719499b2beb6c1b15b9896fe`

Exact semantic head before this current-state-only reconciliation:

`7eb25f17481fea6a925d6d0e29baa06473ee2bff`

## Preserved red-before-green evidence

### First-cause defect

Red head `191add5a0e72e2c19e6e862676baf0251c593a95` intentionally allowed a later stop/cancellation signal to overwrite the first authoritative stop cause. Workflow `33651637686` kept Composer 881/881 green and failed exactly the two intended first-cause cases. Red Framework evidence: `594cb620885df781a795912e6365db771bdde435cf297ba6241834b527a19c6e`; artifact `9855005183`; archive SHA-256 `a8ce1cc1b2133bff7cdf655b163fdd6f4487cd94369ea38e553789c9a7b65cbb`.

The repair preserves the first cause; the falsifiers remain permanent.

### Review-discovered rollback/readback gaps

A later literal SPEC-0000 review found two uncovered Framework-owned facts despite green CI: partial initialization rollback did not explicitly prove task-created-state disposal/quarantine plus preservation of protected pre-existing/user/shared state, and CLEANUP-003 did not distinguish local files from Git state.

Test-only red head `47bd5f1326d47ce1a955b55d9f5c0e13334145da` preserved those findings before repair. Workflow `33659024252` kept Composer 881/881 green and executed all 18 Framework cases; the six failures were direct consequences of those two missing facts. Red Framework evidence: `2c3e22a634eb004cbcd249712cc079a41e8a84116296fff0d204a49202fa35f2`; artifact `9857898880`; archive SHA-256 `c6f4cac791297168b91cad2a1f4025a2bb96343b7b96796b75aec6fdfaa8ccc8`.

Green head `7eb25f17481fea6a925d6d0e29baa06473ee2bff` adds only Framework-owned public rollback/preservation validation plus separate local-files/Git-state cleanup readback. No sibling-owner private state or runtime mechanism was added.

## Semantic qualification at 7eb25f17…

Framework workflow `33659209749` passed:

- Composer `881/881`;
- Framework `18/18`;
- all `15/15` direct SPEC-0000 routes covered;
- Composer representation/composition evidence `a6abe9cb7b22f15b4e57fb89cbe0dd0a22e8539beff3e98f9f18f67c421e2bfe` (`727811` canonical bytes);
- Framework evidence `a8f17027993720c4fe61a76ce060c46206a73f36926dc280d1659c7759e0e0ad` (`6517` canonical bytes);
- artifact `9857969833`; archive SHA-256 `03c553a341b8c8314167d2ddba7536892fe9a3a1ee21b2985077d6260485f90d`.

Full repository workflow `33659209933` also passed Governance, Windows/Ubuntu Search IR, every Graph lane, Policy, Evaluator, Resource, Progress, Output and aggregate `verify`.

## Current gate

This file, `next_step.yaml`, and the experiment README/RESULTS are a current-state-only reconciliation after semantic qualification. Their commit necessarily advances the PR head without changing semantic/reference code. Therefore the resulting documentation-inclusive exact head must pass the permanent Framework workflow and full repository matrix, then receive a fresh complete-diff author review.

After that review, stop and request **fresh repository-owner authorization for that exact head and exact base**. Earlier authorization does not apply to PR #185. If the known connector draft-state defect prevents clearing #185's draft bit, preserve #185 as the reviewed record and use only a same-head/same-base non-draft replacement transport after qualification; never use transport as an authorization bypass.

## Remaining reference sequence

After authorized guarded integration and readback of #183:

1. #184 / `REF-TERMINAL-SLICE-01` — complete finite session-absent, extension-absent vertical lifecycle through public owner facts only.
2. #181 / `REF-SESSION-01` — 38 direct SPEC-0006 Session routes, reusing completed root-control authority.
3. #30 / `REF-STAGE-01` — eight-route Stage gap audit/reference.
4. #33 / `REF-CHANNEL-EVIDENCE-01` — reuse/gap-audit the existing 41-route Channel logical oracle; no second interpreter.
5. #36 / `REF-INTEGRATE-01` — one exact product-neutral Search IR/Composer/reference packet.
6. #122 — protected atomic semantic acceptance; no production lowering before protected readback.

Downstream chess/UCI/model/Book Forge/Timing Evidence/tablebase/product meaning remains in downstream products such as UCI-Arena-Vector. Generic CUDA mechanisms remain CUDA-JS-owned; generic dense Tensor mathematics remain CUDA-JS-Tensor-owned.
