# Project Charter

**Status:** Accepted

## Purpose

Create a complete library that makes GPU-resident Monte Carlo Graph Search easy to use while retaining a universal framework capable of specifying, specializing, and executing systems across unrelated domains and evaluator types.

The framework should support board games, text search, planning, optimization, move ordering, evaluation-only search, partially observable problems, and future MCGS-style workloads without making one application the permanent shape of the core.

Under [`decisions/ADR-0020-complete-library-and-resolved-defaults.md`](decisions/ADR-0020-complete-library-and-resolved-defaults.md), the complete composable surface is authoritative and ease is layered over it through progressive disclosure. Convenience calls and presets resolve into the same canonical normalized profile and specialization path as fully explicit calls. Defaults are bounded, documented, inspectable, overridable and versioned when semantically material; they may not fabricate missing domain meaning or adapt hidden search semantics after ignition.

## Product boundary

CUDA-MCGS owns three deliberately separated semantic layers under [`decisions/ADR-0018-universal-core-extension-product-layering.md`](decisions/ADR-0018-universal-core-extension-product-layering.md).

### Universal MCGS semantic core

The universal core owns reusable search contracts and search-specific runtime behavior for:

- Search IR and versioning;
- state, action, transition, identity, node-role, terminal, history, and cycle semantics;
- graph storage, transpositions, paths, and selected Search Session root/advance/reroot/attention/reclamation semantics;
- selection, reservation, expansion, widening, evaluation batching, backup, stopping, and generic bounded result/observation semantics;
- resident evaluator/model composition and search-specific generated device programs;
- finite GPU-memory planning, capacities, pressure, exhaustion, cancellation, and result behavior;
- specialization for a concrete domain, policy, evaluator, extension-capability set, CUDA capability profile, and hardware/resource profile;
- deterministic reference interpretation and synthetic search conformance;
- the adapter and execution-package contract through which CUDA-MCGS consumes the generic CUDA-JS runtime.

The universal core does **not** require a ranked root-action list, best-move output, top-k output, board, player, game, scalar value, policy prior, or another first-product output convention. Those meanings belong to selected policy/output contracts, extension capabilities, or domain/search products.

### Universal extension and composition substrate

CUDA-MCGS owns a universal schema-backed extension substrate consisting of semantic Search Stages, schema-selected least-authority Stage Extension Surface contracts, bounded Async Stage Channels, deterministic capability composition, generated checkpoint contexts/contracts, finite extension resources, and specialized restricted Device-JS/Search Program semantics. CUDA-JS exclusively owns the generated CUDA/PTX/cubin/LTO/native realization.

Stability belongs to the extension contract/schema, not to unconditional runtime presence. Concrete attachment points are materialized only for capabilities selected into a specialization; unused capabilities contribute no extension hook/port, dispatch, context, channel, storage, synchronization, or other solely extension-owned runtime residue.

The substrate is universal; one capability's semantic payload is not automatically universal core meaning. Product-specific capabilities remain namespaced and versioned and must not redefine core invariants through an extension back door.

### Domain/search products

A domain/search product selects the universal core contracts and extension substrate and then owns its domain-specific semantics, required capabilities, output schemas, support profile, and product-level quality evidence.

Chess search is a separately specified product layer. Chess legal-move ranking, board/history identity, chess evaluator meaning, multi-PV/best-move output, and chess-specific reuse policy do not shape the universal CUDA-MCGS core.

CUDA-MCGS does **not** own generic Node.js/CUDA Driver bindings, CPU-call ABI generation, native/JIT packaging, generic memory primitives, NVRTC/link/load plumbing, event-loop delivery, or generic CUDA resource handles. Those responsibilities belong to the independent `iteathen/CUDA-JS` repository under ADR-0014.

Under [`ADR-0019`](decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md), maintained CUDA-MCGS production source is JavaScript only: ordinary Node.js plus restricted Device-JS submitted through public CUDA-JS contracts. It does not own or maintain C/C++, CUDA C++, native addons, direct FFI/Driver access, hand-authored PTX, embedded CUDA source, or a subprocess native search implementation. This does not restrict CUDA-JS: CUDA-JS may use JIT, native code and CUDA-specific implementation wherever needed or desired behind its consumer-neutral public contracts. Its generated device artifacts are opaque versioned outputs to CUDA-MCGS.

## Ecosystem language policy

Python is prohibited throughout CUDA-MCGS, CUDA-JS, and every future project whose primary purpose is to build, test, package, release, operate, or extend the CUDA-MCGS ecosystem.

The prohibition applies to production and reference source, tools, schema importers, generators, tests, benchmarks, documentation tooling, CI, packaging, installers, release automation, migrations, diagnostics, prototypes, experiments, and one-off or temporary scripts. Indirect or containerized invocation does not create an exception.

This is a hard project gate rather than a preference. Use only languages and toolchains accepted by the owning repository and boundary. The complete rule, prohibited artifacts, validation requirements, and cross-repository inheritance are defined in [`../agent_files/general_foundation/NO_PYTHON_POLICY.md`](../agent_files/general_foundation/NO_PYTHON_POLICY.md).

## Universality rule

The framework defines universal search contracts, a universal extension/composition substrate, and a universal intermediate representation. It must not require one universal hot-path object layout or impose permanent runtime cost for unused capabilities. A concrete engine is expected to be statically specialized.

A behavior belongs in universal core meaning only when it is required to state correctness, lifecycle, finite resources, or composition across the intended MCGS equivalence class. Reuse by one product or several products does not automatically promote it. The second-instance and first-consumer-deletion tests apply before promotion.

The external CUDA runtime contract must not become a back door for embedding one domain, graph, search policy, evaluator, product output, or model into CUDA-MCGS foundations.

## Device-residency rule

After search ignition, no active selection, expansion, transition, legality/domain analysis, evaluation, backup, scheduling, stopping decision, or selected search-semantic output computation may require a CPU-produced intermediate result.

The host may configure, compile, load, allocate and launch before ignition. After ignition it may asynchronously read bounded coherent observations/results, submit externally supplied attention/root/budget/priority or other accepted control changes, request cancellation, and perform completion/error/teardown lifecycle work through CUDA-JS. Those operations must have finite, versioned, generation-scoped admission/publication semantics and must not become an oracle or progress coordinator on the active-search critical path.

Externally supplied domain facts such as a new accepted search root are inputs to the Search Session, not host-owned internal search decisions.

An observation-to-host-decision-to-control-write, polling/relaunch, or callback loop that is required to advance internal search is non-conforming. Delayed or absent observation consumption must not block search progress.

## CUDA-JS capability escalation rule

CUDA-MCGS uses an existing CUDA-JS public contract only when it expresses the needed generic GPU mechanism naturally, safely, with bounded resources/lifecycle, and without distorting search semantics. A requirement that would otherwise invite C/C++, CUDA-specific source, private imports, host progression, unsafe synchronization, artificial kernel fragmentation, or duplicated generic lifecycle is treated as a potential CUDA-JS capability gap rather than forced into CUDA-MCGS.

The inclination to reach for native code in CUDA-MCGS is enough to trigger this classification before implementation. It is evidence that CUDA-JS may be incomplete, not permission to create the native path and not by itself proof that the capability belongs in CUDA-JS.

A promoted CUDA-JS capability must be consumer-neutral, independently qualified, and explicit about ownership, exclusions, resources, synchronization, failure, cancellation, teardown, compatibility and first-consumer deletion. CUDA-MCGS retains all search/domain/evaluator/product policy; if the need cannot be described without that policy, the CUDA-MCGS design is reconsidered instead of exporting it.

## Resource rule

Universality does not imply unbounded resources. Every concrete engine declares and enforces finite capacities derived from available GPU memory, resident evaluator/model, workspace, runtime/safety reserves, domain representation, graph/path/queue needs, selected extension state/channels, Search Session control/observation needs, and outputs.

CUDA-MCGS owns the search-resource partition and pressure policy. CUDA-JS owns generic resource creation/lifetime behavior and reports capability/allocation outcomes through its versioned contract.

Resource exhaustion is specified behavior, not an undefined failure discovered mid-search. Initial root and reroot admission may not escape finite planning through surprise allocation. Advance is valid only for an already ready realized successor and may not allocate, resize or transform state.

## Initial exclusions

The universal core must not assume a board, two players, alternating turns, zero-sum values, deterministic transitions, finite exhaustive actions, scalar evaluation, neural evaluator, tree/DAG, fixed-size state/output, ranked moves, unlimited growth, one CUDA execution mechanism, or one Node/CUDA binding backend unless a selected adapter/profile/product explicitly supplies that contract.

The extension substrate must not assume that one current capability category, first product, or first domain is the permanent extension vocabulary.

## First milestone

Define the development method, versioned universal search contracts, universal extension/composition contracts, Search IR, memory-planning model, CUDA-MCGS-to-CUDA-JS execution-package contract, consolidated conformance architecture, and synthetic domains before implementing a production domain product.

Chess search may be specified in parallel as a downstream product profile, but its implementation must not become a prerequisite for completing the universal framework.
