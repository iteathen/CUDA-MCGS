# CUDA-MCGS search-semantics reference experiment

This disposable CUDA-free experiment is the behavioral reference/conformance capsule planned by [`ENGINE-REFERENCE-01`](../../docs/development/2026-08-25-engine-reference-01-assessment-and-plan.md). `REF-HARNESS-01` supplies the semantic-neutral harness; `REF-DOMAIN-01` supplies the Domain oracle; the first `REF-GRAPH-01` owner brick adds a separate Graph NODE/transposition publication capsule without adding edge, path, root-protection, reclamation, Policy, Evaluator, Resource-policy, Progress, Output, Session, Stage or Channel behavior.

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

The Graph NODE oracle owns only state-node/transposition claim, collision verification, finite local admission accounting and node/transposition-entry ready/failed publication for `GRAPH-NODE-001` through `GRAPH-NODE-011`. Domain identity and equality are injected through neutral public ports. Required foreign-owner initialization is invoked only through a neutral lifecycle callback that receives Graph claim/reference authority; Graph does not receive authority to publish or mutate foreign owner records. Edge, expansion, active-path, root-protection, retirement, quiescence and reclamation meaning remain outside this brick.

## Exact inputs and assumptions

The current fixtures bind the exact proposal Composer result:

- capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- expected/discovered/executed/passed: `879/879/879/879`;
- representation/composition SHA-256: `4846fe8686721afd13dfe4ac66ebbfdb0722979481183e76b96bf9118f340b3f`;
- canonical bytes: `719510`.

The harness consumes generated Composer `build/evidence.json` only as an evidence manifest. The Composer owner exports normalized profiles through owner-local projection bridges; the behavioral reference never copies Composer normalizers.

The Domain projection contains three exact normalized profiles and has SHA-256 `6c073d11c688bc64b7bf4233c93de56ce29a95706f8a1ac665c8a04d939f13ee` over `69524` canonical bytes.

The Graph projection contains four exact normalized profiles and has SHA-256 `22a7fd46605dee3a202fe42aba800fa92fc0e7d4de1f8b619123c1e7d489053e` over `132436` canonical bytes. Both projections carry the exact Composer representation/composition key and are checked against the Composer-published profile identities. Missing, failed or identity-mismatched Composer/projection evidence fails closed.

Schedules are finite checked-in data. Event order is meaningful; owner lists and dependency/read sets normalize canonically. A transition receives only a frozen clone of its own state, its explicit input and explicitly declared public facts. It returns a replacement owner state and zero or more immutable facts in its non-overlapping owner namespace. The harness provides no loop, queue, retry, discovery, callback, worker wait or host progression mechanism.

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

Run one focused Domain/harness case after Composer evidence exists:

```bash
node scripts/run-search-semantics-reference.mjs --case mutation-harness-detects-key-drift
```

Run one focused Graph NODE case after Graph projection exists:

```bash
node scripts/run-graph-node-reference.mjs --case graph-node-oracle-sensitivity-collision-verification
```

Full Domain/harness evidence is written to ignored `build/evidence.json`. Graph NODE evidence is written to ignored `build/graph-node-evidence.json`. Focused evidence cannot support a full-capsule claim.

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

The checked-in Graph mapping proves planned coverage for `GRAPH-NODE-001` through `GRAPH-NODE-011`, and full execution records all 11 as exercised.

## Files

Shared/Domain:

- `fixtures/neutral-schedules.json` — evidence-bound semantic-neutral schedule fixtures;
- `fixtures/domain-cases.json` — exact Composer/projection binding, Domain case bank and product-neutral roots;
- `src/errors.mjs` — harness-local typed validation errors and strict structural checks;
- `src/canonical.mjs` — harness evidence canonicalization, identity and frozen canonical clones;
- `src/schedule.mjs` — declared-schedule normalization and owner-isolated execution;
- `src/mutation.mjs` — independent mutation-sensitivity assertion;
- `src/domain.mjs` — normalized-profile-bound Domain oracle and owned invariants;
- `src/domain-instances.mjs` — three separate injected synthetic Domain definitions;
- `src/domain-cases.mjs` — Domain cases and direct SPEC-0007 mappings;
- `run.mjs` — consolidated harness/Domain capsule and ignored evidence writer.

Graph NODE:

- `fixtures/graph-node-cases.json` — exact Composer/Graph-projection binding and 13-case bank;
- `src/graph-node.mjs` — Graph-owned NODE/transposition oracle;
- `src/graph-node-cases.mjs` — NODE cases, owner-boundary falsifiers and direct requirement mappings;
- `run-graph-node.mjs` — separate NODE capsule and ignored evidence writer;
- `../search-ir-composer-reference/export-graph-profiles.mjs` — Composer-owned normalized Graph-profile projection bridge;
- `../../scripts/export-search-ir-composer-graph-profiles.mjs` and `../../scripts/run-graph-node-reference.mjs` — repository entrypoints;
- `RESULTS.md` — retained bounded results and claim limits.

## Success, promotion and disposal

The harness/Domain slice remains qualified at 49/49 with direct Domain coverage 47/47. The Graph NODE brick succeeds when all 13 checked-in cases pass, all 11 direct `GRAPH-NODE-*` requirements have planned and full-execution case evidence, the exact Composer and Graph-projection keys are consumed, both decisive mutation falsifiers fail when their invariants are removed, and Graph never acquires another owner's record-mutation authority.

Future Graph leaves add edge/expansion, path/occurrence, typed-reference/generation, root-protection and retirement/quiescence/reclamation behavior beside this NODE module. They may consume normalized public profiles and owner facts, but they may not put search meaning into the neutral harness, import another owner's internal state or convert the experiment into a production CPU runtime. Production code must never import this experiment.

The experiment may be promoted only after integrated semantic acceptance establishes a production-independent conformance lifecycle and organizational owner. It is removed or archived if a smaller accepted reference boundary supersedes it. Generated `build/` output is always disposable.

## Claim limits

Passing the current capsules proves only the semantic-neutral harness, bounded Domain-owned reference behavior and the bounded Graph NODE/transposition publication brick described above. It does not prove the remaining Graph semantics, a complete terminal reference engine, proposal acceptance, production JavaScript/Device-JS implementation, CUDA-JS execution, native CUDA, performance, search quality, a public SDK or multi-GPU support.
