# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-27

## Protected authority

Protected `main` remains intentionally unchanged during the experimental portfolio:

`ee4434be0ae927c4ae1d5c106f91503d28b1aa01`

It includes Graph ROOT integration, fail-closed merge-gate aggregation, and the post-merge state reconciliation. Protected-main workflow `33115975009` passed under the aggregate `verify` gate.

The protected CUDA-free ROOT packet remains the pre-experimental packet:

- Composer `879/879`, representation/composition `ca5119c2d50e6ba218ab962ede9ad94d8c90f1d031b008ab74d92166d0ef4529`;
- Domain `49/49`, direct `47/47`, evidence `f186412a9b8d964c7f92e4c4000942768fa0ae81d62349c2528fd3aba12aa5e7`;
- Graph projection `89ee04a47d8516ad02e33e884d8f35db9573840f58db140c6cbafe79178e7fd7`;
- NODE `4299dccecd33f6ef38c50f144e84316d00c7046a81ed6206b6e2e645b6683f74`;
- EDGE `54b83935d320e6bd656c740ec2f3d8be062e3932bdf6e748c8315f26245faf58`;
- REF `e3370158d1234dd3642d11c4458c9c390abcc3f62a04a75dd68d00faf6c4676d`;
- PATH `af8f140e45f7c2942ec4b09b7d752f49b3eeb28f1cdc5b8c3b74887d34dd4318`;
- root-control projection `2c71df25fff213f515aae02a01e210292a8e9b76fc84e14ab6cafb251fbbc9f1`;
- ROOT `7e4fe6bf748ec110bebc1798d7742e03b89909df84da709f2fdeb51a42311ed0`.

No experimental result below is a protected-main support or release claim.

## Experimental integration line

Per owner direction, current portfolio implementation is isolated on:

`experimental/portfolio`

The branch was created from protected `main@ee4434be0ae927c4ae1d5c106f91503d28b1aa01`.

PR #146 / issue #44 was retargeted and squash-merged only to the experimental branch as:

`a1be8a596bb5ccc97736365dfbc49419ec0f76aa`

That experimental integration adds ADR-0024 and reconciles active authority so CUDA-MCGS production owns only the reusable product-neutral framework, composition/integration substrate and removable conformance evidence. Production domain/search products remain independently owned downstream consumers. CHESS-0001 is archived provenance rather than active product authority, and active files under `docs/specs/products/` are structurally rejected.

Issue #47 was then reassessed against that boundary. Its useful requirements are already owned by Graph/reference/Policy/Evaluator/Output/Session work; its only unique premise was an in-repository Connect Four product. It was closed **not planned** rather than implemented.

## Current experimental candidate — Graph RECLAIM representation preflight

Issue #24 remains the active semantic owner. PR #147 targets `experimental/portfolio` from `ref/graph-reclaim-preflight-01`.

The candidate does **not** choose a reclamation table, queue, traversal algorithm, scheduler, native mechanism or CUDA topology. It closes representation prerequisites required before `GRAPH-RECLAIM-*` behavior can be truthful:

- reclamation-enabled profiles fund retirement-record count and byte pool explicitly;
- reclamation scratch bytes and work units are explicitly finite;
- the Graph normalizer proves those resources cover the declared retirement layout, `maxScratchBytes` and `maxWorkUnits`;
- retirement records have a terminal release plus private terminal-to-free reuse path;
- reclaim-only failures/resources exist iff reclamation is selected;
- the `reclamation: none` specialization proves zero reclaim/retirement resource, failure and lifecycle residue;
- independent falsifiers underfund record count, byte pool, scratch and work, and remove retirement reuse.

The Composer capsule expanded from 879 to 881 cases to cover these additional falsifiers.

### Exact candidate representation packet

One-shot preflight migration run `33143185480` passed and self-removed before publishing the durable branch state:

- requirements: `989/989` classified;
- Composer: `881/881`;
- contract set: `b4c91a46e4fe304f3bcfc4602e23e5f4e68a30869da223deab3978289ca6b4a1`;
- framework selection: `bcfcba073c44f6c019dc800241414e8a67b4006786b8898042b2ffdd38a3e56d`;
- representation/composition: `2e2cde00d9e1eac864541cd7bd5d4d43873cfb20bfb2304aa0bc5c2647bce1af`.

The neutral Domain projection/evidence was explicitly rebound to that representation by self-cleaning run `33145283563`, which passed before publishing durable commit `c5926d28e0b42cf0f27b2c474ef7b3d9f043df36`:

- Domain projection: `4335a21e1225b7705da5242053fd055986384a02d4d9c772fab1c4bbb286a0b1`;
- Domain harness: `49/49`, direct semantic cases `47/47`;
- Domain harness evidence: `10d188344e91c077fa47be192e5fec0f1310cc193ca180e3a9493fd8395ec51c`.

Graph projection was rebound to the 881-case Composer packet:

- Graph projection: `72d91b75336a2745830a3c0d8d7d7d3ed26259ea2f56b619f9de311c82d21068`.

A second self-cleaning migration (`33143600784`) regenerated the unchanged Graph behavioral chain in dependency order and passed:

- NODE `13/13`: `103cd77904f0c1f5650fe52e7884b8a791615a17d340e13f4b5184d262a126df`;
- EDGE `16/16`: `96ce6c83125566ffec250e825b09ed66ab9050c6f091ee178d789aa5d0fdc127`;
- REF `14/14`: `633910c7531409737a92d041874ab608d9fbda0331ff7f5ea38eaf9c2e9a1d3d`;
- PATH `14/14`: `cecaad55c6ceeeacedb24b40ed7a4b185d5ec2b7c15c443e46cb9b5608310ae9`;
- generated root-control projection: `be35ed803ea82498950c454acb6955087543c2a7a974745077c4c53158bca475`;
- ROOT `14/14`: `2fc9a4770b2f0244178876ab5742d8d9043f4278aff2040c488a018ebfa94280`.

These Domain and Graph results prove the representation correction can be consumed by the existing semantic/reference chain without weakening frozen identity checks. They do **not** implement or accept `GRAPH-RECLAIM-*` behavior.

## Current qualification boundary

All known frozen-input rebinds caused by the 881-case representation packet are complete. The temporary migrations were fail-closed and self-removed; none remains as production machinery.

PR #147 now requires one normal author-head, full ordinary PR workflow against `experimental/portfolio`. That run must independently prove Governance verification, both portable Search IR cells, Graph NODE/EDGE/REF/PATH/ROOT, and the final aggregate `verify` green on the same exact author revision. Bot-authored migration synchronization is not merge authority.

If the ordinary run exposes another stale identity, only the named frozen input may be rebound; behavioral assertions and drift checks must not be weakened.

## Architecture and merge rules

- CUDA-MCGS remains JavaScript only: ordinary Node.js plus restricted Device-JS through public CUDA-JS contracts.
- Generic CUDA/native mechanisms belong in CUDA-JS; generic dense tensor math belongs in CUDA-JS-Tensor; product semantics remain downstream.
- After ignition, no host read-decide-write/relaunch loop may advance active search.
- Every concrete profile has explicit finite resources and typed pressure/exhaustion behavior.
- Owner-local reference jobs remain independently diagnosable; aggregate `verify` is only the fail-closed status coordinator.
- Experimental branches do not weaken exact-head validation merely because they are not protected main.
- No native, performance, stable SDK, compatible-pair or release claim follows from CUDA-free experimental evidence.

## Immediate sequence

1. Run the ordinary full PR #147 workflow on this author truth checkpoint.
2. Require every ordinary PR lane and final aggregate `verify` green on the exact author head; repair only a precisely proven stale frozen input if one remains.
3. Review and squash-merge #147 only into `experimental/portfolio`; read back that exact experimental integration and confirm protected `main` is unchanged.
4. Record the exact preflight integration evidence on issue #24/#36.
5. From the exact experimental integration, create the independent `GRAPH-RECLAIM-001..009` semantic/reference leaf.
6. Add the new RECLAIM owner job to the fail-closed aggregate in the same coherent change; do not select a CUDA/native reclamation mechanism.
7. Continue issue #36 owner-by-owner toward #122 atomic semantic acceptance.

## Cleanup / coordination

Portfolio coordination remains issue #142; Graph meaning remains issue #24 and reference integration remains issue #36.

All task-created migration workflows used for #44 and the RECLAIM preflight are self-cleaning and are not retained as production machinery.

Remote recovery ref `checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains bounded cleanup debt because the available connector has not exposed a safe delete-ref operation; its handoff is already preserved.

Stale pre-existing authority PRs #126/#132 remain separately owned cleanup/disposition under #44. Neither is a shortcut around the current experimental or protected authority.
