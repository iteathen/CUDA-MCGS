# CUDA-MCGS Project Profile

**Scope:** Project-specific constraints layered on the reusable agent foundation.

## Mission

CUDA-MCGS is a universal framework for generating finite, specialized, GPU-resident Monte Carlo Graph Search engines across unrelated domains, evaluator shapes, action spaces, graph semantics, and output contracts.

The generic search framework is the first product. Chess, Go, text search, planning, policy-only, value-only, and other workloads are consumers, adapters, product profiles, or conformance cases—not the permanent shape of the core.

## Repository boundary

CUDA-MCGS owns Search IR, graph-search semantics, finite search-resource policy, search-specific specialization/layout/device programs, reference interpretation, search conformance, execution-package semantics, and the CUDA-MCGS-owned CUDA-JS adapter.

The peer `CUDA-JS` repository owns generic Node/CUDA Driver runtime behavior. Dependency is one-way through versioned public packages/artifacts and compatibility manifests. CUDA-MCGS may not depend on CUDA-JS private source; CUDA-JS may not know Search IR or MCGS semantics.

Maintained CUDA-MCGS production source is JavaScript only: ordinary Node.js plus restricted Device-JS submitted through that public boundary. CUDA-JS remains free to use JIT and native/CUDA implementation wherever needed or desired. If its public surface cannot express a needed generic GPU mechanism naturally and safely, classify a consumer-neutral CUDA-JS capability rather than adding native/CUDA source or distorting CUDA-MCGS semantics. Search policy remains here; generic mechanism remains in CUDA-JS.

## Downstream product ownership

CUDA-MCGS may retain product-neutral synthetic domains and downstream consumer/conformance profiles to prove universality and integration boundaries. Those artifacts do not make CUDA-MCGS the owner of an external product merely because that product consumes CUDA-MCGS.

The UCI chess engine product currently being developed for this ecosystem is owned by the independent `iteathen/UCI-Arena-Vector` repository. Its engine policy choices, UCI behavior, product integrations, release/support lifecycle, opening-book/Tablebase/timing-service orchestration, and other engine-product semantics belong there or in the independent service/library that owns the capability. CUDA-MCGS owns only the universal contracts and any explicitly retained consumer/conformance profile needed to prove that a chess product can compose through them.

No CUDA-MCGS product/conformance document may silently become a second authority for UCI-Arena-Vector.

## Current phase

The project is a public pre-release repository defining version-zero CUDA-MCGS search and CUDA-MCGS-to-CUDA-JS contracts, ownership, memory/resource behavior, conformance, and test architecture before production implementation. Public visibility is not a stable API, support promise, or product release.

Current accepted authority distinguishes `root`, `advance`, `reroot`, and `attention`. Any proposal/schema/reference artifact using the older broad root-transaction/root-advance model is subordinate to ADR-0022 until the owned reconciliation is complete.

## Ecosystem language constraint

CUDA-MCGS and every CUDA-MCGS-related project are Python-free. Python may not be used for production or reference code, host tooling, schema import, generators, tests, benchmarks, documentation tooling, CI, packaging, installers, release work, migrations, diagnostics, prototypes, experiments, or temporary scripts. Python-based ordinary-use dependencies and indirect interpreter invocation are also prohibited.

Apply [`../general_foundation/NO_PYTHON_POLICY.md`](../general_foundation/NO_PYTHON_POLICY.md) to every plan, component, tool, dependency, experiment protocol, and repository split. This is a hard gate.

## Hard constraints

- Apply ADR-0015 engineering contracts, specification traceability, hard gates, contextual value ordering, candidate-path comparison, and P0–P4 priority.
- Apply ADR-0005 and the LEGO → SOLID → CUPID → simplest sufficient total-system hierarchy.
- One authoritative graph/search/schema/resource/interop fact has one visible owner; composition is explicit.
- Universal contracts; finite specialized generated hot paths.
- Complete device closure after active-search ignition.
- Resident selected evaluator/model and device-owned batching where selected.
- Explicit finite device-memory plan and pressure/exhaustion/cancellation/teardown behavior.
- Explicit state identity, history, transpositions, cycles, node roles, action production, evaluation outputs, backup, output, lifecycle, and versioning.
- `root` establishes initial authority; `advance` is only the minimum-work move to an already-ready realized successor; `reroot` owns general root replacement/reconciliation; `attention` changes directional weighting without root authority change.
- Advance performs no retained-graph traversal, semantic-state copy/transformation, reset, resize, retained-state reclassification, reclamation, or eager cleanup. It preserves compatible selected-descendant work and lazily supersedes sibling-occurrence work without invalidating shared transposed nodes merely reached through an old occurrence.
- No hidden game, board, player, zero-sum, deterministic, fixed-action, fixed-state, scalar-value, neural-network, tree, DAG, or first-GPU assumptions.
- Foundational widths/ranges are derived from expected domains and resource plans.
- Production performance preserves semantic, resource, stopping, and search-quality guardrails.
- Generic native runtime behavior remains in CUDA-JS; CUDA-MCGS retains only search-semantic lowering and adapter ownership.
- No Python artifact, interpreter, package manager, build/test dependency, generator, workflow, or temporary support path may enter the repository or its ordinary lifecycle.

## Value ordering

Unless a more specific accepted contract applies, CUDA-MCGS decisions use:

1. owner instruction, accepted authority, repository ownership, legality, and explicit ethical limits;
2. unacceptable security/privacy/data-integrity/native-capability/recovery harm;
3. search-semantic correctness, device closure, finite-resource bounds, identity, publication, cancellation, teardown, compatibility/cache identity, and required accuracy/deadline bounds;
4. mission-sustaining reliability, diagnosability, portability across supported profiles, and recoverability;
5. search quality, latency, throughput, memory/bandwidth efficiency, and useful capability;
6. LEGO architecture, maintainability, testability, observability, usability, extensibility, and developer joy;
7. delivery speed, token/process cost, convenience, and polish.

## Organization

Follow the engineering, design, organization, registry, focus-branch, testing, token, execution, and cleanup doctrines. CUDA-MCGS remains a componentized search-framework repository. Only a genuinely independent lifecycle justifies further extraction; focus branches and file count do not.

## Licensing status

CUDA-MCGS is licensed under `AGPL-3.0-or-later` with a separately negotiated commercial-license option. The repository is public, but no CUDA-MCGS product/package release or stable compatibility promise exists.

Before adapting third-party implementation, record exact revision/license and make an explicit reuse decision. Public distribution must preserve project-license and third-party compatibility/provenance requirements.

## Current next boundary

Follow `next_step.yaml`. At the current authority head, ADR-0022 reconciliation (`REF-ROOT-CONTROL-01`) precedes Graph reference implementation. Production lowering remains blocked until the integrated semantic packet is accepted and the selected CUDA-JS dependency path is ready.
