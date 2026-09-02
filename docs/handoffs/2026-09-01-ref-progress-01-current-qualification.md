# REF-PROGRESS-01 current qualification — 2026-09-01

**Status:** Informational

## Acceptance subject

This record covers current-portfolio reconstruction of `REF-PROGRESS-01` / PR #167 on exact base:

`experimental/portfolio@0a2c78d44e654440ccebfcdc95e55697152a75ba`

The historical Progress head `5d0a0c833b412777ca084c7842252fa490c97a19` is preserved at `checkpoint/ref-progress-01-pre-current-portfolio-reconstruction-20260901`.

Progress owns only the 31 direct `SPEC-0012` requirements classified to `ENGINE-REFERENCE-01`: scheduler-neutral work/readiness/accounting, fairness, no-progress classification, stop/drain/closure, epoch isolation, and cleanup. Resource admission truth, contributor semantics, shared Composer stop-disposition normalization, native/CUDA realization, and product scheduling remain separate owners.

## Current-authority rebind

Initial current-base replay head `07e5275ef75ad19e8c5e11b9ec6ca75e6a3559da` intentionally retained historical Progress provenance.

- ordinary portfolio workflow `33586909466`: success;
- temporary Progress probe `33586909524`: expected failure;
- Composer completed `881/881`;
- current Composer evidence: `00045fcb77d8690bfc44bcb5b8d46d55f92db7a924203fff5c8e12b1c8710eb0`, `727811` canonical bytes;
- current Progress projection: `21c24216f104dc359a114ed10cd1885a53388ce696c075d9e0d8b932c24856bf`, `185606` canonical bytes, three profiles;
- Progress stopped before semantic case execution at the exact stale Composer-evidence guard.

Provenance-only checkpoint `f91d9791c8864ab211b1e2bb5c716b6394745393` changed only the frozen Composer SHA in `fixtures/progress-cases.json`; the fixture schema and all 19 expected case IDs remained unchanged.

- focused probe `33587068567`: success;
- unchanged full portfolio workflow `33587068553`: success.

This proved the historical case bank was insufficient: it passed while the historical Progress consumer still translated ordinary `stopDisposition: abandon` to terminal state `cancelled`.

## Red-before-green consumer correction

Test-only head `76f9721fdf2f6941370b1006949951349b0b0f90` strengthened existing case `progress-first-stop-cause` without adding a case ID. The case consumes the current normalized work class, requires an `abandon` disposition to admit terminal state `abandoned`, admits/ready-publishes such work, requests stop, and requires the resulting terminal state to be `abandoned` while preserving immutable first-stop-cause semantics.

Focused probe `33587100403` reached all 19 cases and failed exactly one:

- `18/19` passed;
- sole failure `progress-first-stop-cause`;
- actual `cancelled`;
- required `abandoned`;
- red evidence SHA-256 `f581575bd959ac86da5c72e95b11ba668f82c60e64b9238df02b6769cf0a6a28` / `11966` canonical bytes.

The minimal repair at `67024ace69d1842577eee0c65ee6b0c1fc2177b9` changes only the historical Progress consumer transition:

`abandon -> cancelled` becomes `abandon -> abandoned`.

No new mapping table or stop-disposition owner was added. Composer remains the authority that validates `abandon -> abandoned`, `cancel -> cancelled`, and `stale-dispose -> stale-disposed`; Progress merely realizes the normalized disposition in its already-declared terminal-state set.

Qualification on that repaired semantic head:

- focused probe `33587213463`: success;
- unchanged full portfolio workflow `33587213516`: success;
- Progress `19/19` expected/discovered/executed/passed;
- all `31/31` direct SPEC-0012 Progress obligations exercised;
- Progress evidence SHA-256 `5b49b433005d0ee4c47930e45fdb6bf4ed98fa000e47b774e6cb593cc96ffcf4`;
- Progress evidence canonical bytes `11830`;
- focused artifact `9830493213`, `39701` bytes, digest `sha256:df7f24e1e4196a96e9387cbaeee59eca19b75287fba846aa1a6e104263d9b099`.

## Permanent qualification and cleanup

The final candidate removes `.github/workflows/progress-reconstruction-probe.yml` completely. Progress becomes one permanent peer job in `.github/workflows/docs.yml` beside Evaluator and Resource, and aggregate `verify` requires all three plus the previously accepted governance/Search-IR/Graph/Policy jobs.

The permanent Progress job runs:

`Composer -> Progress profile projection -> Progress reference`

and retains `progress-profiles.json` plus `progress-evidence.json`.

The final exact-head ordinary workflow after this cleanup/composition is still the acceptance gate. Earlier focused and portfolio runs are evidence for the reconstruction path but are not reused as final-head qualification.

## Claim limits

This reconstruction does not establish native/CUDA scheduling mechanisms, physical GPU support, performance, first-product behavior, compatible-pair qualification, release readiness, or protected-main acceptance. It does not authorize host-driven progress or move Resource/Graph/Evaluator/Policy/Session/Output ownership into Progress.
