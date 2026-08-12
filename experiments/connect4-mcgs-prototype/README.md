# Connect Four MCGS Prototype

**Status:** Disposable product/reference experiment; no production authority

**Owner:** CUDA-MCGS Connect Four product experiment

**Tracker:** CUDA-MCGS issue #47

## Question

Can a small, exact Connect Four domain exercise real Monte Carlo Graph Search semantics—state identity, transpositions, parent-edge statistics, finite resources, ranked root actions, and reroot reuse—without changing universal CUDA-MCGS meaning or importing optimization-research machinery?

This is the first concrete search-product build after the project owner selected Connect Four as the initial product workload. It is intentionally CUDA-free so it can serve as a deterministic product oracle before native lowering.

## Repository boundary

This experiment belongs in CUDA-MCGS because it tests a concrete search product against CUDA-MCGS semantics.

Optimization discovery, optimizer classification, workload weighting, causal-interaction analysis, portfolio selection, and related research/tooling belong in the separate private `iteathen/MCGS-OPTIMIZATION-RESEARCH` repository. This experiment does not import that repository, copy its research artifacts, or make its hypotheses CUDA-MCGS authority.

If later optimization research identifies a reusable optimization, promotion into CUDA-MCGS requires an explicit reviewed contract/profile decision. Connect Four must not promote a product-specific optimization into the universal core merely because it helps this workload.

## Baseline product semantics

The prototype uses standard Connect Four:

- board: 7 columns x 6 rows;
- players: two alternating players;
- action: drop one token into a non-full column;
- transition: token occupies the lowest empty cell in the selected column;
- terminal win: four same-player tokens horizontally, vertically, or diagonally;
- draw: full board without a winner;
- state identity: exact player-1 occupancy, player-2 occupancy, and side to move;
- no hidden information, stochastic transition, repetition rule, or cycle.

The implementation accepts states generated from legal move sequences. General authoritative replacement-position validation is outside this experiment.

## Baseline search policy

The search policy is deliberately simple and product-local:

- UCT selection with configurable exploration constant;
- exact graph-node reuse by state identity;
- parent-edge-local visit/value/in-flight statistics;
- uniformly random selection among unvisited actions;
- uniformly random rollout to terminal state;
- backup value from each parent edge's player perspective;
- bounded node and edge capacities;
- typed `NODE_CAPACITY` and `EDGE_CAPACITY` stop causes;
- deterministic seeded pseudo-randomness for reproducible evidence;
- read-only ranked root observation;
- legal-action reroot with graph-node reuse and epoch advance.

UCT, uniform rollout, and the chosen random generator are product-experiment choices, not universal CUDA-MCGS requirements.

## Deliberately absent optimizations

The baseline intentionally does **not** include:

- mirror/symmetry canonicalization;
- center-column preference;
- tactical move ordering;
- immediate-win pruning inside search;
- forced-block pruning;
- alpha-beta/minimax solver shortcuts;
- opening books or solved-state databases;
- learned policy/value evaluation;
- progressive bias, RAVE/AMAF, PUCT, or other search enhancements.

Immediate winning actions are computed only by an independent test oracle to verify search behavior; the MCGS implementation does not call that oracle.

This separation gives the optimization-research project an honest unoptimized baseline to compare against later.

## Finite resources

Each session has explicit `maxNodes` and `maxEdges` capacities. A capacity failure is typed and stops further simulations rather than silently allocating beyond the configured bound.

A reroot that would require a new node proves node admission before changing the root or root epoch. Failure therefore leaves the accepted root state unchanged.

This prototype does not implement reclamation, persistent package formats, CUDA memory planning, or production resource schemas.

## Running

Requires Node.js. The evidence run used Node 22.16.0.

```text
node experiments/connect4-mcgs-prototype/run.mjs
```

The runner prints each stable case and a final discovery/execution/pass/skip summary.

## Evidence covered

The current capsule checks:

1. horizontal, vertical, and diagonal terminal detection;
2. full-column rejection;
3. exact transposition identity from commuting legal move orders;
4. graph-node reuse for an exact transposition;
5. read-only ranking publication;
6. search selection of an independently known immediate winning action;
7. real transposition reuse observed during search from the empty board, including multiple incoming parent edges with distinct edge-stat objects;
8. reroot reuse of an already searched child;
9. reroot capacity rejection without root/epoch mutation;
10. typed node-capacity stop;
11. typed edge-capacity stop without failed-expansion capacity consumption;
12. seeded search determinism.

Some bullets share one test case; the runner currently reports 11 stable cases.

## Claim limits

This experiment does **not** prove:

- production CUDA-MCGS component readiness;
- native CUDA correctness or performance;
- CUDA-JS compatible-pair integration;
- GPU publication/memory ordering;
- long-lived concurrent session safety;
- optimal Connect Four play or competitive strength;
- that UCT/uniform rollout is the intended Connect Four product policy;
- that any deliberately absent optimization should or should not be selected later;
- any universal optimization conclusion.

## Promotion/disposition

Retain this experiment while it is useful as the first Connect Four product oracle and as an input to later CUDA/native differential testing.

Promote only independently justified product semantics, contracts, and consolidated conformance cases into their owning product/contract locations. Production code must not import this experiment.

If a future product reference/component fully supersedes it, archive or remove it according to repository cleanup policy while preserving the evidence/provenance still needed by active consumers.
