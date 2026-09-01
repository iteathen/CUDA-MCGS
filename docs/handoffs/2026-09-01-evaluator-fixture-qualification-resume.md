# Evaluator fixture qualification resume — 2026-09-01

**Status:** Informational

## Scope

This checkpoint records the bounded correction for CUDA-MCGS issue #36 / PR #162. It does not change Evaluator oracle behavior, Resource/Progress/Output behavior, native/CUDA realization, tensor math, product semantics, or protected `main`.

## Assess → research → reassess

SPEC-0009 section 18 requires the conformance matrix to exercise a finite resumable evaluator under cache interaction, including mutable-state invalidation. The fifth Composer evaluator fixture already owns the needed mutable state, bounded continuation, pressure/cancellation semantics, and `state-generation` key fact. PR #162 correctly selected the existing cache contract on that same fixture, but `run.mjs` still asserted that its cache kind was `none`.

The observed failure was therefore a stale conformance expectation, not a missing Evaluator abstraction or a reason to add another fixture.

## Implemented correction

Exact semantic correction commit before this documentation sequence:

`2d651d04baf847ccfa71202b81e0c3fab7843d78`

The existing `evaluator-profile-second-instances-distinct` case now asserts that the fifth evaluator simultaneously has:

- mutable state selected;
- bounded continuation;
- cache selected; and
- a cache key containing `state-generation`.

The existing 881-case Composer authority remains unchanged; no new test case, schema, owner, or runtime mechanism was added.

## Qualification evidence

A branch-specific one-shot workflow was used only as a transport workaround because the available GitHub mutation interface replaces whole files and `run.mjs` is very large. The workflow:

1. required exactly one match for the obsolete expectation;
2. applied only the intended block replacement;
3. ran `git diff --check`;
4. ran `node scripts/run-search-ir-composer-reference.mjs`; and
5. removed itself before committing the semantic correction.

Workflow run `33548041083` completed successfully. Because the Composer runner enforces exactly 881 discovered cases and exits nonzero on any failed case, this establishes a green 881-case Composer capsule for the corrected fixture at commit `2d651d04baf847ccfa71202b81e0c3fab7843d78`.

The temporary workflow is absent from the resulting branch tree and is not part of the PR diff.

Ordinary PR workflow `33548198708` then confirmed the corrected Composer capsule at the PR merge subject:

- Composer: `881/881` passed;
- representation/composition evidence key: `1285fa9abdf70ba6902aae0d0f86a14b9a23b2c56b2aa8f5168970c0003124f2`;
- previous frozen key: `115cceb16db3e4a99944c7228e1d5dff7047f342ddbe63a3e695c027d33e85c8`;
- both identities retain canonical byte length `727811`.

The Graph NODE and Policy jobs were inspected directly. Each completed the corrected Composer capsule and its owner projection, then failed only when comparing the new Composer evidence key with the frozen old key. The sibling Graph jobs failed at the same dependency seam. This classifies those failures as stale exact-evidence bindings rather than a demonstrated Graph/Policy semantic failure.

Governance verification failed independently because the first version of this handoff omitted the repository-required `**Status:**` marker. This revision repairs that documentation defect with `**Status:** Informational`.

## Remaining qualification seam

Rebind frozen evidence one owner at a time. For each owner, change only the exact upstream evidence identity that has been demonstrated stale, rerun that owner, and classify any newly exposed downstream mismatch before changing it. Do not mechanically rewrite all hashes at once.

This sequencing matters because rebinding an owner's exact upstream dependency may legitimately change that owner's generated evidence identity, which can then require a separate downstream rebind. A new behavioral failure must stop the chain and return to assessment rather than being treated as identity drift.

No Graph, Policy, Evaluator, Resource, Progress, Output, Session, Stage, Channel, native CUDA, Tensor, or product semantics should change merely to make the exact-evidence chain green.

## Next action

1. Rebind Graph NODE from the frozen Composer key to `1285fa9abdf70ba6902aae0d0f86a14b9a23b2c56b2aa8f5168970c0003124f2` and rerun NODE.
2. If NODE is semantically green, record its resulting evidence identity and advance through EDGE/REF/PATH/ROOT/RECLAIM/ADVANCE/CLEANUP only where their exact upstream identities are now stale.
3. Rebind Policy independently from the same corrected Composer key and rerun Policy.
4. Rerun the aggregate permanent workflow and stop at any non-identity semantic failure.
