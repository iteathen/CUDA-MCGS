# SPEC-0011: Finite Search-Resource Composition and Exhaustion

**Status:** Accepted

**Version:** 0.1.0

**Accepted:** 2026-09-03 under #122 ENGINE-CONTRACT-ACCEPTANCE-01.

**Owner:** CUDA-MCGS universal finite search-resource semantics

**Product area / durable path:** universal MCGS semantic core / `docs/specs/`

**Consumers:** device-progress and Search Session contracts; Search IR; Search Composer; every selected semantic/product/capability contributor; deterministic reference and native conformance

This specification defines the product-neutral resource brick that normalizes selected owner contributions into one finite pre-ignition plan and owns admission, partitions/reserves, accounting, watermarks, pressure and exhaustion meaning. It does not allocate CUDA memory, choose graph/cache eviction, select search/scheduling policy, permit host spill or encode a first GPU's limits.

## 1. Authority, identity, and applicability

Specification identity is `CUDA-MCGS-SPEC-0011@0.1.0`.

Every concrete CUDA-MCGS engine has exactly one immutable normalized search-resource profile before ignition. It includes every selected domain, graph, policy, evaluator, output, progress, session, extension, product, diagnostic and safety contribution. An absent owner contributes exact zero solely owned resource state.

Normative dependencies are:

- [`ADR-0002`](../decisions/ADR-0002-universal-contracts-specialized-engines.md) for finite specialization;
- [`ADR-0003`](../decisions/ADR-0003-device-resident-active-search.md) for device-resident active search;
- [`ADR-0005`](../decisions/ADR-0005-lego-design-hierarchy.md) for one-owner boundaries;
- [`ADR-0018`](../decisions/ADR-0018-universal-core-extension-product-layering.md) for core/extension/product separation;
- [`ADR-0019`](../decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md) for the maintained-source and CUDA-JS escalation boundary;
- accepted [`SPEC-0001`](SPEC-0001-device-search-publication-and-resources.md) for immutable capacities, accounting conservation, typed exhaustion, stop and partial-result foundations;
- accepted [`SPEC-0002`](SPEC-0002-search-ir-and-reference-semantics.md) for foundational normalized Search IR/reference meaning;
- accepted [`SPEC-0007`](SPEC-0007-domain-state-action-and-transition.md), [`SPEC-0008`](SPEC-0008-search-policy-and-backup.md), [`SPEC-0009`](SPEC-0009-evaluator-contract.md), [`SPEC-0010`](SPEC-0010-graph-storage-and-reclamation.md) and [`SPEC-0013`](SPEC-0013-result-and-observation-publication.md) for selected owner contributions and owner-specific pressure dispositions.

Accepted [`SPEC-0006`](SPEC-0006-search-session-control-and-observation.md) is informative adjacency for reroot-admission reserve and restart. CUDA-JS resource/allocation contracts are peer mechanism dependencies selected later, not resource-policy owners.

Accepted authority governs conflicts. This specification neither supersedes another specification nor authorizes production implementation.

## 2. Purpose, reading map, and required outcome

The required outcome is one resource-owned semantic boundary through which independent contributors can declare finite needs and receive exact atomic reservations/pressure/exhaustion facts without resource accounting interpreting their domain/search semantics or CUDA-JS interpreting MCGS.

Sections 3 through 12 form one coupled normative contract. Sections 13 through 16 govern identity, conformance and invalidation. Consumers must read contribution, compound-admission, conservation, pressure, generation and teardown rules together.

The contract succeeds only if fixed/variable arenas, paths/queues/channels, evaluator assets/workspaces, caches, output/observation, reroot-admission reserve, diagnostics and selected capability/product resources compose under different finite profiles while advance requires no allocation/resize admission; if absent owners vanish; and if full/fragmented/counter-exhausted states have typed outcomes without hidden growth or semantic policy leakage.

## 3. LEGO ownership and design boundary

### 3.1 Exact owned invariant and state owner

The resource contract owns this invariant:

> Before ignition, every selected resource class has one finite normalized capacity, unit, owner, scope, lifetime, accounting and exhaustion contract; every successful admission is contained in that plan and conserved through exactly one disposition, every failed admission consumes no live capacity, and no owner acquires hidden or overlapping capacity.

The resource profile owns:

- contribution schemas, units, formulas, minima/maxima and composition;
- logical resource classes, pools/partitions, reserves and safe aliasing proofs;
- atomic single/compound admission, leases/ranges and release accounting;
- capacity/claimed/published/retired/quarantined/available/high-water ledgers;
- watermark/pressure/exhaustion state and first resource cause;
- counter/index/generation range exhaustion disposition;
- plan-to-public-CUDA-JS requirement projection and pre-ignition feasibility; and
- resource-profile identity, diagnostics, cleanup and retained-ledger evidence.

### 3.2 Explicit non-ownership

The resource contract does not own:

- domain/policy/evaluator/output/product semantic work or fallback;
- graph object liveness, victim selection, quiescence or reclamation eligibility;
- evaluator cache victim/quality policy, policy widening/stopping, output drop/coalescing or Search Session update acceptance meaning;
- device work scheduling/fairness/deadlock or physical launch topology;
- CUDA allocation/provider, address, pointer, virtual/managed/pinned memory, copy, atomic or context mechanism; or
- host memory spill, disk/network persistence, billing/quota or operating-system policy.

Pressure is a typed fact. The owning contributor declares whether it retries, reclaims/evicts/drops, reduces optional work, stops valid-partial, restarts or fails. Resource composition never invents that semantic response.

### 3.3 Public semantic ports and injected dependencies

The universal resource ports are:

1. `normalizeContribution` — validate one selected owner's finite resource declaration;
2. `composeResourcePlan` — build pools/partitions/reserves/layout ranges with checked arithmetic and no overlap;
3. `admitEngineResources` — prove the complete plan feasible before ignition and bind opaque public CUDA-JS resources;
4. `reserveResource` / `reserveCompound` — atomically acquire one or multiple declared class quantities;
5. `publishResourceUse` — convert a claim into owner-visible live/published use;
6. `releaseResource`, `retireResource` and `reclaimResourceAccounting` — conserve one lease through lifecycle;
7. `observeResourceState` — expose bounded device-visible capacity/ledger/watermark facts; and
8. `terminateResourceProfile` — freeze final ledgers and release through owner/CUDA-JS lifecycle order.

These are semantic ports, not mandatory functions, allocators, kernels or ABI symbols. Search Composer may fuse/specialize/eliminate them while preserving accounting and ownership.

Injected dependencies are normalized owner contributions, selected hardware/profile feasibility facts and opaque CUDA-JS allocation/operation capabilities. Resource code cannot inspect private owner data, choose owner victims/work, dereference raw host/CUDA pointers, call a host decision callback or use CUDA-JS-private mechanisms.

### 3.4 Equivalence class, deletion tests and simplicity

Permitted plans include fixed records, byte arenas, segmented pools, queues/rings, counters/bitmaps, per-worker/path/batch scratch, immutable artifacts, caches, output slots and selected shared physical pools with proven logical partitions/lifetimes. Physical realization remains separate.

Deleting chess, an evaluator, live observation, optional capabilities, reclamation or one scheduler removes solely owned contributions/partitions/ledgers/code. Deleting the resource brick leaves no single owner able to prove total capacity, compound admission or conservation, confirming the boundary is essential.

Merging resource policy into every contributor would duplicate total-plan/admission truth; merging semantic eviction/stop policy into resource would centralize unrelated decisions. This brick is the simplest sufficient owner.

## 4. Terms and accounting model

A **resource class** is one normalized finite unit family with stable ID/version, semantic contributor/consumer set, scope, lifetime and exhaustion identity. Examples may use bytes, slots, items, elements, references, leases, permits or ticks; names alone do not define units.

A **contribution** is an owner-declared formula/minimum/maximum/alignment/lifetime/pressure contract for selected semantics. A **pool** is a logical capacity backing one or more disjoint partitions/classes. A **reserve** is capacity unavailable to ordinary admission for an explicit safety/lifecycle purpose.

A **lease** is a stale-safe identity for a successful reservation of exact units/range. A **compound lease** is one all-or-none admission across multiple classes.

For each applicable class the ledger distinguishes immutable `capacity`, current `claimed`, `published`, `retired_unreclaimed`, `quarantined`, available units, cumulative failed admissions/releases, and high-water. Specialized impossible zero categories may vanish without ambiguity.

## 5. Contribution normalization and plan composition

RESOURCE-PROFILE-001. The profile declares, with no unknown fields, every selected class/pool/partition/reserve, owner, unit, scope/lifetime, formula/range/alignment, memory-space eligibility, concurrency multiplicity, admission group, accounting, watermarks, exhaustion/cancellation, cleanup and compatibility identity.

RESOURCE-PROFILE-002. Unknown/duplicate class IDs, ambiguous units, owner conflict, overlapping ranges, impossible minimum/maximum, insufficient width/alignment, cyclic dependency, unbounded multiplicity, hidden fallback, missing terminal/safety reserve or arithmetic overflow rejects specialization before ignition.

RESOURCE-PROFILE-003. Meaning-insensitive contribution/class collections normalize canonically; layout/order affecting offsets, contention or semantics remains explicit. Every resource-affecting input contributes to profile identity.

RESOURCE-PROFILE-004. All size/count/offset/stride/alignment/multiplicity formulas use checked exact arithmetic with declared units and upper bounds. Narrowing, wrap, negative capacity, implicit unit conversion and floating ambiguity are prohibited.

RESOURCE-PROFILE-005. An owner contribution identifies whether a quantity is fixed, per selected object, per concurrent work, per maximum live state, per batch/path/root/session, optional reserve or another exact formula. Average/expected use cannot justify safety capacity.

RESOURCE-PROFILE-006. Host normalization/composition may use ordinary Node.js. Active admissions/accounting use restricted Device-JS/Search Program inputs through public CUDA-JS contracts. CUDA-MCGS may not implement allocation/accounting with native/CUDA code, direct FFI, hand PTX or private CUDA-JS APIs.

RESOURCE-PROFILE-007. A naturally generic GPU allocation/arena/atomic/observation/lifecycle need not expressible through public CUDA-JS with clear ownership, finite bounds, synchronization, cleanup and qualification stops for CUDA-JS capability classification. No hidden host/native workaround is permitted.

RESOURCE-COMPOSE-001. Composition includes every selected contributor and verifies absent contributors add zero solely owned class, bytes, alignment padding, counters, branches and synchronization.

RESOURCE-COMPOSE-002. Shared physical backing never merges logical accounting. Aliasing/reuse requires proven non-overlapping lifetimes, compatible memory-space/alignment/access and cleanup ordering; otherwise ranges are disjoint.

RESOURCE-COMPOSE-003. Alignment/padding/provider metadata and runtime safety headroom are explicit plan costs. Summing payload bytes alone is not feasibility proof.

RESOURCE-COMPOSE-004. Variable-size arenas declare total bytes, object minima/maxima, allocation granularity, fragmentation/fit semantics and largest guaranteed request. Free total bytes do not imply a particular request fits.

RESOURCE-COMPOSE-005. Every selected queue/channel/request/output ring declares items and payload/storage/control overhead plus producer/consumer concurrency; queue entries cannot point to undeclared backing payload.

RESOURCE-COMPOSE-006. Every identifier/index/offset/generation/counter width covers the selected capacity/lifetime/event maximum plus invalid/sentinel states. Resource capacity and representable identity are jointly feasible.

RESOURCE-COMPOSE-007. Plan dependencies are acyclic: backing pool precedes partitions, partitions precede leases, and teardown reverses dependencies. One class cannot require its own successful admission to represent admission failure.

RESOURCE-COMPOSE-008. The plan projects only consumer-neutral size/alignment/memory-space/access/lifecycle requirements to public CUDA-JS. It does not expose MCGS node, policy, evaluator, output or product meaning.

## 6. Pre-ignition feasibility and immutable plan

RESOURCE-PLAN-001. Complete plan feasibility is established before ignition against an exact CUDA-JS/device/profile capability snapshot, including all mandatory reserves and provider overhead. Partial allocation is rolled back before search authority is published.

RESOURCE-PLAN-002. Every artifact/state/workspace/queue/pool required during active search is allocated/admitted and initialized before ignition. Post-ignition host allocation, managed-memory faulting as semantic overflow, host/disk spill or host-driven growth is prohibited.

RESOURCE-PLAN-003. Physical CUDA-JS resources remain opaque and lifecycle-owned by CUDA-JS. CUDA-MCGS binds typed logical ranges/leases rather than raw pointers or allocator internals.

RESOURCE-PLAN-004. Plan capacity is immutable during one engine incarnation. A selected bounded device-side repartition may move only pre-admitted capacity under an explicit quiescent/atomic transition preserving all leases/reserves/ledgers; it cannot request host allocation or change total plan.

RESOURCE-PLAN-005. Meaning-affecting capacity/repartition changes create new resource/package/session identity and invalidate incompatible work/results/caches. Host attention/control cannot silently resize active resources.

RESOURCE-PLAN-006. Failure to satisfy a mandatory class/reserve rejects engine/session admission with exact class/needed/available/provider cause and complete rollback; it cannot start a degraded profile unless that degraded profile was independently normalized and selected.

## 7. Admission, leases and conservation

RESOURCE-ADMIT-001. Admission validates class/pool/profile/incarnation, quantity/range/alignment, owner authority, applicable watermark policy and representable counters before mutation.

RESOURCE-ADMIT-002. A successful single reservation atomically changes available capacity to one claimed lease. A failed reservation consumes no capacity, publishes no lease and only updates declared cumulative failure diagnostics.

RESOURCE-ADMIT-003. Compound admission across classes is all-or-none at one declared ordering point or uses a finite transaction whose provisional claims are invisible/unusable and fully rolled back on failure/cancellation.

RESOURCE-ADMIT-004. A lease binds owner, class/pool/partition, exact quantity/range, engine/session/root/work incarnation, generation and lifecycle. It cannot be forged, widened, split/merged or transferred without a declared resource-owner transition.

RESOURCE-ADMIT-005. Claim-to-published conversion occurs only after the semantic owner completes initialization/publication. Resource accounting does not make an incomplete object ready.

RESOURCE-ADMIT-006. Each lease terminates exactly once as released, retired-unreclaimed, quarantined or an explicit owner-equivalent disposition. Retry/cancellation cannot double-release or turn a failed claim into published use.

RESOURCE-ADMIT-007. Reclamation accounting returns units to available only after the owning graph/cache/output/session contract proves semantic quiescence/disposition. `retired` is not `free`.

RESOURCE-ADMIT-008. Quarantined units remain unavailable until an owning recovery/teardown proof safely releases them; conservation reports them rather than hiding loss.

RESOURCE-ADMIT-009. Applicable conservation is:

```text
0 <= claimed + published + retired_unreclaimed + quarantined <= capacity
available = capacity - claimed - published - retired_unreclaimed - quarantined
high_water <= capacity
failed_admissions consume no capacity
```

RESOURCE-ADMIT-010. Concurrent admission/release declares semantic atomicity, visibility and retry/idempotence. Physical atomics/fences/locks are later CUDA-JS realization, not Search IR meaning.

RESOURCE-ADMIT-011. Compound transactions use one declared global class order, bounded helping/rollback or another proven finite protocol that cannot circular-wait while holding capacity needed by its peer. Provisional claims remain visible to resource accounting/pressure even when semantic consumers cannot use them.

## 8. Partitions, reserves and priority

RESOURCE-RESERVE-001. Every reserve names exact purpose, classes/units, minimum/maximum, eligible owner/transition, borrow prohibition/conditions and release point. An unnamed `safety margin` is not usable capacity.

RESOURCE-RESERVE-002. Mandatory terminal-result capacity is protected from observation, diagnostics and ordinary work. It remains sufficient to publish the required terminal envelope after any legal exhaustion path.

RESOURCE-RESERVE-003. A selected live Search Session declares root-update admission reserve sufficient for its normalized update/commit/rollback path or rejects that profile. Current search cannot consume it if doing so would make an otherwise valid update mutate-before-admission or deadlock.

RESOURCE-RESERVE-004. Progress/cleanup reserves cover any resource needed to drain must-complete work, publish stop/failure, release leases and tear down. Ordinary admission cannot consume the only path to termination.

RESOURCE-RESERVE-005. Optional observation/capability/product/diagnostic partitions yield before mandatory search/terminal/progress reserves according to the normalized priority. This priority affects admission only; it does not decide semantic search value.

RESOURCE-RESERVE-006. Borrowing between partitions is permitted only when a finite protocol proves donor safety, return deadline/trigger, no stranded leases, watermark effects and termination reserve. Unproven opportunistic borrowing is prohibited.

## 9. Watermarks, pressure and owner responses

RESOURCE-PRESSURE-001. Each applicable class declares monotone thresholds/states such as `normal`, `high`, `critical`, `exhausted` with exact measured ledger quantity, comparison, hysteresis and publication ordering. Names are not universal numeric percentages.

RESOURCE-PRESSURE-002. Watermark transition is a ready device-visible fact. Consumers acquire its declared publication; host polling/callback/relaunch is not required for pressure response or search progress.

RESOURCE-PRESSURE-003. Resource owns pressure classification only. Graph owns whether eligible objects retire/reclaim; evaluator owns cache eviction/fallback; output owns drop/coalescing; policy owns widening/admission/stop response; progress owns scheduling.

RESOURCE-PRESSURE-004. Every selected owner predeclares allowed responses per pressure state and their finite resource/progress behavior. No runtime host decision or generic resource heuristic may invent a victim, reduce accuracy or change policy.

RESOURCE-PRESSURE-005. A response that needs capacity to free capacity uses preplanned progress/cleanup reserve and cannot deadlock behind the saturated class it must relieve.

RESOURCE-PRESSURE-006. Pressure may be recoverable if a declared owner transition can return capacity; `exhausted` may be transient or terminal only as normalized. Resource state alone does not claim valid-partial result.

RESOURCE-PRESSURE-007. Watermark/counter observation is bounded and non-mutating except exact diagnostic accounting. Observation cadence cannot change admission outcomes or reset high-water/failure facts.

## 10. Exhaustion, counters and stopping

RESOURCE-EXHAUST-001. Failed admission publishes exact resource class/pool/partition, requested/available units, watermark state, recoverability and owner-attributable cause. It is not reduced to generic CUDA failure.

RESOURCE-EXHAUST-002. First authoritative terminal resource exhaustion cause is immutable and composes with policy/session/runtime stop priority. Later exhaustion facts remain diagnostics and cannot overwrite history.

RESOURCE-EXHAUST-003. A terminal exhaustion path rejects the failed admission, admits no new work requiring the exhausted class, drains/abandons existing work per owners, preserves conservation and enables terminal envelope publication from reserve.

RESOURCE-EXHAUST-004. Valid-partial/no-valid-result classification belongs to composed policy/output rules and consumes only ready facts. Resource exhaustion never fabricates a value, draw, proof, rank or completed work.

RESOURCE-EXHAUST-005. Capacity exhaustion, fragmentation/fit failure, identifier-space exhaustion, generation exhaustion, counter-width exhaustion, provider failure and policy budget satisfaction are distinct causes.

RESOURCE-EXHAUST-006. Identifiers/generations/counters never wrap, saturate or alias silently. Before the next increment/admission would exceed range, the selected profile retires the identity space, starts a new incarnation/restart or terminates with a typed cause.

RESOURCE-EXHAUST-007. Schedule-dependent drained completions and high-water may vary within declared bounds; capacity, conservation, first cause, graph/publication validity and result class remain stable invariants.

RESOURCE-EXHAUST-008. No exhaustion path performs post-ignition host allocation, unified/managed-memory spill, CPU-produced intermediate, synchronous polling loop or native CUDA-MCGS escape.

## 11. Root epochs, lifecycle and cleanup

RESOURCE-LIFE-001. Resource lifecycle is `profile-normalized → physical-plan-admitted → pools/ledgers-initialized → active → draining → terminal → released`, with failure/quarantine paths and exact rollback.

RESOURCE-LIFE-002. Root/session/work-scoped leases carry exact epochs. Root advance does not free or relabel them until owning stale-work/reclamation dispositions complete; new-root compound admission precedes authoritative mutation.

RESOURCE-LIFE-003. A rejected root update or attention publication leaves current plan/leases/ledgers authoritative and unchanged except bounded failed-admission diagnostics.

RESOURCE-LIFE-004. Teardown stops new admission, resolves compound transactions, drains/abandons owner work, retires/reclaims or quarantines all leases, freezes final ledgers/evidence, then releases opaque CUDA-JS resources in dependency-reverse order.

RESOURCE-LIFE-005. Unexpected ledger mismatch, overlap, double release, lost lease, out-of-plan write or ambiguous quiescence is fatal/quarantined; recovery cannot make counters balance by silently editing them.

RESOURCE-LIFE-006. This contract imposes no universal byte capacity, node/edge/path/action count, queue/batch/ring/cache size, counter width, alignment, device-memory fraction or first-GPU limit. Each finite profile selects sufficient bounds or rejects specialization.

## 12. Security, trust, persistence and diagnostics

RESOURCE-SEC-001. Resource profiles/contributions, provider/device facts, external control quantities and persisted ledgers are untrusted until strict schema/version/unit/range/digest/owner/permission validation passes.

RESOURCE-SEC-002. Contributors receive least-authority class IDs and leases/views. Raw addresses, CUDA handles, allocator internals, credentials, arbitrary host callbacks and private provider/owner types are prohibited resource semantics.

RESOURCE-SEC-003. Alignment/offset/size arithmetic, bounds and lease incarnations are validated before access. Overflow, forged/wrong-owner lease and cross-partition range fail closed.

RESOURCE-SEC-004. Diagnostics are finite and expose class/owner/units/state/cause/high-water without raw pointers, private model/domain bytes or unbounded event logs. Diagnostic exhaustion follows its own reserved/drop/terminal contract.

RESOURCE-SEC-005. Persisted plan/ledger evidence is optional and defines canonical encoding, exact profile/package/device-provider identity, integrity, crash/partial-write recovery, retention and cleanup. It is evidence, not authority to recreate live leases.

RESOURCE-CLEANUP-001. Every allocation binding, pool/partition/reserve, lease/transaction, retired/quarantined range, counter/diagnostic and retained plan/ledger artifact receives release/retain/quarantine/transfer disposition.

RESOURCE-CLEANUP-002. Removing a contributor/capability/product removes solely owned contributions/ranges/ledgers/generated references; retained evidence requires provenance, recovery purpose and disposal trigger.

## 13. Compatibility, generated identity and Search IR

RESOURCE-COMPAT-001. Compatibility requires matching profile/class/unit/formula/layout/lifetime, owner, admission, accounting, reserve, watermark, exhaustion, generation and cleanup meaning. Equal total bytes is insufficient.

RESOURCE-COMPAT-002. Search Composer/package/cache identity binds normalized contributions/plan, layout/alignments/widths, pool/partition/reserve topology, admission/accounting/pressure/exhaustion/reuse and restricted Device-JS inputs. CUDA-JS allocation/artifact identity remains opaque and separately bound.

RESOURCE-COMPAT-003. Changing any selected owner contribution, capacity/formula/unit, layout/alias proof, reserve, counter width, watermark/response, exhaustion or provider feasibility invalidates affected Search IR/packages, session admission, persisted state and reference/native approvals.

RESOURCE-IR-001. Complete Search IR represents every selected contribution/class/pool/partition/reserve, formula/range/alignment/memory-space eligibility, admission group, ledger, watermark/response owner, exhaustion/cancellation and lifecycle/cleanup.

RESOURCE-IR-002. Search IR names logical semantic requirements without raw addresses, allocator/provider types, CUDA memory/atomic enum spellings, streams/events, scheduler or host callback.

RESOURCE-IR-003. Normalization rejects unknown/duplicate owners/classes, unit ambiguity, insufficient widths, overlap/cycles, unsafe aliasing, arithmetic overflow, missing terminal/progress/root reserve, hidden capacity/fallback and unowned exhaustion.

RESOURCE-IR-004. Every contributor retains its semantic response ownership; resource exposes only leases/ledger/pressure facts; progress/session consume transitions. No deep imports or reverse ownership are allowed.

RESOURCE-IR-005. Removing an evaluator, observation, product or capability removes solely owned classes/bytes/ledgers/code/synchronization. Zero-residue is inspected in normalized plan, layout, generated code and runtime accounting.

## 14. Conformance and authoritative oracles

The deterministic CUDA-free reference is authoritative for normalized plan arithmetic, admission, conservation, pressure, exhaustion and teardown under a declared interleaving. Native evidence later proves actual CUDA-JS allocation feasibility, concurrent atomics/publication, memory bounds and cleanup for one exact pair. Successful allocation or throughput alone cannot replace semantic oracles.

Later `ENGINE-IR-COMPOSER-01` and `ENGINE-REFERENCE-01` must consolidate at least:

| Case ID | Required falsifier |
|---|---|
| `resource-profile-strict-normalization` | Ambiguous unit/owner/formula/reserve/exhaustion is accepted. |
| `resource-checked-arithmetic-overflow` | Size/offset/multiplicity wraps or narrows. |
| `resource-layout-no-overlap` | Two live logical ranges overlap without alias proof. |
| `resource-variable-arena-fit` | Free total bytes falsely guarantee largest request. |
| `resource-identity-width-capacity` | Capacity exceeds reference/index/generation range. |
| `resource-preignition-all-or-rollback` | Partial physical plan survives failed admission. |
| `resource-no-postignition-growth` | Active work needs host allocation/spill/growth. |
| `resource-single-admission-atomicity` | Failed reservation consumes capacity/publishes lease. |
| `resource-compound-admission-rollback` | Partial multi-class claim becomes usable or leaks. |
| `resource-conservation-interleaving` | Concurrent claim/publish/retire/reclaim breaks equation. |
| `resource-retired-not-free` | Storage returns before owner quiescence. |
| `resource-quarantine-visible` | Corrupt/lost units disappear from ledger. |
| `resource-terminal-reserve` | Exhaustion prevents mandatory envelope publication. |
| `resource-root-update-reserve` | Current work consumes required admitted-update path. |
| `resource-progress-cleanup-reserve` | Saturation blocks drain/release/teardown forever. |
| `resource-pressure-owner-separation` | Resource layer chooses graph/cache/output/policy victim/response. |
| `resource-pressure-no-host-loop` | Watermark response needs host polling/decision/relaunch. |
| `resource-observation-yields` | Optional observation pressure corrupts mandatory search/terminal reserve. |
| `resource-first-exhaustion-cause` | Later cause overwrites authoritative resource stop. |
| `resource-counter-vs-capacity-exhaustion` | Counter wrap is treated as ordinary full capacity or aliases state. |
| `resource-valid-partial-ready-only` | Exhaustion exposes claimed/stale/failed work. |
| `resource-root-update-reject-no-mutation` | Failed compound update changes current authority/ledger. |
| `resource-absent-owner-zero-residue` | Removed evaluator/observation/product leaves capacity/code/counters. |
| `resource-teardown-ledger-zero-or-retained` | Lease/allocation lacks final disposition. |
| `resource-oracle-sensitivity-conservation` | Removing atomicity/reserve/quiescence checks does not fail oracle. |

The minimum fixtures include fixed and variable graph arenas, evaluator-absent and evaluator-workspace profiles, terminal-only and live-output profiles, a root-update session reserve, selected capability deletion, compound failure at each class, fragmentation despite free bytes, counter/generation exhaustion, recoverable pressure and terminal exhaustion.

Native qualification additionally verifies exact public CUDA-JS plan admission/rollback, bounds/alignment, concurrent lease/accounting visibility, no out-of-plan writes, root/stop races, final ledger/resource/context cleanup and device/provider evidence. Performance compares identical semantic plans and reports padding/headroom/fragmentation/contention/high-water rather than hiding overhead.

## 15. Examples and rationale (informative)

A terminal-only policy search may have no evaluator/observation pools but still reserve the terminal envelope and progress cleanup. A learned evaluator adds immutable assets and per-batch workspace. A live session adds root-update and observation partitions. A byte arena can be 20% free yet unable to fit one maximum state record; that is typed fit pressure, not permission to spill.

These examples do not select capacities, percentages, eviction, widening, scheduler, allocator, managed memory, CUDA mechanism or product behavior.

## 16. Acceptance blockers and downstream invalidation

Acceptance review under #122 found no unresolved contribution, unit/formula, layout/alias, feasibility, admission/conservation, reserve, pressure/exhaustion, identity range, lifecycle, compatibility, security or cleanup ambiguity.

Acceptance under #122 required:

1. normalized Search IR/schema represents every RESOURCE-IR obligation and rejects ambiguity/overflow/hidden capacity;
2. deterministic reference executes all required fixtures/cases and conservation/reserve oracle-sensitivity mutation;
3. progress and Search Session proposals reconcile ready work, recovery reserve, stopping, root-update admission and teardown without duplicate authority/cycles;
4. evaluator/observation/product/capability deletion checks pass;
5. at least one natural finite plan is classified against public CUDA-JS allocation/lifecycle contracts without an in-repository native workaround, while native feasibility remains a later selected-profile gate;
6. the integrated semantic packet is reviewed on one exact revision at `ENGINE-CONTRACT-ACCEPTANCE-01`; and
7. required documentation/governance validation passes.

Production resource lowering remains prohibited until that acceptance. Native allocation/concurrency/performance evidence qualifies selected profiles later unless required to decide semantic meaning.

A change to resource ownership, contribution/unit/formula, plan/layout/alias, capacity/reserve, admission/lease/accounting, watermark/pressure, exhaustion/counter or lifecycle invalidates affected progress/session contracts, Search IR/schema/normalizers, every contributor's generated layout, packages, persisted state and reference/native approvals. The ENGINE-CONTRACT-01 integration spine records and reconciles invalidation before dependents continue.

Implementation, test, review, persistence, security, generated/JIT/ABI, performance and cleanup work triggers the specialist doctrine routed from root `AGENTS.md` and `agent_files/AGENTS.md`.


> **#122 acceptance record (2026-09-03):** The semantic/reference conditions in this specification were discharged by the exact #36 CUDA-free packet at `0cd3dafdbfa683048b0a0f39de21a671fd9ef841`, the #193 CUDA-JS ownership-boundary audit, and the atomic #122 acceptance review. Any clause that explicitly requires native compatible-pair, physical memory-ordering/concurrency, performance, platform-support, or downstream product evidence remains a separate deferred qualification gate and is not claimed by semantic acceptance.
