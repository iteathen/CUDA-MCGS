# CUDA-MCGS Framework Specification Map

**Status:** Proposal

This document defines the scope and common invariants that detailed versioned CUDA-MCGS specifications must cover. Existing accepted UMCGS/CUDA-MCGS ADR/specification identifiers remain authoritative within their scopes. This file is not yet a complete implementable specification.

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS framework with a universal least-authority extension/composition substrate and finite specialized Search Images.**

The framework architecture follows [`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md): universal MCGS semantics, universal extension/composition mechanics, and downstream domain/search products are separate semantic layers.

Production source and execution-boundary conformance follow [`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md): maintained implementation is ordinary Node.js plus restricted Device-JS through public CUDA-JS contracts, post-ignition host interaction is narrow and asynchronous, and an unnaturally expressed generic GPU mechanism is escalated as a potential CUDA-JS capability rather than implemented through a local native escape path.

## 1. Three-layer conformance model

### 1.1 Universal MCGS semantic core

A concrete CUDA-MCGS engine is produced from universal search contract families plus a finite resource/session profile. Applicable selected contracts include:

1. **Domain contract** — state, action, transition, identity, node roles, terminal, history, stochasticity/observation, and cycles.
2. **Search-policy contract** — selection, reservation, widening, policy-owned statistics, backup, stopping/budget semantics, and policy-specific persistence/reuse rules.
3. **Evaluator contract** — encoding, resident execution behavior, proposals/evaluation outputs, batching, workspace, perspective, publication, and reuse validity.
4. **Search execution/storage contract** — graph arenas, transposition lookup/publication, path records, work queues, device-owned scheduling, lifecycle, pressure, and generic bounded result publication.
5. **Resource profile** — concrete finite capacities, watermarks, admission, pressure, exhaustion and safety reserve.
6. **Search Session profile when selected** — session/root identity, root updates/reroot, root epochs, stale-work disposition, reuse classification, reclamation, generic bounded observations, cancellation and restart semantics.

These contracts define MCGS meaning without assuming chess, games, a board, players, ranked moves, best-action output, top-k output, one evaluator shape, one policy formula, or one scheduler topology.

### 1.2 Universal extension and composition substrate

A concrete Search Image may additionally select a finite universal extension substrate:

- a finite operational Search Stage graph;
- stage-owned stable entry/exit Stage Extension Surfaces;
- namespaced/versioned capability contracts and schemas;
- bounded Async Stage Channels for cross-stage/cross-surface dataflow;
- deterministic pre-ignition capability composition;
- generated checkpoint contexts/contracts/layouts and finite capability resources;
- zero-or-one optional semantic stage capability program unit per stage, expressed in restricted Device-JS/Search Program source, in the version-zero composition profile.

The **substrate is universal; one capability's payload/behavior is not automatically universal core meaning**. A capability may influence search only through declared least-authority effects, and any semantic effect on domain/policy/evaluator/output/resource/session meaning must also be owned by the selected corresponding contract/profile.

The extension substrate MUST NOT be a runtime callback registry, schema-interpreted service locator, raw-pointer capability escape, or mechanism for product semantics to bypass universal contracts.

### 1.3 Domain/search products

A domain/search product selects the universal core contracts and extension capabilities and then defines product-specific semantics and output.

Chess search is a separately proposed product in [`products/chess/CHESS-0001-search-product.md`](products/chess/CHESS-0001-search-product.md). Chess legal-move ranking, board/history identity, evaluator semantics, MultiPV/best-move output, and chess-specific capabilities remain downstream and MUST NOT be required by universal CUDA-MCGS conformance.

The first-consumer deletion test is normative for layering: removing the chess product must leave a coherent universal framework, Search IR, composer, runtime contracts and conformance suite.

## 2. Compiler/composer outputs

The Search Composer lowers selected universal contracts, extension inputs and product profiles into:

- a versioned normalized Search IR;
- a finite validated Search Stage graph when the selected profile uses stages;
- resolved stage-owned entry/exit surfaces and Async Stage Channels;
- selected product/capability schema identities without converting them into universal core fields;
- a finite graph/search/model/session/capability/channel/output memory plan;
- generated search layouts and checkpoint-specific glue;
- specialized restricted Device-JS/Search Program source with at most one semantic stage capability program unit per stage requiring capabilities;
- a versioned CUDA-MCGS-to-CUDA-JS execution package;
- CUDA-MCGS host/product adapter metadata and bounded result/observation contracts;
- deterministic specialization/cache/provenance identity.

The independent CUDA-JS repository owns generic Node/CUDA Driver execution, compilation/linking, device-artifact handling, generic memory/launch/completion/resource lifetime and generic long-lived sideband mechanisms. CUDA-MCGS owns the semantic content and stronger search/device-closure requirements of its package. CUDA-JS MUST NOT interpret MCGS, Search IR, Search Stage, capability, product, chess, root-update or output meaning.

## 3. Contract and schema relationship

CUDA-MCGS specifications MUST treat schemas as machine-verifiable representation inside broader behavioral contracts.

A behavioral contract MUST define every material property not safely expressible as data shape alone, including:

- semantic meaning and perspective;
- ownership and lifetime;
- allowed reads/writes/effects;
- invariants and pre/postconditions;
- concurrency, ordering, synchronization and publication;
- bounded resources, pressure and saturation behavior;
- cancellation, failure, recovery and compatibility;
- persistence/reuse/invalidation where state crosses root/session/product lifetimes.

A referenced schema MUST define representation facts required for machine verification, including namespaced identity/version, fields, widths, ranges, precision, alignment, normalization, unknown-field/enum policy, and compatibility/migration rules where applicable.

A schema-valid implementation that violates the behavioral contract is non-conforming.

Product/capability schemas are namespaced specialization inputs. Their presence does not promote their fields into universal Search IR meaning.

## 4. Common mandatory engine properties

Every concrete engine specification MUST define, where applicable:

- type widths, ranges, precision, alignment and observable endianness;
- one source of truth for CUDA-MCGS semantic layouts and public package types, while CUDA-JS owns native ABI realization;
- state identity and collision verification;
- transposition and cycle/history semantics;
- parent-edge versus state-node ownership;
- action enumeration/proposal continuation behavior;
- evaluator capabilities and absent-output behavior;
- path and backup perspective/transform semantics;
- concurrency and publication state machines;
- finite capacities, watermarks, overflow and exhaustion;
- cancellation, completion, error and generic result publication;
- compatibility and version negotiation;
- deterministic semantic conformance tests;
- required CUDA-JS contract version/capabilities and exact execution-package identity;
- boundary between CUDA-MCGS semantic failures and CUDA-JS generic runtime/context failures;
- finite operational Search Stage graph when selected;
- exposed extension surfaces/capabilities/channels when selected;
- Search Session/root-update/observation semantics when selected;
- exact production evidence required for zero-residue specialization claims.

No concrete engine is required to expose a ranked action list unless its selected policy/output/product contract requires one.

## 5. Universal Search Stage and Stage Extension Surface family

CUDA-MCGS MUST define a finite operational Search Stage graph for profiles using the extension/scheduler substrate rather than a fixed game-shaped phase pipeline or framework-wide callback ABI.

A **Search Stage** owns one stable operational search state and one complete mutation interval for one logical work item. A stage transition is semantic and per work item; it MUST NOT imply a global barrier, kernel boundary, CUDA Graph node, or host transition.

A stage MAY expose a stage-owned **Stage Extension Surface** at stable `entry`, stable `exit`, both, or neither. A surface MUST NOT cross a stage boundary or exist inside incomplete stage mutation.

Each checkpoint contract defines:

- stable namespaced stage/checkpoint identity/version;
- semantic purpose and invocation scope;
- checkpoint-specific Context Schema;
- least-authority readable/writable facts and bounded control signals;
- core-owned invariants and mutation exclusions;
- memory space, aliasing, lifetime, ordering and publication;
- finite state/scratch/workspace/queue contributions;
- failure, cancellation, pressure and compatibility behavior.

Several selected capabilities at one stage share that stage's surface, context, finite resource plan and composition unit. They do not multiply runtime extension objects or independently callable native fragments.

A product-specific capability uses this universal mechanism but keeps product semantics in a namespaced contract. For example, a future chess tablebase or move-ordering capability may consume a universal checkpoint only if the checkpoint is already semantically valid for non-chess consumers and the capability's chess meaning remains outside universal core state.

If optional behavior must participate inside an invariant-forming operation, it belongs in the selected mandatory stage lowering. If it creates a new stable operational invariant, it becomes a stage. A context schema describes representation at an already-defined checkpoint; it MUST NOT discover attachment location at runtime.

[`SPEC-0003`](SPEC-0003-search-stage-and-extension-surface.md) contains the detailed proposal.

## 6. Async Stage Channel family

Cross-stage/cross-surface internal dataflow MAY use finite **Async Stage Channels**. Cross-stage/cross-surface blocking is prohibited.

Each channel defines at least:

- namespaced identity/version and producer/consumer roles;
- item/correlation identity and generation;
- request/result schema, ownership and lifetime;
- release/acquire publication ordering and CUDA scope;
- readiness, completion, failure and cancellation states;
- capacity, backpressure, expiry, reclamation and stale-result behavior;
- required/optional/advisory consumption and fallback/skip/defer behavior;
- progress, starvation and deadlock outcomes.

A stage MAY publish bounded work for a later stage using separately owned storage. When a required result is unavailable, the logical consumer enters an explicit pending state and releases its worker/stage resources. The scheduler runs other ready work, including the producer. No worker spins or synchronously waits for the result.

Internal Async Stage Channels are distinct from external Search Session control/observation ports. A domain/product root update is not an arbitrary internal extension callback, and a user-facing observation is not an internal readiness dependency merely because both may use a mailbox-like physical mechanism.

[`SPEC-0004`](SPEC-0004-async-stage-channels.md) contains the detailed proposal.

## 7. Search Session, reroot and generic observation family

A long-lived Search Session is a universal framework capability, not a requirement that every profile use dynamic reroot or one persistent kernel.

When selected, the session contract MUST define:

- session identity/incarnation and current root;
- finite monotonic root epochs;
- namespaced external root-update schema(s);
- validation/admission **before root-update-specific graph/search mutation**;
- finite pressure outcome when a valid new root cannot be established;
- one authoritative root-update commit point;
- root-relative old-work capture/disposition and accounting conservation;
- contract-selected reuse/reset/transform/invalidation across graph, policy, evaluator, history, output and extension state;
- separation of logical reroot from reclamation;
- generation-safe reclamation/storage reuse;
- zero or more generic bounded read-only observation schemas;
- finite observation/session generation/exhaustion behavior;
- cancellation, health, completion and restart semantics.

A rejected root update leaves accepted search-semantic state unchanged. A live observation MUST NOT expand/materialize search state or otherwise advance search merely to satisfy observation. Observation cadence must not affect search semantics unless the selected contract says it is actually a semantic input rather than observation.

Ranked actions/moves are one possible product/policy observation schema; they are not required by the universal session contract.

[`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) contains the detailed proposal.

## 8. Search Composer requirements

CUDA-MCGS owns the semantic **Search Composer** that transforms contracts and product/capability selections into one finite specialized engine.

The Composer MUST:

- validate/normalize universal contracts and schemas;
- validate product/capability inputs against their namespaced owning schemas;
- produce canonical Search IR without embedding first-product fields as universal meaning;
- construct/validate the finite operational Search Stage graph;
- resolve stable stage boundaries and normalized capability sets;
- validate all selected capabilities and Async Stage Channels against checkpoint contracts/context schemas;
- resolve Search Session control/observation schemas and finite capacities when selected;
- resolve concrete layouts, widths, ranges and alignment;
- compute finite graph/search/evaluator/session/capability/channel/output/workspace capacities;
- select graph/transposition/cycle/reclamation/reduction/scheduling strategies from accepted capabilities;
- compose mandatory and optional device behavior deterministically;
- generate complete compilation/link/load inputs without requiring CUDA-JS to interpret Search IR;
- produce complete deterministic artifact/cache identity;
- emit the CUDA-MCGS-to-CUDA-JS execution package and typed result/observation manifest.

CUDA-JS MAY supply generic NVRTC/nvJitLink/runtime/sideband mechanisms. CUDA-JS MUST NOT own or infer stage/checkpoint/capability/product meaning, Search IR, search scheduling policy, root updates, output semantics, or search-resource policy.

## 9. Specialization and extension-cost requirements

Production realizations MUST NOT use a universal runtime callback table, arbitrary function-pointer registry, service locator, schema interpreter, per-capability fragment loop, or equivalent hot-path mechanism as the default universality strategy.

The version-zero target is:

> **A stage with no selected optional capability retains no extension-abstraction residue. All capabilities selected for one stage share one semantic stage capability program unit and no generic runtime dispatch.**

For an empty capability set, the realized image omits solely extension-owned enable branches, lookup/dispatch, context packing, persistent state, workspace/channels/diagnostics and synchronization.

For a non-empty capability set, version zero composes exactly one semantic stage capability program unit containing the complete optional stage behavior in restricted Device-JS/Search Program source. If both entry and exit checkpoints are selected, their behavior belongs to that one semantic unit. CUDA-JS owns whether realization uses PTX, LTO, fusion or another qualified native mechanism.

Capability semantics may be universal reusable, product-specific, or project-specific. Artifact granularity does not promote semantic ownership.

Evidence includes semantic source/package comparison, CUDA-JS-owned emitted/final artifact inspection through public evidence where applicable, empty-capability comparison, selected capability behavior versus an equivalent fused/generated control, and representative resource/performance measurements.

[`SPEC-0005`](SPEC-0005-stage-ptx-and-search-image-composition.md) contains the detailed proposal.

## 10. Required CUDA-MCGS specification families

### Universal core families

Detailed specifications are expected for:

- Search IR and versioning;
- domain contract/device realization;
- search-policy contract/device realization;
- evaluator/model contract/resident realization;
- state/action variable-storage model;
- graph node/edge/path/identity/transposition semantics;
- cycle/history handling;
- generated search-layout description;
- finite memory planner and pressure state machine;
- Search Session/root-update/reroot/reclamation/control/observation semantics;
- device-owned scheduler/work queues;
- generic bounded result/observation publication;
- CUDA-MCGS-to-CUDA-JS package and adapter;
- specialization/cache identity;
- deterministic reference/conformance and diagnostics/reproducibility.

### Universal extension-substrate families

- operational Search Stage graph and useful boundary selection;
- Stage Extension Surface/context/capability permissions;
- Async Stage Channels/readiness/progress/reclamation;
- restricted Device-JS stage capability composition/checkpoint contract/Search Image identity;
- capability provenance/security/resource composition;
- exact unused-capability disappearance and representative cost evidence.

### Product families

Products such as chess define separate downstream specs for:

- product domain/policy/evaluator/output contracts;
- product-specific extension capabilities;
- product-specific reroot/reuse rules;
- product package/support/benchmark/quality requirements.

These lists are semantic specification families, not a requirement to create one runtime interface or source component per bullet.

Generic Driver entry-point schemas, CPU call ABI/JIT bindings, generic allocation APIs, NVRTC/nvJitLink plumbing, stream/event wrappers, Node delivery and generic context teardown belong to CUDA-JS.

## 11. CUDA-MCGS-to-CUDA-JS execution package

The version-zero interop specification MUST define:

- required CUDA-JS public contract/capability/evidence profile;
- restricted Device-JS/Search Program inputs, public CUDA-JS realization requirements and complete cross-boundary identity inputs;
- public restricted Device-JS language/helper profile, typed imports/exports, input digests/provenance and requested target constraints;
- finite stage graph, contexts, capability sets, Async Stage Channels and ordered semantic stage capability program units material to the Search Program;
- opaque finite resource requirements without CUDA-JS private handles in persistent schemas;
- function/argument/launch descriptions and allowed execution dependencies;
- initial configuration/model/state upload;
- selected long-lived generic control/observation mechanism requirements without MCGS/product payload interpretation;
- one-way cancellation, completion, diagnostics and typed result publication;
- generic runtime versus semantic failure classification;
- teardown/partial-creation rollback;
- package manifest/checksums/provenance/compatibility negotiation;
- exact compatible-pair conformance ownership.

The package contains or references every device behavior needed for active search. CUDA-JS MUST NOT call back into CUDA-MCGS/JavaScript for intermediate search decisions.

## 12. Universality constraints

The complete framework contract must be capable of representing materially different selected profiles, including combinations such as:

- fixed, variable-blob, delta and custom state storage;
- exhaustive, paged, sparse, sampled and custom action production;
- deterministic/stochastic transitions;
- decision, chance, terminal, observation and custom node roles;
- scalar, categorical, vector, distributional or absent evaluator outputs;
- tree, DAG and cyclic graph semantics;
- atomic-commutative, segmented-associative and ordered-owner backup modes;
- complete, partial, evaluation, proof, sequence, diagnostic, custom bounded or absent live observation/output profiles;
- zero, one or multiple stage surfaces/capabilities/channels;
- session profiles with no reroot, existing-state reroot or externally supplied replacement roots;
- products with and without ranked candidate outputs.

Examples such as best action, top-k or chess move ranking are product/policy choices and not universal Search IR mandatory fields.

A concrete engine MAY support a subset, but its capability/product profile states that subset before composition/compilation.

## 13. Device closure

The production execution plan is closed over all behavior/data needed for internal active search.

Before ignition, CUDA-MCGS/CUDA-JS may configure, validate schemas, compose, compile/link, allocate, load, upload and prepare launch/session resources.

After ignition, host callbacks, host-controlled internal phase progression, extension discovery/binding, late code loading, polling that supplies an internal search decision, filesystem/network service, or CPU-computed intermediate results are non-conforming unless the engine is explicitly diagnostic/reference.

An accepted Search Session profile may receive bounded external environment/domain root updates or other externally supplied attention/control changes and expose bounded coherent observations through a generic sideband mechanism. Each selected input has a finite, versioned, generation-scoped admission/publication/application contract. Those operations do not authorize host-owned internal search progression, and delayed or absent observation consumption cannot block search.

An observation-to-host-decision-to-control-write, polling/relaunch, or callback loop required to choose the next internal search step is non-conforming. The external input must represent outside intent or environment state rather than a CPU-computed search intermediate.

Production CUDA-MCGS device behavior is authored as restricted Device-JS. C/C++, CUDA C++, native addons, direct FFI/Driver access, hand-written PTX, embedded CUDA source and subprocess native search implementations are non-conforming production paths. CUDA-JS-generated device artifacts remain opaque versioned dependency outputs.

When an existing CUDA-JS public contract cannot express a naturally generic GPU mechanism directly, safely and with bounded resource/synchronization/lifecycle semantics, the design pauses for capability classification under ADR-0019. A consumer-neutral mechanism is specified and independently qualified in CUDA-JS; MCGS/domain/product policy remains here. A private import, local native implementation or semantically distorted workaround is not an alternative conformance path.

Device closure does not imply one physical topology. Persistent-kernel, cooperative, device-owned multi-kernel, graph-based or future mechanisms may conform when they preserve device-owned progress and resource/performance contracts.

## 14. Finite memory

The memory plan accounts for:

```text
available device memory reported/validated through CUDA-JS
- safety reserve
- resident evaluator/model and workspace
- universal graph/path/work storage
- Search Session control/observation/root-admission reserve when selected
- extension capability state/workspace/Async Stage Channels
- generic CUDA-JS/runtime/code requirements
- product-specific selected state/output/workspace
- diagnostics
```

CUDA-MCGS derives capacities rather than assuming allocation success. High/critical pressure behavior is deterministic and testable. A valid external root update under full memory has an explicit admission/reclaim/reject/restart policy; surprise allocation is non-conforming.

Managed memory cannot be assumed as the universal arena. Memory kind/addressability/mapping/coherence/synchronization/migration/lifetime/transfer are explicit package/runtime capabilities.

## 15. Ownership and third-party reuse

CUDA-MCGS owns search-semantic/search-critical execution contracts. Higher-level external libraries MUST NOT become mandatory active-search dependencies without an explicit dependency decision covering API/ABI/lifecycle, transitive build/runtime/memory cost, update risk, failure, security, performance, replacement and local control.

Preferred reuse order remains:

1. methodology/design/test reuse;
2. independent implementation of CUDA-MCGS-owned semantics;
3. selective permissively licensed source adaptation after exact revision/license/provenance review;
4. vendored/pinned source with owned patch/update path;
5. higher-level runtime dependency only when measured benefit outweighs ownership cost.

Product-specific reuse belongs to the product owner and does not automatically become a universal dependency.

## 16. Test and compatibility ownership

CUDA-MCGS universal conformance owns:

- semantic reference interpretation;
- synthetic second-instance search domains;
- Search IR/core contract conformance;
- stage/surface/channel/capability substrate conformance;
- Search Session/root-update/observation/reclamation conformance;
- finite memory/pressure/device-closure semantics;
- search package/manifest identity;
- exact empty-capability disappearance and representative extension cost.

A product owns additional product-specific conformance. Chess tests cannot substitute for universal second-instance tests, and universal tests do not prove chess legality/search quality.

CUDA-JS owns generic runtime/resource/compile/link/load/launch/completion/sideband/error/teardown conformance.

A cross-repository compatibility capsule validates exact revision/artifact pairs without making either repository's mock the other's semantic oracle.

## 17. Required experiment gates before production commitment

Unresolved implementation choices use bounded experiments rather than silent architectural promotion:

- **EXT-PTX-001 (completed bounded discovery)** — direct relocatable PTX composition, exact unused disappearance and negative/granularity evidence; useful mechanism evidence only.
- **STAGE-COMPOSE-001** — representative multi-capability restricted Device-JS composition versus equivalent fused control with CUDA-JS-owned final artifact/resource/performance evidence.
- **STAGE-CONTRACT-001** — reject wrong stage/checkpoint/context/permission/resource/ordering and prove useful boundaries across materially different domains/products.
- **CHANNEL-001** — required/optional internal async dataflow, release/acquire, pending/ready, saturation, cancellation, stale generations, deadlock outcome and cleanup.
- **SCHED-001** — compare credible device-owned scheduler realizations under equivalent semantic/resource workloads.
- **TT-001** — compare transposition-table methodology/implementation choices for collision/publication/generation/reclamation/finite capacity/performance.
- **SESSION-001 (completed bounded semantic learning)** — CUDA-free deterministic experiment supporting root-epoch stale-work isolation, reroot/reclamation separation, read-only observation, admission-before-mutation, generation safety, counter exhaustion and the full-arena root-update pressure question. It does not prove native concurrency or universal statistics reuse.
- **SESSION-002** — native concurrent root-update + old-work drain/abandonment + generic read-only observation + generation-safe reclamation + full-arena root admission/pressure under the selected CUDA scheduler and consumer-neutral CUDA-JS sideband mechanism.
- **PRODUCT-CHESS-001** — after universal contracts are stable enough, validate chess domain identity/history/transposition/reroot/output requirements against the universal framework without modifying universal meaning.

Every experiment records exact environment/artifact/workload identity, semantic equivalence, resource accounting, promotion/rejection criteria and cleanup.

Backend-neutral semantic acceptance and native production-profile qualification are separate gates. Bounded schema/normalizer/reference experiments may provide evidence needed to accept a contract before production lowering. Native publication/race behavior, final CUDA-JS-generated artifacts, performance, exact compatible pairs and teardown qualify a selected production profile later unless the evidence is genuinely required to determine semantic meaning. No acceptance clause may require production implementation that the same specification gate prohibits from beginning.

## 18. Open decisions

Before production implementation, accepted specs/evidence are still required for:

- the complete Search IR representation beyond accepted 0.1.0;
- explicit representation of core versus namespaced capability/product inputs;
- complete Search Stage graph/useful-boundary representation;
- Stage Extension Surface/capability/context representation;
- Async Stage Channel/readiness/progress representation;
- Search Session/root-update/observation representation;
- first production root-update capacity/admission strategy;
- reuse classification across graph/policy/evaluator/history/output/extension state;
- CUDA-MCGS-to-CUDA-JS package and generic long-lived sideband compatibility contract;
- restricted Device-JS stage composition/public package/representative cost envelope;
- scheduler selection/profile rules;
- node/edge identity/generation encoding and TT reuse decision;
- variable-size arena model;
- evaluator resident execution/task contract;
- reference backend/synthetic conformance suite;
- generic bounded result/observation contract family;
- chess domain/policy/evaluator/output product specification and evidence, separately from universal engine acceptance;
- diagnostics ownership between CUDA-MCGS and CUDA-JS.

No open chess decision blocks stating the universal architecture unless the universal contract itself is incomplete.
