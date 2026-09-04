# CUDA-MCGS Status

**Status:** Active

**Updated:** 2026-09-03

## Protected semantic state

Current protected `main@b99bbc44c99cbff5ee239ae89402fa6e7074d987`, tree `eead5fef1787d7c662d902d0cbea862e6d56190b`, contains the accepted universal semantic/reference packet plus the protected operation-local resource-access correction from #199/#201.

The accepted packet still contains 12 contracts, 989/989 classified Composer requirements, 937 `accepted-reference`, exactly 52 `deferred-native`, 0 pending, and the complete 393/393 CUDA-free reference route packet. This remains semantic/reference authority only; it does not claim native GPU correctness, physical publication/memory-order qualification, performance, stable SDK, multi-GPU support, product behavior, or an exact CUDA-JS compatible pair.

## Current production seam

The production connector owner remains **#125 — the public CUDA-JS runtime adapter for accepted execution packages**.

#125 was resumed from protected `main@b99bbc44c99cbff5ee239ae89402fa6e7074d987` and deliberately stopped **before production mutation** when implementation preflight demonstrated one additional MCGS-owned representation prerequisite: **#202 — bounded external control sideband projection**.

The demonstrated defect is not a missing CUDA-JS mechanism. Public CUDA-JS `main@49a2f77d2c8364d67030fbc1c2e870e58e70d334`, package `cuda-js@0.1.0-alpha.18`, already exposes the required generic public primitives, including finite publication mailboxes, release/acquire host-to-device u32 publication signals, bounded operation lifecycle, and public device-memory writes.

The MCGS package gap is that accepted lifecycle cancellation is currently only the abstract fact `bounded-external-intent`, operation bindings can identify only resource/scalar sources, and selected Search Session public publication requirements are not generically closed into Program Package requirements. A concrete adapter therefore cannot mechanically wire external cancellation/Session command publication without inventing semantics.

The first hosted falsifier on `spec/202-external-control-sideband-authority@ce37b6c8b5e362f7334640337d85738c347c6269` proved exactly five missing facts in Engine reference integration run `33829705998`: base cancellation sideband, base cancellation binding, selected-Session publication requirement closure, selected-Session publication sideband, and selected-Session binding. Existing Search IR remained green before that falsifier.

## Current authority transaction

**PR #203** is the docs-only authority transaction for #202. It accepts `docs/specs/SPEC-0005-external-control-sideband-addendum.md` and reconciles repository execution state. The red executable verifier has been removed from the authority PR after evidence capture; executable schema/reference changes belong to the dependent #202 implementation transaction after protected authority integration.

The accepted addendum keeps the LEGO boundary explicit:

- Framework / Progress own cancellation, first-cause and stop/drain semantics.
- Search Session owns optional command semantics and authoritative 128-bit command identity/generation.
- Program Package owns generic sideband representation, binding and selected-owner public-requirement closure.
- `integration.cuda-js` later maps those accepted generic facts mechanically to versioned public CUDA-JS contracts.
- CUDA-JS owns publication-mailbox, memory, launch, lifecycle, health and teardown mechanisms.

A Session publication u32 signal is only a release/acquire notification/fence. It MUST NOT become the authoritative Session command generation: accepted Session command-id and command-generation counters are 128-bit and remain in resident MCGS control payload.

## Completed prerequisites

- #122 protected semantic/reference acceptance and readback.
- #49 production source/private-runtime boundary enforcement, closed completed and retained as a permanent gate.
- CUDA-JS execution-boundary audit and public alpha.18 ordinary allocation-alignment guarantee.
- #199/#201 operation-local resource-access projection, protected-integrated at `b99bbc44c99cbff5ee239ae89402fa6e7074d987`.

## Immediate dependency chain

1. Qualify/review/authorize/protect-integrate #203, the #202 authority addendum.
2. Construct #202 schema/reference implementation red-before-green on a separate implementation branch, reintroducing a permanent sideband verifier and propagating identity evidence without weakening validation.
3. Protect-integrate the qualified #202 implementation under a fresh authorization.
4. Resume #125 from that protected package boundary; the existing paused `impl/125-public-cuda-js-runtime-adapter` branch remains untouched at `b99bbc44c99cbff5ee239ae89402fa6e7074d987` and must be refreshed from the later protected base before implementation.
5. CUDA-JS #32 then owns exact compatible-pair/native publication, race, cancellation and teardown evidence through #125.

## Durable v0 outcome owners

- **#32** — durable v0 outcome tracker.
- **#202 / PR #203** — current external-control sideband authority prerequisite.
- **#125** — production public CUDA-JS adapter after #202.
- **CUDA-JS #32** — exact compatible-pair/native qualification after #125.
- **#109** — complete public library/resolver surface.
- **#123** — external-engine embedding/readiness proof.
- **#124** — optional device-resident Tensor evaluator connector.
- **#37** — first native Linux qualification and representative performance after adapter/pair prerequisites and physical hardware.
- **#105** — independent multi-GPU replicas only after the exact single-device pair.
- **#165** — protected execution-state and issue-obligation freshness governance.

## Ownership boundary

CUDA-MCGS owns Search IR, Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel semantics, finite search resource/pressure policy, deterministic restricted Search Program generation, selected search physical-profile policy, operation-local and sideband execution-package meaning, and translation from accepted package meaning into the runtime adapter.

CUDA-JS owns actual lower request vocabulary, generic device/context/memory/compiler/artifact/module/function/operation/publication/provider mechanisms, lower validity/compatibility facts, errors/health and lower resource lifecycle.

CUDA-JS-Tensor owns generic Tensor mathematics/device-callable Tensor semantics. Chess/UCI/model-head/Book Forge/Timing Evidence/tablebase/product meaning remains downstream.

A need for native or product-local escape code is a missing-library-capability diagnostic, not permission to violate these ownership boundaries.

## Current-state governance

Protected `STATUS.md` and `next_step.yaml` own the live execution seam. Issues own durable obligations, explicit blockers and concrete evidence cells rather than duplicate live-SHA timelines. Dormant roadmap possibilities do not count as active engineering backlog until a concrete consumer/profile activates them.
