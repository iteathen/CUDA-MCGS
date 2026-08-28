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

## Exact integrated experimental Graph packet

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

## Current Graph cleanup candidate

PR #150 is the active draft candidate on:

`ref/graph-cleanup-acceptance-01`

Target remains **only** `experimental/portfolio`; neither `experimental/portfolio` nor protected `main` has been advanced by this candidate.

The branch now contains a bounded Graph-owned cleanup/reference slice for `GRAPH-CLEANUP-001..004`. The earlier handoff statement that the branch contains no Graph cleanup semantic/source change is historical and no longer describes current branch state.

Exact source head independently reviewed before qualification repair:

`c901e880de9183868c0d0e773d27c3e2f484acdd`

Review of that frozen source established:

- conflicting ready NODE publication now quarantines the affected observation, invalidates payload access/evidence and rejects later lookup instead of leaving a contradictory ready object;
- equality/publication contradictions fail closed through quarantine rather than guessing authority;
- Graph arena release remains owner-neutral and stops at `ready-for-resource-destruction`; concrete downstream/native destruction remains outside Graph;
- retained-artifact cleanup uses explicit owner and exact compatible package/profile identity rather than arbitrary nonempty identifiers;
- stale-generation aliasing and silent generation wrap remain prevented by the Graph REF contract; cleanup evidence is therefore intentionally only `partial`, not a native detector/ABA qualification claim;
- structured coverage for the four `GRAPH-CLEANUP-*` requirements moved truthfully from `pending` to `partial`.

The frozen `c901e880...` CI run exposed one non-semantic qualification defect before the cleanup capsule ran: the shared Composer still asserted the pre-cleanup disposition totals `{ deferred: 52, partial: 904, pending: 33 }`. The actual truthful candidate totals are `{ deferred: 52, partial: 908, pending: 29 }`. Qualification repair is limited to aligning that stale executable expectation; coverage is not being downgraded to satisfy the old count.

Historical handoff retained on the branch:

`docs/handoffs/2026-08-28-experimental-graph-cleanup-acceptance-resume.md`

Recovery/falsifier checkpoint retained separately:

`checkpoint/graph-cleanup-falsifier-handoff-20260828@28132a53471526ad355d8cfea96bb92d1ec076df`

The checkpoint remains recovery evidence, not current implementation authority.

## Claim limits

All current experimental Graph evidence remains CUDA-free semantic/reference evidence only.

No native ABA/publication/progress/occupancy/concurrency/cancellation/teardown mechanism is qualified. No retirement table/queue/traversal algorithm, atomic primitive, scheduler topology, warp/block topology or CUDA data structure is selected.

Session retains current-root, root-epoch, advance, reroot, attention and supersession-reason authority. Resource retains admission/watermark/pressure policy. Progress retains scheduling/fairness/device-progress policy. CUDA-JS owns generic native/CUDA realization mechanisms.

`GRAPH-RESOURCE-*` remains primarily `IR-RESOURCE-01` deterministic-composition work. Native-dominant `GRAPH-LIFE-*` qualification remains a later exact CUDA-MCGS/CUDA-JS compatible-pair gate. Neither belongs in this Graph cleanup reference slice.

## Immediate sequence

1. Finish the one-line Composer disposition-count repair without changing the cleanup coverage classification.
2. Re-read `ref/graph-cleanup-acceptance-01`, PR #150, `experimental/portfolio` and protected `main` before promotion of any staged repair.
3. Run the complete fail-closed exact-head workflow, including Composer, Graph profile export, NODE/EDGE/REF/PATH/ROOT/RECLAIM/ADVANCE and Graph CLEANUP.
4. Perform exact-head author review over the complete base-to-head diff and record limitations explicitly.
5. Obtain the independent review required for publication/reclamation/recovery semantics, or an explicit repository-owner exact-head exception satisfying the review policy. Do not infer that authorization from a generic instruction to continue.
6. Only after all gates are green and authorization exists, merge PR #150 into `experimental/portfolio` with an expected-head fence.
7. Read back experimental and protected refs, update #24/#36/#142, and then reassess Graph semantic closure versus transferred Resource/native obligations.

## Cleanup / coordination

Portfolio coordination remains issue #142. Graph meaning remains issue #24 and reference integration remains issue #36. Issue #122 remains the later atomic framework acceptance gate and should not start until #36 can hand off one exact reference revision.

Remote recovery ref `checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains bounded cleanup debt because no safe delete-ref action has been exposed; its handoff is already preserved.

Stale PRs #126/#132 remain separate product-boundary cleanup/disposition debt under issue #44 and are not current authority.
