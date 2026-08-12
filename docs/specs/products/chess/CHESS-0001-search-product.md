# CHESS-0001: CUDA-MCGS Chess Search Product

**Status:** Proposal

**Draft version:** 0.1.0

**Owner:** CUDA-MCGS chess product layer

**Consumes:** universal CUDA-MCGS domain/policy/evaluator/graph/resource/session/output contracts, Search IR/Search Composer, and the universal Search Stage extension/composition substrate

This document defines the architectural boundary for a chess search product built **on top of** CUDA-MCGS. It is intentionally downstream. No requirement in this file may become universal CUDA-MCGS meaning merely because chess needs it.

## 1. Normative references and layering

- [`../../../decisions/ADR-0018-universal-core-extension-product-layering.md`](../../../decisions/ADR-0018-universal-core-extension-product-layering.md) owns the three-layer architecture.
- [`../../SPEC-0000-framework-requirements.md`](../../SPEC-0000-framework-requirements.md) maps the universal framework specification families.
- [`../../SPEC-0001-device-search-publication-and-resources.md`](../../SPEC-0001-device-search-publication-and-resources.md) owns accepted publication/graph/resource foundations.
- [`../../SPEC-0002-search-ir-and-reference-semantics.md`](../../SPEC-0002-search-ir-and-reference-semantics.md) owns the accepted foundational Search IR slice.
- [`../../SPEC-0003-search-stage-and-extension-surface.md`](../../SPEC-0003-search-stage-and-extension-surface.md), [`../../SPEC-0004-async-stage-channels.md`](../../SPEC-0004-async-stage-channels.md), and [`../../SPEC-0005-stage-ptx-and-search-image-composition.md`](../../SPEC-0005-stage-ptx-and-search-image-composition.md) define/propose the universal extension substrate.
- [`../../SPEC-0006-search-session-control-and-observation.md`](../../SPEC-0006-search-session-control-and-observation.md) proposes generic long-lived session, reroot and observation semantics.

If chess requires a new universal concept, the change must be proposed and accepted in the universal specification family independently. This product file cannot amend universal meaning by usage.

## 2. Product outcome

The chess product will compose a finite specialized Search Image that can search chess positions using CUDA-MCGS universal contracts, preserve useful search knowledge across played moves when its chess validity rules permit, and expose chess-specific bounded outputs such as ranked legal moves without requiring chess concepts in the universal core.

The product may eventually support analysis, engine play, MultiPV, fixed-budget search, continuous pondering/search, policy-only/evaluation-only modes, or other chess workflows. Those are product capabilities and support profiles, not universal framework obligations.

## 3. Product composition

The chess product is composed from separate owned contracts.

### 3.1 Chess domain contract

The chess domain contract owns chess-specific meaning including:

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

The chess policy contract owns product search behavior such as:

- selection formula and policy parameters;
- reservation/virtual-loss or equivalent in-flight behavior;
- widening/action-admission policy if selected;
- backup perspective/algebra and value interpretation;
- stopping/budget policy;
- which graph/node/edge statistics remain valid across chess reroots;
- which statistics reset, transform or invalidate after a played move or authoritative position update.

No PUCT/UCT/formula is universal merely because the chess product selects it.

### 3.3 Chess evaluator contract

The chess evaluator contract owns:

- input encoding derived from the chess domain state/history contract;
- value/WDL/score semantics and perspective;
- optional policy/proposal outputs;
- model identity/version and resident workspace;
- batching and asynchronous result behavior;
- cache/reuse validity across reroot and history changes;
- fallback/absence behavior where a product profile permits evaluator-free search.

No neural-network architecture, tensor layout, scalar score or WDL shape is a universal CUDA-MCGS requirement.

### 3.4 Chess output and observation contracts

Chess-specific user-facing search output belongs here, not in the universal core.

A planned product observation may be namespaced like:

`cuda-mcgs.chess.root-move-ranking/0.1.0`

Its eventual schema may include a bounded list of legal chess moves plus selected product facts such as:

- move/action identity;
- visits/completed work;
- product score/value/WDL;
- prior or policy score when selected;
- principal-variation data;
- proof/tablebase state;
- freshness/progress information.

Those fields and their ordering are not accepted by this architectural proposal. The final product output contract must define exact semantics, units, bounds, perspective, tie-breaking, validity, compatibility and pressure behavior.

The observation consumes the generic read-only publication mechanism from SPEC-0006. Requesting or reading the chess ranking MUST NOT expand the graph, generate legal moves, evaluate positions, alter search statistics, or otherwise advance search merely to satisfy observation.

Terminal chess results and live analysis observations remain separate contracts.

## 4. Chess reroot and persistent search

The chess product intends to use the generic Search Session profile for continuous search/pondering and rerooting.

A chess root update may be derived from:

- a played legal move from the current accepted root;
- an authoritative chess position/state supplied by the product boundary;
- a future namespaced chess observation/variant update if specified.

Before commit, the chess product MUST validate the update under the chess domain/session contract and satisfy the universal admission-before-mutation and finite-capacity rules.

After commit, every persistent state family receives an explicit chess validity disposition. Examples that require decisions rather than assumptions include:

- state nodes/transposition entries whose chess identity remains valid;
- edge/node search statistics whose policy meaning may or may not be root-independent;
- evaluator cache entries whose input/history key remains valid;
- repetition/path/history state that is necessarily root/path dependent;
- principal-variation and root-ranking publication state;
- chess-specific extension state.

The chess product MUST NOT preserve statistics merely because the physical node is retained. Retention is semantic and policy-owned.

## 5. Chess-specific use of the universal extension substrate

Chess may compose future capabilities through universal Search Stage surfaces, but the capability semantics remain namespaced chess/product inputs.

Candidate capability families may include, subject to separate specification/evidence:

- move-ordering or candidate-prior augmentation;
- tablebase lookup/use;
- tactical search/probe work;
- chess-specific pruning or proof metadata;
- principal-variation observation support;
- product diagnostics/telemetry;
- specialized evaluator-side secondary work.

The list is illustrative, not an accepted fixed capability catalogue.

Each selected capability MUST:

- bind to an already-valid universal Search Stage checkpoint;
- declare a namespaced versioned capability/schema;
- use only least-authority context granted by the surface;
- declare finite persistent/scratch/channel/workspace resources;
- declare semantic effects through the owning chess domain/policy/evaluator/output contract when those effects matter to search meaning;
- participate in deterministic pre-ignition composition and Search Image identity;
- disappear from the realized image when absent according to the universal specialization contract.

A chess capability cannot create a new core field, unrestricted callback, raw-pointer escape or hidden host service loop.

## 6. Chess Search Image and package

The Search Composer receives universal contracts plus the selected chess product contracts/capabilities and emits one specialized finite Search Image/package.

Its identity includes, when material:

- universal Search IR/schema/contract versions;
- chess domain/policy/evaluator/output contract versions;
- chess state/action/history encoding versions;
- selected chess extension capabilities and schemas;
- model/tablebase/product artifact provenance;
- resource profile and scheduler profile;
- generated Stage PTX/context/layout identities;
- CUDA/toolchain/target and compatible CUDA-JS profile.

CUDA-JS receives only consumer-neutral device artifact/resource/launch/sideband requirements. It MUST NOT interpret chess positions, moves, rankings, Search IR or extension semantics.

## 7. Chess conformance and reference domains

Chess product acceptance requires chess-owned oracles in addition to universal CUDA-MCGS conformance.

Planned chess-specific cases include:

- legal/illegal move production and transition;
- castling/en-passant/state-identity boundaries;
- checkmate/stalemate/draw and history-sensitive terminal semantics;
- deliberate transpositions with identity verification;
- repetition/history cases that prevent invalid reuse;
- evaluator perspective/output correctness;
- product policy/backup invariants;
- live root-move observation correctness and read-only behavior;
- reroot after a played move with explicit retained/reset/invalidated facts;
- replacement-position root update;
- finite-memory root-update pressure;
- deterministic package identity and compatible-pair rejection;
- search-quality/benchmark suites appropriate to the selected chess product profile.

Universal conformance remains independently runnable without chess. Chess passing cannot substitute for universal second-instance tests.

## 8. Product quality and performance

Chess performance/search-quality evidence is downstream product evidence. It may optimize nodes/second, time-to-depth, solution rate, Elo/self-play outcomes, tactical suites, analysis stability, ranking freshness, or other product metrics only after their workload, stopping, resource and quality equivalence is specified.

A chess optimization may motivate a universal extension improvement, but it MUST NOT weaken universal correctness, finite resources, device closure, extension safety or compatibility to improve a chess benchmark.

## 9. Non-goals and exclusions

This proposal does not accept:

- one chess board/state encoding;
- one move encoding;
- one chess search formula;
- one evaluator/model architecture;
- one tablebase provider;
- one root-move ranking schema;
- one scheduler or GPU topology;
- a production chess engine implementation;
- a promise that chess is the first released CUDA-MCGS product.

It exists primarily to enforce **layering**: chess is a consumer and specialization of CUDA-MCGS, never the definition of universal CUDA-MCGS.

## 10. Acceptance blockers

Before a production chess implementation is authorized:

- the universal domain/policy/evaluator/graph/resource/session/output contracts it consumes must be accepted;
- the universal extension substrate used by selected chess capabilities must be accepted or the chess capability must remain absent;
- chess state/action/history/identity and terminal semantics must be specified with independent reference tests;
- chess policy/evaluator/output/reuse contracts must be accepted;
- exact finite resource and root-update pressure behavior must be known;
- compatible CUDA-MCGS/CUDA-JS package evidence must exist for the selected native profile;
- chess-specific search-quality/performance claims must have reproducible product evidence;
- deleting this chess product from the repository must leave the universal CUDA-MCGS architecture and conformance suite semantically complete.