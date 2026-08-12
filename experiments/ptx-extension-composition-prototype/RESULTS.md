# CUDA-MCGS PTX Extension Composition Results

**Status:** Bounded Windows discovery complete

## Exact subject and result

The experiment ran on 2026-08-11 from CUDA-MCGS branch `codex/cuda-mcgs-ptx-discovery`, based on `62948a1f5750d487b6002b8dbeaa74d46dc0dd61`. It packed and installed the public `cuda-js` package from a clean local `main` checkout at exact revision `ad49a6c9b0cddb420e26e097180cf9c502060a65`; the generated tarball SHA-256 was `92b7fbb425059b7b6b46b9f95638198c6957ead7dd820ef0a000a49294962c56`.

The final generated portable package identity was `48352c62dabbc05f6774c49d8c7482bb911f887555a10444fb9a7b9ad6ace699`.

- Portable capsule: 37 expected, discovered, and executed; 37 passed; zero skips or undiscovered cases.
- Windows-native capsule: 13 expected, discovered, and executed; 13 passed; zero skips or undiscovered cases.
- Native profile: Node.js 26.7.0 with experimental FFI, Windows x64, CUDA Driver API 13030, CUDA 13.3 NVRTC/nvJitLink providers, GeForce GTX 1660 Ti, compute capability 7.5, WDDM watchdog enabled.
- CUDA-JS classified the host as `testing-unconfirmed` because its complete host profile is not an accepted exact qualification profile. This narrows the result; it does not invalidate the bounded execution evidence.
- Final cleanup was graceful: all six NVRTC programs and ten link handles were destroyed, both workers exited with code 0, and no live or orphaned Driver resources remained.

## What worked

The prototype validated a finite composition plan, produced ordered PTX inputs, linked direct device symbols, loaded the cubin, launched one device-closed miniature search, and published the expected 12-word result. All no-point, unbound, bias-only, observer-only, two-fragment, and fused-control device outputs matched the CPU oracle. The two-fragment result was:

```text
magic=0x4d434753 iterations=12 nodes=3 transposition_hits=10 root_cycles=4
backups=12 accumulated_score=139 stop=budget active_extension_iterations=8
checksum=2166129286 seen_mask=11 final_state=1
```

The missing-fragment case failed at link completion with an explicit undefined-symbol log, after which the same CUDA-JS CompilerActor linked valid PTX successfully. Typed architecture mismatch and allocation-over-limit requests also failed through stable public errors without poisoning the runtime.

## Unbound and bound emitted-code evidence

No-point and unbound generation produced byte-identical core PTX with SHA-256 `295cfb7a5e640d8f129c59461b2636fe57fe9c47b1e03cec097b35ddb068e64f`. They also produced byte-identical final cubins with SHA-256 `e32ca04b68e2e32e12e44462ec967a6e9927089dbab15fceebeba47684c7a0f7`. Neither PTX nor SASS contained an extension symbol or call.

| Realization | Cubin bytes | Kernel registers | SASS calls | Extension symbols |
|---|---:|---:|---:|---|
| No point | 4,392 | 18 | 0 | 0 |
| Unbound surface | 4,392 | 18 | 0 | 0 |
| Bias fragment | 5,992 | 29 | 1 | 1 |
| Observer fragment | 5,992 | 30 | 1 | 1 |
| Bias + observer PTX fragments | 7,016 | 31 | 2 | 2 |
| Fused generated-source control | 4,520 | 17 | 0 | 0 |

All profiles used zero stack, local, and shared memory in this fixture. The two-fragment linked artifact was 2,496 bytes larger than the fused control and used 14 more kernel registers; its two direct device calls remained in SASS, while the fused functions were inlined away.

This is not a representative performance result, and hand-authored versus NVRTC-generated core PTX is not a controlled attribution of every byte or register to separate linking. It is decisive evidence that “static direct symbol” does not imply fused-equivalent emitted code. The version-zero PTX profile therefore cannot claim zero bound-fragment cost without a more representative, controlled acceptance envelope.

## Concrete CUDA-JS boundary discovered

The public CUDA-JS `compile()` request at the tested revision accepts architecture, language standard, `fmad`, device-as-default-execution-space, and header profile. It cannot request relocatable device code.

Using that current public surface:

- the modular core compiled to 4,196-byte PTX containing both external declarations;
- separate bias and observer CUDA sources each compiled to the same 201-byte header-only PTX because their unreferenced device definitions were eliminated;
- adding fake retention kernels produced 544-byte and 560-byte PTX, but NVRTC folded the device functions into the fake kernels and still emitted no externally linkable definitions;
- both normal and retention-hack three-input links failed with explicit undefined references;
- the CompilerActor remained healthy and closed gracefully.

Hand-authored PTX proves that the existing ordered multi-input `link()` capability is sufficient once valid linkable PTX exists. It does not provide a durable CUDA-source-to-relocatable-PTX authoring path. The smallest evidenced CUDA-JS feature candidate is a typed, identity-bearing NVRTC relocatable-device-code compile option, independently assessed against current CUDA-JS compiler policy and tests.

## Bounds and negative coverage

Portable tests reject unknown fields, duplicate points/bindings, unknown points, wrong point versions, ABI and context mismatches, excess permissions/resources, PTX profile or digest mismatch, missing exports, CRLF/NUL/non-ASCII/oversized PTX, node and iteration bounds, invalid activation, and excess fragments. Native tests cover unresolved symbols, typed architecture mismatch, device-memory allocation bounds, recovery, exact output, and cleanup.

The fixture checker intentionally recognizes only the frozen fixture profile. It is not a PTX parser and cannot prove PTX grammar, relocation, symbol visibility, or final machine-code behavior; nvJitLink and emitted-binary inspection supply that native evidence.

## Linux gap and claim limits

The same portable capsule is designed to run on Linux and covers exact bytes, manifests, identities, generated PTX/source, bounds, and the CPU oracle. It was not executed on a Linux host in this task.

No native Linux CUDA-JS CompilerActor/DriverActor compatible pair exists at the selected revision, so there is no Linux nvJitLink result, cubin, SASS, launch, cleanup, or performance evidence. Portable validation must never be presented as native Linux CUDA support.

This experiment does not select a production scheduler, extension granularity, generator, PTX parser, ABI, workload, or performance threshold. It does not accept the proposal schemas as normative, qualify a release pair, or authorize production implementation. Generated package installs and tarballs were removed immediately; ignored portable/native evidence was retained only through result curation and is disposable.
