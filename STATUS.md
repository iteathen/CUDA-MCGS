# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-24

## Current repository state

The protected CUDA-MCGS `main` input baseline for the active contract packet is:

```text
8fab14205089f540376340c93e52e3bd0c96d1d2
```

CUDA-MCGS is a **public pre-release repository** in framework definition, specification and bounded evidence gathering. Public visibility is not a stable API, native support claim, released CUDA-MCGS/CUDA-JS compatible pair, or product release.

No production universal search runtime/component decomposition has yet been accepted.

## Accepted architecture

The north star remains:

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS framework with a universal schema-backed least-authority extension/composition substrate and finite statically specialized engines.**

ADR-0018 separates:

1. universal product-neutral MCGS semantic core;
2. universal extension/composition mechanics;
3. downstream domain/search products.

ADR-0019 requires maintained CUDA-MCGS production source to be JavaScript only: ordinary Node.js plus restricted Device-JS through public CUDA-JS contracts. CUDA-JS remains free to use JIT and native/CUDA implementation wherever needed or desired. The ADR preserves device-owned progress across narrow asynchronous observation/control/lifecycle interaction and makes an unnaturally expressed generic GPU mechanism a CUDA-JS capability-classification stop rather than authority for native CUDA-MCGS code.

Extension-surface stability is schema/semantic stability, not unconditional runtime presence. Concrete ports/hooks/context/channels/storage are materialized only for selected capabilities; an absent capability contributes no solely extension-owned hot-path residue.

SPEC-0001 and SPEC-0002 remain accepted foundational authority. SPEC-0000, SPEC-0003 through SPEC-0010 and SPEC-0013 remain proposals requiring review/revision and integrated evidence before their owned production implementation.

## Bounded evidence already integrated

- accepted Search IR 0.1.0 deterministic CUDA-free reference evidence;
- bounded CUDA-only MCGS feasibility evidence, not universal authority;
- bounded PTX extension-composition mechanism/cost evidence, not production CUDA ownership;
- integrated SESSION-001-class CUDA-free learning evidence for admission-before-mutation, stale epochs, reroot/reclamation separation, generation-safe reuse and read-only observations;
- integrated CUDA-free Connect Four MCGS reference/product experiment at the current evidence baseline, retained as a downstream semantic oracle rather than a universal template.

Completed evidence is not reopened by the forward plan.

## CUDA-JS boundary

Current peer authority `main` is CUDA-JS `2135216b1a9fd88066a1c82b61ae533645eac9c2`. The selected implementation/package baseline remains `b6062f691a27093df0e5d55e482e69ebbd39a9eb`, package `cuda-js@0.1.0-alpha.6`, until a later exact pair deliberately selects another release.

CUDA-JS now publishes the generic contract families needed for the current CUDA-MCGS boundary, including:

- typed RDC (SPEC-0010);
- extended scalar ABI (SPEC-0011);
- Device LTO (SPEC-0012);
- restricted Device-JS (SPEC-0013);
- publication mailboxes (SPEC-0014);
- opaque operation lifecycle (SPEC-0016);
- bounded multi-operation scheduling (SPEC-0018);
- asynchronous transfers (SPEC-0019);
- scoped atomic observation (SPEC-0022).

Those capabilities retain exact native qualification and compatible-pair gates where required. CUDA-JS issue #32 remains open for the first frozen CUDA-MCGS/CUDA-JS compatible-pair evidence; the former issue #38 publication-mailbox gap is closed and integrated.

The owner-directed production boundary remains: CUDA-MCGS owns JavaScript-only search/domain/product semantics and restricted Device-JS/Search Program source; CUDA-JS owns and may implement CUDA-specific lowering/artifacts/compiler/ABI/runtime mechanics and generic GPU primitives with JIT/native code. CUDA-MCGS must not require a local native/CUDA-specific escape path. A mechanism that cannot be expressed naturally through the current public contract is classified for consumer-neutral CUDA-JS ownership rather than forced into CUDA-MCGS.

## Current unfinished work

The canonical forward plan is [`docs/development/2026-08-12-v0-forward-plan.md`](docs/development/2026-08-12-v0-forward-plan.md).

Current focus is **ENGINE-CONTRACT-01** under parent plan `CUDA-MCGS-V0/22`. Its critical assessment and semantic focus-branch map are [`docs/development/2026-08-24-engine-contract-01-assessment-and-plan.md`](docs/development/2026-08-24-engine-contract-01-assessment-and-plan.md). `EC-DOMAIN-01`, `EC-GRAPH-01`, `EC-POLICY-01`, `EC-EVALUATOR-01` and `EC-OUTPUT-01` are integrated as proposals [`SPEC-0007`](docs/specs/SPEC-0007-domain-state-action-and-transition.md), [`SPEC-0010`](docs/specs/SPEC-0010-graph-storage-and-reclamation.md), [`SPEC-0008`](docs/specs/SPEC-0008-search-policy-and-backup.md), [`SPEC-0009`](docs/specs/SPEC-0009-evaluator-contract.md) and [`SPEC-0013`](docs/specs/SPEC-0013-result-and-observation-publication.md). `EC-RESOURCE-01` is the single active leaf. Device-owned progress remains intentionally separate from any later physical scheduler selection.

The remaining resource/progress/session proposals then receive bounded normalized Search IR/Composer and universal reference evidence before one integrated semantic-acceptance gate. Production lowering remains blocked until that acceptance gate completes.

After core semantics:

- make the schema-backed extension substrate proposals decision-complete with selected-only attachment points and zero unused-capability residue;
- extend Search IR/Composer in a bounded non-production evidence node for proposed core + namespaced capability/product specialization inputs;
- build consolidated materially different CUDA-free reference/conformance domains;
- accept the integrated semantic contract/schema packet after that reference evidence agrees on one exact revision;
- formalize Connect Four downstream product semantics and run the Device-JS external deletion test after neutral native Device-JS evidence;
- build one finite Windows universal engine through an exact public CUDA-JS pair;
- treat live Search Session native sideband/concurrency as an optional profile, not a finite-engine release blocker;
- continue scheduler/performance/Linux evidence, then package/release stabilization.

Chess remains a separately tracked downstream proposal and does not gate universal parent completion.

## Claim limits / blockers

- no production universal engine is accepted yet;
- core semantic contract families remain incomplete;
- SPEC-0003/0004/0005/0006 are proposal-only;
- complete Search IR/Composer specialization/resource identity is incomplete;
- CUDA-MCGS external deletion/compatible-pair evidence is unfinished;
- SESSION-002 native live-session evidence for the selected CUDA-JS mailbox profile is absent;
- native Linux compatible-pair evidence is absent.

Portable/reference/mechanism evidence is not native support. Conversely, native profile evidence is not a prerequisite for accepting a backend-neutral semantic contract when the contract instead records that native evidence as a later production-profile gate. A missing optional execution capability is not automatically a blocker for a profile that does not select it.

## Plan reconciliation

The former Connect Four experiment plan, CUDA-isolation amendment, and schema-18/plan-16 `next_step` are preserved byte-for-byte under [`docs/archive/plans/`](docs/archive/plans/) with archival reasons and replacement paths. Historical Markdown snapshots that contain pre-governance status/relative-link semantics are stored as `.md.txt` so their bytes are preserved without being reinterpreted as active documentation.

Their former development paths are explicit Superseded pointers. [`next_step.yaml`](next_step.yaml) now contains only unfinished forward work. Plans remain below accepted ADR/spec/charter authority.
