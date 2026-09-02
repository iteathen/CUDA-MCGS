# Archived CHESS-0001 consumer/product proposal

**Status:** Superseded

## Provenance

- Original active path: `docs/specs/products/chess/CHESS-0001-search-product.md`
- Last active blob before archival: `0cc119a819908ee9bc871272eaea8e815d6bae0a`
- Archive date: 2026-08-27
- Superseding authority: [`ADR-0024 Framework-Only Production Ownership`](../../decisions/ADR-0024-framework-only-production-ownership.md)
- Historical semantic-layer authority retained: [`ADR-0018`](../../decisions/ADR-0018-universal-core-extension-product-layering.md)

## Why it was superseded

CHESS-0001 evolved from a repository-local chess product proposal into a CUDA-MCGS chess consumer/conformance profile. That correction removed much of the semantic leakage, but keeping it under active `docs/specs/products/` still created a second product authority inside the framework repository.

ADR-0024 establishes the stronger LEGO boundary: CUDA-MCGS owns reusable MCGS framework semantics, composition, integration seams and removable conformance evidence; production domain/search products own their product semantics, source, quality, packaging, release and support lifecycle in independently owned repositories or packages.

The active CHESS-0001 specification is therefore removed rather than promoted. The full historical text remains recoverable from Git history at the blob above and prior commits.

## Useful conclusions retained

The archived proposal remains useful evidence for why the public framework must support, without universalizing them:

- history-sensitive state identity and transposition verification;
- product-owned search policy and evaluator interpretation;
- product-specific ranked observations and output schemas;
- exact `root` / ready-successor `advance` / general `reroot` / non-structural `attention` separation;
- explicit reuse/reset/invalidate ownership rather than preserving statistics because storage survives;
- namespaced optional capabilities such as opening-book, tablebase, timing, tactical or diagnostic integrations;
- deterministic finite Search Image/package identity; and
- product deletion leaving universal framework/conformance complete.

Those are compatibility and falsification lessons, not current chess-product requirements owned by CUDA-MCGS.

## Current ownership

A real chess engine consuming CUDA-MCGS owns its chess/UCI/model/output/integration semantics in its own repository. `iteathen/UCI-Arena-Vector` is the current concrete ecosystem consumer and requirements falsifier, but naming it here does not grant it framework authority or make its current branch/PR state normative for CUDA-MCGS.

Concrete chess cases may still appear in CUDA-MCGS conformance/research/examples when they are deliberately removable, non-production evidence. They must not recreate an active repository-local product specification under another name.
