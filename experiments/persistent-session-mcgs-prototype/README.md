# Persistent Search Session MCGS Prototype

**Status:** Disposable experiment; no production authority

**Experiment:** `SESSION-001`

**Owner:** CUDA-MCGS search-experiment owner

**Tracker:** CUDA-MCGS issue #42

## Question

Can a deliberately small Monte Carlo Graph Search implementation exercise the parent-plan-15 persistent Search Session semantics before production CUDA lowering: continuous search, coherent live root ranking, repeated reroot, transposition and evaluator reuse, stale root-epoch rejection, finite reclamation, slot generations, and bounded memory?

## Why this slice is CUDA-free

The newly strengthened plan contains two different unknowns:

1. **semantic correctness** — what root epochs, stale work, reusable graph state, live ranking, reclamation, and finite generations must mean;
2. **native realization** — how CUDA workers, memory ordering, host/device sideband I/O, and the CUDA-JS runtime realize those semantics.

This experiment deliberately attacks the first unknown with a deterministic serial model before adding native concurrency and transport. It is not a CPU-search architecture proposal and cannot establish GPU performance, CUDA publication, or CUDA-JS capability. The existing CUDA-only prototype remains the device-closure/concurrency evidence source for its accepted bounded questions.

## Specialized model

The prototype uses the same small Markov graph shape as the earlier CUDA-only experiment so differences are about session semantics rather than domain novelty:

```text
                 action 0 -> state 3, terminal +1.00
root 0 -> state 1
   |             action 1 -> state 4, terminal +0.25
   |                                      ^
   +----> state 2 -- action 0 ------------+  transposition
                 -- action 1 -> state 5
                                      |-- action 0 -> state 6, terminal -0.50
                                      +-- action 1 -> state 2             cycle
```

A separate replacement-root island is used only to exercise reclamation and slot reuse:

```text
state 10 -- action 0 -> state 11, terminal +0.60
         -- action 1 -> state 12, terminal -0.20
```

All decisions maximize the same scalar return. This is experiment-specific and proves nothing about games, players, scalar-value universality, stochasticity, history-sensitive domains, or production policy choice.

## Implemented mechanisms

The experiment implements only enough machinery to falsify the session model:

- fixed-capacity node slots;
- state-identity transposition map;
- state-node identity separate from parent-edge visits/value statistics;
- cached nonterminal evaluation;
- UCB-like deterministic edge selection;
- split `beginSimulation()` / `commitSimulation()` so reroot can occur while work is outstanding;
- edge reservations separate from completed visits;
- monotonically increasing root epochs;
- immutable live-ranking snapshots with independent publication generation;
- action reroot and replacement-root input;
- reachability reclamation that refuses to run while outstanding work exists;
- slot generation advance before reuse;
- fail-closed root-epoch and ranking-generation exhaustion.

The implementation intentionally does **not** select a CUDA synchronization primitive, mapped-memory design, persistent kernel, CUDA Graph topology, same-DriverActor concurrency model, or CUDA-JS sideband mechanism.

## Experiment cases

The consolidated capsule has ten stable cases:

1. `live-ranking-running` — ranking snapshots advance while the session remains running and prior snapshots remain immutable.
2. `ranking-cadence-decoupled` — publishing every backup versus every 64 backups produces byte-identical search state for the same deterministic work.
3. `transposition-edge-local-statistics` — two incoming edges share one state node while retaining independent statistics.
4. `reroot-reuses-retained-state` — reroot to an already-known child preserves node identity and cached evaluation; the previous ranking remains safely distinguishable by root epoch until republished.
5. `stale-work-rejected-after-reroot` — 32 outstanding old-epoch simulations are abandoned without changing completed statistics or leaking reservations.
6. `reclamation-defers-and-reuses-generations` — reclaim waits for outstanding work, removes unreachable nodes, invalidates stale refs, and reuses freed slots for a replacement root.
7. `many-epoch-bounded-memory` — 1001 reroots between already-known graph states do not allocate another node or recompute cached evaluation.
8. `root-epoch-exhaustion-fails-closed` — a tiny configured epoch bound rejects the next reroot without wrapping or changing the accepted root.
9. `ranking-generation-exhaustion-fails-closed` — a tiny publication-generation bound rejects the next snapshot without replacing the last good one.
10. `oracle-sensitivity` — a deliberately wrong expected root action is rejected.

Two additional throwaway mutation runs remove the root-epoch commit guard and the slot-generation advance to prove the owning cases are sensitive to those failures.

## Run

From the repository root:

```bash
node experiments/persistent-session-mcgs-prototype/run.mjs
```

The runner prints one line per case plus exact expected/discovered/executed/pass/fail/skip counts. No network, CUDA, filesystem persistence, or external service is used.

## Success and falsification

The experiment supports the current plan only if:

- ranking publication has no feedback into search semantics in this profile;
- reroot is a logical root/epoch transition rather than a graph rebuild;
- old-epoch completed statistics cannot publish after reroot;
- reclamation cannot race outstanding work in the simple baseline;
- generation changes prevent reclaimed-slot ABA/stale-reference reuse;
- repeated reroot of a fixed retained graph has bounded memory;
- finite session counters fail closed rather than wrap.

Any failure is a reason to return the affected graph/policy/session contract to assessment. Passing does not promote this implementation.

## Disposal and promotion

Production code must not import this directory. Useful lessons are promoted by re-deriving them into the owning specifications, reference conformance, graph/resource implementation, scheduler, or CUDA-MCGS-to-CUDA-JS package contract.

Retain this source and `RESULTS.md` only while they provide bounded evidence for plan-15 follow-up. Remove or archive the experiment after its useful cases and lessons have durable owners, or if a stronger reference/native capsule supersedes it.
