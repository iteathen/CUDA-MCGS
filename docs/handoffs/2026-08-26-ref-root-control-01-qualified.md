# REF-ROOT-CONTROL-01 qualified reconciliation — 2026-08-26

**Status:** Informational

## Outcome

PR #127 has completed the previously checkpointed adjacent root-control reconciliation on its durable branch. The one-shot reconciliation runner reproduced the proven semantic migration, completed the fail-closed reference/verification chain, committed the resulting source/evidence updates, pushed them to `docs/ref-root-control-01-reconcile`, and removed every temporary reconciliation workflow from the durable tree.

Durable reconciliation commit:

```text
bfde3ae5a31d441f21b813b0ee02d465ec65c0ba
```

Protected base remains:

```text
main@173765cf86fc6ab91364d8d52eb6a045dcbe2346
```

## Durable evidence

The durable tree records the expected v6 identities:

```text
contract set:               2a3ded0b25f59d6f6a5dfffefefceae73f25e9df0558953b0bea29201d47c10d
requirement coverage:       fe510fb69890b070ae6e7dfc60bd3e113a3f7e6354fa6bfcd8e48a6336c6c07a
representation/composition: 4846fe8686721afd13dfe4ac66ebbfdb0722979481183e76b96bf9118f340b3f
Domain projection:          6c073d11c688bc64b7bf4233c93de56ce29a95706f8a1ac665c8a04d939f13ee
semantic reference:         cf6aafa528af6f4ad6854d16d7c6c046f6ff33a7e9f18d153cb0386a9b4044b8
```

`next_step.yaml` binds those identities and reports semantic-reference execution as 49 expected / 49 executed / 49 passed / 0 failed. The qualified Composer run remains 879/879, and the accepted Search IR 0.1.0 regression remains 18/18.

The semantic reconciliation preserves ADR-0022:

- `root` establishes the initial authoritative origin;
- `advance` is minimum-work continuation to an already-realized, ready successor and performs no retained-state reclassification, allocation, traversal, reclamation or eager cleanup;
- `reroot` owns general authority replacement, admission and retained-state reuse/reset/transform/invalidate reconciliation;
- `attention` remains independent of structural root authority.

Adjacent Policy, Evaluator, Graph, Resource and Output proposal wording now follows those ownership boundaries. Protected authority-change capacity is a reroot-admission reserve; it is not an advance reserve.

## Cleanup readback

At the durable reconciliation commit, `.github/workflows/` contains only the ordinary `docs.yml` workflow. No `reconcile-adjacent-root-authority*.yml` temporary workflow remains.

## Remaining gate

The bot-authored durable push produced an `action_required` workflow record with no executed jobs, so it is not sufficient exact-head PR qualification by itself. This informational commit intentionally creates a normal authored PR synchronization event.

Before PR #127 leaves draft or merges, require ordinary exact-head validation on the resulting head:

- documentation/governance verification;
- Search IR reference on Ubuntu;
- Search IR reference on Windows;
- final PR review against `main@173765cf86fc6ab91364d8d52eb6a045dcbe2346`.

Only after a green exact-head review may PR #127 integrate. After protected-main readback confirms the merge revision, evidence identities and four-operation Session semantics, `REF-GRAPH-01` becomes dependency-ready.

Do not begin Graph before that protected-main readback.

## Final review follow-up

Targeted executable review after the first exact-head green run found one ownership leak: the reference Session/resource chain required the reroot-admission reserve even when reroot was structurally absent. The follow-up splits generic Session-control capacity from reroot-only protected admission capacity, removes reroot reserve/class/ports/input/cleanup residue when reroot is unselected, keeps advance independently selected, and adds a focused deletion falsifier. The Composer case inventory is now 879/879; semantic-reference coverage remains 49/49.
