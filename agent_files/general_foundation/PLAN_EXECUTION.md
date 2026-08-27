# Governed Plan Execution

**Scope:** Implementation of material plan nodes in research, experiments, specifications, architecture, production code, performance work, debugging, migration, sanity remediation, packaging, release, and governance.

## Purpose

A plan is a working hypothesis about how verified current state can become a testable desired state. It is not project authority, proof that its assumptions remain true, or permission to improvise around specifications.

Agents commonly fail in two opposite directions:

- **mechanical execution** — following stale plan wording after authority, evidence, ownership, or risk has changed;
- **improvised execution** — treating the plan as optional, making locally convenient changes, and explaining divergence afterward.

The governing rule is:

> Execute only a dependency-ready node under current authority. Preserve the node’s intended outcome, ownership, invariants, and accepted design; state expected effects and the cheapest falsifier before acting; inspect actual effects immediately; reconcile material consequences; and pause, revise, rollback, or fail when the execution model becomes false.

Trustworthy implementation is faithful to the intended result and governing authority—not blindly faithful to stale wording and not free-form invention.

## Relationship to authority

Plans organize work beneath the project authority order. They cannot override:

- explicit current owner direction;
- accepted ADRs and specifications;
- public contracts and schemas;
- component ownership and dependency direction;
- executable invariants and acceptance tests;
- security, persistence, compatibility, memory, concurrency, and release rules.

When a plan conflicts with higher authority:

1. stop the affected node;
2. preserve the exact plan version, revision, conflict, and evidence;
3. determine whether the plan is stale, authority must be amended, or the task was misunderstood;
4. return to assessment, specification, architecture, research, or experiment as appropriate;
5. publish a revised plan or authoritative decision before dependent execution resumes.

Do not silently choose whichever source makes implementation easiest.

## When an execution record is required

Routine, reversible, single-session work may execute directly from a clear issue, plan, or PR when ownership, preconditions, acceptance, and rollback are unambiguous.

Use one durable plan-execution record when one or more are true:

- execution crosses sessions, windows, agents, components, or operators;
- several operations must form one valid state transition;
- intermediate states can be invalid or externally visible;
- evidence gates later decisions;
- the node changes public contracts, schemas, persistence, compatibility, security, concurrency, memory layout, JIT/ABI, or hot paths;
- interruption or recovery would otherwise require reconstructing state;
- another consumer needs operation-level evidence.

Do not create a second history when the issue or combined assessment/plan can hold the unique execution state. Link authority and evidence rather than duplicating them.

Use [`../templates/plan-execution.template.yaml`](../templates/plan-execution.template.yaml) only when a durable record is justified.

## Node execution contract

Before implementation, the active plan node identifies:

- plan record, plan version, and stable node ID;
- selected operating mode and owner;
- exact outcome or truth to establish;
- governing authority and frozen source revisions;
- coherent ownership boundary and organizational home;
- preconditions and required dependency outputs;
- scope, non-goals, and prohibited actions;
- expected local and material wider effects;
- expected outputs and downstream consumers;
- invariants, resource limits, failure behavior, and compatibility obligations;
- acceptance criteria and the cheapest decisive falsifier;
- broader reconciliation and validation;
- rollback, recovery, or supersession path;
- stop and escalation conditions;
- material assumptions, unknowns, contradictions, and accepted risks.

A node that cannot state these facts is not implementation-ready. Return to assessment and planning rather than inventing them during code changes.

## Readiness proof

A node may enter execution only when the applicable conditions below are supported by evidence.

### Plan readiness

- The plan version is current.
- The node is explicitly `ready`, not merely listed.
- Every dependency is complete or explicitly waived by current authority.
- Dependency outputs and revisions match what the node expects.
- Downstream output contracts are known.
- The node belongs to one coherent owner or an explicitly coordinated atomic group.
- No later node is being implemented early merely because its files are convenient to edit.

### Authority readiness

- Relevant doctrine, ADRs, specifications, contracts, schemas, manifests, and tests are identified.
- No unresolved authority contradiction affects the node.
- Behavioral implementation has accepted specification authority, or producing that authority is the node’s explicit purpose.
- Required identity, migration, compatibility, security, provenance, resource, and release decisions already exist or are authorized outputs of this node.

### Repository and environment readiness

- The exact branch, head revision, worktree state, generated inputs, model/profile, toolchain, driver, and hardware assumptions are known where material.
- Unrelated work is protected.
- Required tools and dependencies are available.
- Test/runtime state is trustworthy rather than contaminated by stale processes, ports, caches, generated output, or partial migrations.
- The available transport can produce the intended coherent change safely.

### Operational readiness

- The first operation is reversible, bounded, or explicitly authorized as irreversible.
- Invalid partial state cannot silently become public or authoritative.
- The falsifying and acceptance checks can actually be run, or their absence is an explicit blocker.
- Required backup, checkpoint, feature gate, rollback handle, or recovery prerequisite exists when triggered.
- Resource budgets and saturation behavior are known where the node can affect them.

A completed checkbox without supporting evidence is not readiness proof.

## Trigger scan before mutation

The plan may have omitted a concern that becomes visible only at execution time. Before the first material operation, scan for triggered doctrine and specifications.

Ask whether the node affects:

- component ownership, public contracts, or dependency direction;
- reusable naming or maximum accurate generality;
- foundational units, ranges, widths, precision, identity, capacity, or layout;
- persistence, versioning, migration, compatibility, rollback, or recovery;
- concurrency, publication, atomics, cancellation, wakeups, progress, or stale references;
- security, trust, native capabilities, executable schemas, credentials, or privacy;
- provenance, third-party material, generated artifacts, cache identity, JIT, or ABI;
- performance, device memory, synchronization, occupancy, batching, or search quality;
- graph identity, transpositions, cycles, paths, backup, rerooting, or output ranking;
- evaluator capabilities, shapes, perspective, numerics, workspace, or resident lifetime;
- system-wide sanity, independent review, packaging, installation, or release.

Record material triggers and load their owning doctrine. Applying only the rules named by the original plan is insufficient when execution reveals more.

## Controlled execution cycle

Execute each material node through the cycle below.

### 1. Orient

Load only the current node packet and necessary context:

- objective and acceptance criteria;
- authority and exact revisions;
- dependency outputs;
- local anchors and material consequence horizon;
- scope, non-goals, and prohibitions;
- rollback and stop conditions.

Do not reconstruct the task from memory or blend in unrelated future nodes.

### 2. Preflight

Prove readiness and perform the trigger scan.

Before acting, write:

- expected local effects;
- expected wider effects on contracts, callers, artifacts, resources, and lifecycle;
- expected state transition;
- cheapest decisive falsifier;
- rollback or safe-stop action;
- conditions that would require plan revision.

### 3. Prepare

Create only the prerequisites needed to make unsafe execution difficult:

- isolated fixtures or experiments;
- backups, snapshots, checkpoints, feature gates, or rollback handles when triggered;
- authoritative generated inputs and deterministic regeneration commands;
- bounded instrumentation tied to a real question;
- clean test/runtime state;
- confirmation that no other operation is mutating the same authoritative surface unexpectedly.

Preparation must not create a competing source of truth.

### 4. Apply one coherent operation

Perform the smallest ownership-sized operation that advances the node while leaving a valid, testable state.

“Smallest coherent” does not mean one file or fewest lines. One operation may require coordinated changes to an owner, public contract, adapter, tests, generated forms, migration, and documentation when those changes represent one indivisible truth transition.

Do not mix unrelated cleanup, speculative future work, or another plan node into the operation.

### 5. Inspect actual effects immediately

After each meaningful operation, inspect and record:

- actual changed files, symbols, schemas, artifacts, device/host state, or external resources;
- actual local and wider effects;
- differences from expected behavior;
- new warnings, failures, contradictions, owners, consumers, or scale implications;
- whether rollback remains valid;
- whether the frozen head or dependency assumptions changed.

Do not wait until the end of a large node to discover that its first assumption failed.

### 6. Falsify locally

Run the cheapest check capable of disproving the operation, such as:

- syntax, type, schema, layout, or ABI validation;
- focused unit, contract, property, or reference test;
- expected-before-actual boundary trace;
- targeted sanitizer or race check;
- artifact, cache-key, migration, or package inspection;
- focused benchmark or profiler measurement;
- security, provenance, or policy check.

A passing local check permits continued execution. It does not prove node or system completion.

### 7. Reconcile material consequences

Reconcile the operation upward through:

- owning component and authoritative state;
- callers, callees, producers, consumers, and public contracts;
- units, ranges, precision, identity, memory spaces, versions, ordering, and failures;
- generated artifacts and cache identity;
- affected runtime and end-to-end paths;
- persistence, compatibility, security, concurrency, resources, performance, diagnostics, packaging, and release where triggered;
- LEGO, SOLID, CUPID, domain-appropriate foundations, maximum accurate generality, and total-system simplicity.

Analytical scope may widen to understand consequences. Edit scope remains bounded until a revised plan authorizes expansion.

### 8. Classify the operation outcome

Use one explicit outcome:

- `continue` — assumptions remain valid and the next operation is ready;
- `accept` — node objective and acceptance evidence are complete;
- `pause` — evidence, permission, or an external decision is required;
- `revise` — the assessment, design, node contract, sequence, or plan version must change;
- `rollback` — partial work is invalid or unsafe;
- `fail` — the node cannot achieve its objective under current constraints;
- `supersede` — another node or approach replaces it.

Do not default to `continue` when evidence is uncertain.

### 9. Update durable execution truth

When durable state is needed, record only facts that changed:

- operations performed and exact evidence;
- accepted outputs and revisions;
- expected-versus-actual differences;
- variations, deviations, and their classification;
- checks run and checks not run;
- local and wider conclusions;
- current partial, rollback, or irreversible state;
- changed assumptions, unknowns, contradictions, and risks;
- node statuses and downstream effects;
- next executable or analytical node.

Do not maintain a narrative activity log that another consumer does not need.

## Operation sizing

An operation is correctly sized when:

- it has one owned objective and one validity transition;
- expected and actual effects can be compared immediately;
- the cheapest falsifier is focused and runnable;
- rollback or safe stop is understandable;
- material callers and boundaries can be reconciled before context degrades;
- completion does not leave an invalid partial state.

Split an operation when it mixes independent owners, unrelated outcomes, incompatible rollback boundaries, or too much mechanism for immediate inspection. Combine edits when separating them would expose an invalid public contract, schema, migration, generated artifact, or ownership transition.

## Plan fidelity and deviation

Execution preserves the node’s outcome, authority, owner, scope, invariants, acceptance, and downstream contract. It need not preserve a literal action whose assumptions have become false.

### Non-material variation

A variation may remain within the current node when it:

- preserves the same outcome, owner, authority, and scope;
- does not change public behavior, risk, consequence horizon, acceptance, rollback, or downstream outputs;
- remains covered by the same validation;
- does not introduce a new component, dependency direction, schema meaning, resource model, or specialist trigger.

Record the variation when it matters to review or continuation.

### Material deviation

Stop and revise the plan when execution changes or discovers:

- the problem or root-cause model;
- the authoritative owner or state;
- component, public contract, schema, ABI, or dependency direction;
- material consequence horizon or intended equivalence class;
- resource, pressure, concurrency, security, migration, recovery, or performance obligations;
- required operating mode or specialist doctrine;
- node outputs, dependencies, acceptance criteria, rollback, or downstream ordering;
- work outside declared scope;
- evidence that the chosen approach is unsound or unnecessarily complex.

A useful discovery is not permission for silent scope expansion. Preserve it, update assessment/authority as needed, issue a new plan version, and invalidate dependent nodes whose assumptions changed.

## Coordinated and atomic work

When several operations must become valid together, define:

- atomic group owner and participants;
- valid pre-state and post-state;
- intermediate states and whether they may be externally visible;
- operation order and publication point;
- migration/checkpoint/feature-gate requirements;
- rollback boundary and recovery for each intermediate state;
- acceptance evidence and observability;
- downstream consumers that must not run early.

Do not mark individual operations accepted while the system remains in an invalid partial state.

Before an irreversible operation:

- verify exact authority and target identity;
- exhaust safe falsifying checks;
- establish required recovery evidence or checkpoint;
- state the point of no return;
- confirm downstream readiness;
- verify the resulting local, remote, persisted, and external state immediately.

## Parallel execution

Parallel plan execution is allowed only when:

- nodes are dependency-ready against one recorded plan version and compatible frozen revisions;
- primary ownership and write surfaces do not overlap;
- shared contracts and generated sources are frozen or explicitly coordinated;
- each node has independent acceptance and rollback;
- one integration owner reconciles outputs, contradictions, boundary effects, and final head state;
- changes to a shared assumption invalidate affected parallel work explicitly.

Do not parallelize simply because several files exist. Do not let two agents mutate the same authoritative state, schema, component boundary, or generated source concurrently without an atomic coordination plan.

## Failure, interruption, and recovery

On pause or failure:

1. stop creating new state;
2. preserve decisive evidence and the exact revision;
3. classify every material partial state as valid, invalid, quarantined, recoverable, or irreversible;
4. contain or restore unsafe state;
5. preserve triggered rollback/recovery prerequisites;
6. release resources no longer needed;
7. invalidate downstream nodes whose preconditions are no longer true;
8. update the canonical plan/issue with the exact blocker and next safe action.

Do not abandon a half-applied contract, migration, generated artifact, device allocation, background process, branch, credential, or external resource.

## CUDA-MCGS-specific execution obligations

A CUDA-MCGS plan node must not silently introduce:

- a game-, board-, player-, zero-sum-, action-width-, state-size-, evaluator-, tree-, or GPU-specific assumption into universal contracts;
- host-produced intermediate decisions after active-search ignition;
- evaluator weights, code, or required workspace that are not resident as promised;
- unplanned device allocation or unbounded queues/arenas/tables in active search;
- undefined transposition, history, cycle, node/edge, backup, reroot, or output semantics;
- widths, alignment, precision, or capacities derived only from the first domain or GPU;
- schema/JIT/cache/ABI identities that omit material toolchain, driver, architecture, model, adapter, or resource-profile inputs;
- performance claims without semantic, search-quality, resource, and stopping equivalence.

When a node touches these boundaries, its acceptance evidence must directly exercise them.

## Validation and node acceptance

A material node is accepted only when:

- the intended outcome is established rather than merely attempted;
- every acceptance criterion has exact evidence;
- expected and actual effects are reconciled;
- the cheapest falsifying checks passed or their contrary result was handled;
- required component, contract, boundary, end-to-end, and lifecycle validation passed;
- authority, specifications, contracts, implementation, tests, generated artifacts, persistence, and packaging agree where applicable;
- failure, pressure, cancellation, rollback, recovery, and observability are demonstrated at the required depth;
- changed semantic units received proportional self-sanity;
- material checks not run and claim limits are explicit;
- no unresolved contradiction, hidden partial state, competing authority, stale generated output, or abandoned resource remains;
- downstream nodes receive the exact outputs and revisions they expect.

Completion is an evidenced state transition, not a count of edited files or passing checks unrelated to the mechanism.

## Handoff and continuation

A continuation-ready handoff records:

- plan record/version/node and execution status;
- frozen revision and current branch/worktree state;
- authority snapshot and readiness evidence;
- operations completed and current partial state;
- expected versus actual effects;
- accepted outputs and revisions;
- variations, deviations, reassessments, and invalidated nodes;
- validation, sanity evidence, and checks not run;
- rollback, recovery, or irreversible state;
- material local findings and wider consequences;
- downstream updates, blockers, and next executable node.

A new agent must be able to continue without reconstructing chat history or guessing whether partial state is safe.

## Prohibited execution patterns

- Following stale plan wording after authority or evidence changes.
- Treating the plan as optional and justifying divergence afterward.
- Beginning a node because its files are convenient while dependencies are incomplete.
- Editing before expected effects, falsifier, and rollback/safe-stop are understood.
- Applying many operations before inspecting the first actual effect.
- Marking a node complete because code compiles or tests unrelated to the claimed mechanism pass.
- Weakening tests, assertions, budgets, or safeguards to obtain acceptance.
- Hiding scope expansion inside cleanup or refactoring.
- Leaving invalid intermediate state for another agent to infer or repair.
- Using CI as the first debugger for errors detectable locally.
- Allowing parallel agents to mutate the same authority without coordination.
- Duplicating plan, issue, execution, PR, and handoff histories.
- Claiming completion or publication beyond exact evidence.

## Completion

Plan implementation is complete when:

- every accepted node is supported by readiness and acceptance evidence;
- dependencies and outputs match exact revisions;
- material deviations were revised rather than hidden;
- no invalid partial state or abandoned resource remains;
- authority, implementation, tests, generated artifacts, documentation, manifests, registry, and downstream plan state are reconciled;
- required self-sanity or independent review is complete;
- temporary execution state is removed or intentionally owned;
- the final diff and repository state are intentional;
- publication and target-branch state are verified when publication is part of the plan;
- remaining blockers and the next coherent boundary are explicit.
