# UMCGS

**Universal Monte Carlo Graph Search**

UMCGS is a documentation-first project for a universal, GPU-resident framework that specifies and specializes many MCGS-style search systems without embedding assumptions from any one domain, game, model, input representation, output representation, or objective.

A deployed engine is finite and specialized to its domain, search policy, evaluator, CUDA capability profile, and GPU-memory budget.

## Repository boundary

UMCGS owns search semantics, Search IR, finite search-memory planning, search-specific layout/device-program generation, device-owned search progress, reference interpretation, synthetic conformance, and the adapter/package contract used to execute a specialized engine.

The independent private `iteathen/CUDA-JS` repository owns generic Node.js/CUDA Driver bindings, JIT/native host-call backends, opaque resources, generic memory capabilities, NVRTC/link/load, launch/completion/error/teardown, packaging, and runtime conformance.

```text
UMCGS execution package → UMCGS CUDA-JS adapter → CUDA-JS → CUDA Driver / GPU
```

## Current phase

The project is private, pre-release, and in framework-definition phase. No production implementation should be inferred from the current repository.

## Current accepted direction

- Engineering begins with an explicit contract and specification-obligation map.
- Candidate paths pass hard gates before value preferences are compared.
- LEGO ownership, SOLID internals, CUPID quality, and simplest sufficient total system govern valid designs.
- Large work uses semantic focus branches and one integration spine.
- **Token use is backpressure on every task.** It limits work in flight, duplicated context, repeated tests/retries, optional breadth, and administrative overhead.
- Token pressure never lowers the risk-appropriate minimum practice floor. Agents reduce waste and optional scope before authority, reasoning, testing, actual-effect inspection, review, recovery, or cleanup.
- Routine work uses an implicit micro-budget; substantial/critical work preserves explicit reserves and split/handoff rules.
- Soft budget overruns trigger replanning rather than automatic stopping or reduced rigor.
- Reduced evidence narrows the claim; a sampled or lower-tier result cannot masquerade as complete evidence.
- Consolidated testing banks intents, shares safe setup, preserves case identity, reuses exact evidence, and repairs root-cause clusters.
- Governed execution, cleanup, proportional sanity, exact-head review, guarded merge, and verified post-merge state are mandatory.
- Active search remains device-closed after ignition.
- Generic Node/CUDA runtime work belongs to CUDA-JS rather than shaping UMCGS foundations.

## Start here

- [`AGENTS.md`](AGENTS.md)
- [`agent_files/README.md`](agent_files/README.md)
- [`agent_files/general_foundation/TOKEN_DISCIPLINE.md`](agent_files/general_foundation/TOKEN_DISCIPLINE.md)
- [`agent_files/general_foundation/ENGINEERING_JUDGMENT.md`](agent_files/general_foundation/ENGINEERING_JUDGMENT.md)
- [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md)
- [`agent_files/general_foundation/FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md)
- [`agent_files/general_foundation/TESTING.md`](agent_files/general_foundation/TESTING.md)
- [`docs/PROJECT_CHARTER.md`](docs/PROJECT_CHARTER.md)
- [`docs/decisions/ADR-0016-token-backpressure-and-practice-floor.md`](docs/decisions/ADR-0016-token-backpressure-and-practice-floor.md)
- [`STATUS.md`](STATUS.md)
- [`next_step.yaml`](next_step.yaml)
