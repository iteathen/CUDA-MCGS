# CUDA-JS Runtime Adapter

**Component:** `integration.cuda-js`  
**Status:** Production boundary under #125 construction  
**Owner:** CUDA-MCGS framework

This component translates an accepted CUDA-MCGS execution package into calls on an injected, versioned **public** `cuda-js` package surface. It is the runtime composition seam between CUDA-MCGS-owned search requirements and CUDA-JS-owned compiler, device, memory, module, function, operation, health and teardown mechanisms.

## Ownership

The adapter owns only:

- exact pre-allocation compatibility admission against the execution package and injected public peer identity;
- mechanical Device-JS/resource/sideband/launch translation from accepted package requirements;
- explicit pre-ignition resource/scalar input binding;
- direct ignition of the one accepted v0 operation;
- bounded external sideband publication/observation through public mailbox capabilities;
- CUDA-JS-error-to-MCGS failure classification without erasing lower public facts;
- dependency-safe rollback and teardown for lower resources assembled by this adapter.

It does **not** own Search IR interpretation, search progression, a scheduler, native CUDA, source parsing, CUDA-JS request validity/ranges, provider selection, device choice, raw handles, lower health/resource truth, private CUDA-JS implementation, native compatible-pair qualification, or performance claims.

## Version-zero limits

The initial production surface intentionally fails closed unless the accepted package can be realized as one runtime-entry operation with `maxPending=1`. Lower capacity for multiple operations is not authority to invent MCGS operation ordering or host-driven search progression.

The adapter validates requested alignment against the public CUDA-JS minimum-allocation-alignment projection but calls ordinary allocation with `{ byteLength }` only. Operation-local `read|write|read-write` bindings are the sole source of ordinary launch access ranges. Sidebands map to public named u32 publication-mailbox lanes. Scalar schemas never imply runtime values.

Prepared CUDA-JS operation DAGs are deliberately not used by this v0 path because the accepted current package carries mailbox arguments while the current public prepared-DAG binding surface does not. Direct public `CudaFunction.submit()` is the smallest sufficient lower brick.

## Public port

`index.mjs` exports:

- `prepareCudaJsExecution(executionPackage, options)` — prepares one admitted execution using an injected public `cuda-js` namespace and exact peer provenance identity;
- `CudaJsRuntimeAdapterError` — stable MCGS-side error wrapper retaining lower public error facts.

The prepared execution exposes bounded `ignite`, `publish`, `observe`, `status`, `wait`, and `close` operations. Runtime inputs are supplied to `ignite`; they are not written into or inferred from the immutable execution package.

## Qualification

Owner-local portable conformance lives under `conformance/cuda-js-runtime-adapter/` and is entered by `node scripts/run-cuda-js-runtime-adapter.mjs`. It uses an injected fake of the public CUDA-JS port so the capsule can falsify translation, failure and cleanup semantics on Windows and Ubuntu without claiming native CUDA compatibility.

Native exact compatible-pair evidence remains owned downstream by CUDA-JS #32. See `docs/development/2026-09-04-cuda-js-runtime-adapter-125-assessment-and-plan.md` for the critical assessment and execution constraints.
