# ADR-0014: Extract the Generic CUDA-JS Runtime

**Status:** Accepted

**Date:** 2026-08-10

## Context

UMCGS needs a Node.js-to-CUDA execution foundation, but generic CUDA Driver entry-point discovery, host-call binding, native/JIT ABI work, memory capabilities, NVRTC/link/load behavior, event-loop delivery, error normalization, opaque native resources, and native packaging are not Monte Carlo Graph Search responsibilities.

Those concerns have an independent toolchain, security boundary, release cadence, compatibility matrix, test architecture, and potential consumers. Keeping them inside UMCGS would let the first search consumer permanently shape a general CUDA runtime. It would also force UMCGS agents to reason about Node/V8/native packaging while designing Search IR and graph-search semantics.

The opposite extreme—creating separate repositories for the runtime, the UMCGS adapter, every generated module, or every schema family—would introduce cross-repository coordination before those parts have independent lifecycles.

The project owner supplied a useful CUDA-JS starting sketch and asked whether the CUDA framework should be separated from the MCGS engine at repository level.

## Decision

Create a separate private repository named `iteathen/CUDA-JS` for the generic Node.js/CUDA runtime and toolchain.

UMCGS remains the owner of:

- Search IR and universal domain, policy, evaluator, graph, output, and resource contracts;
- search-specific capability resolution, finite-memory planning, layout selection, and specialization;
- search-specific generated device programs and resident evaluator composition;
- graph storage, transpositions, paths, scheduling, backup, stopping, rerooting, and output semantics;
- device-closure requirements and search-quality equivalence;
- the deterministic Search IR reference backend and synthetic search conformance domains;
- the UMCGS adapter that produces and submits a versioned CUDA-JS execution package.

CUDA-JS owns:

- CUDA Driver API discovery, requested API-version negotiation, and normalized driver errors;
- schema-driven native call bindings, including the intended architecture-specific JIT backend and any optional Node-API backend;
- opaque native resource handles and capability security;
- generic device, pinned/mapped host, managed, staged, and mock memory contracts;
- NVRTC device compilation, linking, module loading, generic argument packing, and launch primitives;
- stream/event/completion/cancellation delivery to Node.js;
- generic context health, teardown, diagnostics, packaging, cache identity, compatibility, and runtime conformance.

Dependency direction is one-way:

```text
UMCGS search contracts and specialized execution package
                         │
                         ▼
               UMCGS CUDA-JS adapter
                         │ versioned public contract
                         ▼
                      CUDA-JS
                         │
                         ▼
                  CUDA Driver / GPU
```

CUDA-JS may not import UMCGS source, schemas, Search IR, tests, or search terminology. It must remain coherent if UMCGS disappears.

The UMCGS adapter remains in UMCGS. No third adapter repository is created now. Revisit extraction only when that adapter has an independent version/release cadence, separate ownership, multiple independent producers, or another real lifecycle boundary.

The repositories will not use a Git submodule relationship. UMCGS consumes versioned CUDA-JS packages or release artifacts plus an explicit compatibility manifest. Neither repository may reach into the other's private source paths.

## Inter-repository contract

Before production implementation, an accepted version-zero contract must define:

- CUDA-JS runtime contract version and required capability profile;
- opaque resource and memory requirements;
- device-module source/binary inputs and complete cache identity;
- function, argument, launch, stream, event, completion, and cancellation descriptions;
- error/context-health and teardown behavior;
- package manifests, checksums, compatibility negotiation, and provenance;
- conformance responsibilities on each side;
- the rule that UMCGS search progress remains device-owned after ignition.

CUDA-JS validates and executes the package without understanding its search semantics. UMCGS owns the semantic correctness of the generated package.

## Starting-plan disposition

The project-owner CUDA-JS sketch is proposal input, not accepted implementation architecture. In particular:

- `NodeArenaEntry` is search-consumer state and cannot define CUDA-JS memory schemas;
- a strict Node-API ABI claim conflicts with direct V8/libuv use and with the earlier JIT-only host-binding direction unless these are separate backends;
- NVRTC compiles device code, not the host bridge;
- managed memory is optional and cannot be treated as universally zero-copy or concurrently CPU/GPU accessible;
- a host `setImmediate` micro-batch relaunch loop may be a generic execution mode but cannot be required for UMCGS active-search progress;
- a CPU mock validates generic lifecycle but is not a native CUDA or search-semantic oracle;
- atomic flags require explicit publication, memory-ordering, ownership, wrap/ABA, cancellation, and error contracts;
- deferred CUDA failures and poisoned contexts require more than ordinary exception wrapping.

See [`../research/2026-08-10-cuda-js-assumption-audit.md`](../research/2026-08-10-cuda-js-assumption-audit.md).

## Migration

No production code exists, so there is no source migration. Documentation and planning are re-owned as follows:

- UMCGS specifications retain search-specific contracts and replace direct generic Driver ownership with the CUDA-JS interop contract;
- generic runtime design begins in the new repository bootstrap;
- the current UMCGS specification focus-branch map is revised before individual contract drafting;
- prior proposal text that described UMCGS as owning a generic host/CUDA runtime is superseded by this ADR.

A prepared CUDA-JS bootstrap exists as a local Git repository at commit `cd44a3da58fad67153f8123525fcb9ec3bddab9f`. Remote repository creation and publication are tracked separately because the connected GitHub capability cannot create account-level repositories.

## Consequences

- UMCGS agents can focus on search semantics, specialization, and device-closed execution.
- CUDA-JS can evolve for unrelated consumers and platform/toolchain changes.
- Cross-repository release, compatibility, provenance, and conformance work becomes explicit.
- Direct CUDA Driver calls outside the UMCGS CUDA-JS adapter are non-conforming unless an accepted experiment says otherwise.
- The coordination cost of a second repository is accepted because the lifecycle boundary is real.
- A third repository remains prohibited without a new lifecycle decision.

## Alternatives considered

### Keep everything in UMCGS

Rejected. It couples generic native runtime/toolchain work to the first search consumer and violates the first-consumer-deletion test.

### Create CUDA-JS as an internal UMCGS component only

Rejected. The runtime has independent consumers, security/toolchain concerns, packaging, and release compatibility.

### Create CUDA-JS plus a separate UMCGS adapter repository immediately

Rejected. The adapter currently changes with UMCGS contracts and has no independent lifecycle.

### Use Git submodules

Rejected. Submodules preserve source coupling and weakly defined compatibility instead of versioned public artifacts.

## Validation

A conforming split must prove:

- each repository has one coherent charter and ownership registry;
- CUDA-JS contains no search-semantic dependencies;
- UMCGS contains no generic Driver binding implementation outside its adapter boundary;
- the public interop contract has exact version, capability, artifact, lifetime, error, compatibility, and conformance semantics;
- independent tests cover CUDA-JS generic behavior and UMCGS semantic package generation;
- an end-to-end capsule validates the versioned package across both released revisions;
- repository, package, branch, PR, and cleanup state are verified.

## Revisit triggers

Revisit when the adapter develops an independent lifecycle, CUDA-JS cannot support a second unrelated consumer without redesign, cross-repository coordination exceeds the separation benefit, or accepted contracts reveal ownership placed on the wrong side.