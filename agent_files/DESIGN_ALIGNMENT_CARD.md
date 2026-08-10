# UMCGS Design Alignment Card

Read this before architecture, specification, engineering decisions, implementation, material testing/debugging, large-task decomposition, cleanup/disposition, or PR integration. Token backpressure applies even to routine work. It intentionally repeats the rules most likely to prevent agent drift; load deeper doctrine only when the task triggers it.

## Governing hierarchy

```text
project purpose, domain truth, and accepted authority
    → engineering contract, bounds, and value ordering
    → LEGO component ownership and boundaries
    → SOLID responsibility structure inside each component
    → CUPID implementation quality
    → simplest sufficient total system
    → accurate consolidated testing, token backpressure, validation, cleanup, and evolution
```

A lower level may improve a design only inside the valid envelope established above it. “Simple” never means omitting required correctness, resources, lifecycle, compatibility, recovery, evidence, cleanup, or expected-domain capacity.

## Engineering judgment and specification alignment

Before choosing a path:

- state the owned outcome, consumer, authority, environment, non-goals, and completion evidence;
- map every material specification obligation to owner, mechanism, failure consequence, and test/evidence;
- classify specification ambiguity, conflict, gap, stale meaning, platform impossibility, or oracle mismatch rather than resolving it silently in code;
- distinguish hard gates, mission objectives, supporting qualities, and process costs;
- translate safety, correctness, accuracy, speed, reliability, memory, compatibility, simplicity, and delivery into thresholds, prohibited states, optimization directions, or explicit ordinal rules;
- eliminate invalid paths before weighting preferences;
- compare credible no-change, minimal, proposed, materially different, experiment, staged, or fallback paths where applicable;
- challenge the leading path with overengineering and underengineering cases;
- choose the lowest complete total system and record why alternatives lost;
- assign P0–P4 priority from consequence, dependency unlock, information value, cost of delay, reversibility, and effort.

Weighted scoring may compare valid paths only. It may not average away a failed safety, correctness, resource, compatibility, ownership, or evidence gate.

Default fallback ordering when the subsystem defines no better one:

```text
authority / legality / explicit ethics
    → unacceptable irreversible harm
    → semantic correctness and hard mission bounds
    → mission-sustaining reliability / compatibility / operability
    → mission quality and performance
    → maintainability / usability / observability / portability
    → delivery speed / token cost / convenience / polish
```

Purpose may promote another concern into a gate. State the deviation, authority, consequence, owner, evidence, and revisit trigger.

## Universal token backpressure and minimum practice floor

Every task has an implicit or explicit token posture from its first retrieval or mutation.

Before work expands, identify:

- exact outcome and authority;
- relevant current state;
- smallest coherent useful scope;
- risk-appropriate minimum practice floor;
- cheapest decisive evidence;
- reserve for actual-effect inspection, testing, cleanup, and honest reporting;
- pressure triggers and optional work to defer.

The universal floor preserves request/constraints, authoritative current state, coherent scope, expected result, decisive verification, actual-effect inspection, relevant testing, cleanup/reconciliation, and truthful limits. Substantial and critical work preserve every objectively triggered specification, reasoning, safety/security, resource/failure, compatibility, recovery, review, and integration practice.

When pressure rises:

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

Routine work uses an implicit micro-budget and no ledger. Substantial work normally reserves about 30% and critical/large/cross-branch work about 40% after packet loading, unless a different reserve is demonstrably sufficient. Soft estimates are replan signals rather than authority. Essential evidence or cleanup may justify an extension, followed by narrowing or split to restore reserve.

Yellow opens no new scope; red stops mutation; emergency preserves exact state only. Do not continue because of sunk token cost. Checkpoint budget extensions, scope/claim changes, deferrals, splits, and handoffs.

## LEGO boundary

Every substantial component is a movable brick with:

- one coherent owned invariant or lifecycle responsibility;
- one visible owner for authoritative state, mutation, testing, and disposition;
- small meaningful domain-named ports;
- composition-visible injected dependencies;
- unstable platform, CUDA, version, format, persistence, and compatibility details behind adapters;
- explicit lifecycle, failure, cancellation, finite-resource, teardown, testing, and cleanup behavior where material;
- isolated contract tests and replaceability without consumer rewrites.

Consumers request changes through contracts. They do not mutate another component’s internals or deep-import private files.

## Focus branches for large or complex tasks

- Keep one canonical parent task and integration spine owning global authority, engineering contract, value ordering, invariants, vocabulary, dependency state, testing, token posture, contradictions, cleanup, and closure.
- A focus branch is a semantic work packet, not automatically a Git branch, issue, PR, component, directory, or document.
- Decompose before deep execution when the task exceeds one focused session, spans owners/contracts/paths, contains independent unknowns, crosses agents/sessions, enables parallel work, or would require sampling/skimming.
- Each leaf has one primary question/output, one owner, exact input revisions, minimal context, write permissions, acceptance/falsifier, testing, cleanup, and integration obligations.
- Size leaves by full attention, not line/file/token/agent count.
- A leaf must fit its complete packet, mechanism, material consequences, required testing, cleanup, and handoff reserve.
- Normally give one agent one active branch and checkpoint before switching.
- Shared-contract, engineering-decision, value-order, oracle, and evidence-key changes route through the integration spine and invalidate dependents.
- Parallel branches require non-overlapping owners/write surfaces, coordinated shared sources, acyclic dependencies, independent rollback/cleanup, and one integration owner.
- `accepted` means locally supported; `integrated` means reconciled into the parent result.
- Create separate Git/GitHub objects only when isolation, review, transport, rollback, owner, risk, dependency, or closure is independently meaningful.

## Universality without vagueness

UMCGS is universal at contracts and compilation boundaries, not through one giant generic runtime object.

- Name the widest truthful invariant, not the first domain or consumer.
- State intended members, permitted variation, and excluded cases.
- Apply the second-instance test: a second intended use should fit by configuration, profile, adapter, or already-permitted extension—not foundational redesign.
- Apply the first-consumer deletion test: a foundation should remain coherent if its first consumer disappears.
- Reject broad `Manager`, `System`, `Common`, `Shared`, `Generic`, `Data`, `Util`, and `Helper` owners that do not state one exact responsibility.

## Foundations and bounds

Before choosing a type, width, identity, schema, collection, queue, precision, or layout, define semantic meaning, units, valid range, cardinality/growth, lifetime, concurrency, persistence/versioning, failure behavior, testability, cleanup/reclamation, and memory/performance budget.

Choose cheap durable capacity across the reasonably expected domain. Reject ordinary-growth migration traps and speculative subsystems.

## Composition

The composition root selects concrete domain, policy, evaluator, CUDA/platform, persistence, and compatibility adapters. It owns wiring, lifecycle, coordinated teardown, and integrated capsule composition—not domain rules. Dependencies point toward stable contracts.

## Total-system simplicity

Measure complexity across callers, adapters, generation, persistence, migration, failure, recovery, cleanup, operations, diagnostics, tests/setup/runtime, focus-branch coordination, context reconstruction, device memory, synchronization, and expected second instances. Complexity moved elsewhere is not removed.

Represent essential domain complexity directly. Remove accidental complexity. Reject ceremony that protects no invariant, boundary, responsibility, evidence, or operating property.

## Testing and repair loops

- Identify the owned claim and authoritative, preferably independent oracle.
- Capture material regressions/boundaries/counterexamples as test intents immediately.
- Use a minimal provisional reproducer during diagnosis.
- Consolidate related intents into canonical parameterized/property/generated capsules before branch acceptance.
- Share expensive immutable setup while preserving stable case IDs, isolated mutable state, direct selection, and per-case results.
- Map coverage by owned invariants and risk, not raw test/file/line counts.
- Required discovery and skips are explicit.
- Use preflight → focused fast → owner/contract → integration smoke → triggered deep/forensic tiers.
- Reuse exact unchanged evidence; every repeat needs a reason.
- Cluster failures by first divergence/root cause; repair the owner coherently; rerun minimal cluster, owner capsule once, then required integration smoke.
- Remove/archive provisional and duplicate test artifacts.
- Material decision, test, and token debt block acceptance.

Token pressure may remove duplicate tests and unnecessary tiers, but not required oracles, evidence identity, discovery/skip accounting, owner capsules, or integration evidence.

Consolidation merges execution overhead, not semantic accountability.

## Cleanup and disposition

- Cleanup is explicit disposition, not automatic deletion.
- Account for task-created, temporarily modified, superseded, generated, diagnostic, partial, local, remote, sensitive, external, and coordination state.
- Protect user/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, and active dependents.
- Use remove, restore, retain authority/evidence/recovery, archive, quarantine, transfer, supersede, temporary retention with owner/trigger, or protect unchanged.
- Historically useful stale material is archived with provenance; pure task-owned scratch is removed.
- Use narrow exact destructive targets, preview when available, preserve rollback/evidence, and verify actual local/remote state through the owning system.
- Secret exposure requires revocation or rotation; deletion alone is insufficient.
- Cleanup debt is allowed only when immediate cleanup is less safe and must be exact, bounded, contained, owned, visible, and objectively triggered.
- A clean diff, green test, successful API response, or merged PR does not by itself prove cleanup.
- Token pressure never justifies unsafe residue or omitted retained-state reporting.

## Review and merge

- Review the actual complete PR diff and affected integration at one exact head; the PR description and CI are evidence, not proof.
- Account for the engineering contract, branch map, exact outputs, token practice floor/backpressure actions, invalidated/deferred work, and integration evidence when a PR represents substantial work.
- Every material PR receives complete author-side review. Independent review is required by phase, policy, owner instruction, or objective consequence.
- A head, material base, parent plan, shared contract, decision, oracle, or evidence-key change invalidates affected review.
- Blocking findings, unsafe cleanup residue, required gates, and review threads must be resolved before merge.
- Merge is a separate guarded transaction using an expected-head guard where supported.
- Verify resulting target SHA/tree, issue/branch/worktree/dependent effects, branch integration state, and post-merge cleanup.
- Reduced evidence narrows the claim; it does not preserve an unsupported full/release claim.

## UMCGS non-negotiables

- A concrete engine is finite and memory-planned.
- Active production search remains device-closed after ignition.
- Universal contracts do not embed chess, games, one evaluator/action/graph shape, or one GPU.
- Generated hot paths may specialize and eliminate unused abstractions.
- No optimization is accepted without mechanism evidence and semantic/search-quality guardrails.
- Focus branches may not independently drift Search IR, domain/graph/policy/evaluator/resource meaning, JIT/ABI/cache identity, device closure, engineering decisions, or test oracles.
- Device contexts, allocations, modules, IPC/shared memory, queues, diagnostics, and host resources are released or deliberately retained and verified.
- Token conservation cannot override ownership, device closure, security, correctness, finite-resource, compatibility, lifecycle, evidence, or cleanup gates.

## Stop conditions

Stop and resolve the boundary before implementation/testing/cleanup when ownership is ambiguous, a large task lacks a full-attention map, branches overlap authority, shared meaning can drift, dependencies cycle, a public contract leaks private types, resource exhaustion/teardown is undefined, token pressure would violate the practice floor, reserve cannot support required testing/integration/cleanup/handoff, context is red/emergency, required tests are undiscovered/skipped, cleanup cannot be verified, or alleged simplicity exports the problem.

Stop PR integration when the reviewed head is stale, changed surface/branch outputs/token decisions are unaccounted, a blocker or unsafe cleanup remains, required evidence/gates are missing, or target/post-merge state cannot be verified.

## Deeper doctrine

Start with [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md), then load [`general_foundation/TOKEN_DISCIPLINE.md`](general_foundation/TOKEN_DISCIPLINE.md), [`general_foundation/ENGINEERING_JUDGMENT.md`](general_foundation/ENGINEERING_JUDGMENT.md), [`general_foundation/TESTING.md`](general_foundation/TESTING.md), [`general_foundation/FOCUS_BRANCHES.md`](general_foundation/FOCUS_BRANCHES.md), [`general_foundation/CLEANUP_AND_DISPOSITION.md`](general_foundation/CLEANUP_AND_DISPOSITION.md), and [`general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md) when triggered.
