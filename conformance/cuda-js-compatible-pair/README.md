# Exact CUDA-JS compatible-pair conformance

This capsule exercises a composed CUDA-MCGS program through the production adapter and public CUDA-JS package. It contains portable failure checks and a physical GPU runner.

**Physical qualification remains open.** Hosted CI and portable results do not establish native CUDA correctness or support.

Use the [complete runbook](RUNBOOK.md) for exact checkout identities, package linking, Node 26.7.0/FFI requirements, platform prerequisites, commands, and evidence capture. The source pair is part of the result identity; an arbitrary installed CUDA-JS version is insufficient.

The capsule covers publication, terminal output delivery, and cleanup for a bounded workload. It does not qualify Tensor evaluation, live sessions, multi-GPU search, or performance.

- [Production adapter](../../adapters/runtimes/cuda-js/README.md).
- [Physical qualification tracker](https://github.com/iteathen/CUDA-JS/issues/32).
- [Current status](../../STATUS.md).
