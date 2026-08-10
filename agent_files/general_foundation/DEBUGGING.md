# Debugging Method

**Scope:** Reusable foundation.

## Top-down triage

Before random instrumentation, answer:

1. Is the design valid for the stated purpose and bounds?
2. Is implementation faithful to that design?
3. What exactly was observed?
4. Which boundary could first create it?
5. Which causes are plausible?
6. Which cause is cheapest to falsify?
7. Is the boundary on the hot path?
8. Is the test state trustworthy?

Question specification, assumptions, tests, and code equally.

## Raw boundary trace

1. Choose one concrete sample and one boundary.
2. Write expected raw input/output before observing actual values.
3. Capture raw input, relevant state, output, identifiers, ordering, and timestamps.
4. Compare exactly.
5. Classify the mismatch: representation, ordering, precision, lifetime, synchronization/visibility, ownership, stale state, wrong expectation, or unknown.
6. Trace to the first divergence.
7. Freeze evidence before editing.
8. Repair the owning boundary and rerun the original reproduction.

A proven inconsistency between trusted observations is useful evidence; do not average it into a vague explanation.

Use `agent_files/templates/debugging-report.template.md` for durable investigations.
