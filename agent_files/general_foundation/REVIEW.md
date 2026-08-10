# Review Standard

**Scope:** Reusable foundation for design review, plan-execution review, change review, sanity claims, and pull-request review.

Review the complete owned change, its execution fidelity, and its actual effects—not isolated lines.

Ordinary change/PR review, a declared sanity/audit claim, and merge authorization are related but distinct:

- ordinary review may be bounded to the proposed change and affected integration;
- a full sanity claim additionally requires complete coverage accounting, focused review branches, semantic interrogation, and integrated reconciliation under [`SANITY_CHECKING.md`](SANITY_CHECKING.md);
- PR review and merge follow exact-head and guarded-integration rules in [`PULL_REQUEST_REVIEW_AND_MERGE.md`](PULL_REQUEST_REVIEW_AND_MERGE.md).

## Authority and scope

- Owner intent and accepted authority are satisfied.
- Proposals/archives were not treated as current authority.
- The plan did not override accepted doctrine, ADRs, specifications, contracts, schemas, manifests, or tests.
- One source of truth remains for every changed behavior.
- No unrelated cleanup or hidden ownership movement entered the change.

## Assessment and plan

- The assessment precedes the implementation plan for substantial or critical work.
- Applicable question groups were resolved, linked to accepted authority, or explicitly assigned to research/experiment/blocker status.
- The strongest credible case against the proposal is stated fairly rather than caricatured.
- Valid criticism changed the design, scope, sequencing, validation, or disposition.
- Important claims have evidence or decisive falsifiers; implementation is not being used to avoid an unresolved design.
- The plan follows coherent ownership boundaries, orders nodes by dependency and uncertainty, and defines exact outputs/downstream consumers.
- Stop, rollback, migration, failure, recovery, and cleanup conditions are explicit where material.
- The record is proportional: existing authority is linked, duplicate ledgers are absent, and ongoing manual accounting has a named owner and real decision value.

## Plan execution fidelity

- The exact plan record/version/node, owner, branch/environment, and frozen head are stated.
- The node was explicitly ready; dependencies and expected dependency revisions were satisfied.
- Authority, specifications, repository state, environment, generated inputs, and test/runtime state were trustworthy before mutation.
- Expected local/wider effects, acceptance, cheapest decisive falsifier, rollback/safe stop, and stop conditions were recorded before each material operation.
- Newly triggered doctrine was applied even when the original plan omitted it.
- Operations were ownership-sized coherent validity transitions rather than arbitrary file batches.
- Actual effects were inspected immediately and compared with expected effects.
- Focused falsification and affected component/contract/boundary/path/lifecycle/design reconciliation occurred before continuation.
- Variations and deviations were classified; material deviations revised the plan and invalidated affected nodes.
- Coordinated or irreversible operations defined valid pre/post states, intermediate visibility, publication, rollback/recovery, and acceptance.
- Parallel execution used non-overlapping owners/write surfaces and one integration owner.
- Node acceptance has exact evidence for every criterion and exact outputs/revisions for downstream consumers.
- No invalid partial state, stale generated form, abandoned resource, competing authority, unresolved contradiction, or false downstream precondition remains.
- The execution record is proportional and does not duplicate issue, plan, PR, and handoff history.

## Sanity claim and semantic review

When a sanity or audit claim is present:

- the exact revision/artifact and `full`, `bounded`, or `sampled` claim are named;
- self-sanity and independent review are distinguished;
- included/excluded surfaces and the complete semantic coverage map are explicit;
- coverage is split into review branches by owner, boundary, path, cross-cutting concern, or artifact;
- every leaf branch has one primary semantic owner or coherent path, complete semantic-unit inventory, and a sizing rationale proving one focused session can cover it without sampling or skimming;
- every declared surface is accounted for at risk-justified depth;
- every material semantic unit addresses purpose/specification, owner/LEGO boundary, inputs/outputs/effects, callers/dependencies, state/identity/lifetime, foundational contracts/ranges, design-principle alignment, ordering/resources/pressure, failure/cleanup, a credible counterexample, decisive evidence, and wider impact;
- objectively triggered design/universality, graph/search, evaluator/numeric, GPU/concurrency, finite-memory, persistence, compatibility, security, generated/JIT/ABI, external-resource, performance, destructive, and diagnostic modules are resolved or blocked;
- specifications and design principles are compared to the actual mechanism rather than merely cited;
- component boundaries, critical end-to-end paths, cross-cutting concerns, lifecycle, contradictions, and review-created state are reconciled;
- passing leaf branches are not treated as integrated system proof;
- tests and tools support rather than replace mechanism understanding;
- changed revisions invalidate and rerun affected branch, boundary, and path evidence;
- actionable independent findings are durable and were not quietly repaired;
- checks not run and claim limits are explicit.

A sampled, overbroad, or silently incomplete review cannot be approved as a full sanity claim. Full coverage does not require exhaustive review of unrelated low-risk units.

## Pull-request review and integration

For a material PR:

- PR/base/head/comparison identity and review mode are exact;
- the complete changed surface, ancestry, generated/dependency/workflow/packaging effects, and unavailable changes are accounted for;
- the PR description is verified against authority, plan-execution evidence, and actual implementation rather than trusted as proof;
- material semantic units and affected callers, dependencies, state, resources, lifecycle, compatibility, and end-to-end paths are reviewed;
- tests/checks belong to the current head and can falsify the claimed behavior;
- conversation, review submissions, inline threads, bot findings, and linked blockers are reconciled;
- blocking defects, questions, non-blocking improvements, and informational comments are classified honestly;
- unrelated cleanup and speculative future work are not disguised as blockers;
- the final whole diff is re-read after changes;
- the result names the exact reviewed head and is labeled author-side, independent, or owner authorization correctly.

A changed head invalidates affected review. A material base change invalidates affected integration evidence.

Before merge:

- PR state, exact accepted head, target, current base/ancestry/mergeability, required checks/reviews/CODEOWNERS/protection/queue, blocking discussion, issue closure, branch/dependent work, and conflicting work are revalidated;
- merge method is deliberate and an expected-head guard is used where supported;
- target protection/history is not bypassed or force-updated;
- post-merge target SHA/tree, issue/branch effects, and dependent work are verified.

## Design hierarchy and simplicity

- Domain truth, authority, purpose, operating bounds, and concern weighting are explicit.
- The component has one coherent responsibility and one visible owner of state/lifecycle.
- LEGO ports, injected dependencies, adapters, and replacement/test boundaries are valid.
- SOLID responsibilities are separated where meaning/change/testing requires it, without ceremonial decomposition.
- CUPID qualities are present: composable, focused, predictable, idiomatic, and domain-based.
- The design is the simplest sufficient **total system**; complexity was not merely moved to callers, generated code, memory, synchronization, recovery, diagnostics, or tests.
- Reusable concepts pass maximum-accurate-generality, second-instance, first-consumer deletion, and inclusion/exclusion tests.
- No forbidden broad manager, service locator, hidden registry, false abstraction, or unbounded resource was introduced.

## Organization and ownership

- Every artifact has a durable product area and component.
- New/moved components have current README, manifest, registry, validation, and migration.
- Root and top-level namespaces remain clean.
- Public/internal boundaries are visible.
- Cross-component dependencies are declared, acyclic, and use public contracts.
- No catch-all helper/common/shared dumping ground or deep import was introduced.
- Placement remains sensible at an order-of-magnitude larger project scale.
- Repo/package/service splits are justified by lifecycle, not file count.

## Contracts and universality

- Inputs, outputs, errors, lifecycle, compatibility, and resource behavior are explicit.
- No first-domain or first-hardware assumption entered a universal contract.
- Specialization remains behind the universal boundary.
- Persistent data, identifiers, and lifetimes remain valid across transitions.

## Concurrency and resources

- Ranges, precision, overflow, capacity, watermarks, and exhaustion are justified.
- Synchronization, publication ordering, cancellation, and stale references are safe.
- Production device-residency requirements remain intact where applicable.

## Evidence

- Validation observes the claimed mechanism and behavior.
- Organization checks and component-owned tests pass.
- Reference/conformance cases pass.
- Performance claims have a fair baseline and quality guardrail.
- Unknowns and unsupported cases are explicit.

## Documentation and publication

- Status, indexes, registry, plan/execution state, component manifests, specifications/ADRs, findings, review state, and supersession are reconciled.
- Third-party provenance and licensing are recorded.
- Final diff/status are intentional.
- The remote target and resulting integrated SHA are verified before publication/merge completion is claimed.
