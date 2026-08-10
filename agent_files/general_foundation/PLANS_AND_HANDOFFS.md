# Plans, Execution, Cleanup, and Handoffs

**Scope:** Reusable foundation.

## Assessment before plan

A plan is executable sequencing for a decision-ready boundary. It is not the place to conceal unresolved ownership, identity, lifecycle, resource, compatibility, security, architecture, integration, retention, or cleanup decisions.

Substantial and critical work first follows [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md). The assessment may conclude that the work should proceed, become a bounded experiment, require research, be revised, be rejected, or remain blocked.

## Plan quality

A durable plan states:

- the owned outcome and completion evidence;
- product area, component, ownership, and authority;
- the integrated assessment and strongest surviving objection;
- contracts, invariants, ranges, lifecycle, resources, failures, compatibility, security, retention, and cleanup affected;
- public/dependency effects and organizational placement;
- coherent nodes ordered by dependency and uncertainty;
- exact node outputs and downstream consumers;
- experiments before irreversible commitments;
- validation and cheapest falsifiers paired with the mechanisms they prove;
- protected pre-existing/user/shared/authority/evidence/recovery state;
- expected task-created, temporary, generated, external, remote, sensitive, and coordination state;
- planned disposition, verification, and cleanup-debt conditions;
- required self-sanity or independent-review claim, frozen target, and coverage boundary when material;
- expected PR review mode, protection/check requirements, merge method, issue closure, local/remote branch/worktree/dependent-work effects, and post-merge cleanup when material;
- migration, rollback, cleanup, risks, stop conditions, and handoff state.

Each material node identifies owner, preconditions, dependencies, scope/non-goals, expected local/wider effects, acceptance, falsifier, rollback/safe stop, cleanup obligations, outputs, and downstream consumers. A node listed in a plan is not automatically ready.

The plan must be specific enough that execution does not need to invent foundational design or cleanup policy, but it must not pretend to know details that a preceding experiment is meant to decide.

## Implementing a plan

Execution follows [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md), and state lifecycle follows [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md).

A plan is a hypothesis beneath authority. Before mutation, prove the current plan version/node is dependency-ready and record expected effects, the cheapest decisive falsifier, rollback/safe stop, cleanup obligations, and material deviation conditions.

Apply one coherent ownership-sized operation, inspect exact actual effects immediately, register created/modified/obsolete state, falsify locally, reconcile wider consequences and cleanup, and classify the outcome. Continue only while assumptions remain valid. Revise the plan when cause, owner, authority, public contract, schema, ABI, consequence horizon, resource model, risk, acceptance, rollback, output, downstream ordering, or cleanup disposition changes materially.

Do not accept a node while invalid partial state, stale generated forms, abandoned resources, unowned residue, unresolved contradictions, or false downstream preconditions remain.

## Cleanup planning and disposition

Cleanup is not one final “delete temporary files” step. It is planned and updated throughout execution.

A plan identifies, where material:

- local tracked/untracked/ignored files and directories;
- generated, build, test, cache, package, release, and workflow artifacts;
- local branches, worktrees, stashes, refs, remotes, hooks, and interrupted Git operations;
- remote branches, PRs, issues, reviews, claims, labels, milestones, assignments, and dependencies;
- processes, ports, containers, jobs, locks, leases, mounts, services, databases, queues, and external resources;
- GPU contexts, allocations, modules, IPC/shared-memory state, and diagnostic buffers;
- credentials, sessions, permissions, accounts, private data, and provenance-controlled material;
- backups, migration checkpoints, recovery state, test data, and compatibility forms;
- research/prototype/donor artifacts and evidence.

Each material item has an expected disposition and verification. Historically useful stale material is archived with provenance rather than silently deleted. Protected user/shared/authority/evidence/recovery state is explicitly identified.

Routine task-owned scratch may be cleaned inline. Use [`../templates/cleanup-disposition.template.yaml`](../templates/cleanup-disposition.template.yaml) only when state is shared, external, sensitive, retained, recovery-critical, long-lived, atomic, difficult to verify, or independently blocked.

## Proportional execution and cleanup records

Routine reversible single-session execution and ordinary task-owned scratch cleanup do not need standalone records when the issue, plan, or PR already carries the necessary truth.

Use [`../templates/plan-execution.template.yaml`](../templates/plan-execution.template.yaml) when execution crosses sessions/agents/operators, requires an atomic group, contains invalid intermediate states, gates later decisions on evidence, or changes a high-consequence boundary.

Use [`../templates/cleanup-disposition.template.yaml`](../templates/cleanup-disposition.template.yaml) when another consumer needs durable lifecycle, protected-state, destructive-safeguard, remote-verification, retention, or cleanup-debt evidence.

These records contain only unique readiness, operation, deviation, partial-state, validation, cleanup, output, and continuation evidence. They do not duplicate the assessment, specifications, issue history, PR summary, or handoff.

## Proportional administration

One combined assessment-and-plan record is the default. Link accepted authority and existing evidence instead of copying them. Group related questions. Use a short reason for non-applicable modules. Do not create parallel risk registers, dependency ledgers, validation plans, execution logs, cleanup ledgers, sanity ledgers, PR-review ledgers, daily status files, or duplicate checklists unless they have a distinct consumer, owner, and lifecycle.

Routine mechanical work does not require a standalone plan when the contract, owner, change, validation, and cleanup are already unambiguous. Routine self-sanity and author-side PR review do not require standalone artifacts.

Do not commit conversational scratch plans. Commit plans only when they are durable project state or necessary for another agent. Use [`../templates/assessment-and-plan.template.md`](../templates/assessment-and-plan.template.md) for a durable combined record, `next_step.yaml` for the one current coherent boundary, and specialized execution/cleanup/sanity/PR-review records only when their unique evidence has a consumer.

## Handoffs

A handoff must allow continuation without reconstructing chat history. Include:

- objective, plan record/version/node, product area, component, and owned boundary;
- authority, readiness proof, and integrated decision used;
- strongest remaining objection, assumptions, and revisit triggers;
- operations completed, expected-versus-actual effects, and current partial state;
- accepted outputs/revisions and downstream node changes;
- material variations, deviations, reassessments, and invalidations;
- component manifest/registry/dependency changes;
- validation commands/evidence and checks not run;
- cleanup inventory, verified dispositions, protected state, retained evidence/recovery, and cleanup debt;
- local files/folders, worktree, stash, branch, and uncommitted state;
- remote branches, PRs, issues, reviews, claims, workflow/release/package artifacts, and dependency state;
- active processes, ports, containers, locks, GPU/device state, credentials, permissions, and external resources;
- sanity claim, frozen revision, coverage status, findings, and claim limits when triggered;
- PR number, intended base, current/reviewed head, review mode/result, unresolved threads/checks, merge method/authorization, and branch state;
- rollback, recovery, or irreversible-state status;
- resulting integrated target SHA and verified issue/local/remote branch/worktree/dependent-work/cleanup effects after merge;
- open correctness/performance/licensing/design/organization/integration/cleanup risks;
- failed approaches or contaminated tests;
- one next executable, analytical, or cleanup node.

Do not imply unperformed work is running in the background, that an unverified merge is complete, or that a cleanup command proves final state.

For artifact names, use a short project acronym so unique identifiers remain visible on mobile. Include checksums when appropriate.
