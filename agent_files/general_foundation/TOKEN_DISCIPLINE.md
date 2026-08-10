# Token-Use and Context Discipline

**Scope:** All agent research, assessment, planning, focus-branch work, implementation, debugging, validation, review, integration, cleanup, and handoff in UMCGS.

## Purpose

Tokens are a finite engineering resource. They carry authority, evidence, local mechanism, reasoning, tool results, generated text, and continuation state inside a bounded context window. Poor token discipline fails in two opposite ways:

- **token waste** — repeatedly loading history, copying authority, narrating obvious work, retrying unchanged hypotheses, generating unused scaffolding, and keeping several branches active at once;
- **token starvation** — compressing or skipping authority, evidence, failure analysis, validation, integration, cleanup, or handoff merely to produce a short answer or more code.

The governing rule is:

> Maximize verified coherent progress per token. Spend tokens on facts and reasoning that can change the path; preserve enough context for validation, integration, cleanup, and handoff; and never trade correctness, safety, authority, or recoverability for apparent brevity.

The goal is not the smallest token count. The goal is the least total token cost that produces a trustworthy result, including rework avoided.

## What the budget includes

Treat all of the following as parts of one attention budget:

- input and retrieved context;
- hidden/internal reasoning capacity where the runtime exposes or limits it;
- user-visible prose and code generation;
- tool calls and returned data;
- repeated reads, retries, and branch switching;
- durable records and generated artifacts;
- validation, review, integration, cleanup, and handoff.

A short response can still be wasteful if it causes another agent to reconstruct missing state. A long response can be efficient if it becomes durable authority that prevents repeated rediscovery. Judge total lifecycle cost.

## Authority and correctness floor

Token discipline is subordinate to project authority and sound engineering.

Never save tokens by omitting material:

- owner instruction or accepted authority;
- exact revisions, identifiers, units, ranges, versions, or memory spaces;
- shared-contract meaning;
- critical preconditions or dependencies;
- failure, pressure, cancellation, recovery, migration, compatibility, security, or cleanup behavior;
- decisive evidence, contradictory evidence, or checks not run;
- exact partial state and next safe action;
- required independent review or merge protection.

If the available budget cannot support the minimum sound work, reduce scope, split into focus branches, pause mutation, or hand off. Do not produce an under-reasoned implementation and label it efficient.

## Token objective

Optimize for:

```text
verified coherent progress
────────────────────────────
total tokens across the lifecycle
```

“Verified coherent progress” means an accepted decision, evidence-producing experiment, valid state transition, resolved defect, integrated branch output, or continuation-ready handoff. Activity, text volume, tool-call count, files touched, and code generated are not progress by themselves.

## Task classes and proportional rigor

### Routine

A local, reversible, single-owner change with obvious authority and focused validation needs no formal token budget. Still retain enough capacity to inspect the actual effect, run the relevant check, clean up, and report exact state.

### Substantial

Cross-file behavior, public interfaces, dependency changes, multi-step work, or cross-session continuation requires an explicit context packet and reserve. A durable token-budget record is optional unless another consumer needs it.

### Critical or large/complex

Foundational contracts, CUDA/concurrency/memory/JIT/ABI, persistence/security/compatibility, multi-owner work, parallel focus branches, invalid intermediate states, release, or full-system claims require an explicit budget strategy. Split the work if one branch cannot fit full mechanism, material consequences, validation, cleanup, and handoff inside one usable context window.

Use [`../templates/token-budget.template.yaml`](../templates/token-budget.template.yaml) only when the budget must survive across sessions/agents or when telemetry, parallelism, high consequence, or repeated context pressure makes it decision-relevant.

## Reserve before spending

Before mutation, reserve capacity for the work that proves and preserves the result.

A substantial or critical task must retain enough headroom for:

1. actual-effect inspection;
2. focused falsification and relevant broader validation;
3. integration and contradiction reconciliation;
4. cleanup and final-state verification;
5. exact-head review or handoff;
6. one recovery cycle when a material assumption fails.

When exact token telemetry is available, default reserves are:

- **substantial work:** keep at least 30% of the usable context for validation, integration, cleanup, review, and handoff;
- **critical or cross-branch work:** keep at least 40% after the branch context packet is loaded;
- **routine work:** no percentage requirement, but do not start an operation without enough capacity to inspect and validate it.

These are safeguards, not performance quotas. Increase the reserve for destructive, uncertain, cross-system, or difficult-to-recover work. A smaller reserve is acceptable only when the remaining operations and evidence are demonstrably bounded.

Do not consume the reserve to add scope or polish.

## Operational context states

Use runtime telemetry when available. Otherwise infer state from the ability to retain mechanism and consequences without rereading or forgetting.

### Green

Enough capacity remains to complete at least two full cycles of:

```text
act → inspect → falsify → reconcile → checkpoint
```

New dependency-ready work may begin.

### Yellow

Capacity is below roughly 35%, or there is room for only one complete cycle plus a handoff.

- do not open a new focus branch or broad unknown;
- finish or safely pause the current coherent operation;
- refresh the compact task packet;
- validate material claims already made;
- prepare integration or handoff.

### Red

Capacity is below roughly 20%, or there is not enough room for one complete operation, validation, cleanup, and handoff.

- stop new mutation;
- preserve exact state and evidence;
- run only bounded verification needed to classify the current state;
- clean up or quarantine unsafe partial state;
- produce a continuation-ready checkpoint.

### Emergency

Capacity is below roughly 10% or the runtime is truncating/replacing context.

Use remaining capacity only to preserve exact authority, revision, partial state, failures, cleanup, and next safe action. Do not attempt a new fix, architecture decision, broad review, or merge.

Percentages are default telemetry signals. The semantic rule—enough capacity for a full evidence cycle and handoff—takes precedence.

## Context layers

Load context in layers. Do not treat the repository as one prompt.

### Layer 1: operating kernel

Keep compact and current:

- root and canonical agent rules;
- compact engineering principles;
- current `STATUS.md` and `next_step.yaml`;
- active parent/focus-branch packet;
- exact repository/branch/revision state.

### Layer 2: governing authority

Load only authority that owns the current question:

- accepted ADRs and specifications;
- component manifests and public contracts;
- security, compatibility, persistence, release, or cleanup doctrine objectively triggered by the work.

### Layer 3: local mechanism

Load exact files, symbols, schemas, tests, generated sources, traces, and callers required to understand the operation.

### Layer 4: material consequence horizon

Widen only to callers, callees, boundaries, end-to-end paths, lifecycle, resources, compatibility, security, performance, and cleanup that can change the decision.

### Layer 5: rationale and provenance

Read architecture explanation, research, history, and archive only when alternatives, external facts, provenance, or supersession are material.

Cold context does not remain loaded merely because it was once useful.

## Retrieval discipline

### Search before broad reading

- use repository search, indexes, registry, exact identifiers, and dependency information to find the owner;
- fetch the smallest contiguous section that preserves semantics;
- read the whole owning contract or function when a snippet would hide invariants or control flow;
- prefer exact diff/patch and affected context over rereading unchanged files;
- inspect generated source and its canonical input together when correspondence matters;
- batch independent retrievals when their results are all needed for one decision.

### Record freshness

In the task packet, preserve exact revision, document status, owner, and why the source matters. Reread only when:

- the revision or shared contract changed;
- the previous read was partial or ambiguous;
- new evidence invalidated the summary;
- the decision now reaches a wider consequence horizon.

Repeatedly rereading unchanged authority is waste. Relying on a stale summary after the revision changes is token starvation.

### Avoid context flooding

Do not load:

- every repository file;
- every historical plan or PR;
- every sibling focus branch;
- entire logs when a bounded interval and causal context suffice;
- full generated artifacts when identity, source correspondence, and targeted sections answer the question;
- archive material as current guidance.

When a whole file, chapter, log, or dataset is genuinely required, state why and keep unrelated material cold.

## Reasoning discipline

Spend reasoning tokens on path-changing questions:

- authority and ownership;
- hidden assumptions and counterexamples;
- identity, units, ranges, versions, memory spaces, and lifetimes;
- dependency and integration order;
- resource pressure and failure behavior;
- concurrency/publication/cancellation;
- compatibility, migration, recovery, security, and cleanup;
- cheapest decisive evidence.

Do not repeatedly reargue accepted decisions without a revisit trigger. Do not run a full adversarial design exercise on a purely mechanical edit. Do not substitute long speculative reasoning for one cheap falsifying observation.

Stop analysis when additional reasoning cannot change the decision, validation, scope, or risk classification.

## Tool-call discipline

- choose the cheapest tool capable of producing decisive evidence;
- batch independent reads/searches/calculations that serve one decision;
- avoid serial micro-calls whose only purpose is to rediscover context already known;
- do not retry an unchanged failing command, API, build, or workflow without a changed hypothesis, input, environment, or transport;
- inspect local/focused checks before expensive CI or broad system scans;
- use find/filter/range/log-window operations instead of dumping full outputs;
- preserve exact raw evidence once, then cite or link it rather than copying it repeatedly;
- verify remote/asynchronous state through the owning system, but do not poll without a bounded reason and stop condition.

Tool-call count is not itself a quality metric. One giant indiscriminate call can waste more tokens than several targeted calls.

## Writing and generation discipline

### Durable text

- link accepted authority instead of copying it into every plan, branch packet, PR, and handoff;
- store each durable fact in one authoritative location;
- write integration summaries that contain unique decisions, evidence, status, and limits—not transcripts;
- use machine-readable packets when another agent or tool needs exact fields;
- archive or supersede stale durable text rather than carrying both versions in active context.

### Code and configuration

- generate only the coherent owned change that current authority permits;
- do not scaffold speculative components, compatibility layers, or generic abstractions to “save a future pass”;
- reuse existing idioms, generators, and contracts rather than emitting near-duplicates;
- comments explain invariant, reason, or non-obvious failure—not syntax;
- do not paste large generated outputs into discussion when exact artifact identity and targeted differences suffice.

### User-visible responses

State the result, evidence, exact state, limits, and next boundary. Avoid narrating every tool call, repeating the request, or reproducing documents the user can open. Brevity is useful only when it preserves what the user needs to decide or continue.

## Checkpoints and context compaction

Create a compact checkpoint:

- at each focus-branch switch;
- after a material decision or accepted output;
- before context compaction or model/session handoff;
- on entering yellow state;
- before a risky or irreversible operation;
- after rollback, failure, or shared-contract invalidation.

A lossless checkpoint preserves:

- parent task, plan version, focus branch, node, owner, and status;
- exact repository/artifact revisions;
- current authority and shared definitions;
- decisions and rationale that remain path-changing;
- accepted outputs and exact downstream consumers;
- assumptions, exclusions, contradictions, and unresolved questions;
- failed hypotheses and why they failed;
- operations performed and exact partial state;
- checks run, raw evidence locations, checks not run, and claim limits;
- cleanup, rollback, recovery, credentials/resources, and Git/GitHub state;
- next safe action and its preconditions.

Safe to compress or discard after durable transfer:

- conversational narration;
- repeated quotes from authority;
- superseded scratch drafts;
- successful low-level command chatter with no decision value;
- duplicate summaries;
- tool output already preserved at an exact durable location.

A summary is derivative context, not authority. Never compact away exact identifiers, unresolved contradictions, failed approaches, checks not run, or unsafe partial state.

## Focus-branch token discipline

A focus branch is valid only when its complete context packet plus execution, validation, cleanup, and handoff reserve fit one usable window.

Split or rebranch when:

- the branch cannot keep local mechanism and material consequences active together;
- repeated rereading is required to continue;
- the reserve would be consumed before branch acceptance;
- independent unknowns or owners compete for the same context;
- integration meaning is being postponed to “later.”

Normally one agent keeps one active branch. Do not load sibling branch transcripts. Consume their accepted output contracts, exact revisions, evidence, assumptions, and integration obligations.

The integration spine receives branch results, not every branch’s conversational history.

## Delegation and parallel agents

- give each agent a minimal authoritative packet with exact inputs and output contract;
- do not ask several agents to rediscover the same context unless independent replication is the objective;
- parallelize only non-overlapping semantic owners and write surfaces;
- centralize shared-contract changes and invalidation;
- require concise branch outputs with evidence and limits;
- retire or archive completed packets after integration so stale branch context does not remain active.

Parallel token use is still total token use. More agents are efficient only when they reduce critical-path time or improve independent evidence without duplicating work.

## Recovery from context pressure

Symptoms of context pressure include:

- repeatedly asking or searching for facts already established;
- confusing branch-local and parent authority;
- losing exact revisions or status;
- broad summaries replacing mechanism;
- accumulating several incomplete fixes;
- skipping validation to “finish”; 
- output truncation or tool-result eviction;
- contradictory claims from stale packets.

When these appear:

1. stop new scope;
2. freeze exact current state;
3. rebuild the compact authoritative packet from durable sources;
4. classify what is accepted, partial, invalidated, or unknown;
5. split the branch or hand off if one full evidence cycle no longer fits;
6. resume only after reserve and authority are restored.

Do not solve context pressure by deleting inconvenient evidence or lowering rigor.

## Token debt

**Token debt** is future context reconstruction created by failing to preserve unique state now.

Examples:

- a design decision exists only in chat;
- a branch output lacks exact revision or assumptions;
- a failure was fixed but the causal evidence was not recorded;
- partial state is left without continuation instructions;
- the same authority is copied into several drifting files;
- a PR description is the only place explaining a public contract;
- cleanup or external-resource state is omitted from handoff.

Token debt blocks completion when another agent would need to repeat material research, reconstruct unsafe state, or guess authority. Pay it by moving unique durable truth to the correct owner, not by creating another generic summary.

## UMCGS-specific discipline

For UMCGS:

- do not load or design every domain adapter while defining one universal contract; use synthetic counterexamples and exact second instances;
- do not ingest entire CUDA documentation when one capability, ABI, launch, memory, or synchronization question is decisive;
- keep driver/toolkit/architecture/model/resource-profile identities exact in generated/JIT/cache work;
- keep Search IR, domain, graph, policy, evaluator, resource, and conformance branches separate enough for full attention but integrate their shared semantics centrally;
- reserve substantial capacity for cross-contract reconciliation, finite-memory behavior, device closure, cancellation/teardown, and search-quality equivalence;
- treat profiler traces, generated engines, model packages, and large logs as artifacts with exact identities, not prompt text;
- do not spend the validation reserve on speculative CUDA optimization or first-domain convenience.

## Prohibited patterns

- “Use as few tokens as possible” as a substitute for engineering judgment.
- Reading the entire repository before identifying the owner.
- Repeating full authority in every artifact.
- Keeping all historical context active.
- Starting a new branch in yellow or red state.
- Continuing mutation when there is not enough room to validate and hand off.
- Generating broad code before path-changing unknowns are resolved.
- Repeated tool retries without a changed hypothesis.
- Using CI as the first debugger for locally detectable failures.
- Summarizing away contradictions, exact revisions, failed hypotheses, or partial state.
- Creating a durable token ledger for trivial work.
- Claiming efficiency because output is short while another agent must reconstruct the work.
- Claiming thoroughness because output is long while no decision or evidence changed.

## Validation of token discipline

A material task demonstrates token discipline when:

- the active context packet contains only current path-relevant authority and evidence;
- required context was not omitted for brevity;
- retrieval and tool use were targeted and non-repetitive;
- phase/focus-branch outputs and exact revisions were checkpointed;
- validation, integration, cleanup, review, and handoff reserve remained available;
- shared context was linked rather than duplicated;
- context pressure caused scope reduction, rebranching, or handoff rather than reduced rigor;
- no material token debt remains;
- the final result required less total reconstruction and rework than plausible alternatives.

Do not evaluate individual agents by raw token count alone. Evaluate verified progress, correctness, rework, missed integration, repeated retrieval, and continuation cost.

## Completion

Token-use discipline is satisfied when:

- the task used a proportional context/budget strategy;
- authority, mechanism, consequences, and exact state remained available at the point of decision;
- every operation retained enough capacity for inspection and falsification;
- validation, integration, cleanup, review, and handoff were completed rather than starved;
- compaction preserved all path-changing facts and removed duplicate/stale context;
- focus branches fit full attention and handed off exact outputs rather than transcripts;
- no material token debt, hidden partial state, or unreconstructable decision remains;
- further token spending would not materially change the result, evidence, risk, or next action.
