# Canonical Agent Operating Manual

**Scope:** All research, specification, implementation, sanity checking, pull-request review, merge, debugging, documentation, and publication work in UMCGS.

## Mission

Produce trustworthy, reusable engineering progress without allowing the first domain, first model, first GPU, first implementation shortcut, early repository size, unjustified review claim, or stale PR approval to become an accidental permanent constraint.

## Required orientation

1. Read the root `AGENTS.md`, `AI_RULES.md`, `DESIGN_ALIGNMENT_CARD.md`, and `general_foundation/PRINCIPLES.md`.
2. Identify the task class and assessment depth: routine, substantial, or critical.
3. For substantial or critical work, read `general_foundation/ASSESSMENT_AND_PLANNING.md` and complete assessment before planning.
4. For requested sanity, audit, whole-project review, incident, or release-readiness work, read `general_foundation/SANITY_CHECKING.md` and `general_foundation/SEMANTIC_INTERROGATION.md` before deep inspection.
5. For PR readiness, review, approval, or merge work, read `general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md` before acting.
6. Use `SYSTEM_REGISTRY.md` to identify the owning boundary and authoritative documents.
7. For any new or moved artifact, read `general_foundation/PROJECT_ORGANIZATION.md` and `application_specific/REPOSITORY_ORGANIZATION.md`.
8. For component, contract, dependency, foundational type/schema, compatibility, or reusable-name work, load the triggered detailed doctrine linked from `general_foundation/PRINCIPLES.md`.
9. Inspect repository state and unrelated work before editing.
10. Establish purpose, expected ranges, invariants, resource limits, lifecycle, failures, organizational home, dependencies, design weighting, and evidence requirements.
11. Apply the reasoning gate.

## Task routing

| Task | Required authority before acting or claiming completion |
|---|---|
| Research | Research policy, exact sources, revision, and license |
| Foundational design | Charter, ADR-0005, ADR-0006, `PRINCIPLES.md`, adversarial assessment, triggered design doctrine, prior ADRs, decision-ready alternatives |
| Component or contract design | LEGO/component/contract/composition standards, accepted owning specification, registry and manifest |
| Project organization | ADR-0004, organization guides, registry, affected component manifests |
| Normative contract | Accepted owner direction and specification scope |
| Production implementation | Accepted specification/component ownership plus an assessment disposition that permits implementation |
| Sanity check or audit | ADR-0007, frozen revision/artifact, explicit claim, complete coverage map, focused branch sizing, semantic interrogation, integrated reconciliation, and independent finding disposition where required |
| PR readiness/review | ADR-0008, exact head/base, complete changed-surface accounting, phase/risk review mode, semantic/integration evidence, discussion reconciliation, and result |
| Merge | ADR-0008, exact accepted head, correct target, current checks/reviews/protection, no blockers, deliberate merge method, expected-head guard, and post-merge verification |
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
3. define included and excluded surfaces, authority, owners, risks, access limits, environment, external state, and review-created state;
4. build the complete semantic coverage map by ownership and integration;
5. split the map into owner, boundary, path, cross-cutting, or artifact review branches;
6. require each leaf branch to have one primary semantic owner or coherent path, a complete semantic-unit inventory, and a sizing rationale proving one focused session can review it without sampling or skimming;
7. select `core`, `triggered_modules`, or `exhaustive` depth by risk;
8. interrogate every material unit through specifications, ownership, state/identity/lifetime, foundations, design principles, resources/pressure, failure/cleanup, counterexamples, evidence, and wider consequences;
9. reconcile component boundaries, end-to-end paths, triggered lifecycle concerns, design principles, contradictions, invalidations, review-created state, and duplicate findings;
10. durably disposition confirmed violations and high-risk uncertainties;
11. state checks not run and ensure the final claim is no broader than the evidence.

A review branch is a semantic coverage packet, not automatically a Git branch. Full coverage does not mean uniform exhaustive depth. A sampled review is never full. Passing leaf branches do not prove integrated coherence. Independent review does not quietly repair findings. Use one canonical record only when the claim needs durable continuation or coordination.

## PR review gate

Before marking a PR ready or approving it:

1. freeze the PR number, intended target, reviewed base/merge base when material, exact head SHA, and comparison range;
2. identify project phase and whether author-side, independent, or owner exact-head authorization is permitted/required;
3. inspect the complete patch, changed-file inventory, ancestry, generated/manifest/schema/dependency effects, and PR discussion;
4. verify authority, assessment, ownership, contracts, preserved behavior, and closure criteria;
5. review material semantic units and affected producer/consumer/end-to-end paths;
6. verify focused evidence and current-head checks, including checks not run and infrastructure limits;
7. classify blockers, questions, non-blocking improvements, and information precisely;
8. perform a final whole-diff integration pass;
9. state the result and exact reviewed head.

A changed head invalidates affected review. A material base change invalidates affected integration evidence. Author-side review is not independent approval.

## Merge gate

Immediately before merge:

1. confirm the PR is open, non-draft, and targets the intended branch;
2. confirm the current head exactly equals the approved/ready/authorized head;
3. recheck base/ancestry, mergeability, required reviews/checks/CODEOWNERS/protection/queue, and unresolved threads/findings;
4. confirm issue closure keywords, branch deletion, stacked/dependent work, and conflicting/superseding work are correct;
5. select squash, rebase, or merge commit for a stated historical reason;
6. use the expected-head guard where supported and abort on any changed state;
7. verify the PR is merged, the target/resulting SHA and tree are correct, issue/branch effects are accurate, and dependent work uses the integrated revision.

Never force-update the target or bypass protections to complete a merge.

## Reasoning levels

### Routine

Formatting, exact-link repair, mechanical index updates, and clearly specified local changes may proceed with ordinary reasoning after repository inspection.

### Substantial

Cross-file behavior, public interfaces, persistent formats, tests, dependency changes, component creation, file relocation, and ownership movement require an explicit plan and focused validation.

### Critical

CUDA execution, synchronization, atomics, memory layout, allocator/reclamation behavior, JIT/ABI, schema semantics, state identity, transpositions, cycles, evaluator integration, numerical contracts, hot-path optimization, repository/component boundary changes, and full system-sanity claims require high reasoning and evidence. If the agent cannot demonstrate both, it must not edit or certify the boundary.

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
10. **Sanity-check** — freeze the subject, size focused review branches, interrogate changed semantic units, and reconcile the declared system surface.
11. **Author-review when integrating** — inspect the exact complete PR head and affected integration before readiness.
12. **Independent-review when triggered** — review the frozen head without quietly repairing it.
13. **Guarded merge when integrating** — revalidate current state and integrate the exact accepted head.
14. **Post-merge verify when integrating** — confirm target SHA/tree, closure, branch, and dependent work.
15. **Reconcile** — update authority, manifests, indexes, registry, findings, and archived history.
16. **Hand off** — completed work, evidence, reviewed head/integrated SHA when applicable, claim limits, risks, and one next boundary.

If the task deliberately ends without repository integration, skip the PR/merge steps and state the verified non-integrating outcome explicitly.

Detailed procedures are in `general_foundation/WORKFLOW.md`; use `CONTEXT_ROUTING.md` to limit stale context, `PROJECT_ORGANIZATION.md` before structural changes, `SANITY_CHECKING.md` for coverage claims, `PULL_REQUEST_REVIEW_AND_MERGE.md` for integration, and `REVIEW.md` for general review standards.

## Completion definition

A task is complete only when:

- the assessment disposition permits the completed work and the strongest material objections were resolved or bounded;
- the intended owned behavior or authorized non-integrating deliverable exists;
- any triggered sanity claim names the exact revision, accounts for its declared surface at justified depth, uses focused leaf branches, interrogates every material unit, reconciles integration/lifecycle/design, and states its limits;
- actionable independent findings have durable disposition and affected evidence was revalidated;
- review-created state is intentionally disposed;
- when repository integration is part of the task, one exact PR head received phase/risk-appropriate review and all blockers/questions were resolved;
- when repository integration is part of the task, the exact accepted head was merged through a guarded transaction and the target/resulting SHA was verified;
- when repository integration is part of the task, issue closure, source-branch, dependent-work, and review-record effects are accurate;
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

Never present an inference as a measurement, a proposal as accepted, a sampled review as complete coverage, author-side review as independent approval, a stale-head approval as current, a local commit as published remote state, or a merge response as verified target integration.
