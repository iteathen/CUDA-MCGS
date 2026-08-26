# ADR-0021: Separate Attention from Root Advance

**Status:** Accepted

**Date:** 2026-08-25

## Context

The Search Session proposal originally admitted structural root changes and externally supplied attention/control changes through one generalized session transaction. That representation was safe against partial mutation, but it gave a directional priority update the lifecycle and vocabulary of a root change. It also made every selected session owner appear to participate in every root transaction.

That coupling is semantically false and risks unnecessary work in the search hot path. A root advance changes the authoritative graph anchor and may require epoch isolation, state-reuse classification, resource admission and stale-work disposition. Attention changes only an accepted outside objective, directional weighting or owner-declared service allocation. Treating attention as a root update could authorize graph traversal, invalidation, reclamation or global synchronization even when none is required.

The owner direction is to prefer attention for directional changes, reserve structural root work for genuine root changes, and keep both as lazy and bounded as correctness permits. Multi-GPU profiles must also avoid a forced global barrier when independent devices can observe the next attention version at their own declared safe points.

## Decision

CUDA-MCGS uses these public terms and boundaries:

- **root update** or **root advance** changes the authoritative root anchor;
- **attention change** changes a versioned outside objective, directional weighting or service allocation without changing that root; and
- **reclamation** retires or reuses storage under its owning lifetime rules.

`reroot` is not the public operation name. It may remain in immutable historical evidence or an owner-local compatibility vocabulary only where it means a genuine structural root update.

A root advance uses one bounded root transaction. Only owners whose selected state can be affected by root identity participate in prepare/commit/abort/reuse/stale-work coordination. A compile-time-known root-independent owner is omitted. Root commit work is bounded independently of retained graph size; reset, invalidation and reclamation are generation-based or lazy where their owning contracts permit.

Attention is a distinct, owner-scoped, independently versioned publication. It:

- uses pre-admitted finite command/publication capacity;
- may coalesce only under its declared version rule;
- is applied as queued device control work at an already selected safe point;
- does not advance the root epoch, change root identity, traverse or relabel graph state, invoke root-reuse classification, invalidate already admitted work, resize active resources or trigger reclamation;
- requires no steady-state host polling, relaunch, callback loop or attention-only device polling path; and
- requires no global multi-GPU barrier. Each participating device observes the applicable version at its declared safe point while session ordering and terminal/cancellation rules remain explicit.

Attention absence must remove every attention-owned input, generation counter, publication, status, port, cleanup item and generated branch. This is a schema/reference semantic decision; it does not prove native safe-point cost or qualify a CUDA-MCGS/CUDA-JS pair.

One selected attention profile is sufficient for the current proposal because its schema can express a bounded multidimensional directional allocation while preserving one authority and version order. A later genuinely independent semantic owner must enter as a separately selected capability/contract rather than silently creating multiple attention authorities.

## Rationale and evidence

The retained CUDA-free session and Connect Four prototypes use their historical `reroot` operation for genuine root-anchor changes and already separate commit from reclamation; the audit found no production runtime to correct. The defect was in SPEC-0006 and the proposal Search IR session profile, where attention was modeled as a participant in the generalized transaction.

Separating the two operations gives each LEGO brick one invariant and lifecycle: the root transaction owns structural authority change, while attention publication owns directional input visibility. It also removes root-independent owners from structural coordination and makes the performance constraint machine-checkable: no graph-size work, no root/reclamation effect, no steady-state polling and no global barrier may be selected by an attention profile.

## Consequences

- SPEC-0006 advances to draft 0.2.0 and its source identity changes.
- Proposal Search IR 0.2.0 replaces the generalized session `transaction`/`controls` representation with `rootTransaction` and an optional selected `attention` profile.
- Session normalizers reject root-independent transaction participants and attention that is root-scoped, graph-affecting, reclamation-triggering, host-progress-dependent or globally synchronized.
- Existing downstream Composer identities derived from the proposal packet are invalidated and regenerated; accepted Search IR 0.1.0 remains unchanged.
- Native qualification must measure actual root-advance and attention application cost and prove the declared multi-device visibility. Structural/reference evidence cannot claim zero-cycle native behavior.

## Alternatives considered

### Rename the combined operation only

Rejected. Calling the existing all-owner transaction "attention" would preserve the unwanted root/reuse/reclamation lifecycle and hide rather than fix the coupling.

### Keep one generalized transaction with operation flags

Rejected. Its optional branches would make the common directional path carry root machinery and allow an invalid combination of semantics to survive normalization.

### Make every external session command an independent generic transaction

Rejected. Root advance, attention, observation and cancellation have different authority, visibility, failure and cleanup rules. A generic transaction interpreter would centralize owner meaning and add runtime machinery.

### Apply attention immediately on every GPU

Rejected. A forced barrier or interrupt-like global update is unnecessary for directional weighting and can add latency to the search hot path. Versioned safe-point visibility is the truthful weaker contract.

## Compatibility / migration

This ADR corrects proposal-only SPEC-0006 and Search IR 0.2.0 evidence before acceptance or production implementation. It does not change accepted Search IR 0.1.0 or a released public API. Downstream proposal fixtures, identities and evidence must be regenerated from the revised SPEC-0006 source digest.

Historical prototype names and archived records are not rewritten. Current explanatory documentation should prefer root update/root advance and reserve attention for the non-structural operation.

## Validation

Validation requires strict schema and normalizer cases proving:

- exact selected/absent attention specialization;
- no root-epoch, graph-work, reclamation, steady-state-polling or global-barrier attention profile;
- independent attention generation and per-device safe-point visibility;
- exact omission of root-independent transaction owners;
- unchanged accepted Search IR 0.1.0 evidence; and
- full documentation/catalog digest reconciliation.

Native performance, concurrent-device visibility and compatible-pair evidence remain later qualification gates.

## Revisit triggers

Revisit if measured implementation evidence shows that the selected safe point cannot apply attention with bounded state-independent work, if a second independent attention authority is required by two materially different consumers, or if a root-affected owner cannot express lazy/generation-safe transition without full retained-graph traversal.

## Supersedes / superseded by

This decision narrows the Search Session portion of ADR-0018 and corrects the combined-control assumptions in proposal SPEC-0006 draft 0.1.0. It does not supersede either record in full.
