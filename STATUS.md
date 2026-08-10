# UMCGS Status

**Status:** Informational

**Updated:** 2026-08-10

## Phase

Private pre-release framework definition and evidence gathering. `main` is the integration trunk for short-lived `feature/*` and `agent/*` branches. No production runtime implementation or final UMCGS component decomposition has been accepted.

## Accepted project state

- The generic graph-search framework—not chess or another first domain—is the first UMCGS product.
- UMCGS owns Search IR, search semantics, finite search-resource planning, specialized search device programs, search conformance, and the UMCGS-to-CUDA-JS adapter/package contract.
- Generic Node.js/CUDA Driver runtime behavior belongs to the independent peer `CUDA-JS`; dependency direction is one-way through versioned public artifacts.
- Active search remains device-closed after ignition. Concrete engines are finite/resource-planned; contracts are universal and hot paths specialized.
- Engineering decisions begin with an explicit contract and material specification-obligation map.
- Hard gates are evaluated before objectives, qualities, and process costs; weighted scoring cannot make an invalid path valid.
- Work is prioritized P0 containment, P1 gate/foundation, P2 information/risk/dependency unlock, P3 mission value/measured efficiency, then P4 supporting quality/polish.
- Token use is continuous backpressure on **every** task, including routine work.
- Token backpressure reduces duplication, repeated evidence, fragmented work, cold context, optional polish/breadth, and scope before it reduces rigor.
- Every task preserves a risk-appropriate minimum practice floor: request/authority, current-state inspection, coherent scope, expected result, decisive verification, actual-effect inspection, relevant testing, cleanup, and honest limits.
- Routine work uses an implicit micro-budget without a required ledger. Substantial/critical work preserves explicit reserves and split/handoff triggers.
- Soft token estimates are replan signals, not authority to skip practice. Essential evidence or cleanup may justify an explicit extension, narrowed scope, split, or handoff.
- Reduced evidence narrows the claim. Sampling or lower test tiers cannot support an unchanged full/release-grade claim.
- Adversarial assessment, focus branches, consolidated test capsules, governed execution, cleanup, sanity, and exact-head guarded integration remain binding.
- Material decision debt, test debt, token debt, invalid partial state, unsafe cleanup debt, and unintegrated branch outputs block completion.
- Repository/component organization assumes mature scale from inception.
- Project license selection is deferred and does not block original private pre-release work.

## Current authority

- Project charter: accepted and narrowed to UMCGS search ownership.
- ADR-0001 through ADR-0015: accepted.
- ADR-0016 universal token backpressure and minimum practice floor: accepted.
- Framework architecture overview and detailed version-zero contracts: proposals.
- UMCGS-to-CUDA-JS execution-package contract: not yet accepted.
- CUDA-JS repository charter/bootstrap: prepared locally; remote publication pending.

## Prepared CUDA-JS bootstrap

- Intended private repository: `iteathen/CUDA-JS`.
- Local bootstrap commit: `cd44a3da58fad67153f8123525fcb9ec3bddab9f`.
- Account-level GitHub repository creation is not exposed by the connected capability; this is a publication blocker, not falsely reported as complete.

## Current next boundary

Define and adversarially validate the version-zero UMCGS-to-CUDA-JS execution-package contract using accepted engineering judgment, testing, and universal token-backpressure rules; revise the SPEC-V0 map accordingly; publish the prepared CUDA-JS bootstrap when the private remote exists.

## Current risks and unknowns

- No project license has been selected; third-party reuse and public distribution still require provenance/license compatibility.
- CUDA-JS JIT ABI support, memory baseline, event-loop completion, compile/link/load, packaging, and context-health behavior remain open in the peer repository.
- UMCGS scheduling, graph layout, pressure, evaluator ABI, device teardown, and exact capsule budgets remain open pending specifications and experiments.
- Cross-repository release automation and exact compatibility policy are not yet accepted.
- Candidate prior-art performance claims have not been reproduced on target hardware.
