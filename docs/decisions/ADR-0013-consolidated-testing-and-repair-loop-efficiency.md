# ADR-0013: Consolidated Testing and Repair-Loop Efficiency

**Status:** Accepted

**Date:** 2026-08-10

## Context

Agents often lose more time and context in testing and repair than in initial implementation. The common pattern is a long sequence of small edits, repeated broad suite runs, one-off reproducers, duplicated fixtures, full logs, test-by-test repairs, and repeated evidence against unchanged code. This creates high token cost without proportionate confidence.

The opposite shortcut—running fewer tests, weakening assertions, sampling silently, or delaying regression coverage—reduces accuracy and completeness.

UMCGS needs a testing discipline that jointly optimizes accuracy, completeness, speed, diagnostic value, token use, non-repetition, and maintainability. It must also support the project owner’s direction to accumulate discovered tests and later merge related tests into one efficient execution without losing case-level accountability.

## Source adaptation

This decision adapts and synthesizes:

- `iteathen/Ars-Thaumaturgica` commit `c3e25ad1032a1927c9709580fb415ffc48b91020`;
- `docs/foundation/development-phases-and-validation.md`, especially local-first focused validation, disjoint workflow ownership, explicit triggers for expensive suites, stale-run cancellation, and avoiding duplicate fast validation;
- `docs/foundation/validation-and-accountability.md`, especially the cheapest-decisive evidence ladder, risk-triggered validation, bounded diagnostics, and precise claim limits;
- UMCGS ADR-0007 proportional sanity checking;
- UMCGS ADR-0009 governed plan execution;
- UMCGS ADR-0011 focus-branch decomposition;
- UMCGS ADR-0012 token-use and context discipline;
- UMCGS `DEBUGGING.md`, `TESTING.md`, and `VALIDATION_POLICY.md` as superseded/expanded local foundations.

UMCGS adds explicit test-intent banking, provisional reproducer lifecycle, consolidated test capsules, evidence keys, no-repeat rules, failure clustering, coherent repair batches, exact skip/discovery accounting, test invalidation graphs, and GPU/search/generated-engine test consolidation. The UMCGS doctrine is authoritative here; source material records provenance rather than an external dependency.

## Decision

UMCGS adopts the following testing model.

### Capture immediately, consolidate at a coherent boundary

Every material discovered invariant, regression, boundary, counterexample, or risk becomes a test intent immediately. During diagnosis it may use a minimal provisional reproducer. Before branch acceptance, related intents are folded into the canonical owning test capsule.

A test capsule executes many independently identified cases through shared build/setup/device/model/fixture work. It normally uses table-driven, parameterized, property-based, metamorphic, generated, or conformance cases.

Consolidation merges execution overhead, not semantic accountability. Each case retains a stable ID, independent input/expected result, isolated mutable state, direct selection, and per-case reporting.

### Accuracy before pass count

Material tests identify an authoritative oracle, avoid copying implementation logic, prove exact subject/artifact/environment identity, account for required/conditional/optional skips, and demonstrate sensitivity to plausible failure when consequence requires it.

Zero required test discovery fails. Cached or reused results require a complete evidence key.

### Completeness by invariant and risk

Coverage is mapped from owned contracts and risk-triggered conditions rather than files, lines, or raw test count. Agents use equivalence partitions, boundaries, risk-based combinations, properties, metamorphic relations, deterministic samples, and synthetic domains to avoid blind combinatorial expansion.

Sampling is disclosed and never represented as full coverage.

### Tiered testing

Testing escalates through:

1. preflight identity/static/discovery checks;
2. focused fast cases and exact regression reproducers;
3. complete owner/contract capsules;
4. integration smoke;
5. deep property/fuzz/sanitizer/stress/migration/performance evidence;
6. forensic/release evidence.

The focused fast capsule is the inner loop. Owner and integration capsules run after coherent repair batches, not after every edit. Deep and forensic tiers require risk, mismatch, stabilization, or release triggers.

### Evidence reuse and no-repeat

A test result is identified by exact subject/test/artifact/schema/model/hardware/runtime/configuration/fixture/seed/command state. An identical evidence key is not rerun merely for reassurance.

Reruns require material invalidation, contaminated/incomplete prior state, explicit independent replication, or a statistical/nondeterministic claim. A failed command or test is not retried without a changed hypothesis, input, code, environment, or transport.

### Failure clustering and repair

Agents freeze one reproduction, run one baseline, cluster failures by first divergence/owner/root cause, repair one authoritative boundary in a coherent batch, rerun the minimal affected cluster, then run the owning capsule once and integration smoke once.

Cascading failures are not repaired assertion by assertion. Broad suites do not substitute for root-cause localization.

### Build once, run many

Compatible cases share immutable build, generated artifact, model, device, dataset, container, or fixture setup. Mutable state is isolated/reset between cases. Parallelism is allowed only under independent state and bounded resources.

### Test and token debt

Pending material test intents, provisional-only regressions, duplicate tests, missing evidence identity, or unreconciled skips are test debt. Missing durable causes, branch outputs, partial state, or cleanup information are token debt. Material debt blocks acceptance unless explicitly authorized and safely tracked.

## Proportional records

Routine changes need no standalone test ledger.

Use `agent_files/templates/test-batch.template.yaml` when:

- several cases are being accumulated and consolidated;
- a failure cluster crosses sessions or agents;
- expensive setup/device/model/artifact reuse must be coordinated;
- completeness/skip/invalidation accounting is material;
- another consumer needs exact pending-test and repair-cycle evidence.

The record stores unique case-bank, capsule, evidence-key, failure-cluster, consolidation, and selection state. It does not duplicate specifications, source, raw logs, or ordinary CI history.

## UMCGS-specific consequences

- Universal contracts use consolidated synthetic-domain conformance capsules that preserve domain/case identity.
- Search semantic correctness, deterministic reference parity, statistical quality, and performance remain separate claims.
- GPU capsules group compatible cases by generated-engine/model/architecture/driver/toolkit/resource identity, load expensive immutable state once, isolate mutable search state, and verify teardown/leak behavior.
- CUDA sanitizer/race/forensic runs are triggered rather than placed in every inner loop.
- Generated/JIT/ABI/cache evidence keys include every material source, schema, compiler, model, adapter, architecture, build-flag, and resource-profile dimension.
- The active specification process must define test capsules and invalidation relationships alongside contracts rather than postponing test architecture until implementation.

## Consequences

- Agents spend fewer tokens on repeated commands, duplicate logs, and duplicated test code.
- Regression knowledge is captured immediately without forcing premature one-off permanent tests.
- Many cases execute through one efficient harness while remaining independently diagnosable.
- Broad suites move out of the inner edit loop.
- Failures are repaired by root cause and owner rather than by assertion count.
- Passing evidence becomes reusable because its identity and invalidation conditions are explicit.
- Completeness is judged by owned invariants and risks rather than test count.
- Test cleanup and consolidation become part of branch acceptance.

## Alternatives considered

### Run the entire suite after every edit

Rejected. It is slow, token-intensive, diagnostically weak, and repeatedly proves unchanged behavior.

### Add every discovered case as a separate test file or command

Rejected. It duplicates setup, build, fixtures, logs, and maintenance. Test intents are accumulated and folded into owning capsules.

### Delay recording tests until the fix is complete

Rejected. Regression knowledge and expected behavior are easily lost or rewritten by the implementation.

### Merge all assertions into one monolithic test

Rejected. Consolidated execution must preserve case identity, isolation, and complete result reporting.

### Trust existing tests and expected values

Rejected. Existing tests are evidence and may contain stale or implementation-derived oracles.

### Use CI as the main debugging loop

Rejected. Local/focused evidence should localize ordinary failures before push; CI confirms committed evidence and broader environments.

### Optimize for raw test count or coverage percentage

Rejected. Those measures can increase without improving oracle accuracy, failure discrimination, risk coverage, or integration confidence.

### Never rerun a passing test

Rejected. Material invalidation, statistical claims, independent replication, and contamination can require new evidence. The rule is no unchanged unreasoned reruns.

## Validation

A conforming material test/repair cycle shows:

- authoritative oracles and exact evidence identity;
- coverage map by owned invariant and risk;
- required discovery and skip accounting;
- immediate test-intent capture;
- consolidated capsules with shared setup and independent case results;
- tiered selection and explicit escalation;
- no unchanged unreasoned reruns;
- failure clustering and one changed hypothesis per retry;
- coherent owner repair followed by minimal cluster, owning capsule, and integration evidence;
- provisional/duplicate test cleanup;
- no material test or token debt;
- exact checks not run and claim limits.

Agent routing, validation policy, debugging, workflow, review, PR/issue templates, plans/focus branches/execution/handoffs, status, indexes, active next-step state, and governance checks must link to the doctrine.

## Revisit triggers

Revisit when agents still spend most context in test loops, capsules become opaque monoliths, case banks accumulate unresolved debt, suites remain slow despite consolidation, failure clusters do not localize owners, evidence reuse becomes unsafe, or new runtime/test infrastructure provides a more accurate cost or invalidation model. Changes must preserve oracle accuracy, case-level identity, completeness accounting, no-repeat evidence, and root-cause repair.
