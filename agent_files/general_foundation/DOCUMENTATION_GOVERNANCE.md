# Documentation Governance

**Scope:** Reusable foundation for authoritative, discoverable, selectively readable project documentation.

## One authority, many entry points

Each durable rule, decision, contract, lifecycle, or test oracle has one authoritative home. Tool adapters, READMEs, indexes, examples, comments, plans, and summaries point to it rather than maintaining independent competing copies.

Selective reading depends on reliable discoverability. A correct rule that agents cannot find, scope, or distinguish from stale material is an operational correctness defect.

## Document statuses

Substantial Markdown under `docs/` uses exactly one:

- `Proposal` — reviewable, non-authoritative for production implementation.
- `Accepted` — current authority within its declared scope.
- `Superseded` — retained history, no longer current authority.
- `Research Note` — evidence and analysis, not governing by itself.
- `Informational` — index, map, template, or explanation.

Accepted status does not imply universal applicability. Scope and ownership must intersect the task.

## Normative wording

Use **MUST/MUST NOT** for conformance requirements, **SHOULD/SHOULD NOT** for expected behavior with documented exceptions, and **MAY** for optional capability. Normative terms belong in accepted or clearly proposed specifications, not informal summaries.

Examples and rationale are informative unless explicitly declared normative. A test, implementation, or historical behavior does not silently become the contract.

## Discoverability contract

An authoritative or reviewable substantial document should make selective reading possible through:

- clear title and stable identifier where useful;
- status;
- purpose and authoritative owner;
- applies-to scope and explicit out-of-scope boundary;
- durable location and affected product/component/boundary;
- defined terms or links to their authority;
- normative dependencies and references;
- conditions, exceptions, lifecycle, failure, compatibility, security, cleanup, and conformance sections where material;
- supersession and migration information;
- index and registry linkage;
- exact version/revision identity where artifacts or external consumers depend on it.

Documents that define several separable concerns should use clear headings and references so agents can read relevant semantic sections without losing required meaning.

Documents that are too tightly coupled for section-level reading should say so or keep their normative core compact enough to read completely.

## Agent-file discoverability

- Root `AGENTS.md` is the repository-wide entry point.
- Canonical agent guidance lives in `agent_files/`.
- Nested `AGENTS.md` files, when present, specialize a subtree and must be discoverable along the root-to-target path.
- Tool-specific files remain thin pointers to canonical authority.
- Templates link to the governing method and do not duplicate or redefine it.
- Specialist doctrine states the objective triggers that make it applicable.

A local instruction may add stricter or more specific rules inside its scope but may not silently weaken higher authority.

## Specification discoverability

Specifications should make these easy to find:

- owner and intended consumers;
- scope and exclusions;
- version/status/supersession;
- terms and units;
- requirement IDs where stable reference is useful;
- normative references;
- public/internal boundaries and dependencies;
- invariants and permitted variation;
- lifecycle, resources, failure, cancellation, recovery, and cleanup;
- compatibility, migration, security, generated/cache identity;
- conformance and performance evidence;
- unresolved questions that block acceptance.

A specification must not require agents to infer normative behavior from architecture prose or examples.

## Locations

- `docs/decisions/` — cross-cutting ADRs.
- `docs/specs/` — normative contracts and invariants.
- `docs/architecture/` — explanatory models.
- `docs/research/` — external evidence.
- `docs/development/` — project-facing development index.
- `docs/archive/` — superseded history.
- `agent_files/` — canonical developer/agent operating system.

## Index and registry obligations

Update links, documentation indexes, `SYSTEM_REGISTRY.md`, `STATUS.md`, and current work state in the same coherent change when authority is created, moved, accepted, superseded, or removed.

Indexes should state document status and purpose rather than merely list filenames. Registry entries identify the owner and authoritative location. Stable boundary/specification IDs should be searchable across plans, tests, manifests, and consumers.

## Normative references and backlinks

A normative document identifies every external section/document required to interpret its obligations. Avoid circular normative dependencies.

When a contract is consumed by another boundary, the consumer should refer to the stable owner or ID so repository search can reveal material adjacency. Do not rely on undocumented tribal knowledge.

## Provenance

Research records inspection date, exact source/revision, license, verified facts, source claims, inferences, and unknowns. Supersession records original location and replacement authority.

Archived material retains enough provenance to explain why it was removed from active authority and what replaced it.

## Documentation changes

A documentation change is not automatically low risk. Changing status, terms, ownership, normative meaning, scope, references, compatibility, or test requirements can invalidate implementation, generated artifacts, plans, evidence, reviews, and downstream repositories.

Before acceptance:

- identify affected readers and consumers;
- update indexes/registry/references;
- invalidate derivative summaries and evidence;
- archive or supersede stale authority;
- run document link/structure checks;
- perform the pre-claim reading refresh defined in [`SPEC_AND_AGENT_FILE_READING.md`](SPEC_AND_AGENT_FILE_READING.md).

## Stale and duplicate documentation

Stale documentation that repeatedly enters agent context is a correctness hazard. Duplicate authority is also a correctness hazard.

Use one authoritative source and thin pointers. Remove pure duplicate scratch. Archive historically useful superseded material with provenance. Do not keep two active documents merely because deleting one is inconvenient.

## Validation

Documentation governance is sound when:

- authoritative documents have clear status, owner, scope, references, and supersession;
- indexes and registry route agents to current authority;
- specialist doctrine exposes applicability triggers;
- path-scoped instructions are discoverable;
- templates point to methods;
- proposals/research/informational material cannot be mistaken for accepted authority;
- material changes invalidate and update downstream references/evidence;
- an agent can construct an authority-complete reading set without recursively reading the repository.
