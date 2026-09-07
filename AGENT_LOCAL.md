# Repository context: CUDA-MCGS

Universal engineering and design guidance comes from the account-global `AGENTS.md`. This file contains only CUDA-MCGS-specific context.

## Mission and ownership

CUDA-MCGS is the consumer-neutral GPU-resident Monte Carlo Graph Search framework. It owns Search IR/composition, graph/search semantics, evaluator-request/batch/scatter/publication semantics, search resources, progress, root control, session/stage/channel semantics, and framework search lifecycle.

CUDA-JS owns generic CUDA runtime/compiler/provider/memory/operation mechanisms. CUDA-JS-Tensor owns generic Tensor mathematics/callable/workspace semantics. Product/domain/model semantics remain downstream.

## Local routing

- `STATUS.md` and `next_step.yaml` — current execution state and next seam.
- `agent_files/SYSTEM_REGISTRY.md` — repository ownership/source routing.
- `docs/decisions/` and `docs/specs/` — accepted local authority.
- `agent_files/VALIDATION_POLICY.md` — repository-specific validation selection.

Older local design/process cards may provide historical rationale, but universal engineering doctrine comes from global authority rather than being redefined here.

## Local constraints

Maintained production source is ordinary JavaScript plus restricted Device-JS through public CUDA-JS contracts. Active production search is device-closed after ignition except for bounded observation, external control/cancellation, completion, and teardown. Do not add direct native CUDA/FFI/C++/PTX escape paths.

## Local validation

```bash
./scripts/verify-docs.sh
```

Run additional validation required by `agent_files/VALIDATION_POLICY.md` for the changed boundary.