# Testing Rules

**Scope:** Reusable foundation.

## Test the contract

Tests should demonstrate owned behavior and invariants, including invalid inputs, boundaries, overflow, lifecycle transitions, cancellation, partial failure, and resource exhaustion.

## No gate weakening

Do not lower thresholds, reduce workloads, skip architectures, relax assertions, change expected values, or suppress failures merely to pass. A test may change only after evidence shows the oracle conflicts with higher authority or intended behavior.

## Layered strategy

- unit tests for local invariants;
- contract/conformance tests for replaceable components;
- integration tests for ownership boundaries;
- lifecycle and recovery tests for stateful systems;
- differential/reference tests for complex algorithms;
- stress and fault-injection tests for concurrency/resources;
- benchmark tests separated from correctness tests.

## Determinism

Control seeds and inputs where deterministic evidence is required. For intentionally nondeterministic systems, define acceptable distributions, invariants, and repeat counts.

## Contaminated state

Restart or isolate when stale binaries, caches, models, device allocations, mixed revisions, or instrumentation invalidate attribution. Record why the restart was necessary.
