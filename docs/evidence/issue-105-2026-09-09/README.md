# Issue #105 single-GPU prerequisite evidence

**Status:** Informational

Executed 2026-09-09 America/Los_Angeles (2026-09-10 UTC). Issue [#105](https://github.com/iteathen/CUDA-MCGS/issues/105) remains open: this records the single-device subset, not multi-GPU acceptance. The previously owner-approved [gate #32 proof](../gate-32-2026-09-09/README.md) is preserved unchanged.

## Exact subject and results

- CUDA-MCGS: `046ad15b148771e29c594be258c0ddfb21b00c22`, tree `47445b6bab9674a9514db64271bc6d1ca4c9f7c3`.
- CUDA-JS: `97c0295ab79add204d4d8ced080a4da4b66149cf`, tree `ce03b3b9f598776c8d9e8ec6a59245da75941eb8`, package `cuda-js@0.1.0-alpha.19`, API schema 1.
- Both tracked source trees were clean for execution. CUDA-JS was linked through the public package using a junction to this exact checkout; its existing locked Acorn dependency was reused.
- Native Windows x64, Node 26.7.0 / ABI 147 with `--experimental-ffi`; one visible GTX 1660 Ti, driver 610.74, CUDA Driver API 13030, compute_75/sm_75. Exact OS, provider hashes, compiler inputs/artifacts and lifecycle facts are in each native JSON. Hardware name/driver package were observed with `nvidia-smi`; public runtime discovery records count 1 and sanitized architecture facts.

| Check | Result and evidence |
| --- | --- |
| Unmodified physical compatible-pair runner, default selection | PASS, 1/1, [native.json](native.json) |
| Supplemental public opaque explicit selection of the sole discovered GPU, same capsule/oracle | PASS, 1/1, [explicit-native.json](explicit-native.json) |
| Exact-pair portable capsule | PASS, 17/17: C00 and F01–F16, [portable.txt](portable.txt) |
| Adapter portable lifecycle capsule | PASS, 20/20 reported cases plus pre-ignition/resource-view/cleanup assertions, [adapter.txt](adapter.txt) |
| CUDA-JS device-selection owner unit tests | PASS, 7/7, [device-selection.txt](device-selection.txt) |

All invoked commands exited 0; no failed or skipped cases were reported by these capsules. The seven selection unit tests use synthetic inventories, including multiple devices; they do not establish physical distinct-device behavior.

Both native executions independently matched all 1024 terminal u32 words: word 1 is 305419897 (published payload 305419896 plus readiness 1), and every other word equals its index. The 4096-byte SHA-256 is `5c8ee0ac5d9073a58dc688621e43a3d87146757dab23f5ed1e72a65eb792203a`. Each run used one 4 × 256 launch and prepare/ignite/wait/deliver/close, with no host intermediate advancement. Both closed completely, with no retained resources, quarantine or restart requirement. Review decoded every word, recomputed the digest, checked selection mode, host protocol and cleanup in both JSON files; this is executing-agent review, not independent approval.

## Gate disposition

| #105 obligation | Disposition |
| --- | --- |
| Exact single-device native pair prerequisite | Satisfied for the already accepted Windows gate #32 tuple; fresh results above corroborate the documentation-updated MCGS revision. No Linux promotion. |
| Intended runtime/context/artifact binding | Default and explicit modes pass on one physical GPU with the same deterministic terminal oracle. Supplemental explicit evidence is public selector injection, not a new production MCGS device-assignment API. CUDA-JS #20 remains open for its full oracle and distinct-device obligations. |
| Replica oracle and device-closed progress | Bounded single-device Channel/Output capsule passes; full Search Image replicas and broader Tensor/evaluator native execution remain unqualified. |
| Partition and final aggregation | NOT RUN: no accepted implemented multi-device execution/aggregation profile. |
| Foreign/stale device resources rejected before native work | Portable stale/foreign selector and pair-admission checks pass. Physical cross-device resource rejection NOT RUN: only one GPU. |
| One-device failure preserves peers and aggregate truth | NOT RUN: requires multiple physical devices and a coordinator/profile. Portable deferred-failure, timeout and quarantine checks are separate. |
| Terminal runtime/coordinator resources | Single-runtime successful cleanup passes twice. Coordinator and physical failure/orphan cleanup NOT RUN. |
| Scaling with topology/workload and single-GPU control | NOT RUN: no 2+ GPU topology or multi-GPU workload. These correctness runs are not a performance baseline. |

The controlled native Linux host with at least two independently visible physical GPUs is unavailable. All multi-GPU and Linux checks above are explicitly deferred, never counted as passing or used to close #105. No failure in the executed subset warrants a new bug issue. The stale dependency/status text is corrected in this documentation change.

## Reproduction and evidence preservation

Use the [pair runbook](../../../conformance/cuda-js-compatible-pair/RUNBOOK.md) with the exact revisions/package above and all seven identity environment variables. Run:

```text
node --experimental-ffi scripts/run-cuda-js-compatible-pair.mjs native
node scripts/run-cuda-js-compatible-pair.mjs portable
node scripts/run-cuda-js-runtime-adapter.mjs
node --test ../cuda-js-105/components/device-selection/test/device-selection.test.mjs
```

The supplemental harness is retained with normalized line endings and final newline as [explicit-native.mjs.txt](explicit-native.mjs.txt). Copy it to `build/issue-105/explicit-native.mjs` and run it with the same environment and FFI flag. It copies the native runner, rebases capsule imports, and injects the sole public discovered selector into `openCudaRuntime`. No production source or test suite was changed. The emitted pair schema is inherited from that runner; the explicit run is a supplemental candidate, not unmodified-runner evidence. The public recorder observes the resulting explicit runtime description, while its recorded input options precede the injection; use this harness when interpreting that distinction.

Native public derivatives redact only the checkout path and normalize formatting. Original native input hashes are in [original-hashes.json](original-hashes.json); raw originals and stderr (only the expected experimental-FFI warning) remain in local ignored `build/issue-105`. Portable/adapter/unit stdout is retained with LF line endings. [SHA256SUMS](SHA256SUMS) content-addresses all published evidence including the harness. The original gate #32 bundle is not rewritten, and its exact source identity is not transferred to this newer pair.
