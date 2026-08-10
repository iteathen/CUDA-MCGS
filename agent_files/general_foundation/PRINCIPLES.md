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
measured testing, validation, token discipline, cleanup, and evolution
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

Keep one canonical parent task and integration spine. Split work into semantic focus branches with one primary question/output, one primary owner, exact inputs/revisions, minimal context, independent falsification, testing, cleanup, and integration obligations.

A focus branch is not automatically a Git branch. Git branches, issues, PRs, worktrees, documents, and test files are created only when isolation, collaboration, review, transport, rollback, dependency, or closure justifies them.

Size leaves by full attention, not file/test/agent count. Shared-contract, engineering-decision, value-order, and oracle changes route through the integration spine and invalidate dependents explicitly. Locally accepted branches or passing capsules do not prove parent completion; exact outputs and evidence must be centrally reconciled.

See [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md).

## Token-use and context discipline

Tokens are finite, but minimum token count is not the objective. Optimize verified coherent progress across retrieval, reasoning, generation, tools, testing, validation, integration, cleanup, review, recovery, and handoff.

Before substantial mutation, reserve enough context to inspect actual effects, test/falsify claims, reconcile integration, clean up, review, and hand off. Default reserves are 30% for substantial work and 40% for critical/large/cross-branch work after loading the branch packet unless a different reserve is demonstrably sufficient.

Load context in layers: operating kernel, owning authority, local mechanism, material consequence horizon, then rationale/provenance. Search before broad reading, prefer exact diffs/ranges and contiguous owning sections, batch independent retrievals, and keep large artifacts/logs external when exact identity and targeted sections suffice.

Yellow means no new scope; red means stop new mutation and checkpoint; emergency means preserve exact state only. Never solve pressure by omitting authority, engineering-decision evidence, test evidence, failure behavior, cleanup, or handoff.

Checkpoints preserve exact revisions, decisions, value ordering, rejected paths, contradictions, failed hypotheses, test state, partial state, checks run/not run, cleanup, and next safe action. Material token debt blocks completion.

See [`TOKEN_DISCIPLINE.md`](TOKEN_DISCIPLINE.md) and [`CONTEXT_ROUTING.md`](CONTEXT_ROUTING.md).

## Testing and repair-loop discipline

Testing proves owned claims; raw test count and green CI do not.

- Identify authoritative, preferably independent oracles.
- Capture every material regression/boundary/risk as a test intent immediately.
- Use the smallest provisional reproducer during diagnosis.
- Consolidate related intents before branch acceptance into owning parameterized/property/generated capsules.
- Share expensive immutable build/setup/device/model/fixture work while preserving stable case IDs, isolated mutable state, direct selection, and per-case reporting.
- Map completeness by owned invariants and risk-triggered conditions—not files, lines, or a blind Cartesian product.
- Use preflight → focused fast → owner/contract → integration smoke → deep → forensic/release tiers. Broad/deep suites stay out of the inner edit loop unless triggered.
- Key evidence by exact source/test/artifact/model/environment/configuration/fixture/seed/tier identity and reuse unchanged evidence.
- Retry only after material invalidation, contamination/incompleteness, independent replication, statistical need, or a changed hypothesis/input/code/environment/transport.
- Cluster failures by first divergence and authoritative owner; repair root causes coherently, then rerun minimal cluster, owning capsule once, and required integration smoke once.
- Required discovery and skip accounting are explicit; zero required discovery and silent skips fail.
- Remove or archive provisional reproducers, duplicate fixtures/cases, diagnostics, and logs after durable equivalent coverage exists.
- Material test debt and token debt block acceptance.

Consolidation merges execution overhead, not semantic accountability. A monolithic assertion blob is not an efficient capsule.

See [`TESTING.md`](TESTING.md) and [`DEBUGGING.md`](DEBUGGING.md).

## Governed plan execution

A plan is a hypothesis under current authority. Execute only a current dependency-ready node with explicit ownership, expected outputs, acceptance, runnable falsification, testing, rollback/safe stop, cleanup, integration, and trustworthy repository/environment/context state.

Before each material operation, state the obligation/decision it implements, expected local/wider effects, preserved value ordering, and decisive evidence. Apply one coherent ownership-sized action, inspect actual effects, register created/modified/obsolete state and test intents, run the cheapest decisive falsifier, reconcile contracts/resources/lifecycle/design/testing/cleanup, and classify the outcome.

A material change to cause, owner, authority, public contract, schema, ABI, consequence horizon, resource model, risk, value ordering, priority, acceptance, rollback, output, downstream order, oracle/evidence invalidation, cleanup, or context fit requires plan revision. No node is accepted with invalid partial state, stale generated forms, abandoned resources, unresolved decision/test/token debt, unowned residue, or false downstream preconditions.

See [`PLAN_EXECUTION.md`](PLAN_EXECUTION.md).

## Cleanup and disposition

Cleanup is an owned state transition, not cosmetic deletion.

Every material task-created, provisional-test, generated, diagnostic, partial, local, remote, sensitive, external, and coordination item receives exact identity/owner, dependent status, purpose/lifetime, disposition, dependency-safe trigger/method, and owning-system verification.

Permitted dispositions are remove, restore, retain as authority/evidence/recovery, archive, quarantine, transfer, supersede, retain temporarily with owner/trigger, or protect unchanged.

Never destroy user/pre-existing work, authority, evidence, recovery state, shared resources, protected branches, or active dependents without exact authority. Historically useful stale material is archived with provenance. Secret exposure requires rotation/revocation.

A clean diff, exited process, green test, successful API response, or merged PR does not prove cleanup of remote, shared, sensitive, generated, cached, or external state.

See [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md).

## LEGO boundary

Every substantial component is a movable brick with:

- one coherent owned invariant/lifecycle responsibility;
- one visible owner for authoritative state, mutation, tests, and disposition;
- small meaningful domain-named ports;
- composition-visible injected dependencies;
- unstable platform/CUDA/version/format/domain/model details behind adapters;
- explicit lifecycle, cancellation, failure, resource, testing, and cleanup behavior;
- replaceability demonstrated through owning contract capsules.

Consumers request changes through contracts. They do not mutate internals or deep-import private files.

## SOLID and CUPID inside the brick

SOLID separates responsibilities where meaning, ownership, change, testing, substitution, concurrency, lifetime, or cleanup requires it without ceremonial decomposition.

CUPID makes the valid implementation composable, idiomatic, predictable, domain-based, and pleasant to work with.

## Universal without vague genericity

UMCGS is universal at contracts and compilation boundaries, not through one giant optional-field runtime object.

- Name the widest truthful invariant, not the first domain/consumer.
- State intended members, permitted variation, and exclusions.
- Apply second-instance and first-consumer-deletion tests.
- Reject broad `Manager`, `System`, `Common`, `Shared`, `Generic`, `Data`, `Util`, `Helper`, `Processor`, or `Handler` owners without one exact responsibility.

## Domain-appropriate foundations

Before choosing type, width, identity, schema, collection, queue, precision, or layout, define semantic meaning, units, valid range, cardinality/growth, lifetime, concurrency, persistence/versioning, failure, testability, cleanup/reclamation, and memory/performance budget.

Choose cheap durable capacity across the reasonably expected domain. Reject ordinary-growth migration traps and speculative subsystems.

## Composition and adapters

The composition root selects concrete domain, policy, evaluator, CUDA/platform, persistence, and compatibility adapters. It owns wiring, lifecycle, coordinated teardown, and integrated capsule composition—not domain/search rules.

Physical inlining/linking into a generated engine does not erase conceptual ownership, contract conformance, test ownership, cleanup, or artifact identity.

## Simplest sufficient total system

Measure complexity across callers, adapters, generation, persistence, migration, failure, recovery, testing/setup/runtime, cleanup, operations, diagnostics, context reconstruction, device memory, synchronization, and expected second instances. Complexity moved elsewhere is not removed.

Represent essential domain complexity directly. Remove accidental complexity. Reject ceremony that protects no invariant, boundary, responsibility, evidence, or operating property.

## UMCGS non-negotiables

- Concrete engines are finite and memory-planned.
- Production active search remains device-closed after ignition.
- Universal contracts/capsules do not embed chess, games, one evaluator/action/graph shape, or one GPU.
- Generated hot paths may specialize and eliminate unused abstractions.
- Performance changes require mechanism evidence plus semantic/search-quality guardrails.
- Focus branches may not independently drift Search IR, graph, policy, evaluator, resource, schema/JIT/ABI, device-closure, engineering-decision, test-oracle, or search-quality meaning.
- Test evidence keys include all material source/schema/generator/compiler/model/adapter/hardware/runtime/configuration/fixture dimensions.
- Device contexts, allocations, queues, modules, IPC/shared memory, diagnostics, test state, and host resources are released or deliberately retained and verified.
- Large docs/traces/generated engines/models/logs remain external artifacts with exact identities unless targeted content is required.
- Local/remote branches, PR/issue state, test artifacts, credentials, and external resources are intentional after completion.

## Stop conditions

Stop before implementation, testing, deletion, acceptance, or dependent continuation when ownership or specification meaning is ambiguous; hard gates and value ordering are unstated; credible alternatives are absent; a large task lacks a focus map; branches overlap write/test authority; shared contracts/decisions/oracles can drift; dependencies are incomplete; authority conflicts; plan/evidence identity is stale; expected effects/falsifiers/testing/cleanup are unknown; token reserve cannot support owner-capsule/integration/handoff; context is red/emergency; required tests are undiscovered/skipped; the oracle is untrusted; repeated runs lack invalidation; resource exhaustion/teardown is undefined; actual effects diverge; protected state may be destroyed; or alleged simplicity merely exports the problem.

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

Use [`../templates/engineering-decision.template.yaml`](../templates/engineering-decision.template.yaml) only for durable foundational/contested/high-consequence decision state and [`../templates/test-batch.template.yaml`](../templates/test-batch.template.yaml) only for durable multi-intent/cross-session/expensive-setup/failure-cluster test state; other specialist templates remain proportional to their real consumers.
