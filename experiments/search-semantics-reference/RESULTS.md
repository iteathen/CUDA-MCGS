# CUDA-MCGS search-semantics reference harness results

**Status:** Informational

**Updated:** 2026-08-25

The `REF-HARNESS-01` capsule passed on 2026-08-25 with Node.js `v26.7.0`, `win32`, `x64`:

- expected/discovered/executed/passed: `22/22/22/22`;
- failed: `0`;
- required/conditional/optional skipped: `0/0/0`;
- not discovered/not executed by selection: `0/0`.

The exact consumed representation/composition evidence is:

- SHA-256: `70aa92baf5ab1fee4bf4b85af4cf1e6d76eca3c51fc11ab4120d62a6f71529d9`;
- canonical bytes: `719393`;
- Composer cases: `878/878` passed.

The harness evidence identity is:

- algorithm: SHA-256 over canonical source-keyed evidence;
- SHA-256: `126c654ccf4ccf3fbadc35cd00c628c8e4f9dedd28fdcd5a712973e8cdb0fd1f`;
- canonical bytes: `5235`.

One focused mutation case also passed independently with expected/discovered/executed/passed `22/22/1/1` and 21 explicitly unexecuted-by-selection cases. Focused evidence is not used for the full-harness claim.

Machine evidence is reproducible at ignored `experiments/search-semantics-reference/build/evidence.json`. The critical assessment governs the slice; the evidence identity binds the schedule fixture, harness sources, runner and exact live Composer evidence output without creating a self-referential plan/result digest. Generated evidence is removed after branch reconciliation.

This proves only the semantic-neutral schedule/event/owner-isolation/mutation/evidence harness. No Domain, Graph, Policy, Evaluator, Resource, Progress, Output, Session, Stage or Channel behavioral oracle exists in this slice. It creates no production, native, performance, search-quality, public-SDK, contract-acceptance or multi-GPU-support claim.
