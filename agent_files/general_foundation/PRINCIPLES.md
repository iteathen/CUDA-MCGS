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

Classify material concerns as:

- hard gates;
- mission objectives;
- supporting qualities;
- process costs or tie-breakers.

Eliminate paths that violate authority, unacceptable harm boundaries, semantic correctness, explicit accuracy/deadline/resource/compatibility bounds, or required lifecycle/failure behavior. Only then compare valid paths using contextual value ordering, evidence, reversibility, information value, dependency unlock, and total lifecycle cost.

Apply design principles in order: authority/domain truth → purpose/bounds/value ordering → LEGO → SOLID → CUPID → simplest sufficient total system. Principles are lenses, not equal votes. Weighted scoring cannot make a failed gate valid.

When no subsystem-specific ordering exists, use the fallback in [`ENGINEERING_JUDGMENT.md`](ENGINEERING_JUDGMENT.md) and [`CONTEXTUAL_DESIGN_WEIGHTING.md`](CONTEXTUAL_DESIGN_WEIGHTING.md): authority and unacceptable irreversible harm before semantic correctness/hard mission bounds, then mission-sustaining reliability, mission quality/performance, supporting qualities, and finally delivery/process convenience.

A value may change role by context. Latency can be a preference in an offline tool and a correctness/safety gate in a real-time path. Accuracy can be a minimum bound or the mission objective. State the role, threshold, consequence, owner, evidence, and revisit trigger rather than relying on slogans.

See [`ENGINEERING_JUDGMENT.md`](ENGINEERING_JUDGMENT.md).

## Assessment before planning

For substantial and critical work, do not promote the first plausible idea directly into an implementation plan. Assess authority, evidence, ownership, domain foundations, alternatives, resources, failures, testing, cleanup, context budget, value ordering, and validation; then attack the answers from the strongest credible opposing position. Resolve valid objections by changing the design, narrowing scope, running an experiment, splitting a focus branch, or rejecting the proposal.

Simplicity is considered only after the fundamentals are sound. Administrative accounting is itself system complexity: keep one authoritative assessment/plan by default, link existing facts, group related answers, and preserve only information that changes decisions, enables execution, supports testing/validation/cleanup, or prevents costly reconstruction.

See [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md).

## Focus branches for large or complex work

When one agent cannot retain the task’s objective, authority, mechanism, dependencies, risks, and material consequence horizon with full attention in one focused session, decompose the task before deep execution.

Keep one canonical parent task and integration spine. Split work into semantic focus branches with one primary question or output, one primary owner, exact inputs/revisions, minimal context, independent falsification, cleanup, and a declared integration obligation.

A focus branch is not automatically a Git branch. Git branches, issues, PRs, worktrees, and documents are created only when isolation, collaboration, review, transport, rollback, dependency, or closure justifies them.

Size leaves by the full-attention rule, not file count or agent count. Shared-contract changes route through the integration spine and invalidate dependents explicitly. Locally accepted branches do not prove parent completion; exact outputs must be centrally reconciled across ownership, contracts, end-to-end behavior, resources, failure, lifecycle, compatibility, security, performance, and cleanup.

Use one canonical branch map and one active branch per agent by default. Rebranch when evidence reveals the task’s true shape rather than silently expanding scope or preserving a bad decomposition.

See [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md).

## Universal token backpressure and minimum practice floor

Tokens are a finite engineering resource, but minimum token count is not the objective. Optimize quality-adjusted verified progress across retrieval, reasoning, generation, tools, testing, validation, integration, cleanup, review, recovery, and handoff.

Backpressure applies to **every task**, including routine work. Every task has at least an implicit posture:

- exact outcome and authority;
- smallest coherent useful scope;
- risk-appropriate minimum practice floor;
- cheapest decisive verification;
- reserve for actual-effect inspection, testing, cleanup, and truthful reporting;
- pressure triggers and optional work to defer.

The universal floor preserves request/constraints, authoritative current state, coherent scope, expected result, decisive verification, operation within authority, actual-effect inspection, relevant testing, cleanup/reconciliation, and honest checks-not-run/risks. Substantial and critical work preserve every additional objectively triggered specification, reasoning, safety/security, resource/failure, compatibility, recovery, review, and integration practice.

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

Reduce waste before breadth and breadth before rigor. Token pressure may remove ceremony without a consumer; it may not remove required authority, hard gates, reasoning, test tiers, evidence identity, actual-effect inspection, review, recovery, or cleanup. Reduced evidence narrows the claim.

Before substantial mutation, reserve enough context to inspect effects, test/falsify claims, reconcile integration, clean up, review, and hand off. Default reserves remain 30% for substantial work and 40% for critical/large/cross-branch work after the branch packet is loaded unless a different reserve is demonstrably sufficient. Routine work uses semantic headroom without a fixed percentage or ledger.

Soft estimates and roughly 25% envelope overruns are replan signals rather than hard quotas. Extend the budget when essential evidence, safety, correctness, cleanup, or handoff has high marginal value; restore reserve through narrowing or split. Do not continue a path because tokens have already been spent.

Load context in layers: operating kernel, owning authority, local mechanism, material consequence horizon, then rationale/provenance only when needed. Search before broad reading, prefer exact diffs/ranges and contiguous owning sections, batch independent retrievals, and keep large artifacts outside prompt context when exact identity and targeted sections suffice.

Yellow opens no new scope; red stops new mutation; emergency preserves exact state only. Checkpoints preserve exact revisions, decisions/value ordering, rejected paths, contradictions, failed hypotheses, partial state, tests/evidence, cleanup, backpressure actions, and next safe action. Summaries remain derivative context. Material token debt blocks completion.

See [`TOKEN_DISCIPLINE.md`](TOKEN_DISCIPLINE.md) and [`CONTEXT_ROUTING.md`](CONTEXT_ROUTING.md).

## Testing and repair-loop discipline

Testing proves owned claims; raw test count and green CI do not.

- Identify authoritative, preferably independent oracles.
- Capture every material regression/boundary/risk as a test intent immediately.
- Use the smallest provisional reproducer during diagnosis.
- Before branch acceptance, fold related intents into canonical parameterized/property/generated capsules.
- Share expensive immutable build/setup/device/model/fixture work while preserving stable case IDs, isolated mutable state, direct selection, and per-case reporting.
- Map completeness by owned invariants and risk-triggered conditions—not files, lines, or blind Cartesian products.
- Use preflight → focused fast → owner/contract → integration smoke → deep → forensic/release tiers. Broad/deep suites stay out of the inner edit loop unless triggered.
- Key evidence by exact source/test/artifact/model/environment/configuration/fixture/seed/tier identity and reuse unchanged evidence.
- Retry only after material invalidation, contamination/incompleteness, independent replication, statistical need, or a changed hypothesis/input/code/environment/transport.
- Cluster failures by first divergence and authoritative owner; repair root causes coherently, then rerun minimal cluster, owning capsule once, and required integration smoke once.
- Required discovery and skip accounting are explicit; zero required discovery and silent skips fail.
- Remove or archive provisional reproducers, duplicate fixtures/cases, diagnostics, and logs after durable equivalent coverage exists.
- Material test debt and token debt block acceptance.

Token pressure may remove duplicate runs and unnecessary tiers. It may not remove the oracle, evidence identity, required owner capsule, discovery/skip accounting, or integration evidence needed by the claim.

Consolidation merges execution overhead, not semantic accountability. A monolithic assertion blob is not an efficient capsule.

See [`TESTING.md`](TESTING.md) and [`DEBUGGING.md`](DEBUGGING.md).

## Governed plan execution

A plan is a hypothesis under current authority. Execute only a current dependency-ready node with explicit ownership, expected outputs, acceptance, runnable falsification, testing, rollback/safe stop, cleanup, integration, and trustworthy repository/environment/context state.

Before each material operation, state the obligation/decision it implements, expected local/wider effects, preserved value ordering, and decisive evidence. Apply one coherent ownership-sized action, inspect actual effects, register created/modified/obsolete state and test intents, run the cheapest decisive falsifier, reconcile contracts/resources/lifecycle/design/testing/cleanup, and classify the outcome.

A material change to cause, owner, authority, public contract, schema, ABI, consequence horizon, resource model, risk, value ordering, priority, acceptance, rollback, output, downstream order, oracle/evidence invalidation, cleanup, or context fit requires plan revision. No node is accepted with invalid partial state, stale generated forms, abandoned resources, unresolved decision/test/token debt, unowned residue, or false downstream preconditions.

See [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md).

## Cleanup and disposition

Cleanup is an owned state transition, not cosmetic deletion.

Every material task-created, provisional-test, generated, diagnostic, partial, local, remote, sensitive, external, and coordination item receives:

- exact identity and owner;
- protected/dependent status;
- purpose and lifetime;
- one explicit disposition;
- dependency-safe trigger and method;
- verification through the owning system.

Permitted dispositions are remove, restore, retain as authority/evidence/recovery, archive, quarantine, transfer, supersede, retain temporarily with owner/trigger, or protect unchanged.

Never destroy user/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, or active dependents without exact authority. Historically useful stale material is archived with provenance rather than silently erased. Secret exposure requires revocation/rotation, not merely deletion.

A clean diff, exited process, green test, successful API response, or merged PR does not prove cleanup of remote, asynchronous, shared, sensitive, generated, cached, or external state. Token pressure never justifies unsafe cleanup or omitted retained-state reporting.

See [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md).

## LEGO boundary

Every substantial component is a movable brick with:

- one coherent owned invariant or lifecycle responsibility;
- one visible owner for authoritative state, mutation, tests, and disposition;
- small meaningful domain-named ports;
- constructor- or composition-visible dependencies;
- unstable platform, CUDA, version, format, domain-instance, and model-instance details behind adapters;
- explicit lifecycle, cancellation, failure, cleanup, and resource behavior where material;
- isolated contract tests and replaceability without consumer rewrites.

Consumers request changes through contracts. They do not mutate another component’s internals or deep-import private files.

## SOLID and CUPID inside the brick

SOLID separates responsibilities where meaning, ownership, change, testing, substitution, concurrency, lifetime, or cleanup requires it. It does not require ceremonial decomposition.

CUPID makes the valid implementation composable, idiomatic, predictable, domain-based, and pleasant to work with.

## Universal without vague genericity

UMCGS is universal at contracts and compilation boundaries, not through one giant optional-field runtime object.

- Name the widest truthful invariant, not the first domain or consumer.
- State intended members, permitted variation, and excluded cases.
- Apply the second-instance test: another intended use should fit by configuration, profile, adapter, or an already-permitted extension—not foundational redesign.
- Apply the first-consumer deletion test: a foundation should remain meaningful if its first consumer disappears.
- Reject broad `Manager`, `System`, `Common`, `Shared`, `Generic`, `Data`, `Util`, `Helper`, `Processor`, or `Handler` owners that do not state one exact responsibility.

## Domain-appropriate foundations

Before choosing a type, width, identity, schema, collection, queue, precision, or layout, define semantic meaning, units, valid range, cardinality/growth, lifetime, concurrency, persistence/versioning, failure behavior, cleanup/reclamation, and memory/performance budget.

Choose cheap durable capacity across the reasonably expected domain. Reject both ordinary-growth migration traps and speculative subsystems.

## Composition and adapters

The composition root selects concrete domain, policy, evaluator, CUDA/platform, persistence, and compatibility adapters. It owns wiring, lifecycle, and coordinated teardown—not domain/search rules. Dependencies point toward stable contracts.

Physical inlining or linking into a generated engine does not erase conceptual ownership, contract conformance, cleanup obligations, or the need to keep large artifacts outside active context.

## Simplest sufficient total system

Measure complexity across callers, adapters, generation, persistence, migration, failure, recovery, cleanup, operations, diagnostics, tests, context reconstruction, device memory, synchronization, and expected second instances. Complexity moved elsewhere is not removed.

Represent essential domain complexity directly. Remove accidental complexity. Reject ceremony that protects no invariant, boundary, responsibility, evidence, or useful operating property.

## UMCGS non-negotiables

- Concrete engines are finite and memory-planned.
- Production active search remains device-closed after ignition.
- Universal contracts do not embed chess, games, one evaluator shape, one action shape, one graph model, or one GPU.
- Generated hot paths may be highly specialized and may eliminate unused abstractions.
- Performance changes require measured mechanism evidence plus semantic and search-quality guardrails.
- Focus branches must not independently drift shared Search IR, graph, policy, evaluator, resource, schema/JIT/ABI, device-closure, or search-quality meaning.
- Plan execution must not introduce hidden first-domain, host-control, memory, graph, evaluator, JIT/ABI, resource, cleanup, or context assumptions.
- Device contexts, allocations, queues, modules, IPC/shared-memory state, diagnostics, and host resources are released or deliberately retained and verified.
- Large CUDA docs, profiler traces, generated engines, model packages, and logs remain external artifacts with exact identities unless targeted content is required.
- Local and remote branches, PR/issue state, artifacts, credentials, and external resources are intentional after completion.
- Token conservation cannot override ownership, device closure, security, correctness, compatibility, lifecycle, evidence, or cleanup gates.

## Design, decomposition, execution, token, and cleanup stop conditions

Stop and resolve the boundary before implementation, deletion, acceptance, or dependent continuation when ownership is ambiguous, the task exceeds full attention without a focus-branch map, branches overlap write authority, shared contracts can drift independently, dependencies are incomplete, authority conflicts, the plan version is stale, expected effects/falsifiers/cleanup are unknown, token pressure would violate the practice floor, reserve cannot support validation and handoff, context pressure is red/emergency, public contracts leak unstable/private types, state has multiple writers, a name implies unsupported generality, the expected second instance forces redesign, resource exhaustion or teardown is undefined, actual effects materially diverge, protected state may be destroyed, cleanup cannot be verified, or alleged simplicity merely exports the problem.

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
