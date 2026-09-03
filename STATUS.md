# CUDA-MCGS Status

**Status:** Active

**Updated:** 2026-09-03

## Protected semantic state

Protected `main@2d7ec1205e7969c29c83ec3c8e98c940e0c38e59` contains the accepted universal semantic/reference packet from #122. Its protected tree is `87c76a72107e55a729a18a101b28fdf17b43387e`.

The accepted packet contains 12 contracts (SPEC-0000 and SPEC-0003 through SPEC-0013), 989/989 classified requirements, 937 `accepted-reference`, exactly 52 `deferred-native`, 0 pending, and the complete 393/393 CUDA-free reference route packet. #122 is closed completed.

This establishes semantic/reference authority only. It does not claim native GPU correctness, physical publication/memory-ordering qualification, performance, stable SDK, multi-GPU support, chess/UCI/product behavior, or an exact CUDA-JS compatible pair.

## Current production seam

The current production owner is **#125 — the public CUDA-JS runtime adapter for accepted execution packages**.

Completed prerequisites:

- #122 protected semantic acceptance/readback;
- #49 production source/private-runtime boundary enforcement, now closed completed and retained as a permanent repository gate;
- #193 CUDA-JS execution-boundary audit.

The first demonstrated lower blocker is **CUDA-JS #193**: accepted CUDA-MCGS resource requirements include ordinary base-allocation alignment requirements of 8 and 256 bytes, while protected `cuda-js@0.1.0-alpha.17` does not yet expose a public ordinary-allocation alignment guarantee. CUDA-MCGS must not assume that native fact or add a private/native workaround.

CUDA-JS draft PR #194 defines the smallest lower authority: a 256-byte minimum for ordinary base allocations only, explicitly excluding arbitrary nonzero-offset views. It remains unmerged pending its normal exact-head review/authorization gate. After the lower public fact is protected-integrated and implemented, #125 can resume resource admission through public contracts.

## Durable v0 outcome owners

- **#32** — durable v0 outcome tracker; no longer a live branch/SHA dashboard.
- **#125** — current base production adapter.
- **CUDA-JS #32** — exact compatible-pair qualification after #125.
- **#109** — one complete public library/resolver surface over accepted semantics.
- **#123** — external-engine embedding and consumer-readiness proof.
- **#124** — optional device-resident Tensor evaluator connector.
- **#37** — first native Linux qualification and representative performance after adapter/pair prerequisites and physical hardware.
- **#105** — independent multi-GPU replicas only after the exact single-device pair.
- **#165** — protected execution-state and issue-obligation freshness governance.

Completed semantic construction issues such as Graph #24, Channel #33 and source-boundary #49 are closed rather than held open solely for generic future native evidence. Snapshot tracker #142 is retired.

## Ownership boundary

CUDA-MCGS owns Search IR, Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel semantics, finite search resource/pressure policy, deterministic restricted Search Program generation, selected search physical-profile policy and translation from accepted execution-package meaning into the runtime adapter.

CUDA-JS owns actual lower request vocabulary, generic device/context/memory/compiler/artifact/module/function/operation/prepared-execution/provider mechanisms, lower validity/compatibility facts, errors/health and lower resource lifecycle.

CUDA-JS-Tensor owns generic Tensor mathematics/device-callable Tensor semantics. Chess/UCI/model-head/Book Forge/Timing Evidence/tablebase/product meaning remains downstream.

A need for native or product-local escape code is a missing-library-capability diagnostic, not permission to violate these ownership boundaries.

## Current-state governance

Protected `STATUS.md` and `next_step.yaml` own the live execution seam. Issues own durable obligations, explicit blockers and concrete evidence cells rather than duplicate live-SHA timelines. Dormant roadmap possibilities do not count as active engineering backlog until a concrete consumer/profile activates them.
