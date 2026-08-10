# UMCGS

**Universal Monte Carlo Graph Search**

UMCGS is a documentation-first project for a universal, GPU-resident framework that specifies and specializes many MCGS-style search systems without embedding assumptions from any one domain, game, model, input representation, output representation, or objective.

The intended boundary includes chess, Go, text search, planning, optimization, policy-only search, evaluation-only search, partially observable planning, and other graph-search workloads. A deployed engine is finite and specialized to its domain, search policy, evaluator, CUDA capability profile, and GPU-memory budget.

## Repository boundary

UMCGS owns search semantics, Search IR, finite search-memory planning, search-specific layout/device-program generation, device-owned search progress, reference interpretation, synthetic conformance, and the adapter/package contract used to execute a specialized engine.

The independent private `iteathen/CUDA-JS` repository owns generic Node.js/CUDA Driver bindings, JIT/native host-call backends, opaque resources, generic memory capabilities, NVRTC/link/load, launch/completion/error/teardown, packaging, and runtime conformance.

Dependency direction is one-way:

```text
UMCGS execution package → UMCGS CUDA-JS adapter → CUDA-JS → CUDA Driver / GPU
```

CUDA-JS must not know Search IR or MCGS. UMCGS must not reach into CUDA-JS private source. The adapter remains in UMCGS until it has an independent lifecycle. See [`docs/decisions/ADR-0014-extract-cuda-js-runtime.md`](docs/decisions/ADR-0014-extract-cuda-js-runtime.md).

## Current phase

The project is private, pre-release, and in **framework-definition phase**. The repository is establishing governance, mature-scale organization, versioned search contracts, inter-repository compatibility, resource constraints, prior-art evidence, conformance strategy, and test architecture before production implementation.

No production implementation should be inferred from the current repository.

## Current accepted direction

- Adversarial assessment before planning, with proportional documentation and decisive falsifiers.
- Semantic focus branches for large or complex tasks, with one parent integration spine and central reconciliation.
- Token-use discipline that reserves context for validation, integration, cleanup, and handoff.
- Consolidated testing that banks intents, shares expensive setup, preserves case identity, reuses exact evidence, and repairs failure clusters by root cause.
- Governed dependency-ready execution with expected-before-actual inspection and explicit deviations.
- Explicit cleanup and artifact disposition across local, GitHub, device, credential, generated, and external state.
- Proportional sanity checking, exact-head review, guarded merge, and verified post-merge state.
- LEGO macroscopic ownership, SOLID internals, CUPID quality, and simplest sufficient total system.
- Universal search contracts and Search IR with specialized generated hot paths.
- Explicit finite GPU-memory planning before engine creation.
- No CPU-produced intermediate decision after search ignition.
- Search state, selected engine, resident evaluator/model, queues, and intermediate results remain device-resident during active search.
- Generic Node/CUDA runtime work is extracted to CUDA-JS rather than shaping UMCGS foundations.

## Start here

- [`AGENTS.md`](AGENTS.md)
- [`agent_files/README.md`](agent_files/README.md)
- [`docs/PROJECT_CHARTER.md`](docs/PROJECT_CHARTER.md)
- [`docs/decisions/ADR-0014-extract-cuda-js-runtime.md`](docs/decisions/ADR-0014-extract-cuda-js-runtime.md)
- [`docs/architecture/REPOSITORY_TOPOLOGY.md`](docs/architecture/REPOSITORY_TOPOLOGY.md)
- [`docs/architecture/FRAMEWORK_OVERVIEW.md`](docs/architecture/FRAMEWORK_OVERVIEW.md)
- [`docs/research/2026-08-10-cuda-js-assumption-audit.md`](docs/research/2026-08-10-cuda-js-assumption-audit.md)
- [`agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md)
- [`agent_files/general_foundation/FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md)
- [`agent_files/general_foundation/TOKEN_DISCIPLINE.md`](agent_files/general_foundation/TOKEN_DISCIPLINE.md)
- [`agent_files/general_foundation/TESTING.md`](agent_files/general_foundation/TESTING.md)
- [`STATUS.md`](STATUS.md)
- [`next_step.yaml`](next_step.yaml)