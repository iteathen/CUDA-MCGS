# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-12

## Current repository state

The latest evidence-bearing protected `main` baseline before this documentation-only plan reconciliation is:

```text
ded3ef7d5257e28183a3b60c8fbff1f0ea8aed0b
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

Extension-surface stability is schema/semantic stability, not unconditional runtime presence. Concrete ports/hooks/context/channels/storage are materialized only for selected capabilities; an absent capability contributes no solely extension-owned hot-path residue.

SPEC-0001 and SPEC-0002 remain accepted foundational authority. SPEC-0000 and SPEC-0003 through SPEC-0006 remain proposals requiring review/revision before their owned production implementation.

## Bounded evidence already integrated

- accepted Search IR 0.1.0 deterministic CUDA-free reference evidence;
- bounded CUDA-only MCGS feasibility evidence, not universal authority;
- bounded PTX extension-composition mechanism/cost evidence, not production CUDA ownership;
- integrated SESSION-001-class CUDA-free learning evidence for admission-before-mutation, stale epochs, reroot/reclamation separation, generation-safe reuse and read-only observations;
- integrated CUDA-free Connect Four MCGS reference/product experiment at the current evidence baseline, retained as a downstream semantic oracle rather than a universal template.

Completed evidence is not reopened by the forward plan.

## CUDA-JS boundary

Current peer `main` is protected CUDA-JS `83f44a21f6bf556f3ff6d58acaee644659777383`. Its latest implementation-bearing baseline is `fe9ed78939d3876790291421cec367fde58a8310`, package `cuda-js@0.1.0-alpha.5`; the later CUDA-JS revision is documentation/plan reconciliation only.

CUDA-JS now implements portable/software:

- typed RDC (SPEC-0010);
- extended scalar ABI (SPEC-0011);
- Device LTO (SPEC-0012);
- restricted Device-JS (SPEC-0013);
- opaque operation lifecycle (SPEC-0016).

Those capabilities retain exact native qualification gates where required. CUDA-JS issue #38 / SPEC-0014 long-lived sideband remains proposal/portable-evidence work rather than accepted production support.

The owner-directed production boundary remains: CUDA-MCGS owns search/domain/product semantics and restricted Device-JS/Search Program source; CUDA-JS owns CUDA-specific lowering/artifacts/compiler/ABI/runtime mechanics and generic GPU primitives. Maintained CUDA-MCGS production must not require a local CUDA-specific implementation escape path.

## Current unfinished work

The canonical forward plan is [`docs/development/2026-08-12-v0-forward-plan.md`](docs/development/2026-08-12-v0-forward-plan.md).

Current focus is **ENGINE-CONTRACT-01**: settle the unfinished universal domain/policy/evaluator/output/graph/resource/scheduler/session semantic owners independently of optional Search Stage mechanics before production lowering.

After core semantics:

- accept the schema-backed extension substrate with selected-only attachment points and zero unused-capability residue;
- extend Search IR/Composer for accepted core + namespaced capability/product specialization inputs;
- build consolidated materially different CUDA-free reference/conformance domains;
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
- neutral native Device-JS DJS-2 and CUDA-MCGS external deletion/compatible-pair evidence are unfinished;
- production generic sideband and SESSION-002 native live-session evidence are absent;
- native Linux compatible-pair evidence is absent.

Portable/reference/mechanism evidence is not native support. A missing optional execution capability is not automatically a blocker for a profile that does not select it.

## Plan reconciliation

The former Connect Four experiment plan, CUDA-isolation amendment, and schema-18/plan-16 `next_step` are preserved byte-for-byte under [`docs/archive/plans/`](docs/archive/plans/) with archival reasons and replacement paths. Historical Markdown snapshots that contain pre-governance status/relative-link semantics are stored as `.md.txt` so their bytes are preserved without being reinterpreted as active documentation.

Their former development paths are explicit Superseded pointers. [`next_step.yaml`](next_step.yaml) now contains only unfinished forward work. Plans remain below accepted ADR/spec/charter authority.
