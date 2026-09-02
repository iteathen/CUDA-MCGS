# REF-RESOURCE-01 qualification record — 2026-09-01

**Status:** Informational

## Current reconstruction

`REF-RESOURCE-01` has been reconstructed from the accepted current portfolio while preserving the reviewed Resource semantic owner.

Current accepted base:

`experimental/portfolio@f2fa9d0676c770cb19f1cc754ce9db56d2048394`.

Historical reviewed/repaired source head:

`081b2f1bf49d906a400f9010ce1ba2ee61f5ceb1`.

Historical source checkpoint:

`checkpoint/ref-resource-01-pre-current-portfolio-reconstruction-20260901`.

The exact original construction documents and full historical repair chronology remain preserved at that checkpoint. This active record contains the current integration facts only.

## Ownership boundary

Resource owns only the 34 direct `SPEC-0011` `ENGINE-REFERENCE-01` obligations:

- `RESOURCE-ADMIT-001..011`;
- `RESOURCE-PRESSURE-001..007`;
- `RESOURCE-EXHAUST-001..008`;
- `RESOURCE-LIFE-001..006`; and
- `RESOURCE-CLEANUP-001..002`.

Resource owns finite reservation/lease accounting, all-or-none admission, stale-safe lease identity, pressure/exhaustion facts, lifecycle, and cleanup.

It does not own contributor response policy, Graph/Evaluator/Output victim selection, Progress scheduling/fairness, product policy, physical allocation, CUDA atomics/memory ordering, or CUDA-JS realization.

## Reconstruction method

The 14 non-workflow Resource-owned semantic/reference/provenance files were replayed from the reviewed historical head onto the current accepted portfolio.

`.github/workflows/docs.yml` was not replayed from the stale branch. Instead, Resource was composition-added to the current permanent workflow so that:

- the accepted Evaluator job remains present;
- Resource is a peer job; and
- aggregate `verify` requires both Evaluator and Resource together with all existing peer gates.

No current Composer, Evaluator, Graph, Policy, Progress, or production implementation source was replaced.

## Fail-closed provenance reconstruction

First current-base probe head:

`0d8b00698778c68d063e949e6277cfe036c10d2d`.

Normal workflow `33585794667`: expected failure.

All accepted peer jobs were green. Resource alone stopped before semantic case execution because its fixture still named the historical Composer evidence.

The current generated authority was:

- Composer `881/881`;
- Composer representation/composition evidence `00045fcb77d8690bfc44bcb5b8d46d55f92db7a924203fff5c8e12b1c8710eb0`;
- Composer canonical bytes `727811`;
- Resource projection `6bc217079b56e0d377ab8bb5f29bda47e551fab0fccbda59e12624daa5b3bd70`;
- Resource projection canonical bytes `983107`;
- Resource profiles `3`.

No Resource semantic case ran under stale provenance.

## Provenance-only rebind

Semantic checkpoint:

`65c99981cfbd0d0cfc62fe4bc75dfc74c91d2b0d`.

The only semantic-checkpoint mutation after replay changed two frozen SHA-256 values in `experiments/search-semantics-reference/fixtures/resource-cases.json`:

- historical Composer `1285fa9a...` -> current `00045fcb...`;
- historical Resource projection `a4a9f371...` -> current `6bc21707...`.

The schema, canonical byte lengths, and all 23 expected case IDs remained unchanged. No Resource oracle or case implementation changed.

## Current semantic qualification

Normal workflow `33585922613` on exact semantic checkpoint `65c99981...`: **success**.

All current merge-gate jobs passed, including Governance, Windows/Ubuntu Search IR, all integrated Graph references, Policy, Evaluator, Resource, and aggregate `verify`.

Resource job `100109931659` recorded:

- expected/discovered/executed/passed `23/23/23/23`;
- failed/not-discovered/not-executed `0/0/0`;
- all `34/34` direct Resource obligations mapped and exercised;
- Resource evidence SHA-256 `698dce4bea176d43a510b61bbabc8f9cf31d20ae1f882505b5babc575f15d40c`;
- Resource evidence canonical bytes `12512`.

Retained Resource artifact:

- artifact ID `9830059175`;
- size `147424` bytes;
- archive digest `sha256:9675fef24a698fe067d48ba6689eff23c3f695058319469d54d761abeafdcb8a`.

This establishes that the reviewed Resource semantics survive the accepted Evaluator and shared Progress/Composer authority without a new Resource semantic repair.

## Preserved high-risk falsifier

The review-driven compound-admission repair remains present unchanged.

`reserveCompound()` preflights one transaction-local logical lease-ID namespace before any commit. One compound transaction may therefore contain at most one reservation for one logical `leaseId`, regardless of generation.

The stable `resource-compound-admission-rollback` case proves:

- last-class capacity failure leaves no partial live state;
- duplicate exact lease identity rejects before mutation;
- same logical lease ID with a different generation rejects before mutation;
- live accounting and authoritative lease state remain unchanged across rejection; and
- normal all-or-none compound success remains valid.

## Documentation qualification incident

A later documentation-only candidate initially failed governance because the rewritten `**Status:**` line included explanatory text after `Informational`. Repository governance requires the exact marker form:

`**Status:** Informational`

All semantic/reference jobs, including Resource, remained green in that failed run. The documentation is corrected here without changing Resource semantics.

## Final review seam

This record intentionally does not embed the final documentation commit SHA or final workflow run number because doing so would create another documentation commit and invalidate the embedded head.

PR #166 is the canonical exact-head review record. Before integration it must show:

1. the final documentation head;
2. a green normal workflow on that exact head;
3. a whole-diff review from exact `experimental/portfolio@f2fa9d0676c770cb19f1cc754ce9db56d2048394`;
4. fresh exact-head repository-owner/independent authorization; and
5. guarded integration/readback.

## Claim limits

This qualification does not establish #122 production acceptance, physical CUDA allocation feasibility, native atomics/fences, CUDA-JS compatible-pair support, Progress scheduling/fairness, product behavior, performance, physical support, or release readiness.
