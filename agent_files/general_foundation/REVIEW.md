# Review Standard

**Scope:** Reusable foundation for design review, plan-execution review, cleanup/disposition review, change review, sanity claims, and pull-request review.

Review the complete owned change, its execution fidelity, its actual effects, and the state it leaves behind—not isolated lines.

Ordinary change/PR review, cleanup verification, a declared sanity/audit claim, and merge authorization are related but distinct:

- ordinary review may be bounded to the proposed change and affected integration;
- cleanup review verifies local/remote/external/sensitive/retained state under [`CLEANUP_AND_DISPOSITION.md`](CLEANUP_AND_DISPOSITION.md);
- a full sanity claim additionally requires complete coverage accounting, focused review branches, semantic interrogation, and integrated reconciliation under [`SANITY_CHECKING.md`](SANITY_CHECKING.md);
- PR review and merge follow exact-head and guarded-integration rules in [`PULL_REQUEST_REVIEW_AND_MERGE.md`](PULL_REQUEST_REVIEW_AND_MERGE.md).

## Authority and scope

- Owner intent and accepted authority are satisfied.
- Proposals/archives were not treated as current authority.
- The plan did not override accepted doctrine, ADRs, specifications, contracts, schemas, manifests, tests, or cleanup protections.
- One source of truth remains for every changed behavior.
- Cleanup remained inside the touched ownership boundary; unrelated repository beautification or deletion did not enter the change.
- Protected user/pre-existing/shared/authority/evidence/recovery state remains intact.

## Assessment and plan

- The assessment precedes the implementation plan for substantial or critical work.
- Applicable question groups were resolved, linked to accepted authority, or explicitly assigned to research/experiment/blocker/cleanup-debt status.
- The strongest credible case against the proposal is stated fairly rather than caricatured.
- Valid criticism changed the design, scope, sequencing, validation, cleanup, or disposition.
- Important claims have evidence or decisive falsifiers; implementation is not being used to avoid unresolved design or lifecycle questions.
- The plan follows coherent ownership boundaries, orders nodes by dependency and uncertainty, and defines exact outputs/downstream consumers.
- Stop, rollback, migration, failure, recovery, cleanup, retention, and archive/supersession conditions are explicit where material.
- The record is proportional: existing authority is linked, duplicate ledgers are absent, and ongoing manual accounting has a named owner and real decision value.

## Plan execution fidelity

- The exact plan record/version/node, owner, branch/environment, and frozen head are stated.
- The node was explicitly ready; dependencies and expected dependency revisions were satisfied.
- Authority, specifications, repository state, environment, generated inputs, and test/runtime state were trustworthy before mutation.
- Expected local/wider effects, acceptance, cheapest decisive falsifier, rollback/safe stop, cleanup obligations, and stop conditions were recorded before each material operation.
- Newly triggered doctrine was applied even when the original plan omitted it.
- Operations were ownership-sized coherent validity transitions rather than arbitrary file batches.
- Actual effects were inspected immediately, registered for cleanup where material, and compared with expected effects.
- Focused falsification and affected component/contract/boundary/path/lifecycle/design/cleanup reconciliation occurred before continuation.
- Variations and deviations were classified; material deviations revised the plan and invalidated affected nodes and cleanup assumptions.
- Coordinated or irreversible operations defined valid pre/post states, intermediate visibility, publication, rollback/recovery, cleanup, and acceptance.
- Parallel execution used non-overlapping owners/write surfaces and one integration owner.
- Node acceptance has exact evidence for every criterion and exact outputs/revisions for downstream consumers.
- No invalid partial state, stale generated form, abandoned resource, unowned residue, competing authority, unresolved contradiction, or false downstream precondition remains.
- The execution and cleanup records are proportional and do not duplicate issue, plan, PR, and handoff history.

## Cleanup and disposition

When material cleanup is triggered:

- task-created, temporarily modified, superseded, partial, generated, diagnostic, local, remote, external, sensitive, and coordination items are accounted for;
- protected pre-existing/user/shared/authority/evidence/recovery state is exact and intact;
- every material item has one valid disposition: remove, restore, retain authority/evidence/recovery, archive, quarantine, transfer, supersede, retain temporarily with owner/trigger, or protect unchanged;
- cleanup ordering preserves dependents, PR/branch relationships, evidence, rollback, tests, releases, and recovery;
- destructive operations used exact targets, narrow selectors, preview/dry-run when available, required authority, rollback safeguards, and immediate actual-effect inspection;
- broad destructive shortcuts, force-push/deletion, cosmetic PR/issue closure, evidence destruction, and secret deletion without revocation were not used;
- repository files, local files/folders, generated/build/cache/package output, local Git state, remote branches/PRs/issues/reviews/claims, processes/ports/containers/locks, GPU/device state, credentials/permissions, persistence/backups, artifacts/releases, and external resources are intentional where applicable;
- historically useful stale material was archived with provenance rather than silently erased;
- remote/asynchronous/sensitive final state was verified through the owning system rather than inferred from command success;
- retained temporary state has an owner, protection, reason, location, objective trigger, and next action;
- cleanup debt is safe, bounded, visible, independently actionable, and does not hide an unmet acceptance criterion or unsafe residue;
- canonical work records accurately describe anything that remains.

A clean diff, successful command, exited process, or merged PR is not sufficient cleanup evidence on its own.

## Sanity claim and semantic review

When a sanity or audit claim is present:

- the exact revision/artifact and `full`, `bounded`, or `sampled` claim are named;
- self-sanity and independent review are distinguished;
- included/excluded surfaces and the complete semantic coverage map are explicit;
- coverage is split into review branches by owner, boundary, path, cross-cutting concern, or artifact;
- every leaf branch has one primary semantic owner or coherent path, complete semantic-unit inventory, and a sizing rationale proving one focused session can cover it without sampling or skimming;
- every declared surface is accounted for at risk-justified depth;
- every material semantic unit addresses purpose/specification, owner/LEGO boundary, inputs/outputs/effects, callers/dependencies, state/identity/lifetime, foundational contracts/ranges, design-principle alignment, ordering/resources/pressure, failure/cleanup, a credible counterexample, decisive evidence, and wider impact;
- objectively triggered design/universality, graph/search, evaluator/numeric, GPU/concurrency, finite-memory, persistence, compatibility, security, generated/JIT/ABI, external-resource, performance, destructive, cleanup, and diagnostic modules are resolved or blocked;
- specifications and design principles are compared to the actual mechanism rather than merely cited;
- component boundaries, critical end-to-end paths, cross-cutting concerns, lifecycle, cleanup, contradictions, and review-created state are reconciled;
- passing leaf branches are not treated as integrated system proof;
- tests and tools support rather than replace mechanism and cleanup understanding;
- changed revisions invalidate and rerun affected branch, boundary, path, and cleanup evidence;
- actionable independent findings are durable and were not quietly repaired;
- checks not run and claim limits are explicit.

A sampled, overbroad, or silently incomplete review cannot be approved as a full sanity claim. Full coverage does not require exhaustive review of unrelated low-risk units.

## Pull-request review and integration

For a material PR:

- PR/base/head/comparison identity and review mode are exact;
- the complete changed surface, ancestry, generated/dependency/workflow/packaging/cleanup effects, and unavailable changes are accounted for;
- the PR description is verified against authority, plan-execution evidence, cleanup evidence, and actual implementation rather than trusted as proof;
- material semantic units and affected callers, dependencies, state, resources, lifecycle, compatibility, cleanup, and end-to-end paths are reviewed;
- tests/checks and cleanup verification belong to the current head and can falsify the claimed behavior/state;
- conversation, review submissions, inline threads, bot findings, linked blockers, and cleanup debt are reconciled;
- blocking defects, questions, cleanup debt, non-blocking improvements, and informational comments are classified honestly;
- unrelated cleanup and speculative future work are not disguised as blockers;
- the final whole diff and disposition are re-read after changes;
- the result names the exact reviewed head and is labeled author-side, independent, or owner authorization correctly.

A changed head invalidates affected review and cleanup evidence. A material base change invalidates affected integration evidence.

Before merge:

- PR state, exact accepted head, target, current base/ancestry/mergeability, required checks/reviews/CODEOWNERS/protection/queue, blocking discussion, issue closure, local/remote branch and worktree disposition, cleanup debt, dependent work, and conflicting work are revalidated;
- merge method is deliberate and an expected-head guard is used where supported;
- target protection/history is not bypassed or force-updated;
- post-merge target SHA/tree, issue/local/remote branch/worktree effects, dependent work, artifacts, permissions, and external resources are verified or safely tracked.

## Design hierarchy and simplicity

- Domain truth, authority, purpose, operating bounds, concern weighting, lifecycle, and disposition are explicit.
- The component has one coherent responsibility and one visible owner of state/lifecycle/cleanup.
- LEGO ports, injected dependencies, adapters, replacement/test, and teardown boundaries are valid.
- SOLID responsibilities are separated where meaning/change/testing/lifetime/cleanup requires it, without ceremonial decomposition.
- CUPID qualities are present: composable, focused, predictable, idiomatic, and domain-based.
- The design is the simplest sufficient **total system**; complexity was not merely moved to callers, generated code, memory, synchronization, recovery, cleanup, diagnostics, or tests.
- Reusable concepts pass maximum-accurate-generality, second-instance, first-consumer deletion, and inclusion/exclusion tests.
- No forbidden broad manager, service locator, hidden registry, false abstraction, unbounded resource, or unowned residue was introduced.

## Organization and ownership

- Every artifact has a durable product area, component, lifecycle owner, and disposition.
- New/moved components have current README, manifest, registry, validation, migration, and cleanup/teardown.
- Root and top-level namespaces remain clean without deleting protected or unrelated state.
- Public/internal boundaries are visible.
- Cross-component dependencies are declared, acyclic, and use public contracts.
- No catch-all helper/common/shared dumping ground or deep import was introduced.
- Placement and cleanup remain sensible at an order-of-magnitude larger project scale.
- Repo/package/service splits are justified by lifecycle, not file count.

## Contracts and universality

- Inputs, outputs, errors, lifecycle, compatibility, cleanup, and resource behavior are explicit.
- No first-domain or first-hardware assumption entered a universal contract.
- Specialization remains behind the universal boundary.
- Persistent data, identifiers, lifetimes, migration, and final disposition remain valid across transitions.

## Concurrency and resources

- Ranges, precision, overflow, capacity, watermarks, exhaustion, teardown, and reclamation are justified.
- Synchronization, publication ordering, cancellation, stale references, and cleanup are safe.
- Production device-residency requirements remain intact where applicable.

## Evidence

- Validation observes the claimed mechanism, behavior, and final state.
- Organization checks and component-owned tests pass.
- Reference/conformance cases pass.
- Performance claims have a fair baseline and quality guardrail.
- Cleanup verification uses the owning system.
- Unknowns and unsupported cases are explicit.

## Documentation and publication

- Status, indexes, registry, plan/execution/cleanup state, component manifests, specifications/ADRs, findings, review state, and supersession/archive are reconciled.
- Third-party provenance, licensing, donor-artifact disposition, and retained evidence are recorded.
- Final diff, local workspace, Git, remote, process/device, credential, artifact, and external-resource state are intentional.
- The remote target and resulting integrated SHA are verified before publication/merge completion is claimed.
