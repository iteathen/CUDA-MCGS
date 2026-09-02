# REF-RESOURCE-01 assessment and plan — 2026-09-01

**Status:** Informational

This is the historical construction assessment for `REF-RESOURCE-01`. It is retained to explain the ownership decision and original falsifiers, not as the live integration state.

The exact historical reviewed branch is preserved at:

`checkpoint/ref-resource-01-pre-current-portfolio-reconstruction-20260901@081b2f1bf49d906a400f9010ce1ba2ee61f5ceb1`.

Current reconstruction/qualification state is recorded in `docs/handoffs/2026-09-01-ref-resource-01-qualification.md` and PR #166.

## Original objective

Construct the next independent `ENGINE-REFERENCE-01` LEGO: a deterministic CUDA-free Resource oracle for the 34 direct `SPEC-0011` requirements classified to `ENGINE-REFERENCE-01`, without choosing CUDA mechanisms, absorbing contributor response policy, or moving Progress scheduling into Resource.

Original construction base:

`experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`.

## Ownership conclusion

`SPEC-0011` has one semantic Resource owner for:

- finite reservation/admission and all-or-none compound transactions;
- stale-safe lease identity and exact generations/epochs;
- claimed/published/retired-unreclaimed/quarantined conservation;
- typed pressure and Resource exhaustion facts;
- immutable first terminal Resource cause;
- finite counters without wrap/alias;
- lifecycle/draining and declared closure reserves; and
- complete teardown/cleanup disposition.

It does not own Graph/Evaluator/Output/Policy response selection, Progress fairness/scheduling, product policy, physical allocation, atomics, CUDA memory ordering, or CUDA-JS realization.

The smallest sufficient reference was therefore an in-memory deterministic semantic ledger using ordinary JavaScript `Map`, `Set`, and `BigInt` only as oracle mechanisms.

## Original construction plan

1. Project exact normalized Resource profiles from the existing Composer.
2. Build one Resource-owned semantic oracle for lease/accounting/pressure/exhaustion/lifecycle/cleanup transitions.
3. Derive all 34 direct requirement IDs from `SPEC-0011` and require every one to map to a finite checked-in case bank.
4. Add mutation sensitivity for conservation/quiescence failures.
5. Add a peer permanent `Resource reference` CI job and include it in aggregate fail-closed `verify`.
6. Qualify on one exact head, perform whole-owner review, and require exact-head authorization before integration.

## Historical defects exposed during construction/review

The construction/review cycle found and repaired several real Resource-owner defects before the historical head was accepted as source evidence:

- terminal exhaustion initially failed to close ordinary admission into `draining`;
- teardown could silently release foreign-owner state without explicit disposition authority;
- Resource invented a Policy-owned status for `policy-budget`;
- lease lookup authenticated only `leaseId + generation` instead of full class/owner/epoch identity;
- runtime contributor removal incorrectly mutated the immutable Resource plan;
- exhaustion diagnostics were not bound to normalized class/owner/pool/partition coordinates;
- failed admission exposed a weaker diagnostic shape than explicit exhaustion; and
- later review found compound admission could partially commit when two reservations reused one logical lease ID.

The final historical compound-admission repair preflights one transaction-local logical lease-ID namespace before any commit. Duplicate exact identity and same-ID/different-generation members reject before mutation with `RESOURCE_REFERENCE_TRANSACTION_LEASE_IDENTITY`.

## Historical evidence disposition

The full original assessment, detailed repair chronology, exact intermediate heads, runs, and evidence remain recoverable from the preserved checkpoint above. They are intentionally not repeated here because the active branch now targets a newer accepted portfolio authority.

No historical result by itself qualifies the current reconstruction or authorizes #122, native/CUDA realization, performance, physical support, or release readiness.
