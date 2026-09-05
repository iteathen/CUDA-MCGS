# CUDA-MCGS

**Universal Monte Carlo Graph Search**

[![Documentation](https://github.com/iteathen/CUDA-MCGS/actions/workflows/docs.yml/badge.svg)](https://github.com/iteathen/CUDA-MCGS/actions/workflows/docs.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

CUDA-MCGS is a public pre-release project defining a finite GPU-resident Monte Carlo Graph Search framework.

## Current reality

**There is no released CUDA-MCGS package and no physically qualified CUDA-MCGS production runtime yet.** A private development package manifest now exists so the prerelease public library boundary can be packed, installed and falsified as an exact artifact before release.

What exists today:

- accepted universal search contracts and Search IR/schema authority;
- a production Search Compiler component for canonical pre-ignition normalization/composition;
- a production `interface.library` prerelease facade plus explicit complete Search Compiler/runtime-adapter package subpaths;
- a private `cuda-mcgs@0.0.0-dev.0` development package/export map used for exact installed-artifact qualification, not publication;
- a production public CUDA-JS adapter boundary and runner-ready exact compatible-pair capsule;
- deterministic CUDA-free reference/conformance evidence and repository/document validation.

What does **not** exist today:

- a released npm CUDA-MCGS package;
- a physically qualified CUDA-MCGS/CUDA-JS compatible pair;
- a stable 1.0 public API;
- a qualified production GPU search release;
- a chess-engine release;
- native Linux CUDA-MCGS support or performance claims.

Specification status is explicit. Accepted foundational contracts include [`SPEC-0001`](docs/specs/SPEC-0001-device-search-publication-and-resources.md) and [`SPEC-0002`](docs/specs/SPEC-0002-search-ir-and-reference-semantics.md); the accepted universal 0.2 semantic family is indexed in [`docs/specs/README.md`](docs/specs/README.md). [`SPEC-0014`](docs/specs/SPEC-0014-public-library-interface.md) governs the prerelease public package/facade boundary without changing CUDA-JS ownership. Proposal documents do not authorize production implementation merely by existing.

## Verify what exists

Run the repository/document gate:

```bash
./scripts/verify-docs.sh
```

Run bounded reference semantics directly:

```bash
node scripts/run-search-ir-reference.mjs
node scripts/run-search-ir-composer-reference.mjs
node scripts/run-search-semantics-reference.mjs
```

Pack, install and exercise the exact prerelease public library artifact:

```bash
node scripts/run-library-interface.mjs
```

The installed-library check uses a temporary external-consumer directory and public package exports only. These checks are **not** physical GPU/runtime qualification. CUDA-JS #32 remains the accepted physical compatible-pair evidence gate.

Current project state and the dependency-ready next action live in [`STATUS.md`](STATUS.md) and [`next_step.yaml`](next_step.yaml).

## Public library surface

The private development package exposes progressive disclosure without introducing another runtime or semantic interpreter:

- `cuda-mcgs` — prerelease convenience facade (`resolve`, `tryResolve`, `compose`, `tryCompose`) over the one canonical Search Compiler path;
- `cuda-mcgs/search-compiler` — the complete production Search Compiler public port;
- `cuda-mcgs/runtime/cuda-js` — the explicit production runtime-adapter port, which still requires an injected public CUDA-JS namespace when actually used;
- `cuda-mcgs/schemas/search-ir/0.2.0/*` — explicit versioned low-level schema access.

Omitting the facade generator selects only the Search Compiler-owned neutral reference generator. Material default provenance remains in the canonical resolved input. Runtime creation is never a side effect of the root facade. Deep/private implementation and testing ports are not package exports.

This is a prerelease qualification surface, not an npm-release or compatibility-stability promise.

## What CUDA-MCGS is intended to own

CUDA-MCGS owns product-neutral search meaning and composition:

- state/action/transition/history and graph semantics;
- selection, reservation, widening, backup, stopping, and result semantics without assuming one game or evaluator shape;
- finite search resources, pressure, failure, and cleanup;
- device-owned search progress after ignition;
- Search IR, deterministic specialization, and public CUDA-JS adapter meaning;
- optional bounded extension/session mechanisms when their owning specifications are accepted.

It does **not** own CUDA Driver/compiler/memory mechanics, tensor mathematics, chess rules, or product-specific output policy. Those stay behind public contracts owned by CUDA-JS, CUDA-JS-Tensor, or the downstream product.

## Architecture, briefly

```text
domain/product contracts
        |
        v
    CUDA-MCGS
 search semantics / Search IR / specialization
        |
        v
      CUDA-JS
 runtime / compiler / memory / execution
        |
        v
       GPU
```

Optional extension and session capabilities compose at owned semantic boundaries; they do not turn the universal core into a callback framework or a first-product-specific engine.

Detailed design rationale belongs in the architecture/ADR/specification documents rather than in this README. Start with:

- [`docs/PROJECT_CHARTER.md`](docs/PROJECT_CHARTER.md)
- [`docs/architecture/FRAMEWORK_OVERVIEW.md`](docs/architecture/FRAMEWORK_OVERVIEW.md)
- [`docs/specs/README.md`](docs/specs/README.md)
- [`STATUS.md`](STATUS.md)
- [`next_step.yaml`](next_step.yaml)

## Development rule

Architecture exists to survive executable falsification, not to substitute for it.

Once an ownership boundary is sufficiently specified and its dependencies are ready, prefer the thinnest meaningful end-to-end slice through the intended public CUDA-MCGS/CUDA-JS contracts before adding more universal layering. Additional scheduler sophistication, concurrency, optimization, extension machinery, or API breadth requires a real consumer need, a failed vertical proof, or measured evidence.

A need for direct native CUDA code or private CUDA-JS access inside CUDA-MCGS is treated as evidence of a possible missing consumer-neutral CUDA-JS capability and must be classified before implementation.

## Downstream products

Chess, Go, planning, optimization, text search, evaluation-only search, and other workloads are consumers/specializations rather than definitions of the universal core. Product work may expose missing universal contracts, but it may not silently export product semantics into CUDA-MCGS.

The UCI chess-engine product lives separately in [`iteathen/UCI-Arena-Vector`](https://github.com/iteathen/UCI-Arena-Vector).

## Contributing and security

Read [`AGENTS.md`](AGENTS.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md) before changing the repository. Tool-specific files such as `CLAUDE.md` and `GEMINI.md` are intentionally only pointers to the canonical agent instructions.

Report vulnerabilities privately according to [`SECURITY.md`](SECURITY.md); do not disclose exploitable details in public issues.

CUDA-MCGS is licensed under [AGPL-3.0-or-later](LICENSE). Separate commercial terms may be available; see [`LICENSING.md`](LICENSING.md).
