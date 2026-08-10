# Development Workflow

**Scope:** Reusable foundation.

## 1. Orient

Read authority, inspect repository state, identify task class, existing decisions, related work, unrelated local changes, and the current product-area/component organization.

If the request is a sanity check, audit, whole-project review, complete review, incident review, or release-readiness claim, freeze the target and route to [`SANITY_CHECKING.md`](SANITY_CHECKING.md) before deep inspection.

If the request is PR readiness, review, approval, or merge, freeze the PR identity/head and route to [`PULL_REQUEST_REVIEW_AND_MERGE.md`](PULL_REQUEST_REVIEW_AND_MERGE.md) before acting.

Identify protected pre-existing/user/shared state before creating or deleting files, branches, processes, credentials, artifacts, or remote resources.

## 2. Frame the assessment

State the required outcome, authority, evidence, ownership boundary, expected operating domain, constraints, assumptions, completion evidence, cleanup consequences, and cost of doing nothing. Distinguish observed facts from inferences and proposals.

Use [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md). Routine work may use a brief in-place assessment; substantial and critical work require the proportional durable record described there.

## 3. Inspect prior art and current behavior

When repository behavior, mature work, standards, papers, hardware behavior, or current libraries may change the design, inspect them before committing to an architecture. Record exact revisions, licenses, raw observations, unresolved gaps, and intended donor/evidence disposition.

## 4. Run the adversarial assessment

Answer every applicable assessment question, then attack the answers from the strongest credible opposing position. Challenge both unsound simplification and unnecessary machinery. Resolve each material objection through evidence, redesign, a bounded experiment, explicit assumption, blocker, cleanup debt, or rejection.

Do not plan production implementation until the assessment disposition permits it.

## 5. Decide whether focus branches are required

Use [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md).

Before deep planning or execution, ask whether one qualified agent can retain the objective, authority, mechanism, dependencies, risks, and material consequence horizon in one focused session without sampling or skimming.

Create a focus-branch map when the task:

- spans multiple semantic owners, public contracts, paths, artifact families, or lifecycle stages;
- contains independent unknowns, experiments, decisions, or specialist risks;
- crosses sessions, agents, teams, repositories, or operators;
- supports parallel work;
- requires different validation, rollback, cleanup, or security boundaries;
- would otherwise dilute attention or leave local work without system integration.

Keep one canonical parent task and integration spine. A focus branch is semantic, not automatically a Git branch.

## 6. Apply the design hierarchy

For component, contract, dependency, foundational representation, compatibility, reusable-name, or lifecycle/disposition work:

1. establish domain truth, authority, purpose, bounds, and contextual concern weighting;
2. define the LEGO owner, state/lifecycle ownership, ports, injected dependencies, adapters, non-responsibilities, and teardown/disposition;
3. define SOLID internal responsibilities only where meaning, change, testing, concurrency, resource lifetime, cleanup, or substitution requires separation;
4. define CUPID quality expectations;
5. prove domain-appropriate ranges/capacities and maximum-accurate-generality;
6. compare total-system complexity, including focus-branch coordination, cleanup, and complexity moved elsewhere;
7. identify decisive falsifiers, disposition triggers, and revisit triggers.

Use `templates/design-review.template.md` when the design is foundational, contested, or difficult to reconstruct.

## 7. Specify unsettled foundations

Persistent layouts, public contracts, synchronization, memory policies, lifecycle, state identity, ABI, cross-component ownership, dependency direction, retention, migration, and cleanup/reclamation require an accepted specification or ADR before production implementation.

A disposable experiment must name the question it answers, live under the experiment product area, and state deletion, archive, quarantine, or promotion conditions.

## 8. Build one coherent parent plan and focus-branch map

Build the plan from the integrated assessment, not from the original proposal. Include:

- parent objective, authority, global invariants, shared vocabulary, closure evidence, and integration owner;
- product area/component placement;
- public/internal contract and dependency effects;
- focus-branch map, branch IDs, owners, types, dependencies, exact inputs/outputs, statuses, and invalidation rules when triggered;
- leaf sizing evidence showing each branch fits full attention;
- coherent nodes ordered by dependency and uncertainty;
- decisive experiments before irreversible structure;
- validation and cheapest falsifiers paired with the mechanisms they prove;
- failure, recovery, cancellation, resource pressure, compatibility, migration, rollback, cleanup/disposition, and documentation;
- protected pre-existing state and expected task-created state;
- expected PR review mode, required gates, merge/closure effects, source-branch/worktree disposition, and post-merge verification when material;
- stop conditions and handoff state.

A node or focus branch must be decision-complete enough that execution does not invent foundational meaning, shared contracts, or cleanup policy. Listing it does not make it ready.

Prefer one combined assessment/plan and one canonical branch map. Do not create duplicate risk, dependency, branch, validation, execution, cleanup, review, or status ledgers.

## 9. Execute dependency-ready focus branches and nodes

Use [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md), [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md), and [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md).

For each active branch/node:

1. identify the current parent plan version, focus-branch ID, node, owner, frozen revision, and dependency outputs;
2. prove authority, branch sizing, repository/environment, operational, falsification, rollback, cleanup, and resource readiness;
3. load the minimal context packet and scan for newly triggered doctrine;
4. state expected local/wider effects, outputs, acceptance, falsifier, safe stop, cleanup obligations, integration obligation, and material deviation conditions;
5. prepare only necessary checkpoints, gates, fixtures, generated inputs, bounded instrumentation, and cleanup inventory;
6. apply one coherent ownership-sized operation inside the branch write boundary;
7. inspect exact actual effects immediately, compare expected versus actual, and register created/modified/obsolete state;
8. run the focused falsifier and reconcile material owners, contracts, artifacts, paths, resources, lifecycle, design principles, and cleanup dispositions;
9. escalate shared-contract changes to the integration spine and invalidate dependent branches explicitly;
10. classify continue, accept, pause, revise, rollback, fail, supersede, or integrate;
11. update durable branch/execution/cleanup truth only when another consumer needs the changed state.

Normally one agent owns one active focus branch. Before switching, leave an exact continuation checkpoint. Do not silently fix adjacent branches.

## 10. Coordinate parallel branches only when sound

Parallel focus branches require:

- one compatible parent-plan/authority version;
- non-overlapping semantic owners and write surfaces;
- frozen or explicitly coordinated shared contracts and generated sources;
- acyclic dependencies;
- independent falsification, acceptance, rollback, and cleanup;
- one integration owner;
- explicit collision, contradiction, and invalidation routing.

If branches repeatedly require each other’s in-progress state, combine them or define an atomic group.

## 11. Validate branch outputs

Progress from organization/documentation checks through branch readiness, operation-level falsifiers, focused component/contract checks, failure/exhaustion, cleanup verification, architecture-specific checks, benchmarks, and the full relevant suite.

A focus branch is locally accepted only when its output contract and exact revision are established. This does not prove parent completion.

## 12. Reconcile focus branches through the integration spine

For every accepted branch, reconcile:

- exact output, revision, authority, assumptions, exclusions, and claim limits;
- terminology, ownership, dependency direction, units, ranges, precision, identity, versions, and memory spaces;
- lifecycle, ordering, publication, pressure, failure, recovery, and cleanup;
- public contracts, generated forms, caches, persistence, compatibility, security, provenance, resources, performance, and search quality;
- downstream branches and critical end-to-end paths.

Account for every planned branch as integrated, blocked, invalidated, superseded, authoritatively deferred, or removed from scope with a reason. Rerun evidence invalidated by shared changes. Reconciliation is synthesis, not concatenation.

## 13. Reconcile cleanup before acceptance

Use [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md).

Before branch or parent acceptance, handoff, PR readiness, pause, failure, rollback, or abandonment:

- inventory material task-created, temporarily modified, superseded, partial, generated, diagnostic, local, remote, external, sensitive, and coordination state;
- identify protected user/pre-existing/shared/authority/evidence/recovery state;
- assign remove, restore, retain authority/evidence/recovery, archive, quarantine, transfer, supersede, temporary retention with owner/trigger, or protect-unchanged disposition;
- order cleanup by dependencies and preserve evidence/rollback until boundaries pass;
- use exact destructive safeguards;
- verify local workspace/Git, focus/Git branches, worktrees, remote PRs/issues/reviews, processes/ports/containers/device state, credentials/permissions, artifacts/caches/releases, persistence/backups, and external resources where triggered;
- create bounded cleanup debt only when immediate cleanup is less safe than retained state;
- block acceptance when residue can corrupt behavior, expose data, incur uncontrolled cost, mislead authority, defeat recovery, or contaminate later work.

## 14. Perform proportional self-sanity or independent sanity

For material implementation, interrogate changed semantic units through [`SEMANTIC_INTERROGATION.md`](SEMANTIC_INTERROGATION.md) and reconcile affected boundaries, paths, lifecycle, cleanup, and focus-branch outputs.

When the request or risk requires a declared full, bounded, sampled, independent, incident, or release claim, use [`SANITY_CHECKING.md`](SANITY_CHECKING.md). Its review branches are specialized focus branches for coverage, not automatically Git branches.

Do not force standalone branch, sanity, or cleanup records for small reversible work. Do not call a sampled review full.

## 15. Prepare the PR and perform author-side review when integrating

When the task publishes repository changes, create one coherent PR whose description is an integration summary rather than duplicated authority.

Before marking it ready:

- record the intended target and exact ready head;
- inspect ancestry and the complete changed-file surface;
- verify authority, component ownership, contracts, parent/focus-branch execution fidelity, generated/manifest/schema/dependency effects, preserved behavior, and cleanup state;
- account for all branches as integrated, blocked, invalidated, superseded, deferred, or out of scope;
- reconcile affected semantic units and integration paths;
- inspect tests/checks and cleanup evidence for relevance and current-head identity;
- remove temporary/debug/stale branch state or track safe bounded debt;
- disclose checks not run, retained state, issue closure, local/remote Git branch/worktree effects, and proposed merge method;
- perform a final whole-diff, focus-branch, and disposition pass.

Each head or material shared-contract/base change invalidates affected review and branch evidence.

## 16. Obtain independent review when triggered

When phase, policy, CODEOWNERS/protection, owner instruction, or objective consequence requires independence, freeze the exact head and review the parent/focus-branch integration without quietly repairing it.

Resolve blockers through author changes, then re-review changed/invalidated branches and the complete integration.

## 17. Execute the guarded merge transaction when integrating

Immediately before merge, re-read current PR metadata, exact head, target/base, discussion, required reviews/checks/protection/queue, mergeability, issue closure, focus/Git branch and worktree plan, cleanup debt, dependent work, and conflicting/superseding work.

Abort on changed or unresolved state. Use the expected-head guard. Never force-update the target or delete a branch to simplify integration.

## 18. Verify integration and perform post-merge cleanup

Verify the PR is merged; record the resulting target SHA; inspect the intended tree/result; confirm the parent task and branch map point to the integrated revision; reconcile issue closure, target checks/artifacts, stacked/dependent work, and handoff state.

Then remove task-owned local/remote Git branches and worktrees when safe, release temporary resources/permissions, retarget dependents, and complete or safely track delayed cleanup.

A merge response alone is neither integration nor cleanup completion.

## 19. Reconcile authority and history

Update specifications, ADRs, parent/focus-branch map, plan/execution/cleanup state, component manifests, registry, indexes, findings, and archived superseded material in the same coherent change. Remove temporary branch packets when their unique durable state has moved to the correct authority.

## 20. Hand off

Record parent objective, plan version, focus-branch ID/status, owner, authority, context inputs, expected-versus-actual effects, accepted outputs/revisions, contradictions, invalidated/unblocked branches, integration obligation, partial/rollback state, cleanup, validation, sanity limits, reviewed head/integrated SHA when applicable, Git/GitHub state, risks, and one next executable, analytical, integration, or cleanup boundary.
