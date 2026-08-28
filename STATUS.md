# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-27

## Protected authority

Protected `main` remains intentionally unchanged during the experimental portfolio:

`ee4434be0ae927c4ae1d5c106f91503d28b1aa01`

Protected-main workflow `33115975009` passed under the fail-closed aggregate `verify` gate. No experimental result below is a protected-main support, release, native or compatible-pair claim.

## Experimental integration line

Current integration authority is isolated on:

`experimental/portfolio@7d9c607c8844ce297086e78cc19b9b6e73519748`

Integrated experimental slices:

- PR #146 / issue #44: framework-only production ownership correction (`a1be8a596bb5ccc97736365dfbc49419ec0f76aa`);
- issue #47: closed **not planned** after product-local Connect Four requirements were decomposed into existing universal owners;
- PR #147 / issue #24: Graph RECLAIM finite representation/resource/lifecycle preflight (`7d9c607c8844ce297086e78cc19b9b6e73519748`).

The #147 integration closed the representation prerequisites for truthful reclamation semantics: explicit retirement-record count/bytes, reclaim scratch bytes and work units, reusable retirement-record lifecycle, independent underfunding/reuse falsifiers, and zero reclaim-only residue when reclamation is unselected.

Its exact experimental packet remains:

- Composer `881/881`, requirements `989/989`, representation/composition `2e2cde00d9e1eac864541cd7bd5d4d43873cfb20bfb2304aa0bc5c2647bce1af`;
- Domain `49/49`, direct `47/47`, evidence `10d188344e91c077fa47be192e5fec0f1310cc193ca180e3a9493fd8395ec51c`;
- Graph projection `72d91b75336a2745830a3c0d8d7d7d3ed26259ea2f56b619f9de311c82d21068`;
- NODE `103cd77904f0c1f5650fe52e7884b8a791615a17d340e13f4b5184d262a126df` (`13/13`);
- EDGE `96ce6c83125566ffec250e825b09ed66ab9050c6f091ee178d789aa5d0fdc127` (`16/16`);
- REF `633910c7531409737a92d041874ab608d9fbda0331ff7f5ea38eaf9c2e9a1d3d` (`14/14`);
- PATH `cecaad55c6ceeeacedb24b40ed7a4b185d5ec2b7c15c443e46cb9b5608310ae9` (`14/14`);
- root-control `be35ed803ea82498950c454acb6955087543c2a7a974745077c4c53158bca475`;
- ROOT `2fc9a4770b2f0244178876ab5742d8d9043f4278aff2040c488a018ebfa94280` (`14/14`).

## Current candidate — Graph RECLAIM semantic/reference owner

Issue #24 remains the Graph semantic owner and issue #36 remains the reference-integration tracker.

Draft PR #148 targets `experimental/portfolio` from `ref/graph-reclaim-01`, created from exact experimental base `7d9c607c8844ce297086e78cc19b9b6e73519748`.

The leaf covers **exactly `GRAPH-RECLAIM-001..009`**. It adds a product-neutral semantic oracle and an independent reference job. It deliberately does **not** choose a retirement queue/table, traversal algorithm, atomic primitive, scheduler topology, warp/block topology, CUDA data structure or native implementation.

The semantic model proves:

- reclamation is optional and the unselected specialization leaves zero reclaim-only semantic residue;
- enabled reclamation consumes explicit finite retirement records, retirement bytes, scratch bytes and work units;
- retirement blocks new access while already-held protection remains effective;
- quiescence covers every normalized declared blocker class independently;
- incremental quiescence is finite, resumable and device-progress compatible, with no host observation required to advance it;
- a partial proof restarts after the protection/access epoch changes, preventing stale quiescence proof reuse;
- transposition identity becomes non-returnable before slot reuse;
- owner-local cleanup completes before Graph releases storage;
- slot generation advances before reuse so old references cannot alias replacements;
- retirement records are reusable without finite-capacity leakage;
- cancellation and owner-cleanup failure leave a valid quarantined state rather than half-reused storage;
- retained borrows keep a shared transposed node non-reclaimable until released;
- semantic evidence explicitly reports native mechanism qualification as **not qualified**.

### First falsification pass

PR run `33146228789` kept every pre-existing owner lane green and isolated one failure to the new RECLAIM lane. Sixteen of seventeen RECLAIM cases passed. The failed case had accidentally frozen the source-file order of `protectionSources`; normalization correctly canonicalized that set into a different order. This was a test assumption, not a behavioral defect. The case was corrected to require exact membership while consuming normalized order for deterministic incremental proof.

### Qualified hosted candidate

Corrected candidate head:

`4b1b13672a9b2dd93f4d18ba650087020412f868`

Full ordinary PR workflow:

`33146437040`

Every merge-gate lane passed:

- Governance verification — success;
- Search IR Ubuntu — success;
- Search IR Windows — success;
- Graph NODE — success;
- Graph EDGE — success;
- Graph REF — success;
- Graph PATH — success;
- Graph ROOT — success;
- **Graph RECLAIM — success**;
- aggregate `verify` — success.

Graph RECLAIM capsule:

- expected `17`;
- discovered `17`;
- executed `17`;
- passed `17`;
- failed `0`;
- evidence identity `d046e13211f36c95c964d556ae89d5d0d456b7084d7b5d8c86e7448c34ccd119`;
- canonical bytes `12127`.

Retained CI artifact:

- artifact ID `9675947062`;
- artifact ZIP SHA-256 `7e2b94be87eba3d2629a4a705cf1e3a7fba301b842a5256aa95569446209e21e`.

## Merge-gate evolution

PR #148 adds `Graph RECLAIM reference` as an independent peer job rather than folding it into ROOT or Governance. In the same coherent change, aggregate `verify` now depends on RECLAIM alongside Governance, both Search IR cells, NODE, EDGE, REF, PATH and ROOT. A future RECLAIM failure therefore fails closed while remaining independently diagnosable.

## Claim limits

This leaf is CUDA-free semantic/reference evidence only.

It does **not** qualify a concrete native reclamation mechanism. Requirement `GRAPH-RECLAIM-009` remains a deliberate later gate requiring an exact CUDA-MCGS/CUDA-JS compatible pair and device evidence for the selected realization, including ABA resistance, publication ordering, progress, occupancy/concurrency, cancellation and teardown behavior.

Resource admission policy and Progress scheduling/fairness remain with their owners. Session retains current-root, root-epoch, advance, reroot and attention authority. Graph does not invalidate a shared transposed node merely because one occurrence becomes obsolete.

## Immediate sequence

1. Qualify this STATUS/`next_step.yaml` reconciliation as the final author-authored #148 head.
2. Require Governance, both Search IR platforms, NODE/EDGE/REF/PATH/ROOT/RECLAIM and aggregate `verify` all green on that exact author head.
3. If green, mark #148 ready and squash-merge **only** into `experimental/portfolio` using the exact expected-head fence.
4. Read back `experimental/portfolio` and protected `main`; confirm `main` remains `ee4434be0ae927c4ae1d5c106f91503d28b1aa01`.
5. Record exact RECLAIM integration evidence on issues #24 and #36.
6. Reassess the remaining Graph owner obligations, especially ADR-0022 occurrence-supersession/lifecycle closure, before selecting the next independent leaf.

## Cleanup / coordination

Portfolio coordination remains issue #142. Graph meaning remains issue #24 and reference integration remains issue #36.

Remote recovery ref `checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains bounded cleanup debt because no safe delete-ref action is exposed; its handoff is already preserved.

Stale pre-existing PRs #126/#132 remain separately owned product-boundary cleanup/disposition debt under issue #44 and are not integration authority.
