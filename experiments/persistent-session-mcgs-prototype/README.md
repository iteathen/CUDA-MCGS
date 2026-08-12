# Persistent Search Session MCGS Prototype

**Status:** Disposable experiment; no production authority  
**Experiment:** `SESSION-001`  
**Tracker:** CUDA-MCGS issue #42

## Question

Can a deliberately small Monte Carlo Graph Search implementation exercise plan-15 persistent-session semantics before production CUDA lowering: continuous search, coherent live root ranking, repeated reroot, graph/evaluator reuse, stale root-epoch rejection, finite reclamation, slot generations, and bounded memory?

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
- action reroot and replacement-root input;
- reachability reclamation that defers while work is outstanding;
- slot-generation advance before reuse;
- fail-closed epoch/ranking-generation exhaustion;
- root-update admission before expansion/allocation side effects.

No CUDA primitive, persistent-kernel topology, CUDA Graph topology, mapped-memory design, same-DriverActor concurrency model, or CUDA-JS sideband mechanism is selected here.

## Cases

The consolidated capsule contains ten stable cases:

1. `live-ranking-running`
2. `ranking-cadence-decoupled`
3. `transposition-edge-local`
4. `reroot-reuse`
5. `stale-work-rejected`
6. `reclaim-generation-reuse`
7. `many-epoch-bounded-memory`
8. `epoch-exhaustion-no-side-effect`
9. `ranking-exhaustion-no-side-effect`
10. `oracle-sensitivity`

Throwaway mutation runs additionally remove the root-epoch commit guard, slot-generation advance, and pre-mutation reroot admission guard. They are not retained; their outcomes are recorded in `RESULTS.md`.

## Run

```bash
node experiments/persistent-session-mcgs-prototype/run.mjs
```

The runner uses no network, CUDA, persistence, or external service and reports exact expected/discovered/executed/pass/fail/skip counts.

## Success boundary

A pass supports only these bounded semantic propositions for this synthetic profile:

- ranking publication need not participate in every backup;
- reroot can be a logical root/epoch transition rather than a graph rebuild;
- old-epoch root-relative work can be abandoned without contaminating new-epoch statistics;
- reclamation can be separated from the latency-critical root switch;
- generation changes can make reclaimed-slot references stale;
- repeated reroot over retained states need not grow memory;
- finite session counters can fail closed rather than wrap.

Production code must not import this experiment. Useful lessons are promoted by re-deriving them into owned specs, reference/native conformance, graph/resource/scheduler work, or the CUDA-MCGS-to-CUDA-JS package contract.
