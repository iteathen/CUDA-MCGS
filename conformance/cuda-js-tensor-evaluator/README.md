# CUDA-JS-Tensor evaluator connector conformance

This CUDA-free capsule qualifies the product-neutral Tensor admission/import connector, the conformance-only semantic reference, the production Device-JS evaluator runtime contribution, its adapter-local evaluator-program binding, and its evaluator-to-Resource layout binding for CUDA-MCGS #124.

`reference.mjs` remains conformance-only and physically excluded from `npm pack`. Production request/batch/scatter behavior is emitted by `createTensorEvaluatorRuntimeContribution()` as restricted Device-JS and finite state/resource metadata. The emitted-source oracle executes that exact generated source under a deterministic sequential atomic shim.

Coverage includes public `TensorDeviceProgram` shape admission, opaque `DeviceJsImport` identity/drift, finite capacity, full and partial batches, explicit encoded-input handoff, request/item incarnation, no-work generation stability including an adversarial observed-then-lost slot claim, pressure, cancellation, retry, scatter and terminal publication. The stale-reuse falsifier reuses a request slot and batch lane, then executes delayed work with the old captured `{ itemIndex, slot, slotGeneration, requestGeneration, batchGeneration }` token; execute/scatter/publish must return stale without invoking Tensor or mutating the current lane.

`program-binding.mjs` proves the exact generated runtime source digest becomes the evaluator profile contribution identity, the runtime-selected CUDA-JS contracts require explicit full schema references, Program-Package-compatible source/function/external-import fragments preserve evaluator ownership, Program Binding carries no Resource/Tensor-storage relay fields, the Tensor import alias is not misdeclared as a local call edge, runtime work classes require an explicit one-to-one evaluator mapping, stale/capacity mismatches fail closed, and structural Tensor deletion leaves an unrelated non-Tensor owner fragment unchanged.

`resource-binding.mjs` uses the real evaluator and Resource normalizers/fixture builders rather than a hand-built Resource substitute. It proves existing semantic evaluator resource counts remain unchanged; exact runtime/Tensor representation byte extents become evaluator identity; request-control resources are `input`-class while batch-control resources are `batch`-class; public Tensor input/output/workspace alignment and dtype width survive without a local dtype catalog; Resource Binding consumes Runtime directly and proves its exact generated source identity matches the normalized evaluator; and shared immutable Tensor input remains external. The unchanged Resource planner must then produce the exact evaluator class → partition → byte pool → provider chains. Resource partition offsets are the sole placement authority, and runtime-source drift, missing resources, aliasing, provider access drift, byte/alignment drift, absent workspace semantics and generated-resource conflicts fail closed.

The resource-layout capsule does **not** add a generic Resource schema escape hatch, accept caller-supplied byte offsets, classify shared immutable Tensor inputs, select Progress dependencies/fairness/service order, call CUDA-JS inspection/compilation, or qualify native/provider/hardware behavior. Resource remains the physical plan owner and Progress remains the scheduling owner.

The sequential atomic shim and resource-layout composition are only CUDA-free semantic/representation oracles. They do **not** establish CUDA memory ordering, physical device scheduling, Device-JS frontend acceptance, compilation/linking, native/provider/hardware behavior or performance. Exact CUDA-JS inspection/compile and later native evidence remain separate qualification layers.

The installed-package falsifier verifies `cuda-mcgs/evaluator/cuda-js-tensor` exposes the connector, runtime-contribution, program-binding and resource-binding production builders after `npm pack`/install while this conformance directory remains physically absent and unexported.

Run:

```sh
node scripts/run-cuda-js-tensor-evaluator.mjs
node conformance/cuda-js-tensor-evaluator/package.mjs
```

The #124 composed-path candidate adds three capsules to the normal runner:

- `operation-composition.mjs`: real normalized evaluator/Resource/Progress/Output owners and actual runtime pointers reach Program Package and execution-package projection. Artifact/effect identity, immutable overlap, missing pointers and exact launch constraints have negative cases.
- `runtime-composition.mjs`: digest and zero-state rejection before writes, snapshots before asynchronous upload, simultaneous ignition rejection, one submission, and view-before-allocation-before-runtime cleanup or quarantine through the public runtime adapter.
- `service-composition.mjs`: the composed source runs a finite three-request/two-item cohort through collective lane yields. It checks full/partial batches, reversed lane order, pressure, cancellation before service and between batches, Tensor failure, recycling and stale scatter rejection. The synthetic Tensor callable multiplies meaningful nonzero inputs/weights. Barriers/atomics are a portable oracle, not a physical scheduler or memory model.

`public-inspection.mjs <cuda-js-root>` additionally uses only the exact peer's declared public root export to inspect both composed entry variants. CI checks out CUDA-JS `844e9392ded7841fdac8b7d2b438e1c6d8cafc85` (`cuda-js@0.1.0-alpha.19`, AGPL-3.0-or-later), installs only its parser dependency without lifecycle scripts, and runs this check. The Tensor library artifact is synthetic; frontend acceptance proves source/type/helper/import-metadata admission, not native compilation/linking, actual Tensor arithmetic or hardware behavior. No third-party implementation is copied into production.
