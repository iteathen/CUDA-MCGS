# Schemas

Versioned machine-readable CUDA-MCGS/UMCGS contract schemas and metaschemas live here.

Schemas are authoritative sources for generated bindings, layouts, validation, normalization, compatibility, and cache identity where an accepted specification says so. Generated consumers do not become independent sources of truth.

A schema does not replace its governing behavioral contract. Contracts define semantic meaning, ownership, permissions, invariants, lifetime, concurrency/order/publication, bounded resources, failure, and compatibility; schemas make the representation of those facts machine-verifiable where appropriate.

## Accepted schemas

- [`search-ir/0.1.0/search-ir.schema.json`](search-ir/0.1.0/search-ir.schema.json) — the strict foundational Search IR 0.1.0 representation governed by [`SPEC-0002`](../docs/specs/SPEC-0002-search-ir-and-reference-semantics.md), covering the publication, graph, path, resource, stop, result, and identity semantics accepted in SPEC-0001.

Proposal Search IR 0.2.0 evidence begins with the closed [`contract-set.json`](search-ir/0.2.0/contract-set.json) and [`requirement-coverage.json`](search-ir/0.2.0/requirement-coverage.json), each with its adjacent strict structural schema. The contract set freezes the accepted 0.1.0 foundation and the exact twelve proposal sources. The coverage skeleton routes all 989 extracted requirement IDs to one semantic owner leaf while truthfully keeping them pending until their owner evidence is implemented. These artifacts are proposal evidence, not accepted Search IR or production API.

The complete owner schemas, stage/channel-capable Search IR and restricted Device-JS Search Program representations remain planned rather than accepted.

Planned families include:

- Search IR extensions beyond the accepted 0.1.0 foundation;
- domain;
- search policy;
- evaluator;
- search execution/storage;
- resource/memory plan;
- graph/transposition/cycle semantics;
- output/result;
- Search Stage graph and stable checkpoint descriptors;
- checkpoint-specific Context Schemas and stage capability sets;
- Async Stage Channel and readiness/progress schemas;
- restricted Device-JS stage capability composition manifests and constraints;
- Search Image/execution-package manifests;
- checkpoint contract and public CUDA-JS package requirements where required;
- specialization/cache/provenance identity;
- component manifests.

Stage capability/channel schemas are composition-time inputs. Production active search must not require runtime schema interpretation or lookup to resolve a stage surface, capability or channel.
