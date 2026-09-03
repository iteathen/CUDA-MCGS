# SPEC-0006: Search Session Root, Advance, Reroot, Attention, and Observation

**Status:** Accepted

**Version:** 0.2.0

**Accepted:** 2026-09-03 under #122 ENGINE-CONTRACT-ACCEPTANCE-01.

**Owner:** CUDA-MCGS optional Search Session external lifecycle semantics

**Consumers:** framework contract; Search IR; Search Composer; CUDA-MCGS-to-CUDA-JS package; reference/native conformance; domain/search products

This specification defines the optional universal external-lifecycle brick for a long-lived Search Session. It distinguishes four different authority/control operations: initial `root`, minimum-work `advance` to an already-ready realized successor, general `reroot`, and non-structural `attention`. It also coordinates finite command identity, stale-work generations, cancellation/completion, and bounded observation request/borrow while device-owned search continues. It does not define source-owner search semantics, an observation payload, ranked moves, chess, a scheduler, or one sideband mechanism.

## 1. Authority, applicability, and normative references

Specification identity is `CUDA-MCGS-SPEC-0006@0.2.0`.

A concrete engine selects either `session-absent` or one normalized Search Session profile. `session-absent` retains the ordinary one-shot engine/search/terminal-result lifecycle owned by the framework/output contracts and contributes exact zero live-session command, advance, reroot, attention, observation-request, session-generation, sideband, or retained-session state.

- [`../decisions/ADR-0022-distinguish-root-advance-reroot-and-attention.md`](../decisions/ADR-0022-distinguish-root-advance-reroot-and-attention.md) is the governing authority for root, advance, reroot, and attention boundaries.
- [`../decisions/ADR-0018-universal-core-extension-product-layering.md`](../decisions/ADR-0018-universal-core-extension-product-layering.md) owns universal-core / extension-substrate / product separation.
- [`../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) owns the pure Node/Device-JS production boundary, narrow asynchronous host exceptions, and missing CUDA-JS capability escalation.
- [`../decisions/ADR-0002-universal-contracts-specialized-engines.md`](../decisions/ADR-0002-universal-contracts-specialized-engines.md), [`../decisions/ADR-0003-device-resident-active-search.md`](../decisions/ADR-0003-device-resident-active-search.md), and [`../decisions/ADR-0005-lego-design-hierarchy.md`](../decisions/ADR-0005-lego-design-hierarchy.md) own finite specialization, device closure, and LEGO ownership.
- [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) owns publication, graph incarnation, finite-resource, and stop foundations.
- [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) owns accepted foundational Search IR representation/reference semantics within its scope.
- [`SPEC-0007`](SPEC-0007-domain-state-action-and-transition.md), [`SPEC-0008`](SPEC-0008-search-policy-and-backup.md), [`SPEC-0009`](SPEC-0009-evaluator-contract.md), [`SPEC-0010`](SPEC-0010-graph-storage-and-reclamation.md), [`SPEC-0011`](SPEC-0011-finite-search-resources.md), [`SPEC-0012`](SPEC-0012-device-owned-search-progress.md), and [`SPEC-0013`](SPEC-0013-result-and-observation-publication.md) own/propose adjacent domain, policy, evaluator, graph, resource, progress, and output meaning.

Accepted authority governs conflicts. This specification does not authorize production implementation.

## 2. Scope and non-goals

This specification owns only the external Search Session lifecycle boundary:

- session identity/incarnation and finite command ordering;
- initial root establishment before ignition;
- optional advance publication/adoption to an already-ready realized successor;
- optional general reroot admission/reconciliation;
- optional independently versioned attention publication/application;
- root-relative stale-work generations and owner-declared dispositions;
- bounded observation request/acquire/release coordination against SPEC-0013 publication;
- cancellation, completion, restart, and exact selected-capability deletion.

It does not own domain root validity, graph materialization/reclamation, policy/evaluator reuse meaning, resource partition/pressure policy, device scheduling/fairness, observation payload/snapshot semantics, CUDA allocation/transport, or product concepts. Physical fusion does not transfer those authorities.

## 3. Terms and four-operation model

A **Search Session** is one finite logical lifetime of a composed engine across zero or more authoritative-root changes.

A **root incarnation** is established by initial root or reroot. An **advance version** orders zero or more valid advances within that incarnation. A **root epoch** is a monotonic stale-work generation for the current authoritative root occurrence; it may advance on either advance or reroot without implying that advance performs reroot work. These names are representation choices; the semantic requirement is unambiguous provenance for current incarnation, ordered advance, stale occurrence work, and attention ordering.

**Root** establishes the initial authoritative state/graph occurrence before active search. It may validate/admit/materialize within the pre-ignition resource plan.

**Advance** changes authority only along one declared realized transition from the current root occurrence to an already-ready successor whose required resources were already admitted. It is the minimum-work continuing-search operation.

**Reroot** is the general authoritative-root replacement when advance preconditions do not hold. It may validate an externally supplied state, admit/materialize, classify reuse, reset/transform/invalidate owner state, and coordinate bounded prepare/commit/abort.

**Attention** changes an outside objective, directional weighting, or service allocation without changing root authority or invalidating already-admitted work.

A generic root transaction with a mode flag is non-conforming because it allows reroot-only machinery to survive in the advance path.

### 3.1 Profile requirements

SESSION-PROFILE-001. The normalized profile declares session/command identity, initial-root contract, independently selected advance/reroot/attention contracts, root-incarnation/root-epoch/advance/attention ordering, selected input schemas/permissions/idempotence, observation profiles/borrows, cancellation/completion/teardown, failure/diagnostics, compatibility, finite resources, and zero-residue deletion.

SESSION-PROFILE-002. Unknown/duplicate owners or schemas, ambiguous authority/idempotence/order, advance requiring reroot-only work, missing reroot owner disposition, incomplete reroot admission, nonterminal reroot transaction, root-changing attention, unbounded input/borrow/wait, insufficient generation width, host-progress dependency, or missing cleanup rejects specialization before ignition.

SESSION-PROFILE-003. Meaning-insensitive collections normalize canonically. Initial-root establishment order, advance publication/adoption order, reroot prepare/commit/abort order, and attention generation/application order are explicit where material. Every selected session-affecting input contributes to profile/package identity.

SESSION-PROFILE-004. Host validation/composition may use ordinary Node.js. Post-ignition Session application/capture coordination uses restricted Device-JS/Search Program inputs through public CUDA-JS contracts. CUDA-MCGS may not implement sideband/lifecycle with C/C++, CUDA C++, direct FFI, hand PTX, a native addon/subprocess, or CUDA-JS-private APIs.

SESSION-PROFILE-005. A naturally generic GPU sideband/publication/operation-lifecycle need that cannot be expressed naturally with bounded resources, synchronization, cleanup, and qualification through public CUDA-JS stops for consumer-neutral CUDA-JS capability classification. Session semantics are not distorted and native CUDA-MCGS code is not authorized.

## 4. Device-owned progress boundary

SESSION-001. Accepting external advance/reroot/attention commands or publishing observations MUST NOT make the host responsible for selecting, scheduling, advancing, evaluating, backing up, or otherwise progressing internal active search.

SESSION-002. Search may continue correctly if no consumer reads an observation.

SESSION-003. Observation requests/reads MUST NOT be required to unlock internal search progress.

SESSION-004. Root, advance, and reroot are externally supplied environment/domain authority facts. They do not authorize a host micro-step loop for internal search progression.

SESSION-005. Internal Search Stages and Async Stage Channels remain device-owned mechanisms. External Search Session control/observation ports are a separate boundary and MUST NOT be represented as arbitrary internal extension callbacks.

SESSION-006. A host observation-to-decision-to-attention-write, polling/relaunch, or callback loop MUST NOT be required to advance internal search. An attention change may alter an accepted outside objective or weighting but cannot encode a CPU-selected next internal search step.

SESSION-007. Advance/reroot/attention application and observation publication MUST be independently progress-safe: delayed input, absent input, delayed reads, or absent reads cannot leave internal search waiting for host participation unless selected stop/cancellation has already ended active search.

## 5. Initial root, advance, and reroot semantics

Initial root establishment validates the starting domain state/descriptor and admits required root resources before ignition. Rejected initial root establishment does not ignite search or publish partial authority.

SESSION-ROOT-001. Rejected initial-root, advance, or reroot input leaves the previously accepted search-semantic authority unchanged. Advance or reroot rejection after ignition leaves current root occurrence, root incarnation/epoch, advance ordering, and already-admitted work unchanged.

SESSION-ROOT-002. Read-only validation may perform bounded identity/reference checks and diagnostics. Advance validation may only verify the declared realized transition, ready successor, current authority/generation, and already-admitted resource/reference validity; it cannot materialize, allocate, reconstruct, transform, reset, classify reuse, reclaim, or mutate search state before acceptance.

SESSION-ROOT-003. Initial root and reroot may use atomic/recoverable admission and prepare/commit protocols when establishment requires materialization or owner reconciliation. Advance never uses that compound admission path; needing it makes the request an invalid advance.

SESSION-ROOT-004. Advance is valid only for one declared realized transition from the current authoritative occurrence to an already-ready successor. Publication/adoption cost is bounded independently of retained graph size, pending-work count, and search depth.

SESSION-ROOT-005. Advance changes authority without semantic-state copy/transformation, graph traversal, retained-state reclassification, reset, resource resize, reclamation, or eager cleanup. Compatible work beneath the selected occurrence remains compatible; sibling/superseded occurrence-scoped work is lazily classified `superseded-by-advance` at existing bounded checkpoints.

SESSION-ROOT-006. Advance invalidates/supersedes occurrences and occurrence-scoped work, not a shared graph node merely because that node was reachable through an old occurrence. A transposed node remains usable while another valid occurrence or retained owner reference protects it.

SESSION-ROOT-007. Reroot owns the heavier prepare/reuse/stale/cleanup lifecycle. It may gather domain validity, graph materialization/anchor, policy/evaluator/output reuse plans, resource compound lease, and progress stale-work plan before one authority commit. Root-independent owners are statically omitted; work proportional to retained state remains lazy/budgeted owner maintenance rather than hidden synchronous reroot cleanup.

SESSION-ROOT-008. Concurrent advance, reroot, attention, cancellation, and completion commands have declared ordering and typed conflict outcomes. Advance is never silently upgraded into reroot. No command order may create two authoritative roots or a universal global multi-GPU barrier.

SESSION-ROOT-009. Reroot preparation is non-authoritative until commit. Abort releases/restores each prepared contribution exactly once. A post-commit partial failure is fatal/quarantined rather than falsely reported as rejection with old authority restored.

### 5.1 External attention admission and application

SESSION-CONTROL-001. Each selected attention schema names its semantic owner, authority, bounded representation, valid session incarnation, independent generation, idempotence, and exact directional effect. Session coordinates publication but does not reinterpret product/policy meaning.

SESSION-CONTROL-002. Attention passes schema/authority/session/generation/conflict and pre-admitted command/publication capacity before publication. It consumes neither advance authority nor reroot compound admission. Rejection leaves semantic owner state unchanged.

SESSION-CONTROL-003. Attention has independently ordered generation/publication relative to root authority changes, cancellation, and completion. Already-admitted work stays valid unless another selected owner contract independently invalidates it for a reason other than attention itself.

SESSION-CONTROL-004. Attention publication/application cost is bounded independently of retained search state; no steady-state host polling, callback, relaunch, observation response, or universal global multi-device barrier is required.

SESSION-CONTROL-005. Attention cannot name an internal next work item, change root identity/incarnation/epoch, authorize graph mutation, classify reuse, resize resources, or trigger reclamation.

## 6. Finite root/reroot pressure

Initial root and reroot may require reserved admission capacity, bounded retirement/reclamation while old authority remains valid, reuse of already-valid storage, typed rejection while session remains valid, or typed restart-required outcome. The selected profile declares the strategy. Surprise allocation and partial authority mutation followed by rejection are prohibited.

Advance has no allocation/resize pressure path: an advance whose successor/resources are not already ready/admitted is rejected as advance and may be retried only as an explicit reroot if the caller chooses.

## 7. Authority publication and adoption

Initial root and reroot have one authoritative publication point after required validation/admission. Advance has one minimum-work authority publication that identifies the already-ready successor and ordered advance provenance. Each participating device adopts ordered advance/attention at its declared bounded safe point; no universal global barrier is required.

Root epoch remains a stale-work guard for each authoritative occurrence. Root incarnation distinguishes initial/reroot families; advance version orders advances inside an incarnation. New root-relative work is admitted only under current provenance.

## 8. Superseded/stale work and publication

SESSION-EPOCH-001. Root-relative work captures sufficient authority provenance before root-relative effects become possible.

SESSION-EPOCH-002. After advance, sibling-occurrence work becomes `superseded-by-advance` lazily at bounded checkpoints; selected-descendant compatible work remains valid. After reroot, old-provenance work follows its owner-declared stale/reuse disposition. Neither may contaminate current root-relative publication.

SESSION-EPOCH-003. Every superseded/stale reservation terminates with exactly one declared disposition such as applied-before-authority-change, superseded-by-advance, abandoned-stale-root, transformed (reroot only), or another versioned owner outcome.

SESSION-EPOCH-004. Stale/superseded disposition releases or transfers every owned reservation/resource exactly once.

SESSION-EPOCH-005. Schedule nondeterminism may change how much old work completed before authority publication, but conservation, stale isolation, selected-descendant preservation, and current-root correctness remain invariant.

## 9. Reroot reuse classification

Reuse classification belongs to reroot and source owners, not advance. A persistent state family participating in reroot declares retain, retain-if-key-valid, transform, reset, invalidate/retire, or an equivalent namespaced product rule. Advance never invokes these classifications; physical node retention never implies policy/evaluator/root-relative semantic reuse.

## 10. Authority changes and reclamation remain separate

SESSION-RECLAIM-001. Advance performs no reclamation and no full-graph synchronous work. Reroot authority publication also MUST NOT require full-graph synchronous reclamation merely for cleanup unless an explicitly selected bounded owner contract proves that work independent of retained size (normally it cannot).

SESSION-RECLAIM-002. Reclamation respects current root protection, shared/transposed-node reachability, outstanding work, observations/borrows, and other declared references whose lifetime can outlive an authority change.

SESSION-RECLAIM-003. Storage reuse changes generation/incarnation or proves equivalent stale-reference impossibility before a later object can occupy the same reusable identity space.

SESSION-RECLAIM-004. A safe profile may publish new authority, dispose stale/superseded work lazily, then reclaim retired unreachable storage once no protections remain. Other mechanisms may conform with equivalent finite proof.

SESSION-RECLAIM-005. Reclamation failure or insufficient reclaimable capacity produces a typed bounded outcome for operations that need capacity; it cannot be hidden inside advance and cannot trigger unplanned allocation.

## 11. Generic observation publication

Observation is optional and SPEC-0013 owns selected schema, source bindings, snapshot consistency, slots/sequences/borrows, pressure/drop/coalescing, and immutable publication. Session owns only bounded external request authorization, authority-provenance binding, acquisition/release coordination, and teardown ordering.

SESSION-OBS-001. Observation request/capture invokes only the selected SPEC-0013 read-only capture port. It MUST NOT expand/materialize/evaluate/reserve, apply advance/reroot/attention, alter search statistics, or otherwise progress search merely to satisfy a request.

SESSION-OBS-002. Acquisition returns only a completely published immutable snapshot or typed unavailable/stale/pressure outcome.

SESSION-OBS-003. Root-relative observation retains sufficient root-incarnation/epoch/advance provenance to distinguish an older complete snapshot from current authority; Session cannot relabel old data as current.

SESSION-OBS-004. Observation cadence cannot change search semantics. A later outside decision is a separately authorized input under its true owner, never implicit observation acknowledgement or host progress.

SESSION-OBS-005. Session completion/acquisition preserves the distinction between terminal result and live observation. A live acquisition cannot force termination, and a live slot cannot satisfy guaranteed terminal publication.

SESSION-OBS-006. An external observation request selects only a pre-normalized SPEC-0013 profile/projection and cannot introduce runtime schema, field path, callback, or device program.

SESSION-OBS-007. Borrow/read completion affects only observation slot/transfer/session-teardown lifetime; it cannot acknowledge internal work or change root/advance/reroot/attention authority.

SESSION-OBS-008. A slow/abandoned consumer follows finite borrow cancellation/quiescence. Teardown cannot reuse/release backing state until owning systems prove reads/transfers terminal.

## 12. Finite counters and stale-safe exhaustion

Session incarnation, root incarnation, root epoch, advance generation/version, selected attention generation, observation generation, and reclamation generation are finite. Every counter declares range/reserved values, exhaustion threshold, rollover/restart behavior, and stale-alias prevention. Silent wrap is non-conforming.

## 13. Cancellation, health, completion, and restart

SESSION-LIFE-001. Session lifecycle is `profile-normalized → resources-admitted → initialized → active/external-wait → cancelling/draining → terminal → released`, with typed failure/quarantine. `session-absent` specializes away the live-session lifecycle.

SESSION-LIFE-002. Cancellation has one declared ordering point against command admission/authority publication and is idempotent. A command either publishes before cancellation and receives normal stale/drain disposition or terminates without partial authority mutation.

SESSION-LIFE-003. Completion freezes command admission, coordinates active reroot transaction, advance/attention publication closure, progress closure, and SPEC-0013 terminal capture, and publishes terminal Session provenance only after validity-relevant work/borrow state is terminal or quarantined.

SESSION-LIFE-004. Teardown stops inputs/acquisition, aborts prepared reroot, closes advance/attention publications, drains/disposes work, releases owner borrows/protections/resources in dependency order, preserves the terminal result through authorized borrow, then releases opaque CUDA-JS resources.

SESSION-LIFE-005. Session contributes only finite selected resources. Advance contributes bounded command/publication/provenance state but no compound root reserve or reusable-state classification state. Reroot contributes its selected transaction/admission/state-coordination resources. Independently absent advance, reroot, attention, and observations leave exact zero solely owned input/port/status/counter/cleanup/program/resource residue.

SESSION-LIFE-006. Status vocabulary distinguishes invalid initial root, invalid/not-ready/conflicting advance, invalid/pressured/conflicting reroot, accepted authority changes, finite generation exhaustion, attention failures, command capacity/replay/stale, cancellation/restart/terminal, observation outcomes, and fatal internal failure. Generic `root-update` status cannot erase advance/reroot differences.

SESSION-SEC-001. External commands/requests are untrusted until authority/permission, schema/version, size/range, session/root provenance, replay/idempotence, and resource validation pass. Inputs cannot carry raw pointers, CUDA handles, callbacks, arbitrary code, or private owner paths.

SESSION-SEC-002. Diagnostics are bounded and expose operation/generation/owner/cause without arbitrary domain/model/device bytes. Conflicting authority, partial reroot commit, or stale-alias failure quarantines affected evidence rather than fabricating rollback.

SESSION-SEC-003. Persistence is absent unless separately selected. Persistent form can never treat raw device pointers, CUDA handles, in-flight reroot transactions, pending advance/attention publications, or borrowed observations as durable authority.

SESSION-COMPAT-001. Compatibility binds initial-root, advance, reroot, attention, command/provenance ranges, selected owner dispositions, observation, cancellation/completion/teardown, and permissions independently. One generic root-transaction compatibility key is insufficient.

SESSION-COMPAT-002. Search Composer/package identity binds all normalized Session semantics and restricted Device-JS inputs; CUDA-JS mechanism/native identity remains opaque and separately bound.

## 14. Search IR and package requirements

Search IR represents initial root plus independently selected advance, reroot, attention, and observation capabilities. It represents root-incarnation/root-epoch/advance ordering, advance ready-successor/no-reroot-work invariants, reroot affected owners/compound admission, stale/superseded work semantics, finite counters, cancellation/terminal behavior, permissions, cleanup, and exact absence.

SESSION-IR-001. Search IR represents distinct command kinds and ports for advance and reroot; no generic `root-update` command or `rootTransaction` mode flag may stand in for both. Advance contains no reroot-only owner prepare/commit/abort, compound admission, reuse classification, transform/reset, reclamation, or eager-cleanup fields.

SESSION-IR-002. Normalization rejects advance requiring non-ready successor/materialization/allocation/reclassification, reroot missing prepare/abort/stale/reuse disposition, ambiguous operation/cancel order, insufficient generations, graph-affecting attention, unbounded command/borrow, host-progress dependency, hidden resource, or missing teardown.

SESSION-IR-003. Search IR names semantic ports and consumer-neutral mechanism requirements without raw pointers, CUDA symbols/atomics/streams/events/mailbox layout, scheduler topology, host callback, or product payload meaning.

SESSION-IR-004. Deletion is exact: terminal-only `session-absent` contains no live-session residue; and within a selected Session, independently unselected advance, reroot, attention, or live observation contributes no solely owned field, input, port, status, counter, cleanup item, generated branch, resource, or synchronization dependency.

## 15. Conformance requirements

A consolidated Search Session capsule covers at least: initial root acceptance/rejection; advance to an already-ready realized child; advance through a shared transposition occurrence without node invalidation; rejection when successor is absent/unready or reroot-only work is required; no mutation on rejected advance; selected-descendant preservation and lazy sibling supersession; advance cost independent of retained graph; explicit reroot for new/reconstructed state; reroot admission/abort/commit/fatal partial-commit; stale-work conservation; reclamation after protections; finite counter exhaustion; read-only observations; attention authority separation; operation/cancellation races; per-device ordered adoption without universal barrier; and exact independent operation deletion.

CUDA-free evidence owns semantic ordering/invariants. Native evidence later owns actual publication scope, memory ordering, concurrent workers, races, final resource identity, and cleanup.

## 16. Bounded evidence and next native gate

Historical SESSION-001 evidence remains truthful for its exact inputs but predates this four-operation representation. It is provenance, not ADR-0022 conformance. `REF-ROOT-CONTROL-01` must regenerate proposal/schema/reference identities while preserving accepted Search IR 0.1.0 and immutable historical evidence.

A later native SESSION-002-class experiment may exercise actual concurrent GPU workers after semantic acceptance and a selected CUDA-JS sideband profile; optional native live-session qualification is not a prerequisite for the finite terminal engine.

## 17. Acceptance blockers

This specification cannot become accepted until the integrated owner contracts are reconciled, four-operation Session schema/normalization/reference evidence is decision-complete, finite root/reroot pressure and independent operation deletion are proven, device-owned progress and stale/superseded work are proven, and the CUDA-MCGS-to-CUDA-JS package identifies generic mechanisms without importing them into Session meaning.

Production Session lowering remains prohibited until semantic acceptance. Changing root/advance/reroot/attention authority, operation ordering, reroot prepare/commit/abort, stale/reuse coordination, observation, cancellation/completion/teardown, permissions, or compatibility invalidates affected Search IR/normalizers/generated packages/product adapters/reference approvals. Historical artifacts retain their exact original terminology as provenance.


> **#122 acceptance record (2026-09-03):** The semantic/reference conditions in this specification were discharged by the exact #36 CUDA-free packet at `0cd3dafdbfa683048b0a0f39de21a671fd9ef841`, the #193 CUDA-JS ownership-boundary audit, and the atomic #122 acceptance review. Any clause that explicitly requires native compatible-pair, physical memory-ordering/concurrency, performance, platform-support, or downstream product evidence remains a separate deferred qualification gate and is not claimed by semantic acceptance.
