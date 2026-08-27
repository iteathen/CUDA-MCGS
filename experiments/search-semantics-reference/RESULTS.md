# CUDA-MCGS search-semantics reference results

**Status:** Informational

**Updated:** 2026-08-26

## Harness + Domain

The combined `REF-HARNESS-01` plus `REF-DOMAIN-01` capsule remains qualified:

- expected/discovered/executed/passed: `49/49/49/49`;
- failed: `0`;
- required/conditional/optional skipped: `0/0/0`;
- not discovered/not executed by selection: `0/0`.

The exact consumed representation/composition evidence is:

- SHA-256: `4846fe8686721afd13dfe4ac66ebbfdb0722979481183e76b96bf9118f340b3f`;
- canonical bytes: `719510`;
- Composer cases: `879/879` passed.

The Composer-owned normalized Domain-profile projection is:

- profiles: `3`;
- SHA-256: `6c073d11c688bc64b7bf4233c93de56ce29a95706f8a1ac665c8a04d939f13ee`;
- canonical bytes: `69524`.

The Domain mapping derives 47 direct SPEC-0007 requirements from the normative source and exact public requirement-coverage classifications. All `47/47` have at least one checked-in case and all `47/47` were exercised by the full capsule.

The harness/Domain evidence identity remains:

- algorithm: SHA-256 over canonical source-keyed evidence;
- SHA-256: `cf6aafa528af6f4ad6854d16d7c6c046f6ff33a7e9f18d153cb0386a9b4044b8`;
- canonical bytes: `30372`.

The focused `domain-oracle-sensitivity-equality` mutation remains separate focused evidence and is not used for the full-reference claim.

## REF-GRAPH-01 — NODE/transposition brick

The first Graph owner brick is integrated from PR #134 and remains separately qualified:

- capsule: `cuda-mcgs-graph-node-reference-v0.2.0`;
- expected/discovered/executed/passed: `13/13/13/13`;
- failed: `0`;
- not discovered/not executed by selection: `0/0`;
- direct `GRAPH-NODE-*` planned/executed requirement coverage: `11/11`.

The Composer-owned normalized Graph-profile projection is:

- profiles: `4`;
- SHA-256: `22a7fd46605dee3a202fe42aba800fa92fc0e7d4de1f8b619123c1e7d489053e`;
- canonical bytes: `132436`;
- producer representation/composition key: `4846fe8686721afd13dfe4ac66ebbfdb0722979481183e76b96bf9118f340b3f`.

The owner-isolated Graph NODE evidence identity is:

- SHA-256: `0f2d90a9e61c831c467d94f7cc761fb6a44050c00d40b2e2e71bfebba4a1d767`;
- canonical bytes: `10123`.

The 13 cases prove, within the bounded reference model:

- independent domain-key collision verification before equal-state sharing;
- exactly one initializer among competing equal claimers and terminal convergence to one ready node;
- required owner initialization and payload visibility before node ready, with transposition-entry ready only after node ready;
- failed initialization releases waiters to a terminal failed result and dispositions the failed claim;
- compound admission fails without partial capacity residue;
- typed transposition capacity/probe exhaustion;
- declared isolated scopes do not silently share and cannot materialize a second live claim in the same scope;
- Domain state/history payload is immutable after node ready;
- independently owned records remain outside Graph mutation authority and do not alter Graph node identity;
- conflicting ready publication is fatal; and
- deliberate removal of collision verification or node-before-entry publication ordering is caught by named mutation falsifiers.

Protected `main@f7b9b4d8aa99ed0a618d5299d498b0e5397bbe0d` passed the permanent Graph NODE job plus Ubuntu/Windows Search IR and governance verification.

## REF-GRAPH-01 — EDGE/expansion brick

PR #135 now qualifies the second Graph owner brick for `GRAPH-EDGE-001` through `GRAPH-EDGE-010` against the exact integrated NODE evidence above.

The reviewed hosted qualification on semantic tree `5be0364ff7e83fe66e2918beef5e01c5e456e802` produced:

- capsule: `cuda-mcgs-graph-edge-reference-v0.2.0`;
- expected/discovered/executed/passed: `15/15/15/15`;
- failed: `0`;
- not discovered/not executed by selection: `0/0`;
- direct `GRAPH-EDGE-*` planned/executed requirement coverage: `10/10`;
- exact upstream NODE evidence: `0f2d90a9e61c831c467d94f7cc761fb6a44050c00d40b2e2e71bfebba4a1d767`;
- exact Graph projection: `22a7fd46605dee3a202fe42aba800fa92fc0e7d4de1f8b619123c1e7d489053e`;
- EDGE evidence SHA-256: `6f836cd4f9d6fdc5ab2fc825b23b5cbde9473e475ff0545824408701618d840b`;
- EDGE evidence canonical bytes: `11337`.

The same run (`33044928137`) passed all five permanent jobs: governance verification, Ubuntu Search IR, Windows Search IR, Graph NODE, and Graph EDGE.

The EDGE cases prove, within this bounded owner brick:

- parent-local edge identity remains distinct for independent incoming edges even when both resolve to one shared/transposed child node;
- action publication precedes child-resolution consumption, including a mutation that genuinely invokes child resolution while the edge is still reserved;
- a pending-valid child claim can later become a ready child link without republishing the action;
- expansion batch publication is all-or-nothing over complete visible edge/action records and producer cursor/status data remains opaque to Graph;
- caller-reported action material cannot exceed the normalized `domain-action` owner-region bound, and opaque producer data is canonically bounded by the normalized expansion record;
- unique versus repeatable action multiplicity comes from the injected rule rather than Graph inference;
- expansion generations have one advancing claimer and explicit terminal outcomes;
- unpublished failed/cancelled reservations roll back exactly, while already-published reservations remain accounted and become `published-failed`;
- cancelling an expansion terminalizes a batch-published `child-pending` edge so no consumer is stranded;
- later finite batches remain admissible until a declared finite pressure outcome;
- structural edge readiness does not publish or imply readiness of Policy/Evaluator/Output/extension-owned records; and
- deliberate parent-identity collapse, early child consumption and partial-batch publication are each caught by named mutation falsifiers.

This EDGE brick imports no Domain or Policy implementation. Action identity/equality/multiplicity are injected through neutral contracts; NODE is consumed through typed-reference/child-resolution callbacks. No active-path, root-protection, generation/reclamation, Session authority, storage algorithm or CUDA mechanism is selected here.

## Evidence lifecycle and claim limits

Machine evidence is reproducible in ignored `experiments/search-semantics-reference/build/`. Generated evidence is disposable and is not treated as source authority.

The current results prove only the semantic-neutral harness, bounded Domain behavior, the integrated Graph NODE/transposition brick, and the qualified Graph EDGE/expansion brick described above. Path/occurrence, typed-reference/generation, root-protection, retirement/quiescence/reclamation, ADR-0022 occurrence supersession, later owner oracles, a complete terminal reference engine and integrated proposal acceptance remain unfinished.

No production runtime, native CUDA, CUDA-JS device execution, performance, search-quality, public-SDK, contract-acceptance or multi-GPU-support claim is made here.
