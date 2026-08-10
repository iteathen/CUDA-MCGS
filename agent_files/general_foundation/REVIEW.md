# Review Standard

**Scope:** Reusable foundation for design review, focus-branch review, plan-execution review, cleanup/disposition review, change review, sanity claims, and pull-request review.

Review the complete owned change, its decomposition, execution fidelity, actual effects, integration, and the state it leaves behind—not isolated lines.

Ordinary change/PR review, focus-branch integration, cleanup verification, a declared sanity/audit claim, and merge authorization are related but distinct:

- ordinary review may be bounded to the proposed change and affected integration;
- focus-branch review verifies that a large task was decomposed and reassembled coherently under [`FOCUS_BRANCHES.md`](FOCUS_BRANCHES.md);
- cleanup review verifies local/remote/external/sensitive/retained state under [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md);
- a full sanity claim additionally requires complete coverage accounting, focused review branches, semantic interrogation, and integrated reconciliation under [`SANITY_CHECKING.md`](SANITY_CHECKING.md);
- PR review and merge follow exact-head and guarded-integration rules in [`PULL_REQUEST_REVIEW_AND_MERGE.md`](PULL_REQUEST_REVIEW_AND_MERGE.md).

## Authority and scope

- Owner intent and accepted authority are satisfied.
- Proposals/archives were not treated as current authority.
- The parent task, plan, and focus branches did not override accepted doctrine, ADRs, specifications, contracts, schemas, manifests, tests, or cleanup protections.
- One source of truth remains for every changed behavior and shared contract.
- No unrelated cleanup, branch work, or hidden ownership movement entered the change.
- Protected user/pre-existing/shared/authority/evidence/recovery state remains intact.

## Assessment and plan

- The assessment precedes implementation planning for substantial or critical work.
- Applicable question groups were resolved, linked to accepted authority, or explicitly assigned to research/experiment/blocker/cleanup-debt status.
- The strongest credible case against the proposal is stated fairly.
- Valid criticism changed design, scope, branch map, sequencing, validation, cleanup, or disposition.
- Important claims have evidence or decisive falsifiers; implementation is not being used to avoid unresolved design or lifecycle questions.
- The plan follows coherent ownership boundaries, orders nodes/branches by dependency and uncertainty, and defines exact outputs/downstream consumers.
- Stop, rollback, migration, failure, recovery, cleanup, retention, and archive/supersession conditions are explicit where material.
- The record is proportional: existing authority is linked, duplicate ledgers are absent, and ongoing manual accounting has a named owner and decision value.

## Focus-branch decomposition and integration

When the task is large or complex:

- one canonical parent task and integration spine own the final outcome, authority, global invariants, shared vocabulary, dependency graph, invalidation, contradictions, cleanup, and closure;
- the decomposition trigger is justified by attention, ownership, unknowns, specialist risk, cross-session work, parallelism, or integration complexity—not merely file count;
- every leaf has one primary question/output and one primary semantic owner;
- each leaf satisfies the full-attention rule without sampling or skimming;
- branch IDs, types, statuses, exact input revisions, scope/non-goals, write permissions, global invariants, outputs, consumers, acceptance/falsifiers, rollback, cleanup, and integration obligations are explicit;
- a focus branch is not mislabeled as a Git branch, component, issue, PR, directory, or document;
- branches are split or combined by semantic ownership and validity transition rather than arbitrary size;
- context packets are minimal but include every shared invariant needed for sound work;
- normally one agent owned one active branch and left a checkpoint before switching;
- shared-contract changes were routed through the integration spine and dependent branches/evidence were invalidated explicitly;
- parallel branches used compatible parent versions, non-overlapping owners/write surfaces, frozen/coordinated shared contracts, acyclic dependencies, independent acceptance/rollback/cleanup, and one integration owner;
- locally `accepted` branches are distinguished from `integrated` branches;
- every planned branch is integrated, blocked, invalidated, superseded, authoritatively deferred, or removed from scope with a reason;
- the integration spine reconciles exact outputs, terminology, ownership, dependencies, units/ranges/precision/identity/versions/memory spaces, lifecycle, failure, recovery, cleanup, contracts, generated forms, persistence, compatibility, security, provenance, resources, performance, and search quality;
- contradictions and invalidated evidence are resolved or exactly bounded;
- boundary/end-to-end validation proves the parent result against one exact final revision;
- separate Git branches/issues/PRs/worktrees/documents were created only when isolation, owner, deliverable, risk, dependency, review, transport, rollback, or closure justified them.

Reject branch maps that merely rename file batches, distribute work evenly among agents, or collect local results without synthesis.

## Plan execution fidelity

- The exact parent plan/version, focus branch, node, owner, branch/environment, and frozen head are stated.
- The branch/node was explicitly ready; dependencies and expected revisions were satisfied.
- Authority, specifications, repository state, environment, generated inputs, and test/runtime state were trustworthy before mutation.
- Expected local/wider effects, acceptance, decisive falsifier, rollback/safe stop, cleanup, and integration obligations were recorded before each material operation.
- Newly triggered doctrine was applied even when the original plan omitted it.
- Operations stayed inside the focus branch’s semantic owner and write boundary.
- Actual effects were inspected immediately, registered for cleanup, and compared with expected effects.
- Focused falsification and affected component/contract/boundary/path/lifecycle/design/cleanup reconciliation occurred before continuation.
- Variations and deviations were classified; material deviations revised the parent plan and invalidated affected branches.
- Coordinated or irreversible operations defined valid pre/post states, intermediate visibility, publication, rollback/recovery, cleanup, and acceptance.
- Node/branch acceptance has exact evidence and exact outputs/revisions for downstream consumers.
- No invalid partial state, stale generated form, abandoned resource, unowned residue, competing authority, unresolved contradiction, or false downstream precondition remains.
- Execution, focus-branch, and cleanup records are proportional and do not duplicate issue, plan, PR, and handoff history.

## Cleanup and disposition

When material cleanup is triggered:

- task-created, temporarily modified, superseded, partial, generated, diagnostic, local, remote, external, sensitive, and coordination items are accounted for;
- protected pre-existing/user/shared/authority/evidence/recovery state is exact and intact;
- every material item has one valid disposition;
- cleanup ordering preserves dependents, focus/Git branch relationships, evidence, rollback, tests, releases, and recovery;
- destructive operations used exact targets, narrow selectors, preview/dry-run when available, required authority, rollback safeguards, and immediate actual-effect inspection;
- broad destructive shortcuts, force-push/deletion, cosmetic PR/issue closure, evidence destruction, and secret deletion without revocation were not used;
- repository, local Git, remote GitHub, process/device, credential, persistence, artifact/release, and external-resource state are intentional where applicable;
- historically useful stale material was archived with provenance;
- remote/asynchronous/sensitive final state was verified through the owning system;
- retained temporary state and cleanup debt have owners and objective triggers;
- canonical work records accurately describe anything that remains.

A clean diff, successful command, exited process, or merged PR is not sufficient cleanup evidence on its own.

## Sanity claim and semantic review

When a sanity or audit claim is present:

- the exact revision/artifact and `full`, `bounded`, or `sampled` claim are named;
- self-sanity and independent review are distinguished;
- included/excluded surfaces and the complete semantic coverage map are explicit;
- review branches satisfy the specialized full-attention rules in `SANITY_CHECKING.md`;
- every declared surface is accounted for at risk-justified depth;
- every material semantic unit addresses purpose/specification, owner/LEGO boundary, inputs/outputs/effects, callers/dependencies, state/identity/lifetime, foundational contracts/ranges, design-principle alignment, ordering/resources/pressure, failure/cleanup, counterexample, decisive evidence, and wider impact;
- objectively triggered specialist modules are resolved or blocked;
- component boundaries, critical end-to-end paths, cross-cutting concerns, lifecycle, cleanup, contradictions, and review-created state are reconciled;
- passing leaves are not treated as integrated system proof;
- changed revisions invalidate and rerun affected branch, boundary, path, and cleanup evidence;
- actionable independent findings are durable and were not quietly repaired;
- checks not run and claim limits are explicit.

## Pull-request review and integration

For a material PR:

- PR/base/head/comparison identity and review mode are exact;
- the complete changed surface, ancestry, generated/dependency/workflow/packaging/cleanup effects, and unavailable changes are accounted for;
- the PR description is verified against authority, parent/focus-branch state, execution evidence, cleanup evidence, and actual implementation;
- all focus branches represented by the PR are accounted for by status and exact output revision;
- material semantic units and affected callers, dependencies, state, resources, lifecycle, compatibility, cleanup, and end-to-end paths are reviewed;
- tests/checks and cleanup verification belong to the current head and can falsify the claimed result;
- conversation, review submissions, inline threads, bot findings, linked blockers, and cleanup debt are reconciled;
- blockers, questions, cleanup debt, non-blocking improvements, and informational comments are classified honestly;
- unrelated cleanup or adjacent focus branches are not disguised as blockers or silently included;
- the final whole diff, branch integration, and disposition are re-read after changes;
- the result names the exact reviewed head and labels review independence honestly.

A changed head invalidates affected review and cleanup evidence. A material base, parent-plan, or shared-contract change invalidates affected focus-branch and integration evidence.

Before merge:

- PR state, exact accepted head, target, current base/ancestry/mergeability, required checks/reviews/protection/queue, blocking discussion, issue closure, focus/Git branch/worktree disposition, cleanup debt, dependent work, and conflicting work are revalidated;
- merge method is deliberate and an expected-head guard is used where supported;
- target protection/history is not bypassed;
- post-merge target SHA/tree, parent/focus-branch map, issue/branch/worktree effects, dependent work, artifacts, permissions, and external resources are verified or safely tracked.

## Design hierarchy and simplicity

- Domain truth, authority, purpose, operating bounds, concern weighting, lifecycle, and disposition are explicit.
- Components have coherent responsibilities and visible owners of state/lifecycle/cleanup.
- LEGO ports, injected dependencies, adapters, replacement/test, and teardown boundaries are valid.
- SOLID responsibilities are separated where meaning/change/testing/lifetime/cleanup requires it without ceremonial decomposition.
- CUPID qualities are present.
- The design is the simplest sufficient total system; complexity was not merely moved into callers, generated code, memory, synchronization, recovery, cleanup, tests, or focus-branch coordination.
- Reusable concepts pass accurate-generality tests.
- No broad manager, hidden registry, false abstraction, unbounded resource, overlapping branch authority, or unowned residue was introduced.

## Organization and ownership

- Every artifact has a durable product area, component, lifecycle owner, and disposition.
- Focus branches do not invent product ownership merely to organize work.
- New/moved components have current README, manifest, registry, validation, migration, and cleanup/teardown.
- Public/internal boundaries are visible and dependencies are declared and acyclic.
- Placement and cleanup remain sensible at larger project scale.

## Contracts, concurrency, and resources

- Inputs, outputs, errors, lifecycle, compatibility, cleanup, resource behavior, and shared-contract ownership are explicit.
- No first-domain or first-hardware assumption entered a universal contract.
- Persistent data, identifiers, migration, and final disposition remain valid.
- Ranges, precision, overflow, capacity, watermarks, exhaustion, teardown, synchronization, publication, cancellation, stale references, and cleanup are justified.
- Production device-residency requirements remain intact where applicable.

## Evidence and publication

- Validation observes the claimed mechanism, branch output, integration behavior, and final state.
- Organization checks, component tests, conformance cases, and quality guardrails pass where applicable.
- Cleanup verification uses the owning system.
- Unknowns and unsupported cases are explicit.
- Status, indexes, registry, parent/focus-branch/execution/cleanup state, manifests, ADRs/specifications, findings, review state, and archive are reconciled.
- Final diff, local workspace, Git/GitHub, process/device, credential, artifact, and external-resource state are intentional.
- The remote target and integrated SHA are verified before publication/merge completion is claimed.
