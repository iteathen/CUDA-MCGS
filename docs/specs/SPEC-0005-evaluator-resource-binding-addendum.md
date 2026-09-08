# SPEC-0005 addendum: immutable initialization and device effects

**Status:** Proposal

Candidate implementation submitted with #124; acceptance requires protected integration after review.

**Owner:** CUDA-MCGS Program Package operation-binding meaning.

This additive candidate addresses two missing facts required by the evaluator composed path. It does not reopen evaluator semantics, Resource planning or CUDA-JS atomic/compiler/runtime ownership. Existing resource bindings that omit the new fields retain their canonical representation.

## Immutable artifact bindings

A resource-source operation binding may carry `artifact`, containing the selected `ownerProfile`, `artifactId`, `artifactIdentity`, `evaluatorResource` and `contentSha256`. Every value must agree with the selected normalized evaluator and Resource profiles. The first profile supports one whole non-aliased evaluator artifact partition per view, immutable engine lifetime and initialization before ignition. It rejects unsupported owners, mutable artifacts, mismatched provenance, bounds, placement or lifetime. Tensor/model meaning is not added to this generic package representation.

The binding requires an explicit read-only typed view. Its provider-relative range must be the exact Resource-owned partition of the selected evaluator artifact resource. Overlapping writes or device effects anywhere in the package are forbidden. Multiple identical read-only references may share an artifact; conflicting overlapping identities/extents are rejected.

Artifact references and resource views participate in canonical Program Package and execution-package identity. Runtime projection emits only the generic expected initial content digest; it does not ask CUDA-JS to interpret evaluator semantics. The CUDA-MCGS runtime adapter snapshots all supplied initialization bytes before its first asynchronous write, checks every declared digest over the exact bound range, and rejects disagreement before any write/submission. Caller mutation cannot change the admitted upload bytes. This is pre-ignition host work, not active search progression.

## Explicit device effects

`deviceEffects` is a distinct nonempty set of exact operation/order/scope declarations: `atomic-add-relaxed-device`, `atomic-cas-relaxed-device`, `atomic-load-acquire-device`, `atomic-store-release-device`. The first profile requires an explicit `u32` or `u64` view, the Resource `atomic` capability and the selected public CUDA-JS contracts. Acquire/release effects require `cuda-js.device-publication-release-acquire/0.1.0`; RMW effects use accepted Device-JS add/CAS.

With explicit effects, `access` describes the complete ordinary-plus-atomic read/write hazard envelope of the operation. It does not assert atomic ordering. Mutating atomic effects require `read-write`; acquire observation requires read access. CUDA-JS receives the public read/write lease/access envelope, while the exact source helpers and selected public contracts retain operation, order, scope and type meaning. No adapter parses Device-JS or infers effects from Resource capabilities. An ordinary binding without `deviceEffects` does not gain atomic/publication authority.

This is the explicit extension required by ACCESS-REP-004. It does not permit silently lowering an atomic requirement to ordinary `read-write`, nor introduce a generic memory-model language, host-visible mailbox workaround, native handle, or private CUDA-JS import.

## Admission, lifecycle and qualification

A resource-source binding may declare `initialization: "zero"` on an explicit non-artifact view. This declaration participates in identity and survives runtime projection. The adapter rejects absent or nonzero initial bytes before any write. SharedArrayBuffer input is rejected because no coherent cross-thread snapshot protocol is selected. Ignition reserves the prepared execution before asynchronous upload; concurrent ignition cannot submit twice.

A generated function may carry an exact `launchConstraint: { grid, block }`. All operations in a package containing that function must match both dimensions, even if the function is not reachable from a particular entry. This conservative first profile avoids inferring source call/collective behavior. The constraint participates in package identity and survives runtime projection; both admission boundaries reject drift. The caller still owns uniform entry by all lanes. No static proof of arbitrary uniform control flow is claimed.

The companion Progress candidate `cuda-mcgs.progress-evaluator-cohort/0.1.0` selects one independent-ready evaluator work class, one active batch, device flushing down to one item, cooperative claims, and explicit finite request/item/step bounds. One block enters every barrier collectively; lane zero forms each batch and applies external cancellation, while item lanes invoke evaluator-owned service callables. There are exactly `ceil(requestCapacity / itemCapacity)` service opportunities for an already-published cohort with no later producer. Evaluator owns prepare/execute/scatter/publication/cancellation/quiescence; Progress owns opportunities and references the selected work class. Unknown request states cannot satisfy quiescence. This service does not establish global Graph/Search closure or implement dependent readiness, multi-block fairness, concurrent producers, or general engine scheduling. Those profiles require separate qualification.

For imported Device-JS bodies, the runtime adapter selects public numeric-capable headers because an exposed f32 signature cannot exclude dense arithmetic in the opaque body. CUDA-JS remains the validator/compiler of the selected combined header profile.

Composer validates owner identity, resource chain, overlap, effects and public requirements. The runtime adapter independently validates projected ranges/effects/digests before realization or ignition as appropriate. Unknown or malformed fields on these boundaries must fail closed. Mutation of a meaning-affecting field changes package identity and invalidates dependent evidence.

Storage is owned by the existing CUDA-JS runtime adapter. Device operation terminality precedes view release, allocation release and runtime release. Failed or unproved lower cleanup retains the existing quarantine/dependency truth. Removing a selected evaluator removes its binding/init/effect references with its generated program and resources; unrelated owners remain intact.

Required evidence includes artifact identity/placement mutations; immutable/writable overlap; hash mismatch before writes; snapshot isolation across asynchronous writes; explicit effects/capability/order/type rejection; actual Program Package-to-runtime projection; one-operation device service; cancellation/failure and dependency-ordered cleanup. Portable tests do not prove CUDA memory ordering, native compilation or hardware behavior. These physical gates remain separately open.
