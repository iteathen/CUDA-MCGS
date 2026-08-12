# CUDA-MCGS Architecture

**Status:** Proposal

## Architectural thesis

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS engine with schema-backed extension support.**

The repository retains its existing UMCGS authority identifiers while the product-facing name transitions to CUDA-MCGS.

CUDA-MCGS should be a **search compiler/composer plus a finite specialized device program**, consuming the independent generic CUDA-JS runtime rather than owning Node/CUDA Driver plumbing.

Universality is defined by stable search contracts, Search IR, a finite operational Search Stage graph, and stage-owned extension contracts. Performance and memory efficiency come from specialization: optional capabilities, fields, branches, adapters, surfaces, channels and Stage PTX inputs that are not selected for a concrete engine should not survive merely because the universal framework can represent them.

[`SPEC-0001`](../specs/SPEC-0001-device-search-publication-and-resources.md) and [`SPEC-0002`](../specs/SPEC-0002-search-ir-and-reference-semantics.md) accept a foundational Search IR 0.1.0 slice for publication, graph identity/edge ownership, path cycles, finite resources, stop, result, and canonical identity. The complete extension-capable Search IR shown here remains proposal work until the remaining contracts and composition experiments are accepted.

```text
Domain contract ───────────────┐
Search-policy contract ────────┤
Evaluator contract ────────────┤
Execution/storage contract ────┼─► Search IR
Resource profile ──────────────┤       │
Stage capability schemas ──────┘       ▼
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

## 2. Operational Search Stages

Every concrete engine has a finite operational **Search Stage** graph. A stage represents one stable execution state and owns one complete mutation interval for one logical search work item. It is not the searched domain state, graph node, kernel, module, launch, CUDA Graph node, global phase, or grid barrier.

A stage transition occurs when that logical work item commits a new operational state. Different work items may occupy different stages concurrently when publication and resource contracts allow it.

Each stage may expose a stage-owned **Stage Extension Surface** at stable `entry`, stable `exit`, both, or neither. No surface exists inside the stage's incomplete mutation interval, and a surface never crosses into another stage.

A stage boundary is defined first by a coherent semantic category, owned invariant and validity transition. Usefulness then validates the granularity and chooses among semantically valid placements: a useful boundary exposes stable facts and capabilities that credible consumers can reuse where data is already materialized and ownership/publication/resource lifetime is clear. CUDA-MCGS does not create a stage for every internal variable change or possible hook, and usefulness never justifies merging materially different invariants, readiness states, failure modes or owners.

A context schema describes the least-authority representation already available at a selected checkpoint. It does **not** scan generated code, choose a boundary at runtime, or grant arbitrary mutation.

If behavior must participate inside an invariant-forming operation, it belongs in the mandatory stage implementation. If it establishes a new stable operational state, it becomes a stage.

## 3. Shared stage capabilities and asynchronous dataflow

All optional capabilities required at one stage share that stage's surface, minimum generated context and finite resource plan. They are composed before ignition; they do not become separately discovered runtime extensions.

Cross-stage and cross-surface dataflow uses bounded **Async Stage Channels**. A stage may publish a task or data for later use, including evaluator or secondary search work, if:

- the producer commits or rolls back its stage mutation first;
- request and result storage have separate bounded ownership;
- identity, generation, freshness and release/acquire publication are explicit;
- pressure, cancellation, expiry and reclamation are planned;
- no worker spins, waits, holds a lock/reservation, or keeps stage mutation open for the result.

A required but unavailable result moves the logical consumer into a declared pending state. The scheduler runs other ready work, including the producer. If no producer can become runnable or capacity forms an unresolved cycle, CUDA-MCGS publishes a typed outcome rather than blocking indefinitely.

[`SPEC-0003`](../specs/SPEC-0003-search-stage-and-extension-surface.md), [`SPEC-0004`](../specs/SPEC-0004-async-stage-channels.md), and [`SPEC-0005`](../specs/SPEC-0005-stage-ptx-and-search-image-composition.md) are the detailed proposal boundaries.

## 4. Search Composer

The **Search Composer** is the CUDA-MCGS-owned composition root for a concrete engine. It is part of the search compiler/planning layer, not a runtime search manager.

It must:

- normalize and validate all mandatory search contracts and schemas;
- lower them into one versioned Search IR;
- build and validate the finite operational Search Stage graph;
- select useful stable stage boundaries and resolve entry/exit surfaces;
- validate and deterministically compose each stage's capability set;
- validate all Async Stage Channels, readiness dependencies and progress outcomes;
- reject incompatible types, versions, permissions, resource needs, or synchronization assumptions before ignition;
- perform range/precision analysis and choose concrete widths/layouts;
- plan finite graph/search/model/stage-capability/channel memory and pressure behavior;
- generate checkpoint/channel glue and at most one optional Stage PTX per stage where required;
- select graph, transposition, cycle, reduction, reclamation, and scheduling strategies;
- compose core, mandatory domain/evaluator behavior, and selected Stage PTX inputs;
- emit complete compilation/link inputs and deterministic artifact/cache identity;
- produce the CUDA-JS execution package and result contract.

The Composer owns search composition semantics. CUDA-JS owns the generic compiler/linker/runtime capability used to materialize those inputs.

## 5. Stage PTX realization and empty-capability disappearance

The selected version-zero realization uses relocatable PTX, not device LTO. A stage whose contract/schema selects one or more optional capabilities contributes exactly one composed **Stage PTX** input. A stage with no selected capability contributes no optional-extension PTX, call, context, state, capability-only channel/workspace or synchronization residue; mandatory stage/channel behavior is unaffected. If a stage exposes both entry and exit checkpoints, both symbols live in the same Stage PTX input.

Capabilities are declarative lowering inputs, not one independently callable PTX fragment per feature. CUDA-MCGS owns capability/stage semantics, lowering, Stage PTX ABI, imported/exported device-symbol contracts, ordered composition and Search Image identity. CUDA-JS owns the generic NVRTC/nvJitLink path that compiles or accepts PTX, links selected inputs into a cubin, loads it, and launches it.

Stage PTX is an artifact/composition unit, not a kernel, launch, module or scheduler requirement. One Search Image may link all stage inputs together. CUDA-MCGS does not make PTX syntax or one linker technique part of the semantic extension contract; a future accepted realization may preserve the semantics through another mechanism without making LTO a version-zero dependency.

The bounded probe proved exact unused disappearance and direct-link correctness, but tiny separate PTX functions retained calls and grew code/register cost. One coarse boundary approached the inline control only after sufficient synthetic work. Therefore the production requirement is:

> **No capability means no extension residue. Several capabilities at one stage mean one composed Stage PTX input, invoked only at declared stable entry/exit checkpoints.**

Stage boundaries should be chosen where they are semantically stable and practically useful enough to amortize the boundary. A stage must not be invented merely to obtain a PTX attachment point.

Any increased instructions, registers, shared/global memory, synchronization, occupancy pressure, code size or latency remains charged to the engine. Representative Stage PTX profiles must be compared against equivalent fused/generated controls.

This requirement must be verified against emitted PTX and final cubin/SASS plus representative benchmarks where tool support permits; source-level specialization or a successful link alone is not proof.

## 6. Search Image and pre-ignition boundary

The **Search Image** is the fully resolved executable search configuration: device program/artifacts plus generated layouts, finite resource plan, compatibility identity, initial configuration, and required resident/preloaded state.

Before ignition, the host-side toolchain may:

- select contracts, profiles, stage capabilities, channels, and evaluator/model;
- validate and normalize schemas;
- compose/generate/compile/link code;
- allocate finite resources;
- upload initial state/configuration/model data;
- load modules and prepare launch/completion resources.

After ignition:

- no required capability or Stage PTX may be newly discovered, compiled, linked, or loaded;
- no host lookup may resolve a stage surface, capability or channel;
- no CPU-produced intermediate decision may be required for progress;
- all behavior required for active search, including stage capabilities, channels and secondary search-time systems, is already device-resident or device-accessible under the finite plan.

An already-composed capability may be **inactive** and later become **active** based on GPU-side conditions. This is activation, not late binding.

## 7. Search-specific device program

The realized device program owns or executes the selected implementations for:

- node, edge, state, action, and path arenas;
- transposition lookup, collision verification, claim/publication states, and generation rules;
- bounded search work queues;
- domain transition and action/proposal behavior;
- evaluator batch formation, resident execution, and result publication;
- selection/reservation and backup/propagation;
- operational stage transitions, stage checkpoints and Async Stage Channels that survived specialization;
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

The exact scheduler remains an open measured decision. Persistent kernels are especially attractive for irregular low-latency search loops but may constrain coexistence with evaluator or secondary GPU work. CUDA Graph device launch/conditional mechanisms can express some device-owned progression, but conditional bodies prohibit kernels that use Device Graph Launch or CUDA Dynamic Parallelism and device graphs have additional restrictions. Graphs therefore remain a profile candidate, not the universal stage substrate. The correct implementation must be selected from representative workloads and hardware evidence rather than from the phrase "GPU-resident."

A host micro-batch relaunch loop is non-conforming whenever active-search progress or the next search decision depends on the host between launches.

## 9. Ownership and dependency policy

CUDA-MCGS should own its **search-semantic and search-critical execution mechanisms**, including:

- Search IR and Search Composer;
- Search Stage graph, useful boundary, checkpoint and Stage Extension Surface semantics;
- capability/Async Stage Channel compatibility and specialization identity;
- Stage PTX lowering and checkpoint ABI;
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

- CUDA-MCGS plans search/model/stage-capability/channel/workspace/output capacities before engine creation.
- CUDA-JS performs generic allocations under explicit memory-kind and lifetime contracts.
- Active search allocates from bounded device arenas selected by CUDA-MCGS; general-purpose host-mediated allocation is not a hot-path escape hatch.
- Layouts contain only fields required by the realized contracts, stages and capabilities.
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
6. stages with no capability, entry-only, exit-only, both checkpoints, and multiple compatible capabilities sharing one surface/Stage PTX;
7. incompatible stage/checkpoint/schema/version/permission/resource combinations rejected before ignition;
8. GPU-side activation/deactivation of already-bound behavior without host decisions;
9. required and optional cross-stage dataflow, pending/ready rescheduling, saturation, stale generations and deadlock outcomes without worker blocking;
10. finite memory pressure, cancellation, completion, and deterministic failure behavior;
11. equivalent search semantics across the reference interpretation and an exact compatible CUDA-JS/Search Image pair.

The empty-capability disappearance claim additionally requires baseline-versus-empty-capability emitted-code evidence. Bound-stage acceptance requires a representative Stage PTX versus fused-control resource/occupancy/GPU-timing capsule; functional conformance alone proves neither.
