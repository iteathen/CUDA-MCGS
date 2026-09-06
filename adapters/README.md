# CUDA-MCGS adapters

Adapters translate framework contracts to separately owned public libraries.

The implemented [CUDA-JS runtime adapter](runtimes/cuda-js/README.md) handles compatibility admission, execution-package translation, launch, observation, and cleanup. Its physical compatible-pair qualification remains open.

Domain, policy, and evaluator requirements are defined by the [framework specifications](../docs/specs/README.md); production application implementations belong to external products. See the [system registry](../agent_files/SYSTEM_REGISTRY.md) for current ownership and planned adapters.
