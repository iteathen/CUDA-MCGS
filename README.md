# CUDA-MCGS

**Universal Monte Carlo Graph Search**

CUDA-MCGS is a public pre-release library intended to make finite GPU-resident Monte Carlo Graph Search easy to use while remaining complete enough for unrelated domains, evaluator types and search needs.

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS framework with a universal least-authority extension/composition substrate and finite specialized Search Images.**

The core must not inherit the shape of the first product. Chess, Go, planning, optimization, text search, evaluation-only search, partially observable search, and future MCGS-style workloads are consumers/specializations rather than definitions of universal CUDA-MCGS.

## Complete library, easy entry

[`ADR-0020`](docs/decisions/ADR-0020-complete-library-and-resolved-defaults.md) makes completeness and ease one design:

1. a concise facade and documented presets for common use;
2. complete composable contracts/components for explicit control; and
3. low-level Search IR, schema and extension tools for new integrations.

These are levels of access to one library, not separate runtimes. A minimal call and its fully explicit equivalent must resolve to the same canonical framework profile, validation, specialization and execution package.

Defaults are local, bounded, deterministic, documented, inspectable and overridable. CUDA-MCGS may adapt from declared capabilities, stable input contracts and unambiguous call shape before ignition. It does not guess domain semantics from sample values or runtime coincidences, and it does not invent a domain, evaluator, state identity or other required fact merely to make every construction parameter-free.

Resolved configuration and default provenance are part of the planned public experience. Semantically material defaults are versioned and identity-bearing so convenience remains reproducible rather than magical. Exact public class and function names remain future specification work; the repository does not yet publish a stable API.

## Architecture: three semantic layers

[`ADR-0018`](docs/decisions/ADR-0018-universal-core-extension-product-layering.md) makes the layering explicit.

### 1. Universal MCGS semantic core

The universal core owns product-neutral search contracts and lifecycle:

- state/action/transition/identity/history/node-role semantics;
- graph nodes, parent edges, paths, transpositions, generations and reclamation;
- selection/reservation/widening/backup/stopping semantics without one fixed formula;
- evaluator capability/residency semantics without one value shape;
- finite memory/resource admission, pressure, failure and cleanup;
- device-owned search progress;
- optional long-lived Search Session/root-update/root-advance semantics;
- generic bounded result/observation publication;
- Search IR, Search Composer, deterministic specialization, conformance and execution-package meaning.

The universal core does **not** require a board, players, legal moves, ranked moves, best-action/top-k output, scalar value, policy prior, one evaluator architecture, or one scheduler topology.

The first usable native engine is nevertheless parallel: it must run bounded useful Domain, Graph, Policy, selected Evaluator and device-progress work concurrently on the GPU. Scheduler neutrality means that grids, blocks, warps, queues, kernels and advanced CUDA-JS mechanisms remain selected implementation profiles; it does not permit a serial search loop to be presented as the GPU product. Tensor-shaped execution remains a measured exploratory profile rather than a current prerequisite.

### 2. Universal extension/composition substrate

CUDA-MCGS provides a universal way to extend a specialized engine without turning the core into a callback framework:

- semantic per-work-item **Search Stages**;
- stable least-authority entry/exit **Stage Extension Surfaces**;
- a minimal extension-only view of source-owner stable checkpoint facts;
- namespaced/versioned selected capability contracts and specialization-only context/state/resources;
- bounded nonblocking internal **Async Stage Channels**;
- deterministic pre-ignition composition;
- zero-or-one optional semantic **stage capability program unit** per stage in restricted Device-JS/Search Program source.

The **substrate is universal; an individual capability's semantics are not automatically universal**. Product-specific capability fields exist only in Search Images selecting them. If a capability changes domain/policy/evaluator/output/session meaning, that effect must also be owned by the selected corresponding contract/profile.

No selected capability means the complete extension substrate is absent. Deleting any one capability removes its solely owned code/context/state/channel/resource/synchronization/package residue.

### 3. Downstream domain/search products

A product selects universal contracts/capabilities and owns its product-specific semantics and outputs.

The first explicit product proposal is [`CHESS-0001`](docs/specs/products/chess/CHESS-0001-search-product.md). Chess owns chess board/history/legal-move semantics, chess policy/evaluator choices, chess-specific extension capabilities, and any ranked legal-move/best-move/MultiPV output.

Chess is intentionally **not** a gate for universal CUDA-MCGS completion or release. Deleting the chess product must leave the universal architecture, Search IR, extension substrate and conformance suite complete.

```text
Universal MCGS contracts
        │
        ├────► universal Search Stage / capability / channel substrate
        │
        ├────► optional Search Session control / generic observations
        │
        └────► downstream product contracts (for example chess)
                         │
                         ▼
                   Search Composer
                         │
                         ▼
              finite specialized Search Image
                         │
                  CUDA-MCGS adapter
                         │
                         ▼
                      CUDA-JS
                         │
                         ▼
                  CUDA Driver / GPU
```

## Long-lived Search Sessions

[`SPEC-0006`](docs/specs/SPEC-0006-search-session-control-and-observation.md) proposes a product-neutral long-lived Search Session contract.

When selected, it covers:

- finite root incarnations and ordered advance provenance;
- initial root establishment, minimum-work advance to an already ready realized successor, general reroot and independently versioned lazy attention publication;
- bounded validation/admission **before** root-specific mutation, reroot prepare/commit/abort and typed outcomes;
- preservation of compatible selected-descendant work and lazy `superseded-by-advance` disposition for sibling-occurrence work, without advance-time traversal, transformation, reset, resize, reclassification, reclamation or eager cleanup;
- coordination of source-owner stale-work and retain/retain-if-key-valid/transform/reset/invalidate dispositions;
- separation of the logical reroot transaction and advance publication from graph-owned generation-safe reclamation;
- bounded request/acquire/release coordination for output-owned immutable **read-only** live observations; and
- cancellation, completion, stale-safe finite generation/counter exhaustion, restart and exact terminal-only zero-residue behavior.

Session does not own domain root validity, graph reclamation, policy/evaluator reuse meaning, resource pressure policy, device progress, observation payload publication or CUDA sideband mechanisms.

A ranked root-action list is one possible product/policy observation schema. It is not the universal observation contract.

The bounded SESSION-001 prototype found several important semantic failure modes: rejected root changes mutating state before failure, observation publishing materializing search state, stale old-root work contaminating later epochs without an epoch guard, generation ABA on reclaimed-slot reuse, and finite full-arena new-root pressure. Its historical `reroot` operation predates the current four-operation vocabulary and is retained as provenance, not authority for advance semantics.

## CUDA-JS boundary

CUDA-MCGS owns MCGS/search semantics, Search IR/Search Composer, extension composition, finite search resources, Search Session semantics, generated Search Images, universal/product conformance, and the package/adapter contract.

The independent public [`iteathen/CUDA-JS`](https://github.com/iteathen/CUDA-JS) repository owns consumer-neutral Node/CUDA Driver/compiler/linker/artifact/memory/launch/completion/error/teardown mechanics and generic long-lived sideband mechanisms.

CUDA-JS must not know MCGS, Search IR, Search Stages, capabilities, roots, chess moves, rankings, or product output meaning. CUDA-MCGS must not depend on CUDA-JS private source/handles.

## Current specification state

Accepted foundational contracts:

- [`SPEC-0001`](docs/specs/SPEC-0001-device-search-publication-and-resources.md) — device publication/graph identity/parent-edge ownership/path cycles/finite resources/partial-result/scheduler-neutral semantics.
- [`SPEC-0002`](docs/specs/SPEC-0002-search-ir-and-reference-semantics.md) — foundational Search IR 0.1.0 representation, normalization, canonical identity and deterministic reference semantics.

Current universal proposals:

- [`SPEC-0000`](docs/specs/SPEC-0000-framework-requirements.md) — cross-owner LEGO composition, lifecycle, deletion, package and integrated conformance map.
- [`SPEC-0003`](docs/specs/SPEC-0003-search-stage-and-extension-surface.md) — universal Search Stage/surface/base-context/capability semantics.
- [`SPEC-0004`](docs/specs/SPEC-0004-async-stage-channels.md) — universal internal nonblocking channel/readiness semantics.
- [`SPEC-0005`](docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md) — restricted Device-JS/Search Image composition, opaque CUDA-JS-generated outputs and product/capability deletion.
- [`SPEC-0006`](docs/specs/SPEC-0006-search-session-control-and-observation.md) — optional external Search Session root-control and bounded control/observation-request lifecycle coordination; its current root-advance representation is pending ADR-0022 reconciliation under `REF-ROOT-CONTROL-01`.
- [`SPEC-0007`](docs/specs/SPEC-0007-domain-state-action-and-transition.md) — domain state/action/transition/identity/history/role/terminal semantics.
- [`SPEC-0008`](docs/specs/SPEC-0008-search-policy-and-backup.md) — search selection/reservation/widening/value/backup/stopping/reuse semantics.
- [`SPEC-0009`](docs/specs/SPEC-0009-evaluator-contract.md) — optional evaluator capability/request/result/residency/batching/cache/reuse semantics.
- [`SPEC-0010`](docs/specs/SPEC-0010-graph-storage-and-reclamation.md) — graph object/reference/path/transposition/publication/protection/reclamation semantics.
- [`SPEC-0011`](docs/specs/SPEC-0011-finite-search-resources.md) — finite contribution/plan/admission/accounting/pressure/exhaustion semantics.
- [`SPEC-0012`](docs/specs/SPEC-0012-device-owned-search-progress.md) — device-owned readiness/fairness/no-progress/stop/drain/closure semantics.
- [`SPEC-0013`](docs/specs/SPEC-0013-result-and-observation-publication.md) — mandatory terminal and optional immutable live-observation publication semantics.

Downstream product proposal:

- [`CHESS-0001`](docs/specs/products/chess/CHESS-0001-search-product.md) — chess as a consumer/specialization, including future chess-specific ranked legal-move observation.

None of the proposal documents authorize production implementation by themselves.

## Current phase

The repository is **public and pre-release**. CUDA-MCGS is still in framework definition, research, specification and bounded evidence gathering. No production search runtime, stable public API, released CUDA-MCGS/CUDA-JS compatible pair, native Linux support claim, or chess engine release is implied by repository visibility.

The canonical plan is [`next_step.yaml`](next_step.yaml) under parent `CUDA-MCGS-V0/26`. It has separate universal-core, universal-extension-substrate, universal-integration/native, and non-gating downstream product lanes.

## Engineering invariants

- Universal contracts compile into finite specialized hot paths; unused capabilities do not pay permanent runtime cost.
- Active internal search remains device-closed after ignition; no CPU-produced intermediate internal decision is permitted.
- External root, advance, reroot and attention commands may enter only through accepted bounded Search Session contracts and do not make the host a search-progress coordinator.
- Every concrete engine has a finite explicit resource plan; exhaustion and reroot pressure are specified behavior, while advance may not allocate or resize.
- Extensions are least-authority, statically composed before ignition, product-neutral at the substrate boundary, and unable to redefine core invariants through a callback back door.
- Product needs may motivate universal proposals but cannot silently rewrite the framework from a product branch.
- Universal conformance uses materially different synthetic domains/products; chess cannot become the universal oracle.
- CUDA-JS owns generic CUDA runtime/toolchain behavior and remains consumer-neutral.
- Python is prohibited throughout the CUDA-MCGS/CUDA-JS ecosystem, including experiments and one-off scripts.

## Public collaboration and security

The repository uses the normal public fork/branch + pull-request collaboration model. `main` is protected and remains the integration trunk.

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before contributing. Do **not** publish exploitable vulnerability details in an issue; follow [`SECURITY.md`](SECURITY.md).

The historical private-to-public transition checklist remains in [`docs/development/PUBLIC_REPOSITORY.md`](docs/development/PUBLIC_REPOSITORY.md) for provenance/audit; repository visibility is already public and is separate from product release readiness.

## Licensing

CUDA-MCGS is distributed under **AGPL-3.0-or-later**. Organizations that cannot or do not want to comply with the AGPL may request a separately negotiated commercial license from the copyright holder.

See [`LICENSE`](LICENSE) and [`LICENSING.md`](LICENSING.md).

## Start here

- [`docs/PROJECT_CHARTER.md`](docs/PROJECT_CHARTER.md)
- [`docs/decisions/ADR-0018-universal-core-extension-product-layering.md`](docs/decisions/ADR-0018-universal-core-extension-product-layering.md)
- [`docs/architecture/FRAMEWORK_OVERVIEW.md`](docs/architecture/FRAMEWORK_OVERVIEW.md)
- [`docs/specs/README.md`](docs/specs/README.md)
- [`next_step.yaml`](next_step.yaml)
- [`STATUS.md`](STATUS.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`SECURITY.md`](SECURITY.md)
- [`AGENTS.md`](AGENTS.md)
