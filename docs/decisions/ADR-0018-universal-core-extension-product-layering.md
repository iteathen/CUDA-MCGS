# ADR-0018: Universal Core, Extension Substrate, and Domain Product Layering

**Status:** Accepted

**Date:** 2026-08-12

## Context

CUDA-MCGS exists to define and realize universal Monte Carlo Graph Search systems across unrelated domains and evaluator types. The project already rejects a game-shaped universal runtime, but plan 15 accidentally promoted one intended consumer requirement — a continuously refreshed ranked root-action list — into the universal north star.

That wording is too narrow. A ranked legal-move list is useful for chess and some decision-search products, but it is not required by every intended MCGS system. Evaluation-only search, proof/search diagnostics, planning, optimization, continuous-action search, partially observable search, and future products may expose different outputs or no continuously ranked root actions at all.

At the same time, treating all non-core behavior as arbitrary callbacks would weaken the project. CUDA-MCGS still needs a universal, enforceable way to compose future capabilities into specialized engines without runtime reflection, host callbacks, or first-consumer fields in the hot path.

The project owner therefore clarified that CUDA-MCGS must make three semantic layers explicit and that chess search will be specified separately on top of the universal layers.

## Decision

CUDA-MCGS uses three explicit semantic layers.

### 1. Universal MCGS semantic core

The universal core owns only facts and lifecycle rules that are required to state correct, finite, device-resident MCGS across the intended equivalence class. This includes, when selected by a concrete profile:

- domain state/action/transition/identity/history/node-role contracts;
- graph identity, state-node/parent-edge/path ownership and transpositions;
- selection/reservation/widening/backup/stopping semantics without one fixed formula;
- evaluator capability and resident-execution semantics without one value shape;
- publication, generation/incarnation, finite resources, pressure, failure and cleanup;
- device-owned search progress and scheduler-neutral execution semantics;
- Search Session/root lifecycle, including generic reroot/root-update semantics when that profile is selected;
- generic bounded result and observation publication contracts;
- Search IR, Search Composer, deterministic specialization, conformance and package identity.

The universal core does **not** require chess, games, legal moves, players, a board, a ranked root-action list, best-move output, top-k output, a policy prior, a scalar value, or a particular evaluator/search formula.

### 2. Universal extension and composition substrate

CUDA-MCGS also owns a universal extension substrate for behavior that should be composable without becoming mandatory core meaning.

The substrate consists of:

- finite semantic Search Stages;
- schema-declared, stage-owned entry/exit Stage Extension Surface contracts whose concrete attachment points are materialized only when selected capabilities require them;
- namespaced/versioned capability contracts and schemas;
- bounded Async Stage Channels for nonblocking cross-stage/cross-surface dataflow;
- deterministic pre-ignition capability composition;
- zero-or-one optional composed Stage PTX input per stage in the version-zero realization;
- exact finite resource, provenance, compatibility and Search Image identity.

[`ADR-0019`](ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) later fixed the production-source boundary: the “Stage PTX input” bullet above is retained as historical decision context, not current implementation authority. CUDA-MCGS now supplies one semantic restricted Device-JS stage capability program unit; CUDA-JS exclusively owns any generated PTX/cubin/LTO/native realization. The selected-only and zero-residue decision remains unchanged.

Stability applies to the schema identity and semantics of an extension surface, not to unconditional runtime presence. A specialization materializes only the attachment points required by its selected capability set. An unselected capability contributes no hook/port, dispatch branch, context field, channel, storage, synchronization, or other solely extension-owned runtime residue.

The **substrate is universal; individual capability semantics are not automatically universal**.

A capability may read or affect only facts granted by its surface contract. If a capability changes domain, policy, evaluator, output, resource, or lifecycle meaning, that meaning must also be declared by the selected owning contract/profile and included in Search IR/Search Image identity. An extension surface is not a back door for redefining a core invariant.

A capability that is absent contributes no solely extension-owned runtime residue in a conforming specialized engine.

### 3. Domain/search products

A domain/search product selects and specializes the universal core contracts and universal extension substrate for one concrete product purpose.

A product may define:

- domain-specific state/action/history/terminal meaning;
- product-specific policy/evaluator semantics;
- product-specific output and observation schemas;
- required or optional extension capabilities;
- product-specific reroot/reuse/reset/transform rules;
- package/support/benchmark requirements.

Chess search is the first explicitly planned product layer. Chess-specific legal-move ranking, board/history identity, chess evaluator meaning, tablebase/tactical/move-ordering capabilities, and user-facing best-move/multi-PV output belong to the chess product specification, not to the universal CUDA-MCGS core.

A future Go, planning, optimization, text-search, or other product must be able to replace the chess product layer without changing universal core or extension-substrate meaning.

## Promotion rule

Behavior may be promoted from a product/extension into the universal core only when an accepted architectural/specification change establishes that the behavior is required to state the intended MCGS equivalence class rather than merely useful to one or several products.

At minimum, promotion must survive:

- the second-instance test across materially different intended consumers;
- the first-consumer deletion test;
- ownership/resource/lifecycle/failure analysis;
- an explicit compatibility and Search IR consequence review.

Reuse across several products is evidence for promotion, not automatic authority.

## Search Session and observation consequence

A long-lived Search Session and generic bounded observation publication are universal framework capabilities because they describe search lifecycle and safe external observation without prescribing one product payload.

A **ranked root-action snapshot is not the universal observation contract**. It is one possible policy/product observation schema built on the generic publication mechanism.

Observation must be read-only with respect to search-semantic state unless the selected capability explicitly owns separate observation-local publication state. Requesting or consuming an observation must not be required to advance internal search.

## Consequences

- The project charter is narrowed so reusable core ownership says generic output/observation semantics rather than mandatory root ranking.
- SPEC-0000 and the canonical plan separate universal core, universal extension substrate, and product lanes.
- SPEC-0003 through SPEC-0005 remain the universal extension-substrate family and must reject domain/product semantics leaking into surface mechanics.
- A separate Search Session/control/observation specification owns generic reroot, root-epoch, admission, stale-work, reclamation and read-only observation semantics.
- Chess receives a separate product specification and plan branch. Its ranked-move output is downstream of the universal contracts.
- SPEC-0001 and SPEC-0002 remain valid in their accepted scopes; their ranking references constrain ranking only when a later selected policy/output contract uses ranking and do not make ranking mandatory.
- CUDA-JS remains consumer-neutral and must not learn MCGS, chess, root, move, ranking, Search Stage or capability meaning.

## Alternatives considered

### Keep ranking in the universal policy/output contract but make it optional

Rejected. Optional foundational vocabulary still shapes Search IR, resource planning, APIs and conformance around one decision-product family.

### Make every product behavior a generic callback

Rejected. It destroys static specialization, least-authority semantics, finite planning, device closure, deterministic identity and zero-residue goals.

### Split core, extensions and chess into independent runtime frameworks

Rejected as unnecessary. The separation is semantic ownership and composition. One Search Composer and Search Image may realize all selected layers without duplicating lifecycle/runtime machinery.

## Supersession and compatibility

This ADR extends ADR-0002 and corrects later plan/proposal wording that overfit ranked root actions. It does not supersede ADR-0002, ADR-0003 or ADR-0014.

Any lower-level document that requires ranked root actions, best-move output, top-k output, or chess-specific meaning as universal CUDA-MCGS behavior must be revised or interpreted as a product/profile requirement before acceptance or production implementation.
