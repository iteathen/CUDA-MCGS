# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-28

## Protected authority

Protected `main` remains intentionally unchanged during the experimental portfolio:

`ee4434be0ae927c4ae1d5c106f91503d28b1aa01`

Protected-main workflow `33115975009` passed under the fail-closed aggregate `verify` gate. No experimental result below is a protected-main support, release, native or compatible-pair claim.

## Experimental integration line

Current integration authority is isolated on:

`experimental/portfolio@422fe99bf51c1f48cda480a6a6d98f641fb2599d`

Integrated experimental slices:

- PR #146 / issue #44: framework-only production ownership correction;
- issue #47: closed **not planned** after its product-local premise was decomposed into existing universal owners;
- PR #147 / issue #24: Graph RECLAIM finite representation/resource/lifecycle preflight;
- PR #148 / issues #24/#36: `GRAPH-RECLAIM-001..009` semantic/reference owner;
- PR #149 / issues #24/#36: ADR-0022 advance-occurrence lifetime closure plus REF retirement-order correction.

PR #149 final author head `2175592e164b9eb9770225ef2808e405a52af4fa` passed full workflow `33148044466`, including Governance, both Search IR platforms, NODE/EDGE/REF/PATH/ROOT/RECLAIM/ADVANCE occurrence and aggregate `verify`, then squash-merged as `422fe99bf51c1f48cda480a6a6d98f641fb2599d`.

Post-merge readback proved the experimental ref at `422fe99b...` and protected `main` still at `ee4434be...`.

## Exact experimental Graph packet

- Composer `881/881`, requirements `989/989`, representation/composition `2e2cde00d9e1eac864541cd7bd5d4d43873cfb20bfb2304aa0bc5c2647bce1af`;
- Domain `49/49`, direct `47/47`, evidence `10d188344e91c077fa47be192e5fec0f1310cc193ca180e3a9493fd8395ec51c`;
- Graph projection `72d91b75336a2745830a3c0d8d7d7d3ed26259ea2f56b619f9de311c82d21068`;
- NODE `103cd77904f0c1f5650fe52e7884b8a791615a17d340e13f4b5184d262a126df` (`13/13`);
- EDGE `96ce6c83125566ffec250e825b09ed66ab9050c6f091ee178d789aa5d0fdc127` (`16/16`);
- REF `def51477f25c40d11f5f61fbf928264753a95d3979397e573f389f91cd02808b` (`14/14`);
- PATH `74e05276492db9f928a83bbca0739ebec4b5d0d9bc7564b3a6510ca243134a4b` (`14/14`);
- root-control `be35ed803ea82498950c454acb6955087543c2a7a974745077c4c53158bca475`;
- ROOT `5b1cfb36d9b743a65ee0233964c254a56296ae5be82b84fb358db98387a16bdd` (`14/14`);
- RECLAIM `a010c88de1bb97ec0ea83a08fe0e2ef608c047ed4412c01e8f68b942eb572058` (`17/17`);
- ADVANCE occurrence closure `c67014dac6396221b121dd35b0bb51626bac12d116e5e534c310b1a7809754a3` (`5/5`, canonical bytes `4195`).

Ordinary retained closure artifact: ID `9676453116`, ZIP SHA-256 `957445e8d6337d3e9294785c0d4e70036a51b8ba0c193504bbad3f5b1c8d1933`.

## Current handoff branch

Next-session branch:

`ref/graph-cleanup-acceptance-01`

It was created from exact `experimental/portfolio@422fe99bf51c1f48cda480a6a6d98f641fb2599d`.

At the handoff boundary, no Graph cleanup semantic/source change has been made on that branch. The branch contains only the state reconciliation and handoff checkpoint.

Canonical handoff:

`docs/handoffs/2026-08-28-experimental-graph-cleanup-acceptance-resume.md`

## Next semantic seam — Graph cleanup/reference acceptance

Issue #24 remains open. NODE/EDGE/REF/PATH/ROOT/RECLAIM and the ADR-0022 occurrence closure are integrated, but structured requirement coverage still records `GRAPH-CLEANUP-*` as `evidenceStatus: pending`.

Do not invent a reclamation mechanism or move Resource/Lifecycle ownership into Graph:

- `GRAPH-RESOURCE-*` remains primarily `IR-RESOURCE-01` deterministic-composition work;
- `GRAPH-LIFE-*` remains primarily native-compatible-pair qualification with semantic/reference support;
- `GRAPH-CLEANUP-*` is the current Graph-owned reference-evidence seam.

The first falsifier is `GRAPH-CLEANUP-002`. Current case `graph-node-conflicting-ready-publication-is-fatal` detects conflicting re-publication but also asserts the previously ready payload remains observable. The next session must inspect the exact NODE oracle conflict path and determine whether fatal conflict also quarantines affected semantic state and invalidates dependent evidence as required. This is a candidate gap, not yet a confirmed defect.

If confirmed, make the smallest Graph-owned semantic correction, rebind only genuinely invalidated evidence, and add direct `GRAPH-CLEANUP-001..004` reference evidence without creating a monolithic second Graph model.

## Claim limits

All current experimental Graph evidence remains CUDA-free semantic/reference evidence only.

No native ABA/publication/progress/occupancy/concurrency/cancellation/teardown mechanism is qualified. No retirement table/queue/traversal algorithm, atomic primitive, scheduler topology, warp/block topology or CUDA data structure is selected.

Session retains current-root, root-epoch, advance, reroot, attention and supersession-reason authority. Resource retains admission/watermark/pressure policy. Progress retains scheduling/fairness/device-progress policy. CUDA-JS owns generic native/CUDA realization mechanisms.

## Immediate sequence

1. Resume from the handoff commit on `ref/graph-cleanup-acceptance-01`.
2. Verify `experimental/portfolio` is still `422fe99bf51c1f48cda480a6a6d98f641fb2599d` and protected `main` is still `ee4434be0ae927c4ae1d5c106f91503d28b1aa01`.
3. Inspect `graph-node.mjs` conflicting-publication handling against `GRAPH-CLEANUP-002` before changing semantics.
4. If the candidate gap is real, fix only the owner-local cleanup meaning and add exact cleanup evidence/coverage.
5. Qualify through the complete fail-closed workflow and merge only into `experimental/portfolio` with an expected-head fence.
6. Read back experimental and protected refs, update #24/#36/#142, then reassess Graph semantic closure versus transferred Resource/native obligations.

## Cleanup / coordination

Portfolio coordination remains issue #142. Graph meaning remains issue #24 and reference integration remains issue #36. Issue #122 remains the later atomic framework acceptance gate and should not start until #36 can hand off one exact reference revision.

Remote recovery ref `checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains bounded cleanup debt because no safe delete-ref action has been exposed; its handoff is already preserved.

Stale PRs #126/#132 remain separate product-boundary cleanup/disposition debt under issue #44 and are not current authority.
