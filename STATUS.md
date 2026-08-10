# UMCGS Status

**Status:** Informational

**Updated:** 2026-08-10

## Phase

Framework definition and evidence gathering. No production source layout or runtime implementation has been accepted.

## Accepted project state

- The generic framework—not chess or another first domain—is the first product.
- Active search must be device-closed after ignition.
- Concrete engines are finite and resource-planned.
- Contracts are universal; hot paths are specialized.
- UMCGS will be built as a new framework while using prior art as references and benchmarks.
- Canonical agent governance lives in `agent_files/`.

## Current authority

- Project charter: accepted.
- ADR-0001 prior-art disposition: accepted.
- ADR-0002 universal contracts / specialized engines: accepted.
- ADR-0003 device-resident active search: accepted.
- Framework architecture overview and specification map: proposals.
- Detailed normative Search IR/domain/policy/evaluator/resource specifications: not yet accepted.

## Current risks and unknowns

- The project license has not been selected; no third-party implementation should be copied into the repository before that decision.
- CUDA scheduling, JIT/linking, graph layout, memory-pressure, and evaluator ABI choices remain open pending specifications and experiments.
- Candidate prior-art performance claims have not yet been reproduced on UMCGS target hardware.
