# CUDA-MCGS experiments

This directory contains isolated reference implementations and research prototypes. Production code does not import their internals.

- [Search IR reference](search-ir-reference/README.md): deterministic normalization and foundational semantic checks.
- [Search semantics reference](search-semantics-reference/README.md): behavioral oracles and cross-owner integration.
- [Persistent session prototype](persistent-session-mcgs-prototype/README.md): bounded root/session reuse and reclamation experiments.
- [Connect Four prototype](connect4-mcgs-prototype/README.md): a deterministic concrete-domain search reference.

These are CUDA-free experiments, not GPU performance evidence or production search products. Historical root-control terms in prototypes do not supersede accepted session contracts.

The implemented [Search Compiler](../components/search-compiler/README.md) and its [conformance suite](../conformance/search-compiler/README.md) have separate homes. Deleted native prototypes are documented in the [archive](../docs/archive/experiments/README.md).

See [current status](../STATUS.md) before selecting continuation work.
