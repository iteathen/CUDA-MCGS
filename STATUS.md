# CUDA-MCGS Status

**Status:** Informational

**Updated:** 2026-09-03

## Current repository state

CUDA-MCGS is a public protected pre-release universal GPU-resident MCGS framework. Protected semantic authority remains product-neutral and device-resident by design. There is still no accepted production CUDA-MCGS runtime adapter, qualified CUDA-MCGS/CUDA-JS native compatible pair, stable public SDK, or product release.

The current CUDA portfolio boundary audit is complete through CUDA-MCGS #193. The durable matrix is recorded in [`docs/architecture/2026-09-03-cuda-js-execution-boundary-audit.md`](docs/architecture/2026-09-03-cuda-js-execution-boundary-audit.md).

Audit sources:

- CUDA-MCGS protected semantic source: `f32724e88cc340c63382def1e5138be43e8e147f`;
- CUDA-JS public lower source: `0.1.0-alpha.17@bc2700f2e5c654567c2e17bf8d67b882351b8681`;
- CUDA-JS-Tensor independent consumer source: `ea591487c79ec1b3c1e184f4ddae761bd1d41bef`;
- CUDA-NN independent consumer source: `ac97fee981b7789e11af2ec4a7ca40799eb08ddd`.

## CUDA-JS execution boundary

The repository split survives the audit without a new universal abstraction.

CUDA-MCGS owns:

- Search IR and reusable search semantics;
- Graph/Policy/Evaluator/Resource/Progress/Output/Session/Stage/Channel meaning;
- Search Program semantic roles and deterministic restricted Device-JS generation;
- finite search-resource composition, pressure/exhaustion and search lifecycle;
- selected search physical-profile policy, including explicit geometry/topology where materially chosen;
- mapping lower CUDA-JS capability/failure facts into MCGS semantic dispositions;
- the future `integration.cuda-js` adapter that translates MCGS-owned meaning into public lower requests.

CUDA-JS owns:

- device/target/runtime/context/compiler/linker/artifact/module/function mechanisms;
- allocation/view and generic physical resource lifecycle;
- launch validity/device limits, operation/prepared-DAG mechanics, hazards, synchronization and publication primitives;
- provider/native resource identity, capability facts, errors, health and cleanup;
- generated PTX/LTO/cubin/native realization and exact lower compatibility facts.

CUDA-JS #180 concluded that the existing compiler/module/function/provider-plan/prepared-DAG LEGO pieces are the correct preparation seam; CUDA-MCGS does not need a new `PreparedExecutable` transaction. CUDA-JS #181 retained explicit expert grid/block control; CUDA-MCGS ADR-0023 independently requires selected search profiles to own their physical topology policy rather than imposing one universal scheduler.

## Proposal-schema finding

The current `schemas/search-ir/0.2.0/execution-package.schema.json` and `program-package-profile.schema.json` are proposal/reference evidence. Their lower-facing projections currently spell CUDA-JS-shaped function parameter kinds, device-memory request shapes, access vocabulary, grid/block/shared-memory records, pending-operation fields and lifecycle labels.

Those schemas are not accepted CUDA-JS API authority and must not become one during a future semantic-acceptance transaction. The #193 audit classifies every such field as one of:

- genuine MCGS semantic/resource requirement;
- MCGS selected-profile policy over a generic primitive;
- MCGS adapter translation whose validation authority remains public CUDA-JS;
- opaque/mechanically lower-bound compatibility evidence;
- copied lower schema/limit/provider/lifecycle fact to remove before acceptance.

The proposal schemas themselves were deliberately not edited by #193 because they are coupled to the separately held future semantic-acceptance transaction. The required correction is recorded on the owning audit instead of mutating that held work.

## Production-adapter gate

CUDA-MCGS #125 remains the correct future owner for production `integration.cuda-js`, but it is not dependency-ready. It remains blocked by its separately held semantic prerequisite and by the requirement that the future accepted execution-package surface obey the #193 ownership matrix.

When that prerequisite is explicitly resumed and separately completed, #125 must:

1. consume only versioned public CUDA-JS package/capability contracts;
2. translate accepted MCGS resource/search/profile meaning into lower requests without copied CUDA-JS schemas or limits;
3. retain selected MCGS geometry/topology policy while letting CUDA-JS validate physical legality;
4. compose the existing lower compiler/module/function/provider-plan/prepared-DAG LEGO resources rather than creating a second runtime lifecycle;
5. use no native/private/deep-import workaround;
6. qualify the resulting exact compatible pair before any native/support claim.

## Claim limits

- The #193 audit is architecture/package-projection evidence, not native CUDA evidence.
- Proposal/reference schemas remain non-production until their own acceptance transaction completes.
- No production adapter, native CUDA-MCGS implementation, performance claim or stable SDK claim follows from #193.
- Prior CUDA-JS-Tensor native evidence does not qualify CUDA-MCGS.
- A future compatible-pair record binds exact MCGS and CUDA-JS identities; it does not transfer lower resource/operation ownership into MCGS.

## Current critical path

There is no dependency-ready production connector step in this refactor while the semantic prerequisite for #125 remains explicitly held. Do not start #125, add a native/private CUDA path, or silently accept the current lower-facing proposal schema copies.

If that held semantic work is explicitly resumed and completes under its own authority, re-read the accepted execution-package surface against the protected #193 matrix, correct any remaining lower-facing ownership inversion as part of that acceptance, then begin #125 against the exact public CUDA-JS contract.
