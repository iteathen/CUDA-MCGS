# CUDA-MCGS schemas

This directory contains versioned machine-readable search contracts used by normalization, composition, and compatibility checks.

- [Search IR 0.1.0](search-ir/0.1.0/search-ir.schema.json): the foundational representation under [SPEC-0002](../docs/specs/SPEC-0002-search-ir-and-reference-semantics.md).
- [Search IR 0.2.0 contract set](search-ir/0.2.0/contract-set.json) and [requirement coverage](search-ir/0.2.0/requirement-coverage.json): contract identities and evidence classification.
- [Framework selection](search-ir/0.2.0/framework-selection.schema.json): selected owners and public bindings.
- [Search program](search-ir/0.2.0/search-program.schema.json) and [execution package](search-ir/0.2.0/execution-package.schema.json): composed programs and runtime requirements.

Owner-specific profiles alongside these schemas describe domain, graph, policy, evaluator, resource, progress, output, session, stage, and channel records.

The [accepted specifications](../docs/specs/README.md) define behavioral meaning; schema validity alone does not prove behavior or physical runtime support. [Search Compiler conformance](../conformance/search-compiler/README.md) checks normalization and composition.
