# Validation Policy

**Scope:** Evidence required before a UMCGS change may be considered complete.

## Principle

Validation must observe the mechanism and contract being claimed. A passing unrelated test, successful compilation, or plausible output is not evidence of correctness for an unobserved boundary.

Tests and gates are never weakened merely to make a change pass.

## Validation layers

### 1. Organization and documentation

Required for every repository change that touches durable project state:

```bash
./scripts/verify-docs.sh
```

This verifies required authority, status markers, relative links, structured records, issue forms, project topology, and component manifest placement.

### 2. Design and component boundaries

A component, public contract, dependency, foundational representation, compatibility boundary, or reusable naming change must verify:

- governing purpose, operating bounds, and contextual concern weighting;
- singular state/lifecycle ownership and explicit non-responsibilities;
- LEGO ports, injected dependencies, adapters, and replacement/test boundary;
- SOLID internal responsibilities without ceremonial decomposition;
- CUPID implementation quality;
- domain-appropriate ranges, precision, capacity, and exhaustion behavior;
- second-instance, first-consumer deletion, and inclusion/exclusion tests for reusable concepts;
- total-system simplicity, including complexity moved elsewhere;
- compatibility/evolution and decisive falsifying evidence.

Use `agent_files/templates/design-review.template.md` for foundational or contested designs.

### 3. Schema and generated artifacts

A schema/compiler change must verify:

- schema syntax and version negotiation;
- canonical normalization;
- invalid and boundary cases;
- deterministic generation;
- source/generated correspondence;
- backward/forward compatibility rules;
- exact range, alignment, precision, and layout probes where applicable.

### 4. Component-local behavior

Every component owns focused tests for public contracts, internal invariants, failure states, lifecycle, concurrency, and resource exhaustion. The component manifest lists commands.

### 5. Cross-component integration

The repository integration suite verifies only public surfaces and declared dependency direction. It must include failure propagation and incompatible-version behavior.

### 6. Reference and conformance

Complex search behavior requires deterministic reference cases and synthetic domains that expose:

- transpositions;
- cycles/history;
- stochastic/chance nodes;
- lazy/large action spaces;
- evaluator modes;
- backup/reduction modes;
- resource pressure and exhaustion;
- rerooting/persistence where selected.

### 7. CUDA/device correctness

Device changes require relevant combinations of:

- compute-sanitizer tools;
- race/publication-order tests;
- deterministic small cases;
- host reference differential tests;
- architecture and capability probes;
- memory-leak/lifetime checks;
- cancellation and failure injection;
- explicit proof that production search does not depend on host-produced intermediate decisions.

### 8. Performance

Performance claims require:

- exact commit and generated-engine identity;
- GPU/CPU, driver, toolkit, runtime, clocks/power profile where material;
- model/evaluator and resource profile;
- workload distribution;
- warmup, synchronization boundary, sample count, statistics;
- raw results;
- correctness/quality guardrails;
- fair baseline;
- profiler evidence explaining the mechanism.

A faster result that changes search quality, domain semantics, resource limits, or stopping behavior is not automatically an improvement.

### 9. Release/publication

Before publishing:

- inspect full diff and repository status;
- stage only intended scope;
- run all applicable layers;
- update component manifests, registry, indexes, authority, and archive;
- verify remote commit/PR and hosted checks;
- record exact failures or skipped validation.

## Current phase

UMCGS has no accepted production implementation yet. The mandatory current check is `./scripts/verify-docs.sh`, plus any task-specific research or specification validation.

Project license selection is deferred and does not block original private pre-release work. It remains a separate gate before public distribution and before implementation-level third-party reuse that requires compatibility analysis.
