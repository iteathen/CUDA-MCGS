# #124 gap record — evaluator Device-JS public requirement declaration

**Date:** 2026-09-07  
**Status:** Active
**Issue:** #124  
**Execution branch:** `feature/124-device-resident-evaluator`  
**Observed head before initial record:** `ea45746f36440da141d98eef567225de383cf2ea`  
**Reassessed after authority comparison:** `831d2cd63f8d0e10567be16f384ed446984b9db5`  
**Classification:** real Search IR / Search Compiler evaluator-profile gap; `tool.search-compiler` implementation owner, SPEC-0009 semantic boundary preserved

## Gap

The accepted evaluator contract requires complete internal payload publication before ready visibility and allows the physical synchronization mechanism to be selected later through public CUDA-JS contracts. The first #124 evaluator runtime therefore naturally requires the already accepted public Device-JS device-scope release/acquire capability.

Program Package composition is already designed for this. Its exact public-requirement closure includes:

- universal base CUDA-JS requirements; and
- any `programContribution.requirements` declared by selected owner profiles.

It also already rejects helper use when the corresponding public requirement is absent. Channel Search IR and normalization already use the same pattern: a program contribution carries exact public CUDA-JS requirements without exposing native spelling or private implementation.

The evaluator profile is the exception. `evaluator-profile.schema.json` and the protected evaluator normalizer define `programContribution` with only `kind`, `language`, `sourceIdentity`, `inputs`, and `provenance`. Therefore an evaluator-owned restricted Device-JS program cannot declare a non-base public CUDA-JS capability that its generated source truthfully needs, even though Program Package already has the generic composition path for that declaration.

## Reassessment of the initial diagnosis

The initial gap record classified this as a Program Package projection defect. Further authority/code comparison falsified that diagnosis:

1. Program Package already consumes `result.normalized.programContribution.requirements ?? []` generically from selected owners.
2. Channel Search IR already declares `programContribution.requirements` and validates exact requirement identity.
3. SPEC-0009 EVAL-PUB-008 says synchronization is selected later through public CUDA-JS contracts; it does **not** prohibit the evaluator Search Program contribution from declaring the public capability contract it requires.
4. EVAL-IR-002 explicitly permits Search IR to name public publication/resource/progress dependencies while forbidding atomic spelling, raw pointers and native scheduler details.

The correct repair is therefore to make evaluator `programContribution` capable of declaring public CUDA-JS contract requirements. No Program Package algorithm change is required.

## Selected repair

Extend evaluator Search IR 0.2.0 and its production normalizer with an **optional additive** `programContribution.requirements` array of exact public schema references.

The field is optional deliberately: Search IR 0.2.0 already has protected evaluator documents and identities. Absence continues to mean zero non-base evaluator program requirements and delegates byte/identity-exactly to the protected normalizer. Only a profile that actually needs a non-base public CUDA-JS capability carries the new field.

Rules:

1. When present, `requirements` is finite, unique by contract ID, canonically ordered, and identity-material.
2. Absence is canonical zero; no placeholder requirement or empty-field identity churn is introduced.
3. The normalizer validates schema-reference shape/identity but does not interpret CUDA mechanism semantics.
4. Program Package remains the owner that checks whether declared requirements are available before ignition and projects them to CUDA-JS.
5. The first #124 Tensor runtime will declare `cuda-js.device-publication-release-acquire/0.1.0` when its evaluator-owned Device-JS uses release/acquire publication.
6. Evaluator absence remains structural zero and creates no requirement residue.

This records a public contract dependency without importing helper/native spelling into evaluator semantics. Tensor mathematics remains CUDA-JS-Tensor-owned and physical synchronization remains CUDA-JS-owned.

## Implementation disposition

The large protected evaluator normalizer is retained byte-for-byte as private `evaluator-core.mjs`. Current `evaluator.mjs` is a thin additive wrapper: it delegates profiles without `requirements` exactly to the protected core, and for profiles with the field it strips only that field for core validation, validates/canonicalizes the requirement references, reattaches them to the normalized program contribution, and recomputes canonical evaluator identity.

This follows the existing Search Compiler core/wrapper evolution pattern and minimizes regression surface while leaving one current public evaluator normalizer owner.

## Falsifiers

The repair is invalid if any of the following is possible:

- duplicate requirement IDs normalize successfully;
- requirement order changes evaluator identity after canonical normalization;
- an undeclared/invalid schema reference survives normalization;
- a legacy evaluator without the new field changes normalized bytes/identity;
- Program Package fails to consume the normalized evaluator requirement through its existing generic closure;
- a helper-using evaluator package can omit its required public contract and still normalize;
- evaluator-free recomposition leaves the evaluator-only public requirement behind;
- the change introduces CUDA helper/native spelling into evaluator schema, private CUDA-JS/Tensor imports, or product semantics.

## Dev-cycle continuation

Proceed through `assess → research → reassess → plan → execute → qualify → review → cleanup/document` at the evaluator Search IR/normalizer boundary. After the gap is qualified, resume the #124 evaluator Device-JS contribution against the now-complete public-requirement seam.
