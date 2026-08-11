# CUDA-MCGS Search IR reference results

**Status:** Informational

**Updated:** 2026-08-11

The reconciled repository-wide validation capsule passed on 2026-08-11 with Node.js `v26.7.0`, `win32`, `x64`. Exact result:

- expected/discovered/executed/passed: `18/18/18/18`;
- failed: `0`;
- required/conditional/optional skipped: `0/0/0`;
- not discovered: `0`.

The stable Search IR identity is:

- canonical algorithm: `utf8-json-sorted-keys-v1` plus SHA-256;
- canonical bytes: `7749`;
- SHA-256: `bd6679178c6754fe9b06d6fa54d038166b7ef39e32fb5f51513cc303cfd63a96`.

The source-keyed machine evidence is generated at `experiments/search-ir-reference/build/evidence.json`, ignored by Git, and reproducible through `node scripts/run-search-ir-reference.mjs`. The retained result above includes both governing specifications, schema, all fixtures, normalizer, reference interpreter, and capsule runner in its source identity.

Native Linux CUDA remains untested. Ubuntu CI will run this CUDA-free capsule and must match the same canonical identity and case outcomes; until that remote job passes, Linux reference portability is pending. Even a pass will not qualify a Linux CUDA provider, GPU path, sanitizer, cleanup path, or CUDA-JS compatible pair.
