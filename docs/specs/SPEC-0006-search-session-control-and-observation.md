# SPEC-0006: Search Session Control, Reroot, and Observation

**Status:** Proposal

**Draft version:** 0.1.0

**Owner:** CUDA-MCGS Search Session and search-lifecycle semantics

**Consumers:** domain/policy/graph/resource/output contracts, Search IR, Search Composer, scheduler, CUDA-MCGS-to-CUDA-JS package, reference/native conformance, and domain/search products

This proposal defines universal semantics for a long-lived Search Session that may accept bounded external root updates while device-owned search continues and may publish bounded read-only observations without requiring search termination. It deliberately does **not** define ranked moves, best actions, top-k output, chess semantics, or one physical sideband mechanism.

## 1. Normative references

- [`../decisions/ADR-0018-universal-core-extension-product-layering.md`](../decisions/ADR-0018-universal-core-extension-product-layering.md) owns the universal-core / extension-substrate / product separation.
- [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) owns publication, graph incarnation, finite-resource and stop foundations.
- [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) owns the accepted foundational Search IR representation and reference semantics within its scope.
- [`SPEC-0003`](SPEC-0003-search-stage-and-extension-surface.md) proposes internal Search Stage and extension-surface semantics.
- [`SPEC-0004`](SPEC-0004-async-stage-channels.md) proposes internal nonblocking dataflow.
- CUDA-JS public contracts own generic long-lived-operation, memory/publication, sideband transport, completion, error and teardown mechanisms when such capabilities are accepted.

Accepted authority governs any conflict with this proposal.

## 2. Scope and non-goals

This specification family owns:

- Search Session identity and incarnation;
- current logical search root and root epoch;
- externally supplied root-update admission and commit semantics;
- old-epoch work disposition;
- contract-selected state/statistics reuse across reroot;
- separation of reroot from reclamation;
- generation-safe reclamation obligations that are visible at the session boundary;
- generic bounded Search Session observation publication;
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

## 3. Terms

### 3.1 Search Session

A **Search Session** is one logical lifetime of a composed CUDA-MCGS engine instance across zero or more root changes. It owns a session identity, session incarnation, finite resource plan, lifecycle state, current root contract state, and selected observation/control capabilities.

A long-lived Search Session may span many root epochs. Long-lived does not mean unbounded memory, immortal device resources, one kernel lifetime, or unlimited counter width.

### 3.2 Root

The **root** is the domain-contract-resolved graph/state anchor from which the selected search policy interprets root-relative work for the current epoch.

A concrete domain/product may derive the new root from a transition/action, an authoritative state/identity descriptor, an observation update, or another accepted namespaced root-update schema. The universal contract does not require one game-move representation.

### 3.3 Root epoch

A **root epoch** is a monotonically advancing semantic generation identifying one accepted root-relative search interval within a Search Session.

Root-relative work, paths, reservations, outputs, observations and product state MUST declare whether they are scoped to the current root epoch. An older epoch MUST NOT alias a later epoch through silent counter wrap.

### 3.4 Root update

A **root update** is an externally supplied Search Session input requesting a new accepted root. It is environment/domain input, not a host-selected internal search step.

### 3.5 Session observation

A **Session observation** is a bounded immutable publication derived from completely published search state for a selected observation schema. Examples may include evaluation summaries, proof state, frontier summaries, diagnostics, search-quality data, or product-defined ranked candidates. These examples do not make any one payload universal.

## 4. Device-owned progress boundary

SESSION-001. Accepting external root updates or publishing observations MUST NOT make the host responsible for selecting, scheduling, advancing, evaluating, backing up, or otherwise progressing internal active search.

SESSION-002. Search may continue correctly if no consumer reads an observation.

SESSION-003. Observation requests/reads MUST NOT be required to unlock internal search progress.

SESSION-004. A root update may change the environment/domain fact that defines the current search root. That external fact does not authorize a host micro-step loop for internal search progression.

SESSION-005. Internal Search Stages and Async Stage Channels remain device-owned mechanisms. External Search Session control/observation ports are a separate boundary and MUST NOT be represented as arbitrary internal extension callbacks.

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

## 6. Finite root-update pressure

A concrete long-lived profile MUST define what happens when a valid authoritative root cannot be established inside the current finite resource plan.

Permitted strategy families include, when explicitly specified and proven:

- reserved root-update admission capacity;
- bounded retirement/reclamation before commit while the old root remains authoritative;
- reuse of already-valid graph storage;
- rejection of the update with a typed pressure/exhaustion outcome while the current session remains valid;
- typed terminal/restart-required session outcome.

The profile MUST NOT use unplanned allocation, silently exceed the memory plan, destroy the old authoritative root before the new root is commit-ready, or partially apply the root update and then report rejection.

The resource contract owns which strategy is selected and how its capacity is budgeted. A domain/search product may strengthen the requirement, for example by requiring reserved ability to accept one authoritative next-state root.

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

SESSION-EPOCH-005. Scheduler nondeterminism may change how much old work completed before commit, but conservation, stale isolation and new-epoch correctness remain invariant.

## 9. Reuse classification

Reroot reuse is contract-selected. The universal framework MUST NOT assume that all node/edge/evaluator/product state survives a root change or that all of it resets.

Every persistent state family affected by reroot MUST classify itself into one of these semantic outcomes or an explicitly equivalent namespaced category:

- **root-independent retain** — remains valid unchanged across the root update;
- **retain-if-key-valid** — reusable only when its declared identity/context validity key remains satisfied;
- **transform** — survives only after a specified deterministic transformation;
- **reset** — storage may remain but semantic value is reinitialized for the new root epoch;
- **invalidate/retire** — must not be consumed after commit and becomes reclamation input;
- **product-defined** — namespaced product rule with the same explicit validity/lifecycle obligations.

At minimum, the owning graph/domain/policy/evaluator/output/extension contracts MUST classify material state such as:

- state-node identity and immutable state representation;
- transposition entries;
- evaluator outputs/model-cache entries;
- parent-edge statistics and reservations;
- node-local policy statistics;
- path/history/repetition state;
- widening/proposal continuation state;
- observation/publication state;
- extension-capability persistent state.

A product-specific reuse decision MUST NOT silently become universal core meaning.

## 10. Reroot and reclamation are separate transitions

The logical root switch and storage reclamation have different correctness and latency obligations.

SESSION-RECLAIM-001. A conforming profile MUST NOT require full-graph synchronous reclamation merely to commit a root update unless that behavior is explicitly selected, bounded and justified.

SESSION-RECLAIM-002. Reclamation must respect outstanding work, observations/borrows and other declared references whose lifetime can outlive the root commit.

SESSION-RECLAIM-003. Storage reuse changes generation/incarnation or proves equivalent stale-reference impossibility before a later object can occupy the same reusable identity space.

SESSION-RECLAIM-004. A simple safe profile may use an epoch/grace-period rule: commit the new root, dispose old-epoch work, then reclaim unreachable/retired storage once no protected old references remain. Other mechanisms may conform with equivalent proof.

SESSION-RECLAIM-005. Pressure may prioritize reclamation, but reclamation failure or insufficient reclaimable capacity produces a typed bounded outcome rather than hidden allocation.

## 11. Generic observation publication

Observation is an optional selected contract. A concrete engine may expose zero, one, or multiple namespaced observation schemas.

Each observation contract MUST define:

- schema identity/version and semantic owner;
- session/root/session-epoch scope;
- publication generation/incarnation;
- source facts and their required publication states;
- bounded payload shape/capacity;
- progress/freshness metadata;
- ordering and validity rules;
- whether the observation is periodic, demand-triggered, threshold-triggered, or another bounded policy;
- pressure/drop/coalescing behavior;
- compatibility and Search Image identity contribution.

SESSION-OBS-001. Publishing an observation MUST be read-only with respect to search-semantic state. It MUST NOT expand a node, materialize a child, advance selection, change visits/values/reservations, run evaluator work, alter policy state, or trigger root-update-specific mutation merely to satisfy observation.

Observation-local buffers, sequence counters and publication bookkeeping may mutate under the observation owner, but those mutations MUST NOT change the search result that would exist if no observation were requested.

SESSION-OBS-002. A consumer observes either an older complete snapshot or a newer complete snapshot, never a partially published payload.

SESSION-OBS-003. Root-relative observations include the root epoch. Consumers MUST be able to distinguish an older-root snapshot from the currently accepted root.

SESSION-OBS-004. Observation cadence MUST NOT change search semantics unless the selected product/policy contract explicitly makes observation a semantic input, in which case it is not merely an observation and must be modeled under its true owner.

SESSION-OBS-005. Terminal result publication remains distinct from live observation. Search need not terminate to publish or consume a live observation.

A ranked root-action list is one possible product/policy observation schema. It is not mandated by this universal specification.

## 12. Finite counters and stale-safe exhaustion

Session identity generations, root epochs, observation publication generations and reclamation generations are finite-width values chosen by the concrete profile.

The profile MUST define:

- width/range and reserved values;
- exhaustion threshold;
- whether rollover is prohibited, translated through a new session incarnation, or handled by another stale-safe protocol;
- failure/restart behavior;
- proof that an old work/reference/observation cannot alias a later incarnation.

Silent wraparound is non-conforming.

A profile MAY make practical exhaustion unreachable for the intended maximum session lifetime through a sufficiently wide type, but it still defines terminal behavior rather than relying on language/hardware overflow.

## 13. Cancellation, health, completion, and restart

Root updates, observations, cancellation and terminal completion are distinct session operations.

- Cancellation remains a published one-way request and MUST NOT be conflated with ordinary root update.
- A root update rejected under pressure does not automatically mean session cancellation unless the profile says so.
- A terminal CUDA/runtime/device-health failure is owned by the appropriate CUDA-JS/CUDA-MCGS boundary and may make further session operations unavailable.
- Restart creates a new session incarnation and invalidates prior session-scoped handles/publications according to the compatibility contract.

The terminal result reports the final session/root epoch and any typed root-update/pressure/observation failure material to result validity.

## 14. Search IR and package requirements

The complete Search IR MUST represent selected Search Session capabilities without embedding one product payload.

At minimum, when enabled, it MUST represent:

- session/root identity and finite epoch profile;
- selected root-update schema(s) and admission/pressure policy;
- root-relative work classes and stale disposition;
- reroot reuse classifications or references to their owning contracts;
- reclamation/generation policy;
- selected observation schema identities, capacities, scope and publication rules;
- finite counter/exhaustion behavior;
- cancellation/terminal interactions.

The CUDA-MCGS-to-CUDA-JS package MUST express only the generic mechanism requirements needed to realize those selected ports. CUDA-JS MUST NOT interpret root identity, reroot, chess moves, observation payloads, ranking or MCGS semantics.

The current CUDA-JS bounded terminal-wait execution profile is not by itself evidence for a long-lived Search Session with sideband control/observation. The consumer-neutral capability tracked in CUDA-JS issue #38 remains a compatibility dependency for native acceptance of that profile.

## 15. Conformance requirements

One consolidated Search Session capsule MUST include stable cases for applicable selected capabilities:

1. ordinary long-lived session without root update;
2. reroot to an already-known child/state;
3. reroot to an existing transposition identity;
4. replacement/new root requiring materialization;
5. invalid root-update schema/identity/action/descriptor rejected with no semantic side effect;
6. root-update epoch exhaustion rejected with no semantic side effect;
7. valid new-root admission under ordinary capacity;
8. valid new-root pressure under full/critical capacity with the selected typed outcome;
9. old-epoch work completing after reroot and failing to contaminate new-root state;
10. exact reservation/resource conservation for stale work;
11. reuse classification across graph, policy, evaluator/history and extension state;
12. reclamation deferred while protected old references remain;
13. generation-safe reclamation and slot/storage reuse;
14. many-epoch bounded-memory sequence;
15. observation of an unexpanded/unmaterialized search state without causing search mutation;
16. observation cadence invariance when observation is declared non-semantic;
17. old complete observation distinguishable after reroot;
18. observation-generation exhaustion and root-epoch exhaustion fail closed;
19. cancellation/root-update race disposition;
20. oracle sensitivity for epoch, generation, admission-before-mutation and observation-read-only guards.

CUDA-free reference evidence owns semantic ordering and invariants. Native CUDA evidence additionally owns actual publication scope, memory ordering, concurrent workers, root-update interaction, reclamation races, final resource identity and cleanup.

## 16. Bounded evidence and next native gate

The disposable `SESSION-001` experiment tracked in CUDA-MCGS issue #42 is bounded proposal evidence, not normative authority. It supports investigation of:

- root-epoch stale-work isolation;
- separation of reroot and reclamation;
- generation-safe slot reuse;
- read-only observation/ranking publication;
- admission-before-mutation ordering;
- finite new-root pressure as a real contract decision;
- counter exhaustion sensitivity.

Its synthetic policy reuses node/edge statistics across reroot and therefore does not establish a universal reuse rule.

Before production acceptance, a native `SESSION-002`-class experiment SHOULD exercise actual concurrent GPU workers with root-epoch publication, old-work drain/abandonment, read-only observation snapshots, generation-safe reclamation and full-arena root-update pressure while preserving device-owned progress.

## 17. Acceptance blockers

This proposal cannot become accepted until:

- domain, policy, evaluator, graph and resource contracts define their reroot reuse classifications;
- the complete Search IR representation for session/control/observation is normalized;
- root-update pressure/admission policy is specified for the first production profile;
- scheduler progress and old-epoch disposition are proven under actual concurrent execution;
- native CUDA publication/reclamation evidence exists for the selected Windows profile;
- the CUDA-MCGS-to-CUDA-JS package identifies an accepted generic long-lived sideband capability;
- product-specific observations such as chess ranked moves remain downstream and do not leak into universal acceptance criteria.