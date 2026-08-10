# ADR-0009: Governed Plan Execution

**Status:** Accepted

**Date:** 2026-08-10

## Context

A sound plan can still be implemented badly. Agents may follow stale wording after evidence changes, improvise outside the accepted boundary, begin nodes before dependencies are ready, batch too many operations before inspecting actual effects, or mark completion while invalid partial state and downstream contradictions remain.

UMCGS will eventually combine schemas, generated specialization, CUDA Driver integration, device-resident graph search, evaluator execution, finite GPU-memory planning, compatibility, packaging, and release processes. Plan execution therefore needs an explicit discipline that preserves authority and design while allowing evidence-driven revision.

The project owner directed UMCGS to teach agents how to implement a plan. This decision adapts the mature governed-execution method from Ars Thaumaturgica.

## Source adaptation

The UMCGS doctrine is adapted from:

- `iteathen/Ars-Thaumaturgica` commit `c3e25ad1032a1927c9709580fb415ffc48b91020`;
- `docs/foundation/governed-plan-execution.md`;
- `.agents/operating-kernel.md`;
- `.agents/roles/implementer.md`;
- `.agents/templates/plan-execution.yaml`;
- `docs/foundation/development-phases-and-validation.md`.

UMCGS adds explicit universal-contract, generated-specialization, device-closure, finite-memory, graph/search, evaluator, JIT/ABI, and search-quality obligations. The adapted UMCGS files are authoritative here; Ars Thaumaturgica is provenance rather than a dependency.

## Decision

UMCGS adopts governed plan execution for every material plan node.

A plan is a hypothesis under current authority. It does not override accepted ADRs, specifications, contracts, schemas, ownership, executable invariants, or triggered security/resource/lifecycle rules.

An agent may execute a plan node only after proving that:

- the plan version and node are current and explicitly ready;
- dependencies and expected dependency revisions are satisfied;
- authority and ownership are clear and non-contradictory;
- repository, environment, generated inputs, model/profile, and toolchain state are trustworthy;
- expected local and wider effects, acceptance, the cheapest decisive falsifier, rollback/safe stop, and material stop conditions are known;
- invalid partial state is contained;
- required specialist gates and resource behavior are understood.

Each material node is implemented as a sequence of coherent ownership-sized operations. For every operation, the agent must:

1. state expected local and wider effects before mutation;
2. state the cheapest decisive falsifier and rollback/safe stop;
3. perform one coherent action;
4. inspect exact actual effects immediately;
5. compare expected and actual;
6. run the focused falsifier;
7. reconcile affected owners, contracts, callers, generated forms, runtime paths, resources, lifecycle, and design principles;
8. classify the outcome as continue, accept, pause, revise, rollback, fail, or supersede;
9. update durable execution truth only when it materially changed.

Execution preserves the node’s intended outcome, authority, owner, scope, invariants, acceptance, and downstream contract. A non-material variation may remain inside the node. A material change to cause, owner, public contract, schema, ABI, dependency direction, consequence horizon, resource model, risk, acceptance, rollback, output, or downstream order requires plan revision and invalidation of affected nodes.

Coordinated operations that form one valid state transition must declare valid pre/post states, intermediate visibility, order/publication, rollback/recovery, acceptance, and downstream gating. Individual operations may not be marked complete while the system remains invalid.

Parallel execution is permitted only for dependency-ready nodes with non-overlapping primary ownership and write surfaces, compatible frozen revisions, independent acceptance/rollback, and one integration owner.

## Proportional record policy

Routine reversible single-session execution does not require a standalone execution ledger when the issue, plan, or PR already carries the necessary truth.

Use one plan-execution record for cross-session, coordinated, high-consequence, invalid-intermediate-state, evidence-gated, or multi-agent execution. Link existing authority and evidence rather than copying them. Narrative activity logs and duplicate issue/plan/execution/PR/handoff histories are prohibited.

The authoritative files are:

- `agent_files/general_foundation/PLAN_EXECUTION.md`;
- `agent_files/templates/plan-execution.template.yaml`.

## UMCGS-specific consequences

Plan execution may not silently introduce:

- first-domain assumptions into universal contracts;
- host-produced intermediate decisions after active-search ignition;
- unplanned device allocation or unbounded active-search structures;
- undefined identity, transposition, cycle, backup, reroot, evaluator, or output semantics;
- widths, precision, alignment, or capacities derived only from the first workload or GPU;
- incomplete generated-engine/cache identity;
- performance claims without semantic, search-quality, resource, and stopping equivalence.

Nodes touching these boundaries require direct acceptance evidence.

## Consequences

- Agents must distinguish a ready node from a merely listed task.
- Expected effects and falsifiers are written before mutation rather than after failure.
- Actual effects are inspected after each coherent operation rather than at the end of a large batch.
- Material deviation causes reassessment and a new plan version rather than silent scope expansion.
- Invalid partial state, abandoned resources, and stale downstream assumptions block acceptance.
- Completion is an evidenced state transition, not a file count or unrelated passing test.
- Plan execution remains proportional and does not create mandatory paperwork for routine work.
- Exact-head PR review and guarded merge remain separate downstream integration gates under ADR-0008.

## Alternatives considered

### Follow the plan literally

Rejected. Plans can become stale when evidence, authority, dependencies, or risk changes.

### Let agents improvise within the objective

Rejected. This hides ownership, contract, resource, and scope changes until after implementation.

### Validate only after the entire plan is implemented

Rejected. Early false assumptions can contaminate many later operations and make rollback expensive.

### Require a full execution record for every task

Rejected as administrative overhead. The record is required only when another consumer, coordination boundary, or consequence justifies it.

### One file or one commit per plan step

Rejected. Coherent validity transitions often cross several files, while one file may contain several independent owners or operations.

## Validation

A conforming material execution must show:

- plan version, node ID, owner, authority, frozen revision, dependencies, and readiness evidence;
- expected effects, falsifier, rollback/safe stop, and stop conditions before each material operation;
- exact actual effects and expected-versus-actual comparison;
- focused falsification and broader reconciliation;
- classified variations and deviations;
- no invalid partial state or abandoned execution-created resource;
- acceptance evidence for every node criterion;
- exact downstream outputs and revisions;
- required self-sanity or independent review;
- checks not run and claim limits.

Agent routing, validation policy, review guidance, issue/PR templates, plan templates, status, indexes, and governance checks must link to this doctrine.

## Revisit triggers

Revisit when the discipline creates repeated low-value accounting, agents still execute stale or unready nodes, operation sizing causes context drift, material deviations escape classification, or partial-state failures recur. Changes must preserve authority-first readiness, expected-before-actual execution, immediate inspection, evidence-driven deviation handling, and no-invalid-partial-state acceptance.
