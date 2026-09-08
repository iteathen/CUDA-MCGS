# CUDA-JS-Tensor evaluator connector conformance

This CUDA-free capsule qualifies the product-neutral Tensor admission/import connector, the conformance-only semantic reference, the production Device-JS evaluator runtime contribution, and its adapter-local evaluator-program binding for CUDA-MCGS #124.

`reference.mjs` remains conformance-only and physically excluded from `npm pack`. Production request/batch/scatter behavior is emitted by `createTensorEvaluatorRuntimeContribution()` as restricted Device-JS and finite state/resource metadata. The emitted-source oracle executes that exact generated source under a deterministic sequential atomic shim.

Coverage includes public `TensorDeviceProgram` shape admission, opaque `DeviceJsImport` identity/drift, finite capacity, full and partial batches, explicit encoded-input handoff, request/item incarnation, no-work generation stability including an adversarial observed-then-lost slot claim, pressure, cancellation, retry, scatter and terminal publication. The stale-reuse falsifier reuses a request slot and batch lane, then executes delayed work with the old captured `{ itemIndex, slot, slotGeneration, requestGeneration, batchGeneration }` token; execute/scatter/publish must return stale without invoking Tensor or mutating the current lane.

`program-binding.mjs` qualifies the next ownership seam without pretending to be a second Composer. It proves the exact generated runtime source digest becomes the evaluator profile contribution identity, the runtime-selected CUDA-JS contracts require explicit full schema references, Program-Package-compatible source/function/external-import fragments preserve evaluator ownership, the Tensor import alias is not misdeclared as a local call edge, runtime work classes require an explicit one-to-one evaluator mapping, stale/capacity mismatches fail closed, and structural Tensor deletion leaves an unrelated non-Tensor owner fragment unchanged.

The program-binding capsule does **not** compose Resource pools/partitions/provider requirements, bind runtime-entry pointers, select Progress dependencies/fairness/service order, call CUDA-JS inspection/compilation, or qualify native/provider/hardware behavior. Those are separately owned #124 gates.

The sequential atomic shim is only a CUDA-free semantic oracle. It does **not** establish CUDA memory ordering, physical device scheduling, Device-JS frontend acceptance, compilation/linking, native/provider/hardware behavior or performance. Exact CUDA-JS inspection/compile and later native evidence remain separate qualification layers.

The installed-package falsifier verifies `cuda-mcgs/evaluator/cuda-js-tensor` exposes the connector, runtime-contribution and program-binding builders after `npm pack`/install while this conformance directory remains physically absent and unexported.

Run:

```sh
node scripts/run-cuda-js-tensor-evaluator.mjs
node conformance/cuda-js-tensor-evaluator/package.mjs
```
