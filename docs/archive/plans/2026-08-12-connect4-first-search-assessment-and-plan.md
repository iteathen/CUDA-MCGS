# Connect Four First Search — Assessment and Execution Plan

**Date:** 2026-08-12

**Status:** Active bounded experiment plan

**Tracker:** CUDA-MCGS issue #47

**Frozen starting revision:** `30532a0f116d246849b59d58495c9f8d4d2c13aa` (`main`)

**Git branch:** `agent/connect4-mcgs-v0`

## Owner direction

The project owner selected Connect Four as the first concrete MCGS search workload and authorized implementation to begin while optimization research proceeds in parallel. The owner also required the optimization research to remain within the separate `iteathen/MCGS-OPTIMIZATION-RESEARCH` repository boundary.

## Assessment disposition

**Proceed as an isolated experiment/reference product slice. Do not begin production universal implementation from this branch.**

The existing universal plan still has unaccepted domain/policy/evaluator/graph/resource/session/output contracts and blocks production universal/native lowering. Repository policy explicitly permits an authorized disposable experiment with named question, isolation, evidence, and disposition.

A CUDA-free Connect Four MCGS reference is therefore the smallest coherent build that:

- implements a real domain rather than another synthetic graph;
- exercises actual graph identity/transpositions, edge-local search statistics, terminal semantics, finite resources, root ranking, and reroot/reuse;
- provides a future differential oracle for CUDA lowering;
- cannot accidentally become a CUDA-JS runtime implementation;
- does not require Connect Four facts to enter universal contracts.

## Boundaries

### Owned here

- standard Connect Four domain semantics needed by the experiment;
- product-local baseline MCGS policy/evaluator/output behavior;
- deterministic test/oracle cases;
- finite experiment resource accounting;
- experiment evidence and promotion/disposal rules.

### Explicitly not owned here

- universal CUDA-MCGS domain/policy/evaluator/output/graph/resource/session contract definitions;
- production universal components or Search IR expansion;
- CUDA-JS runtime/compiler/memory/launch internals;
- optimizer discovery/classification/causal analysis/portfolio research;
- production Connect Four package/API.

## Strong adversarial challenge

### Challenge: Connect Four becomes the hidden universal template

A first real game could cause board size, two players, alternating turns, scalar zero-sum values, fixed actions, deterministic transitions, UCT, rollouts, or ranked moves to leak into universal code.

**Disposition:** keep all such facts inside this experiment. No universal schema/component change is permitted by this branch. Any concept later judged universal must be proposed independently against non-Connect-Four counterexamples.

### Challenge: an "unoptimized" baseline quietly contains game optimizations

Center preference, symmetry folding, tactical pruning, solved positions, move ordering, or forced-win/block logic would contaminate future optimizer comparisons.

**Disposition:** omit them. Use uniform random unvisited-action choice and uniform random rollout. Immediate-win detection exists only in the independent test oracle and terminal rules.

### Challenge: CPU reference work is not progress toward GPU-resident CUDA-MCGS

A CPU prototype could become throwaway work disconnected from the native goal.

**Disposition:** its purpose is an independent semantic/product oracle, not a performance mechanism. Promotion requires later differential use against generated/native Search Images; production code may not import it.

### Challenge: exact transposition reuse is itself an optimization

Graph merging could be mistaken for an optional Connect Four optimization.

**Disposition:** exact identity/transposition semantics are already part of accepted CUDA-MCGS MCGS graph foundations. Product-specific *ways to find or canonicalize additional equivalences* (for example mirror symmetry) remain optimization candidates and are absent.

## Execution contract

Expected local effects:

- add one isolated `experiments/connect4-mcgs-prototype/` capsule;
- index it in `experiments/README.md`;
- create no production component, schema, package, or CUDA-JS dependency.

Expected wider effect:

- establish the first real-product semantic oracle that later Connect Four product/native work can consume as evidence;
- expose any missing universal concept as a finding rather than silently changing universal meaning.

Cheapest decisive falsifier:

```text
node experiments/connect4-mcgs-prototype/run.mjs
```

Acceptance for this slice:

- all required cases discovered and executed;
- zero required skips;
- exact transposition reuse demonstrated;
- independent immediate-win oracle agrees with search top action under the fixed profile;
- ranking is read-only;
- typed finite node/edge pressure works;
- reroot capacity rejection does not mutate accepted root state;
- reroot reuse and deterministic seeded state both pass;
- no optimization-research artifact or dependency enters CUDA-MCGS.

Rollback/safe stop:

- keep universal/product production paths unchanged;
- if the capsule exposes a contract gap, stop product promotion and route the gap to the universal integration spine;
- if the experiment is unsound, remove or archive only task-created experiment/branch state after preserving useful failure evidence.

## Deferred after this slice

- formal Connect Four downstream product specification/acceptance;
- production product adapter/component creation;
- Search IR representation of Connect Four contracts;
- CUDA-JS execution package and GPU Search Image;
- native differential testing;
- long-lived concurrent reroot/session proof;
- performance and search-strength benchmarking;
- all optimizer discovery/selection work.

Those become separate governed steps after this baseline oracle is reviewed.
