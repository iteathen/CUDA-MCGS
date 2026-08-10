# Review Standard

**Scope:** Reusable foundation for design review, focus-branch review, test/repair-loop review, plan-execution review, cleanup/disposition review, change review, sanity claims, and pull-request review.

Review the complete owned change, its decomposition, test evidence, execution fidelity, actual effects, integration, and the state it leaves behind—not isolated lines or a raw green count.

Ordinary change/PR review, focus-branch integration, testing, cleanup verification, a declared sanity/audit claim, and merge authorization are related but distinct:

- ordinary review may be bounded to the proposed change and affected integration;
- focus-branch review follows [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md);
- testing and repair-loop review follows [`TESTING.md`](TESTING.md) and [`DEBUGGING.md`](DEBUGGING.md);
- cleanup review follows [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md);
- a full sanity claim additionally follows [`SANITY_CHECKING.md`](SANITY_CHECKING.md);
- PR review and merge follow [`PULL_REQUEST_REVIEW_AND_MERGE.md`](PULL_REQUEST_REVIEW_AND_MERGE.md).

## Authority and scope

- Owner intent and accepted authority are satisfied.
- Proposals, archives, implementation code, comments, and existing tests were not treated as automatic authority.
- Parent task, branches, plan, tests, and cleanup did not override accepted doctrine, ADRs, specifications, contracts, schemas, manifests, or protections.
- One source of truth remains for every changed behavior, shared contract, and test oracle.
- No unrelated cleanup, branch work, test expansion, or ownership movement entered the change.
- Protected user/pre-existing/shared/authority/evidence/recovery state remains intact.

## Assessment and plan

- Assessment precedes substantial or critical implementation.
- Material questions are resolved, linked to authority, or explicitly assigned to research/experiment/blocker/debt status.
- The strongest credible case against the proposal is fairly stated.
- Valid criticism changed design, scope, branch map, test strategy, sequencing, validation, cleanup, or disposition.
- Claims have decisive evidence or falsifiers; implementation and broad testing are not substitutes for unresolved design.
- Plan orders branches/nodes by dependency and defines exact outputs/consumers.
- Testing, rollback, migration, failure, recovery, cleanup, retention, and supersession are explicit where material.
- Records are proportional and non-duplicative.

## Focus-branch decomposition and integration

When the task is large or complex:

- one canonical parent/integration spine owns outcome, authority, invariants, vocabulary, dependencies, invalidation, contradictions, testing, cleanup, and closure;
- every leaf has one primary semantic owner/question/output and satisfies full-attention sizing;
- branch IDs, statuses, input revisions, scope, write authority, outputs, consumers, test obligations, rollback, cleanup, and integration are explicit;
- a focus branch is not confused with a Git branch, component, issue, PR, directory, or test file;
- context packets preserve required shared invariants;
- branch switching used exact checkpoints;
- shared-contract and oracle changes invalidated dependent branches and test evidence;
- parallel branches use compatible versions, non-overlapping write/test ownership, coordinated shared sources, independent acceptance/rollback/cleanup, and one integration owner;
- `accepted` is distinguished from `integrated`;
- all planned branches are dispositioned;
- the integration spine reconciles outputs, terminology, ownership, dependencies, units/ranges/precision/identity/versions/memory spaces, lifecycle, failure, recovery, testing, cleanup, contracts, generated forms, persistence, compatibility, security, provenance, resources, performance, and search quality;
- contradictions and invalidated evidence are resolved or bounded;
- boundary/end-to-end evidence proves the parent result at one exact revision.

Reject branch maps that merely rename file or test batches or collect local results without synthesis.

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

- Exact parent plan/version, focus branch, node, owner, environment, and frozen head are stated.
- Branch/node readiness and dependency revisions were proven.
- Authority, specifications, repository, generated inputs, test/runtime state, oracles, capsules, evidence keys, and expected counts were trustworthy before mutation.
- Expected effects, falsifier, test obligations, rollback, cleanup, and integration were stated before operations.
- Operations remained within owner/write boundaries.
- Actual effects and new test intents were inspected immediately.
- Focused falsification and affected component/contract/path/lifecycle/testing/cleanup/integration reconciliation occurred before continuation.
- Material deviations, shared-contract changes, and oracle/invalidation changes revised parent state and invalidated affected evidence.
- Acceptance has exact outputs and test evidence for downstream consumers.
- No invalid partial state, stale generated form, abandoned resource, unresolved contradiction, test debt, token debt, unowned residue, or false downstream precondition remains.

## Cleanup and disposition

- All material task-created, provisional-test, generated, diagnostic, local, remote, external, sensitive, and coordination items are accounted for.
- Protected state is intact.
- Every item has an intentional disposition.
- Cleanup ordering preserves dependents, evidence, rollback, tests, releases, and recovery.
- Provisional scripts, copied fixtures, duplicate cases, temporary instrumentation, large logs, and test artifacts were removed, archived, or retained with ownership/trigger.
- Remote/asynchronous/sensitive final state was verified through the owning system.
- Cleanup debt is safe, bounded, owned, and visible.

## Sanity claim and semantic review

When a sanity/audit claim is present:

- exact target and `full`, `bounded`, or `sampled` claim are named;
- self-sanity and independent review are distinguished;
- complete semantic coverage and full-attention review branches are explicit;
- every included surface is accounted for at justified depth;
- specialist modules are resolved or blocked;
- component boundaries, end-to-end paths, branch outputs, lifecycle, testing, cleanup, contradictions, and review-created state are reconciled;
- passing leaves/capsules are not treated as integrated proof;
- changed revisions/contracts/oracles invalidate and rerun affected branch/path/test evidence;
- findings are durable and checks not run/claim limits are explicit.

## Pull-request review and integration

For a material PR:

- PR/base/head/comparison identity and review mode are exact;
- complete changed surface, ancestry, generated/dependency/workflow/packaging/test/cleanup effects, and unavailable surfaces are accounted for;
- PR description is verified against authority, branch state, execution, test evidence, cleanup, and implementation;
- every represented branch and test capsule is accounted for by status and exact revision/evidence key;
- material semantics, callers, dependencies, resources, lifecycle, compatibility, testing, cleanup, and end-to-end paths are reviewed;
- current-head tests can falsify the claimed result and expected discovery/skip counts are met;
- conversation, reviews, bot findings, linked blockers, test debt, token debt, and cleanup debt are reconciled;
- unrelated testing/cleanup/adjacent branches are not silently included;
- final whole diff, branch integration, test evidence, and disposition are reread after changes;
- exact reviewed head and review independence are clear.

A changed head, base, parent plan, shared contract, oracle, source/test revision, generated artifact, environment, fixture, seed/schedule, or resource profile invalidates affected review/test evidence.

Before merge, revalidate exact accepted head, target, mergeability, gates, discussion, issue closure, branch/worktree disposition, test/token/cleanup debt, dependents, and conflicts. Use expected-head protection. After merge, verify target SHA/tree, parent/branch/test map, issue/dependent state, and cleanup.

## Design hierarchy and simplicity

- Purpose, bounds, owner, lifecycle, test owner, and disposition are explicit.
- LEGO ports, injected dependencies, adapters, replacement/test, and teardown boundaries are valid.
- SOLID/CUPID structure is justified without ceremonial decomposition.
- Total-system simplicity includes callers, generated code, memory, synchronization, recovery, test capsules/setup/runtime, cleanup, context reconstruction, and branch coordination.
- No broad manager, hidden registry, false abstraction, unbounded resource, overlapping authority, duplicated test hierarchy, or unowned residue was introduced.

## Contracts, concurrency, and resources

- Inputs, outputs, errors, lifecycle, compatibility, cleanup, resource behavior, and oracle/test ownership are explicit.
- No first-domain/hardware assumption entered a universal contract or conformance capsule.
- Persistent data, identities, migration, and disposition remain valid.
- Ranges, precision, overflow, capacity, exhaustion, teardown, synchronization, publication, cancellation, stale references, isolation, and cleanup are justified.
- Device-residency requirements remain intact where applicable.

## Evidence and publication

- Validation observes mechanism, branch output, integrated behavior, and final state.
- Owner capsules, conformance cases, integration smoke, and triggered deep evidence pass where applicable.
- Performance claims have fair baselines and semantic/search-quality guardrails.
- Cleanup verification uses the owning system.
- Unknowns, checks not run, and unsupported cases are explicit.
- Status, indexes, registry, parent/branch/token/test/execution/cleanup state, manifests, ADRs/specifications, findings, review state, and archive are reconciled.
- Final repository, GitHub, process/device, credential, test artifact, and external-resource state is intentional.
- Remote target and integrated SHA are verified before publication/merge completion is claimed.
