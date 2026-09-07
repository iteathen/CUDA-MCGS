# #124 gap record — Device-JS helper requirement projection

**Date:** 2026-09-07  
**Issue:** #124  
**Execution branch:** `feature/124-device-resident-evaluator`  
**Observed head before this record:** `ea45746f36440da141d98eef567225de383cf2ea`  
**Classification:** real production composition gap; `tool.search-compiler` owner

## Gap

The accepted evaluator contract requires complete internal payload publication before ready visibility and permits the physical synchronization mechanism to be selected later through public CUDA-JS contracts. The first #124 evaluator runtime therefore naturally uses the already accepted public Device-JS device-scope release/acquire helpers.

The Search Compiler already knows that:

- `gpu.atomic.load-acquire-device` requires `cuda-js.device-publication-release-acquire/0.1.0`;
- `gpu.atomic.store-release-device` requires `cuda-js.device-publication-release-acquire/0.1.0`; and
- helper use without the corresponding public requirement must fail closed.

However, Program Package public-requirement closure currently derives its exact allowed requirement set only from universal base requirements plus `programContribution.requirements` carried by selected semantic profiles. The evaluator profile schema intentionally has no `programContribution.requirements` field.

That means an evaluator-owned generated source unit cannot truthfully use the accepted release/acquire helper while also satisfying Program Package exact requirement closure unless evaluator semantic authority is widened with a realization-specific CUDA-JS requirement. That would violate the accepted ownership split.

## Why this is a gap rather than an evaluator-schema omission

SPEC-0009 EVAL-PUB-002/003 require complete payload publication and exact stale/incarnation validation before readiness. EVAL-PUB-008 explicitly states that physical synchronization is selected later through public CUDA-JS contracts and is not evaluator semantic meaning. EVAL-RESIDENT-005/008 likewise place generic mechanism realization in CUDA-JS while requiring CUDA-MCGS to stop rather than use a private workaround.

Therefore the semantic evaluator profile should remain mechanism-neutral. The missing behavior belongs to Program Package composition, which already owns projection from generated Search Program implementation to public CUDA-JS requirements.

## Selected repair

Search Compiler will derive helper-required public contracts from the normalized generated function helper set during Program Package normalization/composition.

For every helper with a declared generic CUDA-JS requirement:

1. the requirement identity must already be available in the resolved public-requirement catalog before ignition;
2. the Program Package must include that exact requirement;
3. the requirement must list the generated function's owner profile as a consumer, so deletion ownership remains exact;
4. conflicting or unavailable identities fail before valid package publication;
5. helper-free programs preserve the historical exact requirement set and identities.

This keeps evaluator semantics mechanism-neutral while making generated implementation requirements truthful and owner-attributable.

## Falsifiers

The repair is invalid if any of the following is possible:

- a helper-using function normalizes without its required public contract;
- a helper-required contract is present but does not name the helper function's owner as a consumer;
- an unavailable helper contract is silently synthesized;
- removing the sole helper-using owner leaves the helper-only public requirement behind;
- helper-free protected fixtures change requirement closure or normalized identity without another material input change;
- the fix requires evaluator schema changes, CUDA-JS-private imports, or native source.

## Dev-cycle continuation

Proceed through `assess → research → reassess → plan → execute → qualify → review → cleanup/document` at `tool.search-compiler`, then resume the #124 evaluator Device-JS contribution against the repaired projection boundary.
