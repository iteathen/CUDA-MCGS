# CUDA-MCGS Architecture

**Status:** Proposal

## Architectural thesis

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS framework with a universal least-authority extension/composition substrate and finite specialized Search Images.**

[`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md) makes the dependency direction explicit:

```text
universal MCGS semantic core
        │
        ├────────► universal extension/composition substrate
        │                 │
        │                 └──── optional selected capabilities
        │
        └────────► downstream domain/search products
                          │
                          └──── chess, future Go/planning/optimization/...
```

The universal core is complete without chess and without any optional capability. The extension substrate can consume stable universal facts but does not define core semantics. A product selects universal contracts/capabilities and adds product-owned meaning; it cannot redefine the core merely by being the first consumer.

CUDA-MCGS is therefore a **search compiler/composer plus a finite specialized device program**, consuming the independent generic CUDA-JS runtime rather than owning Node/CUDA Driver plumbing.

[`SPEC-0001`](../specs/SPEC-0001-device-search-publication-and-resources.md) and [`SPEC-0002`](../specs/SPEC-0002-search-ir-and-reference-semantics.md) accept the foundational publication/graph/path/resource/Search IR slice. [`SPEC-0000`](../specs/SPEC-0000-framework-requirements.md) and [`SPEC-0006`](../specs/SPEC-0006-search-session-control-and-observation.md) through [`SPEC-0013`](../specs/SPEC-0013-result-and-observation-publication.md) are the decision-complete 741-requirement core proposal packet. [`SPEC-0003`](../specs/SPEC-0003-search-stage-and-extension-surface.md), [`SPEC-0004`](../specs/SPEC-0004-async-stage-channels.md) and [`SPEC-0005`](../specs/SPEC-0005-stage-ptx-and-search-image-composition.md) are the decision-complete 248-requirement optional extension proposal packet under final reconciliation. None authorizes production lowering before schema/reference acceptance.

## 1. Universal core inputs

The universal core contract families are conceptually independent:

- **Domain contract** — state, action, transition, identity, node role, terminal, history, stochasticity/observation and cycle semantics.
- **Search-policy contract** — selection, reservation, widening, policy-owned statistics, backup, stopping/budget semantics and reroot reuse classification. No ranked-action output is mandatory.
- **Evaluator contract** — encoding, proposals/values/other outputs, perspective, batching, workspace, publication, resident execution and cache-validity semantics.
- **Graph/storage contract** — graph objects, typed references, parent edges, paths, transpositions, structural publication, protection and reclamation.
- **Generic output/observation contract** — mandatory bounded terminal publication and optional immutable live observations without requiring one product payload such as ranked moves.
- **Resource contract/profile** — finite contributions, capacities, safety reserve, compound admission, pressure, exhaustion and cleanup accounting.
- **Device-progress contract** — work readiness, finite service/fairness, typed no-progress, stop/drain and closure without selecting a scheduler topology.
- **Search Session contract when selected** — external root/control transaction and root-epoch authority plus bounded observation-request/borrow lifecycle coordination; source owners retain stale-work, reuse, reclamation and publication meaning.

These contracts must remain semantically meaningful if the extension substrate and chess product are removed.

```text
Domain ────────────────┐
Graph/storage ─────────┤
Evaluator (optional) ──┤
Policy ────────────────┤
Output ────────────────┼────► framework ownership map / universal Search IR
Resources ─────────────┤
Device progress ───────┤
Session (optional) ─────┘
```

A schema backs representation; it does not replace behavioral meaning. Contracts own invariants, permissions, lifecycle, failure, finite resources, ordering/publication and compatibility.

## 2. Universal extension/composition substrate

Extensions are not arbitrary callbacks and are not extra universal core fields.

A concrete Search Image may select:

- a finite graph of semantic per-work-item **Search Stages**;
- stable stage-owned entry/exit **Stage Extension Surfaces**;
- a minimal extension-only **base checkpoint context** viewing source-owner stable facts for each materialized surface;
- namespaced/versioned selected **capabilities** that may contribute specialization-only context/state/resources;
- bounded internal **Async Stage Channels**;
- version-zero composed restricted Device-JS **stage capability program units**.

The key boundary is:

> **The extension substrate is universal; a capability's semantic payload is not automatically universal.**

For example, a future chess tablebase capability may bind to a universally meaningful stable checkpoint. Chess/tablebase fields appear only in Search Images selecting that capability. They do not become part of the base checkpoint context, every node layout, or universal Search IR semantic core.

A capability that changes search meaning must identify the owning selected domain/policy/evaluator/output/session/product contract authorizing that effect. The surface itself cannot redefine state identity, graph ownership, resource conservation, session lifecycle or other core invariants.

### 2.1 Search Stages

A Search Stage owns one semantic operational state, stable entry/exit and transition commitment around one complete mutation interval for one logical work item. Source contracts retain ownership of the domain/graph/policy/evaluator/output/resource/progress/session facts and mutations coordinated inside it. A stage is not searched domain state, a global phase, kernel, module, launch, CUDA Graph node or product phase.

A stage boundary is justified by a universal operational invariant/readiness transition. A stage must survive the **first-consumer deletion test**: if deleting the first product/capability destroys the stage's semantic purpose, that stage is product-specific rather than universal substrate.

### 2.2 Stable surfaces and capability context

A surface exists only at stable stage entry/exit boundaries and grants least authority.

```text
selected stage checkpoint
        │
        ├── base context: least-authority source-owner stable facts
        │
        ├── capability A context: only if A selected
        ├── capability B context: only if B selected
        └── ...
```

Deleting a capability removes its solely owned context/code/state/workspace/channels/synchronization. Reuse by multiple products is evidence for possible promotion, not automatic promotion into base context.

### 2.3 Internal Async Stage Channels

Internal cross-stage/cross-surface dataflow is allowed; blocking is forbidden.

A required unavailable result moves the logical work item to a pending state and releases its worker/stage resources. Producers remain schedulable. Capacity, generation, publication, cancellation, expiry, pressure, reclamation and deadlock outcome are explicit.

Internal Async Stage Channels are **not** the external host↔Search Session control/observation boundary merely because a physical lowering may use similar mailbox/ring mechanics.

## 3. Domain/search products

A domain/search product sits downstream of universal contracts and the extension substrate.

A product owns its:

- domain-specific state/action/history/terminal semantics;
- selected policy/evaluator semantics;
- product output/observation schemas;
- product-specific extension capabilities;
- product reroot/reuse/reset/transform rules;
- package/support/benchmark/search-quality requirements.

The first explicit product proposal is [`CHESS-0001`](../specs/products/chess/CHESS-0001-search-product.md).

Chess may define a bounded ranked legal-move observation, best-move output or MultiPV. That does **not** make ranking a universal MCGS requirement. A future planning or evaluation-only product can select different outputs or no live ranking at all.

The deletion test is deliberate:

```text
remove CHESS-0001 and every chess capability
        ↓
universal core contracts remain complete
extension surfaces remain product-neutral
universal reference/native conformance still has independent oracles
```

## 4. Search Composer

The **Search Composer** is the CUDA-MCGS-owned composition root for a concrete engine. It is a pre-ignition compiler/planner, not a runtime search manager.

Its inputs are layered:

```text
universal contracts
        +
selected universal extension graph/capabilities
        +
optional downstream product contracts/capabilities
        +
finite target/resource/CUDA profile
        ↓
Search Composer
        ↓
normalized Search IR + namespaced selected specialization inputs
        ↓
finite layouts/resources/stage-channel-session plan
        ↓
generated restricted Device-JS core + selected capability/product behavior
        ↓
Search Image / execution package
```

The Composer must:

- normalize universal contracts without embedding first-product fields as core meaning;
- validate namespaced selected capability/product schemas under their owners;
- construct/validate the stage graph and stable base contexts only when the selected extension profile requires them;
- compose only selected capability context/state/resources;
- validate internal Async Stage Channels and Search Session control/observation contracts;
- resolve widths/layouts/ranges/finite capacities;
- select only profile-declared graph/reclamation/reduction/progress mechanism requirements behind accepted owner semantics;
- generate deterministic restricted Device-JS Search Program/source/package identity while keeping CUDA-JS artifact/runtime identity separate;
- fail before ignition for incompatible semantics, resources, versions, permissions or provenance.

CUDA-JS receives canonical restricted Device-JS source/function metadata and consumer-neutral resource/operation/capability requests through public contracts, then returns opaque public realization identities/results. It does not interpret Search IR, stages, capabilities, roots, chess or output meaning.

## 5. Restricted Device-JS realization and zero residue

Version zero expresses CUDA-MCGS-owned device behavior in restricted Device-JS/Search Program source. CUDA-JS may use PTX, LTO, fusion or another qualified realization behind its public contracts.

No selected capability means the complete extension profile/stage graph/surface/context/channel/source/resource/package contribution is absent. Each materialized surface with selected capabilities contributes exactly one semantic stage capability program unit for its complete selected set; deleting one capability removes every solely owned contribution.

Artifact granularity does not imply semantic ownership: one semantic program unit may contain reusable framework capability behavior and product-specific capability behavior because both bind to the same stable checkpoint. CUDA-JS may realize that unit across one or more opaque generated artifacts.

The final binary must charge code size, registers, local/shared memory, occupancy and latency to the realized engine. Representative selected capability behavior is compared against an equivalent fused/generated control using CUDA-JS-owned artifact/resource evidence. Tiny fine-grained hooks are not assumed cheap merely because compilation succeeds.

A strong product-deletion check compares otherwise equivalent images with and without the product capability and proves product-only ABI/context/code/resource residue disappears.

## 6. Search Image and pre-ignition boundary

The **Search Image** is the complete finite executable specialization: the CUDA-MCGS semantic engine profile, restricted Device-JS Search Program/execution package, layouts/resources/configuration and selected contracts/capabilities/products bound to an opaque qualified CUDA-JS realization and compatible-pair identity.

Before ignition, the host may validate, compose, compile/link, allocate, upload and prepare launch/session resources.

After ignition:

- no required stage/capability code is discovered or bound;
- no host registry resolves extension meaning;
- no CPU-produced intermediate internal search decision is required;
- all internal search behavior is already device-resident/device-accessible under the finite plan.

Already-composed capabilities may activate under device-resident rules. Activation is not late binding.

## 7. Long-lived Search Sessions

A long-lived Search Session is a selected universal lifecycle capability, not a requirement for one persistent kernel or one ranked-move consumer.

The generic session contract owns only the optional external lifecycle boundary:

- session/current-root transaction authority and finite root epoch;
- bounded root/control command identity, validation/admission coordination and one commit point;
- concurrent/replayed command ordering and typed transaction outcomes;
- collection of owner-declared prepare/reuse/stale/cleanup dispositions without reinterpreting them;
- bounded observation request/acquire/release and teardown coordination against output-owned immutable publication; and
- cancellation, completion, restart and exact terminal-only zero-residue semantics.

Domain owns root validity; graph owns materialization, protection and reclamation; policy/evaluator/output own reuse meaning; resources own compound capacity admission; progress owns old-work service/stale/closure; output owns snapshot/publication/borrow meaning; CUDA-JS owns sideband/transfer/operation mechanisms.

A rejected root update leaves accepted search-semantic state unchanged. A live observation must not expand/materialize/evaluate/reserve or otherwise advance search merely to satisfy observation.

SESSION-001 provided bounded CUDA-free semantic learning for these rules. It did not establish CUDA concurrency, sideband transport, production reuse policy or performance. A SESSION-002-class native experiment should exercise the same semantics under actual concurrent GPU work.

## 8. Search-specific device program

The realized device program contains only what the selected Search Image requires, potentially including:

- node/edge/state/action/path arenas;
- transposition/collision/publication/generation mechanisms;
- bounded work queues;
- selected domain transition/action behavior;
- selected evaluator execution/publication;
- selected policy reservation/backup/stopping behavior;
- selected stage transitions/surfaces/capabilities/internal channels;
- selected Search Session root/control transaction and observation-request coordination;
- selected product logic/output;
- pressure/stop/diagnostics;
- device-owned progress.

It does not know Node.js Driver symbol discovery or CUDA-JS private handles.

## 9. GPU residency is not one topology

Device closure is an execution contract, not a synonym for a persistent kernel.

Evidence may eventually select persistent queues/kernels, cooperative execution, device-owned multi-kernel workflows, CUDA Graph profiles or another mechanism. The scheduler is chosen from representative workloads and resource/quality evidence.

A host micro-batch relaunch loop is non-conforming whenever the host must choose/advance the next internal search step.

Bounded external environment/root updates and observation consumption are permitted Search Session I/O only when internal device-owned progress remains independent of their servicing.

## 10. Ownership and dependency policy

CUDA-MCGS universal owners include:

- universal Search IR/Search Composer;
- framework composition plus domain/graph/policy/evaluator/output/resource/progress/session semantics;
- Search Stage/surface/capability/channel extension mechanics;
- restricted Device-JS stage composition/checkpoint contract;
- finite search-resource composition and device-progress profiles;
- universal conformance and compatible-pair acceptance.

Downstream product owners include their domain/policy/evaluator/output/reuse/capability/support semantics.

CUDA-JS owns generic CUDA host-runtime/toolchain mechanics: opaque resources, memory/module/function operations, NVRTC/nvJitLink, artifact caching, launch/completion/generic sideband/error/teardown and runtime qualification.

Higher-level CUDA libraries remain methodology/benchmark/source-donor candidates unless an explicit dependency decision proves a runtime dependency is worth its lifecycle/control cost.

## 11. Data ownership and memory

State-node shared data and parent-edge-specific data remain distinct under SPEC-0001. A selected policy decides exact statistics and their reroot validity; retaining a physical node does not automatically make every statistic semantically reusable.

Memory is finite and explicitly partitioned across:

- core graph/path/work resources;
- evaluator/model/workspace;
- Search Session control/observation/root-admission reserve when selected;
- extension capability state/workspace/internal channels;
- selected product resources/outputs;
- CUDA-JS/runtime/code reserve;
- diagnostics/safety reserve.

A valid new authoritative root under a full arena has an explicit bounded admission/reclaim/reject/restart strategy. Surprise allocation is not an escape hatch.

## 12. Conformance strategy

Universal conformance must be independent of chess and cover materially different semantics:

1. fixed DAG/transposition;
2. cyclic/history-sensitive;
3. lazy/very-large/continuous action production;
4. stochastic/chance/observation-bearing domains;
5. evaluator variants including absent and non-scalar shapes;
6. stage surface/capability deletion and a materially different second capability;
7. internal Async Channel pending/progress/pressure/cancellation/deadlock;
8. finite resource pressure/exhaustion;
9. Search Session root/control transaction and observation-request coordination integrated with owner-defined stale work, reuse, reclamation, immutable publication and counter exhaustion;
10. reference/native semantic parity for an exact compatible CUDA-JS pair.

Chess adds its own legality/history/evaluator/output/search-quality conformance on top. Chess passing cannot substitute for universal second-instance evidence.

## 13. Repository product direction

Universal CUDA-MCGS completion/release and chess product completion are separate milestones.

The universal framework may release with the chess product still proposal-only. Conversely, chess work may proceed as a downstream specification/experiment once its consumed universal contracts are stable enough, but must not use product implementation to silently fill gaps in universal meaning.

The canonical sequencing and explicit non-gating chess lane are maintained in [`../../next_step.yaml`](../../next_step.yaml).
