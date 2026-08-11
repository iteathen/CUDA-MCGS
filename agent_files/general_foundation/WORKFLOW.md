# Development Workflow

**Scope:** Reusable foundation.

## 1. Orient and establish token posture

Read exact repository state, current plan/focus branch, related and unrelated work, organization, protected state, existing decisions, and test evidence.

Route sanity work to [`SANITY_CHECKING.md`](SANITY_CHECKING.md), PR work to [`PULL_REQUEST_REVIEW_AND_MERGE.md`](PULL_REQUEST_REVIEW_AND_MERGE.md), material path/value decisions to [`ENGINEERING_JUDGMENT.md`](ENGINEERING_JUDGMENT.md), material test/repair work to [`TESTING.md`](TESTING.md) and [`DEBUGGING.md`](DEBUGGING.md), and document discovery/interpretation to [`SPEC_AND_AGENT_FILE_READING.md`](SPEC_AND_AGENT_FILE_READING.md).

For every task, apply [`TOKEN_DISCIPLINE.md`](TOKEN_DISCIPLINE.md): exact outcome/authority, smallest coherent useful scope, risk-appropriate practice floor, cheapest decisive verification, reserve for inspection/testing/cleanup/reporting, and pressure triggers.

Routine work needs no ledger. Backpressure and authority discovery begin with the first retrieval or mutation.

## 2. Build the authority-complete reading set

State the task signature: outcome, claim, target paths/symbols/schemas/artifacts/external resources, operations, known owner, task class, and exact revision.

Then:

1. read the mandatory operating kernel;
2. discover every `AGENTS.md` from repository root toward each target path and use the union for multiple paths;
3. for cross-repository work, load each repository’s own instruction chain;
4. use registry, indexes, manifests, stable IDs, exact search terms, and references to find direct authority;
5. check each candidate’s status, scope, owner, version, exact revision, and supersession;
6. classify it as kernel, governing, triggered, adjacent-check, evidence-only, not-applicable, superseded/archive, or blocked/missing;
7. read governing and materially triggered documents to semantic closure, including definitions, normative references, conditions/exceptions, ownership, lifecycle, failure/resources, compatibility, security, cleanup, and conformance;
8. scan materially affected producers, consumers, dependencies, adapters, generated forms, persistence, lifecycle/recovery, tests, packaging, and cleanup;
9. prove pre-mutation authority closure or stop on missing/conflicting authority.

Do not recursively read all documents. Do not stop at only the files named in the request. Routine obvious work needs no standalone reading map; use `document-reading.template.yaml` only when another consumer needs exact durable coverage.

## 3. Assess

State outcome, authority, evidence, owner, domain/bounds, assumptions, risks, completion evidence, test oracle/coverage implications, token/context constraints, cleanup, and cost of no change. Use [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md).

## 4. Establish the engineering contract and specification map

Use [`ENGINEERING_JUDGMENT.md`](ENGINEERING_JUDGMENT.md).

Before selecting architecture or files:

- normalize material specification obligations;
- map each obligation to owner, mechanism, failure consequence, and evidence/test capsule;
- define semantics, units, ranges, precision, identity, versions, memory spaces, resources, deadlines, lifecycle, failure, recovery, compatibility, and cleanup;
- classify ambiguity, conflict, gap, stale authority, unimplementable obligation, and oracle mismatch;
- distinguish hard gates, mission objectives, supporting qualities, and process costs;
- state non-goals and completion evidence.

Do not resolve missing or contradictory authority silently in implementation.

## 5. Inspect prior art and current behavior

Inspect current mechanism, existing tests/capsules, exact revisions, generated artifacts, external sources/licenses, prior decisions, and known evidence before choosing architecture or adding tests. Record unresolved gaps and provenance/disposition.

Use targeted retrieval and the reading-depth model rather than broad context accumulation. Record source status/revision and reuse unchanged authority rather than rereading it.

## 6. Generate and adversarially compare credible paths

Include no-change, minimal repair, the proposed path, a materially different architecture, boundary split/adapter, experiment/staged path, or fallback where material.

For each candidate:

- apply hard gates first;
- identify mechanism, evidence, uncertainty, reversibility, total lifecycle cost, and downstream effects;
- eliminate invalid and Pareto-dominated paths;
- consider architectural separation before accepting a tradeoff;
- steelman overengineering and underengineering objections;
- run the cheapest decisive experiment when uncertainty can change the architecture.

Choose the lowest complete valid path and record why alternatives lost.

## 7. Order values and prioritize work

Use [`CONTEXTUAL_DESIGN_WEIGHTING.md`](CONTEXTUAL_DESIGN_WEIGHTING.md).

Translate safety, correctness, accuracy, speed, reliability, availability, resources, compatibility, maintainability, usability, simplicity, delivery, token use, and other concerns into gates, objectives, supporting qualities, or costs.

Apply subsystem-specific ordering or the accepted fallback. Weighted scores cannot conceal failed gates.

Assign P0 containment, P1 gate/foundation, P2 information/risk/dependency unlock, P3 mission value/measured efficiency, or P4 supporting quality/polish. Within a class prioritize dependency unlock, consequence reduction, information value, cost of delay, exposure, reversibility/recovery cost, then effort.

Token conservation is a process cost/tie-breaker after hard gates and the practice floor—not a reason to select an invalid or under-evidenced path.

## 8. Decide focus branching

Use [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md). Create one canonical parent/integration spine and full-attention leaves when the task spans owners/contracts/paths/unknowns, crosses sessions/agents, supports parallelism, or would force sampling/skimming.

Each leaf includes its engineering contract, value ordering, reading/authority-closure obligations, test obligations, token posture, practice floor, and reserve. A branch that cannot fit its reading set, mechanism, consequences, testing, cleanup, and handoff reserve must split or hand off rather than become shallow.

## 9. Apply the design hierarchy

Establish domain truth/purpose/bounds/value ordering; LEGO owner/ports/adapters; justified SOLID internals; CUPID quality; domain-appropriate foundations; accurate generality; total-system simplicity including reading/decision/test/setup/runtime/context/cleanup; and decisive falsifiers/revisit triggers.

Token pressure may remove optional ceremony. It may not remove a necessary owner, contract, invariant, resource/failure rule, authority dependency, or evidence path.

## 10. Specify unsettled foundations and test contracts

Before production code, settle public contracts, identity, memory, synchronization, ABI, lifecycle, persistence, compatibility, security, resource pressure, cleanup, test oracle, capsule owner, evidence-key dimensions, invalidation, and escalation behavior.

Use the specification template with its governing reading and documentation methods. Experiments name their question, provisional reproducer, evidence, promotion/disposal, decision effect, and test-consolidation conditions.

## 11. Build one parent plan, reading map, decision map, branch map, test map, and backpressure envelope

The plan includes:

- objective, authority, obligation map, invariants, vocabulary, closure, and integration owner;
- instruction chains, governing documents, triggers, adjacency, applicability/depth, normative references, and invalidation;
- hard gates, objectives, selected/rejected paths, tradeoffs, priority, and revisit triggers;
- branch IDs/owners/dependencies/exact inputs/outputs/status/invalidation;
- contract-to-test-capsule ownership and authoritative oracles;
- coverage, test intents, evidence keys, discovery/skips, tier/escalation, failure clustering, setup/isolation, and consolidation;
- minimum practice floor, token reserve/context/checkpoints, pressure triggers, reduction ladder, optional work, extend/narrow/split/handoff conditions, and claim-reduction rules;
- coherent operations/experiments, rollback/recovery/cleanup/PR integration/handoff.

A branch/node is not ready if it would need to invent authority, specification meaning, value ordering, architecture, test ownership, practice-floor exceptions, or cleanup meaning during implementation.

## 12. Execute a dependency-ready branch/node

Use [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md).

1. Prove exact parent/reading/decision/branch/node/input revisions, authority closure, full-attention/token fit, practice floor/reserve, repository/environment, test/runtime trust, cleanup, and resource readiness.
2. Load the minimal context packet.
3. State obligation/decision, selected path, preserved value ordering, expected effects/output, test intent/falsifier, rollback, cleanup, integration, and stop conditions.
4. Prepare only necessary fixtures, checkpoints, generated inputs, bounded diagnostics, test case bank, and cleanup inventory.
5. Apply one coherent owner-sized operation.
6. Inspect actual effects immediately and register new/invalidated authority, obligations, decisions, test intents, and evidence.
7. Run the cheapest focused falsifier.
8. Reconcile owner/contracts/paths/resources/lifecycle/design/value/testing/cleanup/integration.
9. Classify continue/accept/pause/revise/rollback/fail/supersede/integrate.
10. Revise parent state and invalidate dependents for material changes.

Normally one agent owns one active branch and checkpoints before switching.

## 13. Re-route documents when the task changes shape

Repeat path-instruction discovery, triggers, adjacency, applicability, and semantic reading when:

- scope expands to another path, owner, component, repository, or external system;
- a public contract, schema, ABI, persistence format, generated artifact, or resource model changes;
- a failure reveals a new lifecycle/dependency boundary;
- selected design or test oracle changes;
- governing authority changes or is superseded;
- review identifies an omitted consumer or doctrine trigger.

Do not execute under a stale reading map.

## 14. Apply token backpressure continuously

At every coherent operation boundary, ask whether retrieval, reading, testing, retry, records, branches, or output add decision-relevant value; whether scope is still coherent; whether reserve still supports proof/cleanup/handoff; and whether a new owner, authority, contract, artifact, or risk has entered.

When pressure appears:

```text
remove duplication
  → reuse authority and evidence
  → batch coherent work and tests
  → narrow context and output
  → defer optional breadth and polish
  → reduce scope or claim
  → split, rebranch, or hand off
  → pause on a blocker
```

Do not cut required practice first. Soft estimates are replan signals. Extend the budget when essential authority/evidence/cleanup has high marginal value, then restore reserve through narrowing or split. Do not continue because tokens have already been spent.

## 15. Run the efficient test–repair loop

Use [`TESTING.md`](TESTING.md) and [`DEBUGGING.md`](DEBUGGING.md).

Before repair, record expected behavior/oracle, freeze exact evidence key and one reproducer, bank discovered cases, run one cheapest baseline, and cluster failures by first divergence/owner/cause.

Repair the authoritative owner in one coherent batch. Retry only after changed hypothesis/input/code/test/environment/transport. A second repair cycle without stronger causal evidence triggers replan.

Retest minimal cluster → owner capsule once → affected integration smoke once → deep/forensic only when triggered. Reuse unchanged evidence. Before acceptance, consolidate intents and remove/archive provisional/duplicate artifacts.

Token pressure may remove duplicate runs and unnecessary tiers, but not the oracle, evidence identity, required owner capsule, discovery/skip accounting, or integration evidence needed by the claim.

## 16. Coordinate parallel branches and tests only when sound

Parallel branches require compatible parent/authority/decision versions, non-overlapping write/test ownership, coordinated shared contracts/oracles/generated sources, acyclic dependencies, independent acceptance/rollback/cleanup, bounded resources, and one integration owner.

Parallel token use is still total token use. More agents are efficient only when they reduce critical-path time or improve independent evidence without duplicating discovery/context/work.

## 17. Validate branch output

Verify exact output revision; authority closure; obligation/gate satisfaction; selected-path assumptions; value ordering/tradeoffs; practice-floor/backpressure actions; test evidence key/oracle/discovery/pass/fail/skip/coverage/claim limits; intent consolidation; failure clusters; required integration tiers; cleanup; and remaining document-reading/decision/test/token debt.

Local acceptance does not prove parent integration. Reduced evidence narrows the claim.

## 18. Reconcile through the integration spine

Reconcile exact branch outputs, reading maps, decisions, test evidence, and backpressure decisions across terminology, ownership, dependencies, units/ranges/identity/versions/memory spaces, lifecycle/order/publication/failure/recovery/cleanup, contracts/generated forms/persistence/compatibility/security/provenance/resources/performance/search quality, value ordering, priority, and end-to-end paths.

Account for every branch, obligation, document disposition, candidate-path disposition, tradeoff, test intent, scope/claim reduction, extension, deferral, and handoff. Rerun only invalidated reading/evidence. Synthesis—not concatenation—proves the parent.

## 19. Reconcile cleanup

Use [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md). Disposition provisional reading/decision/token records, tests, fixtures, logs, instrumentation, build/cache artifacts, branches/worktrees, processes/device state, credentials, persistence, and external resources. Block acceptance on unsafe residue or debt.

## 20. Self-sanity or independent sanity

Interrogate changed semantic units, authority coverage, decisions, value ordering, selected/rejected paths, tradeoffs, backpressure choices, and reconciled test evidence. Declared claims use exact coverage, boundary/end-to-end reconciliation, findings, invalidation, cleanup, and limits.

## 21. Prepare and author-review the PR

Before ready-for-review:

- freeze exact head/base and account for complete diff/ancestry;
- compare final changed surface with the original task signature;
- rerun trigger/adjacency discovery and refresh changed authority;
- show instruction chains, governing status/scope/revisions, semantic closure, exclusions, missing authority, and reading debt;
- show specification traceability, gates, value ordering, candidate/selected paths, priority, tradeoffs, and decision state;
- record practice floor/reserve/backpressure/claim changes and token debt;
- record test oracles/keys/counts/intents/tiers/clusters/reuse/checks not run/test debt;
- reconcile execution, cleanup, contracts, and end-to-end paths;
- remove temporary state;
- perform a final whole-diff/reading/decision/branch/test/token/disposition pass.

## 22. Independent review when triggered

Freeze exact head. The independent reviewer examines authority discovery/applicability/semantic closure, specification mapping, gates, candidate paths, value ordering, priority, branch integration, practice-floor choices, testing, cleanup, and claim limits without quietly repairing the head.

## 23. Guarded merge

Revalidate exact accepted head, target, authority statuses/revisions, mergeability, checks/reviews/protection, discussion, issue closure, document-reading/decision/branch/test/token/cleanup debt, dependents, and conflicts. Use expected-head protection. Do not weaken gates or delete branches to simplify merge.

## 24. Verify integration and post-merge cleanup

Verify target SHA/tree, indexes/registry/status/authority, parent reading/decision/branch/test/token maps, issue/dependent state, target checks/artifacts, and source branch/worktree disposition. Remove or safely track temporary records/resources/artifacts.

A merge response is not authority, engineering, integration, testing, token-efficiency, or cleanup completion.

## 25. Reconcile authority and hand off

Update specifications, ADRs, reading maps, decisions, parent/branch/token/test/execution/cleanup state, manifests, registry, indexes, findings, and archive. The handoff records exact authority coverage, obligations/path/value/priority, outputs/evidence, tests/debt, checks not run, partial/recovery/cleanup state, scope/claim changes, deferred work, reviewed/integrated revisions, and one next reading/decision/executable/testing/integration/cleanup boundary.
