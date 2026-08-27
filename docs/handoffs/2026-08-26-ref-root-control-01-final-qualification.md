# REF-ROOT-CONTROL-01 final qualification — 2026-08-26

**Status:** Informational

## Durable reviewed state

Target PR: #127 — `Reconcile Session root control and live ownership names`

Protected base:

```text
main@173765cf86fc6ab91364d8d52eb6a045dcbe2346
```

Durable reviewed reconciliation input before this exact-head qualification trigger:

```text
b759ee6cd05b93e195282eb8cb64b522904859a5
```

The final executable review found and repaired one additional ownership leak after the earlier exact-head green run: the reference Session/resource chain had required a reroot-admission reserve even when reroot was structurally absent. The durable fix separates generic Session-control capacity from reroot-only protected admission capacity.

The resulting contract behavior is:

- a selected Search Session retains one generic finite Session-control resource contribution;
- generic `external-control` progress work is not coupled to a reroot reserve;
- selected reroot requires its protected `reroot-admission` class/reserve/admission group;
- absent reroot leaves no reroot reserve, reroot resource class, reroot command input, reroot prepare/commit/abort port, reroot transaction cleanup, or compound-lease cleanup residue;
- advance remains independently selectable and continues to perform no retained-state reclassification, allocation, traversal, reclamation, or eager cleanup;
- the Resource layer accepts structural absence of reroot protected capacity while still validating owner/protection when that reserve is selected.

A new standalone falsifier, `session-reroot-deletion-removes-reserve`, proves that exact deletion boundary.

## Qualified reference evidence

The hosted reconciliation completed with:

```text
Composer reference:          879/879
semantic reference:          49/49
accepted Search IR 0.1:      18/18 via repository verification
```

Durable current evidence recorded in `next_step.yaml`:

```text
contract set:               2a3ded0b25f59d6f6a5dfffefefceae73f25e9df0558953b0bea29201d47c10d
requirement coverage:       fe510fb69890b070ae6e7dfc60bd3e113a3f7e6354fa6bfcd8e48a6336c6c07a
representation/composition: 4846fe8686721afd13dfe4ac66ebbfdb0722979481183e76b96bf9118f340b3f
deletion matrix:            722d681af6aa6ee9e8f935bce0754dd8c442aa64801269bd219a7af0ac37dcd6
Domain projection:          6c073d11c688bc64b7bf4233c93de56ce29a95706f8a1ac665c8a04d939f13ee
semantic reference:         cf6aafa528af6f4ad6854d16d7c6c046f6ff33a7e9f18d153cb0386a9b4044b8
```

The contract-set and requirement-coverage identities remain unchanged because the repair tightens executable reference ownership/deletion behavior without changing the owning specification set or requirement classification.

## Cleanup readback

At `b759ee6c...`, `.github/workflows/` contains only ordinary `docs.yml`, restored with `contents: read`. No temporary reconciliation workflow or write-enabled carrier survives in the durable tree.

No accepted Search IR 0.1 file, historical ADR, production/native implementation file, C/C++, CUDA C++, PTX, direct Driver API, addon/FFI path, or product-local chess implementation was introduced.

## Remaining gate

This informational commit exists only to create a normal authored exact-head PR synchronization event after the bot-authored durable reconciliation push.

Require all ordinary jobs to pass on the resulting exact PR head:

- documentation/governance verification;
- Search IR reference on Ubuntu;
- Search IR reference on Windows.

Then perform final diff/readback against the frozen base. Only after that review is clean may PR #127 leave draft and integrate. `REF-GRAPH-01` remains blocked until the protected-main merge revision is read back with these four-operation Session semantics and exact evidence identities.
