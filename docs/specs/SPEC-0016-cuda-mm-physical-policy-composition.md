# SPEC-0016: Optional CUDA-MM Physical-Policy Composition

**Status:** Accepted

**Version:** 1.0.0

**Owner:** CUDA-MCGS

**Related authorities:** `iteathen/CUDA-JS` SPEC-0032/SPEC-0033; `iteathen/CUDA-MM` SPEC-0001

## Purpose

Recognize CUDA-MM as the reserved owner for reusable cross-domain physical memory-management policy while preserving CUDA-MCGS ownership of search/evaluator/resource identity, finite capacities, semantic pressure, reclamation/fairness, freshness and search-lifecycle meaning.

This addendum selects no production CUDA-MM dependency and does not move current MCGS Resource/Graph/Evaluator planning merely because CUDA-MM exists.

## MCGS ownership retained

CUDA-MCGS continues to own:

- Search IR/Composer and selected search profile meaning;
- graph/evaluator/progress/channel/output/session resource identities;
- finite search capacities, reserves, readiness and semantic pressure;
- generation/freshness/reclamation/search-lifecycle rules;
- search-specific victim/fairness/reuse policy;
- device-residency and no-host-progress semantic requirements;
- deterministic Search Program generation and MCGS dispositions.

CUDA-MM must not infer these semantics.

## Optional CUDA-MM projection

Only after CUDA-MM #3/#4 positively activate a bounded production contract, an accepted MCGS profile may optionally project domain-neutral facts such as:

- opaque resource identity;
- bytes and alignment;
- MCGS-computed lifetime/epoch constraints;
- read/write/access compatibility;
- alias/reuse restrictions;
- persistence/movability permissions explicitly supplied by MCGS;
- allowed physical placement classes;
- device affinity/set constraints;
- finite physical budget/pressure class.

CUDA-MM may return generic allocation/subrange/reuse/placement decisions and explainable physical-pressure/rejection facts. MCGS remains responsible for proving that the projection preserves its search semantics.

## Boundary test

The composition is invalid if CUDA-MM needs Search IR fields, graph node/edge roles, evaluator request/freshness semantics, progress/publication policy, victim/fairness meaning or other MCGS vocabulary to make a generic physical policy decision.

Search-specific reclamation or priority stays here even if physical storage is later realized through CUDA-MM.

## Lower native boundary

CUDA-JS remains the sole native CUDA/provider owner. CUDA-MM and MCGS consume only public CUDA-JS mechanisms; neither may maintain native allocation/managed/P2P/prefetch/provider code.

## Optional dependency and deletion

CUDA-MM is optional. Deleting CUDA-MM leaves CUDA-MCGS semantically complete and leaves existing public CUDA-JS realization paths available. Deleting CUDA-MCGS leaves CUDA-MM's generic contract coherent.

## Current critical path

This addendum does not alter CUDA-JS #32 physical compatible-pair qualification, CUDA-MCGS #123 external-consumer proof, #124 evaluator integration, #37 physical/performance qualification, #105 multi-GPU work or Vector #3's model numerical-oracle gate.

## Non-goals

No immediate migration of MCGS Resource/Graph storage plans, no generic allocator API in MCGS, no CUDA-MM production activation, no search-specific policy in CUDA-MM, no automatic multi-GPU placement and no performance claim.
