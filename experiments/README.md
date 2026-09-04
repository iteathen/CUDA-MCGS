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

The canonical Search Compiler implementation and its owning Composer conformance capsule were promoted under #205 to [`../components/search-compiler/`](../components/search-compiler/) and [`../conformance/search-compiler/`](../conformance/search-compiler/). No compatibility copy remains under `experiments/`.

- [`search-ir-reference/`](search-ir-reference/) — CUDA-free strict Search IR normalizer and deterministic semantic reference capsule for SPEC-0002, exercised identically on Windows and Ubuntu without claiming native Linux CUDA support.
- [`search-semantics-reference/`](search-semantics-reference/) — CUDA-free behavioral reference/conformance experiment. It combines a semantic-neutral finite declared-schedule/owner-isolation/mutation harness with the first owner-local Domain oracle, bound to exact proposal Composer and normalized Domain-profile identities; Graph and later owner oracles remain subsequent leaves.
- [`persistent-session-mcgs-prototype/`](persistent-session-mcgs-prototype/) — SESSION-001 deterministic MCGS learning prototype for long-lived root epochs, live ranked root-action snapshots, historical `reroot`/reuse behavior, stale-work rejection, generation-safe reclamation and bounded many-epoch memory; CUDA-free by design and not authority for ADR-0022 terminology or native sideband/concurrency performance.
- [`connect4-mcgs-prototype/`](connect4-mcgs-prototype/) — first real-domain Connect Four MCGS reference/product prototype with exact transpositions, parent-edge-local statistics, finite node/edge pressure, read-only root ranking, historical `reroot` reuse and deterministic seeded evidence; deliberately unoptimized and CUDA-free so later optimization and native work have an independent baseline, not universal root-control authority.

Deleted native experiments are summarized as non-executable provenance under [`../docs/archive/experiments/`](../docs/archive/experiments/). They are not active evidence or restoration templates.
