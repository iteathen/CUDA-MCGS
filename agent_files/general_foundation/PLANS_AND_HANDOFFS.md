# Plans, Focus Branches, Execution, Cleanup, and Handoffs

**Scope:** Reusable foundation.

## Assessment before plan

A plan is executable sequencing for a decision-ready boundary. It is not the place to conceal unresolved ownership, identity, lifecycle, resource, compatibility, security, architecture, integration, retention, cleanup, or decomposition decisions.

Substantial and critical work first follows [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md). The assessment may conclude that the work should proceed, become a bounded experiment, require research, be revised, be rejected, or remain blocked.

## Plan quality

A durable plan states:

- the owned outcome and completion evidence;
- product area, component, ownership, and authority;
- the integrated assessment and strongest surviving objection;
- contracts, invariants, ranges, lifecycle, resources, failures, compatibility, security, retention, and cleanup affected;
- public/dependency effects and organizational placement;
- whether focus branches are required under [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md);
- the canonical parent task, integration owner, global invariants, branch map, dependency graph, invalidation rules, and closure criteria when decomposition is required;
- coherent nodes and focus branches ordered by dependency and uncertainty;
- exact branch/node inputs, outputs, revisions, downstream consumers, and statuses;
- experiments before irreversible commitments;
- validation and cheapest falsifiers paired with the mechanisms they prove;
- protected pre-existing/user/shared/authority/evidence/recovery state;
- expected task-created, temporary, generated, external, remote, sensitive, and coordination state;
- planned disposition, verification, and cleanup-debt conditions;
- required self-sanity or independent-review claim, frozen target, and coverage boundary when material;
- expected PR review mode, protection/check requirements, merge method, issue closure, focus/Git branch/worktree/dependent-work effects, and post-merge cleanup when material;
- migration, rollback, cleanup, risks, stop conditions, and handoff state.

Each material focus branch states one primary question/output, owner, parent-plan version, exact inputs, scope/non-goals, write permissions, preserved global invariants, acceptance/falsifier, rollback/cleanup, output contract, and integration obligation.

A branch or node listed in a plan is not automatically ready. The plan must be specific enough that execution does not invent foundational design, shared contracts, branch boundaries, or cleanup policy.

## Focus-branch planning

Create a focus-branch map before deep execution when the task exceeds one focused session, spans semantic owners/contracts/paths/artifact families, contains independent unknowns, crosses agents/sessions, supports parallel work, or would force sampling or skimming.

Keep one canonical parent task and integration spine. Size each leaf so one qualified agent can retain its owner, mechanism, dependencies, resource/failure/cleanup behavior, evidence, consequence horizon, and integration obligation with full attention.

Do not split by equal file count, line count, token count, or agent count. Do not create a Git branch, issue, PR, worktree, or document merely because a semantic focus branch exists.

Branch statuses must distinguish `accepted` from `integrated`. Shared-contract changes produce a new parent/contract version and invalidate dependent branches explicitly.

Use [`../templates/focus-branch.template.yaml`](../templates/focus-branch.template.yaml) only when a branch crosses sessions/agents, runs in parallel, has high consequence, or needs independent continuation/review.

## Implementing a plan

Execution follows [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md), [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md), and [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md).

Before mutation, prove the current parent-plan version, focus branch, and node are dependency-ready. Load the minimal context packet. Record expected effects, the cheapest decisive falsifier, rollback/safe stop, cleanup, and integration obligations.

Apply one coherent ownership-sized operation inside the branch write boundary, inspect exact actual effects immediately, register created/modified/obsolete state, falsify locally, reconcile wider consequences, and classify the outcome.

A material change to cause, owner, authority, public contract, schema, ABI, shared terminology, consequence horizon, resource model, risk, acceptance, rollback, output, downstream ordering, or cleanup disposition requires parent-plan revision and explicit invalidation of affected branches.

Normally one agent owns one active focus branch. Before switching, preserve a continuation checkpoint. Do not accept a branch while invalid partial state, stale generated forms, abandoned resources, unowned residue, unresolved contradictions, or false downstream preconditions remain.

## Integration

The integration spine owns cross-branch reconciliation. It must account for every planned branch and reconcile exact outputs, terminology, ownership, dependencies, units, ranges, precision, identity, versions, memory spaces, lifecycle, publication, failure, recovery, cleanup, contracts, generated forms, persistence, compatibility, security, provenance, resources, performance, and search quality.

Local branch acceptance is not parent completion. Parent completion requires rerun of invalidated evidence, contradiction disposition, boundary/end-to-end validation, cleanup, and proof against one exact final revision or artifact.

## Proportional records

One combined assessment/plan and one canonical branch map are the default. Link accepted authority and evidence instead of copying them.

Routine reversible single-session execution, simple focus branches, and ordinary task-owned scratch cleanup do not need standalone records when the parent issue/plan/PR already carries the necessary truth.

Use specialist records only when they own unique continuation or evidence:

- [`../templates/focus-branch.template.yaml`](../templates/focus-branch.template.yaml) for durable cross-session/parallel/high-consequence branch packets;
- [`../templates/plan-execution.template.yaml`](../templates/plan-execution.template.yaml) for coordinated/high-consequence operation state;
- [`../templates/cleanup-disposition.template.yaml`](../templates/cleanup-disposition.template.yaml) for material lifecycle evidence;
- sanity and PR-review templates when their claim or independence requires persistence.

Do not create parallel risk registers, dependency ledgers, branch ledgers, validation plans, execution logs, cleanup ledgers, daily status files, or duplicate checklists without a distinct consumer, owner, and lifecycle.

## Handoffs

A handoff must allow continuation without reconstructing chat history. Include:

- parent objective, plan version, focus-branch map, active branch ID/type/status, integration owner, and owned boundary;
- authority, frozen revision, minimal context packet, dependency inputs, and readiness proof;
- branch objective, scope, non-goals, write surface, global invariants, and output contract;
- operations completed, expected-versus-actual effects, and current partial state;
- accepted outputs/revisions and downstream branch/node changes;
- material variations, deviations, shared-contract changes, contradictions, reassessments, and invalidations;
- branches accepted, integrated, paused, blocked, invalidated, superseded, deferred, or made ready;
- component manifest/registry/dependency changes;
- validation commands/evidence and checks not run;
- cleanup inventory, verified dispositions, protected state, retained evidence/recovery, and cleanup debt;
- local files/folders, worktree, stash, focus/Git branch, and uncommitted state;
- remote branches, PRs, issues, reviews, claims, workflow/release/package artifacts, and dependency state;
- active processes, ports, containers, locks, GPU/device state, credentials, permissions, and external resources;
- sanity claim, frozen revision, coverage status, findings, and claim limits when triggered;
- PR number, intended base, current/reviewed head, review mode/result, unresolved threads/checks, merge method/authorization, and branch state;
- rollback, recovery, or irreversible-state status;
- resulting integrated target SHA and verified issue/branch/worktree/dependent-work/cleanup effects after merge;
- open correctness/performance/licensing/design/organization/integration/decomposition/cleanup risks;
- failed approaches or contaminated tests;
- exact integration obligation and one next executable, analytical, integration, or cleanup branch.

Do not imply unperformed work is running in the background, that a locally accepted branch is integrated, that an unverified merge is complete, or that a cleanup command proves final state.

For artifact names, use a short project acronym so unique identifiers remain visible on mobile. Include checksums when appropriate.
