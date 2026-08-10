# UMCGS Memory and Performance Policy

**Scope:** GPU-memory planning, hot-path design, benchmarking, and performance evidence.

## Memory is a compile/initialization input

A generated engine must be planned against:

```text
free device memory
- safety reserve
- resident model/evaluator weights
- permanent evaluator workspace
- runtime/code/metadata
- graph/search arenas
- queues and path storage
- output and bounded diagnostics
```

Initialization derives concrete capacities and rejects impossible profiles before search.

## Required memory categories

At minimum, account separately for:

- model/evaluator weights;
- evaluator permanent and maximum workspace;
- node and edge columns;
- state and action arenas;
- transposition table;
- active/pending path records;
- work queues and counters;
- evaluator input/output batches;
- scheduler control state;
- top-k/output buffers;
- diagnostics;
- safety reserve and allocator fragmentation.

Do not hide a large scratch or cache allocation in a generic runtime total.

## Pressure states

Every engine defines deterministic behavior for:

- normal operation;
- high watermark;
- critical watermark;
- queue overflow;
- table saturation;
- path-depth exhaustion;
- state/action arena exhaustion;
- evaluator workspace failure.

The first safe baseline should reduce or freeze expansion and continue refining existing graph state rather than perform unsafe arbitrary live eviction.

## Layout and access

Generated layouts should:

- contain only required fields;
- separate hot and cold data;
- use structure-of-arrays when it improves coalescing;
- choose widths from proven ranges;
- distinguish storage precision from accumulation precision;
- align to the actual ABI/device requirements;
- avoid raw-pointer persistence where index/generation references enable compaction and stale detection.

## Synchronization tax

Performance analysis includes more than transfer byte count. It must account for:

- host/device synchronization;
- kernel launch and graph transition overhead;
- queue contention;
- global atomics;
- root/transposition hotspots;
- memory visibility/fences;
- occupancy and resident-resource limits;
- evaluator batch fill and tail latency;
- divergence and inactive lanes;
- cache/TLB behavior.

No optimization may reintroduce host dependency into active search.

## Benchmark evidence

Every benchmark report follows [`../templates/benchmark-report.template.md`](../templates/benchmark-report.template.md) and records exact commit, generated-engine/cache identity, hardware/software profile, model, resource profile, workload, timing boundary, warmup, sample count, raw data, correctness/quality checks, and profiler evidence.

Report at least:

- searches or simulations per second;
- evaluator positions per second and batch distribution;
- useful graph expansions per second;
- duplicate/transposition suppression;
- queue/arena/table pressure;
- memory high-water mark;
- top-k or solution-quality metric appropriate to the domain;
- host participation and synchronization count;
- device utilization and principal stall reasons.

A throughput gain that weakens result quality or changes the search budget is not equivalent performance.
