# ADR-0003: Device-Resident Active Search

**Status:** Accepted

**Date:** 2026-08-10

## Context

Host/device round trips can make the GPU wait for move generation, threat detection, evaluator submission, search scheduling, or other classical work. Even small transfers can impose synchronization and destroy batching/utilization.

## Decision

After search ignition, all active search decisions and required intermediate behavior will be device-resident and device-computable. The selected evaluator/model is preloaded with the engine.

The host may configure, compile, load, allocate, launch, request cancellation one-way, and consume completion. It may not supply an intermediate decision required for progress.

Diagnostic/reference backends may use the CPU but must be labeled non-production and cannot define production performance behavior.

## Consequences

- Domain operations used during search require device implementations.
- Evaluator batching and execution belong in the device execution plan.
- Scheduling mechanisms must support device-owned iteration.
- Completion and diagnostics need asynchronous host integration without host control of phases.
- A project is not conforming merely because its compute-heavy kernels run on a GPU.

## Alternatives considered

- CPU search plus GPU inference: rejected as the production architecture.
- GPU search with CPU tactical/domain services: rejected because it restores a serial host dependency.
- Frequent host graph launches without intermediate data dependency: may be used only if evidence proves the host is not on the active decision path; the preferred contract remains device-owned execution.
