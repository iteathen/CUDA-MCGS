# CUDA-JS Runtime Adapter Portable Conformance

**Owner:** `integration.cuda-js`  
**Command:** `node scripts/run-cuda-js-runtime-adapter.mjs`  
**Native claim:** none

This capsule validates the production CUDA-MCGS-to-CUDA-JS adapter against an injected fake of the **public** CUDA-JS alpha.18 surface. It exists to falsify CUDA-MCGS-owned translation, admission, failure-projection and cleanup behavior without importing CUDA-JS internals, requiring a GPU, or claiming exact native compatible-pair support.

The committed red-before-green subject was `0cab6f869d4f40fdf4a33c7b3cd369c15ff926e0`; workflow `33911108900` reached this capsule and failed on both Windows and Ubuntu while the production adapter boundary was still absent.

## Permanent falsifiers

The capsule covers:

- exact execution-package / peer revision / package / public API identity;
- fail-closed unknown public-contract handling before lower mutation;
- allocation-alignment divisibility against lower-owned compatibility truth, with `{ byteLength }` as the only allocation request field;
- safe integer conversion and fixed v0 `maxPending=1`;
- refusal to infer a scheduler from multiple operation requirements;
- mechanical Device-JS sideband-to-public-mailbox type conversion;
- compile-returned kernel symbol/parameter use rather than adapter-owned lower ABI inference;
- runtime-entry parameter order, operation-local full-resource access records and launch dimensions;
- write-only uninitialized resources versus explicit exact-length input for read/read-write resources;
- explicit scalar values rather than schema-derived values;
- host-to-device publication and device-to-host observation directionality;
- lower compile/allocation/submit/terminal failure preservation;
- reverse resource teardown, restart-required quarantine and cleanup-exception retention;
- repeated fresh prepare/ignite/wait/close lifecycles.

The fake is evidence support only. Production source cannot import it or any other conformance/experiment path. Native CUDA correctness, provider/device support and performance remain outside this capsule and downstream of CUDA-JS #32.
