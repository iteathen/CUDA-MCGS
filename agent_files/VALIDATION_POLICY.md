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

### 2. Assessment and planning

Substantial and critical work must verify that:

- the required outcome, authority, evidence, scope, assumptions, and cost of doing nothing were assessed before implementation planning;
- every applicable canonical question group was answered directly or by link to current authority;
- the strongest credible opposing design or explanation was steelmanned;
- valid criticism changed the design, scope, experiment, validation, or disposition;
- consequential unknowns have evidence, falsifiers, bounded assumptions, experiments, blockers, or revisit triggers;
- the plan follows one coherent boundary, orders work by dependency/uncertainty, pairs validation with steps, and defines stop conditions;
- planning records are proportional and do not duplicate authority or create unowned accounting.

Use `agent_files/templates/assessment-and-plan.template.md` when a durable record is required.

### 3. Design and component boundaries

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

### 4. Schema and generated artifacts

A schema/compiler change must verify:

- schema syntax and version negotiation;
- canonical normalization;
- invalid and boundary cases;
- deterministic generation;
- source/generated correspondence;
- backward/forward compatibility rules;
- exact range, alignment, precision, and layout probes where applicable.

### 5. Component-local behavior

Every component owns focused tests for public contracts, internal invariants, failure states, lifecycle, concurrency, and resource exhaustion. The component manifest lists commands.

### 6. Cross-component integration

The repository integration suite verifies only public surfaces and declared dependency direction. It must include failure propagation and incompatible-version behavior.

### 7. Reference and conformance

Complex search behavior requires deterministic reference cases and synthetic domains that expose:

- transpositions;
- cycles/history;
- stochastic/chance nodes;
- lazy/large action spaces;
- evaluator modes;
- backup/reduction modes;
- resource pressure and exhaustion;
- rerooting/persistence where selected.

### 8. CUDA/device correctness

Device changes require relevant combinations of:

- compute-sanitizer tools;
- race/publication-order tests;
- deterministic small cases;
- host reference differential tests;
- architecture and capability probes;
- memory-leak/lifetime checks;
- cancellation and failure injection;
- explicit proof that production search does not depend on host-produced intermediate decisions.

### 9. Performance

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

### 10. Release/publication

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
