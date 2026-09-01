# ADR-0024: Framework-Only Production Ownership

**Status:** Accepted

**Date:** 2026-08-27

## Context

ADR-0018 correctly separates universal MCGS semantics, the universal extension/composition substrate, and domain/search product meaning. Its original repository model still permitted a downstream product specification or eventual product implementation to live inside CUDA-MCGS as long as product fields did not become universal core meaning.

That boundary is not strong enough for the intended ecosystem. Repository-local production product authority would still give one consumer privileged influence over defaults, package shape, internal APIs, test fixtures, release cadence, performance priorities, and maintenance decisions even when its semantic fields were nominally namespaced.

CUDA-MCGS is the reusable GPU-resident MCGS framework. Production domain/search products are consumers of that framework and need independent ownership, lifecycle, release, and support boundaries. Concrete consumers may still be useful requirements falsifiers and conformance examples; forbidding their names would weaken rather than improve universality testing.

## Decision

CUDA-MCGS production ownership is limited to the reusable framework and its consumer-neutral integration/conformance boundary.

CUDA-MCGS owns:

- product-neutral Domain, Graph, Policy, Evaluator, Output, Resource, Progress, optional Session, and extension/composition semantics;
- Search IR, normalization, deterministic composition/specialization, Search Program/execution-package meaning, finite resource planning, and compatible-pair evidence;
- ordinary Node.js host lifecycle and restricted Device-JS framework/search behavior submitted only through public CUDA-JS contracts;
- CUDA-MCGS-owned adapters that translate framework semantics to replaceable public peer-library/runtime contracts without moving search meaning downstream;
- universal and materially varied removable reference/conformance fixtures; and
- public embedding/deletion evidence proving an unrelated external consumer can supply product meaning through bounded contracts.

A production domain/search product owns, in its own repository or independently owned package boundary:

- domain-specific state/action/history/terminal meaning and representation choices;
- product search policy and quality targets;
- evaluator/model feature and output interpretation;
- user-facing result/observation/protocol semantics;
- product-specific service integrations and optional capabilities;
- product packaging, release, support, compatibility, and operational lifecycle; and
- product-specific performance/search-quality evidence.

CUDA-MCGS may compile or compose consumer-supplied domain/policy/evaluator/output programs into a specialized Search Image. Compilation does not transfer semantic ownership of those inputs to this repository.

## Concrete examples and conformance fixtures

A named domain or product may appear in CUDA-MCGS documentation, tests, research, examples, or conformance when it is serving a bounded non-production purpose such as:

- a second-instance or first-consumer-deletion falsifier;
- a transposition/history/cycle/resource/lifecycle counterexample;
- a compatibility/embedding example; or
- a requirements probe for a genuinely reusable missing framework capability.

Such an instance must remain removable without changing framework authority, defaults, packages, release identity, or universal conformance completeness. It may not become an active repository-local production product specification, product registry entry, privileged default, or implementation back door.

The architectural rule is therefore **not** “never name chess, Connect Four, Vector, Go, or another concrete consumer.” The rule is “no concrete consumer owns CUDA-MCGS production semantics or lifecycle merely because it is an early or important consumer.”

## External-consumer promotion rule

An external product requirement may motivate a CUDA-MCGS capability only after the normal ownership test establishes that the missing concept is genuinely reusable framework meaning and survives materially different second-instance and first-consumer-deletion checks.

If the missing need is a consumer-neutral GPU/compiler/runtime mechanism, it belongs to CUDA-JS behind a public bounded contract. If it is generic dense tensor mathematics, it belongs to CUDA-JS-Tensor or another natural mathematical owner. Product policy, protocol, model-head meaning, book/tablebase/timing semantics, and other product meaning remain with the product or independently owning service/library.

Consumer urgency does not create framework authority, and an apparent need for product-local native code does not justify a native escape path.

## Consequences

- Active CUDA-MCGS specifications describe only framework/interop semantics. Production product specifications live in their owning repositories or packages.
- Historical repository-local product proposals are retained only as superseded archive provenance where useful; they do not authorize implementation.
- The System Registry contains no CUDA-MCGS production product owner.
- Product-specific examples may remain as removable evidence and do not need to be erased from framework documentation.
- External-consumer readiness is proven through the public embedding/deletion boundary rather than by granting a product private or repository-local implementation access.
- A repository organization check enforces the absence of active files under `docs/specs/products/`; the checker enforces the decided ownership boundary rather than choosing architecture through a lexical blacklist.
- Existing issue requests for an in-repository production product must be reassessed against this decision before implementation.

## Alternatives considered

### Keep production products in this repository under a dedicated directory

Rejected. Directory isolation does not remove repository, release, default, test, internal-API, maintenance, or priority coupling.

### Ban every concrete named domain or consumer from active framework documentation

Rejected. Concrete materially different instances are valuable falsifiers. A lexical ban confuses evidence with ownership and makes universality harder to test.

### Move all product-like fixtures out of CUDA-MCGS

Rejected. Synthetic and bounded product-like cases are legitimate universal conformance evidence when they are explicitly non-production, unprivileged, and deletable.

### Edit ADR-0018 in place

Rejected. Accepted ADRs are immutable provenance. This decision narrows ADR-0018 through explicit supersession rather than rewriting historical authority.

## Supersession and compatibility

This ADR narrows ADR-0018 wherever ADR-0018 or lower-level material permitted a production domain/search product specification or implementation to be owned by the CUDA-MCGS repository.

ADR-0018 remains authoritative for the semantic distinction between universal core, universal extension/composition substrate, and downstream product meaning; its promotion/deletion principles remain valid. This ADR changes repository/product ownership, not the accepted Search IR 0.1.0 meaning or the current proposal requirement catalog by itself.

Any lower-level active document that treats a repository-local product specification, product implementation, or product release as CUDA-MCGS-owned must be reconciled before that wording can authorize work.

## Validation

The boundary is supported when:

- active `docs/specs/` contains no repository-local production product specification;
- current charter, architecture, registry, status, and plan agree that production product lifecycle is external;
- removable concrete fixtures remain non-authoritative and do not become framework defaults or package requirements;
- external-consumer embedding uses public contracts without private CUDA-MCGS imports or product-local native escape paths;
- deleting every external consumer leaves CUDA-MCGS coherent and independently releasable; and
- exact semantic/native/compatible-pair evidence remains owned by its proper framework or peer-library gate.

The first four bullets are repository-authority obligations. External embedding/native evidence remains downstream and is not claimed by accepting this ADR.
