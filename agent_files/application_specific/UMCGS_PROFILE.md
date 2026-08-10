# UMCGS Project Profile

**Scope:** Project-specific constraints layered on the reusable agent foundation.

## Mission

UMCGS is a universal framework for generating finite, specialized, GPU-resident Monte Carlo Graph Search engines across unrelated domains, evaluator shapes, action spaces, graph semantics, and output contracts.

The generic search framework is the first product. Chess, Go, text search, planning, policy-only, value-only, and other workloads are adapters or conformance cases—not the permanent shape of the core.

## Repository boundary

UMCGS owns Search IR, graph-search semantics, finite search-resource policy, search-specific specialization/layout/device programs, reference interpretation, search conformance, execution-package semantics, and the UMCGS-owned CUDA-JS adapter.

The peer `CUDA-JS` repository owns generic Node/CUDA Driver runtime behavior. Dependency is one-way through versioned public packages/artifacts and compatibility manifests. UMCGS may not depend on CUDA-JS private source; CUDA-JS may not know Search IR or MCGS.

## Current phase

The project is defining version-zero UMCGS search and UMCGS-to-CUDA-JS contracts, ownership, memory/resource behavior, conformance, and test architecture before production implementation.

## Hard constraints

- Apply ADR-0015 engineering contracts, specification traceability, hard gates, contextual value ordering, candidate-path comparison, and P0–P4 priority.
- Apply ADR-0005 and the LEGO → SOLID → CUPID → simplest sufficient total-system hierarchy.
- One authoritative graph/search/schema/resource/interop fact has one visible owner; composition is explicit.
- Universal contracts; finite specialized generated hot paths.
- Complete device closure after active-search ignition.
- Resident selected evaluator/model and device-owned batching where selected.
- Explicit finite device-memory plan and pressure/exhaustion/cancellation/teardown behavior.
- Explicit state identity, history, transpositions, cycles, node roles, action production, evaluation outputs, backup, output, lifecycle, and versioning.
- No hidden game, board, player, zero-sum, deterministic, fixed-action, fixed-state, scalar-value, neural-network, tree, DAG, or first-GPU assumptions.
- Foundational widths/ranges are derived from expected domains and resource plans.
- Production performance preserves semantic, resource, stopping, and search-quality guardrails.
- Generic native runtime behavior remains in CUDA-JS; UMCGS retains only search-semantic lowering and adapter ownership.

## UMCGS value ordering

Unless a more specific accepted contract applies, UMCGS decisions use:

1. owner instruction, accepted authority, repository ownership, legality, and explicit ethical limits;
2. unacceptable security/privacy/data-integrity/native-capability/recovery harm;
3. search-semantic correctness, device closure, finite-resource bounds, identity, publication, cancellation, teardown, compatibility/cache identity, and required accuracy/deadline bounds;
4. mission-sustaining reliability, diagnosability, portability across supported profiles, and recoverability;
5. search quality, latency, throughput, memory/bandwidth efficiency, and useful capability;
6. LEGO architecture, maintainability, testability, observability, usability, extensibility, and developer joy;
7. delivery speed, token/process cost, convenience, and polish.

This is a fallback. A specific subsystem may promote another concern into a hard gate through an accepted engineering contract.

## Priority examples

- **P0:** active native-capability exposure, corruption, invalid partial migration, runaway allocation/resource leak, or production violation of device closure.
- **P1:** unresolved Search IR/interop ownership, identity/range/lifecycle/publication/compatibility gate, missing critical oracle, or foundational contract blocker.
- **P2:** bounded experiments deciding scheduler/memory/JIT/ABI/search-quality architecture; conformance work unlocking several branches.
- **P3:** implementation of accepted search contracts and measured quality/performance/reliability improvements.
- **P4:** unrelated refactoring, developer-experience polish, and speculative optimization.

## Organization

Follow the engineering, design, organization, registry, focus-branch, testing, token, execution, and cleanup doctrines. UMCGS remains a componentized search-framework repository. Only a genuinely independent lifecycle justifies further extraction; focus branches and file count do not.

## Licensing status

UMCGS has no public release and no selected project license. License selection is deferred and is not a blocker to original private pre-release work.

Before adapting third-party implementation, record exact revision/license and make an explicit reuse decision. Select a distribution license before public release.

## Current next boundary

Define and adversarially validate the version-zero UMCGS-to-CUDA-JS execution-package contract, including obligation ownership, hard gates/value ordering, compatibility/cache identity, conformance, errors, lifetimes, cancellation, and teardown; then revise the SPEC-V0 branch/test map before production implementation.
