# SPEC-0005: Stage PTX and Search Image Composition

**Status:** Proposal

**Draft version:** 0.1.0

**Owner:** CUDA-MCGS Search Composer and CUDA-MCGS-to-CUDA-JS package boundary

**Consumers:** Stage contracts, capability providers, code generation, resource planning, CUDA-JS adapter, artifact cache, conformance, packaging, and release

This proposal defines the version-zero artifact granularity for optional stage behavior. PTX is selected instead of device LTO. This specification does not authorize production implementation until its semantic dependencies are accepted and the representative performance gates pass.

## 1. Normative references

- [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) owns publication/resource foundations.
- [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) owns foundational Search IR and normalization.
- [`SPEC-0003`](SPEC-0003-search-stage-and-extension-surface.md) proposes Search Stage and surface semantics.
- [`SPEC-0004`](SPEC-0004-async-stage-channels.md) proposes cross-stage dataflow.
- CUDA-JS public contracts own generic NVRTC, nvJitLink, artifact, module, launch, error and lifecycle mechanics.

## 2. Governing artifact rule

For version zero:

> A stage whose contract/schema selects one or more optional capabilities contributes exactly one composed Stage PTX input. A stage with no selected capability contributes no extension PTX, extension call, context, state, resource or synchronization residue.

Several capabilities at one stage share the same Stage Extension Surface and the same Stage PTX. They MUST NOT become one PTX input or runtime call per capability.

## 3. Stage PTX

**Stage PTX** is the one CUDA-MCGS-generated relocatable PTX composition input that implements the complete optional capability set for one Search Stage.

It is:

- generated before ignition from normalized contracts/schemas;
- owned and versioned by its stage;
- permitted to export an entry symbol, exit symbol, or both only when those checkpoints exist;
- permitted to import only declared generated ABI symbols/capabilities;
- fully included in finite resource and artifact identity;
- trusted executable content under the selected package profile.

Stage PTX is not necessarily:

- a separate cubin or loaded CUDA module;
- a separate kernel;
- a kernel launch or CUDA Graph node;
- the unit a scheduler dispatches;
- the semantic representation of the stage.

The Search Image may link the core, mandatory domain/policy/evaluator/device behavior, and all selected Stage PTX inputs into one cubin or another accepted finite module set.

## 4. Capability composition before PTX emission

Capability providers supply declarative semantic/lowering inputs, not independently callable runtime fragments. Before generating Stage PTX, the Search Composer MUST:

1. normalize and sort the stage capability set deterministically;
2. validate checkpoint, type, permission, ordering, publication and resource compatibility;
3. merge the minimum shared entry/exit context layouts;
4. resolve write conflicts and noncommutative ordering or fail closed;
5. combine capability logic into one stage-owned lowering unit;
6. compute persistent, scratch, queue, model and workspace contributions;
7. emit only required entry/exit exports and declared imports;
8. record exact generation/provenance/options/bytes in package identity.

There is no active-search capability registry, schema interpreter, fragment loop, callback table or function-pointer lookup.

## 5. Checkpoint ABI

Each emitted checkpoint symbol MUST have a namespaced deterministic symbol name and a fully specified device ABI including:

- symbol kind and linkage/visibility;
- PTX ISA version, virtual target and address size;
- parameter count, widths, alignment, address spaces and const/write semantics;
- stage/work-item identity and generation representation;
- context layout ID/version and byte size;
- result/control signal representation;
- publication and thread-scope assumptions;
- allowed calling scope and convergence requirements;
- stack, local, shared, register and workspace bounds where enforceable;
- error mapping and no-throw/no-host-callback behavior.

Raw device addresses MUST NOT be ordinary persistent identities. Pointer-like parameters are prevalidated bounded capabilities tied to the Search Image lifetime.

If both entry and exit checkpoints are present, they remain two symbols within one Stage PTX input. The contract MUST define whether they share read-only configuration or persistent state; they MUST NOT share an incomplete mutation lease across the stage interval.

## 6. Empty-capability disappearance

For a stage with an empty optional capability set, production generation MUST omit everything attributable solely to optional extension. Mandatory stage execution and mandatory Async Stage Channels are unaffected. Omitted extension artifacts include:

- Stage PTX input and exported checkpoint symbols;
- call sites, enable branches and indirect dispatch;
- checkpoint context construction or packing;
- persistent state, workspace, queues and diagnostics;
- capability-only synchronization.

The conformance oracle is exact generated/final-artifact equivalence where deterministic toolchain behavior permits it, or a stricter approved structural equivalence that proves no retained cost. Source structure alone is not evidence.

## 7. Bound-stage cost contract

Stage-level direct calls are not generic dispatch, but they are not free. The final binary MUST charge their code size, register pressure, stack/local/shared memory, occupancy effects and latency to the realized engine.

The prior bounded Windows probe found retained calls for fine PTX functions and showed that one coarse call approached the inline control only after enough synthetic work. Therefore:

- Stage PTX is allowed only at stable stage checkpoints, not at tiny mid-stage operations;
- a stage MUST NOT be invented solely to obtain a PTX attachment point;
- representative performance evidence MUST compare Stage PTX against an equivalent fused/generated control;
- a profile whose stage boundary is too fine MUST fuse the behavior into the mandatory stage lowering, combine stages where semantics permit, or reject that profile;
- no fixed “cheap enough” threshold is accepted from the synthetic probe.

The semantic surface remains independent of the realization. A future accepted profile may fuse, precompile or otherwise realize the same stage contract, but version zero does not depend on LTO.

## 8. Search Image identity

The deterministic Search Image identity MUST include at least:

- normalized Search IR and schema versions;
- exact stage graph, stage versions, checkpoint sets and capability sets;
- generated context/layout/ABI versions;
- ordered Stage PTX input bytes and cryptographic digests;
- generator version and source revision;
- capability-provider provenance and trusted-package identity;
- PTX ISA, virtual target, address size and declared imports/exports;
- compilation/link options and final GPU target;
- CUDA toolkit/NVRTC/nvJitLink identity where material;
- exact required CUDA-JS package/API/capability profile;
- domain, policy, evaluator/model and resource-profile identity;
- finite memory plan and selected scheduler profile;
- diagnostics/instrumentation selection.

Unknown, missing or incompatible identity inputs MUST fail before ignition. Cache reuse across incomplete identity is prohibited.

## 9. CUDA-JS ownership boundary

CUDA-MCGS owns:

- stage/capability semantics;
- normalization, lowering and Stage PTX generation;
- ABI and symbol meaning;
- ordered composition plan and complete Search Image identity;
- finite search resources and semantic conformance;
- compatible-pair acceptance.

CUDA-JS owns:

- generic source/PTX/binary input handling;
- NVRTC and nvJitLink provider behavior;
- generic artifact caching;
- CUDA module/function/memory/launch/completion resources;
- generic diagnostics, recovery and teardown;
- generic Windows/Linux runtime qualification.

CUDA-JS MUST NOT interpret Search IR, stage IDs, capabilities, search-resource policy or result meaning. CUDA-MCGS MUST NOT reach through CUDA-JS public contracts into private handles.

Source-authored relocatable PTX currently depends on the consumer-neutral CUDA-JS relocatable-device-code capability tracked in CUDA-JS issue 35. This specification MUST be reassessed against that work's final exact head after the active CUDA-JS compiler/LTO work finishes; it MUST NOT duplicate or interfere with that work.

## 10. Security and provenance

Stage PTX is executable content. A production package MUST:

- accept trusted/signed sources by default;
- validate manifest and exact bytes before native work;
- reject unknown imports/exports, address spaces, ABI categories and architectures;
- bind executable capabilities to Search Image lifetime;
- preserve exact provenance and license/reuse decisions;
- avoid arbitrary-address binding outside an explicitly unsafe profile;
- fail closed on digest, signature, ABI or compatibility mismatch.

CUDA-MCGS MUST NOT implement a custom PTX parser as its source of generic CUDA validity. It validates its owned manifest/ABI constraints; CUDA-JS/nvJitLink owns generic link validity, and final-binary inspection owns emitted behavior evidence.

## 11. Lifecycle and rollback

Composition, link, load and resource allocation occur before ignition. Partial creation MUST unwind all task-owned compiler/linker/module/memory resources through CUDA-JS public lifecycle contracts. After ignition, no required Stage PTX may be discovered, generated, linked, loaded or rebound.

Cancellation may change device-resident activation state under the finite plan. It does not permit late code mutation or host-provided search decisions.

## 12. Conformance requirements

One consolidated compatible-pair capsule MUST cover:

- stage with no optional capability and exact disappearance;
- entry-only, exit-only and entry-plus-exit Stage PTX;
- several capabilities composed into one Stage PTX input;
- deterministic capability ordering and byte/package identity;
- incompatible types, writes, resources, versions, digest, PTX profile and architecture rejected before ignition;
- exact imported/exported symbols and ABI layout;
- direct execution and semantic parity with the reference oracle;
- final cubin/SASS call and resource inspection;
- representative fused-control comparison using GPU events/profiling and occupancy evidence;
- pressure, allocation/link failure, recovery and graceful teardown;
- exact CUDA-MCGS/CUDA-JS compatible-pair identity;
- Windows native acceptance first and a separately reported native Linux gap until qualified.

Portable schema/generation tests MUST run on Windows and Linux-capable environments, but portable success MUST NOT be presented as native Linux nvJitLink, cubin, SASS, launch, cleanup or performance support.

## 13. Acceptance blockers

This proposal cannot become accepted until:

- SPEC-0003 stage/checkpoint semantics and the relevant domain/policy/evaluator/storage contracts are accepted;
- the complete Stage PTX ABI/schema and generator ownership are specified;
- CUDA-JS issue 35 is resolved or another accepted source-to-relocatable-PTX route exists;
- representative stage-level cost evidence passes on the selected Windows profile;
- final-binary, resource, failure and cleanup conformance passes for an exact compatible pair;
- Linux is either qualified for the claimed profile or explicitly excluded with an owned follow-up.
