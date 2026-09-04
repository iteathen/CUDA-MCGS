# Adapters

Concrete domain, search-policy, evaluator/model, output, and external-runtime adapters live here.

Expected families are:

```text
adapters/domains/
adapters/policies/
adapters/evaluators/
adapters/outputs/
adapters/runtimes/
```

Each adapter is a manifested component with its own README, public contract, dependencies, consolidated test capsules, resource/capability requirements, cleanup behavior, and governing specification.

## CUDA-JS adapter

The production `integration.cuda-js` component lives at [`runtimes/cuda-js/`](runtimes/cuda-js/). It owns:

- fail-closed mapping from accepted CUDA-MCGS execution-package requirements to an exact versioned public CUDA-JS peer;
- public capability and compatibility admission before lower mutation;
- mechanical Device-JS/resource/sideband/launch translation;
- explicit pre-ignition resource/scalar input binding;
- bounded single-operation ignition, external-control publication/observation, completion and teardown mapping;
- MCGS-side failure classification while retaining lower public error/health facts;
- exact portable adapter evidence and adapter-owned rollback.

It does **not** own Search IR semantics, search scheduling/progression, generic Driver bindings, JIT/native ABI generation, generic memory implementation, NVRTC plumbing, CUDA-JS packaging/provider truth, private CUDA-JS source, native compatible-pair qualification, or performance/support claims.

Adapters may depend on stable CUDA-MCGS contracts/SDK and released/versioned peer contracts. Universal components must not depend on concrete adapters. No adapter may deep-import private source from `iteathen/CUDA-JS`.
