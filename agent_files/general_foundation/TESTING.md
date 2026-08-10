# Testing and Repair-Loop Discipline

**Scope:** All test planning, test implementation, test execution, failure diagnosis, repair, regression capture, conformance, integration, performance validation, CI, and release evidence in UMCGS.

## Purpose

Agents commonly spend more tokens and wall time in test–repair loops than in the original implementation. The waste usually comes from:

- running broad suites before the failure is localized;
- creating one permanent test file or command per discovered case;
- rebuilding and reloading the same expensive fixtures repeatedly;
- rerunning the same evidence against unchanged code and inputs;
- repairing failures one test at a time when they share one cause;
- producing large logs that must be reread instead of one structured failure summary;
- confusing a large number of tests with accurate or complete evidence;
- changing tests to match the implementation instead of validating the oracle;
- delaying integration and completeness checks until the context budget is nearly exhausted.

The governing rule is:

> Design the evidence before the repair. Capture every material test intent immediately, execute the cheapest decisive subset after coherent change batches, consolidate related cases into one efficient owning harness, preserve case-level identity, and never rerun unchanged evidence without an explicit reason.

The goal is not the fewest tests or the fastest green result. The goal is the least total test–repair cost that produces accurate, complete, independently meaningful evidence.

## Core terms

### Test intent

A compact record of a claim that must be falsifiable. It includes:

- stable case ID;
- owned invariant or failure mode;
- authoritative oracle;
- input/state and expected result;
- relevant normal, boundary, invalid, pressure, lifecycle, concurrency, compatibility, or cleanup condition;
- owning test capsule;
- execution tier;
- invalidation keys;
- status: `pending`, `provisional`, `consolidated`, `passing`, `failing`, `blocked`, `retired`, or `superseded`.

A test intent is recorded when the need is discovered. It does not require an immediate permanent one-off test file.

### Provisional reproducer

The smallest temporary probe that proves a defect or uncertain behavior exists. It may be a direct command, trace, script, fixture, or temporary test case. It is not automatically durable.

### Durable test case

A case owned by the canonical component, contract, conformance, integration, or lifecycle suite. It has a stable ID, oracle, isolated state, exact result, and clear invalidation behavior.

### Test capsule

A consolidated, independently reportable collection of related cases that share an owner, oracle, setup, artifact identity, runtime environment, and execution tier.

A capsule normally uses table-driven, parameterized, property-based, metamorphic, or generated cases. It executes many cases through one build/setup/device/model load and one command while preserving each case’s identity and failure result.

**Consolidation merges execution overhead, not semantic accountability.** One opaque assertion blob is not a test capsule.

### Evidence key

The exact identity of a test result:

```text
subject revision
+ test revision
+ generated artifact / binary / package identity
+ schema / model / evaluator / adapter versions
+ hardware / driver / toolkit / runtime profile
+ configuration and resource profile
+ input dataset / fixture version
+ seed or schedule identity
+ command and execution tier
```

Evidence with the same key is the same evidence unless repeated trials are part of the claim.

### Failure cluster

A group of failing cases with the same first divergence, violated invariant, owner, causal mechanism, or failure signature. A cluster is repaired at the owning boundary rather than test by test.

### Test debt

A material test intent that remains provisional, duplicated, missing from the owning capsule, or unable to run. Test debt is not automatically bad during investigation, but it must be empty or explicitly accepted before the affected branch or parent claim closes.

## Testing objectives

Testing must jointly optimize:

1. **Accuracy** — the test asks the right question and has a trustworthy oracle.
2. **Completeness** — every material owned invariant and risk-triggered condition is accounted for at justified depth.
3. **Speed** — evidence arrives early enough to change the path without unnecessary setup, build, or suite cost.
4. **Token efficiency** — results are compact, structured, deduplicated, and continuation-ready.
5. **Non-repetition** — unchanged evidence is reused; reruns require invalidation or a statistical reason.
6. **Diagnostic value** — failures identify the first divergence and likely owner rather than only reporting a final symptom.
7. **Maintainability** — cases consolidate under one owner instead of multiplying commands, fixtures, files, and duplicated assertions.
8. **Integration value** — local passing evidence composes into boundary and end-to-end confidence.

A faster suite that weakens the oracle, drops cases, hides skips, changes semantics, or prevents localization is not an improvement.

## Accuracy: prove the test before trusting the pass

### Oracle authority

Each material test identifies the source of expected behavior:

- accepted specification or contract;
- authoritative reference model;
- independently verified target behavior;
- mathematical property;
- compatibility promise;
- owner-approved migration or recovery rule;
- measured baseline for a performance claim.

Implementation code, comments, prior agent output, and existing tests are evidence, not automatic authority.

When code and test disagree, question specification, oracle, fixture, environment, generated artifact, and implementation equally.

### Oracle independence

Avoid reproducing the implementation algorithm inside the test. Prefer:

- small independent reference implementations;
- differential tests against an independently trusted backend;
- metamorphic properties;
- algebraic or conservation properties;
- round-trip and inverse relations;
- cross-representation parity;
- exact boundary traces;
- externally verified fixtures.

A test that copies the same defect can pass perfectly and prove nothing.

### Sensitivity check

For critical tests, show that the test can detect a plausible violation. Use one or more of:

- a known-bad fixture;
- a targeted mutation;
- an intentionally corrupted artifact;
- inverted or boundary-shifted expected value;
- fault injection;
- a negative control.

Mutation testing is triggered where the consequence justifies it; it is not required mechanically for every low-risk test.

### Exact subject identity

Tests must prove they executed the intended binary, generated engine, model, schema, package, branch, and revision. Detect stale binaries, cached outputs, wrong devices, mixed revisions, missing tests, and empty discovery.

A suite that discovers zero required cases fails. A cached result whose identity cannot be proven is unusable.

### Skip accounting

Classify skips as:

- **required** — absence is a failure;
- **conditional** — allowed only when the exact capability/condition is absent and reported;
- **optional/informational** — does not support the acceptance claim.

Report expected, executed, passed, failed, skipped-by-class, and not-discovered counts. Silent skips and broad skip filters are prohibited.

## Completeness without combinatorial explosion

Build a coverage map from owned contracts and risks, not from files or lines.

For each material invariant, consider applicable conditions:

- normal operation;
- lower/upper/empty/singleton/overflow boundaries;
- invalid, hostile, malformed, unknown-version, and unsupported inputs;
- lifecycle start/stop/restart/cancel/retry;
- partial failure and recovery;
- finite-resource pressure and exhaustion;
- concurrency, ordering, publication, duplication, loss, and stale state;
- persistence, migration, compatibility, and rollback;
- security, permissions, privacy, and provenance;
- cleanup and every terminal path;
- representative performance degradation;
- cross-component and end-to-end composition.

Do not generate a blind Cartesian product. Compress coverage with:

- equivalence partitions;
- boundary-value cases;
- pairwise or risk-driven combinations;
- property-based generation;
- metamorphic relations;
- deterministic representative sampling;
- synthetic domains that expose several invariants at once;
- one state-transition sequence that validates all materially related state after each step.

Sampling must be deterministic and must disclose its scope. A sampled run never becomes a full-coverage claim.

## Capture now, consolidate later

This is the required workflow for accumulating tests efficiently.

### 1. Record the intent immediately

When a defect, boundary, invariant, counterexample, or risk is discovered, add a test intent to the branch’s case bank. Record the expected behavior before observing or repairing the implementation.

Do not postpone the knowledge until the end of the session.

### 2. Use a provisional reproducer during diagnosis

Create the smallest probe capable of proving the failure and first divergence. Avoid prematurely building a permanent test hierarchy around an unconfirmed cause.

### 3. Accumulate related intents through the coherent repair batch

Do not create one permanent test command, fixture, process launch, model load, or device initialization for each case. Keep pending cases grouped by:

- authoritative owner;
- oracle;
- setup and artifact identity;
- runtime/device/model profile;
- execution tier;
- invalidation conditions.

### 4. Fold the batch into the owning capsule

At the next coherent ownership boundary—normally after the root cause is understood and before the branch is accepted—merge related intents into a parameterized/table/property-driven capsule.

Share expensive setup and execution, but preserve:

- stable case IDs;
- independent inputs and expected results;
- isolated mutable state;
- per-case pass/fail/skip reporting;
- first-divergence evidence;
- ability to run one case directly when diagnosing.

### 5. Remove redundant provisional artifacts

After the durable capsule demonstrably covers the same failure, remove or archive temporary scripts, copied fixtures, duplicate tests, debug instrumentation, and repeated commands according to cleanup doctrine.

### 6. Empty or disposition the case bank

Before branch acceptance, every material intent is:

- consolidated into an owning capsule;
- proven already covered by an existing case/property;
- superseded by a stronger case;
- blocked with exact authority and follow-up;
- or explicitly out of scope with a reason.

A critical regression intent may not remain merely “to add later.”

## Consolidation rules

Consolidate cases when they share the same owner, oracle, setup, execution environment, and lifecycle. Examples:

- one parameterized parser test for valid/invalid/boundary records;
- one state-machine sequence validating state, identity, legal actions, values, terminal status, cloning, persistence, and cleanup after every transition;
- one conformance capsule running several synthetic domains through the same public contract;
- one GPU capsule loading a generated engine and model once, then executing many isolated state/action/evaluator/resource cases;
- one migration capsule applying old/new/corrupt/partial inputs through one versioned migration harness;
- one failure-injection capsule enumerating terminal paths with exact resource-disposition checks.

Do not consolidate when cases require different authority, owners, isolation, security, rollback, hardware, or execution semantics.

A monolithic test that stops at the first assertion and hides remaining case results is not efficient completeness. Prefer subtests or an aggregate runner that executes all independent cases and emits a bounded failure list.

## Test tiers and escalation

Use the cheapest decisive tier first. Escalate only when a material claim remains unresolved or a trigger requires it.

### Tier 0 — preflight

- exact revision/artifact identity;
- authority/diff/schema/static checks;
- test discovery and manifest counts;
- compile/type/link checks where relevant;
- fixture/configuration validation.

### Tier 1 — focused fast capsule

- directly affected unit/property cases;
- exact reproducer/regression cases;
- owner-local contract checks;
- deterministic micro-integration;
- fast negative and boundary cases.

This is the default inner loop.

### Tier 2 — owner/contract bundle

- complete owning capsule;
- public contract/conformance suite;
- lifecycle/failure/pressure cases owned by the component;
- generated-source correspondence;
- host/reference differential checks.

Run after a coherent repair batch passes Tier 1—not after every edit.

### Tier 3 — integration smoke

- representative producer-consumer and end-to-end paths;
- startup/teardown and resource cleanup;
- one or more synthetic domains crossing changed boundaries;
- package/artifact loading where material.

Run once per accepted branch batch or invalidating integration change.

### Tier 4 — deep

- broad property/fuzz cases;
- sanitizer/race/fault-injection runs;
- large deterministic samples;
- migration/recovery matrices;
- representative performance regressions;
- compatibility matrices.

Trigger on risk, mismatch, stabilization, or explicit plan criteria.

### Tier 5 — forensic/release

- maximal instrumentation and raw traces;
- adversarial schedules and repeat distributions;
- full evidence/rebuild/release matrices;
- restore drills and external-resource verification.

Use only when a failure cannot be localized at cheaper tiers or the release/audit claim requires it.

Each tier has a declared command, expected case count, runtime/output budget, invalidation keys, and escalation trigger.

## Build once, run many

Reduce repeated setup cost safely:

- compile/link/generate once per exact source/configuration identity;
- load models, generated engines, datasets, containers, or device modules once per compatible capsule;
- run many independently initialized cases through the shared immutable setup;
- reset or recreate mutable state between cases;
- reuse fixtures by content hash/version;
- parallelize only cases with independent state and bounded resource use;
- batch device inputs when semantics allow and retain per-case identity;
- emit one structured result artifact rather than many repetitive logs.

Reuse is invalid when prior cases can contaminate state, order, caches, random streams, device memory, global registries, persistence, or resource pressure. Isolation has priority over setup savings.

## Evidence reuse and the no-repeat rule

Do not rerun an identical evidence key merely for reassurance.

A rerun is justified only when:

- subject or test revision changed;
- generated artifact, compiler flags, schema, model, adapter, dependency, driver, toolkit, hardware, configuration, resource profile, fixture, seed, or schedule changed materially;
- previous state was contaminated or the run incomplete;
- nondeterminism/flakiness/distribution is the object of the test;
- an independent replication is explicitly required;
- a higher tier invalidates or contradicts the previous result.

Record why a repeated run is new evidence.

Do not run the same fast checks in several CI workflows for one head. Assign test ownership, compose one canonical fast command, cancel stale runs, and reuse exact artifacts/results when trust and identity are preserved.

## Failure clustering and repair-loop discipline

### 1. Freeze the reproduction

Record expected behavior, exact evidence key, first observed failure, and trustworthy pre-state before editing.

### 2. Run the baseline once

Run the cheapest capsule capable of showing the failure. Do not begin with the full suite unless broad corruption or a release claim is already suspected.

### 3. Cluster failures

Group failures by first divergence, violated invariant, owner, signature, and shared setup. Separate primary failures from downstream cascades.

Do not open one repair thread per failing assertion when one owner-level cause explains them.

### 4. Choose the owning cause and falsifier

Form one explicit root-cause hypothesis and the cheapest observation capable of disproving it. Instrument only the first uncertain boundary.

### 5. Apply one coherent repair batch

Repair the authoritative owner and all directly coupled representations/contracts needed to leave a valid state. Avoid unrelated cleanup and speculative fixes.

### 6. Rerun only the affected cluster

Run the minimal set that proves the root cause and directly affected invariants. If it fails, change the hypothesis or repair; do not repeatedly rerun unchanged evidence.

### 7. Run the consolidated owning capsule once

When the cluster passes, execute the complete owner/contract capsule to catch adjacent regressions.

### 8. Run integration smoke once

After the coherent branch batch is locally accepted, run the affected boundary/end-to-end capsule. Do not rerun it after every minor edit unless the evidence key is invalidated.

### 9. Escalate or close

Escalate to deep/forensic tiers only for unresolved claims, nondeterminism, broad consequence, stabilization, or explicit release criteria.

Close the cycle only after pending test intents are consolidated, evidence is exact, cleanup is complete, and the result is checkpointed.

## Test selection and invalidation graph

Map production owners and artifacts to the capsules they invalidate.

A change should select:

1. directly owned fast cases;
2. public contract cases for changed surfaces;
3. callers/consumers materially affected;
4. lifecycle/resource/security/compatibility capsules triggered by the change;
5. representative end-to-end paths;
6. broader suites only when the impact graph or phase requires them.

Keep the invalidation graph explicit enough that agents do not choose tests from memory.

Examples of invalidation:

- schema change → parser/normalizer/generator/compatibility cases;
- allocator or reference change → graph store, reclamation, pressure, stale-reference, and teardown cases;
- evaluator ABI change → layout, model load, batching, numerics, publication, and cache identity cases;
- CUDA synchronization change → deterministic reference, publication/race, cancellation, device-loss, and sanitizer cases;
- test-oracle change → invalidate every result produced by the previous oracle;
- fixture/data change → invalidate all cases using its old content identity.

## Test result format

Prefer one bounded structured summary per capsule:

```text
subject/test/artifact/environment identity
capsule and tier
expected / discovered / executed case counts
pass / fail / required-skip / conditional-skip / optional-skip counts
duration and expensive setup count
failure clusters with stable case IDs
first divergence and owner
raw evidence artifact locations
checks not run and claim limits
invalidation and escalation decision
```

Do not paste full logs unless the full log is itself needed. Preserve raw output as an artifact and surface only the causal interval, failure signature, and exact location.

## Test quality maintenance

Periodically consolidate or retire tests when:

- several cases duplicate one property or oracle;
- separate files repeatedly perform the same setup;
- one high-level test duplicates lower-level evidence without adding integration value;
- fixtures differ only cosmetically;
- test names no longer identify owned behavior;
- obsolete compatibility or feature behavior is removed by authority;
- suite cost increases without increasing failure discrimination.

Retirement requires proof that remaining cases preserve the owned invariant and consequence coverage. Do not remove a slow test merely because it is slow; redesign or retier it first.

Track:

- capsule runtime and setup cost;
- case count and required-skip count;
- failure localization quality;
- flaky/contaminated rate;
- repeated identical runs;
- duplicate case/oracle coverage;
- repair cycles per root cause;
- tokens/log volume needed to diagnose a failure;
- material escapes found only at later tiers.

Metrics diagnose waste; they are not targets to game.

## UMCGS-specific testing

### Universal contracts

Use synthetic domains chosen to falsify hidden assumptions:

- different state/action shapes and cardinalities;
- deterministic and stochastic transitions;
- cycles, transpositions, history dependence, and partial observability;
- scalar/vector/multi-agent evaluator outputs;
- lazy, large, empty, and changing action spaces;
- finite resource profiles and explicit exhaustion;
- policy-only, evaluation-only, and full-search modes.

Consolidate them into conformance capsules sharing the public contract runner while preserving domain/case IDs.

### Search correctness and quality

Separate:

- semantic correctness;
- deterministic reference parity;
- invariant/property evidence;
- statistical/search-quality evidence;
- performance.

A faster search result is not equivalent if stopping, exploration, output ranking, numerical behavior, or quality changes.

### GPU/device execution

Group compatible cases by generated-engine, model/evaluator, architecture, driver/toolkit, and resource profile so expensive load/compile/setup occurs once.

Within the capsule:

- isolate mutable search state per case;
- validate device closure and absence of host-produced intermediate decisions;
- compare deterministic small cases with a host reference;
- test publication, atomics, cancellation, pressure, exhaustion, teardown, device loss, IPC/shared memory, and stale references as triggered;
- verify no allocation, module, stream, event, queue, model workspace, or diagnostic resource leaks across cases;
- use compute-sanitizer/race/forensic tiers only when triggered rather than in every inner loop.

### Generated/JIT/ABI/cache work

The evidence key includes schema normalization, generator/compiler version, source revision, architecture, driver/toolkit, ABI, model, adapter, build flags, and resource profile. Never reuse or compare results across incomplete cache identities.

## Token-use discipline in testing

Testing consumes the reserved token budget, so optimize the loop deliberately:

- write the test matrix and case bank once;
- batch test planning with the coherent repair batch;
- run one capsule command instead of many near-identical commands;
- preserve exact evidence keys to avoid repeated runs;
- cluster failures before reading logs or editing code;
- retain only the first divergence and bounded causal context in active context;
- link raw artifacts instead of pasting them;
- checkpoint root cause, changed hypothesis, accepted cases, pending intents, and next tier;
- stop mutation in red context state and hand off the failure cluster cleanly;
- reserve enough context to consolidate provisional tests and remove duplicate artifacts before acceptance.

Do not save tokens by skipping a required test tier. Save tokens by selecting, batching, consolidating, and reusing evidence accurately.

## Prohibited patterns

- Running the full suite after every edit.
- Creating one permanent test file or command per discovered example.
- Leaving critical test intents only in chat or TODO prose.
- One monolithic test that hides case identity or stops before independent cases run.
- Rerunning the same evidence key without an explicit statistical or invalidation reason.
- Retrying an unchanged failing command without a changed hypothesis/input/environment.
- Fixing each failing assertion independently when failures share an owner/root cause.
- Changing expected values to match current output without revalidating authority.
- Copying implementation logic into the oracle.
- Treating compile success as behavioral proof.
- Treating a sampled run as complete coverage.
- Silent skips, empty discovery, or broad exclusion filters.
- Using CI as the first debugger for locally detectable failures.
- Reusing contaminated fixtures, global state, device state, or caches.
- Keeping provisional reproducers after durable equivalent coverage exists.
- Duplicating the same fast suite across workflows.
- Spending the validation reserve on repeated reassurance runs or speculative repairs.

## Proportional records

Routine changes need no separate test ledger. The issue/PR may state the affected capsule and result.

Use [`../templates/test-batch.template.yaml`](../templates/test-batch.template.yaml) when:

- several test intents must be accumulated and consolidated;
- work crosses sessions or agents;
- expensive setup or device/model/artifact reuse must be coordinated;
- a failure cluster has several repair cycles;
- completeness/skip/invalidation accounting is material;
- another consumer needs exact evidence and pending-test state.

The record contains unique test planning, case-bank, evidence-key, failure-cluster, consolidation, and run-selection state. It does not duplicate specifications, source code, raw logs, or the complete execution history.

## Completion

Testing for a material branch is complete only when:

- the authoritative claims and oracles are explicit;
- the coverage map accounts for every material invariant at justified depth;
- critical tests demonstrate sensitivity to plausible violations;
- exact subject/test/artifact/environment identity is proven;
- required discovery and skip accounting are complete;
- pending material test intents are consolidated, superseded, blocked with authority, or explicitly out of scope;
- provisional reproducers and duplicate tests are removed or archived;
- directly affected cases, owning capsules, and required integration/deep tiers pass on valid evidence keys;
- repeated runs have a recorded invalidation or statistical reason;
- failure clusters and repair hypotheses are reconciled;
- no contaminated state, hidden skip, duplicate authority, test debt, token debt, or unverified cleanup remains;
- checks not run and claim limits are explicit;
- further testing would not materially change the claim, risk, or next action.
