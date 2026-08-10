# Review Standard

**Scope:** Reusable foundation.

Review the complete owned change, not isolated lines.

Ordinary PR review and a declared sanity/audit claim are not identical. PR review may be bounded to the change. A full sanity claim additionally requires complete coverage accounting, focused review branches, semantic interrogation, and integrated reconciliation under [`SANITY_CHECKING.md`](SANITY_CHECKING.md).

## Authority and scope

- Owner intent and accepted authority are satisfied.
- Proposals/archives were not treated as current authority.
- One source of truth remains for every changed behavior.
- No unrelated cleanup or hidden ownership movement entered the change.

## Assessment and plan

- The assessment precedes the implementation plan for substantial or critical work.
- Applicable question groups were resolved, linked to accepted authority, or explicitly assigned to research/experiment/blocker status.
- The strongest credible case against the proposal is stated fairly rather than caricatured.
- Valid criticism changed the design, scope, sequencing, validation, or disposition.
- Important claims have evidence or decisive falsifiers; implementation is not being used to avoid an unresolved design.
- The plan follows one coherent ownership boundary, orders work by dependency and uncertainty, and pairs validation with each material step.
- Stop, rollback, migration, failure, recovery, and cleanup conditions are explicit where material.
- The record is proportional: existing authority is linked, duplicate ledgers are absent, and ongoing manual accounting has a named owner and real decision value.

## Sanity claim and semantic review

When a sanity or audit claim is present:

- the exact revision/artifact and `full`, `bounded`, or `sampled` claim are named;
- self-sanity and independent review are distinguished;
- included/excluded surfaces and the complete semantic coverage map are explicit;
- coverage is split into review branches by owner, boundary, path, cross-cutting concern, or artifact;
- every leaf branch has one primary semantic owner or coherent path, complete semantic-unit inventory, and a sizing rationale proving one focused session can cover it without sampling or skimming;
- every declared surface is accounted for at risk-justified depth;
- every material semantic unit addresses purpose/specification, owner/LEGO boundary, inputs/outputs/effects, callers/dependencies, state/identity/lifetime, foundational contracts/ranges, design-principle alignment, ordering/resources/pressure, failure/cleanup, a credible counterexample, decisive evidence, and wider impact;
- objectively triggered design/universality, graph/search, evaluator/numeric, GPU/concurrency, finite-memory, persistence, compatibility, security, generated/JIT/ABI, external-resource, performance, destructive, and diagnostic modules are resolved or blocked;
- specifications and design principles are compared to the actual mechanism rather than merely cited;
- component boundaries, critical end-to-end paths, cross-cutting concerns, lifecycle, contradictions, and review-created state are reconciled;
- passing leaf branches are not treated as integrated system proof;
- tests and tools support rather than replace mechanism understanding;
- changed revisions invalidate and rerun affected branch, boundary, and path evidence;
- actionable independent findings are durable and were not quietly repaired;
- checks not run and claim limits are explicit.

A sampled, overbroad, or silently incomplete review cannot be approved as a full sanity claim. Full coverage does not require exhaustive review of unrelated low-risk units.

## Design hierarchy and simplicity

- Domain truth, authority, purpose, operating bounds, and concern weighting are explicit.
- The component has one coherent responsibility and one visible owner of state/lifecycle.
- LEGO ports, injected dependencies, adapters, and replacement/test boundaries are valid.
- SOLID responsibilities are separated where meaning/change/testing requires it, without ceremonial decomposition.
- CUPID qualities are present: composable, focused, predictable, idiomatic, and domain-based.
- The design is the simplest sufficient **total system**; complexity was not merely moved to callers, generated code, memory, synchronization, recovery, diagnostics, or tests.
- Reusable concepts pass maximum-accurate-generality, second-instance, first-consumer deletion, and inclusion/exclusion tests.
- No forbidden broad manager, service locator, hidden registry, false abstraction, or unbounded resource was introduced.

## Organization and ownership

- Every artifact has a durable product area and component.
- New/moved components have current README, manifest, registry, validation, and migration.
- Root and top-level namespaces remain clean.
- Public/internal boundaries are visible.
- Cross-component dependencies are declared, acyclic, and use public contracts.
- No catch-all helper/common/shared dumping ground or deep import was introduced.
- Placement remains sensible at an order-of-magnitude larger project scale.
- Repo/package/service splits are justified by lifecycle, not file count.

## Contracts and universality

- Inputs, outputs, errors, lifecycle, compatibility, and resource behavior are explicit.
- No first-domain or first-hardware assumption entered a universal contract.
- Specialization remains behind the universal boundary.
- Persistent data, identifiers, and lifetimes remain valid across transitions.

## Concurrency and resources

- Ranges, precision, overflow, capacity, watermarks, and exhaustion are justified.
- Synchronization, publication ordering, cancellation, and stale references are safe.
- Production device-residency requirements remain intact where applicable.

## Evidence

- Validation observes the claimed mechanism and behavior.
- Organization checks and component-owned tests pass.
- Reference/conformance cases pass.
- Performance claims have a fair baseline and quality guardrail.
- Unknowns and unsupported cases are explicit.

## Documentation and publication

- Status, indexes, registry, component manifests, specifications/ADRs, findings, and supersession are reconciled.
- Third-party provenance and licensing are recorded.
- Final diff/status are intentional.
- The remote state is verified before publication is claimed.
