# Context Routing

**Scope:** Reusable foundation for loading, refreshing, compacting, and retiring agent context.

## Goal

Load the smallest **authoritative and consequence-complete** context sufficient for the current decision. Repeatedly reading all history wastes tokens and allows stale proposals to regain authority. Loading too little hides ownership, invariants, failure behavior, and integration consequences.

Context routing follows [`TOKEN_DISCIPLINE.md`](TOKEN_DISCIPLINE.md): maximize verified coherent progress per token while preserving enough capacity for validation, integration, cleanup, review, and handoff.

## Context layers

### 1. Operating kernel

Load first and keep compact:

- root `AGENTS.md` and canonical agent rules;
- compact `PRINCIPLES.md`;
- current `STATUS.md` and `next_step.yaml`;
- active parent/focus-branch packet;
- exact repository, branch, worktree, and revision state.

### 2. Governing authority

Load only authority that owns the current question:

- relevant accepted ADRs and specifications;
- `SYSTEM_REGISTRY.md` ownership entry;
- affected component manifests and public contracts;
- objectively triggered security, compatibility, persistence, cleanup, release, or specialist doctrine.

### 3. Local mechanism

Load exact implementation, schema, generated source, state, tests, traces, callers, and artifacts needed to understand the operation.

### 4. Material consequence horizon

Widen only to callers/callees, producer-consumer boundaries, end-to-end paths, lifecycle, resources, compatibility, security, performance, and cleanup that can change the decision.

### 5. Rationale and provenance

Read architecture explanation, research, previous PRs/plans, and archive only when alternatives, external facts, provenance, or supersession are material.

Do not keep a layer active after it ceases to affect the path.

## Retrieval sequence

1. Read the operating kernel.
2. Identify exact parent task, focus branch, node, owner, and desired output.
3. Use indexes, registry, search, dependency information, and exact identifiers to find the owning authority.
4. Confirm current status, revision, and supersession.
5. Read the owning contract or smallest contiguous section that preserves semantics.
6. Inspect exact local mechanism and focused tests/evidence.
7. Widen only to the material consequence horizon.
8. Read rationale/history/archive only when necessary.
9. Record exact sources and revisions in the compact task packet.
10. Retire unrelated context before loading another branch.

## Search and range discipline

- Search or use the registry before broad browsing.
- Prefer exact diffs and affected context over rereading unchanged files.
- Use line/range/log-window filters for large artifacts.
- Read a complete owning function, contract, or contiguous section when snippets would hide invariants or control flow.
- Batch independent retrievals needed for one decision.
- Keep large logs, profiler traces, model packages, generated engines, and datasets outside prompt context; preserve exact identity and retrieve targeted parts.
- Do not substitute a summary for a changed source revision.

## Freshness checks

Before relying on context, confirm:

- recognized status where status applies;
- current index or registry linkage;
- no later ADR/specification supersedes it;
- exact revision/hash/version/profile;
- scope actually owns the question;
- component path and manifest still match;
- observed behavior does not contradict it;
- focus-branch dependency inputs remain current.

Reread when the source revision, shared contract, branch input, or consequence horizon changes. Do not reread unchanged authority merely because the session is long.

## Minimal task packet

For substantial work, retain a compact packet containing:

- parent task, plan version, focus branch, node, owner, and status;
- exact objective and output contract;
- governing authority and revisions;
- shared invariants and definitions;
- files/symbols/artifacts in scope and explicitly out of scope;
- dependency inputs and downstream consumers;
- expected effects, falsifier, validation, cleanup, and integration obligations;
- assumptions, contradictions, failed hypotheses, and unresolved questions;
- current partial state and next safe action;
- token/context reserve and operational band when material.

The packet is derivative context, not authority.

## Compaction

Compact at branch switches, material decisions, accepted outputs, yellow token state, before handoff, and before an irreversible operation.

Preserve losslessly:

- exact identifiers and revisions;
- current authority and shared definitions;
- accepted decisions and outputs;
- assumptions, exclusions, contradictions, and failed approaches;
- operations and partial state;
- checks run, evidence locations, checks not run, and claim limits;
- rollback, recovery, cleanup, Git/GitHub, credentials, and external-resource state;
- next action and preconditions.

Safe to discard after durable transfer:

- conversational narration;
- repeated authority quotations;
- duplicate summaries;
- superseded scratch drafts;
- low-level successful command chatter without decision value;
- tool output already retained at an exact durable location.

Never compact away uncertainty, failure history, unsafe partial state, or checks not run.

## Context-pressure response

When repeated rereading, lost revisions, broad vague summaries, branch confusion, skipped validation, truncation, or several incomplete fixes appear:

1. stop new scope;
2. freeze exact state;
3. rebuild the packet from authoritative sources;
4. classify accepted, partial, invalidated, and unknown state;
5. split/rebranch or hand off if one full evidence cycle no longer fits;
6. resume only after authority and token reserve are restored.

Do not solve context pressure by lowering rigor.

## Task-local and durable records

Routine work needs no separate context document.

Use a durable focus-branch, execution, token-budget, cleanup, review, or handoff record only when another session/agent/tool needs its unique state. Link authority rather than copying it. Remove or archive temporary packets after their unique durable truth is integrated.

## Completion

Context routing is complete when the active working set is current, authoritative, sufficient to understand local mechanism and all material consequences, small enough to preserve token reserve, and free of unrelated or superseded context. Another agent should be able to continue from the compact packet and durable sources without reconstructing chat history.
