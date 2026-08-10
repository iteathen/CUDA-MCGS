# Documentation Governance

**Scope:** Reusable foundation.

## One authority, many entry points

Each durable rule or contract has one authoritative home. Tool adapters, READMEs, examples, comments, and summaries point to it rather than maintaining independent copies.

## Document statuses

Substantial Markdown under `docs/` uses exactly one:

- `Proposal` — reviewable, non-authoritative.
- `Accepted` — current authority within scope.
- `Superseded` — retained history, no longer current.
- `Research Note` — evidence and analysis, not governing by itself.
- `Informational` — index, map, template, or explanation.

## Normative wording

Use **MUST/MUST NOT** for conformance requirements, **SHOULD/SHOULD NOT** for expected behavior with documented exceptions, and **MAY** for optional capability. Normative terms belong in accepted or clearly proposed specifications, not informal summaries.

## Locations

- `docs/decisions/` — cross-cutting ADRs.
- `docs/specs/` — normative contracts and invariants.
- `docs/architecture/` — explanatory models.
- `docs/research/` — external evidence.
- `docs/development/` — project-facing development index.
- `docs/archive/` — superseded history.
- `agent_files/` — canonical developer/agent operating system.

## Provenance

Research records inspection date, exact source/revision, license, verified facts, source claims, inferences, and unknowns. Supersession records original location and replacement authority.

Update links, indexes, registry, and status in the same change. Stale documentation that repeatedly enters agent context is a correctness hazard.
