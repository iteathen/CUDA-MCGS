# Evaluator Device-Binding Foundation — Assessment and Plan

**Status:** In Progress

**Date:** 2026-09-06

**Tracking:** #124

**Protected inputs:**

- CUDA-MCGS `b5a55a7c1a621d83fb44c19860b631c04131e137`, tree `5766405e7e45c7069512698b7ab4cf277c7e912f`
- CUDA-JS `7e9221e71bd618bdc404299c3b707ca1ced37c6b`
- CUDA-JS-Tensor `b8947b804b201d94746c1b4b69f55098372d248e`

## Assessment

PR #241 protected canonical identity-bound external Device-JS import composition. The remaining #124 objective is evaluator-owned request/batch/scatter/readiness/search-lifecycle composition without host-driven active progress.

The current Tensor connector correctly remains stateless. It admits one public `TensorDeviceProgram`, freezes capacity/workspace/import identity and produces a fresh drift-checked `DeviceJsImport`; it must not become a second evaluator scheduler/runtime.

Two generic representation gaps block a correct runtime contribution before any evaluator state machine should be generated:

1. **Dense Device-JS type parity.** CUDA-JS SPEC-0030 accepts `f64`, `f16`, `bf16` and pointer forms in device functions/imports. CUDA-JS-Tensor may expose all of those through `tensorRunItem`, while CUDA-MCGS Search Program function metadata currently admits only the legacy scalar set. MCGS must represent the accepted public dependency without narrowing it.
2. **Exact resource subviews.** Tensor exposes separate input/output/workspace pointers and one workspace pointer per dtype partition. CUDA-JS already publicly supports `CudaDeviceMemory.view({ dtype, byteOffset, elementCount, access })` and accepts `CudaDeviceView` launch arguments, but CUDA-MCGS operation bindings currently bind only an entire resource allocation. Pointing multiple Tensor parameters at one allocation base would be an invalid aliasing workaround.

A third integration fact must be preserved by the Tensor connector for the later semantic binding layer: public Tensor parameter descriptors include input/output names and value IDs plus workspace `perItemElements`/alignment. The current connector retains only role/type/dtype/access/item-varying/byteLength, which is sufficient for admission accounting but not exact semantic-to-callable binding.

No lower-repository change is required for this foundation. CUDA-JS already owns the generic dense Device-JS and typed device-view mechanisms; CUDA-JS-Tensor already owns exact item-axis/callable/workspace descriptors.

## Ownership

- `tool.search-compiler` owns the Search Program/package representation and validation of accepted Device-JS function types and resource-view binding declarations.
- `integration.cuda-js` owns translating those generic resource-view declarations to public `CudaDeviceMemory.view()` capabilities and their lifecycle.
- `integration.cuda-js-tensor-evaluator` may preserve public Tensor callable descriptors needed for a later explicit evaluator/Tensor binding, but remains stateless and owns no request/batch lifecycle.
- SPEC-0009, SPEC-0011 and SPEC-0012 remain the sole owners of evaluator lifecycle, resource and progress semantics.
- CUDA-JS remains sole owner of generic device-view/runtime mechanics; CUDA-JS-Tensor remains sole owner of Tensor layout/callable/workspace meaning.

## Plan

### A. Search Program dense type parity

- Extend canonical Search Program function parameter/return validation and schema to the accepted CUDA-JS dense scalar set: `bool`, `u32`, `i32`, `u64`, `f32`, `f64`, `f16`, `bf16` and pointer forms.
- Preserve legacy normalization and bytes for programs that use only the legacy type set.
- Add positive and negative/mutation conformance for dense metadata.

### B. Generic resource-view operation binding

- Extend a resource operation binding with an optional typed view descriptor: `byteOffset`, `elementCount`, `dtype`; absence retains exact whole-allocation behavior.
- Validate finite range, dtype width/alignment, resource access and non-overflow before package publication.
- Project the view descriptor into CUDA-JS adapter requirements without Tensor vocabulary.
- In `integration.cuda-js`, create public `CudaDeviceView` children after the owning allocation exists, bind the view to the operation, include its exact byte range in lower access declarations and close views before parent allocations.
- Fail closed when the injected public CUDA-JS runtime does not expose `memory.view()` or when a view descriptor cannot be represented exactly.

### C. Preserve public Tensor parameter binding facts

- Keep existing connector contract behavior and no-import/runtime ownership unchanged.
- Preserve public input/output `name`/`valueId` and workspace `elementCount`/`perItemElements`/`alignmentBytes` in the immutable admitted parameter descriptors when present.
- Bound `requestCapacity` to the public item/index domain needed by the first device-resident evaluator representation; do not create a wider hidden index domain.
- Add conformance proving descriptor drift/malformed public fields fail before any lower work.

### D. Qualification

Focused falsifiers must cover:

- legacy Search Program canonical output unchanged;
- dense type/pointer acceptance and unsupported-type rejection;
- whole-resource binding unchanged when no view is selected;
- valid multiple non-overlapping views of one resource;
- out-of-range, misaligned, zero/invalid dtype and access violations fail before lower work;
- CUDA-JS adapter creates exact public views, passes those exact view objects, records matching access byte ranges and closes children before parents;
- Tensor connector preserves exact public callable parameter facts without importing private Tensor source;
- evaluator-free/non-Tensor/no-import paths retain zero new semantic residue.

Then run the complete Search Compiler, CUDA-JS adapter (Ubuntu + Windows), compatible-pair, Tensor connector, library-interface, documentation/governance and Engine reference gates. Any retained evidence identity changes are refreshed only from successful exact producers.

## Stop conditions

Stop and route downward rather than workaround if the public CUDA-JS view contract cannot express an admitted MCGS binding exactly. Do not implement evaluator mutable lifecycle until semantic input/output-to-Tensor parameter mapping and workspace views are explicit and validated. Do not introduce a standalone evaluator launch loop or host progress mechanism.

## Claim limit

This batch is representation/admission/composition foundation only. It does not by itself satisfy #124 request/batch/scatter/readiness lifecycle acceptance and makes no native/provider/hardware/performance claim.
