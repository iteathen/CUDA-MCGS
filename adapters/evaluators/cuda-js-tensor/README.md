# CUDA-JS-Tensor evaluator connector

`integration.cuda-js-tensor-evaluator` is the optional CUDA-MCGS adapter for a public `cuda-js-tensor` `TensorDeviceProgram`.

The admission connector remains stateless: it validates the public Tensor callable, finite item/request capacity, parameter roles, workspace total and opaque Device-JS library identity, preserves public Tensor element-count, dtype-width and alignment facts for pointer bindings, then returns a fresh owner-produced `DeviceJsImport` only while that identity still matches the admitted Tensor program.

The adapter also exposes an evaluator-owned **device runtime contribution**. That contribution generates restricted Device-JS plus finite MCGS-owned request-slot, batch, result and staging layouts for admission, partial/full batching, Tensor item execution, stale-safe scatter, publication, cancellation, retry and recycle. It is a contribution to a Search Program, not a host runtime and not a scheduler. `Progress` still owns when and where ready evaluator work is serviced after ignition.

The **program binding** keeps this runtime inside existing generic Search Compiler ownership rather than adding Tensor vocabulary to Composer. `bindTensorEvaluatorProfileProgram()` makes the exact generated Device-JS source digest and the runtime-selected public CUDA-JS contract references part of the selected SPEC-0009 evaluator `programContribution` before generic normalization. `createTensorEvaluatorProgramBinding()` then projects only Program-Package-compatible source/function/`DeviceJsImport` fragments with explicit one-to-one work-class mapping and structural deletion ownership; it no longer relays Resource or Tensor-storage descriptors.

The **Resource layout binding** preserves the separate owners of semantic counts, concrete representation bytes and physical placement. `bindTensorEvaluatorProfileResources()` derives dedicated evaluator-owned byte resources only from the admitted runtime layout. Existing semantic request/queue/batch/result resource counts are left unchanged. Request control storage is represented as `input`-class bytes, batch control storage as `batch`-class bytes, request/result staging remains `input`/`result`, and Tensor input/output/workspace alignment comes from the admitted public Tensor descriptors rather than a local dtype-width catalog. Tensor workspace bytes are admitted only when the evaluator already selected workspace semantics. Shared immutable Tensor inputs remain explicit external inputs because this adapter cannot decide whether their semantic owner is an evaluator artifact, product input or another selected owner.

After the evaluator profile and Resource plan are independently normalized, `createTensorEvaluatorResourceBinding()` consumes the exact runtime contribution directly, proves its generated Device-JS source identity matches the normalized evaluator `programContribution`, verifies the exact evaluator and Resource identities, and follows the Resource-owned class → partition → pool → provider chain for every adapter-owned representation buffer. Provider-relative views use the Resource partition offsets; callers cannot supply placement offsets. The binding rejects runtime-source drift, aliasing, byte-extent drift, insufficient alignment, missing `device-search` residence and insufficient access, but it never creates or mutates Resource pools, partitions or providers.

Ownership stays split deliberately:

- CUDA-JS-Tensor owns Tensor mathematics, TensorProgram/TensorPlan meaning, item-axis addressing, the public item callable ABI and Tensor workspace semantics.
- CUDA-MCGS evaluator semantics own request/batch/result incarnation, finite evaluator state, stale rejection, cancellation/retry, result publication and the concrete representation bytes required by the selected Tensor evaluator realization.
- The selected evaluator profile/Search Program owns semantic encoding of domain/model inputs. The generic Tensor adapter exposes per-request encoded-input staging but does not invent domain/model encoding or classify shared immutable Tensor inputs.
- Resource owns physical pool/partition/provider planning, placement, admission, pressure and cleanup accounting. The Tensor resource binding consumes and verifies those facts; it does not author them.
- Progress owns service order/topology and partial-batch opportunity. The first runtime contribution permits a one-item partial batch and at most one active Tensor batch without using host timing or polling.
- CUDA-JS owns Device-JS validation/lowering, device release/acquire helpers, linking, allocation/operation mechanics and native execution.

Every post-batch item work record must carry the captured incarnation token `{ itemIndex, slot, slotGeneration, requestGeneration, batchGeneration }`. Generated execute/scatter/publish/retry functions revalidate that token before touching current lane state. A delayed work item from an older lane incarnation returns stale without invoking Tensor or mutating the reused request/result lane.

Publication uses a single CAS from `inflight` to evaluator-owned `publishing`, followed by a release publication of the terminal slot state. The contribution explicitly selects the public CUDA-JS Device-JS and device release/acquire contracts; it does not maintain a helper spelling catalog or infer lower requirements from helper text. The program binding requires the full public schema references for those selected contracts; it does not manufacture contract hashes.

All adapter-owned control, request-staging, result-staging and selected Tensor workspace buffers are explicit evaluator byte resources with exact extents and pre-ignition initialization requirements. Shared immutable Tensor inputs remain explicit external pre-ignition inputs. The CUDA-JS runtime adapter still submits one Search Program operation; this adapter does not add a host gather/launch/poll/relaunch loop.

The #124 review candidate adds `createTensorEvaluatorOperationBindings(runtime, evaluator, resource, packageResources, selections)`. Each shared input selection names `{ parameter, artifact, resource }` from the selected evaluator; it supplies no offsets. The builder verifies immutable engine artifacts, follows Resource placement, covers every runtime pointer, and returns actual Program Package binding fragments with explicit views, initialization and device effects. Package normalization and runtime admission enforce those declarations under the [proposed binding addendum](../../../docs/specs/SPEC-0005-evaluator-resource-binding-addendum.md).

The runtime contribution also exposes evaluator-owned `serviceItem`, `cancelPending` and `quiescent` callables. Search Compiler's Progress cohort generator consumes those public descriptors and the selected Progress work class. This is a finite already-produced, evaluation-only cohort in one block; parent Graph/Search closure, dependent producers, multi-block service and native/provider/hardware qualification remain open. Portable source/state/binding evidence is separate from public frontend inspection and physical qualification.

Focused qualification:

```sh
node scripts/run-cuda-js-tensor-evaluator.mjs
node conformance/cuda-js-tensor-evaluator/package.mjs
```

The consolidated candidate retains #266's operation-binding API and runtime ignition as the input-admission path; #265's separate `copyPayload`/host-admission APIs are not added. Initialization uses private copies of the actual typed-array view (including Buffer subranges), independent of caller iterators, and verifies exact extent, digests and zero state before uploads. Portable Node 24/26 and hostile-input conformance are described in the [conformance capsule](../../../conformance/cuda-js-tensor-evaluator/README.md).
