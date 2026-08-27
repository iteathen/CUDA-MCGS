# Proportional System-Wide Sanity Checking

**Scope:** Repository, component, contract, schema, implementation, generated artifact, migration, benchmark, integration, release-readiness, incident, and system sanity checks.

## Purpose

A sanity check determines whether a declared subject is coherent with its authority, ownership, specifications, contracts, actual behavior, evidence, failure handling, resource bounds, lifecycle, and integration consequences.

A sanity check is not merely running tests, reading a diff, listing code smells, sampling files, restating what code appears to do, or repairing whatever the reviewer notices. Those activities may produce evidence. They do not by themselves establish coherence.

The governing rule is:

> Freeze the exact subject, define the claim, partition the complete surface into semantic review branches small enough for full attention, interrogate every material semantic unit at risk-justified depth, reconcile the branches into the integrated system, and give every actionable finding a durable disposition.

A system-wide review must succeed at two scales simultaneously:

- **local mechanism:** every material unit is inspected closely enough to expose wrong assumptions and missing consequences;
- **integrated system:** individually plausible units are reconciled across ownership, contracts, runtime paths, resources, failure, and lifecycle.

## Relationship to assessment and planning

Assessment is prospective: it determines what problem and design should govern future work. Sanity checking is verificational: it determines whether an existing subject or completed change is actually coherent.

A sanity check may reuse the assessment’s authority, scope, risks, and expected outcomes by reference. It must not treat the plan or intended design as proof that the implementation satisfies them.

Do not duplicate one assessment into a second sanity record. Link it, then record only review-specific scope, coverage branches, evidence, findings, reconciliation, and claim limits.

## Claim types

Every sanity check declares one claim type before deep inspection.

### Full

Every declared surface is reviewed at justified depth, excluded with a defensible reason, or explicitly blocked by named missing access or evidence. Required component, boundary, end-to-end, cross-cutting, lifecycle, and findings reconciliation is complete or exactly blocked.

**Full means complete coverage accounting, not identical exhaustive depth for every low-risk leaf.**

### Bounded

Complete review of a deliberately limited subject, component, contract, path, artifact set, or change boundary. The boundary must be precise enough that readers cannot mistake it for a repository-wide claim.

### Sampled

Representative, randomized, or risk-selected evidence. Sampling can discover defects and estimate risk; it cannot support a complete-surface claim.

A sampled review must not be described as full, complete, or system-wide.

## Review modes

### Implementation self-sanity

The implementation owner checks the completed change before handoff or publication. Authorized in-scope repairs may be made, but:

- the frozen revision and changed revision remain distinguishable;
- affected branches, boundaries, and paths are invalidated and rerun;
- evidence of the failed invariant does not disappear;
- a repair that expands ownership or scope requires reassessment;
- unresolved actionable findings receive durable disposition.

### Independent sanity check or audit

The reviewer evaluates the declared subject independently. The review does not quietly repair findings. Remediation is a separate authorized work node so the reviewed subject and conclusion remain trustworthy.

Independence is required when the owner requests an audit, release gate, incident review, full-system claim, or another policy requires separation.

## Proportional rigor

Use the smallest complete process that protects the actual claim and failure modes.

### Core depth

Use for low-risk, locally understandable semantic units. Apply the mandatory core in [`SEMANTIC_INTERROGATION.md`](SEMANTIC_INTERROGATION.md).

### Triggered-module depth

Use when the unit changes, depends on, or makes a material claim about design/universality, graph/search semantics, evaluator/numerics, persistence, security, concurrency, external resources, performance, identity, compatibility, provenance/generated content, destructive behavior, GPU/device closure, finite memory, schema/JIT/ABI, or diagnostics.

### Exhaustive depth

Use for critical trust or data-loss boundaries, incidents, hostile audits, difficult concurrency/recovery, opaque high-blast-radius mechanisms, or an explicitly justified critical leaf.

State why exhaustive depth is needed and what decision it supports. Questionnaire length is not the definition of diligence.

Risk controls review order and depth. A low-risk unit in a full review may receive a concise core review, but it may not silently disappear from coverage.

## Step 1: Freeze revision and define scope

Record before deep inspection:

- repository, branch, exact commit, generated-engine identity, model/schema version, immutable artifact, or other exact target;
- `full`, `bounded`, or `sampled` claim;
- self-sanity or independent mode;
- governing authority, specifications, contracts, schemas, owner, consumers, and expected behavior;
- included product areas, components, adapters, generated forms, runtime environments, hardware/toolchain profiles, and external state;
- explicit exclusions and why they cannot invalidate the claim;
- material risks, consequence horizon, access limits, and unavailable evidence;
- canonical issue or record when the work spans sessions, reviewers, or actionable findings;
- temporary access, Git branches, downloads, instrumentation, credentials, reports, restore copies, or artifacts requiring later disposition.

If the subject changes, mark affected evidence invalid. A final full claim must name one exact final revision. Reuse unaffected evidence only when the dependency and invalidation argument is explicit.

## Step 2: Build a complete semantic coverage map

Partition by semantic ownership and integration rather than arbitrary file count.

A CUDA-MCGS repository/system map may include:

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
→ retained external and review-created state
```

This is an example, not a mandatory list for every bounded subject. Planned components are not reviewed as implemented code.

Each coverage entry initially records:

- stable coverage ID;
- subject, semantic owner, and branch type;
- exact files, symbols, schemas, generated artifacts, runtime paths, or external state;
- upstream/downstream dependencies and required reconciliation;
- risk and candidate depth;
- material semantic units;
- required evidence;
- exclusions, status, findings, and invalidation state.

## Step 3: Break coverage into manageable review branches

A **review branch** is a semantic coverage packet. It is not automatically a Git branch. Create a Git branch only when isolated remediation, transport, or coordination actually requires one.

### Branch types

- **Owner branch** — one component or authoritative contract owner.
- **Boundary branch** — one producer/consumer, ABI, schema, adapter, or resource-transfer boundary.
- **Path branch** — one end-to-end control, data, failure, or recovery path.
- **Cross-cutting branch** — one triggered concern such as security, persistence, concurrency, performance, provenance, or release.
- **Artifact branch** — one generated, packaged, deployed, restored, cached, or externally retained artifact family.

### Full-attention sizing rule

A leaf branch is small enough only when one reviewer can hold, in one focused review session and without sampling or skimming:

- its purpose, authority, owner, and exclusions;
- every material semantic unit and relevant specification;
- inputs, outputs, callers, dependencies, state, identity, and lifetime;
- invariants, units, ranges, precision, resources, ordering, and pressure behavior;
- normal, failure, cancellation, cleanup, and recovery behavior;
- applicable LEGO, SOLID, CUPID, universality, foundation, and simplicity questions;
- decisive evidence, counterexamples, boundary obligations, and wider consequences.

Split a branch before detailed review when:

- it has more than one primary semantic owner;
- unrelated contracts, artifacts, or runtime paths are mixed;
- the reviewer would have to sample, skim, or defer material units;
- materially different triggered modules dominate different portions;
- a finding cannot be assigned to a clear owner;
- the mechanism and consequence horizon cannot remain simultaneously active in context;
- one section could change without invalidating evidence for the others.

Do not split solely by line count or file count. A small concurrency protocol, migration, or allocator may deserve its own critical branch. A large low-risk declarative surface may remain one branch when a single owner, contract, and evidence set govern it.

Parent branches may organize the coverage tree, but detailed review occurs in leaf branches. Each leaf records its semantic-unit inventory before review begins. If the inventory no longer fits one focused session, split again.

### Coverage completeness versus branch size

Small branches do not authorize narrow thinking. Each leaf records its upstream/downstream reconciliation obligations, and the overall coverage map must include boundary, path, cross-cutting, lifecycle, and artifact branches needed to reassemble system meaning.

## Step 4: Perform the required passes

### Inventory and authority pass

Verify the frozen subject, authoritative documents, component owners, manifests and registry entries, generated forms, build profiles, external state, exclusions, and review access.

Look for duplicated authority, stale compatibility copies, generated artifacts being treated as source, unowned components, and code that is not active in the claimed configuration.

### Semantic branch pass

For every leaf review branch:

1. confirm its size still permits full attention;
2. inventory every material semantic unit;
3. review each unit using [`SEMANTIC_INTERROGATION.md`](SEMANTIC_INTERROGATION.md);
4. apply every objectively triggered module;
5. write expected behavior before accepting actual behavior;
6. preserve contradictions, counterexamples, earliest failed invariants, missing evidence, and exact findings;
7. conclude `supported`, `supported_with_limits`, `violated`, `blocked`, or `invalidated`.

Inspect the complete branch surface, not only code that already looks suspicious.

### Component and boundary reconciliation

Reconcile across producers and consumers:

- authoritative state ownership and writers;
- public ports and dependency direction;
- semantic meaning, units, ranges, precision, identity, and versions;
- memory spaces, ownership, lifetime, publication, and ordering;
- failure classes, cancellation, backpressure, cleanup, and resource transfer;
- adapter translation and compatibility behavior;
- generated/source correspondence.

A set of locally correct branches can still form an incoherent boundary.

### End-to-end path reconciliation

Trace representative and critical paths from input/configuration and authority through transition, state, scheduling, evaluation, failure, and resource behavior to observable output and terminal cleanup.

For CUDA-MCGS, selected paths may include:

- schema/profile → normalized IR → memory/layout plan → generated engine → load/launch;
- root input → selection/transition/lookup/evaluation/backup → output;
- queue or arena pressure → deterministic degradation or termination;
- cancellation or launch failure → completion, release, and observable result;
- reroot/persistence path where supported;
- incompatible driver/model/schema/profile → safe rejection.

For production search, explicitly prove whether any active decision depends on host progress after ignition.

### Cross-cutting and lifecycle reconciliation

Review only triggered concerns, including:

- startup, steady state, pressure, cancellation, teardown, restart, and recovery;
- persistence, migration, rollback, compatibility, and cache invalidation;
- security, trust, executable schemas/native capabilities, privacy, and provenance;
- concurrency, publication, wakeup, progress, and backpressure;
- finite memory, saturation, reclamation, device loss, and workspace failure;
- performance, quality equivalence, degradation, and scale;
- diagnostics, packaging, installation, release, and external-resource lifecycle.

### Design-principle reconciliation

Across all branches, verify:

- singular ownership of authoritative facts, mutation, and lifecycle;
- LEGO component boundaries and explicit injected dependencies;
- SOLID internal responsibilities without ceremonial fragmentation;
- CUPID composability, predictability, idiomatic implementation, and domain-based names;
- domain-appropriate units, ranges, precision, identity, and deliberate finite limits;
- maximum accurate generality, second-instance, first-consumer deletion, and explicit exclusions;
- universal contracts with generated specialization of unused capabilities;
- simplest sufficient total system without hidden complexity exported to callers, memory, synchronization, migration, recovery, diagnostics, or tests;
- conformance to accepted specifications, contracts, schemas, and ADRs.

### Findings reconciliation

Reconcile duplicate manifestations before filing separate issues. Preserve useful manifestations while identifying the smallest credible owning cause.

Classify each result as:

- confirmed violation;
- credible high-risk uncertainty;
- weak lead;
- informational observation.

Confirmed violations and high-risk uncertainties that require action receive durable issue/work disposition. Weak leads remain in the sanity record unless further work is justified.

### Review-state disposition

Remove, restore, archive, transfer, or intentionally retain review-created branches, downloads, generated reports, instrumentation, credentials, temporary access, datasets, logs, restore copies, allocations, and local modifications.

Track only material review-created state. A clean working tree does not prove remote, external, or device-side cleanup.

## Findings standard

A finding states:

- exact frozen revision, coverage branch, location, artifact, or runtime path;
- governing authority and expected invariant;
- actual conflicting or uncertain mechanism;
- decisive evidence and confidence;
- consequence and affected owners, consumers, and manifestations;
- severity;
- root-cause and duplicate reconciliation;
- smallest coherent remediation boundary;
- durable issue or explicit non-action disposition;
- checks not run and evidence that could change the conclusion;
- affected branches, boundaries, and paths requiring revalidation.

Do not file vague recommendations, hypothetical redesigns, or style preferences as defects. Do not bury confirmed problems inside enormous questionnaires.

## Parallel and staged sanity checks

Parallel review requires:

- one frozen revision and claim;
- stable coverage and branch IDs;
- non-overlapping primary branch ownership;
- common sizing, depth, and finding rules;
- explicit dependency and reconciliation handoffs;
- central contradiction, boundary, path, design, and findings reconciliation.

Parallel leaf completion is not proof of integrated coherence.

A staged review may close low-risk branches early, but its final claim remains open until all declared surfaces and required reconciliation are accounted for.

## Evidence discipline

Tests, compilers, static analyzers, sanitizers, schemas, traces, profilers, logs, benchmarks, artifact inspectors, and reference implementations are evidence sources. None substitutes for understanding the mechanism and its integration surface.

Use the cheapest decisive evidence first. Expand only while a material claim remains uncertain or a trigger requires deeper evidence.

For performance, distinguish throughput from useful search work and preserve semantic, quality, resource, and stopping equivalence. For CUDA/device work, identify the actual synchronization boundary and prove that active progress does not depend on a host-produced intermediate decision.

## Administrative restraint

- Routine self-sanity may live in the PR or task response; no separate record is required.
- Use one canonical sanity record for a full review, long-running bounded review, multi-agent review, audit, incident, release, or cross-session continuation.
- Keep review branches as sections or linked packets in that record; do not create one document, issue, or Git branch per function.
- Low-risk units may be grouped only when they share owner, contract, risk, evidence, and branch sizing remains valid.
- Link authority, assessment, tests, findings, and issues instead of copying them.
- Create issues only for actionable independent findings or explicitly justified high-risk uncertainties.
- Do not maintain a second risk register, plan, or status ledger inside the sanity record.
- Stop when the declared claim is supported or exactly limited and additional work cannot change a material decision.

The record exists to make the claim trustworthy and continuable, not to prove that paperwork occurred.

## Prohibited claims

Do not claim full or complete sanity when:

- declared surfaces are missing or silently sampled;
- the target revision or artifact is unclear;
- review branches were too broad for full attention;
- mandatory core questions or triggered modules were skipped;
- depth is unrelated to risk;
- critical callers, dependencies, state, contracts, resources, or lifecycle were ignored;
- component/boundary or end-to-end reconciliation was skipped;
- changed revisions did not invalidate affected evidence;
- tests or lint results were treated as semantic proof;
- actionable findings lack durable disposition;
- review-created sensitive or material state is abandoned;
- checks not run or access limits are hidden;
- the final claim is broader than the evidence.

Do not reject a full claim merely because low-risk units used concise core review instead of exhaustive interrogation.

## Completion

A sanity check concludes when:

- every declared surface is accounted for;
- every leaf review branch is small enough for full attention and has a justified result;
- each material semantic unit received the mandatory core and all triggered modules;
- each depth choice is justified by risk;
- component, boundary, end-to-end, design, and triggered lifecycle reconciliation is complete or exactly limited;
- contradictions and invalidated evidence are resolved;
- actionable findings have durable disposition;
- material review-created state is intentional;
- checks not run and claim limits are explicit;
- the final claim names the exact revision and is no broader than the evidence.

Use [`../templates/sanity-check.template.yaml`](../templates/sanity-check.template.yaml) when a durable record is justified. Use [`../templates/semantic-review.template.yaml`](../templates/semantic-review.template.yaml) only for critical leaves or continuation that cannot be captured concisely in the coverage branch.
