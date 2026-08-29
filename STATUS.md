# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-28

## Protected authority

Protected `main` remains intentionally unchanged during the isolated experimental portfolio:

`ee4434be0ae927c4ae1d5c106f91503d28b1aa01`

Protected-main workflow `33115975009` passed under the fail-closed aggregate `verify` gate. Nothing below is a protected-main support, release, native, compatible-pair, performance or production claim.

## Experimental integration line

Current experimental integration authority is:

`experimental/portfolio@b18fb338a43145d9ac3df67dd76d63d0a2ea4aa5`

That revision contains the reconciled Graph cleanup/reference integration and state. Protected `main` remains unchanged.

The active Policy semantic/reference candidate is PR #153:

`ref/policy-reference-01@104cb8356417f95cc3783144b306f7b7725f9726`

Base authority is exactly `experimental/portfolio@b18fb338a43145d9ac3df67dd76d63d0a2ea4aa5`.

PR #153 is **not integrated**. Its semantic/evidence head is qualified and author-reviewed, but merge remains blocked on an independent review or an explicit repository-owner exception naming the exact current head. A generic continuation instruction is not merge authorization.

## Policy semantic/reference candidate

`REF-POLICY-01` is the next dependency-ready `ENGINE-REFERENCE-01` owner brick after Graph. It consumes normalized public Domain/Graph facts and owns only Policy meaning: local records, bounded reservations, cycle response, action-admission/widening semantics represented by the normalized profile, value/perspective handling represented by the normalized profile, ordered/idempotent backup, stop/drain accounting, reroot reuse classification and Policy cleanup/quarantine.

The candidate does **not** absorb Evaluator execution, Resource admission/watermark/pressure policy, Progress scheduling/fairness/device progress, Output publication/ranking, Session root authority, Graph storage/reclamation, native/CUDA realization or production lowering.

Exact qualified semantic/evidence head:

`104cb8356417f95cc3783144b306f7b7725f9726`

Exact qualification workflow:

`33231519393` — success

The permanent fail-closed workflow passed Governance, Search IR on Ubuntu and Windows, every existing Graph lane, Policy reference and aggregate `verify`.

Final Policy packet:

- Composer `881/881`, requirements `989/989`, representation/composition `115cceb16db3e4a99944c7228e1d5dff7047f342ddbe63a3e695c027d33e85c8`, canonical bytes `727811`;
- Policy projection `6662d8101bbffee0e322ef7e2172f5980d69a09aec8ec565c9425578751310c2`, canonical bytes `123882`;
- Policy reference `e58a5d2f1d49bab77c8b2176750ac764bc6f5295907bbffb708308b5ca35c116`, `24/24`, canonical bytes `13104`;
- retained Policy artifact ID `9708629102`;
- artifact ZIP SHA-256 `a33e7a4725f6f011737bc280c7f3f721874c4ee9c807a46e550e3c125167b747`;
- truthful requirement disposition summary: `52 deferred / 910 partial / 27 pending`.

The two `POLICY-CLEANUP-*` requirements moved from pending to partial because they now have direct CUDA-free behavioral evidence. Existing Policy behavioral groups gained direct case evidence without being promoted beyond `partial`; native/supporting obligations remain deferred or owned elsewhere.

The Composer coverage truth change necessarily changed Composer evidence identity. The dependent Domain/Graph/Policy fixture identities were rebound in owner order. The rebinding changed provenance identities only; semantic cases, schedules, ownership declarations and normative specifications were not changed. The full permanent gate re-proved the rebound chain.

## Author review result

The exact Policy candidate received a whole-diff author review after initial qualification. That review did not merely accept green CI; it produced concrete counterexamples and repaired them before the final qualified head.

The repaired defects included:

- reroot validation previously could publish partial Policy reuse bookkeeping before a later invalid disposition failed;
- normalized `transform` and `invalidate` reuse declarations were not enforced exactly;
- atomic backup staging could be confused with visible-prefix mutation and commit preconditions were not fully fenced;
- reservation conversion/generation/root-epoch failures could permit incorrect completion or stale publication behavior;
- stop terminalization could strand accepted work instead of requiring completion/explicit abandonment;
- quarantined Policy evidence could still be read through `readRecord`;
- reservation scopes, backup target sets and root-independent backup authority were insufficiently constrained to the normalized Policy profile;
- deterministic-sequence backup did not reject out-of-order occurrence application;
- prefix-visible target mutation could be treated as harmless stale discard even when mutation had already begun.

The strengthened existing 24-case Policy bank now falsifies those paths while staying within the same requirement IDs and owner boundary. Final workflow `33231519393` passed after all repairs and after all temporary repair/bootstrap/migration workflows and scripts were removed.

## Integrated Graph history

The Graph cleanup/reference slice remains integrated on the experimental portfolio. Its earlier accepted packet is historical evidence for that integration; the Policy coverage migration subsequently rebound dependent fixture provenance to the new Composer coverage identity without changing Graph semantics.

Graph still owns reusable product-neutral graph/storage/reference/lifetime/cleanup meaning only. Session retains current-root/root-epoch/advance/reroot/attention and supersession-reason authority. Resource retains admission/watermark/pressure policy. Progress retains scheduling/fairness/device-progress policy. CUDA-JS owns generic native/CUDA realization mechanisms. CUDA-JS-Tensor owns generic tensor math. Production domain/search products remain downstream.

No retirement queue/table/traversal algorithm, atomic primitive, scheduler topology, warp/block topology, CUDA data structure, allocator, native addon/FFI or production persistence format is selected by the Policy slice.

Native ABA/publication/progress/occupancy/concurrency/cancellation/teardown qualification remains deferred to an exact CUDA-MCGS/CUDA-JS compatible-pair/device gate.

## Current gate and next seam

The implementation/review work for this Policy leaf is complete on the candidate branch. The remaining Policy-specific gate is procedural but mandatory:

1. qualify the state-only `STATUS.md` / `next_step.yaml` reconciliation head under the same permanent aggregate workflow;
2. record the exact state head and workflow on PR #153 / issue #36;
3. obtain independent review, or an explicit repository-owner exception naming the exact current head, before merge/integration;
4. do not merge, advance `experimental/portfolio`, or begin the next semantic owner before that gate is satisfied.

If Policy later integrates, the canonical dependency map makes `REF-EVALUATOR-01` the next immediate semantic owner dependent on Domain/Graph/Policy, while Resource/Progress/Output remain separate owners and must still be reassessed against the exact integrated packet before implementation.

Issue #36 remains the deterministic reference/conformance parent. Issue #122 remains the later atomic semantic acceptance gate. Issue #142 remains portfolio coordination only.

## Cleanup / coordination

- PR #153 contains only the intended Policy/coverage/permanent-CI/provenance surface; temporary focused/bootstrap/rebind/review-repair workflows and scripts are absent from the final tree.
- `ref/graph-cleanup-acceptance-01`, `integration/graph-cleanup-acceptance-01`, `checkpoint/graph-cleanup-falsifier-handoff-20260828`, `checkpoint/graph-path-01-handoff` and the older temporary Graph qualification branch remain bounded stale/recovery ref cleanup debt where safe delete-ref tooling or recovery disposition is still required.
- stale PRs #126/#132 remain separate product-boundary disposition debt under issue #44.

No authorization was given to move or modify protected `main`.
