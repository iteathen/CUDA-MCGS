# Debugging Method

**Scope:** Reusable root-cause investigation and repair discipline. Testing and repair-loop execution are governed by [`TESTING.md`](TESTING.md).

## Top-down triage

Before random instrumentation or another test run, answer:

1. Is the design valid for the stated purpose and bounds?
2. Is implementation faithful to that design?
3. What exactly was observed, on which evidence key?
4. Which boundary could first create it?
5. Which causes are plausible?
6. Which cause is cheapest to falsify?
7. Is the boundary on the hot path?
8. Is the test state trustworthy?
9. Which failing cases are primary and which are cascades?
10. Has this exact test/state already run, and what changed before retrying it?

Question specification, oracle, assumptions, fixture, environment, generated artifacts, tests, and code equally.

## Freeze one reproduction

Before editing:

- record expected behavior from authority;
- record exact source/test/artifact/environment identity;
- preserve the smallest deterministic or bounded statistical reproducer;
- capture the first failure and first uncertain boundary;
- register the regression as a test intent;
- preserve raw evidence before adding instrumentation or changing state.

Do not start with the full suite unless broad corruption, stabilization, or release evidence is already the claim.

## Raw boundary trace

1. Choose one concrete case and one boundary.
2. Write expected raw input/output before observing actual values.
3. Capture raw input, relevant state, output, identifiers, ordering, units, versions, memory spaces, and timestamps.
4. Compare exactly.
5. Classify the first mismatch: representation, ordering, precision, lifetime, synchronization/visibility, identity, ownership, stale state, wrong oracle, contaminated fixture, or unknown.
6. Trace to the first divergence.
7. Freeze the evidence.
8. Cluster every failing case that shares this divergence or owner.

A proven inconsistency between trusted observations is useful evidence; do not average it into a vague explanation.

## Root-cause repair loop

1. Form one explicit cause hypothesis.
2. State the cheapest observation capable of disproving it.
3. Change only the authoritative owner and directly coupled representations required for one valid repair batch.
4. Rerun the minimal affected failure cluster.
5. If it still fails, change the hypothesis, input, implementation, or environment before retrying.
6. When the cluster passes, run the consolidated owning capsule once.
7. Run affected integration smoke once after the coherent repair batch.
8. Escalate to deep/forensic evidence only when the claim remains unresolved or risk requires it.
9. Fold provisional reproducers and every new case intent into the owning test capsule before acceptance.

Do not repair each failing assertion independently when one cause explains the cluster. Do not run broad suites repeatedly to compensate for an unproven cause.

## Diagnostic discipline

Prefer bounded structured evidence:

- stable case and failure-cluster IDs;
- first divergence and owner;
- exact expected versus actual values;
- bounded causal log interval;
- low-cardinality counters and resource state;
- raw artifact location;
- changed hypothesis before each retry.

Temporary diagnostics are removed or formally adopted after the durable test capsule covers the failure.

## Contaminated state

Restart, isolate, or invalidate evidence when stale binaries, caches, models, device allocations, global registries, prior case state, mixed revisions, nondeterministic seeds, or instrumentation prevent attribution.

Record why the state was contaminated and which evidence keys are invalidated. Do not repeat the same run and call it new evidence.

## Completion

A debugging cycle is complete only when:

- the first divergence and authoritative owner are established;
- the root-cause hypothesis survived decisive falsification;
- the original reproduction passes on a new valid evidence key;
- adjacent owned invariants pass through the consolidated capsule;
- required integration evidence passes;
- provisional tests and diagnostics are consolidated or removed;
- no hidden test debt, token debt, contaminated state, or cleanup residue remains;
- checks not run and claim limits are explicit.

Use `agent_files/templates/debugging-report.template.md` for durable investigations and `agent_files/templates/test-batch.template.yaml` when the failure cluster or test consolidation crosses sessions or agents.
