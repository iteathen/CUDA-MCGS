# ADR-0007: Proportional System-Wide Sanity Checking

**Status:** Accepted

**Date:** 2026-08-10

## Context

UMCGS needs sanity checks that scale from one semantic change to a component, repository, generated engine, or release without degrading into either a shallow sampled skim or an administrative exercise that spends more effort on forms than evidence.

Large reviews also fail when one reviewer attempts to hold the entire system at once. Attention becomes broad and shallow, detailed mechanisms are skipped, and critical questions are applied inconsistently. The opposite failure is to split work into local reviews without later reconciling ownership, contracts, runtime paths, resources, failures, and lifecycle.

The project owner directed that a system-wide sanity check begin by defining exact scope and breaking the task into manageable branches small enough for one reviewer to dedicate full attention to every material detail. Every material code block must then receive the full range of critical questions needed to keep implementation aligned with accepted specifications and the project’s LEGO, SOLID, CUPID, universality, foundation, and simplicity principles.

## Source adaptation

The UMCGS doctrine adapts the mature sanity-check method from Ars Thaumaturgica, including:

- `iteathen/Ars-Thaumaturgica` commit `4a6f8b51bf0ccc9ffc1aca7bcf39df20613018a8`;
- `docs/foundation/scalable-sanity-checking.md`;
- `docs/foundation/multi-scale-synthesis.md`;
- `docs/foundation/validation-and-accountability.md`;
- `.agents/code-block-interrogation.md`;
- the associated sanity and semantic-review templates and auditor guidance.

UMCGS adds explicit design-principle, universal-framework, device-closure, finite-memory, graph/search, evaluator/numeric, schema/JIT/ABI, generated-specialization, and search-quality lenses. The adapted files in this repository are authoritative; Ars Thaumaturgica is provenance, not a runtime dependency.

## Decision

UMCGS adopts proportional coverage-accounted system-wide sanity checking.

Every declared sanity check must:

1. freeze an exact revision or artifact and declare a `full`, `bounded`, or `sampled` claim;
2. distinguish implementation self-sanity from independent review or audit;
3. declare included and excluded surfaces, authority, environments, external state, material risks, and access limits;
4. build a complete semantic coverage map by ownership and integration rather than arbitrary file count;
5. split that map into review branches small enough for one focused session and full attention to every material semantic unit;
6. treat a review branch as a semantic coverage packet, not automatically a Git branch;
7. account for every surface included in the claim;
8. assign `core`, `triggered_modules`, or `exhaustive` depth according to risk;
9. interrogate every material semantic unit through the mandatory core and every objectively triggered module;
10. explicitly reconcile each unit with accepted specifications and LEGO, SOLID, CUPID, domain-appropriate foundation, maximum-accurate-generality, specialization, and total-system simplicity principles;
11. reconcile component boundaries, producer/consumer contracts, end-to-end paths, cross-cutting concerns, lifecycle, contradictions, and invalidated evidence;
12. give every actionable independent finding a durable disposition with exact mechanism, consequence, owner, and required revalidation;
13. disclose checks not run, access limits, uncertainty, and claim limits;
14. intentionally dispose of material review-created state.

A full claim means complete coverage accounting at risk-justified depth. It does not require identical exhaustive questioning of every low-risk leaf. A sampled review may not be called full or system-wide.

Tests, static analysis, sanitizers, profilers, benchmarks, and artifact inspection are evidence sources; they do not replace semantic and integration reasoning.

Independent sanity and audit branches do not quietly repair findings. Self-sanity may repair authorized in-scope defects, but affected coverage branches, boundaries, and paths must be invalidated and rerun against the final revision.

## Review branch model

A review branch is an owner, boundary, path, cross-cutting, or artifact coverage packet.

A leaf branch is valid only when one reviewer can retain, without sampling or skimming, its purpose, authority, owner, complete material semantic-unit inventory, callers/dependencies, state/identity/lifetime, contracts, resources, failures, applicable design principles, evidence, and consequence horizon in one focused session.

A branch must be split when it has multiple primary semantic owners, mixes unrelated contracts or paths, requires material units to be deferred or sampled, contains incompatible dominant risk modules, prevents findings from being localized, or exceeds active-context capacity for both mechanism and wider consequence.

Branch size is not line count. Short concurrency, allocator, migration, ABI, or publication protocols can require dedicated critical branches. Large low-risk declarative surfaces may share a branch when one owner, contract, risk class, and evidence set govern them.

Parent branches may organize the coverage map; detailed review occurs in leaf branches. System-wide confidence is produced only after central boundary, path, lifecycle, design, contradiction, and finding reconciliation.

## Semantic-unit standard

A “code block” means the smallest semantic unit preserving one operation’s purpose, authority, owner, inputs, outputs, state effects, callers, dependencies, resources, failure behavior, and terminal semantics. It may be a function, kernel, state transition, schema rule, queue protocol, allocator operation, migration step, generated template, or tightly coupled cluster.

Every material unit answers the mandatory core in `SEMANTIC_INTERROGATION.md`, including:

- purpose and governing specification;
- owner, layer, and LEGO boundary;
- inputs, outputs, effects, callers, and dependencies;
- state, identity, lifetime, and publication;
- contract meaning, units, ranges, precision, versions, memory spaces, and capacities;
- LEGO/SOLID/CUPID, universality, accurate-generality, and total-system simplicity alignment;
- ordering, resources, pressure, failure, cancellation, cleanup, and terminal behavior;
- the simplest credible counterexample;
- the cheapest decisive evidence;
- wider consequence horizon, second intended consumer, and scale effects.

Triggered modules add domain-specific depth; they do not replace the core.

## Administrative policy

The sanity process is proportional:

- routine self-sanity may be recorded in the PR or task result;
- one canonical record is used only for full, long-running bounded, multi-agent, incident, release, audit, or cross-session work;
- review branches normally remain sections or linked packets inside that record;
- one issue, document, or Git branch per function is prohibited;
- low-risk units may be grouped only when common ownership, contract, risk, evidence, and branch-size validity remain true;
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

- Agents must state scope, exact target, and claim type before broad review work.
- Broad subjects are partitioned before detailed inspection into focused semantic branches.
- Every material unit is checked directly against authority, specifications, design principles, foundations, resources, failure behavior, counterexamples, and decisive evidence.
- Critical units receive deep triggered review without forcing exhaustive review of unrelated low-risk units.
- Passing leaf branches cannot substitute for integrated boundary and lifecycle reconciliation.
- UMCGS-specific GPU, resource, graph, evaluator, generated/JIT, and device-closure risks are explicit.
- Findings become durable and independently reviewable rather than disappearing inside quiet repairs.
- Parallel review can scale through one frozen revision and non-overlapping branches without confusing leaf completion with system coherence.
- Administrative work is constrained to records that protect a real claim, finding, continuation, or decision.

## Alternatives considered

### One monolithic whole-repository review

Rejected. Active context and attention degrade before every material unit and consequence can be examined carefully.

### Split strictly by file or line count

Rejected. Files and lines do not reliably match semantic ownership or consequence. Branches are sized by coherent mechanism and reviewer attention.

### Treat passing tests as sanity

Rejected. Tests observe selected cases and can share the same wrong assumptions as implementation or omit ownership, specification, integration, resource, and lifecycle failures.

### Require exhaustive review of every function

Rejected. Uniform depth wastes review attention and creates questionnaire noise. Coverage must be complete; depth must be risk-based. The mandatory core still applies to every material unit.

### Use random sampling for repository-wide confidence

Rejected as a full-claim method. Sampling remains valid only when the final claim is explicitly sampled.

### Treat passing leaf branches as complete system proof

Rejected. Producer/consumer mismatches, end-to-end failure, resource transfer, lifecycle, and cross-cutting violations can exist between individually plausible leaves.

### Allow the auditor to fix findings immediately

Rejected for independent reviews because it destroys a stable reviewed subject and can hide the original failure. Separate remediation preserves trust. Self-sanity retains a bounded repair path with affected revalidation.

### Maintain permanent per-file review ledgers

Rejected as administrative overhead without proportional decision value.

## Validation

A conforming full or bounded system sanity check must show:

- frozen target and explicit claim type;
- complete coverage map with justified exclusions;
- branch types, stable IDs, primary owners, dependencies, and branch-size rationale;
- evidence that each leaf fits one focused session without sampling or skimming;
- complete semantic-unit inventory per leaf;
- mandatory core and all triggered modules for every material unit;
- explicit specification and design-principle reconciliation;
- component, producer/consumer, end-to-end, cross-cutting, lifecycle, and artifact reconciliation;
- exact findings, durable dispositions, invalidation, and required revalidation;
- review-created state disposition;
- checks not run and final claim limits.

Agent routing, validation policy, review guidance, templates, issue forms, documentation indexes, and governance checks must link to the doctrine. Automated tools may assist inventory and evidence capture but cannot manufacture a broader claim than observed coverage.

## Revisit triggers

Revisit when branch accounting creates repeated low-value paperwork, branch sizing still permits detail loss, reviewers miss important design/spec violations, integration defects escape despite passing leaves, or reliable automation changes the cheapest decisive evidence. Changes require a superseding ADR rather than silent weakening of coverage, branch-size, semantic-interrogation, or finding standards.
