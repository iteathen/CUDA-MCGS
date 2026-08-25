# SPEC-0005: Restricted Device-JS and Search Image Composition

**Status:** Proposal

**Draft version:** 0.4.0

**Stable path note:** The historical filename remains for link compatibility. Stage PTX is not a CUDA-MCGS-owned production input.

**Owner:** CUDA-MCGS deterministic restricted Device-JS Search Program composition and CUDA-MCGS/CUDA-JS execution-package boundary

**Product area / durable path:** universal extension/composition substrate / `docs/specs/`

**Consumers:** Search IR, Search Composer, selected stage/capability/channel/product providers, resource/progress/package planning, public CUDA-JS Device-JS/compiler/runtime contracts, conformance, compatible-pair qualification and release

This proposal defines how CUDA-MCGS deterministically composes selected semantic owners and optional capabilities into restricted Device-JS Search Program inputs and a finite execution package while treating every CUDA-specific generated/native realization as an opaque CUDA-JS-owned output. It does not make one native artifact topology, extension capability or product part of universal MCGS meaning.

## 1. Authority, identity and applicability

Specification identity is `CUDA-MCGS-SPEC-0005@0.4.0-draft`.

Normative authority and dependencies are:

- [`ADR-0002`](../decisions/ADR-0002-universal-contracts-specialized-engines.md) for universal contracts and finite specialization;
- [`ADR-0003`](../decisions/ADR-0003-device-resident-active-search.md) for device-resident active search;
- [`ADR-0005`](../decisions/ADR-0005-lego-design-hierarchy.md) for LEGO ownership/deletion;
- [`ADR-0014`](../decisions/ADR-0014-extract-cuda-js-runtime.md) for the independent CUDA-JS boundary;
- [`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md) for optional extension/product separation;
- [`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) for JavaScript/restricted Device-JS CUDA-MCGS source and CUDA-JS capability escalation;
- accepted [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) and [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) for publication/resource/Search IR/reference foundations; and
- decision-complete proposals [`SPEC-0003`](SPEC-0003-search-stage-and-extension-surface.md) and [`SPEC-0004`](SPEC-0004-async-stage-channels.md) for selected stage/capability/channel meaning.

Decision-complete proposal [`SPEC-0000`](SPEC-0000-framework-requirements.md) owns the cross-owner framework/package map; SPEC-0006 through SPEC-0013 own their source semantics. They become normative dependencies through the later atomic semantic-acceptance gate. Versioned accepted public CUDA-JS contracts own restricted Device-JS syntax/typing/lowering, compiler/linker/cache/artifacts, resources, operations, errors, platform behavior and teardown. Accepted authority governs conflicts.

COMPOSE-AUTH-001. This specification applies to every finite CUDA-MCGS engine package and to extension-specific composition only when capabilities are selected. Core Search Program/package composition remains meaningful without the optional extension substrate.

COMPOSE-AUTH-002. CUDA-MCGS owns semantic/source/package inputs through public contracts. CUDA-JS exclusively owns CUDA C++/PTX/cubin/LTO/native generation, compiler/runtime mechanisms and artifact identity. Neither side interprets the other's private semantic key space.

COMPOSE-AUTH-003. This proposal is not production implementation authority. Schema/reference acceptance, public CUDA-JS capability qualification and an exact compatible pair remain separate gates.

## 2. Governing source/artifact invariant

> **Maintained CUDA-MCGS production source is ordinary Node.js plus restricted Device-JS only. Every CUDA-specific generated/native realization is a CUDA-JS-owned opaque output.**

COMPOSE-SOURCE-001. CUDA-MCGS may author/generate canonical restricted Device-JS source, function metadata and consumer-neutral public CUDA-JS requests. It cannot author, maintain, patch, parse, merge or reinterpret C, C++, CUDA C++, `.cu`/`.cuh`, PTX, cubin, LTO, CUDA headers, compiler flags, ABI structs, raw handles, Driver calls, native addons or subprocess native search.

COMPOSE-SOURCE-002. CUDA-JS may use JIT, native code, CUDA-specific source/artifacts and any qualified internal realization behind its public consumer-neutral contracts. Those internals never become CUDA-MCGS source or semantic authority.

COMPOSE-SOURCE-003. A missing generic GPU mechanism stops the affected profile for ADR-0019 capability classification. A private CUDA-JS import, local native code, hand-written artifact, artifact patch/parser or awkward Device-JS workaround is non-conforming.

COMPOSE-SOURCE-004. CUDA-JS receives only public Device-JS/compiler/resource/operation/package requests. It does not receive or interpret Search IR, stage, channel, capability, root/session, graph, policy, evaluator, output, product or search-resource-policy meaning.

## 3. LEGO ownership and representation layers

COMPOSE-LEGO-001. SPEC-0000 owns cross-owner normalized framework/package obligations. This specification owns deterministic Search Program construction, selected extension source contribution and projection into public CUDA-JS requests; it does not duplicate framework lifecycle or source-owner semantics.

COMPOSE-LEGO-002. A **semantic engine profile** identifies selected MCGS owners/contracts and their normalized Search IR. A **Search Program** is canonical restricted Device-JS source/function metadata plus public dependency/resource/operation declarations derived from that profile. An **execution package** binds those semantic/source inputs and manifests for realization. A **CUDA-JS realization** is the opaque public result/artifact/runtime identity. A **compatible-pair record** binds both repositories' identities and evidence without merging ownership.

COMPOSE-LEGO-003. A stage capability program unit is the normalized semantic contribution of all selected capabilities at one SPEC-0003 surface. It is not necessarily one source file, JavaScript function, native function, compiler input, PTX object, module, kernel, launch or binary.

COMPOSE-LEGO-004. Physical fusion/splitting, inlining, linking, RDC, Device LTO, CUDA Graphs, cooperative execution, module count and launch topology are private CUDA-JS or selected-profile realization choices unless a versioned public contract makes a generic choice observable.

COMPOSE-LEGO-005. Product/capability providers contribute schema-constrained semantic inputs and restricted Device-JS behavior under declared owners. They do not supply independently discovered native fragments or obtain CUDA-JS-private authority.

COMPOSE-LEGO-006. Deleting the first product/capability leaves core Search Program composition, public CUDA-JS contracts and package identity coherent. Deleting CUDA-MCGS leaves every CUDA-JS capability independently consumer-neutral.

## 4. Normalized composition profile

COMPOSE-PROFILE-001. A normalized composition profile declares, with no unknown fields:

- framework/Search IR identity and accepted-authority baseline;
- exact selected source-owner, optional stage/channel/capability and product identities;
- canonical restricted Device-JS source inputs/generator identity;
- complete function metadata, entry-point roles and public parameter/result descriptions;
- deterministic semantic effect/program ordering;
- finite semantic resource/progress/output/session requirements;
- exact public CUDA-JS Device-JS/compiler/resource/operation/capability requirements;
- target constraints/options only as admitted by public CUDA-JS schemas;
- result/observation/diagnostic/cleanup manifests;
- provenance, trust, licenses, digests, compatibility and deletion manifests.

COMPOSE-PROFILE-002. Unknown/missing/duplicate identities, incompatible owner versions, undeclared source/functions/imports/exports, permission/order/resource conflict, unsupported public CUDA-JS requirement, unbounded field or provenance/trust failure rejects before native work.

COMPOSE-PROFILE-003. Unordered selections normalize by raw JavaScript/Unicode code-unit order. Semantically ordered effects preserve one explicit declared order. Ambient locale, insertion/filesystem order, dependency discovery and tool output order are not authority.

COMPOSE-PROFILE-004. Every meaning/source-affecting field participates in CUDA-MCGS composition identity. Equivalent inputs produce byte-identical normalized Search Program/package inputs; any semantic, source, metadata, permission, resource or public-dependency change changes identity.

COMPOSE-PROFILE-005. Host-side normalization/generation may use ordinary Node.js. No active-search schema interpretation, source generation, compilation, linking, provider discovery or host decision is permitted.

COMPOSE-PROFILE-006. All source sizes, functions, parameters, call depth, generated regions, capability contributions, entry points, resources, operations, diagnostics and package records are finite and checked before CUDA-JS dispatch.

## 5. Capability-provider inputs and trust

COMPOSE-CAP-001. Every selected capability input declares namespaced ID/version, semantic owner/contract, required stage/checkpoint/context/channel profile, restricted Device-JS behavior/configuration, effect order, finite contribution, failure/cancellation/deletion and provenance/license/trust identity.

COMPOSE-CAP-002. A capability whose semantic effect lacks an owning selected domain/policy/evaluator/output/session/product/other contract rejects before source composition. The Composer cannot infer meaning from source code.

COMPOSE-CAP-003. Capability-specific context/state/channel/resource/source exists only when selected. Its source generator may consume only normalized declared inputs and cannot inspect arbitrary repository/runtime state or CUDA-JS private output.

COMPOSE-CAP-004. Executable third-party capability input is accepted only under an explicit trust profile with schema/permission/resource/source bounds, pinned provenance/digest/license and fail-closed diagnostics. Product ownership is not a trust bypass.

COMPOSE-CAP-005. Capability source cannot import host JavaScript, Node APIs, native modules, CUDA syntax, arbitrary headers/options, dynamic code, reflection, eval or undeclared public CUDA-JS helpers.

COMPOSE-CAP-006. Capability failure maps to its declared stage/source-owner outcome and cleanup; generated code cannot call a host fallback or silently switch semantic behavior.

## 6. Deterministic Search Program construction

COMPOSE-PROGRAM-001. Before ignition, the Search Composer normalizes selected contracts/capabilities, validates every owner/permission/resource/channel/public dependency and constructs one canonical finite Search Program.

COMPOSE-PROGRAM-002. For each materialized SPEC-0003 surface, the Composer sorts selected capabilities canonically, proves writes commute or imposes their declared order, merges only selected context contributions and constructs one semantic stage capability program unit.

COMPOSE-PROGRAM-003. The Composer emits complete canonical restricted Device-JS source plus exact function metadata accepted by the selected public CUDA-JS Device-JS contract. Source text—not function-object serialization, AST, generated CUDA or native bytes—is CUDA-MCGS source authority.

COMPOSE-PROGRAM-004. Every generated semantic region traces to normalized source-owner/capability/profile IDs and generator version without exposing CUDA-JS private generated source/artifacts.

COMPOSE-PROGRAM-005. Function names, generated identifiers, declarations, metadata and semantically unordered units use the public CUDA-JS Device-JS canonical ordering contract. Naming collisions, recursion/call cycles, incompatible types and unsupported helpers reject before compiler dispatch.

COMPOSE-PROGRAM-006. There is no active-search registry, schema interpreter, fragment loop, callback table, function-pointer lookup, dynamic import, late binding, runtime source selection or product-controlled native symbol resolution.

COMPOSE-PROGRAM-007. The number/placement of restricted Device-JS functions/source requests is a deterministic Composer design choice; the number/form of generated CUDA-JS artifacts is opaque. Neither count is a universal stage/capability requirement.

COMPOSE-PROGRAM-008. A selected implementation may specialize/fuse source-owner ports and capability behavior only when reference-visible semantics, permissions, resource accounting, failure, cancellation, identity and deletion remain identical.

COMPOSE-PROGRAM-009. CUDA-JS public helper/capability use is selected only when naturally required by generated semantics. Availability alone does not add a package dependency or authorize RDC/LTO/multi-operation/sideband/graph/cooperative mechanisms.

COMPOSE-PROGRAM-010. A required public CUDA-JS feature absent or unqualified for the claimed profile produces a typed pre-ignition unsupported-capability result with exact requirement identity; it does not trigger private/native fallback.

## 7. Exact absence and deletion

COMPOSE-DELETE-001. No selected extension capability means the complete extension profile is absent under SPEC-0003 and the core Search Program/package contains no extension stage graph, surface, context, channel, code region, branch/dispatch, state, resource, synchronization, diagnostic or public capability dependency.

COMPOSE-DELETE-002. Deleting one capability removes every solely capability-owned semantic field, source region/function/call, context/state/workspace/channel, resource/progress contribution, synchronization, diagnostic, public CUDA-JS requirement and package/compatibility input.

COMPOSE-DELETE-003. Shared source/functions/resources/public requirements remain only when another selected owner independently requires them and their canonical content is unchanged except for identity records that truthfully enumerate selected owners.

COMPOSE-DELETE-004. An absent capability leaves no enable flag, no-op branch, empty callback/dispatcher, placeholder context, reserved buffer, dormant channel, diagnostic counter, link input or generated-artifact requirement.

COMPOSE-DELETE-005. Metamorphic deletion compares normalized Search IR, restricted Device-JS source/metadata, semantic resources/progress and execution-package inputs byte-for-byte after removing identity fields that must truthfully enumerate selected owners. Every remaining difference has another visible owner.

COMPOSE-DELETE-006. Native profile qualification additionally uses CUDA-JS-owned public artifact/resource inspection to prove no solely deleted-capability behavior/resource remains. CUDA-MCGS verifies public identities/manifests but does not parse CUDA/PTX/cubin/LTO/native bytes.

## 8. Public execution-package contract

COMPOSE-PACKAGE-001. The CUDA-MCGS execution package is finite, canonical, immutable and self-identifying. It contains enough public inputs/manifests for CUDA-JS realization without requiring CUDA-JS to interpret Search IR or invoke host JavaScript for active decisions.

COMPOSE-PACKAGE-002. The package identifies:

- normalized semantic engine/Search IR and Search Program identity;
- restricted Device-JS exact source digest/function metadata/public helper profile;
- selected source-owner/stage/channel/capability/product identities;
- typed kernel/device entry-point roles and public parameter/result schemas;
- finite semantic and generic CUDA-JS resource/operation requirements;
- public CUDA-JS package/API/capability/evidence requirements;
- target constraints/options admitted by public CUDA-JS contracts;
- result/observation/diagnostic/cancellation/completion/cleanup manifests; and
- provenance, license, checksums, compatibility and deletion records.

COMPOSE-PACKAGE-003. Search-domain terms remain in the CUDA-MCGS package side. The concrete request delivered to CUDA-JS is projected into generic public source/function/resource/operation data with no MCGS semantic interpretation requirement.

COMPOSE-PACKAGE-004. The package contains no raw CUDA handle/pointer, CUDA ABI struct, private compiler option, CUDA header/source/PTX/native artifact internals, private CUDA-JS cache key/path or deep import.

COMPOSE-PACKAGE-005. CUDA-JS public results may include opaque typed artifact/resource/operation identities, bounded summaries, errors and lifecycle records. CUDA-MCGS may store/compare their public digests/manifests and pass opaque outputs through public APIs but cannot patch/parse/reinterpret them.

COMPOSE-PACKAGE-006. Partial Search Program/package construction publishes no valid package. A package becomes eligible for realization only after schema, identity, compatibility, resource and provenance validation succeeds atomically.

COMPOSE-PACKAGE-007. One semantic package may realize as one or several opaque artifacts/operations under a qualified CUDA-JS profile. Artifact/operation count is not semantic compatibility unless the selected public profile explicitly makes it so.

## 9. Identity and compatible-pair layers

COMPOSE-IDENTITY-001. CUDA-MCGS semantic identity covers normalized owner contracts/Search IR. Search Program identity additionally covers exact restricted Device-JS source/function metadata, generator version, selected capabilities/order/contributions and public CUDA-JS requirement profile.

COMPOSE-IDENTITY-002. CUDA-JS independently owns Device-JS contract/parser/lowering identity and compiler/artifact/runtime identity, including generated private source, providers/toolkit/headers/options/target/native artifact and public resource/operation realization as its contracts require.

COMPOSE-IDENTITY-003. The compatible-pair record binds exact CUDA-MCGS revision/package/Search IR/Search Program identity; exact CUDA-JS revision/package/API/capability/artifact/runtime identity; device/platform/toolchain profile; evidence digests; claim scope and cleanup disposition.

COMPOSE-IDENTITY-004. Matching semantic output alone, package version alone or artifact digest alone is insufficient compatibility. Every selected public contract/profile and meaning/source-affecting identity must agree.

COMPOSE-IDENTITY-005. Product/capability-only changes invalidate affected packages/evidence without changing universal versions when universal meaning is unchanged. Additive unselected capability support leaves existing package identity byte-identical.

COMPOSE-IDENTITY-006. Version negotiation occurs before allocation/ignition and fails closed. Runtime fallback cannot silently weaken semantics, types, synchronization, resources, qualification or cleanup.

## 10. Resource, progress, session and device-closure composition

COMPOSE-RUNTIME-001. SPEC-0011 owns semantic finite-resource composition. The package separately declares public CUDA-JS generic resource/operation needs and includes their bounded overhead in admission before ignition.

COMPOSE-RUNTIME-002. SPEC-0012 owns readiness/progress/stop/drain/closure. Source composition may define work-class procedures but cannot select a scheduler topology or rely on host progression.

COMPOSE-RUNTIME-003. Optional SPEC-0006 external control/observation operations and SPEC-0013 result publication remain distinct from internal stage/channel composition. Similar CUDA-JS mechanisms do not merge semantic owners.

COMPOSE-RUNTIME-004. Composition, validation, public Device-JS compilation, resource allocation, opaque load/binding and operation admission complete before ignition for every required component.

COMPOSE-RUNTIME-005. After ignition, no required behavior is discovered, generated, compiled, linked, loaded, rebound or allocated. An already composed capability may activate only within its finite preplanned identity/resources under owner-defined device-resident rules.

COMPOSE-RUNTIME-006. Active search cannot require a CPU-produced intermediate, host polling/relaunch loop, callback progression, runtime schema/source interpreter or late compilation decision.

COMPOSE-RUNTIME-007. Cancellation/completion/teardown use only selected public CUDA-JS lifecycle operations plus owner-defined semantic dispositions. Destroying a host wrapper or artifact reference does not prove device work stopped or resources are terminal.

## 11. Security, provenance and lifecycle

COMPOSE-LIFE-001. Restricted Device-JS/capability inputs and CUDA-JS outputs are executable or execution-bearing state. Production profiles validate trust, schemas, versions, permissions, source bytes/digests, public imports/exports, resources, target constraints, provenance and licenses before native work.

COMPOSE-LIFE-002. Generated restricted Device-JS exposes no ordinary arbitrary-address/raw-pointer authority and uses only declared typed public parameters/helpers. Capability/product ownership grants no native privilege.

COMPOSE-LIFE-003. CUDA-MCGS diagnostics expose normalized semantic/source/package identities and bounded public CUDA-JS errors without leaking private AST, generated CUDA source, native option vector, raw handle, cache path or credential.

COMPOSE-LIFE-004. Partial CUDA-JS validation/compilation/link/load/allocation/operation preparation unwinds through public CUDA-JS lifecycle contracts. CUDA-MCGS records the public terminal disposition and never cleans private native state directly.

COMPOSE-LIFE-005. Every task/runtime source snapshot, package, cache/artifact reference, resource, operation, diagnostic and compatible-pair record has one owner and remove/retain/quarantine/archive disposition. Unsupported/failed realization leaves no falsely valid package/profile claim.

COMPOSE-LIFE-006. Product/capability removal occurs by deterministic pre-ignition recomposition and new immutable package identity, not active-session source mutation, native unload or hot patching.

## 12. Cost and realization neutrality

COMPOSE-COST-001. Stable semantic checkpoints and selected capability behavior are not assumed free. Concrete profiles account code size, registers, stack/local/shared memory, occupancy, synchronization, traffic, latency, compilation/cache and operation overhead through public evidence.

COMPOSE-COST-002. Representative qualification compares selected composition against semantically equivalent fused/generated controls under identical workload, resource limits, outputs and quality obligations. Synthetic PTX call evidence cannot establish production cost.

COMPOSE-COST-003. Historical Stage-PTX experiments remain bounded deletion/determinism/cost evidence only. They do not authorize CUDA-MCGS PTX, one call per hook, one artifact per stage, RDC/LTO requirements or production thresholds.

COMPOSE-COST-004. A selected realization may fuse, inline, split or link through CUDA-JS only when semantic identity, public package contract, deletion, diagnostics and exact native evidence remain truthful.

## 13. Search IR, Composer and reference obligations

COMPOSE-IR-001. Search IR/schema must represent every COMPOSE-PROFILE field and exact owner/capability/channel/source/resource/progress/output/session/public-dependency/deletion/compatibility input without CUDA-private fields.

COMPOSE-IR-002. The Composer must produce canonical source/function/package bytes deterministically, validate complete function/source/owner mapping, prove selected-only contribution/deletion and reject unknown/unowned/incompatible input before CUDA-JS dispatch.

COMPOSE-IR-003. A schema cannot invent source-owner semantics, capability effects, native topology or public CUDA-JS support. Missing meaning/capability/evidence yields typed rejection.

COMPOSE-IR-004. CUDA-free reference composition treats CUDA-JS results as typed opaque fixtures and verifies semantic/source/package identities, public request projection, failure/rollback and deletion without parsing native artifacts.

## 14. Conformance and falsification

One consolidated CUDA-free composition capsule must cover at least:

1. core-only engine with exact absence of extension profile/source/resource/package residue;
2. entry-only, exit-only and entry-plus-exit selected behavior;
3. several capabilities forming one deterministic semantic stage capability program unit;
4. canonical selection/effect/function ordering independent of input order/locale;
5. exact Device-JS source/function/package identity repeatability and content sensitivity;
6. universal base context unchanged by product capability selection/deletion;
7. capability-specific source/context/channel/resource/public dependency only when selected;
8. first-product deletion and materially different non-game capability;
9. incompatible types, functions, writes, permissions, owners, channels, resources, versions and public dependencies rejected;
10. undeclared helper/import/export/native option rejected before CUDA-JS dispatch;
11. CUDA-JS request projection containing no Search IR/stage/product meaning;
12. opaque CUDA-JS success/failure/resource/lifecycle fixture handling;
13. missing generic GPU capability producing ADR-0019 classification rather than workaround;
14. one semantic package mapped to one/multiple opaque artifact fixtures without semantic change;
15. product-only change invalidating only affected identity/evidence;
16. partial composition/CUDA-JS failure rollback with no falsely valid package;
17. active-search discovery/late-binding/host-progression mutations rejected;
18. exact compatible-pair record completeness and mismatch rejection;
19. historical Stage-PTX/native-field inputs rejected as production source; and
20. teardown/disposition of every package/public CUDA-JS resource/operation/evidence reference.

COMPOSE-CONFORMANCE-001. Reference cases assert semantic/source/package determinism, owner separation, public projection, deletion, failure and lifecycle—not CUDA output bytes, artifact count or scheduler topology.

COMPOSE-CONFORMANCE-002. Independent mutations must break source/function completeness, owner/permission/order/resource validation, public dependency identity, deletion, opaque-boundary enforcement, rollback and compatible-pair keys and show the oracle fails.

COMPOSE-CONFORMANCE-003. Native qualification separately proves installed-package Device-JS compilation, opaque artifact/load/operation behavior, final deletion/resource evidence, publication/cancellation/teardown, representative cost and exact compatible-pair parity. Portable/reference evidence is not native support.

## 15. Semantic acceptance blockers

This proposal cannot become accepted until:

- every normative requirement maps to strict schema/normalization and an independent CUDA-free reference case or explicit cross-specification proof;
- SPEC-0003/0004 and the core proposal packet agree with package/source-owner/deletion boundaries;
- a versioned public execution-package projection represents restricted Device-JS inputs and opaque CUDA-JS outputs without CUDA-MCGS native ownership;
- core-only, zero-capability, first-consumer deletion and materially different second-capability cases pass exactly;
- source/function/identity/public-dependency/security/provenance/failure/rollback/cleanup mutations fail independently; and
- `ENGINE-CONTRACT-ACCEPTANCE-01` accepts this contract atomically with its schema/reference evidence and coupled proposal dependencies on one exact revision.

A concrete production profile additionally requires exact CUDA-MCGS Search IR/Search Program/package identity, independently qualified selected CUDA-JS capabilities, opaque generated artifact/resource/operation evidence, native deletion, representative cost when claimed, failure/cancellation/teardown and exact compatible-pair parity. Windows/Linux and other platform support remain separately scoped. These native gates do not become circular prerequisites for backend-neutral semantic acceptance.
