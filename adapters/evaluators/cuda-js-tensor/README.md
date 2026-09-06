# CUDA-JS-Tensor evaluator connector

`integration.cuda-js-tensor-evaluator` is an optional CUDA-MCGS adapter for a public `cuda-js-tensor` `TensorDeviceProgram`.

It owns only CUDA-MCGS evaluator integration facts: finite request/item capacity, request-to-item assignment, batch occupancy, stale-safe slot generations, result scatter, cancellation/retry and cleanup reference semantics. Tensor mathematics, TensorProgram/TensorPlan meaning, the item callable ABI and Tensor workspace remain owned by CUDA-JS-Tensor.

The adapter accepts an injected public Tensor capability and uses only documented public fields plus `TensorDeviceProgram.importAs()`. It does not import CUDA-JS-Tensor source, inspect generated PTX/LTO, compile a model, or add product semantics.

Portable conformance is intentionally non-native. It proves the connector boundary and lifecycle only; it does not establish CUDA/provider/hardware support.

Focused qualification:

```sh
node scripts/run-cuda-js-tensor-evaluator.mjs
```
