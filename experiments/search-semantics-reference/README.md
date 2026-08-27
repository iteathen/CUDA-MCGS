# CUDA-MCGS search-semantics reference experiment

This disposable CUDA-free experiment is the behavioral reference/conformance capsule planned by [`ENGINE-REFERENCE-01`](../../docs/development/2026-08-25-engine-reference-01-assessment-and-plan.md). `REF-HARNESS-01` supplies the semantic-neutral harness; `REF-DOMAIN-01` adds the first owner-local oracle without adding Graph, Policy, Evaluator, Resource, Progress, Output, Session, Stage or Channel behavior.

## Question and owner

Can CUDA-MCGS execute finite declared semantic schedules and a bounded, product-neutral Domain oracle against one exact normalized Search IR/Composer packet while preserving owner isolation, immutable publication, mutation sensitivity and reproducible evidence without creating a monolithic reference engine or physical scheduler?

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

## Exact inputs and assumptions

The current fixture binds the exact proposal Composer result:

- capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- expected/executed/passed: `879/879/878`;
- representation/composition SHA-256: `4846fe8686721afd13dfe4ac66ebbfdb0722979481183e76b96bf9118f340b3f`;
- canonical bytes: `719393`.

The harness consumes the generated Composer `build/evidence.json` as an evidence manifest. The Composer owner then exports the three exact normalized Domain profiles to ignored `build/domain-profiles.json`. That projection has SHA-256 `6c073d11c688bc64b7bf4233c93de56ce29a95706f8a1ac665c8a04d939f13ee` over `69524` canonical bytes. The Domain oracle consumes only this deterministic projection; it neither deep-imports Composer internals nor copies the normalizer. Missing, failed or identity-mismatched Composer/projection evidence fails closed.

Schedules are finite checked-in data. Event order is meaningful; owner lists and dependency/read sets normalize canonically. A transition receives only a frozen clone of its own state, its explicit input and explicitly declared public facts. It returns a replacement owner state and zero or more immutable facts in its non-overlapping owner namespace. The harness provides no loop, queue, retry, discovery, callback, worker wait or host progression mechanism.

## Run

Use Node.js 26 or newer:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/export-search-ir-composer-domain-profiles.mjs
node scripts/run-search-semantics-reference.mjs
```

Run one focused case after Composer evidence exists:

```bash
node scripts/run-search-semantics-reference.mjs --case mutation-harness-detects-key-drift
```

Full evidence is written to ignored `build/evidence.json`. Focused evidence uses `build/evidence.<case-id>.json` and cannot support the full-harness claim.

## Current cases

The combined 49-case capsule retains all 22 neutral harness cases and adds 27 Domain cases. The neutral cases cover:

- exact live Composer evidence binding;
- object-key/owner-set canonicalization and non-overlapping namespaces;
- repeatable declared-schedule execution;
- explicit public-fact dependency and immutable owner input;
- stable outcomes but distinct identities for two valid independent event orders;
- rejection of evidence-key drift, unknown structural fields, unknown owners, forward dependencies, missing/undeclared fact dependencies, foreign/duplicate fact publication and transition-owner gaps;
- mutation detection, preservation of owner-specific failure codes and rejection of ineffective or undetected mutations; and
- content-sensitive harness evidence identity.

The Domain cases cover all 47 SPEC-0007 requirements whose primary disposition and planned evidence owner are `engine-reference-oracle` and `ENGINE-REFERENCE-01`:

- exact normalized-profile projection and atomic pre-admission root validation;
- encoding-independent equality, profile-defined scalar and structured keys, deliberate key collisions, independent collision verification and fatal inconsistency quarantine;
- embedded, carried and absent history, bounded exact exhaustion, transposition/path relations and reuse classification;
- finite paged, sampled, admitted and lazy/continuous actions with scoped cursors, explicit randomness, collision checks, stale rejection and bounded resumption;
- deterministic, sampled-stochastic and observation-bearing transitions with reserved finite outputs, allowed successor roles and no partial publication on capacity or cancellation;
- decision, chance, observation, custom no-player and terminal roles, structured non-ranking outcomes and explicit nonterminal zero-action classification;
- immutable publications, owner-returned reservations, bounded Domain-only profile teardown, product-extension deletion and four targeted oracle-sensitivity mutations.

The checked-in mapping proves planned coverage for all 47 direct Domain requirements. Full execution records all 47 as executed; a focused case records only the requirements actually exercised by that selected case.

## Files

- `fixtures/neutral-schedules.json` — evidence-bound semantic-neutral schedule fixtures;
- `fixtures/domain-cases.json` — exact Composer/projection binding, Domain case bank and product-neutral roots;
- `src/errors.mjs` — harness-local typed validation errors and strict structural checks;
- `src/canonical.mjs` — harness evidence canonicalization, identity and frozen canonical clones;
- `src/schedule.mjs` — declared-schedule normalization and owner-isolated execution;
- `src/mutation.mjs` — independent mutation-sensitivity assertion;
- `src/domain.mjs` — normalized-profile-bound Domain oracle and owned invariants;
- `src/domain-instances.mjs` — three separate injected synthetic Domain definitions;
- `src/domain-cases.mjs` — Domain cases and direct SPEC-0007 mappings;
- `run.mjs` — consolidated case capsule and ignored evidence writer;
- `RESULTS.md` — retained bounded result and claim limits.

## Success, promotion and disposal

This slice succeeds when all 49 discovered cases exactly match the checked-in banks, all pass with zero required skips, the exact Composer and Domain-projection keys are consumed, every one of the 47 direct Domain requirements has planned and full-execution case evidence, a focused mutation can run independently, source-keyed evidence is reproducible and no generated output remains after task cleanup.

Future reference leaves add owner-specific modules and fixtures beside the harness and Domain module. They may consume normalized public profiles and publish owner facts, but they may not put search meaning into `schedule.mjs`, import another owner's internal state or convert the experiment into a production CPU runtime. Production code must never import this experiment.

The experiment may be promoted only after integrated semantic acceptance establishes a production-independent conformance lifecycle and organizational owner. It is removed or archived if a smaller accepted reference boundary supersedes it. Generated `build/` output is always disposable.

## Claim limits

Passing this slice proves only the semantic-neutral harness plus bounded Domain-owned reference behavior for the three declared normalized profiles and direct 47-requirement mapping. It does not prove Graph or later owner behavior, a complete terminal reference engine, proposal acceptance, production JavaScript/Device-JS implementation, CUDA-JS execution, native CUDA, performance, search quality, a public SDK or multi-GPU support.
