# Persistent Search Session MCGS Prototype

**Status:** Disposable experiment; no production authority  
**Experiment:** `SESSION-001`  
**Tracker:** CUDA-MCGS issue #42

## Question

Can a deliberately small Monte Carlo Graph Search implementation exercise plan-15 persistent-session semantics before production CUDA lowering: continuous search, coherent live root ranking, repeated reroot, graph/evaluator reuse, stale root-epoch rejection, finite reclamation, slot generations, bounded memory, and fail-closed external root updates?

## Why CUDA-free first

The plan has two different unknowns: semantic correctness and native CUDA/CUDA-JS realization. This first slice attacks the semantic unknown deterministically before adding GPU concurrency or sideband transport. It is **not** a CPU-search architecture proposal and proves no GPU performance or CUDA ordering claim.

The synthetic graph deliberately includes a transposition and a cycle, plus a small replacement-root island used only to exercise reclamation/slot reuse. All values are scalar and all choices maximize the same return; those are experiment-specific limitations, not framework assumptions.

## Implemented experiment mechanisms

`run.mjs` is intentionally self-contained and implements only enough machinery to falsify the session model:

- fixed-capacity state-node slots and state-identity transposition lookup;
- parent-edge-local visits, reservations and value sums;
- cached nonterminal evaluation;
- deterministic UCB-like selection;
- split begin/commit work so reroot can occur with work outstanding;
- monotonically increasing root epochs;
- immutable live-ranking snapshots with independent publication generation;
- read-only ranking publication with respect to search materialization;
- action reroot and replacement-root input with pre-mutation validation/admission;
- reachability reclamation that defers while work is outstanding;
- slot-generation advance before reuse;
- fail-closed epoch/ranking-generation exhaustion;
- typed finite-capacity rejection for a new replacement root when no node slot is available.

No CUDA primitive, persistent-kernel topology, CUDA Graph topology, mapped-memory design, same-DriverActor concurrency model, or CUDA-JS sideband mechanism is selected here.

## Cases

The consolidated capsule contains thirteen stable cases:

1. `invalid-root-update-no-side-effect`
2. `replacement-root-capacity-pressure`
3. `ranking-publication-readonly`
4. `live-ranking-running`
5. `ranking-cadence-decoupled`
6. `transposition-edge-local`
7. `reroot-reuse`
8. `stale-work-rejected`
9. `reclaim-generation-reuse`
10. `many-epoch-bounded-memory`
11. `epoch-exhaustion-no-side-effect`
12. `ranking-exhaustion-no-side-effect`
13. `oracle-sensitivity`

Throwaway mutation runs additionally remove the root-epoch commit guard, slot-generation advance, pre-mutation reroot admission guard, and ranking-publication read-only boundary. They are not retained; their outcomes are recorded in `RESULTS.md`.

## Run

```bash
node experiments/persistent-session-mcgs-prototype/run.mjs
```

The runner uses no network, CUDA, persistence, or external service and reports exact expected/discovered/executed/pass/fail/skip counts.

## Success boundary

A pass supports only these bounded semantic propositions for this synthetic profile:

- ranking publication can remain read-only with respect to search materialization and need not participate in every backup;
- reroot can be a logical root/epoch transition rather than a graph rebuild;
- invalid or exhausted root updates can fail without mutating accepted search state;
- a new authoritative replacement root can encounter finite node-capacity pressure, which requires an explicit production contract rather than hidden allocation;
- old-epoch root-relative work can be abandoned without contaminating new-epoch statistics;
- reclamation can be separated from the latency-critical root switch;
- generation changes can make reclaimed-slot references stale;
- repeated reroot over retained states need not grow memory;
- finite session counters can fail closed rather than wrap.

Production code must not import this experiment. Useful lessons are promoted by re-deriving them into owned specs, reference/native conformance, graph/resource/scheduler work, or the CUDA-MCGS-to-CUDA-JS package contract.
