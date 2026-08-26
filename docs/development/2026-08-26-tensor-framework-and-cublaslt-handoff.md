# CUDA-MCGS tensor-framework and CUDA-JS-Tensor cuBLASLt handoff

**Status:** Informational

**Handoff state:** CUDA-JS prerequisite and CUDA-JS-Tensor implementation integrated on protected remotes; CUDA-MCGS framework research preserved on an unmerged remote branch

**Handoff preparation started:** 2026-08-26T07:33:40.0522872-07:00

**CUDA-MCGS research content checkpoint:** `748351f4dc8c228eb19e397b29b38419b868b6d1`

## Parent task, objective, product area, and component

The owner-directed objective was to keep CUDA-MCGS a complete, progressively disclosed universal MCGS framework while making optional neural evaluation and tensor acceleration first-class framework capabilities. Particular prospective-evaluation, beam, adaptive-depth/width, reservoir, and tensor-capacity-filling techniques remain future selected strategy/product experiments rather than universal search behavior.

The generic matrix/tensor execution mechanism discovered by that research belongs to the separate CUDA-JS-Tensor repository and, where CUDA-native library execution is required, to consumer-neutral public CUDA-JS contracts. `the_restaurant` is a future integration consumer; its implementation was explicitly deferred and was not modified.

CUDA-MCGS's immediate target remains `ENGINE-REFERENCE-01`, specifically the root-control reconciliation tracked by [CUDA-MCGS issue #113](https://github.com/iteathen/CUDA-MCGS/issues/113). Tensor work must not displace or silently gate that target.

## Authority and design alignment

- CUDA-MCGS authority continues to require JavaScript-only maintained production source, device-owned active-search progress, universal contracts with specialized generated hot paths, finite resources, exact selected-only deletion, and no private/native CUDA workaround.
- [ADR-0024](../decisions/ADR-0024-first-class-neural-evaluator-and-tensor-acceleration.md) makes the optional neural connector and qualified tensor execution first-class framework features while preserving complete evaluator-absent, non-neural, and non-tensor profiles.
- [ADR-0025](../decisions/ADR-0025-framework-versus-technique-ownership-for-prospective-evaluation.md) separates reusable framework seams from speculative technique ownership.
- The supporting [tensor-math research assessment](../research/2026-08-25-tensor-math-in-mcgs-assessment.md) records the evidence, unresolved shape/timing questions, and measured-experiment lane.
- CUDA-JS owns public provider, prepared-operation, resource, lifecycle, and native CUDA library mechanisms. CUDA-JS-Tensor owns tensor semantics, planning, backend selection, and lowering through those public contracts. CUDA-MCGS owns evaluator/search meaning and may later consume CUDA-JS-Tensor through a public adapter.
- LEGO boundaries were preserved: no second scheduler, private import, CUDA-MCGS-native source, live host inference loop, tensor-shaped authoritative graph state, or `the_restaurant` coupling was introduced.

## Completed remote outputs

### CUDA-JS prerequisite

- Public mixed prepared-operation DAG support for kernel and fixed cuBLASLt f32 matmul nodes was integrated in [CUDA-JS PR #146](https://github.com/iteathen/CUDA-JS/pull/146).
- Implementation head: `941ceb79a406969df5419b6ae4e42f09ad869198`.
- Implementation merge: `20f831cc51766aee726313f7f78819b576d56307`.
- Status reconciliation was integrated in [CUDA-JS PR #147](https://github.com/iteathen/CUDA-JS/pull/147).
- Final protected `main`: `af29b95e0707b36b88ee4e234c25a9e7f7ed3a1d`.
- Package: `cuda-js@0.1.0-alpha.15`.
- [CUDA-JS issue #145](https://github.com/iteathen/CUDA-JS/issues/145) is closed.

The public contract keeps one prepared-operation lifecycle for a mixed dependency DAG. The native kernel -> cuBLASLt -> kernel fixture completed correctly with output `[58, 64, 139, 154]`, one prepared batch, and zero live or orphaned resources.

### CUDA-JS-Tensor implementation

- Host-planned optional cuBLASLt matmul lowering was integrated in [CUDA-JS-Tensor PR #10](https://github.com/iteathen/CUDA-JS-Tensor/pull/10).
- Feature head: `654ed255611ba30b7f6131af015e0427d7bc43ef`.
- Implementation merge: `8910309a0aff9b8da4fc281949068d8d1fcaa6ea`.
- Status reconciliation was integrated in [CUDA-JS-Tensor PR #11](https://github.com/iteathen/CUDA-JS-Tensor/pull/11).
- Final protected `main`: `7587ed8460cdeac8e5635e4fb2d11b7807960a9e`.
- Package: `cuda-js-tensor@0.1.0-alpha.4`, with exact dependency `cuda-js@0.1.0-alpha.15`.
- [CUDA-JS-Tensor issue #8](https://github.com/iteathen/CUDA-JS-Tensor/issues/8) is closed.

Accepted `SPEC-0006` adds three explicit backend policies:

- `simt`, the default;
- `prefer-cublaslt`, which selects eligible cuBLASLt nodes and truthfully falls back; and
- strict `cublaslt`, which rejects ineligible or resource-infeasible plans.

Eligibility is deliberately narrow: nonempty contiguous rank-2 f32 matmul with no active extents, derived offsets, striding, or batching. Selected nodes replace the corresponding SIMT kernel at the same DAG identity and dependency position. All other maintained tensor operations retain the complete SIMT lowering path. Default selection remains SIMT because no representative performance evidence yet supports automatic acceleration.

The resolved identity records policy, aggregate and per-node backend, fallback reasons, provider/profile, plan facts, resource gates, workspace, and prepared identity. Workspace is explicit per run. One shared public cuBLASLt adapter lease is owned per runtime, resolved plans own fixed plans, and dependency closure order is defined.

## Validation and claim limits

CUDA-JS validation used the repository's exact Node.js 26.7 toolchain. Full verification and the native mixed prepared-DAG fixture passed. Both CUDA-JS PRs report successful required checks, including `verify`, Node compatibility, schema, and CodeQL jobs.

CUDA-JS-Tensor exact Node.js 26.7 `npm run verify` passed 45/45 cases. Its unrelated packed consumer passed, 88 maintained files were accounted for, and no maintained native source was introduced. Installed-package native evidence used Windows, CUDA 13.3, compute capability 7.5 on a GTX 1660 Ti, and cuBLASLt 13.5.1. It retained the complete 10-kernel SIMT replay and passed mixed kernel -> cuBLASLt -> kernel replay twice plus strict double-transpose output `[58, 64, 139, 154]`; session teardown was graceful and CUDA-JS reported zero live and orphaned resources. Both Tensor PR `verify` checks passed.

CUDA-MCGS's required full documentation gate passed with exit 0 through `C:\Program Files\Git\bin\bash.exe ./scripts/verify-docs.sh` after this handoff was added. It reproduced the 878/878 Search IR/Composer capsule and 49/49 semantic-reference capsule with zero failures or skips, then reported all documentation, authority-reading, discoverability, organization, engineering-judgment, focus-branch, token-backpressure, testing, governance, and cleanup checks passed. The first invocation through an unqualified `bash` command failed before repository code ran because Bash was not on `PATH`; selecting the verified Git Bash executable resolved that environment-only invocation error.

Independent review was unavailable and was honestly waived under the project owner's sole-maintainer direction. Author-side exact-head review and protected-branch checks were completed. This does not create an independent-review claim.

No performance, Tensor Core use, CUDA Graph, Linux, broader provider/device, batched GEMM, multi-GPU, automatic-default, CUDA-MCGS integration, or `the_restaurant` integration claim is made. The native evidence is one exact Windows/device/provider cell. CUDA-MCGS's OS-neutral/Linux-first qualification direction remains unchanged.

## CUDA-MCGS branch state

The framework research is preserved on `origin/codex/tensor-mcgs-research`. Before this handoff file, its exact clean head was `748351f4dc8c228eb19e397b29b38419b868b6d1`, based on protected CUDA-MCGS `main@173765cf86fc6ab91364d8d52eb6a045dcbe2346`. The branch contains:

- ADR-0024 and ADR-0025;
- the tensor-math research assessment;
- forward-plan, status, decision-index, research-index, and next-step routing updates.

No CUDA-MCGS PR has been opened for this branch and none of its research documents is integrated into protected `main`. Remote preservation is recovery and continuation state, not acceptance or merge.

## Cleanup and disposition

- The CUDA-JS and CUDA-JS-Tensor task worktrees were removed after protected-target readback; their task branches were deleted locally and remotely after merge.
- The CUDA-JS-Tensor primary checkout at `C:\Users\josho\OneDrive\Documents\ChatGPT\CUDA-JS-Tensor` is clean on `main@7587ed8460cdeac8e5635e4fb2d11b7807960a9e`, equal to `origin/main`.
- CUDA-JS protected remote `main` is `af29b95e0707b36b88ee4e234c25a9e7f7ed3a1d`.
- The pre-existing CUDA-JS primary checkout on `codex/capability-expansion-roadmap` remains intentionally dirty user state and was not modified or cleaned by this work.
- The pre-existing detached dirty audit worktree `C:\Users\josho\AppData\Local\Temp\cuda-js-pr99-audit-019ff9e3` remains protected. Its broad tracked deletions were not created by this task and must not be removed without separate authority.
- Other long-lived CUDA-JS worktrees remain pre-existing and untouched.
- Five stale CUDA-JS worktree metadata remnants with no live `gitdir` or lock, plus two clean obsolete temporary worktrees, were removed only after exact ownership and path verification. No active worktree was deleted.
- No `the_restaurant` file, branch, issue, package, model, process, device context, or remote state was changed. Its retained future-integration plan is `C:\Users\josho\OneDrive\Documents\ChatGPT\CUDA-JS-Tensor\docs\integrations\the_restaurant.md`.
- No task-created process, port, container, lock, credential, release, or GPU context remains.

## Recovery and next continuation boundary

Immutable recovery points are CUDA-JS `main@af29b95e0707b36b88ee4e234c25a9e7f7ed3a1d`, CUDA-JS-Tensor `main@7587ed8460cdeac8e5635e4fb2d11b7807960a9e`, and the final remote head of `codex/tensor-mcgs-research` containing this handoff. No history rewrite or irreversible product-data operation occurred.

Resume in this order:

1. Review and, when authorized, integrate the CUDA-MCGS research branch without changing the immediate `ENGINE-REFERENCE-01` sequencing.
2. Continue CUDA-MCGS with `REF-ROOT-CONTROL-01` under issue #113; do not begin CUDA-MCGS tensor implementation from this handoff.
3. In CUDA-JS-Tensor, reassess the second-instance value and exact public CUDA-JS SPEC-0028 provider/resource/participation boundary before opening a new implementation issue or accepting a child specification. The recorded focus is `TENSOR-DEVICE-DENSE-014` with status `cublaslt_integrated_next_profile_assessment_pending`.
4. Defer `the_restaurant` integration until both projects expose a stable enough public boundary and the deferred plan is deliberately reactivated.
5. Keep representative performance, additional providers/operations, Linux/device coverage, batching, tensor recommendation policy, multi-GPU behavior, and prospective-evaluation techniques in their measured, separately owned future lanes.
