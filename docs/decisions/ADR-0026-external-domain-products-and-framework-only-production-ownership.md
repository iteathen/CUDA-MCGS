# ADR-0026: External Domain Products and Framework-Only Production Ownership

**Status:** Accepted

**Date:** 2026-08-26

## Context

ADR-0018 correctly separated universal MCGS semantics, the extension/composition substrate, and domain/search product meaning so chess, ranked moves, one evaluator shape, and one output convention could not leak into the framework.

Its wording still left one ownership ambiguity: it allowed a domain/search product such as chess to be specified and eventually implemented inside the CUDA-MCGS repository as long as its semantics were isolated from the universal core.

The project owner has now clarified the stronger repository boundary required for the intended ecosystem:

> CUDA-MCGS is not the chess engine. CUDA-MCGS must provide the primitives necessary for a separate GPU-hosted chess engine for UCI Arena, while the chess engine remains a downstream consumer.

The distinction matters because repository-local production product code would still create pressure on public defaults, package shape, test fixtures, dependency direction, release cadence, performance priorities, and internal APIs even if the universal schema remained nominally clean.

## Decision

CUDA-MCGS production ownership is limited to the reusable GPU-resident MCGS framework, its public composition/embedding surface, and consumer-neutral conformance infrastructure.

Production domain/search products live downstream in their own consumer package or repository and consume only public CUDA-MCGS contracts.

CUDA-MCGS may retain synthetic domains, bounded Connect Four-style fixtures, and other domain-specific experiments when they are useful for falsification, conformance, deletion, second-instance, performance, or research evidence. Those artifacts are explicitly non-production and may not become runtime authority, product defaults, package dependencies, or stable framework semantics.

## Framework-owned boundary

CUDA-MCGS owns:

- universal Domain, Graph, Policy, Evaluator, Output, Resource and Progress contracts;
- optional Search Session root/advance/reroot/attention/control/observation lifecycle;
- Search Stage, extension-surface and Async Stage Channel composition;
- finite resource planning, pressure, failure, cancellation, teardown and compatibility identity;
- Search IR, Search Composer, deterministic specialization and Search Program generation;
- the CUDA-JS runtime adapter and exact compatible-pair evidence;
- optional first-class neural-evaluator composition and Tensor execution variants under ADR-0024 without owning one model architecture;
- one public external-consumer embedding lifecycle and installed-package conformance;
- reference domains/fixtures sufficient to prove universality and first-consumer deletion.

CUDA-MCGS does **not** own production implementations of:

- chess, Go, Connect Four, text-search, planning, optimization or another domain product;
- UCI or another application protocol;
- chess move generation, legality, board/history representation, tablebase logic or engine options;
- product-specific ranking, best-move, MultiPV, analysis or user-facing output semantics;
- one neural-network architecture, feature encoder, model-head interpretation or search-quality policy.

A downstream product may supply those meanings through public bounded CUDA-MCGS contracts and namespaced specialization inputs.

## External-product composition rule

An external engine must be able to:

1. provide its own domain, policy, evaluator/model and output modules through public contracts;
2. resolve one finite pre-ignition specialization with inspectable material defaults and compatibility identity;
3. allocate and preload all required device-resident framework/model state;
4. establish a root and ignite device-owned search;
5. supply bounded external control changes without becoming the internal progress coordinator;
6. observe immutable bounded live/terminal outputs whose payload meaning remains consumer-owned;
7. use `advance` for an already-ready realized successor and `reroot` for general root replacement;
8. cancel/stop and close with exact failure/resource truth; and
9. delete the entire downstream product without changing CUDA-MCGS production code or universal semantics.

Exact SDK naming remains owned by the public-library work. This ADR owns repository/product responsibility and dependency direction.

## UCI Arena as a requirements target

A future UCI-compatible chess engine for UCI Arena is an important first external consumer and may be used as a requirements/falsification matrix.

Its needs must map onto generic framework capabilities rather than create UCI or chess semantics in CUDA-MCGS. Examples include:

- position replacement -> root/reroot;
- continuation after a selected played action -> `advance` when its strict ready-successor preconditions hold;
- search limits -> generic finite search-control/budget inputs;
- pondering or changed emphasis -> selected generic attention/control input;
- stop -> cancellation/terminalization request;
- analysis output -> consumer-owned payload through generic bounded observation publication;
- best move or multiple candidate lines -> consumer-defined product output over the generic result publication contract.

If a required mapping cannot be expressed without adding a chess/UCI field to universal CUDA-MCGS, the framework owner reassesses the genuinely generic missing primitive rather than accepting product leakage.

## Consequences

- Issue #45's planned in-repository chess implementation is superseded and closed as not planned.
- Issue #123 owns external engine embedding/readiness evidence.
- Issue #124 owns the generic device-resident evaluator connector through public CUDA-JS-Tensor for consumers that select a Tensor-backed evaluator.
- Connect Four and other named domains remain useful as reference/conformance fixtures, not production product lanes.
- The public release criterion becomes: a downstream consumer can build a complete product without private CUDA-MCGS access, not: CUDA-MCGS ships a first chess product.
- Product-specific performance/search-quality work belongs in the downstream product, while CUDA-MCGS retains framework-level mechanism/resource/performance evidence.
- Generic CUDA mechanisms still escalate to CUDA-JS; dense Tensor mathematics still belongs in CUDA-JS-Tensor.

## Alternatives considered

### Keep chess production in CUDA-MCGS but isolate it in a product directory

Rejected. Semantic isolation alone does not eliminate repository, dependency, release, default, test and maintenance coupling. The product would remain an influential first consumer with privileged access.

### Create a separate runtime framework per product

Rejected. Downstream products should reuse one complete CUDA-MCGS public framework rather than duplicate graph/resource/progress/lifecycle machinery.

### Ban domain-specific fixtures from CUDA-MCGS entirely

Rejected. Concrete fixtures are valuable falsifiers and conformance inputs. They are safe when their non-production status, dependency direction and deletion properties are explicit.

## Compatibility and supersession

This ADR extends and narrows ADR-0018. ADR-0018 remains authoritative for semantic layering and product-assumption exclusion, but its wording that permitted an in-repository production chess product is superseded by this decision.

No accepted universal Search IR meaning changes solely because product source moves downstream. Historical product proposals and experiments retain provenance but do not authorize production implementation.

## Validation

Before CUDA-MCGS is called ready for the first external GPU-hosted engine:

- one installed external consumer composes only public CUDA-MCGS contracts;
- no private import or repository-local product code is required;
- all active-search progression remains device-owned;
- the external consumer can exercise root, advance, reroot, selected controls, observation, cancellation and close independently;
- evaluator-free/non-neural and optional Tensor-backed evaluator paths remain replaceable where selected;
- finite resource requirements and pressure behavior are preflighted;
- deleting the consumer leaves CUDA-MCGS byte-for-byte coherent at its public/framework boundaries; and
- exact CUDA-MCGS/CUDA-JS compatible-pair evidence names the tested revisions/profile.