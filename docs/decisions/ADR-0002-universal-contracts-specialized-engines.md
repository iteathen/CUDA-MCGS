# ADR-0002: Universal Contracts, Specialized Engines

**Status:** Accepted

**Date:** 2026-08-10

## Context

UMCGS must support unrelated domains and evaluator shapes while operating under finite GPU memory and performance constraints. A universal runtime object containing every optional field would waste memory, create indirect hot paths, and make the first implementation's assumptions permanent.

## Decision

UMCGS will define universal, versioned contracts and a universal Search IR. Each deployed engine will be generated or compiled specifically for its domain, search policy, evaluator, execution capabilities, CUDA environment, and resource profile.

The generated engine may eliminate unused fields, choose widths and layouts from declared ranges, inline plug-in operations, and select specialized scheduling/reduction strategies.

## Consequences

- The schema/compiler is a first-class product.
- Compatibility and cache identity must include all specialization inputs.
- Static specialization is expected rather than considered a failure of universality.
- Generic reference behavior and generated behavior require strong conformance tests.
- One precompiled universal node or kernel is not the target.

## Alternatives considered

- One universal runtime structure and callback table: rejected for memory, dispatch, and hidden-assumption costs.
- Separate handwritten engine per domain: rejected because contracts and infrastructure would drift.
