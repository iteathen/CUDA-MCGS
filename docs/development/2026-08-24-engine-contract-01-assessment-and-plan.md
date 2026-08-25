# ENGINE-CONTRACT-01 Critical Assessment and Focus-Branch Plan

**Status:** Proposal

**Assessment depth:** Critical

**Decision:** Split and proceed through dependency-ready semantic owners

**Parent plan:** `CUDA-MCGS-V0/22`

**Integration owner:** CUDA-MCGS search-contract integration spine

**Frozen input revision:** `b02f73d38d61e2ae64e50f9775a60e51bde04188`

**Started:** 2026-08-24T22:05:59-07:00

## Objective, evidence, and authority

The current objective is to make every unfinished universal semantic-core owner a decision-complete proposal without prematurely accepting it or beginning production lowering. The result is consumed by `ENGINE-EXTENSION-01`, `ENGINE-IR-COMPOSER-01`, `ENGINE-REFERENCE-01`, and finally `ENGINE-CONTRACT-ACCEPTANCE-01`.

The need is directly evidenced by:

- accepted [`SPEC-0001`](../specs/SPEC-0001-device-search-publication-and-resources.md) assigning facts to domain, graph, policy, evaluator, resource, output, and execution owners that do not yet have complete contracts;
- accepted [`SPEC-0002`](../specs/SPEC-0002-search-ir-and-reference-semantics.md) authorizing these next semantic contracts while explicitly blocking production lowering;
- the planned boundaries in [`SYSTEM_REGISTRY.md`](../../agent_files/SYSTEM_REGISTRY.md);
- the acceptance blockers in proposal [`SPEC-0006`](../specs/SPEC-0006-search-session-control-and-observation.md); and
- the incomplete owner list in [`next_step.yaml`](../../next_step.yaml).

The governing authority is the project-owner build instruction, root `AGENTS.md`, the accepted charter, ADR-0002, ADR-0003, ADR-0005, ADR-0014, ADR-0018, ADR-0019, SPEC-0001, and SPEC-0002 at the frozen revision. The complete operating and triggered design/assessment/focus/execution/testing/cleanup authority was refreshed before this plan was written.

The repository and remote coordination state were trustworthy at preflight: local `main` and `origin/main` were aligned at the frozen revision, the worktree was clean, there were no open pull requests, and GitHub issue #32 remained the parent work item.

### In scope

- product-neutral domain, graph/storage, policy, evaluator, generic result/observation, finite search-resource, device-owned progress, and Search Session proposal contracts;
- final reconciliation of those owners into SPEC-0000 and the current plan/registry/index/status/issue surfaces;
- exact schema/reference/native-profile obligations handed to later nodes.

### Out of scope

- accepting the proposal specifications;
- Search IR/schema/normalizer/reference implementation beyond recording exact obligations;
- extension-substrate revision;
- production components, adapters, package generation, CUDA-JS integration, native execution, scheduler selection, performance, or release;
- chess, Connect Four, ranked actions, scalar values, or another product-specific contract as universal meaning.

These exclusions do not invalidate the result because the canonical dependency order places representation/reference evidence and integrated acceptance after this proposal packet.

## Engineering contract and obligation map

The packet is complete only when each semantic fact has one visible owner, every owner defines its public meaning and non-responsibilities, and later evidence nodes can implement schemas/oracles without inventing ownership, range, lifecycle, pressure, failure, or compatibility behavior.

| Authority / obligation | Classification | Proposed owner | Failure consequence | Later decisive evidence |
|---|---|---|---|---|
| ADR-0018 three-layer separation and deletion tests | Hard gate | Integration spine | Product/extension meaning contaminates the core | Multi-domain reference and deletion cases |
| ADR-0019 JavaScript/Device-JS boundary and device closure | Hard gate | Every owner; integration spine | Native escape path or host-owned search progression | Repository source gate and later exact native pair |
| SPEC-0001 identity-before-cycle and node/edge ownership | Hard semantic gate | Domain, graph, policy | Incorrect transpositions, cycles, or backup accounting | Deterministic graph/path reference capsule |
| SPEC-0001 publication, finite admission, exhaustion, partial results | Hard semantic gate | Graph, evaluator, output, resource, progress | Races, over-capacity state, invalid partial result | Schema/reference pressure and publication cases |
| SPEC-0002 strict normalized representation and canonical identity | Downstream gate | Each owner publishes exact representation obligations; IR owner implements them later | Ambiguous or colliding specialization meaning | `ENGINE-IR-COMPOSER-01` |
| No fixed game/action/state/value/evaluator/graph/schedule shape | Hard universality gate | Every owner | First product becomes foundation | Materially different second instances |
| Finite resource, lifecycle, cancellation, failure, cleanup | Hard completeness gate | Resource owner plus every contributing owner | Unbounded or unrecoverable engine | Resource/reference and later native lifecycle capsules |
| Semantic acceptance distinct from native qualification | Hard sequencing gate | Integration spine | Circular acceptance or premature implementation | Exact node/issue/spec status reconciliation |

### Derived ownership requirements

- **Device-owned progress is the universal owner; a scheduler is a later mechanism/profile.** Naming the semantic owner `scheduler` would imply an algorithm and blur accepted scheduler neutrality.
- **Generic result/observation publication is independent of policy and Search Session.** Policy owns interpretation/statistics; output owns bounded payload selection/publication; Search Session owns optional external request/borrow and root-epoch lifecycle coordination.
- **Graph storage does not own domain identity or policy statistics.** It stores and publishes their selected representations through declared contracts.
- **The resource contract aggregates finite contributions but does not own their semantic purpose or generic CUDA allocation.** CUDA-JS remains the generic allocation/lifetime owner.
- **Search Session is downstream of the other owners.** It coordinates root epochs/reuse classifications; it does not invent graph, policy, evaluator, output, or resource meaning.

The intended contracts are backend-neutral, versioned semantic contracts. Concrete widths, ranges, capacities, precision, memory spaces, and representations are selected by a finite profile from contract-declared valid families; each leaf must define the applicable meaning, bounds, overflow/exhaustion, publication, and compatibility rules rather than leave them as implementation choices.

## LEGO ownership and dependency synthesis

The selected structure uses independently meaningful contract bricks with one invariant and a small public semantic port. Physical Search Program fusion does not erase these boundaries.

```text
domain
  -> graph/storage
  -> policy
  -> evaluator
policy + evaluator + SPEC-0001
  -> generic result/observation
all contributing owners
  -> finite search resources
graph + policy + evaluator + output + resources
  -> device-owned progress
all prior owners
  -> Search Session
all proposal outputs
  -> framework-map and packet integration
```

Composition, not a cross-owner import cycle, binds policy-owned statistics, evaluator outputs, graph storage layouts, output schemas, and resource contributions into a specialization. No contract may name a current neighbor, product, provider, native artifact, or physical scheduler in its internal vocabulary when a local semantic name is sufficient.

The second-instance set includes a transposing DAG, a cyclic/history-sensitive domain, a stochastic or observation-bearing domain, a lazy/sampled/continuous-action domain, absent/proposal/evaluation/combined evaluator profiles, scalar/vector/distributional values, and terminal/live/no-observation outputs. Deleting chess, Connect Four, all extension capabilities, or CUDA-JS implementation internals leaves the semantic owners coherent.

The structure is the simplest sufficient total system because merging these owners would create competing state/lifecycle authority, while splitting narrower concepts now would add versioning and coordination without an independent invariant.

## Value ordering and risk

### Hard gates

1. accepted authority and repository ownership;
2. semantic correctness, device closure, finite resources, stale-reference safety, publication, cancellation, teardown, and compatibility identity;
3. one visible LEGO owner and acyclic public dependencies;
4. decision-complete proposals before representation or production work.

### Mission objectives

- unblock normalized Search IR/reference evidence with the smallest complete semantic packet;
- preserve universality and static specialization;
- make later native qualification capable of falsifying the intended behavior.

### Supporting qualities and process costs

Discoverability, maintainability, testability, and clean issue/plan handoff follow the hard gates. Delivery speed, document count, token cost, and cosmetic neatness are tie-breakers only.

The consequence of a wrong contract boundary is high and broad because every schema, generated program, reference oracle, and production engine would inherit it. The work is reversible while proposal-only, highly detectable through explicit second-instance and integration checks, and substantially more expensive after Search IR or production lowering. Confidence in the split is high; confidence in each detailed contract remains branch-local until its adversarial pass and evidence obligations are complete.

## Question disposition matrix

| Assessment questions | Builder answer | Strongest adversarial challenge | Synthesis / disposition | Evidence or validation |
|---|---|---|---|---|
| 1-8: outcome, evidence, authority, trust | Produce decision-complete owner proposals from accepted gaps on a clean exact revision. | “Build” could be misread as permission to skip proposal gates and start code. | **Resolved:** current accepted authority explicitly blocks production; contracts are the dependency-ready build work. | Exact revision, clean state, accepted SPEC-0001/0002, plan/issue reconciliation. |
| 9-14: current system and ownership | Accepted facts are distributed across SPEC-0001/0002 and proposals; explicit owners are incomplete. | A single expanded SPEC-0000 could close the gaps faster. | **Resolved:** SPEC-0000 is an integration map, not a singular owner; one monolith would couple independent change/lifecycle/test boundaries. | Registry owners, contract/deletion tests, final cross-contract reconciliation. |
| 15-23: LEGO and internal design | Eight semantic owners plus one integration spine; no production components are created yet. | Separate documents could be abstraction theater. | **Resolved:** every leaf has distinct authoritative state/ports/consumers/invalidation; narrower splits are rejected. | Leaf output/falsifier contracts and acyclic dependency review. |
| 24-32: foundations, resources, lifecycle | Each leaf must declare meaning/range/identity/lifetime/failure; the resource leaf composes finite contributions. | Deferring exact generated widths could hide accidental limits. | **Resolved:** contracts define valid range families and selection obligations; concrete widths belong to later finite profiles and identity. | Boundary/overflow/exhaustion cases in later schema/reference nodes. |
| 33-40: alternatives and adversary | Compared no change, one monolithic spec, one contract per owner, and implementation-first discovery. | The proposed packet may delay useful experiments or over-specify unmeasured CUDA mechanisms. | **Resolved:** proposals remain backend-neutral and record empirical questions as later profile evidence; no CUDA mechanism is selected. | Proposal review, second instances, IR/reference falsification, later native qualification. |
| 41-48: plan and proof | Execute one dependency-ready owner at a time, checkpoint, then integrate all outputs. | Cross-contract concepts could drift across sequential branches. | **Resolved:** shared vocabulary changes route through the integration spine and invalidate dependents; accepted is distinct from integrated. | Exact branch revisions, final one-revision reconciliation, docs verification and issue read-back. |

## Triggered lenses

- **Universal framework:** active; every branch uses materially different second instances and first-consumer deletion.
- **GPU/concurrency:** active semantically for publication, progress, cancellation, device closure, memory spaces, and stale state; physical CUDA mechanism evidence is explicitly deferred.
- **Persistence/compatibility:** active for graph/session retention, incarnations, schema versions, generated identity, and reroot reuse; durable cross-process graph persistence remains out of scope unless a branch proves it necessary.
- **Security/trust:** active for fail-closed schema inputs, executable Device-JS boundary, bounded diagnostics, opaque CUDA-JS artifacts, and no raw-pointer/native authority.
- **Performance/search quality:** active only as an obligation to preserve equivalent semantics/resources/stopping/quality in later mechanism selection; no current performance claim is made.

## Candidate paths and adversarial result

| Path | Gate result | Principal benefit | Principal failure/cost | Disposition |
|---|---|---|---|---|
| No change; start implementation from current map | Fails specification and ownership gates | Fastest apparent code start | Forces code/schema to invent core meaning and creates invalid evidence | Rejected |
| Expand SPEC-0000 into one universal contract | Fails LEGO ownership and independent evolution | One document and fewer references | Monolithic authority, coupled versioning, hidden state owners | Rejected |
| One owner contract per semantic invariant, integrated centrally | Passes | Clear ownership, substitution, versioning, test and invalidation boundaries | Requires explicit cross-contract reconciliation | Selected |
| Implementation-first disposable prototype to discover contracts | Fails current dependency order for known semantic gaps | Empirical feedback | Repeats existing bounded evidence and risks first-implementation authority | Rejected; later bounded experiments remain available for genuinely empirical questions |

The strongest criticism is that eight proposals could become paperwork without executable value. The response is not to merge owners; it is to require every leaf to publish exact schema/reference obligations, cheapest counterexamples, and downstream inputs, and to prevent acceptance until consolidated evidence exists. The strongest underengineering risk is a “generic” port that omits identity, perspective, bounds, pressure, or lifecycle; that is an acceptance blocker in every leaf.

Pre-mortem failure causes are: output meaning leaking back into policy, graph storage owning domain equality, resource aggregation becoming a generic CUDA allocator, progress semantics assuming a persistent queue, session reuse being left implicit, or shared terms drifting between sequential branches. The branch order, non-responsibilities, and central integration gate were changed to address those failures.

No empirical question blocks the branch map. Mechanism/performance questions are deliberately assigned to later evidence/profile nodes. Any newly discovered generic GPU mechanism that cannot be expressed naturally through CUDA-JS triggers ADR-0019 classification rather than scope expansion.

## Priority and token posture

This is **P1 foundational gate work**. It unlocks every remaining universal build lane and prevents high-cost schema/implementation rework.

The parent is critical, large, and cross-session. Each leaf is sized for one focused context with at least a 40% semantic reserve after loading its packet. One leaf is active per agent. Backpressure triggers include a newly discovered owner, a public meaning change, a second repair/review cycle without stronger evidence, inability to retain mechanism plus consequence horizon, or reserve erosion before validation/cleanup/handoff. The response order is reuse, batch, narrow, defer polish, reduce leaf scope, split/rebranch, then pause. No separate token ledger is created because this canonical packet already has the real continuation consumer.

## Focus-branch map

Provisional specification paths become authoritative only if their proposal branches are integrated and later accepted at `ENGINE-CONTRACT-ACCEPTANCE-01`.

| Branch | Status | One owner / output | Dependencies | Provisional durable output | Cheapest decisive falsifier |
|---|---|---|---|---|---|
| `EC-DOMAIN-01` | `integrated proposal` | Domain state/action/transition/identity/history/node-role contract | Frozen parent, SPEC-0001/0002 | [`SPEC-0007`](../specs/SPEC-0007-domain-state-action-and-transition.md) at `main@6364710` | A stochastic, history-sensitive, or lazy-action domain requires foundational redesign. |
| `EC-GRAPH-01` | `integrated proposal` | Graph/storage/path/transposition/generation/reclamation contract | Integrated `EC-DOMAIN-01` | [`SPEC-0010`](../specs/SPEC-0010-graph-storage-and-reclamation.md) at `main@4970757` | Graph storage must interpret domain equality or policy statistics to remain valid. |
| `EC-POLICY-01` | `integrated proposal` | Selection/reservation/widening/statistics/backup/stopping contract | Integrated SPEC-0007/0010 public meaning | [`SPEC-0008`](../specs/SPEC-0008-search-policy-and-backup.md) at `main@bb49b85` | A non-zero-sum vector or ordered backup cannot fit without changing graph/domain contracts. |
| `EC-EVALUATOR-01` | `integrated proposal` | Evaluator capability/residency/batching/workspace/publication/reuse contract | Integrated `EC-DOMAIN-01` | [`SPEC-0009`](../specs/SPEC-0009-evaluator-contract.md) at `main@37a111c` | Proposal-only, evaluation-only, or distributional evaluation requires another interface, or an engine with no evaluator retains evaluator residue. |
| `EC-OUTPUT-01` | `integrated proposal` | Generic bounded terminal result/live observation payload publication contract | SPEC-0001, domain/policy/evaluator outputs | [`SPEC-0013`](../specs/SPEC-0013-result-and-observation-publication.md) at `main@8fab142` | Deleting ranked actions leaves the contract incoherent, or observation changes search semantics. |
| `EC-RESOURCE-01` | `integrated proposal` | Finite search-resource composition/admission/pressure/exhaustion contract | Graph, policy, evaluator, output contributions | [`SPEC-0011`](../specs/SPEC-0011-finite-search-resources.md) at `main@98caeb5` | A selected owner can acquire unplanned memory or has no typed saturation behavior. |
| `EC-PROGRESS-01` | `integrated proposal` | Device-owned readiness/progress/fairness/deadlock/stop semantics | Graph, policy, evaluator, output, resource contracts | [`SPEC-0012`](../specs/SPEC-0012-device-owned-search-progress.md) at `main@7c20146` | Semantics require a persistent queue, CUDA Graph, host relaunch, or exact schedule. |
| `EC-SESSION-01` | `integrated proposal` | Reconciled optional Search Session/root/control/observation proposal | All prior owners | [`SPEC-0006`](../specs/SPEC-0006-search-session-control-and-observation.md) at `main@5fe5777` | A rejected update mutates state, stale work contaminates a new epoch, or live reads advance search. |
| `EC-FRAMEWORK-01` | `integrated proposal` | Cross-cutting proposal map with no duplicate owner | All proposal outputs | [`SPEC-0000`](../specs/SPEC-0000-framework-requirements.md) at `main@1ef7324` | SPEC-0000 independently owns a fact already assigned to a leaf or extension/product contract. |
| `EC-INTEGRATE-01` | `active` | One exact proposal packet, branch dispositions, downstream handoff | Every integrated or explicitly disposed leaf | Specs index, registry, plan/status/next-step/issues | Any planned branch is unaccounted, terms contradict, dependencies cycle, or later nodes must invent meaning. |

### Common branch contract

Each leaf:

- is an owner/contract branch under `CUDA-MCGS-V0/22` with the integration spine as integration owner;
- consumes the exact integrated revision of its dependencies, not sibling work in progress;
- writes its owning proposal and branch-specific evidence notes only; shared vocabulary, registry, indexes, and parent status are changed through the integration spine;
- must preserve device closure, finite resources, JavaScript/restricted Device-JS production ownership, scheduler neutrality, product/extension deletion, strict public dependency direction, and no first-instance ranges;
- must define scope/non-goals, terms, state/identity/ranges, public ports, lifecycle, publication/concurrency, pressure/failure/cancellation/cleanup, compatibility/identity, conformance/oracles, downstream schema/reference obligations, and acceptance blockers;
- may not implement production code, schema normalization, native mechanisms, scheduler topology, or an adjacent semantic owner;
- is rolled back by discarding its task-owned branch before publication or superseded through an explicit parent-map revision after publication;
- leaves no generated artifacts, processes, device state, credentials, temporary dependencies, or untracked scratch;
- invalidates dependents if its owner, shared term, public meaning, range family, evidence obligation, or revision changes.

### Leaf-specific context and integration obligations

- `EC-DOMAIN-01` owns semantic identity/equality inputs and state/action/transition/history/observation/node-role meaning. It does not own graph incarnations, search policy, evaluator interpretation, storage layout, or product rules.
- `EC-GRAPH-01` owns graph object/storage validity, references, transposition publication, paths and reclamation. It consumes domain identity and stores selected policy/evaluator records without owning their meaning.
- `EC-POLICY-01` owns search decisions/statistics/reservations/backup/stopping and reroot reuse classification. It consumes graph/domain ports and does not own storage, evaluator execution, or public payload publication.
- `EC-EVALUATOR-01` owns selected evaluator capabilities, resident execution semantics, request/output interpretation, batching/workspace and cache validity. Generic compilation/allocation/operation lifetime remains CUDA-JS-owned.
- `EC-OUTPUT-01` owns bounded publication selection and immutable payload validity for terminal results and optional observations. Session owns live lifetime/epoch coordination; policy/product contracts own ranking or payload meaning.
- `EC-RESOURCE-01` owns finite search-resource contribution normalization, partition/admission, watermarks, pressure/exhaustion and semantic accounting. It does not allocate CUDA resources or silently choose eviction/search policy.
- `EC-PROGRESS-01` owns device-side readiness and guaranteed progress/typed no-progress outcomes. Physical scheduler mechanisms remain later evidence-selected profiles.
- `EC-SESSION-01` owns the optional external transaction/root-epoch boundary plus control and observation request/borrow lifecycle coordination; contributing owners retain validation, reuse, stale-work, publication, resource, progress and cleanup meaning.
- `EC-FRAMEWORK-01` and `EC-INTEGRATE-01` reconcile rather than aggregate unrelated implementation ownership.

## Execution, validation, cleanup, and handoff

Each material leaf executes as one coherent proposal-authoring transition on a short-lived `agent/*` Git branch from the exact current `main`. Expected local effects are its proposal plus required routing/status changes; the wider effect is to unblock only its declared dependents. The focused falsifier is the branch's counterexample plus structural/document validation. A finding that changes owner, public meaning, branch dependency, or shared vocabulary pauses the leaf and versions this parent plan before dependent work continues.

Required current validation for every integrated documentation change is:

```bash
./scripts/verify-docs.sh
```

Contract branches additionally perform a bounded semantic self-review against their full requirement surface and record future conformance case IDs. Reference/native tests are not run to support claims this proposal packet does not make.

Task-created tracked documentation is retained as reviewable proposal output only after guarded integration; it does not become production authority until the later acceptance node. Task-owned branches/worktrees are removed after verified merge when no dependent recovery need remains. GitHub issues remain as coordination history with truthful current status. No production/generated/device/external resource state is expected in this node; any discovered exceptional state is added to the cleanup inventory before use.

`ENGINE-CONTRACT-01` is not complete until every branch above is integrated or explicitly blocked/superseded/deferred with authority, contradictions are resolved on one exact revision, all later schema/reference inputs are explicit, required validation passes, remote issue state is read back, and repository/Git/worktree state is intentional.

## Current readiness and next safe action

`EC-DOMAIN-01` ran from 2026-08-24T22:23:04-07:00 through exact-head author review at 2026-08-24T22:33:26-07:00 and merged through PR #60 as `main@6364710bc6534ae1084ca0c928003c1cfad51515` at 2026-08-24T22:34:01-07:00. Its output is a decision-complete proposal, not accepted production authority.

`EC-GRAPH-01` ran from 2026-08-24T22:37:54-07:00 through exact-head author review at 2026-08-24T22:44:42-07:00 and merged through PR #62 as `main@4970757505770ac38c97fcedac9f072b147b0efe` at 2026-08-24T22:45:15-07:00. Its output is a decision-complete proposal, not accepted production or storage-mechanism authority.

`EC-POLICY-01` ran from 2026-08-24T22:48:47-07:00 through exact-head author review at 2026-08-24T22:56:20-07:00 and merged through PR #65 as `main@bb49b858eae1eb58c659664aeaca1c3a820b4c2c` at 2026-08-24T22:57:13-07:00. Its output is a decision-complete proposal, not accepted production or search-formula authority.

`EC-EVALUATOR-01` ran from 2026-08-24T23:01:01-07:00 through exact-head author review at 2026-08-24T23:08:34-07:00 and merged through PR #68 as `main@37a111c68ea54e619de3c5363bc7d72e7d6e2f3c` at 2026-08-24T23:09:38-07:00. Its output is a decision-complete proposal, not accepted production or evaluator-mechanism authority.

`EC-OUTPUT-01` ran from 2026-08-24T23:12:35-07:00 through exact-head author review at 2026-08-24T23:17:39-07:00 and merged through PR #70 as `main@8fab14205089f540376340c93e52e3bd0c96d1d2` at 2026-08-24T23:18:26-07:00. Its output is a decision-complete proposal, not accepted production or publication-mechanism authority.

`EC-RESOURCE-01` ran from 2026-08-24T23:21:27-07:00 through exact-head author review at 2026-08-24T23:25:29-07:00 and merged through PR #72 as `main@98caeb5276cb4c734f7521ca91857ed41febf70d` at 2026-08-24T23:26:18-07:00. Its output is a decision-complete proposal, not accepted production or allocation-mechanism authority.

`EC-PROGRESS-01` ran from 2026-08-24T23:28:49-07:00 through exact-head author review at 2026-08-24T23:31:17-07:00 and merged through PR #74 as `main@7c20146fed5f459b9857f65647d2be311b201987` at 2026-08-24T23:31:58-07:00. Its output is a decision-complete proposal, not accepted production or scheduler-mechanism authority.

`EC-SESSION-01` ran from 2026-08-24T23:35:01-07:00 through exact-head author review at 2026-08-24T23:41:47-07:00 and merged through PR #76 as `main@5fe57778723012c0a6c8bd5ef1501341962040f0` at 2026-08-24T23:42:43-07:00. Its output is a decision-complete optional proposal with exact terminal-only zero live-session residue, not accepted production or sideband-mechanism authority.

`EC-FRAMEWORK-01` ran from 2026-08-24T23:45:38-07:00 through exact-head author review at 2026-08-24T23:53:14-07:00 and merged through PR #78 as `main@1ef73244ecec507ae70b81ceaa29128621fbbe4a` at 2026-08-24T23:53:57-07:00. Its output is a decision-complete composition/ownership proposal, not accepted schema, package, production or CUDA-mechanism authority.

`EC-INTEGRATE-01` is the single active semantic leaf on frozen packet input `main@1ef73244ecec507ae70b81ceaa29128621fbbe4a`. It reconciles proposal ownership, active routing, exact downstream schema/reference obligations, issue state and cleanup before handing control to the extension-substrate node.

## Frozen proposal-packet reconciliation

The declared review is **full for the ENGINE-CONTRACT-01 normative proposal packet**, frozen at `main@1ef73244ecec507ae70b81ceaa29128621fbbe4a` (tree `fa69cdcb2fd36e9a7cc358938adb22047bf2370e`). Included normative surfaces are SPEC-0000 and SPEC-0006 through SPEC-0013, their accepted authority, cross-owner boundaries and downstream evidence obligations. Active architecture/index/registry/plan/status routing was inspected at that base and its corrections are frozen separately by this integration leaf's exact-head review. Extension specifications, product semantics, schema implementation, native behavior and performance are excluded except at their packet boundaries and are not claimed reviewed or complete.

The nine specifications define 741 unique normative requirement IDs with no duplicate definitions. Reconciliation found one owner per material semantic boundary: framework composition; domain; graph/storage; optional evaluator; policy; output publication; finite resources; device progress; and optional Search Session transaction/request lifecycle. Session coordinates source-owner dispositions but does not own reclamation, progress, resource policy or output publication. CUDA-JS remains the only CUDA/JIT/native mechanism owner, while maintained CUDA-MCGS production source remains ordinary Node.js plus restricted Device-JS.

No unresolved packet contradiction, semantic dependency cycle, first-product assumption, mandatory evaluator/live-session/extension residue, host-progression path or CUDA-MCGS-native escape remains in the normative packet. Explanatory routing that blurred Session ownership is corrected in this integration leaf. Proposal status and production-lowering prohibitions remain unchanged.

The exact downstream handoff is:

1. `ENGINE-EXTENSION-01` makes SPEC-0003 through SPEC-0005 decision-complete as optional downstream composition with exact absent-capability deletion and no core-owner override.
2. `ENGINE-IR-COMPOSER-01` implements strict schemas/metaschemas, canonical normalization, every selected `*-IR`/compatibility/deletion/resource/progress/output/session/package obligation and deterministic JavaScript/restricted Device-JS source/package generation evidence.
3. `ENGINE-REFERENCE-01` implements all owner and 31 framework integration cases across materially different domains, absent/selected evaluator/output/session/extension profiles, pressure, schedules, stale state, cancellation, teardown and oracle mutations.
4. `ENGINE-CONTRACT-ACCEPTANCE-01` reconciles those exact outputs atomically on one frozen revision before any production lowering. Native, compatible-pair, optional live-session, performance/Linux and product qualification remain later independent gates.

The integration leaf creates only tracked documentation and GitHub coordination. No generated package, schema, cache, process, device allocation, credential or runtime resource is authorized or retained.
