# REF-PROGRESS-01 assessment and plan — 2026-09-01

**Status:** Informational

## Assess

`ENGINE-REFERENCE-01` still needs an independent CUDA-free reference for the Progress-owned behavioral surface of `SPEC-0012`.

The exact dependency-frozen source authority for this leaf is:

`experimental/portfolio@95fdda77d002cc899a6534f02a6c2af0580303af`

The normalized Progress IR already exists in the Composer. There is no independent `run-progress` semantic reference on that exact base.

The requirement-coverage registry assigns 31 direct obligations to `ENGINE-REFERENCE-01`:

- `PROGRESS-WORK-001..007` — 7;
- `PROGRESS-FAIR-001..006` — 6;
- `PROGRESS-NOPROGRESS-001..007` — 7;
- `PROGRESS-STOP-001..007` — 7;
- `PROGRESS-LIFE-001..004` — 4.

`PROGRESS-PROFILE-*`, `PROGRESS-GRAPH-*`, `PROGRESS-RESOURCE-*`, `PROGRESS-SEC-*`, `PROGRESS-COMPAT-*` and `PROGRESS-IR-*` remain with their declared structural/normalizer/cross-specification/deletion/native owners. This leaf must not claim them as independent runtime evidence merely because it consumes their normalized facts.

## Research

`SPEC-0012` defines Progress as the single owner of device-side work readiness, scheduler-neutral service/fairness, typed no-progress classification, stop/drain and closure. It explicitly does not own work payload meaning, Resource capacity, Search Session control, Graph/Evaluator semantics or physical CUDA scheduling.

The normalized fixtures provide three materially different profiles:

1. evaluator absent;
2. evaluator workspace/batching selected;
3. live session selected.

They already declare:

- work classes, owner/kind, finite attempt/retry/continuation bounds and terminal states;
- dependency producers/escapes and whether dependencies are required/advisory;
- fairness classes with bounded service gaps or closure-priority starvation escape;
- device-flush evaluator batching without host timeout;
- no-progress outcome vocabulary and finite potential/repeated-transition bounds;
- stop lifecycle and closure predicates;
- Resource-plan identity and closure reserves; and
- scheduler identity exclusion from semantic compatibility.

The spec's required conformance matrix adds mechanism-neutral falsifiers for readiness-after-publication, pending-yields-worker, accounting conservation, producer-unblocking fairness, partial-batch device flush, must-drain priority, deadlock/quiescence, livelock, starvation, Resource recovery reserve, first stop cause, stale epoch isolation, observation non-progression, complete closure, scheduler semantic parity, owner deletion and oracle sensitivity.

## Reassess

No new public schema, work queue, scheduler or CUDA mechanism is needed. The smallest sufficient reference is an in-memory deterministic work ledger plus a bounded schedule interpreter that consumes the normalized Progress profile as immutable authority.

The reference may choose deterministic test schedules only to falsify semantic invariants. It must not claim that any serial/round-robin/priority schedule is the production scheduler.

Resource state, owner transition readiness, external Session wait and output/channel closure are injected public facts. The Progress oracle may classify and route them but cannot manufacture their semantic meaning.

## Plan

1. Rebuild the exact Composer inputs through Resource and Progress, then export the three normalized Progress profiles only if their identities exactly match Composer-published identities.
2. Derive the 31 direct requirement IDs from `SPEC-0012` and cross-check the coverage registry owner/count before accepting evidence.
3. Implement one owner-local Progress oracle with:
   - stale-safe work identity and epochs;
   - admission/accounting states;
   - dependency/readiness publication;
   - exclusive/cooperative claim semantics;
   - finite step/yield/continuation/terminal transitions;
   - fairness/service-opportunity counters;
   - no-progress classification from the declared wait graph and injected facts;
   - immutable first stop/fatal cause;
   - stop/drain ordinary-admission closure;
   - stale epoch disposition;
   - complete closure gating; and
   - lifecycle/cleanup accounting.
4. Split cases by ownership: work/readiness, fairness/schedules, no-progress, stop/closure/lifecycle, and sensitivity.
5. Include at least two mechanism-neutral schedule drivers and require stable semantic end states across them.
6. Make the first probe intentionally capable of turning red; diagnose only concrete failures before repair.
7. Add a peer permanent `Progress reference` job and include it in aggregate fail-closed `verify` only after the independent case bank is coherent.
8. Open a draft PR, run the complete permanent workflow on an exact head, perform whole-spec/whole-diff author review, document red-before-green repairs, clean temporary state, and mark review-ready only when no author-side blocker remains.

## Claim limits

This leaf proves CUDA-free Progress semantics only. It does not select persistent kernels, queues/tickets, work stealing, CUDA Graphs, cooperative/dynamic launches, streams, warp/block topology, exact interleavings or performance behavior. Native scheduler qualification remains downstream through public CUDA-JS after semantic acceptance.