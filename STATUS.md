# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-09-02

## Authority lanes

Protected semantic authority remains `main@3ecac11e3576bd063760bc9572f79bea78acd031`.

The integrated CUDA-free candidate/reference line is `experimental/portfolio@f79845b3d45eb1e3b39d7be6128776a56cb4f54a`. Candidate/reference integration is not protected #122 acceptance, native CUDA qualification, production readiness, or product support.

`REF-SESSION-01` / #181 is complete and integrated through PR #189. The integration commit has the exact reviewed Session tree and passed post-integration Session, Terminal, and Framework push qualification.

## Active candidate — #30 / REF-STAGE-01

Branch: `ref/stage-01`

Exact base: `experimental/portfolio@f79845b3d45eb1e3b39d7be6128776a56cb4f54a`

Qualified Stage semantic checkpoint before tracker reconciliation:

`9ae16e7360226e35a69a1436a1f773dada592c95`

tree:

`2f979d5d53b4e2aca60b8952315ae72753c545c1`

Stage consumes the existing Composer-normalized Stage profiles rather than creating a second schema/normalizer. It owns only per-item Stage checkpoint/outcome semantics. Domain, Graph, Policy, Evaluator, Resource, Progress, Output, Session and Framework remain separate semantic owners; CUDA-JS retains Device-JS lowering, generated CUDA/native artifacts, linking/loading and generic runtime mechanisms.

No native code, PTX backend, runtime extension registry, global scheduler, product semantics, or host progression loop was introduced.

## Stage qualification at 9ae16e73…

Stage workflow `33696515582` passed:

- Stage CI self-gate: pass;
- Composer: pass;
- exact Stage profile projection/export: pass;
- Stage behavioral reference: `10/10`;
- direct SPEC-0003 ENGINE-REFERENCE routes: `8/8`;
- required/conditional/optional skips: `0`;
- Stage profile projection: `919c3012b61aba22b374dca156762749f165e712907e341288dcc623d7d6cd28`;
- Stage evidence: `7f6088100cff6aad53edfc928213070933c12c8f34386c08193aaf768f6c42ea` (`9395` canonical bytes);
- artifact: `9871959921`;
- artifact digest: `sha256:796f945b704c47a55f3fd06b66224171f4c7a74d987ddeb53a11e667d168c636`.

The case bank proves declared owner-published outcomes, pending ownership release, Resource/Progress delegation, two materially different legal schedules with invariant per-item semantics, first-product deletion, whole-substrate absence, mutation sensitivity, a materially distinct second Stage profile, and explicit portable-vs-native claim limits.

## Preserved decisive Stage reds

- pending outcome retained Stage-owned worker/lease/reservation state: `2a12ca82dd9e99981dc3ed52623ea46d12930819`, run `33695493706`, artifact `9871610435`;
- normalized non-pending outcome release contract was not enforced and undeclared owner facts were accepted: `4ebfd3f0802f1cb746aaad986ce97cd92c04bc57`, run `33696328927`, artifact `9871897062`.

Both reds are now permanent checked-in falsifiers. No falsifier was weakened to obtain green.

The broad expansion run `33696000529` is diagnostic only: its two failures came from brittle test selection by canonical array index, not Stage semantics. The harness was corrected to select normalized `entryStage`/checkpoint surfaces without changing the Stage oracle.

## Current gate

Reconcile only `STATUS.md`, `next_step.yaml`, and this experiment's `README.md`/`RESULTS.md`, then freeze the documentation-inclusive Stage head. Open a Stage review PR against exact base `f79845b3…`, require the Stage workflow plus full repository/documentation matrix on that exact head, and complete a fresh whole-diff author review.

After a clean exact-head review, stop for fresh repository-owner authorization before any Stage integration. Do not start #33 Channel before guarded Stage integration/readback.

## Remaining reference sequence

#30 Stage → #33 Channel evidence → #36 final reference integration → #122 protected atomic semantic acceptance.
