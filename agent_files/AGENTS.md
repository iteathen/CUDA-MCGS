# Canonical Agent Operating Manual

**Scope:** All research, specification, plan execution, implementation, cleanup/disposition, sanity checking, pull-request review, merge, debugging, documentation, and publication work in UMCGS.

## Mission

Produce trustworthy, reusable engineering progress without allowing the first domain, first model, first GPU, first implementation shortcut, stale plan wording, abandoned residue, early repository size, unjustified review claim, or stale PR approval to become an accidental permanent constraint.

## Required orientation

1. Read the root `AGENTS.md`, `AI_RULES.md`, `DESIGN_ALIGNMENT_CARD.md`, and `general_foundation/PRINCIPLES.md`.
2. Identify the task class and assessment depth: routine, substantial, or critical.
3. For substantial or critical work, read `general_foundation/ASSESSMENT_AND_PLANNING.md` and complete assessment before planning.
4. Before executing a material plan node, read `general_foundation/PLAN_EXECUTION.md` and prove node readiness.
5. Before creating exceptional local/remote/sensitive/retained/external state—and before acceptance, handoff, closure, or merge—read `general_foundation/CLEANUP_AND_DISPOSITION.md`.
6. For requested sanity, audit, whole-project review, incident, or release-readiness work, read `general_foundation/SANITY_CHECKING.md` and `general_foundation/SEMANTIC_INTERROGATION.md` before deep inspection.
7. For PR readiness, review, approval, or merge work, read `general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md` before acting.
8. Use `SYSTEM_REGISTRY.md` to identify the owning boundary and authoritative documents.
9. For any new or moved artifact, read `general_foundation/PROJECT_ORGANIZATION.md` and `application_specific/REPOSITORY_ORGANIZATION.md`.
10. For component, contract, dependency, foundational type/schema, compatibility, or reusable-name work, load the triggered detailed doctrine linked from `general_foundation/PRINCIPLES.md`.
11. Inspect repository state and unrelated work before editing.
12. Establish purpose, expected ranges, invariants, resource limits, lifecycle, failures, organizational home, dependencies, design weighting, cleanup lifecycle, and evidence requirements.
13. Apply the reasoning, plan-execution, and cleanup gates.

## Task routing

| Task | Required authority before acting or claiming completion |
|---|---|
| Research | Research policy, exact sources, revision, license, evidence-retention and donor-artifact disposition |
| Foundational design | Charter, ADR-0005, ADR-0006, `PRINCIPLES.md`, adversarial assessment, triggered design doctrine, prior ADRs, decision-ready alternatives |
| Component or contract design | LEGO/component/contract/composition standards, accepted owning specification, registry and manifest |
| Project organization | ADR-0004, organization guides, registry, affected component manifests, archive/supersession plan |
| Normative contract | Accepted owner direction and specification scope |
| Plan execution | ADR-0009, current plan version/node, readiness evidence, expected effects, falsifier, rollback/safe stop, cleanup obligations, and triggered doctrine |
| Production implementation | Accepted specification/component ownership, an assessment disposition that permits implementation, and a dependency-ready governed plan node |
| Cleanup/disposition | ADR-0010, protected state, exact cleanup inventory, dispositions, destructive safeguards, dependency order, verification, and bounded debt if required |
| Sanity check or audit | ADR-0007, frozen revision/artifact, explicit claim, complete coverage map, focused branch sizing, semantic interrogation, integrated reconciliation, and independent finding disposition where required |
| PR readiness/review | ADR-0008, exact head/base, complete changed-surface accounting, phase/risk review mode, semantic/integration/cleanup evidence, discussion reconciliation, and result |
| Merge | ADR-0008 and ADR-0010, exact accepted head, correct target, current checks/reviews/protection, no blockers, deliberate merge method, expected-head guard, post-merge verification, and branch/resource disposition |
| Disposable experiment | Named question, disposal criteria, isolated experiment location, non-production label, and prototype/evidence cleanup plan |
| Debugging | Expected behavior, reproducible symptom, trustworthy state, diagnostic retention/removal |
| Performance work | Reproducible benchmark/profiler evidence and instrumentation/artifact cleanup |
| Migration | Source/target authority, compatibility, rollback, cleanup of partial/obsolete state, and organizational placement plan |
| Publication | Clean scope, validation evidence, inspected diff, remote verification, post-publication cleanup |

## Organization gate

Before creating a production file, directory, package, component, generated artifact, or new top-level area, answer:

1. Which product area owns it?
2. Which component owns its lifecycle?
3. Is it public contract, internal implementation, generated output, test, benchmark, documentation, tool, experiment, or third-party material?
4. What may depend on it, and through which public surface?
5. Does the component already have a manifest, README, registry entry, and validation boundary?
6. Does placement remain valid when the project grows by an order of magnitude?
7. What creates, supersedes, archives, or removes it, and how is that state verified?

If the answers are missing, establish organization and lifecycle in the same change before adding implementation.

Large-project organization does **not** mean inventing runtime layers, microservices, or separate repositories without need. It means stable hierarchy, ownership, dependency direction, discoverability, and disposition from the first implementation.

## Assessment gate

Before planning substantial or critical implementation:

1. frame the required outcome, authority, evidence, scope, assumptions, cost of doing nothing, and cleanup consequences;
2. answer every applicable core question in `general_foundation/ASSESSMENT_AND_PLANNING.md`;
3. have a strong adversary attack the problem framing, owner, boundaries, generality, ranges, resources, failures, alternatives, simplicity, validation, cleanup, and process cost;
4. integrate valid criticism rather than defending the original wording;
5. assign remaining unknowns to evidence, experiment, assumption, blocker, cleanup debt, or revisit trigger;
6. choose a disposition: proceed, experiment, research, revise, reject, or blocked;
7. plan only after the disposition permits it.

The durable record should contain integrated answers and the strongest remaining objections, not a performative transcript. Use one combined assessment/plan by default and avoid duplicate administrative ledgers.

## Plan execution gate

Before executing a material node:

1. identify the current plan record/version/node, owner, branch/environment, and frozen revision;
2. prove dependencies, expected dependency outputs, authority, accepted specifications, repository state, environment, tools, generated inputs, and test/runtime trust;
3. state the owned outcome, scope, non-goals, expected effects, outputs, acceptance, cheapest falsifier, rollback/recovery, cleanup obligations, and stop conditions;
4. scan for triggered component, contract, naming, foundation, persistence, security, concurrency, memory, graph/search, evaluator, performance, generated/JIT/ABI, cleanup, sanity, packaging, and release doctrine;
5. prepare only the checkpoints, gates, fixtures, generated inputs, bounded instrumentation, and cleanup inventory needed to execute safely;
6. apply one coherent ownership-sized operation;
7. inspect exact actual effects immediately, compare expected and actual, register created/modified/obsolete state, run the focused falsifier, and reconcile material consequences;
8. classify each operation as continue, accept, pause, revise, rollback, fail, or supersede;
9. treat a change to cause, owner, authority, public contract, schema, ABI, consequence horizon, resource model, risk, acceptance, rollback, output, downstream ordering, or cleanup disposition as a material deviation requiring plan revision;
10. leave no invalid partial state, competing authority, stale generated form, abandoned resource, unowned residue, or downstream node with false preconditions.

A plan is not authority. A node listed in a plan is not automatically ready. Routine reversible single-session execution does not need separate execution or cleanup records; use them only when another session, agent, operator, coordinated group, invalid intermediate state, external/sensitive resource, or high-consequence gate consumes their unique evidence.

## Cleanup gate

Before accepting, handing off, closing, merging, releasing, pausing, failing, rolling back, superseding, or abandoning work:

1. identify every material task-created, temporarily modified, superseded, partial, generated, diagnostic, local, remote, external, sensitive, and coordination item;
2. distinguish protected user/pre-existing/shared/authority/evidence/recovery state;
3. assign one explicit disposition: remove, restore, retain authority, retain bounded evidence, retain recovery, archive, quarantine, transfer, supersede, retain temporarily with owner/trigger, or protect unchanged;
4. order cleanup by dependencies and preserve evidence/rollback until their boundaries pass;
5. use narrow exact targets, previews, recovery where required, and owning-system verification;
6. reconcile repository files, local files/folders, branches, worktrees, stashes, interrupted Git state, remote branches/refs, PRs/issues/reviews/claims, workflow/release/package artifacts, processes/ports/containers/locks, GPU contexts/allocations, credentials/permissions, persistence/backups, generated output, and external/paid resources;
7. archive historically useful stale material with provenance instead of silently deleting it;
8. rotate/revoke exposed credentials—deletion alone is insufficient;
9. create cleanup debt only when immediate cleanup is less safe than bounded retained state;
10. block completion when residue can corrupt behavior, expose data, incur uncontrolled cost, mislead authority, defeat recovery, contaminate later work, or interfere with another workstream.

Do not use broad recursive deletion, hard reset/clean, force-push, branch deletion, PR/issue closure, review resolution, evidence deletion, or remote resource removal for cosmetic cleanliness. A successful command is not verification.

## Design gate

Before accepting a component or public contract, establish:

1. exact domain truth, purpose, operating bounds, and concern weighting;
2. one coherent owner of state, lifecycle, rules, and eventual disposition;
3. LEGO public ports, injected dependencies, adapters, and non-responsibilities;
4. SOLID internal responsibility boundaries without ceremonial decomposition;
5. CUPID implementation qualities;
6. domain-appropriate ranges, precision, capacities, identities, and failure behavior;
7. maximum-accurate-generality tests for reusable concepts and names;
8. compatibility/evolution and archive/supersession placement;
9. total-system simplicity, including complexity moved elsewhere;
10. decisive validation, cleanup, and revisit triggers.

Use `templates/design-review.template.md` for foundational or contested designs.

## Sanity gate

Before making a sanity claim:

1. freeze the exact revision, generated-engine identity, model/schema version, or immutable artifact;
2. declare `full`, `bounded`, or `sampled`, and distinguish self-sanity from independent review;
3. define included/excluded surfaces, authority, owners, risks, access limits, environment, external state, and review-created state;
4. build the complete semantic coverage map by ownership and integration;
5. split the map into owner, boundary, path, cross-cutting, or artifact review branches;
6. require each leaf branch to have one primary semantic owner or coherent path, a complete semantic-unit inventory, and a sizing rationale proving one focused session can review it without sampling or skimming;
7. select `core`, `triggered_modules`, or `exhaustive` depth by risk;
8. interrogate every material unit through specifications, ownership, state/identity/lifetime, foundations, design principles, resources/pressure, failure/cleanup, counterexamples, evidence, and wider consequences;
9. reconcile component boundaries, end-to-end paths, triggered lifecycle concerns, design principles, cleanup/disposition, contradictions, invalidations, review-created state, and duplicate findings;
10. durably disposition confirmed violations and high-risk uncertainties;
11. state checks not run and ensure the final claim is no broader than the evidence.

A review branch is a semantic coverage packet, not automatically a Git branch. Full coverage does not mean uniform exhaustive depth. A sampled review is never full. Passing leaf branches do not prove integrated coherence. Independent review does not quietly repair findings. Use one canonical record only when the claim needs durable continuation or coordination.

## PR review gate

Before marking a PR ready or approving it:

1. freeze the PR number, intended target, reviewed base/merge base when material, exact head SHA, and comparison range;
2. identify project phase and whether author-side, independent, or owner exact-head authorization is permitted/required;
3. inspect the complete patch, changed-file inventory, ancestry, generated/manifest/schema/dependency effects, cleanup obligations, and PR discussion;
4. verify authority, assessment, plan-execution fidelity, ownership, contracts, preserved behavior, cleanup state, and closure criteria;
5. review material semantic units and affected producer/consumer/end-to-end paths;
6. verify focused evidence and current-head checks, including checks not run and infrastructure limits;
7. classify blockers, questions, cleanup debt, non-blocking improvements, and information precisely;
8. perform a final whole-diff and disposition pass;
9. state the result and exact reviewed head.

A changed head invalidates affected review. A material base change invalidates affected integration and cleanup evidence. Author-side review is not independent approval.

## Merge gate

Immediately before merge:

1. confirm the PR is open, non-draft, and targets the intended branch;
2. confirm the current head exactly equals the approved/ready/authorized head;
3. recheck base/ancestry, mergeability, required reviews/checks/CODEOWNERS/protection/queue, and unresolved threads/findings;
4. confirm issue closure keywords, local/remote branch and worktree disposition, stacked/dependent work, cleanup debt, and conflicting/superseding work are correct;
5. select squash, rebase, or merge commit for a stated historical reason;
6. use the expected-head guard where supported and abort on any changed state;
7. verify the PR is merged, target/resulting SHA and tree are correct, issue/branch effects are accurate, dependents use the integrated revision, and post-merge cleanup is completed or safely tracked.

Never force-update the target or bypass protections to complete a merge.

## Reasoning levels

### Routine

Formatting, exact-link repair, mechanical index updates, ordinary task-owned scratch cleanup, and clearly specified local changes may proceed with ordinary reasoning after repository inspection.

### Substantial

Cross-file behavior, public interfaces, persistent formats, tests, dependency changes, component creation, file relocation, ownership movement, cross-session plan execution, shared/external cleanup, and remote branch/PR disposition require an explicit plan and focused validation.

### Critical

CUDA execution, synchronization, atomics, memory layout, allocator/reclamation behavior, JIT/ABI, schema semantics, state identity, transpositions, cycles, evaluator integration, numerical contracts, hot-path optimization, repository/component boundary changes, coordinated invalid-intermediate-state execution, destructive cleanup of protected/sensitive/recovery state, and full system-sanity claims require high reasoning and evidence. If the agent cannot demonstrate both, it must not edit, delete, or certify the boundary.

## Core execution loop

1. **Orient** — authority, state, scope, organization, prior work.
2. **Assess** — outcome, evidence, ownership, bounds, alternatives, resources, failures, cleanup, and assumptions.
3. **Adversarially challenge** — attack every material answer and integrate valid criticism.
4. **Research** — inspect prior art, platform constraints, and decisive unknowns.
5. **Design** — apply LEGO → SOLID → CUPID and prove total-system sufficiency.
6. **Specify** — settle foundational behavior before production code.
7. **Plan** — one coherent dependency-ordered change with explicit cleanup/disposition.
8. **Execute** — prove node readiness; state expected effects/falsifier/cleanup; apply one coherent operation; inspect, falsify, reconcile, and classify.
9. **Validate** — structure checks, focused checks, integration, failure paths, cleanup verification, complete relevant suite.
10. **Sanity-check** — freeze the subject, size focused review branches, interrogate changed semantic units, and reconcile the declared system and cleanup surface.
11. **Author-review when integrating** — inspect exact complete PR head, plan-execution fidelity, cleanup, and affected integration before readiness.
12. **Independent-review when triggered** — review the frozen head without quietly repairing it.
13. **Guarded merge when integrating** — revalidate current state and integrate the exact accepted head.
14. **Post-merge verify and clean when integrating** — confirm target SHA/tree, closure, branches/worktrees, dependents, artifacts, permissions, and resources.
15. **Reconcile** — update authority, plan/execution/cleanup state, manifests, indexes, registry, findings, and archived history.
16. **Hand off** — completed work, evidence, partial/retained state, reviewed head/integrated SHA when applicable, cleanup debt, claim limits, risks, and one next boundary.

If the task deliberately ends without repository integration, skip the PR/merge steps and state the verified non-integrating and cleanup outcome explicitly.

Detailed procedures are in `general_foundation/WORKFLOW.md`; use `PLAN_EXECUTION.md` for material node execution, `CLEANUP_AND_DISPOSITION.md` for lifecycle/disposition, `CONTEXT_ROUTING.md` to limit stale context, `PROJECT_ORGANIZATION.md` before structural changes, `SANITY_CHECKING.md` for coverage claims, `PULL_REQUEST_REVIEW_AND_MERGE.md` for integration, and `REVIEW.md` for general review standards.

## Completion definition

A task is complete only when:

- the assessment disposition permits the work and the strongest material objections were resolved or bounded;
- every executed node was dependency-ready under the current plan version and authority;
- expected and actual effects, variations, deviations, validation, and downstream outputs are reconciled;
- the intended owned behavior or authorized non-integrating deliverable exists;
- no invalid partial state, competing authority, stale generated artifact, abandoned resource, unowned residue, or false downstream precondition remains;
- every material local/remote/external/sensitive/generated/coordination item has an explicit verified disposition;
- protected user/shared/authority/evidence/recovery state remains intact;
- retained temporary state and cleanup debt are safe, bounded, owned, visible, and objectively triggered for later disposition;
- any triggered sanity claim names the exact revision, accounts for its declared surface at justified depth, uses focused leaf branches, interrogates every material unit, reconciles integration/lifecycle/design/cleanup, and states its limits;
- actionable independent findings have durable disposition and affected evidence was revalidated;
- execution-created and review-created state is intentionally disposed;
- when repository integration is part of the task, one exact PR head received phase/risk-appropriate review and all blockers/questions were resolved;
- when repository integration is part of the task, the exact accepted head was merged through a guarded transaction and the target/resulting SHA was verified;
- when repository integration is part of the task, issue closure, source/local/remote branch, worktree, dependent-work, cleanup, and review-record effects are accurate;
- the artifact is in the correct durable product area and component;
- public/internal boundaries and dependencies are explicit;
- the design follows the accepted hierarchy and names the owned invariant at the correct scale;
- complexity allegedly removed has not merely been exported to consumers or lifecycle;
- applicable invariants and failure behavior are verified;
- no test, gate, protection, cleanup safeguard, or evidence requirement was weakened to obtain success;
- authoritative documentation, plan state, cleanup state, component manifests, registry entries, and downstream nodes agree with the result;
- superseded material is archived or handled with provenance;
- repository, remote, process, device, credential, artifact, and external-resource state is intentional and reported accurately;
- unresolved work is explicit in `next_step.yaml` or a cleanup-debt issue rather than hidden in prose.

## Source and claim discipline

Every important statement should be identifiable as one of:

- owner requirement;
- accepted specification or decision;
- verified observed behavior;
- inference from cited evidence;
- proposal;
- unresolved assumption.

Never present a plan as authority, a cleanup command as verified disposition, an inference as a measurement, a proposal as accepted, a sampled review as complete coverage, author-side review as independent approval, a stale-head approval as current, a local commit as published remote state, or a merge response as verified target integration and cleanup.
