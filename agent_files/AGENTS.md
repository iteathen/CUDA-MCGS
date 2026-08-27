# Canonical Agent Operating Manual

**Scope:** All research, assessment, planning, focus-branch decomposition, specification, plan execution, implementation, cleanup/disposition, sanity checking, pull-request review, merge, debugging, documentation, and publication work in CUDA-MCGS.

## Mission

Produce trustworthy, reusable engineering progress without allowing the first domain, first model, first GPU, first implementation shortcut, stale plan wording, attention dilution, fragmented branch work, abandoned residue, early repository size, unjustified review claims, or stale PR approval to become accidental permanent constraints.

## Required orientation

1. Read root `AGENTS.md`, `AI_RULES.md`, `DESIGN_ALIGNMENT_CARD.md`, and `general_foundation/PRINCIPLES.md`.
2. Classify the task as routine, substantial, or critical.
3. For substantial or critical work, complete `general_foundation/ASSESSMENT_AND_PLANNING.md` before implementation planning.
4. When the task is large, complex, cross-session, parallel, multi-owner, or cannot fit one focused context, read `general_foundation/FOCUS_BRANCHES.md` and build the parent branch map before deep execution.
5. Before executing a material node or branch, read `general_foundation/PLAN_EXECUTION.md` and prove readiness.
6. Before creating exceptional local/remote/sensitive/retained/external state—and before acceptance, handoff, closure, or merge—read `general_foundation/CLEANUP_AND_DISPOSITION.md`.
7. For sanity, audit, whole-project review, incident, or release-readiness work, read `general_foundation/SANITY_CHECKING.md` and `general_foundation/SEMANTIC_INTERROGATION.md`.
8. For PR readiness, review, approval, or merge work, read `general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`.
9. Use `SYSTEM_REGISTRY.md` to identify owning boundaries and authority.
10. Before creating or moving artifacts, read `general_foundation/PROJECT_ORGANIZATION.md` and `application_specific/REPOSITORY_ORGANIZATION.md`.
11. Load only the detailed design doctrine triggered by the task.
12. Inspect current repository, branch, worktree, plan, focus-branch, PR, cleanup, and unrelated-work state.
13. Establish purpose, bounds, invariants, resources, lifecycle, failures, organization, dependencies, decomposition, cleanup, and evidence requirements.
14. Apply the reasoning, focus-branch, execution-readiness, and cleanup gates before editing.

## Authority order

1. Explicit current project-owner instruction.
2. Root `AGENTS.md` and this canonical manual.
3. Accepted ADRs.
4. Accepted normative specifications.
5. `AI_RULES.md`, `SYSTEM_REGISTRY.md`, and `VALIDATION_POLICY.md`.
6. Accepted project charter.
7. Accepted application-specific guidance.
8. Architecture explanations.
9. Research notes and proposals.
10. Plans, focus-branch packets, execution/cleanup/review records, and summaries.
11. Archived or superseded material.

Plans and focus-branch maps organize work beneath authority. They cannot silently redefine accepted ownership, contracts, schemas, units, identity, resource rules, compatibility, or closure.

## Task routing

| Task | Required authority before acting or claiming completion |
|---|---|
| Research | Research policy, exact sources/revisions/licenses, evidence retention, and donor-artifact disposition |
| Assessment/planning | ADR-0006, current authority/evidence, adversarial synthesis, executable outputs/falsifiers |
| Large/complex task decomposition | ADR-0011, canonical parent, full-attention branch map, integration owner, dependency/invalidation rules |
| Foundational design | Charter, ADR-0005/0006/0011, principles, triggered design doctrine, alternatives, evidence |
| Component/contract design | LEGO/component/contract/composition doctrine, owning specification, registry/manifest |
| Project organization | ADR-0004, organization doctrine, registry, affected manifests, archive/supersession plan |
| Plan/focus-branch execution | ADR-0009/0011, ready branch/node, exact inputs/revisions, expected effects, falsifier, rollback, cleanup, integration obligation |
| Production implementation | Accepted specification/ownership, permitted assessment disposition, dependency-ready focus branch/node |
| Cleanup/disposition | ADR-0010, protected state, inventory, dispositions, dependency order, safeguards, owning-system verification |
| Sanity/audit | ADR-0007, frozen target, claim type, full-attention review branches, semantic interrogation, central reconciliation |
| PR readiness/review | ADR-0008, exact head/base, complete surface, focus-branch integration, execution/cleanup evidence, discussion reconciliation |
| Merge | ADR-0008/0010/0011, exact accepted head, current gates, integrated branches, cleanup and post-merge verification |
| Experiment | Named question, isolation, promotion/disposal criteria, evidence and cleanup |
| Debugging | Expected behavior, trustworthy state, raw boundary evidence, focus branch where scope requires it |
| Performance | Reproducible workload/profile/baseline, profiler mechanism, quality/resource equivalence, artifact cleanup |
| Migration | Source/target authority, compatibility, rollback/recovery, atomic state, cleanup, focus branches where needed |
| Publication/release | Clean scope, exact-head review, validation, integrated branch map, remote verification, cleanup |

## Organization gate

Before creating a production artifact, establish:

1. product area;
2. component and lifecycle owner;
3. artifact class: public contract, internal implementation, generated output, test, benchmark, documentation, tool, experiment, package, or third-party material;
4. allowed consumers and public surface;
5. manifest, README, registry, validation, teardown, and disposition;
6. dependency direction and growth-scale placement;
7. archive/supersession/removal behavior.

Focus branches organize work. They do not create product ownership, components, packages, repositories, or services by themselves.

## Assessment gate

Before planning substantial or critical work:

1. frame exact outcome, authority, evidence, scope, assumptions, cost of no change, and cleanup consequences;
2. answer all applicable assessment questions;
3. steelman the strongest challenge to problem framing, ownership, boundaries, generality, ranges, resources, failure, alternatives, simplicity, decomposition, validation, cleanup, and process cost;
4. integrate valid criticism;
5. assign remaining unknowns to evidence, experiment, accepted risk, blocker, cleanup debt, or revisit trigger;
6. choose `proceed`, `experiment`, `research`, `revise`, `reject`, or `blocked`;
7. plan only after disposition permits it.

One canonical assessment/plan is the default. Do not duplicate it across issue, branch packets, PR, and handoff.

## Focus-branch gate

### Trigger

Before deep execution, ask whether one qualified agent can retain the task’s objective, authority, mechanism, dependencies, risks, and material consequence horizon in one focused session without sampling or skimming.

A focus-branch map is required when work:

- spans multiple semantic owners, contracts, runtime paths, artifact families, or lifecycle stages;
- contains independent unknowns, experiments, decisions, or specialist risks;
- crosses agents, sessions, windows, teams, repositories, or operators;
- can or should proceed in parallel;
- requires different acceptance, rollback, security, or cleanup boundaries;
- would otherwise force broad shallow work or fragmented local work.

Routine reversible single-owner work remains one coherent branch/node.

### Parent task and integration spine

The canonical parent owns:

- final outcome and closure criteria;
- authority, plan version, and exact current revision;
- global invariants and shared vocabulary;
- branch map, dependency graph, and statuses;
- integration owner and integration spine;
- shared-contract changes and invalidation;
- contradictions, global validation, cleanup, and closure.

### Branch contract

Every material focus branch states:

- stable ID, type, status, parent-plan version, owner, and integration owner;
- one primary question or output;
- exact authority and input revisions;
- minimal context packet and local anchors;
- scope, non-goals, prohibited changes, and write permissions;
- shared invariants it must preserve;
- dependencies and downstream consumers;
- output contract, acceptance criteria, and cheapest falsifier;
- consequence/reconciliation obligations;
- rollback, recovery, invalidation, cleanup, and handoff.

A semantic focus branch is not automatically a Git branch, issue, PR, component, directory, document, or worktree.

### Full-attention sizing

A leaf is valid only when one qualified agent can hold without sampling or skimming:

- its owner, question, authority, scope, and output;
- inputs, dependencies, consumers, and shared invariants;
- mechanism, state, identity, lifetime, ordering, resources, failure, recovery, and cleanup;
- triggered doctrine, falsifier, evidence, consequence horizon, and integration obligation.

Split by semantic ownership, independent output, validation, rollback, cleanup, and validity transition—not line/file/token/agent count. Combine branches when separation would create invalid intermediate state, duplicate the same mechanism, or require constant in-progress coupling.

### Status and branch switching

Use `planned`, `ready`, `active`, `paused`, `blocked`, `accepted`, `invalidated`, `superseded`, `integrated`, and `archived` consistently.

`accepted` means locally supported. `integrated` means reconciled into the parent result.

Normally one agent owns one active focus branch. Before switching, checkpoint exact revision, status, output/partial state, evidence, checks not run, contradictions, cleanup, invalidations, and next safe action.

### Shared contracts and invalidation

A branch may not independently redefine parent-level terminology, owner, schema meaning, ABI, identity, units, ranges, resource budgets, compatibility promises, device-closure meaning, or acceptance criteria.

When a shared fact must change:

1. pause the branch;
2. preserve evidence;
3. route decision to integration spine/authoritative owner;
4. version accepted parent/contract change;
5. identify every dependent branch/evidence set;
6. mark them invalidated or requiring reconciliation;
7. resume only with updated context.

### Parallelism

Parallel branches require:

- one compatible parent/authority version;
- non-overlapping semantic owners and write surfaces;
- frozen or coordinated shared contracts/generated sources;
- acyclic dependencies;
- independent falsification, acceptance, rollback, and cleanup;
- one integration owner;
- central collision, contradiction, and invalidation reporting.

Branches that repeatedly require one another’s in-progress state are one branch or an explicit atomic group.

### Integration

Parent completion requires more than collecting accepted leaves. The integration spine must reconcile exact outputs/revisions, authority/confidence, assumptions, terminology, ownership, dependencies, units/ranges/precision/identity/versions/memory spaces, lifecycle, publication, failure, recovery, cleanup, contracts, generated forms, persistence, compatibility, security, provenance, resources, performance, and search quality.

Every planned branch is accounted for as integrated, blocked, invalidated, superseded, authoritatively deferred, or removed from scope with a reason. Contradictions and invalidated evidence are resolved or exactly bounded. Boundary and end-to-end validation runs against one exact final revision/artifact.

## Design gate

Before accepting a component or public contract, establish:

1. domain truth, purpose, bounds, and concern weighting;
2. one coherent owner of state, rules, lifecycle, and disposition;
3. LEGO ports, injected dependencies, adapters, and non-responsibilities;
4. justified SOLID internal responsibilities;
5. CUPID implementation quality;
6. domain-appropriate ranges, precision, capacity, identity, and failure;
7. accurate-generality tests;
8. compatibility/evolution and archive/supersession;
9. total-system simplicity including branch coordination and cleanup;
10. decisive validation and revisit triggers.

## Plan execution gate

Before executing a material branch/node:

1. identify exact parent plan/version, focus branch, node, owner, Git branch/environment, and frozen revision;
2. prove dependencies, input revisions, authority, branch sizing, repository/environment, tools, and test/runtime trust;
3. load minimal context and state output, expected effects, acceptance, falsifier, rollback/safe stop, cleanup, integration, and escalation;
4. scan for newly triggered doctrine;
5. prepare only necessary fixtures, checkpoints, generated inputs, instrumentation, and cleanup inventory;
6. apply one coherent operation inside branch write authority;
7. inspect actual effects immediately and compare with expected;
8. falsify locally and reconcile owner, contracts, paths, resources, lifecycle, design, cleanup, and integration consequences;
9. classify `continue`, `accept`, `pause`, `revise`, `rollback`, `fail`, `supersede`, or `integrate`;
10. revise parent plan/invalidate dependents for material deviations;
11. leave no invalid partial state, stale output, abandoned resource, unowned residue, false downstream precondition, or half-active branch without a checkpoint.

## Cleanup gate

Before branch/node/parent acceptance, handoff, PR readiness, merge completion, pause, failure, or abandonment:

1. inventory task-created, temporarily modified, superseded, partial, generated, diagnostic, local, remote, external, sensitive, and coordination state;
2. protect pre-existing/user/shared/authority/evidence/recovery state;
3. assign remove, restore, retain authority/evidence/recovery, archive, quarantine, transfer, supersede, temporary retention with owner/trigger, or protect-unchanged disposition;
4. order cleanup by dependencies;
5. use exact destructive safeguards;
6. verify local workspace/Git, semantic/Git branches, worktrees/stashes, remote PR/issue/review state, processes/ports/containers/device state, credentials/permissions, artifacts/caches/releases, persistence/backups, and external resources through owning systems;
7. archive useful stale material with provenance;
8. create cleanup debt only when immediate cleanup is less safe;
9. update canonical parent/branch/plan/execution/PR/status/handoff records;
10. block completion when residue threatens correctness, security, cost, authority, recovery, or future work.

## Sanity gate

Sanity review branches are specialized semantic focus branches. They follow `SANITY_CHECKING.md` for frozen claims, complete coverage, risk depth, semantic interrogation, full-attention sizing, central reconciliation, findings, invalidation, and cleanup.

Passing review leaves do not prove integrated system coherence.

## PR review and merge gates

A material PR review must account for:

- exact PR/base/head/comparison and review mode;
- complete changed surface and ancestry;
- parent task, focus-branch map, statuses, exact branch outputs, invalidations, and integration evidence;
- authority, assessment, execution fidelity, semantic behavior, boundaries/paths, cleanup, and closure;
- current discussion, requested changes, findings, cleanup debt, and checks for exact head;
- final whole-diff and branch-integration pass.

A head, material base, parent-plan, or shared-contract change invalidates affected review/branch/cleanup evidence.

Immediately before merge, revalidate exact accepted head, target, ancestry/mergeability, required reviews/checks/protection/queue, discussion, issue closure, semantic/Git branch/worktree disposition, dependent work, cleanup debt, and conflicts. Use expected-head protection. Never force-update target or bypass gates.

After merge, verify target SHA/tree, parent/focus-branch integration state, issue/dependent state, local/remote branch/worktree disposition, permissions, artifacts, external resources, and cleanup.

## Reasoning levels

### Routine

Mechanical, reversible, single-owner, directly verifiable work.

### Substantial

Cross-file behavior, public interfaces, dependency changes, multi-step implementation, cross-session work, shared/external cleanup, or bounded multi-branch work.

### Critical

Foundational contracts, component boundaries, CUDA execution, synchronization, memory/layout, JIT/ABI, identity/transpositions/cycles, evaluator/numerics, persistence/security/compatibility, hot paths, repository splits, large multi-owner branch maps, overlapping shared contracts, invalid-intermediate-state execution, destructive cleanup, and full-system claims.

Critical work requires high reasoning and evidence. If these cannot be established, do not edit, decompose, parallelize, delete, or certify the boundary.

## Core workflow

1. Orient.
2. Assess.
3. Adversarially challenge.
4. Decide focus-branching.
5. Research.
6. Design.
7. Specify.
8. Build parent plan/branch map.
9. Execute dependency-ready branches/nodes.
10. Validate branch outputs.
11. Reconcile through integration spine.
12. Clean up.
13. Sanity-check.
14. Author-review exact head.
15. Obtain independent review when triggered.
16. Guarded merge.
17. Verify integration and post-merge cleanup.
18. Reconcile authority/history.
19. Hand off exact next branch/integration boundary.

## Completion

A task is complete only when:

- assessment permits the work and material objections are resolved or bounded;
- required focus-branch map exists and every leaf fits full attention;
- all branches have exact statuses, owners, inputs, outputs, evidence, cleanup, and integration dispositions;
- shared-contract changes and dependent invalidations are reconciled;
- intended result exists and no invalid partial state, stale generated output, unowned residue, or false downstream precondition remains;
- every material branch output is integrated or explicitly blocked/invalidated/superseded/deferred/out of scope with authority;
- contradictions and boundary/end-to-end behavior are reconciled against one exact revision;
- validation, sanity, review, cleanup, and publication claims are no broader than evidence;
- when integrating, exact accepted head is merged and target SHA/tree plus branch/dependent/cleanup effects are verified;
- organization, authority, parent/branch/plan/execution/cleanup state, manifests, registry, findings, and archive agree;
- remaining work is explicit in `next_step.yaml`, a branch packet, or justified cleanup debt.

## Source and claim discipline

Never present:

- a plan or branch-local conclusion as project authority;
- `accepted` as `integrated`;
- a Git branch name as a semantic work contract;
- an inference as measurement;
- a proposal as accepted;
- sampled review as full coverage;
- author-side review as independent approval;
- a stale-head approval as current;
- a local commit as published remote state;
- a merge response as verified integration/cleanup;
- a cleanup command as verified final state.
