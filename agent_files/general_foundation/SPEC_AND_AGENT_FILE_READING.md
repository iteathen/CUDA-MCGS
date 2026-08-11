# Selective Specification and Agent-File Reading

**Scope:** Discovering, interpreting, applying, refreshing, and retiring specifications, ADRs, agent instructions, manifests, indexes, plans, and supporting documentation for any UMCGS task.

## Purpose

Agents fail in two opposite ways:

- **context flooding:** reading every specification, agent file, historical decision, and adjacent document whether or not it can affect the task;
- **authority omission:** reading only the obvious file or implementation and missing a governing instruction, definition, dependency, lifecycle rule, compatibility promise, or specialist doctrine.

The governing rule is:

> Read the smallest authority-complete document set for the task. Discover broadly enough to avoid omissions; classify applicability before reading deeply; then read every governing and materially triggered document to semantic closure.

“Not everything applies” is not permission to guess. “Do not miss anything important” is not a requirement to load the entire repository.

## Key terms

### Instruction chain

The ordered set of agent instructions that applies to a target path or operation:

- repository-root `AGENTS.md`;
- canonical agent operating manual and hard rules referenced by it;
- every path-scoped `AGENTS.md` from the repository root toward the target path, when nested files exist;
- objectively triggered specialist doctrine;
- tool-specific adapter files only as routing pointers unless accepted authority explicitly gives them additional scope.

### Direct governing authority

The current accepted instruction, ADR, specification, public contract, manifest, or owner decision that directly owns the task’s behavior or boundary.

### Authority closure

The smallest set containing:

```text
mandatory operating kernel
+ every applicable path instruction chain
+ direct governing authority
+ normative references required to interpret that authority
+ objectively triggered specialist doctrine
+ materially affected owner/dependency/consumer contracts
```

A task is not ready for mutation until this set is known or a missing-authority blocker is explicit.

### Semantic closure

Enough of a document and its references to interpret a requirement correctly, including the terms, conditions, exceptions, ownership, lifecycle, failure behavior, compatibility, and conformance evidence on which the requirement depends.

An isolated sentence or search snippet is not semantic closure when its meaning depends on another section.

### Applicability disposition

The reason a candidate document is read deeply, scanned, retained as evidence, or excluded from active context.

## 1. Start with the task signature

Before discovering documents, state the task signature:

- exact requested outcome and claim;
- target repository, paths, symbols, schemas, artifacts, external resources, and operations;
- owning product area/component/boundary if known;
- whether work changes behavior, authority, public contracts, persistence, generated output, resources, tests, packaging, release, or only presentation;
- task class and consequence;
- current branch, revision, plan/focus branch, and environment.

Document applicability follows the task’s semantic effects—not merely the filenames first mentioned.

A task that begins as a local edit must be reclassified when it changes a public contract, generated artifact, persistent format, resource model, test oracle, branch lifecycle, or external state.

## 2. Load the mandatory operating kernel

UMCGS’s kernel is intentionally small and current:

- root `AGENTS.md`;
- canonical `agent_files/AGENTS.md`;
- `agent_files/AI_RULES.md`;
- `agent_files/DESIGN_ALIGNMENT_CARD.md`;
- compact `agent_files/general_foundation/PRINCIPLES.md`;
- current `STATUS.md` and `next_step.yaml` when project state or planned work is relevant;
- exact repository/branch/revision status.

The kernel explains authority order and how to discover the rest. It does not imply that every detailed doctrine file applies to every task.

Do not substitute a remembered summary for the current kernel after its revision changes.

## 3. Discover the complete instruction chain

### Repository and path scope

For each target path:

1. read the repository-root `AGENTS.md`;
2. discover every nested `AGENTS.md` on the path from root to the target;
3. read them in root-to-leaf order;
4. record the union when several target paths are involved;
5. inspect the instruction chain again if the task begins writing in a new directory.

A more local instruction may specialize the parent instructions for its subtree. It may not silently weaken or contradict higher authority. Report conflicts before mutation.

### Multiple repositories

A cross-repository task loads the root instruction chain and current authority of **each** repository whose state will be read, modified, tested, packaged, reviewed, or published.

One repository’s agent files do not govern another repository’s private internals. The public inter-repository contract governs the boundary.

### Tool adapters

`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, and similar tool files are normally thin entry adapters. Follow their canonical links. Do not create or trust a competing rule set merely because a tool-specific file repeats or paraphrases a rule.

## 4. Find the owning authority before broad reading

Use this discovery order:

1. `SYSTEM_REGISTRY.md` for boundary ownership and durable location;
2. repository and documentation indexes;
3. component manifest and owning README;
4. accepted ADR/specification indexes;
5. exact identifiers: boundary IDs, specification IDs, schema IDs, public symbols, artifact names, errors, commands, and target paths;
6. repository search for those identifiers and material task terms;
7. references and dependency links from the owning documents.

Do not begin with a recursive read of `docs/` or `agent_files/`.

If the registry or index is stale, incomplete, or contradictory, treat that as a documentation-governance defect. Search to bound the missing authority and either repair the index in scope or record a blocker/debt item with an owner.

## 5. Use a two-pass reading method

### Pass A: discovery and classification

For each plausible document, inspect enough to determine:

- title, status, owner, scope, and exact revision;
- applies-to and out-of-scope statements;
- headings and requirement structure;
- normative dependencies and cross-references;
- supersession state;
- relationship to the target owner, operation, dependency, consumer, lifecycle, or claim.

Do not extract implementation obligations from Pass A alone unless the document is short and already read to semantic closure.

### Pass B: semantic reading

Read deeply only documents classified as governing, triggered, or materially adjacent. Extract:

- definitions and shared vocabulary;
- normative obligations and prohibitions;
- conditions, exceptions, and permitted variation;
- owner, state, identity, units, ranges, precision, versions, and memory spaces;
- lifecycle, ordering, concurrency, publication, cancellation, and teardown;
- resource, pressure, failure, rollback, recovery, and cleanup behavior;
- compatibility, migration, persistence, security, and provenance;
- conformance, test oracle, and evidence requirements;
- dependencies and downstream effects.

The output is a compact obligation/applicability map, not a transcript of the document.

## 6. Classify applicability explicitly

Use these dispositions:

### `kernel`

Always-read operating instructions and current task state.

### `governing`

Direct accepted authority for the behavior, owner, contract, or operation. Read to semantic closure before mutation.

### `triggered`

Specialist doctrine made applicable by an objective task effect or risk. Read the complete relevant method and its prerequisites.

### `adjacent-check`

An immediate owner, producer, consumer, dependency, generated form, lifecycle, test, or cleanup boundary that could be affected. Scan it; promote it to governing/triggered when the coupling is material.

### `evidence-only`

Architecture explanation, research, prior implementation, logs, or history used to inform a decision but not governing by itself.

### `not-applicable`

A plausible candidate whose scope, owner, operation, or consequence does not intersect the task. Give a short reason when the exclusion is material.

### `superseded-or-archive`

Historical material used only for provenance, migration, dispute resolution, or understanding supersession.

### `blocked-or-missing`

Required authority cannot be found, is contradictory, or does not decide a necessary issue. Stop the affected mutation and route the gap to its owner.

Do not create a ledger entry for every unrelated repository file. Record only the generated candidate set: governing documents, triggered families, material adjacency, and plausible near misses whose exclusion matters.

## 7. Determine triggers from semantic effects

A task triggers doctrine because of what it changes, not because of the words used in the request.

| Effect or operation | Typical documentation family to load |
|---|---|
| Public contract, schema, ABI, protocol, package, or persisted format | owning specification, contract standard, compatibility/evolution, generated/cache identity, migration, conformance |
| Component creation, ownership, dependency direction, repository split | project organization, LEGO/component/composition doctrine, registry, architecture/ADR authority |
| Foundational type, width, range, identity, precision, layout | domain-appropriate foundations, maximum accurate generality, memory/performance, compatibility |
| CUDA, concurrency, publication, cancellation, device memory, IPC | architecture guardrails, memory/performance, testing/debugging, security, cleanup |
| Native/JIT/generated executable behavior | security, generated/JIT/ABI rules, provenance/cache identity, testing, compatibility |
| Persistence, migration, recovery, rollback | compatibility/evolution, security, cleanup, test/recovery requirements |
| Performance or search-quality claim | benchmark/testing doctrine, exact evidence identity, semantic and quality guardrails |
| Debugging or repair | debugging, testing, owning specification/oracle, evidence invalidation |
| Sanity/audit/release claim | sanity, semantic interrogation, validation, cleanup, release/PR doctrine |
| PR readiness, review, merge, branch deletion | PR review/merge, focus branches, cleanup, current discussion/protection |
| External source or implementation reuse | research policy, exact source/revision/license, security/provenance, donor disposition |
| Documentation/authority change | documentation governance, indexes, registry, supersession, affected reader routes |

This table is illustrative, not exhaustive. Use the task’s owner, consequences, and current repository registry to resolve exact files.

## 8. Perform the adjacency scan

Direct authority is not enough when the change crosses a boundary.

For every target owner, inspect at least one semantic hop in each applicable direction:

- upstream producers and input contracts;
- downstream consumers and output contracts;
- public adapters and peer-repository boundaries;
- canonical source and generated forms;
- persistent state and migration readers/writers;
- lifecycle owner, cleanup owner, and recovery path;
- test oracle, owning capsule, integration path, and evidence identity;
- packaging, release, permission, or external-resource owner.

Promote adjacent documents to deep reading when the task can change their assumptions or evidence.

Continue widening only while a material consequence or unresolved dependency is discovered. “One hop” is a default discovery minimum, not a hard boundary.

## 9. Read specifications correctly

### Check authority before content

Read status, scope, owner, version, and supersession before using requirements.

- **Accepted:** governing only within its declared scope.
- **Proposal:** useful for drafting/review/experiments, but not production implementation authority unless an explicit higher-authority instruction permits the bounded work.
- **Superseded:** provenance only unless migration/history requires it.
- **Research Note:** evidence, not governing by itself.
- **Informational:** map or explanation, not an independent requirement source.

An accepted specification outside the task’s scope is not applicable merely because it is accepted.

### Read the normative closure

For every material requirement, include:

- the terms it uses;
- referenced normative sections/documents;
- conditions and exceptions;
- ownership and lifecycle sections;
- failure/resource/compatibility/security behavior;
- conformance evidence and test oracle.

A requirement copied without these dependencies is not considered read.

### Distinguish normative and informative content

Examples, rationale, diagrams, implementation sketches, and prior behavior do not override normative requirements unless the specification explicitly makes them normative.

`MUST`, `MUST NOT`, `SHOULD`, and `MAY` retain their documented meanings. Do not turn `MAY` into a requirement or `SHOULD` into optional convenience without an exception decision.

### Do not invent unspecified behavior

Absence of a rule is not automatic permission when the decision is material to correctness, safety, ownership, compatibility, persistence, resources, or public behavior. Classify it as a gap, derive the requirement transparently from accepted authority, or route it to the owner.

### Track exact identity

Record specification ID/version/status and repository revision. Invalidate derivative summaries, plans, generated artifacts, tests, and reviews when the governing revision or meaning changes.

## 10. Read agent files correctly

Agent files define method, authority order, and operation-specific gates. They are not all equally applicable at all times.

### Global instructions

Read the mandatory kernel in full enough to understand authority order, startup, hard prohibitions, token posture, and routing.

### Triggered method files

Read the detailed method when the task triggers it. Examples:

- a material design decision triggers engineering judgment;
- large work triggers focus branches;
- material testing triggers testing/debugging;
- destructive or retained state triggers cleanup;
- a PR/merge operation triggers PR review and merge;
- a full-system claim triggers sanity and semantic interrogation.

Do not read only the template for a method. Templates are structures beneath the governing doctrine.

### Operation matters as much as artifact type

Editing a small Markdown file may still trigger PR, authority, supersession, or cleanup instructions. Changing one line in a schema may trigger compatibility, generated artifacts, tests, and migration. Deleting a branch triggers cleanup even when no production source is changed.

### Plans and summaries

`next_step.yaml`, task plans, branch packets, PR descriptions, handoffs, and summaries describe current work state. They remain beneath accepted authority. Use them to find relevant documents, but never let stale plan wording override current specifications or agent rules.

## 11. Reading depth levels

Use the least depth that preserves correctness:

### D0 — identity

Title/path, owner, status, version, revision.

### D1 — applicability scan

Purpose, scope/out-of-scope, headings, references, supersession, and task relationship.

### D2 — semantic sections

All relevant definitions, requirements, conditions, lifecycle/failure/compatibility/test sections and normative references.

### D3 — complete document

Required when the document is tightly coupled, small, foundational, ambiguous, critical, or section boundaries cannot preserve meaning.

### D4 — provenance/history

Prior versions, superseded decisions, discussions, or external history needed for migration, dispute, or rationale.

Governing documents normally require at least D2. Critical foundational specifications often require D3. Candidate and adjacent documents normally begin at D0/D1.

## 12. Create a compact reading map

For substantial, critical, cross-session, or review-sensitive work, preserve a compact map such as:

| Document / exact revision | Status and owner | Disposition | Reading depth | Obligations or reason excluded | Invalidation trigger |
|---|---|---|---|---|---|

Also record:

- target-path instruction chains;
- registry/index/search routes used;
- trigger families checked;
- material adjacency checked;
- missing/conflicting authority;
- documents that changed during the task.

Routine work does not need a standalone map when the route and applicability are obvious. Use [`../templates/document-reading.template.yaml`](../templates/document-reading.template.yaml) only when another session, agent, reviewer, or high-consequence decision needs durable evidence.

## 13. Re-route dynamically

Repeat discovery and applicability classification when:

- scope expands to a new path, owner, component, repository, or external system;
- a public contract, schema, ABI, persistence format, generated artifact, or resource model changes;
- a failure reveals a new lifecycle or dependency boundary;
- the selected path, value ordering, or test oracle changes;
- a governing document changes or is superseded;
- implementation and accepted authority disagree;
- review identifies an unconsidered consumer or doctrine trigger.

Do not keep executing under the original reading map after the task’s semantic shape changes.

## 14. Pre-mutation authority-closure check

Before a material edit, prove:

- every target path’s instruction chain is known;
- direct owner and current governing documents are identified;
- normative references required for meaning were followed;
- triggered specialist doctrine was read;
- material producer/consumer/lifecycle/test/cleanup adjacency was checked;
- every plausible candidate has an applicability disposition;
- no unresolved conflict, gap, stale status, or missing access changes the path;
- exact document revisions are recorded where material.

If this cannot be established, research or block the affected operation rather than guessing.

## 15. Pre-claim refresh

Before acceptance, PR readiness, merge, release, or handoff:

1. compare the final changed surface with the original task signature;
2. rerun trigger and adjacency discovery for newly affected surfaces;
3. verify governing documents and statuses did not change;
4. reread changed authority and every section whose meaning was invalidated;
5. confirm implementation, tests, generated forms, plans, and claim language align;
6. report checks not run and documents unavailable;
7. retire stale summaries and unrelated context.

A correct initial reading does not support a final claim after the scope or authority changes.

## 16. Token-efficient reading without shallow reading

- search indexes/registry/IDs before broad reads;
- batch D0/D1 discovery for independent candidate documents;
- retrieve exact contiguous sections rather than disconnected snippets;
- link authority instead of quoting it repeatedly;
- preserve a compact obligation map instead of document transcripts;
- reuse a revision-specific reading map while its identity remains valid;
- discard cold documents after their applicability disposition and unique evidence are durable;
- read the whole document when fragmentation would hide meaning.

If uncertainty remains about a document’s applicability and the consequence is material, read it. The cost of one relevant document is lower than implementing against the wrong authority.

## 17. UMCGS examples

### Typographical correction in an informational README

Read the kernel, the target path instruction chain, documentation governance, current file status, and affected index if any. CUDA memory, search policy, evaluator, and persistence specifications are normally `not-applicable`. Verify links and final diff.

### Public Search IR schema change

Read the kernel; registry; owning accepted/proposed Search IR authority appropriate to the task; terms, identity/range/versioning/conformance sections; domain, graph, policy, evaluator, resource, generated-layout, compatibility, and consumer adjacency; testing and cleanup doctrine. A one-line schema diff does not make this a one-document task.

### CUDA synchronization repair

Read the path instruction chain; owning search/runtime contract; device-closure, memory/performance, concurrency/publication, cancellation/teardown, testing/debugging, and cleanup authority; generated module and host-reference adjacency. Do not infer correctness from a passing mock.

### PR review and merge

Read the kernel and changed component authority, then the PR-review/merge and cleanup doctrine regardless of whether implementation authors already read them. Refresh the final head, discussion, checks, branch/dependent state, and changed authority before merge.

### UMCGS-to-CUDA-JS contract work

Read both repositories’ root instruction chains, each side’s public ownership authority, and the inter-repository contract. Do not import either repository’s private implementation instructions into the other. Test each repository internally and the public compatible pair once.

## 18. Prohibited patterns

- Reading every document because relevance was not analyzed.
- Reading only files named in the request.
- Treating a search result snippet as a complete requirement.
- Using an accepted specification outside its scope.
- Treating a proposal, architecture note, example, plan, or test as accepted authority.
- Ignoring definitions, normative references, conditions, or exceptions.
- Reading a template without the method it implements.
- Missing nested/path-scoped `AGENTS.md` files.
- Applying one repository’s private agent rules to another repository.
- Declaring a document `not-applicable` because it is long or inconvenient.
- Keeping a full negative ledger of every unrelated file.
- Continuing after scope expansion without re-running document discovery.
- Using stale summaries after authority changes.
- Resolving conflicting specifications silently in implementation.
- Claiming complete alignment without a final trigger/adjacency refresh.

## Validation

A material task demonstrates sound reading when:

- the mandatory kernel and every target-path instruction chain were loaded;
- indexes, registry, exact IDs, search, references, and adjacency were used to discover candidate authority;
- status, scope, owner, version, and supersession were checked before content was applied;
- every direct governing and triggered document was read to semantic closure;
- material normative references and one-hop consequence boundaries were accounted for;
- exclusions were reasoned rather than based on convenience;
- obligation/applicability results are traceable to exact revisions;
- scope or authority changes triggered re-routing and invalidation;
- final implementation/tests/claims align with current authority;
- no material document-reading debt remains.

## Completion

Selective reading is complete when the active document set is both:

- **minimal:** no unrelated or superseded material remains active merely because it exists; and
- **authority-complete:** no governing instruction, normative dependency, triggered specialist doctrine, or material adjacent contract remains unclassified or unread at the depth required by consequence.

Additional reading should stop when every material candidate has a disposition and further documents cannot change the authority, design, validation, risk, cleanup, or next action.
