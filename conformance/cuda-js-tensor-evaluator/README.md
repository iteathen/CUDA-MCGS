# CUDA-JS-Tensor evaluator connector conformance

This CUDA-free capsule qualifies only the product-neutral connector boundary and conformance-only evaluator lifecycle reference for CUDA-MCGS #124.

The production package exports only the stateless Tensor admission/import connector. The request/batch/scatter state machine in `reference.mjs` exists only as conformance evidence and is physically excluded from `npm pack` output.

Coverage includes public `TensorDeviceProgram` shape admission, opaque `DeviceJsImport` type/identity preservation and drift rejection, finite capacity, full and partial batches, request/item identity, stale-result rejection, pressure, cancellation, retryability, scatter and cleanup.

The installed-package falsifier verifies `cuda-mcgs/evaluator/cuda-js-tensor` resolves after `npm pack`/install while this conformance directory remains physically absent and unexported.

These checks do not execute Tensor mathematics, CUDA-JS compilation/linking, runtime ignition, a model, or physical CUDA. Passing evidence must not be promoted into native/provider/hardware or product correctness claims.

Run:

```sh
node scripts/run-cuda-js-tensor-evaluator.mjs
node conformance/cuda-js-tensor-evaluator/package.mjs
```
