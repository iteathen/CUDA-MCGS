# Plans, Focus Branches, Testing, Execution, Cleanup, and Handoffs

**Scope:** Reusable foundation.

## Assessment before plan

A plan sequences a decision-ready boundary. It may not conceal unresolved ownership, identity, lifecycle, resources, compatibility, security, architecture, integration, testing, retention, cleanup, or decomposition.

Substantial and critical work first follows [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md).

## Plan quality

A durable plan states:

- owned outcome and closure evidence;
- product area/component/owners/authority;
- integrated assessment and strongest objection;
- contracts, invariants, ranges, lifecycle, resources, failure, compatibility, security, retention, testing, and cleanup;
- public/dependency/organizational effects;
- focus-branch trigger, parent, integration owner, branch map, dependencies, invalidation, and statuses;
- exact branch/node inputs, outputs, revisions, consumers, acceptance/falsifiers, rollback, cleanup, and integration;
- token/context layers, reserve, checkpoints, and split/handoff triggers;
- authoritative test oracles, coverage map, initial case bank, owning capsules, evidence-key dimensions, invalidation graph, tiers/escalation, expected discovery/skips, shared setup/isolation, failure clustering, consolidation, and test-debt rules;
- experiments before irreversible commitments;
- protected pre-existing state and expected task-created state;
- self-sanity/independent review and PR/merge/post-merge cleanup;
- risks, stop conditions, and handoff.

A branch/node is not ready if execution would need to invent foundational design, shared contracts, oracle, test ownership, evidence identity, branch boundary, or cleanup policy.

## Focus-branch and testing planning

Create focus branches when work exceeds one focused session, spans semantic owners/contracts/paths/artifacts/unknowns, crosses agents/sessions, supports parallelism, or would force sampling/skimming.

Each leaf includes one primary owner/output, exact inputs, full-attention/token fit, write authority, test obligations, output contract, and integration.

For every material owned invariant, plan:

- oracle and sensitivity where required;
- normal/boundary/invalid/lifecycle/failure/resource/concurrency/compatibility/security/cleanup/integration/performance coverage as applicable;
- case-intent capture and consolidation owner;
- canonical fast/owner/integration/deep/forensic capsules;
- expected discovery and skip classes;
- evidence identity and invalidation;
- setup sharing with mutable-state isolation;
- failure-cluster/root-cause repair sequence;
- provisional/duplicate artifact cleanup.

Do not create one Git branch, issue, PR, document, test file, fixture, command, or ledger per example merely because a semantic branch or case exists.

## Implementing a plan

Execution follows [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md), [`TOKEN_DISCIPLINE.md`](TOKEN_DISCIPLINE.md), [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md), [`TESTING.md`](TESTING.md), [`DEBUGGING.md`](DEBUGGING.md), and [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md).

Before mutation, prove current parent/branch/node/input revisions, context reserve, oracle/test capsule/evidence-key readiness, environment trust, rollback, and cleanup.

During each coherent operation:

- state expected effects and cheapest falsifier;
- record new test intents before repair;
- inspect actual effects immediately;
- run focused evidence only;
- cluster failures before editing again;
- revise parent state and invalidate dependent branches/test evidence for material changes;
- checkpoint before switching branches or under context pressure.

A branch cannot be accepted with invalid partial state, stale generated forms, abandoned resources, unresolved contradictions, pending critical test intents, hidden skips, contaminated evidence, test/token/cleanup debt, or false downstream preconditions.

## Test consolidation and repair batches

Capture every material test need immediately but delay permanent structural expansion until the cause and owner are understood.

At the coherent consolidation boundary:

1. group intents by owner/oracle/setup/environment/tier;
2. fold them into parameterized/property/generated capsules;
3. preserve stable case IDs, isolated state, direct selection, and per-case results;
4. share expensive immutable build/device/model/fixture setup safely;
5. run minimal failure cluster, then owning capsule once, then integration smoke once;
6. escalate only on risk/mismatch/stabilization/release trigger;
7. remove/archive provisional scripts, duplicate cases/fixtures, diagnostics, and logs.

Identical evidence keys are reused. Every rerun has an invalidation, contamination, replication, or statistical reason.

## Integration

The integration spine accounts for every branch and test intent and reconciles exact outputs/evidence across terminology, ownership, dependencies, units/ranges/precision/identity/versions/memory spaces, lifecycle/order/publication/failure/recovery/cleanup, contracts/generated forms/persistence/compatibility/security/provenance/resources/performance/search quality, and end-to-end paths.

Local branch acceptance and passing owner capsules do not prove parent completion. Parent completion requires invalidated evidence rerun, contradiction disposition, cross-boundary evidence, cleanup, and one exact final revision/artifact.

## Proportional records

Use one combined assessment/plan and one canonical branch/test map by default. Link authority/evidence rather than copy them.

Specialist records are used only when they own unique continuation/evidence:

- focus branch packet for cross-session/parallel/high-consequence branches;
- token budget for material telemetry/context constraints;
- test batch for multiple intents/capsules/failure clusters/expensive setup/completeness accounting;
- execution record for coordinated/high-consequence operations;
- cleanup record for material lifecycle evidence;
- sanity/PR review records when claims require persistence.

Routine tests and local repair cycles remain in the parent task/PR. Do not create duplicate branch/test/validation/execution/status ledgers.

## Handoffs

A continuation-ready handoff includes:

- parent objective/plan/branch map/active branch/integration owner;
- authority, exact revisions, context packet, token band/reserve;
- branch scope/write authority/output contract;
- operations and expected-versus-actual effects;
- accepted outputs/revisions, contradictions, invalidations, and downstream effects;
- test claims/oracles/evidence keys/coverage/case bank/capsules/tiers/discovery-skips;
- failure clusters, first divergence, hypotheses, repair cycles, changed-hypothesis retries, and evidence reused;
- intents consolidated/superseded/blocked/out of scope and remaining test debt;
- checks run/not run and claim limits;
- provisional tests/fixtures/logs/diagnostics and cleanup;
- Git/GitHub/process/device/credential/artifact/external-resource state;
- rollback/recovery/irreversible state;
- reviewed/integrated SHAs and issue/dependent effects;
- one next executable, testing, analytical, integration, cleanup, or context-restoration boundary.

Do not imply a local pass is integration, an identical rerun is new evidence, unperformed work is running, or an API/merge/cleanup command proves final state.

For artifact names, use a short project acronym so unique identifiers remain visible on mobile. Include checksums when appropriate.
