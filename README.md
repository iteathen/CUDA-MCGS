# CUDA-MCGS

**Universal Monte Carlo Graph Search**

CUDA-MCGS is the product name for the universal GPU-resident MCGS framework currently developed in the `iteathen/UMCGS` repository. Existing accepted UMCGS ADR/specification identifiers remain authoritative until a separate repository/naming migration is explicitly accepted.

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS engine with schema-backed extension support.**

The framework specifies and specializes MCGS-style search systems without embedding assumptions from any one domain, game, model, input representation, output representation, objective, or CUDA execution topology. The intended boundary includes chess, Go, text search, planning, optimization, policy-only search, evaluation-only search, partially observable planning, and other graph-search workloads.

A deployed engine is finite and specialized to its domain, search policy, evaluator, Search Stage graph/capabilities, CUDA capability profile, and GPU-memory budget. Universality lives at contract, schema, and compilation boundaries; the realized hot path contains only what that concrete search requires.

## Repository boundary

CUDA-MCGS/UMCGS owns search semantics, Search IR, finite search-memory planning, search-specific layout/device-program generation, device-owned search progress, schema-backed search extension semantics, reference interpretation, synthetic conformance, and the adapter/package contract used to execute a specialized engine.

The independent public `iteathen/CUDA-JS` repository owns generic Node.js/CUDA Driver bindings, opaque resources, generic memory capabilities, NVRTC/nvJitLink compilation and linking, module loading, launch/completion/error/teardown, packaging, compatibility, and runtime conformance.

```text
CUDA-MCGS contracts + stage capabilities
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

## Stage-resident extension direction

A concrete search has a finite graph of operational **Search Stages**. Semantic category and owned stable invariant define a stage; usefulness validates its granularity. A stage is per logical work item and does not imply a global phase, barrier, kernel, module, or CUDA Graph node.

Each stage may expose a stage-owned **Stage Extension Surface** at stable entry, stable exit, both, or neither. No extension surface exists while stage mutation is incomplete, and no surface crosses a stage boundary. All optional capabilities selected for one stage share its surface, context and finite resource plan.

The selected version-zero device-artifact profile uses zero or one optional composed relocatable **Stage PTX** input per stage: none when no capability is selected, one containing the complete stage capability set otherwise. Stage PTX inputs are linked into the Search Image through CUDA-JS. This is not a runtime callback table, per-feature PTX loop, service locator, or generic pointer escape hatch.

Cross-stage and cross-surface dataflow uses bounded **Async Stage Channels**. Dataflow is allowed; blocking is forbidden. Required unavailable results move a logical work item to a pending state so GPU workers can execute other ready work, including the producer.

Production profiles target these properties:

- stages without selected capabilities retain no extension PTX, call, context, state, resource or synchronization residue;
- several capabilities at one stage share one composed Stage PTX input without generic runtime dispatch;
- all extension code, state, workspace, and required secondary search behavior are resident or preloaded before ignition;
- activation may change on-device during search, but binding, compatibility resolution, code composition, and memory planning do not require host participation after ignition;
- device closure is an execution contract, not a commitment to one persistent-kernel topology.

The first implementation should reuse proven CUDA mechanisms and methodology aggressively while retaining ownership of search-critical semantics and execution architecture. Higher-level libraries such as cuVS, cuFFT, cuCollections, or RAPIDS are references, benchmarks, or explicitly reviewed source donors rather than mandatory active-search runtime dependencies by default.

## Current phase

The project is private, pre-release, and in **framework-definition phase**. The repository is establishing governance, mature-scale organization, versioned search contracts, the complete stage/channel-capable Search IR, Stage PTX composition semantics, inter-repository compatibility, resource constraints, prior-art evidence, conformance strategy, and test architecture before production implementation.

No production CUDA-MCGS implementation should be inferred from the current repository.

## Current accepted direction

The following accepted project/governance direction remains unchanged by the proposal-level extension work:

- Engineering begins with an explicit contract and specification-obligation map, not a file list.
- Candidate paths pass hard gates before safety, correctness, accuracy, speed, reliability, architecture, delivery, and process preferences are compared.
- Contextual value ordering and P0–P4 priority make tradeoffs, path selection, and scheduling reviewable.
- LEGO macroscopic ownership, SOLID internals, CUPID quality, and simplest sufficient total system govern valid designs.
- Adversarial assessment precedes planning; large work uses semantic focus branches and one integration spine.
- Token use is continuous backpressure on **every** task, including routine work.
- Backpressure limits duplication, repeated evidence, fragmented work, cold context, optional breadth, and work in flight before it reduces scope—and reduces scope before it threatens rigor.
- Every task retains a risk-appropriate minimum practice floor: authority/current-state inspection, coherent scope, decisive verification, actual-effect inspection, relevant testing, cleanup, and honest limits.
- Agents read the smallest **authority-complete** document set: mandatory kernel and path instructions, direct governing authority, required normative references, triggered specialist doctrine, and material producer/consumer/lifecycle/test adjacency.
- Accepted documents apply only within scope; proposals, research, architecture, examples, implementation, tests, plans, and summaries remain beneath accepted authority.
- Routine work uses an implicit micro-budget and no document ledger; substantial/critical work preserves exact applicability, revision, invalidation, and final authority refresh where another consumer needs it.
- Soft token estimates trigger replanning rather than automatic stopping or reduced rigor; reduced evidence narrows the claim.
- Consolidated testing banks intents, shares expensive setup, preserves case identity, reuses exact evidence, and repairs root-cause clusters.
- Governed execution uses dependency-ready nodes, expected-before-actual inspection, explicit deviations, and no invalid partial state.
- Cleanup, proportional sanity, exact-head review, guarded merge, and verified post-merge state are mandatory.
- Universal search contracts and Search IR compile into finite specialized hot paths.
- Active search remains device-closed after ignition; no CPU-produced intermediate decision is permitted.
- Generic Node/CUDA runtime work belongs to CUDA-JS rather than shaping UMCGS foundations.
- Device publication, state-node/parent-edge ownership, path-cycle ordering, finite-resource exhaustion, partial-result validity, and scheduler-neutral conformance are accepted in [`docs/specs/SPEC-0001-device-search-publication-and-resources.md`](docs/specs/SPEC-0001-device-search-publication-and-resources.md).
- The foundational backend-neutral Search IR 0.1.0 slice and its deterministic CUDA-free reference semantics are accepted in [`docs/specs/SPEC-0002-search-ir-and-reference-semantics.md`](docs/specs/SPEC-0002-search-ir-and-reference-semantics.md). It covers the SPEC-0001 publication/graph/resource boundary; production lowering and the complete extension-capable Search IR remain blocked on the remaining contracts and experiments.

The current proposal further explores, without yet promoting to accepted authority:

- a single schema-backed semantic extension protocol instead of an open-ended family of optimization-specific callback interfaces;
- CUDA-MCGS ownership of search-semantic/search-critical extension composition;
- contract-defined behavior with schema-backed context/representation;
- semantic per-work-item Search Stages with useful stable entry/exit boundaries and no mid-stage extension mutation;
- specialization that removes unused stage surfaces and Stage PTX inputs from realized hot paths;
- bounded nonblocking Async Stage Channels for cross-stage/cross-surface dataflow;
- device-owned scheduler topology selected by evidence rather than fixed by the phrase "GPU-resident";
- ownership-first third-party reuse: methodology first, explicit source adaptation/vendor decisions when justified, higher-level runtime dependency last.

## Licensing

CUDA-MCGS is distributed under the **GNU Affero General Public License, version 3 or (at your option) any later version** (`AGPL-3.0-or-later`), matching CUDA-JS. Organizations that cannot or do not want to comply with the AGPL may request a separately negotiated commercial license from the copyright holder.

See [`LICENSE`](LICENSE) for the full AGPL text and [`LICENSING.md`](LICENSING.md) for the open-source, commercial, contribution/relicensing, and third-party licensing policy.

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
- [`docs/decisions/ADR-0015-engineering-judgment-and-value-ordering.md`](docs/decisions/ADR-0015-engineering-judgment-and-value-ordering.md)
- [`docs/decisions/ADR-0016-token-backpressure-and-practice-floor.md`](docs/decisions/ADR-0016-token-backpressure-and-practice-floor.md)
- [`docs/decisions/ADR-0017-selective-spec-and-agent-file-reading.md`](docs/decisions/ADR-0017-selective-spec-and-agent-file-reading.md)
- [`docs/architecture/FRAMEWORK_OVERVIEW.md`](docs/architecture/FRAMEWORK_OVERVIEW.md)
- [`docs/specs/SPEC-0000-framework-requirements.md`](docs/specs/SPEC-0000-framework-requirements.md)
- [`docs/research/prior-art/2026-08-10-landscape.md`](docs/research/prior-art/2026-08-10-landscape.md)
- [`docs/architecture/REPOSITORY_TOPOLOGY.md`](docs/architecture/REPOSITORY_TOPOLOGY.md)
- [`docs/specs/SPEC-0001-device-search-publication-and-resources.md`](docs/specs/SPEC-0001-device-search-publication-and-resources.md)
- [`docs/specs/SPEC-0002-search-ir-and-reference-semantics.md`](docs/specs/SPEC-0002-search-ir-and-reference-semantics.md)
- [`docs/specs/SPEC-0003-search-stage-and-extension-surface.md`](docs/specs/SPEC-0003-search-stage-and-extension-surface.md)
- [`docs/specs/SPEC-0004-async-stage-channels.md`](docs/specs/SPEC-0004-async-stage-channels.md)
- [`docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md`](docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md)
- [`STATUS.md`](STATUS.md)
- [`next_step.yaml`](next_step.yaml)
