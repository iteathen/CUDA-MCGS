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

## 5. Apply the design hierarchy

For component, contract, dependency, foundational representation, compatibility, reusable-name, or lifecycle/disposition work:

1. establish domain truth, authority, purpose, bounds, and contextual concern weighting;
2. define the LEGO owner, state/lifecycle ownership, ports, injected dependencies, adapters, non-responsibilities, and teardown/disposition;
3. define SOLID internal responsibilities only where meaning, change, testing, concurrency, resource lifetime, cleanup, or substitution requires separation;
4. define CUPID quality expectations;
5. prove domain-appropriate ranges/capacities and maximum-accurate-generality;
6. compare total-system complexity, including cleanup and complexity moved elsewhere;
7. identify decisive falsifiers, disposition triggers, and revisit triggers.

Use `templates/design-review.template.md` when the design is foundational, contested, or difficult to reconstruct.

## 6. Specify unsettled foundations

Persistent layouts, public contracts, synchronization, memory policies, lifecycle, state identity, ABI, cross-component ownership, dependency direction, retention, migration, and cleanup/reclamation require an accepted specification or ADR before production implementation.

A disposable experiment must name the question it answers, live under the experiment product area, and state deletion, archive, quarantine, or promotion conditions.

## 7. Plan one coherent dependency graph

Build the plan from the integrated assessment, not from the original proposal. Include:

- objective and completion evidence;
- product area/component placement;
- component manifest and registry changes;
- public/internal contract effects;
- dependency graph and exact node outputs/downstream consumers;
- coherent nodes ordered by dependency and uncertainty;
- decisive experiments before irreversible structure;
- validation and cheapest falsifiers paired with the mechanisms they prove;
- failure, recovery, cancellation, resource pressure, compatibility, migration, rollback, cleanup/disposition, and documentation;
- protected pre-existing state and expected task-created state;
- expected PR review mode, required gates, merge/closure effects, source-branch/worktree disposition, and post-merge verification when material;
- stop conditions and handoff state.

A node must be decision-complete enough that execution does not invent foundational meaning or cleanup policy. Listing a node does not make it ready.

Prefer one combined assessment-and-plan artifact. Do not create duplicate risk, dependency, validation, execution, cleanup, review, or status ledgers when the same authoritative record can serve them.

## 8. Execute dependency-ready nodes

Use [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md) and [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md).

For each material node:

1. identify the current plan version/node, owner, frozen revision, and dependency outputs;
2. prove authority, repository/environment, operational, falsification, rollback, cleanup, and resource readiness;
3. scan for newly triggered doctrine;
4. state expected local/wider effects, outputs, acceptance, falsifier, safe stop, cleanup obligations, and material deviation conditions;
5. prepare only necessary checkpoints, gates, fixtures, generated inputs, bounded instrumentation, and cleanup inventory;
6. apply one coherent ownership-sized operation;
7. inspect exact actual effects immediately, compare expected versus actual, and register created/modified/obsolete state;
8. run the focused falsifier and reconcile material owners, contracts, artifacts, paths, resources, lifecycle, design principles, and cleanup dispositions;
9. classify continue, accept, pause, revise, rollback, fail, or supersede;
10. update durable execution/cleanup truth only when another consumer needs the changed state.

A material deviation requires reassessment and a new plan version. Do not leave invalid partial state, stale downstream assumptions, abandoned resources, or unowned residue.

## 9. Validate

Progress from organization/documentation checks through readiness evidence, operation-level falsifiers, focused component/contract checks, integration, failure/exhaustion, cleanup verification, architecture-specific checks, benchmarks, and the full relevant suite. Validation must be capable of falsifying the important claims from the assessment and execution node.

Node acceptance requires exact evidence for every criterion, exact outputs/revisions for downstream consumers, and verified disposition for material task-created or obsolete state.

## 10. Reconcile cleanup before acceptance

Use [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md).

Before node acceptance, handoff, PR readiness, pause, failure, rollback, or abandonment:

- inventory material task-created, temporarily modified, superseded, partial, generated, diagnostic, local, remote, external, sensitive, and coordination state;
- identify protected user/pre-existing/shared/authority/evidence/recovery state;
- assign remove, restore, retain authority/evidence/recovery, archive, quarantine, transfer, supersede, temporary retention with owner/trigger, or protect-unchanged disposition;
- order cleanup by dependencies and preserve evidence/rollback until boundaries pass;
- use exact destructive safeguards;
- verify local workspace/Git, remote branches/PRs/issues/reviews, processes/ports/containers/device state, credentials/permissions, artifacts/caches/releases, persistence/backups, and external resources where triggered;
- archive historically useful stale material with provenance;
- create bounded cleanup debt only when immediate cleanup is less safe than retained state;
- block acceptance when residue can corrupt behavior, expose data, incur uncontrolled cost, mislead authority, defeat recovery, or contaminate later work.

Routine task-owned scratch may be cleaned inline. Use a durable cleanup record only when another consumer needs lifecycle evidence.

## 11. Perform proportional self-sanity or independent sanity

For material implementation, interrogate the changed semantic units through [`SEMANTIC_INTERROGATION.md`](SEMANTIC_INTERROGATION.md) and reconcile the actual affected boundaries, paths, lifecycle, and cleanup.

When the request or risk requires a declared full, bounded, sampled, independent, incident, or release claim, use [`SANITY_CHECKING.md`](SANITY_CHECKING.md):

- freeze the exact final revision/artifact;
- account for the declared coverage surface;
- select depth by risk;
- reconcile components, end-to-end paths, lifecycle, cleanup, contradictions, and findings;
- rerun invalidated coverage after authorized self-sanity repairs;
- keep independent review separate from remediation;
- state checks not run and final claim limits.

Do not force standalone sanity or cleanup records for small reversible work. Do not call a sampled review full.

## 12. Prepare the PR and perform author-side review when integrating

When the task publishes repository changes, create one coherent PR whose description is an integration summary rather than duplicated authority.

Before marking it ready:

- record the intended target and exact ready head;
- inspect ancestry and the complete changed-file surface;
- verify authority, component ownership, contracts, plan-execution fidelity, generated/manifest/schema/dependency effects, preserved behavior, and cleanup state;
- reconcile affected semantic units and integration paths;
- inspect tests/checks and cleanup evidence for relevance and current-head identity;
- remove temporary/debug/stale execution state or track safe bounded debt;
- disclose checks not run, retained state, limitations, issue closure, local/remote branch and worktree effects, and proposed merge method;
- perform a final whole-diff and disposition pass.

Author-side review may repair the branch. Each head change invalidates affected review and cleanup evidence.

## 13. Obtain independent review when triggered

When repository integration is occurring and phase, policy, CODEOWNERS/protection, owner instruction, or objective consequence requires independence:

- freeze the exact head;
- ensure the reviewer did not implement or quietly repair it;
- resolve blocking defects, questions, and unsafe cleanup through author changes;
- re-review changed/invalidated surfaces and perform a final whole-diff/integration/disposition pass;
- record approval or a blocker against the exact head.

When independent approval is structurally unavailable and policy permits, use the exact-head repository-owner authorization defined in the PR doctrine. Do not label it independent or use it to waive cleanup safeguards.

## 14. Execute the guarded merge transaction when integrating

Immediately before merge, re-read current PR metadata, exact head, target/base, discussion, required reviews/checks/CODEOWNERS/protection/queue, mergeability, issue closure, local/remote branch and worktree plan, cleanup debt, branch/dependent work, and conflicting/superseding work.

Abort on any changed or unresolved state. Select the merge method deliberately and use an expected-head guard where supported. Never force-update the target, weaken a gate, or delete a branch to simplify integration.

## 15. Verify integration and perform post-merge cleanup

Verify the PR is merged; record the resulting target SHA; inspect the intended tree/result; reconcile issue closure, target checks/artifacts, stacked/dependent PRs, status, and handoff state.

Then complete dependency-safe post-merge cleanup:

- remove task-owned local and remote branches/worktrees when safe;
- release review requests, claims, temporary permissions, processes, ports, containers, device state, locks, credentials/sessions, and external resources;
- retarget or update dependents;
- remove or archive temporary staging, caches, workflow/release/package artifacts when retention permits;
- retain rollback/evidence only until its approved boundary;
- verify all local and remote final state through owning systems;
- create bounded cleanup debt only for state that cannot safely be removed yet.

A merge response alone is neither integration nor cleanup completion.

If the task intentionally ends without repository integration, skip steps 12–15 and state the verified non-integrating and cleanup outcome explicitly.

## 16. Reconcile authority and history

Update specifications, ADRs, plan/execution/cleanup state, component manifests, registry, indexes, subsystem READMEs, actionable findings, and archived superseded material in the same coherent change. Remove temporary planning/execution/cleanup/review records once their unique durable decisions, outputs, findings, and continuation state have moved to the correct authorities.

## 17. Hand off

Record objective, plan record/version/node, product area/component, authority, readiness, expected-versus-actual effects, accepted outputs/revisions, deviations, partial-state/rollback status, cleanup inventory/dispositions/debt, validation, sanity claim/limits when triggered, reviewed head and integrated target SHA when applicable, issue/local/remote branch/worktree effects, actionable findings, process/device/credential/artifact/external-resource state, repository state, risks, failed approaches, and one coherent next boundary.
