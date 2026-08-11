# UMCGS and CUDA-JS Repository Topology

**Status:** Informational

The accepted boundary is two peer repositories with one-way dependency and versioned artifacts.

## Repositories

### `iteathen/UMCGS`

Owns the universal graph-search product:

- Search IR;
- domain, graph, policy, evaluator, output, and finite-resource contracts;
- search-specific capability resolution and specialization;
- search-specific layouts and generated device programs;
- device-owned selection, expansion, evaluation batching, backup, stopping, and result behavior;
- deterministic reference interpretation and synthetic conformance domains;
- the adapter that emits a CUDA-JS execution package.

### `iteathen/CUDA-JS`

Owns the generic Node/CUDA runtime:

- Driver API symbol/version discovery;
- schema-compiled host-call backends and exact host-call/JIT capability evidence;
- opaque contexts, modules, functions, memory, streams, events, and compilations;
- memory-kind capability contracts;
- NVRTC/link/load/launch primitives;
- asynchronous completion/cancellation delivery;
- generic error, context-health, teardown, packaging, compatibility, mock, and conformance behavior.

## Artifact flow

```text
UMCGS input contracts
      │
      ▼
Search IR + resource/search specialization
      │
      ▼
UMCGS execution package
  - required CUDA-JS contract/capabilities
  - modules and complete cache inputs
  - opaque memory/resource requirements
  - arguments and launch descriptions
  - one-way cancellation and completion schema
  - compatibility/provenance manifest
      │
      ▼
UMCGS CUDA-JS adapter
      │
      ▼
versioned CUDA-JS package/runtime
      │
      ▼
CUDA Driver / GPU
```

The execution package contains search-specific device code. CUDA-JS treats it as an opaque validated program and never interprets Search IR.

UMCGS expresses requirements through public capability and evidence profiles. It does not encode CUDA-JS-private mechanisms such as Node FFI, Workers, runtime actors, dynamic-library paths, or internal resource representations.

## Dependency rules

- UMCGS may depend only on CUDA-JS public packages, schemas, and artifact manifests.
- CUDA-JS never imports UMCGS source, schemas, fixtures, or terminology.
- UMCGS source may call generic CUDA behavior only through its CUDA-JS adapter, except in explicitly isolated experiments.
- No consumer relies on a peer repository's branch, worktree, internal path, unversioned generated file, or local build directory.
- Compatibility is expressed as version ranges and exact tested revision/artifact pairs.
- Generated artifacts identify source schema, generator/compiler, runtime contract, platform, driver/toolkit, GPU architecture, build options, model/adapter inputs, and resource profile where material.

## Release and test ownership

CUDA-JS releases generic runtime packages and publishes backend-neutral capability, host-call/JIT, ABI, lifecycle, and platform compatibility evidence. UMCGS releases search framework packages and generated execution-package specifications.

Testing is divided as follows:

- CUDA-JS owns generic runtime conformance, resource lifetime, error, ABI, compilation/link/load, launch, completion, cancellation, and teardown capsules.
- UMCGS owns Search IR semantics, search-specific memory planning, generated package correctness, device closure, search quality, and synthetic-domain conformance.
- Cross-repository integration owns a small compatibility capsule keyed by exact UMCGS and CUDA-JS revisions/artifacts. It does not duplicate either repository's complete test suite.

## Adapter placement

The UMCGS-to-CUDA-JS adapter remains in UMCGS because it consumes UMCGS contracts and changes with their lowering. It may be extracted only after a separate accepted lifecycle decision.

## Repository creation state

The CUDA-JS foundation has been researched, adversarially assessed, reconciled, committed locally, validated, bundled, zipped, and checksummed at `77090a981fabb547d9e1a98d76213f2048e81ef2`.

Its selected private implementation is currently Node-FFI-first with a GPU-free `EXP-000` qualification gate. That implementation choice is CUDA-JS authority and remains non-normative for UMCGS. UMCGS depends only on the future public package, capability manifest, and exact compatible-pair evidence.

Account-level remote repository creation remains the publication blocker. Native capability and performance claims remain blocked on the CUDA-JS experiment sequence.

