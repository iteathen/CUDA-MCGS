# Cross-Component Tests

Only integration, system, end-to-end, lifecycle, and cross-component compatibility tests live here.

Unit tests and component-contract tests stay with the owning component. Conformance-domain suites live under [`../conformance/`](../conformance/README.md). System benchmarks live under [`../benchmarks/`](../benchmarks/README.md).

Tests consume public surfaces unless the test explicitly owns an internal invariant within the same component.
