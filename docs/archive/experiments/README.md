# Archived CUDA-MCGS Experiments

**Status:** Informational

These records preserve historically useful conclusions from deleted experiments. They are provenance, not active evidence, specifications, runnable fixtures, production inputs or permission to restore native CUDA-MCGS code.

| Archived record | Former active path | Source revision | Why archived | Superseding authority |
|---|---|---|---|---|
| [`2026-08-11-cuda-device-mcgs-prototype.md.txt`](2026-08-11-cuda-device-mcgs-prototype.md.txt) | `experiments/cuda-device-mcgs-prototype/` | `5a55dc30b7145839bc8715c4ae3fa8c1fbf0d59e` | Its semantic findings moved to SPEC-0001 and CUDA-free Search IR evidence; generic execution/publication/lifecycle mechanisms moved to public CUDA-JS contracts and issues. Executable CUDA C++ and build files were removed on 2026-08-25. | ADR-0019, SPEC-0001, SPEC-0002, and the native experiment disposition audit. |
| [`2026-08-11-ptx-extension-composition-prototype.md.txt`](2026-08-11-ptx-extension-composition-prototype.md.txt) | `experiments/ptx-extension-composition-prototype/` | `c11d7911a4f0841a44404f851d93070c63c97086` | Typed RDC moved to CUDA-JS SPEC-0010/#35; semantic composition/deletion moved to SPEC-0005 and the CUDA-free Composer. Hand-authored PTX, native consumers and local PTX validation were removed on 2026-08-25. | ADR-0019, SPEC-0005, CUDA-JS public contracts, and the native experiment disposition audit. |

The supersession/removal change is the Git change containing this archive index and [`../../development/2026-08-25-native-experiment-disposition-audit.md`](../../development/2026-08-25-native-experiment-disposition-audit.md).
