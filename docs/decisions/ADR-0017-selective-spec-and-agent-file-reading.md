# ADR-0017: Selective Specification and Agent-File Reading

**Status:** Accepted

**Date:** 2026-08-10

## Context

UMCGS now has a substantial agent operating system, accepted ADRs, proposed and future specifications, component and repository indexes, path-scoped ownership, current plans, research, and supporting architecture.

Agents can fail in two opposite directions:

- load every specification and agent file, wasting tokens, diluting attention, and allowing stale or irrelevant material to influence the task;
- load only the most obvious file or implementation, missing a governing instruction, normative reference, definition, dependency, lifecycle rule, compatibility promise, test oracle, cleanup requirement, or path-scoped agent file.

Existing context-routing and token-backpressure doctrine requires minimal authoritative context but does not yet define a complete method for discovering document applicability, building path instruction chains, reading specifications to semantic closure, and proving that important documentation was not omitted.

The project owner directed that agents be taught how to read specifications and agent files selectively: not everything applies to the task, but important authority must not be missed.

## Decision

UMCGS adopts the method in:

- `agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md`;
- `agent_files/general_foundation/CONTEXT_ROUTING.md`;
- `agent_files/general_foundation/DOCUMENTATION_GOVERNANCE.md`;
- `agent_files/templates/document-reading.template.yaml`.

### Core rule

Agents must read the smallest **authority-complete** document set for the task.

They discover broadly enough to identify plausible governing and adjacent documents, classify applicability before deep reading, and then read every governing and materially triggered document to semantic closure.

### Authority closure

Before material mutation, agents establish:

```text
mandatory operating kernel
+ all applicable path instruction chains
+ direct governing authority
+ normative references required for interpretation
+ objectively triggered specialist doctrine
+ materially affected owner/dependency/consumer contracts
```

Missing or contradictory required authority blocks the affected mutation.

### Mandatory kernel and path instructions

Agents read the compact repository operating kernel and discover every `AGENTS.md` from repository root toward each target path. Multiple target paths use the union of their instruction chains.

More local instructions may specialize their parent scope but cannot silently weaken or contradict higher authority.

Cross-repository work loads each repository’s own root/path instructions and uses public contracts at the boundary rather than importing private instructions across repositories.

### Two-pass reading

Agents use:

1. **discovery/classification:** inspect status, owner, scope, headings, references, supersession, and relationship to the task;
2. **semantic reading:** deeply read governing, triggered, and material adjacent documents, including definitions, obligations, conditions, exceptions, lifecycle, failure/resource behavior, compatibility, security, cleanup, and conformance evidence.

Search snippets and isolated clauses do not count as semantic reading when meaning depends on other sections.

### Applicability dispositions

Candidate documents are classified as:

- `kernel`;
- `governing`;
- `triggered`;
- `adjacent-check`;
- `evidence-only`;
- `not-applicable`;
- `superseded-or-archive`;
- `blocked-or-missing`.

Agents record only the generated candidate set—not every unrelated repository file. A material exclusion needs a short scope-based reason.

### Trigger and adjacency discovery

Applicability follows semantic effects rather than filenames or request wording.

Agents scan for triggered doctrine whenever work affects public contracts, schemas, ABI, persistence, foundational representations, CUDA/concurrency, security/native execution, generated/JIT behavior, resources, performance, testing/debugging, cleanup, PR/merge, release, or external reuse.

For each target owner, they inspect materially affected producers, consumers, dependencies, generated forms, persistence, lifecycle/recovery, tests, packaging, and external resources. They widen beyond one hop only while material consequences continue.

### Specification reading

Before applying a specification, agents verify status, owner, scope, version, exact revision, and supersession.

Accepted specifications govern only within their scope. Proposals guide drafting/review/explicit experiments but do not authorize production implementation by themselves. Research and architecture are evidence/explanation unless accepted authority says otherwise.

A material requirement is read with its semantic closure: terms, normative references, conditions/exceptions, ownership/lifecycle, failure/resource/compatibility/security behavior, and conformance evidence.

Unspecified material behavior is treated as a gap or transparently derived requirement—not convenient permission.

### Agent-file reading

The mandatory kernel establishes authority order and routing. Detailed method files are read only when objectively triggered, but the complete relevant method and prerequisites are read—not merely its template or one convenient bullet.

Operation type matters as much as artifact type. A small edit can still trigger compatibility, generated-artifact, cleanup, PR, or authority rules.

Plans, `next_step.yaml`, PR descriptions, and handoffs organize current work beneath accepted authority.

### Reading depth

Agents use proportional depth:

- D0 identity;
- D1 applicability scan;
- D2 semantic sections and normative references;
- D3 complete document;
- D4 provenance/history.

Governing documents normally require D2 or greater. Foundational, ambiguous, tightly coupled, or critical documents often require D3.

### Dynamic rerouting and final refresh

Document discovery repeats when scope, target paths, owners, selected design, public contracts, persistence, generated artifacts, resource models, failures, test oracles, or governing documents change.

Before acceptance, PR readiness, merge, release, or handoff, agents compare the final changed surface to the original reading map and refresh changed or newly triggered authority.

### Proportional records

Routine work needs no standalone reading ledger when applicability is obvious.

Use `document-reading.template.yaml` only for substantial, critical, cross-session, cross-agent, cross-repository, disputed, or review-sensitive work where another consumer needs exact document coverage and invalidation state.

## Documentation discoverability obligations

Durable authoritative documents must support selective reading through clear status, scope, owner, stable identifiers where useful, normative references, applies-to/out-of-scope language, supersession, and index/registry links.

A document that cannot be found or classified through the repository’s indexes, registry, identifiers, references, and search creates documentation debt and may block safe work.

## Consequences

- Agents stop recursively reading all documentation by default.
- Important authority is found through an explicit instruction-chain, trigger, and adjacency process.
- Specifications are interpreted with definitions, conditions, failures, and references rather than isolated clauses.
- Accepted status no longer implies universal applicability.
- Proposal, research, architecture, examples, tests, plans, and summaries are kept in their correct authority roles.
- Path-scoped and cross-repository instructions are handled correctly.
- Scope changes invalidate the reading map and trigger rerouting.
- Token efficiency comes from classification and reading depth, not shallow interpretation.
- Review can verify both document coverage and justified exclusions.

## Alternatives considered

### Read all specifications and agent files for every task

Rejected. It wastes tokens, dilutes attention, increases stale-context risk, and is impossible to scale.

### Read only documents directly named by the user or changed files

Rejected. Semantic effects frequently trigger authority outside the named file, including compatibility, lifecycle, generated forms, tests, cleanup, and consumers.

### Depend entirely on the root `AGENTS.md`

Rejected. The root file must remain a compact router and cannot contain every specialist method or path-specific rule.

### Depend entirely on repository search

Rejected. Search can miss renamed concepts, indirect normative references, and ownership relationships; it must be combined with indexes, registry, manifests, references, and adjacency.

### Require a complete negative applicability ledger

Rejected as administrative waste. Only plausible candidates and material near misses need dispositions.

### Treat accepted documents as universally applicable

Rejected. Authority requires both accepted status and scope intersection.

### Allow summaries to replace source documents indefinitely

Rejected. Summaries are derivative and become stale when source revision or meaning changes.

## Validation

A conforming material task demonstrates:

- the mandatory kernel and all target-path instruction chains were read;
- owner and current authority were discovered through indexes/registry/search/references;
- statuses, scopes, exact revisions, and supersession were checked;
- the trigger scan and material adjacency scan were performed;
- every governing and triggered document was read to semantic closure;
- material exclusions have scope-based reasons;
- specification obligations remain traceable to exact sources;
- scope/authority changes caused rerouting and invalidation;
- the final changed surface received a pre-claim refresh;
- no material document-reading debt remains.

Agent hard rules, context routing, documentation governance, specification templates, planning/review/handoff templates, indexes, status, current next-step state, and required documentation checks must route to this decision.

## Revisit triggers

Revisit when agents still miss governing documents, routinely over-read the repository, misuse proposals as authority, fail to discover nested instructions, create excessive applicability paperwork, or encounter documentation structures that cannot support reliable trigger/adjacency discovery.
