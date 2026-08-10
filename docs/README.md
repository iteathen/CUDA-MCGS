# Documentation Index

**Status:** Informational

## Start here

- [`PROJECT_CHARTER.md`](PROJECT_CHARTER.md) — accepted mission and boundary.
- [`../agent_files/README.md`](../agent_files/README.md) — canonical developer/agent system.
- [`decisions/README.md`](decisions/README.md) — accepted architectural decisions.
- [`specs/README.md`](specs/README.md) — normative contracts, conformance requirements, and current proposals.
- [`architecture/README.md`](architecture/README.md) — explanatory architecture and current proposals.
- [`research/README.md`](research/README.md) — prior art and external evidence.
- [`development/README.md`](development/README.md) — project-facing development index.
- [`archive/README.md`](archive/README.md) — superseded-history policy.

## Current accepted decisions

- Build UMCGS as a new framework rather than fork a reviewed candidate; reuse prior art as bounded references, conformance sources, and benchmarks. See [`decisions/ADR-0001-prior-art-disposition.md`](decisions/ADR-0001-prior-art-disposition.md).
- Preserve universality in versioned contracts while compiling finite specialized engines. See [`decisions/ADR-0002-universal-contracts-specialized-engines.md`](decisions/ADR-0002-universal-contracts-specialized-engines.md).
- Keep the active production search device-resident after ignition. See [`decisions/ADR-0003-device-resident-active-search.md`](decisions/ADR-0003-device-resident-active-search.md).
- Organize the repository and components for mature project scale from the beginning. See [`decisions/ADR-0004-large-project-organization.md`](decisions/ADR-0004-large-project-organization.md).
- Apply the LEGO design hierarchy, require sound fundamentals, and judge simplicity across the total affected system. See [`decisions/ADR-0005-lego-design-hierarchy.md`](decisions/ADR-0005-lego-design-hierarchy.md).
- Assess before planning, use adversarial synthesis, and keep administrative records proportional to risk. See [`decisions/ADR-0006-adversarial-assessment-and-planning.md`](decisions/ADR-0006-adversarial-assessment-and-planning.md).
- Use exact frozen targets, explicit full/bounded/sampled claims, risk-proportional semantic review, integration reconciliation, and durable findings for sanity checks. See [`decisions/ADR-0007-proportional-sanity-checking.md`](decisions/ADR-0007-proportional-sanity-checking.md).
- Review one exact PR head, require independence according to phase/risk, perform a separate guarded merge transaction, and verify the integrated target. See [`decisions/ADR-0008-exact-head-pr-review-and-guarded-merge.md`](decisions/ADR-0008-exact-head-pr-review-and-guarded-merge.md).
- Execute plans through current dependency-ready nodes, expected-before-actual operations, immediate falsification/reconciliation, and explicit deviation handling. See [`decisions/ADR-0009-governed-plan-execution.md`](decisions/ADR-0009-governed-plan-execution.md).
- Give local, remote, generated, sensitive, external, partial, and coordination state explicit protected-state analysis, disposition, verification, and bounded cleanup debt. See [`decisions/ADR-0010-cleanup-reconciliation-and-artifact-disposition.md`](decisions/ADR-0010-cleanup-reconciliation-and-artifact-disposition.md).
- Decompose large or complex tasks into semantic focus branches sized for full attention, with one parent integration spine, explicit invalidation, constrained parallelism, and central reconciliation. See [`decisions/ADR-0011-focus-branch-decomposition-and-integration.md`](decisions/ADR-0011-focus-branch-decomposition-and-integration.md).
- Optimize verified progress per lifecycle token, reserve capacity for evidence and handoff, route context in layers, and prevent material token debt. See [`decisions/ADR-0012-token-use-and-context-discipline.md`](decisions/ADR-0012-token-use-and-context-discipline.md).

## Authority

Accepted ADRs and specifications govern their scopes. Research notes provide evidence but do not become architecture until accepted through the decision/specification process. Plans, focus-branch packets, token-budget records, and cleanup records organize work beneath authority. Archived material is not current authority.
