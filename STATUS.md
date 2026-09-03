# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-09-02

## Authority lanes

Protected semantic authority remains `main@3ecac11e3576bd063760bc9572f79bea78acd031`.

The integrated CUDA-free candidate/reference line is `experimental/portfolio@f79845b3d45eb1e3b39d7be6128776a56cb4f54a`. Candidate/reference integration is not protected #122 acceptance, native CUDA qualification, production readiness, or product support.

`REF-SESSION-01` / #181 is complete and integrated through PR #189. Its integrated tree equals the authorized reviewed Session tree and its post-integration Session, Terminal and Framework gates passed.

## Active candidate — #30 / REF-STAGE-01

Branch: `ref/stage-01`

Exact base: `experimental/portfolio@f79845b3d45eb1e3b39d7be6128776a56cb4f54a`

Review PR: #190

Qualified Stage semantic checkpoint:

`9ae16e7360226e35a69a1436a1f773dada592c95`

tree:

`2f979d5d53b4e2aca60b8952315ae72753c545c1`

Documentation-inclusive review checkpoint:

`385594ab40feeb31bea933ceed0155b9a091e996`

The single commit between those checkpoints changes only `STATUS.md`, `next_step.yaml`, and this experiment's `README.md`/`RESULTS.md`. No Stage semantic, test, runner, projection or workflow source changed after `9ae16e73…`.

Stage consumes the existing Composer-normalized Stage profiles rather than creating another schema/normalizer. It owns only per-work-item stable checkpoint invocation and declared local outcome semantics. Domain, Graph, Policy, Evaluator, Resource, Progress, Output, Session and Framework remain separate semantic owners; CUDA-JS retains Device-JS lowering, generated CUDA/native artifacts, linking/loading and generic runtime mechanisms.

No native code, PTX backend, runtime extension registry, global scheduler, product semantics, or host progression loop was introduced.

## Exact PR qualification at 385594ab…

All required PR workflows passed on the same documentation-inclusive head:

- Stage behavioral reference `33696784971` — success;
- Session behavioral reference `33696784953` — success;
- Terminal slice reference `33696784966` — success;
- Framework lifecycle reference `33696784943` — success;
- full repository/documentation matrix `33696784987` — success, including Governance, Ubuntu/Windows Search IR, Graph lanes, Policy, Evaluator, Resource, Progress, Output and aggregate `verify`.

The Stage run proved:

- Stage CI self-gate: pass;
- Composer and exact Stage projection/export: pass;
- Stage behavioral reference: `10/10`;
- direct SPEC-0003 ENGINE-REFERENCE routes: `8/8`;
- required/conditional/optional skips: `0`;
- Stage profile projection: `919c3012b61aba22b374dca156762749f165e712907e341288dcc623d7d6cd28`;
- Stage evidence: `7f6088100cff6aad53edfc928213070933c12c8f34386c08193aaf768f6c42ea` (`9395` canonical bytes);
- exact-PR-head artifact: `9872056402`;
- artifact digest: `sha256:4d7334fdd4aa6806762b01040e7eb75143a0c955542b6eacc3891b381e2f80a4`.

Fresh base-to-head author review of all 16 changed files found no blocking semantic, ownership, evidence, governance or cleanup defect. This is author review, not repository-owner authorization.

## Preserved decisive Stage reds

- pending outcome retained worker/mutable lease/reservation state: `2a12ca82dd9e99981dc3ed52623ea46d12930819`, run `33695493706`, artifact `9871610435`;
- normalized non-pending outcome release was not enforced and undeclared owner facts were accepted: `4ebfd3f0802f1cb746aaad986ce97cd92c04bc57`, run `33696328927`, artifact `9871897062`.

Both are permanent checked-in falsifiers. No falsifier was weakened for green.

The expanded-case failure at `1a1e21c1…` / run `33696000529` remains diagnostic only: it exposed brittle test selection by canonical array index, and was corrected by selecting normalized `entryStage`/checkpoint identity without changing Stage semantics.

## Current gate

This final tracker reconciliation must change only the four current-state documents above and must itself receive exact-head Stage plus full coupled/repository qualification. After that readback, the only remaining pre-integration gate is **fresh repository-owner authorization of the exact PR #190 head against exact base `f79845b3…`**.

Do not integrate #30 or start #33 Channel before that authorization and guarded Stage integration/readback.

## Remaining reference sequence

#30 Stage → #33 Channel evidence → #36 final reference integration → #122 protected atomic semantic acceptance.
