# CUDA-JS-Tensor evaluator connector

`integration.cuda-js-tensor-evaluator` is an optional CUDA-MCGS admission/composition adapter for a public `cuda-js-tensor` `TensorDeviceProgram`.

The production export is deliberately stateless. It validates the public Tensor callable, finite item/request capacity, parameter roles, workspace total and opaque Device-JS library identity, then provides a fresh owner-produced `DeviceJsImport` only if that import still matches the admitted identity. It does not implement a second evaluator scheduler/runtime.

Tensor mathematics, TensorProgram/TensorPlan meaning, item-axis addressing, the callable ABI and Tensor workspace remain owned by CUDA-JS-Tensor. CUDA-JS owns Device-JS library linking and native execution. CUDA-MCGS retains evaluator request/batch/readiness semantics under SPEC-0009. PR #241 protected the generic Search Program/execution-package import path and `integration.cuda-js` now validates matching live opaque imports before forwarding them through public `compileDeviceProgram({ imports })`; the remaining #124 work is the evaluator-owned request/batch/scatter/readiness/search-lifecycle runtime above that boundary.

The adapter uses only documented public fields plus `TensorDeviceProgram.importAs()`. It does not import CUDA-JS-Tensor source, inspect generated PTX/LTO, compile a model, or add product semantics.

The request/batch/scatter state machine used by the portable capsule lives under `conformance/` only; it is not exported in the package and is not production runtime authority.

Portable conformance is intentionally non-native. It proves only the connector/reference semantics it executes; it does not establish CUDA/provider/hardware support.

Focused qualification:

```sh
node scripts/run-cuda-js-tensor-evaluator.mjs
```
