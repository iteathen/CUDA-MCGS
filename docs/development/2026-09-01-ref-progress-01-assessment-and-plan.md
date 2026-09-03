# REF-PROGRESS-01 current-portfolio reconstruction note — 2026-09-01

**Status:** Informational

This active-branch note supersedes the historical Progress assessment for current execution. The exact historical assessment remains preserved at `checkpoint/ref-progress-01-pre-current-portfolio-reconstruction-20260901`.

Current reconstruction base: `experimental/portfolio@0a2c78d44e654440ccebfcdc95e55697152a75ba`.

The current portfolio includes accepted Evaluator, Resource, and shared Composer stop-disposition authority. The historical Progress implementation is being replayed conservatively: unaffected Progress files retain their exact historical blobs; current authority is rebound only after a fail-closed provenance probe.

One semantic mismatch is already demonstrated by accepted Composer authority: ordinary `stopDisposition: abandon` now terminates as `abandoned`. The historical Progress oracle still translated `abandon` to `cancelled`. Progress must consume the normalized work class disposition and realize its already-declared terminal state; it must not create another mapping authority.

The reconstruction sequence is:

1. replay the historical Progress packet on the exact current portfolio while intentionally retaining stale provenance;
2. require current peer owners to remain green and Progress to stop at its provenance guard;
3. rebind only demonstrated current provenance;
4. add/strengthen a consumer-boundary falsifier inside the existing 19-case bank for `abandon -> abandoned`;
5. repair only the historical Progress consumer translation if that falsifier demonstrates the mismatch;
6. qualify all 19 Progress cases and 31 direct SPEC-0012 obligations;
7. remove temporary probe workflow, compose Progress additively into the permanent current gate, reconcile evidence/docs, and qualify one final exact head;
8. require fresh exact-head review/authorization before integration.

No CUDA/native mechanism, product-specific scheduling, host-progress loop, Resource policy, or new stop-disposition mapping owner is introduced by this reconstruction.
