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

The planned `integration.cuda-js` adapter belongs under `adapters/runtimes/` after the version-zero interop specification is accepted. It owns:

- mapping the UMCGS execution-package schema to the versioned CUDA-JS public runtime contract;
- capability and compatibility negotiation;
- semantic classification of UMCGS package/result errors versus generic CUDA-JS runtime/context errors;
- exact peer artifact identity and conformance evidence;
- configuration, initial upload, launch, one-way cancellation request, completion consumption, and teardown mapping.

It does **not** own Search IR semantics, search scheduling, generic Driver bindings, JIT ABI generation, generic memory implementation, NVRTC plumbing, or CUDA-JS packaging.

Adapters may depend on stable UMCGS contracts/SDK and released peer contracts. Universal components must not depend on concrete adapters. No adapter may deep-import private source from `iteathen/CUDA-JS`.