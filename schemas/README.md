# Schemas

Versioned machine-readable CUDA-MCGS/UMCGS contract schemas and metaschemas live here.

Schemas are authoritative sources for generated bindings, layouts, validation, normalization, compatibility, and cache identity where an accepted specification says so. Generated consumers do not become independent sources of truth.

A schema does not replace its governing behavioral contract. Contracts define semantic meaning, ownership, permissions, invariants, lifetime, concurrency/order/publication, bounded resources, failure, and compatibility; schemas make the representation of those facts machine-verifiable where appropriate.

Planned families include:

- Search IR;
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
