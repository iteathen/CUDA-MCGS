# CUDA Isolation Plan Amendment

**Status:** Owner-directed plan amendment

**Date:** 2026-08-12

**Applies to:** CUDA-MCGS v0 planning, Connect Four product work, Search Image/Stage PTX planning, and CUDA-JS integration

## Clarified invariant

CUDA-specific implementation knowledge is outside the CUDA-MCGS ownership boundary and belongs exclusively to CUDA-JS.

CUDA-MCGS owns what the search must compute on the GPU. CUDA-JS owns how that computation is expressed in CUDA and executed through CUDA.

A maintained CUDA-MCGS production path must not require:

- `.cu` / `.cuh` source;
- CUDA C++ syntax;
- hand-authored PTX;
- CUDA headers or CUDA-specific include details;
- NVRTC / nvJitLink flags or provider mechanics;
- Driver API calls, raw CUDA handles, CUDA ABI/layout mechanics;
- CUDA-specific thread/block/atomic/barrier syntax;
- CUDA-specific memory-management, launch, synchronization, or completion syntax.

If CUDA-MCGS needs a generic GPU capability that CUDA-JS cannot express, that gap is routed to CUDA-JS as a generic capability rather than implemented locally in CUDA-MCGS.

## Boundary after this amendment

### CUDA-MCGS owns

- universal MCGS semantics and contracts;
- domain/state/action/transition/identity/history semantics;
- policy, selection, reservation, widening, backup, stopping and reuse semantics;
- evaluator/output/session/resource/graph semantics;
- device-resident algorithm intent and search-program composition;
- downstream product algorithms such as Connect Four transition/terminal logic;
- schemas and finite resource requirements;
- a restricted Device-JS search/domain program that uses only public CUDA-JS helpers.

### CUDA-JS owns

- the restricted Device-JS syntax/helper contract;
- typing and fail-closed validation for device programs;
- generic GPU primitives such as thread identity, atomics, barriers/fences, typed device-memory access and CUDA math mappings;
- lowering from restricted Device JS to CUDA-specific generated forms;
- all generated CUDA C++/PTX/cubin/LTO artifacts;
- CUDA headers, compiler/linker options, CUDA ABI/layout, memory/launch/synchronization/completion/error/teardown mechanics.

CUDA-specific generated artifacts may be consumed as opaque package outputs or evidence, but they are not maintained CUDA-MCGS source or an authored CUDA-MCGS contract.

## Consequence for current Search Image planning

Older CUDA-MCGS planning assigns generation of Stage PTX/Search Images and search-specific CUDA device programs directly to CUDA-MCGS. That wording is superseded for the CUDA-specific authoring/lowering boundary.

The corrected split is:

```text
CUDA-MCGS
  universal/product contracts
  + Search Program composition
  + restricted Device-JS search/domain/capability code
            ↓
CUDA-JS
  validate/type-check Device JS
  + generic GPU helpers
  + CUDA lowering
  + compile/link/cache/load/launch
            ↓
  executable CUDA device image
```

CUDA-MCGS may continue to own the semantic identity of the realized search configuration: selected domain/policy/evaluator/output/resource/session/capability inputs, program versions, and finite resource plan. CUDA-JS owns CUDA-specific executable realization and artifact identity details that derive from CUDA/toolchain/platform inputs.

The final package contract must separate those identities rather than making CUDA-MCGS own CUDA implementation details.

## Connect Four disposition

The current Connect Four CUDA-free MCGS reference/product prototype remains the preferred semantic oracle.

Existing `.cu` experiments in CUDA-MCGS remain bounded historical/experimental evidence only. They may temporarily be used to prove GPU feasibility or differential behavior while CUDA-JS issue #43 is not yet implemented, but they must not be promoted into the maintained production path.

The first production-oriented Connect Four GPU slice should become the deletion test for the corrected boundary:

1. express Connect Four state/transition/search logic using CUDA-MCGS-owned restricted Device JS plus CUDA-JS public helpers;
2. have CUDA-JS generate/compile the CUDA device realization;
3. compare results against the CUDA-free Connect Four reference oracle and retained CUDA feasibility evidence;
4. confirm CUDA-MCGS contains no required CUDA-specific implementation after the restricted-JS path is accepted.

## Plan dependency correction

The CUDA-MCGS v0 sequence is amended as follows:

1. Continue semantic/reference work that does not require CUDA-specific authoring.
2. Treat CUDA-JS issue #43 restricted Device-JS/helpers as the planned production authoring boundary for CUDA-MCGS device algorithms.
3. Do not freeze production Stage PTX/Search Image generation around CUDA-MCGS-authored CUDA source.
4. Keep existing CUDA experiments isolated under `experiments/` as non-production evidence.
5. Define CUDA-MCGS Search Program composition independently of CUDA syntax so the same semantics can be normalized before CUDA-JS lowering.
6. Integrate the first exact CUDA-MCGS/CUDA-JS compatible pair using the restricted Device-JS path once its neutral CUDA-JS proof is accepted.
7. If a required GPU primitive is missing, open/advance a generic CUDA-JS capability issue; do not add a local CUDA escape path.
8. Preserve repository boundaries for optimization research: optimizer discovery/classification remains in `MCGS-OPTIMIZATION-RESEARCH`; only reviewed/promoted optimizer semantics enter CUDA-MCGS, and CUDA realization remains CUDA-JS-owned.

## Interaction with existing CUDA-JS capability work

- CUDA-JS #35 relocatable device-code compilation may support modular lowering/composition but must remain CUDA-JS-owned.
- CUDA-JS #38 long-lived sideband remains the generic runtime path for future persistent/rerootable live search.
- CUDA-JS #39/#40/#41/#42 remain optional generic scalar/concurrency/graph/LTO capabilities and cannot justify CUDA-specific code in CUDA-MCGS.
- CUDA-JS #43 is the direct owner of the restricted Device-JS/helper/lowering capability required by this amendment.

## Boundary acceptance tests

Before calling the production CUDA-MCGS/CUDA-JS boundary complete:

- maintained CUDA-MCGS production source contains no `.cu`, `.cuh`, hand-authored PTX, CUDA headers, NVRTC/nvJitLink options, Driver calls or CUDA ABI implementation;
- CUDA-MCGS can express a complete nontrivial device search algorithm through public CUDA-JS abstractions;
- CUDA-JS can lower that program to CUDA-specific artifacts without learning MCGS/domain semantics;
- deleting Connect Four or CUDA-MCGS entirely leaves CUDA-JS Device-JS/helpers coherent and generic;
- missing CUDA primitives fail as explicit CUDA-JS capability gaps;
- CUDA-MCGS reference/conformance continues to validate semantic correctness independently of CUDA lowering.

## Supersession rule

Where `next_step.yaml`, architecture explanations, or proposal specs say CUDA-MCGS directly generates or owns CUDA/PTX device implementation, this amendment supersedes that planning assumption for future production work.

Accepted semantic contracts remain authoritative within their existing scope. This plan does not silently amend accepted semantics; any contract/schema/package changes required to realize the new boundary must be proposed and accepted through the normal authority process.
