# CUDA-MCGS/UMCGS and CUDA-JS Repository Topology

**Status:** Informational

The accepted boundary is two peer repositories with one-way dependency and versioned artifacts. CUDA-MCGS is the product-facing name of the search framework currently hosted in `iteathen/UMCGS`; existing accepted UMCGS identifiers remain authoritative until a separate naming/repository migration is accepted.

## Repositories

### `iteathen/UMCGS` — CUDA-MCGS search framework

Owns the universal graph-search product:

- Search IR;
- domain, graph, policy, evaluator, output, and finite-resource contracts;
- schema-backed Extension Surface/Point/Fragment semantics and Search Composer;
- search-specific capability resolution and specialization;
- search-specific layouts and generated device programs/Search Images;
- graph/transposition/path/publication/reclamation semantics;
- device-owned selection, expansion, evaluation batching, backup, stopping, scheduling policy, and result behavior;
- deterministic reference interpretation and synthetic conformance domains;
- the adapter that emits a CUDA-JS execution package.

### `iteathen/CUDA-JS`

Owns the generic Node/CUDA runtime:

- Driver API symbol/version discovery;
- schema-compiled host-call backends and exact host-call/JIT capability evidence;
- opaque contexts, modules, functions, memory, streams, events, and compilations;
- memory-kind capability contracts;
- NVRTC/nvJitLink compilation/linking, generic device-artifact cache/load, and launch primitives;
- asynchronous completion/cancellation delivery;
- generic error, context-health, teardown, packaging, compatibility, mock, and conformance behavior.

CUDA-JS does not own Search IR, graph/search semantics, extension-point meaning, search scheduling policy, or search-memory planning.

## Ecosystem language policy

Both peer repositories—and every future repository extracted from or primarily created to support this ecosystem—are Python-free.

Python is prohibited in production and reference source, tools, schema importers, generators, tests, benchmarks, documentation tooling, CI, packaging, installers, release automation, migrations, diagnostics, prototypes, experiments, and one-off or temporary scripts. A wrapper, container, vendored tool, or indirect invocation does not create an exception when ordinary project use still requires Python.

Each repository carries and applies [`NO_PYTHON_POLICY.md`](../../agent_files/general_foundation/NO_PYTHON_POLICY.md). A new related repository must adopt the same accepted policy before code-bearing work begins. Repository separation, extraction, or an independent release lifecycle may not be used to bypass it.

## Artifact flow

```text
CUDA-MCGS input contracts + selected extension manifests
      │
      ▼
Search IR + Extension Surface resolution
      │
      ▼
Search Composer
  - contract/schema compatibility
  - finite memory/layout plan
  - fragment composition inputs
  - scheduler/profile selection
  - complete artifact/cache identity
      │
      ▼
CUDA-MCGS execution package
  - required CUDA-JS contract/capabilities
  - source/LTO/binary modules and complete cache inputs
  - opaque memory/resource requirements
  - arguments and launch descriptions
  - initial data/model/configuration
  - one-way cancellation and completion schema
  - compatibility/provenance manifest
      │
      ▼
CUDA-MCGS CUDA-JS adapter
      │
      ▼
versioned CUDA-JS package/runtime
      │
      ▼
CUDA Driver / GPU
```

The execution package contains or identifies every search-specific device behavior required after ignition. CUDA-JS treats it as an opaque validated program/package and never interprets Search IR or Extension Point semantics.

CUDA-MCGS expresses requirements through public CUDA-JS capability and evidence profiles. It does not encode CUDA-JS-private mechanisms such as Node FFI, Workers, runtime actors, dynamic-library paths, or internal resource representations.

## Dependency rules

- CUDA-MCGS may depend only on CUDA-JS public packages, schemas, capabilities, and artifact manifests.
- CUDA-JS never imports CUDA-MCGS/UMCGS source, Search IR, schemas, fixtures, or search terminology.
- CUDA-MCGS source may call generic CUDA behavior only through its CUDA-JS adapter, except in explicitly isolated experiments.
- The CUDA-MCGS Search Composer owns search/extension composition decisions; CUDA-JS owns generic compile/link/load mechanisms.
- No consumer relies on a peer repository's branch, worktree, internal path, unversioned generated file, or local build directory.
- Compatibility is expressed as public version/capability profiles and exact tested revision/artifact pairs.
- Generated artifacts identify every material search schema/contract, extension fragment/configuration, generator/compiler, CUDA-JS runtime contract, platform, Driver/toolkit, GPU architecture, build/link option, model/adapter input, and resource profile.
- Higher-level projects such as cuVS, cuFFT, cuCollections, or RAPIDS are not baseline active-search runtime dependencies. Methodology/source reuse follows explicit dependency/provenance rules.

## Release and test ownership

CUDA-JS releases generic runtime packages and publishes backend-neutral capability, host-call/JIT, ABI, lifecycle, compiler/linker, and platform compatibility evidence. CUDA-MCGS releases search framework packages and generated execution-package specifications/images.

Testing is divided as follows:

- CUDA-JS owns generic runtime conformance, resource lifetime, error, ABI, compilation/link/load, launch, completion, cancellation, and teardown capsules.
- CUDA-MCGS owns Search IR semantics, extension-contract compatibility, search-specific memory planning, generated package correctness, device closure, zero-abstraction-cost extension evidence, search quality, and synthetic-domain conformance.
- Cross-repository integration owns a small compatibility capsule keyed by exact CUDA-MCGS and CUDA-JS revisions/artifacts. It does not duplicate either repository's complete test suite.

## Adapter placement

The CUDA-MCGS-to-CUDA-JS adapter remains in this repository because it consumes CUDA-MCGS contracts and changes with their lowering. It may be extracted only after a separate accepted lifecycle decision.

## Current peer state

The earlier local-only CUDA-JS foundation state is superseded.

At the exact inspected revision `ad49a6c9b0cddb420e26e097180cf9c502060a65`, `iteathen/CUDA-JS` is public and pre-release. Its bounded accepted evidence includes the F1 schema/ABI foundation, Windows F2W-F8W runtime/package slices, F6 NVRTC/nvJitLink compilation plus content-addressed artifacts, and the F9 `cuda-cccl` trusted-header/device-publication prerequisite.

F9 intentionally stops at a generic CUDA compiler/runtime prerequisite. It does not establish CUDA-MCGS extension composition, search correctness, scheduling, transposition semantics, performance, or the exact cross-repository compatible pair. Those remain owned by this repository and the current canonical plan in `next_step.yaml`.
