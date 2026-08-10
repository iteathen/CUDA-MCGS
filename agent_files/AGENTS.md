# Canonical Agent Operating Manual

**Scope:** All research, specification, implementation, sanity checking, review, debugging, documentation, and publication work in UMCGS.

## Mission

Produce trustworthy, reusable engineering progress without allowing the first domain, first model, first GPU, first implementation shortcut, early repository size, or an unjustified review claim to become an accidental permanent constraint.

## Required orientation

1. Read the root `AGENTS.md`, `AI_RULES.md`, `DESIGN_ALIGNMENT_CARD.md`, and `general_foundation/PRINCIPLES.md`.
2. Identify the task class and assessment depth: routine, substantial, or critical.
3. For substantial or critical work, read `general_foundation/ASSESSMENT_AND_PLANNING.md` and complete assessment before planning.
4. For requested sanity, audit, whole-project review, incident, or release-readiness work, read `general_foundation/SANITY_CHECKING.md` and `general_foundation/SEMANTIC_INTERROGATION.md` before deep inspection.
5. Use `SYSTEM_REGISTRY.md` to identify the owning boundary and authoritative documents.
6. For any new or moved artifact, read `general_foundation/PROJECT_ORGANIZATION.md` and `application_specific/REPOSITORY_ORGANIZATION.md`.
7. For component, contract, dependency, foundational type/schema, compatibility, or reusable-name work, load the triggered detailed doctrine linked from `general_foundation/PRINCIPLES.md`.
8. Inspect repository state and unrelated work before editing.
9. Establish purpose, expected ranges, invariants, resource limits, lifecycle, failures, organizational home, dependencies, design weighting, and evidence requirements.
10. Apply the reasoning gate.

## Task routing

| Task | Required authority before editing |
|---|---|
| Research | Research policy, exact sources, revision, and license |
| Foundational design | Charter, ADR-0005, ADR-0006, `PRINCIPLES.md`, adversarial assessment, triggered design doctrine, prior ADRs, decision-ready alternatives |
| Component or contract design | LEGO/component/contract/composition standards, accepted owning specification, registry and manifest |
| Project organization | ADR-0004, organization guides, registry, affected component manifests |
| Normative contract | Accepted owner direction and specification scope |
| Production implementation | Accepted specification/component ownership plus an assessment disposition that permits implementation |
| Sanity check or audit | ADR-0007, frozen revision/artifact, explicit claim, semantic coverage map, risk-depth rules, and independent finding disposition where required |
| Disposable experiment | Named question, disposal criteria, isolated experiment location, non-production label |
| Debugging | Expected behavior, reproducible symptom, trustworthy state |
| Performance work | Reproducible benchmark and profiler evidence |
| Migration | Source/target authority, compatibility, rollback, and organizational placement plan |
| Publication | Clean scope, validation evidence, inspected diff, remote verification |

## Organization gate

Before creating a production file, directory, package, component, generated artifact, or new top-level area, answer:

1. Which product area owns it?
2. Which component owns its lifecycle?
3. Is it public contract, internal implementation, generated output, test, benchmark, documentation, tool, experiment, or third-party material?
4. What may depend on it, and through which public surface?
5. Does the component already have a manifest, README, registry entry, and validation boundary?
6. Does placement remain valid when the project grows by an order of magnitude?

If the answers are missing, establish the organization in the same change before adding implementation.

Large-project organization does **not** mean inventing runtime layers, microservices, or separate repositories without need. It means stable hierarchy, ownership, dependency direction, and discoverability from the first implementation.

## Assessment gate

Before planning substantial or critical implementation:

1. frame the required outcome, authority, evidence, scope, assumptions, and cost of doing nothing;
2. answer every applicable core question in `general_foundation/ASSESSMENT_AND_PLANNING.md`;
3. have a strong adversary attack the problem framing, owner, boundaries, generality, ranges, resources, failures, alternatives, simplicity, validation, and process cost;
4. integrate valid criticism rather than defending the original wording;
5. assign remaining unknowns to evidence, experiment, assumption, blocker, or revisit trigger;
6. choose a disposition: proceed, experiment, research, revise, reject, or blocked;
7. plan only after the disposition permits it.

The durable record should contain integrated answers and the strongest remaining objections, not a performative transcript. Use one combined assessment/plan by default and avoid duplicate administrative ledgers.

## Design gate

Before accepting a component or public contract, establish:

1. exact domain truth, purpose, operating bounds, and concern weighting;
2. one coherent owner of state, lifecycle, and rules;
3. LEGO public ports, injected dependencies, adapters, and non-responsibilities;
4. SOLID internal responsibility boundaries without ceremonial decomposition;
5. CUPID implementation qualities;
6. domain-appropriate ranges, precision, capacities, identities, and failure behavior;
7. maximum-accurate-generality tests for reusable concepts and names;
8. compatibility/evolution placement;
9. total-system simplicity, including complexity moved elsewhere;
10. decisive validation and revisit triggers.

Use `templates/design-review.template.md` for foundational or contested designs.

## Sanity gate

Before making a sanity claim:

1. freeze the exact revision, generated-engine identity, model/schema version, or immutable artifact;
2. declare `full`, `bounded`, or `sampled`, and distinguish self-sanity from independent review;
3. define included and excluded surfaces, authority, owners, risks, access limits, and review-created state;
4. build coverage nodes by semantic ownership and integration;
5. select `core`, `triggered_modules`, or `exhaustive` depth by risk;
6. interrogate every material semantic leaf using `general_foundation/SEMANTIC_INTERROGATION.md`;
7. reconcile component boundaries, end-to-end paths, triggered lifecycle concerns, contradictions, invalidations, and duplicate findings;
8. durably disposition confirmed violations and high-risk uncertainties;
9. state checks not run and ensure the final claim is no broader than the evidence.

Full coverage does not mean uniform exhaustive depth. A sampled review is never full. Independent review does not quietly repair findings. Use one canonical record only when the claim needs durable continuation or coordination.

## Reasoning levels

### Routine

Formatting, exact-link repair, mechanical index updates, and clearly specified local changes may proceed with ordinary reasoning after repository inspection.

### Substantial

Cross-file behavior, public interfaces, persistent formats, tests, dependency changes, component creation, file relocation, and ownership movement require an explicit plan and focused validation.

### Critical

CUDA execution, synchronization, atomics, memory layout, allocator/reclamation behavior, JIT/ABI, schema semantics, state identity, transpositions, cycles, evaluator integration, numerical contracts, hot-path optimization, and repository/component boundary changes require high reasoning and evidence. If the agent cannot demonstrate both, it must not edit the boundary.

## Core execution loop

1. **Orient** — authority, state, scope, organization, prior work.
2. **Assess** — outcome, evidence, ownership, bounds, alternatives, resources, failures, and assumptions.
3. **Adversarially challenge** — attack every material answer and integrate valid criticism.
4. **Research** — inspect prior art, platform constraints, and decisive unknowns.
5. **Design** — apply LEGO → SOLID → CUPID and prove total-system sufficiency.
6. **Specify** — settle foundational behavior before production code.
7. **Plan** — one coherent change derived from the accepted assessment.
8. **Implement** — preserve ownership, public surfaces, and dependency direction.
9. **Validate** — structure checks, focused checks, integration, failure paths, complete relevant suite.
10. **Sanity-check** — interrogate changed semantic units and reconcile the declared review surface at proportional depth.
11. **Reconcile** — update authority, manifests, indexes, registry, findings, and archived history.
12. **Publish** — inspect status/diff, commit coherently, record exact state.
13. **Hand off** — completed work, evidence, claim limits, risks, and one next boundary.

Detailed procedures are in `general_foundation/WORKFLOW.md`; use `CONTEXT_ROUTING.md` to limit stale context, `PROJECT_ORGANIZATION.md` before structural changes, `SANITY_CHECKING.md` for coverage claims, and `REVIEW.md` before publication.

## Completion definition

A task is complete only when:

- the assessment disposition permits the completed work and the strongest material objections were resolved or bounded;
- the intended owned behavior exists;
- any triggered sanity claim names the exact revision, accounts for its declared surface at justified depth, and states its limits;
- actionable independent findings have durable disposition;
- the artifact is in the correct durable product area and component;
- public/internal boundaries and dependencies are explicit;
- the design follows the accepted hierarchy and names the owned invariant at the correct scale;
- complexity allegedly removed has not merely been exported to consumers or lifecycle;
- applicable invariants and failure behavior are verified;
- no test or gate was weakened to obtain success;
- authoritative documentation, component manifests, and registry entries agree with the result;
- superseded material is handled with provenance;
- repository state is intentional and reported accurately;
- unresolved work is explicit in `next_step.yaml` rather than hidden in prose.

## Source and claim discipline

Every important statement should be identifiable as one of:

- owner requirement;
- accepted specification or decision;
- verified observed behavior;
- inference from cited evidence;
- proposal;
- unresolved assumption.

Never present an inference as a measurement, a proposal as accepted, a sampled review as complete coverage, a local commit as published remote state, or temporary placement as the permanent organizational design.
