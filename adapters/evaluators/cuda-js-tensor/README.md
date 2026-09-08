# CUDA-JS-Tensor evaluator connector

`integration.cuda-js-tensor-evaluator` is the optional CUDA-MCGS adapter for a public `cuda-js-tensor` `TensorDeviceProgram`.

The admission connector remains stateless: it validates the public Tensor callable, finite item/request capacity, parameter roles, workspace total and opaque Device-JS library identity, then returns a fresh owner-produced `DeviceJsImport` only while that identity still matches the admitted Tensor program.

The adapter also exposes an evaluator-owned **device runtime contribution**. That contribution generates restricted Device-JS plus finite MCGS-owned request-slot, batch, result and staging layouts for admission, partial/full batching, Tensor item execution, stale-safe scatter, publication, cancellation, retry and recycle. It is a contribution to a Search Program, not a host runtime and not a scheduler. `Progress` still owns when and where ready evaluator work is serviced after ignition.

Ownership stays split deliberately:

- CUDA-JS-Tensor owns Tensor mathematics, TensorProgram/TensorPlan meaning, item-axis addressing, the public item callable ABI and Tensor workspace.
- CUDA-MCGS evaluator semantics own request/batch/result incarnation, finite evaluator state, stale rejection, cancellation/retry and result publication.
- The selected evaluator profile/Search Program owns semantic encoding of domain/model inputs. The generic Tensor adapter exposes per-request encoded-input staging but does not invent domain/model encoding.
- Progress owns service order/topology and partial-batch opportunity. The first runtime contribution permits a one-item partial batch and at most one active Tensor batch without using host timing or polling.
- CUDA-JS owns Device-JS validation/lowering, device release/acquire helpers, linking, allocation/operation mechanics and native execution.

Every post-batch item work record must carry the captured incarnation token `{ itemIndex, slot, slotGeneration, requestGeneration, batchGeneration }`. Generated execute/scatter/publish/retry functions revalidate that token before touching current lane state. A delayed work item from an older lane incarnation returns stale without invoking Tensor or mutating the reused request/result lane.

Publication uses a single CAS from `inflight` to evaluator-owned `publishing`, followed by a release publication of the terminal slot state. The contribution explicitly selects the public CUDA-JS Device-JS and device release/acquire contracts; it does not maintain a helper spelling catalog or infer lower requirements from helper text.

All MCGS-owned control, request-staging and result-staging buffers require explicit zero initialization before ignition. Shared Tensor inputs remain explicit external pre-ignition inputs. The CUDA-JS runtime adapter still submits one Search Program operation; this adapter does not add a host gather/launch/poll/relaunch loop.

This is the first production runtime slice for #124, not full #124 acceptance. The contribution is not yet wired into a concrete Progress-owned runtime-entry composition, and the portable source/state oracle is not native/provider/hardware evidence.

Focused qualification:

```sh
node scripts/run-cuda-js-tensor-evaluator.mjs
node conformance/cuda-js-tensor-evaluator/package.mjs
```
