# ADR-0012: Token-Use and Context Discipline

**Status:** Accepted

**Date:** 2026-08-10

## Context

Coding agents operate inside finite context windows and consume tokens through retrieved context, reasoning, generated text, tool results, repeated reads, retries, validation, review, cleanup, and handoff.

Without explicit discipline, agents tend toward one of two failures:

- waste tokens on duplicated authority, broad repository reads, narration, repeated retries, speculative generation, and several simultaneously active workstreams;
- starve correctness by using the context budget on implementation and leaving insufficient capacity for evidence, integration, cleanup, review, recovery, and continuation.

UMCGS already requires minimal authoritative context, proportional administration, focus branches sized for full attention, dependency-ready plan execution, exact-head review, and explicit cleanup. Those rules need one integrated token-budget policy so agents treat context as an engineering resource rather than an invisible limit encountered at the end of a task.

The project owner directed that agents be taught token-use discipline.

## Source adaptation

This decision synthesizes and extends:

- `iteathen/Ars-Thaumaturgica` commit `c3e25ad1032a1927c9709580fb415ffc48b91020`;
- `.agents/operating-kernel.md`, especially loading only triggered doctrine, establishing path-changing facts, proportional accounting, cheapest decisive falsification, and updating durable truth only when it changes;
- `docs/foundation/multi-scale-synthesis.md`, especially starting at the smallest explanatory scale, widening only to material consequences, and returning broad conclusions to exact owners and evidence;
- UMCGS `CONTEXT_ROUTING.md`, focus-branch doctrine, governed plan execution, cleanup/disposition, sanity checking, and exact-head PR integration.

UMCGS adds explicit reserve bands, context layers, compaction rules, token-debt handling, branch-fit requirements, tool/retry discipline, and UMCGS-specific guidance for CUDA, generated engines, large artifacts, and cross-contract integration. UMCGS files are authoritative here; Ars Thaumaturgica records provenance rather than an external dependency.

## Decision

UMCGS adopts token-use and context discipline for all agent work.

The optimization target is **verified coherent progress per total lifecycle token**, not minimum text length or maximum code generation.

### Correctness floor

Token savings may never remove material authority, exact identity, shared-contract meaning, evidence, failure/resource behavior, compatibility, security, recovery, cleanup, review, or handoff state.

When the available budget cannot support minimum sound work, the agent must reduce scope, split/rebranch, pause mutation, or hand off.

### Reserve

Before mutation, substantial work reserves at least 30% of usable context for validation, integration, cleanup, review, handoff, and one bounded recovery cycle. Critical, large, or cross-branch work reserves at least 40% after loading the branch packet.

These percentages are defaults. The semantic requirement—enough capacity to complete a full act/inspect/falsify/reconcile/checkpoint cycle and a continuation-ready handoff—governs when telemetry is absent or a different reserve is demonstrably appropriate.

Agents do not consume the reserve for new scope or polish.

### Operational bands

- **Green:** enough capacity for at least two complete evidence cycles.
- **Yellow:** below roughly 35%, or only one evidence cycle plus handoff remains; finish/pause active work, checkpoint, and open no new branch.
- **Red:** below roughly 20%, or one full cycle plus handoff no longer fits; stop new mutation, verify/classify state, clean up, and hand off.
- **Emergency:** below roughly 10% or context truncation is occurring; preserve exact state only.

### Context layers

Agents load context in order:

1. compact operating kernel and active parent/focus packet;
2. governing authority that owns the question;
3. exact local mechanism;
4. material consequence horizon;
5. rationale, research, history, and archive only when required.

Cold context is removed from the active working set when it no longer changes the path.

### Retrieval and tool discipline

Agents search/index first, read targeted contiguous sections, prefer diffs and exact affected context, batch independent reads, filter logs/output, and preserve raw evidence once at an exact location.

A failed command, API, build, workflow, or transport may not be retried without a changed hypothesis, input, environment, or transport. Expensive CI and broad scans require an explicit acceptance trigger.

### Reasoning and generation

Agents spend reasoning on path-changing unknowns and stop when more reasoning cannot alter the decision, scope, evidence, or risk.

They do not repeatedly reargue accepted decisions without a revisit trigger, generate speculative scaffolding, copy authority into many records, narrate every tool call, or paste large artifacts when identity and targeted differences suffice.

### Checkpoint and compaction

Checkpoints are required at branch switches, material decisions, accepted outputs, yellow state, context compaction, risky/irreversible operations, failures/rollbacks, and shared-contract invalidation.

Compaction must preserve exact authority/revisions, decisions, outputs, assumptions/exclusions, contradictions, failed hypotheses, partial state, checks run/not run, cleanup/recovery, Git/GitHub/external state, and next safe action.

Summaries remain derivative context and cannot replace authority.

### Focus branches

A focus branch is valid only when its complete packet, execution, validation, cleanup, and handoff reserve fit one usable context window. Repeated rereading, loss of mechanism/consequence coherence, or reserve exhaustion requires splitting, rebranching, or handoff.

Agents normally keep one active branch and consume sibling results as exact output contracts rather than conversational transcripts.

### Token debt

Token debt is future reconstruction caused by failing to preserve unique durable state. It includes decisions existing only in chat, branch outputs without exact revisions/assumptions, undocumented failure causes, unsafe partial state without continuation instructions, duplicated drifting authority, and omitted cleanup/external-resource state.

Material token debt blocks completion. It is paid by moving unique truth to the correct owner, not by adding another generic summary.

## Proportional records

Routine work does not require a token ledger.

Use `agent_files/templates/token-budget.template.yaml` only when:

- work crosses sessions or agents;
- exact token telemetry materially guides execution;
- the task is critical, large, parallel, or repeatedly context-constrained;
- another consumer needs phase allocation, reserve, compaction, or token-debt evidence.

The token record holds only unique budget/context decisions. It does not duplicate the parent plan, focus packet, execution record, PR, or handoff.

## UMCGS-specific consequences

Agents must:

- keep large CUDA documentation, profiler traces, logs, model packages, and generated engines outside prompt context when exact artifact identity and targeted sections suffice;
- reserve capacity for finite-memory, device-closure, cancellation/teardown, generated/JIT/cache/ABI identity, and search-quality reconciliation;
- avoid loading every domain adapter while defining one universal contract;
- use synthetic second instances and counterexamples rather than broad first-domain context;
- prevent Search IR, domain, graph, policy, evaluator, resource, and conformance branches from consuming one another’s transcripts or drifting shared meaning;
- never spend verification reserve on speculative optimization.

## Consequences

- Context budgeting begins before mutation.
- Validation, integration, cleanup, and handoff cannot be deferred until the window is nearly exhausted.
- Large work splits by semantic branch fit rather than continuing with diluted attention.
- Retrieval and tool use become targeted and revision-aware.
- Durable records link authority instead of copying it.
- Context pressure produces checkpointing, rebranching, or handoff instead of lower rigor.
- Raw token count is not used as a quality metric; verified progress, rework, repeated retrieval, missed integration, and continuation cost matter.

## Alternatives considered

### Minimize all token use

Rejected. It rewards incomplete authority, weak evidence, and under-specified handoffs.

### Maximize context to avoid missing anything

Rejected. Loading all history and repository material increases drift, stale authority, attention dilution, and cost.

### Leave budgeting to each model/runtime

Rejected. Runtime context limits do not decide what must be reserved for engineering correctness or what may be safely compacted.

### Use fixed percentages as hard quotas

Rejected. Percentages are default safeguards; actual work is governed by whether complete evidence cycles and handoff fit.

### Require a token record for every task

Rejected as administrative waste. Durable records are proportional and triggered only when another consumer needs them.

### Continue until the model truncates

Rejected. Reactive truncation loses exact state and starves validation, cleanup, and recovery.

## Validation

A conforming material task shows that:

- the active packet contains current path-relevant authority and exact revisions;
- required context was not omitted for brevity;
- retrieval, reasoning, and tool calls were targeted and non-repetitive;
- a validation/integration/cleanup/review/handoff reserve was established and preserved or explicitly justified;
- operational context pressure caused no new scope and no reduction in rigor;
- checkpoints preserve lossless path-changing state;
- focus branches fit one usable window and sibling results are consumed as contracts;
- large artifacts remain external with exact identities;
- no material token debt remains;
- further token spend would not materially change the result, evidence, risk, or next action.

Agent routing, context routing, focus branches, plan execution, validation, review, PR templates, plans/handoffs, status, indexes, current next-step state, and governance checks must link to this doctrine.

## Revisit triggers

Revisit when agents still exhaust context before validation, repeatedly reread authority, produce poor handoffs, overuse formal token records, misuse percentage bands, or new runtimes expose materially different context/telemetry behavior. Changes must preserve the correctness floor, reserved evidence capacity, targeted context, lossless checkpoints, and no-token-debt completion rule.
