# Multi-GPU execution direction

**Status:** Informational

**Authority:** Project-owner direction

**Date:** 2026-08-25

**Current phase:** Dependency planning only; no CUDA-MCGS multi-GPU support or qualification claim

## Decision

CUDA-MCGS will account for multiple GPUs without making them mandatory or contaminating universal search semantics. The first multi-GPU profile will use **independent device-resident search replicas** with a finite pre-ignition assignment and final aggregation only after every selected device operation is terminal.

This is the natural first LEGO composition because each GPU retains one complete Search Image, resource plan, search lifecycle and failure boundary. It requires no fine-grained cross-device graph traffic and no host read-decide-write loop that advances search after ignition. A product or selected policy may later provide a fixed root/action partition when that partition is meaningful, but the framework does not assume games, fixed actions or a particular reduction rule.

Shared mutable graphs, cross-device transpositions, fine-grained peer atomics, transparent load balancing and collective libraries are not first-profile requirements. They may be selected later only when an owned consumer contract and representative measurements show that their communication and lifecycle cost is justified.

## Ownership boundary

CUDA-MCGS owns:

- whether a semantic engine profile selects one device or a finite device set;
- independent-replica, root/action-partition or later shared-state search meaning;
- per-device Search Program/package selection and semantic identity;
- pre-ignition work/resource partition policy;
- result compatibility, terminal aggregation and partial-result meaning;
- product/domain/policy/evaluator-specific partition and reduction rules.

CUDA-JS owns:

- sanitized opaque device discovery and explicit selection;
- one runtime, DriverActor, private context and resource epoch per selected device;
- selected-device compiler targets and per-device opaque artifact identity;
- device-scoped memory, operations, health and cleanup;
- generic cross-device rejection, dependency and transfer mechanisms;
- peer-direct or bounded pinned-host-staged copies when separately selected and qualified.

CUDA-JS does not choose MCGS partitioning or reduction policy. CUDA-MCGS does not expose native ordinals, UUIDs, PCI identities, pointers, contexts or provider paths.

## First profile

```text
finite selected device set
  -> device slot A -> one complete CUDA-MCGS Search Image/runtime
  -> device slot B -> one complete CUDA-MCGS Search Image/runtime
  -> ... bounded selected slots

pre-ignition input/seed/partition assignment
  -> independent device-resident search on every slot
  -> terminal per-device result publication
  -> one declared final aggregation after terminality
```

The result contract must distinguish all-success, valid partial completion, failed device, unproved device state and aggregate cancellation. One device's clean close cannot erase another device's failure or orphan inventory. A device set never silently discovers and consumes every visible GPU; selection is explicit and bounded.

The compatible-pair identity must bind the CUDA-MCGS semantic/package identity, ordered opaque device-slot topology, every per-device CUDA-JS realization/artifact/runtime identity, partition/reduction profile, exact platform/toolchain/device facts, evidence digests and cleanup disposition. Public evidence uses sanitized slot identities and never stable native hardware identifiers.

## Dependency order

1. Complete the current Search IR/Search Program/package/reference/semantic-acceptance sequence and one exact single-device CUDA-MCGS/CUDA-JS compatible pair.
2. Integrate CUDA-JS SPEC-0017 explicit device selection and selected-device target resolution.
3. Complete the CUDA-JS ADR-0006 Linux reference adapter/package chain and obtain a controlled native Linux host with at least two independently visible physical CUDA GPUs and an independent native oracle per device.
4. Accept and implement only the needed CUDA-JS SPEC-0024 coordinator subset: finite selected runtimes, device-scoped ownership, cross-device misuse rejection, aggregate status and terminal cleanup. Independent replicas do not initially require peer transfer.
5. Add a CUDA-MCGS multi-device execution-package/profile schema that composes existing semantic owners without changing their one-device meaning.
6. Qualify per-device correctness, concurrent execution, aggregate results, one-device failure, cancellation and cleanup before making a multi-GPU claim.
7. Add peer/staged transfer, evaluator data parallelism or shared-state profiles only behind separate contracts and measured evidence.

CUDA-JS issue #20 owns generic selection and multi-device mechanisms. CUDA-MCGS will use a separate tracked integration issue for the consumer-owned replica/package/result profile. CUDA-JS performance issue #28 remains a per-device baseline; a later topology-aware benchmark reports per-device and aggregate behavior without substituting for correctness.

## Acceptance and falsifiers

The first profile is acceptable only when:

- every device receives an exact selected runtime and compatible artifact;
- each replica matches its independent semantic/native oracle;
- no post-ignition host-produced intermediate result advances any replica;
- aggregate output is deterministic under the declared partition/reduction contract;
- foreign-device resources reject before native work;
- one-device failure preserves truthful peer and aggregate disposition;
- every device and coordinator resource reaches a proved terminal state or retains explicit orphan/restart-required evidence;
- throughput/scaling claims use a topology-specific reproducible benchmark and never extrapolate from a single GPU.

Stop or narrow the profile if distinct device selection is unavailable, partitioning changes universal semantics, final aggregation becomes an iterative host search loop, shared-state traffic is assumed without measurement, or partial failure cannot remain truthful.

## Current disposition

The current Windows GTX 1660 Ti host exposes one GPU and cannot qualify distinct-device behavior. Under CUDA-JS ADR-0006, the first native selection/multi-GPU promotion target is Linux. CUDA-MCGS continues the dependency-ready `IR-PROGRAM-PACKAGE-01` path toward its first exact single-device Linux pair. Multi-GPU implementation begins only after the selected CUDA-JS foundation and a suitable controlled 2+ GPU Linux host exist; the direction is retained now so single-device packaging, resource and result identities do not foreclose later finite device sets.
