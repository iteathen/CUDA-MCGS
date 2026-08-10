# Focus-Branch Decomposition and Integration

**Scope:** Large, complex, high-consequence, cross-session, cross-agent, or multi-owner research, assessment, design, specification, implementation, debugging, migration, sanity, release, and cleanup work.

## Purpose

A large task can exceed the amount of mechanism, authority, dependency state, risk, and consequence that one agent can hold with full attention at once. Two predictable failures follow:

- **broad shallow work** — the agent keeps the whole task nominally in scope but skims details, silently samples surfaces, forgets constraints, and misses local failures;
- **fragmented local work** — the agent solves isolated pieces without preserving shared meaning, dependency order, or system-wide integration.

The governing rule is:

> Keep one canonical parent task and integration spine, then partition the work into semantic focus branches small enough for full attention. Give each branch an explicit contract, dependencies, output, evidence, and consequence horizon. Reconcile branch outputs centrally before claiming the parent task complete.

A focus branch is a reasoning and work boundary. It is **not automatically a Git branch**, issue, PR, component, or document.

## Core terms

### Parent task

The canonical work item that owns:

- the final outcome and closure criteria;
- governing authority and exact current revision;
- global invariants, vocabulary, constraints, and non-goals;
- the focus-branch map and dependency graph;
- the integration owner and integration spine;
- cross-branch contradictions, invalidation, cleanup, and final acceptance.

### Focus branch

A bounded semantic workstream with one primary question, outcome, owner, context packet, output contract, evidence boundary, and integration obligation.

A focus branch may perform research, make a design decision, specify a contract, implement one owner boundary, trace an end-to-end path, investigate one risk, validate a result, or perform cleanup.

### Leaf focus branch

A branch small and coherent enough to execute or review directly with full attention. Organizing parent branches may group leaves, but detailed work occurs in leaves.

### Integration spine

The parent-controlled path that preserves shared meaning and reconciles branch outputs. It owns no arbitrary catch-all implementation. It owns the parent task’s cross-branch contracts, dependency state, contradictions, final end-to-end evidence, and closure decision.

### Git branch

An optional transport and isolation mechanism. A semantic focus branch may use a Git branch when parallel changes, review, experimentation, or rollback isolation requires it. The terms are not interchangeable.

## When focus branches are required

Create a focus-branch map before deep execution when one or more are true:

- one agent cannot retain the task’s objective, authority, mechanism, dependencies, risks, and material consequence horizon in one focused session;
- the task has multiple semantic owners, public contracts, runtime paths, artifact families, or lifecycle stages;
- independent unknowns require separate research, experiments, or decisions;
- portions require materially different specialist reasoning, validation, rollback, or security treatment;
- execution crosses agents, sessions, windows, teams, repositories, or external operators;
- work can or should proceed in parallel;
- a large diff or surface would otherwise require sampling, skimming, or deferring material details;
- a failure in one area should invalidate only a bounded part of the work;
- system-wide acceptance requires reconciling several locally valid results.

Do not force focus branches onto routine, reversible, single-owner work that fits one coherent operation and one focused validation cycle.

## Establish the parent before splitting

Before creating branches, record the parent task’s:

1. exact outcome and closure evidence;
2. authority, plan version, frozen revision, and current-state trust;
3. global invariants, shared terminology, units, ranges, identity rules, resource limits, and compatibility promises;
4. included and excluded surfaces;
5. owners, consumers, dependencies, critical paths, and external state;
6. material risks and consequence horizon;
7. integration owner and integration-spine responsibilities;
8. global validation, cleanup, and post-integration requirements;
9. rules for changing shared assumptions and invalidating branches.

If these cannot be stated, return to assessment rather than using decomposition to hide an undefined problem.

## Build the focus-branch map

Partition by semantic ownership and integration need, not equal file counts or arbitrary size.

Useful branch types include:

- **evidence branch** — establish one factual question, prior-art result, benchmark, or platform constraint;
- **decision branch** — resolve one architectural or policy choice and its alternatives;
- **owner branch** — one component, authoritative state owner, or lifecycle owner;
- **contract branch** — one public schema, ABI, producer/consumer boundary, or adapter contract;
- **path branch** — one end-to-end data, control, failure, recovery, or cleanup path;
- **risk branch** — one cross-cutting concern such as security, concurrency, persistence, finite memory, performance, provenance, or compatibility;
- **implementation branch** — one coherent owned validity transition;
- **validation branch** — one conformance, differential, stress, benchmark, sanity, or release-readiness claim;
- **cleanup branch** — one delayed, external, sensitive, or dependency-gated disposition boundary;
- **integration branch** — reconcile shared definitions, outputs, contradictions, and final behavior.

These are classification aids, not mandatory paperwork. One leaf may combine closely coupled types when one owner, one output, one evidence set, and one focused session still govern it.

## Full-attention sizing rule

A leaf focus branch is small enough only when one qualified agent can hold, without sampling or skimming:

- its primary question and exact desired output;
- authority, owner, scope, exclusions, and change permissions;
- inputs, dependencies, consumers, and downstream obligations;
- local mechanism, state, identity, lifetime, ordering, and resource behavior;
- normal, pressure, failure, cancellation, recovery, and cleanup behavior;
- applicable design principles and specialist rules;
- decisive falsifier, acceptance evidence, and material consequence horizon;
- the exact information the integration spine must receive.

Split a branch when:

- it contains more than one primary semantic owner;
- unrelated questions, contracts, paths, or artifact families are mixed;
- the agent would need to sample, skim, postpone, or repeatedly reload material context;
- different parts need incompatible validation, rollback, security, or cleanup boundaries;
- one part can change without invalidating evidence for the rest;
- findings or outputs cannot be assigned to a clear owner;
- local mechanism and wider consequence cannot remain active in context together;
- parallel execution would create write collisions or hidden shared assumptions.

Do not split solely by file count, line count, calendar time, or token count. A short allocator, migration, publication protocol, or ABI rule may need its own critical branch. A large declarative surface may remain one branch when one owner, contract, and evidence set govern it.

Combine branches when separating them would:

- expose an invalid intermediate contract or migration state;
- duplicate the same authority and mechanism across several packets;
- require constant cross-branch coordination to make any result meaningful;
- divide one indivisible owner or validity transition;
- prevent independent acceptance or rollback.

## Focus-branch contract

Every material leaf states:

- stable branch ID and parent task/plan version;
- branch type, status, primary owner, and integration owner;
- one primary question or outcome;
- exact authority and frozen source/input revisions;
- minimal context packet and local anchors;
- scope, non-goals, exclusions, and prohibited changes;
- global invariants it must preserve;
- dependencies and exact expected inputs;
- write surface and ownership permissions;
- expected output contract and downstream consumers;
- acceptance criteria and cheapest decisive falsifier;
- broader consequence and reconciliation obligations;
- rollback, recovery, invalidation, and cleanup rules;
- handoff requirements.

A branch that cannot state its output and integration contract is not ready.

Use these statuses consistently:

- `planned` — identified but not dependency-ready;
- `ready` — contract complete and dependencies satisfied;
- `active` — one owner is executing it;
- `paused` — intentionally stopped with continuation state;
- `blocked` — missing authority, evidence, dependency, access, or decision;
- `accepted` — local output and evidence satisfy the branch contract;
- `invalidated` — a shared assumption, input, revision, or dependency changed;
- `superseded` — replaced by another branch or parent-plan version;
- `integrated` — accepted output was reconciled into the parent result;
- `archived` — historically retained but no longer active.

`accepted` is not the same as `integrated`.

## Minimal context packet

Load the smallest context that permits sound work:

- parent objective and branch-specific question;
- exact authority and revisions;
- global invariants relevant to the branch;
- dependency outputs and shared definitions;
- local files, symbols, schemas, artifacts, runtime paths, or external identifiers;
- expected output, falsifier, acceptance, cleanup, and handoff;
- material consequence horizon and prohibited scope expansion.

Do not load the entire project merely because it exists. Do not omit shared invariants merely to make the packet small. Context is selected by consequence, not convenience.

When the parent or another branch changes a shared fact, update the context packet and invalidate affected evidence explicitly.

## Branch execution discipline

Normally, one agent owns one active focus branch at a time.

Within a branch:

1. prove readiness against the current parent plan and dependency revisions;
2. write expected effects and the cheapest decisive falsifier;
3. execute coherent operations under the branch’s owner and write boundary;
4. inspect actual effects immediately;
5. preserve evidence, contradictions, and cleanup state;
6. stop at the branch boundary when a new owner or shared contract is reached;
7. escalate material cross-branch discoveries to the integration spine;
8. conclude with exact output, evidence, limits, cleanup, and downstream effects.

Do not fix an adjacent branch merely because its problem is visible. Analytical scope may widen; edit scope remains governed.

Before switching branches, leave a continuation checkpoint containing exact revision, current status, accepted outputs, partial state, checks run/not run, cleanup state, changed assumptions, and next safe action. Do not keep several half-active branches in one agent’s memory.

## Shared contracts and invalidation

A focus branch may not silently redefine a parent-level term, owner, schema meaning, ABI, identity rule, unit, range, resource budget, compatibility promise, or acceptance criterion.

When a branch discovers that a shared contract must change:

1. pause the affected branch;
2. preserve the evidence and proposed change;
3. route the decision to the integration spine or authoritative owner;
4. issue a new parent/contract version when accepted;
5. identify every branch whose inputs or conclusions depend on the changed fact;
6. mark affected branches/evidence `invalidated` or `needs_reconciliation`;
7. resume only with updated context packets.

Do not let each branch independently “adapt” to shared-contract drift.

## Parallel focus branches

Parallel execution is allowed only when:

- every branch is ready against one compatible parent-plan and authority version;
- primary semantic owners and write surfaces do not overlap;
- shared contracts, schemas, generated sources, and vocabulary are frozen or explicitly coordinated;
- dependencies are acyclic and no branch consumes an unaccepted sibling output;
- each branch has independent falsification, acceptance, rollback, and cleanup;
- one integration owner receives all branch outputs;
- collisions, contradictions, and invalidation are reported centrally;
- branches do not create competing authority or duplicate the same root cause.

Parallelism is not justified by a large file count. If two branches repeatedly need each other’s in-progress state, they are probably one branch or require an explicit atomic group.

## Integration spine and branch reconciliation

The parent task is not completed by collecting locally accepted branches. The integration spine must reconcile them.

For every accepted branch, verify:

- exact output and source revision;
- authority and confidence;
- assumptions, exclusions, and claim limits;
- terminology and shared semantic meaning;
- ownership and dependency direction;
- units, ranges, precision, identity, versions, and memory spaces;
- lifecycle, ordering, publication, failure, recovery, and cleanup;
- public contracts, generated forms, caches, persistence, compatibility, and provenance;
- resource budgets and performance/search-quality equivalence;
- downstream branch and end-to-end path effects.

Reconciliation is synthesis, not concatenation. Two individually plausible branches may contradict each other or compose into an invalid system.

The integration spine must:

1. account for every planned branch as integrated, blocked, invalidated, superseded, deferred with authority, or removed from scope with a reason;
2. resolve or preserve contradictions explicitly;
3. rerun affected branch evidence after shared changes;
4. execute boundary and end-to-end validation that no leaf could prove alone;
5. reconcile documentation, registry, generated artifacts, plan state, PRs, branches, and cleanup;
6. prove the parent closure criteria against one exact final revision or artifact.

## Mapping focus branches to Git and GitHub

A focus branch is semantic. Create a Git branch only when it protects a real need such as:

- isolated implementation or rollback;
- parallel non-overlapping work;
- an experiment that must not contaminate the integration branch;
- independent review or transport;
- stacked dependencies with explicit bases;
- a release, migration, audit, or recovery boundary.

Rules:

- record the exact base commit and parent focus-branch ID;
- follow repository branch naming and protection policy;
- do not create one Git branch, PR, issue, document, or worktree per file or trivial operation;
- one Git branch may carry several sequential focus branches when they form one coherent PR and do not need independent review or rollback;
- one focus branch may complete without a Git branch when it produces a decision, evidence, or direct reversible result;
- stacked Git branches must declare dependency order and must not be merged out of order;
- after verified integration or abandonment, remove task-owned local/remote branches and worktrees when no review, stack, audit, release, recovery, or provenance dependency remains;
- preserve PR and issue history; make current state truthful rather than deleting history.

Git topology must not become the task architecture.

## Rebranching and plan evolution

The branch map is allowed to change when evidence reveals the true shape of the task.

- **Split** a branch when full attention or independent acceptance is no longer possible.
- **Combine** branches when they are one indivisible owner or validity transition.
- **Supersede** a branch when a better approach replaces it.
- **Add** a branch when a newly discovered material owner, risk, path, or cleanup obligation cannot fit an existing branch.
- **Remove from scope** only with parent authority and an explanation of why the parent result remains valid.

Rebranching creates a new parent-plan version when it changes dependencies, outputs, owners, acceptance, risk, or integration order. Preserve old branch IDs and dispositions for provenance; do not silently rewrite history.

## Focus-branch handoff

A continuation or integration packet contains:

- parent task/plan version and focus-branch ID/status;
- owner, authority, frozen revision, and dependency inputs;
- branch objective, scope, non-goals, and global invariants;
- operations performed and exact changed surfaces;
- accepted output and output revision;
- evidence, falsifiers, checks not run, and claim limits;
- contradictions, cross-branch findings, and changed assumptions;
- partial, rollback, recovery, and cleanup state;
- branches invalidated, unblocked, or made ready;
- exact integration obligation and next safe action.

Another qualified agent should be able to continue without reconstructing chat history or loading unrelated branches.

## UMCGS-specific use

For UMCGS, large framework work commonly needs distinct focus branches for:

- shared Search IR vocabulary and capability envelope;
- domain state/action/transition/history identity;
- graph, transposition, cycle, path, reroot, and reclamation semantics;
- selection, reservation, expansion, backup, proof, stopping, and output policy;
- evaluator capabilities, batching, numerics, perspective, residency, and workspace;
- finite memory plans, pressure states, cancellation, teardown, and device loss;
- schema normalization, generated layouts/code, JIT/linking, ABI, and cache identity;
- synthetic conformance domains and differential/reference evidence;
- host lifecycle, device closure, CUDA capabilities, and completion signaling;
- cross-contract integration and end-to-end search behavior.

This list is illustrative, not an accepted component decomposition. The branch map must follow the current assessment and authority.

## Administrative restraint

- Use one canonical parent task and branch map.
- Keep simple branches as sections in the parent plan or issue.
- Use [`../templates/focus-branch.template.yaml`](../templates/focus-branch.template.yaml) only when a branch crosses sessions/agents, runs in parallel, has high consequence, or needs independent continuation/review.
- Create a separate issue only when owner, deliverable, priority, risk, dependency, or closure is independently meaningful.
- Create a separate PR or Git branch only when isolation, review, transport, rollback, or dependency topology justifies it.
- Link authority and evidence instead of duplicating them into every branch.
- Do not maintain parallel status ledgers. Branch status belongs in the canonical parent map.
- Stop decomposing when every leaf satisfies the full-attention rule and further splitting would add coordination cost without improving correctness or evidence.

## Prohibited patterns

- Calling arbitrary batches or directories “focus branches” without semantic ownership.
- Splitting by equal file count, line count, or agent count.
- Creating many Git branches to simulate organization.
- Allowing branches to redefine shared contracts independently.
- Starting branches before dependencies are accepted.
- Treating locally accepted branches as proof of parent completion.
- Switching branches without a checkpoint.
- Leaving several half-active branches with no owner.
- Fixing adjacent branches through silent scope expansion.
- Parallelizing overlapping write surfaces or authoritative state.
- Hiding contradictions or invalidation to preserve progress.
- Deleting branch history, evidence, or recovery state merely to simplify the map.
- Retaining completed Git branches, worktrees, claims, or artifacts without a dependency or removal trigger.

## Completion

Focus-branch decomposition is complete when:

- the parent objective, authority, invariants, branch map, dependency graph, integration owner, and closure criteria are explicit;
- every leaf satisfies the full-attention sizing rule;
- every branch has a complete contract, status, owner, output, evidence, cleanup, and integration obligation;
- branch inputs and accepted outputs use exact revisions;
- shared-contract changes invalidate dependent work explicitly;
- parallel branches are non-overlapping and centrally coordinated;
- every branch is accounted for and reconciled;
- cross-branch contradictions and global risks are resolved or exactly bounded;
- boundary and end-to-end validation passes against one final revision;
- Git/GitHub and cleanup state are intentional;
- the parent task’s closure criteria are proved rather than inferred from branch completion.
