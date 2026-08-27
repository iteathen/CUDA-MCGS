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
representation/composition: bbe8645637244392d0ffe9347417204dad3e675efccdc29043fd197e1d12cd56
Domain projection:          3ec9521040b12f69a3d5bcd308ec540c3d1c4d2d870f409c9027738c132423d8
semantic reference:         7afd8930a9af337be0ecbc5bff930ea21444ddb1afa6bf261c083db5cb95bd5b
```

`next_step.yaml` binds those identities and reports semantic-reference execution as 49 expected / 49 executed / 49 passed / 0 failed. The qualified Composer run remains 878/878, and the accepted Search IR 0.1.0 regression remains 18/18.

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
