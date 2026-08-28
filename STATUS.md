# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-27

## Protected authority

Protected `main` remains intentionally unchanged during the experimental portfolio:

`ee4434be0ae927c4ae1d5c106f91503d28b1aa01`

Protected-main workflow `33115975009` passed under the fail-closed aggregate `verify` gate. No experimental result below is a protected-main support, release, native or compatible-pair claim.

## Experimental integration line

Current integration authority is isolated on:

`experimental/portfolio@9de8b139ffcc6407a3571fceb55f7b94d8f825ab`

Integrated experimental slices:

- PR #146 / issue #44: framework-only production ownership correction (`a1be8a596bb5ccc97736365dfbc49419ec0f76aa`);
- issue #47: closed **not planned** after its product-local premise was decomposed into existing universal owners;
- PR #147 / issue #24: Graph RECLAIM finite representation/resource/lifecycle preflight (`7d9c607c8844ce297086e78cc19b9b6e73519748`);
- PR #148 / issues #24/#36: `GRAPH-RECLAIM-001..009` semantic/reference owner (`9de8b139ffcc6407a3571fceb55f7b94d8f825ab`).

The experimental packet entering the current closure remains Composer `881/881`, requirements `989/989`, Domain `49/49` direct `47/47`, Graph NODE `13/13`, EDGE `16/16`, PATH/ROOT owner references, and RECLAIM `17/17`.

## Current candidate — ADR-0022 advance occurrence lifetime closure

Issue #24 remains the Graph semantic owner and issue #36 remains the engine-reference integration tracker.

Draft PR #149 targets `experimental/portfolio` from `ref/graph-advance-occurrence-01`, created from exact experimental base `9de8b139ffcc6407a3571fceb55f7b94d8f825ab`.

The bounded closure question is whether the already-accepted Session advance provenance composes correctly with Graph PATH/ROOT/REF/RECLAIM lifetime semantics:

- `selectedDescendantWork: preserve-compatible`;
- `siblingOccurrenceWork: superseded-by-advance-lazy`;
- `sharedTransposedNode: occurrence-supersession-does-not-invalidate-node`;
- advance itself performs no traversal, semantic state copy/transform, reset, resize, reclassification, reclamation, eager cleanup or host-driven progress.

No new public schema or Session authority is required. Session continues to own current-root/root-epoch/advance/reroot/attention authority and the supersession classification. The new Graph work is integration evidence over existing owner contracts.

## Lifetime defect found during closure composition

The closure review exposed a real REF/Reclaim ordering gap rather than merely missing test coverage.

The prior REF semantic oracle installed its retirement barrier only after all existing held protections had drained. If retirement encountered one already-held protection it returned `blocked`, but until a later retirement attempt established the barrier, another protection could still acquire. That left a check-then-pin window inconsistent with the composition of:

- `GRAPH-REF-008`: protection and retirement share one ordering point so either protection wins before retirement or fails;
- `GRAPH-RECLAIM-003`: once an object is marked retiring, new protections are prevented while references already protected before retirement remain valid until release.

### Correction

The REF oracle now distinguishes private retirement ordering intent from the publicly passed retirement barrier:

1. the first retirement attempt establishes a **private retirement-order intent** even when existing protections are still held;
2. existing holders remain valid and drain normally;
3. new protection attempts fail while that intent is active;
4. the public retirement barrier remains unpassed/unobservable until the existing protection count reaches zero;
5. once holders drain, the intent is replaced by the normal passed barrier.

This changes no public Search IR and chooses no native atomic, lock, fence, table, queue or CUDA mechanism. It is a semantic ordering correction whose concrete realization remains a later CUDA-JS compatible-pair/device qualification concern.

The existing REF owner case `graph-ref-protection-before-retirement-blocks-until-one-exact-release` was strengthened to prove the dangerous ordering explicitly: after retirement loses to an already-held protection, a late protection attempt is rejected before the original holder releases.

## Composite advance-occurrence closure

A five-case integration capsule now composes one shared REF lifetime oracle underneath PATH and ROOT, plus the integrated RECLAIM oracle. Two path occurrences share the same successor node: one selected descendant and one sibling occurrence.

The cases prove:

1. the exact upstream evidence and Session advance-control provenance are consumed without Graph reclassification authority;
2. authority commit to an already-ready successor has zero eager occurrence cleanup or reclamation;
3. at a later bounded checkpoint only sibling occurrence work is released while the selected occurrence remains live and the shared transposed node remains valid;
4. retirement can begin while old protections remain, blocks any new protection immediately, and quiescence remains blocked by the selected active path;
5. after selected path and root protections drain, a retained borrow still gates quiescence; only after that independent borrow releases may the transposition become non-returnable, reclamation complete, the slot generation advance, and the old generation become stale.

The sibling supersession **reason** remains Session-owned. PATH receives only its normal Graph-local close/release disposition. This avoids giving Graph semantic authority over why an occurrence became obsolete.

## Evidence rebinding

Because the REF semantic source changed, frozen downstream identities correctly invalidated. A self-cleaning migration regenerated the owner chain in dependency order and committed nothing unless REF → PATH → ROOT → RECLAIM plus the new composite closure all passed. The temporary migration workflows removed themselves before publishing durable branch state.

Ordinary PR qualification was then run independently on author commit:

`c64d1fbe2be722741dcd2350999dabc1dc4e36a0`

Full ordinary PR workflow:

`33147798290`

Every merge-gate lane passed:

- Governance verification — success;
- Search IR Ubuntu — success;
- Search IR Windows — success;
- Graph NODE — success;
- Graph EDGE — success;
- Graph REF — success;
- Graph PATH — success;
- Graph ROOT — success;
- Graph RECLAIM — success;
- **Graph ADVANCE occurrence closure — success**;
- aggregate `verify` — success.

### Exact ordinary-run packet

- Composer: `881/881`;
- representation/composition: `2e2cde00d9e1eac864541cd7bd5d4d43873cfb20bfb2304aa0bc5c2647bce1af`;
- Domain: `49/49`, direct `47/47`, evidence `10d188344e91c077fa47be192e5fec0f1310cc193ca180e3a9493fd8395ec51c`;
- Graph projection: `72d91b75336a2745830a3c0d8d7d7d3ed26259ea2f56b619f9de311c82d21068`;
- NODE `13/13`: `103cd77904f0c1f5650fe52e7884b8a791615a17d340e13f4b5184d262a126df`;
- EDGE `16/16`: `96ce6c83125566ffec250e825b09ed66ab9050c6f091ee178d789aa5d0fdc127`;
- REF `14/14`: `def51477f25c40d11f5f61fbf928264753a95d3979397e573f389f91cd02808b`;
- PATH `14/14`: `74e05276492db9f928a83bbca0739ebec4b5d0d9bc7564b3a6510ca243134a4b`;
- root-control: `be35ed803ea82498950c454acb6955087543c2a7a974745077c4c53158bca475`;
- ROOT `14/14`: `5b1cfb36d9b743a65ee0233964c254a56296ae5be82b84fb358db98387a16bdd`;
- RECLAIM `17/17`: `a010c88de1bb97ec0ea83a08fe0e2ef608c047ed4412c01e8f68b942eb572058`;
- ADVANCE occurrence closure `5/5`: `c67014dac6396221b121dd35b0bb51626bac12d116e5e534c310b1a7809754a3`;
- closure canonical bytes: `4195`.

Retained ordinary-run closure artifact:

- artifact ID `9676453116`;
- ZIP SHA-256 `957445e8d6337d3e9294785c0d4e70036a51b8ba0c193504bbad3f5b1c8d1933`.

## Merge-gate evolution

PR #149 adds `Graph ADVANCE occurrence closure` as a peer integration job rather than folding it into ROOT, RECLAIM or Governance. In the same coherent change aggregate `verify` now depends on Governance, both Search IR cells, NODE, EDGE, REF, PATH, ROOT, RECLAIM and the ADVANCE occurrence closure. The closure therefore fails closed while remaining independently diagnosable.

## Claim limits

This remains CUDA-free semantic/reference evidence only.

The private retirement-order intent does **not** identify or qualify a native implementation mechanism. Native lifetime evidence remains deferred to an exact CUDA-MCGS/CUDA-JS compatible pair and real device qualification for the chosen realization, including ABA resistance, publication ordering, forward progress, occupancy/concurrency interaction, cancellation and teardown.

No production retirement table/queue/traversal algorithm, scheduler topology, atomic primitive, warp/block topology or CUDA data structure is selected by #149.

## Immediate sequence

1. Qualify this STATUS/`next_step.yaml` reconciliation as the final author-authored #149 head.
2. Require Governance, both Search IR platforms, NODE/EDGE/REF/PATH/ROOT/RECLAIM/ADVANCE occurrence and aggregate `verify` all green on that exact author head.
3. If green, mark #149 ready and squash-merge **only** into `experimental/portfolio` using the exact expected-head fence.
4. Read back `experimental/portfolio` and protected `main`; confirm `main` remains `ee4434be0ae927c4ae1d5c106f91503d28b1aa01`.
5. Record the exact lifetime/occurrence closure integration evidence on issues #24 and #36.
6. Reassess issue #24 acceptance against SPEC-0010 and ADR-0022. Separate any remaining framework semantic gap from deferred native-compatible-pair qualification rather than leaving Graph artificially open for downstream CUDA evidence.

## Cleanup / coordination

Portfolio coordination remains issue #142. Graph meaning remains issue #24 and reference integration remains issue #36.

Remote recovery ref `checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains bounded cleanup debt because no safe delete-ref action is exposed; its handoff is already preserved.

Stale pre-existing PRs #126/#132 remain separately owned product-boundary cleanup/disposition debt under issue #44 and are not integration authority.
