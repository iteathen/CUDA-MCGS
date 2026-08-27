# ADR-0027: Framework-Only Production Ownership

**Status:** Accepted

**Date:** 2026-08-26

## Context

ADR-0018 separated universal framework semantics from domain/search product meaning, but it still allowed a downstream product specification or implementation to live in this repository. Repository-local product code would continue to influence defaults, package shape, fixtures, internal APIs, performance priorities, and release cadence even if its fields were nominally isolated.

CUDA-MCGS needs a stronger LEGO boundary. It is a reusable graph-search framework, not a home for any particular application, domain, protocol, model family, or output convention.

## Decision

CUDA-MCGS production ownership is limited to the reusable GPU-resident MCGS framework, public composition and embedding contracts, consumer-neutral adapters, and universal conformance infrastructure.

Production domain/search products live in their owning repositories and consume only public CUDA-MCGS contracts. Their domain, policy, evaluator interpretation, application protocol, output semantics, quality targets, and release lifecycle remain external.

Concrete synthetic fixtures may remain when they are deliberately diverse, non-production falsifiers for universality, deletion, resource, lifecycle, or conformance claims. No one fixture becomes a privileged reference product, default, package dependency, or stable framework vocabulary.

## Framework boundary

CUDA-MCGS owns:

- product-neutral Domain, Graph, Policy, Evaluator, Output, Resource, Progress, and optional Session contracts;
- Search IR, deterministic specialization, Search Program generation, and finite package identity;
- extension composition with least authority and zero unselected residue;
- finite resource, pressure, failure, cancellation, teardown, and compatibility truth;
- public runtime and optional mathematical-execution adapters that preserve consumer-neutral semantics; and
- materially different synthetic conformance instances.

CUDA-MCGS does not own:

- a production application/domain product;
- an application protocol or user-facing workflow;
- one state, action, history, policy, evaluator, model, or output shape;
- product-specific quality, ranking, decision, or presentation semantics; or
- a downstream product's packaging, support, or release identity.

## External composition rule

A conforming external product can provide its meanings through public bounded contracts, resolve a finite specialization before ignition, run without host-produced active-search intermediates, observe bounded immutable results, reconcile authoritative focus changes, close with exact resource/failure truth, and disappear without changing CUDA-MCGS production code.

If an external requirement cannot be expressed without adding product vocabulary to a universal contract, the framework owner assesses the genuinely reusable missing invariant. Consumer urgency does not create framework authority.

## Consequences

- Repository-local domain product specifications and registry entries are removed and transferred to their product owners where still useful.
- Public documentation describes consumers only as an intentionally varied and non-authoritative class; it does not organize the framework around a named first product.
- Universal specifications use abstract or materially varied examples and avoid repeating one consumer-specific representation as the default counterexample.
- External-consumer readiness is proven through public embedding and deletion tests, not repository-local product code.
- Product-specific performance and quality work belongs downstream; framework benchmarks retain mechanism, resource, lifecycle, and cross-profile evidence.

## Alternatives

### Keep product code in a separate repository directory

Rejected. Directory isolation does not remove repository, release, default, test, or maintenance coupling.

### Ban every concrete fixture

Rejected. Diverse synthetic fixtures are valuable falsifiers when they have no production authority and remain completely deletable.

## Supersession

This ADR narrows ADR-0018. ADR-0018 remains authoritative for semantic layering, but any wording that permits repository-local production product ownership is superseded. Historical proposals retain provenance only and do not authorize implementation.

## Validation

- active framework authority contains no repository-local domain product specification or product registry entry;
- public framework contracts and names remain product-neutral;
- conformance uses materially different removable instances;
- an external product composes through public contracts without private imports; and
- deleting every external product leaves CUDA-MCGS coherent and independently releasable.
