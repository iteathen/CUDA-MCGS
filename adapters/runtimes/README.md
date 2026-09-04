# Runtime Adapters

Concrete external-runtime adapters live here.

Each runtime adapter is an independently replaceable manifested component that translates accepted CUDA-MCGS runtime requirements into a versioned public peer contract. Runtime adapters do not own Search IR semantics, search scheduling, generic lower-runtime implementation, private peer APIs, or product/domain semantics.

Current production adapter:

- `cuda-js/` — `integration.cuda-js`, the public CUDA-JS runtime adapter tracked by #125.

Runtime adapters must consume released/public peer surfaces only and remain removable without changing CUDA-MCGS semantic owners.
