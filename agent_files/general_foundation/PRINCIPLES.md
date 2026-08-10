# Engineering Principles

**Scope:** Compact mandatory design alignment for UMCGS. Read this during startup, then load only the detailed doctrine triggered by the task.

This design system is adapted from the project owner’s Ars Thaumaturgica foundation at commit `c3e25ad1032a1927c9709580fb415ffc48b91020`. UMCGS files are authoritative here; the source repository records provenance rather than an external dependency.

## Governing design hierarchy

```text
domain truth and project authority
        ↓
purpose, bounds, and contextual design weighting
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
measured validation, cleanup, and evolution
```

A lower level may improve a design only inside the valid envelope established above it. Soundness is a gate, not a preference: “simple” never means omitting required correctness, finite-resource behavior, lifecycle, compatibility, recovery, cleanup, or expected-domain capacity.

## Purpose before architecture

Establish outcome, authority, owner, operating environment, intended equivalence class, expected ranges, correctness/safety tolerances, finite memory/performance limits, lifecycle, recovery, compatibility, cleanup/disposition, observability, and dominant concerns before selecting a representation or component structure.

## Assessment before planning

For substantial and critical work, do not promote the first plausible idea directly into an implementation plan. Assess authority, evidence, ownership, domain foundations, alternatives, resources, failures, cleanup, and validation; then attack the answers from the strongest credible opposing position. Resolve valid objections by changing the design, narrowing the scope, running an experiment, or rejecting the proposal.

Simplicity is considered only after the fundamentals are sound. Administrative accounting is itself system complexity: keep one authoritative assessment/plan by default, link existing facts, group related answers, and preserve only information that changes decisions, enables execution, supports validation/cleanup, or prevents costly reconstruction.

See [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md).

## Focus branches for large or complex work

When one agent cannot retain the task’s objective, authority, mechanism, dependencies, risks, and material consequence horizon with full attention in one focused session, decompose the task before deep execution.

Keep one canonical parent task and integration spine. Split work into semantic focus branches with one primary question or output, one primary owner, exact inputs/revisions, minimal context, independent falsification, cleanup, and a declared integration obligation.

A focus branch is not automatically a Git branch. Git branches, issues, PRs, worktrees, and documents are created only when isolation, collaboration, review, transport, rollback, dependency, or closure justifies them.

Size leaves by the full-attention rule, not file count or agent count. Shared-contract changes route through the integration spine and invalidate dependents explicitly. Locally accepted branches do not prove parent completion; exact outputs must be centrally reconciled across ownership, contracts, end-to-end behavior, resources, failure, lifecycle, compatibility, security, performance, and cleanup.

Use one canonical branch map and one active branch per agent by default. Rebranch when evidence reveals the task’s true shape rather than silently expanding scope or preserving a bad decomposition.

See [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md).

## Governed plan execution

A plan is a hypothesis under current authority. Execute only a current dependency-ready node with explicit ownership, expected outputs, acceptance, runnable falsification, rollback/safe stop, cleanup obligations, and trustworthy repository/environment state.

Before each material operation, state expected local and wider effects. Apply one coherent ownership-sized action, inspect exact actual effects immediately, register created/modified/obsolete state, run the cheapest decisive falsifier, reconcile material contracts/resources/lifecycle/design/cleanup, and classify the outcome.

A non-material variation may remain inside the node. A material change to cause, owner, authority, public contract, schema, ABI, consequence horizon, resource model, risk, acceptance, rollback, output, downstream order, or cleanup disposition requires plan revision. No node is accepted while invalid partial state, stale generated forms, abandoned resources, unowned residue, or false downstream preconditions remain.

Use one durable execution record only when coordination, continuation, invalid intermediate states, high consequence, or another evidence consumer requires it.

See [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md).

## Cleanup and disposition

Cleanup is an owned state transition, not cosmetic deletion.

Every material task-created, temporarily modified, superseded, generated, diagnostic, partial, local, remote, sensitive, external, and coordination item receives:

- exact identity and owner;
- protected/dependent status;
- purpose and lifetime;
- one explicit disposition;
- dependency-safe trigger and method;
- verification through the owning system.

Permitted dispositions are remove, restore, retain as authority/evidence/recovery, archive, quarantine, transfer, supersede, retain temporarily with owner/trigger, or protect unchanged.

Never destroy user/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, or active dependents without exact authority. Historically useful stale material is archived with provenance rather than silently erased. Secret exposure requires revocation/rotation, not merely deletion.

A clean diff, exited process, successful API response, or merged PR does not prove cleanup of remote, asynchronous, shared, sensitive, generated, cached, or external state.

Use one durable cleanup record only when shared, external, sensitive, retained, recovery-critical, long-lived, atomic, or independently blocked state requires it.

See [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md).

## LEGO boundary

Every substantial component is a movable brick with:

- one coherent owned invariant or lifecycle responsibility;
- one visible owner for authoritative state, mutation, and disposition;
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

Physical inlining or linking into a generated engine does not erase conceptual ownership, contract conformance, or cleanup obligations.

## Simplest sufficient total system

Measure complexity across callers, adapters, generation, persistence, migration, failure, recovery, cleanup, operations, diagnostics, tests, device memory, synchronization, and expected second instances. Complexity moved elsewhere is not removed.

Represent essential domain complexity directly. Remove accidental complexity. Reject ceremony that protects no invariant, boundary, responsibility, or useful operating property.

## UMCGS non-negotiables

- Concrete engines are finite and memory-planned.
- Production active search remains device-closed after ignition.
- Universal contracts do not embed chess, games, one evaluator shape, one action shape, one graph model, or one GPU.
- Generated hot paths may be highly specialized and may eliminate unused abstractions.
- Performance changes require measured mechanism evidence plus semantic and search-quality guardrails.
- Focus branches must not independently drift shared Search IR, graph, policy, evaluator, resource, schema/JIT/ABI, device-closure, or search-quality meaning.
- Plan execution must not introduce hidden first-domain, host-control, memory, graph, evaluator, JIT/ABI, resource, or cleanup assumptions.
- Device contexts, allocations, queues, modules, IPC/shared-memory state, diagnostics, and host resources are released or deliberately retained and verified.
- Local and remote branches, PR/issue state, artifacts, credentials, and external resources are intentional after completion.

## Design, decomposition, execution, and cleanup stop conditions

Stop and resolve the boundary before implementation, deletion, acceptance, or dependent continuation when ownership is ambiguous, the task exceeds full attention without a focus-branch map, branches overlap write authority, shared contracts can drift independently, dependencies are incomplete, authority conflicts, the plan version is stale, expected effects/falsifiers/cleanup are unknown, public contracts leak unstable/private types, state has multiple writers, a name implies unsupported generality, the expected second instance forces redesign, resource exhaustion or teardown is undefined, actual effects materially diverge, protected state may be destroyed, cleanup cannot be verified, or alleged simplicity merely exports the problem.

## Triggered detailed doctrine

- [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md)
- [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md)
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

Use [`../templates/focus-branch.template.yaml`](../templates/focus-branch.template.yaml) only for durable cross-session/parallel/high-consequence branches, [`../templates/plan-execution.template.yaml`](../templates/plan-execution.template.yaml) only for durable coordinated/high-consequence execution, [`../templates/cleanup-disposition.template.yaml`](../templates/cleanup-disposition.template.yaml) only for material lifecycle evidence, [`../templates/design-review.template.md`](../templates/design-review.template.md) for a durable design review, and [`../templates/naming-analysis.template.yaml`](../templates/naming-analysis.template.yaml) for foundational reusable names.
