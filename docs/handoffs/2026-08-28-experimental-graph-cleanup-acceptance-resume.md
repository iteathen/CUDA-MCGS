# CUDA-MCGS experimental Graph cleanup/acceptance handoff — 2026-08-28

**Status:** Informational

## Resume authority

The intended resume base remains:

- work branch: `ref/graph-cleanup-acceptance-01`;
- experimental integration base: `experimental/portfolio@422fe99bf51c1f48cda480a6a6d98f641fb2599d`;
- protected production line: `main@ee4434be0ae927c4ae1d5c106f91503d28b1aa01`.

Protected `main` must remain unchanged while this experimental portfolio is being qualified. Experimental/reference evidence is not production, native, release, or compatible-pair authority.

## Resume-state reconciliation

The prior stop-point text said that no Graph cleanup semantic work had started on `ref/graph-cleanup-acceptance-01`. Git history at the supplied checkpoint `cdc51b12f822b6b61801ba0109c40486f764f5ce` contradicted that statement: the branch was nine commits ahead of `experimental/portfolio@422fe99bf51c1f48cda480a6a6d98f641fb2599d`, and its first six commits already contained Graph cleanup implementation/reference residue.

That residue is preserved as history but is **not** treated as accepted evidence merely because it existed before this resume. The current work qualifies and corrects it forward against the clean experimental base; no force-reset or history rewrite is used.

## Confirmed GRAPH-CLEANUP-002 falsifier

The clean `experimental/portfolio` baseline confirmed the handoff's candidate semantic gap.

A conflicting ready NODE publication raised `GRAPH_NODE_PUBLICATION_CONFLICT`, but the existing ready payload remained observable and the arena remained available for further semantic use. That violates `GRAPH-CLEANUP-002`, which requires semantic inconsistency to quarantine the affected object/arena and invalidate dependent evidence rather than guessing which payload/reference is authoritative.

The bounded owner-local correction therefore keeps inconsistency detection and quarantine inside the NODE reference owner:

1. conflicting ready publication quarantines the NODE arena before the fatal error is surfaced;
2. contradictory equality decisions quarantine the arena;
3. quarantined claims report `evidenceValid: false`;
4. ready-payload access and later NODE semantic use fail closed after quarantine;
5. no native atomic, fence, lock, table, queue, scheduler, CUDA topology, allocator, or CUDA-JS-private mechanism is selected.

The NODE owner regression was updated to require the fail-closed result rather than preserving stale ready evidence.

## Cleanup LEGO boundary correction

The inherited cleanup residue also contained two ownership defects that are being corrected in the same bounded slice:

- arena-release reconciliation leaked downstream `native` terminology into the Graph reference owner; the Graph brick now proves only that Graph cleanup is complete before downstream resource destruction begins;
- retained-artifact validation previously accepted arbitrary non-empty profile/package strings; the reference brick now requires exact compatibility with the active profile/package identities supplied by its caller.

The cleanup capsule remains a composition of existing NODE/EDGE/REF/PATH/ROOT/RECLAIM/ADVANCE evidence. It must not become a second monolithic Graph implementation.

`GRAPH-CLEANUP-002` remains honestly bounded: publication/equality inconsistency is directly modeled, while generation alias is prevented by the qualified REF generation contract and uncertain owner cleanup is quarantined by RECLAIM evidence. This reference slice does not claim a native corruption detector or native teardown mechanism.

## First qualification iteration — PR #150

Draft PR #150 targets `experimental/portfolio` only.

First author head tested: `0a9d55b3ff1abbef3b6eab9c1005140ea02615a6`.

Workflow run: `33154685390` under Node.js 26.7.0.

Results:

- Search IR Ubuntu: pass;
- Search IR Windows: pass;
- Graph NODE: `13/13` pass;
- regenerated NODE evidence: `158125969d1d82c7608053dff5b461736390237bac02ef51e0855202600e8ac8`, canonical bytes `10047`;
- EDGE/REF/PATH/ROOT/RECLAIM/ADVANCE: stopped fail-closed on their frozen pre-correction NODE identity, as expected;
- Governance: independently found this handoff's missing required status marker; this revision corrects it;
- aggregate `verify`: failed because the intentionally frozen downstream packet had not yet been rebound.

The PR was temporarily closed while frozen evidence is rebound so that each contents-API commit does not launch a redundant full PR workflow. It will be reopened on one coherent head for the next qualification iteration.

## Rebinding rule

Only identities whose declared upstream evidence actually changes may be rebound. The owner capsules remain authoritative for their own canonical lengths and SHA-256 values. Do not copy metadata from the unqualified cleanup residue when it conflicts with owner evidence.

The first rebind layer changes the frozen NODE identity in the declared downstream owner fixtures to:

- algorithm: `sha256`;
- canonical bytes: `10047`;
- SHA-256: `158125969d1d82c7608053dff5b461736390237bac02ef51e0855202600e8ac8`.

EDGE and REF must then execute their own owner capsules to determine their regenerated evidence identities before PATH/ROOT/RECLAIM/ADVANCE/cleanup identities are accepted.

## Original integrated packet before this slice

The qualified `experimental/portfolio@422fe99bf51c1f48cda480a6a6d98f641fb2599d` packet contains PRs #146–#149 and had all ordinary merge-gate lanes green. Its relevant pre-correction evidence included:

- composer: `2e2cde00d9e1eac864541cd7bd5d4d43873cfb20bfb2304aa0bc5c2647bce1af`;
- Graph projection: `72d91b75336a2745830a3c0d8d7d7d3ed26259ea2f56b619f9de311c82d21068`;
- NODE: `103cd77904f0c1f5650fe52e7884b8a791615a17d340e13f4b5184d262a126df`;
- EDGE: `96ce6c83125566ffec250e825b09ed66ab9050c6f091ee178d789aa5d0fdc127`;
- REF: `def51477f25c40d11f5f61fbf928264753a95d3979397e573f389f91cd02808b`;
- PATH: `74e05276492db9f928a83bbca0739ebec4b5d0d9bc7564b3a6510ca243134a4b`;
- ROOT: `5b1cfb36d9b743a65ee0233964c254a56296ae5be82b84fb358db98387a16bdd`;
- RECLAIM: `a010c88de1bb97ec0ea83a08fe0e2ef608c047ed4412c01e8f68b942eb572058`;
- ADVANCE occurrence closure: `c67014dac6396221b121dd35b0bb51626bac12d116e5e534c310b1a7809754a3`.

## Ownership and non-goals

Preserve these boundaries:

- CUDA-MCGS Graph owns reusable product-neutral graph/storage/reference/lifetime/cleanup semantics;
- Session owns current-root, root epoch, advance/reroot, attention, and supersession classification;
- Resource owns composed admission/watermark/pressure policy and downstream resource destruction ordering;
- Progress owns scheduling/fairness/device-progress policy;
- CUDA-JS owns generic CUDA/native primitives and concrete realization mechanisms;
- CUDA-JS-Tensor owns generic tensor math rather than Graph lifetime semantics;
- UCI Arena Vector, Book Forge, Timing Evidence, and tablebase/product behavior remain downstream.

No native CUDA-MCGS code, C/C++, CUDA C++, addon/FFI glue, embedded CUDA, hand-written PTX, private CUDA-JS access, or Python belongs in this slice. If a naturally generic GPU primitive is required but public CUDA-JS cannot express it with bounded lifecycle/resources, stop and classify a CUDA-JS capability gap instead of implementing local native glue.

## Completion gate

Before PR #150 can leave draft or merge:

1. all frozen downstream evidence must be rebound only from qualified owner outputs;
2. direct `GRAPH-CLEANUP-001..004` reference evidence must pass with truthful claim limits;
3. structured coverage must move from `pending` only to the strongest truthful state supported by exact case references;
4. a peer fail-closed Graph CLEANUP CI lane must be included;
5. Governance, Search IR Ubuntu/Windows, NODE, EDGE, REF, PATH, ROOT, RECLAIM, ADVANCE occurrence, CLEANUP, and aggregate `verify` must all pass on the exact final author head;
6. that exact head must be author-reviewed and merged with an expected-head fence only into `experimental/portfolio`;
7. `experimental/portfolio` and protected `main` must be read back after merge;
8. issues #24, #36, and #142 plus `STATUS.md` and `next_step.yaml` must be reconciled to the actual post-merge state;
9. temporary local artifacts and obsolete branch/worktree residue created by this session must be explicitly disposed or recorded as bounded debt.
