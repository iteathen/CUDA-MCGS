# Development Workflow

**Scope:** Reusable foundation.

## 1. Orient

Read authority, exact repository state, current plan/focus branch, related and unrelated work, organization, protected state, token band, and existing test evidence.

Route sanity work to [`SANITY_CHECKING.md`](SANITY_CHECKING.md), PR work to [`PULL_REQUEST_REVIEW_AND_MERGE.md`](PULL_REQUEST_REVIEW_AND_MERGE.md), and material test/repair work to [`TESTING.md`](TESTING.md) and [`DEBUGGING.md`](DEBUGGING.md).

## 2. Assess

State outcome, authority, evidence, owner, domain/bounds, assumptions, risks, completion evidence, test oracle/coverage implications, token/context constraints, cleanup, and cost of no change. Use [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md).

## 3. Inspect prior art and current behavior

Inspect current mechanism, existing tests/capsules, exact revisions, generated artifacts, external sources/licenses, and known evidence before choosing architecture or adding tests. Record unresolved gaps and provenance/disposition.

## 4. Adversarially challenge

Attack problem framing, ownership, boundaries, generality, resources, failures, test oracles/completeness, alternatives, simplicity, token use, cleanup, and validation. Resolve objections through evidence, redesign, experiment, branch split, blocker/debt, or rejection.

## 5. Decide focus branching

Use [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md). Create one canonical parent/integration spine and full-attention leaves when the task spans owners/contracts/paths/unknowns, crosses sessions/agents, supports parallelism, or would force sampling/skimming. Each leaf includes test and token fit.

## 6. Apply the design hierarchy

Establish domain truth/purpose/bounds; LEGO owner/ports/adapters; justified SOLID internals; CUPID quality; domain-appropriate foundations; accurate generality; total-system simplicity including test/setup/runtime/context/cleanup; and decisive falsifiers/revisit triggers.

## 7. Specify unsettled foundations and test contracts

Before production code, settle public contracts, identity, memory, synchronization, ABI, lifecycle, persistence, compatibility, security, resource pressure, cleanup, test oracle, capsule owner, evidence-key dimensions, invalidation, and escalation behavior.

Experiments name their question, provisional reproducer, evidence, promotion/disposal, and test-consolidation conditions.

## 8. Build one parent plan, branch map, and test map

The plan includes:

- objective, authority, invariants, vocabulary, closure, and integration owner;
- branch IDs/owners/dependencies/exact inputs/outputs/status/invalidation;
- contract-to-test-capsule ownership and authoritative oracles;
- coverage by invariant/risk, test intents, evidence keys, expected discovery/skips, tier/escalation, failure clustering, setup sharing/isolation, and consolidation boundary;
- token reserve/context layers/checkpoints;
- coherent operations and experiments;
- rollback/recovery/cleanup/PR integration/handoff.

A branch/node is not ready if it would need to invent contract, oracle, test ownership, or cleanup meaning during implementation.

## 9. Execute a dependency-ready branch/node

Use [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md).

1. Prove parent/branch/node/input revisions, authority, full-attention/token fit, repository/environment, test/runtime trust, cleanup, and resource readiness.
2. Load the minimal context packet.
3. State expected effects/output, test intent/falsifier, rollback, cleanup, integration, and stop conditions.
4. Prepare only necessary fixtures, checkpoints, generated inputs, bounded diagnostics, test case bank, and cleanup inventory.
5. Apply one coherent owner-sized operation.
6. Inspect actual effects immediately and register new/invalidated test intents/evidence.
7. Run the cheapest focused falsifier.
8. Reconcile owner/contracts/paths/resources/lifecycle/design/testing/cleanup/integration.
9. Classify continue/accept/pause/revise/rollback/fail/supersede/integrate.
10. Revise parent state and invalidate dependents for material changes.

Normally one agent owns one active branch and checkpoints before switching.

## 10. Run the efficient test–repair loop

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

## 11. Coordinate parallel branches and tests only when sound

Parallel branches require compatible parent versions, non-overlapping write/test ownership, coordinated shared contracts/oracles/generated sources, acyclic dependencies, independent acceptance/rollback/cleanup, bounded resources, and one integration owner.

Parallel test cases require isolated state and bounded shared setup. Stale or duplicate CI runs are cancelled; one head should not run the same fast capsule through several workflows without reason.

## 12. Validate branch output

Verify exact output revision and test evidence key; oracle accuracy/sensitivity; discovery/pass/fail/skip counts; coverage/claim limits; test intents/capsule consolidation; no-repeat reasoning; failure clusters; owner/contract and required integration tiers; cleanup; and remaining test/token debt.

Local acceptance does not prove parent integration.

## 13. Reconcile through the integration spine

Reconcile exact branch outputs and test evidence across terminology, ownership, dependencies, units/ranges/identity/versions/memory spaces, lifecycle/order/publication/failure/recovery/cleanup, contracts/generated forms/persistence/compatibility/security/provenance/resources/performance/search quality, and end-to-end paths.

Account for every branch and test intent. Rerun only evidence invalidated by shared-contract/oracle/source/test/artifact/environment/fixture/resource changes. Synthesis—not concatenation—proves the parent.

## 14. Reconcile cleanup

Use [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md). Disposition provisional tests, fixtures, logs, instrumentation, build/cache artifacts, branches/worktrees, processes/device state, credentials, persistence, and external resources. Block acceptance on unsafe residue or debt.

## 15. Self-sanity or independent sanity

Interrogate changed semantic units and reconciled test evidence. For declared claims, use complete coverage maps, full-attention review branches, risk depth, boundary/end-to-end reconciliation, findings, invalidation, cleanup, and exact claim limits.

## 16. Prepare and author-review the PR

Before ready-for-review:

- freeze exact head/base;
- account for complete diff/ancestry and all branch outputs;
- record oracles, evidence keys, discovery/skip counts, test intents consolidated, tiers, failure clusters, evidence reused/repeated, checks not run, and test debt;
- reconcile execution, token, cleanup, contracts, and end-to-end paths;
- remove temporary test/debug state;
- perform a final whole-diff/branch/test/disposition pass.

## 17. Independent review when triggered

Freeze exact head. The independent reviewer examines authority, branch integration, test-oracle accuracy, capsule completeness/efficiency, no-repeat evidence, failure repair, cleanup, and claim limits without quietly repairing the head.

## 18. Guarded merge

Revalidate exact accepted head, target, mergeability, checks/reviews/protection, discussion, issue closure, branch/test/token/cleanup debt, dependents, and conflicts. Use expected-head protection. Do not weaken tests or delete branches to simplify merge.

## 19. Verify integration and post-merge cleanup

Verify target SHA/tree and parent/branch/test map; issue/dependent state; target checks/artifacts; and source branch/worktree disposition. Remove or safely track temporary tests, logs, diagnostics, resources, permissions, and artifacts.

A merge response is not integration, testing, or cleanup completion.

## 20. Reconcile authority and hand off

Update specifications, ADRs, parent/branch/token/test/execution/cleanup state, manifests, registry, indexes, findings, and archive. The handoff records exact output/evidence keys, test intents/capsules/failure clusters/debt, checks not run, partial/recovery/cleanup state, reviewed/integrated revisions, and one next executable/testing/integration/cleanup boundary.
