# Validation Policy

**Scope:** Evidence required before a UMCGS engineering decision, change, test result, focus-branch result, plan-node acceptance, cleanup claim, review claim, or integration may be considered complete.

## Principle

Validation must observe the authority, engineering contract, mechanism, subject, test oracle, branch output, integration, and final state being claimed. Compilation, a plausible result, a large test count, green CI, a locally accepted branch, a cleanup command, PR approval, or merge response is not proof for an unobserved boundary.

Specifications, hard gates, value ordering, tests, oracles, skip policy, protections, focus-branch constraints, token-practice floors/reserves, cleanup safeguards, and gates are never weakened merely to make work pass, look complete, look fast, conserve tokens, or merge.

## 1. Organization and documentation

Every durable repository change runs:

```bash
./scripts/verify-docs.sh
```

This verifies required authority, status markers, links, JSON-compatible records, issue forms, project topology, manifests, and governance presence.

## 2. Assessment and planning

Substantial and critical work verifies that:

- outcome, authority, evidence, scope, assumptions, cost of no change, engineering-decision consequences, test consequences, token posture, and cleanup were assessed before implementation;
- strong opposing explanations/designs were considered;
- valid criticism changed design, value ordering, branch map, test strategy, sequencing, validation, cleanup, or disposition;
- unknowns have evidence, falsifiers, experiments, accepted risks, blockers, decision debt, test debt, token debt, cleanup debt, or revisit triggers;
- the plan defines owner boundaries, dependencies, exact outputs/consumers, path selection, testing, token backpressure/stop conditions, rollback, cleanup, and handoff;
- records are proportional and link authority rather than duplicate it.

## 3. Engineering judgment and specification alignment

A material decision verifies that:

- the owned outcome, consumer, engineering contract, operating envelope, non-goals, and completion evidence are explicit;
- every material specification obligation is normalized and mapped to source/clause, role, owner, mechanism, failure consequence, and evidence/test capsule;
- implementation, tests, comments, plans, and previous agent output were not treated as automatic specification authority;
- ambiguity, conflict, gap, stale authority, unimplementable obligation, and oracle mismatch are explicitly dispositioned rather than silently resolved;
- hard gates, mission objectives, supporting qualities, and process costs are distinguished;
- material values are translated into thresholds, prohibited states, optimization directions, or explicit ordinal rules;
- credible paths were compared and gate-failing/Pareto-dominated paths were eliminated for stated reasons;
- weighted scoring, when used, occurs only after gates and uses real comparable metrics;
- consequence/uncertainty, false-tradeoff separation, reversibility, total-system cost, rejected alternatives, accepted tradeoffs, priority, confidence, rollback, and revisit triggers are explicit;
- implementation, tests, integration, cleanup, and handoff remain traceable;
- no material decision debt remains.

Use `engineering-decision.template.yaml` only when the decision has a real durable consumer.

## 4. Focus-branch decomposition and integration

For large or complex work verify:

- one canonical parent/integration spine owns outcome, authority, engineering contract, invariants, value ordering, branch/test maps, invalidation, contradictions, token posture, cleanup, and closure;
- every leaf fits full attention including testing/validation/cleanup/handoff reserve;
- each leaf has exact owner/output/inputs/scope/write authority/acceptance/falsifier/testing/rollback/cleanup/integration;
- shared-contract, decision, value-order, oracle, or evidence-key changes invalidate dependents;
- parallel work has non-overlapping write/test ownership, compatible versions, acyclic dependencies, independent rollback/cleanup, and one integration owner;
- `accepted` is distinct from `integrated`;
- all branches are dispositioned and final evidence belongs to one exact revision.

## 5. Universal token backpressure and context discipline

Every task verifies proportionally that:

- token backpressure was applied from orientation rather than only near context exhaustion;
- the task had at least an implicit posture: exact outcome, smallest coherent useful scope, minimum practice floor, decisive verification, reserve, and pressure triggers;
- the risk-appropriate practice floor remained intact;
- token pressure reduced duplication, repeated evidence, fragmentation, cold context, optional polish/breadth, or scope before it reduced rigor;
- the claim was narrowed when evidence or test tier was reduced;
- unchanged reads/retries/reassurance runs were avoided or justified by new evidence;
- a second repair cycle without stronger first-divergence evidence caused replan rather than broad repetition;
- context was layered and large artifacts remained external by exact identity;
- enough reserve remained for actual-effect inspection, testing, validation, integration, cleanup, review, recovery, and handoff;
- yellow/red/emergency actions followed the doctrine;
- meaningful overrun triggered an explicit extend, narrow, split, handoff, or pause decision;
- no path continued merely because of sunk token cost;
- checkpoints preserved budget/scope/claim changes and exact state;
- no material token debt remains.

### Universal minimum practice floor

For every task, validation confirms the presence of:

- actual request/constraints and current authority;
- relevant current-state inspection;
- coherent owned scope;
- expected result and decisive verification;
- operation within authority;
- actual-effect inspection;
- relevant testing/evidence;
- cleanup/reconciliation;
- truthful checks not run, claim limits, and remaining risk.

Substantial and critical work also preserves all objectively triggered specification, dependency/integration, failure/resource, rollback/recovery, safety/security, testing, review, and guarded-integration practices.

### Backpressure reduction order

When pressure occurred, evidence should show this order was respected:

1. remove duplication;
2. reuse authority/evidence;
3. batch coherent work/tests;
4. narrow context/output;
5. defer optional polish/breadth;
6. reduce scope/claim;
7. split/rebranch/handoff;
8. pause on a blocker.

A soft budget estimate is not authority to skip required practice. A budget extension is valid when essential evidence or cleanup has high marginal value and the reserve is restored through replanning.

Routine work needs no durable token record; requiring one without a consumer is itself a validation defect.

## 6. Testing and repair-loop evidence

A material testing claim verifies all applicable items below.

### Accuracy and oracle

- Each claim has an authoritative oracle aligned with the engineering contract.
- The oracle is independent where practical and does not duplicate implementation logic.
- Critical tests demonstrate sensitivity to plausible defects when consequence warrants it.
- Exact subject, test, binary/generated/package/model/schema, environment, configuration, fixture/dataset, seed/schedule, resource profile, command, and tier identity are proven.
- Test/runtime state is uncontaminated or contamination is recorded and invalidated.

### Discovery and skip accounting

- Expected, discovered, executed, passed, failed, required-skipped, conditional-skipped, optional-skipped, and not-discovered counts are explicit.
- Zero discovery of required tests fails.
- Required skips fail.
- Conditional skips name the absent capability/condition.
- Optional/informational tests do not support stronger acceptance claims.

### Completeness

Coverage is mapped from owned invariants/contracts and applicable risks, including normal/boundary/invalid behavior, lifecycle/cancellation/retry/cleanup, partial failure/recovery/persistence, finite-resource pressure, concurrency/publication/stale state, compatibility/migration, security/provenance, end-to-end integration, and representative performance/search-quality degradation.

Equivalence partitions, boundaries, pairwise/risk-driven combinations, properties, metamorphic relations, deterministic samples, and synthetic domains may compress coverage. Sampling is disclosed and cannot support a full claim.

### Test-intent banking and capsule consolidation

- Material test intents are recorded when discovered.
- Provisional reproducers remain temporary unless they are the durable owner.
- Related intents are consolidated into canonical capsules before acceptance.
- Capsules share immutable setup safely while preserving stable case IDs, independent inputs/expected results, isolated mutable state, direct selection, and per-case results.
- Consolidation does not hide failures or stop after the first unrelated assertion.
- Pending intents are dispositioned.
- Provisional scripts, duplicate tests/fixtures, diagnostics, and logs are removed, archived, or retained intentionally.

### Tier selection, reuse, and repair

- Focused fast evidence is the inner loop.
- Owner capsules run after coherent repair batches; integration smoke follows local acceptance; deep/forensic tiers require objective triggers.
- Identical evidence is reused rather than rerun for reassurance.
- Every repeat has invalidation, contamination/incompleteness, independent-replication, or statistical reason.
- Failed commands/tests retry only after a changed hypothesis/input/revision/environment/configuration/transport.
- Failures are clustered by first divergence/owner/signature; primary causes are separated from cascades.
- The authoritative owner is repaired coherently; minimal cluster reruns first, then owner capsule once, then required integration smoke once.
- Raw logs remain artifacts and active evidence is bounded.

Token backpressure may eliminate duplicate tests, setup, and unnecessary tiers. It may not remove required oracles, discovery/skip accounting, evidence identity, owner capsules, or integration evidence for the claim.

### Test debt

Material pending intents, provisional-only regressions, missing evidence identity, hidden skips, duplicated oracle authority, contaminated state, or unowned test artifacts block acceptance unless explicitly contained and authorized.

## 7. Governed plan execution

A material node/branch verifies:

- exact parent plan/version, decision version, branch/node, owner, environment, and frozen revision;
- dependency outputs/revisions and readiness;
- authority, gates, selected path/value order, practice floor/reserve, contracts, test oracles/capsules/evidence keys, generated inputs, and runtime trust;
- expected effects/outputs/acceptance/falsifier/testing/rollback/cleanup/integration/escalation before mutation;
- coherent owner-sized operations with immediate actual-effect inspection;
- new obligations/decision changes/test intents and invalidation recorded;
- focused falsification and affected boundary/path/lifecycle/design/value/testing/cleanup reconciliation before continuation;
- material deviations revise parent state and invalidate dependents;
- no invalid partial state, stale output, decision/test/token debt, abandoned resource, unowned residue, or false downstream precondition remains.

## 8. Cleanup and artifact disposition

Verify protected state remains intact, every material local/remote/generated/decision/test/diagnostic/sensitive/external item has an intentional disposition, destructive actions use exact safeguards, remote/asynchronous state is read back, retained state has owners/triggers, and cleanup debt does not hide unsafe or incomplete work. Token pressure cannot justify skipping cleanup or retained-state reporting.

## 9. Sanity checking and independent review

A sanity/audit claim verifies exact target and claim type, complete semantic coverage, full-attention review leaves, risk-justified depth, triggered modules, specification/decision/boundary/end-to-end reconciliation, test evidence/invalidation, token-practice-floor adherence, findings, cleanup, checks not run, and claim limits. Reduced evidence narrows the claim.

## 10. Pull-request review and guarded merge

A material PR verifies:

- exact PR/base/head/comparison and review mode;
- complete changed/generated/dependency/workflow/package/decision/test/token/cleanup surface;
- agreement with authority, obligation map, gates, value order, selected path, priority, parent/branch map, execution, test evidence, token backpressure/practice floor, cleanup, and closure;
- rejected-path rationale, tradeoffs, evidence keys, discovery/skip counts, failure clusters, intents consolidated, tiers, evidence reuse, and remaining debt;
- current-head checks capable of falsifying the claim;
- discussion/blockers/invalidated evidence and decision/test/token/cleanup debt;
- review invalidation after relevant head/base/parent/specification/decision/oracle/test/artifact/environment/fixture changes.

The merge transaction revalidates exact head, target, mergeability, protections/checks/reviews, discussion, issue closure, branch/worktree/dependent state, debts, and conflicts. Post-merge verification proves target SHA/tree, parent/branch/test state, issue/dependent effects, and cleanup.

## 11. Design and component boundaries

Components/contracts verify engineering contract, purpose/bounds, singular ownership, LEGO ports/adapters, justified SOLID/CUPID internals, domain-appropriate ranges, accurate generality, lifecycle/cleanup, gates/objectives, test ownership, compatibility/evolution, total-system simplicity, token/practice-floor fit, and decisive falsification.

## 12. Schema and generated artifacts

Verify syntax/version negotiation, normalization, invalid/boundary cases, deterministic generation, source/generated correspondence, compatibility, range/alignment/precision/layout, complete cache/evidence identity, and stale-output/test-artifact disposition.

## 13. Component-local and cross-component behavior

Each component owns fast and complete capsules for public contracts, invariants, failure, lifecycle, concurrency, exhaustion, and cleanup. Cross-component suites use public surfaces and verify failure propagation, incompatible versions, resource transfer, cleanup, and exact decision/branch/test integration.

## 14. Reference and conformance

Use deterministic references and synthetic domains to expose transpositions, cycles/history, stochastic behavior, lazy/large/empty actions, evaluator modes, backup/reduction, pressure/exhaustion, reroot/persistence, cancellation/teardown, and cleanup.

## 15. CUDA/device correctness

Use triggered combinations of host-reference parity, publication/race checks, sanitizers, capability probes, lifetime/leak checks, cancellation/teardown/device-loss/IPC/shared-memory/failure injection, and explicit proof of device closure. Group compatible cases by complete evidence identity and isolate mutable search state.

## 16. Performance and search quality

Performance claims require exact identity, representative workload, baseline/target, warmup/synchronization/sample/statistics, raw results, profiler mechanism, resource bounds, semantic/stopping equivalence, and search-quality guardrails. Performance evidence is separate from correctness evidence.

## 17. Publication and release

Before publication/release, inspect final diff/state, run all triggered tiers, update decision/parent/branch/token/test/execution/cleanup authority, complete exact-head review/guarded merge, verify remote target/checks/artifacts/packages/issue/branch/dependent state, and record skipped evidence, retained state, debt, and claim limits.

## Current phase

UMCGS has no accepted production implementation or public release. The mandatory current check is `./scripts/verify-docs.sh`, plus task-specific engineering judgment, assessment, focus-branch, token-backpressure, testing, execution, cleanup, sanity, PR-review, merge, or specialist validation.

Project license selection remains deferred for original private pre-release work; third-party implementation reuse and public distribution still require provenance/license compatibility and donor-artifact disposition.
