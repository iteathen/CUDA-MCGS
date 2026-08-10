# Review Standard

**Scope:** Reusable foundation.

Review the complete owned change, not isolated lines.

## Authority and scope

- Owner intent and accepted authority are satisfied.
- Proposals/archives were not treated as current authority.
- One source of truth remains for every changed behavior.
- No unrelated cleanup or hidden ownership movement entered the change.

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
- Reference/conformance cases pass.
- Performance claims have a fair baseline and quality guardrail.
- Unknowns and unsupported cases are explicit.

## Documentation and publication

- Status, indexes, registry, specs/ADRs, and supersession are reconciled.
- Third-party provenance and licensing are recorded.
- Final diff/status are intentional.
- The remote state is verified before publication is claimed.
