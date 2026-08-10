# Validation Policy

**Scope:** Evidence required before a UMCGS change may be considered complete.

## Principle

Validation must observe the mechanism and contract being claimed. A passing unrelated test, successful compilation, plausible output, PR approval, or merge response is not evidence of correctness for an unobserved boundary.

Tests and gates are never weakened merely to make a change pass or merge.

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

### 3. Sanity checking and independent review

When a sanity, audit, complete-review, incident, or release-readiness claim is made, verify that:

- the exact revision/artifact and `full`, `bounded`, or `sampled` claim are explicit;
- included/excluded surfaces, owners, authority, risks, access limits, and review mode are declared;
- every surface included in a full or bounded claim is accounted for at risk-justified depth;
- material semantic units answer the mandatory core and every objectively triggered module;
- component/producer-consumer boundaries, representative and critical end-to-end paths, cross-cutting lifecycle, contradictions, and invalidated evidence are reconciled;
- tests, analyzers, sanitizers, profilers, benchmarks, and artifact checks are used as mechanism-relevant evidence rather than semantic substitutes;
- confirmed violations and high-risk uncertainties have exact mechanism, consequence, owner, and durable disposition;
- independent review did not quietly repair findings;
- checks not run, missing access/evidence, temporary review state, and claim limits are explicit;
- the final claim is no broader than the evidence.

Routine implementation self-sanity may be recorded in the PR or task result. Use `agent_files/templates/sanity-check.template.yaml` only when a full, long-running bounded, multi-agent, independent, incident, release, or cross-session review needs durable coverage state. Use `semantic-review.template.yaml` only for critical or independently assigned leaves.

### 4. Pull-request review and guarded merge

Every material PR must verify:

- PR identity, intended target, exact reviewed head, relevant base/merge base, comparison range, and review mode;
- complete changed-file, rename, deletion, generated, manifest, schema, dependency, workflow, packaging, and ancestry accounting;
- agreement with owner instruction, ADRs/specifications, assessment, component ownership, public contracts, and closure criteria;
- semantic review of material changed units and reconciliation of affected callers, dependencies, state, resources, lifecycle, compatibility, and end-to-end paths;
- current discussion, requested changes, inline threads, bot findings, and linked blocking issues;
- focused tests and checks that belong to the exact head, with checks not run and infrastructure limitations explicit;
- honest classification as author-side, independent, or exact-head owner authorization;
- invalidation/re-review when the head or material base state changes;
- no unresolved blocker, question, required review/check/protection, or unknown mergeability/closure effect before merge.

The merge transaction must independently revalidate:

- PR is open, non-draft, and targets the intended branch;
- current head exactly matches the accepted head;
- ancestry, current base/mergeability, required reviews/checks/CODEOWNERS/protection/queue, and blocking discussion are current;
- issue closure, source-branch deletion, stacked/dependent work, and conflicting/superseding work are correct;
- merge method is deliberate;
- an expected-head guard is used where supported;
- target history/protection is not bypassed or force-updated.

Post-merge verification must record the resulting target SHA, prove the intended tree/result is integrated, reconcile issue/branch/dependent-work effects, and state checks not completed.

Routine author-side review belongs in the PR. Use `agent_files/templates/pr-review.template.md` only when independent/high-consequence review, stabilization/release, dispute, or cross-session continuation needs unique durable evidence.

### 5. Design and component boundaries

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

### 6. Schema and generated artifacts

A schema/compiler change must verify:

- schema syntax and version negotiation;
- canonical normalization;
- invalid and boundary cases;
- deterministic generation;
- source/generated correspondence;
- backward/forward compatibility rules;
- exact range, alignment, precision, and layout probes where applicable.

### 7. Component-local behavior

Every component owns focused tests for public contracts, internal invariants, failure states, lifecycle, concurrency, and resource exhaustion. The component manifest lists commands.

### 8. Cross-component integration

The repository integration suite verifies only public surfaces and declared dependency direction. It must include failure propagation and incompatible-version behavior.

### 9. Reference and conformance

Complex search behavior requires deterministic reference cases and synthetic domains that expose:

- transpositions;
- cycles/history;
- stochastic/chance nodes;
- lazy/large action spaces;
- evaluator modes;
- backup/reduction modes;
- resource pressure and exhaustion;
- rerooting/persistence where selected.

### 10. CUDA/device correctness

Device changes require relevant combinations of:

- compute-sanitizer tools;
- race/publication-order tests;
- deterministic small cases;
- host reference differential tests;
- architecture and capability probes;
- memory-leak/lifetime checks;
- cancellation and failure injection;
- explicit proof that production search does not depend on host-produced intermediate decisions.

### 11. Performance

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

### 12. Publication and release

Before claiming publication or release:

- inspect the full final diff and repository state;
- stage only intended scope;
- run all applicable validation layers;
- update component manifests, registry, indexes, authority, findings, and archive;
- complete exact-head PR review and guarded merge;
- verify the remote target commit/PR, hosted checks, artifacts, issue closure, and branch effects;
- record exact failures, skipped validation, or claim limits.

## Current phase

UMCGS has no accepted production implementation or public release yet. The mandatory current check is `./scripts/verify-docs.sh`, plus any task-specific research, specification, assessment, sanity, PR-review, merge, or independent-review validation.

Project license selection is deferred and does not block original private pre-release work. It remains a separate gate before public distribution and before implementation-level third-party reuse that requires compatibility analysis.
