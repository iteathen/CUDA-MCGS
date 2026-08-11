# CUDA-MCGS / UMCGS Status

**Status:** Informational

**Updated:** 2026-08-11

## Phase

Private pre-release framework definition, research, specification, and evidence gathering. `main` remains the integration trunk for short-lived `feature/*` and `agent/*` branches. No production CUDA-MCGS search runtime or final component decomposition has been accepted.

The product-facing name is **CUDA-MCGS**. The GitHub repository and existing accepted authority identifiers remain `UMCGS` until a separate explicit repository/naming migration is accepted.

## North star

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS engine with schema-backed extension support.**

The current design interprets that as:

- universal behavior is defined through versioned contracts and Search IR;
- schemas make representations and extension contexts machine-verifiable but do not replace behavioral contracts;
- concrete engines are finite, resource-planned, and specialized;
- active search remains device-closed after ignition;
- optional search-time behavior uses one schema-backed Extension Surface/Point/Fragment protocol rather than an unbounded family of optimization-specific runtime callbacks;
- unbound extension points target zero abstraction overhead in the realized image, and bound extensions target no generic dispatch beyond their intrinsic work;
- scheduler topology remains an evidence-selected realization under device closure rather than a hard-coded persistent-kernel assumption;
- search-critical semantics/composition remain CUDA-MCGS-owned while generic CUDA runtime/compiler/linker behavior remains CUDA-JS-owned.

## Accepted project state

- The generic graph-search framework—not chess or another first domain—is the first product.
- CUDA-MCGS/UMCGS owns Search IR, search semantics, finite search-resource planning, specialized search device programs, search conformance, and the CUDA-JS adapter/package contract.
- Generic Node.js/CUDA Driver runtime behavior belongs to the independent peer `CUDA-JS`; dependency direction is one-way through versioned public artifacts.
- Active search remains device-closed after ignition. Concrete engines are finite and resource-planned; contracts are universal and generated hot paths are specialized.
- Accepted ADR-0002 rejects one universal runtime structure/callback table as the universality mechanism and permits generated engines to inline operations and eliminate unused fields/capabilities.
- Accepted ADR-0003 forbids CPU-produced intermediate decisions required for active-search progress.
- Accepted ADR-0014 keeps generic CUDA host/runtime mechanics in CUDA-JS rather than CUDA-MCGS.
- Engineering begins with explicit contracts, specification obligations, adversarial assessment, evidence, and dependency-ready execution rather than implementation-first drift.
- Repository/component organization, no-Python ecosystem policy, finite-resource design, consolidated testing, cleanup, exact-head review, and guarded integration remain binding.

## Current proposal direction

The framework architecture/specification proposals now define a common search extension model:

- **Extension Surface** — all semantic extension locations exposed by the selected search realization.
- **Extension Point** — one versioned semantic location with explicit execution scope and permissions.
- **Extension Contract** — meaning, invariants, ownership, effects, synchronization, resources, failure, and compatibility.
- **Context Schema** — exact machine-verifiable data/capabilities exposed at that point.
- **Extension Fragment** — optional device implementation with a manifest declaring target point, requirements, permissions, resources, architecture/toolchain needs, and provenance/cache identity.
- **Search Composer** — CUDA-MCGS-owned pre-ignition validator/lowerer/planner/composer that generates the finite specialized Search Image.
- **Search Image** — the fully resolved device program/artifacts plus layouts, resource plan, configuration, compatibility identity, and resident/preloaded search state.

Binding/composition occurs before ignition. A fragment may later change activation on-device, but active search does not perform host extension discovery, lookup, compilation, linking, or decision service.

These definitions are still proposal-level until detailed versioned specifications and experiment evidence are accepted.

## Current CUDA-JS peer state

The previous UMCGS status/plan assumption that CUDA-JS had no remote is obsolete.

At exact inspected revision `ad49a6c9b0cddb420e26e097180cf9c502060a65`, `iteathen/CUDA-JS` is a public pre-release project with a public `cuda-js` 0.1.0-alpha.2 testing package and bounded accepted evidence through its F1-F9 sequence.

Relevant current evidence includes:

- F1A/EXP-000 and F1B schema/ABI foundations;
- Windows F2W-F8W Driver/resource/memory/execution/compiler/package evidence on the recorded exact profile;
- F6 CompilerActor ownership of NVRTC/nvJitLink plus content-addressed device artifacts;
- F9 `cuda-cccl` trusted-header profile and a consumer-neutral `<cuda/atomic>` device-scope release/acquire publication fixture through the public facade.

F9 is deliberately bounded: it proves a generic compiler/runtime prerequisite, not CUDA-MCGS search semantics, extension composition, scheduler behavior/performance, transposition semantics, or the cross-repository compatible pair. Native Linux CUDA qualification also remains separate from the accepted Windows profile.

## Prior-art result

The prior-art landscape still finds no reviewed search framework suitable as the CUDA-MCGS foundation. The expanded 2026-08-11 research does reduce unnecessary invention:

- NVIDIA cuVS JIT-LTO is a direct methodology reference for planner-selected device fragments, LTO composition, and caching.
- cuFFT LTO callbacks are a direct methodology reference for typed device behavior bound to defined points before plan finalization.
- nvJitLink/NVRTC are appropriate platform/compiler substrate through CUDA-JS.
- CUDA Graph device launch/conditional execution is a candidate device-owned scheduler mechanism, not a mandatory topology.
- cuCollections is a transposition-table benchmark/reference and possible permissively licensed source donor pending TT-001.
- CCCL/libcu++/CUB are CUDA-native primitive sources where exact component contracts/licensing fit.

The selected reuse posture is: **methodology first; independent search-owned implementation second; selective source adaptation third; vendoring fourth; higher-level runtime dependency last.**

A production Search Image should not require cuVS, cuFFT, cuCollections, RAPIDS, or another higher-level search/framework runtime to make progress unless a later explicit dependency decision proves that benefit outweighs loss of local control.

## Current authority

- Project charter: accepted and narrowed to UMCGS/CUDA-MCGS search ownership.
- ADR-0001 through ADR-0017: accepted within their documented scopes.
- Repository topology and ecosystem language policy: accepted boundary, informational architecture explanation.
- Framework architecture overview: proposal, updated with schema-backed extension composition.
- Framework specification map: proposal, updated with extension and zero-abstraction-cost obligations.
- CUDA-MCGS-to-CUDA-JS execution-package contract: not yet accepted.
- Canonical Search IR: not yet accepted.
- Extension Surface/Point/Context Schema/Fragment representation: not yet accepted.
- Initial scheduler and transposition-table implementation decisions: not yet accepted.

## Current next boundary

Execute the revised canonical `next_step.yaml` plan rather than creating a parallel plan.

The immediate sequence is:

1. finalize the canonical Extension Surface/Point/Contract/Context Schema/Fragment representation and minimum Search Image package contract;
2. run `EXT-LTO-001` through the exact CUDA-JS compiler/link/load path to test direct composition and the no-point/unbound/bound zero-abstraction-cost hypothesis;
3. run `EXT-CONTRACT-001` to prove incompatible schemas, versions, permissions, resources, and capabilities fail before ignition;
4. use those results to accept or revise the extension composition model;
5. run `SCHED-001` before committing to a production device-owned scheduling topology;
6. run `TT-001` before committing to cuCollections reuse, source adaptation/vendoring, or a custom transposition-table implementation;
7. produce the exact CUDA-MCGS/CUDA-JS compatible-pair capsule.

## Current risks and unknowns

- The Extension Surface abstraction may prove too broad or too expensive unless emitted-code and resource evidence confirms specialization removes unused machinery.
- Device LTO is a promising first realization, not yet proven to satisfy every CUDA-MCGS extension composition case or target GPU/toolchain profile.
- The optimal device-owned scheduler may vary with irregular search, evaluator occupancy, secondary GPU work, hardware generation, watchdog/environment constraints, and resource profile.
- cuCollections may not satisfy CUDA-MCGS collision verification, publication, generation/reclamation, or memory-layout needs despite being a strong baseline.
- Canonical Search IR, graph identity/publication, variable-size arenas, reroot/reclamation, evaluator resident contract, and exact memory-pressure policies remain specification work.
- Native Linux CUDA-JS execution remains incompletely qualified; current compatible-pair planning must not generalize Windows evidence to Linux.
- Third-party implementation reuse requires exact license/provenance and explicit reuse decisions; the CUDA-MCGS project distribution license remains a separate release/reuse decision.
- Candidate performance claims remain non-authoritative until reproduced on representative CUDA-MCGS workloads/hardware.
