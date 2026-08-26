# CUDA-MCGS search-semantics reference experiment

This disposable CUDA-free experiment is the behavioral reference/conformance capsule planned by [`ENGINE-REFERENCE-01`](../../docs/development/2026-08-25-engine-reference-01-assessment-and-plan.md). The current `REF-HARNESS-01` slice implements only the semantic-neutral harness beneath future owner-local Domain, Graph, Policy, Evaluator, Resource, Progress, Output, Session and Stage oracles.

## Question and owner

Can CUDA-MCGS execute finite declared semantic schedules, isolate owner state, expose only immutable owner-public facts, prove targeted mutation sensitivity and bind reproducible evidence to one exact Search IR/Composer packet without creating a monolithic reference engine or physical scheduler?

The harness owns:

- canonical JSON evidence identity for this experiment;
- strict finite declared-schedule validation;
- one injected transition interface per exact owner, with frozen canonical inputs and deterministic evidence;
- owner-local state isolation and immutable transition inputs;
- explicit event dependencies and reads of already published owner facts;
- immutable namespaced fact publication;
- mutation-detection evidence; and
- case discovery, skip accounting, focused execution and ignored machine evidence.

It owns no search semantics. Owner transition functions are injected. The harness does not choose actions, graph structure, backup, pressure response, progress policy, output meaning, root behavior, attention, CUDA topology or a production execution order.

## Exact inputs and assumptions

The current fixture binds the exact proposal Composer result:

- capsule: `cuda-mcgs-search-ir-composer-reference-v0.2.0`;
- expected/executed/passed: `878/878/878`;
- representation/composition SHA-256: `70aa92baf5ab1fee4bf4b85af4cf1e6d76eca3c51fc11ab4120d62a6f71529d9`;
- canonical bytes: `719393`.

The harness consumes the generated Composer `build/evidence.json` as an evidence manifest. It does not import Composer source or reconstruct its normalization. The Composer capsule must run first. Any missing, failed or identity-mismatched Composer evidence fails closed.

Schedules are finite checked-in data. Event order is meaningful; owner lists and dependency/read sets normalize canonically. A transition receives only a frozen clone of its own state, its explicit input and explicitly declared public facts. It returns a replacement owner state and zero or more immutable facts in its non-overlapping owner namespace. The harness provides no loop, queue, retry, discovery, callback, worker wait or host progression mechanism.

## Run

Use Node.js 26 or newer:

```bash
node scripts/run-search-ir-composer-reference.mjs
node scripts/run-search-semantics-reference.mjs
```

Run one focused case after Composer evidence exists:

```bash
node scripts/run-search-semantics-reference.mjs --case mutation-harness-detects-key-drift
```

Full evidence is written to ignored `build/evidence.json`. Focused evidence uses `build/evidence.<case-id>.json` and cannot support the full-harness claim.

## Current cases

The 22-case harness capsule covers:

- exact live Composer evidence binding;
- object-key/owner-set canonicalization and non-overlapping namespaces;
- repeatable declared-schedule execution;
- explicit public-fact dependency and immutable owner input;
- stable outcomes but distinct identities for two valid independent event orders;
- rejection of evidence-key drift, unknown structural fields, unknown owners, forward dependencies, missing/undeclared fact dependencies, foreign/duplicate fact publication and transition-owner gaps;
- mutation detection, preservation of owner-specific failure codes and rejection of ineffective or undetected mutations; and
- content-sensitive harness evidence identity.

## Files

- `fixtures/neutral-schedules.json` — evidence-bound semantic-neutral schedule fixtures;
- `src/errors.mjs` — harness-local typed validation errors and strict structural checks;
- `src/canonical.mjs` — harness evidence canonicalization, identity and frozen canonical clones;
- `src/schedule.mjs` — declared-schedule normalization and owner-isolated execution;
- `src/mutation.mjs` — independent mutation-sensitivity assertion;
- `run.mjs` — consolidated case capsule and ignored evidence writer;
- `RESULTS.md` — retained bounded result and claim limits.

## Success, promotion and disposal

This slice succeeds when the discovered cases exactly match the checked-in expected case bank, every harness case passes with zero required skips, the exact Composer evidence key is consumed, a focused case can run independently, source-keyed evidence is reproducible and no generated output remains after task cleanup.

Future reference leaves add owner-specific modules and fixtures beside this harness. They may consume normalized public profiles and publish owner facts, but they may not put search meaning into `schedule.mjs`, import another owner's internal state or convert the experiment into a production CPU runtime. Production code must never import this experiment.

The experiment may be promoted only after integrated semantic acceptance establishes a production-independent conformance lifecycle and organizational owner. It is removed or archived if a smaller accepted reference boundary supersedes it. Generated `build/` output is always disposable.

## Claim limits

Passing this slice proves only semantic-neutral harness behavior. It does not prove any owner-specific MCGS behavior, a complete terminal reference engine, proposal acceptance, production JavaScript/Device-JS implementation, CUDA-JS execution, native CUDA, performance, search quality, a public SDK or multi-GPU support.
