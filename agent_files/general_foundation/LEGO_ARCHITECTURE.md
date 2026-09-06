# LEGO Architecture

**Scope:** Macroscopic ownership, composition, replaceability, lifecycle, failure containment, scope containment, and attention-bounded component boundaries.

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
- independent testing and replaceability;
- bounded blast radius for failure and redesign;
- bounded reasoning context for one agent's full attention.

## Responsibility hierarchy

```text
domain truth and accepted authority
    → LEGO component boundaries and containment
    → SOLID internal responsibilities
    → CUPID implementation quality
    → KISS among complete designs
```

A locally convenient implementation may not violate an owning boundary. Simplicity cannot override domain truth. SOLID cannot move state ownership across bricks. CUPID cannot justify an idiomatic platform leak into the core. KISS removes only complexity that remains unjustified after the higher-level constraints are satisfied.

## What LEGO governs

LEGO determines:

- the coherent responsibility owned by a component;
- the source of truth and allowed mutation paths;
- the public ports and observable effects;
- which dependencies are required and injected;
- which adapters translate unstable external details;
- startup, shutdown, cancellation, and failure boundaries;
- replacement and extraction boundaries;
- damage/blast-radius containment;
- component-local validation and conformance;
- whether the component's complete authoritative working set fits one agent's full-attention envelope.

## What LEGO does not mean

LEGO is not:

- one component per file or class;
- mandatory microservices or repositories;
- runtime virtual dispatch everywhere;
- a generic manager accepting arbitrary callbacks and flags;
- an event bus replacing explicit ownership;
- parameterizing every implementation detail;
- symmetry-driven abstraction;
- speculative interfaces for imagined consumers;
- splitting code solely to reduce line count or satisfy an arbitrary context quota.

Inside a valid component, simple direct code is preferred.

## Recursive composition and LEGO scale

A LEGO is **encapsulated composition**, not necessarily an atomic leaf. A larger brick may be composed recursively from smaller internal bricks, and those children may themselves contain smaller bricks. The parent owns the externally visible semantic responsibility and contract; child bricks own narrower local invariants, state machines, lifecycles, resources, failure domains, substitution boundaries, or independently changing responsibilities behind that parent contract.

For example, an Evaluator may be one external owner while internally composing request-lifecycle, batch/workspace, cache, publication, and reuse bricks. That internal decomposition does not authorize Policy, Graph, Output, or another neighbor to deep-import those children. If outsiders must understand or wire private children directly, the parent has become a directory or namespace rather than a real LEGO boundary.

### The two sizing gates

Choose LEGO boundaries using **both cohesion and full-attention fit**.

The cohesion gate asks where real seams exist. Strong seam signals are:

1. semantic/ontological ownership — one authoritative truth or invariant;
2. lifecycle cohesion — creation, mutation, publication, failure, cancellation, and disposition that belong together;
3. functional cohesion — operations that jointly maintain an owned truth;
4. stable dependency/substitution boundary — a meaningful contract across independently changing responsibilities;
5. failure/resource boundary — independently owned pressure, reservation, cleanup, recovery, or resource lifetime;
6. volatility/change boundary — responsibilities that evolve for materially different reasons;
7. execution locality — behavior whose correctness or hot-path coherence requires it to remain together.

The attention gate asks whether one agent can load and actively reason about the component's **complete authoritative working set** at once:

```text
public contract
+ implementation
+ invariants
+ lifecycle/resource/failure rules
+ tests and conformance
+ immediate dependency interfaces
+ immediate consumer expectations needed to understand consequences
```

The working set must fit comfortably inside one focused attention envelope with substantial headroom for the current task, evidence, alternatives, diff inspection, and review. Merely fitting inside a model's maximum context window is not sufficient.

**Context fit is a deciding architectural constraint, not merely a diagnostic.** If a coherent component exceeds full attention, recursively decompose it at the strongest real internal seam or narrow the responsibility. Semantic ownership does not require a single giant implementation unit: the parent can remain the external semantic owner while private child LEGOs bound internal reasoning.

Context pressure still does not authorize arbitrary file/module boundaries. A split is invalid when it:

- duplicates authoritative truth;
- creates multiple writers for one state;
- introduces constant cross-boundary chatter;
- requires neighboring bricks to understand each other's internals;
- separates an indivisible state transition or invariant without a stable contract;
- creates ceremony without independent testing, failure, lifecycle, substitution, change, or attention-containment value.

The target is therefore the **smallest coherent independently comprehensible and replaceable unit**, not the smallest possible module.

A very large function follows the same rule. Split it when its regions own independently meaningful invariants, state transitions, resources, failure domains, phases, or reasons to change. Do not split merely because it is long. One mechanically large algorithm with one externally coherent state machine may remain one semantic unit while using private pure helpers, explicit phases, tables, private state objects, or private child LEGOs so each internal reasoning unit remains attention-bounded. Passing a giant shared `context` object through arbitrary helper functions is not LEGO decomposition; it usually preserves the original coupling under different names.

Stop recursive decomposition when another split would protect no independent ownership, lifecycle, substitution, failure/resource, testing/change, or attention boundary without introducing greater coupling or duplicated truth. LEGO architecture rejects both monoliths and abstraction confetti.

## Agent-comprehensibility test

An agent entering a brick should be able to establish quickly:

- what it owns;
- what it explicitly does not own;
- what enters and leaves;
- which invariants cannot be violated;
- which state/resources it creates, mutates, and disposes;
- what can replace it;
- what failures it contains;
- which immediate interfaces can affect its correctness;
- how to prove it still works.

If answering those questions requires repository archaeology across unrelated components, broad sampling/skimming, or reconstructing hidden contracts from consumers, the boundary is suspect even when the source technically fits in the available context window.

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
- failure and resource behavior remain inside the declared boundary;
- its complete authoritative working set fits one agent's focused attention with headroom for reasoning, evidence, and review.

If the last condition fails, introduce a subordinate LEGO boundary at the strongest real semantic, lifecycle, functional, substitution/change, failure/resource, volatility, or execution seam while preserving the parent's external ownership where appropriate.

## SOLID, CUPID, and KISS inside LEGO

LEGO decides where the walls go and what they contain. **SOLID** structures responsibilities and dependency direction inside those walls. **CUPID** shapes the resulting code so it is composable, Unix-like where appropriate, predictable, idiomatic, and domain-based. **KISS** then removes remaining accidental complexity.

The order is strict. A locally simpler implementation is not KISS if it breaks LEGO containment. CUPID does not justify violating SOLID dependency direction. SOLID does not justify moving a responsibility into the wrong LEGO. Lower-level elegance cannot repair a wrong architectural boundary.

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
- predictable second instances;
- repeated context reconstruction and repository archaeology.

Represent essential domain complexity directly. Remove accidental implementation complexity. Reject ceremony that protects no invariant, boundary, responsibility, operating property, or attention-containment need.

A larger local implementation can be the simpler system when it eliminates duplicated contracts, translation, special cases, unsafe lifecycle coupling, or repeated consumer burden—provided its authoritative working set remains attention-bounded or is recursively decomposed internally.

## Shared code

Shared code is valid only when it represents a real shared invariant with an owner and contract. A directory named `shared`, `common`, `utils`, or `helpers` does not establish ownership.

Temporary duplication may be safer than a false abstraction. Promote common behavior only after its semantic owner and intended substitution class are clear.

## CUDA-MCGS compilation boundary

LEGO boundaries remain conceptual and source-level even when the compiler links domain, policy, evaluator, and runtime device code into one highly specialized binary. Physical inlining does not erase contract ownership or attention-bounded source organization.

The generated engine may remove unused abstraction cost, but its build inputs and generated layout must remain traceable to their owning contracts.
