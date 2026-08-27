# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-08-27

## Shared harness + Domain

The shared `REF-HARNESS-01` plus `REF-DOMAIN-01` capsule is current against the same representation/composition identity used by the Graph proposal chain:

- expected/discovered/executed/passed: `49/49/49/49`;
- failed: `0`;
- required/conditional/optional skipped: `0/0/0`;
- direct SPEC-0007 planned/executed requirement coverage: `47/47`;
- representation/composition SHA-256: `f4e85941091a820047778679a3ab79573218f700349cc282d6210ba43942e98f` (`719510` canonical bytes);
- Domain projection SHA-256: `e169677d15c1220747f2f5e63434342dab6b46d65108a05aeb78485a490c338c` (`69524` canonical bytes);
- harness/Domain evidence SHA-256: `9d9d468f95010848210f25019563f7e7351e58dc74a29aa83391d0903a9db1b2` (`30372` canonical bytes).

The rebind updated both the top-level harness fixture identity and each declared neutral schedule's frozen evidence key before the full 49-case capsule was allowed to pass. Domain semantics themselves were unchanged by the Graph resource correction.

## REF-GRAPH-01 — current proposal chain

The explicit expansion-resource correction changed the normalized Graph profile and therefore legitimately rebound the selected-profile and behavioral evidence identities.

The current Composer qualification is:

- capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- expected/discovered/executed/passed: `879/879/879/879`;
- contract-set SHA-256: `2a3ded0b25f59d6f6a5dfffefefceae73f25e9df0558953b0bea29201d47c10d`;
- requirement-coverage SHA-256: `fe510fb69890b070ae6e7dfc60bd3e113a3f7e6354fa6bfcd8e48a6336c6c07a`;
- expanded-requirements SHA-256: `32fc66ca775046121146f3afc621e3407bab69711355e283b769d947fd185e0a`;
- framework-selection SHA-256: `48e0c83e6bad0a674efec8b84ac43246d20cb8c2eea82f78170442b2d699dc11` (`10422` canonical bytes);
- representation/composition SHA-256: `f4e85941091a820047778679a3ab79573218f700349cc282d6210ba43942e98f` (`719510` canonical bytes).

The Composer-owned normalized Graph-profile projection is:

- profiles: `4`;
- SHA-256: `f6abe5bbef4db62c5c79211ac954ece110a2da764cce6b5ce5e854870e9390ba`;
- canonical bytes: `132969`.

### NODE/transposition brick

NODE is rebound to the exact current Composer/projection pair and passes:

- capsule: `cuda-mcgs-graph-node-reference-v0.2.0`;
- expected/discovered/executed/passed: `13/13/13/13`;
- failed: `0`;
- direct `GRAPH-NODE-*` planned/executed requirement coverage: `11/11`;
- evidence SHA-256: `1e284c4f8da41c9afc794b6803e4d4ce13b7c0c74f903c383ca900bdacfee687`;
- canonical bytes: `10123`.

### EDGE/expansion brick

The current second Graph owner brick qualifies `GRAPH-EDGE-001` through `GRAPH-EDGE-010`:

- capsule: `cuda-mcgs-graph-edge-reference-v0.2.0`;
- expected/discovered/executed/passed: `16/16/16/16`;
- failed: `0`;
- direct `GRAPH-EDGE-*` planned/executed requirement coverage: `10/10`;
- exact upstream NODE evidence: `1e284c4f8da41c9afc794b6803e4d4ce13b7c0c74f903c383ca900bdacfee687`;
- exact Graph projection: `f6abe5bbef4db62c5c79211ac954ece110a2da764cce6b5ce5e854870e9390ba`;
- EDGE evidence SHA-256: `4a0ad1a80b5b02243ce1e1fd85a881f4127999fc14ca68b701550f7eda0cab40`;
- EDGE evidence canonical bytes: `11661`.

The 16 cases prove, within this bounded owner brick:

- parent-local edge identity remains distinct for independent incoming edges even when both resolve to one shared/transposed child node;
- action publication precedes child-resolution consumption, with a true mutation that invokes child resolution while the edge is still reserved;
- a pending-valid child claim can later become a ready child link without republishing the action;
- expansion batch publication is all-or-nothing over complete visible edge/action records;
- producer cursor/status data remains opaque to Graph and is bounded by the normalized expansion-record size;
- caller-reported action material cannot exceed the normalized `domain-action` owner-region bound;
- unique versus repeatable action multiplicity comes from the injected rule rather than Graph inference;
- expansion generations have one advancing claimer and explicit terminal outcomes;
- unpublished failed/cancelled reservations roll back exactly, while already-published reservations remain accounted and become `published-failed`;
- cancelling an expansion terminalizes a batch-published `child-pending` edge so no consumer is stranded;
- later finite batches remain admissible until a declared finite pressure outcome;
- expansion slots have an explicit finite resource contribution and an independently exercised exhaustion case;
- structural edge readiness does not publish or imply readiness of Policy/Evaluator/Output/extension-owned records; and
- parent-identity collapse, early child consumption and partial-batch publication are each caught by named mutation falsifiers.

## Expansion resource correction

Author review found that the normalized Graph profile had an expansion layout but did not previously contribute explicit finite expansion-slot capacity. The reference must not infer hidden storage from a layout or silently borrow parent-edge capacity.

The correction keeps the existing generic failure vocabulary and LEGO ownership boundary:

- materialized Graph fixtures now contribute explicit expansion slots with `edge-capacity` as the declared pressure outcome;
- the generic Graph normalizer sums per-engine slot resources whose pressure outcome is `edge-capacity` and requires them to cover parent-edge plus expansion layout capacity;
- a profile may still use separate or shared storage pools, but the finite budget must be explicit;
- under-budgeted profiles fail with `GRAPH_RESOURCE_CAPACITY` before use;
- the arbitrary-width Graph test scales the corresponding expansion-slot budget when it expands layout ranges, so the test does not manufacture a capacity contradiction; and
- no new `expansion-capacity` semantic failure, storage algorithm or CUDA mechanism was introduced.

## Evidence lifecycle and claim limits

Machine evidence is reproducible in ignored `experiments/search-semantics-reference/build/`. Generated evidence is disposable and is not treated as source authority.

The current results prove the semantic-neutral harness, bounded Domain behavior, the Graph NODE/transposition brick and the Graph EDGE/expansion brick described above. Path/occurrence, typed-reference/generation, root-protection, retirement/quiescence/reclamation, ADR-0022 occurrence supersession, later owner oracles, a complete terminal reference engine and integrated proposal acceptance remain unfinished.

No production runtime, native CUDA, CUDA-JS device execution, performance, search-quality, public-SDK, contract-acceptance or multi-GPU-support claim is made here.
