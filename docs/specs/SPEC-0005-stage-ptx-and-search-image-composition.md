# SPEC-0005: Restricted Device-JS and Search Image Composition

**Status:** Proposal

**Draft version:** 0.3.0

**Stable path note:** The historical filename is retained for link compatibility. Stage PTX is no longer the CUDA-MCGS-owned production input.

**Owner:** CUDA-MCGS Search Composer and CUDA-MCGS-to-CUDA-JS package boundary

**Consumers:** Search Stage contracts, universal/product capability providers, Search IR, resource planning, CUDA-JS adapter, conformance, packaging and release

This proposal defines how CUDA-MCGS composes selected search and extension semantics into restricted Device-JS/Search Program inputs while treating every CUDA/PTX/cubin/LTO/native realization as a CUDA-JS-owned opaque output. Artifact realization does not promote one capability, product or CUDA mechanism into universal MCGS meaning.

## 1. Normative references

- [`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md) owns core/extension/product separation and selected-only extension materialization.
- [`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) owns the JavaScript-only CUDA-MCGS production boundary, device closure and CUDA-JS capability-escalation rule.
- [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) owns publication/resource foundations.
- [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) owns foundational Search IR normalization/reference semantics.
- [`SPEC-0003`](SPEC-0003-search-stage-and-extension-surface.md) proposes Search Stage/surface/base-context/capability semantics.
- [`SPEC-0004`](SPEC-0004-async-stage-channels.md) proposes internal nonblocking dataflow.
- [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) proposes Search Session semantics and keeps external sideband operations distinct from internal stage composition.
- Versioned public CUDA-JS contracts own restricted Device-JS validation/lowering, generated artifact realization, native/JIT compilation/link/load, generic resources, operations, publication, errors and teardown.

Accepted authority governs every conflict with this proposal.

## 2. Governing source and artifact rule

For production CUDA-MCGS:

> **CUDA-MCGS authors and maintains only ordinary Node.js and restricted Device-JS/Search Program source. CUDA-JS owns every CUDA-specific generated or native realization.**

A selected stage capability set contributes one deterministic **stage capability program unit** to the semantic Search Program. The unit is a normalized composition concept, not necessarily one source file, function, PTX input, module, kernel, launch or final binary object.

A stage with no selected optional capability contributes no solely extension-owned source, call, context, state, channel, resource, synchronization, package input or generated-artifact residue.

CUDA-MCGS MUST NOT author, maintain, patch or interpret C, C++, CUDA C++, `.cu`/`.cuh`, PTX, cubin, LTO, native addons, direct FFI/Driver calls or subprocess native search implementations. CUDA-JS MAY use any of those mechanisms behind its public consumer-neutral contracts.

## 3. Scope

This specification owns:

- deterministic semantic Search Program composition;
- selected capability ordering and least-authority binding;
- restricted Device-JS stage capability program units;
- CUDA-MCGS execution-package meaning and identity;
- selected-only source/context/resource contribution and deletion behavior;
- semantic requirements placed on CUDA-JS-generated outputs;
- compatible-pair evidence obligations without transferring artifact ownership.

It does not own:

- restricted Device-JS language syntax, helper implementation or CUDA lowering;
- PTX ISA, CUDA ABI, compiler/linker/provider behavior or final artifact format;
- CUDA module/function/memory/launch/completion internals;
- one scheduler topology, domain, product, evaluator or output policy;
- a guarantee that RDC, Device LTO, CUDA Graphs, cooperative execution or another optional CUDA mechanism is selected.

## 4. Capability-provider semantic inputs

Capability providers may be CUDA-MCGS-owned, product-owned or user-supplied under an accepted trust profile. They supply schema-constrained semantic inputs and restricted Device-JS behavior; they do not supply independently discovered native fragments.

Every selected capability input MUST identify:

- namespaced semantic owner, contract and version;
- required stage/checkpoint/base-context version;
- capability-specific configuration/context/state schemas;
- declared semantic effects and the selected domain/policy/evaluator/output/session/product contract authorizing them;
- finite persistent/scratch/workspace/channel/resource contribution;
- deterministic ordering requirements;
- failure, pressure, cancellation and deletion behavior;
- provenance, trust and license identity.

A capability without an owning contract for its semantic effects fails before composition. Product-specific inputs remain namespaced specialization inputs and do not widen the universal base context.

## 5. Deterministic Search Program composition

Before ignition, the Search Composer MUST:

1. normalize the selected universal, capability and product contracts;
2. sort each selected stage capability set canonically;
3. validate checkpoint, context, type, permission, semantic-owner, ordering, publication and finite-resource compatibility;
4. merge the minimum universal base checkpoint context with only selected namespaced contributions;
5. prove writes commute or impose one declared deterministic order;
6. validate selected Async Stage Channels and owned state/workspace;
7. compose the complete selected optional behavior for each stage into one semantic stage capability program unit;
8. emit only required restricted Device-JS entry/exit behavior and declared public CUDA-JS dependencies;
9. produce one normalized semantic Search Program and versioned execution package;
10. prove omitted capabilities leave no solely capability-owned source, context, resource or package residue.

There is no active-search capability registry, schema interpreter, fragment loop, callback table, function-pointer lookup, product-controlled late binding or host callback progression.

The number of Device-JS source files/functions and the CUDA-JS-selected realization topology are private build details unless a public package contract makes them observable. Physical fusion or splitting MUST preserve the semantic composition and identity contract.

## 6. CUDA-MCGS / CUDA-JS ownership boundary

CUDA-MCGS owns:

- Search IR and Search Program semantics;
- stage/surface/capability/product binding;
- deterministic semantic ordering;
- restricted Device-JS search/domain/capability source;
- finite search/capability/product resource requirements;
- semantic package identity, conformance and compatible-pair acceptance.

CUDA-JS owns:

- restricted Device-JS syntax/helper/type validation;
- lowering and generated CUDA C++/PTX/cubin/LTO or other artifacts;
- compiler/linker/provider/ABI/cache behavior;
- generic module/function/memory/launch/operation/publication resources;
- generic diagnostics, recovery, cancellation and teardown;
- Windows/Linux/runtime qualification.

CUDA-JS MUST NOT interpret Search IR, stage, capability, product, root-update, output or search-resource-policy meaning. CUDA-MCGS MUST NOT access CUDA-JS private source, raw handles or artifact internals.

If the public CUDA-JS surface cannot express a required generic GPU mechanism naturally, safely and with bounded synchronization/resource/lifecycle semantics, composition stops for ADR-0019 capability classification. A private import, local native implementation or distorted Device-JS workaround is non-conforming.

## 7. Public package and generated-output contract

The CUDA-MCGS execution package MUST identify:

- normalized Search IR and semantic Search Program identity;
- selected domain/policy/evaluator/session/resource/product contracts;
- exact stage graph/checkpoints/base contexts when selected;
- selected capability IDs, schemas and semantic owners;
- restricted Device-JS source/input digests and required public helper/language profile;
- declared public imports/exports and typed function/argument/launch descriptions;
- finite generic CUDA-JS resource and operation requirements;
- required CUDA-JS package/API/capability/evidence profile;
- compilation target/options only through public CUDA-JS contract fields;
- provenance, checksums, compatibility and result/observation manifests.

CUDA-JS returns or records generated-output identities, resource summaries, errors and lifecycle evidence through public contracts. CUDA-MCGS treats CUDA C++/PTX/cubin/LTO/native bytes as opaque. It may verify public digests, manifests and attestations and consume CUDA-JS-owned artifact-inspection evidence; it MUST NOT patch, parse or reinterpret artifact implementation.

One semantic Search Program may be realized by one or multiple generated artifacts. Artifact count and form do not change semantic ownership and are not universal requirements.

## 8. Empty-capability and first-consumer deletion

For a stage with an empty selected capability set, composition omits everything attributable solely to optional extension behavior:

- stage capability Device-JS behavior and calls;
- enable branches or indirect dispatch;
- capability-specific context packing and layout;
- capability persistent state, workspace, queues and diagnostics;
- capability-only synchronization and package requirements.

The corresponding CUDA-JS-generated output MUST contain no solely omitted-capability behavior/resource residue under the qualified profile. CUDA-JS owns the native artifact oracle; CUDA-MCGS owns the semantic/source/package comparison and compatible-pair conclusion.

Deleting the first product/capability MUST leave universal stage semantics and CUDA-JS coherent. Deleting CUDA-MCGS MUST leave every promoted CUDA-JS mechanism consumer-neutral.

## 9. Cost and realization neutrality

Stable semantic checkpoints are not assumed free. A selected implementation charges code size, registers, stack/local/shared memory, occupancy, synchronization, memory traffic and latency to the concrete engine profile.

Representative qualification compares selected stage capability behavior with an equivalent fused/generated control under identical semantic work, resource limits and output/search-quality obligations. The selected profile may use fusion, inlining, RDC, Device LTO, ordinary linking or another CUDA-JS mechanism. Availability of a mechanism does not make it a framework dependency.

Historical Stage PTX experiments remain bounded mechanism/cost evidence. They do not authorize CUDA-MCGS-owned PTX, fix one artifact granularity or select a production mechanism.

## 10. Identity and compatibility

Deterministic semantic Search Program/package identity includes every input capable of changing CUDA-MCGS-owned meaning or emitted restricted Device-JS source, including:

- normalized contract/Search IR/schema versions;
- stage/checkpoint/base-context identities;
- selected capabilities/products and their schemas/owners;
- ordering, permissions and selected resource contributions;
- restricted Device-JS source/input digests and generator revision;
- selected domain/policy/evaluator/session/resource/output identities;
- required CUDA-JS public contract/capability profile;
- diagnostics/instrumentation selection.

CUDA-JS separately owns complete native/generated cache identity, including compiler/toolkit/provider/architecture/options/artifact inputs. The compatible-pair record binds both identities without making either repository own the other's private key space.

Unknown, missing or incompatible inputs fail before ignition. A product-only change invalidates affected product packages without changing universal contract versions when universal meaning is unchanged.

## 11. Session and device-closure boundary

Composition, validation, lowering, allocation and load occur before ignition. No required capability is discovered, generated, linked, loaded or rebound during active search.

A selected capability may consume session/root-epoch facts only when SPEC-0003 and SPEC-0006 grant them. External root/control/observation ports remain Search Session/package operations and MUST NOT become internal callbacks.

After ignition, CUDA-JS execution may use any qualified device-owned topology, but CUDA-MCGS internal search progress MUST NOT require a CPU-produced intermediate, host polling/relaunch, callback progression or late compilation decision.

## 12. Security and provenance

Restricted Device-JS and generated artifacts are executable inputs/outputs. Production packages MUST:

- use trusted/authorized sources under the selected profile;
- validate schemas, versions, permissions, digests and resource bounds before native work;
- reject undeclared public imports/exports and unsupported capability profiles;
- bind executable capabilities/resources to package/session lifetime;
- preserve source/generator/package/artifact provenance and license decisions;
- expose no ordinary arbitrary-address authority;
- fail closed on identity, compatibility or qualification mismatch.

CUDA-MCGS validates its semantic/package contract. CUDA-JS validates Device-JS and native/generated implementation contracts. Product ownership grants no native authority.

## 13. Lifecycle and rollback

Partial composition fails without publishing a valid package. Partial CUDA-JS validation/lowering/link/load/allocation unwinds through CUDA-JS public lifecycle contracts. Every task/runtime source, package, cache, module, allocation, operation, diagnostic and generated artifact receives an owned disposition.

Device-resident activation may change within the finite preplanned profile but does not permit late code mutation or unplanned resource acquisition. Product/capability removal occurs by deterministic recomposition before ignition, not active-session native unload.

## 14. Semantic conformance

One consolidated CUDA-free schema/reference capsule MUST cover:

- stage with no optional capability and exact semantic/source/package disappearance;
- entry-only, exit-only and entry-plus-exit capability behavior;
- several capabilities composed into one deterministic stage capability program unit;
- canonical selection/order and content-sensitive package identity;
- universal base context unchanged by deleting a product capability;
- namespaced product context/source only when selected;
- incompatible types, writes, permissions, resources, versions, semantic owners and public dependency profiles rejected before ignition;
- semantic parity with the owning reference oracle;
- first-product deletion and a materially different non-product capability;
- capability-gap classification when a required generic mechanism is absent.

These tests establish semantic composition, not native CUDA support.

## 15. Semantic acceptance blockers

This proposal cannot become accepted until:

- SPEC-0003 stage/base-context/capability semantics and relevant core contracts are decision-complete;
- restricted Device-JS/Search Program inputs and opaque CUDA-JS-generated outputs are represented by a versioned public package contract;
- capability-specific context/resource/identity/deletion obligations are represented by bounded Search IR/reference evidence accepted atomically with this contract;
- the CUDA-free semantic conformance capsule passes with first-consumer deletion and a materially different second capability;
- source/package security, provenance, compatibility, failure and cleanup obligations are explicit;
- no remaining normative text makes CUDA-MCGS the owner of CUDA-specific source or artifacts.

## 16. Production-profile qualification

A concrete native profile additionally requires:

- exact CUDA-MCGS Search IR, restricted Device-JS source/package and CUDA-JS package/revision identity;
- independent CUDA-JS qualification for every selected generic capability;
- CUDA-JS-generated artifact, ABI, resource and failure evidence through public contracts;
- empty-capability final-output/resource disappearance evidence;
- representative fused-control cost/performance/occupancy evidence when claimed;
- native publication, cancellation, partial-creation rollback and teardown evidence;
- exact compatible-pair semantic parity;
- separately scoped Windows/Linux support evidence.

These gates qualify a production profile after semantic acceptance. They are not circular prerequisites for accepting the backend-neutral composition contract.
