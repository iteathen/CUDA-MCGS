# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-09-02

## Authority lanes

Protected semantic authority remains `main@3ecac11e3576bd063760bc9572f79bea78acd031`.

The integrated CUDA-free candidate/reference line remains `experimental/portfolio@ce21cc382bedb28647c244df1c53bf0d6c98cff0`, tree `8409e51a2df117f06f471833966517a9472fb388`. Candidate/reference integration is not protected #122 semantic acceptance, native CUDA qualification, production readiness, or product support.

`REF-SESSION-01` / #181 and `REF-STAGE-01` / #30 are complete and integrated on that experimental line. Protected `main` was not changed by either integration.

## Active candidate — #33 / REF-CHANNEL-EVIDENCE-01

Branch: `ref/channel-evidence-01`

Exact construction base: `experimental/portfolio@ce21cc382bedb28647c244df1c53bf0d6c98cff0`

Draft review PR: #191

The Channel leaf is an evidence reuse/gap-audit over the existing Composer-owned Channel schema, normalizer and bounded logical oracle. It does not create a second Channel interpreter. SPEC-0004 retains internal Channel item/publication/ownership-transfer semantics; SPEC-0011 retains aggregate resource normalization/accounting/pressure; SPEC-0012 retains global readiness/progress/fairness/no-progress/closure; CUDA-JS retains generic native publication/synchronization/runtime lowering and exact compatible-pair qualification.

The governing ENGINE-REFERENCE coverage assigns exactly 41 SPEC-0004 routes to `engine-reference-oracle`:

- `CHANNEL-ITEM-`: 10;
- `CHANNEL-PRODUCER-`: 7;
- `CHANNEL-CONSUMER-`: 7;
- `CHANNEL-PUBLISH-`: 7;
- `CHANNEL-CANCEL-`: 7;
- `CHANNEL-CONFORMANCE-`: 3.

The permanent route manifest is now requirement-level: one explicit evidence record for each of those 41 requirements. The Channel evidence adapter proves the manifest's requirement set, six family counts, coverage classification and every named owner-local case against generated Composer evidence without importing or reimplementing the Channel state machine.

## Demonstrated Channel corrections and completed gap audit

The first audit defect was cancellation first-cause loss: cancelling an already `terminally-disposed` item could replace an authoritative failure/stop disposition with `cancelled`. `simulateChannelTrace()` now makes that cancellation idempotent no-effect and preserves the first authoritative disposition. Permanent case `channel-reference-cancel-preserves-authoritative-first-cause` falsifies the old behavior.

Fresh whole-diff review then demonstrated three additional evidence gaps in the owner-local oracle rather than in a second reference layer:

1. trace operations validated generation but did not carry correlation/version/freshness, so full item identity and consumer validation could not be behaviorally claimed;
2. the request/result Channel profile declared `in-progress` and `result-ready` but the bounded trace did not execute that request→result lifecycle;
3. selected fixtures exercised required and advisory unavailable-result behavior but not the SPEC-0004 optional `skip` path.

Those gaps were closed inside the existing Channel owner. The bounded trace now checks generation, correlation, version and freshness; executes request claim/result initialization/result publication/result claim/consume; preserves duplicate/stale rejection; and distinguishes required pending, optional skip and advisory fallback. The second selected profile is now optional secondary work, while the first still supplies required evaluator-like plus advisory secondary work. Additional cancellation-state, publication, producer-precondition and sensitivity cases remain owner-local.

No native code, CUDA source/PTX, private CUDA-JS access, scheduler topology, host progression loop, product meaning, hidden queue or duplicate resource/progress authority was introduced.

## Preserved red-before-green evidence

- Run `33699198942` on construction head `8526b990c4940012e623c07a107c466c7c86e8d8`: all 883 individual Composer cases passed, then exact discovery correctly failed because the declared expected count still said 881. The count was reconciled to 883 without weakening discovery or skip checks.
- Review-gap run `33700521171`: the proposed 899-case bank discovered all 899 cases; 895 passed and four failed because the new freshness validation was applied to `initialize` before `initialize` assigned freshness. No semantic patch was committed from that red.
- Corrected review-gap run `33700867462`: focused Composer qualification passed `899/899`, all skip classes `0`, not-discovered `0`, 989 requirement dispositions classified with pending `0`; Composer evidence `c9763298fdea261065559207dc052939d39795552586370463226ad0242fc60a5`, `50559` canonical bytes. Only the four intended owner/schema files were then committed as `559f1cc12120c39a1dd509d563dcf994864f9851`.

Both temporary patch transports used to update very large owner files were deleted after their successful construction use. They are not part of the proposed permanent result.

## Current permanent evidence design

Permanent pieces are:

- `experiments/search-ir-composer-reference/src/channel.mjs` — sole Channel normalizer/bounded logical trace owner;
- `experiments/search-ir-composer-reference/src/channel-fixtures.mjs` — owner-local required/advisory/optional selected fixtures;
- `experiments/search-ir-composer-reference/run.mjs` — exact 899-case consolidated Composer capsule;
- `experiments/search-ir-composer-reference/fixtures/channel-evidence-routes.json` — 41 explicit requirement→case bindings;
- `experiments/search-ir-composer-reference/run-channel-evidence.mjs` — identity/case-status evidence adapter, not a semantic interpreter;
- `scripts/run-channel-reference-evidence.mjs` and `scripts/verify-channel-ci-gate.mjs` — permanent entry/gate checks;
- `.github/workflows/channel-reference.yml` — permanent Node 26 Channel evidence workflow.

## Current gate

PR #191 must qualify one stable final head through the permanent Channel gate plus the PR-triggered Stage, Session, Terminal, Framework and full repository/documentation gates. The Channel gate must prove Composer `899/899`, zero failures/skips/not-discovered, exact requirement-level `41/41` mapping, and a required artifact.

After those workflows are green on one exact SHA, perform a fresh base-to-head technical review and verify temporary construction residue is absent, protected `main` and the experimental base remain unchanged, and no owner leakage/native escape was introduced.

The exact final reviewed/qualified head, tree, workflow IDs and artifact/evidence identity are recorded on PR #191 and issue #33 after those checks complete. Those live tracking surfaces freeze the authorization subject without another repository commit merely to copy CI metadata into this informational file.

If the final PR head/base changes materially after review, requalify/review. If repository-owner exact-head authorization remains required, stop before integration and request authorization for that exact PR head/tree/base. General instruction to continue is not authorization to merge a newly produced head.

## Remaining reference sequence

#33 Channel evidence → #36 `REF-INTEGRATE-01` → #122 protected atomic semantic acceptance.
