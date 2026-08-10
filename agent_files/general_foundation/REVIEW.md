# Review Standard

**Scope:** Reusable foundation for engineering-decision review, design review, focus-branch review, test/repair-loop review, plan-execution review, cleanup/disposition review, change review, sanity claims, and pull-request review.

Review the complete owned change, its engineering contract and path selection, decomposition, test evidence, execution fidelity, actual effects, integration, and the state it leaves behind—not isolated lines or a raw green count.

Ordinary change/PR review, engineering-decision review, focus-branch integration, testing, cleanup verification, a declared sanity/audit claim, and merge authorization are related but distinct:

- engineering-decision review follows [`ENGINEERING_JUDGMENT.md`](ENGINEERING_JUDGMENT.md) and [`CONTEXTUAL_DESIGN_WEIGHTING.md`](CONTEXTUAL_DESIGN_WEIGHTING.md);
- focus-branch review follows [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md);
- testing and repair-loop review follows [`TESTING.md`](TESTING.md) and [`DEBUGGING.md`](DEBUGGING.md);
- cleanup review follows [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md);
- a full sanity claim additionally follows [`SANITY_CHECKING.md`](SANITY_CHECKING.md);
- PR review and merge follow [`PULL_REQUEST_REVIEW_AND_MERGE.md`](PULL_REQUEST_REVIEW_AND_MERGE.md).

## Authority and scope

- Owner intent and accepted authority are satisfied.
- Proposals, archives, implementation code, comments, examples, and existing tests were not treated as automatic authority.
- Parent task, engineering decision, branches, plan, tests, and cleanup did not override accepted doctrine, ADRs, specifications, contracts, schemas, manifests, or protections.
- One source of truth remains for every changed behavior, shared contract, engineering decision, and test oracle.
- No unrelated cleanup, branch work, test expansion, value reordering, or ownership movement entered the change.
- Protected user/pre-existing/shared/authority/evidence/recovery state remains intact.

## Engineering contract and specification alignment

For every material decision or implementation:

- the required outcome, consumer, cost of no change, operating envelope, non-goals, and completion evidence are explicit;
- accepted owner instruction, ADRs, specifications, contracts, standards, and external compatibility promises are identified at exact revisions;
- every material obligation is normalized and mapped to source/clause, normative strength, decision role, authoritative owner, implementation/design mechanism, failure consequence, and evidence/test capsule;
- derived requirements show why they are necessary to satisfy accepted authority and do not silently expand the project boundary;
- ambiguity, conflict, gap, stale authority, unimplementable obligation, and oracle mismatch are explicitly dispositioned;
- missing or contradictory authority was routed to the correct owner rather than resolved silently in code or tests;
- actual behavior and evidence are compared with obligations, not merely with the implementation plan;
- shared specification changes invalidate dependent branches, decisions, generated artifacts, tests, caches, and review evidence.

Reject a change whose specification alignment is merely asserted without traceability or whose tests prove an easier contract than the accepted one.

## Engineering reasoning, values, and path selection

Review that:

- hard gates, mission objectives, supporting qualities, and process costs/tie-breakers are distinguished;
- safety, correctness, accuracy, speed, reliability, availability, memory, compatibility, simplicity, delivery time, token cost, and other material values are translated into thresholds, prohibited states, optimization directions, or explicit ordinal rules;
- the value ordering follows subsystem purpose and accepted authority, or uses the documented fallback with any deviation explicitly justified;
- no weighted score, aggregate preference, or schedule benefit conceals a failed gate;
- credible paths include no change/minimal repair, the proposal, a materially different architecture, experiment/staged path, boundary split/adapter, or fallback where material;
- alternatives are described strongly enough to compete rather than serving as straw men;
- invalid paths were eliminated for specific gate failures;
- Pareto-dominated valid paths were eliminated unless unmodeled uncertainty is explicit;
- architecture-changing uncertainty was resolved with the cheapest decisive evidence when that was cheaper than choosing incorrectly;
- reversibility and option value were considered in proportion to consequence and confidence;
- false tradeoffs were challenged through profiles, adapters, offline/online separation, bounded approximation, asynchronous work, staged rollout, or fallback where credible;
- the selected path follows authority/domain truth → purpose/bounds/value ordering → LEGO → SOLID → CUPID → simplest sufficient total system;
- total-system comparison includes callers, adapters, generated code, resources, synchronization, persistence, migration, recovery, testing, operations, cleanup, review, context, and second consumers;
- rejected paths have concrete disposition reasons;
- accepted tradeoffs state value reduced/gained, operating boundary, worst credible consequence, accepting owner, evidence, detection/containment, rollback/redesign trigger, and revisit condition;
- confidence is calibrated to evidence and uncertainty.

## Priority

Review that work priority is classified and ordered correctly:

- **P0** contains active unacceptable state;
- **P1** resolves hard gates or foundational blockers;
- **P2** maximizes information, risk reduction, and dependency unlock;
- **P3** delivers mission value and measured efficiency;
- **P4** improves supporting quality and polish.

Within a class, dependency unlock, consequence reduction, information value, cost of delay, exposure, reversibility/recovery cost, and effort are considered in that order unless authority says otherwise.

Reject prioritization based mainly on easiest files, loudest symptoms, newest requests, largest diffs, sunk cost, or agent preference.

## Assessment and plan

- Assessment precedes substantial or critical implementation.
- Material questions are resolved, linked to authority, or explicitly assigned to research/experiment/risk/blocker/debt status.
- The strongest credible case against the proposal is fairly stated.
- Valid criticism changed the engineering contract, value ordering, design, scope, branch map, test strategy, sequencing, validation, cleanup, or disposition.
- Claims have decisive evidence or falsifiers; implementation and broad testing are not substitutes for unresolved design.
- The plan orders decisions, branches, nodes, and experiments by dependency and priority and defines exact outputs/consumers.
- Testing, rollback, migration, failure, recovery, cleanup, retention, and supersession are explicit where material.
- Records are proportional and non-duplicative.

## Focus-branch decomposition and integration

When the task is large or complex:

- one canonical parent/integration spine owns outcome, authority, engineering contract, value ordering, invariants, vocabulary, dependencies, invalidation, contradictions, testing, cleanup, and closure;
- every leaf has one primary semantic owner/question/output and satisfies full-attention sizing;
- branch IDs, statuses, input revisions, scope, write authority, outputs, consumers, engineering-decision/test obligations, rollback, cleanup, and integration are explicit;
- a focus branch is not confused with a Git branch, component, issue, PR, directory, decision record, or test file;
- context packets preserve required shared invariants and decisions;
- branch switching used exact checkpoints;
- shared-contract, engineering-decision, value-order, and oracle changes invalidated dependent branches and test evidence;
- parallel branches use compatible versions, non-overlapping write/test ownership, coordinated shared sources, independent acceptance/rollback/cleanup, and one integration owner;
- `accepted` is distinguished from `integrated`;
- all planned branches are dispositioned;
- the integration spine reconciles outputs, terminology, ownership, dependencies, units/ranges/precision/identity/versions/memory spaces, lifecycle, failure, recovery, value ordering, testing, cleanup, contracts, generated forms, persistence, compatibility, security, provenance, resources, performance, and search quality;
- contradictions and invalidated evidence are resolved or bounded;
- boundary/end-to-end evidence proves the parent result at one exact revision.

Reject branch maps that merely rename file/test batches or collect local results without synthesis.

## Testing accuracy, completeness, and efficiency

For every material claim:

- the authoritative oracle is identified and does not merely copy implementation logic;
- exact subject/test/binary/generated/model/schema/package/environment/configuration/fixture/seed identity is proven;
- critical tests demonstrate sensitivity to plausible violations where consequence requires it;
- expected, discovered, executed, passed, failed, required-skip, conditional-skip, optional-skip, and not-discovered counts are explicit;
- zero discovery of required tests fails;
- coverage maps owned invariants and risk-triggered conditions at justified depth rather than relying on raw test/line counts;
- deterministic sampling is disclosed and is not presented as full coverage;
- test intents discovered during work were recorded immediately;
- provisional reproducers were used only as needed for diagnosis and were consolidated, removed, or archived before acceptance;
- related cases are parameterized/property/generated inside owning capsules that share expensive setup but preserve stable case IDs, isolated mutable state, direct single-case execution, and per-case results;
- consolidation reduces setup/execution overhead without creating an opaque monolith;
- compatible immutable build/device/model/dataset/fixture state is reused only with complete evidence identity;
- mutable/global/device/persistence state is isolated or reset between cases;
- the focused fast tier served as the inner loop;
- owner/contract capsules ran after coherent repair batches rather than every edit;
- integration smoke ran after local acceptance and deep/forensic tiers had an explicit trigger;
- identical evidence keys were not rerun for reassurance;
- every repeated run has a material invalidation, contamination/incompleteness, independent-replication, or statistical reason;
- failed commands/tests were retried only after changed hypothesis, input, code/test revision, environment, or transport;
- failures were clustered by first divergence/owner/root cause, with cascades separated from primaries;
- repair changed the authoritative owner coherently and reran minimal cluster, then owning capsule, then required integration;
- full logs remain artifacts and active review uses bounded causal intervals and stable failure IDs;
- duplicate fast workflows, stale CI runs, repeated setup, duplicate fixtures/oracles, and redundant cases are absent or justified;
- pending material test intents and test debt are zero or explicitly authorized and safely tracked;
- tests, oracles, fixtures, generated artifacts, and result caches have clear invalidation rules.

A large test count, green CI, compilation, or line coverage is not by itself accurate, complete, or efficient evidence.

## Plan execution fidelity

- Exact parent plan/version, engineering-decision version, focus branch, node, owner, environment, and frozen head are stated.
- Branch/node readiness and dependency revisions were proven.
- Authority, specification obligations, gates, selected path, value ordering, repository, generated inputs, test/runtime state, oracles, capsules, evidence keys, and expected counts were trustworthy before mutation.
- Expected effects, obligation/decision, falsifier, test obligations, rollback, cleanup, and integration were stated before operations.
- Operations remained within owner/write boundaries.
- Actual effects and new obligations/decision changes/test intents were inspected immediately.
- Focused falsification and affected component/contract/path/lifecycle/design/value/testing/cleanup/integration reconciliation occurred before continuation.
- Material deviations, shared-contract changes, value-order changes, and oracle/invalidation changes revised parent state and invalidated affected evidence.
- Acceptance has exact outputs and test evidence for downstream consumers.
- No invalid partial state, stale generated form, abandoned resource, unresolved contradiction, decision debt, test debt, token debt, unowned residue, or false downstream precondition remains.

## Cleanup and disposition

- All material task-created, decision-record, provisional-test, generated, diagnostic, local, remote, external, sensitive, and coordination items are accounted for.
- Protected state is intact.
- Every item has an intentional disposition.
- Cleanup ordering preserves dependents, evidence, rollback, tests, releases, and recovery.
- Provisional records/scripts, copied fixtures, duplicate cases, temporary instrumentation, large logs, and test artifacts were removed, archived, or retained with ownership/trigger.
- Remote/asynchronous/sensitive final state was verified through the owning system.
- Cleanup debt is safe, bounded, owned, and visible.

## Sanity claim and semantic review

When a sanity/audit claim is present:

- exact target and `full`, `bounded`, or `sampled` claim are named;
- self-sanity and independent review are distinguished;
- complete semantic coverage and full-attention review branches are explicit;
- every included surface is accounted for at justified depth;
- specialist modules are resolved or blocked;
- specification obligations, engineering decisions, component boundaries, end-to-end paths, branch outputs, lifecycle, testing, cleanup, contradictions, and review-created state are reconciled;
- passing leaves/capsules are not treated as integrated proof;
- changed specifications, decisions, revisions, contracts, oracles, or environments invalidate and rerun affected branch/path/test evidence;
- findings are durable and checks not run/claim limits are explicit.

## Pull-request review and integration

For a material PR:

- PR/base/head/comparison identity and review mode are exact;
- complete changed surface, ancestry, generated/dependency/workflow/packaging/decision/test/cleanup effects, and unavailable surfaces are accounted for;
- PR description is verified against authority, obligation map, engineering decision, branch state, execution, test evidence, cleanup, and implementation;
- every represented decision, branch, and test capsule is accounted for by status and exact revision/evidence key;
- material semantics, callers, dependencies, resources, lifecycle, compatibility, value ordering, testing, cleanup, and end-to-end paths are reviewed;
- current-head tests can falsify the claimed result and expected discovery/skip counts are met;
- conversation, reviews, bot findings, linked blockers, decision debt, test debt, token debt, and cleanup debt are reconciled;
- unrelated decisions/testing/cleanup/adjacent branches are not silently included;
- final whole diff, engineering decision, branch integration, test evidence, and disposition are reread after changes;
- exact reviewed head and review independence are clear.

A changed head, base, parent plan, specification, engineering decision, value ordering, shared contract, oracle, source/test revision, generated artifact, environment, fixture, seed/schedule, or resource profile invalidates affected review/test evidence.

Before merge, revalidate exact accepted head, target, mergeability, gates, discussion, issue closure, branch/worktree disposition, decision/test/token/cleanup debt, dependents, and conflicts. Use expected-head protection. After merge, verify target SHA/tree, engineering-decision/parent/branch/test map, issue/dependent state, and cleanup.

## Design hierarchy and simplicity

- Engineering contract, purpose, bounds, owner, lifecycle, test owner, value role, and disposition are explicit.
- LEGO ports, injected dependencies, adapters, replacement/test, and teardown boundaries are valid.
- SOLID/CUPID structure is justified without ceremonial decomposition.
- Total-system simplicity includes callers, generated code, memory, synchronization, recovery, test capsules/setup/runtime, cleanup, context reconstruction, decision review, and branch coordination.
- No broad manager, hidden registry, false abstraction, unbounded resource, overlapping authority, duplicated test hierarchy, unsupported value ordering, or unowned residue was introduced.

## Contracts, concurrency, and resources

- Inputs, outputs, errors, lifecycle, compatibility, cleanup, resource behavior, value ordering, and oracle/test ownership are explicit.
- No first-domain/hardware assumption entered a universal contract or conformance capsule.
- Persistent data, identities, migration, and disposition remain valid.
- Ranges, precision, overflow, capacity, exhaustion, teardown, synchronization, publication, cancellation, stale references, isolation, and cleanup are justified.
- Device-residency requirements remain intact where applicable.

## Evidence and publication

- Validation observes specification obligations, selected-path mechanism, branch output, integrated behavior, and final state.
- Owner capsules, conformance cases, integration smoke, and triggered deep evidence pass where applicable.
- Performance claims have fair baselines and semantic/search-quality guardrails.
- Cleanup verification uses the owning system.
- Unknowns, checks not run, and unsupported cases are explicit.
- Status, indexes, registry, engineering-decision/parent/branch/token/test/execution/cleanup state, manifests, ADRs/specifications, findings, review state, and archive are reconciled.
- Final repository, GitHub, process/device, credential, test artifact, and external-resource state is intentional.
- Remote target and integrated SHA are verified before publication/merge completion is claimed.
