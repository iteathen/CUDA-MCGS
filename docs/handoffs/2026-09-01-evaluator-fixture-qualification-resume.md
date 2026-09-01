# Evaluator fixture qualification resume — 2026-09-01

## Scope

This checkpoint records the bounded correction for CUDA-MCGS issue #36 / PR #162. It does not change Evaluator oracle behavior, Resource/Progress/Output behavior, native/CUDA realization, tensor math, product semantics, or protected `main`.

## Assess → research → reassess

SPEC-0009 section 18 requires the conformance matrix to exercise a finite resumable evaluator under cache interaction, including mutable-state invalidation. The fifth Composer evaluator fixture already owns the needed mutable state, bounded continuation, pressure/cancellation semantics, and `state-generation` key fact. PR #162 correctly selected the existing cache contract on that same fixture, but `run.mjs` still asserted that its cache kind was `none`.

The observed failure was therefore a stale conformance expectation, not a missing Evaluator abstraction or a reason to add another fixture.

## Implemented correction

Exact semantic correction commit before this documentation commit:

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

## Remaining qualification seam

The corrected fixture changes the shared representation/composition evidence identity. Permanent Graph/Policy jobs may therefore report stale exact Composer-evidence bindings. Those failures must be classified on the current head before any binding is changed.

If the peer failures are only stale exact-evidence bindings, rebind only the dependent evidence owners after confirming their semantic inputs are unchanged apart from the intended Evaluator profile identity. Do not broaden the change into Graph, Policy, native CUDA, Tensor, or product behavior.

## Next action

Run the ordinary PR workflow from this user-authored documentation commit, classify every failing permanent job, and then either:

- rebind only demonstrably stale exact-evidence dependencies and rerun; or
- stop at the first newly demonstrated semantic contradiction.
