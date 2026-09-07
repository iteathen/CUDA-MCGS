# CUDA-MCGS Status

**Status:** #124 resumed — device-resident evaluator lifecycle is the active seam

**Updated:** 2026-09-07

## Current execution seam

By explicit project-owner instruction, **#124 — Device-resident evaluator connector through public CUDA-JS-Tensor — is resumed and active**.

Execution branch: `feature/124-device-resident-evaluator` from protected `main@893a1676a303bf28aff8f24847b0be1559ba859c`.

Preserve all valid protected foundations. Do not restart evaluator/search semantic design or the public Tensor/CUDA-JS composition work from zero.

## Protected #124 foundations

Already protected before resumption:

- accepted evaluator/search semantics through #122;
- public CUDA-JS runtime/compatible-pair production path through #125;
- public external Device-JS import composition through PR #241;
- stateless public Tensor evaluator device-binding foundation through PR #244;
- public CUDA-JS-Tensor `TensorDeviceProgram` / item-axis callable / workspace facts;
- public CUDA-JS memory/view/compiler/import/lifecycle mechanisms needed by the bounded connector;
- design-principle alignment and corrected child-before-parent runtime-adapter cleanup from `main@893a1676...`.

These are evidence/authority to preserve, not permission to duplicate lower owners.

## Active generic outcome

Complete the CUDA-MCGS-owned runtime bridge between accepted evaluator lifecycle semantics and the already-public Tensor/Device-JS callable binding:

- request identity, incarnation and freshness;
- finite device-owned request accumulation;
- full and partial batch formation;
- request/item mapping;
- result scatter, readiness and publication;
- stale-result rejection across slot reuse;
- explicit resource/workspace pressure;
- failure, cancellation and unavailable-capability dispositions;
- retryability;
- evaluator-free and non-Tensor deletion/substitution;
- terminal or truthfully quarantined cleanup.

The bounded selected semantic profile must not require a host gather/launch/poll/relaunch loop to advance active evaluator work after ignition.

## Ownership boundary

CUDA-MCGS owns Search IR, Graph, Policy, Evaluator, Resource, Progress, Output, Session, Stage, Channel, finite search-resource/pressure policy, deterministic Search Program generation, and canonical pre-ignition composition.

CUDA-JS-Tensor owns generic Tensor mathematics, TensorProgram/TensorPlan, item-axis independence, typed callable ABI and Tensor workspace.

CUDA-JS owns consumer-neutral Device-JS/compiler/artifact/module/function/operation/memory/provider/lifecycle mechanisms.

Product/domain/model/checkpoint/numerical meaning remains downstream. Connect4 is deliberately paused and is not an execution dependency for #124.

## First execution gate

Before mutation of the runtime seam:

1. read the actual evaluator semantic ports, Program Package, Tensor connector, CUDA-JS runtime adapter, lifecycle/cleanup code and their tests from protected main;
2. identify the smallest single-owner implementation seam for device-owned evaluator request/batch/scatter state;
3. prove deletion/substitution and no host-driven active-search progression in the design before broad implementation;
4. implement and qualify in ownership-sized units with portable evidence only;
5. keep physical NVIDIA qualification deferred unless direct hardware evidence is actually available.

## Hard limits

- No C/C++/CUDA/PTX/native FFI maintained in CUDA-MCGS.
- No Python.
- No private/deep CUDA-JS or CUDA-JS-Tensor imports.
- No product semantics moved upstream.
- No second scheduler/provider registry/Tensor planner/runtime.
- No host-produced active-search intermediate after ignition in the selected device-resident profile.
- No portable/package evidence promoted to native/provider/hardware support.
- No weakening of exact evidence, compatibility, lifecycle, cleanup or quarantine truth.

## Product handoff

Connect4 has secured its C4-0001 through C4-0005 baseline and recorded the dependency map. When #124 is protected-complete enough to expose the public executable evaluator lifecycle, Connect4 can resume downstream and freeze its comparison contract without pushing Connect Four semantics into CUDA-MCGS.
