# #124 composed evaluator path

**Status:** Proposal

Status: fresh implementation and review candidate. Base: `e2047bf0adcd49c7e31b9715324ce5ee127fc95f` on `codex/124-integration-fresh`.

The owner requested an independent attempt ending in a reviewable PR. The original research branch is preserved separately by explicit owner choice. This attempt uses protected source and accepted contracts; other unmerged implementations and their conclusions are not inputs.

## Outcome and assessment

Demonstrate optional Tensor evaluation through actual Program Package normalization, execution-package projection, one public CUDA-JS operation submission and dependency-ordered terminal cleanup. Portable evidence qualifies only the executed host/composition/device-source semantics. Physical CUDA qualification remains deferred under issue #124.

SPEC-0009 owns artifact identity, request/batch/scatter and evaluator terminal meaning. SPEC-0011 owns resource placement. SPEC-0012 owns service opportunity and closure. SPEC-0005 owns deterministic package identity and operation access. CUDA-JS owns typed views, atomics, barriers, compilation and operation lifetime; public SPEC-0013 already provides `gpu.barrier.block()`, and its accepted publication extension provides device release/acquire. No private lower import or replacement scheduler is justified.

Two composition facts need explicit representation: selected artifact-to-pointer identity and device atomic/publication effects. A host-only admission object would leave both outside the executable package. Inferring effects from source text, names or broad Resource capability envelopes would duplicate authority. The chosen candidate extends resource-source operation bindings, keeping those facts in canonical package identity and mechanically enforcing them at runtime admission. Existing ordinary bindings keep their representation and behavior. Contract additions are proposals pending review and protected integration, not claims of prior acceptance.

## Execution spine

1. **Input/pointer composition:** explicit selected evaluator artifacts, Resource-owned ranges, complete runtime pointer coverage, immutable initialization checks and explicit device effects. Prove normalizer/projection/runtime admission rejection before allocation or writes as appropriate. No Progress mutation before this boundary is complete.
2. **Service composition:** Progress-owned finite single-block service profile using existing public barriers and owner callables. Bind one runtime entry; preserve parallel item work, partial batches and captured incarnations. Reject unsupported profiles rather than inventing generalized scheduling.
3. **Integrated evidence:** actual normalized owner inputs and public-shaped lower execution; normal, cancellation, failure, stale/retry and cleanup/quarantine cases; evaluator absence/substitution; package closure. Any unexecuted surface remains explicitly open.

The final PR must identify the exact head, passing checks, proposed contract changes and remaining qualification. It does not merge itself or close #124 without its acceptance evidence. Material contract or source changes invalidate dependent evidence. Work is sequential by owning boundary; no parallel agents or overlapping writers are used.

## Falsifiers, risk and disposition

Reject wrong artifact/owner/resource identity, mutable or late artifacts, extent/alignment/access drift, immutable/writable overlap, unsupported effects, missing pointers and caller placement. Snapshot all caller initialization bytes before asynchronous writes and verify bound digests before any write. Verify one submission and child-before-parent cleanup; unproved lower terminality retains quarantine rather than reporting release. Cancellation cannot change published terminal truth.

The largest risks are claiming vertical integration from isolated metadata tests, copying Progress-owned state into an evaluator adapter, and accepting a package extension without matching runtime enforcement. Keep the test oracle at the public composition boundary and test actual generated source separately from physical CUDA claims. Use focused checks first, then affected reference/package/aggregate checks. Do not change Node support policy or unrelated reference fixtures as a convenience for local tooling; use Node 26 for this attempt.

Retain the fresh branch/worktree and review PR. Test-created package directories must be removed by their owning harness. Preserve all pre-existing branches, worktrees and recovery state. No native artifacts, production data, remote permission changes or destructive cleanup are part of this task.

## Candidate result and review boundary

All three execution nodes now have portable evidence. The operation binder resolves the existing selected evaluator artifact and every runtime pointer against the actual Resource plan. Program Package carries artifact, zero-initialization and device-effect declarations; runtime admission/ignition verifies their projected constraints and initial bytes. Progress emits a bounded one-block cohort using evaluator-owned aggregate service/cancel/quiescence callbacks. The composed entry admits three requests, services a full and partial batch, and produces checked nonzero results with one submission. Reversed lane order, pressure, cancellation, Tensor failure, reuse/stale scatter, simultaneous ignition and quarantine have falsifiers.

Public CUDA-JS frontend inspection at `844e9392ded7841fdac8b7d2b438e1c6d8cafc85` passes both composed sources: ordinary cohort `b0943a56b077bd41e6430431657f883e8262e663fbb51ab4cf1ae796a34f181d` and reuse `c1539112af9565ad5e2f052d3554d1c355a2cd9c561292e3477624b2124345fb`. It exposed the imported-body header-profile omission; opaque imports now select the combined public profile. The synthetic lower artifact was corrected to the public export/digest/producer shape. This is frontend evidence only, using synthetic Tensor/native outputs. CI repeats it through the exact peer's public export.

Author-side review covers the proposed schema/normalizer/projection contract, owned Resource mapping, generated evaluator/Progress callables, runtime initialization/cleanup, conformance, exports, workflow and documentation. It is not independent approval. Review should especially assess the new 0.2.0 additive contract fields and the intentionally restrictive all-operations launch constraint. Declarations do not infer arbitrary source effects or prove uniform collective entry. Existing deletion/substitution capsules remain the authority for removing Tensor owners; the new composed evidence is bounded to the selected finite cohort.

Focused Tensor/runtime/public-frontend checks and the complete reference integration gate pass locally under Node 26. The reference gate covers 393 reference requirements, 7/7 sensitivity mutations and 52 explicitly deferred native requirements. Changed schema/source identities required refreshing only dependent digest fields through the existing evidence-lock tool, plus three nested schedule evidence keys and the changed Compiler source-blob lock; expected cases, semantics and gates were preserved. Installed-package and exact compatible-pair checks require the committed head and are reported in the PR/CI after commit.

General Graph/Search terminal closure, dependent readiness/concurrent producers, broader service/fairness profiles, real Tensor linking/execution and physical CUDA memory-order/lifecycle qualification remain open. The candidate does not close #124 or authorize a product release. The additive package and finite-cohort contracts are proposals awaiting review and integration. No Node support policy is changed.
