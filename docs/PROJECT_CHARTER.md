# Project Charter

**Status:** Accepted

## Purpose

Create a universal framework capable of specifying, specializing, and executing GPU-resident Monte Carlo Graph Search systems across unrelated domains and evaluator types.

The framework should support board games, text search, planning, optimization, move ordering, evaluation-only search, partially observable problems, and future MCGS-style workloads without making one application the permanent shape of the core.

## Product boundary

UMCGS owns reusable search contracts and search-specific runtime behavior for:

- Search IR and versioning;
- state, action, transition, identity, node-role, terminal, history, and cycle semantics;
- graph storage, transpositions, paths, and reroot/reclamation where supported;
- selection, reservation, expansion, widening, evaluation batching, backup, stopping, and root/output ranking;
- resident evaluator/model composition and search-specific generated device programs;
- finite GPU-memory planning, capacities, pressure, exhaustion, cancellation, and result behavior;
- specialization for a concrete domain, policy, evaluator, CUDA capability profile, and hardware/resource profile;
- deterministic reference interpretation and synthetic search conformance;
- the adapter and execution-package contract through which UMCGS consumes the generic CUDA-JS runtime.

UMCGS does **not** own generic Node.js/CUDA Driver bindings, CPU-call ABI generation, native/JIT packaging, generic memory primitives, NVRTC/link/load plumbing, event-loop delivery, or generic CUDA resource handles. Those responsibilities belong to the independent `iteathen/CUDA-JS` repository under ADR-0014.

## Ecosystem language policy

Python is prohibited throughout UMCGS, CUDA-JS, and every future project whose primary purpose is to build, test, package, release, operate, or extend the UMCGS ecosystem.

The prohibition applies to production and reference source, tools, schema importers, generators, tests, benchmarks, documentation tooling, CI, packaging, installers, release automation, migrations, diagnostics, prototypes, experiments, and one-off or temporary scripts. Indirect or containerized invocation does not create an exception.

This is a hard project gate rather than a preference. Use only languages and toolchains accepted by the owning repository and boundary. The complete rule, prohibited artifacts, validation requirements, and cross-repository inheritance are defined in [`../agent_files/general_foundation/NO_PYTHON_POLICY.md`](../agent_files/general_foundation/NO_PYTHON_POLICY.md).

## Universality rule

The framework defines universal search contracts and a universal intermediate representation. It must not require one universal hot-path object layout or impose permanent runtime cost for unused capabilities. A concrete engine is expected to be statically specialized.

The external CUDA runtime contract must not become a back door for embedding one domain, graph, search policy, evaluator, or model into UMCGS foundations.

## Device-residency rule

After search ignition, no active selection, expansion, transition, legality/domain analysis, evaluation, backup, scheduling, stopping decision, or ranking may require a CPU-produced intermediate result.

The host may configure, compile, load, allocate, launch, request cancellation asynchronously, and consume completed results through CUDA-JS. It must not become an oracle or progress coordinator on the active-search critical path.

## Resource rule

Universality does not imply unbounded resources. Every concrete engine declares and enforces finite capacities derived from available GPU memory, resident evaluator/model, workspace, runtime/safety reserves, domain representation, graph/path/queue needs, and outputs.

UMCGS owns the search-resource partition and pressure policy. CUDA-JS owns generic resource creation/lifetime behavior and reports capability/allocation outcomes through its versioned contract.

Resource exhaustion is specified behavior, not an undefined failure discovered mid-search.

## Initial exclusions

The core must not assume a board, two players, alternating turns, zero-sum values, deterministic transitions, finite exhaustive actions, scalar evaluation, neural evaluator, tree/DAG, fixed-size state/output, unlimited growth, one CUDA execution mechanism, or one Node/CUDA binding backend unless a selected adapter/profile explicitly supplies that contract.

## First milestone

Define the development method, versioned search contracts, Search IR, memory-planning model, UMCGS-to-CUDA-JS execution-package contract, consolidated conformance architecture, and synthetic domains before implementing a production domain adapter.
