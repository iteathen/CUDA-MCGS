# CUDA-JS-Tensor evaluator connector

`integration.cuda-js-tensor-evaluator` is the optional CUDA-MCGS adapter for a public `cuda-js-tensor` `TensorDeviceProgram`.

The admission connector remains stateless: it validates the public Tensor callable, finite item/request capacity, parameter roles, workspace total and opaque Device-JS library identity, preserves public Tensor element-count, dtype-width and alignment facts for pointer bindings, then returns a fresh owner-produced `DeviceJsImport` only while that identity still matches the admitted Tensor program.

The adapter also exposes an evaluator-owned **device runtime contribution**. That contribution generates restricted Device-JS plus finite MCGS-owned request-slot, batch, result and staging layouts for admission, partial/full batching, Tensor item execution, stale-safe scatter, publication, cancellation, retry and recycle. It is a contribution to a Search Program, not a host runtime and not a scheduler. `Progress` still owns when and where ready evaluator work is serviced after ignition.

The **program binding** keeps this runtime inside existing generic Search Compiler ownership rather than adding Tensor vocabulary to Composer. `bindTensorEvaluatorProfileProgram()` makes the exact generated Device-JS source digest and the runtime-selected public CUDA-JS contract references part of the selected SPEC-0009 evaluator `programContribution` before generic normalization. `createTensorEvaluatorProgramBinding()` then projects only Program-Package-compatible source/function/`DeviceJsImport` fragments with explicit one-to-one work-class mapping and structural deletion ownership; it no longer relays Resource or Tensor-storage descriptors.

The **Resource layout binding** preserves the separate owners of semantic counts, concrete representation bytes and physical placement. `bindTensorEvaluatorProfileResources()` derives dedicated evaluator-owned byte resources only from the admitted runtime layout. Existing semantic request/queue/batch/result resource counts are left unchanged. Request control storage is represented as `input`-class bytes, batch control storage as `batch`-class bytes, request/result staging remains `input`/`result`, and Tensor input/output/workspace alignment comes from the admitted public Tensor descriptors rather than a local dtype-width catalog. Tensor workspace bytes are admitted only when the evaluator already selected workspace semantics. Shared immutable Tensor inputs remain explicit external inputs because this adapter cannot decide whether their semantic owner is an evaluator artifact, product input or another selected owner.

After the evaluator profile and Resource plan are independently normalized, `createTensorEvaluatorResourceBinding()` consumes the exact runtime contribution directly, proves its generated Device-JS source identity matches the normalized evaluator `programContribution`, verifies the exact evaluator and Resource identities, and follows the Resource-owned class → partition → pool → provider chain for every adapter-owned representation buffer. Provider-relative views use the Resource partition offsets; callers cannot supply placement offsets. The binding rejects runtime-source drift, aliasing, byte-extent drift, insufficient alignment, missing `device-search` residence and insufficient access, but it never creates or mutates Resource pools, partitions or providers.

`createTensorEvaluatorArtifactInputBinding(runtime, evaluatorResult, resourceResult, selections)` binds shared inputs when the selected evaluator explicitly owns them as existing immutable, engine-scoped resident artifacts. Each selection names `parameterName`, `artifactId`, the exact `artifactIdentity`, and an existing evaluator `resourceId`. The first profile binds distinct whole artifacts to distinct, exact-size artifact resources; subranges, aliasing, mutable artifacts and other lifetime scopes are rejected. The adapter verifies public Tensor extent/alignment, artifact bounds, owner identity and the Resource-owned provider chain. It does not create artifact semantics, allocate storage, or infer ownership from names. Other product/input owners remain unsupported by this first profile.

The immutable result contains read-only Resource views, the selected artifact's provenance/initialization/teardown contracts, the expected raw payload digest, and a canonical binding identity. Runtime composition must include that identity and perform payload admission before ignition. This function is a metadata binding: it does not verify payload bytes, establish device residence, service Progress, or prove physical cleanup. Dropping the binding does not delete the selected owner's artifact or Resource records, which may still serve another consumer.

`admitTensorEvaluatorArtifactInputs(runtime, evaluatorResult, resourceResult, selections, payloads)` repeats owner/Resource binding validation and admits exactly one unshared `Uint8Array` per selected parameter. It snapshots each supplied byte view and verifies its exact length and SHA-256 against selected artifact provenance. The returned frozen admission holds private host snapshots; `copyPayload(parameterName)` returns a fresh upload copy. Caller changes and changes to earlier copies cannot alter admitted content. No device allocation, upload or ignition occurs, and copies do not themselves certify subsequent device residence. Host snapshots are reclaimed when the admission is no longer referenced.

Operation composition remains gated: the control descriptors require atomic effects, while SPEC-0005's accepted ordinary-access binding cannot express them. A coarse `access: read-write` in Resource metadata must not be projected as a substitute for those effects. The complete pointer ABI, binding-identity closure, device residence and Progress integration remain unfinished.

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

This remains an incremental #124 slice, not full #124 acceptance. Program source/import ownership and adapter-owned Resource representation/placement verification are now explicit. Shared immutable Tensor input binding, Progress runtime-entry/service-order integration, terminal cross-owner resource closure and native/provider/hardware qualification remain open. Portable source/state/program/resource-binding evidence is not native/provider/hardware evidence.

Focused qualification:

```sh
node scripts/run-cuda-js-tensor-evaluator.mjs
node conformance/cuda-js-tensor-evaluator/package.mjs
```
