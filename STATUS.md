# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-11

## Phase

CUDA-MCGS is in private pre-release framework definition, research, specification, and bounded evidence gathering. `main` is the integration trunk. No production search runtime or final component decomposition has been accepted.

The GitHub repository and existing accepted UMCGS authority identifiers retain the historical name until a separate migration is accepted. Product-facing references use **CUDA-MCGS**.

## North star

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS engine with schema-backed extension support.**

Universal behavior is defined through versioned contracts and Search IR. Concrete engines are finite, resource-planned, and specialized. Active search remains device-closed after ignition. Optional search-time behavior uses a schema-backed Extension Surface/Point/Fragment protocol resolved before ignition, while generic CUDA runtime/compiler/linker behavior remains CUDA-JS-owned.

## Accepted project state

- The generic graph-search framework—not a first game or domain—is the CUDA-MCGS product.
- CUDA-MCGS owns Search IR, search semantics, finite search-resource planning, specialized search device programs, search conformance, and the CUDA-MCGS-to-CUDA-JS adapter/package contract.
- Generic Node.js/CUDA Driver behavior belongs to the independent public peer `iteathen/CUDA-JS`. Dependency remains one-way through versioned public artifacts and compatibility manifests.
- Active search remains device-closed after ignition. Concrete engines are finite and resource-planned; universal contracts lower into specialized generated hot paths.
- [`docs/specs/SPEC-0001-device-search-publication-and-resources.md`](docs/specs/SPEC-0001-device-search-publication-and-resources.md) is accepted authority for backend-neutral publication channels, state-node/parent-edge ownership, identity-before-path-cycle ordering, finite-resource accounting, typed exhaustion, partial-result validity, and scheduler-neutral conformance.
- [`docs/specs/SPEC-0002-search-ir-and-reference-semantics.md`](docs/specs/SPEC-0002-search-ir-and-reference-semantics.md) accepts the foundational backend-neutral Search IR 0.1.0 representation, strict normalization, canonical identity, and CUDA-free deterministic reference semantics for the SPEC-0001 boundary.
- SPEC-0001 and SPEC-0002 do not authorize a generated ABI, production CUDA lowering, the complete extension-capable Search IR, a scheduler, graph store, resource planner, evaluator, adapter, or CUDA-JS integration.
- Engineering judgment, adversarial assessment, focus-branch sizing, token backpressure, consolidated testing, governed execution, cleanup, sanity, and exact-head integration remain binding.
- Repository/component organization and the no-Python ecosystem policy apply from project inception.

## Current proposal direction

The architecture and SPEC-0000 proposals define a common search extension model: Extension Surface, Extension Point, Extension Contract, point-specific Context Schema, Extension Fragment, Search Composer, and finite specialized Search Image. Binding/composition occurs before ignition. On-device activation may change later, but active search does not perform host extension discovery, lookup, compilation, linking, or decision service.

These extension representations and the complete extension-capable Search IR remain proposal-level until detailed specifications and experiment evidence are accepted. The accepted Search IR 0.1.0 slice is their semantic foundation, not proof of the complete model.

The owner-selected version-zero realization is relocatable PTX, not device LTO. CUDA-MCGS will define the PTX fragment ABI and composition semantics; CUDA-JS will provide the generic public compile/link/load path. LTO remains prior art and a possible future comparison, and CUDA-MCGS does not depend on the active CUDA-JS LTO work.

## Bounded CUDA-only experiment

The standalone experiment at [`experiments/cuda-device-mcgs-prototype/`](experiments/cuda-device-mcgs-prototype/) is retained as non-production evidence. It has no Node.js dependency and does not exercise or implement CUDA-JS.

Exact final local Windows evidence:

- source SHA-256 `9D1F9F9C196531DDA241966761657760D96D9E3800B82EDEA617E1CB4E84EDA3`;
- Release binary SHA-256 `FE106092751A4E53C472B8B28E2833C1896C0FA220578B7CB0A6FB89429C1443`;
- CUDA 13.3 / Driver API 13030 / GeForce GTX 1660 Ti / compute capability 7.5;
- ordinary invariant capsule: 8 expected, discovered, and executed; 8 passed with zero skips;
- five additional unchanged full-workload trials: 8/8 each;
- global-ticket and warp-batched-ticket mechanisms both preserved stable semantic invariants;
- warp batching reduced ticket claims but established no stable timing win and does not select a production scheduler;
- exact-final-binary Compute Sanitizer memcheck remained incomplete after a bounded reduced-workload attempt.

Build output is ignored, reproducible task state and is removed after evidence reconciliation. Production code may not import experiment internals.

## Bounded Search IR reference

The CUDA-free reference at [`experiments/search-ir-reference/`](experiments/search-ir-reference/) validates the accepted Search IR 0.1.0 foundation independently from the native prototype and CUDA-JS.

Exact local Windows evidence:

- Node.js 26.7.0 on Windows x64;
- 18 expected, discovered, and executed cases; 18 passed with zero skips;
- canonical normalized bytes: `7749`;
- Search IR SHA-256 `bd6679178c6754fe9b06d6fa54d038166b7ef39e32fb5f51513cc303cfd63a96`;
- baseline, canonical-order, minimum-capacity, eight fail-closed mutations, ordinary, publication, transposition, path-cycle, forced-exhaustion, scheduler-parity, and oracle-sensitivity cases all pass.

Private CUDA-MCGS Actions are disabled on the free plan, so this capsule currently has local Windows evidence only. Native Linux CUDA and Linux reference execution remain explicitly tracked gaps. The later PTX experiment below adds bounded Windows CUDA-JS integration, GPU execution, and cleanup evidence without retroactively expanding this Search IR capsule's claim.

## Bounded PTX extension-composition discovery

The disposable vertical slice at [`experiments/ptx-extension-composition-prototype/`](experiments/ptx-extension-composition-prototype/) exercises a proposal-shaped Extension Surface, deterministic multi-fragment PTX composition, the packaged public CUDA-JS facade, one device-closed miniature search, negative contracts, emitted-binary inspection, resource bounds, and cleanup. It is discovery evidence rather than an accepted production schema or component.

Exact local Windows evidence:

- portable capsule: 37 expected, discovered, and executed; 37 passed with zero skips;
- packaged CUDA-JS `main` revision `ad49a6c9b0cddb420e26e097180cf9c502060a65`;
- native capsule: 13 expected, discovered, and executed; 13 passed with zero skips;
- no-point and unbound generation produced byte-identical PTX and byte-identical 4,392-byte cubins with zero extension symbols or calls;
- one and two direct PTX fragments linked and executed correctly, including transposition, root-cycle, finite-resource, activation, backup, and output checks;
- two bound fragments retained two SASS calls and produced a 7,016-byte/31-register kernel versus the 4,520-byte/17-register fused control, so direct static binding is not fused-equivalent evidence;
- current CUDA-JS NVRTC compilation cannot produce linkable standalone CUDA-source fragments because its public compile contract lacks relocatable-device-code control; hand-authored PTX works only as a discovery fixture;
- unresolved-symbol, architecture-mismatch, and memory-limit failures were explicit and recoverable; terminal cleanup was graceful with zero live/orphaned Driver resources.

The ownership and “can” versus “should” dispositions are in [`experiments/ptx-extension-composition-prototype/FINDINGS.md`](experiments/ptx-extension-composition-prototype/FINDINGS.md). Native Linux remains untested: the portable lane is prepared, but the selected CUDA-JS revision has no qualified Linux compiler/driver compatible pair.

## Current CUDA-JS peer state

At exact inspected revision `ad49a6c9b0cddb420e26e097180cf9c502060a65`, public `iteathen/CUDA-JS` has bounded accepted F1-F9 evidence, including Windows Driver/resource/memory/execution/compiler/package evidence and the F9 `cuda-cccl` device-scope publication prerequisite. F9 proves generic compiler/runtime behavior only; it does not prove CUDA-MCGS search semantics, extension composition, scheduler performance, transposition behavior, or the cross-repository compatible pair. Native Linux CUDA qualification remains separate.

## Current authority

- Project charter and ADR-0001 through ADR-0017: accepted within their scopes.
- Repository topology, no-Python policy, and the CUDA-JS peer split: accepted.
- SPEC-0001 device publication/graph/resource semantic contract: accepted.
- SPEC-0002 foundational Search IR 0.1.0 and deterministic reference semantics: accepted.
- SPEC-0000 framework map and extension model: proposal input, not an implementable production contract.
- Complete extension-capable Search IR, Extension Surface/Point/Fragment representation, domain, policy, evaluator, full memory-plan, scheduler, output, and CUDA-MCGS-to-CUDA-JS package specifications: not yet accepted.
- No exact released CUDA-MCGS/CUDA-JS compatible pair or CUDA-MCGS-owned adapter evidence has been accepted.

## Current next boundary

Execute the revised canonical [`next_step.yaml`](next_step.yaml) plan. [CUDA-JS #35](https://github.com/iteathen/CUDA-JS/issues/35) now records the relocatable-device-code need; do not implement it until the active LTO/compiler work finishes and its exact head is reassessed. [UMCGS #30](https://github.com/iteathen/UMCGS/issues/30) owns the CUDA-MCGS ABI, unbound-disappearance requirement, generator boundary, and representative bound-cost envelope. Then run the controlled post-capability PTX experiment before production extension implementation, followed by `SCHED-001`, `TT-001`, and the exact compatible-pair capsule.

## Current blockers and claim limits

- The complete extension-capable Search IR and extension representation are not accepted.
- The prototype establishes direct-link correctness, unbound disappearance, a subset of negative contracts, and a separate-link cost warning, but the normative PTX ABI/schema and representative performance/resource acceptance envelope are not accepted.
- CUDA-JS cannot yet compile standalone CUDA-source fragments into linkable relocatable PTX through its public API; implementation must wait for reassessment against the active LTO/compiler work's final exact head.
- Domain, policy, evaluator, full memory/resource, scheduler, output, persistence/reroot, and execution-package contracts remain incomplete.
- The prototype covers a fixed deterministic two-action scalar-value domain and node-capacity exhaustion only.
- No representative evaluator, workload, profiler, search-quality, cross-GPU, cancellation, device-loss, reclamation, or complete sanitizer evidence exists.
- No production implementation, native Linux CUDA qualification, public CUDA-MCGS release, released compatible runtime pair, or release automation is claimed.

## Private collaboration safety

CUDA-MCGS uses GitHub Free and will not depend on paid private-repository protection or Actions. The canonical private repository keeps `iteathen` as its only account; personal-account private collaborators receive write access and therefore are not admitted directly.

Outside developers contribute through standalone private intake repositories containing an exact, sanitized starting revision and no canonical credentials, secrets, runners, or authority. The owner reviews and locally validates an exact intake head, then imports selected commits onto a canonical branch while preserving authorship. Intake repositories are archived or deleted at engagement end. Public repositories such as CUDA-JS continue using protected branches and public CI. The normative workflow is in [`CONTRIBUTING.md`](CONTRIBUTING.md).
