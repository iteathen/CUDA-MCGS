# Cross-Component Tests

Only integration, system, end-to-end, lifecycle, and cross-component compatibility capsules live here.

Unit tests and component-contract capsules stay with the owning component. Conformance-domain capsules live under [`../conformance/`](../conformance/README.md). System benchmarks live under [`../benchmarks/`](../benchmarks/README.md).

Tests consume public surfaces unless a test explicitly owns an internal invariant within the same component.

## Capsule rules

- One capsule owns one coherent boundary, path, lifecycle, or compatibility claim.
- Related cases share build/setup/environment where safe but retain stable case IDs, isolated mutable state, direct case selection, and per-case results.
- Do not create one cross-component file/command per discovered example; bank intents and consolidate them at the owning boundary.
- Do not duplicate component-local evidence here unless the test adds real producer-consumer or end-to-end value.
- Declare exact evidence-key dimensions, expected discovery/skip counts, runtime/output budgets, invalidation inputs, and escalation triggers.
- Focused integration smoke is the normal branch gate; deep/forensic system evidence is triggered by risk, mismatch, stabilization, or release.
- Reuse unchanged exact evidence and avoid duplicate fast workflows for one head.
- Provisional system reproducers, copied fixtures, diagnostics, and logs are removed or archived after durable equivalent capsule coverage.

See [`../agent_files/general_foundation/TESTING.md`](../agent_files/general_foundation/TESTING.md).
