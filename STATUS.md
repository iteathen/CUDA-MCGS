# UMCGS Status

**Status:** Informational

**Updated:** 2026-08-10

## Phase

Private pre-release framework definition and evidence gathering. `main` is the integration trunk for short-lived `feature/*` and `agent/*` branches. No production runtime implementation or final component decomposition has been accepted.

## Accepted project state

- The generic framework—not chess or another first domain—is the first product.
- Active search must be device-closed after ignition.
- Concrete engines are finite and resource-planned.
- Contracts are universal; hot paths are specialized.
- UMCGS will be built as a new framework while using prior art as references and benchmarks.
- Repository and component organization assumes mature large-project scale from inception.
- Adversarial assessment precedes planning for substantial and critical work; one proportional combined record is the default.
- Material plans execute through current dependency-ready nodes with expected-before-actual operations, explicit falsifiers/deviations, and no invalid partial state.
- Sanity checks freeze exact targets, declare full/bounded/sampled claims, use risk-justified semantic depth, reconcile integration/lifecycle, and preserve actionable findings without unnecessary per-file accounting.
- Material PRs receive complete exact-head author-side review; independent review follows phase/risk/policy triggers; merge is a separate guarded transaction with post-merge target verification.
- LEGO macroscopic ownership, SOLID internal responsibility, CUPID implementation quality, and total-system simplicity govern design.
- Canonical agent governance lives in `agent_files/`.
- Project license selection is deferred and does not block original private pre-release work.

## Current authority

- Project charter: accepted.
- ADR-0001 prior-art disposition: accepted.
- ADR-0002 universal contracts / specialized engines: accepted.
- ADR-0003 device-resident active search: accepted.
- ADR-0004 large-project organization: accepted.
- ADR-0005 LEGO design hierarchy: accepted.
- ADR-0006 adversarial assessment and planning: accepted.
- ADR-0007 proportional sanity checking: accepted.
- ADR-0008 exact-head PR review and guarded merge: accepted.
- ADR-0009 governed plan execution: accepted.
- Framework architecture overview and specification map: proposals.
- Detailed normative Search IR/domain/policy/evaluator/resource specifications: not yet accepted.

## Current risks and unknowns

- No project license has been selected. This is not a current blocker, but third-party implementation reuse still requires exact license/provenance review, and a release/distribution license must be selected before public release.
- CUDA scheduling, JIT/linking, graph layout, memory-pressure, and evaluator ABI choices remain open pending specifications and experiments.
- Candidate prior-art performance claims have not yet been reproduced on UMCGS target hardware.
- A future stabilization/release or post-release branch model has not been activated; that transition requires an explicit policy decision.
