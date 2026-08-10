# UMCGS Status

**Status:** Informational

**Updated:** 2026-08-10

## Phase

Private pre-release framework definition and evidence gathering. `main` is the integration trunk for short-lived `feature/*` and `agent/*` branches. No production runtime implementation or final UMCGS component decomposition has been accepted.

## Accepted project state

- The generic graph-search framework—not chess or another first domain—is the first UMCGS product.
- UMCGS owns Search IR, search semantics, finite search-resource planning, specialized search device programs, search conformance, and the UMCGS-to-CUDA-JS adapter/package contract.
- The generic Node.js/CUDA Driver runtime is an independent peer product named `CUDA-JS`; it owns JIT/native bindings, opaque resources, generic memory capabilities, NVRTC/link/load, launch/completion/error/teardown, packaging, and runtime conformance.
- UMCGS depends on CUDA-JS through versioned public packages/artifacts and compatibility manifests. CUDA-JS cannot depend on UMCGS. Git submodules and private-source reach-through are prohibited.
- The UMCGS CUDA-JS adapter remains in UMCGS. No third repository is created until an independent lifecycle is demonstrated.
- Active search must remain device-closed after ignition. A host micro-batch relaunch loop is non-conforming when UMCGS progress depends on it.
- Concrete engines are finite and resource-planned; contracts are universal and generated hot paths are specialized.
- Managed memory is not the foundational or universally zero-copy search arena. Search-hot device storage and bounded host-visible control/completion data are separate contracts.
- Repository and component organization assumes mature large-project scale from inception.
- Adversarial assessment, focus branches, token reserves, consolidated test capsules, governed execution, cleanup, sanity, and exact-head guarded integration remain binding.
- Material test debt, token debt, invalid partial state, unsafe cleanup debt, and unintegrated branch outputs block completion.
- Project license selection is deferred and does not block original private pre-release work.

## Current authority

- Project charter: accepted and narrowed to UMCGS search ownership.
- ADR-0001 through ADR-0013: accepted.
- ADR-0014 generic CUDA-JS runtime extraction: accepted.
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

Define and adversarially validate the version-zero UMCGS-to-CUDA-JS execution-package, capability, compatibility, conformance, and error/lifetime contract; revise the SPEC-V0 focus-branch/test map accordingly; publish the prepared bootstrap when the private remote exists.

## Current risks and unknowns

- No project license has been selected. Third-party implementation reuse still requires exact license/provenance review, and public release requires a distribution license.
- CUDA-JS JIT ABI support, memory baseline, event-loop completion, compilation/linking, packaging, and context-health behavior remain open in the peer repository.
- UMCGS scheduling, graph layout, pressure, evaluator ABI, device teardown, and exact capsule budgets remain open pending search specifications and experiments.
- Cross-repository release automation and exact compatibility policy are not yet accepted.
- Candidate prior-art performance claims have not been reproduced on target hardware.