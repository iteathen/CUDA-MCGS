# Proportional Sanity Checking

**Scope:** Repository, component, contract, schema, implementation, generated artifact, migration, benchmark, integration, release-readiness, and system sanity checks.

## Purpose

A sanity check determines whether a declared subject is coherent with its authority, ownership, contracts, actual behavior, evidence, failure handling, resource bounds, lifecycle, and integration consequences.

A sanity check is not merely:

- running tests or linters;
- reading a diff;
- listing code smells;
- sampling a few files;
- restating what code appears to do;
- or repairing whatever the reviewer notices.

Those may provide evidence. They do not by themselves establish coherence.

The governing rule is:

> A proper sanity check accounts for every surface included in its claim at the depth justified by risk, interrogates the semantic behavior that matters, reconciles evidence across boundaries and end-to-end paths, and gives every actionable finding a durable disposition.

## Relationship to assessment and planning

Assessment is prospective: it determines what problem and design should govern future work. Sanity checking is verificational: it determines whether an existing subject or completed change is actually coherent.

A sanity check may reuse the assessment's authority, scope, risks, and expected outcomes by reference. It must not treat the plan or intended design as proof that the implementation satisfies them.

Do not duplicate one assessment into a second sanity record. Link it, then record only review-specific coverage, evidence, findings, reconciliation, and claim limits.

## Claim types

Every sanity check declares one claim type before deep inspection.

### Full

Every declared surface is:

- reviewed at justified depth;
- excluded with a defensible reason;
- or explicitly blocked by named missing access/evidence.

Required component, boundary, end-to-end, cross-cutting, and findings reconciliation is complete or exactly blocked.

**Full means complete coverage accounting, not identical exhaustive depth for every low-risk leaf.**

### Bounded

Complete review of a deliberately limited subject, component, contract, path, artifact set, or change boundary. The limit must be precise enough that readers cannot mistake it for a repository-wide claim.

### Sampled

Representative, randomized, or risk-selected evidence. Sampling can discover defects and estimate risk; it cannot support a complete-surface claim.

A sampled review must not be described as a full or complete sanity check.

## Review modes

### Implementation self-sanity

The implementation owner checks the completed change before handoff or publication. Authorized in-scope repairs may be made, but:

- the frozen revision and changed revision must be distinguishable;
- affected coverage nodes and reconciliation must be rerun;
- evidence of the failed invariant must not disappear;
- a repair that expands ownership or scope requires reassessment;
- unresolved actionable findings receive durable disposition.

### Independent sanity check or audit

The reviewer evaluates the declared subject independently. The review does not quietly repair findings. Remediation is a separate authorized work node so the review conclusion remains trustworthy.

Independence is required when the owner requests an audit, release gate, incident review, full-system claim, or another policy requires separation.

## Proportional rigor

Use the smallest complete process that protects the actual claim and failure modes.

### Core depth

Use for low-risk, locally understandable leaves. Apply the mandatory core in [`SEMANTIC_INTERROGATION.md`](SEMANTIC_INTERROGATION.md).

### Triggered-module depth

Use when the leaf changes, depends on, or makes a material claim about persistence, security, concurrency, external resources, performance, identity, compatibility, provenance/generated content, destructive behavior, GPU/device closure, finite memory, schema/JIT/ABI, or graph/search semantics.

### Exhaustive depth

Use for critical trust or data-loss boundaries, incidents, hostile audits, difficult concurrency/recovery, opaque high-blast-radius mechanisms, or an explicitly justified critical leaf.

State why exhaustive depth is needed and what decision it supports. Exhaustive questionnaires are not the default definition of diligence.

Risk controls review order and depth. A low-risk node in a full review may receive a concise core review, but it may not silently disappear from coverage.

## 1. Freeze revision and declare the claim

Record:

- repository, branch, commit, generated-engine identity, model/schema version, immutable artifact, or other exact review target;
- subject kind and declared claim: full, bounded, or sampled;
- self-sanity or independent mode;
- governing authority, owner, consumers, and expected behavior;
- material risks and consequence horizon;
- included surfaces and explicit exclusions;
- access limits, environment, hardware/toolchain profile, and unavailable evidence;
- canonical issue/record when the work spans sessions, reviewers, or actionable findings;
- temporary access, branches, downloads, instrumentation, credentials, or artifacts requiring later disposition.

If the subject changes, mark affected evidence invalid. A final full claim must name one exact final revision. Reuse unaffected evidence only when the dependency and invalidation argument is explicit.

## 2. Build a semantic coverage map

Partition the subject by ownership and integration rather than by arbitrary file count.

A UMCGS repository/system map may include:

```text
authority, organization, and source-of-truth records
→ schemas and normative contracts
→ component ownership and public/internal boundaries
→ adapters and compatibility/platform boundaries
→ generated artifacts, layouts, cache identity, and build/JIT pipeline
→ host lifecycle and CUDA Driver boundary
→ device runtime, queues, graph storage, and transposition behavior
→ domain, policy, evaluator, and output contracts
→ memory plan, pressure, cancellation, recovery, and teardown
→ representative and critical end-to-end search paths
→ diagnostics, conformance, benchmarks, packaging, and release artifacts
```

This is an example, not a mandatory checklist for every bounded subject.

Each coverage node records:

- stable coverage ID;
- subject and semantic owner;
- exact files/symbols/artifacts/runtime paths;
- risk and chosen depth;
- why that depth is sufficient;
- dependencies and downstream consumers;
- evidence and status;
- findings and invalidation state.

Status is one of:

- `supported`;
- `violated`;
- `blocked`;
- `excluded`;
- `invalidated`.

Do not use `not inspected` inside a full claim except as an explicit blocker that limits the final conclusion.

## 3. Perform the required passes

### Inventory and authority pass

Verify the declared subject, frozen revision, authoritative documents, component owners, manifests/registry entries, generated forms, build profiles, external state, exclusions, and review access.

Look for duplicated authority, obsolete compatibility copies, generated artifacts being treated as source, unowned components, and code that is not active in the claimed configuration.

### Semantic-leaf pass

Review every coverage leaf at its justified depth using [`SEMANTIC_INTERROGATION.md`](SEMANTIC_INTERROGATION.md).

Write expected behavior before accepting actual behavior. Preserve contradictions, counterexamples, missing evidence, and the earliest failed invariant.

### Component and boundary reconciliation

Reconcile across producers and consumers:

- authoritative state ownership and writers;
- public ports and dependency direction;
- semantic meaning, units, ranges, precision, identity, and versions;
- memory spaces, ownership, lifetime, publication, and ordering;
- failure classes, cancellation, backpressure, cleanup, and resource transfer;
- adapter translation and compatibility behavior;
- generated/source correspondence.

A set of locally correct leaves can still form an incoherent component boundary.

### End-to-end path reconciliation

Trace representative and critical paths from input/configuration and authority through transition, state, failure, and resource behavior to observable output and terminal cleanup.

For UMCGS, selected paths may include:

- schema/profile → normalized IR → memory/layout plan → generated engine → load/launch;
- root input → selection/transition/lookup/evaluation/backup → output;
- queue or arena pressure → deterministic degradation/termination;
- cancellation or launch failure → completion, release, and observable result;
- reroot/persistence path where supported;
- incompatible driver/model/schema/profile → safe rejection.

Tests are useful only when they exercise the actual path and claimed mechanism.

### Cross-cutting and lifecycle reconciliation

Review only triggered concerns, such as:

- persistence, migration, rollback, and recovery;
- security, trust, executable schemas/native capabilities, and privacy;
- concurrency, publication, wakeup, and cancellation;
- finite memory, saturation, reclamation, and device loss;
- public compatibility and deprecation;
- provenance, generated content, and third-party material;
- performance and search-quality equivalence;
- packaging, installation, release, and external resource lifecycle.

### Findings reconciliation

Reconcile duplicate manifestations before filing separate issues. Preserve useful manifestations while identifying the smallest credible owning cause.

Classify each result as:

- confirmed violation;
- credible high-risk uncertainty;
- weak lead;
- informational observation.

Confirmed violations and high-risk uncertainties that require action receive durable issue/work disposition. Weak leads remain in the sanity record unless further work is justified.

### Review-state disposition

Remove, restore, archive, transfer, or intentionally retain review-created branches, downloads, generated reports, instrumentation, credentials, temporary access, datasets, logs, restore copies, and local modifications.

Track only material review-created state. Do not create a cleanup ledger for artifacts that never existed or require no decision.

## 4. Findings standard

A finding states:

- exact frozen revision, location, artifact, or runtime path;
- governing authority and expected invariant;
- actual conflicting or uncertain mechanism;
- decisive evidence and confidence;
- consequence and affected owners/consumers;
- severity;
- root-cause/duplicate reconciliation;
- smallest coherent remediation boundary;
- durable issue or explicit non-action disposition;
- checks not run and evidence that could change the conclusion.

Do not file a vague recommendation, hypothetical redesign, or style preference as a defect. Do not bury a confirmed problem inside an enormous questionnaire.

## 5. Parallel and staged sanity checks

Parallel review requires:

- one frozen revision and claim;
- stable coverage IDs;
- non-overlapping primary ownership;
- common depth and finding rules;
- explicit dependency handoffs;
- central contradiction, boundary, path, and findings reconciliation.

Parallel leaf completion is not proof of integrated coherence.

A staged review may close low-risk nodes early, but its final claim remains open until all declared surfaces and required reconciliation are accounted for.

## 6. Evidence discipline

Tests, compilers, static analyzers, sanitizers, schemas, traces, profilers, logs, benchmarks, artifact inspectors, and reference implementations are evidence sources. None substitutes for understanding the mechanism and its integration surface.

Use the cheapest decisive evidence first. Expand only while a material claim remains uncertain or a trigger requires deeper evidence.

For performance, distinguish throughput from useful search work and preserve semantic, quality, resource, and stopping equivalence. For CUDA/device work, identify the actual synchronization boundary and prove that active progress does not depend on a host-produced intermediate decision.

## 7. Administrative restraint

- Routine self-sanity may live in the PR or task response; no separate record is required.
- Use one canonical sanity record for a full review, long-running bounded review, multi-agent review, audit, incident, or cross-session continuation.
- Low-risk leaves may be grouped in one coverage node when they share owner, risk, contract, and evidence.
- Do not create one form per file or function.
- Link authority, assessment, tests, findings, and issues instead of copying them.
- Create issues only for actionable independent findings or explicitly justified high-risk uncertainties.
- Do not maintain a second risk register, plan, or status ledger inside the sanity record.
- Stop expanding the review when the declared claim is supported or exactly limited and additional work cannot change a material decision.

The record exists to make the claim trustworthy and continuable, not to prove that paperwork occurred.

## 8. Prohibited claims

Do not claim full or complete sanity when:

- declared surfaces are missing or silently sampled;
- the target revision or artifact is unclear;
- depth is unrelated to risk;
- critical callers, dependencies, state, contracts, resources, or lifecycle were ignored;
- component/boundary or end-to-end reconciliation was skipped;
- changed revisions did not invalidate affected evidence;
- tests or lint results were treated as semantic proof;
- actionable findings lack durable disposition;
- review-created sensitive or material state is abandoned;
- checks not run or access limits are hidden;
- the final claim is broader than the evidence.

Do not reject a full claim merely because low-risk nodes used concise core review instead of exhaustive interrogation.

## Completion

A sanity check concludes when:

- every declared surface is accounted for;
- each depth choice is justified by risk;
- semantic leaves and objectively triggered modules are resolved or blocked;
- component, boundary, end-to-end, and triggered lifecycle reconciliation is complete or exactly limited;
- contradictions and invalidated evidence are resolved;
- actionable findings have durable disposition;
- material review-created state is intentional;
- checks not run and claim limits are explicit;
- the final claim names the exact revision and is no broader than the evidence.

Use [`../templates/sanity-check.template.yaml`](../templates/sanity-check.template.yaml) when a durable record is justified. Use [`../templates/semantic-review.template.yaml`](../templates/semantic-review.template.yaml) only for critical leaves or continuation that cannot be captured concisely in the coverage node.