# CUDA-MCGS Status

**Status:** Active

**Updated:** 2026-09-03

## Protected semantic state

Current protected `main@d0ddaeba8708df1d462c935621d35556a1d82c3f` contains the post-review current-state reconciliation. The accepted universal semantic/reference packet itself was protected-integrated by #122 at `2d7ec1205e7969c29c83ec3c8e98c940e0c38e59`, tree `87c76a72107e55a729a18a101b28fdf17b43387e`.

The accepted packet contains 12 contracts (SPEC-0000 and SPEC-0003 through SPEC-0013), 989/989 classified requirements, 937 `accepted-reference`, exactly 52 `deferred-native`, 0 pending, and the complete 393/393 CUDA-free reference route packet. #122 is closed completed.

This establishes semantic/reference authority only. It does not claim native GPU correctness, physical publication/memory-ordering qualification, performance, stable SDK, multi-GPU support, chess/UCI/product behavior, or an exact CUDA-JS compatible pair.

## Current production seam

The production connector owner remains **#125 — the public CUDA-JS runtime adapter for accepted execution packages**, but implementation research exposed one MCGS-owned prerequisite before adapter code can remain mechanical: **#199 — operation-local resource access projection**.

Completed prerequisites now include:

- #122 protected semantic acceptance/readback;
- #49 production source/private-runtime boundary enforcement, closed completed and retained as a permanent repository gate;
- #193 CUDA-JS execution-boundary audit;
- CUDA-JS #193 ordinary base-allocation alignment authority and implementation, protected-integrated as `cuda-js@0.1.0-alpha.18` on `iteathen/CUDA-JS@49a2f77d2c8364d67030fbc1c2e870e58e70d334`.

The demonstrated remaining blocker is **not a CUDA-JS mechanism gap**. The accepted execution-package representation gives each resource a broad `read/write/atomic/publish` capability envelope, while an operation resource binding names only the resource. Public CUDA-JS prepared/launch admission needs concrete operation-local access. `integration.cuda-js` cannot safely choose that access from the broad envelope and is forbidden to parse restricted Device-JS source to infer it.

#199 therefore owns the minimum package correction: an MCGS operation binding may explicitly project ordinary `read`, `write` or `read-write` access. Resource-level access requirements remain the broad provider/capability envelope. Atomic/publication effects remain fail-closed until a selected accepted extension supplies their additional operation-local meaning.

Historical 0.2.0 Program Package/execution-package evidence remains valid and byte-identifiable. A historical resource binding without operation-local access is not runtime-realizable through `integration.cuda-js`; it fails pre-ignition rather than being reinterpreted.

After #199 authority plus schema/reference evidence are protected-integrated, #125 resumes against public CUDA-JS alpha.18. Any later genuine generic lower gap still routes to CUDA-JS; no private/native workaround is permitted.

## Durable v0 outcome owners

- **#32** — durable v0 outcome tracker; no longer a live branch/SHA dashboard.
- **#199** — current execution-package operation-local access prerequisite.
- **#125** — base production CUDA-JS adapter after #199.
- **CUDA-JS #32** — exact compatible-pair qualification after #125.
- **#109** — one complete public library/resolver surface over accepted semantics.
- **#123** — external-engine embedding and consumer-readiness proof.
- **#124** — optional device-resident Tensor evaluator connector.
- **#37** — first native Linux qualification and representative performance after adapter/pair prerequisites and physical hardware.
- **#105** — independent multi-GPU replicas only after the exact single-device pair.
- **#165** — protected execution-state and issue-obligation freshness governance.

Completed semantic construction issues such as Graph #24, Channel #33 and source-boundary #49 are closed rather than held open solely for generic future native evidence. Snapshot tracker #142 is retired.

## Ownership boundary

CUDA-MCGS owns Search IR, Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel semantics, finite search resource/pressure policy, deterministic restricted Search Program generation, selected search physical-profile policy, operation-local execution-package meaning and translation from accepted package meaning into the runtime adapter.

CUDA-JS owns actual lower request vocabulary, generic device/context/memory/compiler/artifact/module/function/operation/prepared-execution/provider mechanisms, lower validity/compatibility facts, errors/health and lower resource lifecycle.

CUDA-JS-Tensor owns generic Tensor mathematics/device-callable Tensor semantics. Chess/UCI/model-head/Book Forge/Timing Evidence/tablebase/product meaning remains downstream.

A need for native or product-local escape code is a missing-library-capability diagnostic, not permission to violate these ownership boundaries.

## Current-state governance

Protected `STATUS.md` and `next_step.yaml` own the live execution seam. Issues own durable obligations, explicit blockers and concrete evidence cells rather than duplicate live-SHA timelines. Dormant roadmap possibilities do not count as active engineering backlog until a concrete consumer/profile activates them.
