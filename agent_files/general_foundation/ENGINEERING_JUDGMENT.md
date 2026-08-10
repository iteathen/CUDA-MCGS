# Engineering Judgment, Specification Alignment, and Priority

**Scope:** Reusable method for turning authority and domain truth into a sound engineering decision, selecting among competing paths, ranking conflicting values, ordering work, and preserving alignment through implementation and validation.

## Engineering is more than implementation

Engineering is the controlled transformation of an accepted need into a verified operating state under finite resources, uncertainty, and consequences.

Code is one possible output. A complete engineering result also includes:

- the correct problem and owner;
- an authoritative specification or explicit decision boundary;
- sound foundations, interfaces, lifecycles, and resource behavior;
- a reasoned choice among credible alternatives;
- an explicit ordering of values and risks;
- evidence capable of falsifying the important claims;
- integration, recovery, cleanup, and continuation state.

The governing rule is:

> Establish the validity envelope first. Eliminate paths that violate authority, unacceptable-risk boundaries, or required behavior. Then compare the remaining paths using the subsystem’s mission, evidence, reversibility, total lifecycle cost, and explicitly ordered values. Choose the lowest complete path, not the easiest local edit.

## Key distinctions

### Specification obligation

A behavior, bound, ownership rule, compatibility promise, failure rule, or evidence requirement imposed by accepted authority.

### Derived requirement

A requirement not quoted directly from a specification but logically necessary to satisfy one. Derived requirements must show their derivation and cannot silently expand authority.

### Design principle

A lens for shaping a valid solution. LEGO, SOLID, CUPID, simplicity, domain-appropriate foundations, accurate generality, and contextual weighting do not override the specification; they help realize it coherently.

### Hard gate

A condition every candidate path must satisfy. Failure removes the path from consideration unless authority changes.

### Mission objective

A value the subsystem exists to optimize after hard gates are satisfied, such as search quality, latency, throughput, availability, portability, or developer usability.

### Supporting quality

A property that improves the total system but is not normally the subsystem’s primary mission, such as maintainability, observability, composability, predictability, or developer joy.

### Process cost

Delivery time, engineering effort, token/context use, CI cost, review burden, operational overhead, migration effort, and coordination cost.

### Priority

The order in which work should be addressed, based on consequence, dependency, information value, cost of delay, reversibility, and effort—not mere urgency language or ease.

## 1. Build the engineering contract

Before comparing implementations, translate the task into an engineering contract.

### Required outcome

State the behavior or capability that must exist, who consumes it, and what observable result distinguishes completion from a plausible-looking failure.

### Authority

Identify the exact owner instruction, accepted ADR, accepted specification, public contract, standard, external compatibility promise, and executable invariant governing the work.

### Semantics and invariants

Define:

- authoritative state and owner;
- inputs, outputs, errors, and side effects;
- units, ranges, precision, identity, versions, and memory spaces;
- lifecycle, ordering, publication, concurrency, and cancellation;
- failure, pressure, exhaustion, recovery, rollback, and cleanup;
- compatibility, migration, persistence, and provenance;
- evidence and test-oracle ownership.

### Operating envelope

Define environment, workload, expected scale, hardware/software profiles, finite memory/time/bandwidth/storage budgets, accuracy/quality bounds, deadlines, and allowable degradation.

### Non-goals

State excluded behavior and prove that exclusion does not invalidate the result.

### Completion evidence

Map each material claim to evidence capable of disproving it.

Do not select architecture while these remain undefined at a consequence that can change the path.

## 2. Align implementation to specifications

Specifications are obligations, not themes or suggestions to resemble.

### Normalize normative language

Where the authority uses normative terms:

- **must / shall** — hard obligation;
- **must not / shall not** — prohibited state or path;
- **should** — default requirement that needs an explicit justified exception;
- **may** — permitted variation, not required behavior;
- **informative explanation** — rationale or example, not independent authority.

Do not infer that unspecified behavior is permitted merely because it is convenient.

### Create the obligation map

For every material obligation, record:

```text
source and clause
    → normalized obligation
    → classification: gate / target / preference
    → authoritative owner
    → design or mechanism that satisfies it
    → failure consequence
    → evidence / test capsule
    → current status
```

One implementation element may satisfy several obligations. One obligation may require several collaborating owners. The map preserves traceability without requiring one artifact per clause.

### Handle specification defects honestly

Classify problems as:

- **ambiguity** — multiple materially different readings;
- **conflict** — two authorities cannot both be satisfied;
- **gap** — a necessary decision has no authority;
- **stale authority** — accepted text no longer describes the intended system;
- **unimplementable obligation** — the requirement contradicts platform or domain reality;
- **test-oracle mismatch** — tests and authority disagree.

Do not resolve any of these silently in code or tests. Pause the affected path, preserve evidence, and route the decision to the authoritative owner through a specification change or ADR.

Existing code, existing tests, comments, prior plans, and previous agent output are evidence. They are not automatically the specification.

### Preserve alignment during execution

Before a material operation, identify the obligations it is meant to satisfy. After the operation, compare actual behavior and evidence with those obligations.

Do not:

- weaken the specification to match an easy implementation;
- weaken tests to preserve an implementation;
- add behavior not authorized by the owned outcome;
- treat passing tests as proof when the tests observe the wrong contract;
- continue dependent work after a shared specification changes without invalidating it.

## 3. Apply the design principles in the correct order

The design principles are an ordered cascade, not equal votes.

### Authority and domain truth

Determine what must be true and what the domain permits.

### Purpose, bounds, and value ordering

Define the mission, hard gates, objectives, tolerances, resources, and consequences before selecting structure.

### LEGO at the macroscopic boundary

Choose coherent owners with explicit public ports, injected dependencies, adapter boundaries, lifecycle, and replaceability.

### SOLID inside the brick

Separate internal responsibilities only where meaning, ownership, change, testing, substitution, concurrency, or lifetime justifies it.

### CUPID in the implementation

Prefer composable, idiomatic, predictable, domain-based code that developers can understand and use correctly.

### Simplicity after soundness

Among designs that satisfy the engineering contract, choose the simplest sufficient total system. Simplicity cannot waive correctness, safety, resources, compatibility, testing, recovery, or cleanup.

When principles appear to conflict, first check whether the ownership boundary or problem framing is wrong. Then use the engineering contract and contextual value ordering. Do not count principle names as votes.

## 4. Reason from evidence rather than preference

### Separate statement types

Label important claims as:

- owner requirement;
- accepted authority;
- verified observation;
- external source claim;
- inference;
- assumption;
- proposal;
- unresolved unknown.

A decision that depends on an assumption must include a falsifier, experiment, accepted-risk boundary, or blocker.

### Build a causal model

Describe how inputs and state produce the relevant result, including the first boundary where observed behavior can diverge from expected behavior.

For a defect, identify first divergence before proposing repair. For a design, identify the mechanism that produces each claimed benefit and cost.

### Generate credible alternatives

Include, where material:

- no change;
- minimal local repair;
- the proposed path;
- a materially different architecture;
- a boundary split or adapter;
- a bounded experiment or staged rollout;
- a fallback or degraded mode.

Do not compare one detailed proposal against an undefined “other option.”

### Seek decisive evidence

Use the cheapest observation, experiment, reference, test, or prototype that can distinguish candidates. Empirical uncertainty is resolved with evidence, not additional rhetoric.

### Adversarially challenge

Steelman the strongest objection to:

- problem framing;
- authority interpretation;
- ownership boundary;
- generality and naming;
- resource and failure model;
- value ordering;
- claimed simplicity;
- evidence quality;
- migration, recovery, and cleanup;
- the cost of choosing incorrectly.

A credible adversary argues both that the design is too large and that it is too small, supplies concrete counterexamples, and proposes a viable alternative.

### Calibrate confidence

State what is known, how it is known, and what remains uncertain. High consequence plus low confidence favors reversible experiments, stronger evidence, staged rollout, or blocking—not confident prose.

### Stop reasoning at the right point

Reasoning is complete when another pass cannot materially change the candidate set, value ordering, chosen path, validation, risk, or next action. Do not continue analysis for display.

## 5. Translate abstract values into engineering terms

“Safety versus speed” and “accuracy versus correctness” are often poorly framed. Before ranking values, translate each into one of four roles.

### Hard gate

A minimum or maximum that cannot be crossed:

- no untrusted arbitrary native pointer capability;
- no data corruption;
- device memory usage must remain within the selected profile;
- p99 latency must be below a real-time deadline;
- numerical error must remain below an accepted tolerance;
- active search may not depend on host-produced intermediate decisions.

### Mission objective

A quantity to optimize after gates pass:

- maximize search quality at a fixed resource budget;
- minimize latency after semantic correctness and deadlines are met;
- maximize throughput without changing work or output quality;
- maximize availability within consistency and recovery promises.

### Supporting quality

A value to improve while preserving the mission:

- maintainability;
- observability;
- portability;
- developer usability;
- composability;
- extensibility within the intended equivalence class.

### Process cost or tie-breaker

A value used to choose among otherwise valid paths:

- delivery time;
- token/context cost;
- implementation effort;
- review and CI burden;
- operational complexity;
- aesthetic elegance.

A value may change roles by context. A speed target is a performance preference in an offline generator but a correctness or safety gate in a real-time control loop. Accuracy may be the product objective, a minimum contractual threshold, or irrelevant to an exact symbolic subsystem.

## 6. Rank conflicting values

No concern dominates every subsystem. Use a two-stage decision.

### Stage A: eliminate invalid paths

Reject a candidate that:

- violates owner instruction, accepted authority, law, or an explicit ethical boundary;
- crosses an unacceptable safety, security, privacy, data-integrity, or recovery threshold;
- violates semantic correctness or a required accuracy, deadline, availability, compatibility, or finite-resource bound;
- leaves ownership, failure, pressure, lifecycle, or cleanup materially undefined;
- depends on evidence known to be stale, circular, or incapable of observing the claim.

Do not average a catastrophic violation against performance or delivery benefits.

### Stage B: order values among valid paths

Use the subsystem-specific engineering contract. When no more specific ordering exists, use this default fallback:

1. **Authority, legality, and explicit ethical limits.**
2. **Prevention of unacceptable irreversible harm:** safety, security, privacy, data integrity, containment, and recoverability.
3. **Semantic correctness and explicit hard mission bounds:** required accuracy, real-time deadlines, finite resources, determinism, or consistency where specified.
4. **Reliability, availability, compatibility, operability, and diagnosability required to sustain the mission.**
5. **Mission quality and performance:** accuracy above the minimum, search strength, latency, throughput, memory/bandwidth efficiency, or utility.
6. **Maintainability, architecture, usability, observability, portability, extensibility, and developer joy.**
7. **Delivery speed, token/process cost, convenience, and cosmetic polish.**

This is a fallback, not a universal immutable ranking. The subsystem purpose can promote speed, availability, accuracy, simplicity, or another concern into a higher gate. Any deviation must state why, which failure becomes acceptable, who owns that decision, and what evidence or revisit trigger constrains it.

### Use lexicographic gates before weighted scoring

Weighted scoring is permitted only after hard gates are satisfied. Never allow a high aggregate score to conceal a red-line failure.

Prefer ordinal judgments supported by evidence over invented numerical precision. Use quantitative weights only when the metrics, scales, and stakeholder utility are real and comparable.

### Evaluate consequence and uncertainty

For each tradeoff, consider:

- severity;
- likelihood;
- exposure or frequency;
- blast radius;
- reversibility;
- detectability before harm;
- uncertainty/confidence;
- cost of delay;
- dependency impact;
- recovery cost.

High severity, low reversibility, poor detectability, or high uncertainty raises the priority of safety, evidence, containment, and reversible paths.

## 7. Avoid false tradeoffs before accepting real ones

Before sacrificing one value, look for an architectural path that separates the concerns:

- fast and safe modes with explicit profiles;
- offline and online paths;
- a generic contract with specialized implementation;
- a platform adapter;
- bounded approximation with exact guardrails;
- staged rollout and rollback;
- asynchronous work outside a latency-critical path;
- a safe fallback;
- independent read and write models;
- a reference path plus an optimized path.

A tradeoff is real only after credible separation alternatives have been considered and rejected with evidence.

When a tradeoff remains, record:

- value reduced;
- value gained;
- exact boundary and operating conditions;
- worst credible consequence;
- owner accepting the tradeoff;
- evidence supporting it;
- detection and containment;
- rollback or redesign trigger;
- expiration or revisit date/event where appropriate.

## 8. Select the best path

### Candidate gate matrix

For each credible path, evaluate:

- specification and authority compliance;
- safety/security/data-integrity envelope;
- semantic correctness and quality bounds;
- ownership and LEGO alignment;
- resource/lifecycle/failure/recovery completeness;
- testability and evidence quality;
- compatibility and migration;
- performance mechanism and expected limits;
- total lifecycle complexity;
- reversibility and option value;
- dependency unlock and delivery cost.

Eliminate failing paths before preference comparison.

### Pareto dominance

If one valid path is no worse on every material concern and materially better on at least one, eliminate the dominated path unless an unmodeled uncertainty is explicit.

### Prefer information before commitment

When uncertainty can change the architecture and a bounded experiment is cheaper than choosing incorrectly, run the experiment first.

Prefer reversible steps when evidence is weak. Prefer direct implementation when the authority, mechanism, and acceptance are already clear and the experiment would teach nothing.

### Preserve option value without speculative machinery

Choose interfaces and foundational capacities that support reasonably expected second instances and growth. Do not build unowned subsystems for hypothetical futures.

### Evaluate the total system

Include complexity and cost moved into:

- callers and adapters;
- generated code and caches;
- device memory and synchronization;
- persistence/migration/recovery;
- testing and debugging;
- operations, packaging, deployment, and cleanup;
- context, review, and coordination;
- future second consumers.

The best path is the lowest complete total system that satisfies the ordered values with adequate evidence—not necessarily the smallest diff or shortest schedule.

### Record why alternatives lost

A decision is reviewable only when rejected paths have concrete reasons: failed gate, dominated outcome, insufficient evidence, excessive irreversible risk, wrong owner, higher total cost, or lack of decision-relevant benefit.

## 9. Prioritize the work

Use priority classes to prevent convenience from becoming the schedule.

### P0 — contain active unacceptable state

Examples:

- active safety/security exposure;
- data corruption or loss;
- runaway cost/resource leak;
- invalid migration or partial state;
- wrong authority being treated as current;
- a production or release path operating outside required bounds.

Contain first. Preserve evidence and recovery.

### P1 — resolve a gate or foundational blocker

Examples:

- specification conflict or missing owner;
- correctness failure;
- unsafe public contract;
- foundational identity/range/lifecycle decision;
- irreversible migration decision;
- dependency required by many downstream branches;
- missing authoritative oracle for a critical claim.

No dependent implementation proceeds until the gate is resolved.

### P2 — maximize information, risk reduction, and dependency unlock

Examples:

- cheap decisive experiment;
- first-divergence diagnosis;
- contract/conformance work that unlocks several branches;
- pressure/failure validation before scaling implementation;
- prototype that decides between materially different architectures.

Prefer high information value per unit cost.

### P3 — deliver mission value and measured efficiency

Examples:

- implementation on the accepted critical path;
- search-quality or throughput improvement with equivalence guardrails;
- reliability, compatibility, or operability improvement;
- removal of measured bottlenecks.

### P4 — improve supporting quality and polish

Examples:

- maintainability cleanup not required by the current change;
- developer-experience refinement;
- cosmetic documentation or naming polish;
- speculative optimization without current evidence.

Do not let P4 displace P0–P3 work.

### Priority factors within a class

Order work by:

1. dependency unlock;
2. consequence and risk reduction;
3. information value;
4. cost of delay and affected consumers;
5. exposure/frequency;
6. reversibility and recovery cost;
7. effort and available capacity.

Do not prioritize by the easiest file, the loudest symptom, newest request, largest diff, or what is most enjoyable to implement.

## 10. Keep alignment during execution

Before each material operation, state:

```text
obligation / decision
owner
chosen path
expected local and wider effects
value ordering being preserved
decisive falsifier
evidence and test capsule
rollback / cleanup
```

After the operation:

- inspect exact actual effects;
- compare them with the obligation map;
- identify newly triggered values, risks, or specification gaps;
- invalidate dependent decisions/evidence when shared meaning changes;
- revise the plan when the selected path or priority no longer holds.

A local implementation detail may vary without revisiting the decision only when it preserves authority, owner, contract, value ordering, risk, acceptance, and downstream outputs.

## 11. UMCGS examples

### Device closure versus host convenience

ADR-0003 makes device-owned active search a hard gate. A simpler host micro-batch loop is not a valid production alternative when search progress depends on host relaunch. Host convenience cannot be weighted against a failed gate.

### Search quality versus throughput

Define the comparison envelope first: same domain semantics, resource budget, stopping rule, evaluator, and quality metric. A faster result that weakens search quality or performs less work is not automatically better. Minimum quality may be a gate; quality above it and throughput may then be mission objectives.

### Real-time deadline versus exactness

If missing the deadline makes the result unusable or unsafe, latency is part of correctness. The engineering contract may permit a bounded approximation that meets the deadline, but the approximation and error bound must be explicit. “Correct but late” and “fast but unbounded” both fail.

### Managed memory versus device-local memory

Convenience is a supporting quality. Predictable search-hot residency, bounded migration behavior, and profile-specific performance may be hard requirements. Expose memory capabilities generically and select a conforming profile rather than universalizing the convenient first mechanism.

### Mock versus native evidence

A mock can satisfy orchestration and lifecycle claims but cannot prove native CUDA ordering, device closure, or performance. Evidence scope is a hard gate on the claim.

### UMCGS versus CUDA-JS ownership

The peer split passes first-consumer deletion and dependency-direction tests: CUDA-JS remains coherent without UMCGS, while UMCGS owns search semantics. Faster implementation through private-source coupling would fail the accepted architecture and compatibility envelope.

## 12. Prohibited patterns

- Treating specifications as inspirational prose.
- Selecting files or technologies before defining the engineering contract.
- Treating current implementation or tests as automatic authority.
- Silently resolving specification conflicts or gaps in code.
- Counting design principles as equal votes.
- Calling an incomplete design simple.
- Using a weighted score to hide a failed safety, correctness, resource, or compatibility gate.
- Declaring “safety first” or “performance first” without translating the value into thresholds and consequences.
- Choosing the first plausible path without credible alternatives.
- Comparing a detailed proposal against an undefined alternative.
- Inventing precise numerical weights without real comparable data.
- Prioritizing by ease, recency, file count, or loudness.
- Continuing because of sunk cost after evidence invalidates the path.
- Optimizing a local subsystem while exporting larger cost elsewhere.
- Deferring integration, recovery, or cleanup as somebody else’s problem.
- Producing a decision record that contains no decision-relevant evidence or rejected alternative.

## 13. Proportional records

Routine mechanical work needs no standalone engineering-decision record when authority, owner, gates, path, and validation are obvious.

Use [`../templates/engineering-decision.template.yaml`](../templates/engineering-decision.template.yaml) when a decision is foundational, contested, cross-component, high-consequence, empirically uncertain, difficult to reverse, or must survive across sessions/agents.

The record stores unique decision truth:

- engineering contract;
- obligation map;
- value classification and ordering;
- credible candidates and gate results;
- evidence and uncertainty;
- adversarial challenge;
- selected path and priority;
- tradeoffs and revisit triggers.

It does not duplicate the specification, assessment, plan, branch packet, execution log, test record, PR, or handoff.

## Completion

Engineering judgment is complete when:

- the owned outcome and consumer are explicit;
- accepted authority and every material obligation are mapped;
- specification gaps/conflicts are resolved, blocked, or routed to authority;
- hard gates, mission objectives, supporting qualities, and process costs are distinguished;
- values are translated into measurable bounds or explicit ordinal criteria;
- credible alternatives, including no/minimal change and a materially different path, were considered;
- invalid and dominated paths are eliminated for stated reasons;
- uncertainty is supported by evidence, experiment, accepted risk, or blocker;
- design principles were applied in the correct cascade;
- the selected path and work priority follow the ordered values and total-system consequences;
- tradeoffs, confidence, rollback, and revisit triggers are explicit;
- implementation, tests, integration, cleanup, and handoff remain traceable to the decision;
- additional reasoning would not materially change the result, evidence, risk, or next action.
