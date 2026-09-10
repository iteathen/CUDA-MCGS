# CUDA-MCGS Status

**Status:** #124 complete — protected evaluator composition integrated through PR #266

**Updated:** 2026-09-08

## Agent authority routing

The repository-root `AGENTS.md` is a compatibility/discovery pointer to the account-global `iteathen/.github/AGENTS.md`; it is not a repository-local rule set. Read the current account-global authority first, then `AGENT_LOCAL.md`, then the repository-specific authority it routes to.

For CUDA-MCGS, current local routing is:

- `AGENT_LOCAL.md` — repository mission, ownership split, local hard constraints and validation entry point;
- `agent_files/README.md` — current/legacy agent-document classification;
- `agent_files/SYSTEM_REGISTRY.md` — repository ownership and source-of-truth routing;
- `agent_files/VALIDATION_POLICY.md` — repository-specific evidence selection;
- `docs/decisions/` and `docs/specs/` — accepted local authority;
- this file and `next_step.yaml` — current execution state.

Legacy general-process material retained under `agent_files/` is historical rationale where it overlaps account-global doctrine. It is not a second universal instruction chain.

## Protected #124 completion

PR #266 is protected as `7edf7079f3f6069d076bebd380bdc9c640c57ce8`. The reviewed [assessment and evidence](docs/development/2026-09-08-evaluator-composed-path-124.md) cover immutable artifact binding, complete selected runtime pointers, finite Progress-owned evaluator service opportunities and terminal runtime cleanup/quarantine. The [operation-binding addendum](docs/specs/SPEC-0005-evaluator-resource-binding-addendum.md) is accepted for this bounded profile.

The protected #124 path now demonstrates, without a host gather/launch/poll/relaunch progress loop:

- explicit selected immutable evaluator artifact → Tensor callable pointer → Resource-owned placement binding;
- complete selected runtime pointer/view coverage with exact identity, extent, alignment, access, initialization and device-effect declarations;
- one submitted Search Program operation servicing three device-owned requests across full and partial batches;
- request incarnation/freshness preservation, duplicate-admission pressure handling and stale scatter rejection after slot reuse;
- explicit cancellation-before-service, cancellation-between-batches and Tensor-failure dispositions;
- dependency-ordered terminal cleanup when proved and honest quarantine when lower cleanup cannot be proved;
- portable Node 24/26, installed-package and real public CUDA-JS frontend evidence without promotion to native/provider/hardware support.

The protected #262 Tensor-evaluator audit checkpoint remains `9db49de37c8d9d6507bac70ef62b4095a1d6faa7`; PR #266 builds on rather than replaces that foundation. Original #265/#266 comparison heads remain preserved separately for historical model-comparison evidence.

These are protected foundations. Do not restart the evaluator ownership or immutable-input investigation from zero.

## Post-#124 boundaries

There is no remaining acceptance work inside issue #124. The following are separate future scopes and do not reopen #124 unless the project owner explicitly changes its contract:

1. broader Graph/Search terminal closure profiles beyond the bounded already-published evaluator cohort;
2. dependent readiness, concurrent producers, multi-block service and wider fairness/scheduling profiles;
3. real Tensor/native linking and physical CUDA memory-order/lifecycle qualification on suitable hardware;
4. downstream product/model/checkpoint numerical correctness and performance evidence.

Physical CUDA qualification remains deliberately separate: portable/package/reference results establish only the semantics they execute.

## Accepted physical compatible pair — CUDA-JS #32

The owner-approved [evidence review](docs/evidence/gate-32-2026-09-09/README.md) accepts the exact protected CUDA-MCGS/CUDA-JS pair on Windows x64 / GTX 1660 Ti / driver 610.74 / CUDA 13.3 / Node 26.7.0. One 4 × 256 launch delivered 4096 terminal bytes with Channel release/acquire publication and graceful cleanup. This terminal-only pair does not qualify the broader #124 Tensor/evaluator physical profile, Linux, other hardware, or performance.

## Ownership boundary

CUDA-MCGS owns Search IR/composition, evaluator request identity/incarnation/freshness, finite request/batch/resource semantics, scatter/readiness/publication, Progress/search lifecycle, cancellation/failure/retry dispositions and framework cleanup truth.

CUDA-JS-Tensor owns generic Tensor mathematics, TensorProgram/TensorPlan, item-axis independence, typed callable ABI and Tensor workspace semantics.

CUDA-JS owns consumer-neutral Device-JS/compiler/artifact/module/function/operation/memory/provider/native lifecycle mechanisms.

Product/domain/model/checkpoint/numerical meaning remains downstream. Connect4 is deliberately paused and was not an execution dependency for generic #124 work.

## Hard limits

- No C/C++/CUDA/PTX/native FFI maintained in CUDA-MCGS.
- No Python.
- No private/deep CUDA-JS or CUDA-JS-Tensor imports.
- No product semantics moved upstream.
- No second scheduler, provider registry, Tensor planner/runtime or Resource planner.
- No caller-supplied physical placement escape hatch.
- No host-produced active-search intermediate after ignition in a selected device-resident profile.
- No portable/package/reference evidence promoted to native/provider/hardware support.
- No weakening of exact identity, compatibility, stale-result, lifecycle, cleanup or quarantine truth.
