# CUDA-JS Foundation Research and Planning Result

**Status:** Research Note

**Date:** 2026-08-10

## Scope and exact identity

This note records the completed local research, adversarial assessment, architecture, experiment ordering, failure-containment rules, and dependency plan for the independent CUDA-JS runtime. It does not make CUDA-JS private internals normative for UMCGS and does not claim production or native CUDA validation.

- CUDA-JS exact local `main` commit: `77090a981fabb547d9e1a98d76213f2048e81ef2`
- Foundation decision commit: `383d9f3662a4def90ab99a3fb3039f27e0628024`
- GPU-free qualification-plan commit: `2f018a01eaade9a678a16892b1dbd2d1b639e5ba`
- UMCGS authority inspected at: `48f7b5f5fe125c16d966eaaa4968700900cd12fb`
- Intended private remote: `iteathen/CUDA-JS` — not yet created or published

Verified portable artifacts:

- `CJS-FND-77090a9.bundle` — SHA-256 `39dc57ea37fac71522b99090945b232173f65676f3421f4e6ea4baa84ca41ad3`
- `CJS-FND-77090a9.zip` — SHA-256 `419cd4453cccd489da6475836f911fc3d8f39ca2a3286b10f63df9db12913408`
- `CJS-FND-77090a9-HO.md` — SHA-256 `43c68aebe508d227ca8d35422d56d0f4f407423d29151ae6e9476cb40266192b`

## Research conclusion

The selected CUDA-JS version-zero foundation is a schema-compiled, capability-safe, thread-affine Node runtime for CUDA host APIs.

The baseline host-call substrate is the experimental `node:ffi` implementation in an exact supported Node.js 26 profile. CUDA-JS does not maintain handwritten or ahead-of-time wrappers for individual CUDA functions. It generates ABI facts, FFI definitions, structure/out-parameter packers, conformance cases, and compatibility manifests from pinned official CUDA headers plus a reviewed semantic overlay.

Raw Driver resources remain inside a private runtime actor. One runtime domain owns one private CUDA context and every context-dependent resource by default. A separate compiler domain owns NVRTC, nvJitLink, compiler/linker resources, logs, artifacts, and cache lifetimes. Public consumers receive opaque generation-checked capabilities rather than native or device pointers.

Graceful close and unexpected runtime-domain loss are distinct public states. Unexpected loss invalidates the runtime epoch and every outstanding capability. When native-state recovery has not been proven, the public result is restart-required with orphan inventory—not a false claim that inaccessible resources were released.

Compiler providers must publish a public capability/isolation profile. The selected private Linux NVRTC profile disables process-wide stack-limit modification; providers with unavoidable process-global effects require stronger isolation. UMCGS consumes the public capability and artifact identity, not the private Worker or child-process mechanism.

Strict JIT dispatch is not assumed from a signature or timing result. CUDA-JS distinguishes cold/bootstrap support, candidate Fast-FFI eligibility, and a future strict-JIT evidence profile. A strict profile remains blocked until an exact-profile experiment can directly support the claim. APIs that require arbitrary returned-function-pointer invocation remain unsupported or require a later separately accepted generic JIT/upstream capability decision.

## First executable gates

`EXP-000` is the first code-bearing gate and requires no CUDA Driver, toolkit, or GPU. It uses a generated dependency-free C library and direct C oracle to test scalar/pointer/out/structure-storage ABI handling, Worker isolation, library/resource lifetime, cleanup, Fast-FFI eligibility classification, and the arbitrary returned-function-pointer gap.

NVRTC compile-only qualification is also separated from Driver/GPU module-load and launch evidence. Current NVRTC supports GPU-free compilation on its supported host platforms. On Linux the accepted in-process profile must verify `-modify-stack-limit=false` prevents process-wide stack-limit mutation.

Only after the host substrate passes should CUDA-specific experiments add Driver loading, requested-version/export verification, pinned CUDA headers, native layout probes, context ownership, memory, launch, completion, and deferred-error behavior.

## Public consequences for UMCGS

UMCGS must depend on CUDA-JS through public, versioned capabilities and artifacts—not through the current private implementation plan.

The UMCGS execution-package contract should express:

- required CUDA-JS contract and capability versions;
- required host-call evidence profile where latency or strict JIT materially affects the search contract;
- required context, memory-kind, module, launch, stream/event, completion, cancellation, error/health, compiler/linker, and teardown capabilities;
- explicit graceful-close, dead-epoch, restart-required, and orphan-report behavior where runtime-domain loss is material;
- compiler/linker isolation and side-effect capability class without naming a private provider mechanism;
- complete package, module, model/adapter, generator, platform, Driver/toolkit, GPU-architecture, option, provider, and resource-profile identity where material;
- opaque resource requirements without raw handles or pointers;
- exact compatible UMCGS/CUDA-JS artifact pairs and conformance evidence;
- device-closure requirements that prohibit host-produced intermediate search decisions after ignition.

UMCGS must not encode `node:ffi`, `Worker`, `DriverActor`, `CompilerActor`, child-process selection, dynamic-library paths, or other CUDA-JS-private mechanisms into its public package format. Those details may change while the public capability contract remains stable.

## Validation completed

The CUDA-JS exact committed tree passed required-file, active-authority, documentation-link, structured-data, dependency-DAG, diff, clean-worktree, secret-pattern, and production-source-boundary checks. The research branch was fast-forwarded into local `main` and removed. The Git bundle and tracked-tree ZIP were verified.

Accepted ADRs remained immutable. The rejected Node-API/AsmJit-first material is retained under archive as non-authoritative provenance.

## Claim limits and blockers

The planning environment runs Node.js 22.16.0, rejects `--experimental-ffi`, and has no qualified NVIDIA Driver, official CUDA 13.3 header/toolkit set, or GPU. No Node FFI, CUDA ABI, kernel, memory, asynchronous-error, Fast-JIT, NVRTC, or performance experiment was executed or claimed.

Final cross-repository acceptance remains blocked until:

1. private `iteathen/CUDA-JS` publishes exact commit `77090a981fabb547d9e1a98d76213f2048e81ef2`;
2. `EXP-000` qualifies or falsifies the Node-FFI-first host substrate;
3. GPU-free NVRTC compilation and its side-effect profile are qualified;
4. CUDA-specific foundation experiments pass on a qualified first platform;
5. CUDA-JS publishes an accepted public contract and capability manifest;
6. UMCGS and CUDA-JS pass one compatible-pair capsule keyed by exact artifacts.
