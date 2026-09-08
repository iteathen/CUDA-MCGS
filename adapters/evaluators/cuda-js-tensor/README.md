# CUDA-JS-Tensor evaluator connector

`integration.cuda-js-tensor-evaluator` is the optional CUDA-MCGS adapter for a public `cuda-js-tensor` `TensorDeviceProgram`.

The admission connector remains stateless: it validates the public Tensor callable, finite item/request capacity, parameter roles, workspace total and opaque Device-JS library identity, then returns a fresh owner-produced `DeviceJsImport` only while that identity still matches the admitted Tensor program.

The adapter also exposes an evaluator-owned **device runtime contribution**. That contribution generates restricted Device-JS plus finite MCGS-owned request-slot, batch, result and staging layouts for admission, partial/full batching, Tensor item execution, stale-safe scatter, publication, cancellation, retry and recycle. It is a contribution to a Search Program, not a host runtime and not a scheduler. `Progress` still owns when and where ready evaluator work is serviced after ignition.

The **program binding** keeps this runtime inside existing generic Search Compiler ownership rather than adding Tensor vocabulary to Composer. `bindTensorEvaluatorProfileProgram()` makes the exact generated Device-JS source digest and the runtime-selected public CUDA-JS contract references part of the selected SPEC-0009 evaluator `programContribution` before generic normalization. `createTensorEvaluatorProgramBinding()` then projects that normalized evaluator owner into Program-Package-compatible source/function/`DeviceJsImport` fragments with explicit one-to-one work-class mapping and structural deletion ownership.

The binding deliberately stops before Resource and Progress authority. Its `resourceRequirements` and `tensorBindings` are logical evaluator requirements from the runtime contribution, not Resource-plan partitions/provider requirements. It does not create provider pools, bind runtime-entry pointers, select Progress dependencies/fairness/service order, or create a second Composer. Those remain separate #124 integration gates.

Ownership stays split deliberately:

- CUDA-JS-Tensor owns Tensor mathematics, TensorProgram/TensorPlan meaning, item-axis addressing, the public item callable ABI and Tensor workspace.
- CUDA-MCGS evaluator semantics own request/batch/result incarnation, finite evaluator state, stale rejection, cancellation/retry and result publication.
- The selected evaluator profile/Search Program owns semantic encoding of domain/model inputs. The generic Tensor adapter exposes per-request encoded-input staging but does not invent domain/model encoding.
- Progress owns service order/topology and partial-batch opportunity. The first runtime contribution permits a one-item partial batch and at most one active Tensor batch without using host timing or polling.
- Resource owns physical pool/partition/provider planning and cleanup accounting; logical runtime buffers do not become physical bindings until Resource composition selects them.
- CUDA-JS owns Device-JS validation/lowering, device release/acquire helpers, linking, allocation/operation mechanics and native execution.

Every post-batch item work record must carry the captured incarnation token `{ itemIndex, slot, slotGeneration, requestGeneration, batchGeneration }`. Generated execute/scatter/publish/retry functions revalidate that token before touching current lane state. A delayed work item from an older lane incarnation returns stale without invoking Tensor or mutating the reused request/result lane.

Publication uses a single CAS from `inflight` to evaluator-owned `publishing`, followed by a release publication of the terminal slot state. The contribution explicitly selects the public CUDA-JS Device-JS and device release/acquire contracts; it does not maintain a helper spelling catalog or infer lower requirements from helper text. The program binding requires the full public schema references for those selected contracts; it does not manufacture contract hashes.

All MCGS-owned control, request-staging and result-staging buffers require explicit zero initialization before ignition. Shared Tensor inputs remain explicit external pre-ignition inputs. The CUDA-JS runtime adapter still submits one Search Program operation; this adapter does not add a host gather/launch/poll/relaunch loop.

This remains an incremental #124 slice, not full #124 acceptance. The evaluator program source/import ownership is now explicit, while Resource-plan binding, Progress runtime-entry/service-order integration and terminal cross-owner resource closure remain open. Portable source/state/program-binding evidence is not native/provider/hardware evidence.

Focused qualification:

```sh
node scripts/run-cuda-js-tensor-evaluator.mjs
node conformance/cuda-js-tensor-evaluator/package.mjs
```
