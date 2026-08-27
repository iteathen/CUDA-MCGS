# Documentation Index

**Status:** Informational

CUDA-MCGS is the product-facing name of the universal MCGS framework hosted in `iteathen/CUDA-MCGS`. Existing accepted CUDA-MCGS ADR/specification identifiers remain authoritative until a separate identifier migration is accepted.

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS engine with schema-backed extension support.**

## Start here

- [`PROJECT_CHARTER.md`](PROJECT_CHARTER.md) — accepted CUDA-MCGS/CUDA-MCGS search mission and boundary.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — public fork/PR workflow and contributor-license grant.
- [`../SECURITY.md`](../SECURITY.md) — private vulnerability reporting and public security posture.
- [`../LICENSING.md`](../LICENSING.md) — AGPL-3.0-or-later, commercial licensing, contribution/relicensing, and third-party boundaries.
- [`development/PUBLIC_REPOSITORY.md`](development/PUBLIC_REPOSITORY.md) — public-visibility readiness, history/secret audit, CI/protection, and post-switch verification checklist.
- [`../agent_files/README.md`](../agent_files/README.md) — canonical developer/agent system.
- [`../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md`](../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md) — selective authority discovery and semantic closure.
- [`../agent_files/general_foundation/ENGINEERING_JUDGMENT.md`](../agent_files/general_foundation/ENGINEERING_JUDGMENT.md) — specification alignment, path selection, value ordering, tradeoffs, and priority.
- [`decisions/README.md`](decisions/README.md) — accepted decisions.
- [`architecture/README.md`](architecture/README.md) — explanatory Search Stage/surface/channel/Search Composer proposal and repository topology.
- [`specs/README.md`](specs/README.md) — normative search-contract families, conformance requirements, and current proposals.
- [`research/README.md`](research/README.md) — prior art and external technical evidence.
- [`development/README.md`](development/README.md) — development method.
- [`archive/README.md`](archive/README.md) — superseded-history policy.
- [`../next_step.yaml`](../next_step.yaml) — current canonical plan spine; revise this rather than creating a competing master plan.

Public repository visibility is a collaboration/publication state, **not** a CUDA-MCGS product release, stable API promise, native platform qualification, or compatible-pair acceptance claim.

## Current accepted decisions

- Build the framework as a new search-semantic core and use prior art as bounded references/benchmarks unless an explicit reuse decision says otherwise. See [`decisions/ADR-0001-prior-art-disposition.md`](decisions/ADR-0001-prior-art-disposition.md).
- Preserve universality in versioned contracts while compiling finite specialized engines. See [`decisions/ADR-0002-universal-contracts-specialized-engines.md`](decisions/ADR-0002-universal-contracts-specialized-engines.md).
- Keep active production search device-resident after ignition. See [`decisions/ADR-0003-device-resident-active-search.md`](decisions/ADR-0003-device-resident-active-search.md).
- Organize for mature project scale from inception. See [`decisions/ADR-0004-large-project-organization.md`](decisions/ADR-0004-large-project-organization.md).
- Apply the LEGO design hierarchy and judge simplicity across the total system. See [`decisions/ADR-0005-lego-design-hierarchy.md`](decisions/ADR-0005-lego-design-hierarchy.md).
- Assess adversarially before planning and keep records proportional. See [`decisions/ADR-0006-adversarial-assessment-and-planning.md`](decisions/ADR-0006-adversarial-assessment-and-planning.md).
- Use exact proportional sanity claims and central reconciliation. See [`decisions/ADR-0007-proportional-sanity-checking.md`](decisions/ADR-0007-proportional-sanity-checking.md).
- Review exact PR heads, merge through a guarded transaction, and verify integration. See [`decisions/ADR-0008-exact-head-pr-review-and-guarded-merge.md`](decisions/ADR-0008-exact-head-pr-review-and-guarded-merge.md).
- Execute only ready nodes, inspect/falsify coherent operations, and revise deviations. See [`decisions/ADR-0009-governed-plan-execution.md`](decisions/ADR-0009-governed-plan-execution.md).
- Explicitly disposition local, remote, generated, sensitive, external, partial, and coordination state. See [`decisions/ADR-0010-cleanup-reconciliation-and-artifact-disposition.md`](decisions/ADR-0010-cleanup-reconciliation-and-artifact-disposition.md).
- Use semantic focus branches with one parent integration spine for large/complex work. See [`decisions/ADR-0011-focus-branch-decomposition-and-integration.md`](decisions/ADR-0011-focus-branch-decomposition-and-integration.md).
- Optimize verified lifecycle progress per token and prevent token debt. See [`decisions/ADR-0012-token-use-and-context-discipline.md`](decisions/ADR-0012-token-use-and-context-discipline.md).
- Consolidate test intents into owning capsules and repair failure clusters by root cause. See [`decisions/ADR-0013-consolidated-testing-and-repair-loop-efficiency.md`](decisions/ADR-0013-consolidated-testing-and-repair-loop-efficiency.md).
- Extract the generic Node/CUDA runtime into independent `CUDA-JS`; retain search semantics and the adapter in this repository. See [`decisions/ADR-0014-extract-cuda-js-runtime.md`](decisions/ADR-0014-extract-cuda-js-runtime.md).
- Separate universal MCGS meaning, reusable extension/composition mechanics, and downstream products. See [`decisions/ADR-0018-universal-core-extension-product-layering.md`](decisions/ADR-0018-universal-core-extension-product-layering.md).
- Keep maintained CUDA-MCGS production source JavaScript-only as ordinary Node.js plus restricted Device-JS, while CUDA-JS may use JIT/native CUDA implementation; preserve device-owned progress across narrow asynchronous host interaction and escalate missing naturally generic mechanisms to CUDA-JS. See [`decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md`](decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md).
- Expose one complete library through progressive disclosure: removable convenience facades/presets resolve into the authoritative complete composition path, and every material default is owned, bounded, inspectable, overridable and versioned. See [`decisions/ADR-0020-complete-library-and-resolved-defaults.md`](decisions/ADR-0020-complete-library-and-resolved-defaults.md).
- Distinguish initial root, minimum-work advance to an already ready realized successor, general reroot and non-structural attention. Advance preserves compatible descendant work and lazily supersedes occurrence-scoped sibling work without graph-size work or eager cleanup; attention changes no authority. See [`decisions/ADR-0022-distinguish-root-advance-reroot-and-attention.md`](decisions/ADR-0022-distinguish-root-advance-reroot-and-attention.md). ADR-0021 is superseded provenance.
- Require the first usable native engine to perform bounded useful GPU work concurrently while keeping physical scheduler topology profile-selected. Advanced primitives and tensor-shaped execution remain evidence-driven profiles, not universal prerequisites. See [`decisions/ADR-0023-parallel-first-native-execution.md`](decisions/ADR-0023-parallel-first-native-execution.md).
- Translate specifications into engineering contracts, eliminate gate-failing paths, order contextual values, compare credible alternatives, and prioritize work by consequence/dependency/information value. See [`decisions/ADR-0015-engineering-judgment-and-value-ordering.md`](decisions/ADR-0015-engineering-judgment-and-value-ordering.md).
- Apply token backpressure to every task while preserving the risk-appropriate minimum practice floor. See [`decisions/ADR-0016-token-backpressure-and-practice-floor.md`](decisions/ADR-0016-token-backpressure-and-practice-floor.md).
- Read the smallest authority-complete document set through instruction-chain discovery, applicability classification, semantic closure, trigger/adjacency scans, and pre-claim refresh. See [`decisions/ADR-0017-selective-spec-and-agent-file-reading.md`](decisions/ADR-0017-selective-spec-and-agent-file-reading.md).

## Current proposal and research boundary

The current architecture/specification proposal uses semantic per-work-item stages and stage-owned optional behavior:

```text
Search Stage
        ↓
stable entry/exit surface
  contract + Context Schema + capability set
        ↓
zero or one optional semantic stage capability program unit
        ↓
Search Composer
        ↓
finite specialized Search Image
```

Semantic category and owned invariant define a stage; usefulness validates its granularity. Binding, compatibility resolution, composition, and memory planning occur before ignition. Cross-stage/cross-surface dataflow uses bounded Async Stage Channels; blocking is prohibited. Active search remains device-closed, and stages with no capabilities retain no extension residue.

The expanded prior-art record identifies cuVS/cuFFT as composition methodology, nvJitLink/NVRTC as CUDA-JS-owned platform substrate, Atos/Groute/Gunrock as irregular scheduling comparisons, CUDA Graphs as a restricted scheduler candidate, cuCollections as a transposition-table benchmark/source-donor candidate, and CCCL/libcu++/CUB as low-level CUDA primitives. Restricted Device-JS/Search Program input is selected at the CUDA-MCGS boundary; CUDA-JS may choose PTX, LTO or another qualified realization without making that mechanism universal search meaning. None of the higher-level libraries is promoted into a mandatory active-search dependency.

## Repository split references

- [`architecture/REPOSITORY_TOPOLOGY.md`](architecture/REPOSITORY_TOPOLOGY.md) — current peer repository ownership, artifact flow, compatibility, and test responsibilities.
- [`research/2026-08-10-cuda-js-assumption-audit.md`](research/2026-08-10-cuda-js-assumption-audit.md) — historical technical corrections to the initial CUDA-JS sketch.
- [`research/2026-08-10-cuda-js-foundation-result.md`](research/2026-08-10-cuda-js-foundation-result.md) — historical verified local CUDA-JS foundation result that preceded the current public peer.
- [`research/prior-art/2026-08-10-landscape.md`](research/prior-art/2026-08-10-landscape.md) — current search-framework and CUDA composition prior-art landscape.
- [`research/2026-08-11-stage-resident-extension-assessment.md`](research/2026-08-11-stage-resident-extension-assessment.md) — stage/surface/channel research and second-pass adversarial assessment.

## Authority

Accepted ADRs and specifications govern their declared scopes. Research notes provide evidence but do not become architecture until accepted through the decision/specification process. Architecture and SPEC-0000 remain proposals. Engineering-decision records, plans, focus-branch packets, token/document-reading/test records, and cleanup records organize work beneath authority. Archived material is not current authority.
