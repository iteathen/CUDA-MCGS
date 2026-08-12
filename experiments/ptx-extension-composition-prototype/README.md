# CUDA-MCGS PTX Extension Composition Prototype

**Status:** Disposable experiment; no production authority

**Owner:** CUDA-MCGS search-composition experiment owner

## Question

Can CUDA-MCGS validate a finite extension plan, generate an unbound hot path with no extension residue, bind one or more direct PTX device symbols, ask the public CUDA-JS package to link/load/launch the result, and complete a small search without a host-produced intermediate decision?

This experiment also separates what can be made to work from what should become the durable design. Hand-authored PTX, fixture-level text checks, and a sibling-checkout package are acceptable discovery mechanisms. They are not proposed production mechanisms.

## Bounded vertical slice

The prototype exercises:

- a schema-shaped Extension Surface and two point-specific fragment manifests;
- strict, fail-closed manifest, ABI, permission, resource, PTX-profile, byte, and digest checks before native work;
- deterministic plan identity over exact ordered PTX bytes and composition inputs;
- identical generated core PTX for a surface with no points and an unbound surface;
- one bound score-transform fragment, one bound backup-observer fragment, and both fragments together;
- direct statically named device calls, with no function-pointer table or runtime registry;
- a fused CUDA-source control compiled through CUDA-JS;
- one launch containing transition, transposition recognition, root-cycle recognition, evaluation, extension activation, backup, finite-resource stop, and result publication;
- native link failure and recovery, CUDA-JS validation recovery, memory-quota rejection and recovery, graceful resource closure, and emitted cubin/SASS/resource evidence.

The search is deliberately tiny and single-threaded. It tests composition and lifecycle, not scheduler selection, representative performance, concurrency, search quality, or production lowering.

## Run

Portable validation, including the Linux-preparable lane:

```powershell
& '..\CUDA-JS\build\toolchains\node-v26.7.0-win-x64\node.exe' scripts/run-ptx-extension-prototype.mjs portable
```

Windows native discovery against an exact clean CUDA-JS `main` checkout:

```powershell
& '..\CUDA-JS\build\toolchains\node-v26.7.0-win-x64\node.exe' scripts/run-ptx-extension-prototype.mjs native
```

The native runner packs the public `cuda-js` package into ignored experiment output, installs that tarball in an isolated generated consumer, and imports only `cuda-js`. It refuses a wrong branch, revision, or dirty CUDA-JS checkout. It never reads or modifies the active CUDA-JS LTO branch.

Generated evidence is written beneath `build/` and is not source authority. Curated results and ownership dispositions belong in [`RESULTS.md`](RESULTS.md) and [`FINDINGS.md`](FINDINGS.md).

Dispose generated experiment evidence after curation:

```powershell
& '..\CUDA-JS\build\toolchains\node-v26.7.0-win-x64\node.exe' scripts/run-ptx-extension-prototype.mjs cleanup
```

## Acceptance and falsifiers

Acceptance requires all portable cases and all attempted Windows-native cases to pass, exact CPU/device output parity for each runnable profile, byte-identical no-point/unbound core PTX, expected failure before ignition for incompatible manifests, recovery after expected CUDA-JS/link/quota failures, and graceful CUDA-JS closure.

The experiment is falsified for promotion if a selected direct symbol cannot link, an output differs, an invalid contract reaches native work, unbound generation retains extension symbols/calls, or cleanup is not graceful. A successful workaround is recorded under “can”; it enters “should” only if it preserves ownership, determinism, compatibility, diagnostics, and the hot-path contract without exporting unacceptable complexity.

## Linux gap

The portable lane is OS-neutral and checks exact bytes, manifests, bounds, identities, and generated source. It does not prove PTX validity. Only the native linker can establish PTX syntax, symbol, and relocation compatibility.

Native Linux remains unproved because the selected CUDA-JS revision has no accepted Linux CompilerActor/DriverActor compatible pair. No Linux cubin, SASS, launch, cleanup, performance, or compatible-pair claim follows from this experiment. The same portable command should run on Linux now; native qualification is a later CUDA-JS-owned platform capability plus a CUDA-MCGS compatible-pair run.

## Disposal and promotion

Production code may not import this directory. Useful semantics must be re-derived into accepted CUDA-MCGS schemas/specifications and an owned composer/generator. Generic, consumer-neutral runtime/compiler needs must be assessed in CUDA-JS independently. Delete generated package/install/artifact output after evidence is curated; retain the bounded source fixture only while it answers an open design question.
