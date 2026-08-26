# ADR-0022: Distinguish Root, Advance, Reroot, and Attention

**Status:** Accepted

**Date:** 2026-08-25

## Context

ADR-0021 correctly separated lightweight directional attention from structural root change, but it used **root advance** for every authoritative root change and rejected **reroot** as a public term. That two-way split is not sufficient.

A continuing search commonly learns that one already represented successor is now the realized path. The framework must stop spending useful work on sibling occurrences and continue from that successor with the least possible coordination. Treating this common case as a general root transaction permits validation, reuse classification, reset, transformation, traversal and cleanup machinery on a latency-sensitive path even when none is needed.

Other root changes genuinely are heavier. A caller may supply a root not already ready as the realized successor, change representation or semantic context, require new admission, or request reset/reconciliation. Calling both cases `advance` hides materially different cost and lifecycle contracts. Calling directional weighting either kind of root change is equally false.

The framework therefore needs four distinct concepts whose names remain truthful across domains, transpositions and finite multi-device execution.

## Decision

CUDA-MCGS uses these public terms and boundaries:

- **root** establishes the initial authoritative search origin during session construction or ignition;
- **advance** moves the authoritative root along one declared, already realized transition to an already ready successor;
- **reroot** performs a general authoritative root change that cannot satisfy the advance contract; and
- **attention** changes directional weighting, objective or service allocation without changing the authoritative root.

These are separate semantic operations. A generic root transaction with mode flags must not erase their different admission, cost, invalidation, failure or cleanup rules.

### Root

Initial root establishment validates and admits the starting semantic state before search ignition. It is part of the universal session/input lifecycle, even when later advance, reroot and attention capabilities are absent. A concrete engine has exactly one current authoritative root per selected search replica.

### Advance

Advance is the minimum-work continuing-search operation. Public phrasing such as **advance root to node X** means that exact operation, not a reset. It is valid only when the caller identifies an existing ready successor through a realized transition from the current authoritative root occurrence and every required resource was already admitted. Its publication and per-participant adoption are bounded independently of retained graph size, pending work count and search depth.

Advance:

- changes the authoritative root occurrence without transforming or copying semantic state;
- preserves compatible work beneath the selected occurrence;
- lazily marks work scoped only to sibling or superseded occurrences as `superseded-by-advance` at existing bounded checkpoints;
- invalidates occurrences and occurrence-scoped work, not shared graph nodes merely because they were reachable through an old path;
- preserves a transposed node when another valid occurrence or retained owner reference still reaches it;
- performs no graph traversal, retained-state reclassification, reset, resource resize, reclamation or eager cleanup;
- does not require a steady-state host polling/relaunch/callback loop; and
- does not require a global multi-GPU barrier. Each participating device adopts an explicitly ordered advance at its declared bounded safe point.

If lookup, semantic reconstruction, representation conversion, allocation, broad validation, reuse classification or reset is required, the operation is not an advance and must be rejected without mutation. A caller may instead submit an explicit reroot operation; the framework does not silently upgrade advance into reroot.

### Reroot

Reroot is the general authoritative root-change operation. It may admit an externally supplied state, select a non-successor retained state, change semantic context, reset incompatible work, reconcile owners, classify retained state, or coordinate later reclamation. It may therefore use bounded prepare/commit/abort and owner-specific reuse/stale-work machinery.

Reroot remains lazy where correctness permits: its authority publication must not synchronously traverse the retained graph or reclaim all stale storage merely for tidiness. Any work proportional to retained state belongs to explicit owner maintenance/reclamation with finite budgets, not an undocumented reroot side effect.

### Attention

Attention is an independently versioned outside objective, directional weighting or service-allocation publication. It does not change root identity, authorize graph mutation, invalidate already admitted work, classify reuse, resize resources or trigger reclamation. It is applied at an already selected bounded device safe point without steady-state host polling or a forced global multi-GPU barrier.

An engine that does not select attention has no attention-owned input, version, publication, status, resource, port, cleanup item or generated branch.

### Ordering and provenance

The normalized representation and work provenance must distinguish:

1. the current root incarnation established initially or by reroot;
2. ordered advances within that incarnation; and
3. attention ordering independent of root authority.

Names such as `rootEpoch`, `advanceVersion` and `attentionVersion` are illustrative, not mandated field names. The required invariant is that stale/superseded work, compatible descendant work and attention visibility can be classified without graph traversal, ambiguity or a global barrier.

Selected operations must have separate schema/IR commands and owner effects. Their absence must remove operation-owned runtime and generated residue exactly. Native qualification must measure actual publication/adoption cost; this decision makes no literal zero-cycle claim.

## Rationale

Each operation is one LEGO brick:

- root owns initial authority;
- advance owns cheap continuation along an already realized path;
- reroot owns general authority replacement and reconciliation; and
- attention owns non-structural focus.

This vocabulary makes performance implications visible instead of hiding them behind convenience. It also preserves graph truth: changing the authoritative occurrence does not imply deleting shared nodes or erasing transposition value.

The advance contract deliberately excludes work that scales with retained state. That makes the common continuing-search path independently measurable and prevents cleanup, reset or compatibility machinery from becoming an accidental hot-path tax.

## Consequences

- ADR-0021 is superseded. Its attention separation remains sound, but its use of root advance for the heavier general transaction is not current authority.
- Proposal SPEC-0006 and proposal Search IR 0.2.0 currently encode the broad reroot lifecycle under `rootTransaction`/root-advance terminology and do not represent all four operations distinctly.
- The current Composer, projection and semantic-reference identities remain valid evidence for their exact historical proposal inputs, but they are not evidence of ADR-0022 conformance.
- A bounded `REF-ROOT-CONTROL-01` reconciliation leaf must update SPEC-0006, schema/normalization/composition, fixtures, deletion/identity evidence and affected reference routing before `REF-GRAPH-01` begins. That leaf will deliberately invalidate and regenerate affected proposal-derived evidence keys.
- Graph reference work must distinguish shared nodes from root/path occurrences so later advance semantics cannot force node deletion or eager cleanup.
- Historical prototypes, results and archived records retain their original `reroot` terminology as provenance. Current authority and explanatory documentation must label that wording historical rather than rewrite evidence.
- Multi-GPU profiles must define ordered per-device adoption and provenance without making a global barrier universal. This does not force multi-GPU selection where it is not naturally useful.

## Alternatives considered

### Keep root advance as the general transaction

Rejected. It makes the most common ready-successor transition appear to authorize reset, classification and cleanup machinery, obscuring the required minimal-cost contract.

### Call the lightweight operation commit

Rejected. `commit` is overloaded by source-control and transaction vocabulary and does not communicate directional continuation.

### Treat advance as a fast flag on reroot

Rejected. One transaction with modes permits reroot-only owners and effects to survive in the advance path and weakens exact absent-operation deletion.

### Use attention to select the realized successor

Rejected. Attention changes priority, not authority. Sibling work remains valid under attention and becomes superseded under advance; conflating them breaks lifecycle meaning.

### Reclaim superseded branches during advance

Rejected. Eager traversal/reclamation adds work proportional to retained state and can destroy transposed value. Advance publishes authority and provenance; reclamation remains separately owned and lazy.

## Compatibility and migration

This is a proposal-stage semantic correction before production implementation or a stable public API. No compatibility shim is required. The existing proposal artifacts are frozen evidence for their exact inputs and must not be relabeled as conforming.

`REF-ROOT-CONTROL-01` must perform the migration coherently rather than partially renaming prose. Until that leaf integrates:

- new Graph implementation is blocked;
- SPEC-0006 and Search IR 0.2.0 root-advance wording is known superseded proposal vocabulary;
- issue #113 remains the coordination owner; and
- accepted Search IR 0.1.0 and immutable historical evidence remain unchanged.

## Validation

The reconciliation leaf must provide schema, normalizer, composition and reference evidence proving at least:

- distinct initial root, advance, reroot and attention operations;
- advance accepts only an already ready realized successor and rejects reroot-only work;
- selected-descendant work remains compatible while sibling-occurrence work becomes `superseded-by-advance` lazily;
- a shared transposed node is not invalidated merely because one root occurrence is superseded;
- advance performs no graph-size-dependent traversal, copying, transformation, reset, resize, reclassification, reclamation or eager cleanup;
- reroot owns the general reconciliation lifecycle without requiring eager retained-graph cleanup;
- attention changes neither root authority nor admitted-work validity;
- unselected advance, reroot and attention each leave exact zero owned residue;
- independent operation ordering and per-device adoption are unambiguous without a universal global barrier; and
- all affected proposal identities, requirement routes and documentation digests reconcile on one exact revision.

Native cost, concurrency and compatible-pair claims remain later qualification gates.

## Revisit triggers

Revisit if two materially different consumers require an operation that fits none of the four invariants, if measured native evidence shows a required advance effect cannot be bounded independently of retained state, or if a multi-device correctness contract genuinely requires stronger synchronization for a selected profile.

## Supersedes / superseded by

This decision supersedes ADR-0021 in full while retaining its attention-separation rationale where consistent with this four-operation model.
