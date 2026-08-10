# ADR-0004: Organize for Large-Project Scale from Inception

**Status:** Accepted

**Date:** 2026-08-10

## Context

Projects built with coding agents can grow quickly while retaining the organization of their first few files. Flat roots, mixed ownership, generic helper directories, direct internal imports, duplicated sources of truth, and build/test sprawl then become expensive to untangle.

UMCGS is expected to contain schemas, compiler/tooling, host and device runtimes, generated artifacts, domain/policy/evaluator adapters, conformance domains, benchmarks, experiments, packaging, and third-party references. Waiting until those areas are crowded would require a disruptive reorganization across code, tests, documentation, build logic, persistent formats, and agent context.

## Decision

UMCGS will organize the repository and each component as though the project is already very large, regardless of current file count.

The repository will use stable top-level product areas and the hierarchy:

```text
repository -> product area -> component -> subsystem/module -> file
```

Every production component will have a stable ID, README, machine-readable manifest, lifecycle owner, public/internal boundary, declared acyclic dependencies, validation ownership, and registry entry.

Production source will not be placed at repository root. Generic catch-all `common`, `shared`, `utils`, `helpers`, `misc`, or equivalent owners are prohibited.

Cross-component consumers will use declared public contracts rather than deep imports.

The organizational scaffolding will be established early, but implementation abstractions and repository splits will still require an actual behavioral or lifecycle need.

UMCGS will remain a componentized monorepo until a component has an independent release, deployment, security, ownership, legal/toolchain, or external-consumer lifecycle that justifies extraction.

The operational policies are:

- [`../../agent_files/general_foundation/PROJECT_ORGANIZATION.md`](../../agent_files/general_foundation/PROJECT_ORGANIZATION.md)
- [`../../agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](../../agent_files/application_specific/REPOSITORY_ORGANIZATION.md)
- [`../../agent_files/SYSTEM_REGISTRY.md`](../../agent_files/SYSTEM_REGISTRY.md)

## Rationale

Stable ownership and dependency direction are cheap to establish before implementation and expensive to retrofit after components become entangled.

This approach preserves the user's LEGO principle: components are coherent, replaceable bricks with stable connection surfaces, while internals remain pragmatic and simple.

Treating organization as large-scale does not require speculative runtime layers. It prevents physical and ownership layout from becoming an accidental architectural constraint.

## Consequences

- New product areas and components require explicit placement and manifests.
- The root remains sparse.
- Structural validation becomes part of CI.
- Component-local tests/documentation/tooling remain with their owner; cross-component suites have dedicated areas.
- Early changes may include more README/manifest/registry work than a small project normally would.
- Future extraction is easier because boundaries are not encoded as deep internal paths.
- Repo splitting remains a separate lifecycle decision rather than an organizational reflex.

## Alternatives considered

### Start flat and reorganize when necessary

Rejected. The later move would cross code, schemas, tests, build logic, generated artifacts, documentation, and agent guidance and would be more error-prone than establishing durable homes now.

### Create many repositories immediately

Rejected. Repository separation without independent lifecycle creates coordination, versioning, integration, and release costs without a real boundary.

### One universal shared/common layer

Rejected. Such layers tend to accumulate unrelated behavior and invert ownership. Shared behavior must have a specifically named owner and contract.

## Revisit triggers

Revisit the exact top-level topology when accepted specifications establish responsibilities that cannot fit the reserved product areas, or when an independently versioned/deployed/owned component justifies repository extraction. The large-project organization principle itself remains binding.
