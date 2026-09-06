# SPEC-0015: Native Boundary and JavaScript/TypeScript Implementation

**Status:** Accepted

**Version:** 1.0.0

**Owner:** CUDA-MCGS

**Lower authority:** `iteathen/CUDA-JS` SPEC-0032

## Purpose

This specification fixes the implementation boundary between CUDA-MCGS search semantics and the CUDA-JS native runtime.

CUDA-MCGS owns product-neutral search semantics, Search IR/Composer meaning, graph/policy/evaluator/resource/progress/output/session/stage/channel contracts, search-specific finite resource policy and deterministic Search Program generation. CUDA-JS remains the sole native CUDA/provider boundary.

## Implementation-language rule

Maintained CUDA-MCGS repository source is JavaScript/TypeScript. Restricted Device-JS generation is permitted only through accepted public CUDA-JS contracts.

CUDA-MCGS does not maintain:

- C or C++ host implementation;
- CUDA C++ or hand-authored PTX;
- N-API/native addons;
- direct native FFI;
- Driver/provider bindings;
- native handles, pointers, ABI structs or platform discovery logic.

A missing native mechanism demonstrated while realizing an accepted search package is routed to CUDA-JS before any MCGS-local native workaround.

External native evidence may be recorded against an exact compatible pair, but native oracle/adapter source is not maintained in CUDA-MCGS.

## MCGS-owned abstraction

CUDA-MCGS may own reusable search abstraction that remains meaningful without CUDA, including:

- Domain/Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel semantics;
- Search IR and deterministic composition;
- search-specific resource counts, capacities, readiness, fairness, pressure and termination policy;
- search-specific selected physical-profile requirements when topology is materially part of a search profile;
- request, freshness, generation, publication and search-lifecycle meaning;
- deterministic restricted Device-JS/Search Program generation implementing search semantics;
- mapping lower capability/failure facts into MCGS-owned semantic dispositions.

These do not move into CUDA-JS merely because CUDA realizes them.

## CUDA-JS-owned mechanism

CUDA-JS owns every selected consumer-neutral native mechanism, including as applicable:

- device/context selection and compatibility;
- allocation/view/transfer/mapped/managed/peer-memory mechanisms;
- compiler/linker/artifact/module/function resources;
- streams/events/operations/prepared execution/CUDA Graph realization;
- native publication/atomic/synchronization primitives;
- persistent-operation lower mechanics;
- native provider resources;
- native errors, health, leases and teardown.

MCGS may select or compose public lower mechanisms but does not reproduce their native semantics or lifecycle.

## Search policy versus native mechanism

A selected MCGS profile may decide what work classes exist, how search work is prioritized, when evaluator batches are semantically ready, what resource pressure means to search, or what physical topology is required by an accepted search algorithm.

CUDA-JS decides only whether the resulting native request is valid for the selected device/profile and owns the lower execution mechanism. CUDA-JS must not infer search fairness, value, graph, stage or evaluator policy.

Conversely, CUDA-MCGS must not own a generic stream scheduler, native queue implementation, CUDA Graph engine, peer-memory primitive, provider binding or other reusable lower mechanism merely because search is its first consumer.

## Memory boundary

MCGS owns the semantic meaning, finite counts/capacities, generation/reuse/reclamation rules and search-specific lifetime of graph, evaluator, progress, channel, output and session resources.

It may project generic byte/alignment/access/lifetime requirements downward. Native allocation, mapped/managed/peer memory, pools, copies, placement capability and teardown remain CUDA-JS mechanisms.

Generic physical memory-management policy that could operate unchanged across search, Tensor, NN and data workloads does not belong in CUDA-MCGS. It requires its own natural JavaScript/TypeScript owner if independently justified. Search-specific reclamation/victim/fairness policy remains MCGS-owned.

## Compatible-pair rule

The production `integration.cuda-js` adapter is a mechanical JavaScript/TypeScript translation from accepted MCGS package meaning into injected public CUDA-JS contracts. It is not a second CUDA runtime.

The adapter must not:

- deep import CUDA-JS;
- expose or inspect native handles/pointers;
- generate or maintain CUDA C++/PTX;
- call Driver/provider FFI directly;
- duplicate CUDA-JS validity, compatibility, ABI or teardown authority;
- implement a private native fallback when the public lower surface is insufficient.

## Device residency

The accepted no-host-progress rule is semantic/runtime composition authority here: after ignition, active search may not require a host-produced intermediate to advance search.

The lower mechanism used to satisfy that rule remains CUDA-JS-owned. Persistent kernels, cooperative launches, publication mailboxes, Device-JS atomics, CUDA Graphs or other mechanisms become MCGS requirements only when an accepted search profile selects them; their native implementation does not move upward.

## Supersession

This specification is additive over all accepted CUDA-MCGS specifications. Historical or current prose that mentions PTX, native schedulers or CUDA realization is interpreted through this rule: MCGS owns semantic/source requirements and CUDA-JS owns native realization/artifacts.

Historical native evidence remains provenance. New maintained source, adapters and successor specifications must obey this boundary.

## Non-goals

No native CUDA-MCGS backend, no product/chess semantics, no generic GPU memory manager, no private provider integration, no change to accepted search semantics, and no native/support/performance promotion from this ownership rule alone.
