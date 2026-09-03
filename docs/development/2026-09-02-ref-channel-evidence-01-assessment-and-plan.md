# REF-CHANNEL-EVIDENCE-01 assessment and execution record

**Status:** Informational

## Exact starting seam

- Repository: `iteathen/CUDA-MCGS`
- Base: `experimental/portfolio@ce21cc382bedb28647c244df1c53bf0d6c98cff0`
- Base tree: `8409e51a2df117f06f471833966517a9472fb388`
- Working branch: `ref/channel-evidence-01`
- Draft review PR: #191
- Parent issue: #33 `CUDA-MCGS nonblocking Async Stage Channels`
- Upstream Stage integration: #30 complete on `ce21cc38…`
- Downstream: #36 `REF-INTEGRATE-01`, then #122 atomic protected semantic acceptance

Protected `main@3ecac11e3576bd063760bc9572f79bea78acd031` is not a construction target for this leaf.

## Assessment and research result

`REF-CHANNEL-EVIDENCE-01` is an evidence/qualification leaf, not authorization to create a second Channel semantic implementation. The governing ENGINE-REFERENCE plan assigns exactly 41 direct SPEC-0004 requirements to `engine-reference-oracle`, while the logical Channel normalization, publication/ownership lifecycle and bounded reference state machine already belong to `experiments/search-ir-composer-reference/`.

The exact direct families are:

- `CHANNEL-ITEM-`: 10
- `CHANNEL-PRODUCER-`: 7
- `CHANNEL-CONSUMER-`: 7
- `CHANNEL-PUBLISH-`: 7
- `CHANNEL-CANCEL-`: 7
- `CHANNEL-CONFORMANCE-`: 3

SPEC-0011 remains aggregate finite-resource authority. SPEC-0012 remains global readiness/progress/fairness/no-progress authority. CUDA-JS remains the owner of native device publication/synchronization lowering and compatible-pair qualification. No native/CUDA implementation is authorized here.

## First demonstrated semantic defect

The initial gap audit found a real defect in the existing bounded Channel oracle. `simulateChannelTrace()` treated every `cancel` on a non-free/non-reclaimable item as a new cancellation and assigned `slot.disposition = 'cancelled'`.

That allowed cancellation after an already authoritative terminal failure/stop disposition to erase the first cause. This contradicted SPEC-0004 `CHANNEL-CANCEL-002` and the normalized profile's own `terminally-disposed -> ignore-authoritative-terminal` cancellation rule.

The owner-local repair makes cancellation on `terminally-disposed` a no-effect observation that retains the existing disposition. Permanent case `channel-reference-cancel-preserves-authoritative-first-cause` covers repeated cancellation after `channel-internal-failure`. Permanent case `channel-reference-escape-service-while-pending` also proves the existing progress classifier services a declared escape while a required consumer is pending and no producer is runnable.

## Initial construction red

Permanent Channel workflow run `33699198942` on construction head `8526b990c4940012e623c07a107c466c7c86e8d8` executed all 883 Composer cases. Every individual semantic case passed, including both new Channel cases, but the capsule failed its exact discovery assertion because the explicit expected count still declared 881:

```text
AssertionError: Expected 881 cases, discovered 883
883 !== 881
```

This was discovery bookkeeping rather than a semantic failure. The exact expected/not-discovered count was reconciled to 883 without weakening discovery or skip checks.

## Whole-diff reassessment and review-discovered gaps

A fresh base-to-head review of the first evidence version found that the family-level route manifest was too coarse for SPEC-0004's acceptance rule that every normative requirement map to strict normalization plus an independent reference case or explicit cross-spec proof. The same review also found three genuine owner-local behavioral evidence gaps:

1. **Full item identity:** the trace validated generation but operation records did not carry correlation/version/freshness, so `CHANNEL-ITEM-001/007` and `CHANNEL-CONSUMER-001/005` could not be honestly claimed as behaviorally exercised.
2. **Request/result lifecycle:** the required evaluator-like profile declared `in-progress` and `result-ready`, but the bounded trace did not execute request claim → result initialization → result publication → result claim/consume.
3. **Optional unavailable-result path:** selected fixtures covered required pending and advisory fallback but not the explicit optional `skip` path called for by the Channel conformance contract.

Those were owner gaps, not justification for a second interpreter. The repair stayed inside the existing Channel brick:

- trace slots now carry finite correlation, profile version and opaque freshness with rejection of foreign/stale values;
- the bounded trace executes the request/result states and preserves release/acquire checks on both publication boundaries;
- required unavailable work becomes bounded pending, advisory follows owner fallback, and the materially different second selected profile now exercises optional skip;
- additional tests cover duplicate publication/result publication, mutation after ready, mutable-lease retention while pending, cancellation across live states, publication coherence and producer preconditions;
- the Channel profile schema now admits `optional` dependency requirements with a required skip escape.

## Review-gap red-before-green evidence

The first review-gap transport run `33700521171` proposed an exact 899-case capsule. All 899 cases were discovered; 895 passed and four failed because the new freshness validator checked an `initialize` operation before `initialize` had assigned its freshness value. No semantic patch was committed from that red.

The temporary patch was corrected so freshness is assigned by initialization before later access validates it. Run `33700867462` then passed the full focused Composer capsule:

- expected/discovered/executed/passed: `899/899/899/899`;
- failures: `0`;
- required/conditional/optional skips: `0`;
- not-discovered: `0`;
- 989 requirement dispositions classified, pending `0`;
- Composer evidence `c9763298fdea261065559207dc052939d39795552586370463226ad0242fc60a5`;
- canonical bytes `50559`.

Only the four intended permanent owner/schema files were committed from that green run as `559f1cc12120c39a1dd509d563dcf994864f9851`.

## Cleanup of construction transport

The connected GitHub contents API has no patch operation for the very large owner files, so narrow temporary Actions transports were used for exact single-occurrence replacements. Each transport ran `git diff --check`, showed the intended diff, ran the focused capsule before committing semantic changes, and committed only explicit files.

All temporary construction/review transport workflows and patch scripts were deleted after their successful use. They are not permanent execution paths, semantic owners, or part of the intended PR result.

## Permanent evidence design — requirement-level v0.2

The permanent evidence layer consists of:

- `fixtures/channel-evidence-routes.json`: 41 explicit requirement→owner-case records plus the exact six family counts;
- `run-channel-evidence.mjs`: reads the governing SPEC-0004 text, requirement coverage and generated Composer evidence; proves the exact direct requirement set, exact family classification, one unique route per requirement and passing status for every named owner-local case; and binds the evidence identity to the Composer evidence plus Channel resource/progress/Stage/deletion identities;
- `scripts/run-channel-reference-evidence.mjs`: thin entrypoint;
- `scripts/verify-channel-ci-gate.mjs`: proves the permanent runner is unconditional and evidence upload is required;
- `.github/workflows/channel-reference.yml`: permanent Node 26 Channel evidence gate.

The evidence adapter deliberately does not import `channel.mjs` or reconstruct Channel state. It consumes generated owner evidence by identity and case status only. This preserves one visible semantic owner under LEGO.

The v0.1 family-level evidence checkpoint on `006cdc99f46fc7f1c952761ec082a6bf3ba2f624` / run `33699406167` remains useful historical construction evidence but is superseded for final acceptance by the 899-case, requirement-level v0.2 gate.

## Final qualification and review gate

Before this leaf is authorization-ready:

1. PR #191 must pass the permanent Channel workflow on one stable final head with Composer `899/899`, all 41 individual direct routes, exact six-family closure, zero skips/not-discovered and required evidence artifact;
2. PR-triggered Stage, Session, Terminal, Framework and repository/governance gates must all pass on that same final head;
3. exact final Channel evidence identity, canonical byte count, artifact and artifact digest must be recorded on PR #191 and issue #33;
4. a fresh complete base-to-head author technical review must find no duplicate authority, ownership leakage, first-consumer assumption, stale identity, resource/cleanup hole, native escape or CI gap;
5. temporary construction residue must remain absent and protected `main` plus the exact experimental base must remain unchanged;
6. issue #33 and live tracking must freeze the exact reviewed head/tree/base without another source commit merely to copy CI metadata.

If repository policy requires fresh exact-head owner authorization for experimental integration, stop at that exact qualified/reviewed head. General instruction to continue is not merge authorization.
