# Token-Use, Context, and Backpressure Discipline

**Scope:** Every agent task in UMCGS, including routine edits, research, assessment, planning, engineering decisions, focus-branch work, implementation, debugging, testing, validation, review, integration, cleanup, and handoff.

## Purpose

Tokens are a finite engineering resource and therefore a source of **backpressure** on all work. Backpressure should prevent uncontrolled context growth, repeated retrieval, speculative scope, fragmented repair loops, duplicated documentation, and tests whose cost exceeds their decision value.

Token pressure must not become an excuse to omit the practices that make the result trustworthy.

The governing rule is:

> Use token cost as continuous backpressure on scope, work in flight, retrieval, reasoning, generation, testing, and administration. Reduce waste and optional breadth before reducing rigor. Preserve a risk-appropriate minimum practice floor for every claim and operation.

The goal is not the lowest token count. The goal is the least total lifecycle token cost that produces a correct, safe, specification-aligned, verified, integrated, recoverable, and continuation-ready result.

## Core model

Optimize for:

```text
quality-adjusted verified coherent progress
─────────────────────────────────────────
       total lifecycle token cost
```

The numerator includes:

- accepted decisions and specifications;
- valid state transitions;
- resolved root causes;
- accurate test evidence;
- integrated branch outputs;
- verified cleanup;
- continuation-ready checkpoints and handoffs.

The denominator includes:

- retrieved context;
- reasoning and generated text/code;
- tool calls and returned output;
- repeated reads and retries;
- testing and repair cycles;
- review, integration, cleanup, and handoff;
- future reconstruction and rework caused by missing state.

A short answer can be expensive if another agent must reconstruct what was omitted. A long durable specification can be efficient if it prevents repeated rediscovery. Judge total lifecycle cost.

## Token backpressure applies to every task

Every task, including routine work, has a token posture. It need not have a formal ledger.

Before acting, establish at least:

1. the exact owned outcome;
2. the minimum practice floor required by the claim and consequence;
3. the smallest coherent scope that can produce useful verified progress;
4. the cheapest decisive evidence;
5. enough reserve to inspect actual effects, validate, clean up, and report truthfully;
6. the signals that will cause batching, narrowing, splitting, handoff, or stop.

For routine work this may take only a sentence of internal orientation. For substantial or critical work it belongs in the task, plan, focus-branch, or token-budget packet.

Backpressure begins with the first retrieval or mutation. It is not a late reaction after the context window is nearly exhausted.

## The minimum practice floor

Token pressure controls **how much work is attempted at once**. It does not lower the truth standard for the work that remains in scope.

### Universal floor for every task

Every task preserves:

- the user’s actual request and explicit constraints;
- the authoritative owner and current source of truth;
- inspection of relevant current state before mutation;
- a coherent owned scope and explicit exclusions when material;
- expected result and cheapest decisive verification;
- execution within the owned boundary;
- immediate inspection of actual effects;
- relevant verification capable of detecting a plausible failure;
- reconciliation of created, modified, partial, remote, or obsolete state;
- an honest result stating what was done, what was not checked, and any remaining risk.

A mechanical edit may satisfy this floor very cheaply. It still may not skip current-state inspection or final verification.

### Substantial-work additions

When the task crosses files, contracts, components, persistent state, sessions, environments, or owners, also preserve:

- dependency and downstream-consumer analysis;
- specification alignment and material invariants;
- failure, pressure, rollback, compatibility, and cleanup behavior;
- a focused test or falsifier plan;
- evidence identity and invalidation;
- integration consequences and a continuation checkpoint.

### Critical-work additions

Critical work also preserves all objectively triggered requirements for:

- engineering contract and adversarial assessment;
- hard gates and value ordering;
- credible alternative paths and decision evidence;
- security, safety, concurrency, memory, persistence, ABI, migration, recovery, and destructive-operation review;
- authoritative and preferably independent test oracles;
- full-attention focus branches;
- exact-head review, protected integration, and owning-system cleanup verification.

No fixed token target can waive an objectively triggered practice.

## Practice floor versus practice ceiling

Good engineering contains both mandatory substance and optional ceremony.

### Backpressure may reduce

- repeated quotations of authority already linked;
- duplicate summaries, ledgers, templates, and status records;
- broad context not needed for the current consequence horizon;
- speculative features, abstractions, compatibility layers, and future-proofing beyond the accepted domain;
- optional polish, formatting, commentary, and alternative explorations after a decisive path is established;
- duplicate tests, repeated evidence, redundant CI workflows, and unnecessary deep tiers;
- parallel branches that duplicate context or create coordination cost;
- the breadth of the current deliverable;
- durable records that have no independent consumer.

### Backpressure may not reduce

- owner instruction or accepted authority;
- exact revisions, identities, units, ranges, versions, memory spaces, and evidence keys;
- hard safety, security, correctness, accuracy, deadline, resource, compatibility, recovery, or cleanup gates;
- the reasoning needed to understand the owned mechanism and material consequences;
- required specification mapping and shared-contract ownership;
- the cheapest decisive falsifier or required test tier;
- test discovery and skip accounting;
- actual-effect inspection;
- rollback, recovery, cancellation, teardown, and cleanup required by the state created;
- required review independence or branch protection;
- truthful claim limits, checks not run, partial state, and handoff information.

Backpressure may narrow the claim. It may not preserve a broad claim while removing the evidence needed to support it.

Sampling is permitted only when the claim is correspondingly labeled sampled or bounded. A reduced test tier cannot support a release-grade claim.

## Backpressure reduction ladder

When token cost exceeds the expected envelope or reserve begins to erode, apply these actions in order.

### 1. Stop duplication

- stop rereading unchanged authority;
- stop reproducing the same facts in several artifacts;
- stop unchanged retries and reassurance runs;
- stop multiple agents from rediscovering the same context;
- stop retaining sibling-branch transcripts when accepted outputs suffice.

### 2. Reuse authoritative context and evidence

- link instead of copy;
- reuse exact evidence whose full key remains valid;
- consume branch outputs as contracts;
- preserve raw evidence once at an exact durable location;
- use canonical commands and owning test capsules.

### 3. Batch coherent work

- batch independent reads needed for one decision;
- combine compatible file changes under one owner;
- bank related test intents and run one owning capsule;
- cluster failures before repair;
- share safe immutable setup;
- perform one coherent review/integration pass rather than repeated micro-passes.

### 4. Narrow context and output

- keep only the operating kernel, governing authority, local mechanism, and material consequence horizon active;
- filter logs and tool output;
- avoid narrating low-level operations;
- summarize only after preserving exact evidence and identifiers;
- remove cold rationale and history from active context.

### 5. Defer optional breadth and polish

- postpone noncritical refactoring, extra alternatives, style polish, optional diagnostics, speculative optimization, and unrelated cleanup;
- preserve them only when they have a real owner, priority, and revisit trigger.

### 6. Reduce scope to a smaller coherent result

- finish one owner boundary rather than several partial ones;
- reduce a system-wide claim to a bounded claim;
- choose the smallest experiment that answers the decision;
- separate mandatory from optional acceptance criteria;
- leave downstream work blocked rather than pretending it is complete.

### 7. Split, rebranch, or hand off

Use focus branches when the mechanism, consequences, testing, cleanup, and handoff reserve no longer fit together. Checkpoint exact state before switching.

### 8. Pause and resolve the blocker

If the remaining work cannot satisfy the practice floor because authority, evidence, environment, access, or recovery is missing, stop mutation and record a decision-ready blocker. Do not consume the remaining budget producing unsupported output.

The reduction ladder removes waste and work in flight before it removes breadth, and removes breadth before it threatens rigor.

## Backpressure triggers

Re-evaluate scope and budget when any of the following occurs:

- the first unchanged reread, retry, or reassurance run is proposed;
- a second repair cycle begins without stronger first-divergence evidence or a changed root-cause hypothesis;
- a new semantic owner, public contract, artifact family, or high-consequence risk enters the task;
- actual work exceeds the planned operation/branch/test capsule boundary;
- test execution expands beyond the planned tier without a new risk or invalidation trigger;
- tool output or logs overwhelm the active causal context;
- administrative records begin duplicating the actual authority or evidence;
- the agent repeatedly loses exact revisions, status, or previously established facts;
- optional polish is drawing from validation/integration/cleanup/handoff reserve;
- exact telemetry shows meaningful overrun—about 25% beyond a stated soft envelope is a default replan signal, not a failure quota;
- semantic evidence shows the reserve cannot support one more complete operation and handoff.

When telemetry is unavailable, use semantic symptoms rather than pretending to know a number.

## Budget elasticity

Backpressure is not a hard cap that forces premature abandonment.

Spend additional tokens when they have high marginal decision or evidence value and are necessary to meet the practice floor. Examples include:

- resolving a specification conflict;
- proving or disproving a safety/correctness gate;
- finding first divergence;
- completing required cleanup or recovery;
- preserving a lossless handoff;
- reviewing an irreversible or cross-repository decision.

When the initial envelope is insufficient, choose explicitly among:

- extend the budget with a stated reason;
- narrow the scope or claim;
- split/rebranch;
- defer optional work;
- hand off;
- pause on a blocker.

Do not continue merely because tokens have already been spent. Sunk token cost is not evidence that the current path should be completed.

Do not stop merely because a soft estimate was exceeded when the remaining evidence is essential and can be completed soundly. Replan instead.

## Task classes and proportional administration

### Routine

Routine work uses an implicit micro-budget and the universal practice floor. It needs no percentage calculation or durable token record. Token pressure still discourages broad reading, duplicate tool calls, speculative fixes, and unbounded polish.

### Substantial

Substantial work uses an explicit context packet, a reserve, and backpressure triggers. Record these in the task/plan/PR unless another consumer requires a separate token record.

### Critical or large/complex

Critical or large work uses an explicit budget strategy, full-attention focus branches, lossless checkpoints, and clear overrun/split/handoff rules.

Use [`../templates/token-budget.template.yaml`](../templates/token-budget.template.yaml) only when cross-session or cross-agent continuation, exact telemetry, high consequence, parallelism, repeated pressure, or audit/review gives the record a real consumer.

## Reserve before spending

Before mutation, reserve capacity for proof and preservation.

A substantial or critical task retains enough headroom for:

1. actual-effect inspection;
2. focused falsification and required broader validation;
3. integration and contradiction reconciliation;
4. cleanup and final-state verification;
5. exact-head review or continuation-ready handoff;
6. at least one bounded recovery cycle when a material assumption fails.

Default telemetry safeguards are:

- **substantial work:** at least 30% of usable context reserved;
- **critical, large, or cross-branch work:** at least 40% after loading the branch packet;
- **routine work:** no fixed percentage, but enough semantic headroom for inspection, verification, cleanup, and truthful reporting.

These are defaults, not quotas. Increase the reserve for destructive, uncertain, cross-system, or difficult-to-recover work. A smaller reserve requires bounded remaining operations and evidence.

The reserve is not available for new scope or optional polish.

## Operational context states

Use runtime telemetry when available. Otherwise infer state from the number of complete evidence cycles that still fit.

### Green

Enough capacity remains for at least two full cycles:

```text
act → inspect → falsify → reconcile → checkpoint
```

Dependency-ready scope may begin, subject to the practice floor.

### Yellow

Capacity is below roughly 35%, or only one complete cycle plus handoff remains.

- open no new branch, owner, or broad unknown;
- finish or safely pause the current coherent operation;
- apply the reduction ladder;
- validate claims already made;
- compact and prepare integration or handoff.

### Red

Capacity is below roughly 20%, or one complete operation plus validation, cleanup, and handoff no longer fits.

- stop new mutation;
- preserve exact state and evidence;
- run only bounded classification/containment checks;
- clean up or quarantine unsafe partial state;
- produce a continuation-ready checkpoint.

### Emergency

Capacity is below roughly 10% or context is being truncated or replaced.

Use remaining capacity only to preserve authority, exact revisions, decisions, partial state, failures, evidence locations, cleanup, and next safe action. Do not start a new fix, architecture decision, broad test, review, or merge.

The semantic rule takes precedence over percentages.

## Context layers

Load context in layers:

1. **Operating kernel:** root/canonical agent rules, compact principles, current status/next step, active task/focus packet, exact repository state.
2. **Governing authority:** only the accepted ADRs, specifications, contracts, manifests, and triggered specialist doctrine that own the question.
3. **Local mechanism:** exact files, symbols, schemas, tests, generated inputs, traces, and callers needed to understand the operation.
4. **Material consequence horizon:** callers/callees, boundaries, lifecycle, resources, compatibility, security, performance, testing, recovery, and cleanup that can change the decision.
5. **Rationale and provenance:** architecture explanation, research, history, and archive only when alternatives, external facts, provenance, or supersession are material.

Cold context does not remain active merely because it was once useful.

## Retrieval discipline

- search indexes and the registry before broad reading;
- fetch the smallest contiguous section that preserves semantics;
- read the complete owner/contract/function when snippets would hide control flow or invariants;
- prefer exact diffs and affected context over unchanged files;
- batch independent retrievals needed for one decision;
- filter logs and tool output to the causal interval;
- preserve source status, owner, exact revision, and reread trigger;
- keep large artifacts external with exact identity and targeted retrieval.

Reread when revision, shared meaning, evidence validity, or consequence horizon changes—not merely because the task is long.

## Reasoning discipline

Spend reasoning tokens on path-changing questions:

- authority, ownership, and specification meaning;
- hidden assumptions and counterexamples;
- hard gates and value ordering;
- identity, units, ranges, versions, memory spaces, and lifetimes;
- dependency and integration order;
- resource pressure and failure behavior;
- concurrency, publication, and cancellation;
- compatibility, migration, recovery, security, and cleanup;
- test oracle and cheapest decisive evidence.

Do not repeatedly reargue accepted decisions without a revisit trigger. Do not perform a full architecture exercise for a mechanical edit. Do not replace one cheap observation with prolonged speculation.

Stop analysis when another pass cannot materially change the candidate set, decision, scope, evidence, risk, priority, or next action.

## Tool-call discipline

- use the cheapest tool capable of decisive evidence;
- batch independent operations serving one decision;
- avoid serial micro-calls that reconstruct already known context;
- never retry an unchanged failure without a changed hypothesis, input, source/test revision, environment, configuration, or transport;
- use focused local checks before expensive CI or broad scans;
- reuse exact evidence while its key remains valid;
- poll asynchronous state only with a reason and stop condition;
- inspect actual remote state after mutation.

One indiscriminate call can be more wasteful than several targeted calls. Raw call count is not the metric.

## Testing and repair-loop backpressure

Testing is a major token-pressure source. Apply [`TESTING.md`](TESTING.md):

- bank test intents rather than creating one permanent test per discovery;
- consolidate related cases into owning capsules;
- share compatible immutable setup while isolating mutable state;
- reuse unchanged evidence;
- cluster failures before repair;
- rerun minimal cluster, owning capsule once, then required integration smoke;
- escalate to deep/forensic tiers only on objective triggers;
- keep full logs external and active evidence bounded.

Token pressure may remove duplicate tests and unnecessary tiers. It may not remove the required oracle, relevant owner capsule, discovery/skip accounting, evidence identity, or integration tier needed by the claim.

When repair cycles expand, stop broad reruns and re-establish first divergence and root cause. Do not burn the reserve on repeated reassurance.

## Writing and generation discipline

### Durable records

- link accepted authority instead of copying it;
- store each durable fact in one owner;
- record unique decisions, evidence, status, and claim limits—not transcripts;
- use structured packets only when another consumer needs exact fields;
- archive or supersede stale records.

### Code and configuration

- generate only the coherent change current authority permits;
- avoid speculative components and generic abstractions meant only to avoid a future pass;
- reuse idioms, contracts, and generators;
- comment invariants, reasons, and non-obvious failures rather than syntax;
- keep generated output external when identity and targeted differences suffice.

### User-visible responses

State result, evidence, exact state, limitations, and the next boundary. Do not repeat the request or narrate every tool call. Do not omit a material limitation merely to be concise.

## Checkpoints and compaction

Checkpoint at:

- branch switches;
- material decisions and accepted outputs;
- entry into yellow state;
- context compaction or session/model handoff;
- risky or irreversible operations;
- failures, rollback, and shared-contract invalidation;
- budget extension, scope reduction, or backpressure-driven deferral.

A lossless checkpoint preserves:

- parent task/plan/branch/node/owner/status;
- exact repository and artifact revisions;
- authority and shared definitions;
- decisions, value ordering, accepted/rejected paths, and rationale that remains path-changing;
- outputs and consumers;
- assumptions, exclusions, contradictions, and failed hypotheses;
- operations and partial state;
- tests/evidence run, evidence locations, checks not run, and claim limits;
- rollback, recovery, cleanup, credentials/resources, and Git/GitHub state;
- token band, backpressure action, and next safe action.

Safe to discard after durable transfer:

- narration;
- repeated authority quotations;
- duplicate summaries;
- superseded scratch;
- low-value successful command chatter;
- tool output already preserved at an exact location.

Summaries are derivative context, not authority.

## Focus branches and delegation

A focus branch is valid only when its complete packet, mechanism, material consequences, execution, testing, validation, cleanup, and handoff reserve fit one usable context window.

Split or rebranch when:

- mechanism and consequence can no longer remain active together;
- repeated rereading is required;
- the reserve will be consumed before acceptance;
- independent owners or unknowns compete for context;
- integration is repeatedly postponed.

Normally one agent owns one active branch. Sibling results are consumed as exact output contracts, not transcripts.

Parallel token use is still total token use. More agents are efficient only when they reduce critical-path time or improve independent evidence without duplicating discovery, context, or work.

## Recovery from context pressure

Symptoms include lost revisions, repeated questions, branch/authority confusion, vague summaries replacing mechanism, several incomplete fixes, validation being skipped to finish, output truncation, or contradictory stale packets.

When they appear:

1. stop new scope;
2. freeze exact state;
3. rebuild the compact authoritative packet;
4. classify accepted, partial, invalidated, and unknown state;
5. apply the reduction ladder;
6. split, hand off, or pause when a full evidence cycle no longer fits;
7. resume only after practice floor and reserve are restored.

Do not delete inconvenient evidence or lower rigor to make the context look manageable.

## Token debt

Token debt is future reconstruction created by failing to preserve unique state now.

Examples:

- a decision exists only in chat;
- branch output lacks exact revision or assumptions;
- a failure was fixed without preserving causal evidence;
- partial state lacks continuation instructions;
- authority was copied into several drifting records;
- a PR description is the only explanation of a public contract;
- cleanup or external-resource state is omitted from handoff.

Material token debt blocks completion. Pay it by moving unique truth to the correct owner, not by adding another generic summary.

## UMCGS-specific discipline

- do not load every domain adapter while defining one universal contract; use synthetic counterexamples and exact second instances;
- do not ingest entire CUDA documentation when one capability, ABI, launch, memory, or synchronization question is decisive;
- keep driver/toolkit/architecture/model/resource/evidence identities exact;
- keep Search IR, domain, graph, policy, evaluator, resource, conformance, and CUDA-JS interop branches separate enough for full attention while integrating shared meaning centrally;
- reserve capacity for cross-contract reconciliation, finite memory, device closure, cancellation/teardown, JIT/ABI/cache identity, and search-quality equivalence;
- treat profiler traces, generated engines, models, datasets, and large logs as artifacts rather than prompt text;
- do not spend the validation reserve on speculative CUDA optimization or first-domain convenience;
- do not use token pressure to justify host participation, incomplete memory/lifecycle contracts, weak compatibility identity, or duplicated UMCGS/CUDA-JS ownership.

## Prohibited patterns

- “Use as few tokens as possible” as a substitute for judgment.
- Treating a soft token estimate as authority to skip required practice.
- Preserving broad scope while cutting evidence.
- Starting optional work before reserving proof and cleanup.
- Reading the entire repository before finding the owner.
- Repeating authority in every artifact.
- Keeping all historical context active.
- Starting new scope in yellow or red state.
- Continuing mutation when validation and handoff no longer fit.
- Repeated retries or test runs without new evidence.
- Using CI as the first debugger for locally detectable failures.
- Creating formal token ledgers for trivial work.
- Declaring efficiency from short output or low raw token count.
- Declaring thoroughness from long output with no changed decision or evidence.
- Continuing a failing path because of sunk token cost.
- Stopping at a soft budget boundary while required in-scope safety, correctness, cleanup, or handoff remains incomplete and a sound split/extension is available.

## Validation of token discipline

A task demonstrates token discipline when:

- backpressure was applied from orientation, not only near exhaustion;
- the risk-appropriate practice floor was explicit or evident and remained intact;
- the active packet contained current path-relevant authority and evidence;
- retrieval, reasoning, generation, testing, and tool use were targeted and non-repetitive;
- duplicate work and evidence were reused or consolidated;
- reserve remained available or a deliberate extend/narrow/split/handoff decision was made;
- optional scope and ceremony were reduced before rigor;
- context pressure did not weaken the claim’s required evidence;
- checkpoints preserve exact state and backpressure decisions;
- no material token debt remains;
- further token spending would not materially change the result, evidence, risk, priority, cleanup, or next action.

Do not evaluate agents by raw token count. Evaluate correctness, escaped defects, rework, repeated retrieval, repair cycles, missed integration, unsafe residue, and continuation cost.

## Completion

Token backpressure is satisfied when:

- every task used at least an implicit budget posture and reserve;
- work in flight remained within a coherent owner and evidence envelope;
- the reduction ladder was applied when pressure appeared;
- scope was narrowed or split rather than verified practice being silently removed;
- all required authority, reasoning, tests, actual-effect inspection, integration, cleanup, review, and handoff were completed for the claim made;
- budget extensions or deviations were explicit and justified;
- no material token debt or unreconstructable state remains;
- additional token use would not materially improve the verified result or next decision.
