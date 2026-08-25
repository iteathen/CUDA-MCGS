# Schemas

Versioned machine-readable CUDA-MCGS/UMCGS contract schemas and metaschemas live here.

Schemas are authoritative sources for generated bindings, layouts, validation, normalization, compatibility, and cache identity where an accepted specification says so. Generated consumers do not become independent sources of truth.

A schema does not replace its governing behavioral contract. Contracts define semantic meaning, ownership, permissions, invariants, lifetime, concurrency/order/publication, bounded resources, failure, and compatibility; schemas make the representation of those facts machine-verifiable where appropriate.

## Accepted schemas

- [`search-ir/0.1.0/search-ir.schema.json`](search-ir/0.1.0/search-ir.schema.json) — the strict foundational Search IR 0.1.0 representation governed by [`SPEC-0002`](../docs/specs/SPEC-0002-search-ir-and-reference-semantics.md), covering the publication, graph, path, resource, stop, result, and identity semantics accepted in SPEC-0001.

Proposal Search IR 0.2.0 evidence begins with the closed [`contract-set.json`](search-ir/0.2.0/contract-set.json) and [`requirement-coverage.json`](search-ir/0.2.0/requirement-coverage.json), each with its adjacent strict structural schema. The contract set freezes the accepted 0.1.0 foundation and the exact twelve proposal sources. The coverage index expands all 989 IDs and records honest classification/evidence status as owner leaves proceed.

[`primitives.schema.json`](search-ir/0.2.0/primitives.schema.json) owns representation-only IDs, versions, digests, schema references, public references and arbitrary-width unsigned decimal encoding. [`framework-selection.schema.json`](search-ir/0.2.0/framework-selection.schema.json) owns only the closed selection/binding envelope. It references owner profiles by exact identities and does not absorb their semantic fields. [`domain-profile.schema.json`](search-ir/0.2.0/domain-profile.schema.json) owns only SPEC-0007 state/action/history/role/transition/outcome selections, finite semantic-port bounds, resource contributions, compatibility and restricted Device-JS program contribution identity. It contains no graph layout, policy, evaluator, output-publication, scheduler or CUDA mechanism meaning. [`graph-profile.schema.json`](search-ir/0.2.0/graph-profile.schema.json) owns only SPEC-0010 graph object/reference/region/transposition/path/root-protection/reclamation/publication selections and graph resource/program contributions. Domain and namespaced product regions remain opaque owner records; the schema selects no allocator, scheduler, physical CUDA topology or native mechanism. [`policy-profile.schema.json`](search-ir/0.2.0/policy-profile.schema.json) owns only SPEC-0008 role handling, policy records, selection/reservation/admission, value adaptation/algebra, cycle response, transactional backup, stopping and reroot-reuse selection. Domain, graph and optional evaluator inputs are exact public profile/port references; the schema selects no universal formula, scalar/zero-sum/ranking meaning, physical scheduler or CUDA mechanism. [`evaluator-profile.schema.json`](search-ir/0.2.0/evaluator-profile.schema.json) owns only selected SPEC-0009 proposal/evaluation capabilities, exact input/output shapes and keys, finite request/batch/workspace/publication/cache/resident-artifact/mutable-state semantics, device-owned progress, reuse, lifecycle and restricted Device-JS program contribution identity. Policy use remains an exact public profile/port reference; evaluator absence remains structural omission, and the schema selects no model framework, scheduler, CUDA mechanism or native implementation. [`resource-profile.schema.json`](search-ir/0.2.0/resource-profile.schema.json) owns only SPEC-0011 logical contribution composition, finite classes/pools/partitions/reserves, admission groups, conservation ledgers, pressure facts, exhaustion, lifecycle/cleanup and consumer-neutral provider requirements. Contributor owners retain their semantic pressure responses; CUDA-JS retains opaque physical allocation and CUDA mechanisms. These artifacts are proposal evidence, not accepted Search IR or production API.

The complete owner schemas, stage/channel-capable Search IR and restricted Device-JS Search Program representations remain planned rather than accepted.

Planned families include:

- Search IR extensions beyond the accepted 0.1.0 foundation;
- search execution/storage;
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
