# UMCGS Status

**Status:** Informational

**Updated:** 2026-08-10

## Phase

Private pre-release framework definition and evidence gathering. `main` is the integration trunk for short-lived `feature/*` and `agent/*` branches. No production runtime implementation or final UMCGS component decomposition has been accepted.

## Accepted project state

- The generic graph-search framework—not chess or another first domain—is the first UMCGS product.
- UMCGS owns Search IR, search semantics, finite search-resource planning, specialized search device programs, search conformance, and the UMCGS-to-CUDA-JS adapter/package contract.
- Generic Node.js/CUDA Driver runtime behavior belongs to the independent peer `CUDA-JS`; dependency direction is one-way through versioned public artifacts.
- Active search remains device-closed after ignition. Concrete engines are finite and resource-planned; contracts are universal and generated hot paths are specialized.
- Engineering decisions begin with an explicit contract and material specification-obligation map.
- Hard gates are evaluated before mission objectives, supporting qualities, and process costs. Weighted scoring cannot make an invalid path valid.
- The contextual fallback orders authority/legality/ethics, unacceptable irreversible harm, semantic correctness and hard mission bounds, mission-sustaining reliability/compatibility/operability, mission quality/performance, supporting qualities, then delivery/process convenience.
- A subsystem may promote speed, accuracy, availability, or another concern into a higher gate only through explicit purpose, threshold, consequence, owner, evidence, and revisit trigger.
- Credible no-change, minimal, proposed, materially different, experiment/staged, and fallback paths are compared where material; invalid and Pareto-dominated paths are removed for stated reasons.
- Work is prioritized as P0 containment, P1 gate/foundation, P2 information/risk/dependency unlock, P3 mission value/measured efficiency, and P4 supporting quality/polish.
- Adversarial assessment, focus branches, token reserves, consolidated test capsules, governed execution, cleanup, sanity, and exact-head guarded integration remain binding.
- Material decision debt, test debt, token debt, invalid partial state, unsafe cleanup debt, and unintegrated branch outputs block completion.
- Repository and component organization assumes mature large-project scale from inception.
- Project license selection is deferred and does not block original private pre-release work.

## Current authority

- Project charter: accepted and narrowed to UMCGS search ownership.
- ADR-0001 through ADR-0014: accepted.
- ADR-0015 engineering judgment, specification alignment, and value ordering: accepted.
- Repository topology: accepted through ADR-0014 and documented in `docs/architecture/REPOSITORY_TOPOLOGY.md`.
- Framework architecture overview and detailed version-zero contracts: proposals.
- UMCGS-to-CUDA-JS execution-package contract: not yet accepted.
- CUDA-JS repository charter/bootstrap: prepared locally; remote repository creation/publication pending.

## Prepared CUDA-JS bootstrap

- Intended private repository: `iteathen/CUDA-JS`.
- Local bootstrap Git commit: `cd44a3da58fad67153f8123525fcb9ec3bddab9f`.
- Bootstrap includes charter, repository ADR, architecture proposal, technical assumption audit, version-zero runtime contract map, agent guidance, validation, and standard product areas.
- Account-level GitHub repository creation is not exposed by the connected GitHub capability and no authenticated local GitHub CLI/token is available. This is recorded as a publication blocker, not falsely reported as completed.

## Current next boundary

Define and adversarially validate the version-zero UMCGS-to-CUDA-JS execution-package contract using the accepted engineering contract, obligation map, hard gates, contextual value ordering, candidate-path comparison, P1 priority, conformance ownership, and error/lifetime rules; revise the SPEC-V0 focus-branch/test map accordingly; publish the prepared CUDA-JS bootstrap when the private remote exists.

## Current risks and unknowns

- No project license has been selected. Third-party implementation reuse still requires exact license/provenance review, and public release requires a distribution license.
- CUDA-JS JIT ABI support, memory baseline, event-loop completion, compilation/linking, packaging, and context-health behavior remain open in the peer repository.
- UMCGS scheduling, graph layout, pressure, evaluator ABI, device teardown, and exact capsule budgets remain open pending search specifications and experiments.
- Cross-repository release automation and exact compatibility policy are not yet accepted.
- Candidate prior-art performance claims have not been reproduced on target hardware.
