# CHESS-0001: CUDA-MCGS Chess Consumer and Conformance Profile

**Status:** Proposal

**Draft version:** 0.1.0

**Owner:** CUDA-MCGS downstream chess consumer/conformance profile

**External engine product authority:** [`iteathen/UCI-Arena-Vector`](https://github.com/iteathen/UCI-Arena-Vector)

**Consumes:** universal CUDA-MCGS domain/policy/evaluator/graph/resource/session/output contracts, Search IR/Search Composer, and the universal Search Stage extension/composition substrate

This document defines a downstream chess **consumer/conformance profile** built on top of CUDA-MCGS. It exists to prove that a real chess workload can be expressed without making chess the shape of the universal core. It does **not** make CUDA-MCGS the owner of an external chess engine.

The current UCI chess engine product for this ecosystem is `UCI-Arena-Vector`. That repository owns engine policy choices, UCI behavior, engine-specific integrations, packaging/release/support lifecycle, and the composition of opening-book, endgame-table, timing-evidence, evaluator, and other product services. This file may constrain what a CUDA-MCGS-compatible chess consumer must supply or prove, but it cannot silently become a second authority for that engine.

No requirement in this file may become universal CUDA-MCGS meaning merely because chess needs it, and no requirement in this file may become UCI-Arena-Vector product authority merely because that engine consumes CUDA-MCGS.

## 1. Normative references and layering

- [`../../../decisions/ADR-0018-universal-core-extension-product-layering.md`](../../../decisions/ADR-0018-universal-core-extension-product-layering.md) owns the three-layer architecture.
- [`../../../decisions/ADR-0022-distinguish-root-advance-reroot-and-attention.md`](../../../decisions/ADR-0022-distinguish-root-advance-reroot-and-attention.md) owns the four-operation root-control vocabulary and cost boundaries.
- [`../../SPEC-0000-framework-requirements.md`](../../SPEC-0000-framework-requirements.md) maps the universal framework specification families.
- [`../../SPEC-0001-device-search-publication-and-resources.md`](../../SPEC-0001-device-search-publication-and-resources.md) owns accepted publication/graph/resource foundations.
- [`../../SPEC-0002-search-ir-and-reference-semantics.md`](../../SPEC-0002-search-ir-and-reference-semantics.md) owns the accepted foundational Search IR slice.
- [`../../SPEC-0003-search-stage-and-extension-surface.md`](../../SPEC-0003-search-stage-and-extension-surface.md), [`../../SPEC-0004-async-stage-channels.md`](../../SPEC-0004-async-stage-channels.md), and [`../../SPEC-0005-stage-ptx-and-search-image-composition.md`](../../SPEC-0005-stage-ptx-and-search-image-composition.md) define/propose the universal extension substrate.
- [`../../SPEC-0006-search-session-control-and-observation.md`](../../SPEC-0006-search-session-control-and-observation.md) proposes generic long-lived session root/advance/reroot/attention and observation semantics.

If chess requires a new universal concept, the change must be proposed and accepted in the universal specification family independently. This profile cannot amend universal meaning by usage. If the external engine requires a product-specific behavior, that behavior is specified in `UCI-Arena-Vector` or the independent owning service/library rather than promoted here by convenience.

## 2. Consumer outcome

A conforming chess consumer can compose a finite specialized Search Image that searches chess positions using CUDA-MCGS universal contracts, preserves useful search knowledge across played moves when its chess validity rules permit, and exposes chess-specific bounded outputs such as ranked legal moves without requiring chess concepts in the universal core.

A downstream engine may support analysis, engine play, MultiPV, fixed-budget search, continuous pondering/search, policy-only/evaluation-only modes, opening-book use, tablebase use, timing-evidence integration, or other chess workflows. Those are product capabilities and support profiles, not universal framework obligations and not owned by this CUDA-MCGS profile unless explicitly limited to conformance semantics.

## 3. Consumer composition

A chess consumer is composed from separate owned contracts.

### 3.1 Chess domain contract

The downstream chess domain owner supplies chess-specific meaning including:

- board/position representation;
- side to move;
- legal action/move production and transition;
- check/checkmate/stalemate and other terminal rules;
- castling rights and en-passant meaning;
- draw/repetition/history facts required for semantic correctness;
- chess state identity and collision verification;
- any chess-specific observation or variant facts selected by the product.

The exact state identity MUST include or separately key every fact required to make transposition reuse semantically correct. Piece placement alone is not assumed sufficient. Repetition, fifty-move/halfmove state, castling, en-passant and variant rules require explicit disposition before identity/persistence is accepted.

The universal core sees a domain state, action, transition, identity/history contract and node roles. It does not see a built-in chess board or move type.

### 3.2 Chess search-policy contract

The downstream chess policy owner supplies product search behavior such as:

- selection formula and policy parameters;
- reservation/virtual-loss or equivalent in-flight behavior;
- widening/action-admission policy if selected;
- backup perspective/algebra and value interpretation;
- stopping/budget policy;
- which graph/node/edge statistics remain valid across chess advances;
- which statistics reset, transform or invalidate across reroot or other authority changes.

No PUCT/UCT/formula is universal merely because a chess product selects it.

### 3.3 Chess evaluator contract

The downstream evaluator/product owner supplies:

- input encoding derived from the chess domain state/history contract;
- value/WDL/score semantics and perspective;
- optional policy/proposal outputs;
- model identity/version and resident workspace;
- batching and asynchronous result behavior;
- cache/reuse validity across advance, reroot, and history changes;
- fallback/absence behavior where a product profile permits evaluator-free search.

No neural-network architecture, tensor layout, scalar score or WDL shape is a universal CUDA-MCGS requirement.

### 3.4 Chess output and observation contracts

Chess-specific user-facing search output belongs to the downstream product/output contract, not in the universal core.

A product observation may be namespaced like:

`cuda-mcgs.chess.root-move-ranking/0.1.0`

Its eventual schema may include a bounded list of legal chess moves plus selected product facts such as:

- move/action identity;
- visits/completed work;
- product score/value/WDL;
- prior or policy score when selected;
- principal-variation data;
- proof/tablebase state;
- freshness/progress information.

Those fields and their ordering are not accepted by this architectural proposal. The downstream product output contract must define exact semantics, units, bounds, perspective, tie-breaking, validity, compatibility and pressure behavior.

The observation consumes generic read-only publication semantics. Requesting or reading the chess ranking MUST NOT expand the graph, generate legal moves, evaluate positions, alter search statistics, or otherwise advance search merely to satisfy observation.

Terminal chess results and live analysis observations remain separate contracts.

## 4. Chess root, advance, reroot, and persistent search

A chess consumer may select the generic Search Session profile for continuous search/pondering.

- **root** establishes the initial authoritative chess state before active search.
- **advance** may be used for a played legal move only when that move identifies an already-realized transition to an already-ready successor and every required resource is already admitted.
- **reroot** is required for an externally supplied position or any authority change requiring lookup beyond the advance contract, admission, reconstruction, representation conversion, transformation, reset, or reuse classification.
- **attention** may change directional search preference without changing authoritative chess state or invalidating already admitted work.

Advance MUST NOT allocate, traverse retained graph state, copy/transform semantic state, reset, resize, reclassify retained state, reclaim, or eagerly clean up. It preserves compatible work beneath the selected occurrence, lazily supersedes sibling-occurrence work, and does not invalidate a shared transposed node merely because one old-root occurrence is superseded.

Reroot owns the heavier chess validity/reconciliation path. After reroot commit, every persistent state family receives an explicit downstream validity disposition. Examples requiring decisions rather than assumptions include:

- state nodes/transposition entries whose chess identity remains valid;
- edge/node search statistics whose policy meaning may or may not be root-independent;
- evaluator cache entries whose input/history key remains valid;
- repetition/path/history state that is necessarily root/path dependent;
- principal-variation and root-ranking publication state;
- chess-specific extension state.

A downstream product MUST NOT preserve statistics merely because the physical node is retained. Retention is semantic and owner-defined.

## 5. Chess-specific use of the universal extension substrate

Chess may compose capabilities through universal Search Stage surfaces, but capability semantics remain namespaced downstream inputs.

Candidate capability families may include, subject to separate specification/evidence:

- move-ordering or candidate-prior augmentation;
- opening-book lookup/use;
- endgame-table/tablebase lookup/use;
- tactical search/probe work;
- chess-specific pruning or proof metadata;
- principal-variation observation support;
- timing-evidence consumption;
- product diagnostics/telemetry;
- specialized evaluator-side secondary work.

The list is illustrative, not an accepted fixed capability catalogue. The named external services/libraries remain owned by their own repositories; CUDA-MCGS supplies only neutral extension/composition contracts.

Each selected capability MUST:

- bind to an already-valid universal Search Stage checkpoint;
- declare a namespaced versioned capability/schema;
- use only least-authority context granted by the surface;
- declare finite persistent/scratch/channel/workspace resources;
- declare semantic effects through the owning downstream domain/policy/evaluator/output/session/product contract when those effects matter to search meaning;
- participate in deterministic pre-ignition composition and Search Image identity;
- disappear from the realized image when absent according to the universal specialization contract.

A chess capability cannot create a new core field, unrestricted callback, raw-pointer escape or hidden host service loop.

## 6. Chess Search Image and package

The Search Composer receives universal contracts plus selected downstream chess contracts/capabilities and emits one specialized finite Search Image/package.

Its identity includes, when material:

- universal Search IR/schema/contract versions;
- downstream chess domain/policy/evaluator/output contract versions;
- chess state/action/history encoding versions;
- selected chess extension capabilities and schemas;
- model/book/tablebase/timing/product artifact provenance;
- resource profile and scheduler profile;
- generated restricted Device-JS stage capability/context/layout and public CUDA-JS output identities;
- CUDA/toolchain/target and compatible CUDA-JS profile.

CUDA-JS receives only consumer-neutral device artifact/resource/launch/sideband requirements. It MUST NOT interpret chess positions, moves, rankings, Search IR or extension semantics.

## 7. Chess conformance and reference domains

A downstream chess product requires chess-owned oracles in addition to universal CUDA-MCGS conformance. CUDA-MCGS may retain representative consumer/conformance cases only to prove the public boundary.

Planned chess-specific cases include:

- legal/illegal move production and transition;
- castling/en-passant/state-identity boundaries;
- checkmate/stalemate/draw and history-sensitive terminal semantics;
- deliberate transpositions with identity verification;
- repetition/history cases that prevent invalid reuse;
- evaluator perspective/output correctness;
- product policy/backup invariants;
- live root-move observation correctness and read-only behavior;
- advance after an already-ready played-move successor, preserving compatible descendant work and superseding sibling occurrences lazily;
- preservation of a shared transposed node reached by another still-valid occurrence;
- replacement-position reroot with explicit admitted retained/reset/invalidated facts;
- finite-memory reroot pressure and advance rejection when the successor is not ready;
- deterministic package identity and compatible-pair rejection;
- search-quality/benchmark suites appropriate to the downstream product profile.

Universal conformance remains independently runnable without chess. Chess passing cannot substitute for universal second-instance tests.

## 8. Product quality and performance

Chess performance/search-quality evidence is downstream product evidence. It may optimize nodes/second, time-to-depth, solution rate, Elo/self-play outcomes, tactical suites, analysis stability, ranking freshness, or other product metrics only after their workload, stopping, resource and quality equivalence is specified.

A chess optimization may motivate a universal extension improvement, but it MUST NOT weaken universal correctness, finite resources, device closure, extension safety or compatibility to improve a chess benchmark.

## 9. Non-goals and exclusions

This proposal does not accept or own:

- one chess board/state encoding;
- one move encoding;
- one chess search formula;
- one evaluator/model architecture;
- one opening-book provider;
- one tablebase provider;
- one timing-evidence provider;
- one root-move ranking schema;
- one scheduler or GPU topology;
- a production chess engine implementation;
- UCI-Arena-Vector product policy or release authority;
- a promise that chess is the first released CUDA-MCGS product.

It exists primarily to enforce layering: chess proves that it can consume CUDA-MCGS without becoming the definition of universal CUDA-MCGS.

## 10. Acceptance and ownership blockers

Before this CUDA-MCGS consumer/conformance profile can be treated as an accepted compatibility profile:

- the universal domain/policy/evaluator/graph/resource/session/output contracts it consumes must be accepted;
- the universal extension substrate used by selected chess capabilities must be accepted or the capability must remain absent;
- representative chess state/action/history/identity and terminal semantics must be independently tested without making their particular encoding universal;
- exact finite resource, advance, reroot and pressure behavior must be known for the selected consumer fixture;
- compatible CUDA-MCGS/CUDA-JS package evidence must exist for any selected native profile;
- deleting every chess consumer fixture/profile from CUDA-MCGS must leave the universal architecture and conformance suite semantically complete.

Production engine authorization, engine-specific policy/evaluator/output contracts, UCI integration, Book Forge integration, endgame-table integration, Timing Evidence Service integration, packaging, release and search-quality acceptance are **not** blockers owned by this file. Those belong to `UCI-Arena-Vector` and the respective independent service/library owners.
