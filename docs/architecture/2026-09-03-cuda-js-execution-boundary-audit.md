# CUDA-MCGS / CUDA-JS execution-boundary audit — 2026-09-03

**Owner:** CUDA-MCGS issue #193  
**Audit source:** `iteathen/CUDA-MCGS@f32724e88cc340c63382def1e5138be43e8e147f`  
**Lower source:** `iteathen/CUDA-JS@bc2700f2e5c654567c2e17bf8d67b882351b8681` (`cuda-js@0.1.0-alpha.17`)  
**Tensor falsifier:** `iteathen/CUDA-JS-Tensor@ea591487c79ec1b3c1e184f4ddae761bd1d41bef`  
**NN falsifier:** `iteathen/cuda-nn@ac97fee981b7789e11af2ec4a7ca40799eb08ddd`

## Outcome

The canonical repository split survives the audit. CUDA-MCGS owns search semantics, Search IR, generated Search Program meaning, finite search-resource composition, device-owned progress, result/session/stage/channel meaning, and selected search physical-profile policy. CUDA-JS owns generic compilation, target/device capability, memory/view, module/function/artifact, launch admission, operation/synchronization/publication, prepared-DAG, provider and native-resource lifecycle.

No new generic CUDA-JS preparation transaction, launch resolver, provider registry, scheduler or GPU IR is justified by this audit:

- CUDA-JS #180 already dispositioned executable preparation in favor of the existing compiler/module/function/provider-plan/prepared-DAG LEGO bricks.
- CUDA-JS #181 retained explicit grid/block paths and selected upper-profile physical policy.
- CUDA-JS-Tensor #40/#44/#45 now consume public lower compatibility/provider facts without introducing a second runtime lifecycle.
- CUDA-MCGS ADR-0023 independently requires selected native search profiles to retain physical grid/block/warp/queue/kernel mapping policy rather than imposing one universal scheduler topology.

The current ownership risk is narrower: the **0.2.0 proposal evidence schemas independently spell CUDA-JS request vocabulary and shapes**. They are useful reference/proposal material, but they must not become a second normative definition of CUDA-JS fields, ranges, provider facts or lifecycle semantics when the future semantic-acceptance transaction is resumed.

This audit does not modify those proposal schemas. They are coupled to a separately held future semantic-acceptance transaction. The required future correction is recorded here and on #193 only; the held transaction itself is untouched.

## Governing authority

The result follows existing authority rather than introducing a new ownership model:

- ADR-0014: CUDA-MCGS owns the adapter translating accepted MCGS meaning to versioned public CUDA-JS; CUDA-JS remains generic and coherent if CUDA-MCGS is deleted.
- ADR-0019: an awkward native/private workaround is evidence of a possible lower capability gap, not authorization for CUDA-MCGS native code.
- ADR-0023: useful parallel native execution is required, but physical scheduler/topology selection remains profile-owned rather than universal.
- accepted SPEC-0001: generic CUDA compilation, allocation, launch, completion and teardown are explicitly CUDA-JS-owned; Search IR must not expose CUDA primitives as universal search meaning.
- accepted SPEC-0002: target/compiler/layout/CUDA-JS-private values are excluded from foundational Search IR; lowering identity is separate from semantic Search IR identity.
- proposal SPEC-0004: Channel owns item/publication/readiness semantics; CUDA atomics/queues/streams/events are lower mechanisms.
- proposal SPEC-0005: Search Program/package composition may project public CUDA-JS requirements while CUDA-JS still owns generated native artifacts and runtime mechanisms.
- proposal SPEC-0011: MCGS resource composition owns logical classes/capacity/admission/pressure while physical CUDA-JS resources remain opaque; only consumer-neutral requirements project downward.
- proposal SPEC-0012: progress owns readiness/fairness/no-progress/closure and explicitly excludes persistent-kernel/queue/stream/Graph topology as semantic requirements.
- proposal SPEC-0013: output owns result/observation publication meaning while generic allocation/atomic/transfer/mailbox/stream/event mechanisms remain CUDA-JS-owned.

## Schema-status rule

The audited `schemas/search-ir/0.2.0/*` execution/program/compatible-pair files are proposal/reference evidence. They are not accepted CUDA-JS API authority and do not authorize production lowering.

A future acceptance transaction must apply this rule:

> MCGS may persist a search/profile requirement or selected physical-policy value. The adapter may construct actual CUDA-JS requests. The installed/versioned public CUDA-JS contract remains the sole authority for CUDA-JS field names, allowed variants, finite lower limits, provider facts, validation, errors and resource lifecycle.

If an MCGS proposal schema retains a CUDA-shaped projection for reproducibility/evidence, the projection must be explicitly classified as adapter evidence and bound to an exact public CUDA-JS compatibility/schema identity rather than acting as an independently maintained copy.

## Execution-package field matrix

This matrix classifies the current `execution-package.schema.json` `cudaJs` proposal projection.

| Current field | Final owner / classification | Required future treatment |
| --- | --- | --- |
| `cudaJs.programs[].id` | MCGS adapter/package identity | Retain as MCGS package-local reference identity. |
| `cudaJs.programs[].source` | MCGS Search Program generation | Retain restricted Device-JS source produced from accepted MCGS semantics. CUDA-JS owns translation/compilation. |
| `cudaJs.programs[].function.name` | MCGS generated-program identity | Retain selected generated function name. |
| `cudaJs.programs[].function.kind` | CUDA-JS public Device-JS vocabulary used by adapter | Do not treat `kernel|device` enum as MCGS authority. Validate/construct against installed public CUDA-JS contract. |
| `cudaJs.programs[].function.parameters[].name` | MCGS generated function ABI name | Retain. |
| `cudaJs.programs[].function.parameters[].kind` | CUDA-JS public function-parameter vocabulary | Copied lower vocabulary. Future accepted package must bind to exact public CUDA-JS capability/schema rather than independently define the enum. |
| `cudaJs.resources[].id` | MCGS resource-plan/package identity | Retain. |
| `cudaJs.resources[].kind = device-memory` | CUDA-JS allocation/view request kind used by adapter | Adapter translation, not MCGS semantic authority. MCGS owns the need for resident bytes, not CUDA-JS request spelling. |
| `cudaJs.resources[].byteLength` | MCGS finite resource requirement | Retain exact planned byte requirement; CUDA-JS owns allocation admission and lower maximums. |
| `cudaJs.resources[].alignment` | Mixed: MCGS semantic/layout requirement or lower provider/device fact | Retain only independently justified MCGS alignment. Provider/device/native alignment must come from public CUDA-JS capability/plan facts and must not be copied. |
| `cudaJs.resources[].access` | MCGS semantic access requirement translated to CUDA-JS access contract | Retain semantic read/write need; adapter maps to public CUDA-JS access vocabulary. Do not independently redefine lower access variants. |
| `cudaJs.operations[].id` | MCGS package/selected-profile operation identity | Retain. |
| `cudaJs.operations[].programId` | MCGS package linkage | Retain. |
| `cudaJs.operations[].arguments[].binding` | MCGS adapter translation | Retain package binding identity; CUDA-JS owns actual argument schema/validation. |
| `cudaJs.operations[].grid` | MCGS selected-profile physical policy | Retain the selected explicit geometry value when materially chosen by the search profile. CUDA-JS owns validity/device limits. |
| `cudaJs.operations[].block` | MCGS selected-profile physical policy | Same as `grid`; retain value, never copied validity ceiling. |
| `cudaJs.operations[].dynamicSharedBytes` | MCGS selected-profile request over generic mechanism | Retain an explicitly selected/requested amount only when the profile owns that physical choice. CUDA-JS owns admission and per-device limit. |
| `cudaJs.operations[].after` | MCGS semantic/selected execution dependency translated to lower operation ordering | Retain dependency meaning. CUDA-JS owns operation/prepared-DAG mechanics and hazard validation. |
| `cudaJs.operations[].completion` | MCGS package mapping of lower completion to search lifecycle | Retain only MCGS semantic disposition/reference. Do not redefine generic CUDA operation completion states. |
| `cudaJs.concurrency.maxPending` | MCGS selected search concurrency requirement bounded by lower capability | Retain desired/profile maximum when independently justified. Actual admitted lower operation capacity must be negotiated from public CUDA-JS; no copied lower ceiling. |
| `cudaJs.lifecycle = compile/allocate/load/admit/ignite/cancel/complete/teardown` | Mixed MCGS orchestration / lower lifecycle vocabulary | Do not use this array as a second CUDA resource state machine. `ignite`, search cancellation and search completion are MCGS lifecycle; compile/load/allocation/resource close are CUDA-JS operations composed by the adapter. Future package should separate semantic phases from lower request/cleanup evidence. |

## Program-package-profile field matrix

`program-package-profile.schema.json` contains both genuine Search Program/package semantics and CUDA-shaped adapter projection. The following distinctions are mandatory.

| Current field | Final owner / classification | Required future treatment |
| --- | --- | --- |
| `semanticEngine.*` profile/resource/progress/output/session/stage/channel references | MCGS semantic/package owner | Retain. |
| `generator.*`, source-unit provenance and deterministic source identity | MCGS Search Program generator owner | Retain. |
| `sourceUnits[].source` | MCGS generated restricted Device-JS | Retain source meaning/provenance; CUDA-JS compiles it. |
| `functions[].kind` | CUDA-JS public Device-JS vocabulary consumed by MCGS generator/adapter | Bind to exact public CUDA-JS contract; do not evolve an independent lower enum. |
| `functions[].parameters[].type` / `returns` | CUDA-JS Device-JS type vocabulary where lower-facing | MCGS may constrain its generated ABI to a strict subset, but must identify that subset as an MCGS restriction over a public lower vocabulary, not the CUDA-JS definition. |
| `functions[].semanticRole`, `programUnits`, `effectOrder`, call graph | MCGS Search Program semantic composition | Retain. |
| `publicRequirements[]` | MCGS declaration of required public dependencies/capabilities | Retain. This is the preferred place to bind exact lower contract/capability identities. |
| `resources[].ownerProfile`, unit/capacity | MCGS finite resource semantics | Retain. |
| `resources[].providerRequirement` | MCGS requirement reference | Retain requirement identity; actual provider admission/facts come from public lower records. |
| `resources[].kind = device-memory|semantic-only` | Mixed MCGS semantic class vs CUDA allocation request projection | `semantic-only` is MCGS. `device-memory` is adapter realization vocabulary and must be lower-bound or translated, not made MCGS CUDA authority. |
| `resources[].alignment` | Mixed | Retain only independent MCGS layout need; lower/provider alignment comes from CUDA-JS. |
| `resources[].memorySpaces` | MCGS semantic placement classes | Retain if they describe MCGS meaning (`device-search`, `device-publication`, etc.); adapter maps them to available public CUDA-JS memory mechanisms. Do not imply CUDA-JS memory-space enums. |
| `resources[].access` including `atomic|publish` | MCGS semantic access/publication requirement | Retain semantic need; adapter selects qualified public CUDA-JS atomic/publication mechanism. Do not mirror CUDA-JS operation/access enum authority. |
| `operations[].entryPoint` / bindings | MCGS package composition + adapter translation | Retain package linkage; lower validation remains CUDA-JS. |
| `operations[].grid` / `block` | MCGS selected-profile physical policy | Retain explicit selected values; CUDA-JS owns validity/limits. |
| `operations[].dynamicSharedBytes` | MCGS selected physical request | Retain only when profile-selected; CUDA-JS owns admission/limit. |
| `operations[].maxPending` | MCGS concurrency policy constrained by lower capacity | Retain desired value, negotiate lower capability. |
| `operations[].lifecycle` schema reference | MCGS composition reference only if it names search/package meaning | Must not reference or define a competing generic CUDA resource lifecycle. Lower lifecycle stays public CUDA-JS. |
| `compatibility.cudaJs` exact repository/revision/package | Cross-repo compatible-pair provenance | Retain exact lower identity. |
| `capabilityNegotiation`, `requiredEvidence`, fallback | MCGS adapter/package policy over public lower facts | Retain MCGS response/policy, but lower capability/error meaning must come from installed public CUDA-JS. |

## Compatible-pair record

`compatible-pair-record.schema.json` has the correct high-level ownership shape and does not need a new generic abstraction. It records exact repositories/revisions/packages, lower capability identities, generated artifact/resource/operation identities, environment, evidence, claim scope and cleanup disposition.

Required rule for eventual native evidence:

- `cudaMcgs.*` records MCGS semantic/package identities.
- `cudaJs.*` records opaque/public lower artifact/resource/operation/runtime identities from the exact installed public contract.
- the pair record may bind those identities but does not reinterpret CUDA-JS resources or operations as MCGS-owned semantics.
- native/support claims remain exact-pair claims; portable proposal/reference fixtures cannot be relabeled native.

## Preparation and cleanup disposition

CUDA-JS #180 is final for this audit: no new `PreparedExecutable`/preparation transaction is justified.

A future `integration.cuda-js` adapter may explicitly compose:

1. public capability/compatibility negotiation;
2. restricted Device-JS compile/link through CUDA-JS;
3. public module load/function resolution where required;
4. public provider plans where selected;
5. finite CUDA-JS allocation/views for the already normalized MCGS resource plan;
6. public operation/prepared-DAG construction for the selected MCGS dependencies and physical profile;
7. search ignition/control mapping;
8. reverse dependency-safe cleanup of the resources the adapter assembled.

The adapter owns this **composition and rollback orchestration** because it translated MCGS meaning into lower LEGO resources. CUDA-JS remains the owner of each resource's actual state, admission, error, lease, completion, health and cleanup truth. This is the same ownership result established by the independent Tensor refactor and does not warrant a third lifecycle layer.

## Launch/topology disposition

CUDA-JS #181 is final for this audit: no logical-work resolver is required.

- CUDA-MCGS selected profiles may own explicit grid/block/warp/queue/kernel topology when that mapping materially defines the chosen parallel search realization.
- CUDA-JS owns legal grid/block/shared-memory ranges, selected-device facts and final launch admission.
- copied lower device ceilings are forbidden; public CUDA-JS capability/device facts are consumed at specialization/admission time.
- an explicit expert geometry path must remain available.

## Resource and provider disposition

No upper repository may own native provider handles, provider cleanup, CUDA alignment tables, CUDA error-code tables or private runtime state.

- MCGS resource profiles own logical resource classes, sizes/capacities, partitions, semantic placement/access requirements, pressure and exhaustion meaning.
- CUDA-JS owns physical allocations/views, lower limits, actual provider/native alignment, handle/resource lifecycle and generic failures.
- provider-neutral RNG/communication semantics, when selected, remain in `cuda-rng` / `cuda-comm`; MCGS owns search-specific use/policy and CUDA-JS owns physical provider mechanisms.

## Future semantic-acceptance input

The current 0.2.0 `cudaJs`/lower-facing proposal fields are acceptable as **reference evidence only**. Before they can become protected semantic/package authority, the future acceptance transaction must prove one of these dispositions for every lower-facing field:

1. genuine MCGS semantic/resource requirement;
2. MCGS selected-profile policy value over a generic lower primitive;
3. adapter translation whose validation authority is the exact public CUDA-JS contract;
4. opaque/public CUDA-JS value or mechanically lower-bound projection;
5. removed copied lower schema/limit/provider/lifecycle fact.

The future transaction must not accept the current duplicated lower enums/shapes merely because they already exist in proposal JSON Schema.

This is the only #193 finding that may affect future semantic acceptance. It is recorded here rather than mutating the held transaction or its issue.

## #125 disposition

CUDA-MCGS #125 remains the correct future owner for production `integration.cuda-js` implementation, but it is not dependency-ready.

Before #125 production implementation:

- the separately held semantic prerequisite must be completed under its own explicit authorization;
- the execution/package lower-facing fields must enter accepted authority with the ownership treatment above;
- #125 must consume only versioned public CUDA-JS package contracts and capability records;
- no native/private/deep-import workaround is allowed;
- exact compatible-pair/native qualification follows the corrected seam.

No #125 implementation is authorized by this audit.

## Closure criteria

Issue #193 can close when this matrix is protected-integrated and control state points at the held semantic dependency rather than pretending #125 is executable. Reopening #193 or creating a new CUDA-JS primitive requires new contradictory evidence, such as a concrete accepted MCGS profile that cannot be naturally expressed through the existing public lower LEGO contracts.
