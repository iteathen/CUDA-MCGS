# Large-Project Organization

**Scope:** Reusable foundation for repository, component, package, source, test, documentation, and dependency organization.

## Governing rule

Always organize as though the project is already very large.

The cost of a little extra hierarchy at the beginning is small. The cost of reorganizing intertwined production code, tests, schemas, documentation, build logic, persistent data, and agent guidance later is high and risky.

This rule applies even when a project has one implementation file.

## What this rule means

Establish early:

- stable top-level product areas;
- coherent components with one lifecycle owner;
- public contracts separated from internal implementation;
- declared, acyclic dependency direction;
- durable locations for tests, benchmarks, schemas, tools, generated artifacts, experiments, third-party material, and documentation;
- machine-readable component manifests;
- a source-of-truth registry;
- explicit migration and archival behavior.

It does **not** mean:

- inventing unused runtime abstractions;
- splitting every folder into a package;
- creating microservices;
- creating many repositories merely to look mature;
- introducing interfaces inside a cohesive component where direct code is simpler;
- committing empty architecture that has no defined purpose.

Organizational scaffolding should anticipate scale. Implementation should remain as simple as the current owned behavior permits.

## Required hierarchy

Use this conceptual hierarchy:

```text
repository
  -> product area
    -> component
      -> subsystem/module
        -> file
```

### Repository

The repository is the release, governance, and integration boundary until an accepted decision establishes otherwise.

### Product area

A product area groups components by durable responsibility, such as runtime, compiler/tooling, adapters, conformance, benchmarks, or packaging. Product areas are stable top-level namespaces and should remain few.

### Component

A component is the smallest independently owned, contract-bearing LEGO unit. Follow [`LEGO_ARCHITECTURE.md`](LEGO_ARCHITECTURE.md) and [`COMPONENT_STANDARD.md`](COMPONENT_STANDARD.md). It has:

- one stable identifier;
- one primary purpose;
- one lifecycle owner;
- a documented public surface;
- internal implementation hidden from consumers;
- declared dependencies;
- owned validation;
- explicit persistent/generated state;
- defined compatibility and release relationship.

### Subsystem/module

A subsystem is an internal cohesive unit within a component. It is not automatically public and does not require its own package or repository.

### File

A file should have one clear reason to change. File placement follows ownership and lifecycle, not merely language or current convenience.

## Top-level directory rule

Top-level directories are scarce, durable namespaces. Add one only when it represents a long-lived product area that cannot fit an existing owner.

Do not create top-level directories for:

- one feature;
- one task;
- one temporary experiment;
- one programming language;
- one developer;
- one external library;
- one generated build;
- one model or domain adapter that belongs beneath an existing area.

Root files are limited to repository entry points, governance, workspace/build manifests, and universally relevant metadata. Production source code does not live at root.

## Standard component shape

Every production component must contain at least:

```text
<component>/
  README.md
  component.yaml
```

The component may then contain only the areas it actually needs:

```text
<component>/
  public/          # stable source-level public surface, when applicable
  include/         # language/toolchain-specific public headers, when applicable
  src/             # internal implementation
  schemas/         # component-owned machine-readable contracts
  tests/           # component-local tests
  benchmarks/      # component-local microbenchmarks
  docs/            # component-maintainer documentation
  generated/       # generated output, clearly marked and usually untracked
  tools/           # tools owned exclusively by this component
```

Language-native package layouts may replace these names when that improves idiomatic tooling, but they must preserve the same ownership and public/internal distinction.

Use [`../templates/component-manifest.template.yaml`](../templates/component-manifest.template.yaml) for the manifest.

## Component manifest

The manifest records at minimum:

- stable component ID;
- product area;
- purpose and status;
- runtime/build/data roles;
- public contracts;
- owned persistent state and generated artifacts;
- allowed and forbidden dependencies;
- known consumers;
- validation commands;
- release/compatibility relationship;
- governing specifications and ADRs.

The manifest is not decorative metadata. Agents must update it when ownership, dependency, compatibility, or lifecycle changes.

## Public and internal boundaries

A component may expose:

- an API or ABI;
- a schema;
- a generated artifact;
- a command-line entry point;
- a device-module contract;
- a data format;
- a test/conformance protocol.

Consumers depend on that declared surface, which follows [`CONTRACT_STANDARD.md`](CONTRACT_STANDARD.md). They must not import private files by relative path, depend on private symbols, or infer layout from implementation.

Internal refactoring should not require unrelated consumers to change.

## Dependency direction

Dependencies must be:

- explicit;
- declared in component manifests;
- acyclic at the component level;
- minimal;
- through public contracts;
- consistent with architectural layers.

A new cross-component dependency requires review of ownership, lifecycle coupling, failure behavior, performance, compatibility, and whether the behavior belongs in the consumer instead.

Circular dependencies are design failures. Resolve them by clarifying ownership or extracting a deliberately scoped contract owner—not by adding callbacks or global registries that conceal the cycle.

## No dumping grounds

Names such as these are prohibited as unowned catch-all components or directories:

```text
common
shared
utils
helpers
misc
stuff
general
legacy
temp
tmp
```

A narrowly defined utility component may exist only when it has a specific name, purpose, public contract, owner, dependencies, and consumers. “Used by several things” is not sufficient ownership.

## Tests and benchmarks

- Unit and component-contract tests live with the component.
- Cross-component integration, system, and end-to-end tests live in the repository's integration test area.
- Conformance suites live in their dedicated product area and consume only public contracts.
- Microbenchmarks live with the component.
- Cross-system benchmarks live in the benchmark product area with reproducible environments and quality guardrails.
- Test fixtures are owned, versioned, and placed with the narrowest valid test boundary.

Do not create one giant test directory that mirrors the entire source tree while obscuring ownership.

## Schemas and generated artifacts

Authoritative schemas live in the schema owner, not alongside one generated consumer.

Generated code and data:

- identify the source and generator;
- are never hand-edited;
- have deterministic regeneration where feasible;
- are excluded from source ownership decisions;
- are committed only when distribution, bootstrap, or review needs justify it.

Build products and transient generated files do not enter source directories.

## Tools and scripts

Repository `scripts/` contains thin, discoverable entry points. Reusable logic belongs in a properly owned tool component or `tools/` area with tests and documentation.

A one-off migration or investigation belongs in `experiments/` or an explicitly temporary tool location with disposal criteria. Do not allow scripts to become an undocumented second implementation of product behavior.

## Experiments

Experiments are isolated from production components. Each experiment states:

- question;
- owner;
- inputs and environment;
- expected disposal or promotion criteria;
- what production authority it does not have;
- validation/results.

Successful experiments are reimplemented or promoted through an accepted component/specification change. Production code must not silently import experiment internals.

## Third-party material

Vendored or copied material lives under the third-party area with exact origin, revision, license, local modifications, update process, and owner.

Do not scatter external source into product components.

## Creating a component

A component-creation change must include:

1. an accepted or explicitly authorized purpose;
2. component ID and product-area placement;
3. `README.md`;
4. `component.yaml`;
5. registry entry;
6. public/internal boundary;
7. dependency declarations;
8. validation ownership;
9. compatibility/release relationship;
10. migration from any superseded owner.

Do not create a component just to reduce file length or move complexity out of sight.

## Moving or splitting a component

A structural move requires:

- source and target owner;
- governing decision/specification;
- complete dependency and consumer inventory;
- compatibility and migration plan;
- persistent-state/generated-artifact handling;
- build, test, benchmark, documentation, and tooling updates;
- rollback;
- archive/supersession provenance.

Never leave compatibility shims indefinitely without a retirement condition.

## Repository split criteria

Organize components so they can be extracted, but keep them in the monorepo until an independent lifecycle is real.

A separate repository is justified by one or more strong boundaries:

- independently versioned and released product;
- independently deployed or installed product;
- materially different access/security boundary;
- independent ownership/team and roadmap;
- multiple external consumers that must not depend on the monorepo;
- toolchain or legal/distribution isolation;
- composition/integration product that consumes released artifacts from peer projects.

File count, build discomfort, or a desire for visual neatness is not enough.

When a repository coordinates peer products—such as an installer—it should consume declared release artifacts and manifests rather than internal source paths.

## Review checklist

Before accepting a structural change, verify:

- durable placement still makes sense at 10x scale;
- one clear owner exists;
- component ID and manifest are current;
- public/internal boundary is visible;
- dependencies are declared and acyclic;
- no generic dumping ground was introduced;
- tests, docs, schemas, tools, and benchmarks follow ownership;
- generated and third-party material are separated;
- migration and history are complete;
- project organization checks pass.

## CUDA-MCGS mapping

The CUDA-MCGS-specific product areas and allowed repository topology are defined in [`../application_specific/REPOSITORY_ORGANIZATION.md`](../application_specific/REPOSITORY_ORGANIZATION.md). The governing decision is [`../../docs/decisions/ADR-0004-large-project-organization.md`](../../docs/decisions/ADR-0004-large-project-organization.md).
