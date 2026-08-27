# CUDA-MCGS search-semantics reference experiment

This disposable CUDA-free experiment is the behavioral reference/conformance capsule planned by [`ENGINE-REFERENCE-01`](../../docs/development/2026-08-25-engine-reference-01-assessment-and-plan.md). `REF-HARNESS-01` supplies the semantic-neutral harness; `REF-DOMAIN-01` supplies the Domain oracle; `REF-GRAPH-01` now has separate NODE/transposition, EDGE/expansion, and REF/reference-protection owner bricks. Active-path/cycle, root-authority integration, quiescence/reclamation, Policy, Evaluator, Resource-policy, Progress, Output, Session, Stage and Channel behavioral bricks remain outside those completed Graph slices.

## Question and owner

Can CUDA-MCGS execute finite declared semantic schedules and bounded product-neutral owner oracles against one exact normalized Search IR/Composer packet while preserving owner isolation, immutable publication, mutation sensitivity and reproducible evidence without creating a monolithic reference engine or physical scheduler?

The harness owns canonical evidence identity, finite declared-schedule validation, owner-local state isolation, explicit dependency/publication rules, mutation detection and case accounting. It owns no search semantics, physical scheduler, storage mechanism or CUDA topology.

The Domain oracle owns only bounded state/history normalization and equality, roles, action validity/identity/production, transitions, terminal outcomes, root validation, domain path relations and reuse classifications. Its shared fixtures and every checked-in neutral schedule are rebound to the same current Composer representation identity as Graph. The full harness/Domain capsule passes 49/49 with 47/47 direct Domain requirement coverage.

The Graph NODE oracle owns only state-node/transposition claim, collision verification, finite local admission accounting and node/transposition-entry ready/failed publication for `GRAPH-NODE-001` through `GRAPH-NODE-011`. Domain identity and equality are injected through neutral public ports. Required foreign-owner initialization is invoked only through a neutral lifecycle callback that receives Graph claim/reference authority; Graph never receives authority to publish or mutate foreign owner records.

The Graph EDGE oracle owns only parent-local edge/action/child-link and expansion-generation/batch behavior for `GRAPH-EDGE-001` through `GRAPH-EDGE-010`. It consumes NODE through neutral typed-reference and child-resolution callbacks and consumes action identity/equality/multiplicity through neutral injected contracts. It does not import Domain or Policy implementation.

EDGE additionally enforces the finite structure selected by the normalized Graph profile:

- caller-reported action material must fit the normalized `domain-action` owner region;
- opaque producer cursor/status material must fit the normalized expansion record;
- expansion slots are an explicit finite resource contribution;
- aggregate per-engine `edge-capacity` slot resources must cover parent-edge plus expansion layout capacity, allowing either distinct or explicitly shared finite pools;
- expansion exhaustion uses the already declared `edge-capacity` pressure vocabulary rather than inventing a product-specific failure; and
- published-pending cancellation is terminal and conservative.

The Graph REF oracle owns only `GRAPH-REF-001` through `GRAPH-REF-008`: typed reference validation, arena/incarnation and slot/generation validity, non-wrapping generation advancement, raw-address exclusion from public reference forms, opaque owner-reference lifecycle delegation, finite protection admission, reusable generation-safe protection tokens, and one declared protection-vs-retirement ordering point. It consumes storage state only through an injected metadata resolver and never receives Domain payload or foreign owner bytes.

REF also closes two normalized-profile gaps discovered by author review:

- materialized profiles explicitly contribute finite `protection-record` capacity with typed `protection-capacity` pressure; and
- every opaque owner region explicitly declares `referenceHandling: none | owner-lifecycle(actions...)`. The existing owner lifecycle schema identity remains the mediation boundary; Graph does not inspect or rewrite the private record layout.

## Exact current evidence chain

The current Composer result is:

- capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- expected/discovered/executed/passed: `879/879/879/879`;
- framework-selection SHA-256: `c2fda51cdc63a9e64843e1619bcaa8a148894c2839ee7e4739f7e6d16f3e2d28`;
- framework-selection canonical bytes: `10422`;
- representation/composition SHA-256: `1b3173a128215b6fffc68c68a162708aec7f7bdc93e3e4ac7e26648abec39a24`;
- representation/composition canonical bytes: `719510`.

The shared harness/Domain chain is current against that representation identity:

- Domain projection SHA-256: `278cfce297e1ecb9fc8ea151afb315d6ab67dc745b6beab244c70b5dd5f8508b`;
- Domain projection canonical bytes: `69524`;
- harness/Domain cases: `49/49`;
- direct Domain planned/executed coverage: `47/47`;
- harness/Domain evidence SHA-256: `3cbb62ccf7498eb848793cd488f0f319c1fe0fc65c68d16f11cdc03c7b3e6491`;
- canonical bytes: `30372`.

The Composer-owned Graph projection contains four exact normalized profiles:

- SHA-256: `5e4729d33e917ccdcdc45e942fbe610348cdc448361fa9dd3786da9c55e3d85f`;
- canonical bytes: `134028`.

The NODE capsule is rebound to that exact Composer/projection pair:

- cases: `13/13`;
- direct `GRAPH-NODE-*` planned/executed coverage: `11/11`;
- evidence SHA-256: `cb9c9382fe898421e1730881057f5d75c7c9e1085001d0026562e050bd8ebbbc`;
- canonical bytes: `10123`.

EDGE refuses to run unless those exact Composer, projection and NODE identities are present. Its current qualified result is:

- cases: `16/16`;
- direct `GRAPH-EDGE-*` planned/executed coverage: `10/10`;
- evidence SHA-256: `eb9dd011e91fff0896cb0019571eb97346e5da5c595920fe6101c6fa9aa91879`;
- canonical bytes: `11661`.

REF also refuses mismatched Composer, Graph projection or NODE evidence. Its current qualified result is:

- cases: `14/14`;
- direct `GRAPH-REF-*` planned/executed coverage: `8/8`;
- evidence SHA-256: `2c4fac58ef2a7678b5417579c2d05210910596fd57adf9be30ef2f36d0266456`;
- canonical bytes: `9139`.

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

Graph REF capsule consumes the same exact Composer/projection/NODE chain:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-graph-profiles.mjs
node scripts/run-graph-node-reference.mjs
node scripts/run-graph-ref-reference.mjs
```

Focused examples:

```bash
node scripts/run-search-semantics-reference.mjs --case mutation-harness-detects-key-drift
node scripts/run-graph-node-reference.mjs --case graph-node-oracle-sensitivity-collision-verification
node scripts/run-graph-edge-reference.mjs --case graph-edge-published-pending-cancel-terminal
node scripts/run-graph-ref-reference.mjs --case graph-ref-oracle-sensitivity-generation-check
```

Generated machine evidence lives under ignored `experiments/search-semantics-reference/build/` and is disposable. Focused evidence cannot support a full-capsule claim.

## Current cases

The shared harness/Domain capsule has 49 cases with all 47 direct Domain requirements exercised. The neutral schedule fixtures bind the current representation/composition identity both at the fixture level and inside every declared schedule.

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

The Graph REF capsule has 14 cases covering all eight direct `GRAPH-REF-*` requirements:

- kind, arena/incarnation, slot, generation and lifecycle validation before access;
- explicit side-effect-free `arena-incarnation-mismatch` and stale-generation rejection;
- compatibility with the current NODE reference shape;
- no generation wrap and no accidental 32-bit range limit;
- public raw-address rejection;
- owner-reference lifecycle delegation only when the normalized opaque region explicitly selects the requested action;
- protection-before-retirement and retirement-before-protection schedules;
- finite protection pressure plus released-slot reuse with protection-token generation advancement and stale-token rejection; and
- named generation-check and protect/retire-order mutation falsifiers.

The Graph normalizer also rejects materialized profiles whose declared finite resources do not fund selected expansion/protection storage. Meaning-affecting owner-reference handling participates in normalized profile identity.

## Files

Shared/Domain:

- `fixtures/neutral-schedules.json` and `fixtures/domain-cases.json` — current evidence-bound harness/Domain fixtures;
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
- `run-graph-edge.mjs` and `../../scripts/run-graph-edge-reference.mjs` — EDGE evidence runner/entrypoint.

Graph REF:

- `fixtures/graph-ref-cases.json` — exact Composer/Graph/NODE binding and checked-in 14-case bank;
- `src/graph-ref.mjs` — typed-reference, generation and protection semantic core;
- `src/graph-ref-cases.mjs` — REF cases and falsifiers;
- `run-graph-ref.mjs` and `../../scripts/run-graph-ref-reference.mjs` — REF evidence runner/entrypoint;
- `RESULTS.md` — retained bounded identities and claim limits.

## Success, promotion and disposal

Harness/Domain is current at 49/49 with 47/47 direct coverage. NODE is qualified at 13/13 with 11/11 direct coverage. EDGE is qualified at 16/16 with 10/10 direct coverage. REF is qualified at 14/14 with 8/8 direct coverage. Merge remains guarded until final exact-head repository CI and protected-main readback complete.

Future Graph leaves add active-path/occurrence/cycle, root-authority/protection integration, retirement/quiescence/reclamation and ADR-0022 occurrence-supersession behavior beside these modules. They may consume normalized public profiles and owner facts, but they may not put search meaning into the neutral harness, import another owner's internal state or convert the experiment into a production CPU runtime. Production code must never import this experiment.

## Claim limits

Passing the current capsules proves only the semantic-neutral harness, bounded Domain behavior, Graph NODE/transposition, Graph EDGE/expansion, and Graph REF/reference-protection bricks against the exact proposal identities above. It does not prove active paths/cycles, Search Session root authority, quiescence/reclamation, the remaining Graph contract, a complete terminal reference engine, proposal acceptance, production JavaScript/Device-JS implementation, CUDA-JS execution, native CUDA, performance, search quality, a public SDK or multi-GPU support.
