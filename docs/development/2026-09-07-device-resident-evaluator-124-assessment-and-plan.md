# #124 Device-resident evaluator runtime — assessment and execution plan

**Date:** 2026-09-07  
**Issue:** #124  
**Execution branch:** `feature/124-device-resident-evaluator`  
**Protected base observed before mutation:** `1419ad81d5845aba0b76bb26d44618b4b409251f`  
**Status:** Proposal

## Required outcome

### Resumption after protected PR #262 — 2026-09-08

The original proposal below records the earlier runtime work. Its sequencing is superseded by `next_step.yaml`: selected immutable input ownership, complete pointer ABI, Progress integration, terminal cross-owner cleanup, then physical qualification. Resume from `d93dde5358df0f5304ecf4af02305b36a0fa8d78`, preserving the protected ownership refactor. Current branch: `codex/124-immutable-input-binding`. Account-global `iteathen/.github/AGENTS.md` routes to `AGENT_LOCAL.md`; agent-system remediation belongs to a separate worker.

The first bounded unit verifies an explicit Tensor input → existing selected evaluator artifact → existing evaluator Resource entry relationship. SPEC-0009 EVAL-RESIDENT-001/004, EVAL-LIFE-002, EVAL-COMPAT-002 and EVAL-CLEANUP-001 own identity/residence/lifetime; SPEC-0011 owns physical placement and accounting. Public Tensor descriptors remain the only source of Tensor byte extents and alignment. No lower-layer change is required for this metadata unit.

Selected design: support distinct whole immutable engine-scoped artifacts already admitted in the normalized evaluator profile, with explicit exact artifact identities and existing exact-size Resource entries. Emit immutable read-only bindings plus a canonical composition identity. Reuse the existing Resource chain verifier. Do not expand Program Binding or the Resource planner. The first profile deliberately rejects aliasing/subranges and other owner/lifetime classes until their contracts are composed.

Rejected alternatives: inferring artifact meaning from `weights` or equal byte sizes; synthesizing generic artifact resources in the Tensor adapter; accepting caller placement offsets; adding Tensor-specific fields to universal evaluator schemas; implementing Progress before the input/pointer ABI is complete. A mapping identity outside evaluator normalization is usable only if the subsequent runtime composition binds it: this unit does not claim that end-to-end identity closure yet.

Acceptance for this unit: real evaluator/Resource normalization; exact selected artifact identity, extent/alignment/access and Resource placement checks; a materially different table artifact and input name; deterministic immutable output; negative identity/lifetime/extent/placement cases; no mutation of selected owner records; installed-package export and exact-source checks. Qualification remains portable metadata-only. Payload digest admission, actual device residence, full evaluator deletion/substitution, complete pointer ABI, Progress and terminal cleanup remain open.

Rollback is removal of this optional binding API and its owner-local tests; no persistent runtime or remote state is created. Retain the task branch/worktree for continuation. Required checks are the Tensor evaluator capsule, package boundary, relevant library/Resource/evaluator checks and the unchanged documentation validator. The known root-redirect validator contradiction is reported, not bypassed. Broader runtime/peer checks become mandatory when subsequent runtime composition changes.

#### Continuation assessment: payload admission and atomic pointer gap

The current continuation preserves both lines of work: this branch's immutable-input work and Astra's unmerged `feature/124-progress-binding` at `d3199df69587913dbe4cca28d2a87ed07c2ae0a5`. Astra started at `9db49de`, before the authority-routing correction. Its qualification test passes a Resource result without the `schemaSha` required by `normalizeProgressProfile`; its builder explicitly excludes runtime-entry/operation generation. The branch and its two temporary qualification transport files are retained unchanged as recovery evidence, not accepted integration. Fixing that test alone would not complete #124.

Protected `main` advanced to `e2047bf0adcd49c7e31b9715324ce5ee127fc95f` while this continuation ran. Merge `3bdbbbe` brings the other agent's validator alignment into the working branch without altering its implementation or discarding either line of evaluator work.

The new exact-pointer validator exposed Windows CRLF checkout conversion of `AGENTS.md`. An explicit `/AGENTS.md text eol=lf` rule now preserves the committed bytes. The local pointer was restored from the exact Git blob; its content and the validator are unchanged. Documentation validation and structured-data validation now pass locally, resolving the earlier recorded validator failures for this worktree.

The next independent evaluator unit admits exact payload bytes under SPEC-0009's immutable resident-artifact obligations. `admitTensorEvaluatorArtifactInputs` rebuilds the owner/Resource binding, requires exact supplied parameter coverage, snapshots the exact unshared byte views, verifies finite extent and content digest, and retains private snapshots with copy-out access. This avoids aliases through Node Buffer slices and prevents later caller/upload-copy changes from modifying admitted content. Failed admission returns no object and creates no device or external state. Retained snapshots follow ordinary host object lifetime. Device upload, operation admission and residency are separate unfinished obligations; an upload copy must not be treated as proof that device bytes remained exact.

Rejected alternatives were uploading before all bytes were admitted, retaining caller-owned mutable arrays, parsing Device-JS to infer effects, putting Tensor policy into CUDA-JS, and widening the existing ordinary-access field without accepted authority. Focused falsifiers cover wrong digest/extent, caller and consumer mutation, subrange handling, malformed coverage/type and valid retry. The owning Tensor capsule runs on Node 24 and 26; installed-package closure and documentation/structured validation are required before this unit is handed off.

**Pointer ABI blocker:** the existing runtime's request/batch control descriptors explicitly require `atomic`. The accepted [operation-local access addendum](../specs/SPEC-0005-operation-local-resource-access-addendum.md), ACCESS-REP-004 and ACCESS-ADAPTER-003, forbids weakening atomic/publication effects to ordinary `read-write`. Program Package `normalizeBinding` accepts only ordinary modes, and `verify-operation-local-access.mjs` explicitly rejects `atomic` and `publish`. The existing external-control sideband addendum explicitly does not widen ordinary access into atomic/publication authority. Consequently the current Resource binding's coarse access summary is insufficient as an operation binding for these controls. No Progress mutation or fully composed runtime qualification is justified yet.

The missing representation belongs to CUDA-MCGS Program Package composition, not a proven missing CUDA-JS primitive. The decision-ready next action is to specify explicit operation-local atomic/publication meaning (including the pointer range, type, operation/order requirements and selected public contract references), determine its mechanical projection using public CUDA-JS contracts, and obtain the required accepted contract/schema/Composer/adapter boundary before implementing complete evaluator pointer composition. Artifact-to-resource mapping identity must also enter the final composition identity; the current separate metadata identity alone is insufficient. Do not encode it in source comments or infer it from equal byte lengths. Preserve the order: immutable admission and identity closure → complete pointer ABI → Progress → terminal integration → physical qualification.

#### Local qualification and continuation

The metadata unit is locally implemented in commit `1d8b41ef51763802964c7c71e2fbe71dd1154e76`, following Node 24 compatibility commit `cc7e561`. It is not published or protected-main acceptance. The task worktree is `UMCGS-worktrees/124-immutable-input-binding`; retain its generated reference evidence for continuation, with regeneration required after evidence-key changes.

The owner explicitly authorized expanding beyond the precautionary Node 26 floor if Node 24 worked. Windows x64 Node `24.15.0` and `26.8.1` both passed the complete `scripts/run-engine-reference-integration.mjs` chain: 393 reference requirements and 7/7 integration mutations, with 52 native requirements still deferred. Both produced integration key `4927cb4cf78784b2dec3063b53f7c55cb79c26b7d837154da668007c0fd5025d`. Version guards were changed without changing test expectations; the Composer runner's changed source digest required explicit downstream evidence-lock refresh. An untouched `d93dde5` worktree confirmed the original source/evidence key; candidate Node 24 and 26 agreed on the new one. Three nested schedule evidence keys were also refreshed because the lock tool does not traverse them. Inspection confirmed all 32 runner changes are version gates and all 18 fixture changes are derived identity fields only.

Tensor evaluator portable conformance passed on both versions. Node 24 additionally passed runtime-adapter conformance (20/20), public Device-JS import composition, installed-library conformance (16/16), source-boundary validation and Markdown links. Installed Tensor package qualification at `1d8b41e` verified 63 exact Git-blob files in a 64-entry package, shasum `65acf14a271388ed763c6e1ff6dba21e96282791`. Package qualification used Node 24; Node 26 installed-package CI is retained, and a separate Node 24 Windows/Ubuntu lane was added. Remote CI and physical CUDA qualification have not run for this local candidate. Portable Node support does not lower the selected native CUDA-JS compatible pair's runtime requirements.

Unchanged baseline validation failures remain outside this unit: `verify-docs.sh` rejects the tracked root `AGENTS.md` redirect; `check-structured-data.mjs` expects `deliverables` and `ownership_boundary` keys absent from the current `next_step.yaml`. Do not waive these gates for merge or edit the separately owned agent-system remediation here.

Next implementation boundary: bind the artifact-input mapping identity into the complete Resource/runtime-entry composition; validate the selected artifact payload against its declared digest and exact extent before ignition; then establish device residence and complete immutable/mutable pointer coverage through public runtime contracts. The current metadata API must not be mistaken for payload admission or ignition. Progress remains downstream of that complete ABI. No source branches, remote PRs, or issues were deleted or closed.

Cleanup exception: the task-created `UMCGS-worktrees/124-baseline-validation` checkout was clean before removal. Git deregistered it but reported filesystem permission failures, leaving partial files there and under `UMCGS/.git/worktrees/124-baseline-validation`. Automatic approval review then blocked exact-target recursive filesystem cleanup (`blocked by policy`). Retain this inactive residue until approved filesystem cleanup is available; `RETAINED_BASELINE_STATUS.txt` marks it as unusable for development. The active #124 worktree remains registered and clean. Diagnostic `cuda-mcgs-124-*.log` files in the task host's temporary directory and normal npm's Node 26 cache are retained as local qualification evidence/dependency cache; they create no running processes or remote resources.

Implement one optional, product-neutral CUDA-MCGS evaluator runtime contribution that can keep evaluator request accumulation, finite batching, freshness validation, Tensor item execution, scatter/readiness/publication, failure/cancellation mapping and terminal disposition in the composed device program without host gather/launch/poll/relaunch progression.

The implementation must consume CUDA-JS-Tensor only through the already protected public Tensor connector/device-import boundary. It must not make Tensor mandatory, move Tensor mathematics into CUDA-MCGS, move evaluator scheduling into the Tensor adapter, or add a private/native CUDA workaround.

Portable/package evidence may qualify only the semantics and composition it actually executes. It must not claim physical CUDA/provider qualification.

## Authority and protected prerequisites read at the protected base

The assessment re-read actual protected state rather than treating the handoff as authority. Governing sources included:

- `docs/specs/SPEC-0009-evaluator-contract.md`;
- `docs/specs/SPEC-0011-finite-search-resources.md`;
- `docs/specs/SPEC-0012-device-owned-search-progress.md`;
- `docs/specs/SPEC-0013-result-and-observation-publication.md`;
- the production Search Compiler and Program Package implementation;
- the public CUDA-JS runtime adapter and its resource-view, Device-JS-import and cleanup conformance;
- the protected CUDA-JS-Tensor evaluator connector;
- the CUDA-free evaluator reference oracle and request/batch/lifecycle/reuse-cleanup cases;
- repository assessment, testing, review and cleanup doctrine.

The live protected `main` ref and execution branch were both observed at `1419ad81d5845aba0b76bb26d44618b4b409251f` before the first mutation. `STATUS.md`, `next_step.yaml`, and the current #124 issue narrative still contain a pre-#247 base SHA in descriptive text; that is documentation drift, not branch ancestry. It is cleanup/documentation work for this branch, not an implementation input.

## Ownership assessment

### CUDA-MCGS evaluator owns

- request identity, slot incarnation and freshness;
- exact result-slot binding;
- finite request/queue admission and evaluator pressure meaning;
- explicit batch compatibility and partial/full batch formation;
- item-to-request mapping;
- evaluator workspace/resource contribution and accounting semantics;
- result scatter, required-capability readiness and publication ordering;
- stale/duplicate/wrong-item rejection;
- evaluator failure/cancellation/retry/terminal disposition;
- evaluator-owned cleanup evidence.

### Other owners remain unchanged

- CUDA-JS-Tensor owns TensorProgram/TensorPlan mathematics, item-axis independence, typed callable ABI, Tensor-owned workspace requirements and public compiled Device-JS import.
- CUDA-JS owns compilation, native/provider realization, opaque allocations/views/operations, synchronization mechanisms and physical teardown.
- Resource owns total finite-plan capacity/admission/lease conservation.
- Progress owns engine-wide work service/fairness/no-progress/stop/drain/closure.
- Output owns external result/observation publication, not evaluator-internal readiness.
- Downstream products own model/input/output-head/numerical/product correctness semantics.

## Existing protected mechanisms and the missing seam

The protected Tensor connector is intentionally stateless. It admits one public Tensor device program, freezes generic callable/resource/import facts, and supplies a restricted Device-JS wrapper that invokes the exact public DeviceJsImport alias. Its registry boundary explicitly excludes evaluator scheduler behavior.

The protected Program Package already supports:

- owner-attributed restricted Device-JS source units and functions;
- resident resource requirements and typed subviews;
- runtime operation bindings;
- public requirement projection;
- owner deletion manifests;
- owner-attributed public Device-JS import declarations.

The protected CUDA-JS adapter already:

- validates public requirements before lower calls;
- admits exactly one current long-lived runtime operation;
- allocates all declared resident resources before ignition;
- creates typed resource views where requested;
- validates exact Device-JS import identity and forwards the opaque public import unchanged;
- compiles the composed source;
- closes child-before-parent and reports retained/quarantined resources honestly on cleanup failure.

No missing generic CUDA-JS or Tensor mechanism was found for the first #124 slice.

The missing production seam is therefore **generation/materialization of evaluator-owned device-program state and transitions**. It belongs inside `tool.search-compiler`, which already owns deterministic Search Program/execution-package implementation. It does not belong in the stateless Tensor adapter and does not justify a new public component.

## Reference-oracle findings that constrain production

The existing CUDA-free evaluator oracle is evidence, not production code, but it exposes accepted invariants that the generated contribution must preserve:

1. Admission binds the tuple `(slot, request, incarnation, result slot)` before publication and a failed admission leaves no live request residue.
2. Compatibility is explicit and complete; compatible batching cannot be inferred from queue proximity.
3. A partial ready batch receives a device-visible service opportunity without host timeout/flush.
4. Physical evaluator results must explicitly identify exactly one active batch item; positional scatter is insufficient.
5. Execution completion is not evaluator readiness. Freshness/result-slot/capability validation precedes authoritative scatter/publication.
6. A stale result from an older slot incarnation cannot mutate or publish into its replacement.
7. Cancellation/failure cannot rewrite an already authoritative terminal result and cannot release a borrow/workspace still owned by live physical work.
8. Terminal cleanup releases runtime state exactly once or reports an honest quarantined/unproved disposition.
9. Evaluator absence and optional facilities such as cache/continuation/mutable evaluator state remove their solely owned runtime residue rather than leaving disabled branches.

## Path selection

### Selected path — Search Compiler evaluator Device-JS contribution builder

Add one private Search Compiler child that takes a normalized evaluator profile plus an optional admitted Tensor connector and emits a frozen, owner-attributed evaluator device-runtime contribution. The first bounded contribution contains:

- a finite request-slot record layout;
- a finite batch-item mapping layout;
- evaluator queue/batch counters and state;
- exact request/result-slot/incarnation freshness fields;
- generated restricted Device-JS functions for request admission, cancellation, batch service, Tensor item invocation when selected, and freshness-checked scatter/publication;
- explicit resource byte requirements derived with checked arithmetic from evaluator bounds and public Tensor facts;
- optional Device-JS import declaration and Tensor wrapper source only when a Tensor connector is selected;
- deletion metadata proving evaluator/Tensor absence removes the corresponding source/functions/resources/import.

The builder is pre-ignition JavaScript. It does not execute search or own a host scheduler. Its output is restricted Device-JS + Program Package facts consumed by existing composition/runtime mechanisms.

### Rejected path — put the scheduler into `adapters/evaluators/cuda-js-tensor`

Rejected because it would make a producer adapter the owner of CUDA-MCGS request/batch/scatter lifecycle, contradicting the registered ownership boundary and weakening substitution/deletion.

### Rejected path — add a new public evaluator-runtime component

Rejected because `tool.search-compiler` already owns deterministic Search Program/execution-package materialization. A new public owner would duplicate composition truth and increase public surface without a distinct semantic lifecycle.

### Rejected path — copy the host reference oracle into production

Rejected because the oracle is a mutable host-side semantic model and cannot satisfy device-resident progress. Production must generate restricted Device-JS state/transitions rather than run the oracle at runtime.

### Rejected path — request new CUDA-JS/Tensor capability first

No missing generic mechanism was found. Escalation would be speculative. If implementation encounters a genuinely consumer-neutral missing GPU primitive, work stops at that boundary and routes it upstream rather than adding a workaround.

## First bounded implementation profile

The first production slice intentionally targets the common statically independent Tensor-item path already named by #124:

- finite request capacity supplied by the admitted connector/profile;
- finite batch capacity bounded by both evaluator `maximumItems` and Tensor `itemCapacity`;
- item-independent batch execution;
- no host flush: a service opportunity may form a non-empty partial batch;
- exact slot/request/incarnation/result-slot mapping per batch item;
- one Tensor item call per active lane/item through the protected wrapper/import when Tensor is selected;
- explicit evaluator states sufficient to distinguish free/queued/batched/executing/publishing/ready/failed/cancelled/stale;
- release/acquire-capable publication expressed only through public CUDA-JS Device-JS helpers already admitted by the package;
- checked finite resource sizing before composition.

Batch-sensitive continuations, evaluator cache and mutable evaluator state remain accepted semantic alternatives but are not silently approximated. If selected profile semantics require machinery not implemented by this first slice, the builder rejects that specialization before source/resource publication. That is preferable to emitting a device program that proves an easier contract.

## Planned production surface

Private child:

- `components/search-compiler/src/evaluator-device-runtime.mjs`

Public parent export through the existing `cuda-mcgs/search-compiler` entry point:

- `createEvaluatorDeviceRuntimeContribution(...)`
- `EvaluatorDeviceRuntimeError`
- bounded constants describing the contribution contract/layout version.

No package export map widening is required because `components/search-compiler/index.mjs` is already the package subpath owner.

The returned contribution is not a runtime handle and exposes no CUDA/Tensor private object. It is immutable pre-ignition composition data.

## Test intents / acceptance map

A consolidated portable capsule will be added under `conformance/search-compiler/` or a focused #124 evaluator-runtime subcapsule owned by the Search Compiler. It will use normalized synthetic evaluator profiles plus a public-shaped Tensor connector fixture and will cover at minimum:

| Case | Falsifier |
|---|---|
| absent evaluator structural deletion | evaluator-owned source/resource/import remains when evaluator is absent |
| finite sizing | request/batch/resource arithmetic exceeds bounds, narrows or silently wraps |
| partial batch service | one ready item cannot progress without a host flush/full batch |
| exact mapping | reordered or wrong item/result-slot can publish by position |
| stale incarnation | old result can mutate a reused request/result slot |
| cancellation/failure terminality | cancellation/failure rewrites an authoritative terminal state or leaves ambiguous state |
| retry/idempotence | repeated exact terminal/scatter action double-publishes or double-releases |
| Tensor selection | selected Tensor source calls only the protected wrapper/import and resource sizing uses public connector facts |
| Tensor absence/substitution | non-Tensor/absent contribution contains no Tensor import/wrapper residue |
| unsupported accepted variants | batch-sensitive/continuation/mutable/cache requirement is silently weakened instead of rejected before composition |
| cleanup manifest | every generated source/function/resource/import has one deletion owner |
| package integration | contribution can be merged into a Program Package and survives Search Program/execution-package normalization without private lower data |

Existing evaluator oracle cases remain independent semantic evidence. Existing runtime-adapter import/resource-view/cleanup capsules remain mechanism evidence. No new test should copy the implementation algorithm as its oracle when the accepted spec/reference invariant can be checked directly.

## Qualification sequence

1. **Tier 0:** source/profile/static normalization, exact branch/subject identity, test discovery.
2. **Tier 1:** new focused evaluator-runtime capsule including negative controls for stale/mapping/overflow/deletion.
3. **Tier 2:** Search Compiler owning conformance plus CUDA-JS-Tensor evaluator connector conformance where invalidated.
4. **Tier 3:** Program Package / runtime-adapter portable integration using public-shaped imports/resources; library installed-package closure if public bytes/exports changed.
5. **Aggregate verify:** one current-head pass after the coherent branch batch.

Physical CUDA is explicitly not an acceptance claim for this portfolio pass.

## Cleanup and disposition

- The execution branch and PR are retained until #124 acceptance/integration is complete.
- Assessment and portable conformance are retained as bounded durable evidence.
- No local/native artifacts are authorized by this plan.
- Temporary test probes must be folded into the owning capsule or removed before acceptance.
- Any failed lower cleanup in portable fakes must remain visibly quarantined; tests may not rewrite it to complete.
- The stale pre-#247 base SHA in `STATUS.md`, `next_step.yaml`, and #124 descriptive text is a truthful documentation cleanup item; updating it must not be represented as ancestry repair.
- Connect4 state is protected unchanged and outside this task.

## Reassessment gate

Implementation proceeds only while the contribution can remain:

- product-neutral;
- pre-ignition JavaScript plus restricted Device-JS;
- finite and checked;
- Tensor optional;
- composed through public Program Package/CUDA-JS/Tensor surfaces;
- semantically owned by CUDA-MCGS evaluator contracts;
- physically unqualified unless separate native evidence is later obtained.

A missing generic device mechanism, inability to preserve accepted freshness/publication semantics, or need to import private Tensor/CUDA-JS state is a stop/research/escalation condition rather than permission to weaken the contract.
