# Context Routing

**Scope:** Reusable foundation for discovering, loading, refreshing, compacting, and retiring agent context.

## Goal

Load the smallest **authority-complete and consequence-complete** context sufficient for the current decision.

Repeatedly reading all history wastes tokens and allows stale or irrelevant material to regain influence. Loading too little hides ownership, definitions, invariants, failure behavior, compatibility, and integration consequences.

Use [`SPEC_AND_AGENT_FILE_READING.md`](SPEC_AND_AGENT_FILE_READING.md) to discover document applicability and semantic closure. Use [`TOKEN_DISCIPLINE.md`](TOKEN_DISCIPLINE.md) to preserve the practice floor and evidence reserve.

## Context layers

### 1. Operating kernel

Load first and keep compact:

- root `AGENTS.md`;
- canonical `agent_files/AGENTS.md` and `AI_RULES.md`;
- compact design alignment and principles;
- current `STATUS.md` and `next_step.yaml` when project state matters;
- active parent/focus-branch packet;
- exact repository, branch, worktree, and revision state.

### 2. Path instruction chains

For every target path, discover all applicable `AGENTS.md` files from repository root toward the target. For several paths, use the union. For cross-repository work, load each repository’s own chain.

Tool-specific adapters route to canonical authority and do not become competing instructions.

### 3. Governing authority

Load only authority that owns the current question:

- relevant accepted ADRs and specifications;
- `SYSTEM_REGISTRY.md` ownership entry;
- component manifests and public contracts;
- normative references required to interpret those documents;
- objectively triggered security, compatibility, persistence, cleanup, release, testing, or specialist doctrine.

### 4. Local mechanism

Load exact implementation, schema, generated source, state, tests, traces, callers, and artifacts needed to understand the operation.

### 5. Material consequence horizon

Widen to materially affected producers, consumers, dependencies, adapters, generated forms, persistence, lifecycle/recovery, tests, resources, compatibility, security, performance, packaging, and cleanup.

### 6. Rationale and provenance

Read architecture explanation, research, prior PRs/plans, and archive only when alternatives, external facts, provenance, migration, dispute, or supersession are material.

Do not keep a layer active after it ceases to affect the path.

## Retrieval sequence

1. State the task signature: outcome, targets, operations, owners, claim, task class, and exact revision.
2. Read the operating kernel.
3. Discover every target-path instruction chain.
4. Use registry, indexes, manifests, exact IDs, and search to find direct governing authority.
5. Check status, scope, owner, revision, and supersession before applying content.
6. Perform a trigger scan for specialist doctrine.
7. Perform a material adjacency scan for producers, consumers, dependencies, generated forms, lifecycle, tests, packaging, and cleanup.
8. Classify candidate documents before deep reading.
9. Read governing, triggered, and material adjacent documents to semantic closure.
10. Inspect exact local mechanism and focused evidence.
11. Record exact sources, obligations, exclusions, and invalidation triggers in the compact task packet when material.
12. Retire unrelated context before loading another branch.

## Search and range discipline

- Use registry and indexes before broad browsing.
- Search exact boundary IDs, spec IDs, schema names, symbols, paths, errors, and artifact names.
- Prefer exact diffs and affected context over rereading unchanged files.
- Use line/range/log-window filters for large artifacts.
- Read a complete owning function, contract, or contiguous semantic section when snippets would hide invariants or control flow.
- Follow normative references needed for meaning.
- Batch independent D0/D1 applicability scans needed for one decision.
- Keep large logs, profiler traces, models, generated engines, and datasets outside prompt context; preserve exact identity and retrieve targeted parts.
- Do not substitute a summary for a changed source revision.

## Applicability and reading depth

Classify plausible documents as `kernel`, `governing`, `triggered`, `adjacent-check`, `evidence-only`, `not-applicable`, `superseded-or-archive`, or `blocked-or-missing`.

Use proportional depth:

- D0 identity;
- D1 applicability scan;
- D2 semantic sections and normative references;
- D3 complete document;
- D4 provenance/history.

Governing documents normally require D2 or greater. Foundational, ambiguous, tightly coupled, or critical documents often require D3.

Do not maintain a negative ledger of every unrelated file. Record material near misses and triggered families whose exclusion affects confidence.

## Freshness checks

Before relying on context, confirm:

- recognized status where status applies;
- current owner, index, and registry linkage;
- no later ADR/specification supersedes it;
- exact revision/hash/version/profile;
- declared scope actually intersects the task;
- normative references required for interpretation are current;
- component path, manifest, and public surface still match;
- observed behavior does not contradict authority;
- focus-branch dependency inputs remain current.

Reread when source revision, shared meaning, branch input, target path, owner, operation, test oracle, or consequence horizon changes. Do not reread unchanged authority merely because the session is long.

## Minimal task packet

For substantial work, retain a compact packet containing:

- task signature, parent/plan/focus branch/node/owner/status;
- exact objective and output contract;
- target-path instruction chains;
- governing authority, statuses, and revisions;
- applicability/reading-depth map for material candidates;
- normalized obligations, shared invariants, and definitions;
- files/symbols/artifacts in scope and explicit non-goals;
- dependency inputs and downstream consumers;
- expected effects, falsifier, validation, cleanup, and integration obligations;
- assumptions, contradictions, failed hypotheses, missing authority, and unresolved questions;
- current partial state and next safe action;
- token/context reserve and operational band when material.

The packet is derivative context, not authority.

## Dynamic rerouting

Repeat instruction discovery, triggers, adjacency, and applicability when:

- work expands to a new path, component, repository, or external system;
- a public contract, schema, ABI, persistence format, generated artifact, or resource model changes;
- a failure reveals a new lifecycle/dependency boundary;
- the selected path or test oracle changes;
- governing authority changes or is superseded;
- review identifies an omitted consumer or doctrine trigger.

Do not continue under a stale reading map after the task’s semantic shape changes.

## Compaction

Compact at branch switches, material decisions, accepted outputs, yellow token state, scope/authority changes, before handoff, and before irreversible operations.

Preserve losslessly:

- exact identifiers and revisions;
- instruction chains and current governing authority;
- applicability dispositions and invalidation triggers;
- accepted decisions, obligations, and outputs;
- assumptions, exclusions, contradictions, and failed approaches;
- operations and partial state;
- checks/evidence locations, checks not run, and claim limits;
- rollback, recovery, cleanup, Git/GitHub, credentials, and external-resource state;
- next action and preconditions.

Safe to discard after durable transfer:

- conversational narration;
- repeated authority quotations;
- duplicate summaries;
- superseded scratch drafts;
- low-value command chatter;
- candidate documents whose applicability disposition is durable and whose content is no longer needed;
- tool output already retained at an exact location.

Never compact away uncertainty, missing authority, failure history, unsafe partial state, or checks not run.

## Pre-claim refresh

Before acceptance, PR readiness, merge, release, or handoff:

1. compare the final changed surface with the task signature;
2. rerun trigger and adjacency discovery for new effects;
3. verify governing statuses and revisions;
4. reread changed authority and invalidated semantic sections;
5. reconcile implementation, tests, generated forms, plans, and claim language;
6. disclose unavailable documents and checks not run;
7. retire stale summaries and cold context.

## Context-pressure response

When repeated rereading, lost revisions, vague summaries, authority confusion, skipped validation, truncation, or several incomplete fixes appear:

1. stop new scope;
2. freeze exact state;
3. rebuild the compact packet from current authority;
4. classify accepted, partial, invalidated, missing, and unknown state;
5. re-run document applicability and authority closure;
6. apply token-backpressure reductions;
7. split/rebranch or hand off if one full evidence cycle no longer fits;
8. resume only after authority and reserve are restored.

Do not solve context pressure by lowering rigor or silently excluding inconvenient documents.

## Task-local and durable records

Routine work needs no separate context or document-reading record when the route is obvious.

Use a durable document-reading, focus-branch, execution, token-budget, cleanup, review, or handoff record only when another session/agent/tool needs its unique state. Link authority rather than copying it. Remove or archive temporary packets after their unique truth is integrated.

## Completion

Context routing is complete when the active working set is:

- current and exact;
- minimal enough to preserve attention and token reserve;
- authority-complete across instructions, normative dependencies, triggers, and material adjacency;
- consequence-complete for the claim and operation;
- free of unrelated or superseded material;
- sufficient for another agent to continue without reconstructing chat history.
