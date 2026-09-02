# CUDA-MCGS search-semantics reference experiment

**Status:** Informational

This CUDA-free experiment is the behavioral/reference evidence lane for `ENGINE-REFERENCE-01`. Each brick consumes Composer-normalized identities and public owner facts, proves one semantic boundary, and leaves native/CUDA realization downstream.

## Authority and integrated base

Protected semantic authority remains `main@3ecac11e3576bd063760bc9572f79bea78acd031`.

The integrated candidate/reference base is `experimental/portfolio@f79845b3d45eb1e3b39d7be6128776a56cb4f54a`; #181 Session is already integrated there. Candidate integration is not protected #122 acceptance.

## Active Stage brick

Issue #30 / PR #190 / `ref/stage-01` adds only the missing Stage behavioral evidence from the existing normalized Stage authority.

Qualified semantic checkpoint:

`9ae16e7360226e35a69a1436a1f773dada592c95`

tree `2f979d5d53b4e2aca60b8952315ae72753c545c1`.

Documentation-inclusive review checkpoint:

`385594ab40feeb31bea933ceed0155b9a091e996`.

Stage owns per-work-item stable checkpoint invocation and declared local outcome semantics. Resource pressure/admission remains SPEC-0011, global scheduling/fairness remains SPEC-0012, all source-domain semantics remain with their owners, and CUDA-JS retains Device-JS lowering/native artifact/runtime mechanisms.

## Qualification and review

The semantic Stage workflow `33696515582` established the stable evidence identity. The documentation-inclusive PR checkpoint then passed all coupled exact-head gates:

- Stage `33696784971`;
- Session `33696784953`;
- Terminal `33696784966`;
- Framework `33696784943`;
- full repository/documentation matrix `33696784987`, including Governance, Windows/Ubuntu Search IR and aggregate `verify`.

The Stage result remains:

- cases `10/10`;
- direct SPEC-0003 ENGINE-REFERENCE routes `8/8`;
- no skips/not-discovered;
- projection `919c3012b61aba22b374dca156762749f165e712907e341288dcc623d7d6cd28`;
- evidence `7f6088100cff6aad53edfc928213070933c12c8f34386c08193aaf768f6c42ea` over `9395` canonical bytes;
- exact-PR-checkpoint artifact `9872056402`, digest `sha256:4d7334fdd4aa6806762b01040e7eb75143a0c955542b6eacc3891b381e2f80a4`.

Fresh base-to-head author review of all 16 changed files found no blocking semantic, ownership, evidence, governance or cleanup defect. No generated `build/` output is checked in, no second Stage normalizer exists, and no Resource/Progress/CUDA-JS/product authority was imported.

## Retained Stage reds

- `2a12ca82…` / run `33695493706` / artifact `9871610435`: pending outcome retained worker/lease/reservation and was incorrectly accepted.
- `4ebfd3f0…` / run `33696328927` / artifact `9871897062`: a non-pending outcome could contradict normalized worker/lease release and an invocation could carry an undeclared owner fact.

Both failures are durable falsifiers. The intermediate run `33696000529` is diagnostic only; it exposed brittle canonical-array-index assumptions in tests and was corrected by selecting normalized `entryStage`/checkpoint identities without changing Stage semantics.

## Evidence integrity

The Stage registration module pins the content hashes of both core and review case modules, so a transitive case-source change cannot silently preserve the evidence registration identity.

Generated `build/` evidence remains disposable; checked-in sources/cases, workflow artifacts and evidence identities are durable coordinates.

## Run

Use Node.js 26 or newer:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-stage-profiles.mjs
node scripts/run-stage-reference.mjs
```

The permanent Stage lane also runs `scripts/verify-stage-ci-gate.mjs`.

## Current gate

This tracker-only finalization changes no semantic/test/projection/workflow source. Require its exact-head coupled workflows to remain green, then stop for fresh repository-owner authorization of the exact PR #190 head/base before any integration.

Only after guarded Stage integration/readback does #33 Channel become dependency-ready.

## Claim limits

This is CUDA-free product-neutral reference evidence. It does not establish protected proposal acceptance, Device-JS lowering, PTX/cubin/native artifacts, CUDA publication races, occupancy/performance, stable SDK support, or product semantics.
