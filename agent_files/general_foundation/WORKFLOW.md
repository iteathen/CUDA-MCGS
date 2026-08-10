# Development Workflow

**Scope:** Reusable foundation.

## 1. Orient

Read authority, inspect repository state, identify task class, existing decisions, related work, unrelated local changes, and the current product-area/component organization.

If the request is a sanity check, audit, whole-project review, complete review, incident review, or release-readiness claim, freeze the target and route to [`SANITY_CHECKING.md`](SANITY_CHECKING.md) before deep inspection.

If the request is PR readiness, review, approval, or merge, freeze the PR identity/head and route to [`PULL_REQUEST_REVIEW_AND_MERGE.md`](PULL_REQUEST_REVIEW_AND_MERGE.md) before acting.

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
- expected PR review mode, required gates, and merge/closure effects when material;
- stop conditions and handoff state.

Prefer one combined assessment-and-plan artifact. Do not create duplicate risk, dependency, validation, review, or status ledgers when the same authoritative record can serve them.

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

## 11. Prepare the PR and perform author-side review

Create one coherent PR whose description is an integration summary rather than duplicated authority.

Before marking it ready:

- record the intended target and exact ready head;
- inspect ancestry and the complete changed-file surface;
- verify authority, component ownership, contracts, generated/manifest/schema/dependency effects, and preserved behavior;
- reconcile affected semantic units and integration paths;
- inspect tests/checks for relevance and current-head identity;
- remove temporary/debug/stale material;
- disclose checks not run, limitations, issue closure, branch effects, and proposed merge method;
- perform a final whole-diff pass.

Author-side review may repair the branch. Each head change invalidates affected review evidence.

## 12. Obtain independent review when triggered

When phase, policy, CODEOWNERS/protection, owner instruction, or objective consequence requires independence:

- freeze the exact head;
- ensure the reviewer did not implement or quietly repair it;
- resolve blocking defects and questions through author changes;
- re-review changed/invalidated surfaces and perform a final whole-diff integration pass;
- record approval or a blocker against the exact head.

When independent approval is structurally unavailable and policy permits, use the exact-head repository-owner authorization defined in the PR doctrine. Do not label it independent.

## 13. Execute the guarded merge transaction

Immediately before merge, re-read current PR metadata, exact head, target/base, discussion, required reviews/checks/CODEOWNERS/protection/queue, mergeability, issue closure, branch/dependent work, and conflicting/superseding work.

Abort on any changed or unresolved state. Select the merge method deliberately and use an expected-head guard where supported. Never force-update the target or weaken a gate.

## 14. Verify post-merge integration

Verify the PR is merged; record the resulting target SHA; inspect the intended tree/result; reconcile issue closure, branch deletion/retention, stacked/dependent PRs, target checks/artifacts, status, and handoff state.

A merge response alone is not completion.

## 15. Reconcile authority and history

Update specifications, ADRs, component manifests, registry, indexes, subsystem READMEs, actionable findings, and archived superseded material in the same coherent change. Remove temporary planning/review records once their durable decisions, findings, and execution state have moved to the correct authorities.

## 16. Hand off

Record objective, product area/component, authority, integrated decision, strongest remaining objection, changes, validation, sanity claim/limits when triggered, reviewed head, integrated target SHA, issue/branch effects, actionable findings, repository state, risks, failed approaches, and one coherent next boundary.
