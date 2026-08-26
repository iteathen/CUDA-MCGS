# CUDA-JS-Tensor device-callable readiness disposition

**Status:** Informational

**Disposition:** Exact external dependency available; CUDA-MCGS consumption remains downstream of its current semantic/reference gates

**Date:** 2026-08-26

**CUDA-JS-Tensor:** `cuda-js-tensor@0.1.0-alpha.6`, protected `main@9ecc1d78bca989ec456c897dec215e82ce4cd311`, integrated through [PR #20](https://github.com/iteathen/CUDA-JS-Tensor/pull/20)

**CUDA-JS:** `cuda-js@0.1.0-alpha.16`, protected `main@4971302cfb48431c0843126a59d5884d84a81641`, including selected-runtime target propagation integrated through [PR #149](https://github.com/iteathen/CUDA-JS/pull/149)

## Disposition

The missing consumer-neutral Tensor mechanism identified by CUDA-MCGS evaluator research is now available through public package contracts. CUDA-JS-Tensor SPEC-0009 exposes `compileTensorDeviceProgram(session, programOrPlan, options)`. It compiles one statically item-independent finite Tensor program into one copied typed CUDA-JS leaf library. The exported `tensorRunItem` device function evaluates exactly one selected item; independent caller participants can invoke different items concurrently without a host gather/launch/poll/relaunch loop.

This resolves **mechanism availability**, not CUDA-MCGS integration, evaluator-policy completion or acceleration qualification. CUDA-MCGS production lowering remains forbidden until its accepted semantic packet, dependency-ready engine plan and owning evaluator/resource/progress contracts authorize that work. The immediate CUDA-MCGS target remains `REF-ROOT-CONTROL-01`; Tensor work does not displace it.

## LEGO ownership

CUDA-JS-Tensor owns:

- static item-axis and shared-input independence proof;
- exact admitted dense Tensor mathematics;
- finite typed item/input/output/workspace ABI;
- item-major output layout and dtype-partitioned per-item workspace;
- deterministic generated Device-JS leaf-library compilation and compatibility identity.

CUDA-JS owns:

- selected runtime/device target identity;
- Device-JS validation, translation, library artifact generation, import/link composition and runtime resources;
- rejection of target-incompatible library composition.

CUDA-MCGS continues to own:

- evaluator capability and model-package meaning;
- resident input, output, artifact and workspace allocation;
- ready-request selection, batching compatibility, fairness and partial-batch progress;
- request/result incarnation, scatter, publication, cancellation and cache/root-advance validity;
- physical participant scheduling and all search-policy consequences;
- per-GPU model replication, local queues and cross-GPU result/termination coordination.

No owner is duplicated. Removing the Tensor profile leaves the complete non-tensor evaluator path required by ADR-0024; removing CUDA-MCGS leaves the public Tensor callable useful to other independent-item consumers.

## Multi-GPU disposition

CUDA-JS-Tensor v1 deliberately keeps one `TensorSession` bound to one selected CUDA-JS runtime/device. A CUDA-MCGS multi-GPU profile creates one independent session and compatible compiled Tensor program per participating GPU. CUDA-JS alpha.16 ensures each program follows its selected runtime target; portable evidence distinguishes `compute_75` and `compute_89` sessions.

CUDA-JS-Tensor does not own a cross-device tensor identity, P2P transport, collective, sharding policy or multi-device scheduler. CUDA-MCGS issue #105 remains the owner of independent-replica search/package/result meaning. Simultaneous physical multi-GPU execution and speedup remain unqualified until contributor hardware evidence exists.

## Exact evidence and limits

The Tensor implementation source head `6c2b3570f0f326cdceb30e6540435ff3e5df92a9` passed 71/71 package tests before protected squash integration. The packed-package test consumes only public root exports and composes the returned library into an unrelated Device-JS program. The exact installed-package native fixture on Node 26.7.0, Windows, CUDA 13.3 and GTX 1660 Ti / compute capability 7.5 executed four independent matmul-plus-bias-plus-fixed-tree-reduction items, rejected four excess indices without Tensor writes and closed the Tensor session/CUDA-JS runtime gracefully with zero live or orphaned resources.

That evidence establishes one correctness/lifecycle cell. It does not establish Linux support, CUDA-MCGS integration, representative batch occupancy, speedup, Tensor Core use, cooperative intra-item execution, simultaneous multi-GPU behavior, automatic tensor selection or production stability.

## Later CUDA-MCGS consumption sequence

When the CUDA-MCGS native evaluator leaf becomes dependency-ready:

1. freeze one accepted evaluator/model package, one non-tensor correctness fallback and exact per-device resource formulas;
2. resolve the selected CUDA-JS runtime and CUDA-JS-Tensor session once per participating GPU before ignition;
3. compile/import one compatible item program per selected target before ignition;
4. allocate model inputs, item-major outputs and declared per-item workspace as resident CUDA-MCGS-owned resources;
5. have the selected Device-JS progress profile dequeue ready evaluator items and call `tensorRunItem` without host-produced intermediates;
6. validate request incarnation and publish/scatter results through CUDA-MCGS-owned evaluator/progress contracts; and
7. compare the complete boundary against the best credible non-tensor parallel profile before recommending tensor acceleration.

The first integration should use the callable correctness profile as-is. Block/warp-cooperative or provider-specific intra-item acceleration is a separate removable child only if representative shapes and measurements justify it.
