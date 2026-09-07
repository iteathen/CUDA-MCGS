# #124 Device-resident evaluator runtime — assessment and execution plan

**Date:** 2026-09-07  
**Issue:** #124  
**Execution branch:** `feature/124-device-resident-evaluator`  
**Protected base observed before mutation:** `1419ad81d5845aba0b76bb26d44618b4b409251f`  
**Status:** Proposal

## Required outcome

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
