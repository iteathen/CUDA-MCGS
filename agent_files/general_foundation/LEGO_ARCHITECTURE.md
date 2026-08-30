# LEGO Architecture

**Scope:** Macroscopic ownership, composition, replaceability, and lifecycle boundaries.

## Macroscopic universality

At system scale, components are movable bricks. A component should be usable wherever its declared domain contract is satisfied without knowledge of the surrounding application arrangement.

The shell enforces:

- inversion of control;
- explicit ports and adapters;
- narrow stable contracts;
- singular state and mutation ownership;
- explicit configuration and data-driven policy where appropriate;
- isolated platform, compatibility, and external-format details;
- explicit lifecycle, cancellation, failure, and resource ownership;
- independent testing and replaceability.

## Responsibility hierarchy

```text
domain truth and accepted authority
    → LEGO component boundaries
    → SOLID internal responsibilities
    → CUPID implementation quality
    → simplest sufficient total system
```

A locally convenient implementation may not violate an owning boundary. Simplicity cannot override domain truth. SOLID cannot move state ownership across bricks. CUPID cannot justify an idiomatic platform leak into the core.

## What LEGO governs

LEGO determines:

- the coherent responsibility owned by a component;
- the source of truth and allowed mutation paths;
- the public ports and observable effects;
- which dependencies are required and injected;
- which adapters translate unstable external details;
- startup, shutdown, cancellation, and failure boundaries;
- replacement and extraction boundaries;
- component-local validation and conformance.

## What LEGO does not mean

LEGO is not:

- one component per file or class;
- mandatory microservices or repositories;
- runtime virtual dispatch everywhere;
- a generic manager accepting arbitrary callbacks and flags;
- an event bus replacing explicit ownership;
- parameterizing every implementation detail;
- symmetry-driven abstraction;
- speculative interfaces for imagined consumers.

Inside a valid component, simple direct code is preferred.

## Recursive composition and LEGO scale

A LEGO is **encapsulated composition**, not necessarily an atomic leaf. A larger brick may be composed recursively from smaller internal bricks, and those children may themselves contain smaller bricks. The parent owns the externally visible semantic responsibility and contract; child bricks own narrower local invariants, state machines, lifecycles, resources, or substitution boundaries behind that parent contract.

For example, an Evaluator may be one external owner while internally composing request-lifecycle, batch/workspace, cache, publication, and reuse bricks. That internal decomposition does not authorize Policy, Graph, Output, or another neighbor to deep-import those children. If outsiders must understand or wire private children directly, the parent has become a directory or namespace rather than a real LEGO boundary.

Choose LEGO seams primarily by meaning, not size. Use this ordering when deciding whether something deserves a brick boundary:

1. semantic/ontological ownership — one authoritative truth or invariant;
2. lifecycle cohesion — creation, mutation, publication, failure, cancellation, and disposition that belong together;
3. functional cohesion — operations that jointly maintain that owned truth;
4. stable dependency/substitution boundary — a meaningful contract across independently changing responsibilities;
5. failure/resource boundary — independently owned pressure, reservation, cleanup, recovery, or resource lifetime;
6. cognitive/context size — a diagnostic that may reveal hidden responsibilities but does not create architecture by itself.

File count, line count, method count, class count, or agent context size are not primary architectural criteria. Context pressure is evidence to investigate: if understanding one supposed brick requires holding several unrelated state machines, lifecycles, dependency sets, and failure domains simultaneously, the brick may hide real child LEGOs. If the responsibility is genuinely indivisible, keep the authority intact and split analysis or implementation support rather than inventing false public boundaries.

A very large function follows the same rule. Split it when its regions own independently meaningful invariants, state transitions, resources, failure domains, or reasons to change. Do not split merely because it is long. One mechanically large algorithm with one coherent state machine may remain one semantic unit while using private pure helpers, explicit phases, tables, or a private state object for readability. Passing a giant shared `context` object through arbitrary helper functions is not LEGO decomposition; it usually preserves the original coupling under different names.

Stop recursive decomposition when another split would protect no independent ownership, lifecycle, substitution, failure/resource boundary, testing value, or change boundary. LEGO architecture rejects both monoliths and abstraction confetti.

## Universal versus generic

Universal means free of accidental caller assumptions. Generic means parameterized. A component may be universal while owning a specific domain invariant.

Good CUDA-MCGS examples:

- A `ResourcePlanner` derives finite capacities from declared memory, model, layout, queue, and safety requirements. It does not care whether the engine searches chess, Go, or text.
- A `TranspositionIndex` owns key lookup, claim/publication, collision verification, and saturation behavior through an explicit state-identity contract.
- A CUDA Driver adapter translates versioned driver entry points into a stable host-runtime port.

Bad example:

- A universal `SearchManager` accepts arbitrary states, actions, callbacks, policies, tensors, flags, allocators, and platform handles. It owns no coherent invariant and hides lifecycle and dependency direction.

## State ownership

Every authoritative fact has one owner. Consumers may:

- issue commands through a port;
- query stable values or bounded immutable views;
- receive events describing completed facts;
- hold capability/identity references with explicit lifetime.

Consumers may not mutate another component’s internal arrays, queues, caches, graph records, generated layouts, or device handles.

Derived state is either rebuildable from its owner or explicitly promoted to a new authoritative contract.

## Boundary test

A component qualifies as a LEGO brick when:

- its purpose fits in one clear paragraph;
- it owns one coherent invariant or lifecycle responsibility;
- its authoritative state and writers are explicit;
- consumers depend on public contracts, not implementation paths;
- required dependencies are visible at composition;
- unstable external types do not leak beyond adapters;
- it can be tested without unrelated systems;
- replacing the implementation does not require consumer rewrites;
- adding an intended second consumer does not require unrelated component edits;
- failure and resource behavior remain inside the declared boundary.

## Simplest sufficient total system

A solution is sufficient only when it satisfies the complete authoritative contract and the reasonably expected operating domain.

Complexity is not removed when exported to:

- callers or adapters;
- configuration and profiles;
- generated artifacts;
- persistence, migration, and compatibility;
- failure, recovery, and operations;
- diagnostics and observability;
- tests and conformance;
- predictable second instances.

Represent essential domain complexity directly. Remove accidental implementation complexity. Reject ceremony that protects no invariant, boundary, responsibility, or operating property.

A larger local implementation can be the simpler system when it eliminates duplicated contracts, translation, special cases, unsafe lifecycle coupling, or repeated consumer burden.

## Shared code

Shared code is valid only when it represents a real shared invariant with an owner and contract. A directory named `shared`, `common`, `utils`, or `helpers` does not establish ownership.

Temporary duplication may be safer than a false abstraction. Promote common behavior only after its semantic owner and intended substitution class are clear.

## CUDA-MCGS compilation boundary

LEGO boundaries remain conceptual and source-level even when the compiler links domain, policy, evaluator, and runtime device code into one highly specialized binary. Physical inlining does not erase contract ownership.

The generated engine may remove unused abstraction cost, but its build inputs and generated layout must remain traceable to their owning contracts.
