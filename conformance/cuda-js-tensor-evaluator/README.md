# CUDA-JS-Tensor evaluator connector conformance

This CUDA-free capsule qualifies the product-neutral Tensor admission/import connector, the conformance-only semantic reference, the production Device-JS evaluator runtime contribution, its adapter-local evaluator-program binding, and its evaluator-to-Resource layout binding for CUDA-MCGS #124.

`reference.mjs` remains conformance-only and physically excluded from `npm pack`. Production request/batch/scatter behavior is emitted by `createTensorEvaluatorRuntimeContribution()` as restricted Device-JS and finite state/resource metadata. The emitted-source oracle executes that exact generated source under a deterministic sequential atomic shim.

Coverage includes public `TensorDeviceProgram` shape admission, opaque `DeviceJsImport` identity/drift, finite capacity, full and partial batches, explicit encoded-input handoff, request/item incarnation, no-work generation stability including an adversarial observed-then-lost slot claim, pressure, cancellation, retry, scatter and terminal publication. The stale-reuse falsifier reuses a request slot and batch lane, then executes delayed work with the old captured `{ itemIndex, slot, slotGeneration, requestGeneration, batchGeneration }` token; execute/scatter/publish must return stale without invoking Tensor or mutating the current lane.

`program-binding.mjs` proves the exact generated runtime source digest becomes the evaluator profile contribution identity, the runtime-selected CUDA-JS contracts require explicit full schema references, Program-Package-compatible source/function/external-import fragments preserve evaluator ownership, the Tensor import alias is not misdeclared as a local call edge, runtime work classes require an explicit one-to-one evaluator mapping, stale/capacity mismatches fail closed, and structural Tensor deletion leaves an unrelated non-Tensor owner fragment unchanged.

`resource-binding.mjs` uses the real evaluator and Resource normalizers/fixture builders rather than a hand-built Resource substitute. It proves existing semantic evaluator resource counts remain unchanged; exact runtime/Tensor representation byte extents become evaluator identity; control arrays are dedicated `batch`-class representation resources rather than disguised workspace; Tensor workspace alignment is preserved only when workspace semantics are already selected; and shared immutable Tensor input remains external. The unchanged Resource planner must then produce the exact evaluator class → partition → byte pool → provider chains. Resource partition offsets are the sole placement authority, and missing resources, aliasing, provider access drift, byte/alignment drift, absent workspace semantics and generated-resource conflicts fail closed.

The resource-layout capsule does **not** add a generic Resource schema escape hatch, accept caller-supplied byte offsets, classify shared immutable Tensor inputs, select Progress dependencies/fairness/service order, call CUDA-JS inspection/compilation, or qualify native/provider/hardware behavior. Resource remains the physical plan owner and Progress remains the scheduling owner.

The sequential atomic shim and resource-layout composition are only CUDA-free semantic/representation oracles. They do **not** establish CUDA memory ordering, physical device scheduling, Device-JS frontend acceptance, compilation/linking, native/provider/hardware behavior or performance. Exact CUDA-JS inspection/compile and later native evidence remain separate qualification layers.

The installed-package falsifier verifies `cuda-mcgs/evaluator/cuda-js-tensor` exposes the connector, runtime-contribution, program-binding and resource-binding production builders after `npm pack`/install while this conformance directory remains physically absent and unexported.

Run:

```sh
node scripts/run-cuda-js-tensor-evaluator.mjs
node conformance/cuda-js-tensor-evaluator/package.mjs
```
