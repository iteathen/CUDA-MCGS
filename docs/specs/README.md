# Specifications

**Status:** Informational

This directory contains versioned CUDA-MCGS search contracts and downstream product specifications. No interface is accepted merely because it appears in architecture discussion, research, implementation, tests, a plan, product example, or proposal.

Read specifications through [`../../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md`](../../agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md): verify status, owner, scope, version, exact revision and supersession; follow normative references; read governing requirements to semantic closure; inspect material producer/consumer/lifecycle/test adjacency; refresh when scope/authority changes.

Accepted status governs only within declared scope. Proposal specifications support drafting, review and explicitly authorized experiments; they do not authorize production implementation by themselves.

## Architectural layering

[`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md) separates three semantic layers:

1. **Universal MCGS semantic core** — domain/policy/evaluator/graph/resource/session/publication/search-lifecycle contracts and Search IR/Composer meaning that remain coherent across unrelated MCGS products.
2. **Universal extension/composition substrate** — Search Stages, least-authority Stage Extension Surfaces, namespaced capability schemas, Async Stage Channels and restricted Device-JS/Search Image specialization.
3. **Domain/search products** — downstream products such as chess that select universal contracts/capabilities and own product-specific state/action/history/evaluator/output semantics.

The extension substrate is universal; a selected capability's payload is not automatically universal core meaning. Product-specific schemas must disappear with the product/capability rather than widening every Search Image.

[`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) additionally governs every production proposal: ordinary Node.js plus restricted Device-JS is the maintained source boundary; post-ignition host interaction is narrow and asynchronous; and an unnatural expression of a generic GPU mechanism is classified as a CUDA-JS capability gap rather than implemented as native CUDA-MCGS code.

## Current accepted contracts

- [`SPEC-0001-device-search-publication-and-resources.md`](SPEC-0001-device-search-publication-and-resources.md) — backend-neutral publication, graph identity/edge ownership, path-cycle ordering, finite-resource exhaustion, partial-result validity and scheduler-neutral conformance, version 0.1.0.
- [`SPEC-0002-search-ir-and-reference-semantics.md`](SPEC-0002-search-ir-and-reference-semantics.md) — foundational Search IR 0.1.0 representation, strict normalization, canonical identity and deterministic CUDA-free reference semantics for the SPEC-0001 boundary.

These accepted contracts do not require a ranked-action output. Their references to ranking constrain validity only when a later selected policy/output contract uses ranking. They do not authorize production CUDA lowering, generated ABI, complete extension-capable Search IR, production scheduler/graph store, Search Session sideband, product output, or CUDA-JS integration.

## Universal specification families

### Universal MCGS core

Universal proposal and evidence families include:

- normalized Search IR and specialization identity;
- domain/state/action/transition/identity/history contract;
- search-policy selection/reservation/widening/backup/stopping contract;
- evaluator/model semantics/resident execution;
- graph storage/transpositions/paths/cycles/reclamation;
- finite resource/memory planning and typed pressure/exhaustion;
- optional external Search Session root/control transactions and observation-request/borrow coordination across source-owned stale-work, reuse, reclamation and publication semantics;
- generic bounded result/observation publication;
- device-owned progress/device closure without scheduler-mechanism selection;
- Search Composer and generated Search Image/package;
- CUDA-MCGS-to-CUDA-JS compatibility/error/lifecycle contract;
- deterministic reference/synthetic conformance/diagnostics.

### Universal extension/composition substrate

- operational Search Stage graph/useful semantic boundaries;
- stable least-authority Stage Extension Surfaces;
- universal base checkpoint contexts plus selected namespaced capability-context contributions;
- capability schemas/permissions/semantic-owner binding;
- bounded nonblocking Async Stage Channels;
- restricted Device-JS/Search Program/checkpoint contract/Search Image composition;
- zero-residue absent-capability specialization;
- capability provenance/security/resource composition and representative cost evidence.

Generic CUDA Driver symbol schemas, host-call ABI/JIT bindings, memory-provider implementation, NVRTC/nvJitLink plumbing, stream/event wrappers, Node event-loop delivery and generic context teardown are CUDA-JS specification families.

## Current universal proposals

- [`SPEC-0000-framework-requirements.md`](SPEC-0000-framework-requirements.md) — LEGO owner/dependency map, normalized framework profile, top-level lifecycle, deletion, package boundary and integrated conformance obligations.
- [`SPEC-0003-search-stage-and-extension-surface.md`](SPEC-0003-search-stage-and-extension-surface.md) — universal Search Stage/surface/base-context/capability composition semantics and product-capability isolation.
- [`SPEC-0004-async-stage-channels.md`](SPEC-0004-async-stage-channels.md) — bounded **internal** cross-stage/cross-surface dataflow, pending/ready progress, publication, pressure, cancellation and reclamation.
- [`SPEC-0005-stage-ptx-and-search-image-composition.md`](SPEC-0005-stage-ptx-and-search-image-composition.md) — revised restricted Device-JS/Search Program input and opaque CUDA-JS-generated artifact-output proposal, retaining selected-only/zero-residue invariants without CUDA-MCGS-owned PTX.
- [`SPEC-0006-search-session-control-and-observation.md`](SPEC-0006-search-session-control-and-observation.md) — optional external Search Session transaction/root-epoch and bounded control/observation-request lifecycle coordination, with source-owner reuse/stale/publication semantics, device-owned progress and exact terminal-only zero residue.
- [`SPEC-0007-domain-state-action-and-transition.md`](SPEC-0007-domain-state-action-and-transition.md) — product-neutral state/action/transition/identity/history/node-role/terminal-outcome semantics, including collision verification, intrinsic and admitted action sources, finite execution and explicit downstream evidence obligations.
- [`SPEC-0008-search-policy-and-backup.md`](SPEC-0008-search-policy-and-backup.md) — product-neutral role handling, selection, reservation, widening/admission, policy statistics, value mapping/algebra, cycle response, backup, stopping and reroot-reuse semantics without requiring scalar, zero-sum, ranked-action or evaluator-specific meaning.
- [`SPEC-0009-evaluator-contract.md`](SPEC-0009-evaluator-contract.md) — optional product-neutral evaluator capabilities, finite request/result lifecycles, input encoding, pre-ignition residence, batching/workspace, internal readiness, cache coherence and reroot reuse with exact evaluator-absent zero residue.
- [`SPEC-0010-graph-storage-and-reclamation.md`](SPEC-0010-graph-storage-and-reclamation.md) — graph object/reference/publication/transposition/path/root-protection/reclamation semantics, with opaque owner regions, stale-safe generations, optional reclamation and no storage-mechanism selection.
- [`SPEC-0011-finite-search-resources.md`](SPEC-0011-finite-search-resources.md) — finite selected-owner resource composition, pre-ignition feasibility, atomic/compound admission, partitions/reserves, conservation, watermarks and typed exhaustion without allocation or semantic victim-policy ownership.
- [`SPEC-0012-device-owned-search-progress.md`](SPEC-0012-device-owned-search-progress.md) — scheduler-neutral device-side work readiness, finite service/fairness, typed deadlock/livelock/starvation, stop/drain and closure semantics without host progression or physical topology selection.
- [`SPEC-0013-result-and-observation-publication.md`](SPEC-0013-result-and-observation-publication.md) — mandatory bounded terminal envelopes plus optional immutable read-only live observations, with explicit snapshot consistency, slot/borrow lifecycle, pressure/drop semantics and exact terminal-only sideband deletion.

These proposals do not authorize production lowering. The complete Search IR must represent selected universal semantics plus namespaced capability/product inputs without promoting first-product fields into universal core meaning.

SPEC-0000 and SPEC-0006 through SPEC-0013 form the decision-complete core proposal packet. SPEC-0003 is the decision-complete optional stage/surface/capability proposal; SPEC-0004 and SPEC-0005 remain its dependency-ordered channel and restricted Device-JS composition reconciliation inputs. Neither packet is accepted until strict schema/normalizer/Composer and consolidated CUDA-free reference evidence pass atomically at the integrated acceptance gate.

## Domain/search product specifications

Products live downstream of universal contracts. Their conformance cannot substitute for universal second-instance tests, and product requirements cannot amend universal semantics by usage.

Current product proposal:

- [`products/chess/CHESS-0001-search-product.md`](products/chess/CHESS-0001-search-product.md) — chess domain/policy/evaluator/session/output/extension layering, including a future chess-specific ranked legal-move observation published by generic SPEC-0013 output semantics and coordinated by optional SPEC-0006 session semantics.

Future Go/planning/optimization/text-search or other products should be able to replace the chess product without foundational redesign.

## Acceptance discipline

Use [`../../agent_files/templates/specification.template.md`](../../agent_files/templates/specification.template.md) with governing contract, compatibility, testing and documentation methods.

An accepted CUDA-MCGS specification must define applicability, normative references, invariants, ranges, ownership, lifecycle, failure/exhaustion, compatibility, security, generated/cache identity, testing, cleanup, downstream invalidation and peer-runtime effects.

Specification acceptance and production-profile qualification are distinct gates. Backend-neutral semantic acceptance requires decision-complete obligations plus decisive schema/reference evidence at the risk-appropriate boundary. Native publication/race behavior, final generated artifacts, performance, exact CUDA-JS compatible pairs and runtime teardown qualify a concrete production profile later unless that evidence is genuinely required to determine the contract's meaning. An acceptance clause must not require production implementation that is itself prohibited until the specification is accepted.

For universal extension specifications, acceptance additionally requires first-consumer deletion and materially different second-capability/product tests. For product specifications, acceptance requires explicit proof that product deletion leaves universal architecture/conformance complete.

The canonical execution order and focus branches are maintained in [`../../next_step.yaml`](../../next_step.yaml).
