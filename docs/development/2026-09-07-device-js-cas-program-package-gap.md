# #124 gap record — accepted Device-JS CAS omitted from Program Package helper admission

**Date:** 2026-09-07  
**Status:** Proposal
**Issue:** #124  
**Execution branch:** `feature/124-device-resident-evaluator`  
**Protected CUDA-MCGS base:** `b8f246589056241eaa0efa2079a18cb6d710daca`  
**Protected CUDA-JS observed:** `021cd9a145d70b74d37162a9780044a120171eb5`  
**Classification:** real `tool.search-compiler` composition gap; CUDA-JS capability already accepted

## Gap

The first #124 device-resident evaluator runtime needs an atomic claim primitive for concurrent finite request/slot state transitions. Release/acquire publication alone cannot provide exclusive claim/compare-and-transition semantics.

CUDA-JS already owns the required consumer-neutral primitive. Accepted `SPEC-0013: Restricted Device-JS Frontend` defines:

```text
gpu.atomic.cas(pointer, index, compare, value)
```

for `ptr<u32>` and `ptr<u64>`, returning the prior element value. The accepted SPEC-0022 parent explicitly records that SPEC-0013 v0 already provides bounded RMW/CAS helpers (`gpu.atomic.add` and `gpu.atomic.cas`). No new CUDA-JS mechanism is therefore required for #124's first claim path.

CUDA-MCGS Program Package, however, maintains a closed helper-admission map in `components/search-compiler/src/program-package-core.mjs`. That map admits selected public Device-JS helpers such as `gpu.thread.global-x`, device acquire/release publication, block barrier and device fence, but omits `gpu.atomic.cas`. A truthful evaluator source unit that calls the already-public CUDA-JS CAS therefore fails `COMPOSE_HELPER_UNSUPPORTED` before composition.

## Ownership

This is not an evaluator semantic-profile gap and not a CUDA-JS runtime/compiler gap.

- CUDA-JS continues to own CAS syntax, typing, lowering, compilation and native semantics through accepted SPEC-0013.
- CUDA-MCGS Evaluator continues to own why/where request-slot claim is semantically required.
- Search Compiler / Program Package owns which public Device-JS helpers may appear in composed CUDA-MCGS restricted Device-JS and the mapping from helper declaration to exact source spelling/public requirement closure.

## Selected repair

Extend Program Package's closed helper admission by exactly one already-accepted base Device-JS helper:

```text
gpu.atomic.cas -> gpu.atomic.cas
```

No new `HELPER_REQUIREMENTS` entry is added because CAS is part of accepted base `cuda-js.device-js/0.1.0`, which Program Package already requires for every package. The existing source-mapping check must still prove that a function declaring `gpu.atomic.cas` contains the exact public helper spelling in its source.

## Falsifiers

The repair is invalid if any of the following occurs:

- `gpu.atomic.cas` remains rejected as unsupported;
- declaring the helper without exact `gpu.atomic.cas` source use normalizes successfully;
- CAS causes a new non-base public CUDA-JS requirement to be synthesized;
- an arbitrary/unaccepted atomic helper becomes admitted as collateral widening;
- Program Package permits private CUDA/C++/PTX spelling or native enum/options;
- existing helper/source/requirement fail-closed cases regress;
- the change is represented as native CAS qualification rather than composition support for an already accepted CUDA-JS public helper.

## Dev-cycle continuation

Proceed through `assess → research → reassess → plan → execute → qualify → review → cleanup/document` at the Search Compiler Program Package helper-admission boundary. Once this prerequisite is protected, resume #124 evaluator runtime generation with atomic claim plus separate release/acquire publication semantics.
