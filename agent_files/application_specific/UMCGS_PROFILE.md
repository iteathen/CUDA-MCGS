# UMCGS Project Profile

**Scope:** Project-specific constraints layered on the reusable agent foundation.

## Mission

UMCGS is a universal framework for generating finite, specialized, GPU-resident Monte Carlo Graph Search engines across unrelated domains, evaluator shapes, action spaces, graph semantics, and output contracts.

The generic framework is the first product. A chess engine, Go engine, text-search system, planner, policy-only search, value-only search, or another workload is an adapter or conformance case—not the permanent shape of the core.

## Current phase

The project is defining governance, organization, prior-art disposition, Search IR, contracts, memory/resource behavior, and conformance before production runtime implementation.

## Hard constraints

- Organize as a very large project from the first implementation.
- Universal contracts; specialized generated hot paths.
- Complete device closure after active-search ignition.
- Resident selected evaluator/model and device-owned batching.
- Explicit finite device-memory plan and pressure/exhaustion behavior.
- Explicit state identity, history, transpositions, cycles, node roles, action production, evaluation outputs, backup, output, lifecycle, and versioning.
- No hidden game, board, player, zero-sum, deterministic, fixed-action, fixed-state, scalar-value, neural-network, tree, or DAG assumptions.
- Foundational widths and ranges are derived from expected domains and resource plans rather than first examples.
- Production performance work preserves correctness and search-quality guardrails.

## Organization

Follow:

- [`../general_foundation/PROJECT_ORGANIZATION.md`](../general_foundation/PROJECT_ORGANIZATION.md)
- [`REPOSITORY_ORGANIZATION.md`](REPOSITORY_ORGANIZATION.md)
- [`../SYSTEM_REGISTRY.md`](../SYSTEM_REGISTRY.md)
- [`../../docs/decisions/ADR-0004-large-project-organization.md`](../../docs/decisions/ADR-0004-large-project-organization.md)

The repository should remain a componentized monorepo until an independent lifecycle justifies extraction. Components must be designed with stable boundaries so extraction is possible without untangling internal paths.

## Licensing status

UMCGS has no public release and no selected project license. License selection is deferred and is **not** a blocker to original private pre-release research, specifications, experiments, or implementation.

Before copying or adapting third-party implementation, record exact revision and license and make an explicit reuse decision. Select an appropriate project/distribution license before public release or distribution.

## Current next boundary

The version-0 Search IR and independent domain, policy, evaluator, resource, graph-semantics, and conformance contracts must be accepted before production framework components are implemented.
