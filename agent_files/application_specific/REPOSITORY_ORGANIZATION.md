# UMCGS Repository Organization

**Scope:** Accepted UMCGS mapping of the general large-project organization policy.

This file applies [`../general_foundation/PROJECT_ORGANIZATION.md`](../general_foundation/PROJECT_ORGANIZATION.md) to UMCGS. The governing decision is [`../../docs/decisions/ADR-0004-large-project-organization.md`](../../docs/decisions/ADR-0004-large-project-organization.md).

## Repository topology

```text
/
├── agent_files/       canonical developer and coding-agent guidance
├── docs/              charter, ADRs, specs, architecture, research, archive
├── schemas/           versioned machine-readable framework contracts
├── components/        production framework components
├── adapters/          domain, policy, evaluator, and output adapters
├── conformance/       reference backend, synthetic domains, contract suites
├── benchmarks/        cross-component reproducible performance suites
├── experiments/       isolated disposable investigations and prototypes
├── examples/          minimal public-surface usage examples
├── tools/             reusable developer/build/generation tooling
├── scripts/           thin repository task entry points
├── tests/             cross-component, system, and end-to-end tests
├── packaging/         release composition and distribution metadata
├── third_party/       vendored external material and provenance
└── .github/           GitHub workflow and collaboration configuration
```

These top-level product areas are reserved now so first implementations enter their durable home rather than forcing later relocation.

## Root policy

The root contains only:

- project/readme/status/governance entry points;
- workspace/build/package manifests;
- license/security/contribution metadata;
- `next_step.yaml`;
- the reserved top-level product areas.

No production `.cu`, `.cpp`, `.h`, `.rs`, `.py`, `.js`, `.ts`, model, schema, benchmark result, test fixture, or generated artifact belongs at root.

Adding another top-level directory requires an accepted organizational decision and update to the organization checker.

## Product areas

### `schemas/`

Authoritative, versioned, machine-readable source contracts and metaschemas. Generated bindings do not become independent sources of truth.

Expected future families include Search IR, domain, policy, evaluator, resource, graph semantics, output, component manifest, and cache identity.

### `components/`

Production framework components. Every immediate child has:

```text
README.md
component.yaml
```

Internal layout follows its language/toolchain while preserving public/internal separation.

Planned responsibility areas include schema tooling, Search IR tooling, capability resolution/compiler, memory planner, layout/code generation, host lifecycle, device runtime, graph store, transposition, scheduler, evaluator integration, diagnostics, and public SDK. These names remain provisional until accepted specifications assign ownership.

### `adapters/`

Concrete domain, search-policy, evaluator/model, and output adapters. Adapter implementation must not leak back into universal components.

Use families such as:

```text
adapters/domains/
adapters/policies/
adapters/evaluators/
adapters/outputs/
```

Each adapter is itself a manifested component.

### `conformance/`

Owns the deterministic reference backend, synthetic domains, cross-implementation contract suites, golden cases, and compatibility matrices.

Conformance consumes public contracts. It does not become a hidden production implementation dependency.

### `benchmarks/`

Owns system-level benchmark harnesses, workload definitions, environment manifests, result schemas, and comparison tooling.

Raw/generated results should normally be external artifacts or explicitly versioned datasets rather than uncontrolled repository growth.

### `experiments/`

Owns disposable investigations with named questions and promotion/deletion criteria. Production components cannot deep-import experiment internals.

### `examples/`

Uses only public APIs/contracts. An example that requires internal imports exposes a boundary failure.

### `tools/`

Owns reusable build, schema, generation, inspection, migration, and developer tools. Tool logic must be tested; `scripts/` remains thin.

### `tests/`

Contains only integration/system/end-to-end tests that span components. Unit and component-contract tests stay with the owning component.

### `packaging/`

Owns release manifests, composition, artifact metadata, compatibility matrices, installation/distribution packaging, and reproducibility metadata.

If a future installer coordinates independently released peer projects, it should become a peer repository and consume released artifacts/manifests rather than internal source paths.

### `third_party/`

Contains copied/vendored external material only with origin, revision, license, local modifications, update process, and owner.

## Component identity

Component IDs are stable, lowercase, dotted names that express ownership rather than language, for example:

```text
contract.search-ir
tool.schema
tool.compiler
runtime.host
runtime.device
runtime.graph-store
runtime.scheduler
sdk.adapters
adapter.domain.chess
adapter.policy.puct
```

Directory names are concise kebab-case. Renaming a directory does not silently change a component ID.

## Dependency direction

The exact graph will be accepted with specifications, but these rules are already binding:

- schemas/contracts are data authorities and do not depend on generated consumers;
- adapters depend on stable contracts/SDK, never private compiler/runtime paths;
- public SDK does not depend on concrete adapters;
- examples and conformance consume public surfaces;
- tools may generate product artifacts but generated output identifies its source;
- diagnostics observe through bounded contracts and never control search;
- component dependencies are acyclic and listed in manifests.

## Component creation

Do not create planned component directories merely to reserve names. Create a component when its accepted specification or authorized experiment gives it owned behavior.

At creation, include:

- `README.md`;
- `component.yaml` based on [`../templates/component-manifest.template.yaml`](../templates/component-manifest.template.yaml);
- [`../SYSTEM_REGISTRY.md`](../SYSTEM_REGISTRY.md) update;
- public/internal boundary;
- tests and validation command;
- governing specs/ADRs;
- dependency declarations.

## Enforcement

[`../../scripts/check-project-organization.py`](../../scripts/check-project-organization.py) enforces top-level topology, root source-file prohibition, component manifests, and generic dumping-ground rules. Structural changes update the checker in the same accepted change.
