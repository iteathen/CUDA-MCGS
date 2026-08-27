# CUDA-MCGS handoff — Graph ROOT semantic brick

> **Active live resume point.** This is the canonical continuation packet for current `GRAPH-ROOT-*` work. Prefer any later exact ROOT qualification checkpoint recorded in this file or on the branch over older PATH/REF handoffs.

**Status:** Informational

**Date:** 2026-08-27

## Canonical checkpoint

Protected main is exactly:

`e4069458ece47bbea0c2770204fa21fffbde6bb6`

This is squash merge PR #137, `Add Graph PATH and occurrence semantic reference`.

Protected-main workflow run `33103891049` passed all seven permanent jobs: verify, Windows/Ubuntu Search IR, Graph NODE, Graph EDGE, Graph REF and Graph PATH.

The integrated proposal/reference packet is:

- Composer representation/composition: `c02b4c278edd6ab5cb432593e3aa5e0317eba14bb5eb7f7783f531513c49d34c`
- Domain projection: `b91ead2d6ec6eb13a6b8eb4ec61055023092269d81dbd36fb440777abf5e36a0`
- Domain evidence: `a2b282a6728861e7b537f45d8104e40d45619dbe501e110dca5cfde5548e9971` (`49/49`, direct `47/47`)
- Graph projection: `c736152a9944a6fcd44b395146be70460f3ad368add2f5a54e845ba9ca09ac49`
- NODE evidence: `dabc89fad787e293b6aa356cf3a841faac171e47bf1c8898be0fadd82668b44b` (`13/13`, direct `11/11`)
- EDGE evidence: `88be10851ae612d8b410564f6f1c1ba972eb2ee41c37a5459714ae1f26737b8d` (`16/16`, direct `10/10`)
- REF evidence: `8186a7039c79c604e28eca188f69acfcce0bbcc3ac0eeb5061e7de2b823255a0` (`14/14`, direct `8/8`)
- PATH evidence: `ce0017528309aefb8ef6ffefc94b75984969a8776dfe02ab0f5ee828821dbe58` (`14/14`, direct `8/8`)

Issue #24 contains the protected PATH checkpoint and remains open.

## Active branch

`ref/graph-root-01`

It was created directly from protected `main@e4069458ece47bbea0c2770204fa21fffbde6bb6` after confirming no competing Graph ROOT branch existed.

This file supersedes `2026-08-27-graph-path-01-resume.md` as the live resume point. The older PATH file remains historical provenance and is explicitly marked superseded.

## Selected next leaf

Bounded semantic owner brick:

`GRAPH-ROOT-001` through `GRAPH-ROOT-006`

ROOT is selected before RECLAIM because reclamation consumes the protected root set, old-root work protection and root/authority-change separation that ROOT must prove first.

RECLAIM, native/CUDA mechanism selection, Policy cycle response and general Session implementation are prohibited in this leaf.

## Root-control authority already integrated

Graph ROOT must consume, not redefine, the integrated Session/root-control packet.

The normalized Session reference already proves:

- `root` establishes initial authority through Domain validation and Graph ownership;
- `advance` requires an already-realized ready successor, existing resources only, bounded state-independent cost, no traversal/state copy/transform/reset/resize/reclassification/reclamation/eager cleanup, lazy sibling occurrence supersession and no invalidation of a still-valid shared transposed node;
- `reroot` keeps the old root authoritative until commit, prepares the replacement non-authoritatively, requires protected pre-mutation admission and makes reuse classification owner-declared/reroot-only;
- `attention` has no root-authority, graph-work or reclamation effect; and
- reclamation is separate from both advance and reroot commit while old-epoch/shared-node protections remain explicit.

Composer already contains falsifiers for these Session rules, including `session-reroot-deletion-removes-reserve`, reroot admission-before-mutation, root/reclamation separation and stale root-work scope.

ROOT evidence should consume a generated compact projection of those facts rather than duplicate them in Graph fixtures.

## Preflight finding

A real Graph-owned finite-resource gap is visible before the ROOT oracle:

- the normalized materialized Graph profile has a `root-anchor` object/layout with capacity `8`;
- `rootProtection.admissionReserve` is `2`;
- the profile separately funds `protection-record` slots;
- but no resource contribution currently funds the `root-anchor` layout itself.

SPEC-0010 requires root-anchor reserve/storage to be finite and composed before ignition. ROOT must not infer this capacity from the layout or hide it in the reference implementation.

The natural correction is a finite root-anchor slot contribution using the existing typed `protection-capacity` pressure family; do not invent a new root-specific failure code unless the normalized contract proves one is required.

Preflight also found that `root-anchor` and `protection-record` fixture lifecycles terminate at released/failed without an explicit private return to `free`, while REF semantics already require released protection slots to be generation-safely reusable. The ROOT falsifier should reconcile that transient-storage lifecycle explicitly rather than rely on an invisible reset.

## Planned bounded implementation

1. Correct normalized Graph profile evidence only where ROOT falsification requires it:
   - fund root-anchor slots explicitly;
   - require aggregate protection-capacity slot resources to cover both root-anchor and protection-record storage;
   - make reusable root-anchor/protection-record lifecycle reset-to-free explicit and reject missing reset semantics.
2. Export one generated Composer root-control projection from the already-normalized Session profile, keyed by exact Composer/Session identity.
3. Add a CUDA-free Graph ROOT oracle that owns only:
   - finite root-anchor storage/generation;
   - REF-mediated node protection and anchor validation;
   - anchor publication/release;
   - opaque owner-disposition delegation for reroot-owned stored regions.
4. Keep current-root/epoch/operation choice in a Session test harness outside the Graph ROOT oracle.
5. Cover replacement pressure/no-mutation, advance minimum-work/no-reclaim behavior, reroot protection-before-commit, attention zero graph effect, old-root work protection, shared-transposed-node survival and opaque owner disposition.
6. Add mutation falsifiers for publication-before-protection and eager prior-root release.
7. Rebind Composer/Domain/NODE/EDGE/REF/PATH evidence on the exact corrected profile, then run ROOT and repository verification under hosted Node 26.
8. Only after stable qualification add permanent ROOT CI, retained README/RESULTS/status/next-step reconciliation, exact-head PR review and guarded merge.

## ROOT non-goals

- no `GRAPH-RECLAIM-*` implementation or reclamation algorithm;
- no Session current-root/epoch authority inside Graph;
- no retained-state classification invented by Graph;
- no eager cleanup on advance;
- no invalidation of a shared node merely because an occurrence was superseded;
- no Policy cut/continue/backup behavior;
- no C/C++, CUDA C++, PTX, native addon/FFI, direct Driver call or CUDA-JS private import;
- no production storage table/arena mechanism or performance claim.

## Cleanup debt

Remote recovery branch `checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains after PATH integration. Its handoff blob is preserved on protected main and no open PR depends on it. The currently exposed GitHub connector has no delete-ref operation, so the branch is retained as bounded cleanup debt rather than force-moved or destroyed. Remove it only through a safe branch-delete operation after verifying no dependent/recovery use remains.

## Resume rule

Resume only from `ref/graph-root-01` and verify its ancestry begins at protected `main@e4069458ece47bbea0c2770204fa21fffbde6bb6`.

If a later commit in this branch has qualified ROOT evidence, prefer that exact newer checkpoint over this initial planning state. Do not fall back to the superseded PATH handoff merely because its filename also has today's date.
