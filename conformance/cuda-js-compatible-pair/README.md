# CUDA-JS exact compatible-pair conformance capsule

This directory owns CUDA-MCGS-side evidence for CUDA-JS issue #32 and CUDA-MCGS issue #221. It is conformance evidence, not a production component and not a second CUDA runtime abstraction.

## Claim boundary

The capsule constructs a fresh exact-pair Program Package through the production Composer and executes it through production `integration.cuda-js`. The selected workload uses accepted Domain/Graph/Policy owners, SPEC-0004 Channel, SPEC-0011 Resource, SPEC-0012 Progress, and terminal-only SPEC-0013 Output. It has no Search Session, live observation, Tensor/cuBLASLt, CUDA Graph, native escape path, or host active-search loop.

The deterministic first workload launches 4 blocks x 256 threads. Every work item writes one terminal u32 inside the accepted 4,096-byte Output reserve. Channel-owned device-search memory separately carries the payload/readiness state. Work item 0 writes payload then calls `gpu.atomic.storeReleaseDevice`; after `gpu.barrier.block()`, work item 1 calls `gpu.atomic.loadAcquireDevice` and consumes payload plus readiness. The barrier only sequences the small deterministic shape; it does not replace the required device release/acquire publication edge.

`src/public-recorder.mjs` is a transparent conformance recorder around the injected public `cuda-js` namespace and the public capabilities returned by that same runtime. It records the exact compile input identity, public compiler/linker artifact facts, module load bytes identity, function submission, operation status/wait, terminal D2H child, capability cleanup, runtime description, and terminal runtime report. It never imports CUDA-JS internals, inspects generated CUDA/PTX, exposes raw handles/pointers, or launches a second compile/runtime transaction.

## Portable qualification

Portable qualification requires the exact CUDA-JS source checkout as provenance input, but it does not import or execute that checkout natively. CI checks out the frozen CUDA-JS revision and runs the capsule on Windows and Ubuntu with Node 26.7.0:

```text
node scripts/run-cuda-js-compatible-pair.mjs portable
```

The runner emits stable `PAIR-F01` through `PAIR-F16` falsifier IDs covering stale source/lower identity, unsafe ranges, publication requirement/helper removal, host relaunch contamination, wrong Channel/Output bindings, terminal range, lower capability/alignment rejection, premature delivery, deferred failure, timeout/abandonment, quarantine/restart truth, same-transaction recorder correlation, and CUDA-JS consumer-neutral source deletion. Hosted/portable success is never native or physical CUDA qualification.

The historical `conformance/cuda-js-runtime-adapter` fake remains lifecycle scaffolding only. Its old provenance, 16-byte Output, and old launch shape are not physical oracles for this pair.

## Exact physical runner

The native runner imports only the public package specifier `cuda-js`. Because `cuda-js@0.1.0-alpha.18` is not registry-published, the public package must resolve through `node_modules/cuda-js` to the exact CUDA-JS Git checkout being qualified. The runner independently verifies both Git HEAD/tree identities, CUDA-JS package/API metadata, the public root export realpath, and the pair injected in the environment before the production adapter can open the lower runtime.

Use an exact protected CUDA-MCGS checkout and an exact protected CUDA-JS checkout. Install CUDA-JS dependencies in its own checkout, then link that checkout as the public package without copying it. For example on POSIX:

```bash
npm --prefix /path/to/CUDA-JS ci
mkdir -p /path/to/CUDA-MCGS/node_modules
ln -s /path/to/CUDA-JS /path/to/CUDA-MCGS/node_modules/cuda-js
```

On Windows PowerShell, use a directory junction instead of a copied package:

```powershell
npm --prefix C:\path\to\CUDA-JS ci
New-Item -ItemType Directory -Force C:\path\to\CUDA-MCGS\node_modules | Out-Null
New-Item -ItemType Junction -Path C:\path\to\CUDA-MCGS\node_modules\cuda-js -Target C:\path\to\CUDA-JS
```

Run Node 26.7.0 with CUDA-JS's required `--experimental-ffi` flag. If the Node permission model is active, also grant CUDA-JS's documented FFI permission. Supply the exact source pair being qualified; do not substitute stale fixture constants:

```bash
CUDA_MCGS_REVISION=<exact protected CUDA-MCGS commit> \
CUDA_MCGS_TREE=<exact protected CUDA-MCGS tree> \
CUDA_JS_SOURCE_ROOT=/path/to/CUDA-JS \
CUDA_JS_REVISION=<exact protected CUDA-JS commit> \
CUDA_JS_TREE=<exact protected CUDA-JS tree> \
CUDA_JS_PACKAGE=cuda-js@0.1.0-alpha.18 \
CUDA_JS_API_SCHEMA=1 \
node --experimental-ffi scripts/run-cuda-js-compatible-pair.mjs native > compatible-pair-native-evidence.json
```

A passing native run emits the exact source/host/runtime/provider/device/target/program/artifact/module/launch/publication/operation/delivery/cleanup tuple plus the copied terminal bytes. It qualifies only that recorded physical profile. Portable failure-path cases are referenced separately by stable ID and are not relabeled as physical failure injection.

CUDA-JS issue #32 remains open until such a bundle is produced on an accepted physical NVIDIA host and reviewed against the exact integrated source pair. No hosted CI result in this repository closes that gate.
