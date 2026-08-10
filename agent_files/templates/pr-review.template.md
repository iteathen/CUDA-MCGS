# Pull-request review record

Use this only when review evidence must survive beyond the normal GitHub review/comment: independent or high-consequence review, stabilization/release, cross-session continuation, contested engineering decisions, disputed findings, material decision/test/token/cleanup debt, large focus-branch integration, or exact-head owner authorization.

## Review identity

- Repository / PR:
- Intended base branch:
- Reviewed base or merge-base SHA:
- Reviewed head SHA:
- Comparison range:
- Review mode: `author-side | independent | owner exact-head authorization`
- Project phase / consequence triggers:
- Result: `approved | author-side ready | changes requested | questions | blocked | rejected`

## Authority and intended outcome

- Parent task / plan version:
- Engineering-decision record/version:
- Linked issue/task:
- Governing owner instruction, ADRs, specifications, contracts, and exact revisions:
- Intended integration outcome and consumers:
- Global invariants and closure criteria:
- Explicit non-goals and closure effect:

## Engineering contract and specification alignment

- Outcome, operating envelope, finite bounds, lifecycle/failure/recovery/cleanup, compatibility, and completion evidence:
- Material obligation map and derived requirements:
- Obligation owners, mechanisms, failure consequences, and evidence/test capsules:
- Ambiguities, conflicts, gaps, stale/unimplementable authority, and oracle mismatches:
- Specification/decision changes and invalidated branches/artifacts/tests/review evidence:
- Remaining specification or decision debt:

## Engineering judgment, value ordering, and priority

- Hard gates and exact thresholds/prohibited states:
- Mission objectives and metrics/ordinal rules:
- Supporting qualities:
- Process costs/tie-breakers:
- Context-specific value ordering and deviations from fallback:
- Candidate paths and gate results:
- Pareto-dominated/rejected paths and reasons:
- Decisive evidence, uncertainty, confidence, reversibility, and option value:
- False-tradeoff separation alternatives considered:
- Selected path and why it wins:
- Accepted tradeoffs, accepting owner, detection/containment, rollback/revisit:
- Priority `P0 | P1 | P2 | P3 | P4` and dependency/consequence/information/cost-of-delay basis:

## Focus-branch decomposition and integration

- Why focus branching was triggered or not triggered:
- Integration owner and integration spine:
- Branch map / exact branch IDs, owners, inputs, outputs, dependencies, and statuses:
- Full-attention sizing evidence:
- Shared contracts, decisions, value order, oracles, and generated sources:
- Parallel branches and non-overlapping write/test surfaces:
- Branches accepted / integrated / blocked / invalidated / superseded / deferred / removed from scope:
- Contradictions and dispositions:
- Boundary/end-to-end integration evidence:
- Final parent revision/artifact:

## Token and context discipline review

- Task class and telemetry availability:
- Active context packet and source revisions:
- Testing/validation/integration/cleanup/review/handoff reserve:
- Loaded/excluded context and targeted retrieval/tool use:
- Large artifacts kept external by exact identity:
- Context-band transitions, checkpoints, and compaction:
- Repeated reads/retries/reconstruction:
- Token debt and parent-acceptance effect:

## Testing and repair-loop review

- Claims/invariants and engineering-contract-aligned authoritative oracles:
- Oracle independence/sensitivity:
- Exact evidence keys:
- Discovery/execution/pass/fail/skip accounting:
- Coverage map and claim limits:
- Test intents, owning capsules, and consolidation:
- Shared setup and mutable-state isolation:
- Tiers and escalation triggers:
- Failure clusters, first divergence, root-cause repair, and changed retry hypotheses:
- Evidence reused and repeated-run reasons:
- Provisional/duplicate test state disposition:
- Remaining test debt:

## Changed-surface and ancestry accounting

- Changed files/renames/deletions accounted for:
- Unexpected ancestry or inherited changes:
- Generated/schema/manifest/dependency/workflow/packaging/decision/test effects:
- Binary, unavailable, truncated, or excluded surfaces:

## Plan/focus-branch execution fidelity

- Branch/node/owner/exact input revision:
- Readiness and minimal context:
- Obligation/decision and selected path implemented:
- Expected versus actual effects and preserved value ordering:
- Operations, falsifiers, variations, deviations, and outcome:
- Specification/decision/oracle changes, parent revisions, and dependent invalidations:
- Downstream outputs/revisions and partial-state status:

## Semantic and integration review

- Critical semantic units reviewed:
- Affected callers, dependencies, contracts, and state:
- Triggered specialist modules:
- Component/boundary reconciliation:
- Representative and critical end-to-end paths:
- Strongest credible counterexamples:

## Cleanup and disposition review

- Protected pre-existing/user/shared/authority/evidence/recovery state:
- Decision records, local files, tracked/generated/build/cache/package state:
- Provisional tests, fixtures, logs, instrumentation, and test artifacts:
- Semantic/Git branches, worktrees, stashes, refs, and configuration:
- Remote PR/issue/review/claim/dependent state:
- Processes/ports/containers/locks/GPU-device/credentials/persistence/external resources:
- Dispositions, safeguards, verification, retained state, and cleanup debt:
- Post-merge cleanup required:

## Evidence

- Focused, owner/contract, integration-smoke, and triggered deep evidence:
- Branch-output and cross-branch integration checks:
- CI/workflows for exact head and duplicate/stale-run accounting:
- Engineering-decision/specification evidence:
- Token/context discipline evidence:
- Cleanup verification evidence:
- Checks not run and why:
- Claim limits:

## Findings and discussion

| ID/thread | Class | Obligation/invariant and mechanism | Consequence | Disposition | Verified on head |
|---|---|---|---|---|---|

- Requested changes/review threads reconciled:
- Invalidated/unintegrated decisions and focus branches reconciled:
- Decision debt reconciled:
- Test debt reconciled:
- Token debt reconciled:
- Cleanup debt reconciled:
- Related findings/issues and duplicate reconciliation:

## Merge recommendation

- Exact head authorized for merge:
- Required independent approval or owner exception:
- Proposed merge method and rationale:
- Required checks/protections/queue:
- Engineering-decision/parent/focus-branch/test closure effect:
- Issue closure effect:
- Git branch/worktree/dependent/artifact/permission/cleanup effect:
- Conditions invalidating this review:

## Post-merge verification and cleanup

- Integrated target SHA and reviewed-head mapping:
- Target tree/result verified:
- Engineering-decision/parent/focus-branch/test maps point to integrated revision:
- Target checks/deployment/packaging verified:
- Issue/branch/worktree/dependent state:
- Temporary decision/test/diagnostic/process/device/credential/artifact/external-resource disposition:
- Retained state / decision debt / test debt / token debt / cleanup debt / remaining limits:
