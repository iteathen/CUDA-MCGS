# CUDA-JS exact compatible-pair capsule

This conformance capsule is the CUDA-MCGS-owned workload/evidence construction for CUDA-JS issue #32. It does not add search semantics to CUDA-JS and does not introduce a second runtime, scheduler, native path, CUDA source path, raw handle, or private/deep CUDA-JS import.

The capsule constructs the selected accepted CUDA-MCGS owner chain, including the accepted Async Stage Channel publication semantics and a terminal-only Output, then passes one truthful profile template through production `createResolvedComposerInput` and production `composeResolvedEngine`. The resulting execution package is realized only through production `integration.cuda-js`.

The first bounded workload uses 1,024 useful device work items over the exact 4,096-byte terminal Output reserve. One Channel-owned producer writes a payload and performs public device-scope release publication; one consumer performs public acquire before consuming that payload. A block barrier makes the two selected work items deterministic without substituting for the required release/acquire publication semantics. The host performs one ignition, waits, then performs terminal D2H delivery through the declared Output range.

`run-portable.mjs` is CUDA-free construction/lifecycle/falsifier evidence. It intentionally reuses the historical adapter fake only as lower lifecycle scaffolding; that fake is not a native workload oracle and portable success is not physical qualification.

The exact lower tuple is supplied by the invoking workflow/operator. The capsule verifies that the composed execution package carries that exact CUDA-JS revision/package/API identity. A physical runner must additionally verify both Git commit/tree identities and collect the public CUDA-JS runtime/compiler/artifact/module/device/provider/health facts from the same execution before any compatible-pair claim is accepted.

Portable command used by CI:

```text
node scripts/run-cuda-js-compatible-pair.mjs portable
```

with `CUDA_JS_REVISION`, `CUDA_JS_TREE`, `CUDA_JS_PACKAGE`, and `CUDA_JS_API_SCHEMA` set to the frozen construction tuple.

Claim limit: this directory is evidence/conformance construction only. Hosted CI, mocks, portable execution, VMs, WSL, and containers do not satisfy CUDA-JS #32 physical evidence.
