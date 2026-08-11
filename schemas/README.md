# Schemas

Versioned machine-readable CUDA-MCGS/UMCGS contract schemas and metaschemas live here.

Schemas are authoritative sources for generated bindings, layouts, validation, normalization, compatibility, and cache identity where an accepted specification says so. Generated consumers do not become independent sources of truth.

A schema does not replace its governing behavioral contract. Contracts define semantic meaning, ownership, permissions, invariants, lifetime, concurrency/order/publication, bounded resources, failure, and compatibility; schemas make the representation of those facts machine-verifiable where appropriate.

## Accepted schemas

- [`search-ir/0.1.0/search-ir.schema.json`](search-ir/0.1.0/search-ir.schema.json) — the strict foundational Search IR 0.1.0 representation governed by [`SPEC-0002`](../docs/specs/SPEC-0002-search-ir-and-reference-semantics.md), covering the publication, graph, path, resource, stop, result, and identity semantics accepted in SPEC-0001.

The complete extension-capable Search IR and its Extension Surface/Point/Fragment representations remain planned rather than accepted.

Planned families include:

- Search IR extensions beyond the accepted 0.1.0 foundation;
- domain;
- search policy;
- evaluator;
- search execution/storage;
- resource/memory plan;
- graph/transposition/cycle semantics;
- output/result;
- Search Extension Surface and Extension Point descriptors;
- point-specific Context Schemas;
- Extension Fragment manifests and composition constraints;
- Search Image/execution-package manifests;
- device-module/fragment ABI where required;
- specialization/cache/provenance identity;
- component manifests.

Extension schemas are composition-time inputs. Production active search must not require runtime schema interpretation or lookup to resolve an extension point.
