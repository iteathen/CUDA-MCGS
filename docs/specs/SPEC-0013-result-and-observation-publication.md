# SPEC-0013: Bounded Result and Observation Publication

**Status:** Proposal

**Draft version:** 0.1.0

**Owner:** CUDA-MCGS universal external result/observation publication semantics

**Product area / durable path:** universal MCGS semantic core / `docs/specs/`

**Consumers:** finite-resource, device-progress and Search Session contracts; Search IR; Search Composer; product/output adapters; deterministic reference and native conformance

This proposal defines the product-neutral output brick that owns immutable bounded terminal-result envelopes and optional read-only live-observation publication. It does not require ranked actions, a scalar score, an evaluator, a game, a live session, one consistency model, a host polling loop or a CUDA mailbox/transfer mechanism.

## 1. Authority, identity, and applicability

Specification identity is `CUDA-MCGS-SPEC-0013@0.1.0-draft`.

Every concrete finite CUDA-MCGS engine selects exactly one terminal-result profile. Its universal envelope is mandatory even when its semantic payload is empty. Live observation is independently optional and selects zero or more namespaced observation profiles; selecting none contributes exact zero live-observation residue.

Normative dependencies are:

- [`ADR-0002`](../decisions/ADR-0002-universal-contracts-specialized-engines.md) for universal contracts and finite specialization;
- [`ADR-0003`](../decisions/ADR-0003-device-resident-active-search.md) for device-owned active search;
- [`ADR-0005`](../decisions/ADR-0005-lego-design-hierarchy.md) for one-owner LEGO boundaries;
- [`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md) for core/extension/product separation;
- [`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) for JavaScript/restricted Device-JS production ownership and CUDA-JS capability escalation;
- accepted [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) for publication, stopping, completion classes, valid partial results, resource status and bounded diagnostics;
- accepted [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) for foundational normalized Search IR/reference meaning within its current scope;
- proposal [`SPEC-0007`](SPEC-0007-domain-state-action-and-transition.md) for terminal domain outcomes and state/action identities;
- proposal [`SPEC-0008`](SPEC-0008-search-policy-and-backup.md) for ready policy facts, stopping and optional order/ranking meaning;
- proposal [`SPEC-0009`](SPEC-0009-evaluator-contract.md) for internal evaluator-result readiness; and
- proposal [`SPEC-0010`](SPEC-0010-graph-storage-and-reclamation.md) for graph references, owner regions, protection and reclamation.

Proposal [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) is informative adjacency for live request/borrow/root-epoch coordination. Product output specifications such as chess ranking remain downstream. Search Stage/Async Channel and CUDA-JS mailbox/transfer contracts are possible later realizations, not this core meaning.

Accepted authority governs conflicts. This proposal neither supersedes another specification nor authorizes production implementation.

## 2. Purpose, reading map, and required outcome

The required outcome is one output-owned semantic boundary through which unrelated searches can publish truthful immutable terminal envelopes and, when selected, bounded read-only live snapshots without source owners interpreting consumer formats or consumers advancing search.

Sections 3 through 12 form one coupled normative contract. Sections 13 through 16 govern compatibility, conformance and invalidation. A consumer of one field must also honor source readiness, snapshot consistency, epoch/incarnation, publication, borrow, pressure and cleanup rules.

The contract succeeds only if it can express envelope-only completion, structured domain outcomes, scalar/vector/distribution/proof/custom policy facts, ranked and non-ranked payloads, evaluator-absent output, complete/valid-partial/no-valid-result classes, one-shot and live sessions, independently versioned and stronger snapshots, lossy/coalesced observations and zero live-observation residue without foundational redesign.

## 3. LEGO ownership and design boundary

### 3.1 Exact owned invariant and state owner

The output contract owns this invariant:

> Every externally consumable result or observation has one finite schema, source binding, consistency class, identity and lifecycle; its payload is immutable and consumable only after all selected fields and validity metadata are completely published for the exact slot/root/work incarnation, and reading or requesting it never advances or mutates search-semantic state.

The selected output profile owns:

- mandatory terminal envelope schema and publication lifecycle;
- selected terminal and live payload field bindings to ready public source facts;
- snapshot/cut consistency and per-field validity metadata;
- bounded encoding/projection/aggregation that is output-specific and read-only;
- output slot/generation/sequence, publication, borrow and release lifecycles;
- observation cadence/request/drop/coalescing/retention semantics;
- output-specific capacity contributions, pressure and failure;
- consumer-facing serialization/schema compatibility and bounded diagnostics projection; and
- output-owned reroot/session reuse/reset/invalidate; advance changes authority provenance without invoking output-state reclassification, so prior root-relative publications become non-current by their existing provenance.

### 3.2 Explicit non-ownership

The output contract does not own:

- domain state/action/history/role/transition/outcome meaning;
- policy selection, statistics, value/perspective, backup, stopping facts, order/ranking or search-quality meaning;
- evaluator execution or internal evaluator-result readiness;
- graph structure/reference/storage/reclamation;
- resource partition/watermarks, device work scheduling/fairness/deadlock or Search Session root/attention authority;
- product payload semantics such as chess legal moves, MultiPV, best move, WDL or principal variation;
- generic allocation, atomic/fence, transfer, mailbox, stream/event, operation, context or teardown mechanisms, which belong to CUDA-JS; or
- host UI, networking, file persistence, analytics or consumer policy.

Output may encode/project ready facts but cannot manufacture missing search facts. A selected policy/product owns ranking order and ties; output owns bounded immutable representation/publication of that ranking when selected.

### 3.3 Public semantic ports and injected dependencies

The universal output ports are:

1. `initializeOutputProfile` — initialize admitted terminal and selected observation slots/state;
2. `classifyTerminalResult` — derive the mandatory completion envelope from ready stop/resource/completed-work facts;
3. `captureTerminalPayload` — capture selected terminal fields after the terminal cut;
4. `admitObservationRequest` — validate and reserve a bounded optional live capture request;
5. `captureObservation` / `resumeObservation` — read/project ready facts under the selected consistency class without search mutation;
6. `publishOutput` and `failOutput` — terminate one slot incarnation exactly once;
7. `acquireOutput` / `releaseOutput` — provide and release one immutable bounded consumer borrow; and
8. `classifyOutputReuse` — retain/reset/invalidate output-owned sequences/slots for reroot/session reconciliation. Advance never invokes this port; publication freshness/currentness follows existing root-incarnation/epoch/advance provenance.

These are semantic ports, not mandatory functions, stages, kernels, callbacks or ABI symbols. Search Composer may fuse/specialize/eliminate them while preserving meaning and ownership.

Injected dependencies are read-only acquired public facts from domain, policy, evaluator, graph, resource, progress and session owners plus namespaced product-output schemas. Output code cannot mutate source-owner state, allocate outside the plan, dereference raw host/CUDA pointers, call a host callback or use CUDA-JS-private mechanisms.

### 3.4 Equivalence class, deletion tests and total-system simplicity

Permitted profiles include envelope-only, domain-outcome, policy summary, proof/certificate, ranked candidates, sequence/frontier, custom product payload and selected combinations. Live profiles may publish periodic, request-driven, event-triggered, latest-only, ring-retained or terminal-only views with declared bounded semantics.

Deleting chess, ranking, an evaluator, scalar value, live observation, optional extensions, root advance or one physical scheduler leaves the applicable output boundary coherent. Deleting live observation removes every observation request/slot/sequence/borrow/resource/code/diagnostic/synchronization field while retaining terminal completion. Deleting a product payload removes its fields/adapters/resources without widening the universal envelope.

Splitting payload validity from publication would create competing external truth authorities. Merging source meaning, session control or CUDA transfer mechanisms into output would couple independent lifecycles. This output brick is the simplest sufficient owner.

## 4. Terms and semantic model

### 4.1 Output profile and field binding

An **output profile** is the immutable normalized selection of terminal envelope, terminal/live schemas, source bindings, consistency, publication/borrow, resources, failures and reuse for one engine identity.

A **field binding** maps one output field to completely published source facts plus a finite pure projection/aggregation and exact absence/failure/validity behavior. Source ownership remains unchanged.

### 4.2 Terminal result

A **terminal result** is the one immutable authoritative external publication for a completed search incarnation. Its envelope states completion class, first authoritative stop cause, completed-work accounting, resource/budget status and bounded diagnostics identity as required by accepted SPEC-0001. Its selected semantic payload may be empty.

### 4.3 Live observation

A **live observation** is an optional immutable bounded read-only snapshot of selected already-ready facts while a search/session may remain active. It is not a domain observation role, an evaluator request/result, a policy input or a search-progress command.

### 4.4 Capture cut and consistency

A **capture cut** is the declared source-version/epoch boundary represented by one payload. Profiles select `terminal-quiescent`, `atomic-cut`, `versioned-cut`, `independently-versioned` or a namespaced stronger exact consistency class. No profile may claim stronger cross-field consistency than its protocol proves.

### 4.5 Slot, sequence and borrow

An **output slot** is finite output-owned storage with stale-safe incarnation and publication state. A **sequence** orders publications within one profile/session scope without implying search order. A **borrow** is a bounded consumer right to immutable ready bytes/fields that protects the slot from reuse until release/expiry under the profile.

### 4.6 Valid partial result

A **valid partial result** is terminal output formed only from completely published facts permitted by the selected policy/output schema after a non-complete stop. It reports why work stopped and what is absent; it is not a fabricated complete result.

## 5. Output-profile and schema normalization

OUTPUT-PROFILE-001. The profile declares, with no unknown fields:

- stable profile ID/version and compatible domain/policy/evaluator/graph/resource/session identities;
- mandatory terminal envelope and selected terminal/live schema IDs/versions;
- every field owner/source/readiness, encoding, bounds, perspective/units and absence/failure behavior;
- capture triggers, consistency/cut, root/work/session validity and sequencing;
- slot/ring/borrow capacities, retention, overwrite/drop/coalescing and pressure;
- finite capture/projection work, continuation, scratch and publication visibility;
- cancellation/stop/failure/diagnostics/cleanup;
- consumer serialization/trust/provenance policy; and
- reroot/session reuse/reset/invalidate dispositions plus root/advance provenance sufficient to classify publication freshness without retained-state reclassification.

OUTPUT-PROFILE-002. Unknown/duplicate/overlapping fields, ambiguous source owner/perspective/unit, unready source binding, insufficient range, unbounded payload/capture/borrow, undeclared consistency/drop policy, missing terminal capacity, invalid fallback or arithmetic overflow rejects specialization before ignition.

OUTPUT-PROFILE-003. Meaning-insensitive field/profile collections normalize canonically; semantic field order, ranking order, sequence order and projection order are preserved. Every meaning-affecting option contributes to output identity.

OUTPUT-PROFILE-004. Every capture/projection has a finite read/write/work/cancellation bound or finite resumable protocol with exact continuation, protected sources, resources, progress and no partial ready payload.

OUTPUT-PROFILE-005. Host schema/config validation may use ordinary Node.js. Device-side capture/encoding/publication uses restricted Device-JS/Search Program inputs through public CUDA-JS contracts. CUDA-MCGS may not use C/C++, CUDA C++, native addons/FFI, hand-written PTX, embedded CUDA source, a native subprocess or CUDA-JS-private APIs.

OUTPUT-PROFILE-006. A naturally generic GPU publication/read/transfer need that is awkward, unsafe or lifecycle-incomplete through public CUDA-JS stops for consumer-neutral CUDA-JS capability classification with owner, resources, synchronization, lifecycle, cleanup and qualification. CUDA-MCGS does not distort output semantics or add native code.

OUTPUT-SCHEMA-001. Every field declares name/ID, semantic owner, source contract/version/port, type/shape/length, unit/perspective, precision/encoding, validity, required/optional class and compatibility behavior.

OUTPUT-SCHEMA-002. Variable payloads declare maximum bytes/elements/depth, exact used length and bounded overflow behavior: truncate only with explicitly valid semantics/metadata, omit, retry with already admitted larger slot, publish valid partial, or fail. Silent truncation is prohibited.

OUTPUT-SCHEMA-003. Optional/unavailable/failed/stale fields use explicit presence and cause metadata. Missing evaluator/ranking/domain payload cannot masquerade as numeric zero, empty best action or successful proof.

OUTPUT-SCHEMA-004. Product/extension fields are namespaced/versioned and bind their owning semantic contract. Their presence does not promote product payload meaning into universal core.

OUTPUT-SCHEMA-005. Output projection may copy, canonicalize, filter or compute a bounded read-only derived value whose exact formula is owned by the output/product profile. It cannot expand graph, generate actions, run evaluator work, apply backup, change stop facts or mutate a source.

OUTPUT-SCHEMA-006. Ranking fields exist only when a selected policy/product declares candidates, order/equivalence/ties, perspective and validity. Universal output does not choose best/top-k/MultiPV or require actions.

OUTPUT-SCHEMA-007. Consumer serialization declares byte order, alignment-independent logical encoding, version, checksums/integrity when needed and canonical handling of invalid/nonfinite/custom values. Device internal layout is not automatically the external format.

## 6. Mandatory terminal result

OUTPUT-TERMINAL-001. One terminal slot or equivalent guaranteed capacity is admitted before ignition and cannot be consumed by live observations. If the selected maximum terminal payload cannot be reserved, engine/session admission fails before active search.

OUTPUT-TERMINAL-002. Terminal capture begins only after stop reaches the declared terminal cut and every result-visible source is ready, terminally absent or failed with a valid output disposition. It cannot race must-drain backup/evaluator/publication work.

OUTPUT-TERMINAL-003. The envelope reports exact search/session/profile/incarnation, completion class, first authoritative stop cause, completed-work count/units, policy-budget satisfaction, applicable resource ledger/high-water/exhaustion and bounded diagnostic status.

OUTPUT-TERMINAL-004. Completion classes at minimum distinguish `complete`, `valid-partial`, `no-valid-result` and `failed`; cancellation/restart-required or namespaced classes may refine them without conflating cause with validity.

OUTPUT-TERMINAL-005. A `complete` result satisfies every selected completion obligation. A `valid-partial` result contains only ready facts allowed by the profile. `no-valid-result` publishes an envelope and cause but no semantic payload represented as valid.

OUTPUT-TERMINAL-006. Claimed, queued, initializing, partially applied, failed, abandoned, cancelled or stale domain/graph/evaluator/policy data cannot influence a valid terminal payload or completed-work count.

OUTPUT-TERMINAL-007. The first authoritative stop cause is immutable. Later drain failures/resource facts are reported in separate bounded disposition fields and cannot overwrite history.

OUTPUT-TERMINAL-008. Terminal payload publication is exactly once per search incarnation. Retry/resume validates slot/field completion and cannot duplicate aggregation, change completion class or expose a partial prefix as ready.

OUTPUT-TERMINAL-009. Terminal result remains immutable and borrowable until its declared release/retention disposition. Search teardown cannot free backing state while an authorized borrow/transfer still depends on it.

OUTPUT-TERMINAL-010. A one-shot engine may have only the terminal envelope/payload and post-completion asynchronous read. This does not require a long-lived Search Session or live sideband capability.

## 7. Optional live observation

OUTPUT-OBS-001. Live observation is optional. Absence is represented by schema/profile omission and exact zero observation-owned generated/runtime residue, not a disabled slot or dormant polling branch.

OUTPUT-OBS-002. Observation request/cadence may be periodic device-side, bounded externally requested, event-triggered by already-ready facts or another declared mode. It cannot be required to advance internal selection, expansion, evaluation, backup, stopping or scheduling.

OUTPUT-OBS-003. Requesting, capturing, publishing, reading, dropping or releasing an observation is read-only with respect to search-semantic source state. Output-owned slot/sequence/accounting mutation is permitted only for publication lifecycle.

OUTPUT-OBS-004. A capture consumes only already-ready facts. Missing facts yield explicit unavailable/omitted/pending-for-future-capture status; capture does not materialize them or wait unboundedly for them.

OUTPUT-OBS-005. Observation cadence and consumer speed cannot change domain/policy/evaluator/graph semantics, stop causes or resource admission. Schedule/performance effects are bounded within the selected progress/determinism profile and observation resources are preplanned/separated.

OUTPUT-OBS-006. A bounded external request carries session/root/work/profile identity and requested schema/projection. Invalid/stale/unauthorized/over-capacity requests fail before output/source mutation and do not become a host read-decide-write search loop.

OUTPUT-OBS-007. Each observation reports freshness: capture sequence, session/root/work epoch, source versions/counters, consistency class and fields omitted/failed/stale. Wall-clock timestamps are optional and never substitute for semantic versions.

OUTPUT-OBS-008. Observation pressure selects exact `drop-new`, `drop-oldest-unborrowed`, `latest-coalesce`, `reject`, bounded queued request or namespaced behavior. It cannot overwrite a borrowed slot, block active search indefinitely or consume terminal-result reserve.

OUTPUT-OBS-009. Dropped/coalesced observations update bounded output accounting and, when exposed, exact lost sequence/range metadata. Loss does not imply loss of search work or evaluator/policy facts.

OUTPUT-OBS-010. A live observation is not authoritative terminal completion even if it appears complete. Only the terminal-result publication owns final completion class and first stop cause.

OUTPUT-OBS-011. An external request may select only a pre-normalized observation profile and its declared bounded projection/options. It cannot introduce a runtime schema, arbitrary field path, callback, device code or late semantic binding after ignition.

## 8. Snapshot consistency and source validity

OUTPUT-SNAPSHOT-001. `terminal-quiescent` capture reads the declared final cut after all result-visible must-drain transitions. No live profile may claim terminal-quiescent consistency while search can still mutate a selected source.

OUTPUT-SNAPSHOT-002. `atomic-cut` requires one proven commit/version protocol covering every selected source field. Co-located memory, one kernel or close timestamps are not proof of one atomic semantic cut.

OUTPUT-SNAPSHOT-003. `versioned-cut` captures only fields whose declared versions satisfy a profile relation and validates those versions before ready publication. A changed source triggers bounded retry, omission, later capture or failure as declared.

OUTPUT-SNAPSHOT-004. `independently-versioned` permits fields from different valid cuts and publishes each field's exact version/epoch/freshness. It cannot be presented as one simultaneous graph/policy state.

OUTPUT-SNAPSHOT-005. Root-relative fields validate captured root epoch and target owner generation at capture and publication. Old-epoch payload cannot publish into a new-epoch slot without an explicitly root-independent schema.

OUTPUT-SNAPSHOT-006. Source references/borrows remain protected through every read and retry. Graph/evaluator/policy reclamation/reset waits for release or causes capture to fail before publication; output cannot read reclaimed/reused storage.

OUTPUT-SNAPSHOT-007. Read-only aggregation over multiple sources declares ordering, arithmetic/precision, overflow, duplicate handling and schedule/equivalence class. Hidden traversal/address order cannot define a deterministic profile.

OUTPUT-SNAPSHOT-008. If a principal sequence/path/frontier is selected, every referenced occurrence/edge/node/action is generation-valid and the bounded traversal reports truncation/cycle/stale/unavailable explicitly. Output cannot create missing links.

## 9. Publication, borrowing and asynchronous host delivery

OUTPUT-PUB-001. Slot lifecycle is `vacant → reserved → capturing → publishing → ready → released/retired → reusable` or an equivalent complete protocol, with failed/cancelled paths and stale-safe incarnation.

OUTPUT-PUB-002. Producer fully initializes payload, envelope, used lengths, checksums/version metadata and borrow identity before release-publishing `ready`; consumers acquire exact readiness before reading.

OUTPUT-PUB-003. At most one terminal publication is authoritative per slot incarnation. Conflicting ready/failure/cancel outcomes quarantine the slot and downstream evidence rather than silently selecting one.

OUTPUT-PUB-004. Ready payload is immutable. A newer observation uses another slot/incarnation or waits for exact release; in-place mutation under a reader is prohibited.

OUTPUT-PUB-005. Borrow acquisition validates slot/profile/schema/incarnation and increments/reserves bounded protection atomically. Failed acquisition changes no borrow count; release/expiry is exactly once and cannot free a slot still borrowed by another consumer.

OUTPUT-PUB-006. Host delivery is an asynchronous bounded read/transfer after ready publication through a selected public CUDA-JS contract. The host receives typed bytes/values and validity metadata, never raw device pointers or authority to mutate search state.

OUTPUT-PUB-007. Host read completion/failure affects only transfer/borrow lifecycle. It does not acknowledge search work, make the next observation ready, trigger evaluation or decide the next device action.

OUTPUT-PUB-008. Waiters observe ready/failed/cancelled/stale/stop and have bounded completion. A producer/consumer termination cannot leave an unbounded device or host waiter.

OUTPUT-PUB-009. Physical realization may use scoped atomic observation, publication mailbox, asynchronous transfer, shared memory or another qualified public CUDA-JS mechanism. This contract selects no atomic, fence, stream, event, kernel or operation topology.

OUTPUT-PUB-010. If the selected live profile requires a CUDA-JS capability without exact compatible lifecycle/qualification, only that profile remains blocked. Terminal-only and other naturally expressible profiles remain independently assessable.

OUTPUT-PUB-011. Borrow expiry is not permission to reuse a slot while a consumer read/transfer may still access it. Reuse requires owning-system proof that every operation is quiescent/terminated and cannot touch the bytes; otherwise the exact slot remains protected or quarantined under a finite teardown disposition.

## 10. Resource, pressure and failure behavior

OUTPUT-RESOURCE-001. Output contributes finite units/formulas/maxima for terminal slots/payload, observation requests/slots/rings, per-field buffers, snapshot borrows/source protections, continuations, scratch, sequences, diagnostics and concurrent host transfers/borrows.

OUTPUT-RESOURCE-002. The finite-resource contract owns composed partition/watermark/admission/pressure policy; CUDA-JS owns allocation/operation realization. Output cannot allocate hidden overflow, host spill or emergency result storage.

OUTPUT-RESOURCE-003. Terminal reserve is protected from observation/product/diagnostic consumption. Optional payload pressure may yield valid envelope-only/no-valid-result behavior only when the normalized profile and accepted completion rules permit it.

OUTPUT-RESOURCE-004. Observation capacity exhaustion is output pressure, not search-resource exhaustion by implication. It follows the selected drop/coalesce/reject rule and cannot silently stop/fail search.

OUTPUT-RESOURCE-005. Counters distinguish requested, admitted, capturing, publishing, ready, borrowed, dropped/coalesced, failed, released and high-water observations. One `output count` cannot conflate them.

OUTPUT-RESOURCE-006. Sequence/slot/borrow/counter generations never wrap. Before aliasing, the profile requires new incarnation, restart or typed terminal failure.

OUTPUT-RESOURCE-007. Applicable statuses include `invalid-output-profile`, `unsupported-output-schema`, `output-source-unavailable`, `output-source-stale`, `output-capacity`, `output-terminal-capacity`, `output-capture-inconsistent`, `output-payload-invalid`, `output-slot-stale`, `output-borrow-capacity`, `output-observation-dropped`, `output-generation-exhausted`, `output-cancelled` and `output-internal-failure`. Normal/pending/drop/pressure/valid-partial/fatal meanings are explicit.

OUTPUT-RESOURCE-008. Failure remains owner-attributable. Output preserves source/resource/session/CUDA-JS failure identity and source owners do not reinterpret output pressure/transfer failure as search semantics.

## 11. Lifecycle, cancellation, root changes and teardown

OUTPUT-LIFE-001. Output lifecycle is `profile-normalized → resources-admitted → initialized → active/terminal-capture → draining → terminal → released`, with typed failure/quarantine. Terminal-only profiles eliminate active observation state.

OUTPUT-LIFE-002. Terminal capture admitted before stop is must-complete once source terminal cut is available unless the engine enters a fatal no-result state. Cancellation cannot abandon a partially published terminal slot and then claim successful completion.

OUTPUT-LIFE-003. Observation cancellation before ready prevents publication and releases source/slot resources. After ready it cannot mutate payload; it cancels pending delivery/borrow as declared.

OUTPUT-LIFE-004. Every output-owned slot/sequence/borrow/request class declares root/session disposition: retain, retain-if-key-valid, reset, retire or invalidate. A root commit cannot relabel an old-root payload as current.

OUTPUT-LIFE-005. Search Session coordinates external request/root epoch/consumer borrow lifetime; output owns capture/publication meaning; graph/source owners protect state; CUDA-JS owns transfer/operation lifecycle.

OUTPUT-LIFE-006. Teardown stops observation admission, resolves capture/publication, preserves terminal result until allowed release, cancels/finishes transfers, releases borrows/source protections/slots and only then releases CUDA-JS resources through public contracts.

OUTPUT-LIFE-007. Consumer abandonment, disconnect or slow reads follow bounded expiry/cancellation/retention policy. They cannot pin device memory indefinitely or prevent terminal search teardown without explicit finite authority.

OUTPUT-LIFE-008. This contract imposes no universal payload size, field count, ranked count, sequence length, observation cadence, ring depth, borrow count, numeric width or first-product/first-GPU limit. Each profile selects sufficient finite ranges or rejects specialization.

## 12. Security, trust, persistence and cleanup

OUTPUT-SEC-001. Output/profile/product schemas, external observation requests, persisted payloads and consumer configuration are untrusted until strict schema/version/range/permission/digest/resource validation passes.

OUTPUT-SEC-002. Field projections receive least-authority read-only bounded views. Raw pointers, CUDA handles/symbols, credentials, arbitrary host objects/callbacks, filesystem/network authority and private provider paths/types are prohibited payload inputs/outputs.

OUTPUT-SEC-003. Observation permissions constrain profile/schema/field/root/session scope, cadence/request capacity and retention. A consumer cannot request arbitrary graph/model memory merely by naming a field.

OUTPUT-SEC-004. Sensitive/proprietary domain/model/policy facts are omitted/redacted by default unless an owning product profile explicitly authorizes bounded publication. Diagnostics never dump arbitrary device memory.

OUTPUT-SEC-005. Malformed lengths/indices, stale refs, overflow, invalid/nonfinite values, schema/digest mismatch and inconsistent cut fail closed before ready publication or host transfer.

OUTPUT-SEC-006. Persisting/exporting output is optional. A selected durable encoding defines namespace/version, integrity, provenance, migration/rollback, partial-write recovery, retention and secure deletion. A ready in-memory slot is not automatically a durable record.

OUTPUT-CLEANUP-001. Every request, slot, payload, sequence, source protection, continuation, borrow, transfer, diagnostic and retained/exported artifact receives release/retain/retire/invalidate/quarantine disposition.

OUTPUT-CLEANUP-002. Partial ready publication, conflicting terminal result, stale-source read, borrow mismatch or uncertain completion class quarantines affected output and downstream evidence. Recovery cannot edit a published immutable payload in place.

OUTPUT-CLEANUP-003. Removing a live/product output profile removes solely owned schema/code/slots/resources/artifacts unless retention has explicit evidence/recovery purpose and disposal trigger.

## 13. Compatibility, generated identity and Search IR

OUTPUT-COMPAT-001. Output compatibility requires compatible profile/schema, every source owner/version/field meaning, consistency/cut, root/session identity, encoding, publication/borrow, pressure/drop and reuse semantics. Matching byte layout alone is insufficient.

OUTPUT-COMPAT-002. Search Composer/package/cache identity binds normalized output schemas/bindings, capture/consistency, bounds, resources, publication/borrow/drop/reuse and restricted Device-JS inputs. CUDA-JS native transfer/mailbox/ABI identity remains opaque and separately bound.

OUTPUT-COMPAT-003. Changing source meaning, field schema/perspective, completion classification, snapshot consistency, ranking/order, encoding, capacity/drop/retention, permission or reuse invalidates affected Search IR/packages, product consumers, persisted outputs and reference/native approvals.

OUTPUT-COMPAT-004. Migration of persisted payload/consumer schemas requires explicit transform, semantic equivalence or declared loss, atomic commit/rollback and post-migration oracle. Version-number similarity is not proof.

OUTPUT-IR-001. Complete Search IR represents terminal envelope/profile, selected terminal/live schemas, field source bindings, bounds/encoding, consistency/cuts, request/slot/sequence/borrow lifecycles, finite resources, pressure/drop/failure/cancellation and root/session reuse.

OUTPUT-IR-002. Search IR names semantic owners/ports/readiness without exposing a UI/protocol, current JavaScript module, private provider type, raw pointer, CUDA symbol/atomic/stream/event, mailbox layout, scheduler or host callback.

OUTPUT-IR-003. Normalization rejects unknown/duplicate owners, ambiguous field source/unit/perspective, mandatory ranking, incomplete terminal envelope, insufficient terminal capacity, unbounded capture/borrow, false consistency, undeclared drop/failure/permission and missing cleanup.

OUTPUT-IR-004. Source owners expose only declared ready public facts; output consumes read-only views; resource/progress/session consume contributions/transitions. No source deep import, output-driven search mutation or reverse ownership is allowed.

OUTPUT-IR-005. Removing evaluator, ranking, live observation, product or capability removes its output adapters/fields/code/slots/resources while the mandatory universal terminal envelope remains complete.

OUTPUT-IR-006. A terminal-only normalized image/package contains no live request/capture/ring/sequence/borrow/drop/coalescing/sideband field, branch, resource or synchronization dependency. Deletion is byte/code/layout/resource inspected, not inferred from a flag.

## 14. Conformance and authoritative oracles

The deterministic CUDA-free reference is authoritative for normalized envelope, capture, consistency, publication, pressure and reuse semantics under a declared schedule. Native evidence later proves actual Device-JS capture/publication, memory visibility, asynchronous read/transfer and teardown for one exact CUDA-JS pair. UI display or a plausible best action cannot replace semantic oracles.

Later `ENGINE-IR-COMPOSER-01` and `ENGINE-REFERENCE-01` must consolidate at least:

| Case ID | Required falsifier |
|---|---|
| `output-profile-strict-normalization` | Ambiguous source/schema/consistency/pressure/reuse is accepted. |
| `output-envelope-only-terminal` | Completion requires ranking/evaluator/domain payload. |
| `output-complete-vs-valid-partial` | Unready/failed work appears in valid payload or partial claims complete. |
| `output-first-stop-cause` | Later drain/failure overwrites the authoritative cause. |
| `output-no-valid-result-envelope` | Failure fabricates semantic payload or omits required cause/accounting. |
| `output-terminal-reserve-isolation` | Live pressure consumes terminal capacity. |
| `output-no-ranked-action` | Universal schema requires best/top-k/actions. |
| `output-ranked-product-binding` | Output invents ranking/ties/perspective rather than consuming owner meaning. |
| `output-evaluator-absent` | Missing evaluator becomes zero/default or leaves adapter residue. |
| `output-live-absent-zero-residue` | Terminal-only image retains live sideband state/code/resources. |
| `output-observation-read-only` | Capture/request/read expands/evaluates/backs up/stops search. |
| `output-observation-cadence-invariance` | Cadence changes source semantics/admission/stop rather than output loss/performance only. |
| `output-unavailable-source-no-materialize` | Capture creates or waits unboundedly for missing facts. |
| `output-independently-versioned-honesty` | Mixed-cut fields are represented as simultaneous. |
| `output-versioned-cut-retry` | Changed source versions publish an invalid snapshot. |
| `output-stale-root-publication` | Old-root capture publishes as current. |
| `output-protected-source-lifetime` | Source reclaimed/reset during capture. |
| `output-bounded-sequence-cycle` | Path/frontier capture loops or hides truncation/stale reference. |
| `output-ready-immutability` | Reader sees partial/mutating payload after ready. |
| `output-borrow-reuse-race` | Slot is reused while borrowed or release double-frees. |
| `output-drop-coalesce-accounting` | Lost observations are silent or corrupt search accounting. |
| `output-host-read-no-progression` | Read completion/ack is required for next search step. |
| `output-generation-exhaustion` | Sequence/slot generation wraps into stale alias. |
| `output-product-capability-deletion` | Removing chess/ranking/capability leaves solely owned residue. |
| `output-oracle-sensitivity-publication` | Removing readiness/incarnation/consistency checks does not fail oracle. |

The minimum fixture set includes:

1. envelope-only evaluator-absent policy completion with no ranked action;
2. complete and valid-partial structured/vector/proof payloads;
3. a namespaced ranked product payload whose ranking meaning remains downstream;
4. terminal-only and live latest-coalesced/ring profiles;
5. independently-versioned and stronger versioned-cut captures under concurrent source change;
6. observation pressure, slow/abandoned consumer, stale root and slot/borrow reuse;
7. bounded path/sequence capture with transposition/cycle/truncation; and
8. one-shot asynchronous post-completion read plus optional live read through a simulated mechanism-neutral port.

Native qualification additionally tests actual restricted Device-JS capture, publication/acquire, concurrent slot/borrow protection, asynchronous CUDA-JS read/transfer, cancellation/root/stop races, resource conservation, teardown and exact optional-profile capability availability. Performance comparisons freeze source profiles, payload/cadence/consistency/retention, workload and CUDA-JS pair and separate observation overhead from search semantics.

## 15. Examples and rationale (informative)

A proof search may publish only completion, proof status and resource exhaustion. An optimization search may publish a bounded vector frontier. A planning product may publish one sequence with explicit truncation. Chess may publish ranked legal moves under a chess-owned schema. A live monitor may request an independently versioned summary and receive `source-unavailable` fields without causing expansion or evaluation.

These examples do not select a best-action schema, scalar score, evaluator, observation cadence, consistency strength, ring size, transport, scheduler or product behavior.

## 16. Acceptance blockers and downstream invalidation

This proposal is decision-complete only when review finds no unresolved envelope, field-owner/source, schema, completion/partial-result, consistency, publication/borrow, observation, pressure, root/reuse, range, lifecycle, compatibility, security or cleanup ambiguity.

Acceptance remains blocked until:

1. normalized Search IR/schema represents every OUTPUT-IR obligation and rejects semantic ambiguity;
2. the deterministic reference executes all required fixtures/cases and publication/consistency oracle-sensitivity mutation;
3. resource, progress and Search Session proposals reconcile capacity, capture readiness, asynchronous observation, root epochs and teardown without duplicate authority/cycles;
4. live-observation/ranking/evaluator/product deletion checks pass;
5. each selected native observation profile is classified against public CUDA-JS capabilities without an in-repository native workaround, while terminal-only profiles remain independently assessable;
6. the integrated semantic packet is reviewed on one exact revision at `ENGINE-CONTRACT-ACCEPTANCE-01`; and
7. required documentation/governance validation passes.

Production output lowering remains prohibited until that acceptance. Native Device-JS/publication/transfer/concurrency/performance evidence qualifies selected profiles later unless required to decide semantic meaning.

A change to output ownership, envelope/completion class, field binding/schema/perspective, consistency/cut, publication/borrow, observation trigger/cadence, pressure/drop, root/reuse, permission or encoding invalidates affected resource/progress/session contracts, Search IR/schema/normalizers, product consumers, generated packages, persisted payloads and reference/native approvals. The ENGINE-CONTRACT-01 integration spine records and reconciles invalidation before dependents continue.

Implementation, test, review, persistence, security, generated/JIT/ABI, performance and cleanup work triggers the specialist doctrine routed from root `AGENTS.md` and `agent_files/AGENTS.md`.
