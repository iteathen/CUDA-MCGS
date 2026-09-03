# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-09-02

## Authority and exact integration input

Protected semantic authority remains:

`main@3ecac11e3576bd063760bc9572f79bea78acd031`

`REF-INTEGRATE-01` starts from the exact integrated candidate:

`experimental/portfolio@85c20d794746031d201f72bc78fce25ff9f69c3d`

tree:

`5eadec7f403a388ea096f983ebf2e87eca2465f0`

This input already contains the candidate-integrated Domain, complete Graph chain, Policy, Evaluator, Resource, Progress, Output, Framework lifecycle, terminal slice, Session, Stage, and Channel owner-evidence leaves. Candidate/reference state remains distinct from protected #122 acceptance and all native/product claims.

## Final reference packet accounting

The governing coverage classification yields:

| Lane | Reference requirements |
| --- | ---: |
| Framework / SPEC-0000 | 15 |
| Stage / SPEC-0003 | 8 |
| Session / SPEC-0006 | 38 |
| Domain / SPEC-0007 | 47 |
| Policy / SPEC-0008 | 43 |
| Evaluator / SPEC-0009 | 37 |
| Graph/storage / SPEC-0010 | 48 |
| Resource / SPEC-0011 | 34 |
| Progress / SPEC-0012 | 31 |
| Output / SPEC-0013 | 51 |
| direct non-Channel subtotal | **352** |
| Channel / SPEC-0004 owner evidence | **41** |
| CUDA-free reference total | **393** |

A separate **52** requirements remain `native-compatible-pair-qualification` and must stay deferred. The final verifier fails if those routes are promoted into reference evidence.

## Preserved construction red

Run `33707203690` on head `6b5cb57521ba3a656e7e75ab2902d1630691eb41` regenerated the complete upstream owner evidence chain successfully and then failed exactly at the real missing final contract:

`INTEGRATION_FIXTURE_MISSING`

Artifact: `9875632375`.

No owner semantic test was weakened or changed to obtain green.

## First green and review finding

Run `33707424655` on `ebff2a14ac8c67e3a4145fd835d4d791bcf65458` produced the first green `11/11` final packet with exact `352 + 41 = 393` route closure and `52` native-deferred requirements.

Fresh review then found a genuine integration-evidence defect: the planned mutation matrix was not complete. The verifier asserted the live state but did not explicitly demonstrate rejection of every required cross-owner corruption class. This was repaired only in the integration evidence boundary; no semantic owner was changed.

## Mutation-qualified checkpoint

Checkpoint:

`a58997d444e33bc1697c2cd92249ecd8f5017aa0`

Focused workflow:

`33707930265` — success

Artifact:

`9875893868`

digest:

`sha256:c3a8c7a4dc1bf363c0eacd335ed2282bb62dac7ec0ffa0e4ff9e17af45997404`

### Baseline packet

- capsule `cuda-mcgs-engine-reference-integration-v0.1.0`;
- cases `11/11`;
- failures/skips/not-discovered `0`;
- direct reference requirements `352`;
- Channel reference requirements `41`;
- total CUDA-free reference requirements `393`;
- native-deferred requirements `52`;
- Composer composition evidence `1bf7703fc7758c18f0f74e7573eb126410f8ad09b1e60145cbeaccdef20e10e2`, `729040` canonical bytes;
- final integration evidence `85373be650852a997cb4d57f5fbc6b972e0c5e5925cff496933bb1a47b078a46`, `14594` canonical bytes.

The baseline witnesses 21 exact evidence inputs, 11 product-neutral witnesses, 19 deletion/zero-residue witnesses, 7 schedule/concurrency witnesses, two finite independent semantic replicas, Channel owner-evidence reuse, native-deferred closure, no product vocabulary ownership, and content-sensitive final identity.

### Mutation gate

- capsule `cuda-mcgs-engine-reference-integration-gate-v0.1.0`;
- mutations `7/7` detected;
- failures/skips/not-discovered `0`;
- gate evidence `183f753e2595c3401e2642563edaa84ffbfd20083d6f44fc0bb259d60da58046`, `4542` canonical bytes.

The seven detected corruptions are:

1. missing owner evidence;
2. substituted/stale owner evidence identity;
3. missing required product-neutral/deletion/schedule witness;
4. native-deferred route falsely promoted;
5. Channel route loss;
6. finite replica semantic divergence;
7. final evidence-identity mutation.

All file mutations are CI-local. The gate restores them in `finally`, revalidates the frozen input evidence set, reruns the baseline verifier, and requires the exact baseline integration identity to be restored.

## Ownership result

The final verifier reads generated evidence packets and requirement classification only. It does not import or recreate Domain, Graph, Policy, Evaluator, Resource, Progress, Output, Session, Stage, Channel, or Framework semantics. Channel remains the existing Composer-owned logical oracle plus its thin evidence adapter. CUDA-JS remains native publication/synchronization/runtime and exact compatible-pair authority.

Finite device-slot replication is evidence packaging only. It establishes that the one-device semantic packet is not labeled by device identity and that downstream packet aggregation waits for terminal replicas; it does not define multi-GPU coordination or claim multi-device support.

## Current qualification gate

The current-state documentation transition changes the branch head but not owner semantics or the final evidence algorithms. The actual draft `REF-INTEGRATE-01` PR against `experimental/portfolio` must trigger the final integration workflow and full repository/documentation matrix on one exact candidate head.

After those workflows pass, perform a fresh whole-diff author review and freeze the exact PR head/tree, run IDs, artifact digest, baseline identity, and mutation-gate identity on #36/PR discussion. Then stop for fresh repository-owner exact-head authorization before candidate integration.

After authorized #36 integration/readback, the next transaction is #122 protected atomic semantic acceptance. Protected `main` must not be rewritten as though candidate integration were already accepted.