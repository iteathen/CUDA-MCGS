# CUDA-JS-Tensor evaluator connector conformance

This CUDA-free capsule qualifies only the product-neutral connector/reference semantics for CUDA-MCGS #124.

It covers public `TensorDeviceProgram` shape admission, finite capacity, full and partial batches, request/item identity, stale-result rejection, pressure, cancellation, retryability, scatter, and cleanup.

It does not execute Tensor mathematics, CUDA-JS compilation/linking, runtime ignition, a model, or physical CUDA. Passing evidence must not be promoted into native/provider/hardware or product correctness claims.

Run:

```sh
node scripts/run-cuda-js-tensor-evaluator.mjs
```
