# Development Workflow

**Scope:** Reusable end-to-end workflow for UMCGS engineering work.

## 1. Orient and establish token posture

Read current authority and repository state. Identify the owner, outcome, task class, current branch/plan/focus state, protected state, existing evidence, and unrelated work.

For **every task**, apply [`TOKEN_DISCIPLINE.md`](TOKEN_DISCIPLINE.md):

- establish the risk-appropriate minimum practice floor;
- choose the smallest coherent useful scope;
- identify the cheapest decisive verification;
- preserve reserve for actual-effect inspection, testing, integration, cleanup, review, and handoff;
- identify pressure triggers and optional work that will be deferred first.

Routine work uses an implicit micro-budget. Do not create a formal record without a consumer.

## 2. Assess

For substantial/critical work, state outcome, authority, evidence, ownership, domain/bounds, assumptions, risks, test consequences, token/context constraints, cleanup, and cost of no change. Adversarially challenge framing and proposed direction.

## 3. Establish engineering contract and specification map

Normalize material obligations and map them to owner, mechanism, failure consequence, and evidence/test capsule. Define semantics, units, ranges, identity, versions, resources, deadlines, lifecycle, failure, recovery, compatibility, cleanup, non-goals, and completion evidence.

Do not resolve specification conflicts/gaps silently.

## 4. Compare paths and prioritize

Generate credible paths, apply hard gates, seek decisive evidence, eliminate invalid/dominated paths, challenge false tradeoffs, consider reversibility and total lifecycle cost, select the lowest complete path, and assign P0–P4 priority.

## 5. Decide focus branches

Create one parent/integration spine and full-attention leaves when the task spans owners/contracts/paths/unknowns, crosses sessions/agents, supports parallelism, or cannot fit mechanism, testing, cleanup, and handoff reserve in one window.

A branch must fit its practice floor and reserve. Token pressure is a split signal, not permission to make the branch shallow.

## 6. Apply design hierarchy

Apply authority/domain truth → engineering contract/value order → LEGO → SOLID → CUPID → simplest sufficient total system. Include testing, recovery, cleanup, context reconstruction, and second-consumer cost.

## 7. Specify unsettled foundations and test contracts

Settle public contracts, identity, memory, synchronization, ABI, lifecycle, persistence, compatibility, security, resource pressure, cleanup, test oracle, capsule owner, evidence identity, invalidation, and escalation before production code.

## 8. Build one coherent plan

The parent plan includes obligation/decision state, branch map, dependency graph, selected path, priority, testing, token backpressure, rollback/recovery, cleanup, review, and handoff.

For token posture include:

- minimum practice floor;
- soft work envelope;
- 30%/40% reserve or semantic equivalent;
- pressure triggers;
- reduction ladder;
- optional scope/ceremony to defer;
- extend/narrow/split/handoff conditions;
- claim changes if evidence is reduced.

A node is not ready if implementation would invent specification meaning, value order, test ownership, or practice-floor exceptions.

## 9. Execute dependency-ready work

Before mutation:

1. prove exact parent/decision/branch/node/input revisions and repository/environment trust;
2. verify practice floor and reserve remain sound;
3. load the minimal context packet;
4. state obligation/decision, expected effects, value order, test intent/falsifier, rollback, cleanup, integration, and stop conditions;
5. apply one coherent owner-sized operation;
6. inspect actual effects immediately;
7. run the cheapest focused falsifier;
8. reconcile contracts, resources, lifecycle, design, testing, cleanup, and integration;
9. classify outcome and invalidate dependents for material changes.

## 10. Apply backpressure continuously

At every operation boundary, ask:

- Is this retrieval, test, retry, record, branch, or output new decision-relevant work?
- Is the current scope still coherent?
- Does the reserve still support proof and cleanup?
- Has a new owner, contract, or risk entered?
- Are repeated repair cycles producing better causal evidence?

When pressure appears, apply:

```text
remove duplication
  → reuse authority/evidence
  → batch coherent work/tests
  → narrow context/output
  → defer optional breadth/polish
  → reduce scope/claim
  → split/rebranch/handoff
  → pause on blocker
```

Do not cut required practice first. Soft estimates are replan signals. Extend the budget when essential evidence or cleanup has high marginal value and restore reserve through narrowing or split.

## 11. Run efficient test–repair loop

Capture test intents, freeze one baseline, cluster failures by first divergence/owner/root cause, repair coherently, rerun the minimal cluster, owner capsule once, then required integration smoke once. Reuse unchanged evidence. Escalate tiers only on objective triggers.

A second repair cycle without stronger causal evidence triggers replan before broad reruns.

## 12. Checkpoint and compact

Checkpoint at decisions, branch switches, yellow state, failures/rollback, budget extension, scope/claim reduction, deferral, and handoff.

Preserve exact authority/revisions, decisions/value order, accepted/rejected paths, outputs, assumptions, contradictions, failed hypotheses, tests/evidence, partial state, cleanup, token band/backpressure action, and next safe action.

Remove narration, duplicate summaries, repeated quotes, and tool output already preserved durably.

## 13. Reconcile branch outputs and integration

Account for every obligation, decision, branch, test intent, and evidence key. Reconcile terminology, ownership, dependencies, identity, lifecycle, failure/recovery, cleanup, compatibility, security, resources, performance, and search quality.

Rerun only invalidated evidence. Local acceptance does not prove parent integration.

## 14. Reconcile cleanup

Disposition provisional decisions/tests, files, generated output, logs, branches/worktrees, processes/device state, credentials, persistence, artifacts, and external resources. Token pressure cannot justify unsafe residue or missing final-state verification.

## 15. Sanity-check and review

For material work, interrogate changed semantic units and the engineering/token/test decisions. A declared sanity claim uses exact target/scope and reconciles integration and cleanup.

Before PR readiness:

- freeze exact head/base;
- inspect complete diff and ancestry;
- verify practice floor, reserve/backpressure decisions, tests, debts, and claim limits;
- remove temporary state;
- perform final whole-diff/decision/branch/test/cleanup pass.

## 16. Guarded merge and post-merge verification

Revalidate exact head, target, checks/reviews/protection, discussion, issue closure, debts, branches/dependents, and conflicts. Use expected-head protection.

After merge, verify target SHA/tree, authority/branch/test state, issue/dependent effects, resources, and cleanup.

## 17. Reconcile authority and hand off

Update specifications, ADRs, decisions, parent/branch/token/test/execution/cleanup state, manifests, registry, indexes, findings, and archive.

The handoff records exact state and any backpressure-driven extension, narrowed claim, deferred work, split, or next boundary. Another agent must not need to reconstruct the work from chat.
