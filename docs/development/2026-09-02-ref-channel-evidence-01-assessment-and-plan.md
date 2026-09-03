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

The existing owner-local oracle already exercises finite slots, generation/correlation, logical release/acquire, claims/borrows, pending-worker release, producer service, no-progress, pressure, stale generation, cancellation, expiry, reclamation, counter exhaustion, deletion and cleanup. Therefore the smallest complete ownership-sized work is to bind the 41 routes to that exact owner evidence and add only missing owner-local falsifiers.

SPEC-0011 remains aggregate finite-resource authority. SPEC-0012 remains global readiness/progress/fairness/no-progress authority. CUDA-JS remains the owner of native device publication/synchronization lowering and compatible-pair qualification. No native/CUDA implementation is authorized here.

## Demonstrated semantic defect

The gap audit found one real defect in the existing bounded Channel oracle. `simulateChannelTrace()` previously treated every `cancel` on a non-free/non-reclaimable item as a new cancellation and assigned `slot.disposition = 'cancelled'`.

That allowed cancellation after an already authoritative terminal failure/stop disposition to erase the first cause. This contradicted both:

- SPEC-0004 `CHANNEL-CANCEL-002`, which requires idempotent cancellation without erasing an earlier authoritative failure/stop cause; and
- the normalized Channel profile's own `terminally-disposed -> ignore-authoritative-terminal` cancellation rule.

The owner-local repair makes cancellation on `terminally-disposed` a no-effect observation that retains the existing disposition. Permanent case `channel-reference-cancel-preserves-authoritative-first-cause` covers repeated cancellation after `channel-internal-failure`.

A second missing sensitivity case, `channel-reference-escape-service-while-pending`, now proves the existing progress classifier services a declared escape while a required consumer is pending and no producer is runnable.

## Construction red and repair evidence

Permanent Channel workflow run `33699198942` on construction head `8526b990c4940012e623c07a107c466c7c86e8d8` executed all 883 Composer cases. Every individual semantic case passed, including both new Channel cases, but the capsule intentionally failed its exact discovery assertion because the explicit expected count still declared 881:

```text
AssertionError: Expected 881 cases, discovered 883
883 !== 881
```

This was classified as discovery bookkeeping rather than a semantic failure. The exact expected/not-discovered count was then reconciled to 883 without weakening discovery or skip checks.

Temporary write-transport workflow/script used only because the connected GitHub contents API has no patch operation for the two very large owner files. The transport performed exact single-occurrence replacements, `git diff --check`, committed only the intended owner source/case changes, and was deleted immediately after the count reconciliation. It is not a permanent execution path or semantic authority.

## Permanent evidence design

The permanent evidence layer consists of:

- `fixtures/channel-evidence-routes.json`: exact six-family route manifest for all 41 direct requirements;
- `run-channel-evidence.mjs`: reads the governing SPEC-0004 text, requirement coverage and generated Composer evidence, verifies exact direct-route closure, and binds the evidence identity to the owner-local Composer evidence and Channel profile/resource/progress/Stage/deletion identities;
- `scripts/run-channel-reference-evidence.mjs`: thin entrypoint;
- `scripts/verify-channel-ci-gate.mjs`: proves the permanent runner is unconditional and evidence upload is required;
- `.github/workflows/channel-reference.yml`: permanent Node 26 Channel evidence gate.

The evidence adapter deliberately does not import `channel.mjs` or reconstruct Channel state. It consumes the generated owner evidence by identity and case status only.

## Clean construction qualification checkpoint

Before PR-current-state reconciliation, exact head `006cdc99f46fc7f1c952761ec082a6bf3ba2f624` passed permanent Channel workflow `33699406167`:

- Composer: `883/883`, zero failures, zero skip classes, zero not-discovered;
- 989 requirements classified, zero pending;
- direct SPEC-0004 routes: `41/41` across the exact six families;
- owner-local cases bound by the evidence manifest: 33/33 green;
- Composer evidence: `2bb62db23d7fb3841c8ca3d6a39d6d8519c6ee07513fc7afa1463630bcee9c26`;
- Channel evidence: `f6adb5f99ac397b9f09951c6ef13b0aa15846c37c5ae17d3e67213d9d8e9fb12`, 9357 canonical bytes;
- artifact: `9872951636`;
- artifact digest: `sha256:dd9c4fd33fd594a2708f1fef94eb091caf11aa95191f2fcb69d152877e79dbbf`.

This is preserved construction evidence, not the final integration authorization subject. PR #191 exists specifically so the final reconciled head receives the existing PR-triggered Channel, Stage, Session, Terminal, Framework and full repository/documentation matrix on one exact subject.

## Final qualification and review gate

Before this leaf is authorization-ready:

1. PR #191 must pass the permanent Channel workflow on its final head with all 883 Composer cases, all 41 direct routes, zero skips/not-discovered and required evidence artifact;
2. PR-triggered Stage, Session, Terminal, Framework and repository/governance gates must all pass on that same final head;
3. exact final evidence identity and artifact digest must be recorded on PR #191 and issue #33;
4. a fresh base-to-head author technical review must find no duplicate authority, ownership leakage, first-consumer assumption, stale identity, resource/cleanup hole, native escape or CI gap;
5. temporary construction residue must remain absent and protected `main` must remain unchanged;
6. issue #33 and live tracking must freeze the exact reviewed head/tree/base without another source commit merely to copy CI metadata.

If repository policy requires fresh exact-head owner authorization for experimental integration, stop at that exact qualified/reviewed head. General instruction to continue is not merge authorization.
