# CUDA-MCGS handoff — Graph ROOT semantic brick

> **Active live resume point.** ROOT semantics are hosted-qualified. Resume at the exact current `ref/graph-root-01` head, finish the PR/integration gate, and do not begin RECLAIM before protected-main ROOT readback.

**Status:** Informational

**Date:** 2026-08-27

## Protected base

ROOT was built from protected:

`main@e4069458ece47bbea0c2770204fa21fffbde6bb6`

That SHA is PR #137 / integrated Graph PATH. Protected-main run `33103891049` passed verify, Windows/Ubuntu Search IR, NODE, EDGE, REF and PATH.

## Qualified ROOT candidate

Active branch:

`ref/graph-root-01`

Durable semantic qualification checkpoint:

`d6b091e7c1afc6c09eb7e562cd7f72eb2773874d`

Hosted qualification run:

`33107176873`

The run passed the complete Composer → Domain → NODE → EDGE → REF → PATH → ROOT chain plus `./scripts/verify-docs.sh`, then self-removed all temporary migration/correction workflow/tool files before publishing the durable semantic checkpoint.

Permanent ROOT CI was added after that checkpoint; therefore the final documentation-bearing branch head is newer and must be frozen/read directly before PR review.

## Exact candidate evidence

- Composer `879/879`; representation/composition `ca5119c2d50e6ba218ab962ede9ad94d8c90f1d031b008ab74d92166d0ef4529`
- Domain projection `e9df2902e6edaad40c6abf0b85eeecb06e94b4d5598d9c0b9c7238fa20c3edaa`
- Domain evidence `f186412a9b8d964c7f92e4c4000942768fa0ae81d62349c2528fd3aba12aa5e7`, `49/49`, direct `47/47`
- Graph projection `89ee04a47d8516ad02e33e884d8f35db9573840f58db140c6cbafe79178e7fd7`
- NODE `4299dccecd33f6ef38c50f144e84316d00c7046a81ed6206b6e2e645b6683f74`, `13/13`, direct `11/11`
- EDGE `54b83935d320e6bd656c740ec2f3d8be062e3932bdf6e748c8315f26245faf58`, `16/16`, direct `10/10`
- REF `e3370158d1234dd3642d11c4458c9c390abcc3f62a04a75dd68d00faf6c4676d`, `14/14`, direct `8/8`
- PATH `af8f140e45f7c2942ec4b09b7d752f49b3eeb28f1cdc5b8c3b74887d34dd4318`, `14/14`, direct `8/8`
- generated root-control projection `2c71df25fff213f515aae02a01e210292a8e9b76fc84e14ab6cafb251fbbc9f1`
- ROOT `7e4fe6bf748ec110bebc1798d7742e03b89909df84da709f2fdeb51a42311ed0`, `14/14`, direct `6/6`, `10008` canonical bytes

Selected normalized identities:

- Graph `450fd5f79d4c0f2ee98f5854008c4c58f57a6c6424e144aa4ae2ad34fdcbcd61`
- Policy `1f4097bde39f3f072ace983ba99fc3167625b2ff5db841f6a7792cf9aec37aaf`
- Resource `8a722bcd7ae6b0ec86f4d589ea0ee3df8291c64a6d95b10e3dde2a3defe66481`
- Progress `7f3fcb4229bb7694b60469d3edba6302e5584bf87ef1284856a73f1b677ce8e8`
- Output `3bdc5d9c8fc63fb1bd34a6d93d7fc034518d4e7abb2b41f49406aaf8641b98a5`

## ROOT-owned corrections

ROOT falsification found and corrected three Graph-profile omissions:

1. root-anchor storage now has explicit finite `resource-root-anchor-slots` funding;
2. aggregate `protection-capacity` resources cover both protection-record and root-anchor layouts;
3. root-anchor/protection-record terminal states explicitly reset privately to `free` before generation-safe reuse.

A ready protection record still requires its normal release transition. ROOT does not bypass REF protection/generation authority.

## Boundary preserved

ROOT owns only finite protected anchor storage, REF-mediated anchor protection/generation and opaque owner reroot-disposition delegation.

Session/owner contracts still own:

- current root;
- root epoch;
- root/advance/reroot/attention operation authority;
- retained-state classification;
- authority commit.

ROOT proves advance does not imply reclamation/eager cleanup and proves old-work/shared-transposed-node protection survives authority changes. It does not implement reclamation.

## Remaining integration gate

1. keep `experiments/search-semantics-reference/README.md` and `RESULTS.md` bound to the exact ROOT candidate;
2. reconcile `STATUS.md` / `next_step.yaml` so protected PATH and hosted-qualified ROOT are distinguished;
3. freeze the final branch head and compare it against current protected `main`;
4. open draft ROOT PR;
5. require ordinary PR CI: verify, Windows/Ubuntu Search IR, NODE, EDGE, REF, PATH, ROOT;
6. complete exact-head non-independent author review and exact-head owner authorization;
7. squash-merge only with expected-head guard;
8. require protected-main seven Graph/reference lanes plus ROOT to reproduce on the squash SHA;
9. add issue #24 protected ROOT checkpoint;
10. only then select/start `GRAPH-RECLAIM-*` from that protected squash revision.

## Non-goals / stop conditions

No `GRAPH-RECLAIM-*`, reclamation algorithm, native/CUDA implementation, physical scheduler, Policy cycle response, production graph mechanism, performance claim or contract acceptance belongs before ROOT integration closes.

## Cleanup debt

`checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains a redundant recovery ref. Its handoff content is preserved on protected main, and no open PR depends on it. The available connector exposes no safe delete-ref action, so retain it as bounded cleanup debt until a safe branch deletion operation is available.
