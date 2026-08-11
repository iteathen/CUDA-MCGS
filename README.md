# UMCGS

**Universal Monte Carlo Graph Search**

UMCGS is a documentation-first project for a universal, GPU-resident framework that specifies and specializes many MCGS-style search systems without embedding assumptions from any one domain, game, model, input representation, output representation, or objective.

The intended boundary includes chess, Go, text search, planning, optimization, policy-only search, evaluation-only search, partially observable planning, and other graph-search workloads. A deployed engine is finite and specialized to its domain, search policy, evaluator, CUDA capability profile, and GPU-memory budget.

## Repository boundary

UMCGS owns search semantics, Search IR, finite search-memory planning, search-specific layout/device-program generation, device-owned search progress, reference interpretation, synthetic conformance, and the adapter/package contract used to execute a specialized engine.

The independent private `iteathen/CUDA-JS` repository owns generic Node.js/CUDA Driver bindings, JIT/native host-call backends, opaque resources, generic memory capabilities, NVRTC/link/load, launch/completion/error/teardown, packaging, and runtime conformance.

```text
UMCGS execution package → UMCGS CUDA-JS adapter → CUDA-JS → CUDA Driver / GPU
```

CUDA-JS must not know Search IR or MCGS. UMCGS must not reach into CUDA-JS private source. See [`docs/decisions/ADR-0014-extract-cuda-js-runtime.md`](docs/decisions/ADR-0014-extract-cuda-js-runtime.md).

## Current phase

The project is private, pre-release, and in **framework-definition phase**. The repository is establishing governance, mature-scale organization, versioned search contracts, inter-repository compatibility, resource constraints, prior-art evidence, conformance strategy, and test architecture before production implementation.

No production implementation should be inferred from the current repository.

## Current accepted direction

- Engineering begins with an explicit contract and specification-obligation map, not a file list.
- Candidate paths pass hard gates before safety, correctness, accuracy, speed, reliability, architecture, delivery, and process preferences are compared.
- Contextual value ordering and P0–P4 priority make tradeoffs, path selection, and scheduling reviewable.
- LEGO macroscopic ownership, SOLID internals, CUPID quality, and simplest sufficient total system govern valid designs.
- Adversarial assessment precedes planning; large work uses semantic focus branches and one integration spine.
- Token use is continuous backpressure on **every** task, including routine work.
- Backpressure limits duplication, repeated evidence, fragmented work, cold context, optional breadth, and work in flight before it reduces scope—and reduces scope before it threatens rigor.
- Every task retains a risk-appropriate minimum practice floor: authority/current-state inspection, coherent scope, decisive verification, actual-effect inspection, relevant testing, cleanup, and honest limits.
- Agents read the smallest **authority-complete** document set: mandatory kernel and path instructions, direct governing authority, required normative references, triggered specialist doctrine, and material producer/consumer/lifecycle/test adjacency.
- Accepted documents apply only within scope; proposals, research, architecture, examples, tests, plans, and summaries remain beneath accepted authority.
- Routine work uses an implicit micro-budget and no document ledger; substantial/critical work preserves exact applicability, revision, invalidation, and final authority refresh where another consumer needs it.
- Soft token estimates trigger replanning rather than automatic stopping or reduced rigor; reduced evidence narrows the claim.
- Consolidated testing banks intents, shares expensive setup, preserves case identity, reuses exact evidence, and repairs root-cause clusters.
- Governed execution uses dependency-ready nodes, expected-before-actual inspection, explicit deviations, and no invalid partial state.
- Cleanup, proportional sanity, exact-head review, guarded merge, and verified post-merge state are mandatory.
- Universal search contracts and Search IR compile into finite specialized hot paths.
- Active search remains device-closed after ignition; no CPU-produced intermediate decision is permitted.
- Generic Node/CUDA runtime work belongs to CUDA-JS rather than shaping UMCGS foundations.

## Start here

- [`AGENTS.md`](AGENTS.md)
- [`agent_files/README.md`](agent_files/README.md)
- [`agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md`](agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md)
- [`agent_files/general_foundation/CONTEXT_ROUTING.md`](agent_files/general_foundation/CONTEXT_ROUTING.md)
- [`agent_files/general_foundation/TOKEN_DISCIPLINE.md`](agent_files/general_foundation/TOKEN_DISCIPLINE.md)
- [`agent_files/general_foundation/ENGINEERING_JUDGMENT.md`](agent_files/general_foundation/ENGINEERING_JUDGMENT.md)
- [`agent_files/general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md`](agent_files/general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md)
- [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md)
- [`agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md)
- [`agent_files/general_foundation/FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md)
- [`agent_files/general_foundation/TESTING.md`](agent_files/general_foundation/TESTING.md)
- [`docs/PROJECT_CHARTER.md`](docs/PROJECT_CHARTER.md)
- [`docs/decisions/ADR-0017-selective-spec-and-agent-file-reading.md`](docs/decisions/ADR-0017-selective-spec-and-agent-file-reading.md)
- [`docs/architecture/REPOSITORY_TOPOLOGY.md`](docs/architecture/REPOSITORY_TOPOLOGY.md)
- [`STATUS.md`](STATUS.md)
- [`next_step.yaml`](next_step.yaml)
