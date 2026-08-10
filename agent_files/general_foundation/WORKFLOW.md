# Development Workflow

**Scope:** Reusable foundation.

## 1. Orient

Read authority, exact repository state, current plan/focus branch, related and unrelated work, organization, protected state, token band, existing engineering decisions, and existing test evidence.

Route sanity work to [`SANITY_CHECKING.md`](SANITY_CHECKING.md), PR work to [`PULL_REQUEST_REVIEW_AND_MERGE.md`](PULL_REQUEST_REVIEW_AND_MERGE.md), material path/value decisions to [`ENGINEERING_JUDGMENT.md`](ENGINEERING_JUDGMENT.md), and material test/repair work to [`TESTING.md`](TESTING.md) and [`DEBUGGING.md`](DEBUGGING.md).

## 2. Assess

State outcome, authority, evidence, owner, domain/bounds, assumptions, risks, completion evidence, test oracle/coverage implications, token/context constraints, cleanup, and cost of no change. Use [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md).

## 3. Establish the engineering contract and specification map

Use [`ENGINEERING_JUDGMENT.md`](ENGINEERING_JUDGMENT.md).

Before selecting architecture or files:

- normalize material specification obligations;
- map each obligation to owner, mechanism, failure consequence, and evidence/test capsule;
- define semantics, units, ranges, precision, identity, versions, memory spaces, resources, deadlines, lifecycle, failure, recovery, compatibility, and cleanup;
- classify ambiguity, conflict, gap, stale authority, unimplementable obligation, and oracle mismatch;
- distinguish hard gates, mission objectives, supporting qualities, and process costs;
- state non-goals and completion evidence.

Do not resolve missing or contradictory authority silently in implementation.

## 4. Inspect prior art and current behavior

Inspect current mechanism, existing tests/capsules, exact revisions, generated artifacts, external sources/licenses, prior engineering decisions, and known evidence before choosing architecture or adding tests. Record unresolved gaps and provenance/disposition.

## 5. Generate and adversarially compare credible paths

Include no-change, minimal repair, the proposed path, a materially different architecture, boundary split/adapter, experiment/staged path, or fallback where material.

For each candidate:

- apply hard gates first;
- identify mechanism, evidence, uncertainty, reversibility, total lifecycle cost, and downstream effects;
- eliminate invalid and Pareto-dominated paths;
- consider architectural separation before accepting a tradeoff;
- steelman overengineering and underengineering objections;
- run the cheapest decisive experiment when uncertainty can change the architecture.

Choose the lowest complete valid path and record why alternatives lost.

## 6. Order values and prioritize work

Use [`CONTEXTUAL_DESIGN_WEIGHTING.md`](CONTEXTUAL_DESIGN_WEIGHTING.md).

Translate safety, correctness, accuracy, speed, reliability, availability, resources, compatibility, maintainability, usability, simplicity, delivery, token use, and other concerns into gates, objectives, supporting qualities, or costs.

Apply subsystem-specific ordering or the accepted fallback. Weighted scores cannot conceal failed gates.

Assign:

- P0 containment;
- P1 gate/foundation;
- P2 information/risk/dependency unlock;
- P3 mission value/measured efficiency;
- P4 supporting quality/polish.

Within a class prioritize dependency unlock, consequence reduction, information value, cost of delay, exposure, reversibility/recovery cost, then effort.

## 7. Decide focus branching

Use [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md). Create one canonical parent/integration spine and full-attention leaves when the task spans owners/contracts/paths/unknowns, crosses sessions/agents, supports parallelism, or would force sampling/skimming. Each leaf includes the applicable engineering contract, value ordering, test obligations, and token fit.

## 8. Apply the design hierarchy

Establish domain truth/purpose/bounds/value ordering; LEGO owner/ports/adapters; justified SOLID internals; CUPID quality; domain-appropriate foundations; accurate generality; total-system simplicity including decision/test/setup/runtime/context/cleanup; and decisive falsifiers/revisit triggers.

## 9. Specify unsettled foundations and test contracts

Before production code, settle public contracts, identity, memory, synchronization, ABI, lifecycle, persistence, compatibility, security, resource pressure, cleanup, test oracle, capsule owner, evidence-key dimensions, invalidation, and escalation behavior.

Experiments name their question, provisional reproducer, evidence, promotion/disposal, engineering-decision effect, and test-consolidation conditions.

## 10. Build one parent plan, decision map, branch map, and test map

The plan includes:

- objective, authority, obligation map, invariants, vocabulary, closure, and integration owner;
- hard gates, mission objectives, supporting qualities, process costs, selected path, rejected paths, accepted tradeoffs, priority, and revisit triggers;
- branch IDs/owners/dependencies/exact inputs/outputs/status/invalidation;
- contract-to-test-capsule ownership and authoritative oracles;
- coverage by invariant/risk, test intents, evidence keys, expected discovery/skips, tier/escalation, failure clustering, setup sharing/isolation, and consolidation boundary;
- token reserve/context layers/checkpoints;
- coherent operations and experiments;
- rollback/recovery/cleanup/PR integration/handoff.

A branch/node is not ready if it would need to invent specification meaning, value ordering, selected architecture, test ownership, or cleanup meaning during implementation.

## 11. Execute a dependency-ready branch/node

Use [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md).

1. Prove parent/branch/node/input revisions, authority, engineering-decision status, full-attention/token fit, repository/environment, test/runtime trust, cleanup, and resource readiness.
2. Load the minimal context packet.
3. State obligation/decision, selected path, preserved value ordering, expected effects/output, test intent/falsifier, rollback, cleanup, integration, and stop conditions.
4. Prepare only necessary fixtures, checkpoints, generated inputs, bounded diagnostics, test case bank, and cleanup inventory.
5. Apply one coherent owner-sized operation.
6. Inspect actual effects immediately and register new/invalidated obligations, decisions, test intents, and evidence.
7. Run the cheapest focused falsifier.
8. Reconcile owner/contracts/paths/resources/lifecycle/design/value ordering/testing/cleanup/integration.
9. Classify continue/accept/pause/revise/rollback/fail/supersede/integrate.
10. Revise parent decision/plan and invalidate dependents for material changes.

Normally one agent owns one active branch and checkpoints before switching.

## 12. Run the efficient test–repair loop

Use [`TESTING.md`](TESTING.md) and [`DEBUGGING.md`](DEBUGGING.md).

### Before repair

- record expected behavior and authoritative oracle;
- freeze exact evidence key and one minimal reproducer;
- record every discovered case as a test intent;
- run one baseline at the cheapest decisive tier;
- cluster failures by first divergence, owner, and cause.

### Repair

- form one root-cause hypothesis and cheapest falsifier;
- repair the authoritative owner in one coherent batch;
- avoid assertion-by-assertion and unrelated fixes;
- retry only after changed hypothesis/input/code/test/environment/transport.

### Retest

1. minimal affected failure cluster;
2. complete owning capsule once;
3. affected integration smoke once;
4. deep/forensic tiers only when triggered.

Reuse unchanged evidence by complete key. Do not run full suites after every edit.

### Consolidate

Before branch acceptance:

- fold related intents into parameterized/property/generated owning capsules;
- share compatible immutable setup while isolating mutable state;
- preserve case IDs/direct selection/per-case results;
- disposition every material intent;
- remove/archive provisional reproducers, duplicate tests/fixtures, diagnostics, and redundant logs.

## 13. Coordinate parallel branches and tests only when sound

Parallel branches require compatible parent and engineering-decision versions, non-overlapping write/test ownership, coordinated shared contracts/oracles/generated sources, acyclic dependencies, independent acceptance/rollback/cleanup, bounded resources, and one integration owner.

Parallel test cases require isolated state and bounded shared setup. Stale or duplicate CI runs are cancelled; one head should not run the same fast capsule through several workflows without reason.

## 14. Validate branch output

Verify exact output revision; obligation satisfaction; hard-gate status; selected-path assumptions; value ordering; accepted tradeoffs; test evidence key; oracle accuracy/sensitivity; discovery/pass/fail/skip counts; coverage/claim limits; test intents/capsule consolidation; no-repeat reasoning; failure clusters; owner/contract and required integration tiers; cleanup; and remaining decision/test/token debt.

Local acceptance does not prove parent integration.

## 15. Reconcile through the integration spine

Reconcile exact branch outputs, engineering decisions, and test evidence across terminology, ownership, dependencies, units/ranges/identity/versions/memory spaces, lifecycle/order/publication/failure/recovery/cleanup, contracts/generated forms/persistence/compatibility/security/provenance/resources/performance/search quality, value ordering, priority, and end-to-end paths.

Account for every branch, obligation, candidate-path disposition, accepted tradeoff, and test intent. Rerun only evidence invalidated by shared-contract/decision/oracle/source/test/artifact/environment/fixture/resource changes. Synthesis—not concatenation—proves the parent.

## 16. Reconcile cleanup

Use [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md). Disposition provisional decision records, tests, fixtures, logs, instrumentation, build/cache artifacts, branches/worktrees, processes/device state, credentials, persistence, and external resources. Block acceptance on unsafe residue or debt.

## 17. Self-sanity or independent sanity

Interrogate changed semantic units, engineering decisions, value ordering, selected path, rejected alternatives, accepted tradeoffs, and reconciled test evidence. For declared claims, use complete coverage maps, full-attention review branches, risk depth, boundary/end-to-end reconciliation, findings, invalidation, cleanup, and exact claim limits.

## 18. Prepare and author-review the PR

Before ready-for-review:

- freeze exact head/base;
- account for complete diff/ancestry and all branch outputs;
- show specification traceability, hard gates, value ordering, candidate paths, selection rationale, priority, tradeoffs, and decision/revisit state;
- record oracles, evidence keys, discovery/skip counts, test intents consolidated, tiers, failure clusters, evidence reused/repeated, checks not run, and test debt;
- reconcile execution, token, cleanup, contracts, and end-to-end paths;
- remove temporary decision/test/debug state;
- perform a final whole-diff/decision/branch/test/disposition pass.

## 19. Independent review when triggered

Freeze exact head. The independent reviewer examines authority, specification mapping, hard gates, candidate paths, value ordering, path selection, priority, branch integration, test-oracle accuracy, capsule completeness/efficiency, no-repeat evidence, failure repair, cleanup, and claim limits without quietly repairing the head.

## 20. Guarded merge

Revalidate exact accepted head, target, mergeability, checks/reviews/protection, discussion, issue closure, decision/branch/test/token/cleanup debt, dependents, and conflicts. Use expected-head protection. Do not weaken gates/tests or delete branches to simplify merge.

## 21. Verify integration and post-merge cleanup

Verify target SHA/tree and parent engineering-decision/branch/test map; issue/dependent state; target checks/artifacts; and source branch/worktree disposition. Remove or safely track temporary decision/test records, logs, diagnostics, resources, permissions, and artifacts.

A merge response is not engineering, integration, testing, or cleanup completion.

## 22. Reconcile authority and hand off

Update specifications, ADRs, engineering decisions, parent/branch/token/test/execution/cleanup state, manifests, registry, indexes, findings, and archive. The handoff records exact obligation/path/value/priority state, output/evidence keys, test intents/capsules/failure clusters/debt, checks not run, partial/recovery/cleanup state, reviewed/integrated revisions, and one next executable/decision/testing/integration/cleanup boundary.
