# CUDA-MCGS

**Universal Monte Carlo Graph Search**

CUDA-MCGS is a public pre-release framework for specifying, specializing, and executing finite GPU-resident Monte Carlo Graph Search systems across unrelated domains and evaluator types.

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS framework with a universal least-authority extension/composition substrate and finite specialized Search Images.**

The core must not inherit the shape of the first product. Chess, Go, planning, optimization, text search, evaluation-only search, partially observable search, and future MCGS-style workloads are consumers/specializations rather than definitions of universal CUDA-MCGS.

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
- optional long-lived Search Session/root-update/reroot semantics;
- generic bounded result/observation publication;
- Search IR, Search Composer, deterministic specialization, conformance and execution-package meaning.

The universal core does **not** require a board, players, legal moves, ranked moves, best-action/top-k output, scalar value, policy prior, one evaluator architecture, or one scheduler topology.

### 2. Universal extension/composition substrate

CUDA-MCGS provides a universal way to extend a specialized engine without turning the core into a callback framework:

- semantic per-work-item **Search Stages**;
- stable least-authority entry/exit **Stage Extension Surfaces**;
- a minimal universal base checkpoint context;
- namespaced/versioned selected capability contracts and specialization-only context/state/resources;
- bounded nonblocking internal **Async Stage Channels**;
- deterministic pre-ignition composition;
- zero-or-one optional semantic **stage capability program unit** per stage in restricted Device-JS/Search Program source.

The **substrate is universal; an individual capability's semantics are not automatically universal**. Product-specific capability fields exist only in Search Images selecting them. If a capability changes domain/policy/evaluator/output/session meaning, that effect must also be owned by the selected corresponding contract/profile.

Absent capabilities should leave no solely extension-owned code/context/state/resource/synchronization residue in a conforming specialized image.

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

- finite root epochs;
- root-update validation/admission **before** root-update-specific mutation;
- typed full-arena root admission/pressure behavior;
- old-epoch work disposition;
- explicit retain/retain-if-key-valid/transform/reset/invalidate reuse classification;
- separation of logical reroot from generation-safe reclamation;
- generic bounded **read-only** live observations;
- stale-safe finite generation/counter exhaustion and restart behavior.

A ranked root-action list is one possible product/policy observation schema. It is not the universal observation contract.

The bounded SESSION-001 prototype found several important semantic failure modes: rejected root updates mutating state before failure, observation publishing materializing search state, stale old-root work contaminating later epochs without an epoch guard, generation ABA on reclaimed-slot reuse, and finite full-arena new-root pressure. Those lessons are folded into the proposal specs; the prototype itself is not production authority.

## CUDA-JS boundary

CUDA-MCGS owns MCGS/search semantics, Search IR/Search Composer, extension composition, finite search resources, Search Session semantics, generated Search Images, universal/product conformance, and the package/adapter contract.

The independent public [`iteathen/CUDA-JS`](https://github.com/iteathen/CUDA-JS) repository owns consumer-neutral Node/CUDA Driver/compiler/linker/artifact/memory/launch/completion/error/teardown mechanics and generic long-lived sideband mechanisms.

CUDA-JS must not know MCGS, Search IR, Search Stages, capabilities, roots, chess moves, rankings, or product output meaning. CUDA-MCGS must not depend on CUDA-JS private source/handles.

## Current specification state

Accepted foundational contracts:

- [`SPEC-0001`](docs/specs/SPEC-0001-device-search-publication-and-resources.md) — device publication/graph identity/parent-edge ownership/path cycles/finite resources/partial-result/scheduler-neutral semantics.
- [`SPEC-0002`](docs/specs/SPEC-0002-search-ir-and-reference-semantics.md) — foundational Search IR 0.1.0 representation, normalization, canonical identity and deterministic reference semantics.

Current universal proposals:

- [`SPEC-0000`](docs/specs/SPEC-0000-framework-requirements.md) — complete three-layer framework map.
- [`SPEC-0003`](docs/specs/SPEC-0003-search-stage-and-extension-surface.md) — universal Search Stage/surface/base-context/capability semantics.
- [`SPEC-0004`](docs/specs/SPEC-0004-async-stage-channels.md) — universal internal nonblocking channel/readiness semantics.
- [`SPEC-0005`](docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md) — restricted Device-JS/Search Image composition, opaque CUDA-JS-generated outputs and product/capability deletion.
- [`SPEC-0006`](docs/specs/SPEC-0006-search-session-control-and-observation.md) — generic Search Session/root-update/reroot/reclamation/read-only observation semantics.

Downstream product proposal:

- [`CHESS-0001`](docs/specs/products/chess/CHESS-0001-search-product.md) — chess as a consumer/specialization, including future chess-specific ranked legal-move observation.

None of the proposal documents authorize production implementation by themselves.

## Current phase

The repository is **public and pre-release**. CUDA-MCGS is still in framework definition, research, specification and bounded evidence gathering. No production search runtime, stable public API, released CUDA-MCGS/CUDA-JS compatible pair, native Linux support claim, or chess engine release is implied by repository visibility.

The canonical plan is [`next_step.yaml`](next_step.yaml), plan 16. It has separate universal-core, universal-extension-substrate, universal-integration/native, and non-gating downstream chess product lanes.

## Engineering invariants

- Universal contracts compile into finite specialized hot paths; unused capabilities do not pay permanent runtime cost.
- Active internal search remains device-closed after ignition; no CPU-produced intermediate internal decision is permitted.
- External environment/root updates may enter only through accepted bounded Search Session contracts and do not make the host a search-progress coordinator.
- Every concrete engine has a finite explicit resource plan; exhaustion and root-update pressure are specified behavior.
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
