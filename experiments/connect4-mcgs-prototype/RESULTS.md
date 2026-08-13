# Connect Four MCGS Prototype Results

**Status:** Bounded experiment evidence

**Date:** 2026-08-12

**Source SHA-256:** `71df00fc27a6bba15e0090ec929b79627587fe6b4ef29f0955e82892e9b8198d`

## Environment

- Linux x86-64 execution environment
- Node.js v22.16.0
- CUDA not used
- CUDA-JS not used
- no external packages

## Result

```text
test=domain-horizontal-vertical-diagonal-terminal result=pass
test=domain-full-column-rejected result=pass
test=exact-state-identity-transposition result=pass
test=ranking-publication-readonly result=pass
test=immediate-win-search-oracle result=pass
test=search-observes-real-transposition-reuse result=pass
test=reroot-reuses-existing-child result=pass
test=reroot-capacity-rejection-no-root-mutation result=pass
test=finite-node-capacity-produces-typed-stop result=pass
test=finite-edge-capacity-produces-typed-stop result=pass
test=seeded-search-is-deterministic result=pass
capsule=connect4-mcgs-v0 expected=11 discovered=11 executed=11 passed=11 failed=0 required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=0
```

The same source was executed twice in the authoring environment with the same 11/11 result.

## What this establishes

Within this bounded Node-only prototype:

- standard Connect Four transition/terminal behavior is sufficient to drive a real MCGS session;
- exact state identity can expose and reuse Connect Four transpositions;
- parent-edge-local search statistics coexist with shared state nodes;
- root ranking can be read without materializing or mutating a fresh root;
- a known one-ply winning move is selected by the baseline search under the fixed seed/profile;
- a newly bound parent edge can resolve to a state node already reached through another parent edge during ordinary search from the empty board;
- reroot can preserve an already searched child node and continue accumulating visits;
- node/edge resource limits fail with typed causes rather than exceeding configured bounds;
- a rejected capacity-constrained reroot leaves root/epoch/search state unchanged;
- fixed seed/configuration produces identical graph/search/ranking state.

## Claim limits

No GPU, CUDA, CUDA-JS, production, performance, search-strength, solver-optimality, universal-policy, or optimizer-selection claim is made.

The prototype deliberately omits product-specific search optimizations so later optimization research can compare candidate changes against a stable baseline without confusing baseline semantics with optimized behavior.
