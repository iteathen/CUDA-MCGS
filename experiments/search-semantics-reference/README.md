# CUDA-MCGS search-semantics reference experiment

This disposable CUDA-free experiment is the behavioral reference/conformance capsule planned by [`ENGINE-REFERENCE-01`](../../docs/development/2026-08-25-engine-reference-01-assessment-and-plan.md). `REF-HARNESS-01` supplies the semantic-neutral harness; `REF-DOMAIN-01` supplies the Domain oracle; `REF-GRAPH-01` now has separate NODE/transposition and EDGE/expansion owner bricks while active-path, root-protection, generation/reclamation, Policy, Evaluator, Resource-policy, Progress, Output, Session, Stage and Channel behavior remain outside those Graph bricks.

## Question and owner

Can CUDA-MCGS execute finite declared semantic schedules and bounded product-neutral owner oracles against one exact normalized Search IR/Composer packet while preserving owner isolation, immutable publication, mutation sensitivity and reproducible evidence without creating a monolithic reference engine or physical scheduler?

The harness owns canonical evidence identity, finite declared-schedule validation, owner-local state isolation, explicit dependency/publication rules, mutation detection and case accounting. It owns no search semantics, physical scheduler, storage mechanism or CUDA topology.

The Domain oracle owns only bounded state/history normalization and equality, roles, action validity/identity/production, transitions, terminal outcomes, root validation, domain path relations and reuse classifications. Its previously integrated 49-case result remains separate historical evidence; this Graph-only proposal change did not rebind or rerun the Domain capsule.

The Graph NODE oracle owns only state-node/transposition claim, collision verification, finite local admission accounting and node/transposition-entry ready/failed publication for `GRAPH-NODE-001` through `GRAPH-NODE-011`. Domain identity and equality are injected through neutral public ports. Required foreign-owner initialization is invoked only through a neutral lifecycle callback that receives Graph claim/reference authority; Graph never receives authority to publish or mutate foreign owner records.

The Graph EDGE oracle owns only parent-local edge/action/child-link and expansion-generation/batch behavior for `GRAPH-EDGE-001` through `GRAPH-EDGE-010`. It consumes NODE through neutral typed-reference and child-resolution callbacks and consumes action identity/equality/multiplicity through neutral injected contracts. It does not import Domain or Policy implementation.

EDGE additionally enforces the finite structure selected by the normalized Graph profile:

- caller-reported action material must fit the normalized `domain-action` owner region;
- opaque producer cursor/status material must fit the normalized expansion record;
- expansion slots are an explicit finite resource contribution;
- aggregate per-engine `edge-capacity` slot resources must cover parent-edge plus expansion layout capacity, allowing either distinct or explicitly shared finite pools;
- expansion exhaustion uses the already declared `edge-capacity` pressure vocabulary rather than inventing a new product-specific failure; and
- published-pending cancellation is terminal and conservative.

## Exact Graph-chain inputs

The current Graph fixtures bind the proposal Composer result qualified during PR #135:

- capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- expected/discovered/executed/passed: `879/879/879/879`;
- framework-selection SHA-256: `48e0c83e6bad0a674efec8b84ac43246d20cb8c2eea82f78170442b2d699dc11`;
- framework-selection canonical bytes: `10422`;
- representation/composition SHA-256: `f4e85941091a820047778679a3ab79573218f700349cc282d6210ba43942e98f`;
- representation/composition canonical bytes: `719510`.

The Composer-owned Graph projection contains four exact normalized profiles:

- SHA-256: `f6abe5bbef4db62c5c79211ac954ece110a2da764cce6b5ce5e854870e9390ba`;
- canonical bytes: `132969`.

The NODE capsule was rebound to that exact Composer/projection pair and passed:

- cases: `13/13`;
- direct `GRAPH-NODE-*` planned/executed coverage: `11/11`;
- evidence SHA-256: `1e284c4f8da41c9afc794b6803e4d4ce13b7c0c74f903c383ca900bdacfee687`;
- canonical bytes: `10123`.

EDGE refuses to run unless those exact Composer, projection and NODE identities are present. Its current qualified result is:

- cases: `16/16`;
- direct `GRAPH-EDGE-*` planned/executed coverage: `10/10`;
- evidence SHA-256: `4a0ad1a80b5b02243ce1e1fd85a881f4127999fc14ca68b701550f7eda0cab40`;
- canonical bytes: `11661`.

The older integrated Domain/harness evidence remains independently reproducible at its own earlier Composer identity. It is intentionally not relabeled as current Graph-chain evidence.

## Run

Use Node.js 26 or newer.

Domain/harness capsule:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-domain-profiles.mjs
node scripts/run-search-semantics-reference.mjs
```

Graph NODE capsule:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-graph-profiles.mjs
node scripts/run-graph-node-reference.mjs
```

Graph EDGE capsule consumes the qualified NODE evidence first:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-graph-profiles.mjs
node scripts/run-graph-node-reference.mjs
node scripts/run-graph-edge-reference.mjs
```

Focused examples:

```bash
node scripts/run-search-semantics-reference.mjs --case mutation-harness-detects-key-drift
node scripts/run-graph-node-reference.mjs --case graph-node-oracle-sensitivity-collision-verification
node scripts/run-graph-edge-reference.mjs --case graph-edge-published-pending-cancel-terminal
```

Generated machine evidence lives under ignored `experiments/search-semantics-reference/build/` and is disposable. Focused evidence cannot support a full-capsule claim.

## Current Graph cases

The Graph NODE capsule has 13 cases covering all 11 direct `GRAPH-NODE-*` requirements, including exact projection binding, collision verification, competing claimers, owner initialization ordering, failed initialization, compound admission, transposition exhaustion, isolated scopes, immutable Domain payload, conflicting ready publication and mutation falsifiers.

The Graph EDGE capsule has 16 cases covering all 10 direct `GRAPH-EDGE-*` requirements:

- exact Graph-profile and qualified NODE-evidence binding;
- distinct parent-local incoming edges to one shared child;
- explicit action-before-child publication ordering and pending-child completion;
- complete batch publication with opaque producer state;
- normalized owner-region and expansion-record byte bounds;
- injected unique/repeatable multiplicity;
- conservative failure/cancellation, including a batch-published `child-pending` edge;
- finite later-batch admission until typed pressure;
- explicit finite expansion-slot admission and exhaustion;
- one expansion-generation claimer and terminal generation outcomes;
- structural-ready independence from foreign Policy/Evaluator/Output/extension records; and
- parent-identity, true early-child-consumption and partial-batch mutation falsifiers.

The Graph normalizer also rejects a materialized profile whose aggregate per-engine slot resources using `edge-capacity` cannot cover both parent-edge and expansion layout capacities. The arbitrary-width Graph test scales the corresponding resource budget with the enlarged layouts, preserving the no-accidental-limit contract.

## Files

Shared/Domain:

- `fixtures/neutral-schedules.json` and `fixtures/domain-cases.json` — harness/Domain fixtures;
- `src/errors.mjs`, `src/canonical.mjs`, `src/schedule.mjs`, `src/mutation.mjs` — neutral harness support;
- `src/domain.mjs`, `src/domain-instances.mjs`, `src/domain-cases.mjs` — Domain-owned oracle/cases;
- `run.mjs` — harness/Domain capsule.

Graph projection/NODE:

- `../search-ir-composer-reference/src/graph.mjs` and `src/graph-fixtures.mjs` — normalized Graph-profile semantics and fixtures;
- `../search-ir-composer-reference/export-graph-profiles.mjs` — Composer-owned normalized Graph-profile projection bridge;
- `fixtures/graph-node-cases.json`, `src/graph-node.mjs`, `src/graph-node-cases.mjs`, `run-graph-node.mjs` — NODE/transposition reference;
- `../../scripts/export-search-ir-composer-graph-profiles.mjs` and `../../scripts/run-graph-node-reference.mjs` — repository entrypoints.

Graph EDGE:

- `fixtures/graph-edge-cases.json` — exact Composer/Graph/NODE binding and checked-in 16-case bank;
- `src/graph-edge-core.mjs` — EDGE/expansion semantic core;
- `src/graph-edge.mjs` — mutation adapter only;
- `src/graph-edge-cases.mjs` and `src/graph-edge-lifecycle-cases.mjs` — EDGE cases, lifecycle coverage and falsifiers;
- `run-graph-edge.mjs` and `../../scripts/run-graph-edge-reference.mjs` — EDGE evidence runner/entrypoint;
- `RESULTS.md` — retained bounded identities and claim limits.

## Success, promotion and disposal

NODE is qualified at 13/13 with 11/11 direct coverage. The EDGE brick is qualified at 16/16 with 10/10 direct coverage and remains guarded until final exact-head repository CI and protected-main readback complete.

Future Graph leaves add active-path/occurrence/cycle, typed-reference/generation, root-protection and retirement/quiescence/reclamation behavior beside these modules, followed by ADR-0022 occurrence supersession and final Graph reconciliation. They may consume normalized public profiles and owner facts, but they may not put search meaning into the neutral harness, import another owner's internal state or convert the experiment into a production CPU runtime. Production code must never import this experiment.

## Claim limits

Passing the current Graph capsules proves only the integrated Graph NODE/transposition brick and the qualified Graph EDGE/expansion brick against the exact proposal identities above. It does not prove active paths/cycles, reference-generation safety, root protection, reclamation, the remaining Graph contract, a complete terminal reference engine, proposal acceptance, production JavaScript/Device-JS implementation, CUDA-JS execution, native CUDA, performance, search quality, a public SDK or multi-GPU support.
