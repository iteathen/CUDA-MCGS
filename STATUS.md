# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-11

## Phase

Private pre-release framework definition and bounded evidence gathering. `main` is the integration trunk. No production runtime component decomposition or implementation has been accepted.

## Accepted project state

- The generic graph-search framework, not a first game or domain, is the CUDA-MCGS product.
- CUDA-MCGS owns Search IR, search semantics, finite search-resource planning, specialized search device programs, search conformance, and the CUDA-MCGS-to-CUDA-JS adapter/package contract.
- Generic Node.js/CUDA Driver behavior belongs to the independent peer `iteathen/CUDA-JS`. Dependency remains one-way through versioned public artifacts and compatibility manifests.
- Active search remains device-closed after ignition. Concrete engines are finite and resource-planned; universal contracts lower into specialized generated hot paths.
- [`docs/specs/SPEC-0001-device-search-publication-and-resources.md`](docs/specs/SPEC-0001-device-search-publication-and-resources.md) is accepted authority for backend-neutral publication channels, state-node/parent-edge ownership, identity-before-path-cycle ordering, finite-resource accounting, typed exhaustion, partial-result validity, and scheduler-neutral conformance.
- [`docs/specs/SPEC-0002-search-ir-and-reference-semantics.md`](docs/specs/SPEC-0002-search-ir-and-reference-semantics.md) accepts the concrete backend-neutral Search IR 0.1.0 representation, strict normalization, canonical identity, and CUDA-free deterministic reference semantics.
- SPEC-0001 and SPEC-0002 do not authorize a generated ABI, production CUDA lowering, scheduler, graph store, resource planner, evaluator, adapter, or CUDA-JS integration.
- Engineering judgment, adversarial assessment, focus-branch sizing, token backpressure, consolidated testing, governed execution, cleanup, sanity, and exact-head integration remain binding.
- Repository and component organization assumes mature-project scale from inception.
- Project license selection remains deferred for original private pre-release work.

## Bounded CUDA-only experiment

The standalone experiment at [`experiments/cuda-device-mcgs-prototype/`](experiments/cuda-device-mcgs-prototype/) is retained as non-production evidence. It has no Node.js dependency and does not exercise or implement CUDA-JS.

Exact final local evidence:

- source SHA-256 `9D1F9F9C196531DDA241966761657760D96D9E3800B82EDEA617E1CB4E84EDA3`;
- Release binary SHA-256 `FE106092751A4E53C472B8B28E2833C1896C0FA220578B7CB0A6FB89429C1443`;
- CUDA 13.3 / Driver API 13030 / GeForce GTX 1660 Ti / compute capability 7.5;
- ordinary invariant capsule: 8 expected, 8 discovered, 8 executed, 8 passed, zero skips;
- five additional unchanged full-workload trials: 8/8 each;
- global-ticket and warp-batched-ticket mechanisms both preserved the stable semantic invariants;
- warp batching reduced ticket claims but established no stable timing win and does not select a production scheduler;
- exact-final-binary Compute Sanitizer memcheck remained incomplete after a bounded reduced-workload attempt.

Build output is ignored, reproducible task state and is removed after final evidence reconciliation. Production code may not import experiment internals.

## Bounded Search IR reference

The CUDA-free reference at [`experiments/search-ir-reference/`](experiments/search-ir-reference/) validates the accepted Search IR 0.1.0 contract independently from the native prototype and CUDA-JS.

Exact local Windows evidence:

- Node.js 26.7.0 on Windows x64;
- 18 expected, discovered, and executed cases; 18 passed with zero skips;
- canonical normalized bytes: `7749`;
- Search IR SHA-256 `bd6679178c6754fe9b06d6fa54d038166b7ef39e32fb5f51513cc303cfd63a96`;
- baseline, canonical-order, minimum-capacity, eight fail-closed mutations, ordinary, publication, transposition, path-cycle, forced-exhaustion, scheduler-parity, and oracle-sensitivity cases all pass.

The same capsule is required on `windows-latest` and `ubuntu-latest`. Ubuntu establishes only backend-neutral normalization/reference portability. Native Linux CUDA, GPU publication, sanitizers, resource cleanup, performance, and CUDA-JS integration remain untested.

## Current authority

- Project charter and ADR-0001 through ADR-0017: accepted.
- Repository topology and the CUDA-JS peer split: accepted through ADR-0014.
- SPEC-0001 device publication/graph/resource semantic contract: accepted.
- SPEC-0002 Search IR 0.1.0 and deterministic reference semantics: accepted.
- SPEC-0000 framework map: proposal input, not an implementable production contract.
- Domain, policy, evaluator, full memory-plan, scheduler, output, and CUDA-MCGS-to-CUDA-JS package specifications: not yet accepted.
- CUDA-JS now exists as a peer remote, but no exact released CUDA-MCGS/CUDA-JS compatible pair or CUDA-MCGS-owned adapter evidence has been accepted.

## Current next boundary

Define the domain, policy, evaluator, full resource/memory, output, and execution-package contracts needed to compose Search IR 0.1.0 without accidental first-domain limits. Then resume the version-zero CUDA-MCGS-to-CUDA-JS contract against an exact public CUDA-JS revision and add the boundary capsule once, without copying CUDA-JS private mechanisms or its complete internal suite.

## Current blockers and claim limits

- Domain, policy, evaluator, full memory/resource, scheduler, output, persistence/reroot, and execution-package contracts remain incomplete.
- The prototype covers a fixed deterministic two-action scalar-value domain and node-capacity exhaustion only.
- No representative evaluator, workload, profiler, search-quality, cross-GPU, cancellation, device-loss, reclamation, or complete sanitizer evidence exists.
- No production implementation, native Linux CUDA qualification, public release, exact compatible runtime pair, or release automation is claimed.

## Private collaboration safety

CUDA-MCGS uses the free GitHub plan and will not depend on paid private-repository protection or Actions. The canonical private repository keeps `iteathen` as its only account; personal-account private collaborators would receive write access and therefore are not admitted directly.

Outside developers contribute through standalone private intake repositories with no canonical credentials, secrets, runners, or authority. The owner imports reviewed exact commits onto canonical branches. While private, validation is local and Linux gaps remain explicit. Public repositories such as CUDA-JS continue using protected branches and public CI. The normative workflow is in [`CONTRIBUTING.md`](CONTRIBUTING.md).
