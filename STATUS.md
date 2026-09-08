# CUDA-MCGS Status

**Status:** #124 review candidate — immutable input/pointer composition and bounded device cohort integration

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

## Protected #124 checkpoint

The fresh candidate starts from protected main `e2047bf0adcd49c7e31b9715324ce5ee127fc95f`. Its [assessment and evidence](docs/development/2026-09-08-evaluator-composed-path-124.md) cover immutable artifact binding, complete selected runtime pointers, finite Progress opportunities and terminal runtime cleanup/quarantine. The [contract additions](docs/specs/SPEC-0005-evaluator-resource-binding-addendum.md) are proposals for review. The original research branch and prior attempts are preserved separately. General Graph/Search closure, dependent/concurrent producers, broader physical service profiles and native CUDA qualification remain open; #124 is not closed by this bounded candidate.

Protected CUDA-MCGS `main` is `9db49de37c8d9d6507bac70ef62b4095a1d6faa7`, produced by PR #262 after exact-head portable/package/reference qualification.

The protected Tensor evaluator slice now includes:

- public Tensor callable/import admission with Tensor-owned element-count, dtype-width and alignment facts preserved;
- finite evaluator-owned request/batch/result/staging runtime contribution with stale-safe incarnation checks, cancellation, retry and publication semantics;
- exact evaluator Program source/function/import ownership without Resource/Tensor-storage relay through Program Binding;
- separate request-control and batch-control representation ownership;
- direct Runtime-to-Resource binding with exact generated source identity verification;
- Resource-owned class → partition → pool → provider placement verification;
- portable installed-package evidence without native/provider/hardware promotion.

These are protected foundations. Do not restart the evaluator ownership audit from zero.

## Remaining #124 order

The remaining architectural order is:

1. bind shared immutable Tensor inputs through the correct selected evaluator/product/artifact owner without making the generic Tensor adapter invent semantics;
2. complete the Resource/runtime-entry pointer-binding ABI for every required mutable and immutable device input;
3. integrate the evaluator service opportunity into Progress-owned runtime-entry/service order while preserving one submitted Search Program operation and no host gather/launch/poll/relaunch progression;
4. prove terminal cross-owner cleanup/disposition across evaluator, Resource, Progress, Search lifecycle and lower CUDA-JS/Tensor resources;
5. retain native/provider/hardware qualification as a separate deferred physical-evidence gate.

Progress integration must not be implemented against an incomplete pointer-binding ABI.

## Ownership boundary

CUDA-MCGS owns Search IR/composition, evaluator request identity/incarnation/freshness, finite request/batch/resource semantics, scatter/readiness/publication, Progress/search lifecycle, cancellation/failure/retry dispositions and framework cleanup truth.

CUDA-JS-Tensor owns generic Tensor mathematics, TensorProgram/TensorPlan, item-axis independence, typed callable ABI and Tensor workspace semantics.

CUDA-JS owns consumer-neutral Device-JS/compiler/artifact/module/function/operation/memory/provider/native lifecycle mechanisms.

Product/domain/model/checkpoint/numerical meaning remains downstream. Connect4 is deliberately paused and is not an execution dependency for generic #124 work.

## Hard limits

- No C/C++/CUDA/PTX/native FFI maintained in CUDA-MCGS.
- No Python.
- No private/deep CUDA-JS or CUDA-JS-Tensor imports.
- No product semantics moved upstream.
- No second scheduler, provider registry, Tensor planner/runtime or Resource planner.
- No caller-supplied physical placement escape hatch.
- No host-produced active-search intermediate after ignition in the selected device-resident profile.
- No portable/package/reference evidence promoted to native/provider/hardware support.
- No weakening of exact identity, compatibility, stale-result, lifecycle, cleanup or quarantine truth.
