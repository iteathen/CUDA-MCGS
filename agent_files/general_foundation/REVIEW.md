# Review Standard

**Scope:** Reusable foundation.

Review the complete owned change, not isolated lines.

## Authority and scope

- Owner intent and accepted authority are satisfied.
- Proposals/archives were not treated as current authority.
- One source of truth remains for every changed behavior.
- No unrelated cleanup or hidden ownership movement entered the change.

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

- Status, indexes, registry, component manifests, specifications/ADRs, and supersession are reconciled.
- Third-party provenance and licensing are recorded.
- Final diff/status are intentional.
- The remote state is verified before publication is claimed.
