# Accountability and Observability

**Scope:** Reusable foundation.

Accountability should be proportional to risk, opacity, and criticality without turning the hot path into a reporting system.

Prefer:

- compile-time assertions;
- boundary invariant checks;
- sampled or tiered validation;
- bounded ring buffers;
- low-cardinality metrics;
- asynchronous reports;
- debug-only deep tracing;
- explicit status/error records;
- fire-and-forget reporting where waiting would alter the system.

Debug facilities are off by default unless an accepted requirement says otherwise. They must have bounded memory, defined drop behavior, and no hidden synchronization on production paths.

Every high-risk subsystem should expose enough evidence to distinguish design failure, implementation failure, resource exhaustion, stale state, and external failure.
