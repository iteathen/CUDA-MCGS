# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-12

## Phase

CUDA-MCGS is a **public pre-release repository in framework definition, research, specification, and bounded evidence gathering**. `main` is the integration trunk. Public visibility is not a product release, stable API promise, native platform-support claim, released CUDA-MCGS/CUDA-JS compatible-pair claim, or chess engine release.

No production search runtime or final production component decomposition has been accepted.

## North star

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS framework with a universal least-authority extension/composition substrate and finite specialized Search Images.**

[`ADR-0018`](docs/decisions/ADR-0018-universal-core-extension-product-layering.md) separates:

1. universal product-neutral MCGS semantic core;
2. universal product-neutral extension/composition mechanics;
3. downstream domain/search products such as chess.

Universal completion does not require chess completion. Product needs cannot silently become universal fields/contracts.

## Accepted project state

- The universal graph-search framework, not a first game/domain, is the CUDA-MCGS universal product.
- The project charter and ADR-0001 through ADR-0018 are accepted within their scopes.
- ADR-0018 clarifies that generic bounded result/observation semantics are universal while ranked root-action/move output belongs only to selected output/product contracts.
- [`SPEC-0001`](docs/specs/SPEC-0001-device-search-publication-and-resources.md) remains accepted authority for backend-neutral publication channels, state-node/parent-edge ownership, identity-before-path-cycle ordering, finite-resource accounting, typed exhaustion, partial-result validity, and scheduler-neutral conformance.
- [`SPEC-0002`](docs/specs/SPEC-0002-search-ir-and-reference-semantics.md) remains accepted authority for foundational Search IR 0.1.0 representation, strict normalization, canonical identity, and deterministic CUDA-free reference semantics within the SPEC-0001 boundary.
- SPEC-0001/SPEC-0002 do not mandate ranked actions; their ranking language constrains later selected ranking outputs when present.
- Generic Node/CUDA Driver/compiler/linker/launch/completion/resource lifecycle remains owned by independent public peer `iteathen/CUDA-JS`.
- Repository/component organization and the no-Python ecosystem policy remain binding.
- Repository licensing is `AGPL-3.0-or-later` with a separately negotiated commercial-license option.

## Current universal proposal direction

### Universal core

Product-neutral contract families own domain, policy, evaluator, generic output payloads, graph/path/transposition, Search Session/root lifecycle, finite resources, device-owned progress, Search IR/Composer, conformance, and package semantics.

Domain/policy/evaluator/output/resource contracts are intentionally meaningful independently of the optional Stage extension model. A framework with every optional capability removed must still have coherent universal MCGS semantics and a finite core resource plan.

Search policy owns selection/reservation/widening/policy statistics/backup/stopping/reuse semantics. A separate universal output family owns generic bounded complete/partial/evaluation/proof/sequence/diagnostic/custom/absent result payloads. Ranking is a downstream output/product transformation/schema, not mandatory policy meaning.

### Universal extension/composition substrate

[`SPEC-0003`](docs/specs/SPEC-0003-search-stage-and-extension-surface.md), [`SPEC-0004`](docs/specs/SPEC-0004-async-stage-channels.md), and [`SPEC-0005`](docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md) propose:

- finite semantic per-work-item Search Stages;
- stable least-authority Stage Extension Surfaces;
- minimal universal base checkpoint contexts;
- namespaced selected capability-specific context/state/resources;
- bounded nonblocking internal Async Stage Channels;
- zero-or-one optional composed Stage PTX input per stage;
- exact absent-capability/product deletion.

The substrate is universal; individual capability semantics are not automatically universal. A capability that changes search meaning must name the selected domain/policy/evaluator/output/session/product contract owning that meaning.

### Search Session

[`SPEC-0006`](docs/specs/SPEC-0006-search-session-control-and-observation.md) proposes generic long-lived Search Session semantics:

- finite root epochs;
- root-update validation/admission before root-update-specific mutation;
- typed full-arena new-root pressure/admission behavior;
- one authoritative root commit;
- old-epoch stale-work isolation and accounting;
- explicit retain/retain-if-key-valid/transform/reset/invalidate reuse classification;
- separation of reroot from generation-safe reclamation;
- generic bounded read-only observation publication whose payload meaning is owned by the selected output/product contract;
- finite stale-safe generation/counter exhaustion/restart behavior.

Ranked moves/actions are not required by SPEC-0006.

## Downstream chess product

[`CHESS-0001`](docs/specs/products/chess/CHESS-0001-search-product.md) and issue #45 define chess as a downstream product proposal.

Chess owns chess board/history/legal-move/terminal identity, chess policy/evaluator semantics, any ranked legal-move/best-move/MultiPV observation, chess-specific extension capabilities, chess reroot/reuse rules, and chess product quality/support evidence.

Deleting chess must leave universal CUDA-MCGS architecture, Search IR, extension mechanics and conformance complete. Chess implementation/release does **not** gate universal CUDA-MCGS parent completion.

## Bounded evidence

### CUDA-only MCGS prototype

`experiments/cuda-device-mcgs-prototype/` remains bounded non-production evidence for device closure, transposition node/edge ownership, path-local cycles, finite capacity and scheduler-ticket mechanisms. Its fixed two-action scalar-value domain is not universal authority.

### Search IR reference

`experiments/search-ir-reference/` remains the accepted deterministic CUDA-free reference evidence for SPEC-0001/SPEC-0002's bounded foundation. Its exact accepted evidence remains separate from later proposal changes.

### PTX composition discovery

`experiments/ptx-extension-composition-prototype/` remains bounded mechanism/cost evidence. It supports static composition, exact unused disappearance, and a warning against fine PTX calls. It does not define the production capability schema or Stage PTX cost envelope.

### SESSION-001

Draft PR #43 / issue #42 contain bounded CUDA-free SESSION-001 learning evidence. The exact prototype head referenced by plan 16 is `97e1755bcc2f9e0e7c3b8df4defba9475864e57c`.

Important observed lessons carried into SPEC-0006/plan 16:

- observation publication must not materialize/expand search state;
- root-update admission occurs before root-update-specific mutation;
- old root-epoch work cannot publish new-epoch root-relative effects;
- reroot and reclamation are separate transitions;
- storage reuse needs stale-safe generation/incarnation handling;
- finite root-update capacity pressure needs an explicit typed strategy;
- root/observation/reclamation generations need explicit stale-safe exhaustion behavior;
- reroot statistics/cache reuse is contract-selected, not universal.

SESSION-001 proves no native CUDA concurrency, memory ordering, sideband transport, scheduler performance, or universal statistics-reuse policy.

## Canonical plan packet

[`next_step.yaml`](next_step.yaml) in this architecture packet is **schema 18 / parent plan 16**.

Its lanes are:

- **universal core** — domain, policy, evaluator, output, graph, Search Session, resources;
- **universal extension substrate** — Search Stages/surfaces, internal channels, Stage PTX;
- **universal integration/native** — Search IR/Composer, scheduler, reference, Windows native, performance/Linux, release;
- **downstream products** — chess as a separately tracked non-gating lane.

The plan's crucial dependency correction is that universal domain/policy/evaluator/output/resource semantics no longer depend on the Stage extension model. The core resource owner defines generic optional resource-contribution/admission rules; the Composer later integrates selected Stage/Channel/product contributions into a concrete Search Image plan.

## Current blockers and claim limits

- ADR-0018 layering is accepted, but SPEC-0000 and SPEC-0003 through SPEC-0006 are proposals and require review/acceptance before production lowering.
- Universal domain/policy/evaluator/output/graph/session/resource/scheduler contracts are incomplete.
- Complete Search IR does not yet represent core versus namespaced capability/product specialization inputs, generic output families, Search Session semantics, and capability-specific context/resource deletion.
- First production root-update admission/full-arena pressure strategy and reroot reuse classifications are not accepted.
- SESSION-002 native concurrent root-update/stale-work/reclamation/observation evidence does not exist.
- CUDA-JS issue #35 remains the consumer-neutral relocatable-device-code dependency; issue #38 remains the generic long-lived sideband capability research/specification dependency.
- No representative Stage PTX cost envelope, scheduler selection, production graph store, generated universal engine, or released compatible pair exists.
- Native Linux CUDA-JS/CUDA-MCGS compatible-pair evidence remains absent.
- CHESS-0001 is proposal-only and intentionally not a universal blocker.

## Repository/public status

The canonical repository is public. Historical private-to-public preparation/checklist documents remain for provenance and audit; they no longer describe current visibility.

`main` is protected. Public visibility does not waive specification, evidence, security, review, cleanup, platform qualification, compatible-pair, packaging or release gates.

Security-sensitive reports follow [`SECURITY.md`](SECURITY.md). Contribution workflow follows [`CONTRIBUTING.md`](CONTRIBUTING.md).