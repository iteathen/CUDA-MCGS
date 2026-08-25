# Experiments

Disposable research and prototypes live here, isolated from production components.

Every experiment states:

- the question;
- owner;
- governing assumptions;
- inputs/environment;
- success evidence;
- disposal or promotion criteria;
- what production authority it does not have.

Production code must not import experiment internals. Successful work is promoted through accepted contracts and a properly owned component.

## Active experiments

- [`search-ir-reference/`](search-ir-reference/) — CUDA-free strict Search IR normalizer and deterministic semantic reference capsule for SPEC-0002, exercised identically on Windows and Ubuntu without claiming native Linux CUDA support.
- [`search-ir-composer-reference/`](search-ir-composer-reference/) — CUDA-free proposal Search IR 0.2.0 catalog/normalizer/reference-Composer capsule; it freezes the twelve-contract, 989-requirement input, validates strict owner profiles, statically composes canonical restricted Device-JS Search Programs and consumer-neutral public execution-package requests, and proves bounded deletion/identity/reference-pair behavior without replacing accepted Search IR 0.1.0 or claiming production/native qualification.
- [`persistent-session-mcgs-prototype/`](persistent-session-mcgs-prototype/) — SESSION-001 deterministic MCGS learning prototype for long-lived root epochs, live ranked root-action snapshots, reroot/reuse, stale-work rejection, generation-safe reclamation, and bounded many-epoch memory; CUDA-free by design and not evidence for native sideband/concurrency performance.
- [`connect4-mcgs-prototype/`](connect4-mcgs-prototype/) — first real-domain Connect Four MCGS reference/product prototype with exact transpositions, parent-edge-local statistics, finite node/edge pressure, read-only root ranking, reroot reuse, and deterministic seeded evidence; deliberately unoptimized and CUDA-free so later optimization and native work have an independent baseline.

Deleted native experiments are summarized as non-executable provenance under [`../docs/archive/experiments/`](../docs/archive/experiments/). They are not active evidence or restoration templates.
