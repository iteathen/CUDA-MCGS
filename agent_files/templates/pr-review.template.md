# Pull-request review record

Use this only when review evidence must survive beyond the normal GitHub review/comment: independent or high-consequence review, stabilization/release, cross-session continuation, disputed findings, material cleanup debt, material token/context limits, large focus-branch integration, or exact-head owner authorization.

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
- Linked issue/task:
- Governing ADRs/specifications/contracts:
- Intended integration outcome:
- Global invariants and closure criteria:
- Explicit non-goals and closure effect:

## Focus-branch decomposition and integration

- Why focus branching was triggered or not triggered:
- Integration owner and integration spine:
- Branch map / exact branch IDs, types, owners, inputs, outputs, dependencies, and statuses:
- Full-attention sizing evidence:
- Shared contracts and generated sources:
- Parallel branches and non-overlapping write surfaces:
- Branches accepted / integrated / blocked / invalidated / superseded / deferred / removed from scope:
- Shared-contract changes and invalidated evidence:
- Contradictions and dispositions:
- Boundary/end-to-end integration evidence:
- Final parent revision/artifact:

## Token and context discipline review

- Task class and exact token telemetry availability:
- Active context packet and source revisions:
- Validation/integration/cleanup/review/handoff reserve and rationale:
- Context layers loaded and intentionally excluded:
- Targeted retrieval, ranges/diffs/log windows, and batched tool use:
- Large artifacts kept outside prompt context with exact identities:
- Green/yellow/red/emergency state transitions and actions:
- Checkpoints and lossless compaction:
- Repeated reads, retries, reconstruction, or speculative generation:
- Token debt and parent-acceptance effect:
- Evidence that enough reserve remained for final review, cleanup, and handoff:

## Changed-surface and ancestry accounting

- Changed files/renames/deletions accounted for:
- Unexpected ancestry or inherited changes:
- Generated/schema/manifest/dependency/workflow/packaging effects:
- Binary, unavailable, truncated, or excluded surfaces:

## Plan/focus-branch execution fidelity

- Active focus branch / node / owner / exact input revision:
- Branch readiness and minimal context packet:
- Expected versus actual effects:
- Operations, falsifiers, variations, deviations, and branch/node outcome:
- Shared-contract changes, parent-plan revisions, and dependent invalidations:
- Downstream outputs/revisions and partial-state status:

## Semantic and integration review

- Critical semantic units reviewed:
- Affected callers, dependencies, contracts, and state:
- Triggered sanity/interrogation modules:
- Component/boundary reconciliation:
- Representative and critical end-to-end paths:
- Simplest credible counterexamples:

## Cleanup and disposition review

- Protected pre-existing/user/shared/authority/evidence/recovery state:
- Material local files/folders and tracked/generated/build/cache/package state:
- Semantic focus branches and local Git branches/worktrees/stashes/refs/config:
- Remote branches and active dependents:
- PR/issue/review/claim/label/milestone/assignment/closure/dependent state:
- Processes/ports/containers/locks/GPU-device/credential/permission/persistence/external resources:
- Dispositions and dependency-safe ordering:
- Destructive safeguards and local/remote verification:
- Retained authority/evidence/recovery/temporary state with owners and triggers:
- Cleanup debt and parent-acceptance effect:
- Post-merge cleanup required:

## Evidence

- Focused tests and smoke/integration checks:
- Branch-output and cross-branch integration checks:
- CI/workflows for exact head:
- Sanitizer/profiler/benchmark/artifact evidence:
- Token/context discipline evidence:
- Cleanup verification evidence:
- Checks not run and why:
- Claim limits:

## Findings and discussion

| ID/thread | Class | Invariant and mechanism | Consequence | Disposition | Verified on head |
|---|---|---|---|---|---|

- Requested changes/review threads reconciled:
- Invalidated/unintegrated focus branches reconciled:
- Token debt reconciled:
- Cleanup debt reconciled:
- Related findings/issues and duplicate reconciliation:

## Merge recommendation

- Exact head authorized for merge:
- Required independent approval or owner exception:
- Proposed merge method and rationale:
- Required checks/protections/queue:
- Parent/focus-branch closure effect:
- Issue closure effect:
- Local/remote Git branch, worktree, dependent-PR, artifact, permission, and cleanup effect:
- Conditions that invalidate this review:

## Post-merge verification and cleanup

- Integrated target SHA:
- Reviewed-head to integrated-commit mapping:
- Target tree/result verified:
- Parent/focus-branch map points to integrated revision:
- Target checks/deployment/packaging verified:
- Issue and local/remote branch/worktree disposition:
- Dependent work updated:
- Temporary processes, device state, credentials, permissions, artifacts, and external resources disposition:
- Retained state / token debt / cleanup debt / remaining limits:
