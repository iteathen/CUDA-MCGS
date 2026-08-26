# ADR-0023: Require Parallel-First Native Execution

**Status:** Accepted

**Date:** 2026-08-25

## Context

CUDA-MCGS is intended to make broadly useful Monte Carlo Graph Search practical on GPUs. A production engine that merely executes the semantics serially on a GPU would satisfy neither that purpose nor the architecture already expressed by the graph, policy, evaluator, resource and device-progress contracts. Those contracts permit concurrent graph claims and publication, bounded concurrent expansion and transition work, policy reservations and backup, evaluator batching and multiple ready work classes.

At the same time, no single physical scheduler is known to be best across irregular graphs, different evaluators, finite memory profiles, GPU architectures and product workloads. Making a persistent kernel, one simulation per thread, one warp per path, CUDA Graph replay, cooperative launch or a particular queue topology universal would confuse semantic truth with one backend choice.

Tensor hardware may eventually accelerate selected regular subproblems, but MCGS control flow is irregular and contention-heavy. Recasting the whole search as tensor work before measurement would add representation and transformation cost without evidence that it improves useful search.

The project therefore needs a firm parallel production requirement without prematurely fixing its physical realization.

## Decision

The first usable native CUDA-MCGS engine must be a **bounded parallel engine**. Serial reference execution remains valid as an oracle aid, but a serial-only native engine is not a production milestone and cannot satisfy `ENGINE-NATIVE-01`.

The native baseline must expose useful independent GPU work wherever the selected contracts permit it, including:

- multiple concurrently serviceable device-owned work items;
- concurrent Domain action/transition work over immutable inputs and disjoint admitted outputs;
- concurrent Graph claim, initialization, edge materialization and ready-only publication;
- concurrent Policy selection reservations and semantically valid backup/reduction;
- evaluator request accumulation, bounded batch execution and scatter when an evaluator profile is selected; and
- progress across ready work classes without a host read-decide-write or relaunch loop.

Parallelism is required at the engine outcome boundary, not encoded as one universal scheduler topology. Search semantics and Search IR continue to describe ownership, dependencies, readiness, allowed outcomes, resources, ordering and lifecycle. A selected native profile owns its physical mapping to grids, blocks, warps, queues, kernels, streams or other CUDA-JS mechanisms and must qualify that mapping independently.

The correctness-first native profile should use the smallest sufficient versioned public CUDA-JS contracts available when its plan is frozen. Current accepted CUDA-MCGS semantics do not create a new CUDA-JS prerequisite merely to begin that profile. If a concrete measured profile cannot be expressed naturally, safely and with bounded resource/lifecycle semantics, the missing consumer-neutral primitive is classified to CUDA-JS; CUDA-MCGS retains graph/search/policy/batching meaning and must not add a native escape path.

Advanced mechanisms—typed shared memory, warp collectives, block scans or reductions, sharded queues, work stealing, multi-kernel/DAG submission, CUDA Graphs and similar facilities—are selectable profile tools, not default requirements. Add or escalate them only when a concrete CUDA-MCGS profile supplies a bounded need, a public-contract ownership test and representative evidence.

Tensor-shaped execution is a separate exploratory lane. A proposal must identify a regular owner-local subproblem, preserve exact semantic and resource equivalence, count packing/transformation/synchronization cost, and beat a credible non-tensor parallel baseline before it can enter a production plan. No current semantic or native milestone is blocked on tensor support.

Multi-GPU remains a separate selected execution profile. Independent device-resident replicas are the first planned form; tightly coupled coordination, shared graphs or global barriers are not implied by this decision. A workload that does not benefit naturally from multiple GPUs may remain single-device.

Root control retains ADR-0022's cost boundary. In particular, parallel execution must not add traversal, cleanup, queue rebuilding or global synchronization to `advance`; devices adopt ordered root-control publications at their declared bounded safe points.

## Rationale and evidence

This is the smallest design that satisfies both sides of the purpose:

- requiring a parallel native outcome prevents the reference oracle or an easy serial lowering from becoming the accidental product;
- keeping physical topology profile-owned preserves LEGO separation between semantic owners and CUDA realization;
- using current public primitives for the first correctness profile avoids speculative CUDA-JS expansion;
- demanding measurement before advanced or tensor profiles protects the hot path from unproven machinery; and
- retaining multiple legal schedules in reference evidence tests concurrency semantics without turning the reference into a production scheduler.

The strongest simplification was to permit a serial native engine first and parallelize later. Rejected: serialization would hide publication, reservation, contention, fairness and finite-resource defects precisely where native evidence is supposed to qualify them, and it would create a misleading “usable GPU engine” milestone.

The strongest performance-first alternative was to select a persistent-kernel/warp-collective scheduler now. Rejected: no representative benchmark packet yet establishes one physical topology across the intended domain/evaluator/resource range, and hard-wiring it would export mechanism constraints into otherwise scheduler-neutral contracts.

## Consequences

- `ENGINE-REFERENCE-01` must exercise materially different bounded legal schedules and allowed outcome sets for concurrent owners. It does not claim native memory-model or performance proof.
- `ENGINE-NATIVE-01` must demonstrate actual concurrent device work and concurrency-sensitive correctness. A one-thread or deliberately serialized production lowering is insufficient except as a diagnostic control.
- `ENGINE-PERF-01` compares selected scheduler profiles only after correctness and records occupancy, divergence, contention, batching, memory and search-quality effects.
- Graph, Policy, Evaluator, Resource, Progress and optional Channel evidence each retain their own semantic owners; a scheduler component must not absorb their rules.
- No production implementation begins now. `REF-ROOT-CONTROL-01` remains the immediate dependency-ready leaf, and `REF-GRAPH-01` remains blocked until it integrates.
- No CUDA-JS issue is opened merely from a wish list. A new dependency requires a concrete selected profile and the existing generic-capability escalation test.

## Alternatives considered

### Serial native engine as the first milestone

Rejected. It is useful as a diagnostic baseline, not as the first usable CUDA-MCGS engine.

### One mandatory persistent scheduler

Rejected. It prematurely fixes occupancy, fairness, queue and cancellation behavior that must remain profile-selectable until representative evidence exists.

### Require advanced CUDA-JS primitives before native work

Rejected. The correctness baseline can be planned against the smallest sufficient public capabilities available at execution time; speculative primitives add dependency and qualification cost without a demonstrated blocker.

### Tensorize the entire search immediately

Rejected. Irregular graph control, atomic ownership and variable work do not become tensor-friendly by renaming their representation. Owner-local measured tensor candidates remain welcome as experiments.

### Make every semantic reference intrinsically parallel

Rejected. Reference oracles need deterministic and schedule-invariant evidence, not CUDA execution. They may replay bounded schedules serially while checking the invariants and allowed outcomes of parallel legal histories.

## Compatibility / migration

This decision is made before production implementation or a stable public API. Existing proposal specifications already allow the required concurrency and remain unchanged. Existing CUDA-free evidence remains valid for its exact inputs; later reference leaves add schedule/interleaving coverage rather than relabeling prior cases as native proof.

Planning, status and issue routing must distinguish:

- semantic scheduler neutrality;
- mandatory parallel native outcome;
- selected physical scheduler qualification;
- optional advanced CUDA-JS capability escalation; and
- separate tensor exploration.

## Validation

Before `ENGINE-REFERENCE-01` acceptance:

- concurrent-owner requirements map to bounded schedule/interleaving cases or explicit allowed-outcome sets;
- collisions, duplicate claimers, initializer failure, reservations, stale publication, pressure and cancellation have discriminating cases; and
- at least one terminal integration family runs under materially different legal schedules without changing schedule-invariant meaning.

Before `ENGINE-NATIVE-01` acceptance:

- more than one GPU work item can make useful progress in the selected profile;
- concurrent graph publication, policy reservations/backups and selected evaluator batching match the accepted semantic oracle;
- no host-produced intermediate advances search;
- bounded resources, publication ordering, cancellation, failure and teardown pass on one exact CUDA-MCGS/CUDA-JS pair; and
- a deliberately serialized diagnostic control is not presented as the usable engine.

Before promoting an advanced or tensor profile, representative evidence must identify the mechanism, exact workload/hardware/profile, equivalent work and resource limits, measured benefit, regressions and cleanup disposition.

## Revisit triggers

Revisit if accepted semantic contracts prove that useful work cannot be safely concurrent, if exact native evidence shows the correctness baseline requires a missing generic CUDA-JS primitive, if representative profiling selects a more specific mandatory profile without harming the intended equivalence class, or if a tensor experiment demonstrates repeatable end-to-end benefit after transformation and synchronization costs.

## Supersedes / superseded by

This decision does not supersede an earlier ADR. It extends ADR-0002, ADR-0003, ADR-0019 and ADR-0022 by defining the first native execution outcome while preserving their ownership and lifecycle boundaries.
