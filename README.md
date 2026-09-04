# CUDA-MCGS

**Universal Monte Carlo Graph Search**

[![Documentation](https://github.com/iteathen/CUDA-MCGS/actions/workflows/docs.yml/badge.svg)](https://github.com/iteathen/CUDA-MCGS/actions/workflows/docs.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

CUDA-MCGS is a public pre-release project defining a finite GPU-resident Monte Carlo Graph Search framework.

## Current reality

**There is no production CUDA-MCGS runtime or installable package yet. You cannot run a GPU search from this repository today.**

What exists today:

- accepted and proposed search contracts;
- Search IR/schema work;
- a production Search Compiler component for canonical pre-ignition normalization/composition, plus bounded independent reference/conformance evidence;
- repository/document validation;
- public adapter and ownership definitions for future CUDA-JS integration.

What does **not** exist today:

- a released CUDA-MCGS package;
- a production GPU search engine;
- a qualified CUDA-MCGS/CUDA-JS compatible pair;
- a stable public API;
- a chess-engine release;
- native Linux CUDA-MCGS support or performance claims.

Specification status is explicit. Accepted foundational contracts currently include [`SPEC-0001`](docs/specs/SPEC-0001-device-search-publication-and-resources.md) and [`SPEC-0002`](docs/specs/SPEC-0002-search-ir-and-reference-semantics.md); proposal documents do not authorize production implementation merely by existing. See [`docs/specs/README.md`](docs/specs/README.md) for the current authoritative list.

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

These checks exercise documentation, schema/reference behavior, and semantic contracts. They are **not** GPU-runtime qualification.

Current project state and the dependency-ready next action live in [`STATUS.md`](STATUS.md) and [`next_step.yaml`](next_step.yaml).

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
