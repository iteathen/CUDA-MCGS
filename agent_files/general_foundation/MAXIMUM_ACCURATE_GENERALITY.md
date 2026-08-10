# Maximum Accurate Generality

**Scope:** Names and reusable concepts in components, ports, adapters, schemas, identifiers, files, packages, specifications, generated artifacts, tests, configuration, and agent-created architecture.

## Governing rule

> Choose the most general concept and name that remain accurate, functional, bounded, and owned by one coherent invariant.

A concept must not be narrower than its intended substitution class or broader than the truth it can honestly own.

This matters especially for coding agents: names steer repository search, analogies, generated APIs, tests, and assumptions. A first-instance name can repeatedly prompt agents to encode first-instance dimensions and behavior.

## Name the intended equivalence class

Reusable architecture is named for the class it intentionally serves, not the first member encountered.

Examples:

```text
ChessPolicyAdapter             first-instance name
DenseActionProposalAdapter     representation/contract name
ActionProposalAdapter          valid only if all declared proposal modes fit
```

The correct name depends on the actual invariant. Do not broaden the name without broadening the contract and implementation.

## Name the owned invariant or stable function

Prefer names that reveal authority and responsibility.

Avoid naming reusable architecture after:

- the first domain or model;
- the first consumer;
- the first symptom;
- the current algorithm when alternatives preserve the contract;
- an incidental platform detail;
- the design pattern used to implement it;
- the folder in which it was discovered.

Instance names remain appropriate for instance-owned profiles, fixtures, compatibility rules, golden outputs, and benchmarks.

## Maximum generality is not vagueness

Reject empty names such as:

- `Manager`;
- `System`;
- `Common`;
- `Shared`;
- `Generic`;
- `Data`;
- `Util`;
- `Helper`;
- `Processor`;
- `Handler`.

They may appear only when the remaining words state a precise domain and responsibility.

A durable name is:

```text
broad enough to include the intended class
narrow enough to exclude unrelated meanings
specific enough to predict authority, inputs, outputs, and failure
```

## Required tests

### Second-instance test

If a second intended member arrived tomorrow, would the name, contract, ranges, tests, storage, errors, lifecycle, and internal assumptions remain correct without foundational redesign?

The second instance may require configuration, a profile, another adapter implementation, or an extension already allowed by the contract.

### First-consumer deletion test

If the first consumer disappeared, would the concept still have coherent meaning and another valid consumer? If not, it may be consumer-owned rather than foundational.

### Inclusion/exclusion test

State:

- intended members;
- required common invariant;
- permitted variation;
- excluded cases;
- why excluded cases require another layer/contract.

A name unable to define exclusions is probably vague.

## Provisional discovery names

Names created during research/prototyping are hypotheses. Mark them provisional. Repetition in prompts or files does not make them authority.

When the invariant is unclear, prefer a question over a premature noun:

```text
What must be claimed, published, released, and recovered?
```

before inventing `ReservationManager`.

## UMCGS examples

- `ChessNode` is wrong for universal graph storage; `StateNode` may still be too broad unless its exact shared semantics are specified.
- `PolicyValueModel` is wrong for an evaluator contract that may provide proposal-only, value-only, distributional, heuristic, or no neural outputs.
- `CudaGraphScheduler` is wrong for a scheduler contract intended to permit persistent-kernel or other backends.
- `SearchManager` is too vague; separate exact owners such as graph storage, work scheduling, memory planning, or lifecycle composition.

## Agent procedure

Before publishing a reusable concept:

1. State the exact invariant/stable function.
2. State the intended equivalence class.
3. Remove the first domain, consumer, symptom, algorithm, and implementation from candidate names.
4. Generate candidates at several levels of generality.
5. Reject names implying unsupported members.
6. Reject names admitting unrelated meanings.
7. Apply second-instance and first-consumer deletion tests.
8. Define included/excluded cases.
9. Search for an existing owner of the invariant.
10. Mark the name provisional or authoritative.
11. Reinspect code/schema/tests for assumptions inherited from an older narrow name.

Use `agent_files/templates/naming-analysis.template.yaml` for foundational concepts.
