# CUDA-MCGS PTX Extension Composition Results

**Status:** Bounded Windows discovery extended; production decision still open

## Exact subject and result

The extended experiment ran on 2026-08-11 from CUDA-MCGS branch `codex/ptx-granularity-exploration`, based on `c11d7911a4f0841a44404f851d93070c63c97086`. It packed and installed the public `cuda-js` package from a clean local `main` checkout at exact revision `ad49a6c9b0cddb420e26e097180cf9c502060a65`; the generated tarball SHA-256 was `92b7fbb425059b7b6b46b9f95638198c6957ead7dd820ef0a000a49294962c56`.

The final generated portable package identity was `ca9eb6af112ba8470f290c6a08b98e5ccb0596762b409f6006999e9249a39e76`.

- Portable capsule: 42 expected, discovered, and executed; 42 passed; zero skips or undiscovered cases.
- Windows-native capsule: 25 expected, discovered, and executed; 25 passed; zero skips or undiscovered cases.
- Native profile: Node.js 26.7.0 with experimental FFI, Windows x64, CUDA Driver API 13030, CUDA 13.3 NVRTC/nvJitLink providers, GeForce GTX 1660 Ti, compute capability 7.5, WDDM watchdog enabled.
- CUDA-JS classified the host as `testing-unconfirmed` because its complete host profile is not an accepted exact qualification profile. This narrows the result; it does not invalidate the bounded execution evidence.
- Final runtime cleanup was graceful: all six NVRTC programs and 22 link handles were destroyed, both workers exited with code 0, and no live or orphaned Driver resources remained.

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

## Controlled granularity probe

The follow-up holds the PTX version, target, kernel shape, integer operation, output, and `%clock64` instrumentation constant. It varies only how one through eight identical-shaped operations are realized: inline in the entry, as `.func` definitions in the same PTX input, as individual separate PTX inputs called inside the work loop, or as one separate coarse module that owns the entire loop. Every profile produced exact CPU/device parity for 32,768 threads.

| Profile | Cubin bytes | Kernel registers | SASS calls | Functions |
|---|---:|---:|---:|---:|
| Inline, zero operations | 3,944 | 14 | 0 | 1 |
| Inline, one operation | 4,712 | 14 | 0 | 1 |
| Same-module internal, one operation | 5,096 | 24 | 1 | 2 |
| Same-module visible, one operation | 5,288 | 24 | 1 | 2 |
| Separate fine, one operation | 5,416 | 24 | 1 | 2 |
| Separate fine, two operations | 6,312 | 24 | 2 | 3 |
| Separate fine, four operations | 8,232 | 24 | 4 | 5 |
| Inline, eight operations | 4,456 | 14 | 0 | 1 |
| Same-module internal, eight operations | 10,472 | 24 | 8 | 9 |
| Separate fine, eight operations | 12,072 | 24 | 8 | 9 |
| Separate coarse, eight operations | 5,672 | 24 | 1 | 2 |

All controlled profiles used zero stack, local, and shared memory. The separate-fine artifact grew from 5,416 bytes and one SASS call at one operation to 12,072 bytes and eight calls at eight operations. Internal same-module functions saved some artifact bytes at eight operations, but retained all eight `CALL.ABS.NOINC` instructions and the same 24-register kernel. Merely placing functions in the core PTX input therefore did not recover inlining on this exact toolchain/GPU profile.

Device-relative measurements are the median per-thread `%clock64` delta, followed by the median of seven launches. They compare only variants within this exact instrumented profile; they are neither wall-clock time nor a production benchmark.

| Work shape | Rounds | Inline ticks | Same-module ticks | Separate-fine ticks | Separate-coarse ticks |
|---|---:|---:|---:|---:|---:|
| One operation | 1 | 214 | 610 | 624 | 1,014 |
| One operation | 8 | 434 | 1,446 | 1,449 | 1,113 |
| One operation | 32 | 1,038 | 4,327 | 4,318 | 1,710 |
| One operation | 128 | 3,697 | 16,049 | 16,052 | 4,070 |
| Eight operations | 1 | 245 | 3,905 | 3,923 | 892 |
| Eight operations | 4 | 743 | 6,949 | 6,944 | 1,395 |
| Eight operations | 16 | 2,790 | 19,142 | 19,128 | 3,370 |
| Eight operations | 32 | 5,830 | 35,328 | 35,308 | 6,130 |

At the longest tested shape, one fine call per operation/round cost 4.34× the inline ticks for one operation and 6.06× for eight operations. One coarse call around all repeated work reduced that to 1.10× and 1.05× respectively. At one round, the coarse one-operation form was itself slower than the fine call because its own loop and call setup had not been amortized. Coarsening is therefore an evidenced option, not a universal free solution.

Host `performance.now()` samples around awaited CUDA-JS launches were bimodal and quantized on the WDDM path, including roughly millisecond-scale values that did not track the generated work. They are retained as evidence that this boundary is unsuitable for fine kernel comparison and are not used for the ratios above. A representative follow-up needs GPU-event/profiler timing, occupancy evidence, real search/evaluator work, more GPUs, and Linux.

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

This experiment rejects fine call-per-hook PTX as the default realization for tiny, frequently executed policy hooks on the tested profile. It does not yet select the production extension model, scheduler, generator, PTX parser, ABI, workload, or performance threshold. In particular, a broad semantic extension surface need not map one-to-one to separately callable PTX functions: a future composer may lower hot micro-policies into fused generated core code while reserving relocatable PTX calls for coarse modules or stages. That distinction remains a design candidate, not an accepted specification.

The result does not accept the proposal schemas as normative, qualify a release pair, or authorize production implementation. Generated package installs and tarballs were removed immediately; ignored portable/native evidence was retained only through result curation and is disposable.
