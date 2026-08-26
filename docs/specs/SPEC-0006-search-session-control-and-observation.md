# SPEC-0006: Search Session Root Advance, Attention, and Observation

**Status:** Proposal

**Draft version:** 0.2.0

**Owner:** CUDA-MCGS optional Search Session external lifecycle semantics

**Consumers:** framework contract; Search IR; Search Composer; CUDA-MCGS-to-CUDA-JS package; reference/native conformance; domain/search products

This proposal defines the optional universal external-lifecycle brick for a long-lived Search Session: bounded structural root-update admission and commit, independently versioned directional attention, session/root epochs, stale-work coordination, owner-defined reuse, cancellation/completion and bounded observation request/borrow coordination while device-owned search continues. It deliberately does **not** define source-owner semantics, observation payload publication, ranked moves, chess, a scheduler or one sideband mechanism. A terminal-only engine removes every live-session-owned field, port, resource, branch and synchronization dependency.

## 1. Authority, applicability, and normative references

Specification identity is `CUDA-MCGS-SPEC-0006@0.2.0-draft`.

A concrete engine selects either `session-absent` or one normalized Search Session profile. `session-absent` retains the ordinary one-shot engine/search/terminal-result lifecycle owned by the framework/output contracts but contributes exact zero root-update, live-control, live-observation-request, session-epoch, sideband or retained-session state.

- [`../decisions/ADR-0018-universal-core-extension-product-layering.md`](../decisions/ADR-0018-universal-core-extension-product-layering.md) owns the universal-core / extension-substrate / product separation.
- [`../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) owns the pure Node/Device-JS production boundary, narrow asynchronous host exceptions and missing CUDA-JS capability escalation rule.
- [`../decisions/ADR-0002-universal-contracts-specialized-engines.md`](../decisions/ADR-0002-universal-contracts-specialized-engines.md), [`../decisions/ADR-0003-device-resident-active-search.md`](../decisions/ADR-0003-device-resident-active-search.md) and [`../decisions/ADR-0005-lego-design-hierarchy.md`](../decisions/ADR-0005-lego-design-hierarchy.md) own finite specialization, device closure and LEGO ownership.
- [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) owns publication, graph incarnation, finite-resource and stop foundations.
- [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) owns the accepted foundational Search IR representation and reference semantics within its scope.
- [`SPEC-0007`](SPEC-0007-domain-state-action-and-transition.md), [`SPEC-0008`](SPEC-0008-search-policy-and-backup.md), [`SPEC-0009`](SPEC-0009-evaluator-contract.md), [`SPEC-0010`](SPEC-0010-graph-storage-and-reclamation.md), [`SPEC-0011`](SPEC-0011-finite-search-resources.md), [`SPEC-0012`](SPEC-0012-device-owned-search-progress.md) and [`SPEC-0013`](SPEC-0013-result-and-observation-publication.md) propose the exact domain, policy, evaluator, graph, resource, progress and output owners consumed here.
- [`SPEC-0003`](SPEC-0003-search-stage-and-extension-surface.md) and [`SPEC-0004`](SPEC-0004-async-stage-channels.md) are informative extension-substrate adjacency, not session prerequisites or owner authority.
- CUDA-JS public contracts own generic long-lived-operation, memory/publication, sideband transport, completion, error and teardown mechanisms when such capabilities are accepted.

Accepted authority governs any conflict with this proposal. This proposal neither supersedes another specification nor authorizes production implementation.

## 2. Scope and non-goals

This specification family owns:

- Search Session identity and incarnation;
- current logical search root and root epoch;
- externally supplied root-update admission and commit semantics;
- externally supplied attention-change identity, generation, admission and lazy application semantics when selected;
- coordination of old-epoch work dispositions declared by their owners;
- collection and commit ordering of owner-defined reuse classifications across structural root advance;
- separation of structural root advance, attention and reclamation;
- generation-safe reclamation obligations that are visible at the session boundary;
- bounded external observation request/borrow coordination against SPEC-0013 publication;
- finite root-epoch and observation-generation behavior;
- external control/observation versus internal device-owned progress;
- session-specific pressure, cancellation, terminal and restart behavior.

It does not define:

- a mandatory ranked root-action view;
- a best-action, top-k, multi-PV or chess output schema;
- one policy formula or one reusable-statistics policy;
- one CUDA memory-mapping, queue, stream, kernel or Worker implementation;
- internal Async Stage Channel semantics, which remain SPEC-0004-owned;
- one persistent-kernel topology;
- a production graph-store or reclamation algorithm.
- domain root validity, graph liveness/reclamation, policy/evaluator reuse meaning, resource capacity/pressure policy, device progress/fairness, output payload/snapshot/publication semantics or CUDA-JS allocation/transport/operation lifecycle.

The Search Session owns the external transaction and epoch boundary; each contributing contract owns its own prepare/reuse/stale/cleanup semantics. Physical fusion does not transfer that authority.

## 3. Terms

### 3.1 Search Session

A **Search Session** is one logical lifetime of a composed CUDA-MCGS engine instance across zero or more root changes. It owns a session identity, session incarnation, lifecycle state, current root contract state and selected observation/control capabilities, and it binds the selected finite resource plan owned by SPEC-0011 composition.

A long-lived Search Session may span many root epochs. Long-lived does not mean unbounded memory, immortal device resources, one kernel lifetime, or unlimited counter width.

### 3.2 Root

The **root** is the domain-contract-resolved graph/state anchor from which the selected search policy interprets root-relative work for the current epoch.

A concrete domain/product may derive the new root from a transition/action, an authoritative state/identity descriptor, an observation update, or another accepted namespaced root-update schema. The universal contract does not require one game-move representation.

### 3.3 Root epoch

A **root epoch** is a monotonically advancing semantic generation identifying one accepted root-relative search interval within a Search Session.

Root-relative work, paths, reservations, outputs, observations and product state MUST declare whether they are scoped to the current root epoch. An older epoch MUST NOT alias a later epoch through silent counter wrap.

### 3.4 Root update / root advance

A **root update** or **root advance** is an externally supplied Search Session input requesting a new accepted authoritative root anchor. It is environment/domain input, not a host-selected internal search step. This specification avoids using `reroot` as the public operation name; retained historical evidence may still use that term for a genuine root update.

### 3.5 External attention change

An **external attention change** is a bounded directional input expressing outside objective, priority, budget weighting or service allocation selected by the concrete session profile without changing the authoritative root anchor. It is not cancellation and is not a CPU-computed intermediate that tells the engine how to perform its next internal selection, scheduling, evaluation, expansion or backup step.

The owning profile MUST declare the input schema/version, authority, identity/idempotence, finite capacity, independent attention generation, admission-before-publication rule, coalescing/version order, device-side application point, pressure outcome, cancellation/terminal interaction and observation visibility. An attention update cannot advance the root epoch, invalidate already admitted work, traverse or relabel graph state, run root-reuse classification, trigger reclamation or require global device synchronization. Naming an input "attention" does not exempt it from device-closure requirements.

### 3.6 Session observation

A **Session observation** is a bounded immutable publication derived from completely published search state for a selected observation schema. Examples may include evaluation summaries, proof state, frontier summaries, diagnostics, search-quality data, or product-defined ranked candidates. These examples do not make any one payload universal.

### 3.7 Root transaction, attention publication and public ports

A **root transaction** is a stale-safe bounded prepare/commit/abort operation for one structural root update. It binds command identity, session/root epochs, only the affected owner preparations, root compound-resource admission, commit state and exactly-once cleanup. Compile-time-known root-independent owners do not participate merely because they are selected by the engine.

An **attention publication** is a separate versioned owner-scoped command. It uses pre-admitted command/publication capacity, may coalesce unapplied versions according to the selected rule and becomes visible through queued device control work at an already selected safe point. It does not use the root transaction or root reserve. Applying no new attention requires no steady-state polling path; an attention-absent specialization removes every attention-owned input, generation, publication, status, port, cleanup item and generated branch.

The semantic ports are `validateSessionInput`, `prepareRootUpdate`, `commitRootTransaction`, `abortRootTransaction`, optional `applyAttentionChange`, `requestObservation`, `acquireObservation`, `releaseObservation`, `requestCancellation`, `completeSession` and `teardownSession`. They are not mandatory functions, callbacks, stages, kernels or ABI symbols.

SESSION-PROFILE-001. The normalized profile declares session/command/root/epoch identities and ranges, selected input schemas/permissions/idempotence, root-affected owner prepare/commit/abort/reuse/stale ports, root compound resource admission, independently selected attention generation/publication/application, observation profiles/borrows, cancellation/completion/teardown, failure/diagnostics, compatibility and zero-residue deletion.

SESSION-PROFILE-002. Unknown/duplicate owners or schemas, ambiguous authority/idempotence/commit, missing root-owner disposition, root-independent transaction participant, incomplete resource admission, nonterminal root transaction, root-scoped or graph-affecting attention, unbounded input/borrow/wait, insufficient epoch/generation width, host-progress dependency or missing cleanup rejects specialization before ignition.

SESSION-PROFILE-003. Meaning-insensitive collections normalize canonically; root command/commit/reuse order and attention generation/coalescing/application order that affect meaning are explicit. Every session-affecting input contributes to profile/package identity.

SESSION-PROFILE-004. Host validation/composition may use ordinary Node.js. Post-ignition session application/capture coordination uses restricted Device-JS/Search Program inputs through public CUDA-JS contracts. CUDA-MCGS may not implement sideband/lifecycle with C/C++, CUDA C++, direct FFI, hand PTX, a native addon/subprocess or CUDA-JS-private API.

SESSION-PROFILE-005. A naturally generic GPU sideband/atomic-observation/operation-lifecycle need that cannot be expressed naturally with bounded resources, synchronization, cleanup and qualification through public CUDA-JS stops for consumer-neutral CUDA-JS capability classification. Session meaning is not distorted and native CUDA-MCGS code is not authorized.

## 4. Device-owned progress boundary

SESSION-001. Accepting external root updates or publishing observations MUST NOT make the host responsible for selecting, scheduling, advancing, evaluating, backing up, or otherwise progressing internal active search.

SESSION-002. Search may continue correctly if no consumer reads an observation.

SESSION-003. Observation requests/reads MUST NOT be required to unlock internal search progress.

SESSION-004. A root update may change the environment/domain fact that defines the current search root. That external fact does not authorize a host micro-step loop for internal search progression.

SESSION-005. Internal Search Stages and Async Stage Channels remain device-owned mechanisms. External Search Session control/observation ports are a separate boundary and MUST NOT be represented as arbitrary internal extension callbacks.

SESSION-006. A host observation-to-decision-to-attention-write, polling/relaunch or callback loop MUST NOT be required to advance internal search. An externally supplied attention change MAY alter an accepted outside objective or directional weighting, but it MUST NOT encode a CPU-selected next internal search step.

SESSION-007. Attention application and observation publication MUST be independently progress-safe: delayed input, absent input, delayed reads or absent reads cannot leave internal search waiting for host participation unless the selected stopping/cancellation contract has already ended active search.

## 5. Root-update validation and admission

A root update MUST be rejected before root-update-specific semantic mutation unless all applicable validation and admission gates succeed.

At minimum, the owning contracts MUST validate before commitment:

1. session identity/incarnation and root-update schema/version;
2. command/update identity when duplicate or replay handling is material;
3. domain authority and root descriptor validity that can be checked without committing search mutation;
4. root-epoch advance availability;
5. compatibility with the selected domain/policy/history/product profile;
6. finite resource admission required to establish the candidate root/update;
7. cancellation/terminal/session-health state;
8. any product-specific precondition explicitly declared by the selected root-update contract.

SESSION-ROOT-001. A rejected root update MUST leave the accepted root, root epoch and root-relative search state unchanged.

SESSION-ROOT-002. Validation itself MAY perform read-only lookup, identity verification and bounded diagnostics. It MUST NOT create a new authoritative graph object, expand search state, reserve root-update-specific resources, reset statistics, or publish a new epoch before admission succeeds.

SESSION-ROOT-003. When establishing a valid new root requires resource reservation or materialization, the profile MUST define an atomic or recoverable prepare/commit protocol. Failure before commit leaves the old root authoritative.

SESSION-ROOT-004. A later commit-time epoch/session assertion is defense in depth and does not replace pre-mutation admission.

SESSION-ROOT-005. Duplicate/replayed command identity returns the original terminal disposition or a typed duplicate/stale result without applying prepare, epoch advance, resource transfer or owner mutation twice.

SESSION-ROOT-006. Prepare gathers exact domain root validity, graph anchor/materialization, affected policy/evaluator/output reuse plans, resource compound lease and progress stale-work plan without changing current authority. Root-independent owners are statically omitted. Preparation and commit work are bounded independently of retained graph/search-state size; state-family reset/invalidation and reclamation use generation/lazy lifecycle rules where their owners permit rather than synchronous traversal.

SESSION-ROOT-007. Commit has one logical linearization point and publishes the new root/epoch only after all required prepares succeed. Owner mutations that cannot be made visible atomically are ordered behind that point with old/new epoch guards; a partial post-commit failure is fatal/quarantined and cannot be reported as rejected with the old state silently restored.

SESSION-ROOT-008. Concurrent root and attention commands have one declared command order plus separate root-transaction and attention-generation conflict/coalescing rules inside bounded queue/capacity. Host arrival timing cannot create two authoritative roots, attach attention publication to root authority implicitly or create an unbounded command backlog.

SESSION-ROOT-009. Prepared graph objects, resource leases, reuse plans and stale-work plans remain transaction-scoped and non-authoritative before commit. Abort releases or restores every prepared contribution exactly once; an owner that cannot provide a bounded recoverable abort rejects the profile before ignition.

### 5.1 External attention admission and application

SESSION-CONTROL-001. Each selected attention schema names its semantic owner, authority, bounded representation, valid session incarnation, independent generation, idempotence and exact directional effect. The Session coordinates publication but does not reinterpret a product objective, policy weighting or progress-service allocation.

SESSION-CONTROL-002. An attention command passes schema, authority, session, generation, conflict and pre-admitted command/publication capacity before publication. It is not root-epoch scoped and cannot consume the root reserve or require root compound admission. Rejection leaves all semantic owner state unchanged and returns a typed disposition.

SESSION-CONTROL-003. Attention has one declared generation/publication order relative to root commit, cancellation and completion, with explicit duplicate/stale/coalesced dispositions. It is an owner-scoped publication rather than an all-owner prepare/commit/abort transaction; already admitted work keeps its captured semantics unless another selected cancellation or root-stale contract applies.

SESSION-CONTROL-004. The selected profile declares queued device control work, an already selected safe application point and per-device version visibility. Publication/application cost is bounded independently of graph/search-state size; no steady-state attention polling, host callback, relaunch, observation response, global multi-device barrier or subsequent input is required to apply it or keep internal search progressing.

SESSION-CONTROL-005. An attention change may alter only an accepted external objective, directional weighting or owner-declared service allocation. It cannot name an internal work item, choose a next search step, acknowledge internal progress, encode an unbounded program, change root identity/epoch, traverse or mutate graph structure, classify retained state, resize active resources or trigger reclamation.

## 6. Finite root-update pressure

A concrete long-lived profile MUST define what happens when a valid authoritative root cannot be established inside the current finite resource plan.

Permitted strategy families include, when explicitly specified and proven:

- reserved root-update admission capacity;
- bounded retirement/reclamation before commit while the old root remains authoritative;
- reuse of already-valid graph storage;
- rejection of the update with a typed pressure/exhaustion outcome while the current session remains valid;
- typed terminal/restart-required session outcome.

The profile MUST NOT use unplanned allocation, silently exceed the memory plan, destroy the old authoritative root before the new root is commit-ready, or partially apply the root update and then report rejection.

The normalized Session/product profile selects its semantic update outcome and each source owner supplies its permitted prepare/reuse/reclaim response. SPEC-0011 owns composition, reserve and atomic admission accounting but never selects semantic victims or update policy. A domain/search product may strengthen the requirement, for example by requiring reserved ability to accept one authoritative next-state root.

## 7. Root-update commit and publication

A successful root update has one authoritative commit point.

Before that point, the old root epoch remains authoritative. At commit:

- the new root identity/incarnation is valid and its required initialization is complete;
- the new root epoch is assigned without stale aliasing;
- root-relative publication state switches to the new epoch according to one declared publication protocol;
- the update result is published as accepted.

After commit:

- new root-relative work is admitted only under the new epoch;
- older root-relative work is drained, abandoned, transformed, or retained only according to its owning contract;
- reclamation may proceed separately under Section 10;
- an older complete observation may remain readable, but its epoch/generation MUST make it distinguishable from current-root data.

A root update does not require rebuilding the complete retained graph.

## 8. Old-epoch work and publication

Every work class whose effects depend on the active root MUST define root-epoch ownership.

SESSION-EPOCH-001. Work captures the root epoch at admission or at another explicit point before root-relative effects become possible.

SESSION-EPOCH-002. After a root update commits, old-epoch work MUST NOT publish root-relative visits, values, reservations, output records, policy state, observation payloads, or completion counts into the new epoch unless the owning contract explicitly proves the effect is root-independent and reusable.

SESSION-EPOCH-003. Every old-epoch reservation terminates with exactly one declared disposition, such as `applied-before-commit`, `abandoned-stale-root`, `transformed`, or another versioned policy outcome.

SESSION-EPOCH-004. Stale disposition releases or transfers every owned reservation/resource exactly once.

SESSION-EPOCH-005. Progress/schedule nondeterminism may change how much old work completed before commit, but conservation, stale isolation and new-epoch correctness remain invariant.

## 9. Root-advance reuse classification

Root-advance reuse is contract-selected. The universal framework MUST NOT assume that all node/edge/evaluator/product state survives a root change or that all of it resets.

Every persistent state family affected by structural root advance MUST classify itself into one of these semantic outcomes or an explicitly equivalent namespaced category. Attention publication never invokes this classification:

- **root-independent retain** — remains valid unchanged across the root update;
- **retain-if-key-valid** — reusable only when its declared identity/context validity key remains satisfied;
- **transform** — survives only after a specified deterministic transformation;
- **reset** — storage may remain but semantic value is reinitialized for the new root epoch;
- **invalidate/retire** — must not be consumed after commit and becomes reclamation input;
- **product-defined** — namespaced product rule with the same explicit validity/lifecycle obligations.

At minimum, the owning graph/domain/policy/evaluator/output/resource/progress/extension contracts MUST classify material state such as:

- state-node identity and immutable state representation;
- transposition entries;
- evaluator outputs/model-cache entries;
- parent-edge statistics and reservations;
- node-local policy statistics;
- path/history/repetition state;
- widening/proposal continuation state;
- observation/publication state;
- root-update leases, reserves and pressure evidence;
- queued/in-flight work, readiness records and completion accounting;
- extension-capability persistent state.

A product-specific reuse decision MUST NOT silently become universal core meaning.

## 10. Root advance, attention and reclamation are separate transitions

The logical root switch and storage reclamation have different correctness and latency obligations.

SESSION-RECLAIM-001. A conforming profile MUST NOT require full-graph synchronous reclamation merely to commit a root update unless that behavior is explicitly selected, bounded and justified.

SESSION-RECLAIM-002. Reclamation must respect outstanding work, observations/borrows and other declared references whose lifetime can outlive the root commit.

SESSION-RECLAIM-003. Storage reuse changes generation/incarnation or proves equivalent stale-reference impossibility before a later object can occupy the same reusable identity space.

SESSION-RECLAIM-004. A simple safe profile may use an epoch/grace-period rule: commit the new root, dispose old-epoch work, then reclaim unreachable/retired storage once no protected old references remain. Other mechanisms may conform with equivalent proof.

SESSION-RECLAIM-005. Pressure may prioritize reclamation, but reclamation failure or insufficient reclaimable capacity produces a typed bounded outcome rather than hidden allocation.

## 11. Generic observation publication

Observation is optional and SPEC-0013 owns its selected schema, source bindings, snapshot consistency, slots/sequences/borrows, pressure/drop/coalescing and immutable publication. Search Session owns only bounded external request authorization, session/root epoch binding, acquisition/release coordination and teardown ordering for those selected profiles. Selecting no live observation, attention or root input removes all live-session sideband state.

SESSION-OBS-001. Session request/capture coordination invokes only the selected SPEC-0013 read-only capture port. It MUST NOT expand a node, materialize a child, advance selection, change visits/values/reservations, run evaluator work, alter policy state, or trigger root-update-specific mutation merely to satisfy a request.

Observation-local buffers, sequence counters and publication bookkeeping may mutate under the observation owner, but those mutations MUST NOT change the search result that would exist if no observation were requested.

SESSION-OBS-002. Session acquisition returns only an output-owner-published complete immutable snapshot or a typed unavailable/stale/pressure outcome, never a partially published payload.

SESSION-OBS-003. Session binding validates the root epoch carried by a root-relative observation and preserves it on acquisition. It cannot relabel an older-root snapshot as current.

SESSION-OBS-004. Session request cadence cannot change search semantics. If an external input consumes observed facts and changes an accepted product/policy objective, that later input is a separately authorized attention command under its true owner, never an implicit observation acknowledgement or host progress loop.

SESSION-OBS-005. Session completion and acquisition preserve SPEC-0013's distinction between terminal result and live observation. A live acquisition cannot force search termination, and a live slot cannot satisfy guaranteed terminal publication.

SESSION-OBS-006. An external observation request selects only a pre-normalized SPEC-0013 profile/projection, carries session/root/profile identity and receives a typed accepted/rejected/stale/pressure disposition. It cannot introduce a runtime schema, field path, callback or device program.

SESSION-OBS-007. Borrow/read completion affects only observation slot/transfer/session-teardown lifetime. It cannot acknowledge internal work, advance the next capture or change root/attention authority.

SESSION-OBS-008. A slow/abandoned consumer follows the selected finite borrow cancellation/quiescence rule. Session teardown cannot reuse/release backing state until the output/CUDA-JS owning systems prove reads/transfers terminal.

A ranked root-action list is one possible product/policy observation schema. It is not mandated by this universal specification.

## 12. Finite counters and stale-safe exhaustion

Session identity generations, root epochs, selected attention generations, observation publication generations and reclamation generations are finite-width values chosen by the concrete profile.

The profile MUST define:

- width/range and reserved values;
- exhaustion threshold;
- whether rollover is prohibited, translated through a new session incarnation, or handled by another stale-safe protocol;
- failure/restart behavior;
- proof that an old work/reference/observation cannot alias a later incarnation.

Silent wraparound is non-conforming.

A profile MAY make practical exhaustion unreachable for the intended maximum session lifetime through a sufficiently wide type, but it still defines terminal behavior rather than relying on language/hardware overflow.

## 13. Cancellation, health, completion, and restart

Root updates, attention publications, observations, cancellation and terminal completion are distinct session operations.

- Cancellation remains a published one-way request and MUST NOT be conflated with ordinary root update.
- A root update rejected under pressure does not automatically mean session cancellation unless the profile says so.
- A terminal CUDA/runtime/device-health failure is owned by the appropriate CUDA-JS/CUDA-MCGS boundary and may make further session operations unavailable.
- Restart creates a new session incarnation and invalidates prior session-scoped handles/publications according to the compatibility contract.

The terminal result reports the final session/root epoch and any typed root-update/pressure/observation failure material to result validity.

SESSION-LIFE-001. Session lifecycle is `profile-normalized → resources-admitted → initialized → active/external-wait → cancelling/draining → terminal → released`, with typed failure/quarantine. `session-absent` specializes away this lifecycle.

SESSION-LIFE-002. Cancellation has one declared ordering point against command admission/commit and is idempotent. A command either commits before cancellation and receives its normal stale/drain disposition or fails/cancels without partial authority mutation.

SESSION-LIFE-003. Completion freezes command admission, coordinates root-transaction and attention-publication closure, coordinates progress closure and SPEC-0013 terminal capture, and publishes terminal Session identity/root epoch only after every root transaction/publication/work/borrow relevant to validity is terminal or quarantined.

SESSION-LIFE-004. Teardown stops inputs/observation acquisition, aborts prepared root transactions, closes attention publications, drains/disposes work, releases owner borrows/protections/resources in dependency order, preserves the terminal result through its authorized borrow, then releases opaque CUDA-JS operations/resources.

SESSION-LIFE-005. Session contributes finite command/update slots, root-transaction records, root epochs, optional attention publication/generation state, root/attention payloads, root compound admission, stale-work coordination, observation requests/borrows, diagnostics and teardown resources to SPEC-0011. Attention absence removes its generation/publication state exactly. No hidden queue, host spill or emergency update buffer is permitted.

SESSION-LIFE-006. Applicable statuses include `invalid-session-profile`, `session-command-capacity`, `session-command-duplicate`, `session-command-stale`, `session-attention-invalid`, `session-attention-conflict`, `attention-generation-exhausted`, `root-invalid`, `root-update-pressure`, `root-update-conflict`, `root-epoch-exhausted`, `session-cancelling`, `session-restart-required`, `session-terminal` and `session-internal-failure`, with exact normal/pending/reject/stop/fatal meaning.

SESSION-SEC-001. External commands and observation requests are untrusted until authority/permission, schema/version, size/range, session/root/profile identity, replay/idempotence and resource validation passes. Least-authority inputs cannot carry raw pointers, CUDA handles, callbacks, arbitrary code or private owner paths.

SESSION-SEC-002. Diagnostics are bounded and expose command/root-transaction or attention-generation/epoch/owner/cause without arbitrary domain/model/device bytes. Conflicting authority, partial commit or epoch alias quarantines affected session/result evidence rather than fabricating rollback.

SESSION-SEC-003. The normalized profile declares session persistence absent unless a separate owning contract is selected. Selected persistence requires a canonical versioned encoding, compatibility/migration and rollback/recovery rules, authorization, bounded retention and cleanup; raw device pointers, CUDA handles, in-flight transactions and borrowed publications are never durable authority.

SESSION-COMPAT-001. Compatibility requires matching session/command/root schemas, root-affected owner prepare/reuse/stale dispositions, root-transaction/commit order, root epoch ranges, selected attention schema/generation/coalescing/application semantics, observation profiles/borrows, cancellation/completion/teardown and permissions—not one sideband transport.

SESSION-COMPAT-002. Search Composer/package identity binds all normalized Session semantics and restricted Device-JS inputs; CUDA-JS mailbox/transfer/operation/native identity remains opaque and separately bound.

## 14. Search IR and package requirements

The complete Search IR MUST represent selected Search Session capabilities without embedding one product payload.

At minimum, when enabled, it MUST represent:

- session/root identity and finite epoch profile;
- selected structural root-update schema/affected owners/root transaction and, independently, selected attention schema/owner/generation/coalescing/lazy application semantics;
- root-relative work classes and stale disposition;
- root-advance reuse classifications or references to their owning contracts;
- reclamation/generation policy;
- selected observation schema identities, capacities, scope and publication rules;
- finite counter/exhaustion behavior;
- cancellation/terminal interactions;
- persistence absent or the selected persistence-owner identity and compatibility policy.

SESSION-IR-001. Search IR additionally represents command authority/idempotence/order, root-affected owner prepare/commit/abort ports, root compound-resource transaction, optional owner-scoped attention publication/generation without root/reclamation effects, observation request/borrow coordination, failures/permissions and cleanup.

SESSION-IR-002. Normalization rejects unknown/duplicate owners/schemas, missing root prepare/abort/stale/reuse disposition, inclusion of a root-independent transaction owner, ambiguous root/attention/cancel order, insufficient epoch/generation width, root-scoped or graph-affecting attention, unbounded command/borrow, host-progress dependency, hidden resource and missing teardown.

SESSION-IR-003. Search IR names semantic ports and consumer-neutral mechanism requirements without raw pointers, CUDA symbols/atomics/streams/events/mailbox layout, scheduler topology, host callback or product payload meaning.

SESSION-IR-004. A terminal-only `session-absent` image/package contains no command/root-update/attention/observation-request/session-epoch/sideband/borrow field, branch, resource, code or synchronization dependency. Deletion is inspected in normalized schema, layout, generated code and runtime plan.

The CUDA-MCGS-to-CUDA-JS package MUST express only the generic mechanism requirements needed to realize those selected ports. CUDA-JS MUST NOT interpret root identity, root advance, attention meaning, chess moves, observation payloads, ranking or MCGS semantics.

CUDA-JS SPEC-0014 publication mailboxes provide an accepted generic asynchronous mechanism, but their availability is not CUDA-MCGS Search Session qualification. Any selected live-session profile still requires exact compatible-pair evidence for its declared root/attention/observation schemas, concurrency, visibility, finite pressure, cancellation and teardown semantics.

## 15. Conformance requirements

One consolidated Search Session capsule MUST include stable cases for applicable selected capabilities:

1. ordinary long-lived session without root update;
2. root advance to an already-known child/state;
3. root advance to an existing transposition identity;
4. replacement/new root requiring materialization;
5. invalid root-update schema/identity/action/descriptor rejected with no semantic side effect;
6. root-update epoch exhaustion rejected with no semantic side effect;
7. valid new-root admission under ordinary capacity;
8. valid new-root pressure under full/critical capacity with the selected typed outcome;
9. old-epoch work completing after root advance and failing to contaminate new-root state;
10. exact reservation/resource conservation for stale work;
11. reuse classification across graph, policy, evaluator/history and extension state;
12. reclamation deferred while protected old references remain;
13. generation-safe reclamation and slot/storage reuse;
14. many-epoch bounded-memory sequence;
15. observation of an unexpanded/unmaterialized search state without causing search mutation;
16. observation cadence invariance when observation is declared non-semantic;
17. old complete observation distinguishable after root advance;
18. observation-generation exhaustion and root-epoch exhaustion fail closed;
19. cancellation/root-update race disposition;
20. duplicate/replayed command exactly-once disposition;
21. concurrent root/attention ordering and bounded capacity;
22. every owner prepare failure aborting with old authority intact;
23. post-commit partial failure producing fatal quarantine rather than false rejection/rollback;
24. terminal-only `session-absent` zero generated/runtime residue;
25. observation borrow/transfer quiescence before teardown/reuse;
26. invalid/stale/unauthorized attention rejected without owner mutation;
27. accepted attention applied under its declared version/coalescing rule at its device-visible safe point without host-owned progress, graph traversal or a global multi-device barrier;
28. root/attention/cancellation/completion race resolved by the normalized root-transaction and attention-generation orders;
29. persistence absent with zero residue and, when selected, restart/migration/recovery rejecting stale or in-flight authority;
30. oracle sensitivity for epoch, generation, admission-before-mutation, transaction abort/commit, device application and observation-read-only guards.

CUDA-free reference evidence owns semantic ordering and invariants. Native CUDA evidence additionally owns actual publication scope, memory ordering, concurrent workers, root-update interaction, reclamation races, final resource identity and cleanup.

## 16. Bounded evidence and next native gate

The disposable `SESSION-001` experiment tracked in CUDA-MCGS issue #42 is bounded proposal evidence, not normative authority. It supports investigation of:

- root-epoch stale-work isolation;
- separation of root advance, attention and reclamation;
- generation-safe slot reuse;
- read-only observation/ranking publication;
- admission-before-mutation ordering;
- finite new-root pressure as a real contract decision;
- counter exhaustion sensitivity.

Its synthetic policy reuses node/edge statistics across structural root advance and therefore does not establish a universal reuse rule.

Before a native live-session profile is qualified, a `SESSION-002`-class experiment SHOULD exercise actual concurrent GPU workers with root-epoch publication, old-work drain/abandonment, read-only observation snapshots, generation-safe reclamation and full-arena root-update pressure while preserving device-owned progress.

## 17. Acceptance blockers

This proposal cannot become accepted until:

- every integrated domain, graph, policy, evaluator, output, resource and progress owner is reconciled without duplicate authority and supplies required prepare/reuse/stale/cleanup ports;
- the root/attention/observation schema, identity and normalization obligations are decision-complete and implemented by the bounded Search IR/reference evidence accepted atomically with this contract;
- representative finite reserved-root, reject-on-pressure and restart-required dispositions plus terminal-only deletion are proven in the CUDA-free semantic reference model;
- device-owned progress, old-epoch disposition, duplicate/concurrent commands, partial-commit fatal handling and borrow/teardown are proven in that reference model;
- the CUDA-MCGS-to-CUDA-JS package requirements identify the generic long-lived sideband capability profile without importing its mechanism into session semantics;
- product-specific observations such as chess ranked moves remain downstream and do not leak into universal acceptance criteria.

A selected native live-session profile additionally requires actual concurrent device progress, CUDA publication/reclamation evidence, an exact qualified CUDA-JS sideband pair, pressure/cancellation/teardown evidence and separately scoped platform support. Those production-profile gates do not block semantic acceptance of an optional Search Session contract and do not make the live-session profile a prerequisite for the finite terminal engine.

Production Session lowering remains prohibited until semantic acceptance. Changing command/root/epoch authority, root-transaction prepare/commit/abort, attention generation/publication/application, reuse/stale coordination, observation request/borrow, cancellation/completion/teardown, permissions or compatibility invalidates affected framework/Search IR/normalizers, generated packages, persisted sessions, product adapters and reference/native approvals. The ENGINE-CONTRACT-01 integration spine reconciles invalidation.

Every command/root transaction/attention publication, compound lease, old-epoch work coordination record, observation request/borrow/transfer, diagnostic and retained session artifact receives release/retain/abort/retire/quarantine disposition. Implementation, testing, review, persistence, security, generated/JIT/ABI, performance and cleanup trigger specialist doctrine from root agent authority.
