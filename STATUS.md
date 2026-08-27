# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-08-26

## Current repository state

The protected CUDA-MCGS root-control integration now on `main` is:

```text
bef5d976e96cd42ed4e206b98a0342b53713b154
```

Its deliberate reconciliation input `main@173765cf86fc6ab91364d8d52eb6a045dcbe2346` and the older frozen harness/evidence inputs remain provenance for the exact revisions that produced them; they are not current authority heads. PR #127 is integrated and read back from protected `main`, issue #113 is completed, and `REF-GRAPH-01` is now the active dependency-ready reference leaf under issue #24.

CUDA-MCGS is a **public pre-release repository** in framework definition, specification and bounded evidence gathering. Public visibility is not a stable API, native support claim, released CUDA-MCGS/CUDA-JS compatible pair, or product release.

No production universal search runtime/component decomposition has yet been accepted.

## Accepted architecture

The north star remains:

> **CUDA-MCGS is a contract-defined universal GPU-resident MCGS framework with a universal schema-backed least-authority extension/composition substrate and finite statically specialized engines.**

ADR-0020 establishes how that framework is delivered: CUDA-MCGS is one complete library with progressive disclosure. A convenience facade and documented presets resolve into the same authoritative composable contracts, normalized profile, validation and specialization path as explicit advanced use. Defaults are bounded, documented, inspectable, overridable and versioned when material; no convenience path may guess required domain meaning or adapt hidden search semantics after ignition.

ADR-0022 distinguishes four cost-bearing operations. Root establishes initial authority. Advance moves authority to an already ready realized successor with bounded state-independent publication, preserves compatible descendant work and lazily supersedes sibling-occurrence work without traversal, copying, transformation, reset, resize, reclassification, reclamation or eager cleanup. Reroot owns general root replacement and reconciliation. Attention changes directional weighting without changing root or invalidating work. Per-device adoption is explicitly ordered without making a global multi-GPU barrier universal. ADR-0021 is superseded.

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
- proposal Search IR 0.2.0 owner schemas plus deterministic static Composer evidence through `IR-INTEGRATE-01` and the integrated REF-ROOT-CONTROL-01 reconciliation, including resolved material-default provenance, convenient/explicit canonical equivalence, removable-facade deletion, failure-atomic publication, selected-owner-flexible root/advance/reroot/attention semantics, exact optional reroot deletion, cross-profile deletion paths, materially different engine identities and one exact 989-disposition evidence key across 879/879 CUDA-free cases.

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

ADR-0023 now makes bounded useful GPU concurrency a requirement of the first usable native engine. This does not select one scheduler: semantic owners define legal dependencies, schedules and outcomes, while native profiles own grid/block/warp/queue/kernel mapping and qualification. The correctness-first profile should begin with the smallest sufficient public CUDA-JS mechanisms; advanced primitives are demand-driven and tensor-shaped execution remains a separate measured research lane.

## Current unfinished work

The canonical forward plan is [`docs/development/2026-08-12-v0-forward-plan.md`](docs/development/2026-08-12-v0-forward-plan.md).

**ENGINE-CONTRACT-01** completed its proposal-packet scope through PR #79 at `main@22e3ea5`. Its critical assessment and execution record is [`docs/development/2026-08-24-engine-contract-01-assessment-and-plan.md`](docs/development/2026-08-24-engine-contract-01-assessment-and-plan.md). SPEC-0000 and SPEC-0006 through SPEC-0013 form one decision-complete proposal packet containing 741 unique normative requirements across framework, domain, graph, policy, optional evaluator, output, resources, device progress and optional Search Session owners. Device-owned progress remains intentionally separate from any later physical scheduler selection.

**ENGINE-EXTENSION-01** completed its proposal-packet scope through PR #87 at `main@0ba119f`. Its critical assessment/execution record is [`docs/development/2026-08-25-engine-extension-01-assessment-and-plan.md`](docs/development/2026-08-25-engine-extension-01-assessment-and-plan.md). SPEC-0003/0004/0005 are decision-complete 80/90/78-requirement optional stage/channel/restricted Device-JS composition proposals. Together with the core packet, they hand 989 unique proposal requirements to schema/reference work.

**ENGINE-IR-COMPOSER-01** completed its original bounded representation/composition scope through PR #116. Its original frozen evidence key `70aa92baf5ab1fee4bf4b85af4cf1e6d76eca3c51fc11ab4120d62a6f71529d9` remains truthful historical provenance for that proposal input. REF-ROOT-CONTROL-01 deliberately regenerated the affected proposal-derived Session representation under ADR-0022; protected `main@bef5d976e96cd42ed4e206b98a0342b53713b154` now binds `4846fe8686721afd13dfe4ac66ebbfdb0722979481183e76b96bf9118f340b3f` across 879/879 CUDA-free Composer cases. The 989 requirements remain proposal/reference evidence rather than accepted production authority.

Current focus is **ENGINE-REFERENCE-01**, tracked in [issue #36](https://github.com/iteathen/CUDA-MCGS/issues/36). `REF-ROOT-CONTROL-01`, coordinated by completed [issue #113](https://github.com/iteathen/CUDA-MCGS/issues/113), integrated through PR #127 at protected `main@bef5d976e96cd42ed4e206b98a0342b53713b154`. SPEC-0006, adjacent Policy/Evaluator/Graph/Resource/Output proposal wording, Search IR 0.2.0 Session/resource semantics, distinct advance/reroot deletion, reroot-only retained-state classification, deterministic reroot rollback order and dependent evidence conform to ADR-0022. `REF-GRAPH-01`, owned by [issue #24](https://github.com/iteathen/CUDA-MCGS/issues/24), is now the active dependency-ready leaf.

`REF-HARNESS-01` supplies the semantic-neutral foundation through the [`search-semantics-reference`](experiments/search-semantics-reference/README.md) experiment. Its 22 neutral cases are rebound to the integrated Composer representation key `4846fe8686721afd13dfe4ac66ebbfdb0722979481183e76b96bf9118f340b3f`; the harness semantics themselves remain unchanged.

`REF-DOMAIN-01` still contributes the same 27 Domain cases and exact 47 direct SPEC-0007 behavioral requirements, but its public projection/evidence bindings were regenerated because the proposal-derived Composer identity changed. The current projection identity is `6c073d11c688bc64b7bf4233c93de56ce29a95706f8a1ac665c8a04d939f13ee`; the full 49/49 semantic-reference evidence identity is `cf6aafa528af6f4ad6854d16d7c6c046f6ff33a7e9f18d153cb0386a9b4044b8`. Historical projection `612c72274be7986bcae53237be97b34e64d97a781eeb55e61964d11b942b9f47` and semantic key `70f5c454b7d31cd18374350fd75ebd52b961c828e515b0e6eabeefb8499b6402` remain truthful only for their exact earlier proposal input. Graph reference work is now active and must consume, not reinterpret, the integrated root-control authority.

The terminal reference slice is the nearest concrete developer-preview milestone, but it is not yet the GPU library. Production lowering remains blocked on the complete behavioral packet and atomic `ENGINE-CONTRACT-ACCEPTANCE-01`; a first GPU developer preview additionally needs a bounded parallel production JavaScript/restricted Device-JS engine/package and later exact native qualification in [issue #37](https://github.com/iteathen/CUDA-MCGS/issues/37). A serial native diagnostic control does not satisfy that milestone.

The 989-requirement proposal packet, its exact source digests and the integrated representation/composition evidence key remain frozen inputs to behavioral reference work. ADR-0020 shapes the canonical normalization boundary without silently changing the packet. [Issue #109](https://github.com/iteathen/CUDA-MCGS/issues/109) retains future public API/SDK work; overload-like JavaScript invocation forms and later TypeScript overload signatures are suitable progressive-disclosure tools only when their shapes are unambiguous and every form resolves through the same canonical profile/package path. Exact class/function names and signatures remain later specification work.

Project-owner direction plus CUDA-JS ADR-0006 require OS-neutral CUDA-MCGS contracts and engine architecture while making native Linux x86-64 the reference implementation and primary qualification platform for the first exact compatible pair. Ubuntu 24.04 LTS is the first exact CUDA-JS qualification cell. Existing Windows CUDA-JS evidence remains valid as a peer profile; it no longer determines CUDA-MCGS forward sequencing. This is a downstream realization/qualification choice only and does not alter or shortcut the active backend-neutral Search IR/semantic gates.

The assessment found one consumer-neutral CUDA-JS gap: device-scope release/acquire publication for a multi-word internal channel payload. [CUDA-JS #123](https://github.com/iteathen/CUDA-JS/issues/123) has now integrated that bounded generic helper in `cuda-js@0.1.0-alpha.7`. Backend-neutral proposal/schema/reference work remains independent; later native internal-channel qualification must consume the public capability and prove the exact pair rather than adding a CUDA-MCGS workaround.

From the current Graph leaf:

- execute `REF-GRAPH-01`, then the dependency-ordered Policy, Evaluator, Resource, Progress, Output, lifecycle, terminal-slice, optional Session/Stage/Channel and integration leaves;
- accept the integrated semantic contract/schema packet only after the complete reference evidence agrees on one exact protected revision;
- build one finite parallel OS-neutral native universal engine through an exact public CUDA-JS pair and qualify its first realization on Linux;
- treat live Search Session native sideband/concurrency as an optional profile, not a finite-engine release blocker; and
- continue representative scheduler/resource/performance evidence, secondary-platform qualification and package/release stabilization.

CHESS-0001 is a downstream CUDA-MCGS consumer/conformance profile. The production chess-engine product authority is `iteathen/UCI-Arena-Vector`; chess does not gate universal parent completion.

## Claim limits / blockers

- no production universal engine is accepted yet;
- the [bounded product-assumption leakage audit](docs/development/2026-08-25-product-assumption-leakage-audit.md) found no chess or Connect Four semantic assumption in current universal authority, schemas, executable proposal capsules or package projections; PR #115 adds the complete bounded cross-profile structural deletion matrix;
- the behavioral assessment, neutral harness, bounded Domain oracle and root-control reconciliation are complete, but Graph-through-lifecycle oracles and the first terminal reference slice are not implemented;
- CUDA-JS #123 release/acquire Device-JS publication helpers are integrated in `cuda-js@0.1.0-alpha.7`; their exact CUDA-MCGS channel-pair qualification remains downstream;
- CUDA-MCGS external deletion/compatible-pair evidence is unfinished;
- SESSION-002 native live-session evidence for the selected CUDA-JS mailbox profile is absent;
- native Linux compatible-pair evidence is absent.

Portable/reference/mechanism evidence is not native support. Conversely, native profile evidence is not a prerequisite for accepting a backend-neutral semantic contract when the contract instead records that native evidence as a later production-profile gate. A missing optional execution capability is not automatically a blocker for a profile that does not select it.

## Plan reconciliation

The former Connect Four experiment plan, CUDA-isolation amendment, and schema-18/plan-16 `next_step` are preserved byte-for-byte under [`docs/archive/plans/`](docs/archive/plans/) with archival reasons and replacement paths. Historical Markdown snapshots that contain pre-governance status/relative-link semantics are stored as `.md.txt` so their bytes are preserved without being reinterpreted as active documentation.

Their former development paths are explicit Superseded pointers. [`next_step.yaml`](next_step.yaml) now contains only unfinished forward work. Plans remain below accepted ADR/spec/charter authority.
