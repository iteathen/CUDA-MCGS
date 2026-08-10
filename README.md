# UMCGS

**Universal Monte Carlo Graph Search**

UMCGS is a documentation-first project for a universal, GPU-resident framework capable of specializing into many MCGS-style search systems without embedding assumptions from any one domain, game, model, input representation, output representation, or search objective.

The intended boundary is broad: chess, Go, text search, planning, optimization, policy-only search, evaluation-only search, and other graph-search domains should be expressible through explicit contracts. A deployed engine is finite and specialized to its domain, evaluator, policy, CUDA environment, and GPU memory budget.

## Current phase

The project is in **framework-definition phase**. The repository exists first as a place to establish the development method, authoritative specifications, architectural decisions, constraints, and conformance tests before implementation begins.

No production implementation should be inferred from this bootstrap commit.

## Current non-negotiable direction

- The framework is universal at its contracts and specialized in its generated hot path.
- GPU memory is finite and must be budgeted explicitly before execution.
- After a search starts, active search decisions must not depend on CPU-produced intermediate results.
- Search state, selected search engine, resident evaluator/model, work queues, and intermediate results remain device-resident during a search.
- Domain semantics, state identity, graph/cycle behavior, action generation, evaluation outputs, and backup behavior are explicit rather than hidden defaults.
- Documentation must distinguish settled decisions from proposals and research notes.

## Documentation

Start with [`docs/README.md`](docs/README.md).
