# UMCGS

**Universal Monte Carlo Graph Search**

UMCGS is a documentation-first project for a universal, GPU-resident framework that specializes into many MCGS-style search systems without embedding assumptions from any one domain, game, model, input representation, output representation, or objective.

The intended boundary includes chess, Go, text search, planning, optimization, policy-only search, evaluation-only search, partially observable planning, and other graph-search workloads. A deployed engine is finite and specialized to its domain, search policy, evaluator, CUDA environment, and GPU-memory budget.

## Current phase

The project is in **framework-definition phase**. The repository is establishing development governance, mature-scale organization, versioned contracts, architectural decisions, resource constraints, prior-art evidence, and conformance strategy before production implementation.

No production implementation should be inferred from the current repository.

## Current accepted direction

- Adversarial assessment before planning, with proportional documentation and decisive falsifiers.
- LEGO macroscopic ownership, SOLID internal responsibilities, CUPID implementation quality, and simplest sufficient total-system design.
- Universal contracts and Search IR; generated/specialized hot paths.
- Explicit finite GPU-memory planning before engine launch.
- No CPU-produced intermediate decisions after search ignition.
- Search state, selected engine, resident evaluator/model, work queues, and intermediate results remain device-resident during active search.
- Domain semantics, identity, graph/cycle behavior, action production, evaluator outputs, backup, and exhaustion behavior are explicit.
- Repository and component organization is designed for very large project scale from the first implementation.
- Prior-art review found no reviewed implementation adequate as the UMCGS foundation; existing projects will be used as bounded references, conformance sources, and benchmarks.

## Start here

- Developers and coding agents: [`AGENTS.md`](AGENTS.md)
- Canonical agent system: [`agent_files/README.md`](agent_files/README.md)
- Repository organization: [`agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md)
- Documentation index: [`docs/README.md`](docs/README.md)
- Current project state: [`STATUS.md`](STATUS.md)
- Current next boundary: [`next_step.yaml`](next_step.yaml)
