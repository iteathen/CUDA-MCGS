# ENGINE-REFERENCE-01 Critical Assessment and Focus-Branch Plan

**Status:** Proposal

**Assessment depth:** Critical

**Decision:** Build owner-local CUDA-free behavioral oracles over the frozen Composer packet, then reconcile them through bounded terminal and optional-profile integration slices

**Priority:** P0 prerequisite to integrated semantic acceptance and any production implementation

**Parent plan:** `CUDA-MCGS-V0/25`

**Integration owner:** CUDA-MCGS universal reference/conformance integration spine

**Frozen CUDA-MCGS input:** `main@b578de197cf92d8ba06ff236e3c2d1ca05278423` (tree `b0e9512f30e14532b24e6e90eae3d261a36ff0b4`)

**Frozen representation/composition evidence key:** `70aa92baf5ab1fee4bf4b85af4cf1e6d76eca3c51fc11ab4120d62a6f71529d9`

**Frozen CUDA-JS authority input:** clean protected `main@05008fb988558e909cb3802fa12a73d612e70bf0`, package `cuda-js@0.1.0-alpha.7`

**Started:** 2026-08-25T18:34:00-07:00

**Assessment completed:** 2026-08-25T18:39:37-07:00

## Objective, authority and minimum practice floor

Create the independent CUDA-free behavioral evidence required to decide the proposal semantic packet without building a second production runtime or a monolithic reference engine. Each semantic owner supplies a small deterministic transition oracle over its normalized public profile and declared schedule. The integration spine composes only public events, identities and allowed outcomes, then proves terminal and optional-profile behavior across materially different product-neutral instances.

Here, **independent oracle** means implementation-independent from future production lowering and CUDA mechanisms. It does not imply a second maintainer. Review remains author-side because the repository has one maintainer and the project owner explicitly waived an impossible independent-maintainer requirement.

The governing authority is the project-owner instruction, root and canonical agent rules, the accepted charter, ADR-0002, ADR-0003, ADR-0005, ADR-0018 through ADR-0020, ADR-0022, accepted SPEC-0001 and SPEC-0002, decision-complete proposal SPEC-0000 plus SPEC-0003 through SPEC-0013, the integrated `ENGINE-IR-COMPOSER-01` packet and the multi-GPU execution direction. ADR-0021 and the current proposal SPEC-0006/Search IR 0.2.0 root-control wording remain provenance but are superseded where they conflict with ADR-0022. CUDA-JS public contracts remain mechanism constraints only; this node uses no CUDA-JS runtime or native implementation.

The minimum practice floor is:

- consume exact normalized Search IR/Composer identities and reject a mismatched evidence key;
- preserve one semantic state owner and one lifecycle owner for every fact, mutation, reservation, publication and cleanup item;
- make every owner oracle replaceable and testable without importing another owner's internal state;
- exercise declared schedule/interleaving inputs and allowed outcome sets without pretending one serial trace is universal;
- include oracle-sensitivity mutations that fail when a decisive invariant is removed;
- preserve finite resources, admission-before-mutation, first-cause, ready-only publication, stale-incarnation rejection and complete terminal disposition;
- prove materially different domain, graph, policy, evaluator and output shapes plus exact optional deletion;
- keep initial root, minimum-work advance, general reroot, lazy directional attention and reclamation as distinct transitions; preserve compatible descendant work, supersede sibling-occurrence work lazily and forbid advance bookkeeping that implies traversal, transformation, reset, resize, reclassification, reclamation, eager cleanup, polling or a global multi-device barrier;
- run the accepted Search IR capsule, proposal Composer capsule, owning reference capsule and full repository validation at integration; and
- use exact-head author review, guarded integration and complete generated/branch/worktree cleanup.

## Frozen evidence and behavioral accounting

`IR-INTEGRATE-01` freezes 989 proposal requirements as 904 partial, 33 behavioral-pending and 52 native-deferred. This node may add behavioral evidence to partial/pending routes, but it may not promote native-deferred requirements or silently revise proposal meaning.

The coverage index assigns 393 requirements a primary `engine-reference-oracle` disposition. Forty-one are SPEC-0004 Channel requirements whose logical publication/ownership/progress oracle already lives in the owning Composer experiment. They remain Channel-owned evidence and will be gap-audited and reused, not copied into a second universal interpreter. The remaining 352 requirements route directly to `ENGINE-REFERENCE-01`:

| Owner | Contract | Direct requirements | Reference responsibility |
|---|---|---:|---|
| Framework lifecycle | SPEC-0000 | 15 | Cross-owner lifecycle, cleanup and optional persistence absence/selection |
| Optional Stage | SPEC-0003 | 8 | Stable checkpoint outcome, pending release and selected-only conformance |
| Optional Channel | SPEC-0004 | 41 existing owner evidence | Logical publication, claims/borrows, release/acquire meaning, progress and terminal cleanup |
| Optional Search Session | SPEC-0006 | 38 | Root transactions, attention publication, epochs, observation coordination, reclamation and lifecycle |
| Domain | SPEC-0007 | 47 | State identity/equality, history, actions, roles, roots and transitions |
| Policy | SPEC-0008 | 43 | Records, reservation, cycle response, backup, stop, reuse and cleanup |
| Optional evaluator | SPEC-0009 | 37 | Request/batch/cache/reuse/cleanup plus exact evaluator absence |
| Graph/storage | SPEC-0010 | 48 | Nodes, edges, paths, roots, protection/reclamation and cleanup |
| Finite resources | SPEC-0011 | 34 | Admission, pressure, exhaustion, lifecycle and cleanup |
| Device-owned progress | SPEC-0012 | 31 | Work readiness, fairness, no-progress, stop/closure and lifecycle |
| Output | SPEC-0013 | 51 | Terminal/live output, snapshot, publication, lifecycle and cleanup |
| **Direct total** |  | **352** | Owner-local oracles plus integrated behavioral evidence |

Accepted Search IR 0.1.0 and its 18-case capsule remain unchanged. The proposal Composer's 878 structural/composition cases remain required regressions. The Connect Four and persistent-session experiments remain downstream/product-specific evidence: they may be executed as separate regression capsules, but no universal oracle imports their internals or treats their ranking, scalar value, board, player or historical `reroot` vocabulary as authority.

## Critical assessment

### Behavioral boundary

A single executable “universal search engine” would centralize domain, graph, policy, evaluator, resource, progress, output and session meaning. It would be easy to demonstrate but hard to falsify independently, and future production could accidentally copy its arbitrary schedule or data layout. A generic workflow interpreter has the same defect under a different name.

The smallest sufficient total system is instead:

1. a semantic-neutral conformance harness that owns declared schedules, event traces, mutation execution and evidence identities but no search meaning;
2. one owner-local pure transition oracle per semantic contract;
3. immutable public events/facts between owners rather than deep state access;
4. a small terminal integration slice that proves a complete finite session-absent engine lifecycle early;
5. separate optional Session, Stage and Channel evidence that deletes completely when unselected; and
6. one final reconciliation that binds all case/evidence identities to the frozen Composer key.

An owner oracle may model its own finite state, but it cannot allocate another owner's resource, infer another owner's readiness, reinterpret another owner's failure, or choose a physical scheduler. The harness may enumerate or replay a bounded declared schedule, but it cannot become a runtime scheduler or assert that one event order is the only conforming order.

### Oracle shape and schedule semantics

Each case supplies a normalized owner profile, finite initial state, explicit inputs/random samples, a bounded schedule or partial order, and expected invariants or allowed terminal outcomes. An oracle returns immutable owner events and a terminal accounting record. Cross-owner integration feeds those public events to dependent oracles; it never reaches into private maps or mutates state on another owner's behalf.

Determinism means the same normalized profile, explicit random input and declared schedule produce the same reference outcome and evidence identity. Schedule-invariant contracts assert stable invariants or an allowed result set across materially different bounded schedules. The reference does not attempt unbounded state-space exploration, formal verification of all interleavings or native memory-model proof.

Every material invariant needs an oracle-sensitivity mutation. Removing generation checks, admission rollback, reservation distinction, readiness, first-cause, owner permission, backup order, snapshot consistency or terminal cleanup must fail at least one named case. A plausible output alone is not evidence.

### Fixture families and product neutrality

The common fixture matrix must contain at least these independent families, with each owner selecting only the fields it understands:

1. a variable-record deterministic transposing cyclic graph with collision verification, distinct incoming-edge records, structured terminal outcome and no evaluator, Session, Stage or Channel;
2. a stochastic history-sensitive observation-bearing domain with explicit random inputs, chance/custom roles, vector non-zero-sum policy values and a selected evaluator;
3. a no-player lazy/sampled large or continuous action domain with proposal-only production, bounded continuation and no mandatory ranking;
4. a proof/constraint/table-like evaluator and order-sensitive noncommutative backup with no neural/tensor assumptions; and
5. a root-advance/live-observation profile with stale work, protected borrows, generation-safe reclamation and independently versioned lazy attention.

No fixture owns “the” universal layout or public API. Removing chess, Connect Four, ranking, scalar value, evaluator, live observation, Session or the whole extension substrate must leave the remaining fixture and generated/reference evidence coherent.

### Root, advance, reroot, attention and hot-path restraint

ADR-0022 distinguishes initial root establishment, advance to an already ready realized successor, general reroot and attention. Advance publishes and adopts new authority with work bounded independently of retained graph size, preserves compatible selected-descendant work and lazily classifies sibling-occurrence work as `superseded-by-advance`. It cannot traverse, transform, copy, reset, resize, reclassify retained state, reclaim or eagerly clean up. Shared transposed nodes remain valid when another occurrence or retained owner reference reaches them.

Reroot owns the broader affected-owner prepare/commit/abort, admission, reuse/stale classification and reconciliation lifecycle. Attention remains an independent owner-scoped generation/publication/application event at a declared existing safe point. Attention cannot change root authority, traverse or relabel the graph, classify retained state, resize resources, trigger reclamation, require steady-state polling or synchronize every device.

Reference cleanup is event-driven and lazy where contracts permit: stale work receives an exact disposition, retired state stays protected until quiescent, and generation advances before reuse. The oracle may inspect final state to prove cleanup, but that inspection is test evidence and never implies a production hot-path traversal.

### Multi-GPU boundary

Universal owner oracles remain device-count neutral. The reference matrix must prove that a finite ordered set of opaque device slots can host independent semantic replicas without changing any replica's one-device meaning. Pre-ignition inputs/seeds/partitions are explicit; each replica reaches a truthful terminal disposition; final aggregation is exercised only through a declared downstream profile after all participating replicas are terminal.

This node does not define shared graphs, peer atomics, collectives, dynamic load balancing or a universal reduction rule. It does not claim multi-GPU support. Detailed multi-device execution-package/result semantics remain issue #105 after the single-device semantic/native sequence. The reference must only avoid assumptions that would foreclose a finite device set, and Session attention cases must not require a global device barrier.

### Organizational disposition

The new behavioral capsule belongs under a dedicated bounded experiment, `experiments/search-semantics-reference/`, created by the first implementation leaf with its README, fixtures, source ownership layout, ignored evidence path, experiment index entry and system-registry entry. It is not a production component and production code may not import it.

Owner modules are grouped by semantic contract, not as catch-all helpers. The harness owns only canonical schedule/event/evidence mechanics. The accepted `experiments/search-ir-reference/` remains immutable. SPEC-0004 Channel oracle corrections stay in `experiments/search-ir-composer-reference/`, their current owner, and are integrated by exact evidence identity rather than cross-experiment deep import.

### Strongest challenges

The strongest simplification is to extend the accepted Search IR 0.1.0 `ReferenceSearch` until it covers everything. Rejected: that reference intentionally embeds one narrow scalar synthetic instance and changing it would reopen accepted evidence while encouraging hidden product/schedule assumptions.

The strongest apparent acceleration is to copy Composer normalizers and Channel state machines into the new experiment. Rejected: the behavioral capsule consumes their public normalized outputs and exact evidence identities; duplication would create two authorities and drift.

The strongest overengineering risk is a general model checker, workflow DSL or production-shaped CPU runtime. Rejected: bounded explicit schedules, pure owner transitions and named mutations are sufficient for current semantic falsification. A later formal method needs a separate proven consumer and lifecycle.

The strongest underengineering risk is a collection of isolated happy-path unit tests. Rejected: terminal vertical slices, cross-owner lifecycle, pressure/cancellation/root races, optional deletion, multi-schedule parity and final cleanup are required before acceptance.

### Assessment disposition

Proceed sequentially through owner-sized leaves. Deliver an early complete terminal CUDA-free slice after the core owner oracles, then add optional Session/Stage/Channel evidence and final reconciliation. No production code, public facade or native mechanism starts in this node. Missing or contradictory meaning returns to the owning proposal and invalidates affected Composer/reference evidence rather than being guessed locally.

## Token and attention posture

This is critical cross-owner work. One semantic leaf is active at a time and retains reserve for negative fixtures, mutation sensitivity, exact-effect inspection, full owning validation and cleanup. Reuse the frozen normalized fixtures and evidence key rather than repeatedly inventorying all 989 requirements. Optional prose polish, exhaustive schedule breadth, native work, performance and public API design defer first. A new owner, profile vocabulary change, evidence-key mismatch, repeated repair without causal evidence, cross-owner state access, monolithic-harness pressure or inability to finish a leaf with its falsifiers triggers a split or replan.

## Dependency graph

```text
frozen IR/Composer evidence + accepted Search IR regression
                         |
                         v
                  REF-HARNESS-01
                         |
                         v
 REF-DOMAIN-01 -> REF-ROOT-CONTROL-01 -> REF-GRAPH-01
                                              |
                                              v
                    REF-POLICY-01 -> REF-EVALUATOR-01
                         |
                         v
 REF-RESOURCE-01 -> REF-PROGRESS-01 -> REF-OUTPUT-01
                         |
                         v
              REF-FRAMEWORK-LIFE-01
                         |
                         v
               REF-TERMINAL-SLICE-01
                         |
                         v
 REF-SESSION-01 -> REF-STAGE-01 -> REF-CHANNEL-EVIDENCE-01
                         |
                         v
                  REF-INTEGRATE-01
                         |
                         v
          ENGINE-CONTRACT-ACCEPTANCE-01
```

The arrows are evidence/integration order, not reverse semantic ownership. `REF-TERMINAL-SLICE-01` is the first complete CUDA-free developer-preview milestone and deliberately excludes optional live Session and extension behavior. It is useful reference/conformance evidence, not yet the usable GPU library.

## Focus-branch map

| Focus branch | Initial status | Owned outcome | Write surface/output | Falsifier |
|---|---|---|---|---|
| `REF-ASSESS-01` | completed assessment | Frozen behavioral accounting, oracle boundary, fixture matrix and dependency-sized map | This plan, status/forward routing and issue handoff | Reference implementation begins before the map, accepted evidence is reinterpreted or a missing semantic owner is hidden in the harness. |
| `REF-HARNESS-01` | completed and protected-integrated | Semantic-neutral bounded schedule/event/mutation/evidence harness and experiment skeleton | New `experiments/search-semantics-reference/` harness, manifest documentation, registry/index and focused cases | Harness owns search meaning, imports owner internals, becomes an unbounded scheduler/model checker or cannot reject a mismatched Composer key. |
| `REF-DOMAIN-01` | completed implementation | Domain transition oracle across deterministic, stochastic, history-sensitive, observation-bearing and lazy action families | Domain module/fixtures/cases and exact coverage references | Hidden host randomness, game/player/fixed-action assumptions, identity/history collision, partial publication or cancellation residue survives. |
| `REF-ROOT-CONTROL-01` | next; issue #113 | Reconcile SPEC-0006 and proposal Search IR so root, advance, reroot and attention have distinct owner effects, provenance, deletion and evidence identities before Graph meaning is extended | SPEC-0006; Session schema/normalizer/composition fixtures and cases; affected Composer/projection/reference evidence; current routing docs | Advance retains reroot-only machinery or graph-size work, transposed nodes are invalidated by occurrence supersession, attention changes authority, absent operations leave residue, or affected evidence remains keyed to superseded meaning. |
| `REF-GRAPH-01` | blocked on root-control reconciliation | Graph/storage oracle for claims, transpositions, occurrences, paths/cycles, protection, retirement and generation-safe reuse | Graph module/fixtures/cases and coverage references | Layout bytes become semantic authority, node and occurrence identity collapse, equal/unequal claims mismerge, path meaning truncates or stale/protected storage is reused. |
| `REF-POLICY-01` | blocked on Graph | Policy oracle for local records, reservation, cycle response, ordered/idempotent backup, stop and reuse | Policy module/fixtures/cases and coverage references | Scalar/zero-sum/ranking leaks in, reservations count as completion, occurrence/order semantics collapse or stale backup publishes. |
| `REF-EVALUATOR-01` | blocked on Domain/Graph/Policy | Optional evaluator oracle for mode matrix, requests, batches, cache, workspace, publication and reuse | Evaluator module/fixtures/cases and evaluator-absent deletion evidence | Evaluator absence leaves residue, proposals bypass Domain, batching needs host progress, cache keys alias or partial/stale results publish. |
| `REF-RESOURCE-01` | blocked on owner contributions | Finite logical ledger oracle for checked plan arithmetic, atomic admission, pressure facts, reserves, exhaustion and teardown | Resource module/fixtures/cases and coverage references | Resource chooses semantic victims, partial claims survive, retired/quarantined units disappear, terminal/cleanup reserve is consumed or growth/spill occurs. |
| `REF-PROGRESS-01` | blocked on work/resource owners | Scheduler-neutral readiness/fairness/no-progress/stop/closure oracle under multiple bounded schedules | Progress module/fixtures/cases and coverage references | Pending work blocks its producer, host action is needed, deadlock/quiescence/livelock conflate, must-drain starves or terminal publishes with live work. |
| `REF-OUTPUT-01` | blocked on ready source owners | Terminal/live output oracle for envelope, snapshots, publication/borrow, pressure, reuse and exact live absence | Output module/fixtures/cases and coverage references | Ranking/evaluator is mandatory, observation advances search, mixed/stale cuts claim coherence, borrowed slots reuse or partial work enters a valid result. |
| `REF-FRAMEWORK-LIFE-01` | blocked on core owner events | Cross-owner normalized-to-released lifecycle, first-failure unwind, cleanup and persistence absence/selection oracle | Framework lifecycle module/fixtures/cases and the 15 SPEC-0000 routes | Framework mutates owner facts, cleanup order cycles, partial publication survives failure, absence retains residue or final disposition is missing. |
| `REF-TERMINAL-SLICE-01` | blocked on core oracles | Complete finite `session-absent`, extension-absent CUDA-free engine slices across multiple fixture families and schedules | Integration fixtures/cases/results in the semantic reference experiment | Only one product/schedule works, an owner is bypassed, device progress needs the host, optional residue remains or terminal accounting/cleanup is incomplete. |
| `REF-SESSION-01` | blocked on terminal slice and reconciled root control | Optional Session oracle for initial root, advance, reroot, lazy attention, provenance, observations, cancellation and reclamation coordination | Session module/fixtures/cases and coverage references | Advance performs reroot/cleanup work, attention changes root or invalidates work, graph-size work/polling/global barrier is required, superseded work contaminates current authority or observation mutates search. |
| `REF-STAGE-01` | blocked on owner transitions | Optional Stage checkpoint/outcome oracle using owner-public facts only | Stage module/fixtures/cases and eight direct requirement routes | Stage owns core meaning, exposes partial mutation, retains workers/leases while pending or leaves residue when absent. |
| `REF-CHANNEL-EVIDENCE-01` | blocked on Stage | Gap-audit and complete the existing 41-requirement Channel logical oracle without duplicating it | Channel-owned Composer experiment cases/results plus exact evidence manifest consumed by integration | Channel evidence is copied, a worker blocks/spins, ownership/accounting is lost, release/acquire semantics are misstated or teardown leaks. |
| `REF-INTEGRATE-01` | blocked on all prior leaves | One exact behavioral packet, mutation matrix, multiple-instance/deletion reconciliation and handoff | Consolidated results, coverage dispositions, status/plan/issues and exact evidence key | Any required case/owner/leaf is absent, native-deferred evidence is promoted, product meaning leaks, multi-device neutrality is foreclosed or exact cleanup/evidence identities disagree. |

## Common execution contract

Before each material leaf, freeze the expected base/head and representation/composition evidence key, confirm dependencies and reload only the changed owning specifications. Every leaf must:

- define its state owner, public input/events, finite bounds, schedule assumptions, allowed outcomes, lifecycle and cleanup before mutation;
- add positive, boundary, invalid/stale, pressure/cancellation and oracle-sensitivity cases proportional to its contract;
- consume normalized public profiles rather than reconstructing or repairing schema meaning;
- keep explicit random inputs and schedule choices in fixtures and evidence identity;
- avoid deep imports, duplicate normalizers, product-first defaults and production-shaped APIs;
- inspect exact effects, run the focused capsule, `git diff --check` and `./scripts/verify-docs.sh`;
- record exact evidence identity and update requirement routes without changing normative text or native dispositions;
- use exact-head author review, protected guarded integration and target-tree verification; and
- retain no generated `build/`, package cache, process, device resource, worktree or untracked scratch.

Before publication, rollback is exact branch/worktree deletion after confirming no dependent state. After integration, correction uses a new explicit revision and invalidates dependent evidence; accepted evidence is not rewritten.

## REF-HARNESS-01 implementation result

The first dependency-ready leaf implements the bounded experiment skeleton and no owner-specific search semantics. The source is ordinary JavaScript and splits strict errors, canonical evidence, finite declared-schedule execution and mutation sensitivity into separate harness responsibilities. Owner transition functions receive frozen clones of only their own state, explicit input and explicitly depended-on immutable public facts. Owner namespaces cannot overlap; events cannot read unpublished or undeclared dependencies; facts cannot be foreign-owned, republished or mutated through the harness.

The full harness capsule passes 22/22 checked-in expected cases with no skips against the live 878/878 Composer evidence output. It binds representation/composition key `70aa92baf5ab1fee4bf4b85af4cf1e6d76eca3c51fc11ab4120d62a6f71529d9` and produces the source-keyed harness evidence recorded in `RESULTS.md`. One mutation case also passes independently through the focused execution path; that focused result is not used for the full claim.

This leaf changes no proposal requirement disposition: a neutral harness is infrastructure for later falsifiers, not Domain/Graph/Policy or integrated semantic evidence. Generated Composer/Search IR/harness `build/` evidence remains ignored and is removed after reconciliation. `REF-DOMAIN-01` becomes dependency-ready only after protected integration and cleanup of this leaf.

## REF-DOMAIN-01 implementation result

The Domain leaf adds an owner-local normalized-profile projection beside the Composer. The exporter reconstructs profiles only inside the Composer owner, proves their identities equal the exact 878-case Composer publication, and writes a deterministic ignored artifact with projection identity `612c72274be7986bcae53237be97b34e64d97a781eeb55e61964d11b942b9f47` over `69524` canonical bytes. The semantic experiment consumes that artifact only; it does not deep-import Composer internals, copy the normalizer or alter the frozen representation/composition evidence key.

The Domain oracle is a replaceable injected boundary for state/history identity and equality, roles, roots, actions, transitions, terminal outcomes, path relations, reuse classification and Domain-only profile teardown. Its three synthetic definitions separately exercise variable-encoding transpositions and deliberate collisions, stochastic carried history/chance/observation behavior with explicit randomness, and a no-player bounded-open continuous action producer. All publications are immutable. Capacity and cancellation return no partial semantic value; terminal roles cannot produce actions; stale action/cursor scope fails before transition; admitted producer execution remains external; profile teardown releases only Domain metadata/range references while leaving foreign resources unchanged; and fatal equal-state/key inconsistency carries a quarantine disposition. The module owns no graph allocation, policy, evaluator, resource admission, progress, external output, Session, CUDA or host progression mechanism.

The combined capsule passes 49/49 cases with no skips: the protected-integrated 22-case neutral harness plus 27 Domain cases. It derives the exact 47 direct SPEC-0007 `engine-reference-oracle`/`ENGINE-REFERENCE-01` requirements from the normative specification and public coverage classification, proves every requirement has a checked-in case, and records all 47 as executed only in the full run. The full source-keyed reference evidence is `70f5c454b7d31cd18374350fd75ebd52b961c828e515b0e6eabeefb8499b6402` over `30372` canonical bytes. A focused equality mutation passes independently while recording only its four actually executed mapped requirements.

This is bounded Domain behavioral evidence, not proposal acceptance or a complete reference engine. It does not promote native-deferred routes, imply a production API/runtime, or claim CUDA, performance, search quality or multi-GPU support. ADR-0022 subsequently exposed a root-control representation conflict, so `REF-ROOT-CONTROL-01` is the next dependency-ready leaf and Graph remains blocked until that reconciliation integrates.

## Acceptance, claim limits and handoff

`ENGINE-REFERENCE-01` completes only when:

- all 352 direct requirements and the 41 reused Channel requirements have exact behavioral evidence or an explicit owning correction;
- every one of the 33 behavioral-pending routes is resolved by direct case evidence;
- owner oracles remain independent, deterministic for declared inputs and replaceable without cross-owner state access;
- materially different domain/action/role/value/evaluator/output families and bounded schedules pass without product assumptions;
- terminal, pressure, cancellation, stale-work, publication, root/attention/reclamation and cleanup integration cases pass;
- evaluator, live output, Session, Stage, Channel, capability and product deletion leave exact zero solely owned residue;
- accepted Search IR 0.1.0 and frozen Composer evidence remain valid or are explicitly invalidated through their owner;
- all 52 native-deferred requirements remain native-deferred;
- exact results and cleanup hand one frozen semantic packet to `ENGINE-CONTRACT-ACCEPTANCE-01`; and
- no production, native, performance, platform-support, public-SDK or multi-GPU-support claim is made.

The complete terminal CUDA-free slice is an important usability milestone, but it is not the GPU library. A first usable GPU developer preview still requires atomic semantic acceptance, a production JavaScript/restricted Device-JS engine/package boundary and an exact native CUDA-JS compatible pair on contributed Linux/NVIDIA hardware.
