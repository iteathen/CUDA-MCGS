# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-08-27

## Current candidate

`ref/graph-root-01` extends `REF-GRAPH-01` through `GRAPH-ROOT-001..006`. ROOT is hosted-qualified but is **not** protected-main integrated until its PR is squash-merged and the exact squash SHA passes protected-main readback.

Protected base for this candidate is `main@e4069458ece47bbea0c2770204fa21fffbde6bb6` (PATH integration, PR #137).

Hosted ROOT qualification run `33107176873` passed the complete Composer → Domain → NODE → EDGE → REF → PATH → ROOT chain plus `./scripts/verify-docs.sh`, then removed all temporary migration/correction tooling before publishing durable semantic commit `d6b091e7c1afc6c09eb7e562cd7f72eb2773874d`.

## Exact candidate evidence

Composer:

- `879/879` cases;
- framework selection `de3b9a89f0570752230a6914bcb3c5374f73e5e59c424752819c0892e1f21ea5` (`10422` canonical bytes);
- representation/composition `ca5119c2d50e6ba218ab962ede9ad94d8c90f1d031b008ab74d92166d0ef4529` (`719510` canonical bytes).

Domain:

- projection `e9df2902e6edaad40c6abf0b85eeecb06e94b4d5598d9c0b9c7238fa20c3edaa` (`69524` canonical bytes);
- evidence `f186412a9b8d964c7f92e4c4000942768fa0ae81d62349c2528fd3aba12aa5e7` (`30372` canonical bytes);
- `49/49`, direct `47/47`.

Graph projection:

- `89ee04a47d8516ad02e33e884d8f35db9573840f58db140c6cbafe79178e7fd7` (`139099` canonical bytes).

Graph owner evidence:

- NODE `4299dccecd33f6ef38c50f144e84316d00c7046a81ed6206b6e2e645b6683f74`, `13/13`, direct `11/11`;
- EDGE `54b83935d320e6bd656c740ec2f3d8be062e3932bdf6e748c8315f26245faf58`, `16/16`, direct `10/10`;
- REF `e3370158d1234dd3642d11c4458c9c390abcc3f62a04a75dd68d00faf6c4676d`, `14/14`, direct `8/8`;
- PATH `af8f140e45f7c2942ec4b09b7d752f49b3eeb28f1cdc5b8c3b74887d34dd4318`, `14/14`, direct `8/8`;
- generated root-control projection `2c71df25fff213f515aae02a01e210292a8e9b76fc84e14ab6cafb251fbbc9f1`;
- ROOT `7e4fe6bf748ec110bebc1798d7742e03b89909df84da709f2fdeb51a42311ed0` (`10008` canonical bytes), `14/14`, direct `6/6`.

Selected normalized profile identities:

- Graph `450fd5f79d4c0f2ee98f5854008c4c58f57a6c6424e144aa4ae2ad34fdcbcd61`;
- Policy `1f4097bde39f3f072ace983ba99fc3167625b2ff5db841f6a7792cf9aec37aaf`;
- Resource `8a722bcd7ae6b0ec86f4d589ea0ee3df8291c64a6d95b10e3dde2a3defe66481`;
- Progress `7f3fcb4229bb7694b60469d3edba6302e5584bf87ef1284856a73f1b677ce8e8`;
- Output `3bdc5d9c8fc63fb1bd34a6d93d7fc034518d4e7abb2b41f49406aaf8641b98a5`.

## ROOT behavior proved

The ROOT capsule proves only Graph-owned root storage/protection behavior:

- root anchors are finite typed references and are protected before publication;
- Session/current-root/epoch authority remains outside Graph;
- released anchor slots reuse only through explicit terminal-to-free lifecycle plus REF generation advancement;
- a ready successor may be anchored for `advance` without retained-state reclassification, reclamation or eager cleanup;
- `reroot` resolves/protects the replacement before Session authority commit and leaves the old anchor valid until commit;
- replacement pressure cannot mutate the prior accepted root;
- owner retain/retain-if-key-valid/transform/reset/invalidate disposition is delegated over opaque owner records;
- old-epoch work may retain an independent protection after root authority changes;
- superseding one occurrence cannot invalidate a still-valid shared transposed node;
- `attention` changes have zero Graph ROOT effect;
- publication-before-protection and eager-old-root-release mutations are detected.

## Graph profile corrections discovered by ROOT

ROOT falsification closed three Graph-owned representation gaps:

1. materialized root-anchor storage has explicit finite `resource-root-anchor-slots` funding using the existing `protection-capacity` pressure family;
2. aggregate protection-capacity slot resources must cover both protection-record and root-anchor layouts;
3. root-anchor and protection-record terminal states have explicit private reset-to-free transitions. Ready protection records still require their normal release transition before reset; ROOT does not bypass REF lifecycle authority.

These changes intentionally rebound all proposal-derived Composer/Graph/downstream evidence identities above.

## Permanent qualification path

The branch adds a permanent `Graph ROOT reference` job to `.github/workflows/docs.yml`. It replays Composer → Graph projection → NODE → REF → PATH → ROOT and retains `root-control.json` plus the owner evidence artifacts. EDGE remains an independent regression job.

Before integration, the final documentation-bearing PR head must pass the complete ordinary workflow: verify, Windows/Ubuntu Search IR, NODE, EDGE, REF, PATH and ROOT.

## Claim limits

This candidate does **not** prove `GRAPH-RECLAIM-*`, a reclamation mechanism, native/CUDA execution, physical scheduling, production implementation, performance, contract acceptance, SDK/release readiness or multi-GPU support. RECLAIM remains blocked until ROOT is squash-merged and reproduced on protected main.
