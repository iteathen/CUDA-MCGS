# Documentation Index

**Status:** Informational

## Start here

- [`PROJECT_CHARTER.md`](PROJECT_CHARTER.md) — accepted UMCGS search mission and boundary.
- [`../agent_files/README.md`](../agent_files/README.md) — canonical developer/agent system.
- [`../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md`](../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md) — selective authority discovery, instruction chains, applicability, semantic closure, and final refresh.
- [`../agent_files/general_foundation/CONTEXT_ROUTING.md`](../agent_files/general_foundation/CONTEXT_ROUTING.md) — authority-complete context loading and compaction.
- [`../agent_files/general_foundation/TOKEN_DISCIPLINE.md`](../agent_files/general_foundation/TOKEN_DISCIPLINE.md) — universal token backpressure, minimum practice floor, reduction ladder, reserves, and token debt.
- [`../agent_files/general_foundation/ENGINEERING_JUDGMENT.md`](../agent_files/general_foundation/ENGINEERING_JUDGMENT.md) — specification alignment, path selection, value ordering, tradeoffs, and priority.
- [`decisions/README.md`](decisions/README.md) — accepted decisions.
- [`architecture/README.md`](architecture/README.md) — explanatory architecture and repository topology.
- [`specs/README.md`](specs/README.md) — normative search contracts, conformance requirements, and proposals.
- [`research/README.md`](research/README.md) — prior art and external technical evidence.
- [`development/README.md`](development/README.md) — development method.
- [`archive/README.md`](archive/README.md) — superseded-history policy.

## Current accepted decisions

- Build UMCGS as a new framework and use prior art as bounded references and benchmarks. See [`decisions/ADR-0001-prior-art-disposition.md`](decisions/ADR-0001-prior-art-disposition.md).
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
- Extract the generic Node/CUDA runtime into independent `CUDA-JS`; retain search semantics and the adapter in UMCGS. See [`decisions/ADR-0014-extract-cuda-js-runtime.md`](decisions/ADR-0014-extract-cuda-js-runtime.md).
- Translate specifications into engineering contracts, eliminate gate-failing paths, order contextual values, compare credible alternatives, and prioritize work by consequence/dependency/information value. See [`decisions/ADR-0015-engineering-judgment-and-value-ordering.md`](decisions/ADR-0015-engineering-judgment-and-value-ordering.md).
- Apply token backpressure to every task while preserving the risk-appropriate minimum practice floor; reduce duplication, optional breadth, and scope before rigor. See [`decisions/ADR-0016-token-backpressure-and-practice-floor.md`](decisions/ADR-0016-token-backpressure-and-practice-floor.md).
- Read the smallest authority-complete document set through instruction-chain discovery, applicability classification, semantic closure, trigger/adjacency scans, and pre-claim refresh. See [`decisions/ADR-0017-selective-spec-and-agent-file-reading.md`](decisions/ADR-0017-selective-spec-and-agent-file-reading.md).

## Repository split references

- [`architecture/REPOSITORY_TOPOLOGY.md`](architecture/REPOSITORY_TOPOLOGY.md) — peer repository ownership, artifact flow, compatibility, and test responsibilities.
- [`research/2026-08-10-cuda-js-assumption-audit.md`](research/2026-08-10-cuda-js-assumption-audit.md) — technical corrections to the initial CUDA-JS sketch.
- [`research/2026-08-10-cuda-js-foundation-result.md`](research/2026-08-10-cuda-js-foundation-result.md) — verified local CUDA-JS foundation plan and its public interop consequences.

## Authority

Accepted ADRs and specifications govern their declared scopes. Research notes provide evidence but do not become architecture until accepted through the decision/specification process. Engineering-decision records, plans, focus-branch packets, token/document-reading/test records, and cleanup records organize work beneath authority. Archived material is not current authority.
