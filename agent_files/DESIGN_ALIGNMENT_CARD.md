# UMCGS Design Alignment Card

Read this before architecture, specification, component creation, implementation, material design review, cleanup/disposition, or PR integration. It intentionally repeats the rules most likely to prevent agent drift. Read deeper doctrine only when the task triggers it.

## Governing hierarchy

```text
project purpose, domain truth, and accepted authority
    → purpose, bounds, and contextual design weighting
    → LEGO component ownership and boundaries
    → SOLID responsibility structure inside each component
    → CUPID implementation quality
    → simplest sufficient total system
    → measured validation, cleanup, and evolution
```

A lower level may improve a design only inside the valid envelope established above it. “Simple” never means omitting required correctness, resources, lifecycle, compatibility, recovery, cleanup, or expected-domain capacity.

## LEGO boundary

Every substantial component is a movable brick with:

- one coherent owned invariant or lifecycle responsibility;
- one visible owner for authoritative state, mutation, and disposition;
- small meaningful domain-named ports;
- composition-visible injected dependencies;
- unstable platform, CUDA, version, format, persistence, and compatibility details behind adapters;
- explicit lifecycle, failure, cancellation, finite-resource, teardown, and cleanup behavior where material;
- isolated contract tests and replaceability without consumer rewrites.

Consumers request changes through contracts. They do not mutate another component’s internals or deep-import private files.

## Universality without vagueness

UMCGS is universal at contracts and compilation boundaries, not through one giant generic runtime object.

- Name the widest truthful invariant, not the first domain or consumer.
- State intended members, permitted variation, and excluded cases.
- Apply the second-instance test: a second intended use should fit by configuration, profile, adapter, or already-permitted extension—not foundational redesign.
- Apply the first-consumer deletion test: a foundation should remain coherent if its first consumer disappears.
- Reject broad `Manager`, `System`, `Common`, `Shared`, `Generic`, `Data`, `Util`, and `Helper` owners that do not state one exact responsibility.

## Foundations and bounds

Before choosing a type, width, identity, schema, collection, queue, precision, or layout, define semantic meaning, units, valid range, cardinality/growth, lifetime, concurrency, persistence/versioning, failure behavior, cleanup/reclamation, and memory/performance budget.

Choose cheap durable capacity across the reasonably expected domain. Reject both ordinary-growth migration traps and speculative subsystems.

## Composition

The composition root selects concrete domain, policy, evaluator, CUDA/platform, persistence, and compatibility adapters. It owns wiring, lifecycle, and coordinated teardown—not domain rules. Dependencies point toward stable contracts.

## Total-system simplicity

Measure complexity across callers, adapters, generation, persistence, migration, failure, recovery, cleanup, operations, diagnostics, tests, and expected second instances. Complexity moved elsewhere is not removed.

Represent essential domain complexity directly. Remove accidental complexity. Reject ceremony that protects no invariant, boundary, responsibility, or operating property.

## Cleanup and disposition

- Cleanup is explicit disposition, not automatic deletion.
- Account for task-created, temporarily modified, superseded, generated, diagnostic, partial, local, remote, sensitive, external, and coordination state.
- Protect user/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, and active dependents.
- Use remove, restore, retain authority/evidence/recovery, archive, quarantine, transfer, supersede, temporary retention with owner/trigger, or protect unchanged.
- Historically useful stale material is archived with provenance; pure task-owned scratch is removed.
- Use narrow exact destructive targets, preview when available, preserve rollback/evidence, and verify actual local/remote state through the owning system.
- Secret exposure requires revocation or rotation; deletion alone is insufficient.
- Cleanup debt is allowed only when immediate cleanup is less safe, and must be exact, bounded, contained, owned, visible, and objectively triggered.
- A clean diff, exited process, successful API response, or merged PR does not by itself prove cleanup.

## Review and merge

- Review the actual complete PR diff and affected integration at one exact head; the PR description and CI are evidence, not proof.
- Every material PR receives complete author-side review. Independent review is required by phase, policy, owner instruction, or objective consequence.
- Label author-side review honestly; it is not independent approval.
- A head change invalidates affected review and cleanup evidence. A material base change invalidates affected integration evidence.
- Blocking findings, questions, unsafe cleanup residue, required checks/reviews/protection, and review threads must be resolved before merge.
- Merge is a separate guarded transaction: recheck current head, target, mergeability, checks, protection, closure, local/remote branch/worktree/dependency effects, cleanup debt, and conflicting work.
- Use an expected-head guard where supported. Never force-update the target or bypass protections.
- Squash is the private pre-release default for one coherent result; use another method only for a real history need.
- Verify the resulting target SHA/tree, issue/branch/worktree/dependent-work effects, and post-merge cleanup before claiming completion.

## UMCGS non-negotiables

- A concrete engine is finite and memory-planned.
- Active production search remains device-closed after ignition.
- Universal contracts do not embed chess, games, one evaluator shape, one action shape, one graph model, or one GPU.
- Generated hot paths may be highly specialized and may eliminate unused abstractions.
- No optimization is accepted without mechanism evidence and semantic/search-quality guardrails.
- Device contexts, allocations, modules, IPC/shared memory, queues, diagnostics, and host resources are released or deliberately retained and verified.

## Design and integration stop conditions

Stop and resolve the boundary before implementation or cleanup when ownership is ambiguous, dependencies cycle, a public contract leaks platform/private types, state has multiple writers, a name implies unsupported generality, the expected second instance forces redesign, resource exhaustion/teardown is undefined, protected state may be destroyed, cleanup cannot be verified, or alleged simplicity merely exports the problem.

Stop PR integration when the reviewed head is stale, the changed surface is unaccounted, a blocker or unsafe cleanup item remains, required evidence/gates are missing, or the target result and post-merge state cannot be verified.

## Deeper doctrine

Start with [`general_foundation/PRINCIPLES.md`](general_foundation/PRINCIPLES.md), then load only the detailed documents relevant to the task, including [`general_foundation/CLEANUP_AND_DISPOSITION.md`](general_foundation/CLEANUP_AND_DISPOSITION.md) for lifecycle/disposition and [`general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md) for PR integration.
