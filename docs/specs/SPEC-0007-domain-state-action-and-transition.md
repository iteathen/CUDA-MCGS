# SPEC-0007: Domain State, Action, and Transition Contract

**Status:** Accepted

**Version:** 0.1.0

**Accepted:** 2026-09-03 under #122 ENGINE-CONTRACT-ACCEPTANCE-01.

**Owner:** CUDA-MCGS universal domain semantics

**Product area / durable path:** universal MCGS semantic core / `docs/specs/`

**Consumers:** graph/storage, search policy, evaluator, result/observation, finite-resource, device-progress and Search Session contracts; Search IR; Search Composer; domain/product adapters; deterministic reference and native conformance

This specification defines the product-neutral domain brick that tells CUDA-MCGS what a state, action, transition, domain identity, relevant history, node role and terminal domain outcome mean. It defines semantic ports and finite-profile obligations, not a game API, storage layout, evaluator, policy, scheduler, CUDA ABI or production implementation.

## 1. Authority, identity, and applicability

Specification identity is `CUDA-MCGS-SPEC-0007@0.1.0`.

This specification applies when a finite CUDA-MCGS engine selects a domain profile. Every concrete engine selects exactly one domain profile identity; a composed multi-domain product must define a new domain profile that owns how its subdomains interact rather than switching undeclared domain meaning during active search.

Normative dependencies are:

- [`ADR-0002`](../decisions/ADR-0002-universal-contracts-specialized-engines.md) for universal contracts and finite specialized engines;
- [`ADR-0003`](../decisions/ADR-0003-device-resident-active-search.md) for post-ignition device closure;
- [`ADR-0005`](../decisions/ADR-0005-lego-design-hierarchy.md) for LEGO ownership and deletion tests;
- [`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md) for core/extension/product separation;
- [`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) for JavaScript/restricted Device-JS production ownership and CUDA-JS capability escalation;
- accepted [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) for publication, identity verification, graph/path ordering, finite resources, stopping and partial-result foundations; and
- accepted [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) for foundational normalized Search IR and deterministic reference meaning within its current scope.

Accepted [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) is informative adjacency for external root updates and domain observations. Product specifications, examples, experiments and implementations are evidence beneath this specification and cannot amend it by usage.

Accepted authority governs any conflict. This specification does not supersede another specification and is not production implementation authority.

## 2. Purpose, reading map, and required outcome

The required outcome is one domain-owned semantic boundary through which unrelated finite search domains can provide state, identity, action production, transition and outcome meaning without making graph storage, policy, evaluator, output or execution mechanisms interpret product internals.

Sections 3 through 15 are one coupled normative contract and must be read together. Sections 16 through 20 govern compatibility, conformance, evidence and change. A consumer implementing only one port must still honor identity, lifecycle, finite-resource and invalidation obligations from the other sections.

The contract succeeds only if a deterministic transposing graph, a stochastic history-sensitive observation-bearing domain and a lazy/sampled large-action domain fit by selecting different bounded profiles rather than changing foundational meaning.

## 3. LEGO ownership and design boundary

### 3.1 Exact owned invariant and state owner

The domain contract owns this invariant:

> For one immutable domain-profile identity, every published domain state, action, relevant-history value, node role, transition result and terminal domain outcome has finite declared meaning, validity, identity/equivalence and lifecycle; consumers can use that meaning only through declared semantic ports.

The selected domain profile is the authoritative owner of:

- domain-state meaning and validity;
- the exact domain facts participating in state identity/equality;
- action meaning, validity, identity scope and permitted production-source modes;
- transition semantics, including explicit stochastic or observation-bearing inputs/outputs;
- domain-relevant history representation and equivalence;
- node-role meaning and transition-selection authority;
- terminal/nonterminal classification and raw terminal domain outcomes; and
- domain-specific failure classifications and finite resource contributions.

### 3.2 Explicit non-ownership

The domain contract does not own:

- state-node allocation, references, generations, transposition table layout, paths, publication channels or reclamation, which belong to graph/storage;
- selection, exploration, reservations, widening, statistics, backup transforms, value perspective, stopping budgets or ranking, which belong to policy;
- model inputs, inference, proposal interpretation, caches or evaluator values, which belong to evaluator;
- terminal-result or live-observation payload selection/publication, which belongs to result/observation and Search Session owners;
- global memory partitioning, CUDA allocation, work scheduling/progress, compilation, launch, synchronization primitives or teardown, which belong to resource/progress/CUDA-JS owners;
- product UI/protocol concepts such as chess moves, players, boards, best moves or top-k; or
- extension attachment, permissions and namespaced capability payloads.

Storage may retain a selected representation of domain-owned values without owning their meaning. Policy may consume a terminal domain outcome without redefining it. Evaluator and product adapters may translate domain values only through separately declared contracts.

### 3.3 Public semantic ports and injected dependencies

The universal semantic ports are:

1. `validateRoot` — validate and normalize one finite root descriptor into initial domain state/history meaning before admission;
2. `classifyRole` — return the domain role and terminal classification of one valid state/history view;
3. `identityKey` and `equalState` — produce a lookup key and verify domain equality;
4. `validateAction`, `actionKey` and `equalAction` — validate/normalize a candidate action, produce an origin-scoped action key and verify semantic action equality;
5. optional `produceActions` — produce a finite intrinsic action batch plus continuation/completion state when the selected role has a domain-intrinsic source;
6. `applyTransition` — produce one finite transition result from a valid origin/action and explicit transition inputs;
7. `advanceHistory` — derive the next bounded domain-relevant history value when history is not wholly embedded in state;
8. `classifyPathRelation` — expose domain-owned repetition/history relation facts needed by a selected cycle policy; and
9. `terminalOutcome` — expose a finite raw domain outcome for a terminal state.

These are semantic ports, not mandatory runtime calls or binary boundaries. A Search Composer may specialize, fuse or eliminate them while preserving identical externally testable meaning and one visible owner.

Injected dependencies may include finite profile constants, explicit random samples/stream positions, selected product-domain schema values and preplanned scratch ranges. A selected evaluator/capability may publish candidate actions through its own contract; the domain validates their meaning without calling or owning that producer. A domain program must not discover a provider, read host-owned mutable state, allocate memory, call CUDA-JS-private APIs or mutate another owner's state.

### 3.4 Equivalence class, deletion tests and simplicity

Permitted domain profiles include fixed or variable state/action representations, deterministic or stochastic transitions, fully observable or observation-bearing state, embedded or path-carried relevant history, exhaustive/paged/sparse/lazy/sampled/custom action production, arbitrary finite role catalogues and scalar/vector/structured/absent terminal outcomes.

Deleting chess, Connect Four, ranked actions, scalar values, neural evaluation, all optional extensions or one physical scheduler leaves this contract coherent. Deleting the domain brick leaves graph/policy/evaluator mechanisms unable to assign meaning to states or transitions, which confirms the boundary is essential rather than product residue.

Splitting state identity from transition/history now would create two authorities for behavioral equivalence. Merging graph, policy or evaluator behavior into this contract would couple independent state, lifecycle and substitution boundaries. The selected brick is therefore the simplest sufficient total-system owner.

## 4. Terms and semantic model

### 4.1 Domain profile

A **domain profile** is an immutable, normalized, versioned selection of domain schemas, role catalogue, representation families, exact semantic options, limits, precision rules and restricted Device-JS program inputs. Every meaning-affecting field contributes to profile identity.

### 4.2 Domain state and state view

A **domain state** is the finite domain-owned value describing one search situation under a domain profile. A **state view** is the state plus any domain-relevant history projection required to determine identity, role, available transitions and terminal outcome.

A state view is not a graph node, path, policy record, evaluator cache entry, session epoch, CUDA pointer or host object. Multiple storage representations may denote equal state views only when the profile proves their semantic equivalence.

### 4.3 Domain identity

**Domain identity** is the profile-defined equivalence class of state views for which all domain-owned future behavior is interchangeable: role/terminal classification, valid action meaning, transition distributions, relevant-history evolution and terminal outcome.

An identity key narrows candidates. `equalState` is the authoritative collision verifier. Hash/key equality alone is never state identity.

### 4.4 Action

An **action** is a finite domain-owned transition selector valid within a declared origin identity and production incarnation. It need not mean a game move or be selected by an agent. Node-role semantics declare whether policy, chance sampling, deterministic domain logic, an external environment fact or another selected device-owned rule supplies the selector.

An **action source** produces candidate actions. A role may select a domain-intrinsic source, an admitted producer owned by a policy/evaluator/capability contract, or a declared composition of sources. Source ownership never bypasses domain validation/identity, and domain ownership never absorbs the producer's readiness, resource or failure semantics.

### 4.5 Relevant history

**Relevant history** is the finite exact domain summary required for future domain behavior that is not already embedded in state. It may include repetition, elapsed-horizon, observation/belief, irreversible-right, sequence or custom facts. Search-policy statistics and the active graph path are not domain history, although the domain may classify a relation using declared views of them.

### 4.6 Node role

A **node role** is a profile-declared finite semantic role describing how outgoing transitions are obtained and whether the state is terminal. Standard categories are `decision`, `chance`, `automatic`, `observation`, `terminal` and `custom`; profiles may omit categories or add namespaced roles with complete semantics.

`observation` here is a domain transition role and is distinct from a read-only Search Session observation.

### 4.7 Terminal domain outcome

A **terminal domain outcome** is an immutable finite domain fact explaining completion at a terminal state. Its payload may be structured, scalar, vector, distributional, proof-like or the declared unit/empty value. It is not inherently a reward, zero-sum value, winner, player-relative score, ranked action or public result. Policy owns conversion to backup semantics; output owns external publication.

### 4.8 Production and transition incarnations

An **action-production incarnation** scopes action identities, cursors and duplicate rules for one origin state view. A **transition incarnation** scopes one application attempt and its explicit stochastic/observation inputs. Incarnations are finite and cannot silently alias after generation exhaustion.

## 5. Domain-profile normalization and validity

DOMAIN-PROFILE-001. The profile must declare, with no unknown fields:

- stable profile ID and semantic version;
- state, action, history, role, terminal-outcome, transition-input and transition-output schemas;
- representation family, maximum encoded size, alignment, memory-space eligibility and canonical decoding rules for each selected value;
- identity-key schema, equality semantics and identity scope;
- role catalogue and permitted role transitions;
- permitted action-source and production modes, ordering/multiplicity semantics, cursor meaning and finite per-call bounds;
- transition mode, explicit randomness/observation inputs and numerical precision where applicable;
- finite resource contributions and scratch requirements;
- bounded work/cancellation-latency limits or a finite resumable protocol for each selected port;
- failure codes, diagnostic bounds and cancellation points;
- compatibility/persistence policy; and
- every meaning-affecting product-domain option.

DOMAIN-PROFILE-002. Missing required fields, unknown fields, duplicate stable identities, incompatible versions, impossible bounds, unrepresentable sizes/alignments, invalid role graphs, undeclared failure modes or arithmetic overflow reject the profile before ignition.

DOMAIN-PROFILE-003. The normalized profile is order-independent where ordering has no declared semantic meaning. Semantically ordered fields preserve their declared order. Defaults are explicit normalized values rather than implementation-dependent absence.

DOMAIN-PROFILE-004. Host validation and normalization may use ordinary Node.js. Active-search domain execution uses only restricted Device-JS/Search Program inputs submitted through public CUDA-JS contracts. This specification authorizes no C/C++, CUDA C++, native addon, FFI, hand-written PTX or embedded CUDA source in CUDA-MCGS.

DOMAIN-PROFILE-005. If the domain needs a generic GPU mechanism that cannot be expressed naturally through a public CUDA-JS contract with clear ownership, finite resources, synchronization, lifecycle and independent qualification, implementation stops for CUDA-JS capability classification. An awkward local encoding or native escape path is non-conforming.

DOMAIN-PROFILE-006. Every selected port invocation has a finite declared work/read/write/randomness bound and cancellation-observation bound. Work that cannot satisfy one invocation bound uses a finite resumable protocol with explicit continuation identity, resource accounting, cancellation and no partial semantic publication; unbounded loops or waits are prohibited.

## 6. State validity, identity and immutability

DOMAIN-STATE-001. Every admitted state view is valid under exactly one domain-profile identity and declared identity scope. Cross-profile equality is false unless a separately versioned migration/interoperability contract proves otherwise.

DOMAIN-STATE-002. State equality is an equivalence relation: reflexive, symmetric and transitive. Equal state views must have identical domain-owned observable behavior under identical explicit inputs. Unequal encodings may compare equal; identical bytes do not imply equality unless the selected profile declares canonical byte identity.

DOMAIN-STATE-003. `identityKey` must be deterministic for an equal state view under the declared arithmetic/precision profile. Equal views produce the same key. Unequal views may collide and must be distinguished by `equalState` before graph reuse.

DOMAIN-STATE-004. Every domain fact capable of changing node role, action validity/meaning, transition behavior/distribution, relevant-history evolution or terminal outcome participates in the state view's equality semantics. A profile may exclude a representational detail only by proving it cannot change those facts.

DOMAIN-STATE-005. Perspective, actor, turn, latent/belief, stochastic phase, observation, horizon and history facts are not universally mandatory fields. When one affects domain-owned behavior, the selected profile must include it in state/history identity rather than leave it implicit in a caller.

DOMAIN-STATE-006. A completely published state/history payload is immutable for its lifetime. A transition creates a new candidate state view or a declared equal view; it does not mutate a ready graph state's domain bytes in place.

DOMAIN-STATE-007. Identity/equality ports are pure with respect to search-semantic state. They cannot allocate, publish graph entries, advance random state, update policy/evaluator data or depend on observation/read cadence.

DOMAIN-STATE-008. The profile declares whether domain identity is scoped to one engine incarnation, one Search Session incarnation or a separately specified persistence namespace. The graph owner supplies storage/incarnation identity; the domain does not manufacture reusable graph references.

## 7. Relevant-history and path-relation semantics

DOMAIN-HISTORY-001. A profile selects exactly one history disposition:

- `embedded` — all relevant history is part of the state representation;
- `carried` — a separate bounded history value participates in the state view;
- `hybrid` — declared facts are split between state and a bounded history value; or
- `none` — future domain behavior is history-independent.

DOMAIN-HISTORY-002. A carried or hybrid history schema defines initial value, advance inputs/output, equality, identity participation, maximum size/depth or exact finite summarization rule, overflow/exhaustion outcome and reuse validity across roots/epochs.

DOMAIN-HISTORY-003. Silent truncation, wrap, hash-only equality or omission of behavior-relevant history is prohibited. If the selected finite profile cannot represent the required exact history, the operation returns typed `domain-history-exhausted` or the profile is rejected before ignition.

DOMAIN-HISTORY-004. `classifyPathRelation` consumes bounded domain identity/history projections supplied through a public graph path view; it does not inspect graph storage, references or policy records. It may report finite domain facts such as `same-domain-identity`, `repetition-equivalent`, `history-dependent-repeat`, `not-related` or a namespaced relation. It does not decide whether search cuts off, transforms a value, continues, fails or backs up; policy owns that response after graph resolves identity as required by SPEC-0001.

DOMAIN-HISTORY-005. A transposition is valid only when the domain state-view equality relation says future domain behavior is interchangeable. The graph must not infer this from base-state bytes while discarding relevant history.

DOMAIN-HISTORY-006. Root-advance reuse is classified later by graph/policy/evaluator/session contracts. The domain contributes whether state/history meaning remains valid, resettable, transformable or invalid under the new root; it does not reclaim or retain storage itself.

## 8. Node roles, terminal classification and outcomes

DOMAIN-ROLE-001. Each valid state view has exactly one completely published role key for one domain incarnation. A role key resolves to a normalized role descriptor declaring terminality, selector authority, permitted action-source/production modes, transition-input mode and permitted successor role set.

DOMAIN-ROLE-002. Role catalogues are finite but not universally fixed. A `custom` role must declare all fields required of a standard role; a name alone cannot defer meaning to product code or scheduler behavior.

DOMAIN-ROLE-003. A terminal state has no internally admissible outgoing transition. `terminalOutcome` returns one immutable valid outcome or a typed failure; it cannot run evaluator work or manufacture policy value/statistics.

DOMAIN-ROLE-004. A nonterminal exhaustive producer that completes with zero valid actions must yield a declared finite domain classification such as `dead-end-domain-outcome`, `invalid-domain-state` or a namespaced nonterminal condition that another accepted owner explicitly handles. It cannot silently masquerade as normal terminality or leave workers waiting for an impossible producer.

DOMAIN-ROLE-005. The domain may represent any number of actors, no actor, simultaneous actors, chance authority, environment authority or namespaced authority. No alternating-turn, two-player, adversarial or zero-sum assumption is permitted. During active modeled search, any chance/environment selector is produced from device-resident state and explicit inputs; a real external environment may affect a root only through the bounded Search Session input boundary and cannot become an internal host callback or progression dependency.

DOMAIN-ROLE-006. Terminal outcomes declare exact schema, perspective/coordinate system if any, precision and equality. A policy that requires a value transform must declare it outside this contract.

## 9. Action identity and production

DOMAIN-ACTION-001. Every admitted valid action has a finite normalized payload, semantic action key and origin scope. Action equality is an equivalence relation within that scope. Equal actions produce the same key; unequal actions may collide and must be distinguished by `equalAction` before edge/action reuse. Duplicate/multiplicity behavior is declared within the action-production incarnation; no caller may assume byte equality or global cross-state identity.

DOMAIN-ACTION-002. A profile selects one or more role-compatible source/production modes. An intrinsic domain source may implement:

- `exhaustive` — one finite call produces the complete action set;
- `paged` — finite batches plus a finite continuation cursor eventually produce a declared complete set;
- `sparse` — the producer visits a finite declared subset/index space with explicit completeness meaning;
- `lazy` — finite batches are produced on demand and may remain open under a declared bound/budget;
- `sampled` — explicit random inputs produce samples from a declared distribution without claiming enumeration completeness; or
- `custom` — a namespaced mode with equally complete identity, bound, progress and evidence rules.

Alternatively, `admitted-proposal` accepts a finite candidate batch published by a separately selected device-resident policy/evaluator/capability producer. A role may declare `combined` sources with exact ordering, deduplication/multiplicity, completion and pressure meaning. Neither mode permits host-produced internal search steps.

DOMAIN-ACTION-003. Every intrinsic `produceActions` call has a finite requested/result capacity and returns one status: `batch-ready-more`, `batch-ready-complete`, `no-action-complete`, `capacity-required`, `cancelled` or a typed domain failure. The status cannot require an unbounded spin or host callback. An admitted producer declares equivalent bounded publication/progress states in its own contract.

DOMAIN-ACTION-004. Intrinsic domain-production cursors are immutable finite values scoped to the origin state view, role, profile and production incarnation. Stale, foreign, exhausted or silently wrapped cursors are rejected. Such cursor state may be stored by graph/progress owners but remains domain-defined data; an admitted producer defines its own source cursor under its owning contract.

DOMAIN-ACTION-005. The profile declares ordering as semantic or non-semantic and multiplicity as `unique`, `repeatable-sample` or a namespaced exact rule. An exhaustive/paged `unique` producer must not emit duplicate semantic actions. Sample multiplicity does not by itself authorize graph or policy to merge observations/statistics.

DOMAIN-ACTION-006. Sampled or stochastic intrinsic production consumes explicit finite random input/stream position. The same state view, cursor and explicit random input under the same precision profile produces the same reference result. An admitted producer owns its declared randomness while still publishing finite domain-validatable candidates. Hidden process-global, host-timed or observation-cadence-dependent randomness is prohibited.

DOMAIN-ACTION-007. An action is admissible only for a matching valid origin state view and declared generation/incarnation unless the profile explicitly defines transferable action identity. Applying a stale or foreign action returns `invalid-action-scope` before search-semantic mutation.

DOMAIN-ACTION-008. Continuous or extremely large logical action spaces are conforming through bounded lazy/sampled/custom producers. The framework never requires materialization of the complete logical action space, but every concrete invocation and retained action record remains finite.

DOMAIN-ACTION-009. Every candidate from an admitted producer passes `validateAction` under the matching origin/profile/role before graph-edge admission. Invalid candidates produce a typed rejection; the producing evaluator/policy/capability contract declares whether rejection is an expected filtered candidate, recoverable producer outcome or compatibility failure. A candidate cannot be trusted because its source was selected or because its bytes fit the action schema.

DOMAIN-ACTION-010. An admitted producer owns candidate readiness, generation/distribution semantics, source cursor, resources, pressure, cancellation and failure. The domain owns only candidate validity, normalization, identity/equality and transition meaning. Composition must remain acyclic: the domain does not call the evaluator/capability, and the producer consumes the public domain action schema/validation contract.

DOMAIN-ACTION-011. The profile declares the compatible admitted-producer schema/version and candidate authority for each applicable role. The concrete producer selection contributes to composed Search IR/package identity, but its private type, module path or native realization does not enter universal domain vocabulary.

## 10. Transition semantics

DOMAIN-TRANSITION-001. `applyTransition` consumes a valid origin state view, a valid action/selector, explicit transition inputs and a reserved finite output range. It returns exactly one of:

- `success` with a complete candidate successor state, history update, successor-role inputs and declared transition metadata;
- `capacity-required` with no partial semantic publication;
- `cancelled` with no successor publication;
- `invalid-input`/`invalid-action-scope`; or
- a namespaced typed domain failure with bounded diagnostics.

DOMAIN-TRANSITION-002. A profile declares transition behavior as deterministic, explicit-outcome, sampled-stochastic, observation-bearing or namespaced custom meaning. Different roles may select different declared modes.

DOMAIN-TRANSITION-003. Stochastic transitions expose distribution/weight semantics, precision and random-input consumption sufficiently for reference and native profiles to test the same selected contract. They do not rely on host sampling or an undeclared global device RNG.

DOMAIN-TRANSITION-004. Observation-bearing transitions declare whether an observation is embedded in successor state, emitted as finite transition metadata, updates relevant history/belief state or is consumed by a declared domain port. Such observations are domain facts and do not become public Search Session observations automatically.

DOMAIN-TRANSITION-005. A successful transition result is complete before graph publication. Candidate successor bytes, history and metadata cannot be consumed as ready state merely because a producer reserved or began writing them.

DOMAIN-TRANSITION-006. Domain transition execution cannot allocate graph nodes/edges, publish transposition entries, mutate parent action statistics, run an evaluator, choose backup, emit a public result or schedule host work. Those effects occur through the consuming owners after successful domain output publication.

DOMAIN-TRANSITION-007. Aliasing the successor to an equal existing domain state is graph-owned after domain equality verification. The domain returns semantic values and comparison ports, not graph addresses or transposition decisions.

DOMAIN-TRANSITION-008. Numerical, random-distribution and decoding behavior declares exact rounding, overflow, invalid-value and determinism classes. Undefined implementation behavior, silent saturation or platform-dependent reinterpretation is prohibited.

## 11. Root descriptors and external environment facts

DOMAIN-ROOT-001. A root descriptor is a finite versioned external/product-domain input. `validateRoot` checks schema, profile, size/range, domain validity and exact initial history/role derivation before a graph or Search Session commits mutation.

DOMAIN-ROOT-002. Root validation cannot mutate accepted graph/session/policy/evaluator/output state. Rejection is typed and leaves the accepted root unchanged. Resource admission and commit ordering are owned by resource/session contracts after semantic validation.

DOMAIN-ROOT-003. A root may be supplied as a complete state/history descriptor, a product-defined authoritative identity plus resolvable data, an externally observed environment state or another accepted namespaced representation. The host may supply the external fact but cannot compute internal search intermediates to advance active search.

DOMAIN-ROOT-004. After ignition, bounded externally supplied domain/environment root or attention/control changes are mediated by an accepted Search Session contract. Ordinary transition, action production and history advancement remain device-owned.

## 12. Lifecycle, ordering, concurrency and publication

DOMAIN-LIFE-001. Domain lifecycle is `profile-normalized → resources-admitted → initialized → active → draining → terminal → released`, with typed failure paths. No domain operation runs before profile/resource admission or after release.

DOMAIN-LIFE-002. Profile data is immutable for one engine incarnation. A meaning-affecting profile change requires a new engine/package identity; active search cannot hot-swap domain semantics.

DOMAIN-LIFE-003. State/action/history/transition/outcome payload producers reserve an owning range, initialize privately, publish payload writes with the visibility required by the declared consumer set and only then publish ready state. Consumers acquire readiness before payload access, consistent with SPEC-0001.

DOMAIN-LIFE-004. The domain owns payload validity, not publication-channel storage or synchronization implementation. The Search IR must name every producer/consumer role and failure/cancellation transition; CUDA-JS owns qualified generic realization mechanisms.

DOMAIN-LIFE-005. Concurrent invocations over immutable ready inputs are permitted when they write disjoint reserved outputs/scratch or use a separately declared atomic/reduction owner. Undeclared shared mutable domain state is prohibited.

DOMAIN-LIFE-006. Cancellation is observed only at declared bounded points. A cancelled operation publishes no ready semantic payload from incomplete output, releases/returns its reservation according to the owning resource/graph contract and cannot leave a required consumer in unbounded wait.

DOMAIN-LIFE-007. Completion, failure, stop and teardown drain or abandon domain work through the owning progress/resource contracts. Host callbacks, polling/relaunch or read-decide-write loops cannot be required for domain progress.

## 13. Finite resources, pressure and failure

DOMAIN-RESOURCE-001. The domain profile contributes finite formulas/maxima, units, alignment and memory-space eligibility for every selected class, including as applicable:

- state and state-view bytes;
- action records, validation scratch and intrinsic action-batch output;
- history values and cursors;
- transition inputs, outputs and metadata;
- resumable port-continuation records when selected;
- identity/equality/role/outcome scratch;
- random-input bookkeeping;
- domain diagnostics; and
- per-invocation or per-concurrent-worker scratch.

DOMAIN-RESOURCE-002. Resource contributions describe need; they do not allocate or partition CUDA memory. The finite-resource contract composes them with graph/policy/evaluator/output/progress contributions before ignition.

DOMAIN-RESOURCE-003. Every size/count calculation uses checked arithmetic in declared units. Overflow, impossible alignment, insufficient representable identifiers/generations or capacity below a semantic minimum rejects the profile or produces a typed terminal failure before out-of-bounds access.

DOMAIN-RESOURCE-004. A port encountering insufficient output capacity returns `capacity-required` without publishing partial semantic output. A paged/lazy producer may continue only through its valid bounded cursor and an admitted later reservation; it cannot allocate hidden overflow storage.

DOMAIN-RESOURCE-005. Domain failures are classified at minimum as `invalid-profile`, `invalid-root`, `invalid-state`, `invalid-action-scope`, `invalid-cursor`, `incompatible-action-producer`, `domain-history-exhausted`, `capacity-required`, `unsupported-domain-case`, `cancelled` and `domain-internal-failure`, with namespaced refinements allowed.

DOMAIN-RESOURCE-006. The owning policy/resource/progress contracts decide whether a recoverable domain status retries, abandons work, stops with valid partial result or fails the engine. The domain cannot silently reinterpret a failure as a terminal outcome or policy value.

DOMAIN-RESOURCE-007. Diagnostics are finite, schema-bounded and non-authoritative. Diagnostic overflow follows declared drop/count/terminal behavior and cannot corrupt semantic payloads or expose raw native addresses/private provider data.

DOMAIN-RESOURCE-008. This contract imposes no universal state/action/history byte width, action count, role count, horizon, cursor width, identifier width, probability precision or first-domain/first-GPU limit. Each concrete finite profile selects sufficient representable bounds and records them in normalized identity; unsupported required ranges reject specialization rather than truncate meaning.

## 14. Recovery, cleanup and retained state

DOMAIN-CLEANUP-001. A failed or cancelled operation leaves no ready partial domain value. Reserved ranges, cursors, random-input reservations and scratch receive explicit release, quarantine or terminal disposition from their owning contracts.

DOMAIN-CLEANUP-002. Domain-profile teardown releases only domain-owned host metadata and references to admitted ranges. CUDA-JS owns generic CUDA resource and operation destruction; graph/resource owners control search-storage reclamation.

DOMAIN-CLEANUP-003. Retained state/history across root advance, restart or persistence requires an explicit compatibility/reuse classification. Absence of such a classification means invalidation, not optimistic reuse.

DOMAIN-CLEANUP-004. A fatal identity/equality inconsistency quarantines affected graph/evaluator/policy/output evidence for the engine incarnation. Recovery cannot continue by trusting potentially merged unequal states.

## 15. Security, trust and provenance

DOMAIN-SEC-001. Domain profiles, root descriptors, action/state encodings and program inputs are untrusted until strict schema, range, version, digest/provenance and resource validation passes.

DOMAIN-SEC-002. Domain ports expose semantic values and bounded references only. Raw native addresses, arbitrary symbol names, CUDA handles, compiler flags, filesystem paths, credentials and private provider artifacts are prohibited as ordinary domain data.

DOMAIN-SEC-003. Restricted Device-JS domain programs receive least-authority context and only their declared ranges/ports. A domain program cannot access another component's private memory merely because physical Search Program fusion occurs.

DOMAIN-SEC-004. Third-party domain implementation or generated content requires exact provenance, revision, license compatibility and trust disposition before integration. A schema declaration is not permission to execute unreviewed code.

DOMAIN-SEC-005. Invalid encodings, non-finite prohibited numbers, out-of-range lengths/indices, malformed variable records and digest/version mismatch fail closed before device execution or publication.

## 16. Compatibility, persistence and generated identity

DOMAIN-COMPAT-001. Domain-profile compatibility requires identical normalized semantic identity or an explicitly versioned compatibility relation. Matching names or wire shapes are insufficient.

DOMAIN-COMPAT-002. The normalized identity includes every field capable of changing state/action/history equality, role/terminal classification, transition distribution, precision, ordering/multiplicity, failure behavior, resource interpretation or externally visible domain outcome.

DOMAIN-COMPAT-003. Search Composer/package/cache identity additionally binds the domain-profile digest, restricted Device-JS source/input digests and all selected dependent contract identities. Native artifact/ABI identity remains CUDA-JS-owned and opaque to domain semantics.

DOMAIN-COMPAT-004. Changing identity/equality or relevant-history meaning invalidates affected transposition state, graph references, policy statistics, evaluator caches, output evidence, persisted sessions, generated packages and conformance evidence unless an explicit migration proves each remains valid.

DOMAIN-COMPAT-005. Persistence is optional. A persistent domain profile must define canonical durable encoding, namespace, version, integrity checks, migration/rollback, partial-write recovery, compatibility with profile/program identity and cleanup/retention. In-memory bytes are not automatically a durable format.

DOMAIN-COMPAT-006. Host and device representations may differ only through an exact versioned adapter whose round-trip/equivalence and range behavior is tested. Host JavaScript object identity is never domain identity.

## 17. Search IR, schema and downstream contract obligations

DOMAIN-IR-001. The complete Search IR must represent normalized domain profile identity, schemas/representation families, role catalogue, identity scope/key/equality contract, history disposition, permitted action-source/production modes, transition modes, terminal-outcome schema, precision/randomness rules, finite work/resumption/resource contributions, failures and persistence/reuse policy.

DOMAIN-IR-002. Search IR names semantic ports and producer/consumer roles but does not require unfused calls, a graph layout, host callback, CUDA symbol, pointer, scheduler or current adapter module.

DOMAIN-IR-003. The schema normalizer rejects unknown/duplicate fields and canonicalizes unordered collections. Canonical identity must change for every meaning-affecting mutation and remain stable for semantically order-insensitive reordering.

DOMAIN-IR-004. The graph contract must consume domain equality/key/history facts without interpreting domain bytes. The policy contract must consume roles/outcomes/path-relation facts without owning them. Evaluator/output/session/resource/progress contracts must declare their domain inputs and reuse/invalidation dependencies.

DOMAIN-IR-005. Extension or product schemas may add namespaced domain data only through declared capability/product ownership. Removing the capability/product removes that data without changing the universal domain contract.

## 18. Conformance and authoritative oracles

The deterministic CUDA-free reference is the authoritative semantic oracle for normalized finite fixtures. Native evidence later proves the same contract under actual publication, concurrency, memory and generated-code behavior. Neither an implementation nor a product example can replace the oracle.

At minimum, later `ENGINE-IR-COMPOSER-01` and `ENGINE-REFERENCE-01` must consolidate these cases:

| Case ID | Required falsifier |
|---|---|
| `domain-profile-strict-normalization` | Unknown, duplicate, impossible or meaning-ambiguous profile data is accepted. |
| `domain-identity-collision-verification` | Equal identity keys cause unequal state views to merge. |
| `domain-identity-encoding-independent` | Equal semantics require identical representation bytes without profile authority. |
| `domain-history-sensitive-transposition` | Two base states with behavior-relevant different histories alias. |
| `domain-history-exhaustion-fails-closed` | Finite history silently truncates, wraps or continues. |
| `domain-action-exhaustive-paged` | Multi-batch action production loses, duplicates or reorders semantic actions contrary to its declaration. |
| `domain-action-lazy-sampled` | A large/open action space requires complete materialization or hidden randomness. |
| `domain-action-admitted-proposal` | A proposal-only evaluator/capability requires domain ownership of producer readiness/resources or bypasses domain validation. |
| `domain-action-scope-stale` | A foreign/stale action or cursor is applied. |
| `domain-stochastic-transition-explicit-input` | The same explicit stochastic input yields oracle-inconsistent behavior or relies on host sampling. |
| `domain-observation-bearing-transition` | A domain observation becomes a mandatory public/session observation or is omitted from identity when behavior-relevant. |
| `domain-custom-role-no-player` | A no-player/custom-authority domain requires game/player redesign. |
| `domain-terminal-structured-outcome` | Terminal meaning is forced into a scalar/zero-sum/ranking value. |
| `domain-zero-action-classification` | Exhaustive zero-action nonterminal work waits forever or becomes silently terminal. |
| `domain-publication-immutability` | A ready domain payload mutates or is consumed before ready/acquire. |
| `domain-capacity-required-no-partial` | Insufficient capacity exposes a partial state/action/transition as ready. |
| `domain-bounded-port-resumption` | A long domain operation requires an unbounded invocation/wait or exposes an incomplete resumed value. |
| `domain-cancellation-no-orphan` | Cancellation leaves a ready partial payload, leaked reservation or required unbounded waiter. |
| `domain-product-extension-deletion` | Removing chess/ranking/all capabilities leaves universal domain residue or missing meaning. |
| `domain-oracle-sensitivity-equality` | Mutating equality/history participation does not fail the reference result. |

The minimum second-instance fixture set is:

1. a deterministic variable-record transposing cyclic graph with key collisions and a structured terminal outcome;
2. a stochastic, history-sensitive, observation-bearing domain with chance/custom roles and explicit random inputs; and
3. a lazy or sampled large/continuous-action domain with no player and no mandatory evaluator or ranked output.

Native qualification additionally tests concurrent purity, publication/acquire, bounds, cancellation, generated identity, exact compatible CUDA-JS pair and teardown. Performance evidence compares identical normalized domain/policy/evaluator/resource/output/stopping profiles and may not redefine semantics to improve throughput.

## 19. Examples and rationale (informative)

Chess may encode side-to-move, castling rights, en-passant and repetition-relevant facts in state/history identity, but those fields are not universal. A planning domain may use one actor or none, sparse actions and vector terminal constraints. A belief-search domain may carry a bounded exact belief/history summary and emit observation-bearing transition metadata. A continuous-control domain may sample actions from an explicit distribution without claiming exhaustive enumeration.

These examples illustrate profile variation only. They do not select representations, widths, policies, evaluator shapes or public output schemas.

## 20. Acceptance blockers and downstream invalidation

Acceptance review under #122 found no unresolved owner, identity/equality, history, action-production, transition, role/outcome, range, lifecycle, failure, compatibility, security or cleanup ambiguity.

Acceptance under #122 required:

1. the normalized Search IR/schema represents every DOMAIN-IR obligation and rejects semantic ambiguity;
2. the consolidated deterministic reference executes all required cases, including the three materially different fixtures and oracle-sensitivity mutation;
3. graph, policy, evaluator, output, resource, progress and Search Session proposals reconcile their dependencies without duplicate ownership or a cycle;
4. product and extension deletion checks pass;
5. the integrated semantic packet is reviewed on one exact revision at `ENGINE-CONTRACT-ACCEPTANCE-01`; and
6. required documentation/governance validation passes.

Production domain lowering remains prohibited until that acceptance. Native publication/concurrency and performance qualify later concrete profiles unless semantic evidence shows they are required to decide this contract.

A change to this specification's owner, identity/equality, history participation, action/transition meaning, role/outcome meaning, range/precision, lifecycle/failure, normalized identity or conformance oracle invalidates affected downstream specifications, Search IR/schema, normalizers, reference/native evidence, generated Search Images/packages, compatibility manifests, graph state, caches, persisted sessions and review approvals. The parent ENGINE-CONTRACT-01 integration spine must record and reconcile the invalidation before dependent work continues.

Implementation, test, review, persistence, security, generated/JIT/ABI, performance and cleanup work triggers the corresponding specialist doctrine routed from root `AGENTS.md` and `agent_files/AGENTS.md`.


> **#122 acceptance record (2026-09-03):** The semantic/reference conditions in this specification were discharged by the exact #36 CUDA-free packet at `0cd3dafdbfa683048b0a0f39de21a671fd9ef841`, the #193 CUDA-JS ownership-boundary audit, and the atomic #122 acceptance review. Any clause that explicitly requires native compatible-pair, physical memory-ordering/concurrency, performance, platform-support, or downstream product evidence remains a separate deferred qualification gate and is not claimed by semantic acceptance.
