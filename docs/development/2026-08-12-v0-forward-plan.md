# CUDA-MCGS v0 Forward Plan — Contract-First Universal Engine

**Status:** Proposal

**Date:** 2026-08-12

**CUDA-MCGS input baseline:** protected `main` `ded3ef7d5257e28183a3b60c8fbff1f0ea8aed0b`.

**CUDA-JS input baseline:** protected `main` `fe9ed78939d3876790291421cec367fde58a8310`, package `cuda-js@0.1.0-alpha.5`.

## Outcome

Complete a contract-defined universal GPU-resident MCGS framework with schema-backed, least-authority extension support and statically specialized finite engines, without letting the first domain/product or CUDA implementation details become universal core meaning.

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

A maintained CUDA-MCGS production path must not require `.cu`/`.cuh`, hand-authored PTX, CUDA headers/options/ABI logic, Driver calls, raw CUDA handles, or CUDA-specific thread/atomic/barrier syntax. Existing CUDA experiments remain bounded evidence only.

## Dependency law

1. Universal **semantic core contracts are meaningful without the extension substrate**.
2. The extension substrate is universal composition machinery, but an unselected capability contributes **zero solely extension-owned runtime residue**.
3. A concrete specialization materializes only schema-declared attachment points required by its selected capability set.
4. Search IR/Composer integrates accepted core contracts and selected namespaced capability/product inputs; it does not create their semantics.
5. CUDA-JS realization happens after semantic normalization and cannot learn MCGS/domain/product meaning.
6. Downstream products such as Connect Four/chess consume the framework and do not gate universal core completion.

## ENGINE-CONTRACT-01 — universal semantic contract packet

**Current focus.** Production universal lowering remains blocked until the owning semantics are accepted.

Remaining work:

- review/revise/accept proposal SPEC-0000 against ADR-0018;
- author or split explicit product-neutral owners for domain, policy, evaluator, generic output, graph/storage, finite resources and scheduler/device-progress semantics where the current proposal packet is incomplete;
- review/revise SPEC-0006 Search Session/control/observation against those owners, including admission-before-mutation, root epochs, stale-work disposition, reroot/reclamation separation, reuse classifications, read-only observations and stale-safe finite counters;
- ensure generic result/observation payloads do not imply ranking, scalar value, legal moves, games, or one evaluator shape;
- keep Search Stage vocabulary out of core semantics unless a core contract actually requires it.

**Acceptance:** each semantic fact/lifecycle has one owner; first-consumer deletion and materially different second-instance tests pass conceptually; finite resource/failure behavior is explicit; no product/CUDA implementation fact leaks into universal meaning.

**Falsifier:** a core contract becomes incoherent when all extension capabilities or chess/Connect Four are deleted.

## ENGINE-EXTENSION-01 — schema-backed extension substrate

Review/revise/accept SPEC-0003 through SPEC-0005 only after their relationship to the core owners is explicit.

Required shape:

- Search Stages are semantic per-work-item validity/state transitions, not global phases/kernels/modules/graphs;
- stable Stage Extension Surface **schemas/semantics**, with concrete ports/hooks materialized only for selected capabilities;
- minimal universal base checkpoint context;
- namespaced/versioned selected capability context/state/resource contributions;
- bounded nonblocking Async Stage Channels;
- no runtime callback registry, fragment loop, schema interpreter, host resolution or late binding after ignition;
- absent capability/product removes its hook/port/context/channel/storage/synchronization residue exactly;
- capability semantics that alter domain/policy/evaluator/output/session/resource meaning name the accepted owning contract rather than redefining it through the surface.

SPEC-0005 wording must respect the CUDA-JS boundary: CUDA-MCGS owns semantic Search Program/composition identity, while CUDA-JS owns CUDA/PTX/LTO realization. RDC/LTO are optional generic realization mechanisms, not universal semantic requirements.

## ENGINE-IR-COMPOSER-01 — normalized Search IR and Search Composer

After enough semantic/extension contracts are accepted:

- extend Search IR beyond accepted 0.1.0 foundations to represent selected domain/policy/evaluator/output/resource/session contracts, namespaced capability/product inputs and exact versions;
- distinguish universal base meaning from specialization-only fields;
- normalize finite resource contributions before code generation;
- deterministically compose one semantic Search Program/package input for CUDA-JS;
- preserve exact absent-capability/product deletion and canonical identity;
- prohibit runtime schema interpretation or host-owned active-search decisions.

The Composer may select a CUDA-JS capability such as RDC/LTO only when the concrete realization needs it and its claimed profile is qualified; availability alone does not make it a framework dependency.

## ENGINE-REFERENCE-01 — universal reference/conformance

Build a consolidated deterministic CUDA-free universal reference/conformance layer after the owning semantic contracts stabilize.

- retain existing Search IR reference evidence;
- add materially different synthetic domains/evaluator/output shapes so Connect Four cannot become the hidden template;
- exercise graph/transposition/path/cycle/resource/output/session rules at boundaries;
- use the integrated Connect Four experiment as a downstream product oracle, never as universal implementation authority.

## PRODUCT-CONNECT4-01 — formal product and external deletion

After relevant universal contracts and neutral CUDA-JS Device-JS native DJS-2 evidence are ready:

1. define a downstream Connect Four product specification selecting the needed universal contracts/capabilities;
2. express the production-oriented device algorithm in CUDA-MCGS-owned restricted Device-JS/Search Program source;
3. have CUDA-JS validate/lower/compile/load/execute it without MCGS semantics;
4. compare semantic results against the CUDA-free Connect Four reference and retained bounded GPU feasibility evidence;
5. prove maintained CUDA-MCGS production source requires no CUDA-specific implementation;
6. record first-consumer deletion: deleting Connect Four leaves universal CUDA-MCGS coherent, and deleting CUDA-MCGS leaves CUDA-JS Device-JS coherent.

A missing generic GPU primitive is routed to CUDA-JS; no local CUDA escape hatch is permitted.

## ENGINE-WINDOWS-01 — first finite native universal engine

A finite terminal Windows engine may proceed after the relevant semantic/IR/Search Program/adapter contracts are accepted and the selected CUDA-JS capabilities have exact native evidence.

Required:

- one exact public CUDA-JS compatible pair;
- pre-ignition deterministic specialization and finite resource plan;
- device-owned active search progress with no CPU-produced intermediate search decisions;
- exact independent reference/oracle comparison;
- typed pressure/failure behavior and terminal resource/lifecycle evidence;
- no claim that optional long-lived sideband, multi-stream, graph/cooperative, RDC or LTO mechanisms are required unless the selected engine profile actually uses them.

## ENGINE-SESSION-NATIVE-01 — optional live-session profile

Long-lived external root/control/observation during active device work is a **separate profile**, not a universal release blocker for the finite terminal engine.

It additionally requires:

- accepted SPEC-0006 session semantics;
- an accepted/natively qualified generic CUDA-JS sideband capability derived from issue #38/SPEC-0014 work;
- SESSION-002-class native evidence for concurrent root updates, stale work, generation-safe reclamation, coherent read-only observation and teardown.

Host control publishes bounded external inputs/observations; it never advances internal search.

## ENGINE-PERF-LINUX-01

After correctness/lifecycle are established:

- select scheduler topology from evidence while preserving device closure;
- characterize representative resource/performance/search-quality behavior without elevating one domain metric to universal semantics;
- complete native Linux CUDA-JS/CUDA-MCGS pair work on qualified hardware;
- keep Linux support claims exact and independent from portable/reference evidence.

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
- require a host relaunch/polling loop to advance active search;
- require sideband/multi-stream/graphs/RDC/LTO merely because CUDA-JS exposes or plans them;
- claim native support from reference/portable evidence;
- reopen completed Connect Four reference, Search IR foundation, or CUDA-JS portable implementation work as future tasks.
