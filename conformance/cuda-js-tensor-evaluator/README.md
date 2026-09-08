# CUDA-JS-Tensor evaluator connector conformance

This CUDA-free capsule qualifies the product-neutral Tensor admission/import connector, the conformance-only semantic reference, and the first production Device-JS evaluator runtime contribution for CUDA-MCGS #124.

`reference.mjs` remains conformance-only and physically excluded from `npm pack`. Production request/batch/scatter behavior is instead emitted by `createTensorEvaluatorRuntimeContribution()` as restricted Device-JS and finite state/resource metadata. The emitted-source oracle executes that exact generated source under a deterministic sequential atomic shim.

Coverage includes public `TensorDeviceProgram` shape admission, opaque `DeviceJsImport` identity/drift, finite capacity, full and partial batches, explicit encoded-input handoff, request/item incarnation, no-work generation stability, pressure, cancellation, retry, scatter and terminal publication. The stale-reuse falsifier reuses a request slot and batch lane, then executes delayed work with the old captured `{ itemIndex, slot, slotGeneration, requestGeneration, batchGeneration }` token; execute/scatter/publish must return stale without invoking Tensor or mutating the current lane.

The sequential atomic shim is only a CUDA-free semantic oracle. It does **not** establish CUDA memory ordering, physical device scheduling, Device-JS frontend acceptance, compilation/linking, native/provider/hardware behavior or performance. Exact CUDA-JS inspection/compile and later native evidence remain separate qualification layers.

The installed-package falsifier verifies `cuda-mcgs/evaluator/cuda-js-tensor` exposes both the connector and runtime-contribution builders after `npm pack`/install while this conformance directory remains physically absent and unexported.

Run:

```sh
node scripts/run-cuda-js-tensor-evaluator.mjs
node conformance/cuda-js-tensor-evaluator/package.mjs
```
