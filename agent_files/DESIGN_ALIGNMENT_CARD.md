# UMCGS Design Alignment Card

Read this before architecture, specification, engineering decisions, implementation, material testing/debugging, large-task decomposition, cleanup, or PR integration. Load deeper doctrine only when triggered.

## Governing hierarchy

```text
project purpose, domain truth, and accepted authority
    → engineering contract, bounds, and value ordering
    → LEGO ownership and boundaries
    → SOLID internal responsibilities
    → CUPID implementation quality
    → simplest sufficient total system
    → accurate consolidated testing, validation, cleanup, and evolution
```

“Simple” never means omitting correctness, resources, lifecycle, compatibility, recovery, accurate evidence, cleanup, or expected-domain capacity.

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
- assign P0–P4 priority from consequence, dependency unlock, information value, cost of delay, reversibility, and effort—not ease or loudness.

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

## LEGO boundary

Every substantial component has one owned invariant/lifecycle owner, meaningful ports, injected dependencies, platform/version/domain/model adapters, explicit failure/resource/teardown/cleanup, and canonical owner test capsules. Consumers use public contracts rather than internal mutation.

## Focus branches

- One parent/integration spine owns global authority, engineering contract, invariants, value ordering, dependency state, test map, contradictions, cleanup, and closure.
- Focus branches are semantic work packets, not automatically Git branches, issues, PRs, components, directories, documents, or test files.
- Decompose when one focused session cannot retain mechanism, consequences, testing, and handoff without sampling/skimming.
- Each leaf has one owner/output, exact inputs, write authority, acceptance/falsifier, testing, cleanup, and integration.
- `accepted` is local; `integrated` is parent-reconciled.
- Shared-contract, engineering-decision, value-order, and oracle changes invalidate dependent branches and evidence.
- Parallel branches require non-overlapping write/test ownership, coordinated shared sources, acyclic dependencies, independent rollback/cleanup, and one integration owner.

## Token discipline

Optimize verified lifecycle progress, not shortest text or most code. Preserve roughly 30% context for substantial work and 40% for critical/large work unless a different reserve is demonstrably sufficient. Load operating kernel → owning authority → local mechanism → material consequences → rationale on demand. Yellow opens no new scope; red stops mutation; emergency preserves exact state only. Checkpoints preserve value ordering and rejected-path rationale. Material token debt blocks completion.

## Testing and repair loops

- Identify the owned claim and authoritative, preferably independent oracle.
- Capture every material regression/boundary/counterexample as a test intent immediately.
- Use a minimal provisional reproducer for diagnosis.
- Before branch acceptance, fold related intents into canonical parameterized/property/generated capsules.
- Consolidate shared build/setup/device/model/fixture work while preserving stable case IDs, isolated mutable state, direct selection, and per-case results.
- Coverage follows owned invariants and risks, not raw test/line/file count or blind Cartesian products.
- Required discovery and skips are explicit; zero required discovery and required skips fail.
- Use preflight → focused fast → owner/contract → integration smoke → deep → forensic/release tiers; broad/deep suites stay out of the inner edit loop unless triggered.
- Exact evidence keys include source/test/generated/model/environment/configuration/fixture/seed/tier identity.
- Do not rerun unchanged evidence for reassurance; every repeat needs invalidation, contamination/incompleteness, independent replication, or statistical purpose.
- Cluster failures by first divergence/owner/root cause; repair the authoritative owner coherently; rerun minimal cluster, owning capsule once, then required integration smoke once.
- Keep raw logs as artifacts and active evidence bounded.
- Remove/archive provisional reproducers, duplicate tests/fixtures, diagnostics, and redundant logs after durable equivalent coverage.
- Material decision, test, and token debt block acceptance.

**Consolidation merges execution overhead, not semantic accountability.** An opaque monolithic assertion blob is not an efficient test.

## Universality and foundations

Universal contracts/capsules do not embed the first game, model, evaluator/action/graph shape, or GPU. Define meaning, units, ranges, identity, cardinality, lifetime, concurrency, persistence, failure, testability, cleanup, memory/performance, and value role before choosing foundational representation.

## Composition and total-system simplicity

The composition root owns wiring/lifecycle/teardown and integrated capsule composition—not domain rules. Measure complexity across callers, adapters, generation, persistence, migration, failure, recovery, testing/setup/runtime, cleanup, diagnostics, context reconstruction, decision review, device memory, synchronization, and expected second instances. Complexity moved elsewhere is not removed.

## Cleanup

Account for decision records, provisional tests, fixtures, logs, generated output, local/remote branches, processes/device state, credentials, persistence, artifacts, and external resources. Protect user/authority/evidence/recovery/shared state. Use explicit remove/restore/retain/archive/quarantine/transfer/supersede/protect dispositions and owning-system verification.

## Review and merge

Review one exact head and complete changed/decision/test/integration surface. Verify specification traceability, hard gates, value ordering, candidate paths, rejected-path rationale, priority, tradeoffs, oracles, evidence keys, discovery/skip counts, intents consolidated, failure clusters, tiers, evidence reuse/repeats, decision/test/token/cleanup debt, and checks not run. Head/base/parent/specification/decision/oracle/test/artifact/environment/fixture changes invalidate affected evidence. Merge uses expected-head protection and post-merge target/branch/decision/test/cleanup verification.

## UMCGS non-negotiables

- Concrete engines are finite and memory-planned.
- Active production search remains device-closed after ignition.
- Performance and search quality are separate from correctness and require equivalence guardrails.
- UMCGS-to-CUDA-JS ownership, one-way dependency direction, opaque runtime resources, compatibility identity, and no private-source coupling are hard gates.
- GPU capsules share compatible immutable engine/model/device setup but isolate mutable search state and verify publication, cancellation, pressure, teardown, device loss, and leaks when triggered.
- Generated/JIT/ABI/cache evidence identity is complete.
- Large CUDA docs, traces, generated engines, models, datasets, and logs remain external artifacts unless targeted content is required.

## Stop conditions

Stop before implementation/testing/merge when specification meaning or ownership is ambiguous; hard gates/value ordering are unstated; credible alternatives are absent; a weighted score masks a failed gate; required tests are undiscovered/skipped; branches overlap write/test authority; shared contracts/decisions/oracles drift; evidence identity is incomplete; retries are unchanged; test/context reserve cannot support owner capsule/integration/handoff; state is contaminated; cleanup is unsafe; or alleged simplicity exports the problem.

## Deeper doctrine

Start with [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md), then load [`general_foundation/ENGINEERING_JUDGMENT.md`](general_foundation/ENGINEERING_JUDGMENT.md), [`general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md`](general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md), [`general_foundation/TESTING.md`](general_foundation/TESTING.md), [`general_foundation/DEBUGGING.md`](general_foundation/DEBUGGING.md), [`general_foundation/FOCUS_BRANCHES.md`](general_foundation/FOCUS_BRANCHES.md), [`general_foundation/TOKEN_DISCIPLINE.md`](general_foundation/TOKEN_DISCIPLINE.md), [`general_foundation/CLEANUP_AND_DISPOSITION.md`](general_foundation/CLEANUP_AND_DISPOSITION.md), and [`general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md) when triggered.
