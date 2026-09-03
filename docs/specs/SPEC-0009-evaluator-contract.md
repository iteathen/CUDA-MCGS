# SPEC-0009: Evaluator Capabilities, Resident Execution, and Result Readiness

**Status:** Accepted

**Version:** 0.1.0

**Accepted:** 2026-09-03 under #122 ENGINE-CONTRACT-ACCEPTANCE-01.

**Owner:** CUDA-MCGS universal evaluator semantics

**Product area / durable path:** universal MCGS semantic core / `docs/specs/`

**Consumers:** search policy, result/observation, finite-resource, device-progress and Search Session contracts; Search IR; Search Composer; domain/product adapters; graph owner-region composition; deterministic reference and native conformance

This specification defines the product-neutral evaluator brick that owns selected evaluator capabilities, finite requests, input encoding, device-resident execution meaning, batching, workspace, internal result readiness, caches, reroot reuse classification, and advance compatibility/provenance. It does not require a neural model, scalar value, action ranking, a host inference loop, one batch layout, an external output payload, a CUDA mechanism or an evaluator at all.

## 1. Authority, identity, and applicability

Specification identity is `CUDA-MCGS-SPEC-0009@0.1.0`.

Every concrete finite CUDA-MCGS engine declares evaluator selection as either `absent` or one normalized evaluator profile. A selected profile may contain one or more non-overlapping capabilities. Examples include candidate proposal, estimate, distribution, proof, constraint, feature or namespaced product capabilities; the names do not assign policy or product meaning by implication.

Normative dependencies are:

- [`ADR-0002`](../decisions/ADR-0002-universal-contracts-specialized-engines.md) for universal contracts and finite specialization;
- [`ADR-0003`](../decisions/ADR-0003-device-resident-active-search.md) for device-owned active search;
- [`ADR-0005`](../decisions/ADR-0005-lego-design-hierarchy.md) for one-owner LEGO boundaries;
- [`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md) for core/extension/product separation;
- [`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) for JavaScript/restricted Device-JS production ownership and CUDA-JS capability escalation;
- accepted [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) for evaluator-output publication, finite resources, stopping and valid-partial foundations;
- accepted [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) for foundational normalized Search IR/reference meaning within its current scope;
- accepted [`SPEC-0007`](SPEC-0007-domain-state-action-and-transition.md) for state-view, history, role, action and terminal-outcome meaning;
- accepted [`SPEC-0008`](SPEC-0008-search-policy-and-backup.md) for evaluator request/use, source adaptation, policy values and backup meaning; and
- accepted [`SPEC-0010`](SPEC-0010-graph-storage-and-reclamation.md) for graph objects, typed references, opaque owner regions, publication and reclamation.

Accepted [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) is informative adjacency for root epochs and reuse. The Search Stage/Async Channel proposals are possible later composition/lowering inputs, not prerequisites for this core semantic contract. Product evaluator specifications, experiments, model formats and implementations remain evidence beneath this proposal.

Accepted authority governs conflicts. This specification neither supersedes another specification nor authorizes production implementation.

## 2. Purpose, reading map, and required outcome

The required outcome is one evaluator-owned semantic boundary through which unrelated finite evaluators can accept device-side requests, derive bounded inputs, execute with admitted resident state, publish complete typed results and classify cache/reuse validity without domain, policy, graph, output or device-progress owners interpreting evaluator internals.

Sections 3 through 16 form one coupled normative contract. Sections 17 through 20 govern Search IR, compatibility, conformance and invalidation. A consumer of one evaluator result must also honor its capability, request, input-key, readiness, precision, lifecycle, resource and reuse rules.

The contract succeeds only if it can express evaluator absence, proposal-only, evaluation-only and combined profiles; analytic, learned, table/proof/constraint and custom evaluators; scalar, vector, distributional and opaque bounded results; batch-independent and explicitly batch-sensitive semantics; history-sensitive caches; partial per-capability readiness; and finite resumable execution without foundational redesign.

## 3. LEGO ownership and design boundary

### 3.1 Exact owned invariant and state owner

The evaluator contract owns this invariant:

> Every selected evaluator capability, request, input, resident artifact/state, workspace lease, batch, cache entry and result has one finite declared meaning, identity and lifecycle; a result becomes consumable only after its complete payload and validity metadata are published for the exact request incarnation, and no absent, unready, failed, cancelled or stale result influences search.

The selected evaluator profile owns:

- capability IDs, versions, request purposes and output schemas;
- evaluator input schemas and encoding from declared domain/product public views;
- evaluator-specific perspective, units, precision, uncertainty and invalid-result meaning;
- request, item, batch, continuation and result lifecycles;
- resident evaluator program/model/table/parameter/state semantics and provenance requirements;
- finite batching and evaluator workspace use;
- candidate-proposal production and proposal metadata before domain validation/policy admission;
- internal evaluator-result publication/readiness and failure;
- optional evaluator cache keys, entries, coherence and invalidation; and
- reroot reuse/reset/transform/invalidate classification for evaluator-owned state; advance never invokes retained-state reclassification and may preserve an entry only when its existing key/provenance is already valid for the selected descendant occurrence.

### 3.2 Explicit non-ownership

The evaluator contract does not own:

- domain state/action/history/role/transition/terminal-outcome identity or validity;
- policy selection, candidate admission, widening, policy-value conversion, statistics, backup, stopping or external ranking;
- graph nodes/edges/references, path storage, transposition equality, arenas or reclamation;
- external terminal-result/live-observation payload selection, snapshot or publication lifecycle;
- composed resource partitions/watermarks, device work scheduling/fairness/deadlock detection or Search Session control;
- generic allocation, transfer, compilation, JIT/link/load, atomic, stream/event, operation, context or teardown mechanisms, which belong to CUDA-JS; or
- product concepts such as chess position planes, win/draw/loss, best move, logits, neural architecture, tensor framework or tablebase semantics.

An evaluator may produce a bounded score/order/probability-like field as evaluator-owned output. Policy decides how or whether it affects search, domain validates proposed actions, and a selected output/product contract decides whether any field becomes externally visible.

### 3.3 Public semantic ports and injected dependencies

The universal evaluator ports are:

1. `initializeEvaluator` — validate and initialize admitted resident artifacts, state, caches and workspaces;
2. `encodeEvaluatorInput` — derive one finite immutable evaluator input/key from declared public domain/product views;
3. `admitEvaluationRequest` — validate and reserve one typed request incarnation and its required outputs/resources;
4. `enqueueEvaluationItem` — publish a request item as ready for device-owned progress;
5. `formEvaluationBatch` — group compatible ready items under declared finite batching semantics;
6. `executeEvaluationBatch` / `resumeEvaluationBatch` — perform or resume bounded evaluator work;
7. `publishEvaluatorCapability` — publish one complete typed internal result with validity metadata;
8. `completeEvaluationRequest`, `failEvaluationRequest` and `cancelEvaluationRequest` — terminate all required request outputs and resources exactly once;
9. `lookupEvaluatorCache` / `publishEvaluatorCache` — use an optional exact-key cache; and
10. `classifyEvaluatorReuse` — declare retain/retain-if-key-valid/transform/reset/invalidate for reroot reconciliation. Advance never invokes this port; existing cache/state survives only when its already-declared key/provenance remains valid without transformation or reset.

These are semantic ports, not mandatory runtime functions, stages, kernels or ABI symbols. Search Composer may fuse, split, specialize or eliminate them while preserving observable meaning and owner boundaries.

Injected dependencies are bounded public domain state/history/role/action views, requester purpose/context, graph reference/incarnation validity, resource admissions, progress facts, session epochs and selected product-evaluator schema values. Evaluator code must not inspect private provider objects/paths, mutate another owner's records, allocate outside the plan, dereference raw host/CUDA pointers, call a host callback or use CUDA-JS-private mechanisms.

### 3.4 Equivalence class, deletion tests and total-system simplicity

Permitted evaluators include pure analytic functions, heuristics, learned models, lookup/table/proof systems, constraint solvers, candidate generators, ensembles and namespaced product evaluators. They may use fixed or variable bounded inputs, one-item or larger batches, immutable assets, selected mutable evaluator state, exact or approximate numeric representations and deterministic or declared nondeterministic execution.

Deleting chess, ranked output, neural inference, all model assets, batching above one, caches, optional extensions, root advance or one physical scheduler leaves the applicable evaluator contract coherent. Selecting `absent` removes every evaluator-owned program, input/output field, request/batch/cache record, owner region, channel, artifact, workspace, resource, diagnostic and synchronization dependency.

Splitting request/result readiness from evaluator execution would create competing lifecycle authorities. Merging policy use, domain action validity, external output or CUDA mechanisms into evaluator would couple independently substitutable bricks. This evaluator boundary is therefore the simplest sufficient total-system owner.

## 4. Terms and semantic model

### 4.1 Evaluator profile and capability

An **evaluator profile** is the immutable normalized selection of evaluator capabilities, input/output schemas, resident artifacts/state, execution/batching rules, caches, resources, failures and reuse for one composed engine identity.

An **evaluator capability** is one namespaced typed request-to-result relation owned by that profile. Capability selection does not make its payload universal core meaning.

### 4.2 Request, item and purpose

An **evaluation request** binds one requester-owned purpose to an exact state/history/product input identity, graph/work/root incarnation, required/advisory capability set and finite result/resource disposition. An **evaluation item** is the independently identified unit that may join a batch. Purpose describes why the requester can consume the result; it does not authorize evaluator mutation of requester state.

### 4.3 Resident artifact, state and workspace

A **resident artifact** is immutable evaluator code/model/table/parameter data admitted before active use and accessible to device execution. **Evaluator state** is selected mutable evaluator-owned data with declared transitions and publication. A **workspace lease** is finite temporary evaluator-owned storage reserved to one item/batch/continuation until exact release.

Residence is semantic availability during active search, not ownership of a CUDA allocation or permission for the host to advance evaluation.

### 4.4 Evaluator result and result set

An **evaluator result** is one complete capability payload plus capability/profile/request/input/artifact identity, perspective/precision validity and publication state. A **result set** is the required/advisory capability collection for one request; individual capabilities may become ready independently only when the profile declares that independence.

An internal evaluator result is not an external Search result or observation.

### 4.5 Batch and batch semantics

An **evaluation batch** is a finite set or ordered sequence of compatible item incarnations processed under one workspace/execution lease. **Batch-independent** semantics require each item's valid result to be invariant to compatible grouping/order within declared numeric tolerance. **Batch-sensitive** semantics make declared batch composition/order/context part of the evaluator input and determinism identity.

### 4.6 Evaluator cache key and entry

An **evaluator cache key** is the complete normalized identity of every fact capable of changing one cached evaluator result. A **cache entry** binds that key to one completely published result set or capability result plus entry incarnation and reuse state.

## 5. Evaluator-profile normalization and validity

EVAL-PROFILE-001. A selected profile declares, with no unknown fields:

- stable profile ID/version and compatible domain/graph/policy/product contract identities;
- selected capability IDs/versions, purposes, requirement classes and non-overlapping output ownership;
- input views, encodings, keys, shapes, ranges, precision and history/observation/root dependencies;
- output schemas, units, perspective, precision, validity, uncertainty and invalid-result handling;
- resident program/artifact/parameter/state identities, provenance, mutability and lifecycle;
- request/item/batch/result/cache states, generations, ownership and publication edges;
- compatibility/grouping/order/batch-sensitivity and finite resumable execution rules;
- workspace/cache/queue/result/continuation/resource formulas and maxima;
- cancellation, stale-work, failure, diagnostics, fallback and cleanup;
- reroot reuse dispositions plus input/cache provenance sufficient to determine advance compatibility without retained-state reclassification; and
- persistence/compatibility policy when selected.

EVAL-PROFILE-002. Missing/unknown/duplicate fields, overlapping capability ownership, ambiguous input/output perspective or units, insufficient range/precision, undeclared required-result fallback, unbounded execution/batch/cache/workspace, invalid resource formula, nonterminal request state or arithmetic overflow rejects specialization before ignition.

EVAL-PROFILE-003. Meaning-insensitive collections normalize canonically. Meaningful capability order, tensor/record coordinate order, batch order, reduction order and fallback priority are preserved. Every meaning-affecting option contributes to evaluator identity.

EVAL-PROFILE-004. Every selected evaluator port has a finite work/read/write/randomness/cancellation bound or a finite resumable protocol with explicit continuation identity, resources, progress and no false completion.

EVAL-PROFILE-005. Profiles declare whether results are exact, tolerance-equivalent, interval/bounded-error, stochastic-distributional, proof-certified or custom. The declared class supplies the comparison oracle; bit identity is not assumed universally.

EVAL-PROFILE-006. Host validation/composition and initial asset loading may use ordinary Node.js through public CUDA-JS contracts. Active evaluator requests, batching, execution, cache transitions and result publication use restricted Device-JS/Search Program inputs and device-owned progress.

EVAL-PROFILE-007. CUDA-MCGS may not implement evaluator execution with C/C++, CUDA C++, native addons/FFI, hand-written PTX, embedded CUDA source, a subprocess or CUDA-JS-private APIs.

EVAL-PROFILE-008. If correct evaluator execution needs a naturally generic GPU mechanism not expressible by public CUDA-JS contracts with clear ownership, finite resources, synchronization, lifecycle and qualification, work stops for CUDA-JS capability classification. Evaluator meaning remains in CUDA-MCGS and is not distorted to fit a missing mechanism.

## 6. Selection modes and capability composition

EVAL-MODE-001. `absent` is a complete evaluator selection. It admits no evaluator request and contributes zero evaluator-owned runtime/generated residue. A policy requiring an evaluator result rejects composition with `absent` before ignition.

EVAL-MODE-002. A proposal-only profile may produce candidate actions and evaluator metadata but no policy-value-capable result by implication. A value/evaluation-only profile may produce estimates/proofs/features but no action candidate by implication. A combined profile declares each selected capability separately.

EVAL-MODE-003. A request marks each capability `required`, `optional`, `advisory` or another profile-defined requirement class with exact completion/failure/fallback meaning. Omission means not requested, not an empty payload.

EVAL-MODE-004. Capability composition has one owner for each payload field, mutation and terminal disposition. Shared encodings/artifacts/workspaces may be physically fused only when lifecycles, resource accounting, failure isolation and deletion remain provable.

EVAL-MODE-005. Removing one capability removes solely owned input/output fields, code, state, caches, channels, workspaces, resources and diagnostics. Shared retained state requires another selected consumer and a declared owner independent of the removed capability.

EVAL-MODE-006. Product or extension capabilities are namespaced/versioned and use the least-authority evaluator ports. Their deletion leaves universal evaluator normalization and the remaining capability profiles complete.

## 7. Inputs, encoding, identity and requests

EVAL-INPUT-001. Every input field names its semantic owner, source public view, schema/version, shape/range, precision, memory-space expectation, lifetime and whether it participates in input/cache identity. The evaluator cannot infer omitted domain history or product state from graph location.

EVAL-INPUT-002. `encodeEvaluatorInput` consumes only completely published, generation-valid public views. It validates graph/domain/root/work incarnations before reading and cannot make an unready graph object ready by encoding it.

EVAL-INPUT-003. Encoding may transform a domain state view into evaluator-specific features, but it cannot redefine domain equality, action validity, role or outcome. Two domain-equal state views may have different evaluator inputs only when an explicit evaluator-relevant fact outside domain future-behavior equality is declared and bound to evaluator identity/cache validity.

EVAL-INPUT-004. Variable-size input declares maximum bytes/elements/dimensions, exact length fields, truncation policy only when semantically valid and finite resumable encoding when one bounded step is insufficient. Silent truncation/padding/reinterpretation is prohibited.

EVAL-INPUT-005. Input arithmetic and representation declare integer/fixed/floating/custom widths, endianness where serialized, rounding, normalization, invalid/nonfinite handling and target-sensitive equivalence. Host and device encoders cannot silently disagree.

EVAL-INPUT-006. Randomized/noisy evaluation consumes explicit finite random sample/stream/counter identity. Host timing, observation cadence, address layout and undeclared process-global randomness are not evaluator inputs.

EVAL-INPUT-007. An immutable input snapshot or protected borrow remains valid through the required execution/read window. Its exact lease/reference is released on every terminal path; graph reclamation cannot reuse the source while the evaluator may read it.

EVAL-REQUEST-001. Every admitted request has a stale-safe ID/incarnation and binds capability/profile, purpose, input/cache key, graph reference/incarnation, root/work epoch, requester identity, requirement classes and resource reservations.

EVAL-REQUEST-002. Request lifecycle is compatible with accepted SPEC-0001 publication: `absent → claimed/queued → ready | failed | cancelled`. A selected profile may refine internal states such as `reserved`, `encoded`, `batched`, `executing` or `publishing`, but cannot erase externally observable readiness/failure distinctions.

EVAL-REQUEST-003. Admission validates all identities and atomically reserves required item/result/queue/workspace-or-admission-credit resources before publishing the request as queued. Failure consumes no live admission and does not publish a usable request.

EVAL-REQUEST-004. A requester may declare required/advisory readiness and fallback, but it cannot mutate evaluator lifecycle state, fabricate readiness or reinterpret evaluator failure. Evaluator does not decide policy use of a ready result.

EVAL-REQUEST-005. Duplicate equivalent requests may be coalesced only under a declared key/equivalence, waiter/refcount bound, cancellation rule and result/failure fan-out. Coalescing cannot merge different epochs/purposes/required capabilities when those facts affect validity.

EVAL-REQUEST-006. A request may complete from cache, fresh execution or a declared equivalent source. All paths publish the same capability schema/validity metadata and preserve request accounting.

EVAL-REQUEST-007. Queue presence, batch membership, a non-null result reference, cache-key match or execution completion does not imply result readiness. Consumers acquire the exact capability publication state.

EVAL-REQUEST-008. Stale/cancelled/failed requests terminate waiters and resources exactly once. A late physical computation may finish, but it cannot publish into a cancelled/stale request incarnation or a reused result slot.

EVAL-REQUEST-009. Request accounting distinguishes admitted, queued, batched, executing, publishing, ready, failed and cancelled/abandoned items. Every admitted item and every reserved input/result/workspace/cache lease reaches exactly one terminal disposition; retry or coalescing cannot double-count completion or release.

EVAL-REQUEST-010. A request publishes `ready` only when every required capability has a complete ready result or a declared successful fallback has replaced it, and every nonrequired capability has a declared terminal/detached disposition. A failed required capability cannot be hidden by an unrelated advisory result, and request completion cannot strand an advisory producer or lease.

## 8. Candidate-proposal semantics

EVAL-PROPOSAL-001. A proposal capability owns candidate production order/continuation, raw candidate payload and evaluator metadata. Domain owns candidate decoding, validity, equality/key and origin scope; policy owns request amount, admission/widening/use; graph owns edge storage/publication.

EVAL-PROPOSAL-002. Candidate batches are finite or use a finite continuation with exact cursor/incarnation, completion status, duplicate/multiplicity semantics, resource bound and terminal failure/cancellation.

EVAL-PROPOSAL-003. An evaluator candidate is not a valid domain action or graph edge until the domain validates and normalizes it. Invalid candidates receive the domain-owned disposition selected by composition; evaluator cannot bypass validation even when it generated a domain-native encoding.

EVAL-PROPOSAL-004. Proposal scores, probabilities, priors, logits, ranks, uncertainty or custom metadata declare units, perspective, normalization scope, precision and invalid handling. None is universal and none is automatically a policy value or external ranking.

EVAL-PROPOSAL-005. Rejected/duplicate candidates do not silently count as admitted actions or completed evaluator value. Request/result accounting declares whether production itself completed despite downstream rejection.

EVAL-PROPOSAL-006. Open, sampled, sparse or continuous action spaces do not require full materialization. The profile declares how further proposals are requested, whether proposal sequence is stable, and how state/history/model/randomness identity affects continuation validity.

## 9. Evaluator outputs and policy adaptation

EVAL-OUTPUT-001. Every capability result declares a finite normalized payload schema, semantic coordinates/units/perspective, precision/range, invalid values, uncertainty/confidence/proof interpretation, completeness and compatibility identity.

EVAL-OUTPUT-002. Result perspective belongs first to evaluator output meaning. Policy maps a ready evaluator result through its declared source adapter into a policy value; it cannot assume scalar sign, root player, zero-sum, probability or total order.

EVAL-OUTPUT-003. Results may be scalar, vector, matrix/tensor-like bounded records, distribution, interval, ordinal, proof/certificate, candidate set, sequence, sparse structure or namespaced custom payload. Every representation is finite for a concrete profile.

EVAL-OUTPUT-004. Invalid/nonfinite/out-of-range/schema-mismatched output publishes typed evaluator failure or a specifically declared valid sentinel with exact meaning. Silent clipping, renormalization, NaN propagation or fallback is prohibited.

EVAL-OUTPUT-005. Multiple capability outputs become independently consumable only when the profile declares independent publication and failure. Otherwise the result set becomes ready atomically after every required payload is complete.

EVAL-OUTPUT-006. Advisory or optional output absence cannot masquerade as a zero/default evaluator value. The policy adapter receives explicit absence/failure/fallback identity.

EVAL-OUTPUT-007. Evaluator completion does not mean policy backup, graph expansion, external result publication or completed-search accounting. Each downstream owner performs its own admitted transition.

EVAL-OUTPUT-008. A certificate/proof-like result declares validation ownership and evidence. Calling a payload `proof` does not make it authoritative without the selected product/evaluator verification contract.

## 10. Batching, execution and workspace

EVAL-BATCH-001. A batch has stale-safe identity, capability/execution profile, compatible item set/order, capacity, workspace lease, execution/continuation state and exact terminal disposition.

EVAL-BATCH-002. Batch formation consumes only ready compatible items and is bounded. It may choose one item. No evaluator profile may require the host to gather, launch, poll, interpret or relaunch batches to advance active search.

EVAL-BATCH-003. Compatibility declares every fact that must match, including capability/output set, input shape class, artifact/parameter generation, precision, execution variant, batch-sensitive context and resource class. Convenient equal byte sizes are insufficient.

EVAL-BATCH-004. A batch-independent profile proves per-item semantics within declared tolerance across permitted grouping/order/padding. A batch-sensitive profile binds exact composition/order/padding/reduction/randomness context to each item result and profile/determinism identity.

EVAL-BATCH-005. Padding or inactive lanes cannot mutate evaluator state, consume semantic randomness, publish result, affect batch-sensitive reduction or count as completed items unless their exact effect is declared.

EVAL-BATCH-006. Execution has a finite bound or resumable continuation with forward progress, state integrity and exact retry/idempotence semantics. A continuation cannot retain an unbounded graph borrow or workspace lease.

EVAL-BATCH-007. Per-item and whole-batch failure domains are explicit. One invalid input/result may fail one item only when the remaining outputs are independent and valid; otherwise every affected waiter receives the authoritative batch failure.

EVAL-BATCH-008. Result scatter validates each request/result slot incarnation before mutation. Reordered, duplicated, dropped or stale item identities are evaluator failure and cannot be repaired by positional assumption.

EVAL-BATCH-009. Workspace layouts declare persistent/per-item/per-batch/per-continuation regions, capacities, initialization, exclusive/shared ownership, mutation/publication, high-water accounting and release. No hidden allocator, host spill or emergency workspace is permitted.

EVAL-BATCH-010. Selected mutable evaluator state declares update operation, ordering/atomicity, schedule dependence, publication, rollback/failure, cache invalidation and determinism class. An immutable-artifact profile contributes no mutable-model-state machinery.

## 11. Internal publication and cache coherence

EVAL-PUB-001. Every evaluator payload read by another device participant has one declared publication channel with producer, consumers, states, payload owner, visibility scope, failure/cancellation and bounded progress.

EVAL-PUB-002. The producer fully initializes payload and validity metadata before publishing `ready` with the visibility required by all possible consumers. Consumers acquire exact readiness before reading.

EVAL-PUB-003. Publication validates request, result-slot, input, artifact/parameter, root/work and graph incarnations at the declared commit point. A stale producer cannot publish into reused/new-epoch storage.

EVAL-PUB-004. At most one terminal publication is authoritative for one capability/request incarnation. Conflicting ready/failure/cancel outcomes are evaluator corruption, produce bounded diagnostics and quarantine affected results.

EVAL-PUB-005. Waiters observe ready, failed, cancelled, stale and composed stop states. They release device workers/progress resources when pending rather than spin or call the host.

EVAL-PUB-006. Internal evaluator readiness is independent of external observation cadence. A host read or output snapshot cannot trigger encoding, batching, execution, cache fill or readiness merely to satisfy observation.

EVAL-PUB-007. A profile may publish payload fields progressively only when each published subset is a separately identified capability with complete validity. Partially written monolithic output is never ready.

EVAL-PUB-008. Physical synchronization is selected later through public CUDA-JS contracts. This semantic contract does not require a particular atomic type, fence, stream, event, CUDA Graph, cooperative launch or kernel topology.

EVAL-CACHE-001. Caching is optional. An absent cache contributes no cache key/entry/lookup branch, owner region, resource, diagnostic or synchronization residue.

EVAL-CACHE-002. The cache key includes every result-affecting fact: capability/profile, encoded semantic input, relevant history/observation/root/purpose when applicable, artifact/model/parameter/state generation, precision/execution semantics, randomness when reusable, and product/capability identity.

EVAL-CACHE-003. Domain identity alone is a valid cache key only when evidence proves every evaluator-relevant input is a function of that domain identity under the exact profile. Hash/key equality without required collision/full-key verification is insufficient.

EVAL-CACHE-004. Entry lifecycle declares vacant/claimed/initializing/ready/failed/retired states or an equivalent complete protocol, stale-safe generation, collision handling, waiter bound, publication and reclamation protection.

EVAL-CACHE-005. A cache hit is semantically equivalent to a fresh result under the declared equivalence/tolerance class and publishes the same result validity metadata. Cache latency or storage location cannot alter result meaning unless declared input.

EVAL-CACHE-006. Failed, cancelled, partial, stale or incompatible results are not ready cache entries. Negative/failure caching is permitted only with exact key, lifetime and policy and cannot conceal recoverable resource pressure as a semantic evaluator result.

EVAL-CACHE-007. Cache capacity/full behavior is typed pressure. Eviction/retirement is an evaluator cache policy with protection/quiescence; graph reclamation or resource pressure does not silently choose semantic victim policy.

EVAL-CACHE-008. Mutable evaluator state/artifact changes invalidate or version affected entries before new results publish. Entry generation and key space never wrap into stale aliasing.

## 12. Residence, active-search closure and CUDA-JS boundary

EVAL-RESIDENT-001. Every artifact/state that may be required after ignition is validated, admitted and made device-resident before ignition. The profile declares whether it is engine-, session-, root- or work-incarnation scoped and whether it is immutable or selected mutable evaluator state. A later first use does not authorize post-ignition host loading.

EVAL-RESIDENT-002. Artifact descriptors bind type/schema/version, exact content/provenance digest, compatible evaluator program/profile, finite byte/element ranges, precision/encoding, initialization and teardown. A model filename or framework name is not sufficient identity.

EVAL-RESIDENT-003. Host-to-device initialization and final teardown may use ordinary Node.js through public CUDA-JS contracts before/after active execution. After ignition, no required evaluator decision or intermediate depends on a CPU result, callback, polling response, dynamic compilation decision or host-managed batch loop.

EVAL-RESIDENT-004. Meaning-affecting artifact/parameter replacement cannot occur while active search work exists. It requires drain/quiescence, complete pre-admission and a new evaluator/session/engine incarnation. A selected Search Session control may switch among already admitted resident variants only when the session/evaluator contracts define the bounded device-side application point and invalidate old requests/caches/results; it cannot upload a host-produced intermediate or race active requests.

EVAL-RESIDENT-005. Evaluator-owned restricted Device-JS/Search Program source may express search-specific encoding/execution/result semantics. CUDA-JS validates, lowers, compiles, links, loads and runs it and may use native/JIT/CUDA implementation behind public consumer-neutral contracts.

EVAL-RESIDENT-006. CUDA-JS-generated PTX/cubin/LTO/ABI handles and raw device pointers are opaque outputs/resources. CUDA-MCGS does not author, patch, parse for semantic control or deep-import their implementation.

EVAL-RESIDENT-007. Optional generic features such as asynchronous transfer, RDC, Device LTO, multiple operations, publication mailboxes, CUDA Graphs or cooperative execution are selected only when a concrete profile naturally requires them and exact qualification exists. Availability does not make them universal evaluator semantics.

EVAL-RESIDENT-008. If a natural evaluator profile cannot be expressed with the public CUDA-JS surface, the design records the needed consumer-neutral capability, bounded resources, synchronization, lifecycle, cleanup and independent qualification. CUDA-MCGS implementation pauses at that boundary; it does not add native code or an awkward host/device workaround.

## 13. Device-owned progress, ordering and synchronization

EVAL-PROGRESS-001. Evaluator contributes typed readiness transitions and work classes; device-progress owns when/where ready encoding, batching, execution, continuation, scatter and publication run. Evaluator does not select a global scheduler topology.

EVAL-PROGRESS-002. Every pending state has a possible bounded producer transition, a terminal failure/cancellation/stop transition and declared fairness/no-progress requirements. An item cannot wait forever for a batch size that may never arrive.

EVAL-PROGRESS-003. A batching timeout may use only a declared device-visible progress/attention fact. Host wall-clock polling/relaunch and observation reads cannot be required to flush a partial batch.

EVAL-PROGRESS-004. Queue, batch, workspace and result pressure return typed pending/backpressure/exhaustion outcomes. Work releases its current worker rather than spin on unavailable capacity.

EVAL-PROGRESS-005. Scheduling may change batching, numerical order or outputs only within the profile's declared determinism/equivalence class. Stable validity, bounds, conservation, failure ownership and stop/result classification remain invariant.

EVAL-PROGRESS-006. Stop prevents new evaluator admission unless required for a previously admitted must-complete transition. Queued/executing/publishing requests follow declared drain/cancel/abandon rules without host direction.

EVAL-PROGRESS-007. A physical scheduler, persistent kernel, work queue, CUDA Graph, cooperative launch, stream set or operation graph is later profile evidence, not evaluator contract meaning.

## 14. Root epochs, stale work and evaluator reuse

EVAL-REUSE-001. Every persistent evaluator artifact/state/cache/result/request class declares one root-change disposition: `retain`, `retain-if-key-valid`, `transform`, `reset` or `invalidate`, with exact conditions, ordering and owner lifecycle port.

EVAL-REUSE-002. Physical graph-node retention does not imply evaluator result/cache validity. History, observation, root-relative perspective, requester purpose, artifact/state generation and product facts remain in the key when they can change output.

EVAL-REUSE-003. Root-independent requests/results may survive root advance only when their exact key and consumer contract prove validity. Root-relative work cannot publish into a newer epoch merely because its state node survives.

EVAL-REUSE-004. Search Session coordinates root commit and stale-work disposition; evaluator owns meaning of cache/result/state validity; graph owns storage protection/reclamation. No owner infers another's reuse decision.

EVAL-REUSE-005. Transform/reset/invalidate actions are finite, admitted and published. A failed new-root admission leaves the old authoritative session/evaluator state unchanged.

EVAL-REUSE-006. Epoch/generation exhaustion never wraps. The selected session/resource policy requires restart/new incarnation/typed termination before stale evaluator requests, results or caches could alias current state.

## 15. Lifecycle, resources, cancellation and failures

EVAL-LIFE-001. Selected evaluator lifecycle is `profile-normalized → artifacts/resources-admitted → initialized → active → draining → terminal → released`, with typed failure/quarantine paths. `absent` specializes directly to zero evaluator lifecycle state.

EVAL-LIFE-002. Request/result/workspace/cache lifetimes are subordinate to the selected evaluator incarnation and protect every borrowed graph/domain/artifact resource until exact disposition.

EVAL-LIFE-003. Evaluator contributes finite units/formulas/maxima for resident artifacts/state, input snapshots/borrows, requests/items, queues, batches, workspaces, continuations, result slots/payloads, caches/waiters, randomness and diagnostics.

EVAL-LIFE-004. Resource contributions describe evaluator need; the finite-resource contract owns composition, partitions, watermarks, admission, pressure and exhaustion. CUDA-JS owns generic allocations/operations. Evaluator cannot allocate hidden overflow, host spill or unplanned emergency buffers.

EVAL-LIFE-005. Applicable typed statuses include `evaluator-absent`, `invalid-evaluator-profile`, `unsupported-evaluator-capability`, `invalid-evaluator-input`, `evaluator-input-stale`, `evaluator-request-capacity`, `evaluator-batch-pending`, `evaluator-batch-incompatible`, `evaluator-workspace-capacity`, `evaluator-artifact-invalid`, `evaluator-output-invalid`, `evaluator-cache-miss`, `evaluator-cache-capacity`, `evaluator-generation-exhausted`, `evaluator-cancelled` and `evaluator-internal-failure`. The profile classifies normal/pending/pressure/recoverable/stop/fatal meanings.

EVAL-LIFE-006. Failure disposition is owner-attributable. Evaluator preserves domain/policy/graph/resource/progress/CUDA-JS failure identity and those owners do not convert invalid evaluator input/output/cache state into a generic search value.

EVAL-LIFE-007. Cancellation has one declared ordering point against result publication. Before commit it prevents readiness and releases/abandons work; after authoritative ready publication it cannot retroactively invalidate an otherwise compatible result, though the requester/session may decline to consume it.

EVAL-LIFE-008. Non-preemptible admitted execution may drain physically after cancellation, but its stale/cancelled request stays non-consumable and all leases/results receive exact cleanup. A must-finish physical operation is not a must-use semantic result.

EVAL-LIFE-009. Teardown stops admission, resolves every waiter/request/batch/continuation, retires caches/results, releases graph/input borrows and evaluator owner regions, and only then releases CUDA-JS-owned operations/allocations/context dependencies through public lifecycle contracts.

EVAL-LIFE-010. This contract imposes no universal input/output dimension, model size, batch size, cache capacity, workspace size, request count, numeric width, operation count, latency or first-domain/first-GPU limit. Each concrete profile selects sufficient finite ranges or rejects specialization.

## 16. Security, trust, persistence and cleanup

EVAL-SEC-001. Evaluator profiles, restricted Device-JS source, artifacts/models/tables/parameters, product schemas, persisted caches/results and external configuration are untrusted until strict schema/version/range/digest/provenance/resource/permission validation passes.

EVAL-SEC-002. Evaluator ports receive least-authority bounded views and owned regions only. Raw pointers, arbitrary host objects/callbacks, CUDA handles/symbols, credentials, filesystem/network authority and private provider paths/types are prohibited as evaluator inputs.

EVAL-SEC-003. Artifact and executable-source provenance includes exact revision/content digest, license, allowed origin, compatibility and security review. A downloaded model or code fragment is not trusted because its format parses.

EVAL-SEC-004. Malformed shape/stride/length, out-of-range index, integer overflow, stale reference, invalid/nonfinite result, decompression/decoding excess and digest mismatch fail closed before unauthorized read/write or ready publication.

EVAL-SEC-005. Diagnostics are bounded and redact sensitive/proprietary state/model/input payload by default. They identify owner, request/capability, bounded cause and evidence identity without dumping arbitrary device/model bytes.

EVAL-SEC-006. Persistence is optional. A persistent evaluator artifact/cache/result profile defines canonical encoding, namespace/version, integrity, crash/partial-write recovery, migration/rollback, key/reuse validity, retention and secure cleanup. In-memory layouts are not automatically durable formats.

EVAL-CLEANUP-001. Every task/runtime artifact reference, input lease, request, waiter, batch, workspace, continuation, result, cache entry, diagnostic and retained evaluator state receives release/retain/transform/reset/invalidate/quarantine disposition.

EVAL-CLEANUP-002. Invalid artifact provenance, cache-key inconsistency, conflicting publication, stale-slot write or uncertain mutable-state update quarantines affected evaluator and downstream policy/output evidence. Recovery cannot manufacture a ready value or silently rewrite accounting.

EVAL-CLEANUP-003. Removing an evaluator/capability also removes its generated/cache artifacts and resource/schema references unless retention has explicit evidence/recovery authority and an objective disposal trigger.

## 17. Compatibility, generated identity and Search IR

EVAL-COMPAT-001. Evaluator compatibility requires compatible profile/capability, domain input/history, requester purpose, output/perspective, artifact/state, precision/execution, batch, cache and reuse identities. Matching model names, tensor sizes or function signatures is insufficient.

EVAL-COMPAT-002. Search Composer/package/cache identity binds normalized evaluator selection, capability schemas, input encodings/keys, result meaning, artifact content/provenance, mutable-state initialization, batching/determinism, resources, caches/reuse and restricted Device-JS inputs. CUDA-JS native artifact/ABI identity remains opaque and separately bound.

EVAL-COMPAT-003. Changing any result-affecting input/key, artifact/parameter/state, output perspective/schema, numeric semantics, batching/order, failure/fallback or reuse invalidates affected requests/caches/results, policy adapters/statistics, output evidence, Search IR/packages, persisted sessions and reference/native approvals.

EVAL-COMPAT-004. A migration may retain cached/persisted evaluator state only with an explicit old-to-new semantic equivalence proof, canonical transform, atomic commit/rollback, provenance and post-migration oracle. Version-number similarity is not proof.

EVAL-IR-001. Complete Search IR represents evaluator absence or normalized profile identity, capabilities/purposes/requirement classes, input views/encodings/keys, result schemas/perspectives, resident artifacts/state, request/batch/publication/cache lifecycles, finite resource contributions, failures/cancellation, reroot reuse and advance provenance/compatibility.

EVAL-IR-002. Search IR names semantic owners/ports/publication/resource/progress dependencies without exposing one framework, private model type, current JavaScript module, raw pointer, PTX/CUDA symbol, atomic spelling, stream/event, scheduler or host callback.

EVAL-IR-003. Normalization rejects unknown/duplicate owners, capability overlap, incomplete key, ambiguous shape/unit/perspective, insufficient ranges, undeclared batch sensitivity/failure/fallback, unbounded continuation/waiter/cache, hidden resource and missing cleanup.

EVAL-IR-004. Domain exposes only declared state/history/action validation views; policy exposes request purpose and consumes ready typed outputs through adapters; graph stores only opaque owner regions/leases; output consumes declared ready facts; resource/progress/session consume contributions/transitions. No deep import or reverse semantic ownership is allowed.

EVAL-IR-005. Selected product/extension evaluator capabilities remain namespaced inputs. Removing one removes its solely owned fields/artifacts/code/state/resources while universal evaluator normalization remains complete.

EVAL-IR-006. An evaluator-absent normalized engine and generated package contain no evaluator input/output/channel/request/batch/workspace/cache/artifact/state/diagnostic/synchronization field or branch. This deletion is byte/code/layout/resource inspected, not inferred from a disabled flag.

## 18. Conformance and authoritative oracles

The deterministic CUDA-free reference is authoritative for normalized evaluator request/result/cache/reuse semantics under a declared schedule, random-input and numeric-equivalence profile. Native evidence later proves publication, workspace isolation, real Device-JS execution and teardown for one exact CUDA-JS pair. A model benchmark, product move or throughput number cannot replace semantic oracles.

Later `ENGINE-IR-COMPOSER-01` and `ENGINE-REFERENCE-01` must consolidate at least:

| Case ID | Required falsifier |
|---|---|
| `evaluator-profile-strict-normalization` | Ambiguous capability/input/output/batch/cache/reuse meaning is accepted. |
| `evaluator-absent-zero-residue` | Evaluator-free engine retains any evaluator-owned generated/runtime residue. |
| `evaluator-mode-matrix` | Proposal-only, evaluation-only and combined capability/readiness/failure are conflated. |
| `evaluator-input-history-key` | History-sensitive result aliases a base-state-only cache key. |
| `evaluator-input-borrow-lifetime` | Graph storage is reclaimed while evaluation may still read it. |
| `evaluator-request-admission-atomicity` | Failed admission consumes live capacity or publishes queued work. |
| `evaluator-request-coalescing-cancel` | One waiter cancellation corrupts another or merges incompatible purposes. |
| `evaluator-proposal-ownership` | Candidate bypasses domain validation or evaluator decides policy admission/edge storage. |
| `evaluator-open-proposal-continuation` | Lazy/sampled/continuous proposals require full materialization or lose identity. |
| `evaluator-vector-distributional-output` | Non-scalar/custom result requires scalar/policy redesign. |
| `evaluator-independent-capability-readiness` | Partial bytes become ready or one capability failure is silently ignored. |
| `evaluator-batch-one-progress` | A non-full batch waits forever or requires host flush. |
| `evaluator-batch-independent-equivalence` | Compatible grouping/order changes a batch-independent result beyond tolerance. |
| `evaluator-batch-sensitive-identity` | Batch context changes meaning without entering result/profile identity. |
| `evaluator-padded-lane-isolation` | Inactive lane mutates state/randomness/result/accounting. |
| `evaluator-scatter-incarnation` | Reordered/stale item publishes into the wrong result slot. |
| `evaluator-workspace-isolation` | Concurrent batches overlap exclusive scratch or leak a lease. |
| `evaluator-publication-acquire` | Consumer sees ready with incomplete payload/validity metadata. |
| `evaluator-cancel-publication-race` | Cancelled/stale request becomes consumable or leaks resources. |
| `evaluator-cache-full-key-collision` | Hash/key collision returns a semantically different result. |
| `evaluator-cache-mutable-state-invalidation` | Old-state cache entry survives result-affecting mutation. |
| `evaluator-advance-history-provenance` | Advance invokes cache reclassification or physical node retention preserves a result whose existing history/provenance key is invalid for the selected descendant occurrence. |
| `evaluator-device-closure` | Host-produced intermediate, batch loop or observation is required for progress. |
| `evaluator-resource-pressure` | Full queue/workspace/cache creates hidden spill, spin or untyped failure. |
| `evaluator-capability-deletion` | Removing a product/capability leaves solely owned code/state/resources. |
| `evaluator-oracle-sensitivity-readiness` | Removing incarnation/readiness/cache-key validation does not fail the oracle. |

The minimum fixture set includes:

1. an evaluator-absent policy-only search;
2. a proposal-only lazy candidate generator whose candidates require domain validation;
3. an evaluation-only analytic evaluator with no model assets and batch size one;
4. a combined evaluator with independently ready proposal and vector/distributional outputs;
5. a history-sensitive cached evaluator across transposition and root advance;
6. a batch-independent evaluator exercised under different groupings plus an explicitly batch-sensitive evaluator;
7. a finite resumable evaluator under queue/workspace/cache pressure, cancellation and stale epochs; and
8. a materially different proof/constraint/table-like evaluator without neural/tensor assumptions.

Native qualification additionally tests actual restricted Device-JS validation/lowering, admitted artifact transfer/residence, concurrent request/batch/workspace publication, memory visibility, cancellation/stop races, cache/reuse generations, resource conservation and complete CUDA-JS lifecycle cleanup. Performance/quality comparisons freeze domain/policy/graph/resource/output profiles, artifact/content identity, numeric/determinism class, batch/workspace policy, workloads/seeds and CUDA-JS pair.

## 19. Examples and rationale (informative)

A policy-only proof search may select no evaluator. A proposal-only optimizer may emit sampled continuous candidates that the domain validates. An analytic heuristic may evaluate one item without model assets. A learned evaluator may publish a vector distribution plus candidate metadata from shared resident parameters. A table/proof evaluator may publish a certificate-like opaque record. A history-sensitive evaluator may reuse cached output only when the full history key remains valid after root advance.

These examples do not select a neural framework, tensor layout, batch size, cache, scalar value, WDL, logits, search formula, scheduler, external result payload or CUDA mechanism.

## 20. Acceptance blockers and downstream invalidation

Acceptance review under #122 found no unresolved capability, input/key, request, output/perspective, artifact/state, batching/workspace, publication/cache, progress, reuse, range, lifecycle, compatibility, security or cleanup ambiguity.

Acceptance under #122 required:

1. normalized Search IR/schema represents every EVAL-IR obligation and rejects semantic ambiguity;
2. the deterministic reference executes all required fixtures/cases and readiness/cache-key oracle-sensitivity mutation;
3. output, resource, progress and Search Session proposals reconcile internal results, external publication, pressure, stopping and reuse without duplicate authority/cycles;
4. evaluator-absent and selected capability/product deletion checks pass;
5. at least one natural finite evaluator profile is classified against the public CUDA-JS surface without an in-repository native workaround, while native qualification remains a later selected-profile gate;
6. the integrated semantic packet is reviewed on one exact revision at `ENGINE-CONTRACT-ACCEPTANCE-01`; and
7. required documentation/governance validation passes.

Production evaluator lowering remains prohibited until that acceptance. Native Device-JS/artifact/concurrency/publication/performance/search-quality evidence qualifies selected profiles later unless required to decide semantic meaning.

A change to evaluator ownership, capability/mode, input/key, request/result lifecycle, output perspective/schema, resident artifact/state, batching/workspace, publication/cache, failure/cancellation or reuse invalidates affected policy adapters/statistics, output/resource/progress/session contracts, Search IR/schema/normalizers, graph owner layouts, generated packages, persisted sessions/caches, reference/native evidence and review approvals. The ENGINE-CONTRACT-01 integration spine records and reconciles invalidation before dependents continue.

Implementation, test, review, persistence, security, generated/JIT/ABI, performance/search-quality and cleanup work triggers the specialist doctrine routed from root `AGENTS.md` and `agent_files/AGENTS.md`.


> **#122 acceptance record (2026-09-03):** The semantic/reference conditions in this specification were discharged by the exact #36 CUDA-free packet at `0cd3dafdbfa683048b0a0f39de21a671fd9ef841`, the #193 CUDA-JS ownership-boundary audit, and the atomic #122 acceptance review. Any clause that explicitly requires native compatible-pair, physical memory-ordering/concurrency, performance, platform-support, or downstream product evidence remains a separate deferred qualification gate and is not claimed by semantic acceptance.
