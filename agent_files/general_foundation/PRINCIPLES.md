# Engineering Principles

**Scope:** Compact mandatory design alignment for UMCGS. Read this during startup, then load only the detailed doctrine triggered by the task.

This design system is adapted from the project owner’s Ars Thaumaturgica foundation at commit `c3e25ad1032a1927c9709580fb415ffc48b91020`. UMCGS files are authoritative here; the source repository records provenance rather than an external dependency.

## Governing design hierarchy

```text
domain truth and project authority
        ↓
engineering contract, purpose, bounds, and value ordering
        ↓
LEGO component ownership and boundaries
        ↓
SOLID internal responsibility structure
        ↓
CUPID implementation quality
        ↓
sound fundamentals verified
        ↓
simplest sufficient total system
        ↓
measured testing, validation, token backpressure, cleanup, and evolution
```

A lower level may improve a design only inside the valid envelope established above it. Soundness is a gate, not a preference: “simple” never means omitting required correctness, finite-resource behavior, lifecycle, compatibility, recovery, accurate evidence, cleanup, or expected-domain capacity.

## Purpose before architecture

Establish outcome, consumer, authority, owner, operating environment, intended equivalence class, expected ranges, correctness/safety/accuracy/deadline tolerances, finite memory/performance limits, lifecycle, recovery, compatibility, cleanup/disposition, observability, test oracles/capsules, token/context constraints, and dominant mission objectives before selecting a representation or component structure.

## Engineering judgment before path selection

Translate accepted specifications into an engineering contract and obligation map before choosing an implementation.

Classify material concerns as hard gates, mission objectives, supporting qualities, or process costs/tie-breakers. Eliminate paths that violate authority, unacceptable harm boundaries, semantic correctness, explicit accuracy/deadline/resource/compatibility bounds, or required lifecycle/failure behavior. Only then compare valid paths using contextual value ordering, evidence, reversibility, information value, dependency unlock, and total lifecycle cost.

Apply design principles in order: authority/domain truth → purpose/bounds/value ordering → LEGO → SOLID → CUPID → simplest sufficient total system. Principles are lenses, not equal votes. Weighted scoring cannot make a failed gate valid.

When no subsystem-specific ordering exists, use the fallback in [`ENGINEERING_JUDGMENT.md`](ENGINEERING_JUDGMENT.md) and [`CONTEXTUAL_DESIGN_WEIGHTING.md`](CONTEXTUAL_DESIGN_WEIGHTING.md): authority and unacceptable irreversible harm before semantic correctness/hard mission bounds, then mission-sustaining reliability, mission quality/performance, supporting qualities, and finally delivery/process convenience.

A value may change role by context. State the role, threshold, consequence, owner, evidence, and revisit trigger rather than relying on slogans.

## Assessment before planning

For substantial and critical work, assess authority, evidence, ownership, foundations, alternatives, resources, failures, testing, cleanup, context budget, value ordering, and validation before promoting a proposal to an implementation plan. Attack the answers from the strongest credible opposing position and change the design, narrow scope, run an experiment, split a focus branch, or reject the proposal when criticism succeeds.

Simplicity is considered only after fundamentals are sound. Administrative accounting is itself complexity: keep one authoritative assessment/plan by default, link existing facts, and preserve only information that changes decisions, enables execution, supports testing/validation/cleanup, or prevents costly reconstruction.

## Focus branches for large or complex work

When one agent cannot retain objective, authority, mechanism, dependencies, risks, testing, cleanup, and consequence horizon with full attention in one focused session, decompose before deep execution.

Keep one canonical parent and integration spine. Give each semantic focus branch one primary question/output, one owner, exact inputs/revisions, minimal context, independent falsification/testing, cleanup, and integration obligations.

A focus branch is not automatically a Git branch. Size leaves by full attention, not file/test/agent count. Shared-contract, engineering-decision, value-order, oracle, and evidence-key changes invalidate dependents explicitly. Locally accepted branches or passing capsules do not prove parent completion.

## Universal token backpressure and minimum practice floor

Token use is continuous backpressure on **every task**, including routine work. The objective is quality-adjusted verified lifecycle progress—not the shortest response, the fewest tool calls, or the most code.

Every task has at least an implicit posture:

- exact outcome and authority;
- smallest coherent useful scope;
- risk-appropriate minimum practice floor;
- cheapest decisive evidence;
- reserve for actual-effect inspection, testing, cleanup, and truthful reporting;
- pressure triggers and optional work to defer.

The universal practice floor preserves request/constraints, authoritative current state, coherent scope, expected result, decisive verification, operation within authority, actual-effect inspection, relevant testing, cleanup/reconciliation, and honest checks-not-run/risks. Substantial and critical work preserve all objectively triggered specification, reasoning, safety/security, resource/failure, compatibility, recovery, review, and integration practices.

When pressure rises, reduce in this order:

```text
remove duplication
  → reuse authority and evidence
  → batch coherent work and tests
  → narrow context and output
  → defer optional breadth and polish
  → reduce scope or claim
  → split, rebranch, or hand off
  → pause on a blocker
```

Reduce waste before breadth and breadth before rigor. A broad claim may not be preserved by cutting required evidence. Sampling or a lower test tier narrows the claim.

Default reserves remain 30% for substantial work and 40% for critical/large/cross-branch work after loading the branch packet; routine work uses semantic headroom without a fixed percentage. These are backpressure signals rather than hard quotas. Extend the budget when essential evidence, safety, correctness, cleanup, or handoff has high marginal value, then restore reserve through narrowing or split.

Yellow opens no new scope; red stops new mutation; emergency preserves exact state only. Do not continue a path because tokens have already been spent. Sunk token cost is not evidence.

Checkpoints preserve exact revisions, decisions/value order, rejected paths, failures, tests/evidence, partial state, cleanup, backpressure actions, and next safe action. Material token debt blocks completion.

See [`TOKEN_DISCIPLINE.md`](TOKEN_DISCIPLINE.md) and [`CONTEXT_ROUTING.md`](CONTEXT_ROUTING.md).

## Testing and repair-loop discipline

Testing proves owned claims; raw test count and green CI do not.

- Identify authoritative, preferably independent oracles.
- Capture every material regression/boundary/risk as a test intent immediately.
- Use the smallest provisional reproducer during diagnosis.
- Consolidate related intents before branch acceptance into owning parameterized/property/generated capsules.
- Share expensive immutable setup while preserving stable case IDs, isolated mutable state, direct selection, and per-case reporting.
- Map completeness by owned invariants and risk-triggered conditions.
- Use preflight → focused fast → owner/contract → integration smoke → deep → forensic/release tiers.
- Key evidence exactly and reuse unchanged evidence.
- Retry only after invalidation, contamination/incompleteness, independent replication, statistical need, or changed hypothesis/input/code/environment/transport.
- Cluster failures by first divergence and authoritative owner; repair root causes coherently.
- Required discovery/skip accounting is explicit.
- Remove/archive provisional reproducers, duplicate fixtures/cases, diagnostics, and logs after durable equivalent coverage exists.
- Material test debt and token debt block acceptance.

Token pressure may remove duplicate runs and unnecessary tiers. It may not remove the oracle, evidence identity, required owner capsule, discovery/skip accounting, or integration evidence needed by the claim.

**Consolidation merges execution overhead, not semantic accountability.**

## Governed plan execution

A plan is a hypothesis under current authority. Execute only a dependency-ready node with explicit ownership, expected outputs, acceptance, falsification, testing, rollback/safe stop, cleanup, integration, and trustworthy repository/environment/context state.

Before each material operation, state the obligation/decision, expected effects, preserved value ordering, and decisive evidence. Apply one coherent owner-sized action, inspect actual effects, register created/modified/obsolete state and test intents, run the cheapest falsifier, and reconcile contracts/resources/lifecycle/design/testing/cleanup.

A material change to cause, owner, authority, contract, schema, ABI, consequence horizon, resource model, risk, value ordering, priority, acceptance, output, evidence validity, cleanup, or context fit requires plan revision. No node is accepted with invalid partial state, unresolved decision/test/token debt, abandoned resources, or false downstream preconditions.

## Cleanup and disposition

Cleanup is an owned state transition, not cosmetic deletion. Every material task-created, provisional-test, generated, diagnostic, partial, local, remote, sensitive, external, and coordination item receives exact identity/owner, purpose/lifetime, disposition, trigger/method, and owning-system verification.

Never destroy user/pre-existing work, authority, evidence, recovery state, shared resources, protected branches, or active dependents without exact authority. A clean diff, green test, successful API response, or merged PR does not prove cleanup.

Token pressure never justifies unsafe cleanup or omitted retained-state reporting.

## LEGO boundary

Every substantial component is a movable brick with one coherent owned invariant/lifecycle responsibility, one visible owner for state/mutation/tests/disposition, meaningful ports, injected dependencies, adapters around instability, explicit lifecycle/failure/resource/testing/cleanup, and replaceability demonstrated by owning contract capsules.

## SOLID and CUPID inside the brick

SOLID separates responsibilities where meaning, ownership, change, testing, substitution, concurrency, lifetime, or cleanup requires it without ceremonial decomposition. CUPID makes the valid implementation composable, idiomatic, predictable, domain-based, and pleasant to work with.

## Universal without vague genericity

UMCGS is universal at contracts and compilation boundaries, not through one giant optional-field object. Name the widest truthful invariant, state permitted variation and exclusions, apply second-instance and first-consumer-deletion tests, and reject vague catch-all owners.

## Domain-appropriate foundations

Before choosing a foundational representation, define meaning, units, range, cardinality/growth, lifetime, concurrency, persistence/versioning, failure, testability, cleanup/reclamation, and memory/performance budget. Choose cheap durable capacity across the reasonably expected domain.

## Composition and total-system simplicity

Composition owns wiring/lifecycle/teardown and integrated capsule composition—not domain rules. Measure complexity across callers, adapters, generation, persistence, migration, failure, recovery, testing/setup/runtime, cleanup, operations, diagnostics, context reconstruction, device memory, synchronization, and expected second instances. Complexity moved elsewhere is not removed.

## UMCGS non-negotiables

- Concrete engines are finite and memory-planned.
- Active production search remains device-closed after ignition.
- Universal contracts/capsules do not embed the first game, evaluator/action/graph shape, or GPU.
- Performance changes require mechanism evidence plus semantic/search-quality guardrails.
- Shared Search IR, graph, policy, evaluator, resource, schema/JIT/ABI, device-closure, decision, oracle, and evidence meaning cannot drift independently.
- Test evidence identity includes all material dimensions.
- Device and host resources are released or deliberately retained and verified.
- Large docs/traces/generated engines/models/logs remain external artifacts unless targeted content is required.
- Token conservation cannot override ownership, device closure, security, correctness, compatibility, lifecycle, or evidence gates.

## Stop conditions

Stop before implementation/testing/deletion/acceptance when specification/ownership is ambiguous; gates/value order are unstated; a large task lacks a focus map; dependencies or evidence identity are incomplete; token pressure would violate the practice floor; reserve cannot support required testing/integration/cleanup/handoff; context is red/emergency; required tests are undiscovered/skipped; retries are unchanged; resource exhaustion/teardown is undefined; cleanup is unsafe; or alleged simplicity merely exports the problem.

## Triggered detailed doctrine

- [`ENGINEERING_JUDGMENT.md`](ENGINEERING_JUDGMENT.md)
- [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md)
- [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md)
- [`TOKEN_DISCIPLINE.md`](TOKEN_DISCIPLINE.md)
- [`CONTEXT_ROUTING.md`](CONTEXT_ROUTING.md)
- [`TESTING.md`](TESTING.md)
- [`DEBUGGING.md`](DEBUGGING.md)
- [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md)
- [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md)
- [`SANITY_CHECKING.md`](SANITY_CHECKING.md)
- [`PULL_REQUEST_REVIEW_AND_MERGE.md`](PULL_REQUEST_REVIEW_AND_MERGE.md)
- [`LEGO_ARCHITECTURE.md`](LEGO_ARCHITECTURE.md)
- [`COMPONENT_STANDARD.md`](COMPONENT_STANDARD.md)
- [`CONTRACT_STANDARD.md`](CONTRACT_STANDARD.md)
- [`COMPOSITION_AND_DEPENDENCIES.md`](COMPOSITION_AND_DEPENDENCIES.md)
- [`DOMAIN_APPROPRIATE_FOUNDATIONS.md`](DOMAIN_APPROPRIATE_FOUNDATIONS.md)
- [`CONTEXTUAL_DESIGN_WEIGHTING.md`](CONTEXTUAL_DESIGN_WEIGHTING.md)
- [`MAXIMUM_ACCURATE_GENERALITY.md`](MAXIMUM_ACCURATE_GENERALITY.md)
- [`COMPATIBILITY_AND_EVOLUTION.md`](COMPATIBILITY_AND_EVOLUTION.md)
- [`FORBIDDEN_DESIGN_PATTERNS.md`](FORBIDDEN_DESIGN_PATTERNS.md)

Use specialist templates only when another consumer needs their unique state; token backpressure should reduce paperwork rather than create it.
