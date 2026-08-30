# Evaluator review / required-fixture blocker handoff — 2026-08-29

## Stop point

Stop at the clean ownership seam between the qualified `REF-EVALUATOR-01` implementation candidate and a newly discovered upstream Composer/conformance-fixture defect.

Do **not** merge either active PR from this checkpoint. Do **not** start Resource/Progress/Output work. Protected `main` remains out of scope.

## Frozen repository state

- Experimental integration authority: `experimental/portfolio@9d87a0004565041cac3c476afef8cde5c6f34eb0`.
- Evaluator implementation PR: #160, draft, branch `ref/evaluator-01@f7501ec5d2921523cc7bdda89029a439f502f6c8`.
- Upstream fixture correction PR: #162, draft, branch `fix/evaluator-required-fixture-matrix-20260829@ec6aa4585636defb87fc1fa6d11a9b1816b47b2e`.
- Checkpoint branch: `checkpoint/evaluator-review-fixture-blocker-handoff-20260829`.
- Protected `main` was not changed.

## Qualified Evaluator head

PR #160 exact head `f7501ec5d2921523cc7bdda89029a439f502f6c8` passed permanent workflow `33286297563`, including aggregate `verify`.

Evaluator job `99189965134` recorded:

- Composer: `881/881` pass.
- Evaluator reference: `29/29` pass.
- Composer evidence: `115cceb16db3e4a99944c7228e1d5dff7047f342ddbe63a3e695c027d33e85c8`.
- Evaluator projection: `705f8357a2edfbbbc84f9daae42e601b089778ef5f09b2284a2d2079d4b797a1`.
- Evaluator evidence: `63e19834f7e348908a6cdba0fd5880dee44d8d35abd0eb59f2997601192c1607`.
- Artifact: `evaluator-reference`, artifact ID `9724535692`, ZIP SHA-256 `fff692a0b02fae11e2e1b8ff26943b482c4922a09abb746a92d07aa361f4b3ee`.

Author review repaired concrete Evaluator-owned lifecycle defects before this green head, including:

- opaque request identity tuple framing rather than delimiter concatenation;
- separation and validation of request input identity versus full cache identity;
- cache-free runtime deletion when `cache.kind === none`;
- retaining input borrows while a live batch still owns physical work even if another source makes the logical request ready;
- cleanup that can drain quarantined active batches;
- stale hash-bucket removal when a cache entry identity is recycled;
- terminal cancel/fail outcomes that report the already-authoritative state rather than claiming a new terminal state;
- stale/cancelled mutable-state write rejection and idempotent mutable update retry identity;
- corrected batch compatibility so distinct semantic inputs may share a compatible batch while cache/coalescing identity remains exact.

A first attempt at the final compatibility change (`537ea0a5c0d694900aed397390e3ed771976dd6c`) failed only two Evaluator cases because full cache identity had been incorrectly inserted into batch compatibility. That was corrected by the narrow two-file commit `f7501ec5d2921523cc7bdda89029a439f502f6c8`; the permanent rerun is fully green.

## Whole-spec review blocker

Despite the green Evaluator head, author review found that SPEC-0009 section 18 cannot currently be satisfied by the normalized fixture matrix.

The authoritative conformance section requires:

- `evaluator-cache-mutable-state-invalidation`; and
- a finite resumable evaluator exercised under queue/workspace/cache pressure, cancellation, and stale epochs.

The current Composer profiles split those properties:

- `evaluator.synthetic-vector-combined` has cache but no mutable state/resumable continuation;
- `evaluator.synthetic-batch-sensitive-resumable` has mutable state/resumable continuation but, on the experimental base, no cache.

Therefore PR #160 cannot honestly falsify mutable-state/cache invalidation on the required resumable profile without inventing an unnormalized local profile. That would violate the Composer authority boundary and LEGO ownership.

## Isolated upstream correction

Draft PR #162 was opened from the unchanged experimental base. Its only semantic change is to select the already-defined cache contract for `synthetic-batch-sensitive-resumable`:

`{ ..., mutable: true, workspace: true, cache: true, sensitive: true, resumable: true, ... }`

Exact head: `ec6aa4585636defb87fc1fa6d11a9b1816b47b2e`.

This branch intentionally does **not** contain PR #160's Evaluator oracle implementation.

## #162 invalidation probe result

Workflow `33286471133` failed, as expected for a shared Composer profile-identity change.

Important classification from the first failure:

- the Evaluator normalizer accepts the corrected profile;
- `normalize-evaluator-profiles` passes;
- 880/881 Composer cases pass;
- the single Composer semantic failure is `evaluator-profile-second-instances-distinct`, whose checked-in expectation still hard-codes cache kinds as `['selected', 'none', 'none', 'none', 'none']` instead of the corrected fifth `selected`;
- the changed representation/composition evidence identity observed in that run is `08766d883eb9a3dbd1d670bc8857efa63e80f6bbbc0576291c5334914a480bbd`;
- Search IR Ubuntu remains green;
- Graph/Policy reference jobs fail downstream because they are bound to the previous exact Composer evidence key. Do not mechanically rewrite those bindings until the Composer correction itself is qualified and semantic impact is reviewed.

No attempt was made to continue fixing #162 after this classification; that is the deliberate stop seam.

## Safe resume sequence

1. Resume on PR #162 / `fix/evaluator-required-fixture-matrix-20260829`, not on PR #160.
2. Update only the obsolete Composer oracle expectation in `experiments/search-ir-composer-reference/run.mjs` for `evaluator-profile-second-instances-distinct` so the fifth normalized profile expects `cache.kind === 'selected'`.
3. In the same owner-local Composer case, add an explicit structural assertion that the fifth profile simultaneously has:
   - `mutableState.kind === 'selected'`;
   - `batching.continuation.kind === 'bounded'`;
   - `cache.kind === 'selected'`;
   - cache key facts containing `state-generation`.
   This makes the SPEC-0009 minimum fixture combination explicit instead of relying on incidental construction.
4. Run the exact permanent workflow on #162.
5. If Composer becomes green, classify every remaining peer failure before changing frozen evidence bindings. Distinguish pure exact-evidence-key invalidation from genuine Graph/Policy semantic impact. Do not waive or bypass fail-closed gates.
6. Only after #162 is fully qualified, author-reviewed, and independently reviewed/authorized may it integrate into `experimental/portfolio`.
7. Rebase/reconstruct PR #160 on that exact new experimental authority. Its frozen Composer evidence/projection fixtures will necessarily change.
8. Extend the Evaluator reference on the now-normalized resumable+mutable+cached profile to exercise the missing mutable-state/cache invalidation and required cache-pressure interaction. Re-run full exact-head workflow and repeat whole-spec author review.
9. Stop again at the independent-review gate; do not self-merge an author-reviewed semantic candidate.

## LEGO / ownership constraints to preserve

- Composer owns normalized profile truth and evidence identity; Evaluator reference must consume it, not invent a private profile.
- Evaluator owns request/incarnation, batch/workspace, cache correctness, evaluator reuse classification, internal result disposition, and cleanup only.
- Resource admission/pressure decisions, Progress scheduling/fairness/no-progress, Session root authority, external Output publication, CUDA-JS realization, and CUDA-JS-Tensor math remain separate owners/injected facts.
- No native/CUDA workaround belongs in this slice.
- Do not split implementation merely by file size; split only at real semantic/ownership seams.
- Keep both active PRs draft until their respective evidence/review gates are satisfied.

## Cleanup state

No local worktree or host mutation exists from this session; all substantive work is on GitHub.

Retain exactly these task branches because they remain active evidence/work branches:

- `ref/evaluator-01` — qualified Evaluator implementation candidate, blocked by upstream fixture truth.
- `fix/evaluator-required-fixture-matrix-20260829` — one-line upstream correction plus the known red invalidation probe.
- `checkpoint/evaluator-review-fixture-blocker-handoff-20260829` — immutable resume checkpoint containing this handoff.

No branch should be deleted until its active PR/invalidation purpose is resolved. No merge was performed.
