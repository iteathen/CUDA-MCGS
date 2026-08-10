# ADR-0008: Exact-Head Pull-Request Review and Guarded Merge

**Status:** Accepted

**Date:** 2026-08-10

## Context

Pull-request approval can become a weak ritual: reviewers trust the PR description, inspect only selected files, treat green CI as proof, approve one head and merge another, or press merge without rechecking target, checks, threads, closure, and branch effects.

The opposite failure is release-grade ceremony on every private development change, creating review records and independent approvals whose cost exceeds the risk they protect.

UMCGS needs a phase- and consequence-aware discipline that preserves exact-head review and guarded integration without unnecessary administrative accounting.

The project owner directed UMCGS to adapt the mature pull-request discipline from Ars Thaumaturgica. Source provenance:

- `iteathen/Ars-Thaumaturgica` commit `c3e25ad1032a1927c9709580fb415ffc48b91020`;
- `docs/foundation/pull-request-review-and-merge.md`;
- `docs/foundation/development-phases-and-validation.md`;
- `docs/foundation/github-backed-work-coordination.md`.

The UMCGS doctrine adds integration with its assessment, sanity, semantic-interrogation, GPU/device-closure, finite-memory, graph/search, generated/JIT/ABI, and search-quality rules. UMCGS files are authoritative; Ars Thaumaturgica is provenance rather than a runtime dependency.

## Decision

UMCGS adopts exact-head pull-request review and guarded merge.

Every material PR receives complete author-side review before readiness. Independent review is required by project phase, repository protection, owner instruction, or objective consequence—not merely by diff size.

Every durable review decision names the exact PR head SHA, intended base/comparison, review mode, changed-surface accounting, decisive evidence, findings, result, and limits. The actual diff and affected context are reviewed; the PR description and CI are claims/evidence rather than proof.

A head change invalidates affected review and authorization. A material base change invalidates affected integration evidence.

Merge is a separate transaction. Immediately before integration, the agent revalidates PR state, exact head, target, ancestry/mergeability, required reviews/checks/CODEOWNERS/protection, unresolved blocking threads/findings, issue closure, branch/dependency effects, conflicting work, and deliberate merge method. An expected-head guard is used where supported. Protections and target history are never bypassed or force-updated merely to complete the merge.

Post-merge verification records the resulting target SHA, confirms the intended tree/result, reconciles issue and branch effects, and updates dependent work.

## Current phase policy

UMCGS is private and pre-release. `main` is the integration trunk; short-lived `feature/*` and `agent/*` branches target `main`.

For ordinary low-consequence work, complete author-side review may authorize merge when repository policy permits. One coherent PR normally uses squash merge.

Independent review remains mandatory for stabilization/release, incidents/full audits, protected/CODEOWNERS paths, security/trust, persistence/migration/recovery, public compatibility, third-party provenance/licensing, destructive behavior, difficult concurrency/publication, or unusually broad/opaque high-blast-radius changes.

A future post-release branch/release model requires an explicit policy transition; it is not created speculatively now.

## Single-maintainer exact-head exception

When independent GitHub approval is structurally unavailable, the repository owner may authorize one exact head after complete author-side review and all other triggered evidence.

The record must state the sole-maintainer condition, exact head, reason, decisive checks, limits, absence of blockers, and explicit merge authorization. It is not independent review and cannot waive protection, CODEOWNERS, required checks, or substantive evidence. A head change invalidates it.

## Merge methods

- **Squash** is the default for one coherent result whose intermediate commits have no durable value.
- **Rebase** is reserved for independently meaningful, reviewed linear commits when rewritten SHAs do not violate provenance or dependencies.
- **Merge commit** is reserved for branch topology, coordinated integration, or multiple durable commits that must remain visible.

Method selection is deliberate and recorded when non-obvious.

## Consequences

- Agents inspect the complete changed surface and affected integration rather than only the latest commit or PR description.
- Author-side readiness is not mislabeled as independent approval.
- Reviews, approvals, and owner authorizations are exact-head capabilities rather than timeless opinions.
- Required checks, protections, blocking threads, and issue closure are revalidated at merge time.
- Routine PRs do not require standalone review records; high-consequence or durable review may use one canonical template.
- Merge completion is not claimed until the target branch and resulting SHA are verified.
- Bad integrations are reverted or corrected through reviewed PRs rather than erased by rewriting shared `main`.

## Alternatives considered

### Trust green CI and mergeability

Rejected. CI observes configured checks and can share wrong assumptions, omit affected behavior, run against stale heads, or fail to expose integration/ownership defects.

### Require independent approval for every private-development PR

Rejected as disproportionate administrative cost. Complete author-side review remains mandatory; independent review is triggered by risk, phase, policy, or owner instruction.

### Treat approval and merge as one action

Rejected because PR state, head, base, checks, threads, and conflicting work can change after review.

### Merge first and verify only when a problem appears

Rejected because target, closure, and branch mistakes are cheapest to detect immediately and become harder to attribute later.

### Force-update the target when guarded merge is inconvenient

Rejected because it bypasses repository protections, hides integration history, and can discard concurrent work.

## Validation

Agent entry points, AI rules, workflow, review standard, validation policy, PR template, governance indexes, and required-file checks must route PR review/merge work to the doctrine.

The doctrine is dogfooded on its own publication PR: exact head is reviewed, checks and discussion are inspected, review mode is labeled honestly, the merge uses an expected-head guard, and the integrated target SHA is verified.

## Revisit triggers

Revisit when UMCGS enters stabilization/public release, activates a post-release `next`/release-branch model, changes branch protection or merge queue policy, adds multiple maintainers, or repeated review experience shows either missed integration defects or disproportionate process cost. Changes require a superseding ADR rather than silent weakening of exact-head and guarded-merge guarantees.
