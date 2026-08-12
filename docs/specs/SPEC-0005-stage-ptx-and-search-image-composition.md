# SPEC-0005: Stage PTX and Search Image Composition

**Status:** Proposal

**Draft version:** 0.2.0

**Owner:** CUDA-MCGS Search Composer and CUDA-MCGS-to-CUDA-JS package boundary

**Consumers:** Stage contracts, universal/product capability providers, code generation, resource planning, CUDA-JS adapter, artifact cache, conformance, packaging, and release

This proposal defines the version-zero artifact realization for the **universal Stage Extension Surface substrate**. PTX is selected instead of device LTO for this profile. Artifact composition does not promote one capability or product into universal MCGS meaning.

## 1. Normative references

- [`../decisions/ADR-0018-universal-core-extension-product-layering.md`](../decisions/ADR-0018-universal-core-extension-product-layering.md) owns core/extension/product separation.
- [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) owns publication/resource foundations.
- [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) owns foundational Search IR/normalization.
- [`SPEC-0003`](SPEC-0003-search-stage-and-extension-surface.md) proposes universal Search Stage/surface/base-context/capability semantics.
- [`SPEC-0004`](SPEC-0004-async-stage-channels.md) proposes internal cross-stage dataflow.
- [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) proposes Search Session/root-update/observation semantics and keeps external sideband I/O distinct from Stage PTX attachment.
- CUDA-JS public contracts own generic NVRTC, nvJitLink, artifact, module, memory, launch, long-lived-operation/sideband mechanism, error and lifecycle mechanics.

## 2. Governing artifact rule

For version zero:

> **A stage whose selected capability set is non-empty contributes exactly one composed Stage PTX input. A stage with no selected capability contributes no solely extension-owned PTX, call, capability context/state/resource or synchronization residue.**

Several capabilities at one stage share one Stage Extension Surface and one Stage PTX. They do not become one PTX input or runtime call per capability.

The one-Stage-PTX rule is an artifact/composition rule. It says nothing about whether the capability semantics are universal, reusable, product-specific, experimental or chess-specific.

## 3. Stage PTX

**Stage PTX** is the one CUDA-MCGS-generated relocatable PTX composition input implementing the complete selected optional capability set for one Search Stage.

It is:

- generated before ignition from normalized selected contracts/schemas;
- owned/versioned by the stage-composition boundary;
- permitted to export entry/exit symbols only when those checkpoints exist;
- permitted to import only declared generated ABI symbols/least-authority capabilities;
- fully included in finite resource and artifact identity;
- trusted executable content under the selected package profile.

Stage PTX is not necessarily:

- a separate cubin/module;
- a separate kernel;
- a launch or CUDA Graph node;
- the unit scheduled by the device scheduler;
- the semantic representation of a stage;
- a universal capability API exposed to products at runtime.

The Search Image may link universal core behavior, selected domain/policy/evaluator/product behavior, and all selected Stage PTX inputs into one cubin or another accepted finite module set.

## 4. Semantic ownership of capability providers

Capability providers may be CUDA-MCGS-owned, product-owned or user-supplied under an accepted trust profile. They provide namespaced schema-constrained semantic/lowering inputs; they do not add independently discovered runtime fragments.

Every capability input MUST identify:

- semantic owner and contract/version;
- required stage/checkpoint/base-context version;
- capability-specific configuration/context/state schemas;
- declared search-semantic effects and the selected domain/policy/evaluator/output/session/product contract authorizing those effects;
- finite resource contribution;
- provenance/trust/license identity;
- deletion behavior when absent.

A product capability such as a future chess tablebase or move-ordering capability may be compiled into Stage PTX without adding chess fields to universal stage base context. Its specialization-only context/data exists only in Search Images that select it.

A capability that cannot identify the contract owning its semantic effects is rejected before generation.

## 5. Capability composition before PTX emission

Before generating Stage PTX, the Search Composer MUST:

1. normalize/sort the selected stage capability set deterministically;
2. validate checkpoint/base-context/type/permission/semantic-owner/ordering/publication/resource compatibility;
3. merge the minimum universal base checkpoint context with only selected namespaced capability context contributions;
4. resolve write conflicts/noncommutative ordering or fail closed;
5. validate internal Async Stage Channels and capability-owned workspace/state;
6. combine capability logic into one stage-owned lowering unit;
7. compute persistent/scratch/queue/model/workspace contributions;
8. emit only required entry/exit exports and declared imports;
9. record exact generation/provenance/options/bytes in package identity;
10. prove omitted capabilities leave no solely capability-owned context/code/resource residue.

There is no active-search capability registry, schema interpreter, fragment loop, callback table, function-pointer lookup or product-controlled late binding.

## 6. Checkpoint ABI

Each emitted checkpoint symbol MUST have a namespaced deterministic symbol and fully specified device ABI including:

- symbol kind/linkage/visibility;
- PTX ISA version, virtual target and address size;
- parameter count, widths, alignment, address spaces and const/write semantics;
- stage/work-item identity/generation;
- universal base context layout ID/version/byte size;
- selected capability-context layout identity/byte size;
- result/control signal representation;
- publication/thread-scope assumptions;
- allowed calling scope/convergence requirements;
- stack/local/shared/register/workspace bounds where enforceable;
- error mapping and no-host-callback behavior.

Raw device addresses are not ordinary persistent identities. Pointer-like parameters are prevalidated bounded capabilities tied to Search Image lifetime.

If entry and exit checkpoints both exist, they remain two symbols within one Stage PTX. The contract defines any shared read-only configuration/persistent capability state. They MUST NOT share an incomplete stage mutation lease across the interval.

A product-specific ABI contribution is namespaced and part of the selected capability layout; it does not alter the universal base checkpoint ABI for engines that do not select it.

## 7. Empty-capability and first-product disappearance

For a stage with an empty selected capability set, generation omits everything attributable solely to optional extension. Mandatory stage execution and mandatory internal channels are unaffected.

Omitted artifacts include:

- Stage PTX input/exported checkpoint symbols;
- call sites/enable branches/indirect dispatch;
- capability-specific context packing/construction;
- capability persistent state/workspace/queues/diagnostics;
- capability-only synchronization.

The same rule applies to product deletion: removing the chess product/capabilities from an otherwise comparable engine MUST remove solely chess-owned Stage PTX/context/state/resources without changing universal stage semantics.

The conformance oracle is exact generated/final-artifact equivalence where deterministic toolchain behavior permits it, or a stricter approved structural equivalence proving no retained cost. Source structure alone is insufficient.

## 8. Bound-stage cost contract

Stage-level direct calls are not generic dispatch, but they are not free. Final binaries charge code size, register pressure, stack/local/shared memory, occupancy and latency to the realized engine.

Prior bounded Windows evidence showed retained calls for fine PTX functions and one coarse call approaching an inline control only after sufficient synthetic work. Therefore:

- Stage PTX is allowed only at stable semantic checkpoints, not tiny mid-stage operations;
- a stage MUST NOT be invented solely for a PTX attachment point or one product optimization;
- representative evidence compares Stage PTX against equivalent fused/generated controls;
- profiles whose boundaries are too fine fuse capability behavior into selected mandatory lowering, combine stages where semantics permit, or reject the profile;
- no fixed cheap-enough threshold is accepted from the synthetic probe.

The semantic extension contract remains independent of realization. Future accepted profiles may fuse, precompile or use LTO/another mechanism while preserving the same surface/capability semantics.

## 9. Search Image identity

Deterministic Search Image identity includes at least:

- normalized universal Search IR/schema/contract versions;
- exact stage graph/versions/checkpoints and universal base contexts;
- selected capability IDs/versions/schemas/semantic owners;
- product contract/profile identities material to generated behavior;
- generated capability-context/layout/ABI versions;
- ordered Stage PTX bytes/digests;
- generator version/source revision;
- capability-provider provenance/trust identity;
- PTX ISA/virtual target/address size/imports/exports;
- compilation/link options/final GPU target;
- toolkit/NVRTC/nvJitLink identity where material;
- exact required CUDA-JS package/API/capability profile;
- selected domain/policy/evaluator/session/resource identities;
- finite memory plan/scheduler profile;
- selected observation/output contracts;
- diagnostics/instrumentation selection.

Unknown/missing/incompatible inputs fail before ignition. Cache reuse across incomplete identity is prohibited.

A product-only capability change invalidates affected product Search Images. It does not change universal contract versions unless universal meaning actually changed.

## 10. CUDA-JS ownership boundary

CUDA-MCGS owns:

- stage/surface/capability semantics;
- product-capability semantic binding to selected owning contracts;
- normalization/lowering/Stage PTX generation;
- ABI/symbol meaning;
- ordered composition and complete Search Image identity;
- finite search/capability/product resources and semantic conformance;
- compatible-pair acceptance.

CUDA-JS owns:

- generic source/PTX/binary handling;
- NVRTC/nvJitLink provider behavior;
- generic artifact caching;
- CUDA module/function/memory/launch/completion resources;
- generic long-lived-operation/sideband mechanisms;
- generic diagnostics/recovery/teardown;
- generic Windows/Linux runtime qualification.

CUDA-JS MUST NOT interpret Search IR, stage IDs, capabilities, product/chess schemas, root updates, output meaning or search-resource policy. CUDA-MCGS MUST NOT reach through CUDA-JS public contracts into private handles.

Source-authored relocatable PTX currently depends on the consumer-neutral CUDA-JS capability tracked in issue #35. Long-lived Search Session sideband behavior is separately tracked in CUDA-JS issue #38. Neither issue may be redefined with CUDA-MCGS/chess semantics.

## 11. Search Session/control boundary

Stage PTX composition occurs before ignition. It MUST NOT be used as a mechanism for late root-update binding or host-serviced observations.

A selected capability may consume root epoch/session facts at a stable checkpoint if SPEC-0003 and SPEC-0006 grant those facts, but external root-update/control/observation ports remain Search Session/package operations.

An observation capability may maintain observation-local buffers/publication metadata, but merely requesting/publishing observation MUST NOT mutate search-semantic state.

## 12. Security and provenance

Stage PTX is executable content. Production packages MUST:

- accept trusted/signed sources by default;
- validate manifest/exact bytes before native work;
- reject unknown imports/exports/address spaces/ABI categories/architectures;
- bind executable capabilities to Search Image lifetime;
- preserve exact provenance/license/reuse decisions;
- avoid arbitrary-address authority outside explicitly unsafe profiles;
- fail closed on digest/signature/ABI/compatibility mismatch.

Product ownership does not confer native authority. A chess/user capability is held to the same least-authority/provenance/security rules as a reusable framework capability.

CUDA-MCGS does not implement a custom PTX parser as generic CUDA validity authority. It validates owned manifest/ABI constraints; CUDA-JS/nvJitLink owns generic link validity, and final-binary inspection owns emitted-behavior evidence.

## 13. Lifecycle and rollback

Composition/link/load/resource allocation occur before ignition. Partial creation unwinds all task-owned compiler/linker/module/memory resources through CUDA-JS public lifecycle contracts. After ignition, no required Stage PTX is discovered/generated/linked/loaded/rebound.

Device-resident activation may change under the finite plan but does not permit late code mutation or host-provided search decisions.

Product removal/disable before composition removes its capability code/resources under deterministic generation. Product removal is not a runtime unload operation during active search unless a future accepted contract explicitly defines such behavior.

## 14. Conformance requirements

One consolidated compatible-pair capsule MUST cover:

- stage with no optional capability and exact disappearance;
- entry-only/exit-only/entry-plus-exit Stage PTX;
- several capabilities composed into one Stage PTX;
- deterministic ordering/bytes/package identity;
- universal base context unchanged by deleting product capability;
- namespaced product capability context only when selected;
- incompatible types/writes/resources/versions/semantic owners/digests/PTX profiles/architectures rejected before ignition;
- exact imports/exports/ABI layouts;
- direct execution and semantic parity with reference oracle;
- final cubin/SASS call/resource inspection;
- representative fused-control comparison using GPU timing/profiling/occupancy evidence;
- pressure/allocation/link failure/recovery/graceful teardown;
- exact CUDA-MCGS/CUDA-JS compatible-pair identity;
- chess capability deletion from an otherwise comparable image with zero chess-only residue;
- a materially different non-chess capability proving the same universal extension substrate;
- Windows native acceptance first and separately reported Linux gap until qualified.

Portable schema/generation tests run on Windows/Linux-capable environments, but portable success is not native Linux nvJitLink/cubin/SASS/launch/cleanup/performance support.

## 15. Acceptance blockers

This proposal cannot become accepted until:

- SPEC-0003 stage/base-context/capability semantics and relevant domain/policy/evaluator/storage/session contracts are accepted;
- complete Stage PTX ABI/schema/generator ownership is specified;
- capability-specific context contribution/deletion is normalized in Search IR/Search Image identity;
- CUDA-JS issue #35 is resolved or another accepted source-to-relocatable-PTX route exists;
- representative stage-level cost evidence passes on selected Windows profile;
- final-binary/resource/failure/cleanup conformance passes for an exact compatible pair;
- first-product deletion and materially different second-capability tests prove the substrate is not chess-shaped;
- Linux is qualified for the claimed profile or explicitly excluded.