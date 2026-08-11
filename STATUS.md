# UMCGS Status

**Status:** Informational

**Updated:** 2026-08-10

## Phase

Private pre-release framework definition and evidence gathering. `main` is the integration trunk for short-lived `feature/*` and `agent/*` branches. No production runtime implementation or final UMCGS component decomposition has been accepted.

## Accepted project state

- The generic graph-search framework—not chess or another first domain—is the first UMCGS product.
- UMCGS owns Search IR, search semantics, finite search-resource planning, specialized search device programs, search conformance, and the UMCGS-to-CUDA-JS adapter/package contract.
- Generic Node.js/CUDA Driver runtime behavior belongs to the independent peer `CUDA-JS`; dependency direction is one-way through versioned public artifacts.
- CUDA-JS has a verified local foundation plan at `77090a981fabb547d9e1a98d76213f2048e81ef2`; UMCGS consumes only its future public capabilities and exact artifacts, not its private Node/Worker/backend design.
- Active search remains device-closed after ignition. Concrete engines are finite and resource-planned; contracts are universal and generated hot paths are specialized.
- Engineering decisions begin with an explicit contract and material specification-obligation map.
- Hard gates are evaluated before mission objectives, supporting qualities, and process costs. Weighted scoring cannot make an invalid path valid.
- The contextual fallback orders authority/legality/ethics, unacceptable irreversible harm, semantic correctness and hard mission bounds, mission-sustaining reliability/compatibility/operability, mission quality/performance, supporting qualities, then delivery/process convenience.
- A subsystem may promote speed, accuracy, availability, or another concern into a higher gate only through explicit purpose, threshold, consequence, owner, evidence, and revisit trigger.
- Credible no-change, minimal, proposed, materially different, experiment/staged, and fallback paths are compared where material; invalid and Pareto-dominated paths are removed for stated reasons.
- Work is prioritized as P0 containment, P1 gate/foundation, P2 information/risk/dependency unlock, P3 mission value/measured efficiency, and P4 supporting quality/polish.
- Token use is continuous backpressure on every task, including routine work.
- Backpressure reduces duplicate context/evidence, fragmented work, optional breadth/polish, and scope before it threatens required rigor.
- Every task preserves a risk-appropriate minimum practice floor: request/authority, current-state inspection, coherent scope, expected result, decisive verification, actual-effect inspection, relevant testing, cleanup, and honest limits.
- Routine work uses an implicit micro-budget with no mandatory ledger. Substantial/critical work preserves explicit reserves and split/handoff triggers.
- Soft token estimates are replan signals rather than authority to skip practices. Essential evidence, safety, correctness, cleanup, or handoff may justify an explicit extension followed by narrowing or split to restore reserve.
- Agents read the smallest authority-complete document set rather than every document or only the files named in the request.
- Every target path’s instruction chain, direct governing authority, required normative references, triggered specialist doctrine, and material producer/consumer/lifecycle/test/cleanup adjacency are discovered before material mutation.
- Documents are classified by applicability and read at proportional depth; governing and materially triggered documents are read to semantic closure.
- Accepted status does not imply universal applicability. Proposals, research, architecture, examples, implementation, tests, plans, and summaries remain in their proper authority roles.
- Scope, owner, repository, contract, resource, failure, oracle, or authority changes trigger document re-routing and evidence invalidation.
- Routine work needs no document ledger when applicability is obvious. Substantial/critical/cross-repository work preserves exact reading coverage when another consumer needs it.
- Reduced evidence narrows the claim; sampling or lower test tiers cannot support an unchanged complete/release-grade claim.
- Adversarial assessment, focus branches, consolidated test capsules, governed execution, cleanup, sanity, and exact-head guarded integration remain binding.
- Material specification/decision/document-reading/test/token debt, invalid partial state, unsafe cleanup debt, and unintegrated branch outputs block completion.
- Repository and component organization assumes mature large-project scale from inception.
- Project license selection is deferred and does not block original private pre-release work.

## Current authority

- Project charter: accepted and narrowed to UMCGS search ownership.
- ADR-0001 through ADR-0014: accepted.
- ADR-0015 engineering judgment, specification alignment, and value ordering: accepted.
- ADR-0016 universal token backpressure and minimum practice floor: accepted.
- ADR-0017 selective specification and agent-file reading: accepted.
- Repository topology: accepted through ADR-0014 and documented in `docs/architecture/REPOSITORY_TOPOLOGY.md`.
- Framework architecture overview and detailed version-zero contracts: proposals.
- UMCGS-to-CUDA-JS execution-package contract: not yet accepted.
- CUDA-JS repository charter/bootstrap: prepared locally; remote repository creation/publication pending.

## Prepared CUDA-JS foundation

- Intended private repository: `iteathen/CUDA-JS`.
- Exact local planning commit: `77090a981fabb547d9e1a98d76213f2048e81ef2`.
- The foundation is Node-FFI-first, schema-generated, capability-safe, and actor-owned; `EXP-000` is the GPU-free first executable gate.
- Verified bundle: `CJS-FND-77090a9.bundle`, SHA-256 `39dc57ea37fac71522b99090945b232173f65676f3421f4e6ea4baa84ca41ad3`.
- Verified tracked-tree ZIP: `CJS-FND-77090a9.zip`, SHA-256 `419cd4453cccd489da6475836f911fc3d8f39ca2a3286b10f63df9db12913408`.
- Verified handoff: `CJS-FND-77090a9-HO.md`, SHA-256 `43c68aebe508d227ca8d35422d56d0f4f407423d29151ae6e9476cb40266192b`.
- The private remote still does not exist. This exact local authority is evidence for UMCGS interop planning, not a published CUDA-JS runtime contract.

## Current next boundary

Draft and adversarially validate the version-zero UMCGS-to-CUDA-JS execution-package contract against the exact CUDA-JS foundation result. Express every runtime dependency as a public versioned capability, evidence profile, opaque resource requirement, lifecycle/error/teardown contract, and compatible artifact pair. Do not encode Node FFI, Worker actors, dynamic-library paths, or other CUDA-JS-private mechanisms.

Final acceptance remains blocked until the CUDA-JS remote/public contract exists and its GPU-free and CUDA-specific foundation experiments pass.

## Current risks and unknowns

- No project license has been selected. Third-party implementation reuse still requires exact license/provenance review, and public release requires a distribution license.
- CUDA-JS `EXP-000` has not yet qualified the Node-FFI host substrate on official Node.js 26.7.0.
- CUDA-JS CUDA-specific ABI, context, memory, launch, completion, error-health, compiler/linker, cache, strict-JIT, and platform claims remain experiment-gated.
- The CUDA-JS private remote and accepted public capability contract do not yet exist.
- UMCGS scheduling, graph layout, pressure, evaluator ABI, device teardown, and exact capsule budgets remain open pending search specifications and experiments.
- Cross-repository release automation and exact compatible-pair policy are not yet accepted.
- Candidate prior-art performance claims have not been reproduced on target hardware.

