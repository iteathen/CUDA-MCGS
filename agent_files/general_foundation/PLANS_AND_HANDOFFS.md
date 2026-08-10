# Plans, Engineering Decisions, Focus Branches, Testing, Execution, Cleanup, and Handoffs

**Scope:** Reusable foundation.

## Assessment and engineering decision before plan

A plan sequences a decision-ready boundary. It may not conceal unresolved specification meaning, ownership, identity, lifecycle, resources, compatibility, security, architecture, value ordering, path selection, integration, testing, retention, cleanup, or decomposition.

Substantial and critical work first follows [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md) and [`ENGINEERING_JUDGMENT.md`](ENGINEERING_JUDGMENT.md).

Before planning implementation, establish:

- engineering contract and material obligation map;
- hard gates, mission objectives, supporting qualities, and process costs;
- credible candidate paths and gate results;
- selected path, alternatives rejected, confidence, tradeoffs, priority, and revisit triggers;
- specification ambiguity/conflict/gap/oracle-mismatch disposition.

## Plan quality

A durable plan states:

- owned outcome, consumers, cost of no change, and closure evidence;
- product area/component/owners/authority;
- engineering contract, obligation traceability, value ordering, selected path, priority, accepted tradeoffs, and decision debt;
- integrated assessment and strongest objection;
- contracts, invariants, ranges, lifecycle, resources, failure, compatibility, security, retention, testing, and cleanup;
- public/dependency/organizational effects;
- focus-branch trigger, parent, integration owner, branch map, dependencies, invalidation, and statuses;
- exact branch/node inputs, outputs, revisions, consumers, acceptance/falsifiers, rollback, cleanup, and integration;
- token/context layers, reserve, checkpoints, and split/handoff triggers;
- authoritative test oracles, coverage map, case bank, owning capsules, evidence-key dimensions, invalidation graph, tiers/escalation, discovery/skips, setup/isolation, failure clustering, consolidation, and test-debt rules;
- experiments before irreversible commitments;
- protected pre-existing state and expected task-created state;
- self-sanity/independent review and PR/merge/post-merge cleanup;
- risks, stop conditions, and handoff.

A branch/node is not ready if execution would need to invent specification meaning, hard gates, value order, selected architecture, test oracle/ownership, evidence identity, branch boundary, or cleanup policy.

## Engineering-decision and priority planning

For material alternatives, plan the decision before the implementation:

1. normalize specification obligations;
2. identify hard gates and eliminate failures;
3. translate abstract values into thresholds/objectives/ordinal rules;
4. compare credible no-change/minimal/proposed/different/experiment/staged/fallback paths;
5. challenge false tradeoffs and Pareto dominance;
6. obtain decisive evidence for architecture-changing uncertainty;
7. select the lowest complete valid path and record why alternatives lost;
8. assign P0–P4 priority from dependency, consequence, information value, cost of delay, reversibility, and effort;
9. map obligations/decisions to operations and tests;
10. define invalidation and revisit triggers.

Routine obvious choices remain in the parent plan. Use `engineering-decision.template.yaml` only when unique durable decision state has a real consumer.

## Focus-branch and testing planning

Create focus branches when work exceeds one focused session, spans semantic owners/contracts/paths/artifacts/unknowns, crosses agents/sessions, supports parallelism, or would force sampling/skimming.

Each leaf includes one primary owner/output, exact inputs, engineering-decision obligations, full-attention/token fit, write authority, test obligations, output contract, and integration.

For every material invariant/obligation, plan the oracle, applicable risk coverage, case-intent capture/consolidation, canonical capsules, expected discovery/skips, evidence identity/invalidation, setup sharing/isolation, repair sequence, and provisional-artifact cleanup.

Do not create one Git branch, issue, PR, decision record, test file, fixture, command, or ledger per example merely because a semantic branch, candidate, or case exists.

## Implementing a plan

Execution follows [`ENGINEERING_JUDGMENT.md`](ENGINEERING_JUDGMENT.md), [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md), [`TOKEN_DISCIPLINE.md`](TOKEN_DISCIPLINE.md), [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md), [`TESTING.md`](TESTING.md), [`DEBUGGING.md`](DEBUGGING.md), and [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md).

Before mutation, prove current specification/engineering-decision/parent/branch/node/input revisions, hard-gate/value-order status, context reserve, oracle/test capsule/evidence-key readiness, environment trust, rollback, and cleanup.

During each coherent operation:

- state obligation/decision, selected path, preserved value order, expected effects, and cheapest falsifier;
- record new specification gaps/decision changes/test intents before repair;
- inspect actual effects immediately;
- run focused evidence only;
- cluster failures before editing again;
- revise parent decision/plan and invalidate dependent branches/test evidence for material changes;
- checkpoint before switching branches or under context pressure.

A branch cannot be accepted with failed gates, invalid partial state, stale generated forms, abandoned resources, unresolved contradictions, pending critical test intents, hidden skips, contaminated evidence, decision/test/token/cleanup debt, or false downstream preconditions.

## Test consolidation and repair batches

Capture every material test need immediately but delay permanent structural expansion until the cause and owner are understood.

At the consolidation boundary, group intents by owner/oracle/setup/environment/tier, fold them into parameterized/property/generated capsules, preserve case identity/isolation/direct selection/results, share safe immutable setup, run minimal cluster → owning capsule once → integration smoke once, escalate only when triggered, and remove/archive provisional or duplicate artifacts.

Identical evidence keys are reused. Every rerun has an invalidation, contamination, replication, or statistical reason.

## Integration

The integration spine accounts for every engineering obligation/decision, candidate disposition, branch, and test intent and reconciles exact outputs/evidence across terminology, ownership, dependencies, units/ranges/precision/identity/versions/memory spaces, lifecycle/order/publication/failure/recovery/cleanup, contracts/generated forms/persistence/compatibility/security/provenance/resources/performance/search quality, value ordering, priority, and end-to-end paths.

Local decision/branch acceptance and passing owner capsules do not prove parent completion. Parent completion requires invalidated evidence rerun, contradiction disposition, cross-boundary evidence, cleanup, and one exact final revision/artifact.

## Proportional records

Use one combined assessment/plan and one canonical engineering-decision/branch/test map by default. Link authority/evidence rather than copy them.

Specialist records are used only when they own unique continuation/evidence:

- engineering decision for foundational/contested/high-consequence/cross-session path or value choices;
- focus branch packet for cross-session/parallel/high-consequence branches;
- token budget for material telemetry/context constraints;
- test batch for multiple intents/capsules/failure clusters/expensive setup/completeness accounting;
- execution record for coordinated/high-consequence operations;
- cleanup record for material lifecycle evidence;
- sanity/PR review records when claims require persistence.

Routine judgment, tests, and local repair cycles remain in the parent task/PR. Do not create duplicate decision/branch/test/validation/execution/status ledgers.

## Handoffs

A continuation-ready handoff includes:

- engineering contract, obligation map, hard gates, value ordering, candidate paths, selected path, rejected-path rationale, priority, tradeoffs, confidence, and revisit triggers;
- parent objective/plan/branch map/active branch/integration owner;
- authority, exact revisions, context packet, token band/reserve;
- branch scope/write authority/output contract;
- operations and expected-versus-actual effects;
- accepted outputs/revisions, contradictions, invalidations, and downstream effects;
- test claims/oracles/evidence keys/coverage/case bank/capsules/tiers/discovery-skips;
- failure clusters, first divergence, hypotheses, repair cycles, changed-hypothesis retries, and evidence reused;
- intents consolidated/superseded/blocked/out of scope and remaining decision/test/token debt;
- checks run/not run and claim limits;
- provisional decisions/tests/fixtures/logs/diagnostics and cleanup;
- Git/GitHub/process/device/credential/artifact/external-resource state;
- rollback/recovery/irreversible state;
- reviewed/integrated SHAs and issue/dependent effects;
- one next engineering-decision, executable, testing, analytical, integration, cleanup, or context-restoration boundary.

Do not imply a local decision/pass is integrated authority, an identical rerun is new evidence, unperformed work is running, or an API/merge/cleanup command proves final state.

For artifact names, use a short project acronym so unique identifiers remain visible on mobile. Include checksums when appropriate.
