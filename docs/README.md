# Documentation Index

**Status:** Informational

CUDA-MCGS is the product-facing name of the universal MCGS framework currently hosted in `iteathen/UMCGS`. Existing accepted UMCGS ADR/specification identifiers remain authoritative until a separate naming/repository migration is accepted.

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS engine with schema-backed extension support.**

## Start here

- [`PROJECT_CHARTER.md`](PROJECT_CHARTER.md) — accepted UMCGS/CUDA-MCGS search mission and boundary.
- [`../agent_files/README.md`](../agent_files/README.md) — canonical developer/agent system.
- [`../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md`](../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md) — selective authority discovery and semantic closure.
- [`../agent_files/general_foundation/ENGINEERING_JUDGMENT.md`](../agent_files/general_foundation/ENGINEERING_JUDGMENT.md) — specification alignment, path selection, value ordering, tradeoffs, and priority.
- [`decisions/README.md`](decisions/README.md) — accepted decisions.
- [`architecture/README.md`](architecture/README.md) — explanatory architecture, Extension Surface/Search Composer proposal, and repository topology.
- [`specs/README.md`](specs/README.md) — normative search-contract families, conformance requirements, and current proposals.
- [`research/README.md`](research/README.md) — prior art and external technical evidence.
- [`development/README.md`](development/README.md) — development method.
- [`archive/README.md`](archive/README.md) — superseded-history policy.
- [`../next_step.yaml`](../next_step.yaml) — current canonical plan spine; revise this rather than creating a competing master plan.

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
- Translate specifications into engineering contracts, eliminate gate-failing paths, order contextual values, compare credible alternatives, and prioritize work by consequence/dependency/information value. See [`decisions/ADR-0015-engineering-judgment-and-value-ordering.md`](decisions/ADR-0015-engineering-judgment-and-value-ordering.md).
- Apply token backpressure to every task while preserving the risk-appropriate minimum practice floor. See [`decisions/ADR-0016-token-backpressure-and-practice-floor.md`](decisions/ADR-0016-token-backpressure-and-practice-floor.md).
- Read the smallest authority-complete document set through instruction-chain discovery, applicability classification, semantic closure, trigger/adjacency scans, and pre-claim refresh. See [`decisions/ADR-0017-selective-spec-and-agent-file-reading.md`](decisions/ADR-0017-selective-spec-and-agent-file-reading.md).

## Current proposal and research boundary

The current architecture/specification proposal adds one schema-backed semantic extension protocol:

```text
Search Extension Surface
        ↓
Extension Point
  contract + Context Schema
        ↓
Extension Fragment manifest
        ↓
Search Composer
        ↓
finite specialized Search Image
```

Binding, compatibility resolution, composition, and memory planning occur before ignition. Active search remains device-closed; unbound points target zero abstraction overhead and bound fragments target no generic dispatch beyond intrinsic work.

The expanded prior-art record identifies cuVS JIT-LTO and cuFFT LTO callbacks as close methodology precedents, nvJitLink/NVRTC as CUDA-JS-owned platform substrate, CUDA Graphs as a scheduler candidate, cuCollections as a transposition-table benchmark/source-donor candidate, and CCCL/libcu++/CUB as low-level CUDA primitives. Relocatable PTX—not LTO—is selected for the version-zero CUDA-MCGS fragment experiment; none of the higher-level libraries is promoted into a mandatory active-search dependency.

## Repository split references

- [`architecture/REPOSITORY_TOPOLOGY.md`](architecture/REPOSITORY_TOPOLOGY.md) — current peer repository ownership, artifact flow, compatibility, and test responsibilities.
- [`research/2026-08-10-cuda-js-assumption-audit.md`](research/2026-08-10-cuda-js-assumption-audit.md) — historical technical corrections to the initial CUDA-JS sketch.
- [`research/2026-08-10-cuda-js-foundation-result.md`](research/2026-08-10-cuda-js-foundation-result.md) — historical verified local CUDA-JS foundation result that preceded the current public peer.
- [`research/prior-art/2026-08-10-landscape.md`](research/prior-art/2026-08-10-landscape.md) — current search-framework and CUDA composition prior-art landscape.

## Authority

Accepted ADRs and specifications govern their declared scopes. Research notes provide evidence but do not become architecture until accepted through the decision/specification process. Architecture and SPEC-0000 remain proposals. Engineering-decision records, plans, focus-branch packets, token/document-reading/test records, and cleanup records organize work beneath authority. Archived material is not current authority.
