# Canonical Agent Operating Manual

**Scope:** All research, assessment, planning, focus-branch decomposition, specification, plan execution, implementation, testing, cleanup/disposition, sanity checking, pull-request review, merge, debugging, documentation, and publication work in UMCGS.

## Mission

Produce trustworthy, reusable engineering progress without allowing first-domain assumptions, attention dilution, fragmented work, token waste, token starvation, stale authority, abandoned residue, or unjustified review claims to become permanent constraints.

## Required orientation

1. Read root `AGENTS.md`, `AI_RULES.md`, `DESIGN_ALIGNMENT_CARD.md`, and `general_foundation/PRINCIPLES.md`.
2. Apply `general_foundation/TOKEN_DISCIPLINE.md` to **every task**: establish an implicit or explicit token posture, minimum practice floor, coherent scope, reserve, decisive evidence, and pressure triggers.
3. Classify the task as routine, substantial, or critical.
4. For substantial or critical work, complete `general_foundation/ASSESSMENT_AND_PLANNING.md` before implementation planning.
5. When work is large, complex, cross-session, parallel, multi-owner, or cannot fit one focused context, use `general_foundation/FOCUS_BRANCHES.md` before deep execution.
6. Before a material node or branch, use `general_foundation/PLAN_EXECUTION.md` and prove readiness.
7. Use `general_foundation/TESTING.md` and `DEBUGGING.md` for material test/repair work.
8. Before creating exceptional state—and before acceptance, handoff, closure, or merge—use `general_foundation/CLEANUP_AND_DISPOSITION.md`.
9. Route sanity/audit work to `SANITY_CHECKING.md` and `SEMANTIC_INTERROGATION.md`.
10. Route PR readiness/review/merge to `PULL_REQUEST_REVIEW_AND_MERGE.md`.
11. Use `SYSTEM_REGISTRY.md` to identify owners and authority.
12. Before structural changes, read organization doctrine.
13. Load only objectively triggered detailed doctrine.
14. Inspect repository, branch, worktree, plan, focus-branch, token/test/PR/cleanup, and unrelated-work state.
15. Apply reasoning, token-backpressure, focus-branch, execution, testing, and cleanup gates before editing.

## Authority order

1. Explicit current project-owner instruction.
2. Root `AGENTS.md` and this manual.
3. Accepted ADRs.
4. Accepted normative specifications.
5. `AI_RULES.md`, `SYSTEM_REGISTRY.md`, and `VALIDATION_POLICY.md`.
6. Accepted project charter.
7. Accepted application-specific guidance.
8. Architecture explanations.
9. Research notes and proposals.
10. Plans and specialist records.
11. Archived or superseded material.

Plans, token budgets, and branch packets organize work beneath authority. They cannot silently redefine ownership, contracts, hard gates, evidence requirements, compatibility, or closure.

## Task routing

| Task | Required authority before acting or claiming completion |
|---|---|
| Every task | ADR-0012/0016 and `TOKEN_DISCIPLINE.md`: implicit or explicit token posture, practice floor, coherent scope, reserve, pressure triggers, and honest claim limits |
| Research | Research policy, exact sources/revisions/licenses, evidence retention, and donor-artifact disposition |
| Assessment/planning | ADR-0006, authority/evidence, adversarial synthesis, outputs/falsifiers |
| Engineering decision | ADR-0015, engineering contract, obligation map, hard gates, credible paths, value ordering, priority, evidence, and revisit triggers |
| Large/complex decomposition | ADR-0011, canonical parent, full-attention branch map, integration owner, dependency/invalidation rules |
| Foundational design | Charter, ADR-0005/0006/0011/0015, principles, alternatives, and evidence |
| Component/contract design | LEGO/component/contract/composition doctrine, owning specification, registry/manifest |
| Plan/focus execution | ADR-0009/0011/0016, ready branch/node, exact inputs, practice floor/reserve, expected effects, falsifier, rollback, testing, cleanup, integration |
| Production implementation | Accepted specification/ownership, permitted assessment disposition, dependency-ready branch/node |
| Testing/debugging | ADR-0013, authoritative oracle, exact evidence key, capsule/tier, failure clustering, no-repeat reason, cleanup |
| Cleanup/disposition | ADR-0010, protected state, inventory, disposition, safeguards, owning-system verification |
| Sanity/audit | ADR-0007, frozen target, claim type, full-attention review branches, semantic interrogation, reconciliation |
| PR review/merge | ADR-0008/0010/0011/0016, exact head/base, complete surface, practice-floor evidence, integration, cleanup, guarded merge, post-merge verification |

## Organization gate

Before creating a production artifact, establish product area, component/lifecycle owner, artifact class, allowed consumers/public surface, manifest/registry/validation/teardown/disposition, dependency direction, and archive/supersession behavior.

Focus branches and token records organize work; they do not create product ownership or justify new repositories/services.

## Assessment gate

Before planning substantial or critical work:

1. frame outcome, authority, evidence, scope, assumptions, cost of no change, practice floor, testing, and cleanup;
2. answer applicable assessment questions;
3. steelman challenges to framing, ownership, foundations, resources, failure, alternatives, simplicity, decomposition, validation, cleanup, and process cost;
4. integrate valid criticism;
5. assign unknowns to evidence, experiment, accepted risk, blocker, or debt;
6. choose proceed/experiment/research/revise/reject/blocked;
7. plan only after disposition permits it.

One canonical assessment/plan is the default.

## Universal token-backpressure gate

Token use is backpressure on all tasks, including routine work.

Before work expands:

1. identify exact outcome, authority/owner, current state, and smallest coherent useful scope;
2. establish the risk-appropriate minimum practice floor;
3. reserve enough capacity for actual-effect inspection, decisive verification, cleanup, and truthful reporting;
4. identify optional breadth/polish and pressure triggers;
5. reduce pressure in order: duplication → evidence reuse → batching → context/output narrowing → optional breadth/polish → scope/claim reduction → split/handoff → blocker;
6. never preserve a broad claim while removing required evidence or practice;
7. narrow or label sampled/bounded claims when evidence is reduced;
8. use unchanged reads/retries, repeated repair without stronger causal evidence, new owners/contracts, test-tier expansion, and loss of exact state as replan signals;
9. treat the 30%/40% reserves and roughly 25% soft overrun as defaults, not quotas;
10. extend, narrow, split, hand off, or pause explicitly when the envelope changes;
11. checkpoint budget extensions, scope/claim changes, deferred work, splits, and handoffs;
12. do not continue because of sunk token cost.

### Minimum practice floor

Every task preserves:

- actual request and constraints;
- authoritative owner/current truth;
- relevant current-state inspection;
- coherent scope;
- expected result and decisive verification;
- operation within authority;
- actual-effect inspection;
- relevant testing;
- cleanup/reconciliation;
- honest result, checks not run, and remaining risk.

Substantial and critical work preserve all additional objectively triggered specification, reasoning, safety/security, resource/failure, compatibility, recovery, testing, review, and integration practices.

Routine tasks use an implicit micro-budget and need no token ledger. Backpressure should reduce administration rather than create a form for every edit.

## Focus-branch gate

Use a focus-branch map when one qualified agent cannot retain outcome, authority, mechanism, dependencies, risks, tests, cleanup, and consequence horizon in one focused session.

The parent owns outcome, authority, plan version, invariants, vocabulary, branch map/dependencies/status, integration, invalidation, contradictions, validation, token posture, cleanup, and closure.

Every material branch states stable ID/type/status/owner, one output, exact inputs, context packet, scope/non-goals/write authority, preserved invariants, dependencies/consumers, output/acceptance/falsifier, testing, rollback/recovery/invalidation/cleanup/handoff.

A leaf is valid only when its packet, mechanism, consequences, testing, validation, cleanup, and handoff reserve fit one usable window. Split by semantic ownership and validity transition—not equal file/line/token/agent counts.

`accepted` is local. `integrated` is parent-reconciled.

Shared-contract, decision, value-order, oracle, or evidence-key changes invalidate dependents explicitly.

Parallel branches require compatible parent versions, non-overlapping owners/write surfaces, coordinated shared sources, acyclic dependencies, independent acceptance/rollback/cleanup, and one integration owner.

## Design gate

Before accepting a component/contract, establish domain truth, engineering contract, bounds/value ordering, coherent owner, LEGO ports/dependencies/adapters, justified SOLID internals, CUPID quality, domain-appropriate foundations, accurate generality, compatibility/evolution, total-system simplicity, testing, and decisive validation.

Token pressure may remove optional design ceremony. It may not remove a necessary owner, contract, invariant, resource/failure rule, or evidence path.

## Plan execution gate

Before a material branch/node:

1. identify exact parent plan/version, branch, node, owner, environment, and frozen revision;
2. prove dependencies/inputs, authority, practice floor/reserve, repository/environment, tools, and test/runtime trust;
3. load minimal context and state output, expected effects, acceptance, falsifier, testing, rollback, cleanup, integration, and escalation;
4. prepare only necessary fixtures/checkpoints/generated inputs/instrumentation;
5. apply one coherent operation inside write authority;
6. inspect actual effects immediately;
7. run focused falsification and reconcile owner/contracts/paths/resources/lifecycle/design/testing/cleanup/integration;
8. classify continue/accept/pause/revise/rollback/fail/supersede/integrate;
9. revise parent state and invalidate dependents for material deviations;
10. leave no invalid partial state, stale output, abandoned resource, unowned residue, false downstream precondition, or material debt.

## Testing and repair gate

Use exact oracles/evidence identities, bank intents, consolidate owning capsules, share safe immutable setup, isolate mutable state, run focused fast evidence in the inner loop, cluster failures by first divergence/root cause, reuse unchanged evidence, and escalate tiers only on objective triggers.

Token backpressure may remove duplicate runs and unnecessary tiers. It may not remove the oracle, relevant owner capsule, required discovery/skip accounting, evidence identity, or integration evidence needed by the claim.

A second repair cycle without stronger first-divergence evidence or a changed root-cause hypothesis requires replan before more broad testing.

## Cleanup gate

Before acceptance/handoff/PR/merge/pause/failure:

1. inventory material created/modified/obsolete/partial/local/remote/sensitive/external state;
2. protect pre-existing/user/shared/authority/evidence/recovery state;
3. assign explicit disposition;
4. order cleanup by dependencies;
5. use exact destructive safeguards;
6. verify owning-system final state;
7. archive useful stale material;
8. create bounded cleanup debt only when immediate cleanup is less safe;
9. update canonical state;
10. block completion when residue threatens correctness, security, cost, authority, recovery, or future work.

Token pressure never justifies unsafe cleanup or omission of retained-state reporting.

## Sanity, review, and merge gates

A sanity claim freezes the target, declares full/bounded/sampled scope, accounts for surfaces at justified depth, and reconciles semantics, branches, tests, lifecycle, cleanup, contradictions, and findings. Reduced evidence narrows the claim.

PR review accounts for exact head/base, complete changed surface, token/practice-floor decisions, engineering/branch/test/execution/cleanup evidence, discussion, debts, and final integration. Head/base/shared meaning/evidence-key changes invalidate affected review.

Merge uses expected-head protection and is followed by target SHA/tree, parent/branch/test state, issue/dependent effects, branch/worktree disposition, resources, and cleanup verification.

## Reasoning levels

### Routine

Mechanical, reversible, single-owner, directly verifiable work with an implicit micro-budget and universal practice floor.

### Substantial

Cross-file/public-interface/dependency/multi-step/cross-session work requiring an explicit context packet, reserve, testing, and integration analysis.

### Critical

Foundational contracts, safety/security, CUDA/concurrency/memory/JIT/ABI, identity, persistence, migration, hot paths, repository boundaries, large multi-owner work, destructive cleanup, and full-system claims. Critical practice may not be reduced to meet a token estimate.

## Core workflow

1. Orient and set token posture/practice floor.
2. Assess and adversarially challenge.
3. Decide engineering path and focus branching.
4. Research/design/specify proportionally.
5. Build parent plan/branch/test map.
6. Execute dependency-ready work.
7. Inspect, test, and apply backpressure continuously.
8. Reconcile integration and cleanup.
9. Sanity-check and author-review exact head.
10. Obtain independent review when triggered.
11. Guarded merge and post-merge verification.
12. Reconcile authority/history and hand off.

## Completion

A task is complete only when:

- assessment/authority permit it;
- token backpressure was applied without lowering the practice floor;
- required branch map exists and leaves fit full attention/reserve;
- branch outputs and invalidations are reconciled;
- intended result exists without invalid partial state or material debt;
- required testing, validation, integration, cleanup, review, and publication evidence is complete for the claim made;
- exact accepted head and integrated target are verified when applicable;
- remaining work is explicit.

## Source and claim discipline

Never present a budget as authority, an implicit micro-budget as permission to skip verification, a reduced test tier as full evidence, a local branch result as integrated, a summary as source truth, author-side review as independent, a merge response as verified integration, or a cleanup command as final-state proof.
