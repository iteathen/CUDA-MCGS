# CUDA-MCGS

CUDA-MCGS is a framework project for GPU-resident Monte Carlo Graph Search. It is intended for developers building search applications across games, planning, optimization, and other domains.

**Public pre-release: a development library exists, but there is no released npm package or physically qualified production GPU search runtime.**

## Why CUDA-MCGS

- **The search runs on the GPU, not through it.** Once ignited, active search progression is required to remain device-owned through restricted Device-JS, not a host loop dispatching one kernel per tree step. Keeping the CPU out of the internal search loop is a hard contract in the accepted design. The prerelease implementation already contains the Search Compiler, graph/policy/resource/progress/output machinery, Device-JS program composition, and public CUDA-JS runtime adapter needed to realize that contract; physical end-to-end qualification remains open.

## What exists

- Accepted search contracts and versioned Search IR schemas.
- A Search Compiler that normalizes profiles and composes search programs before execution.
- A prerelease library facade and explicit Search Compiler/runtime-adapter exports.
- A public CUDA-JS runtime adapter, CUDA-free reference implementations, and conformance runners.

The development package is private. Its API is not stable, and portable/reference checks do not establish GPU correctness, native Linux support, or performance. Exact CUDA-MCGS/CUDA-JS physical qualification remains open.

## Intended framework

The aim is finite, device-owned search progression after launch, with reusable domain, graph, policy, evaluator, resource, and result contracts. Optional session and extension capabilities compose through those contracts.

CUDA-JS supplies generic GPU/runtime/compiler mechanisms; CUDA-JS-Tensor supplies tensor mathematics. Applications retain their own rules and output meaning. The separate [UCI Arena Vector](https://github.com/iteathen/UCI-Arena-Vector) project owns the chess engine.

See the [framework overview](docs/architecture/FRAMEWORK_OVERVIEW.md), [accepted specifications](docs/specs/README.md), and [current status](STATUS.md) for the boundary between implemented work and intended capabilities.

## Start with the reference implementation

For the bounded CUDA-free reference, use Node.js 24 or newer and Git. Node 24 and 26 have portable conformance coverage; native CUDA-JS execution retains the Node/platform requirements of its separately qualified compatible pair.

```bash
git clone https://github.com/iteathen/CUDA-MCGS.git
cd CUDA-MCGS
node scripts/run-search-ir-reference.mjs
```

This runs Search IR normalization and deterministic reference cases. It is a reference check, not a GPU search demonstration.

For library entry points, see the [library interface](components/library-interface/README.md). For the complete repository checks, package verification, and native prerequisites, see [conformance](conformance/README.md) and the [development index](docs/development/README.md).

## Further information

- [Documentation](docs/README.md) and [project charter](docs/PROJECT_CHARTER.md).
- [Current work](next_step.yaml).
- [Contributing](CONTRIBUTING.md) and [repository agent context](AGENT_LOCAL.md).
- [Private security reporting](SECURITY.md).
- [AGPL-3.0-or-later license](LICENSE) and [commercial licensing information](LICENSING.md).
