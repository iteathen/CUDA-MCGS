# Assessment and Planning

**Scope:** Reusable method for understanding a change, challenging its design, and producing an executable plan without substituting paperwork for engineering.

## Governing rule

Assessment and planning are different activities:

- **Assessment** determines what problem actually exists, what owns it, which facts and constraints govern it, which design is sound, and what evidence is still missing.
- **Planning** sequences the coherent work needed to realize the assessed design and prove the result.

Do not plan file edits before the assessment establishes the owned problem and design boundary. A detailed plan for the wrong problem is still wrong.

## Soundness before simplicity

Simplicity is important, but it is a selector among designs that already satisfy sound fundamentals.

```text
authority and domain truth
        ↓
purpose, bounds, and evidence
        ↓
ownership, contracts, resources, lifecycle, and failure behavior
        ↓
credible alternatives and adversarial challenge
        ↓
simplest sufficient total system
        ↓
implementation plan and validation
```

A design is not simple when it omits correctness, lifecycle, pressure behavior, compatibility, recovery, or expected-domain capacity. It is incomplete. Conversely, a plan is not mature merely because it contains many artifacts, matrices, approvals, or status fields. Administrative work that protects no decision or invariant is accidental complexity.

## Assessment depth

Use the least administrative form that preserves the needed reasoning and handoff.

### Routine

Use for mechanical, reversible, clearly specified work with no architectural, public-contract, persistent-state, dependency, security, performance, or resource implications.

- No committed assessment artifact is required.
- State objective, scope, relevant authority, validation, and one plausible failure mode in the working note or response.
- Escalate immediately if a hidden design decision appears.

### Substantial

Use for cross-file behavior, public interfaces, component internals, dependency changes, persistent formats, nontrivial tests, or multi-step work.

- Answer every core question below, tersely where the answer is obvious.
- Perform at least one explicit adversarial pass.
- Record the assessment in the issue, task plan, or one canonical plan artifact.
- Do not duplicate the same assessment into issue, plan, PR, and handoff; link the canonical record.

### Critical / foundational

Use for component boundaries, schemas, Search IR, CUDA execution, synchronization, memory layout, JIT/ABI, transpositions, identity, cycles, evaluator contracts, persistent state, security boundaries, hot paths, compatibility architecture, or repository splits.

- Answer every core question and every triggered lens.
- Preserve the strongest credible counterarguments and their disposition.
- Use evidence, a reference implementation, or a bounded experiment for claims that cannot be established by authority and reasoning alone.
- Commit a durable assessment-and-plan record when multiple agents/windows, long execution, or future reconstruction require it.

## Answer status

Every question in scope receives exactly one disposition:

- **Resolved** — supported by authority, observation, or established reasoning.
- **Experiment required** — a bounded experiment has question, method, success/failure evidence, and disposal/promotion rule.
- **Accepted risk** — impact, owner, containment, and revisit trigger are explicit.
- **Blocked** — implementation cannot safely proceed until the missing decision/evidence exists.
- **Not applicable** — one sentence explains why the question cannot affect this boundary.

“Unknown,” “TBD,” or “we will handle it later” is not implementation readiness unless converted into one of these dispositions.

## Core assessment questions

Answer the question, then let the adversary attack the answer. The synthesis—not the first answer—governs the plan.

### A. Outcome, evidence, and authority

1. **What exact outcome must exist when the work is complete?** State behavior or capability, not files to edit.
2. **What evidence shows the problem or opportunity is real now?** Distinguish observation from prediction.
3. **Who or what consumes the result, and what happens if nothing changes?**
4. **What observable evidence will distinguish success from a plausible-looking failure?**
5. **What is explicitly outside this change?** Could an excluded behavior invalidate the result?
6. **Which owner instruction, accepted ADR/specification, standard, or external contract governs the work?**
7. **Which statements are verified facts, source claims, inferences, assumptions, proposals, or unknowns?**
8. **Is the current repository, runtime, data, model, device, and test state trustworthy enough to assess?**

### B. Current system and problem ownership

9. **Where does the relevant behavior and authoritative state live today?**
10. **What is the first boundary at which observed behavior diverges from expected behavior?**
11. **Which component owns the rule, state transition, resource, or lifecycle being changed?**
12. **Which consumers, dependencies, generated artifacts, persisted formats, and operational procedures are affected?**
13. **What behavior must remain unchanged, including failure and pressure behavior?**
14. **What prior art, existing component, standard, or current mechanism could eliminate or materially reshape the proposed work?**

### C. LEGO boundary and internal design

15. **What one coherent domain responsibility does the proposed component/change own?**
16. **Why is this the correct boundary rather than a smaller local repair or a larger combined component?**
17. **What authoritative facts, mutable state, rules, and lifecycle does it own—and what does it explicitly not own?**
18. **What are the smallest meaningful domain-named public ports?**
19. **Which dependencies are explicit and injected, and why is their direction stable?**
20. **Which platform, CUDA, version, format, domain-instance, model-instance, or compatibility details belong behind adapters?**
21. **Can the component be tested and replaced without booting or rewriting unrelated systems?**
22. **Which internal SOLID responsibility boundaries are justified by meaning, ownership, change rate, testing, concurrency, lifetime, or substitution?**
23. **How will the implementation remain composable, predictable, idiomatic, and domain-based without adding ceremony?**

### D. Foundations, scale, resources, and lifecycle

24. **What are the semantic meaning, units, valid ranges, precision, cardinality, growth, and identity rules of every foundational value?**
25. **What are the finite memory, time, queue, concurrency, bandwidth, storage, and output budgets?**
26. **What happens during normal load, high pressure, critical pressure, overflow, partial failure, cancellation, and recovery?**
27. **What are the ownership, lifetime, publication order, synchronization, and stale-reference rules?**
28. **What persistence, version negotiation, compatibility, migration, and rollback behavior is required?**
29. **Does the second intended consumer/domain/hardware profile fit without foundational redesign?**
30. **If the first consumer is removed, does the foundation remain coherent and truthfully named?**
31. **What changes at roughly ten times the current scale, and which limits are deliberate rather than accidental?**
32. **Where could the design silently move cost into callers, adapters, generated code, device memory, synchronization, diagnostics, testing, operations, migration, or recovery?**

### E. Alternatives and adversarial challenge

33. **What is the strongest no-change or minimal-change alternative?**
34. **What is the strongest materially different architecture, including one that rejects the proposed abstraction?**
35. **What would a capable critic say is overengineered, premature, or administratively expensive?**
36. **What would the same critic say is underengineered, unsound, or hiding essential complexity?**
37. **What concrete counterexample breaks the proposed ownership, name, generality, range, lifecycle, or failure model?**
38. **Which assumptions require measurement or an experiment rather than another design argument?**
39. **What evidence would falsify the chosen design, and are we willing to change course if it appears?**
40. **After the adversarial pass, what changed in the design or plan?** If nothing changed, explain why the challenge was still credible.

### F. Executable plan and proof

41. **What is the smallest coherent implementation boundary that leaves the system valid when completed?**
42. **In what order must decisions, specifications, experiments, implementation, migration, and cleanup occur?**
43. **What prerequisite or decision gate blocks each later step?**
44. **Which exact validation maps to each important claim, invariant, failure path, and performance mechanism?**
45. **What is the rollback or safe-stop strategy if a step fails or evidence contradicts the design?**
46. **Which risks remain accepted, who owns them, and what triggers reconsideration?**
47. **What evidence defines completion, and what work is intentionally deferred?**
48. **What is the minimum durable record needed for another developer to execute or review this plan without reconstructing the conversation?**

## Triggered adversarial lenses

Apply these only when material. Their purpose is to discover hidden shape, not to create universal paperwork.

### Universal-framework lens

- Which first-domain facts have leaked into names, schemas, layouts, defaults, or tests?
- Is variation represented by a bounded contract, or by arbitrary callbacks/objects that avoid defining semantics?
- Can unused capabilities be specialized away?
- Is the proposed generality truthful, or is the name broader than the contract?

### GPU / concurrency lens

- Where are the ordering, visibility, progress, and synchronization guarantees stated?
- Could occupancy, divergence, contention, batching, or memory pressure invalidate the algorithmic design?
- Does any active decision secretly depend on host progress?
- What happens on unsupported capabilities, device loss, launch failure, queue saturation, or cancellation?

### Persistent-state / compatibility lens

- Can old and new readers/writers coexist where required?
- Is migration resumable, verifiable, and reversible?
- Could a schema/type change reinterpret old state silently?
- Which compatibility details belong in adapters rather than the current core?

### Security / trust lens

- What untrusted input or executable capability crosses the boundary?
- What is validated, bounded, authenticated, and failed closed?
- Could logs, diagnostics, schemas, native addresses, generated code, or caches expose secrets or unsafe authority?

### Performance lens

- Is the claimed bottleneck measured at the correct synchronization boundary?
- Does the baseline perform the same work and preserve the same quality/resource limits?
- What profiler evidence links the change to the result?
- What regression threshold, workload distribution, and hardware profile matter?

## Adversarial reasoning protocol

Adversarial reasoning is a design tool, not persona theater or a request for pointless conflict.

### 1. Builder case

State the strongest version of the proposed design, including why it fits authority, ownership, resources, and expected growth.

### 2. Steelman the adversary

Attack the premise and boundary, not just implementation details. The adversary should:

- assume the design will be maintained for years and used by a second consumer;
- search for multiple state owners, hidden dependencies, false generality, accidental limits, and undefined failure behavior;
- argue both that the design is too large and that it is too small;
- identify where alleged simplicity exports complexity;
- propose concrete counterexamples and a credible alternative;
- demand evidence for performance, concurrency, compatibility, and resource claims.

Do not use weak objections that the builder can dismiss easily.

### 3. Builder rebuttal and revision

For each material challenge, do one of:

- revise the design;
- support the answer with authority/evidence;
- define a bounded experiment;
- accept and contain a risk;
- block implementation.

Do not “split the difference” automatically. Some attacks are wrong; some invalidate the design.

### 4. Pre-mortem

Assume the plan failed after implementation or after the project grew. Name the most credible causes:

- wrong problem;
- wrong ownership boundary;
- hidden first-consumer assumption;
- memory/performance collapse;
- synchronization/lifetime failure;
- migration/compatibility trap;
- operational or debugging blindness;
- administrative process becoming more expensive than the decisions it protects.

Feed credible causes back into the questions and plan.

### 5. Stop rule

The adversarial pass is complete when every material question has a disposition and another pass produces no new decision-relevant challenge.

Do not continue debating merely to produce more text. Unresolved empirical questions become experiments; unresolved authority or safety questions become blockers.

## Planning rules

A good plan is decision-complete and executable. It is not a speculative file list.

Each coherent step states:

- owned outcome;
- prerequisites and authority;
- affected component/public contract;
- invariants and resource/failure behavior;
- implementation boundary;
- validation and falsifier;
- rollback/safe-stop;
- documentation, registry, and migration effects.

Prefer end-to-end coherent increments that leave the system valid. Avoid many tiny passes that repeatedly reopen the same boundary. Separate discovery from implementation when evidence is missing.

## Administrative restraint

Planning overhead is itself a design cost. Apply these rules:

- One canonical assessment/plan record; link it instead of copying it.
- Reuse authority and evidence by reference rather than restating them.
- Routine work needs no committed plan artifact.
- A single capable agent may perform the adversarial pass; separate sign-off is required only by explicit policy or risk.
- Do not maintain speculative risk registers, status ledgers, per-file checklists, or decision logs that no future decision consumes.
- Do not create one task per file or one component per concept.
- Record only material answers, assumptions, risks, decisions, evidence, and handoff state.
- Compress obvious answers; “Not applicable—because …” is valid.
- Delete or archive stale plans when their authority ends.

The goal is not to prove that a process was followed. The goal is to produce a sound design and a plan another developer can execute and falsify.

## Required output

For substantial or critical work, the assessment/plan record should contain:

1. decision and assessment depth;
2. objective, evidence, authority, and current-state summary;
3. owned boundary and design synthesis;
4. question dispositions, with detail only where material;
5. strongest adversarial challenges and resulting revisions;
6. alternatives and chosen rationale;
7. coherent implementation steps and gates;
8. validation/falsifiers, rollback, risks, and revisit triggers;
9. minimal durable handoff information.

Use [`../templates/assessment-and-plan.template.md`](../templates/assessment-and-plan.template.md). The template may be compressed, but no material question may be silently skipped.
