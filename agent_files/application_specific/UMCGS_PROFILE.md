# UMCGS Project Profile

**Scope:** Project-specific constraints layered on the reusable agent foundation.

## Mission

UMCGS is a universal framework for generating finite, specialized, GPU-resident Monte Carlo Graph Search engines across unrelated domains, evaluator shapes, action spaces, graph semantics, and output contracts.

The generic search framework is the first product. Chess, Go, text search, planning, policy-only, value-only, and other workloads are adapters or conformance cases—not the permanent shape of the core.

## Repository boundary

UMCGS owns Search IR, graph-search semantics, finite search-resource policy, search-specific specialization/layout/device programs, reference interpretation, search conformance, execution-package semantics, and the UMCGS-owned CUDA-JS adapter.

The peer `CUDA-JS` repository owns generic Node/CUDA Driver runtime behavior. Dependency is one-way through versioned public packages/artifacts and compatibility manifests. UMCGS may not depend on CUDA-JS private source; CUDA-JS may not know Search IR or MCGS.

Maintained CUDA-MCGS production source is JavaScript only: ordinary Node.js plus restricted Device-JS submitted through that public boundary. CUDA-JS remains free to use JIT and native/CUDA implementation wherever needed or desired. If its public surface cannot express a needed generic GPU mechanism naturally and safely, classify a consumer-neutral CUDA-JS capability rather than adding native/CUDA source or distorting CUDA-MCGS semantics. Search policy remains here; generic mechanism remains in CUDA-JS.

## Current phase

The project is a public pre-release repository defining version-zero CUDA-MCGS search and CUDA-MCGS-to-CUDA-JS contracts, ownership, memory/resource behavior, conformance, and test architecture before production implementation. Public visibility is not a stable API, support promise, or product release.

## Ecosystem language constraint

UMCGS and every UMCGS-related project are Python-free. Python may not be used for production or reference code, host tooling, schema import, generators, tests, benchmarks, documentation tooling, CI, packaging, installers, release work, migrations, diagnostics, prototypes, experiments, or temporary scripts. Python-based ordinary-use dependencies and indirect interpreter invocation are also prohibited.

Apply [`../general_foundation/NO_PYTHON_POLICY.md`](../general_foundation/NO_PYTHON_POLICY.md) to every plan, component, tool, dependency, experiment protocol, and repository split. This is a hard gate; a convenient Python implementation must be rejected or redesigned in an accepted project language.

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
- No Python artifact, interpreter, package manager, build/test dependency, generator, workflow, or temporary support path may enter the repository or its ordinary lifecycle.

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

CUDA-MCGS is licensed under `AGPL-3.0-or-later` with a separately negotiated commercial-license option. The repository is public, but no CUDA-MCGS product/package release or stable compatibility promise exists.

Before adapting third-party implementation, record exact revision/license and make an explicit reuse decision. Public distribution must preserve project-license and third-party compatibility/provenance requirements.

## Current next boundary

Execute the `ENGINE-CONTRACT-01` focus-branch map beginning with product-neutral domain semantics, then integrate graph, policy, evaluator, output, resource, device-owned progress and Search Session proposals before bounded Search IR/reference evidence. Production lowering and exact CUDA-JS pair qualification remain later gates.
