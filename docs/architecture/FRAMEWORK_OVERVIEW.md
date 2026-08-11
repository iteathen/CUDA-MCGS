# CUDA-MCGS Architecture

**Status:** Proposal

## Architectural thesis

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS engine with schema-backed extension support.**

The repository retains its existing UMCGS authority identifiers while the product-facing name transitions to CUDA-MCGS.

CUDA-MCGS should be a **search compiler/composer plus a finite specialized device program**, consuming the independent generic CUDA-JS runtime rather than owning Node/CUDA Driver plumbing.

Universality is defined by stable search contracts, Search IR, and extension contracts. Performance and memory efficiency come from specialization: optional capabilities, fields, branches, adapters, and extension points that are not selected for a concrete engine should not survive merely because the universal framework can represent them.

[`SPEC-0001`](../specs/SPEC-0001-device-search-publication-and-resources.md) and [`SPEC-0002`](../specs/SPEC-0002-search-ir-and-reference-semantics.md) accept a foundational Search IR 0.1.0 slice for publication, graph identity/edge ownership, path cycles, finite resources, stop, result, and canonical identity. The complete extension-capable Search IR shown here remains proposal work until the remaining contracts and composition experiments are accepted.

```text
Domain contract ───────────────┐
Search-policy contract ────────┤
Evaluator contract ────────────┤
Execution/storage contract ────┼─► Search IR
Resource profile ──────────────┤       │
Extension manifests/fragments ─┘       ▼
                               Search Composer
                        ┌───────────────┼────────────────┐
                        │               │                │
                 contract/schema   memory/layout    execution-plan
                   validation         planning          selection
                        │               │                │
                        └───────────────┼────────────────┘
                                        ▼
                          specialized execution package
                                        │
                              CUDA-MCGS CUDA-JS adapter
                                        │
                          CUDA-JS CompilerActor/runtime
                           NVRTC / nvJitLink / Driver
                                        │
                                        ▼
                              specialized device image
                                        │
                               preload + search ignition
                                        │
                                        ▼
                             device-closed active search
```

## 1. Contract and schema model

A schema is not a substitute for a contract.

A CUDA-MCGS contract defines semantic meaning, permissions, invariants, ownership, lifetime, ordering, synchronization, failure, resource behavior, compatibility, and observable effects. Schemas embedded in or referenced by those contracts define machine-verifiable representations such as fields, widths, ranges, alignment, normalization, and version identity.

The intended relationship is therefore **contract-defined behavior with schema-backed representation**, not a schema carrying informal behavioral assumptions.

The core input contracts remain conceptually distinct:

- **Domain contract** — state, action, transition, identity, node role, terminal, history, stochasticity, observation, and cycle semantics.
- **Search-policy contract** — selection, reservation, widening, statistics, backup, ranking, and termination semantics.
- **Evaluator contract** — input encoding, proposals/values/other outputs, perspective, batching, workspace, publication, and resident execution requirements.
- **Execution/storage contract** — graph arenas, queues, transpositions, paths, scheduling, pressure, lifecycle, and result publication.
- **Resource profile** — finite device capacities, safety reserves, model/workspace requirements, and pressure/exhaustion behavior.

These mandatory semantics must not be weakened into arbitrary callbacks merely because the extension mechanism is flexible.

## 2. Search Extension Surface

Every concrete search definition may expose zero or more semantic **Extension Points**. The set of points is its **Extension Surface**.

An Extension Point is a compile/composition-time contract, not a runtime registration slot. A point identifies a meaningful search location or decision boundary and defines exactly what an attached implementation may observe or affect.

Every point must define at least:

- stable namespaced point ID and contract version;
- semantic purpose and execution location;
- invocation cardinality and execution/synchronization scope;
- point-specific Context Schema;
- readable and writable facts/capabilities;
- allowed control effects or result signals, if any;
- invariants that remain owned by the search core;
- memory-space, lifetime, aliasing, and publication rules;
- scratch/workspace and bounded resource rules;
- failure behavior and compatibility policy.

The Context Schema describes data available at an already-defined point. It does **not** scan generated code or dynamically determine where an extension should attach.

A search may expose points around candidate generation/scoring, selection, transition, transposition publication, expansion, evaluation, propagation/backup, pressure handling, ranking, or other semantics where extension is genuinely useful. Point names should describe the semantic boundary rather than encode one known optimization such as virtual loss, RAVE, pruning, or a particular solver.

## 3. Extension Fragments

An optional device implementation bound to an Extension Point is an **Extension Fragment**.

A fragment manifest declares:

- fragment identity, revision, provenance, and source/artifact hashes;
- target Extension Point ID/version;
- required context fields/capabilities and type/range expectations;
- requested read/write/control permissions;
- device/toolchain/architecture requirements;
- static configuration and compile/link options;
- persistent state, scratch, shared-memory, workspace, queue, or model requirements;
- concurrency/publication requirements;
- incompatibilities and composition constraints;
- deterministic cache/specialization identity inputs.

Fragments are selected and validated before ignition. A production search must never discover extensions by scanning registries, loading code, interpreting schemas, or resolving generic callbacks in the active hot path.

The same extension mechanism may support optimizations, solvers, instrumentation, secondary search-time systems, alternative scoring, domain-specific acceleration, or future MCGS techniques without adding a new framework-wide callback ABI for each technique.

## 4. Search Composer

The **Search Composer** is the CUDA-MCGS-owned composition root for a concrete engine. It is part of the search compiler/planning layer, not a runtime search manager.

It must:

- normalize and validate all mandatory search contracts and schemas;
- lower them into one versioned Search IR;
- resolve the concrete Extension Surface exposed by the selected search realization;
- validate Extension Fragment manifests against point contracts and context schemas;
- reject incompatible types, versions, permissions, resource needs, or synchronization assumptions before ignition;
- perform range/precision analysis and choose concrete widths/layouts;
- plan finite graph/search/model/extension memory and pressure behavior;
- generate point-specific glue/adapters where required;
- select graph, transposition, cycle, reduction, reclamation, and scheduling strategies;
- compose core, mandatory domain/evaluator behavior, and selected Extension Fragments;
- emit complete compilation/link inputs and deterministic artifact/cache identity;
- produce the CUDA-JS execution package and result contract.

The Composer owns search composition semantics. CUDA-JS owns the generic compiler/linker/runtime capability used to materialize those inputs.

## 5. Realization and zero-abstraction-cost target

The selected version-zero realization uses relocatable PTX modules. CUDA-MCGS owns the PTX fragment ABI, imported/exported device-symbol contracts, and composition identity; CUDA-JS owns the generic NVRTC/nvJitLink path that compiles or accepts PTX, links the selected inputs into a cubin, loads it, and launches it. Unbound points are omitted by Search Composer generation before PTX emission. Bound fragments are reached through statically named direct device symbols rather than a callback table or function-pointer registry.

CUDA-MCGS must not make PTX syntax or one linker technique part of the semantic extension contract. A later conforming realization may use direct generated source composition, templates/code generation, precompiled specialization, LTO, or another mechanism if it preserves the required semantics and measured performance properties. NVIDIA cuVS and cuFFT LTO designs remain useful planning and typed-extension-point precedents, not the selected version-zero artifact format.

PTX separate compilation does not guarantee cross-module inlining. A direct linked symbol can still add call, register, occupancy, or code-size cost relative to fused source. The first experiment therefore compares the PTX-module path with a fused/generated-source control and treats the result as evidence, not an assumed optimizer property.

The production performance requirements are:

> **Unbound extension points shall impose zero abstraction overhead in the realized search image. Bound extensions shall impose no generic dispatch overhead beyond the intrinsic work and resource cost of their implementation.**

For an unbound point, production evidence should show no retained callback-table lookup, indirect call, enable branch, generic schema walk, unused context construction, or reserved per-point state attributable solely to the extension abstraction.

For a bound fragment, any increased instructions, registers, shared memory, global memory, synchronization, occupancy pressure, or code size caused by the fragment's actual work is intrinsic cost rather than abstraction cost. Those costs remain subject to normal performance/resource acceptance.

This requirement must be verified against emitted PTX and final cubin/SASS plus representative benchmarks where tool support permits; source-level specialization or a successful link alone is not proof.

## 6. Search Image and pre-ignition boundary

The **Search Image** is the fully resolved executable search configuration: device program/artifacts plus generated layouts, finite resource plan, compatibility identity, initial configuration, and required resident/preloaded state.

Before ignition, the host-side toolchain may:

- select contracts, profiles, extensions, and evaluator/model;
- validate and normalize schemas;
- compose/generate/compile/link code;
- allocate finite resources;
- upload initial state/configuration/model data;
- load modules and prepare launch/completion resources.

After ignition:

- no required extension may be newly discovered, compiled, linked, or loaded;
- no host lookup may resolve an extension point;
- no CPU-produced intermediate decision may be required for progress;
- all behavior required for active search, including bound extensions and secondary search-time systems, is already device-resident or device-accessible under the finite plan.

A bound extension may be **inactive** and later become **active** based on GPU-side conditions. This is activation, not late binding.

## 7. Search-specific device program

The realized device program owns or executes the selected implementations for:

- node, edge, state, action, and path arenas;
- transposition lookup, collision verification, claim/publication states, and generation rules;
- bounded search work queues;
- domain transition and action/proposal behavior;
- evaluator batch formation, resident execution, and result publication;
- selection/reservation and backup/propagation;
- extension point invocations that survived specialization;
- root/output publication;
- memory-pressure and search-stop state;
- search diagnostics/instrumentation selected for the concrete image;
- device-owned progress after ignition.

It does not know how Node.js locates Driver symbols or how CUDA-JS privately owns contexts, modules, streams, events, or compiler actors.

## 8. GPU residency is not one kernel topology

Device closure is an execution contract, not a synonym for a single persistent kernel.

The Search Composer may eventually select among evidence-backed realizations such as:

- persistent kernels;
- cooperative-grid or cluster-oriented kernels where supported;
- multi-kernel device-owned workflows;
- device-launched CUDA Graph workflows;
- conditional graph execution;
- another device-owned scheduling mechanism.

The exact scheduler remains an open measured decision. Persistent kernels are especially attractive for irregular low-latency search loops but may constrain coexistence with evaluator or secondary GPU work. CUDA Graph device launch/conditional mechanisms can express device-owned progression but impose their own instantiation and topology constraints. The correct implementation must be selected from representative workloads and hardware evidence rather than from the phrase "GPU-resident."

A host micro-batch relaunch loop is non-conforming whenever active-search progress or the next search decision depends on the host between launches.

## 9. Ownership and dependency policy

CUDA-MCGS should own its **search-semantic and search-critical execution mechanisms**, including:

- Search IR and Search Composer;
- Extension Surface/Point/Contract/Context Schema semantics;
- fragment manifest, compatibility, binding, and specialization identity;
- search memory planning and pressure policy;
- graph/transposition/publication/cycle/path semantics;
- search scheduling policy and result semantics;
- search conformance and performance acceptance.

CUDA-JS owns generic CUDA host-runtime infrastructure, including Driver capability handling, opaque resources, generic memory/module/function operations, NVRTC/nvJitLink, generic artifact caching, launch/completion/error/teardown, and runtime conformance.

CUDA platform/toolchain facilities may be relied upon where replacing them would duplicate the CUDA toolchain itself. Higher-level projects such as cuVS, cuFFT, cuCollections, or RAPIDS should not become mandatory active-search runtime dependencies merely because they demonstrate useful methodology.

The reuse preference is:

1. reuse proven methodology and conformance ideas;
2. independently implement search-owned mechanisms when ownership is strategically valuable;
3. selectively adapt permissively licensed source when it saves substantial risk/effort and an explicit reuse decision is accepted;
4. vendor/pin source when local control outweighs update cost;
5. require a higher-level external runtime dependency only when measured benefit clearly outweighs loss of control, transitive cost, and failure/update risk.

Copied or adapted third-party code must follow `third_party/README.md` provenance and reuse rules.

A realized production Search Image should not require cuVS, cuFFT, cuCollections, RAPIDS, or another search/framework runtime to make progress unless a later explicit dependency decision establishes that requirement. Required search behavior should already be incorporated into the image before ignition.

## 10. Data ownership and memory strategy

State-node-shared data may include canonical identity, state storage, terminal result, evaluator result, and generated-action range. Parent-edge-specific data may include action, child reference, prior/proposal score, visits, reserved visits, accumulated return, and selection statistics.

This separation allows transpositions to share state/evaluation without incorrectly merging all incoming action statistics.

Memory rules:

- CUDA-MCGS plans search/model/extension/workspace/output capacities before engine creation.
- CUDA-JS performs generic allocations under explicit memory-kind and lifetime contracts.
- Active search allocates from bounded device arenas selected by CUDA-MCGS; general-purpose host-mediated allocation is not a hot-path escape hatch.
- Layouts contain only fields required by the realized contracts/extensions.
- References use explicit identity/generation semantics; raw addresses are not universal persistent identities.
- High pressure reduces, freezes, or redirects expansion according to deterministic policy before unsafe allocation.
- Reclamation favors explicit correctness and generation safety over invisible arbitrary eviction.
- Managed memory is not assumed to be the universal search arena.

cuCollections should be treated as a serious transposition-table baseline and possible algorithm/source donor, not automatically as the permanent table dependency. Its concurrent GPU hash structures must be compared against CUDA-MCGS-specific collision verification, publication, generation, reclamation, memory-layout, and performance needs.

## 11. Reference backend and conformance

The deterministic, CUDA-free Search IR 0.1.0 reference capsule governed by SPEC-0002 is accepted as a bounded semantic oracle for the SPEC-0001 foundation. It is a disposable experiment, not production architecture: it does not define a CUDA lowering, generated ABI, scheduler topology, native GPU correctness, or production GPU performance behavior.

Before a production domain adapter, conformance should cover at least:

1. fixed DAGs with deliberate transpositions;
2. cyclic graphs with explicit cutoff/history semantics;
3. lazy very-large action spaces with progressive widening;
4. stochastic/chance and observation-bearing graphs;
5. evaluator modes including absent, proposal-only, value-only, combined, vector/distributional where selected;
6. extension points with no fragment bound, one fragment, and multiple compatible fragments;
7. incompatible point/schema/version/permission/resource manifests rejected before ignition;
8. GPU-side activation/deactivation of already-bound behavior without host decisions;
9. finite memory pressure, saturation, cancellation, completion, and deterministic failure behavior;
10. equivalent search semantics across the reference interpretation and an exact compatible CUDA-JS/Search Image pair.

The zero-abstraction-cost claim additionally requires a baseline-versus-unbound emitted-code/benchmark capsule; functional conformance alone cannot prove it.
