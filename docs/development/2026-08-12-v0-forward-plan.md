# CUDA-MCGS v0 Forward Plan — Contract-First Universal Engine

**Status:** Proposal

**Last reconciled:** 2026-08-25

**Parent plan version:** `CUDA-MCGS-V0/27`

**CUDA-MCGS input baseline:** protected `main` `b578de197cf92d8ba06ff236e3c2d1ca05278423`.

**CUDA-JS authority baseline:** protected `main` `05008fb988558e909cb3802fa12a73d612e70bf0`.

**CUDA-JS implementation/package baseline:** `05008fb988558e909cb3802fa12a73d612e70bf0`, package `cuda-js@0.1.0-alpha.7`; exact pair selection remains separate.

## Outcome

Complete a library that makes GPU-resident MCGS easy to use while retaining a contract-defined universal framework, schema-backed least-authority extension support and statically specialized finite engines, without letting the first domain/product, convenience facade or CUDA implementation details become universal core meaning.

This plan contains **unfinished work only**. Completed layering correction, Search IR foundation, bounded reference/mechanism experiments, Connect Four reference work, and CUDA-JS portable capability implementations are inputs, not tasks to repeat.

## Durable ownership boundary

CUDA-MCGS owns:

- universal/domain/product MCGS semantics;
- Search IR and semantic Search Program composition;
- domain/policy/evaluator/output/session/resource/graph contracts;
- schema-selected capability semantics and finite resource contributions;
- restricted Device-JS search/domain/capability programs;
- reference/native semantic conformance and CUDA-MCGS package/adapter identity.

CUDA-JS owns:

- restricted Device-JS syntax/helper/typing validation;
- all CUDA-specific lowering and generated CUDA C++/PTX/cubin/LTO realization;
- CUDA headers, compiler/linker/provider/ABI details;
- generic CUDA memory/resource/operation/launch/completion/error/teardown mechanisms;
- generic sideband/concurrency/platform capabilities and their qualification.

A maintained CUDA-MCGS production path is JavaScript only: ordinary Node.js plus restricted Device-JS through versioned public CUDA-JS contracts. It must not require C/C++, CUDA C++, `.cu`/`.cuh`, hand-authored PTX, embedded CUDA source, native addons, direct FFI/Driver calls, raw CUDA handles, or subprocess native search. This restriction does not apply to CUDA-JS, which may use JIT, native code and CUDA-specific implementation wherever needed or desired. The former CUDA C++/PTX experiments were deleted after their findings received durable owners; their archive summaries are history only. CUDA-JS-generated artifacts remain opaque dependency outputs.

The current CUDA-JS surface is not assumed complete. If a naturally generic GPU mechanism cannot be expressed directly, safely and with bounded resource/synchronization/lifecycle semantics, stop and classify it under ADR-0019 rather than distort CUDA-MCGS or add a local escape path. The capability may be motivated by this first consumer, but CUDA-JS must own a consumer-neutral contract and independent qualification while CUDA-MCGS retains search policy.

## Dependency law

1. Universal **semantic core contracts are meaningful without the extension substrate**.
2. The extension substrate is universal composition machinery, but an unselected capability contributes **zero solely extension-owned runtime residue**.
3. A concrete specialization materializes only schema-declared attachment points required by its selected capability set.
4. Search IR/Composer integrates accepted core contracts and selected namespaced capability/product inputs; it does not create their semantics.
5. CUDA-JS realization happens after semantic normalization and cannot learn MCGS/domain/product meaning.
6. Downstream products such as Connect Four/chess consume the framework and do not gate universal core completion.
7. Convenience calls, presets and explicit composition resolve through one canonical normalized-profile path; ease does not create a second runtime or semantic authority.

## ENGINE-CONTRACT-01 — universal semantic contract proposal packet

**Completed proposal node.** Production universal lowering remains blocked. This node made the owning semantics decision-complete proposals; it did not accept them before their schema/reference obligations have decisive evidence.

The canonical execution record beneath accepted authority for this plan node—critical assessment, exact semantic focus-branch map, dependency graph, branch contracts, falsifiers, token posture, cleanup obligations and branch dispositions—is [`2026-08-24-engine-contract-01-assessment-and-plan.md`](2026-08-24-engine-contract-01-assessment-and-plan.md). SPEC-0000 and the domain, graph, policy, evaluator, output, resource, device-progress and optional Search Session proposals SPEC-0006 through SPEC-0013 were reconciled through PR #79 at `main@22e3ea5`. The universal semantic owner is **device-owned search progress**; physical scheduler mechanisms remain later profile selections.

Completed output:

- exact 741-requirement proposal packet reconciled with one semantic owner per material fact/lifecycle;
- architecture/index/registry/plan/issue routing and cleanup reconciled on one exact revision;
- downstream extension, schema/normalizer/Composer, reference/oracle and integrated-acceptance obligations published without changing proposal-only status.

**Exit:** each semantic fact/lifecycle has one proposed owner; first-consumer deletion and materially different second-instance tests pass conceptually; finite resource/failure behavior and schema/reference obligations are explicit; no product/CUDA implementation fact leaks into universal meaning. Final semantic acceptance occurs at `ENGINE-CONTRACT-ACCEPTANCE-01`.

**Falsifier:** a core contract becomes incoherent when all extension capabilities or chess/Connect Four are deleted.

## ENGINE-EXTENSION-01 — schema-backed extension substrate

**Completed proposal node.** The critical assessment and dependency-ordered semantic focus-branch map are [`2026-08-25-engine-extension-01-assessment-and-plan.md`](2026-08-25-engine-extension-01-assessment-and-plan.md). `EXT-STAGE-01`, `EXT-CHANNEL-01` and `EXT-COMPOSE-01` integrated decision-complete SPEC-0003/0004/0005 proposals through PRs #82/#84/#86; `EXT-INTEGRATE-01` reconciled the exact 248-requirement packet through PR #87 at `main@0ba119f`. This completed proposal scope only, not semantic acceptance or implementation.

Review/revise SPEC-0003 through SPEC-0005 into decision-complete proposals only after their relationship to the core owners is explicit. Final semantic acceptance follows normalized schema/reference evidence rather than preceding it.

Required shape:

- Search Stages are semantic per-work-item validity/state transitions, not global phases/kernels/modules/graphs;
- stable Stage Extension Surface **schemas/semantics**, with concrete ports/hooks materialized only for selected capabilities;
- minimal extension-only base checkpoint views of source-owner stable facts;
- namespaced/versioned selected capability context/state/resource contributions;
- bounded nonblocking Async Stage Channels;
- no runtime callback registry, fragment loop, schema interpreter, host resolution or late binding after ignition;
- absent capability/product removes its hook/port/context/channel/storage/synchronization residue exactly;
- capability semantics that alter domain/policy/evaluator/output/session/resource meaning name the accepted owning contract rather than redefining it through the surface.

The revised SPEC-0005 replaces the older Stage-PTX-input model with a restricted Device-JS/Search Program input and opaque CUDA-JS-generated artifact-output contract. Its remaining review must preserve CUDA-MCGS semantic composition identity and CUDA-JS ownership of lowering and CUDA/PTX/cubin/LTO realization. RDC/LTO are optional generic realization mechanisms, not universal semantic requirements.

The assessment classified device-scope release/acquire publication as a missing consumer-neutral Device-JS capability in [CUDA-JS #123](https://github.com/iteathen/CUDA-JS/issues/123). Native Async Stage Channel qualification depends on that public capability; backend-neutral specification/schema/reference work does not. CUDA-MCGS must not substitute relaxed observation, fake RMW reads, undocumented fence recipes or native code.

## ENGINE-IR-COMPOSER-01 — normalized Search IR and Search Composer

**Completed bounded representation/composition evidence node through PR #116.** The critical assessment, dependency-ordered semantic focus map and exact handoff are [`2026-08-25-engine-ir-composer-01-assessment-and-plan.md`](2026-08-25-engine-ir-composer-01-assessment-and-plan.md). It preserves accepted Search IR 0.1.0, assigns proposal Search IR 0.2.0 fragments to their semantic owners and keeps the reference Composer under bounded experiments rather than prematurely creating a production component. `IR-INTEGRATE-01` reconciles 878/878 CUDA-free cases, all 989 evidence dispositions and exact separated attention/root, public CUDA-JS-only projection and product-assumption-absence evidence under canonical key `70aa92baf5ab1fee4bf4b85af4cf1e6d76eca3c51fc11ab4120d62a6f71529d9`. The final partition is 904 partial, 33 pending behavioral-oracle and 52 deferred native-compatible-pair requirements; no proposal is accepted by this node.

After the core and extension proposals are decision-complete, execute an explicitly bounded, non-production schema/normalizer/reference-composer evidence node:

- extend Search IR beyond accepted 0.1.0 foundations to represent selected domain/policy/evaluator/output/resource/session contracts, namespaced capability/product inputs and exact versions;
- distinguish universal base meaning from specialization-only fields;
- normalize finite resource contributions before code generation;
- deterministically compose one semantic restricted Device-JS/Search Program/package input for CUDA-JS;
- preserve exact absent-capability/product deletion and canonical identity;
- prohibit runtime schema interpretation or host-owned active-search decisions.

The Composer may select a CUDA-JS capability such as RDC/LTO only when a later concrete realization needs it and its claimed profile is qualified; availability alone does not make it a framework dependency. This node authorizes representation and CUDA-free reference evidence only, not production CUDA lowering.

ADR-0020 and [issue #109](https://github.com/iteathen/CUDA-MCGS/issues/109) govern the public-library input boundary; `IR-COMPOSER-01` integrated its resolved-input/default provenance and convenient/explicit canonical-equivalence evidence. ADR-0022 now supersedes ADR-0021's broad root-advance model: the integrated proposal evidence remains truthful for its exact input but does not represent initial root, minimum-work advance, general reroot and non-structural attention as four distinct operations. `REF-ROOT-CONTROL-01` deliberately reconciles SPEC-0006, schema/composition and affected identities before Graph. Exact SDK class/function names and production facade implementation remain downstream of accepted semantics.

## ENGINE-REFERENCE-01 — universal reference/conformance

**Current focus after PR #116 protected-target verification, tracked in [issue #36](https://github.com/iteathen/CUDA-MCGS/issues/36).** The [critical assessment and dependency-sized focus map](2026-08-25-engine-reference-01-assessment-and-plan.md) is complete. Build owner-local deterministic or schedule-invariant CUDA-free oracles from the frozen Composer evidence key; reference code may exercise proposal meaning but may not invent, repair or bypass missing schema meaning.

- retain existing Search IR reference evidence;
- add materially different synthetic domains/evaluator/output shapes so Connect Four cannot become the hidden template;
- exercise graph/transposition/path/cycle/resource/output/session rules at boundaries;
- reconcile initial root, minimum-work advance, general reroot and non-structural attention representation before extending Graph, preserving compatible descendant work and shared transposed nodes while superseding sibling occurrences lazily;
- keep the declared-schedule/event/mutation harness semantically neutral and keep each owner oracle independently replaceable;
- reuse the current SPEC-0004 Channel logical oracle under its owning experiment rather than copying it;
- deliver a complete finite `session-absent`, extension-absent terminal reference slice before optional live Session/Stage/Channel integration; and
- use the integrated Connect Four experiment as a downstream product oracle, never as universal implementation authority.

The terminal slice is the first executable CUDA-free developer-preview milestone. It does not authorize a production component, public SDK, native support or performance claim.

`REF-HARNESS-01` supplies the protected-integrated semantic-neutral experiment skeleton. `REF-DOMAIN-01` extends it to 49/49 passing cases against the live 878/878 Composer output and exact three-profile normalized Domain projection. The 27 Domain cases map and exercise all 47 direct SPEC-0007 reference-oracle requirements while preserving deterministic/stochastic/history/observation/lazy-action diversity and strict Domain ownership. This remains bounded behavioral evidence for its exact proposal input, not proposal acceptance or ADR-0022 conformance. `REF-ROOT-CONTROL-01`, tracked by [issue #113](https://github.com/iteathen/CUDA-MCGS/issues/113), is next and must regenerate affected proposal-derived evidence coherently; `REF-GRAPH-01` is blocked until it integrates.

## ENGINE-CONTRACT-ACCEPTANCE-01 — integrated semantic acceptance

After the proposal, Search IR/Composer and universal reference nodes agree on one exact revision:

- accept the product-neutral core specifications and SPEC-0000 only when every semantic owner, range, lifecycle, failure, finite-resource and compatibility obligation is complete;
- accept SPEC-0003 through SPEC-0005 only when their selected-only schema, identity, permission, resource and deletion semantics are represented and reference-falsified;
- accept SPEC-0006 semantic session/control/observation contract only when its normalized representation and CUDA-free lifecycle/concurrency model are coherent with the core owners;
- distinguish backend-neutral semantic acceptance from native production-profile qualification;
- preserve every native publication, race, final-artifact, performance, compatible-pair and teardown obligation as a later profile gate rather than using it circularly as a prerequisite for the contract that defines what native evidence must prove.

**Acceptance:** accepted specs, normalized Search IR, reference oracles, indexes/status and downstream plan dependencies agree on one exact revision. No production component or native-support claim is created by this node.

## PRODUCT-CONNECT4-01 — formal product and external deletion

After `ENGINE-CONTRACT-ACCEPTANCE-01` and selected CUDA-JS Device-JS native evidence are ready:

1. define a downstream Connect Four product specification selecting the needed universal contracts/capabilities;
2. express the production-oriented device algorithm in CUDA-MCGS-owned restricted Device-JS/Search Program source;
3. have CUDA-JS validate/lower/compile/load/execute it without MCGS semantics;
4. compare semantic results against the CUDA-free Connect Four reference and retained bounded GPU feasibility evidence;
5. prove maintained CUDA-MCGS production source requires no CUDA-specific implementation;
6. record first-consumer deletion: deleting Connect Four leaves universal CUDA-MCGS coherent, and deleting CUDA-MCGS leaves CUDA-JS Device-JS coherent.

A missing generic GPU primitive is routed to CUDA-JS when it has a natural consumer-neutral contract; no local CUDA escape hatch is permitted. If that separation is unnatural, reconsider the CUDA-MCGS design.

## ENGINE-NATIVE-01 — first finite OS-neutral native universal engine

A finite terminal native engine may proceed only after `ENGINE-CONTRACT-ACCEPTANCE-01`, the relevant semantic/IR/Search Program/adapter contracts are accepted, and the selected CUDA-JS capabilities have exact Ubuntu 24.04 reference-profile evidence. Engine contracts and universal inputs remain OS- and distribution-neutral; Linux/Ubuntu identify the first native realization and exact qualification cell rather than the engine architecture.

Under ADR-0023, this is a bounded parallel engine rather than a serial semantic loop moved onto a GPU. The correctness-first profile must permit multiple useful GPU work items to progress across selected Domain, Graph, Policy, Evaluator and device-progress owners. Search meaning remains scheduler-neutral; the selected profile owns its physical mapping and qualification. A serialized native form may exist only as a diagnostic control.

Required:

- one exact public CUDA-JS compatible pair;
- pre-ignition deterministic specialization and finite resource plan;
- device-owned active search progress with no CPU-produced intermediate search decisions;
- concurrent graph claims/publication, policy reservations/backups and selected Domain/evaluator batches with semantics matching the reference allowed-outcome sets;
- pure Node.js/restricted Device-JS maintained production source through public CUDA-JS contracts;
- exact independent reference/oracle comparison;
- typed pressure/failure behavior and terminal resource/lifecycle evidence;
- no claim that optional long-lived sideband, multi-stream, graph/cooperative, RDC, LTO, advanced warp/shared-memory primitives or tensor execution are required unless the selected engine profile actually uses and qualifies them.

## ENGINE-SESSION-NATIVE-01 — optional live-session profile

Long-lived external root/attention/observation during active device work is a **separate profile**, not a universal release blocker for the finite terminal engine.

It additionally requires:

- accepted SPEC-0006 session semantics;
- the accepted CUDA-JS SPEC-0014 publication-mailbox capability plus exact native qualification for the selected live-session pair;
- SESSION-002-class native evidence for concurrent root updates, stale work, generation-safe reclamation, coherent read-only observation and teardown.

Host control publishes bounded externally supplied attention/root/budget/priority or other selected inputs and asynchronously reads coherent observations; it never advances internal search. Observation-to-host-decision-to-control-write, polling/relaunch and callback progression loops are prohibited.

## ENGINE-PERF-01

After correctness/lifecycle are established:

- select scheduler topology from evidence while preserving device closure;
- compare the parallel baseline against credible profile alternatives using occupancy, divergence, contention, batching, memory and synchronization evidence;
- characterize representative resource/performance/search-quality behavior without elevating one domain metric to universal semantics;
- keep tensor-shaped execution in a separate experimental lane until an owner-local candidate beats an equivalent non-tensor parallel baseline after packing, transformation and synchronization costs;
- characterize the exact Linux CUDA-JS/CUDA-MCGS pair on qualified hardware before any representative performance claim;
- keep Linux support and performance claims exact and independent from portable/reference or retained Windows evidence;
- add Windows performance/qualification as a separate peer profile, never as a substitute for the first Linux reference cell or as a reason to shape shared engine contracts.

## RELEASE-01

Public CUDA-MCGS SDK/package/release remains last:

- accepted versioned contracts and Search IR/Composer identity;
- clean package/adapter ownership with one-way CUDA-JS dependency;
- exact compatible-pair evidence;
- first-consumer deletion and materially different second-instance evidence;
- finite resource and lifecycle conformance;
- honest Windows/Linux/capability support matrix;
- protected exact-head stabilization.

Chess remains a separately tracked downstream proposal/product lane and never gates universal parent release.

## Non-goals during this plan

Do not:

- implement production universal components before owning specs are accepted;
- make chess, Connect Four, ranked actions, scalar values, one evaluator, or one search formula universal;
- materialize extension ports/hooks where no selected capability requires them;
- use extension surfaces to bypass core semantic ownership;
- make Search Stage acceptance a prerequisite for stating independent core domain/policy/evaluator/output/resource semantics;
- make CUDA-MCGS own CUDA/PTX/LTO/source/compiler/Driver implementation;
- add C/C++, CUDA C++, a native addon, direct FFI, embedded CUDA source or a subprocess native search path;
- force an unnatural CUDA-MCGS workaround when the missing behavior is a naturally generic CUDA-JS capability;
- require a host relaunch/polling loop to advance active search;
- require sideband/multi-stream/graphs/RDC/LTO merely because CUDA-JS exposes or plans them;
- claim native support from reference/portable evidence;
- reopen completed Connect Four reference, Search IR foundation, or CUDA-JS portable implementation work as future tasks.
