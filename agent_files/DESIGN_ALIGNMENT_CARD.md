# UMCGS Design Alignment Card

Read this before architecture, specification, engineering decisions, implementation, testing/debugging, large-task decomposition, cleanup, or PR integration. Token backpressure applies even to routine work; load deeper doctrine only when triggered.

## Governing hierarchy

```text
project purpose, domain truth, and accepted authority
    → engineering contract, bounds, and value ordering
    → LEGO ownership and boundaries
    → SOLID internal responsibilities
    → CUPID implementation quality
    → simplest sufficient total system
    → accurate testing, token backpressure, validation, cleanup, and evolution
```

“Simple” never means omitting correctness, resources, lifecycle, compatibility, recovery, accurate evidence, cleanup, or expected-domain capacity.

## Engineering judgment and specification alignment

Before choosing a path:

- state outcome, consumer, authority, environment, non-goals, and completion evidence;
- map material specification obligations to owner, mechanism, failure consequence, and test/evidence;
- classify ambiguity, conflict, gap, stale meaning, platform impossibility, or oracle mismatch rather than resolving it silently;
- distinguish hard gates, mission objectives, supporting qualities, and process costs;
- translate material values into thresholds, prohibited states, optimization directions, or ordinal rules;
- eliminate invalid paths before weighting preferences;
- compare credible alternatives and challenge both overengineering and underengineering;
- choose the lowest complete total system and record why alternatives lost;
- assign P0–P4 priority by consequence, dependency unlock, information value, cost of delay, reversibility, and effort.

Weighted scoring may compare valid paths only. It cannot average away a failed gate.

## Universal token backpressure and practice floor

Every task has an implicit or explicit token posture.

Before work expands, identify:

- exact outcome and authority;
- smallest coherent useful scope;
- risk-appropriate minimum practice floor;
- cheapest decisive evidence;
- reserve for actual-effect inspection, testing, cleanup, and honest reporting;
- pressure triggers and optional work to defer.

The universal floor includes current-state inspection, coherent scope, expected result, decisive verification, actual-effect inspection, relevant testing, cleanup, and truthful limits. Substantial and critical work retain every objectively triggered specification, reasoning, safety/security, resource/failure, compatibility, recovery, review, and integration practice.

When pressure rises:

```text
remove duplication
  → reuse authority/evidence
  → batch coherent work/tests
  → narrow context/output
  → defer optional breadth/polish
  → reduce scope/claim
  → split/rebranch/handoff
  → pause on blocker
```

Reduce waste before breadth and breadth before rigor. Soft estimates are replan signals, not authority. Essential evidence or cleanup can justify a documented extension. Reduced evidence narrows the claim.

Routine work uses an implicit micro-budget and no ledger. Substantial work normally reserves about 30%; critical/large/cross-branch work about 40% after packet loading. Yellow opens no new scope; red stops mutation; emergency preserves exact state only.

Do not continue because of sunk token cost. Do not stop at a soft estimate while required in-scope safety, correctness, cleanup, or handoff remains incomplete and a sound extension or split is available.

## LEGO boundary

Every substantial component has one owned invariant/lifecycle owner, meaningful ports, injected dependencies, adapters, explicit failure/resource/teardown/cleanup, and canonical owner test capsules. Consumers use public contracts rather than internal mutation.

## Focus branches

- One parent/integration spine owns authority, engineering contract, value ordering, dependency state, token posture, test map, contradictions, cleanup, and closure.
- Focus branches are semantic work packets, not automatically Git branches, issues, PRs, components, directories, documents, or test files.
- Decompose when one focused window cannot retain mechanism, consequences, testing, cleanup, and handoff reserve.
- Each leaf has one owner/output, exact inputs, write authority, acceptance/falsifier, testing, cleanup, and integration.
- `accepted` is local; `integrated` is parent-reconciled.
- Shared contract/decision/value/oracle/evidence changes invalidate dependents.
- Parallel branches require non-overlapping ownership, coordinated shared sources, acyclic dependencies, independent rollback/cleanup, and one integration owner.

## Testing and repair loops

- Identify the owned claim and authoritative oracle.
- Capture material regressions/boundaries/counterexamples as test intents.
- Use a minimal provisional reproducer for diagnosis.
- Consolidate related intents into canonical parameterized/property/generated capsules.
- Share safe immutable setup while preserving stable case IDs, isolated mutable state, direct selection, and per-case results.
- Coverage follows owned invariants and risks, not raw counts.
- Required discovery/skips are explicit.
- Use focused fast → owner/contract → integration smoke → triggered deep/forensic tiers.
- Reuse unchanged evidence; every repeat needs a reason.
- Cluster failures by first divergence/root cause and repair the owner coherently.
- Remove/archive provisional and duplicate test artifacts.

Token pressure may remove duplicate runs and unnecessary tiers. It may not remove required oracles, evidence identity, discovery/skip accounting, owner capsules, or integration evidence.

**Consolidation merges execution overhead, not semantic accountability.**

## Universality and foundations

Universal contracts/capsules do not embed the first game, model, evaluator/action/graph shape, or GPU. Define meaning, units, ranges, identity, cardinality, lifetime, concurrency, persistence, failure, testability, cleanup, memory/performance, and value role before choosing foundations.

## Total-system simplicity

Measure complexity across callers, adapters, generation, persistence, migration, failure, recovery, testing/setup/runtime, cleanup, diagnostics, context reconstruction, decision review, device memory, synchronization, and expected second instances. Complexity moved elsewhere is not removed.

## Cleanup

Account for decisions, provisional tests, fixtures, logs, generated output, branches, processes/device state, credentials, persistence, artifacts, and external resources. Protect user/authority/evidence/recovery/shared state and verify explicit dispositions. Token pressure never justifies unsafe residue.

## Review and merge

Review one exact head and complete changed/decision/test/token/integration surface. Verify specification traceability, hard gates, value ordering, candidates, priority, tradeoffs, practice floor, backpressure actions, evidence keys, discovery/skips, failure clusters, tiers, evidence reuse, debts, and checks not run.

Reduced evidence narrows the claim. Head/base/parent/specification/decision/oracle/test/artifact/environment/fixture changes invalidate affected evidence. Merge uses expected-head protection and post-merge verification.

## UMCGS non-negotiables

- Concrete engines are finite and memory-planned.
- Active production search remains device-closed after ignition.
- Performance/search quality are separate from correctness and need equivalence guardrails.
- UMCGS-to-CUDA-JS ownership, one-way dependency, opaque resources, compatibility identity, and no private-source coupling are hard gates.
- GPU capsules share compatible immutable setup but isolate mutable search state and verify publication, cancellation, pressure, teardown, device loss, and leaks when triggered.
- Generated/JIT/ABI/cache evidence identity is complete.
- Large CUDA docs, traces, engines, models, datasets, and logs remain external artifacts unless targeted content is required.
- Token conservation cannot weaken ownership, security, correctness, device closure, lifecycle, compatibility, evidence, or cleanup.

## Stop conditions

Stop when specification/ownership is ambiguous; gates/value ordering are unstated; credible alternatives are absent; branches overlap ownership; shared meaning drifts; evidence identity is incomplete; retries are unchanged; token pressure would violate the practice floor; reserve cannot support required owner capsule/integration/cleanup/handoff; context is red/emergency; tests are undiscovered/skipped; state is contaminated; or cleanup is unsafe.

## Deeper doctrine

Start with [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md), then load [`general_foundation/TOKEN_DISCIPLINE.md`](general_foundation/TOKEN_DISCIPLINE.md), [`general_foundation/ENGINEERING_JUDGMENT.md`](general_foundation/ENGINEERING_JUDGMENT.md), [`general_foundation/TESTING.md`](general_foundation/TESTING.md), [`general_foundation/FOCUS_BRANCHES.md`](general_foundation/FOCUS_BRANCHES.md), [`general_foundation/CLEANUP_AND_DISPOSITION.md`](general_foundation/CLEANUP_AND_DISPOSITION.md), and [`general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md) when triggered.
