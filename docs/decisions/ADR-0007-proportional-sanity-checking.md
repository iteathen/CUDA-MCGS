# ADR-0007: Proportional Sanity Checking

**Status:** Accepted

**Date:** 2026-08-10

## Context

UMCGS needs sanity checks that can scale from one semantic change to a component, repository, generated engine, or release without degrading into either a shallow sampled skim or an administrative exercise that spends more effort on forms than evidence.

The project owner directed UMCGS to adapt the mature sanity-check method from Ars Thaumaturgica. The UMCGS doctrine is derived from the following source state:

- `iteathen/Ars-Thaumaturgica` commit `4a6f8b51bf0ccc9ffc1aca7bcf39df20613018a8`;
- `docs/foundation/scalable-sanity-checking.md`;
- `docs/foundation/proportional-agent-work.md`;
- `.agents/code-block-interrogation.md`;
- `.agents/templates/sanity-check.yaml`;
- `.agents/templates/code-block-interrogation.yaml`;
- `.agents/roles/auditor.md`;
- `.github/ISSUE_TEMPLATE/sanity-finding.yml`.

UMCGS requires additional device-closure, finite-memory, graph/search, schema/JIT/ABI, generated-layout, and search-quality lenses. The adapted files in this repository are authoritative; Ars Thaumaturgica is provenance, not a runtime dependency.

## Decision

UMCGS adopts proportional coverage-accounted sanity checking.

Every declared sanity check must:

1. freeze an exact revision or artifact and declare a `full`, `bounded`, or `sampled` claim;
2. distinguish implementation self-sanity from independent review/audit;
3. build a semantic coverage map by ownership and integration rather than arbitrary file count;
4. account for every surface included in the claim;
5. assign `core`, `triggered-module`, or `exhaustive` depth according to risk;
6. interrogate each material semantic leaf through the mandatory core and objectively triggered modules;
7. reconcile component boundaries, producer/consumer contracts, end-to-end paths, cross-cutting concerns, lifecycle, contradictions, and invalidated evidence;
8. give every actionable independent finding a durable disposition with exact mechanism and consequence;
9. disclose checks not run, access limits, uncertainty, and claim limits;
10. dispose of material review-created state intentionally.

A full claim means complete coverage accounting at risk-justified depth. It does not require identical exhaustive questioning of every low-risk leaf. A sampled review may not be called full.

Tests, static analysis, sanitizers, profilers, benchmarks, and artifact inspection are evidence sources; they do not replace semantic and integration reasoning.

Independent sanity and audit nodes do not quietly repair findings. Self-sanity may repair authorized in-scope defects, but affected coverage and reconciliation must be rerun against the final revision.

## Administrative policy

The sanity process is proportional:

- routine self-sanity may be recorded in the PR or task result;
- one canonical record is used only for full, long-running bounded, multi-agent, incident, release, audit, or cross-session work;
- low-risk leaves may be grouped by common owner, contract, risk, and evidence;
- one form per file/function is prohibited;
- authority, assessment, tests, and findings are linked rather than copied;
- weak leads do not automatically become issues;
- review stops when the declared claim is supported or exactly limited and additional effort cannot change a material decision.

## Authoritative doctrine

- `agent_files/general_foundation/SANITY_CHECKING.md`;
- `agent_files/general_foundation/SEMANTIC_INTERROGATION.md`;
- `agent_files/templates/sanity-check.template.yaml`;
- `agent_files/templates/semantic-review.template.yaml`;
- `.github/ISSUE_TEMPLATE/sanity-finding.yml`.

## Consequences

- Agents must state the scope and claim type before large review work.
- Full repository/component claims require coverage accounting and reconciliation.
- Critical semantic units receive deep triggered review without forcing exhaustive review of unrelated low-risk leaves.
- UMCGS-specific GPU, resource, graph, evaluator, generated/JIT, and device-closure risks are explicit.
- Findings become durable and independently reviewable rather than disappearing inside quiet repairs.
- Sanity evidence can be parallelized without confusing leaf completion with integrated coherence.
- Administrative work is constrained to records that protect a real claim, finding, continuation, or decision.

## Alternatives considered

### Treat passing tests as sanity

Rejected. Tests observe selected cases and can share the same wrong assumptions as implementation or omit ownership/integration/lifecycle failures.

### Require exhaustive review of every function

Rejected. Uniform depth wastes review attention, creates questionnaire noise, and can obscure critical boundaries. Coverage must be complete; depth must be risk-based.

### Use random sampling for repository-wide confidence

Rejected as a full-claim method. Sampling remains valid when the final claim is explicitly sampled.

### Allow the auditor to fix findings immediately

Rejected for independent reviews because it destroys a stable reviewed subject and can hide the original failure. Separate remediation preserves trust. Self-sanity retains a bounded repair path with revalidation.

### Maintain per-file review ledgers permanently

Rejected as administrative overhead without proportional decision value.

## Validation

Agent routing, validation policy, review guidance, templates, issue forms, documentation indexes, and governance checks must link to the doctrine. A future automated sanity tool may assist inventory and evidence capture but cannot manufacture a broader claim than its observed coverage.

## Revisit triggers

Revisit when repeated reviews show missing risk modules, unmanageable record cost, ambiguous claim boundaries, or a reliable automated mechanism that changes the cheapest decisive evidence. Changes require a superseding ADR rather than silent weakening of coverage or finding standards.
