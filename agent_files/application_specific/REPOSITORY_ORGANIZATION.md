# UMCGS Repository Organization

**Scope:** Accepted UMCGS mapping of the general large-project organization policy.

This file applies [`../general_foundation/PROJECT_ORGANIZATION.md`](../general_foundation/PROJECT_ORGANIZATION.md) to UMCGS. The governing organization decision is [`../../docs/decisions/ADR-0004-large-project-organization.md`](../../docs/decisions/ADR-0004-large-project-organization.md); the accepted generic-runtime extraction is [`../../docs/decisions/ADR-0014-extract-cuda-js-runtime.md`](../../docs/decisions/ADR-0014-extract-cuda-js-runtime.md).

## Multi-repository topology

```text
iteathen/CUDA-MCGS
  owns universal graph-search contracts, specialization,
  generated search programs, search conformance, and CUDA-JS adapter
        │
        │ versioned package/runtime contract
        ▼
iteathen/CUDA-JS
  owns generic Node/CUDA bindings, resources, compile/link/load,
  launch/completion/error/teardown, packaging, and runtime conformance
```

The dependency is one-way. CUDA-JS must not import UMCGS. UMCGS must not depend on CUDA-JS private source paths, branches, worktrees, or unversioned build output.

No Git submodule is used. Released packages/artifacts, schemas, checksums, and compatibility manifests are the connection surface.

The UMCGS-to-CUDA-JS adapter remains an UMCGS component until it has an independently versioned lifecycle or multiple independent producers. Do not create a third repository merely to mirror the boundary.

## UMCGS repository topology

```text
/
├── agent_files/       canonical developer and coding-agent guidance
├── docs/              charter, ADRs, specs, architecture, research, archive
├── schemas/           versioned machine-readable search and interop contracts
├── components/        production UMCGS search framework components
├── adapters/          domain, policy, evaluator, output, and runtime adapters
├── conformance/       Search IR reference backend, synthetic domains, contract suites
├── benchmarks/        cross-component and compatible-runtime performance/quality suites
├── experiments/       isolated disposable investigations and prototypes
├── examples/          minimal public-surface usage examples
├── tools/             reusable search build/generation/test tooling
├── scripts/           thin repository task entry points
├── tests/             cross-component, system, end-to-end, and interop capsules
├── packaging/         UMCGS releases, execution-package manifests, compatibility metadata
├── third_party/       vendored external material and provenance
└── .github/           GitHub workflow and collaboration configuration
```

These product areas are reserved so first implementations enter durable homes rather than forcing relocation.

## Root policy

The root contains only project/governance entry points, workspace/build/package manifests, license/security/contribution metadata, `next_step.yaml`, and reserved product areas.

No production `.cu`, `.cpp`, `.h`, `.rs`, `.js`, `.mjs`, `.ts`, model, schema, benchmark result, test fixture, or generated artifact belongs at root.

Adding another top-level directory requires an accepted organizational decision and organization-checker update.

## Product areas

### `schemas/`

Authoritative UMCGS Search IR, domain, policy, evaluator, resource, graph, output, execution-package, component, and compatibility schemas. Generated bindings do not become independent sources of truth.

Generic CUDA Driver entry-point or runtime-resource schemas belong in CUDA-JS.

### `components/`

Production UMCGS components. Every immediate child has `README.md` and `component.yaml`, public/internal separation, owner-local tests, and explicit cleanup/lifecycle behavior.

Planned UMCGS responsibility areas include Search IR tooling, search capability resolution/compiler, finite memory planning, search layout/device-program generation, graph store, transposition, device search scheduler, evaluator composition, search diagnostics, and public SDK. Generic Node/CUDA runtime responsibilities are excluded.

### `adapters/`

Concrete domain, search-policy, evaluator/model, output, and peer-runtime adapters. Use families such as:

```text
adapters/domains/
adapters/policies/
adapters/evaluators/
adapters/outputs/
adapters/runtimes/
```

The CUDA-JS adapter consumes only CUDA-JS public contracts and owns UMCGS package/result semantic mapping. Adapter implementation must not leak back into universal search contracts or into CUDA-JS.

### `conformance/`

Owns the deterministic Search IR reference backend, synthetic search domains, cross-implementation search-contract capsules, golden cases, and compatible UMCGS/CUDA-JS pair matrices.

Conformance consumes public contracts. It does not become a hidden production dependency or duplicate CUDA-JS generic runtime suites.

### `benchmarks/`

Owns system-level search/performance/quality harnesses, workloads, environment manifests, result schemas, and comparison tooling. Exact CUDA-JS runtime/artifact identity is part of the evidence key when used.

### `experiments/`

Owns disposable search, runtime-boundary, scheduling, device-closure, and integration investigations with named questions and promotion/deletion criteria. Generic CUDA-JS implementation experiments belong in CUDA-JS.

### `examples/`

Uses only UMCGS public contracts and released peer runtime surfaces. An example that requires private CUDA-JS or UMCGS imports exposes a boundary failure.

### `tools/`

Owns reusable Search IR, specialization, package generation, inspection, migration, and test orchestration. Generic Driver binding generation belongs in CUDA-JS.

### `tests/`

Contains only integration/system/end-to-end capsules spanning UMCGS components or the public CUDA-JS compatibility boundary. Unit and component-contract tests stay with their owner. CUDA-JS native ABI/resource tests stay in CUDA-JS.

### `packaging/`

Owns UMCGS release manifests, generated execution-package metadata, CUDA-JS compatibility ranges/exact tested pairs, checksums, installation/distribution composition, and reproducibility metadata.

It consumes released CUDA-JS artifacts and manifests rather than source paths.

### `third_party/`

Contains copied/vendored external material only with origin, revision, license, local modifications, update process, and owner. CUDA-JS is a peer dependency, not vendored third-party source.

## Component identity

UMCGS component IDs express search ownership, for example:

```text
contract.search-ir
contract.cuda-js-package
tool.schema
tool.compiler
integration.cuda-js
runtime.search-device
runtime.graph-store
runtime.search-scheduler
sdk.adapters
adapter.domain.synthetic-example
adapter.policy.puct
```

Generic IDs such as `runtime.host` or a generic CUDA memory/Driver owner are not UMCGS components after ADR-0014.

## Dependency direction

- UMCGS schemas/contracts are data authorities and do not depend on generated consumers.
- Search adapters depend on stable contracts/SDK, never private compiler/runtime paths.
- `integration.cuda-js` depends on UMCGS execution-package contracts and released CUDA-JS public contracts.
- Other UMCGS components do not call CUDA-JS directly unless an accepted dependency decision moves that responsibility.
- CUDA-JS cannot depend on UMCGS.
- Conformance/examples consume public surfaces.
- Tools may generate artifacts, but generated output identifies its source and complete peer-runtime compatibility inputs.
- Diagnostics observe through bounded contracts and never control active search.
- Component dependencies remain acyclic and declared in manifests.

## Component creation

Do not create planned component directories merely to reserve names. At creation include an accepted/authorized purpose, README, manifest, registry update, public/internal boundary, test capsule/command, governing authority, dependencies, lifecycle, and migration.

## Repository and peer extraction

A new repository still requires an independent version/release, deployment/install, access/security, ownership/roadmap, external-consumer, toolchain/legal, or peer-composition lifecycle.

CUDA-JS meets that threshold through its generic native/JIT toolchain, security boundary, release compatibility, and unrelated-consumer potential. The UMCGS adapter currently does not.

A repository split includes:

- source and target charters;
- exact owner and non-owner lists;
- versioned public contract;
- dependency direction and compatibility policy;
- test/conformance ownership;
- migration/rollback and provenance;
- packaging/release and cleanup state.

## Enforcement

[`../../scripts/check-project-organization.mjs`](../../scripts/check-project-organization.mjs) enforces UMCGS topology, root source-file prohibition, component manifests, and dumping-ground rules. Cross-repository contract conformance is added with the accepted version-zero interop specification.
