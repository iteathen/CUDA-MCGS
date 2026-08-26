# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-25

## Current repository state

The protected CUDA-MCGS `main` input baseline for the active contract packet is:

```text
e1ca19132d79f3c2a15fd0f7fe5b78a190c0371b
```

CUDA-MCGS is a **public pre-release repository** in framework definition, specification and bounded evidence gathering. Public visibility is not a stable API, native support claim, released CUDA-MCGS/CUDA-JS compatible pair, or product release.

No production universal search runtime/component decomposition has yet been accepted.

## Accepted architecture

The north star remains:

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS framework with a universal schema-backed least-authority extension/composition substrate and finite statically specialized engines.**

ADR-0020 establishes how that framework is delivered: CUDA-MCGS is one complete library with progressive disclosure. A convenience facade and documented presets resolve into the same authoritative composable contracts, normalized profile, validation and specialization path as explicit advanced use. Defaults are bounded, documented, inspectable, overridable and versioned when material; no convenience path may guess required domain meaning or adapt hidden search semantics after ignition.

ADR-0021 separates directional attention from structural root advance. Attention is a lazy, owner-scoped and independently versioned publication observed at existing device safe points; it does not advance the root epoch, traverse or mutate retained graph state, classify reuse, resize resources, trigger reclamation, or impose a host polling/relaunch loop or global multi-GPU barrier. Genuine root advance remains a bounded affected-owner transaction, and root-independent owners are not participants.

ADR-0018 separates:

1. universal product-neutral MCGS semantic core;
2. universal extension/composition mechanics;
3. downstream domain/search products.

ADR-0019 requires maintained CUDA-MCGS production source to be JavaScript only: ordinary Node.js plus restricted Device-JS through public CUDA-JS contracts. CUDA-JS remains free to use JIT and native/CUDA implementation wherever needed or desired. The ADR preserves device-owned progress across narrow asynchronous observation/control/lifecycle interaction and makes an unnaturally expressed generic GPU mechanism a CUDA-JS capability-classification stop rather than authority for native CUDA-MCGS code.

Extension-surface stability is schema/semantic stability, not unconditional runtime presence. Concrete ports/hooks/context/channels/storage are materialized only for selected capabilities; an absent capability contributes no solely extension-owned hot-path residue.

SPEC-0001 and SPEC-0002 remain accepted foundational authority. SPEC-0000 and SPEC-0003 through SPEC-0013 are decision-complete proposals awaiting final packet reconciliation, schema/reference integration and semantic acceptance. The core packet has 741 unique normative requirements; the optional extension packet adds 248, for 989 combined proposal requirements. None authorizes its owned production implementation yet.

## Bounded evidence already integrated

- accepted Search IR 0.1.0 deterministic CUDA-free reference evidence;
- bounded CUDA-only MCGS feasibility evidence, not universal authority;
- bounded PTX extension-composition mechanism/cost evidence, not production CUDA ownership;
- integrated SESSION-001-class CUDA-free learning evidence for admission-before-mutation, stale epochs, root-advance/reclamation separation, generation-safe reuse and read-only observations;
- integrated CUDA-free Connect Four MCGS reference/product experiment at the current evidence baseline, retained as a downstream semantic oracle rather than a universal template; and
- proposal Search IR 0.2.0 owner schemas plus deterministic static Composer evidence through `SESSION-ATTENTION-01`, including resolved material-default provenance, convenient/explicit canonical equivalence, removable-facade deletion, failure-atomic publication, selected-owner-flexible separated attention/root semantics and product-assumption absence across 864/864 CUDA-free cases.

Completed evidence is not reopened by the forward plan.

## CUDA-JS boundary

Current peer authority `main` is CUDA-JS `05008fb988558e909cb3802fa12a73d612e70bf0`, package `cuda-js@0.1.0-alpha.7`. No exact CUDA-MCGS pair is selected merely by recording that current peer input; issue #32 still requires one deliberately frozen CUDA-MCGS artifact and CUDA-JS revision/package.

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

**ENGINE-CONTRACT-01** completed its proposal-packet scope through PR #79 at `main@22e3ea5`. Its critical assessment and execution record is [`docs/development/2026-08-24-engine-contract-01-assessment-and-plan.md`](docs/development/2026-08-24-engine-contract-01-assessment-and-plan.md). SPEC-0000 and SPEC-0006 through SPEC-0013 form one decision-complete proposal packet containing 741 unique normative requirements across framework, domain, graph, policy, optional evaluator, output, resources, device progress and optional Search Session owners. Device-owned progress remains intentionally separate from any later physical scheduler selection.

**ENGINE-EXTENSION-01** completed its proposal-packet scope through PR #87 at `main@0ba119f`. Its critical assessment/execution record is [`docs/development/2026-08-25-engine-extension-01-assessment-and-plan.md`](docs/development/2026-08-25-engine-extension-01-assessment-and-plan.md). SPEC-0003/0004/0005 are decision-complete 80/90/78-requirement optional stage/channel/restricted Device-JS composition proposals. Together with the core packet, they hand 989 unique proposal requirements to schema/reference work.

Current focus is **ENGINE-IR-COMPOSER-01**. Its [critical assessment and focus map](docs/development/2026-08-25-engine-ir-composer-01-assessment-and-plan.md) preserves accepted Search IR 0.1.0 and sequences owner-composed proposal Search IR 0.2.0 through exact contract cataloging, strict schemas, normalization, deterministic reference composition, package projection and deletion/identity evidence. `IR-CATALOG-01` through `IR-COMPOSER-01` are integrated. `SESSION-ATTENTION-01` integrates through PR #114 and corrects the proposal-only Session boundary under ADR-0021: lazy directional attention is independently versioned, owned by any selected participant rather than a hard-coded policy brick, and separate from structural root advance; root transactions contain only affected owners; and one whole-profile assertion rejects chess/Connect Four/product vocabulary from normalized universal artifacts. The expanded CUDA-free capsule passes 864/864 with all 989 requirements still classified partial or deferred. `IR-DELETION-ID-01` is the next dependency-ready leaf after protected-target verification. Production lowering remains blocked on complete deletion/identity reconciliation, integrated reference evidence and the later semantic-acceptance/native gates.

The 989-requirement proposal packet and its exact source digests remain frozen while this evidence node is active. ADR-0020 shapes the canonical normalization boundary without silently changing the packet. [Issue #109](https://github.com/iteathen/CUDA-MCGS/issues/109) retains future public API/SDK work; overload-like JavaScript invocation forms and later TypeScript overload signatures are suitable progressive-disclosure tools only when their shapes are unambiguous and every form resolves through the same canonical profile/package path. Exact class/function names and signatures remain later specification work.

Project-owner direction plus CUDA-JS ADR-0006 require OS-neutral CUDA-MCGS contracts and engine architecture while making native Linux x86-64 the reference implementation and primary qualification platform for the first exact compatible pair. Ubuntu 24.04 LTS is the first exact CUDA-JS qualification cell. Existing Windows CUDA-JS evidence remains valid as a peer profile; it no longer determines CUDA-MCGS forward sequencing. This is a downstream realization/qualification choice only and does not alter or shortcut the active backend-neutral Search IR/semantic gates.

The assessment found one consumer-neutral CUDA-JS gap: device-scope release/acquire publication for a multi-word internal channel payload. [CUDA-JS #123](https://github.com/iteathen/CUDA-JS/issues/123) has now integrated that bounded generic helper in `cuda-js@0.1.0-alpha.7`. Backend-neutral proposal/schema/reference work remains independent; later native internal-channel qualification must consume the public capability and prove the exact pair rather than adding a CUDA-MCGS workaround.

After core semantics:

- make the schema-backed extension substrate proposals decision-complete with selected-only attachment points and zero unused-capability residue;
- extend Search IR/Composer in a bounded non-production evidence node for proposed core + namespaced capability/product specialization inputs;
- build consolidated materially different CUDA-free reference/conformance domains;
- accept the integrated semantic contract/schema packet after that reference evidence agrees on one exact revision;
- formalize Connect Four downstream product semantics and run the Device-JS external deletion test after neutral native Device-JS evidence;
- build one finite OS-neutral native universal engine through an exact public CUDA-JS pair and qualify its first realization on Linux;
- treat live Search Session native sideband/concurrency as an optional profile, not a finite-engine release blocker;
- continue representative Linux scheduler/resource/performance evidence and secondary platform qualification, then package/release stabilization.

Chess remains a separately tracked downstream proposal and does not gate universal parent completion.

## Claim limits / blockers

- no production universal engine is accepted yet;
- the [bounded product-assumption leakage audit](docs/development/2026-08-25-product-assumption-leakage-audit.md) found no chess or Connect Four semantic assumption in current universal authority, schemas, executable proposal capsules or package projections; complete first-product deletion remains owned by `IR-DELETION-ID-01`;
- complete cross-profile deletion/identity reconciliation and behavioral reference evidence are not implemented;
- CUDA-JS #123 release/acquire Device-JS publication helpers are integrated in `cuda-js@0.1.0-alpha.7`; their exact CUDA-MCGS channel-pair qualification remains downstream;
- complete cross-profile deletion/specialization identity evidence is unfinished;
- CUDA-MCGS external deletion/compatible-pair evidence is unfinished;
- SESSION-002 native live-session evidence for the selected CUDA-JS mailbox profile is absent;
- native Linux compatible-pair evidence is absent.

Portable/reference/mechanism evidence is not native support. Conversely, native profile evidence is not a prerequisite for accepting a backend-neutral semantic contract when the contract instead records that native evidence as a later production-profile gate. A missing optional execution capability is not automatically a blocker for a profile that does not select it.

## Plan reconciliation

The former Connect Four experiment plan, CUDA-isolation amendment, and schema-18/plan-16 `next_step` are preserved byte-for-byte under [`docs/archive/plans/`](docs/archive/plans/) with archival reasons and replacement paths. Historical Markdown snapshots that contain pre-governance status/relative-link semantics are stored as `.md.txt` so their bytes are preserved without being reinterpreted as active documentation.

Their former development paths are explicit Superseded pointers. [`next_step.yaml`](next_step.yaml) now contains only unfinished forward work. Plans remain below accepted ADR/spec/charter authority.
