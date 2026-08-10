# Adapters

Concrete domain, search-policy, evaluator/model, and output adapters live here.

Expected families are:

```text
adapters/domains/
adapters/policies/
adapters/evaluators/
adapters/outputs/
```

Each adapter is a manifested component with its own README, public contract, dependencies, tests, resource/capability requirements, and governing specification.

Adapters may depend on stable UMCGS contracts/SDK. Universal components must not depend on concrete adapters.
