# CUDA-MCGS handoff — Graph ROOT semantic brick

> **Historical handoff.** ROOT is integrated on protected `main@5a42d5aed072ae763631790ea4a4dfa871e3e6ce` through PR #138. Protected-main workflow `33108165300` passed all eight current jobs. Do not resume `ref/graph-root-01` or repeat the ROOT integration gate.

**Status:** Superseded

**Date:** 2026-08-27

## Superseded continuation

This handoff previously directed work to finish the Graph ROOT PR/integration gate. That gate is complete.

Current continuation is governed by:

- portfolio ordering and issue disposition: [issue #142](https://github.com/iteathen/CUDA-MCGS/issues/142);
- Graph semantics/reference owner: [issue #24](https://github.com/iteathen/CUDA-MCGS/issues/24);
- universal deterministic reference parent: [issue #36](https://github.com/iteathen/CUDA-MCGS/issues/36);
- canonical current state: [`STATUS.md`](../../STATUS.md) and [`next_step.yaml`](../../next_step.yaml).

The next semantic candidate is Graph RECLAIM, but it is **not implementation-ready** until the representation preflight corrects and falsifies explicit retirement-record storage funding, reclamation scratch-byte funding and retirement-record generation-safe reuse.

## Protected ROOT integration

Protected merge:

`main@5a42d5aed072ae763631790ea4a4dfa871e3e6ce`

PR:

`#138 — Add Graph ROOT and protected-anchor semantic reference`

Protected-main workflow:

`33108165300` — success

The protected run passed:

- verify;
- Search IR Windows;
- Search IR Ubuntu;
- Graph NODE;
- Graph EDGE;
- Graph REF;
- Graph PATH;
- Graph ROOT.

## Exact ROOT evidence retained for provenance

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

## ROOT-owned corrections retained

ROOT falsification corrected three Graph-profile omissions:

1. root-anchor storage has explicit finite `resource-root-anchor-slots` funding;
2. aggregate `protection-capacity` resources cover both protection-record and root-anchor layouts;
3. root-anchor/protection-record terminal states reset privately to `free` before generation-safe reuse.

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

## Cleanup debt

`checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains a redundant recovery ref. Its handoff content is preserved on protected main, and no open PR depends on it. The available connector exposes no safe delete-ref action, so retain it as bounded cleanup debt until a safe branch deletion operation is available.
