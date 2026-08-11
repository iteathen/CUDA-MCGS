# CUDA-MCGS

**Universal Monte Carlo Graph Search**

CUDA-MCGS is the product name for the universal GPU-resident MCGS framework currently developed in the `iteathen/UMCGS` repository. Existing accepted UMCGS ADR/specification identifiers remain authoritative until a separate repository/naming migration is explicitly accepted.

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS engine with schema-backed extension support.**

The framework specifies and specializes MCGS-style search systems without embedding assumptions from any one domain, game, model, input representation, output representation, objective, or CUDA execution topology. The intended boundary includes chess, Go, text search, planning, optimization, policy-only search, evaluation-only search, partially observable planning, and other graph-search workloads.

A deployed engine is finite and specialized to its domain, search policy, evaluator, selected extensions, CUDA capability profile, and GPU-memory budget. Universality lives at contract, schema, and compilation boundaries; the realized hot path contains only what that concrete search requires.

## Repository boundary

CUDA-MCGS/UMCGS owns search semantics, Search IR, finite search-memory planning, search-specific layout/device-program generation, device-owned search progress, schema-backed search extension semantics, reference interpretation, synthetic conformance, and the adapter/package contract used to execute a specialized engine.

The independent public `iteathen/CUDA-JS` repository owns generic Node.js/CUDA Driver bindings, opaque resources, generic memory capabilities, NVRTC/nvJitLink compilation and linking, module loading, launch/completion/error/teardown, packaging, compatibility, and runtime conformance.

```text
CUDA-MCGS contracts + extensions
        ↓
Search IR + Search Composer
        ↓
specialized execution package / device image
        ↓
CUDA-MCGS CUDA-JS adapter
        ↓
CUDA-JS
        ↓
CUDA Driver / GPU
```

CUDA-JS must not know Search IR or MCGS. CUDA-MCGS must not reach into CUDA-JS private source. See [`docs/decisions/ADR-0014-extract-cuda-js-runtime.md`](docs/decisions/ADR-0014-extract-cuda-js-runtime.md).

## Extension direction

A search exposes an **Extension Surface** made of semantic **Extension Points**. Every point is governed by an Extension Contract and a point-specific Context Schema. Optional device implementations are **Extension Fragments** selected and validated before search ignition, then incorporated into the specialized search image.

The extension mechanism is uniform; the points and schemas are search-specific. It is not a runtime callback table, service locator, or generic `void *` escape hatch.

Production profiles target these properties:

- unbound extension points impose no abstraction overhead in the realized search image;
- bound extensions impose no generic dispatch overhead beyond their intrinsic work and resource cost;
- all extension code, state, workspace, and required secondary search behavior are resident or preloaded before ignition;
- activation may change on-device during search, but binding, compatibility resolution, code composition, and memory planning do not require host participation after ignition;
- device closure is an execution contract, not a commitment to one persistent-kernel topology.

The first implementation should reuse proven CUDA mechanisms and methodology aggressively while retaining ownership of search-critical semantics and execution architecture. Higher-level libraries such as cuVS, cuFFT, cuCollections, or RAPIDS are references, benchmarks, or explicitly reviewed source donors rather than mandatory active-search runtime dependencies by default.

## Current phase

The project is private, pre-release, and in **framework-definition phase**. The repository is establishing versioned search contracts, the Search IR, extension composition semantics, CUDA-JS interoperability, finite-resource rules, prior-art evidence, conformance strategy, and experiments before production implementation.

No production CUDA-MCGS implementation should be inferred from the current repository.

## Current accepted direction

- Universal search contracts and Search IR compile into finite specialized hot paths.
- Active search remains device-closed after ignition; no CPU-produced intermediate decision is permitted.
- Generic Node/CUDA runtime work belongs to CUDA-JS rather than shaping CUDA-MCGS foundations.
- The search-semantic and search-critical extension/composition model remains CUDA-MCGS-owned.
- Schemas make boundary/context representation machine-verifiable; contracts define meaning, permissions, invariants, lifetime, ordering, failure, and resource behavior.
- A single schema-backed extension protocol replaces an open-ended family of optimization-specific callback interfaces.
- Unused capabilities are specialized away rather than carried through one universal runtime object or callback table.
- CUDA scheduling topology remains a measured implementation choice under the device-closure contract.
- Third-party methodology is reused freely; third-party implementation reuse requires exact revision, license, provenance, ownership, and an explicit dependency/source-reuse decision.
- Engineering begins with an explicit contract and specification-obligation map, not a file list.
- Candidate paths pass hard gates before performance, maintainability, delivery, and process preferences are compared.
- LEGO macroscopic ownership, SOLID internals, CUPID quality, and simplest sufficient total system govern valid designs.
- Adversarial assessment precedes planning; large work uses semantic focus branches and one integration spine.
- Token use is continuous backpressure on every task without lowering the risk-appropriate practice floor.
- Consolidated testing, governed execution, cleanup, proportional sanity, exact-head review, guarded merge, and verified post-merge state remain mandatory.

## Start here

- [`AGENTS.md`](AGENTS.md)
- [`agent_files/README.md`](agent_files/README.md)
- [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md)
- [`agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md)
- [`agent_files/general_foundation/FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md)
- [`agent_files/general_foundation/TESTING.md`](agent_files/general_foundation/TESTING.md)
- [`docs/PROJECT_CHARTER.md`](docs/PROJECT_CHARTER.md)
- [`docs/architecture/FRAMEWORK_OVERVIEW.md`](docs/architecture/FRAMEWORK_OVERVIEW.md)
- [`docs/specs/SPEC-0000-framework-requirements.md`](docs/specs/SPEC-0000-framework-requirements.md)
- [`docs/research/prior-art/2026-08-10-landscape.md`](docs/research/prior-art/2026-08-10-landscape.md)
- [`docs/architecture/REPOSITORY_TOPOLOGY.md`](docs/architecture/REPOSITORY_TOPOLOGY.md)
- [`STATUS.md`](STATUS.md)
- [`next_step.yaml`](next_step.yaml)
