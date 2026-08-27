# Validation Policy

**Scope:** Evidence required before a CUDA-MCGS engineering decision, change, test result, focus-branch result, plan-node acceptance, cleanup claim, review claim, or integration may be considered complete.

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
- the plan defines owner boundaries, dependencies, exact outputs/consumers, path selection, testing, backpressure/stop conditions, rollback, cleanup, and handoff;
- records are proportional and link authority rather than duplicate it.

## 3. Engineering judgment and specification alignment

A material decision verifies that:

- the owned outcome, consumer, engineering contract, operating envelope, non-goals, and completion evidence are explicit;
- every material specification obligation is normalized and mapped to source/clause, role, owner, mechanism, failure consequence, and evidence/test capsule;
- implementation, tests, comments, plans, and previous agent output were not treated as automatic specification authority;
- ambiguity, conflict, gap, stale authority, unimplementable obligation, and oracle mismatch are explicitly dispositioned rather than silently resolved;
- hard gates, mission objectives, supporting qualities, and process costs are distinguished;
- abstract values such as safety, correctness, accuracy, speed, reliability, memory, compatibility, simplicity, and delivery are translated into thresholds, prohibited states, optimization directions, or explicit ordinal rules;
- candidate paths include credible no-change/minimal/proposed/materially different/experiment/staged/fallback options where material;
- gate-failing and Pareto-dominated paths are eliminated for stated reasons;
- weighted scoring, when used, occurs only after gates and uses real comparable metrics;
- consequence analysis includes severity, likelihood, exposure, blast radius, reversibility, detectability, uncertainty, cost of delay, dependency impact, and recovery cost where material;
- false-tradeoff separation options were considered before accepting a sacrifice;
- the selected path follows the accepted design cascade and total-system analysis;
- priority follows P0 containment, P1 gate/foundation, P2 information/risk/dependency unlock, P3 mission value/measured efficiency, or P4 supporting quality/polish;
- rejected alternatives, accepted tradeoffs, confidence, rollback, and revisit triggers are explicit;
- implementation, tests, integration, cleanup, and handoff remain traceable to the decision;
- no material decision debt remains.

Use `engineering-decision.template.yaml` only when the decision is foundational, contested, cross-component, high-consequence, empirically uncertain, difficult to reverse, or cross-session.

## 4. Focus-branch decomposition and integration

For large or complex work verify:

- one canonical parent and integration spine own outcome, authority, engineering contract, invariants, value ordering, branch map, test map, token posture, invalidation, contradictions, cleanup, and closure;
- decomposition is semantic and every leaf fits full attention including testing/validation/cleanup/handoff reserve;
- each leaf has stable ID, one primary owner/output, exact inputs, scope/write authority, output contract, decision/test obligations, acceptance/falsifier, rollback, cleanup, and integration;
- shared-contract, engineering-decision, value-order, oracle, or evidence-key changes are versioned and invalidate dependent branches/evidence;
- parallel work has non-overlapping write/test ownership, compatible parent versions, acyclic dependencies, independent rollback/cleanup, and one integration owner;
- `accepted` is distinct from `integrated`;
- all branches are dispositioned and final cross-branch/end-to-end evidence belongs to one exact revision.

Use `focus-branch.template.yaml` only when durable cross-session/parallel/high-consequence state is needed.

## 5. Universal token backpressure and context discipline

Every task verifies proportionally that:

- token backpressure was applied from orientation rather than only near context exhaustion;
- the task had at least an implicit posture: exact outcome, smallest coherent useful scope, minimum practice floor, decisive verification, reserve, and pressure triggers;
- the risk-appropriate practice floor remained intact;
- token pressure reduced duplication, repeated evidence, fragmentation, cold context, optional polish/breadth, or scope before it reduced rigor;
- reduced evidence, sampling, or a lower test tier narrowed the claim;
- unchanged reads/retries/reassurance runs were avoided or justified by new evidence;
- a second repair cycle without stronger first-divergence evidence or a changed root-cause hypothesis caused replan rather than broad repetition;
- current authority, engineering decision, exact revisions, and evidence identities remained in the active packet;
- context was layered and large artifacts remained external by exact identity;
- enough reserve remained for testing, validation, integration, cleanup, review, recovery, and handoff;
- yellow/red/emergency actions did not reduce rigor;
- meaningful overrun triggered an explicit extend, narrow, split, handoff, or pause decision;
- no path continued merely because of sunk token cost;
- checkpoints preserved exact decisions, value ordering, rejected paths, failures, scope/claim changes, test evidence, cleanup, and next action;
- no material token debt remains.

### Universal minimum practice floor

Every task retains:

- the actual request/constraints and current authority;
- relevant current-state inspection;
- coherent owned scope and explicit exclusions when material;
- expected result and decisive verification;
- operation within authority;
- actual-effect inspection;
- relevant testing/evidence;
- cleanup/reconciliation;
- truthful checks not run, claim limits, and remaining risk.

Substantial and critical work also retain all objectively triggered specification, dependency/integration, failure/resource, rollback/recovery, safety/security, testing, review, and guarded-integration practices.

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

A soft budget estimate or approximately 25% soft-envelope overrun is a replan signal—not authority to skip required practice. A budget extension is valid when essential evidence, safety, correctness, cleanup, or handoff has high marginal value and reserve is restored through narrowing or split.

Routine work needs no durable token record; requiring one without a consumer is itself a validation defect.

## 6. Testing and repair-loop evidence

A material testing claim must verify all applicable items below.

### Accuracy and oracle

- Each claim has an authoritative oracle aligned with the engineering contract.
- The oracle is independent where practical and does not simply duplicate implementation logic.
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

Coverage is mapped from owned invariants/contracts and applicable risks:

- normal and boundary behavior;
- invalid/hostile/unknown inputs;
- lifecycle, cancellation, retry, restart, and cleanup;
- partial failure, rollback, recovery, and persistence;
- finite-resource pressure/exhaustion;
- concurrency, ordering, publication, duplication, loss, and stale state;
- compatibility/migration/versioning;
- security/privacy/provenance/permissions;
- producer-consumer and end-to-end integration;
- representative performance and search-quality degradation.

Equivalence partitions, boundaries, pairwise/risk-driven combinations, properties, metamorphic relations, deterministic samples, and synthetic domains may compress coverage. Sampling remains disclosed and cannot support a full claim.

### Test-intent banking and capsule consolidation

- Material test intents are recorded when discovered.
- Provisional reproducers remain temporary unless they are the correct durable owner.
- Related intents are consolidated into canonical owner/contract/conformance/integration capsules before branch acceptance.
- Capsules share expensive immutable setup when safe while preserving stable case IDs, independent inputs/expected results, isolated mutable state, direct single-case execution, and per-case results.
- Consolidation does not hide independent failures or stop after the first unrelated assertion.
- Pending intents are consolidated, proven already covered, superseded by stronger evidence, blocked with authority, or explicitly out of scope.
- Provisional scripts, duplicate tests/fixtures, diagnostics, and logs are removed, archived, or retained intentionally.

### Tier selection

Evidence escalates proportionally:

1. preflight identity/static/discovery checks;
2. focused fast regression/owner-local cases;
3. complete owner/contract capsule;
4. affected integration smoke;
5. deep property/fuzz/sanitizer/race/stress/migration/performance evidence;
6. forensic/release evidence.

Focused fast is the inner loop. Owner capsules run after coherent repair batches, integration smoke after local acceptance, and deep/forensic tiers only on risk, mismatch, stabilization, release, or explicit plan trigger.

### Evidence reuse and no-repeat

- An evidence key defines result identity completely.
- Identical evidence is reused rather than rerun for reassurance.
- Every repeated run has material invalidation, contamination/incompleteness, independent-replication, or statistical reason.
- Failed tests/commands are retried only after changed hypothesis, input, source/test revision, environment, configuration, or transport.
- Duplicate fast validation for one head is avoided; workflow ownership is disjoint where practical and stale runs are cancelled.

### Failure clustering and repair

- One trusted reproduction and baseline are frozen.
- Failures are clustered by first divergence, violated invariant, owner, and signature.
- Primary causes are separated from cascades.
- One root-cause hypothesis and cheapest decisive falsifier are stated.
- The authoritative owner is repaired in a coherent batch.
- The minimal affected cluster reruns first, then the owning capsule once, then required integration smoke once.
- A second repair cycle without stronger first-divergence evidence or a changed root-cause hypothesis triggers replan before more broad testing.
- Deep/forensic escalation occurs only when the claim remains unresolved or risk requires it.
- Raw logs remain artifacts; active evidence is bounded to causal intervals and exact locations.

Token backpressure may eliminate duplicate tests, setup, and unnecessary tiers. It may not remove required oracles, discovery/skip accounting, evidence identity, owner capsules, or integration evidence for the claim.

### Test debt

Material pending intents, provisional-only regressions, missing evidence identity, hidden skips, duplicated oracle authority, contaminated state, or unowned test artifacts are test debt. Test debt blocks acceptance unless explicitly authorized, contained, owned, and independently actionable.

Use `test-batch.template.yaml` only when several intents/capsules/failure clusters cross sessions or agents, expensive setup must be coordinated, or completeness/skip/invalidation evidence has a real consumer.

## 7. Governed plan execution

A material node/branch verifies:

- exact parent plan/version, engineering-decision version, branch/node, owner, environment, and frozen revision;
- dependency outputs/revisions and readiness;
- authority, hard gates, selected path, value ordering, minimum practice floor/reserve, contracts, test oracles/capsules/evidence keys, generated inputs, and runtime trust;
- expected effects, outputs, acceptance, falsifier, testing, rollback, cleanup, integration, and escalation before mutation;
- coherent owner-sized operations with immediate actual-effect inspection;
- new obligations/decision changes/test intents and invalidation are recorded;
- focused falsification and affected boundary/path/lifecycle/design/value/testing/cleanup reconciliation occur before continuation;
- material deviations revise parent state and invalidate dependent branches/evidence;
- no invalid partial state, stale output, decision/test/token debt, abandoned resource, unowned residue, or false downstream precondition remains.

## 8. Cleanup and artifact disposition

Verify protected state remains intact, every material local/remote/generated/decision/test/diagnostic/sensitive/external item has an intentional disposition, destructive actions use exact safeguards, remote/asynchronous state is read back, retained state has owners/triggers, and cleanup debt does not hide unsafe or incomplete work. Token pressure cannot justify skipping cleanup or retained-state reporting.

## 9. Sanity checking and independent review

A sanity/audit claim verifies exact frozen target and claim type, complete semantic coverage, full-attention review leaves, risk-justified depth, triggered modules, specification/engineering-decision/boundary/end-to-end reconciliation, test evidence/invalidation, token-practice-floor adherence, findings, cleanup, checks not run, and claim limits. Passing leaves or capsules do not prove integrated coherence. Reduced evidence narrows the claim.

## 10. Pull-request review and guarded merge

A material PR verifies:

- exact PR/base/head/comparison and review mode;
- complete changed/renamed/deleted/generated/dependency/workflow/package/decision/test/token/cleanup surface;
- agreement with authority, obligation map, hard gates, value ordering, selected path, priority, parent/branch map, execution, test evidence, token backpressure/practice floor, cleanup, and closure;
- rejected-path rationale, tradeoffs, exact evidence keys, discovery/skip counts, failure clusters, test intents consolidated, test tiers, evidence reuse, and remaining debt;
- current-head checks capable of falsifying the claim;
- discussion, requested changes, blockers, invalidated decisions/branches/evidence, decision/test/token/cleanup debt;
- review invalidation after head/base/parent/specification/decision/oracle/test/artifact/environment/fixture changes.

The merge transaction revalidates exact accepted head, target, mergeability, protections/checks/reviews, discussion, issue closure, branch/worktree/dependent state, debt, and conflicts. Post-merge verification proves target SHA/tree, engineering-decision/parent/branch/test map, issue/dependent effects, and cleanup.

## 11. Design and component boundaries

Components/contracts verify engineering contract, purpose/bounds, singular ownership, LEGO ports/adapters, justified SOLID/CUPID internals, domain-appropriate ranges, accurate generality, lifecycle/cleanup, hard gates/objectives, test owner/oracles/capsules/invalidation, compatibility/evolution, total-system simplicity, token/practice-floor fit, and decisive falsification.

## 12. Schema and generated artifacts

Verify syntax/version negotiation, normalization, invalid/boundary cases, deterministic generation, source/generated correspondence, compatibility, range/alignment/precision/layout, complete cache/evidence identity, and stale-output/test-artifact disposition.

## 13. Component-local and cross-component behavior

Each component owns fast and complete capsules for public contracts, invariants, failure, lifecycle, concurrency, exhaustion, and cleanup. Cross-component suites use public surfaces and verify failure propagation, incompatible versions, resource transfer, cleanup, and exact decision/branch/test integration.

## 14. Reference and conformance

Use deterministic references and synthetic domains to expose transpositions, cycles/history, stochastic/chance behavior, lazy/large/empty action spaces, evaluator modes, backup/reduction, pressure/exhaustion, reroot/persistence, cancellation/teardown, and cleanup. Synthetic cases share a public conformance runner while retaining domain/case identity.

## 15. CUDA/device correctness

Use triggered combinations of deterministic host-reference parity, publication/race checks, sanitizer tools, capability probes, lifetime/leak checks, cancellation/teardown/device-loss/IPC/shared-memory/failure injection, and explicit proof of device closure. Group compatible cases by complete generated-engine/model/architecture/driver/toolkit/resource evidence identity and isolate mutable search state.

## 16. Performance and search quality

Performance claims require exact identity, representative workload, baseline/target, warmup/synchronization/sample/statistics, raw results, profiler mechanism, resource bounds, semantic equivalence, stopping equivalence, and search-quality guardrails. Performance evidence is separate from correctness evidence. Temporary instrumentation/artifacts are dispositioned.

## 17. Publication and release

Before a **repository-visibility publication** such as making an ecosystem repository public, verify against the exact intended public default-branch revision:

- `LICENSE`, `LICENSING.md`, `CONTRIBUTING.md`, `SECURITY.md`, CODEOWNERS, issue/PR templates, and public claims are coherent;
- the current tree and the full reachable Git history have been audited for credentials, private keys, tokens, private endpoints, private user data, sensitive machine artifacts, or material that was safe only under private visibility;
- discovered credentials are revoked/rotated before publication; deletion or history rewriting alone is not credential remediation;
- public pull-request workflows run with least authority, require no repository secrets for untrusted PR code, and do not grant PR-controlled code write authority;
- the public-ready exact head passes `./scripts/verify-docs.sh` and every publication-specific check available before the switch;
- after the visibility change, repository visibility/default branch/license detection, public workflows, private vulnerability reporting availability, CODEOWNERS, and intended `main` branch protection/rulesets/required checks are read back through the owning GitHub surfaces;
- secrets, deploy keys, environments, runners, integrations, and external resources are checked for unintended exposure/authority changes.

If full-history secret/private-material evidence is unavailable, repository visibility is **not** certified ready to switch. See [`../docs/development/PUBLIC_REPOSITORY.md`](../docs/development/PUBLIC_REPOSITORY.md).

Repository visibility is independent from a **CUDA-MCGS product release**. Before a product/package release, inspect final diff/state, run all triggered tiers, update engineering-decision/parent/branch/token/test/execution/cleanup authority, complete exact-head review/guarded merge, verify remote target/checks/artifacts/packages/issue/branch/dependent state, and record skipped evidence, retained state, debt, and claim limits.

## Current phase

CUDA-MCGS is a public pre-release repository with no accepted production CUDA-MCGS implementation or product release. Public visibility does not widen implementation, support, compatibility or release claims. The mandatory current check is `./scripts/verify-docs.sh`, plus task-specific engineering judgment, assessment, focus-branch, token-backpressure, testing, execution, cleanup, sanity, PR-review, merge, security, publication, or specialist validation.

Repository licensing is `AGPL-3.0-or-later` with a separately negotiated commercial-license option. Third-party implementation reuse and public distribution require provenance/license compatibility and donor-artifact disposition.
