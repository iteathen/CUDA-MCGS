# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-28

## Protected authority

Protected `main` remains intentionally unchanged during the isolated experimental portfolio:

`ee4434be0ae927c4ae1d5c106f91503d28b1aa01`

Protected-main workflow `33115975009` passed under the fail-closed aggregate `verify` gate. Nothing integrated below is a protected-main support, release, native, compatible-pair, performance or production claim.

## Experimental integration line

Current experimental integration authority is:

`experimental/portfolio@61b86e08c781046594cf812cc4691d9f07c45ff6`

PR #151 squash-merged the exact owner-authorized Graph cleanup source head

`234d4b7f3403979d08bc9bef3e1d0da090a8bbe9`

into the experimental portfolio only. The prior experimental parent was `422fe99bf51c1f48cda480a6a6d98f641fb2599d`.

PR #150 contained the same exact source head but remained draft because the connector's `markPullRequestReadyForReview` mutation failed on a GitHub GraphQL response-schema incompatibility. It was closed as **superseded**, not rejected. Administrative replacement PR #151 pointed to the same commit and introduced no semantic/evidence difference.

Exact qualification history for the integrated head:

- qualified implementation/evidence head `142ee0c0d161965876f08b741e24922caa432904`: workflow `33219963955` — success;
- exact owner-authorized source head `234d4b7f3403979d08bc9bef3e1d0da090a8bbe9`: workflow `33221459966` — success;
- non-draft replacement PR #151 on that same head: workflow `33227042328` — success, including aggregate `verify`;
- guarded squash integration: `61b86e08c781046594cf812cc4691d9f07c45ff6`.

Post-merge readback proved `experimental/portfolio` at `61b86e08...` and protected `main` still exactly at `ee4434be...`.

## Integrated Graph cleanup/reference packet

The bounded Graph-owned cleanup/reference slice for `GRAPH-CLEANUP-001..004` is now integrated on the experimental portfolio.

The semantic correction remains deliberately narrow:

- conflicting ready NODE publication quarantines the affected observation, invalidates payload/evidence access and rejects later lookup instead of leaving contradictory ready evidence;
- equality/publication contradictions fail closed through quarantine rather than guessing authority;
- Graph arena release remains owner-neutral and stops at `ready-for-resource-destruction`; concrete downstream/native destruction remains outside Graph;
- retained-artifact cleanup requires explicit owner and exact compatible package/profile identity;
- stale-generation aliasing and silent generation wrap remain prevented by the Graph REF contract; no native ABA detector qualification is claimed;
- structured coverage for `GRAPH-CLEANUP-001..004` truthfully remains `partial`, because CUDA-free reference evidence is not native lifecycle qualification.

Exact integrated packet:

- Composer `881/881`, requirements `989/989`, representation/composition `fd58bd6a5ae99dfb8534ab802f9aca9c12c0a110a793760645cec71d3a385042`, canonical bytes `721157`;
- Graph projection `a525b51634582f0f6d862d1d93b4ec68d8171230a01c3bf31743482f49d86af6`, canonical bytes `140331`;
- NODE `51599ce27d2a8b3b61046b1f98f677a64604ed8d89480730076a49997c279d61` (`13/13`);
- EDGE `77a27487b37e0b2906aef4a115199e0eb1e5b0ea88c34ba0110b1061695604c7` (`16/16`);
- REF `07557450fc72cc6c2fea95f8d77ce2a6703358e50b974ec27d14dd75ba5b1cd0` (`14/14`);
- PATH `057da30298ff2c76ee5400d2b45ddf5fcbd969885910e078709e67b9cc673c72` (`14/14`);
- root-control `be35ed803ea82498950c454acb6955087543c2a7a974745077c4c53158bca475`;
- ROOT `d66ce77bcd362865382e4ab15d4db70f79f7e7a34b49e6c19c5873f193129e2b` (`14/14`);
- RECLAIM `42d2c94e6387b72e17d891dfdfc53c6e7c65795dc15169085b70df65f5be34cf` (`17/17`);
- ADVANCE occurrence `53b2437c4f0221515f89cd6b16aeaa74f61d8d934680d0284ee83a5611fb1a87` (`5/5`);
- CLEANUP `a0da64926d2ebb2352a18f318d6c0e0b108ddcdf773b9e68f42e64a5e280e38b` (`6/6`, canonical bytes `5466`).

Retained CLEANUP artifact: ID `9704784670`, ZIP SHA-256 `ba241e63d6ffcf22f394afe0d313e4c3840ce1a73b31ac3cd81fe43e228d860c`.

## Ownership and claim limits

Graph owns reusable product-neutral graph/storage/reference/lifetime/cleanup meaning only.

Session retains current-root, root-epoch, advance, reroot, attention and supersession-reason authority. Resource retains admission/watermark/pressure policy. Progress retains scheduling/fairness/device-progress policy. CUDA-JS owns generic native/CUDA realization mechanisms. CUDA-JS-Tensor owns generic tensor math. Production domain/search products remain downstream.

No retirement queue/table/traversal algorithm, atomic primitive, scheduler topology, warp/block topology, CUDA data structure, allocator, native addon/FFI or production persistence format is selected by this slice.

Native ABA/publication/progress/occupancy/concurrency/cancellation/teardown qualification remains deferred to an exact CUDA-MCGS/CUDA-JS compatible-pair/device gate.

## Next semantic seam

The Graph cleanup candidate/review gate is closed on the experimental line. Do **not** continue adding Graph cleanup semantics merely because native/resource obligations remain.

Issue #24 remains the Graph meaning tracker while closure/transfers are reconciled; the semantic/reference obligations completed here are integrated. `GRAPH-RESOURCE-*` work belongs with the Resource/deterministic-composition owner (`IR-RESOURCE-01`) rather than Graph cleanup policy. Native-dominant `GRAPH-LIFE-*` qualification remains later `ENGINE-NATIVE-01` compatible-pair/device work.

Issue #36 remains the universal deterministic reference/conformance parent. The next work is an assessment of its current owner map against the newly integrated Graph packet, then selection of the smallest dependency-ready non-Graph semantic leaf. Do not assume historical owner ordering is still correct; reassess Policy, Evaluator, Resource, Progress, Output, optional Session and Stage/Channel obligations against current evidence before implementation.

Issue #122 remains the later atomic semantic acceptance gate. No production lowering/native construction begins merely because the experimental Graph reference is green.

Portfolio coordination remains issue #142.

## Cleanup / coordination

- PR #150 is closed superseded by merged PR #151.
- `ref/graph-cleanup-acceptance-01` and `integration/graph-cleanup-acceptance-01` are now stale source refs; delete when a safe delete-ref action is available and no recovery dependency remains.
- `checkpoint/graph-cleanup-falsifier-handoff-20260828@28132a53471526ad355d8cfea96bb92d1ec076df` is now eligible for normal recovery-ref cleanup after this integrated state is durably reconciled; retain until safe deletion is available.
- `checkpoint/graph-path-01-handoff@a697ea8bf54e1db2a50f3466e0e69c8ea25fb02f` remains older bounded cleanup debt for the same tooling reason.
- stale PRs #126/#132 remain separate product-boundary disposition debt under issue #44 and are not current Graph authority.

No authorization was given to move or modify protected `main`.
