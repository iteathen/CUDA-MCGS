# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-09-01

## Current repository state

Protected `main` is currently:

`6fcb2e336c5d31ec7eae16b39166147d846ca19c`

That head contains the protected Graph ROOT packet and merge-gate governance inherited from the earlier protected history, plus the evidence-first README update merged as PR #164. The protected README is intentionally preserved by the current #44 promotion work.

CUDA-MCGS remains a public pre-release universal GPU-resident MCGS framework project. There is no accepted production CUDA-MCGS runtime, stable public SDK, native CUDA-MCGS implementation, qualified CUDA-MCGS/CUDA-JS compatible pair, or downstream product release.

## Issue #44 — protected authority promotion

Issue #44's framework-only production-ownership correction was already constructed and reviewed as PR #146. PR #146 merged into `experimental/portfolio` as `a1be8a596bb5ccc97736365dfbc49419ec0f76aa`, but that did not make the authority protected because `experimental/portfolio` is not `main`.

The current promotion branch is:

`architecture/44-protected-main-promotion`

It starts directly from current protected `main@6fcb2e336c5d31ec7eae16b39166147d846ca19c`. Reconstruction commit `870599d7a63651b854a92249437612759ca5d649` transplants the accepted non-README #146 authority blobs exactly and deletes the obsolete active CHESS-0001 product specification exactly as #146 did. It deliberately does **not** merge `experimental/portfolio` and deliberately preserves the newer protected README from PR #164.

The #44 authority is still **candidate authority** until a promotion PR passes the complete required workflow, receives independent review, is guardedly merged to `main`, and protected-main readback succeeds.

## Framework-only production boundary

Candidate ADR-0024 establishes the production ownership boundary without rewriting accepted ADR-0018 history:

- CUDA-MCGS production owns reusable, product-neutral MCGS semantics, normalized composition, finite search resources, public integration seams, and removable universal conformance evidence.
- Production domain/search products own their product semantics, protocol, model interpretation, quality, packaging, release, and support lifecycle in independently owned repositories or packages.
- Concrete named domains remain valid as removable examples, research, and conformance falsifiers; naming a consumer does not grant framework authority.
- CUDA-JS owns generic CUDA lowering, compiler/ABI/runtime/resource/operation/synchronization/platform mechanisms behind public contracts.
- A need for native code in CUDA-MCGS is a library-coverage diagnostic, not permission for a private/native escape path.
- Active search remains device-owned after ignition.

The active repository-local chess product specification is archived rather than silently deleted from history. `scripts/check-project-organization.mjs` rejects future active files under `docs/specs/products/`.

## Current critical path

1. Open and qualify the current-main #44 promotion PR on one exact head.
2. Obtain independent review; do not self-merge around the repository review contract.
3. After guarded merge, verify protected `main` readback and only then close #44.
4. Complete #44-owned stale-candidate disposition for PRs #126/#132 without losing unique research evidence.
5. Resume issue #36 semantic/reference integration in dependency order; production lowering remains blocked on #122.

`REF-PROGRESS-01` PR #167 remains separate from this promotion. Shared Composer authority PR #169 is author-qualified but still draft pending independent review; neither is imported into the #44 protected-main promotion.

## Claim limits

- PR #146 being merged to `experimental/portfolio` is not protected-main acceptance.
- The current promotion branch contains no cumulative experimental Graph/Policy/Evaluator history.
- The current protected README remains authoritative evidence-first project presentation and is not replaced with the older #146 README.
- No production lowering, native CUDA-MCGS implementation, performance claim, stable SDK claim, or product release follows from #44.
- No issue is closed merely because a candidate branch or PR is green; protected readback is the final #44 acceptance gate.

## Cleanup / handoff

The safe #44 seam is the current-main reconstruction branch above. If qualification reveals a failure, classify it against the exact current-main promotion diff rather than importing later `experimental/portfolio` history. Issue #36 remains the next semantic priority once #44 is protected and its stale authority candidates are dispositioned.
