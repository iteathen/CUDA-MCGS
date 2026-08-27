# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-08-27

## Current qualified candidate

The current `ref/graph-path-01` candidate extends `REF-GRAPH-01` through `GRAPH-PATH-001` to `GRAPH-PATH-008`. It is qualified on hosted Ubuntu/Node 26.7.0 but is not protected-main evidence until its PR is merged and the exact protected revision is read back.

The PATH qualification deliberately regenerated the proposal-derived evidence packet because it closed Graph-owned path resource/lifecycle omissions. Stable semantic case counts remain unchanged for previously completed owners.

## Composer and Domain chain

Composer:

- capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- expected/discovered/executed/passed: `879/879/879/879`;
- contract-set SHA-256: `2a3ded0b25f59d6f6a5dfffefefceae73f25e9df0558953b0bea29201d47c10d`;
- requirement-coverage SHA-256: `fe510fb69890b070ae6e7dfc60bd3e113a3f7e6354fa6bfcd8e48a6336c6c07a`;
- expanded-requirements SHA-256: `32fc66ca775046121146f3afc621e3407bab69711355e283b769d947fd185e0a`;
- framework-selection SHA-256: `e570172c64592db51ab7ee17c72e5f0e0b09c54d4a89467bd5b6d916aaff2fce` (`10422` canonical bytes);
- representation/composition SHA-256: `c02b4c278edd6ab5cb432593e3aa5e0317eba14bb5eb7f7783f531513c49d34c` (`719510` canonical bytes).

Shared harness + Domain:

- expected/discovered/executed/passed: `49/49/49/49`;
- failed/skipped: `0/0`;
- direct SPEC-0007 planned/executed coverage: `47/47`;
- Domain projection SHA-256: `b91ead2d6ec6eb13a6b8eb4ec61055023092269d81dbd36fb440777abf5e36a0` (`69524` canonical bytes);
- harness/Domain evidence SHA-256: `a2b282a6728861e7b537f45d8104e40d45619dbe501e110dca5cfde5548e9971` (`30372` canonical bytes).

The Composer-owned Graph projection contains four normalized profiles:

- SHA-256: `c736152a9944a6fcd44b395146be70460f3ad368add2f5a54e845ba9ca09ac49`;
- canonical bytes: `136759`.

Selected normalized profile identities are:

- Graph: `a6983d9e34f6dfd08bf891f344ccc9d2ba1147b59484275cec96a6b6baf1aafc`;
- Policy: `e1d8bd8ec12b7160da9033a395cdc000edb7e492f04d63e852f6c4f629b9b00c`;
- Resource: `6b765610ca855818c597d91d2e6d8dcaffd8b2de9078b2ce379132323dc43674`;
- Progress: `f4df6ef1e2c56eb7854f20dee89f88150977dcb96b422d71fde547c380d929ea`;
- Output: `5eaab2b8b2c22c37860b47cd7794416da6b4631ec1a2f57d57243e6c38939701`.

## REF-GRAPH-01 owner bricks

### NODE / transposition

- capsule: `cuda-mcgs-graph-node-reference-v0.2.0`;
- expected/discovered/executed/passed: `13/13/13/13`;
- direct `GRAPH-NODE-*` coverage: `11/11`;
- evidence SHA-256: `dabc89fad787e293b6aa356cf3a841faac171e47bf1c8898be0fadd82668b44b`;
- canonical bytes: `10123`.

### EDGE / expansion

- capsule: `cuda-mcgs-graph-edge-reference-v0.2.0`;
- expected/discovered/executed/passed: `16/16/16/16`;
- direct `GRAPH-EDGE-*` coverage: `10/10`;
- evidence SHA-256: `88be10851ae612d8b410564f6f1c1ba972eb2ee41c37a5459714ae1f26737b8d`;
- canonical bytes: `11661`.

### REF / reference protection

- capsule: `cuda-mcgs-graph-ref-reference-v0.2.0`;
- expected/discovered/executed/passed: `14/14/14/14`;
- direct `GRAPH-REF-*` coverage: `8/8`;
- evidence SHA-256: `8186a7039c79c604e28eca188f69acfcce0bbcc3ac0eeb5061e7de2b823255a0`;
- canonical bytes: `9139`.

### PATH / active occurrences

- capsule: `cuda-mcgs-graph-path-reference-v0.2.0`;
- expected/discovered/executed/passed: `14/14/14/14`;
- failed/skipped: `0/0`;
- direct `GRAPH-PATH-*` planned/executed coverage: `8/8`;
- exact upstream NODE evidence: `dabc89fad787e293b6aa356cf3a841faac171e47bf1c8898be0fadd82668b44b`;
- exact upstream REF evidence: `8186a7039c79c604e28eca188f69acfcce0bbcc3ac0eeb5061e7de2b823255a0`;
- exact Graph projection: `c736152a9944a6fcd44b395146be70460f3ad368add2f5a54e845ba9ca09ac49`;
- PATH evidence SHA-256: `ce0017528309aefb8ef6ffefc94b75984969a8776dfe02ab0f5ee828821dbe58`;
- canonical bytes: `9530`.

The 14 PATH cases prove, within this bounded owner brick:

- active paths and occurrences have finite admitted capacity and typed references;
- reusable transient slots return to `free` only through explicit private lifecycle transitions and REF generation advancement;
- incoming edge and resolved node references validate before path-visible mutation;
- occurrence protection is established before visibility, and partial acquisition rolls back exactly;
- one state node may appear multiple times without Graph deciding cycle/repetition policy;
- child identity/node resolution precedes Domain `classifyPathRelation`;
- Domain-history / Policy-local occurrence material remains opaque and owner-mediated;
- `path-capacity` and `path-depth` occur before partial publication or out-of-bounds mutation;
- close/abandon publishes a terminal path state, runs owner disposition and releases occurrence protections exactly once before slot reuse;
- self-loop, directed cycle, DAG transposition, stochastic parallel-transition and history-distinct equal-base-state fixtures preserve the same node/edge/path ownership; and
- named relation-before-resolution and visibility-before-protection mutations are detected.

## Graph profile corrections retained by PATH

### Explicit finite PATH resources

Materialized profiles now fund selected active-path slots, path-occurrence records and per-invocation path depth through declared finite resource contributions. The Graph normalizer rejects underfunded layouts/`path.maxPaths`/`path.maxDepth` rather than allowing hidden allocation or inference.

### Explicit transient reuse lifecycle

The normalized active-path lifecycle now has private terminal-to-`free` reset transitions for released/abandoned/failed paths. The path-occurrence lifecycle has private ready/failed-to-`free` reset transitions. `normalizePath` rejects a materialized profile that cannot return those transient slots to `free` after their owner lifecycle/protection obligations complete.

These transitions express storage lifecycle only. REF still owns generation advancement and stale-reference rejection, and RECLAIM remains a later owner for graph-object retirement/quiescence/reclamation.

## Qualification and evidence lifecycle

Hosted qualification run `33102506907` used Ubuntu 24.04 and Node 26.7.0. It regenerated Composer/Domain/Graph/NODE/EDGE/REF evidence, ran the full PATH capsule and `./scripts/verify-docs.sh`, then self-removed the temporary migration workflow/tool before publishing commit `b8965b20f1331b09cd7f733e0d5c1d35a716309c` on `ref/graph-path-01`.

Machine evidence under `experiments/search-semantics-reference/build/` is reproducible, ignored and disposable. Checked-in fixture bindings, source and retained identities are the durable evidence coordinates.

## Claim limits

The current candidate proves the semantic-neutral harness, bounded Domain behavior, Graph NODE/transposition, EDGE/expansion, REF/reference-protection and PATH/occurrence bricks described above. It does not prove Graph ROOT authority, retirement/quiescence/reclamation, ADR-0022 occurrence supersession, later owner oracles, a complete terminal reference engine, integrated proposal acceptance, production CUDA-MCGS code, CUDA-JS native execution, performance, search quality, a public SDK or multi-GPU support.
