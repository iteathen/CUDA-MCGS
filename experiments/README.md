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

- [`cuda-device-mcgs-prototype/`](cuda-device-mcgs-prototype/) — bounded CUDA-only active-search prototype for publication, transposition node/edge ownership, path-local cycles, finite capacity, and global-ticket versus warp-ticket scheduling evidence; retained as non-production input to SPEC-0001 and future conformance.
- [`search-ir-reference/`](search-ir-reference/) — CUDA-free strict Search IR normalizer and deterministic semantic reference capsule for SPEC-0002, exercised identically on Windows and Ubuntu without claiming native Linux CUDA support.
- [`ptx-extension-composition-prototype/`](ptx-extension-composition-prototype/) — disposable CUDA-MCGS Extension Surface/PTX composition vertical slice through the packaged public CUDA-JS facade, including unbound disappearance, multi-fragment direct linking, fused-source comparison, negative contracts, finite-resource/lifecycle checks, and an explicit native Linux gap.
- [`persistent-session-mcgs-prototype/`](persistent-session-mcgs-prototype/) — SESSION-001 deterministic MCGS learning prototype for long-lived root epochs, live ranked root-action snapshots, reroot/reuse, stale-work rejection, generation-safe reclamation, and bounded many-epoch memory; CUDA-free by design and not evidence for native sideband/concurrency performance.
