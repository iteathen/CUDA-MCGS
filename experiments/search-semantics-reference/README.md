# CUDA-MCGS search-semantics reference experiment

This disposable CUDA-free experiment is the behavioral reference/conformance capsule planned by [`ENGINE-REFERENCE-01`](../../docs/development/2026-08-25-engine-reference-01-assessment-and-plan.md). `REF-HARNESS-01` supplies the semantic-neutral harness; `REF-DOMAIN-01` supplies the Domain oracle; `REF-GRAPH-01` now has separate NODE/transposition and EDGE/expansion owner bricks while active-path, root-protection, generation/reclamation, Policy, Evaluator, Resource-policy, Progress, Output, Session, Stage and Channel behavior remain outside those Graph bricks.

## Question and owner

Can CUDA-MCGS execute finite declared semantic schedules and bounded product-neutral owner oracles against one exact normalized Search IR/Composer packet while preserving owner isolation, immutable publication, mutation sensitivity and reproducible evidence without creating a monolithic reference engine or physical scheduler?

The harness owns:

- canonical JSON evidence identity for this experiment;
- strict finite declared-schedule validation;
- one injected transition interface per exact owner, with frozen canonical inputs and deterministic evidence;
- owner-local state isolation and immutable transition inputs;
- explicit event dependencies and reads of already published owner facts;
- immutable namespaced fact publication;
- mutation-detection evidence; and
- case discovery, skip accounting, focused execution and ignored machine evidence.

The harness owns no search semantics. Owner transition functions are injected. It does not choose actions, graph structure, backup, pressure response, progress policy, output meaning, root behavior, attention, CUDA topology or a production execution order.

The Domain oracle owns only bounded state/history normalization and equality, roles, action validity/identity/production, transitions, terminal outcomes, root validation, domain path relations and reuse classifications. Three separately injected synthetic domains exercise deterministic transposition/collision behavior, stochastic carried history and observations, and a no-player lazy continuous action space. The oracle returns immutable semantic values and typed failures; it cannot allocate graph storage, choose policy, run an evaluator, perform resource admission, schedule progress, publish external output or invoke CUDA.

The Graph NODE oracle owns only state-node/transposition claim, collision verification, finite local admission accounting and node/transposition-entry ready/failed publication for `GRAPH-NODE-001` through `GRAPH-NODE-011`. Domain identity and equality are injected through neutral public ports. Required foreign-owner initialization is invoked only through a neutral lifecycle callback that receives Graph claim/reference authority; Graph does not receive authority to publish or mutate foreign owner records.

The Graph EDGE oracle owns only parent-local edge/action/child-link and expansion-generation/batch behavior for `GRAPH-EDGE-001` through `GRAPH-EDGE-010`. It consumes NODE through neutral typed-reference and child-resolution callbacks and consumes action identity/equality/multiplicity through neutral injected contracts. It does not import Domain or Policy implementation. Action material is bounded by the normalized `domain-action` owner region; producer cursor/status material remains opaque and is bounded by the normalized expansion record. Published-pending cancellation is terminal and conservative. Structural edge readiness does not grant authority over any foreign owner record.

## Exact inputs and assumptions

The current fixtures bind the exact proposal Composer result:

- capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- expected/discovered/executed/passed: `879/879/879/879`;
- representation/composition SHA-256: `4846fe8686721afd13dfe4ac66ebbfdb0722979481183e76b96bf9118f340b3f`;
- canonical bytes: `719510`.

The harness consumes generated Composer `build/evidence.json` only as an evidence manifest. The Composer owner exports normalized profiles through owner-local projection bridges; the behavioral reference never copies Composer normalizers.

The Domain projection contains three exact normalized profiles and has SHA-256 `6c073d11c688bc64b7bf4233c93de56ce29a95706f8a1ac665c8a04d939f13ee` over `69524` canonical bytes.

The Graph projection contains four exact normalized profiles and has SHA-256 `22a7fd46605dee3a202fe42aba800fa92fc0e7d4de1f8b619123c1e7d489053e` over `132436` canonical bytes. Both Graph bricks consume that exact projection. EDGE additionally refuses to run unless the integrated NODE evidence identity is exactly `0f2d90a9e61c831c467d94f7cc761fb6a44050c00d40b2e2e71bfebba4a1d767` with 13/13 cases and 11/11 direct NODE requirement execution.

Schedules and reference fixtures are finite checked-in data. The oracles expose semantic behavior only; no reference module chooses a physical table, queue, scheduler, reclamation mechanism, CUDA primitive or production topology.

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

Full Domain/harness evidence is written to ignored `build/evidence.json`; NODE evidence to `build/graph-node-evidence.json`; EDGE evidence to `build/graph-edge-evidence.json`. Focused evidence cannot support a full-capsule claim.

## Current cases

The combined harness/Domain capsule has 49 cases: 22 neutral harness cases plus 27 Domain cases. The Domain mapping proves planned/full execution coverage for all 47 direct SPEC-0007 requirements owned by `ENGINE-REFERENCE-01`.

The separate Graph NODE capsule has 13 cases covering all 11 direct `GRAPH-NODE-*` requirements:

- exact Graph-profile projection binding;
- deliberate identity-key collisions with independent equality verification before sharing;
- competing equal-state claimers under materially different bounded claimant orders, with exactly one initializer and terminal convergence to one ready node;
- required owner initialization and payload visibility before node ready, and node ready before transposition-entry ready;
- initialization failure with waiter release, failed-entry disposition and bounded retry;
- compound node/state-byte/transposition admission with no partial residue on pressure;
- explicit transposition capacity and collision-probe exhaustion;
- isolated-node scope separation without hidden equality or same-scope duplicate materialization;
- immutable Domain state/history payload after ready while independently owned records remain outside Graph mutation authority;
- fatal conflicting ready publication; and
- collision-verification and entry-publication-order mutation falsifiers.

The separate Graph EDGE capsule has 15 cases covering all 10 direct `GRAPH-EDGE-*` requirements:

- exact Graph-profile and qualified NODE-evidence binding;
- distinct parent-local incoming edges to one shared child;
- explicit action-before-child publication ordering and pending-child completion;
- complete batch publication with opaque producer state;
- normalized owner-region and expansion-record byte bounds;
- injected unique/repeatable multiplicity;
- conservative failure/cancellation, including a batch-published `child-pending` edge;
- finite later-batch admission until typed pressure;
- one expansion-generation claimer and terminal generation outcomes;
- structural ready independence from foreign Policy/Evaluator/Output/extension records; and
- parent-identity, true early-child-consumption and partial-batch mutation falsifiers.

The current reviewed EDGE evidence is SHA-256 `6f836cd4f9d6fdc5ab2fc825b23b5cbde9473e475ff0545824408701618d840b` over `11337` canonical bytes. All 15 cases and all 10 direct EDGE requirements were executed in the full capsule.

## Files

Shared/Domain:

- `fixtures/neutral-schedules.json` and `fixtures/domain-cases.json` — evidence-bound harness/Domain fixtures;
- `src/errors.mjs`, `src/canonical.mjs`, `src/schedule.mjs`, `src/mutation.mjs` — neutral harness support;
- `src/domain.mjs`, `src/domain-instances.mjs`, `src/domain-cases.mjs` — Domain-owned oracle/cases;
- `run.mjs` — consolidated harness/Domain capsule.

Graph projection/NODE:

- `../search-ir-composer-reference/export-graph-profiles.mjs` — Composer-owned normalized Graph-profile projection bridge;
- `fixtures/graph-node-cases.json`, `src/graph-node.mjs`, `src/graph-node-cases.mjs`, `run-graph-node.mjs` — NODE/transposition reference;
- `../../scripts/export-search-ir-composer-graph-profiles.mjs` and `../../scripts/run-graph-node-reference.mjs` — repository entrypoints.

Graph EDGE:

- `fixtures/graph-edge-cases.json` — exact Composer/Graph/NODE binding and checked-in 15-case bank;
- `src/graph-edge-core.mjs` — correct EDGE/expansion semantic core;
- `src/graph-edge.mjs` — disposable mutation adapter only;
- `src/graph-edge-cases.mjs` and `src/graph-edge-lifecycle-cases.mjs` — EDGE cases, lifecycle coverage and falsifiers;
- `run-graph-edge.mjs` and `../../scripts/run-graph-edge-reference.mjs` — EDGE evidence runner/entrypoint;
- `RESULTS.md` — retained bounded identities and claim limits.

## Success, promotion and disposal

The harness/Domain slice remains qualified at 49/49 with direct Domain coverage 47/47. NODE is integrated at 13/13 with 11/11 direct coverage. The current EDGE brick is qualified at 15/15 with 10/10 direct coverage and is ready for guarded integration only after exact-head review/CI remain green.

Future Graph leaves add active-path/occurrence/cycle, typed-reference/generation, root-protection and retirement/quiescence/reclamation behavior beside these modules, followed by ADR-0022 occurrence-supersession and final Graph reconciliation. They may consume normalized public profiles and owner facts, but they may not put search meaning into the neutral harness, import another owner's internal state or convert the experiment into a production CPU runtime. Production code must never import this experiment.

The experiment may be promoted only after integrated semantic acceptance establishes a production-independent conformance lifecycle and organizational owner. It is removed or archived if a smaller accepted reference boundary supersedes it. Generated `build/` output is always disposable.

## Claim limits

Passing the current capsules proves only the semantic-neutral harness, bounded Domain-owned reference behavior, the integrated Graph NODE/transposition brick, and the qualified Graph EDGE/expansion brick. It does not prove active paths/cycles, reference-generation safety, root protection, reclamation, the remaining Graph contract, a complete terminal reference engine, proposal acceptance, production JavaScript/Device-JS implementation, CUDA-JS execution, native CUDA, performance, search quality, a public SDK or multi-GPU support.
