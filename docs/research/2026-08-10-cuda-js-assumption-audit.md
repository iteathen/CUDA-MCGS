# CUDA-JS Starting-Plan Assumption Audit

**Status:** Research Note

**Date:** 2026-08-10

The project-owner sketch establishes useful direction, but several statements mix consumer-specific search behavior with generic CUDA runtime behavior or rely on platform assumptions that are not universally true.

## Findings that support the split

The following concerns are independently reusable and belong in CUDA-JS:

- Driver entry-point discovery and requested API-version negotiation;
- x86-64/ARM64 host-call ABI generation;
- Node/runtime native boundary and event-loop completion;
- opaque native resources and lifetime;
- device, pinned/mapped, managed, staged, and mock memory capabilities;
- NVRTC/link/load behavior and compiler logs;
- generic argument packing, launch, streams, events, cancellation, and completion;
- error provenance, context health, teardown, packaging, and compatibility.

The following remain UMCGS concerns:

- `NodeArenaEntry` or any search-specific arena layout;
- graph nodes/edges/paths/transpositions and generation semantics;
- selection, expansion, evaluator batching policy, backup, stopping, and ranking;
- finite search-resource partitioning and pressure policy;
- device-owned active-search progress and search quality.

## Technical corrections

### Node-API ABI stability is conditional

Node-API provides ABI stability across Node versions only for a surface implemented through Node-API. Direct V8, Node C++ API, or libuv dependencies do not inherit that guarantee.

The earlier project direction was JIT-only host binding. Therefore a JIT call-stub backend and a Node-API backend must be modeled as different backends with different compatibility claims. Combining direct V8/libuv work with a blanket Node-API ABI-stability claim is unsound.

Official reference: Node.js Node-API documentation, including ABI stability, external ArrayBuffers, and thread-safe functions: https://nodejs.org/api/n-api.html

### NVRTC does not compile the host bridge

NVRTC compiles CUDA C++ device code at runtime and can produce PTX or supported binary forms. It does not compile Node/V8 host-call glue. Host ABI JIT generation and CUDA device compilation need separate owners and cache identities.

Official reference: NVIDIA NVRTC documentation: https://docs.nvidia.com/cuda/nvrtc/index.html

### Managed memory is not a universal zero-copy search arena

`cuMemAllocManaged` does not guarantee simultaneous CPU/GPU access or favorable performance on every platform/profile. Page migration, coherence, operating-system behavior, and `concurrentManagedAccess` matter. Managed-memory access may fault or thrash under unsupported or unfavorable access patterns.

The generic runtime should expose memory capabilities rather than one mandatory arena:

- device-local hot storage;
- bounded pinned/mapped host-visible control or completion windows when supported;
- optional managed memory under an explicit profile;
- staged JavaScript memory;
- mock memory.

Pinned host memory is finite and excessive pinning can harm system performance.

Official references:

- NVIDIA CUDA Driver API memory management: https://docs.nvidia.com/cuda/cuda-driver-api/group__CUDA__MEM.html
- NVIDIA CUDA Programming Guide unified memory: https://docs.nvidia.com/cuda/cuda-c-programming-guide/index.html#unified-memory-programming

### “Zero-copy” must be decomposed

A JavaScript-visible `ArrayBuffer` does not prove the absence of migration, page faults, synchronization, or bus traffic. Contracts must separately state physical placement, CPU/GPU addressability, mapping, migration, coherence, visibility, synchronization, ownership, lifetime, and transfer cost.

External ArrayBuffer memory must remain valid until the JavaScript runtime finalizer has completed and runtime support constraints must be respected. A view cannot safely outlive its allocation or CUDA context.

Official reference: Node.js `napi_create_external_arraybuffer`: https://nodejs.org/api/n-api.html#napi_create_external_arraybuffer

### Host micro-batching is one mode, not the generic architecture

A `setImmediate` supervisor that launches short kernels is a possible host-orchestrated mode and may help on watchdog-constrained systems. It cannot be the required UMCGS production loop when each host relaunch is necessary for active search progress. UMCGS ADR-0003 requires device-owned progress after ignition.

CUDA-JS should expose generic launch/completion capabilities and a platform watchdog profile. UMCGS chooses a conforming device-owned mechanism—persistent execution, supported graph/tail-launch behavior, or another measured strategy.

### Mock and reference semantics are different

A CPU/JavaScript mock can validate resource lifecycle, argument validation, errors, cancellation, and event-loop orchestration. It does not automatically prove CUDA memory ordering, numerical behavior, timing, or UMCGS search semantics. UMCGS retains its independent Search IR reference backend.

### Atomic flags are not a publication protocol

`arena_exhausted` and `generation_id` are useful fields but not sufficient contracts. Ownership, memory ordering, visibility, publication states, ABA/wrap behavior, cancellation, terminal error, reset authority, and stale-reader behavior must be specified by the owning search/runtime contract.

### CUDA errors need context-health semantics

CUDA calls may report errors from earlier asynchronous work. Some failures can invalidate a context or make continued in-process use unsafe. The runtime must distinguish immediate call failure, deferred asynchronous failure, recoverable operation failure, poisoned context, and restart-required state instead of converting every nonzero `CUresult` into an ordinary reusable JavaScript exception.

Official reference: NVIDIA CUDA Driver API documentation and per-entry-point asynchronous-error notes: https://docs.nvidia.com/cuda/cuda-driver-api/index.html

### Schema-driven Driver updates are viable but not automatic

`cuGetProcAddress` supports retrieving ABI-compatible Driver entry points by requested CUDA API version. It is a strong basis for schema-driven updates, but the schema still needs exact signatures, requested version, platform ABI, optionality, compatibility tests, and fallback behavior.

Official reference: NVIDIA CUDA Driver entry-point access: https://docs.nvidia.com/cuda/cuda-driver-api/group__CUDA__DRIVER__ENTRY__POINT.html

## Experiments required before production design

- JIT call stubs for x86-64 Windows, x86-64 System V, and ARM64 where supported;
- W^X executable-memory lifecycle, unwind/crash diagnostics, and thread ownership;
- `cuGetProcAddress` version negotiation across target drivers;
- device-local plus mapped/pinned control-window behavior versus managed memory;
- external-buffer lifetime across garbage collection and context teardown;
- event-loop completion through polling, native notification, and thread-safe delivery;
- NVRTC plus driver/nvJitLink outputs and complete cache identity;
- immediate/deferred error attribution and poisoned-context recovery;
- Windows WDDM watchdog behavior and capability profiles;
- mock/native generic lifecycle conformance.

## Conclusion

The repository split is technically and organizationally sound. The initial four-brick sketch should be retained as proposal input, then decomposed into generic runtime contracts and bounded experiments. UMCGS should consume the result through a versioned adapter without moving search policy into CUDA-JS.