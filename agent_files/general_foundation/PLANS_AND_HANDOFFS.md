# Plans and Handoffs

**Scope:** Reusable foundation.

## Assessment before plan

A plan is executable sequencing for a decision-ready boundary. It is not the place to conceal unresolved ownership, identity, lifecycle, resource, compatibility, security, or architecture decisions.

Substantial and critical work first follows [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md). The assessment may conclude that the work should proceed, become a bounded experiment, require research, be revised, be rejected, or remain blocked.

## Plan quality

A durable plan states:

- the owned outcome and completion evidence;
- product area, component, ownership, and authority;
- the integrated assessment and strongest surviving objection;
- contracts, invariants, ranges, lifecycle, resources, failures, compatibility, and security affected;
- public/dependency effects and organizational placement;
- coherent steps ordered by dependency and uncertainty;
- experiments before irreversible commitments;
- validation paired with the mechanism each step claims;
- required self-sanity or independent-review claim, frozen target, and coverage boundary when material;
- migration, rollback, cleanup, risks, stop conditions, and handoff state.

The plan must be specific enough that implementation does not need to invent foundational design, but it must not pretend to know details that a preceding experiment is meant to decide.

## Proportional administration

One combined assessment-and-plan record is the default. Link accepted authority and existing evidence instead of copying them. Group related questions. Use a short reason for non-applicable modules. Do not create parallel risk registers, dependency ledgers, validation plans, sanity ledgers, daily status files, or duplicate checklists unless they have a distinct consumer, owner, and lifecycle.

Routine mechanical work does not require a standalone plan when the contract, owner, change, and validation are already unambiguous. Routine self-sanity does not require a standalone sanity artifact.

Do not commit conversational scratch plans. Commit plans only when they are durable project state or necessary for another agent. Use [`../templates/assessment-and-plan.template.md`](../templates/assessment-and-plan.template.md) for a durable combined record, [`../templates/sanity-check.template.yaml`](../templates/sanity-check.template.yaml) for a durable review claim when justified, and `next_step.yaml` for the one current coherent boundary.

## Handoffs

A handoff must allow continuation without reconstructing chat history. Include:

- objective, product area, component, and owned boundary;
- authority and integrated decision used;
- strongest remaining objection, assumptions, and revisit triggers;
- exact changes and rationale;
- component manifest/registry/dependency changes;
- validation commands and evidence;
- sanity claim, frozen revision, coverage status, findings, and checks not run when triggered;
- branch, commit, remote publication, and working-tree state;
- open correctness/performance/licensing/design/organization risks;
- failed approaches or contaminated tests;
- one next coherent boundary.

Do not imply unperformed work is running in the background.

For artifact names, use a short project acronym so unique identifiers remain visible on mobile. Include checksums when appropriate.
