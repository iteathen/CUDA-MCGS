# Development Workflow

**Scope:** Reusable foundation.

## 1. Orient

Read authority, inspect repository state, identify task class, existing decisions, related work, unrelated local changes, and the current product-area/component organization.

If the request is a sanity check, audit, whole-project review, complete review, incident review, or release-readiness claim, freeze the target and route to [`SANITY_CHECKING.md`](SANITY_CHECKING.md) before deep inspection.

## 2. Frame the assessment

State the required outcome, authority, evidence, ownership boundary, expected operating domain, constraints, assumptions, completion evidence, and cost of doing nothing. Distinguish observed facts from inferences and proposals.

Use [`ASSESSMENT_AND_PLANNING.md`](ASSESSMENT_AND_PLANNING.md). Routine work may use a brief in-place assessment; substantial and critical work require the proportional durable record described there.

## 3. Inspect prior art and current behavior

When repository behavior, mature work, standards, papers, hardware behavior, or current libraries may change the design, inspect them before committing to an architecture. Record exact revisions, licenses, raw observations, and unresolved gaps.

## 4. Run the adversarial assessment

Answer every applicable assessment question, then attack the answers from the strongest credible opposing position. Challenge both unsound simplification and unnecessary machinery. Resolve each material objection through evidence, redesign, a bounded experiment, explicit assumption, blocker, or rejection.

Do not plan production implementation until the assessment disposition permits it.

## 5. Apply the design hierarchy

For component, contract, dependency, foundational representation, compatibility, or reusable-name work:

1. establish domain truth, authority, purpose, bounds, and contextual concern weighting;
2. define the LEGO owner, state/lifecycle ownership, ports, injected dependencies, adapters, and non-responsibilities;
3. define SOLID internal responsibilities only where meaning, change, testing, concurrency, resource lifetime, or substitution requires separation;
4. define CUPID quality expectations;
5. prove domain-appropriate ranges/capacities and maximum-accurate-generality;
6. compare total-system complexity, including complexity moved elsewhere;
7. identify decisive falsifiers and revisit triggers.

Use `templates/design-review.template.md` when the design is foundational, contested, or difficult to reconstruct.

## 6. Specify unsettled foundations

Persistent layouts, public contracts, synchronization, memory policies, lifecycle, state identity, ABI, cross-component ownership, and dependency direction require an accepted specification or ADR before production implementation.

A disposable experiment must name the question it answers, live under the experiment product area, and state deletion or promotion conditions.

## 7. Plan one coherent change

Build the plan from the integrated assessment, not from the original proposal. Include:

- objective and completion evidence;
- product area/component placement;
- component manifest and registry changes;
- public/internal contract effects;
- dependency graph changes;
- coherent implementation steps ordered by dependency and uncertainty;
- decisive experiments before irreversible structure;
- validation paired with the steps it proves;
- failure, recovery, cancellation, resource pressure, compatibility, migration, rollback, cleanup, and documentation;
- stop conditions and handoff state.

Prefer one combined assessment-and-plan artifact. Do not create duplicate risk, dependency, validation, or status ledgers when the same authoritative record can serve them.

## 8. Implement

Preserve the declared boundary. Avoid unrelated cleanup. Make limits and failures explicit. Do not erase evidence needed for correctness. Do not introduce root-level source, deep imports, generic dumping grounds, or unregistered components.

When implementation exposes a new foundational question, stop the dependent work and revise the assessment rather than silently inventing architecture.

## 9. Validate

Progress from organization/documentation checks through focused checks, integration, failure/exhaustion, architecture-specific checks, benchmarks, and the full relevant suite. Validation must be capable of falsifying the important claims from the assessment.

## 10. Perform proportional self-sanity or independent sanity

For material implementation, interrogate the changed semantic units through [`SEMANTIC_INTERROGATION.md`](SEMANTIC_INTERROGATION.md) and reconcile the actual affected boundaries and paths.

When the request or risk requires a declared full, bounded, sampled, independent, incident, or release claim, use [`SANITY_CHECKING.md`](SANITY_CHECKING.md):

- freeze the exact final revision/artifact;
- account for the declared coverage surface;
- select depth by risk;
- reconcile components, end-to-end paths, lifecycle, contradictions, and findings;
- rerun invalidated coverage after authorized self-sanity repairs;
- keep independent review separate from remediation;
- state checks not run and final claim limits.

Do not force a standalone sanity record for a small reversible self-check. Do not call a sampled review full.

## 11. Reconcile authority and history

Update specifications, ADRs, component manifests, registry, indexes, subsystem READMEs, actionable findings, and archived superseded material in the same coherent change. Remove temporary planning/review records once their durable decisions, findings, and execution state have moved to the correct authorities.

## 12. Publish intentionally

Inspect status and diff, stage only intended files, commit coherently, push through a verified transport, and verify the remote result.

## 13. Hand off

Record objective, product area/component, authority, integrated decision, strongest remaining objection, changes, validation, sanity claim/limits when triggered, actionable findings, repository state, risks, failed approaches, and one coherent next boundary.
