# Project Charter

**Status:** Accepted

## Purpose

Create a universal framework capable of generating and running GPU-resident Monte Carlo Graph Search systems across unrelated domains and evaluator types.

The framework should support board games, text search, planning, optimization, move ordering, evaluation-only search, partially observable problems, and future MCGS-style workloads without making one application the permanent shape of the core.

## Product boundary

UMCGS provides reusable contracts and runtime infrastructure for:

- state and action representation;
- graph storage, identity, transpositions, and cycles;
- selection, expansion, evaluation, and backup;
- device-resident work scheduling and batching;
- finite GPU-memory planning and pressure handling;
- result production, persistence, and rerooting where supported;
- specialization for a concrete domain, policy, evaluator, CUDA environment, and hardware profile.

## Universality rule

The framework defines universal contracts and a universal intermediate representation. It must not require one universal hot-path object layout or impose permanent runtime cost for unused capabilities. A concrete engine is expected to be statically specialized.

## Device-residency rule

After search ignition, no active selection, expansion, transition, legality/domain analysis, evaluation, backup, scheduling, stopping decision, or ranking may require a CPU-produced intermediate result.

The CPU may configure, load, launch, request cancellation asynchronously, and consume completed results. It must not become an oracle on the active-search critical path.

## Resource rule

Universality does not imply unbounded resources. Every concrete engine declares and enforces finite capacities derived from available GPU memory, resident evaluator/model, workspace, runtime/safety reserves, domain representation, graph/path/queue needs, and outputs.

Resource exhaustion is specified behavior, not an undefined failure discovered mid-search.

## Initial exclusions

The core must not assume a board, two players, alternating turns, zero-sum values, deterministic transitions, finite exhaustive actions, scalar evaluation, neural evaluator, tree/DAG, fixed-size state/output, or unlimited growth unless a selected adapter explicitly supplies that contract.

## First milestone

Define the development method, versioned framework contracts, Search IR, memory-planning model, and synthetic conformance domains before implementing a production domain adapter.
