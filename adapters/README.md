# CUDA-MCGS adapters

Adapters translate framework contracts to separately owned public libraries.

The implemented [CUDA-JS runtime adapter](runtimes/cuda-js/README.md) handles compatibility admission, execution-package translation, launch, observation, and cleanup. Its physical compatible-pair qualification remains open and deferred for the current nonphysical pass.

The candidate [CUDA-JS-Tensor evaluator connector](evaluators/cuda-js-tensor/README.md) admits an injected public `TensorDeviceProgram` and exact opaque `DeviceJsImport` identity for optional evaluator composition. It owns no Tensor mathematics, evaluator scheduler/runtime, native CUDA mechanism, or downstream product meaning.

Domain, policy, evaluator, resource, progress and output requirements are defined by the [framework specifications](../docs/specs/README.md). Production application semantics belong to external products and are never prerequisites for generic CUDA-MCGS ownership. See the [system registry](../agent_files/SYSTEM_REGISTRY.md) for current boundaries.
