# SPEC-0008: Search Policy, Statistics, Backup, and Stopping

**Status:** Proposal

**Draft version:** 0.1.0

**Owner:** CUDA-MCGS universal search-policy semantics

**Product area / durable path:** universal MCGS semantic core / `docs/specs/`

**Consumers:** evaluator, result/observation, finite-resource, device-progress and Search Session contracts; Search IR; Search Composer; domain/product adapters; graph owner-region composition; deterministic reference and native conformance

This proposal defines the product-neutral policy brick that owns search decisions, policy records, in-flight reservations, action admission/widening, value interpretation, backup, stopping-budget semantics and root-advance reuse classification. It defines a family of finite policy profiles, not UCT/PUCT, AlphaZero, rollouts, scalar zero-sum value, ranked output, a scheduler or a production implementation.

## 1. Authority, identity, and applicability

Specification identity is `CUDA-MCGS-SPEC-0008@0.1.0-draft`.

Every concrete finite CUDA-MCGS engine selects exactly one composed search-policy profile. A policy-only, proof, optimization, evaluation-only, rollout-like, best-first or custom search may specialize away inapplicable ports/records, but it must still declare how admitted work progresses, what constitutes a completed contribution and how stop/partial-result validity is determined.

Normative dependencies are:

- [`ADR-0002`](../decisions/ADR-0002-universal-contracts-specialized-engines.md) for universal contracts and finite specialization;
- [`ADR-0003`](../decisions/ADR-0003-device-resident-active-search.md) for device-owned active search;
- [`ADR-0005`](../decisions/ADR-0005-lego-design-hierarchy.md) for one-owner LEGO boundaries;
- [`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md) for core/extension/product separation;
- [`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) for JavaScript/restricted Device-JS production ownership and CUDA-JS capability escalation;
- accepted [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) for parent-edge ownership, path-cycle ordering, reservation/completed-work distinction, stopping and partial-result foundations;
- accepted [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) for foundational normalized Search IR/reference meaning within its current scope;
- proposal [`SPEC-0007`](SPEC-0007-domain-state-action-and-transition.md) for domain roles/actions/history/path-relation/terminal-outcome meaning; and
- proposal [`SPEC-0010`](SPEC-0010-graph-storage-and-reclamation.md) for graph objects, opaque owner regions, paths, typed references, publication and reclamation.

Proposal [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) is informative adjacency for root epochs and reuse. Product policies, experiments and implementations remain evidence beneath this proposal.

Accepted authority governs conflicts. This proposal neither supersedes another specification nor authorizes production implementation.

## 2. Purpose, reading map, and required outcome

The required outcome is one policy-owned semantic boundary through which materially different searches can choose work, coordinate parallel in-flight use, admit actions, interpret domain/evaluator facts, apply exact backups and stop safely without graph storage, evaluator execution, output publication or device scheduling interpreting policy internals.

Sections 3 through 16 form one coupled normative contract. Sections 17 through 20 govern Search IR, compatibility, conformance and invalidation. A consumer of one policy port must also honor value perspective, transaction, resource, stop and reuse rules.

The contract succeeds only if it can express scalar and vector/non-zero-sum policies, distributional/proof-like values, chance/custom roles, lazy/sampled widening, evaluator-absent/proposal-only/evaluation-only/combined profiles, order-sensitive backup and policies with no ranked-action output without foundational redesign.

## 3. LEGO ownership and design boundary

### 3.1 Exact owned invariant and state owner

The search-policy contract owns this invariant:

> Every policy decision, record, reservation, value conversion, backup contribution, stopping fact and root-advance reuse disposition has finite declared meaning and identity; in-flight work is distinguishable from completed work, every completed contribution is applied exactly once according to the selected algebra, and no unready/failed/stale fact influences a valid result.

The selected policy profile owns:

- domain-role handler selection and eligible decision semantics;
- node/edge/path/work policy-record schemas, meanings, units and mutation rules;
- selection/exploration and tie/equivalence behavior;
- in-flight reservation/virtual-effect semantics and conservation;
- action-source request/admission, widening and candidate-use semantics;
- conversion of terminal domain outcomes and ready evaluator outputs into policy values;
- value coordinates/perspective, precision, aggregation and comparison when selected;
- cycle/path-relation response;
- backup path/direction/transform/update/commit semantics;
- policy budget, proof/convergence and stop-request meaning;
- policy-side valid-partial/result-consumer eligibility facts; and
- root-advance/root-epoch reuse/reset/transform/invalidate classification for policy-owned state.

### 3.2 Explicit non-ownership

The policy contract does not own:

- domain state/action/history/role/transition/terminal-outcome meaning;
- graph objects, references, transposition equality/publication, path storage, arenas or reclamation;
- evaluator model/input/output meaning, execution, batching, workspace, readiness or cache identity;
- external result/live-observation payload schema, snapshot/publication/lifecycle or product ranking presentation;
- global resource partition/watermarks, device-ready work scheduling/fairness/deadlock detection or CUDA realization;
- Search Session root-update authority/commit, external control, observation cadence or reclamation; or
- product-specific actor, presentation, outcome-label, state or quality concepts.

Policy may declare a comparison/order or product-consumable score as policy meaning. That does not create a mandatory external ranking or transfer immutable publication ownership from the output contract.

### 3.3 Public semantic ports and injected dependencies

The universal policy ports are:

1. `initializePolicyRecords` — initialize declared node/edge/path/work owner regions through graph lifecycle ports;
2. `classifyRoleHandler` — select a profile-declared decision/chance/automatic/observation/terminal/custom handler for a domain role;
3. `selectNext` — choose an eligible ready edge/action-source request or typed no-selection outcome from a bounded public view;
4. `reserveInFlight` / `releaseInFlight` — publish and conserve one policy reservation/virtual effect;
5. `decideActionAdmission` — decide whether/how much intrinsic/admitted action production is requested or admitted;
6. `mapTerminalOutcome` and `mapEvaluatorOutput` — convert ready owner facts into one typed policy contribution;
7. `classifyPathResponse` — map a domain path-relation fact to continue/cut/transform/fail behavior;
8. `prepareBackup`, `applyBackupStep`, `completeBackup` and `failBackup` — own a finite exactly-once backup transaction;
9. `evaluatePolicyStop` — publish policy-budget/proof/convergence stop facts; and
10. `classifyPolicyReuse` — declare retain/retain-if-key-valid/transform/reset/invalidate across root epochs.

These are semantic ports, not mandatory runtime functions, stage names or ABI symbols. Search Composer may fuse/specialize/eliminate them while preserving observable meaning and ownership.

Injected dependencies are public domain/graph/evaluator/resource/progress/session facts and product-policy schema values. Policy must not inspect private provider types/paths, allocate outside the plan, dereference raw pointers, call a host callback or reach into graph/evaluator internals.

### 3.4 Equivalence class, deletion tests and total-system simplicity

Permitted profiles include deterministic or stochastic selection; count/sum/mean/vector/distribution/interval/proof/custom records; optimistic/pessimistic/uncertainty or no comparison; reservation/virtual-loss/virtual-visit/custom/no in-flight effect; fixed/exhaustive/progressive/lazy/sampled/custom widening; terminal/evaluator/rollout/proof/custom value sources; commutative or order-sensitive backup; and one-shot or root-advancing search.

Deleting every production product, any particular output/evaluator shape, rollouts, optional extensions, transposition reuse, reclamation or one physical scheduler leaves the applicable policy contract coherent. Deleting an optional evaluator removes its channels/records/value-source branches when the policy permits absence; no evaluator residue remains.

Splitting reservation from completed statistics or backup from value perspective would create competing accounting/value authorities. Merging graph/evaluator/output/progress behavior into policy would couple independently substitutable state/lifecycles. This policy brick is the simplest sufficient owner.

## 4. Terms and semantic model

### 4.1 Policy profile and policy record

A **policy profile** is the immutable normalized selection of role handlers, record schemas, selection/admission rules, value sources/algebra, backup, stopping and root-advance reuse for one engine identity.

A **policy record** is a finite policy-owned value stored in a declared graph node/edge/path/work/root region or separate policy arena. Graph owns the region's storage validity; policy owns its meaning/mutation/publication.

### 4.2 Selection and candidate

**Selection** chooses a policy-eligible next semantic action from completely published inputs. A **candidate** may be a ready edge, an action-source/widening request, a domain-role-specific continuation or a typed terminal/no-progress outcome. Selection does not itself create graph/domain/evaluator output unless its transaction explicitly admits that owner operation.

### 4.3 Reservation and completed contribution

An **in-flight reservation** is a reversible policy-owned effect representing admitted but incomplete use. It may influence later selection only as declared. A **completed contribution** is a ready terminal/evaluator/rollout/proof/custom value that has completed its required backup transaction. Reservations and completed records are never the same counter/fact by implication.

### 4.4 Policy value, coordinates and perspective

A **policy value** is a finite profile-defined element used by selection/backup/stopping. Its coordinates may be global, root-relative, node-role-relative, actor-indexed, objective-indexed, distributional, interval/proof-like or namespaced. **Perspective** declares how a value is interpreted/transformed at each path occurrence; no player, scalar or sign-flip is universal.

### 4.5 Backup transaction

A **backup transaction** binds one completed source contribution, exact graph path occurrence sequence, root/work epoch/incarnation, per-occurrence transformed contributions, update identities and completion state. It may publish updates incrementally but is not reported complete until all required updates are applied exactly once.

### 4.6 Policy stop fact

A **policy stop fact** is a finite ready fact that a selected policy budget, proof, convergence or other policy-defined condition requests stopping. Resource exhaustion, external cancellation, runtime failure and Search Session termination retain their own cause owners.

## 5. Policy-profile normalization and validity

POLICY-PROFILE-001. The profile declares, with no unknown fields:

- stable profile ID/version and compatible domain/graph/evaluator contract identities;
- handler for every reachable domain role key;
- node/edge/path/work/root policy-record schemas, locations, units, bounds, initialization and lifecycle;
- selection inputs, eligibility, comparison/order, tie/equivalence and deterministic/nondeterministic class;
- reservation types, limits, visible effect, acquire/release/rollback and accounting;
- action-source/admission/widening modes, inputs, finite requests and pressure/failure behavior;
- terminal/evaluator/other value-source adapters and required/optional/advisory readiness/fallback;
- value schema, coordinates, perspective, precision, invalid values, arithmetic and comparison if selected;
- cycle/path-relation responses;
- backup path/direction/transform/update/order/idempotence/completion semantics;
- stopping-budget units, thresholds, cause priority, overshoot/drain and satisfaction meaning;
- root-epoch/reuse dispositions;
- finite resource contributions, cancellation points, failures/diagnostics and cleanup; and
- persistence/compatibility policy when selected.

POLICY-PROFILE-002. Missing/unknown/duplicate fields, unreachable role handler, owner-region conflict, ambiguous unit/perspective, insufficient range/precision, nonterminating selection/backup, undeclared evaluator fallback, accounting equation without an owner, invalid stop priority or arithmetic overflow rejects specialization before ignition.

POLICY-PROFILE-003. Meaning-insensitive collections normalize canonically; ordered value coordinates, backup sequence and tie rules preserve declared order. Defaults are explicit. Every meaning-affecting option contributes to policy/profile identity.

POLICY-PROFILE-004. Every selected policy port has a finite work/read/write/randomness/cancellation bound or a finite resumable protocol with explicit transaction identity, resources, progress and no false completion.

POLICY-PROFILE-005. Host validation/composition may use ordinary Node.js. Active policy execution uses restricted Device-JS/Search Program inputs through public CUDA-JS contracts. CUDA-MCGS may not use C/C++, CUDA C++, native addons/FFI, hand-written PTX, embedded CUDA source or CUDA-JS-private mechanisms.

POLICY-PROFILE-006. If correct policy execution needs a naturally generic GPU mechanism not expressible by public CUDA-JS contracts with finite resources, synchronization, lifecycle and qualification, work stops for CUDA-JS capability classification. Search-policy meaning remains in CUDA-MCGS and is not distorted to fit a missing mechanism.

## 6. Policy records, statistics and accounting

POLICY-RECORD-001. Every record field declares semantic owner, unit, scope, initialization, valid states, mutation operations, visibility, precision/range, overflow, reuse and whether it is result-visible. A counter named `visits`, `value` or `score` has no meaning without this declaration.

POLICY-RECORD-002. Parent-edge-local facts remain parent-edge-local across transpositions unless the profile separately declares a node/global aggregation with exact semantics. Graph child sharing never implicitly merges incoming-edge statistics.

POLICY-RECORD-003. Node, edge, path, root, work and global scopes are distinct. Root-relative or path-relative data cannot be reused as graph-global data merely because its physical node survives a root advance.

POLICY-RECORD-004. Reservation/in-flight fields are distinguishable from applied/completed fields. At minimum, applicable accounting preserves:

```text
admitted_work = active_or_pending + backup_in_progress + completed + failed_or_abandoned
reserved_effect = acquired - released_or_converted
completed_count = backup_transactions_fully_completed
```

Specialized profiles may eliminate zero/impossible terms but cannot make meaning ambiguous or count failed reservation as completed work.

POLICY-RECORD-005. Concurrent mutation declares atomic/reduction/ownership semantics and visibility. A record may be schedule-dependent only when the policy's determinism class permits it; stable invariants, bounds, conservation, stop/result classification and value validity remain required.

POLICY-RECORD-006. Integer/fixed/floating/custom arithmetic declares width, rounding, nonfinite handling, overflow/underflow and associativity/order assumptions. Silent wrap, NaN poisoning, precision reinterpretation or implementation-defined behavior is prohibited.

POLICY-RECORD-007. Graph structural readiness does not imply policy-record readiness. Selection/backup/output consumers acquire the exact policy channel/incarnation required by the profile and ignore reserved/initializing/failed/stale records.

POLICY-RECORD-008. Policy records mutate only through declared policy ports or owner-authorized reductions. Graph storage, evaluator execution, observation cadence and host reads cannot mutate them by side effect.

## 7. Domain-role handling and selection

POLICY-SELECT-001. Every reachable domain role has one handler declaring permitted candidate sources, readiness requirements, selection/admission behavior, terminal/no-action outcomes and failure. Missing role support rejects specialization before search.

POLICY-SELECT-002. A `decision` handler may compare/select eligible actions; a `chance` handler samples or enumerates according to declared domain/policy distribution semantics rather than maximizing by assumption; `automatic`/`observation`/`custom` handlers declare exact authority; `terminal` maps the domain outcome without outgoing selection.

POLICY-SELECT-003. Selection consumes only ready/acquired domain roles/actions, graph structures, policy records and evaluator outputs declared as inputs. Unready required input produces explicit pending work and releases the device worker/progress resource; it does not spin or invoke the host.

POLICY-SELECT-004. Eligibility and tie/equivalence behavior are exact. A tie may use canonical order, explicit randomness, fairness state, all-equivalent choice or a namespaced rule. Hidden address/order/timing dependence is prohibited unless explicitly part of a nondeterministic policy profile and still bounded/valid.

POLICY-SELECT-005. Selection and work scheduling are separate. Policy returns semantic candidates/requirements; device-progress chooses when/where ready work runs without changing policy meaning beyond declared schedule dependence.

POLICY-SELECT-006. A policy may select no edge because terminality, required input pending, widening requested, path relation, pressure, cancellation/stop or failure applies. Each case is typed; generic `no move` cannot conflate them.

POLICY-SELECT-007. Randomized selection consumes explicit finite random input/stream identity under the profile. It cannot depend on host timing, observation reads or undeclared process-global state.

## 8. In-flight reservation and parallel coordination

POLICY-RESERVE-001. A reservation has typed identity, owning work/path/edge/node scope, finite magnitude/units, lifecycle `available → acquired → released | converted | failed`, generation/epoch and exactly-once disposition.

POLICY-RESERVE-002. Reservation acquisition validates ready records/references, checks capacity with declared atomicity and publishes the in-flight effect before dependent descent/work becomes selectable as admitted.

POLICY-RESERVE-003. A reservation may affect selection as virtual loss, virtual visit, occupancy, exclusivity, uncertainty or another exact rule. It cannot masquerade as a completed visit/value contribution unless the profile explicitly defines a conversion at successful backup completion.

POLICY-RESERVE-004. Failure/cancellation/stale epoch before backup releases or rolls back every reservation exactly once. Successful backup releases or converts it at the declared ordering point; double release/conversion is a policy failure.

POLICY-RESERVE-005. Reservation exhaustion is typed pressure and consumes no failed reservation capacity. It does not authorize an unplanned counter, hidden queue, busy wait or host arbitration.

POLICY-RESERVE-006. A work item that has begun irreversible backup mutation follows Section 12's must-drain/quarantine rules rather than rolling back only the reservation and abandoning partial completed statistics.

## 9. Action admission and widening

POLICY-WIDEN-001. Policy owns whether and when an intrinsic domain producer or admitted evaluator/capability producer is requested, how many candidates/bytes are admitted, and when an open action source is considered sufficient for current selection.

POLICY-WIDEN-002. Fixed/exhaustive, paged, sparse, progressive, lazy, sampled, continuous/custom and no-widening profiles are permitted. Every request/admission is finite; no profile requires materializing an unbounded logical action space.

POLICY-WIDEN-003. Every candidate passes SPEC-0007 validation/identity. Policy declares duplicate/equal/repeatable-sample aggregation, rejection or separate-edge behavior and supplies graph's composed edge-admission identity without inspecting domain bytes.

POLICY-WIDEN-004. Widening thresholds/functions declare exact units/inputs, arithmetic, monotonicity if required, tie/order/randomness, pressure behavior and evaluator dependency. No fixed action count, branching factor or first-domain width is universal.

POLICY-WIDEN-005. A proposal-only evaluator/capability owns candidate generation/readiness/resources/failure; policy owns request/admission/use; domain owns candidate validity/identity; graph owns edge storage/publication. No owner calls through private internals or forms a dependency cycle.

POLICY-WIDEN-006. Candidate-source pending/failure/cancellation has a declared required/optional/advisory fallback. A required unavailable producer moves work pending/terminal as declared and cannot make the host advance search.

POLICY-WIDEN-007. Admission failure after candidate publication leaves the graph/policy state unchanged except bounded rejected-attempt diagnostics/accounting owned by the profile.

## 10. Value sources, coordinates and perspective

POLICY-VALUE-001. The policy declares zero or more source adapters for terminal domain outcomes, ready evaluator outputs, sampled/rollout-like outcomes, proof facts, heuristic/constraint facts or namespaced sources. Each adapter validates source schema/version/readiness/perspective before producing a policy value.

POLICY-VALUE-002. Evaluator modes may be absent, proposal-only, evaluation-only or combined. An absent/proposal-only evaluator contributes no evaluator value record/channel/branch. A policy requiring evaluator value rejects an evaluator-absent profile before ignition.

POLICY-VALUE-003. Value schema may be scalar, vector, matrix/tensor-like bounded record, distribution, interval, ordinal, proof lattice, sequence element or custom finite algebra. No scalar, floating-point, zero-sum, probability, reward or total-order assumption is universal.

POLICY-VALUE-004. Coordinate names/order, units, perspective and transforms are explicit. Actor-relative alternation/sign flip is one possible transform, not a default. Simultaneous/many/no-actor and global-objective profiles remain valid.

POLICY-VALUE-005. Source conversion declares precision, rounding, invalid/nonfinite handling, clipping only when semantically specified, uncertainty/confidence interpretation and compatibility identity. Silent evaluator/domain reinterpretation is prohibited.

POLICY-VALUE-006. Multiple ready sources declare combine/fallback/precedence semantics. Observation/read cadence, host timing or unready/failed source data cannot change the policy value.

POLICY-VALUE-007. A policy with no value algebra is permitted when its proof, feasibility, enumeration, proposal-only or other decision semantics are complete. No empty value profile retains value-only records/code.

## 11. Path relations and cycle response

POLICY-CYCLE-001. Graph resolves/claims successor identity before path handling and supplies domain-classified path-relation facts. Policy never infers a cycle solely from a transposition-table hit or equal identity key.

POLICY-CYCLE-002. For every possible domain relation the profile selects one exact response: continue under finite history/depth, cut with a typed value/outcome, transform to a policy contribution, mark proof/repetition state, abandon/fail work or reject the profile as unsupported.

POLICY-CYCLE-003. A cycle response that produces a value declares perspective/algebra/source identity and enters backup like any other ready contribution. It cannot invent a domain terminal outcome.

POLICY-CYCLE-004. Path depth/history/cycle-resource pressure remains distinguishable from semantic cycle response. Silent truncation or treating capacity as a draw/value is prohibited unless an explicit policy rule owns that approximation and result classification.

## 12. Backup transaction and exactly-once application

POLICY-BACKUP-001. `prepareBackup` validates one ready source contribution, exact path reference/incarnation, domain/policy/evaluator identities, root/work epoch and every target policy-record incarnation before result-visible mutation.

POLICY-BACKUP-002. The profile declares traversal direction, included node/edge/path/root/global records, per-occurrence perspective/value transform, update operation, ordering constraints and final completed-work publication.

POLICY-BACKUP-003. Backup may be associative/commutative, ordered/noncommutative, idempotent, monotone, lattice-like or custom. If concurrent order affects meaning, the profile declares whether order is semantically nondeterministic within stable invariants or supplies a deterministic sequencing identity/protocol; graph/progress does not guess.

POLICY-BACKUP-004. Each required path occurrence/update has a stale-safe identity such as transaction plus occurrence plus owner-field identity. The same graph node may legitimately receive multiple declared occurrence updates when it appears repeatedly on a path; those are distinct from accidental retry. Every required occurrence update applies exactly once, and retry/resumption observes an applied bitmap/sequence or equivalent proof rather than blindly repeating mutation.

POLICY-BACKUP-005. Per-record updates may become visible before the whole path transaction completes. The policy must remain valid under any declared prefix visibility and keep the in-flight reservation/transaction state distinguishable. A profile requiring all-or-nothing path visibility must provide and resource an atomic/commit-buffer protocol rather than assume one.

POLICY-BACKUP-006. Once the first irreversible result-visible update applies, the transaction becomes **must-drain**: stop/cancellation does not abandon the remaining updates. It completes through bounded device-owned progress or enters a typed fatal/quarantined state that prevents a valid-result claim.

POLICY-BACKUP-007. `completed_count` and completed contribution publication advance only after every required update and reservation conversion/release succeeds. Claimed, partially applied, failed, abandoned or stale-invalid transactions do not count as completed work.

POLICY-BACKUP-008. A stale root epoch before mutation follows the selected reuse/discard rule. After mutation begins, any allowed root-independent update must have been proven reusable; otherwise the transaction is blocked before mutation or treated as fatal rather than contaminating the new epoch.

POLICY-BACKUP-009. Update arithmetic is checked and follows declared overflow/invalid handling. Statistics cannot silently wrap/saturate, partially change representation or convert failure into a value.

POLICY-BACKUP-010. Backup failure terminates waiters, conserves reservations/resources and publishes bounded diagnostics. Recovery cannot mark a partially applied transaction complete or expose its result as valid.

POLICY-BACKUP-011. Every root-relative target publication validates the transaction's captured root epoch against the target record generation at its declared ordering point. Search Session commit and policy record generation must ensure an old transaction can update only its old/root-independent storage or be rejected before mutation; it cannot race reset/transform and write the new epoch's record.

## 13. Stopping, budgets and valid-partial policy facts

POLICY-STOP-001. Every policy budget declares unit, scope, initial/limit value, increment event, width, precision, comparison, satisfaction and exhaustion/wrap behavior. Examples may include fully completed backups, expansions, domain/evaluator work, proof state or a device-visible time/attention fact; none is universal.

POLICY-STOP-002. Policy stop facts are distinct from resource exhaustion, external cancellation/session control and CUDA-JS/runtime failure. The composed stop contract declares first-cause priority/identity and cannot overwrite an earlier authoritative cause.

POLICY-STOP-003. Stop lifecycle follows `running → stop-requested → draining → terminal`. After stop, no new resource-dependent policy admission occurs; ready/must-drain work completes or declared unready work is abandoned; terminal publication follows result-visible readiness.

POLICY-STOP-004. Concurrent stop observation may produce bounded schedule-dependent overshoot/drained completion counts. The profile declares bounds/accounting; cause ownership, graph validity, conservation, completion class and value validity remain invariant.

POLICY-STOP-005. A policy proof/convergence stop condition consumes only ready facts and declares whether it is monotone/retractable, its precision/tolerance and concurrency publication. An observation snapshot cannot create the proof/convergence fact by advancing search.

POLICY-STOP-006. Policy contributes whether currently ready records are eligible inputs to a complete/valid-partial/no-valid-result classification. The output contract owns the external result payload/publication and may require additional fields; policy does not publish ranked results by implication.

POLICY-STOP-007. External attention/budget changes are accepted only through a selected Search Session control contract and device-visible application point. A host polling/relaunch/read-decide-write loop cannot be required for stopping or search progress.

## 14. Root advance, root epochs and policy reuse

POLICY-REUSE-001. Every persistent policy record class declares one disposition across root changes: `retain`, `retain-if-key-valid`, `transform`, `reset` or `invalidate`, with exact conditions, ordering and owner lifecycle port.

POLICY-REUSE-002. Physical graph retention does not imply policy-record reuse. Root/path/perspective/actor/objective/budget/evaluator-dependent facts are retained only when the profile proves semantic validity under the new root/profile identities.

POLICY-REUSE-003. Root-epoch-scoped work/reservations/backups/stopping facts cannot publish into a newer epoch unless explicitly classified root-independent and compatible before mutation. Stale disposition remains explicit even if graph nodes survive.

POLICY-REUSE-004. Transform/reset/invalidate actions are finite, admitted and published through policy owner regions. Search Session coordinates commit; graph coordinates storage protection/reclamation; policy owns meaning.

POLICY-REUSE-005. Epoch/generation exhaustion never wraps. The selected session/resource policy requires restart/new incarnation/typed termination before aliasing stale work or records.

## 15. Lifecycle, concurrency, resources and failure

POLICY-LIFE-001. Policy lifecycle is `profile-normalized → resources-admitted → records-initialized → active → draining → terminal → released`, with typed failure/quarantine paths. Meaning-affecting policy changes require a new composed engine identity.

POLICY-LIFE-002. Every policy channel/record declares producer, consumers, payload, initial/ready/terminal states, required visibility, bounded progress, cancellation and cleanup. Consumers acquire exact readiness before use.

POLICY-LIFE-003. Policy contributes finite units/formulas/maxima for node/edge/path/root/global records, reservations, widening/admission state, source adapters, value/backup transactions and continuation buffers, stopping counters, randomness, diagnostics and per-concurrent-work scratch.

POLICY-LIFE-004. Resource contributions describe need; the finite-resource contract owns composed partitions/watermarks/admission/pressure. CUDA-JS owns generic allocation/atomic/operation realization. Policy cannot allocate hidden overflow, host spill, unplanned queue or emergency counter.

POLICY-LIFE-005. Applicable typed statuses/failures include `invalid-policy-profile`, `unsupported-domain-role`, `no-eligible-candidate`, `required-input-unavailable`, `invalid-policy-record`, `reservation-capacity`, `reservation-imbalance`, `invalid-action-candidate`, `unsupported-cycle-relation`, `value-schema-mismatch`, `invalid-value`, `statistics-overflow`, `duplicate-backup`, `backup-target-stale`, `partial-backup-fatal`, `policy-budget-satisfied`, `policy-budget-counter-exhausted`, `policy-generation-exhausted`, `cancelled` and `policy-internal-failure`. The profile classifies normal/pending/recoverable/stop/fatal meanings rather than treating every status as failure.

POLICY-LIFE-006. Failure disposition is owner-attributable. Policy does not reinterpret graph/resource/evaluator/runtime failures, and those owners do not convert a policy invalid value/accounting/backup failure into generic CUDA error.

POLICY-LIFE-007. Cancellation releases not-yet-mutating reservations/work, terminates waiters and follows must-drain for irreversible backup. Teardown reconciles every transaction, reservation, record region, counter, continuation and diagnostic before graph/CUDA-JS storage release.

POLICY-LIFE-008. This contract imposes no universal visit/value/reservation/budget width, vector dimension, branching factor, path depth, batch size, iteration count or first-domain/first-GPU limit. Each concrete profile selects sufficient finite ranges or rejects specialization.

## 16. Security, trust, persistence and cleanup

POLICY-SEC-001. Policy profiles, product parameters, evaluator/domain schemas, persisted records and external control values are untrusted until strict schema/version/range/digest/provenance/resource validation passes.

POLICY-SEC-002. Selection/value/backup ports receive least-authority bounded public views and owner regions only. Raw pointers, CUDA handles/symbols, private provider paths/types, credentials and arbitrary executable schemas are prohibited as policy data.

POLICY-SEC-003. Invalid/nonfinite values, malformed coordinates, out-of-range indices, stale references/epochs, overflow and digest mismatch fail closed before unauthorized mutation or result visibility.

POLICY-SEC-004. Persistence is optional. A persistent policy profile defines canonical encoding, domain/graph/evaluator/profile identity, integrity/crash recovery, migration/rollback, partial-backup recovery, reuse validity, retention and cleanup. In-memory atomics/bytes are not automatically durable.

POLICY-SEC-005. Third-party policy implementation/material requires exact revision, license, provenance and security review. A formula from literature or benchmark result is informative until adopted through accepted authority.

POLICY-CLEANUP-001. Every task/runtime record, reservation, action request, source wait, backup transaction, stop fact and retained policy artifact receives explicit release/retain/transform/reset/invalidate/quarantine disposition.

POLICY-CLEANUP-002. Accounting mismatch, duplicate/partial backup, invalid value propagation or uncertain reuse quarantines affected policy/result evidence. Recovery cannot repair by silently adjusting counters or discarding a visible prefix.

## 17. Compatibility, generated identity and Search IR

POLICY-COMPAT-001. Policy compatibility requires compatible policy-profile, domain/graph contracts, selected evaluator/source adapters and every owner-region/value/backup/stopping identity. Matching formula names or record sizes is insufficient.

POLICY-COMPAT-002. Search Composer/package/cache identity binds normalized selection/reservation/widening/value/backup/stopping/reuse semantics, layouts/capacities, restricted Device-JS inputs and dependent contract digests. CUDA-JS native ABI/artifact identity remains opaque and separately bound.

POLICY-COMPAT-003. Changing value perspective/schema, record meaning/unit, selection/admission, reservation effect, backup algebra/order/idempotence, stopping or reuse invalidates affected Search IR, generated packages, graph owner regions, evaluator adapters/caches, results/observations, persisted sessions and reference/native evidence.

POLICY-IR-001. Complete Search IR represents role handlers, record schemas/scopes/lifecycles, selection inputs/determinism/ties, reservations, action admission/widening, value source adapters/schema/perspective, cycle responses, backup transactions/algebra/order, stopping budgets/causes and root-advance reuse.

POLICY-IR-002. Search IR names semantic ports/owners/publication/resource/progress dependencies without exposing one formula, current JavaScript module, private model type, raw pointer, CUDA atomic/memory-order spelling, scheduler or host callback.

POLICY-IR-003. Normalization rejects unknown/duplicate owners, ambiguous units/perspective, missing role/fallback/failure, record overlap, insufficient ranges, nonterminating work, unowned counter, undeclared order dependence, invalid cause priority or missing cleanup.

POLICY-IR-004. Graph consumes only owner-region layouts/lifecycle and edge-admission identity; evaluator exposes only selected public outputs/readiness; output consumes declared ready policy facts; resource/progress/session consume contributions/transitions. No deep import or reverse semantic ownership is allowed.

POLICY-IR-005. Removing an evaluator, product or capability removes its source adapters, owner regions, channels, resources and generated code when unused. Universal policy semantics remain complete for conforming remaining profiles.

## 18. Conformance and authoritative oracles

The deterministic CUDA-free reference is authoritative for normalized policy semantics under a declared schedule/random-input profile. Native evidence later proves stable invariants under real concurrency/publication/progress for one exact CUDA-JS pair. A product result or throughput number cannot replace semantic oracles.

Later `ENGINE-IR-COMPOSER-01` and `ENGINE-REFERENCE-01` must consolidate at least:

| Case ID | Required falsifier |
|---|---|
| `policy-profile-strict-normalization` | Ambiguous role/record/value/backup/stop/reuse meaning is accepted. |
| `policy-transposition-edge-local-records` | Shared child causes incoming-edge policy records to alias. |
| `policy-reservation-not-completed` | In-flight effect counts as completed value/visit before backup. |
| `policy-reservation-failure-conservation` | Failed/cancelled work leaks or double-releases a reservation. |
| `policy-lazy-sampled-widening` | Open/large action space requires complete materialization or loses candidate identity. |
| `policy-admitted-proposal-ownership` | Proposal evaluator ownership is absorbed by policy/domain/graph or bypasses validation. |
| `policy-chance-custom-role` | A chance/no-actor/custom role is maximized or requires player assumptions. |
| `policy-vector-non-zero-sum-perspective` | Vector/many-objective backup requires scalar sign-flip redesign. |
| `policy-distributional-proof-value` | Distribution/proof value requires evaluator/output or graph contract redesign. |
| `policy-evaluator-absent-zero-residue` | Evaluator-free policy retains value/channel/workspace residue or cannot search. |
| `policy-evaluator-mode-matrix` | Proposal-only/evaluation-only/combined readiness/fallback is conflated. |
| `policy-path-relation-after-identity` | Cycle response runs before child identity/domain relation. |
| `policy-ordered-noncommutative-backup` | Backup order/perspective is silently treated commutative. |
| `policy-repeated-node-occurrence-backup` | Idempotence suppresses a legitimate second path-occurrence update to the same node, or retry duplicates one occurrence. |
| `policy-backup-prefix-must-drain` | Cancellation abandons a partially visible backup yet reports valid completion. |
| `policy-backup-idempotence` | Retry applies one target update twice. |
| `policy-statistics-overflow` | Counter/value wraps/saturates without declared outcome. |
| `policy-first-stop-cause-drain` | A later cause overwrites first cause or unready work affects partial result. |
| `policy-schedule-bounded-overshoot` | Concurrent stop breaks bounds/conservation/result class. |
| `policy-root-advance-reuse-classification` | Physical node retention implicitly preserves root-invalid policy state. |
| `policy-stale-epoch-publication` | Old-epoch backup contaminates new root-relative records. |
| `policy-no-ranked-output` | A valid policy is forced to publish/rank actions. |
| `policy-scheduler-semantic-parity` | Two progress mechanisms violate stable policy invariants under equivalent profiles. |
| `policy-product-extension-deletion` | Removing the first product and its evaluator/capabilities leaves solely owned residue. |
| `policy-oracle-sensitivity-backup` | Removing reservation distinction/idempotence/order does not fail the oracle. |

The minimum fixture set includes:

1. a scalar transposition policy with distinct incoming-edge statistics and concurrent reservations;
2. a many-objective vector policy with role-dependent, non-zero-sum perspective transforms;
3. an order-sensitive/noncommutative or proof-lattice backup policy;
4. a chance/custom-role stochastic policy with lazy/sampled widening;
5. evaluator-absent, proposal-only, evaluation-only and combined source profiles; and
6. a root-advance/stop sequence with stale work, partial backup must-drain, bounded overshoot and explicit reuse dispositions.

Native qualification additionally tests contended reservations/records, publication/acquire, backup idempotence/prefix visibility, stop races, cancellation, epoch changes, generated identity, resource conservation and teardown. Performance/search-quality comparisons freeze domain/graph/evaluator/resource/output/stopping profiles, workloads/seeds and policy semantics.

## 19. Examples and rationale (informative)

A two-player scalar policy may negate a child value, but a cooperative vector policy may permute or preserve coordinates instead. A chance role may sample by explicit weights. A proof search may use a lattice and monotone backup with no evaluator value. A continuous-action optimizer may request sampled proposals progressively. A policy may expose no ranking at all.

These examples do not select UCT/PUCT, a rollout, neural model, value width, tie rule, scheduler, output payload or product behavior.

## 20. Acceptance blockers and downstream invalidation

This proposal is decision-complete only when review finds no unresolved owner, record/accounting, role/selection, reservation, widening, value/perspective, cycle, backup, stopping, reuse, range, lifecycle, compatibility, security or cleanup ambiguity.

Acceptance remains blocked until:

1. normalized Search IR/schema represents every POLICY-IR obligation and rejects semantic ambiguity;
2. the deterministic reference executes all required fixtures/cases and backup oracle-sensitivity mutation;
3. evaluator, output, resource, progress and Search Session proposals reconcile source readiness, owner regions, results, pressure, stopping and reuse without duplicate authority/cycles;
4. product/evaluator/extension deletion checks pass;
5. the integrated semantic packet is reviewed on one exact revision at `ENGINE-CONTRACT-ACCEPTANCE-01`; and
6. required documentation/governance validation passes.

Production policy lowering remains prohibited until that acceptance. Native concurrency, scheduling, generated-artifact, performance and search-quality evidence qualify selected profiles later unless required to decide semantic meaning.

A change to policy ownership, record units/scopes, role handling, selection/admission, reservation, value/perspective/source conversion, cycle response, backup algebra/order/idempotence, stopping or reuse invalidates affected evaluator/output/resource/progress/session contracts, Search IR/schema/normalizers, graph owner layouts, reference/native evidence, generated packages, persisted sessions/caches and review approvals. The ENGINE-CONTRACT-01 integration spine records and reconciles invalidation before dependents continue.

Implementation, test, review, persistence, security, generated/JIT/ABI, performance/search-quality and cleanup work triggers the specialist doctrine routed from root `AGENTS.md` and `agent_files/AGENTS.md`.
