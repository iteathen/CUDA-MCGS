# ADR-0025: Compose Independent RNG and Communication Semantic Owners

**Status:** Accepted

**Date:** 2026-09-02

## Context

CUDA-MCGS already separates reusable search semantics from generic CUDA mechanisms under ADR-0014 and ADR-0019. The ecosystem now also has integrated independent semantic owners for reusable random-generation semantics (`iteathen/cuda-rng`) and provider-neutral GPU communication semantics (`iteathen/cuda-comm`).

Without an explicit composition decision, future stochastic or multi-GPU search work could either duplicate reusable RNG/communication state machines inside CUDA-MCGS or push those semantics incorrectly into CUDA-JS alongside native providers. Both would violate one-owner/LEGO boundaries.

## Decision

CUDA-MCGS may optionally consume versioned public contracts from `cuda-rng` and `cuda-comm` when an accepted search profile requires them.

### Stochastic split

`cuda-rng` owns reusable provider-neutral generator/profile, seed/sequence/offset, split/fork, distribution/sampling and reproducibility semantics.

CUDA-MCGS owns the search-specific policy/meaning that assigns accepted RNG streams/state to selection, expansion, domain transitions, evaluator behavior, rollouts/sampling or other search decisions and states what reproducibility/replay means for the Search Session/profile.

CUDA-JS owns any selected native/provider/device/memory/operation mechanism such as a bounded cuRAND integration.

### Communication split

`cuda-comm` owns reusable provider-neutral group/team/rank, collective/P2P/PGAS/RMA communication semantics, ordering/completion/failure composition and communication equivalence.

CUDA-MCGS owns search-specific multi-GPU policy: replica/shard/partition meaning, work placement, search fairness/progress, termination/result aggregation, search-resource contribution and selected search topology/specialization.

CUDA-JS owns the physical/native device/context/memory/view/stream/operation/synchronization/provider/resource mechanisms such as bounded NCCL/NVSHMEM/RDMA children when separately selected.

## Dependency direction

```text
CUDA-MCGS -> cuda-rng   optional selected search profiles
CUDA-MCGS -> cuda-comm  optional selected search profiles
cuda-rng -> CUDA-JS
cuda-comm -> CUDA-JS
CUDA-MCGS -> CUDA-JS    existing public runtime/adapter contract
```

No dependency points from CUDA-JS, CUDA-RNG or CUDA-COMM back into CUDA-MCGS.

## Device-residency consequence

Optional RNG/communication semantics do not weaken ADR-0003. If active-search progress requires stochastic generation or communication after ignition, the selected profile and lower mechanisms must permit that progress without a host read-decide-write, relaunch or coordination loop.

## Deletion tests

Deleting CUDA-MCGS leaves CUDA-RNG and CUDA-COMM coherent for materially different consumers. Deleting either optional semantic dependency leaves the baseline CUDA-MCGS framework coherent; only profiles that explicitly selected it become unavailable. Deleting all search consumers leaves CUDA-JS mechanisms free of search vocabulary.

## Relationship to #193 and #122

Issue #193 remains the CUDA-JS execution-package/adapter ownership audit. RNG/COMM become additional semantic-owner evidence when classifying fields, but Search IR/Stage/Channel/evaluator/progress/session semantics remain CUDA-MCGS-owned.

This ADR creates no authority for CUDA-MCGS #122 and does not modify, start, comment on or accept that held protected transaction.

## Implementation gate

This decision authorizes only ownership/composition. Any production stochastic or multi-GPU profile still requires its own accepted MCGS semantics, accepted `cuda-rng`/`cuda-comm` contracts when selected, accepted lower CUDA-JS mechanisms, finite resource/lifecycle/error rules and claim-appropriate evidence.

## Consequences

- reusable RNG and communication semantics have one independent home;
- MCGS retains all search-specific policy and lifecycle meaning;
- CUDA-JS remains native/provider mechanism owner;
- multi-GPU/stochastic work cannot bypass the semantic layers by convenience;
- no new implementation or support claim is created.

## Non-goals

No RNG implementation, communication implementation, provider selection, NCCL/NVSHMEM/RDMA activation, multi-GPU search implementation, product/domain movement or #122 work.
