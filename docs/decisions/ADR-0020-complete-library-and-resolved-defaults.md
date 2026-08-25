# ADR-0020: Complete Library and Resolved Defaults

**Status:** Accepted

**Date:** 2026-08-25

## Context

CUDA-MCGS is intended to make Monte Carlo Graph Search broadly usable without narrowing what a conforming MCGS system may be. Completeness and ease are not competing product goals: a complete set of composable contracts can support advanced uses, while a carefully bounded convenience layer can make common uses concise.

The dangerous alternatives are two separate implementations—one "simple" and one "complete"—or a convenience API that guesses domain meaning from incidental runtime values. Either would create semantic drift, make behavior hard to reproduce, and allow defaults to bypass the explicit finite contracts required by the framework.

The project owner therefore clarified that CUDA-MCGS is a library product implemented with framework architecture, and that ease must resolve into the same explicit configuration and specialization path used by complete composition.

## Decision

CUDA-MCGS will expose one library through progressive disclosure:

1. a convenience facade and documented presets for concise common use;
2. the complete composable contract/component surface for explicit control; and
3. low-level schema, Search IR and extension tools for new integrations.

The complete composable surface is authoritative. The convenience surface is an additional layer, not a second semantic system or implementation path. Minimal, partial and fully explicit calls all resolve before resource admission into the same canonical normalized framework profile, Search IR, validation, specialization and execution-package pipeline.

Every default or adaptive resolution must be:

- owned by one contract or facade boundary;
- bounded, deterministic and documented;
- inspectable through the resolved profile and default provenance;
- explicitly overridable;
- derived only from declared capabilities, stable input contracts and unambiguous call shape; and
- included in compatibility, cache or package identity when it can change semantics or generated behavior.

CUDA-MCGS may not infer foundational semantic facts—such as state identity, player roles, zero-sum value, evaluator interpretation, action meaning or transition behavior—from sample values, timing, incidental object shape or observed search results. A no-argument construction is supported only where the component has a truthful product-neutral default. Required domain, evaluator, identity, resource or output facts are reported as missing rather than fabricated.

Explicit caller selections take precedence over defaults. Conflicting selections fail with an owned diagnostic rather than being silently reconciled. Adaptive resolution completes before ignition. No hidden post-ignition adaptation may change search semantics, resource policy or generated behavior unless the caller explicitly selected a separately governed contract for that behavior.

Semantically material default sets are versioned. A default change that can alter normalized meaning, generated code, resources, compatibility or output invalidates the affected identity and evidence; it is not shipped as an invisible behavioral change.

The convenience layer must pass an equivalence test: its resolved profile is accepted by the complete surface and produces the same canonical identity as the equivalent explicit call. It must also pass a deletion test: removing convenience facades and presets leaves the complete library coherent and usable.

## Consequences

- CUDA-MCGS is described publicly as a complete library for easy access to MCGS, supported by a universal framework architecture.
- Public API design must use progressive disclosure rather than one giant optional-field object, hidden callbacks or parallel "easy" runtime machinery.
- The normalized framework profile is the inspection and reproducibility boundary for defaults, including provenance and reasons for adaptive selections.
- Search IR/Composer work must preserve one canonical path and later represent resolved-input provenance without invalidating the currently frozen evidence packet mid-leaf.
- Stable public names and exact class/function shapes remain future specification work; this ADR does not declare a stable API or authorize production implementation.

## Alternatives considered

### Provide only the complete low-level framework

Rejected. It preserves capability but needlessly exports composition complexity to ordinary library users.

### Build a separate simplified implementation

Rejected. It creates two semantic paths, duplicated defects, divergent qualification and unclear behavior when users outgrow the simple path.

### Infer defaults from runtime observations

Rejected. Incidental values cannot truthfully establish domain semantics, and post-ignition guessing conflicts with deterministic specialization and device-owned search progress.

### Require every object to support no-argument construction

Rejected. Some components have neutral defaults; foundational domain and evaluator facts do not. A truthful missing-requirement diagnostic is easier and safer than fabricated configuration.

## Compatibility and sequencing

This ADR extends ADR-0002, ADR-0005 and ADR-0018. It does not alter the current phase gate or authorize production implementation.

The in-progress Search IR/Composer evidence packet remains frozen at its current requirement set. Resolved-input provenance and convenience-equivalence evidence enter through the next dependency-safe plan/issue boundary, then participate in integrated semantic acceptance before any public SDK or release claim.
