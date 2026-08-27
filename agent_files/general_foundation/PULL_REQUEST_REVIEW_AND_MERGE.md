# Pull-Request Review and Guarded Merge

**Scope:** Pull-request readiness, author-side review, independent review, findings, checks, exact-head approval, merge selection, guarded integration, and post-merge verification.

## Core rule

A pull request is a proposed integration, not proof that the change is correct.

Review and merge are separate transactions:

1. **Review** decides whether one exact PR head is acceptable against its authority, intended base, changed surface, affected system behavior, and evidence.
2. **Merge** revalidates that the exact accepted head is still the head, all current gates are satisfied, the target and closure effects are correct, and the selected integration method is deliberate.
3. **Post-merge verification** proves that the target branch contains the intended result and that no unexpected state or closure occurred.

Passing CI does not override a demonstrated defect. A stale approval does not authorize a changed head. A merged button response does not prove the target contains the intended result.

## Current CUDA-MCGS phase

CUDA-MCGS is a public pre-release repository in framework-definition/development. Ordinary forks, pull requests, configured CODEOWNERS/branch-protection enforcement, and public GitHub-hosted CI are the collaboration posture; public visibility does not constitute a CUDA-MCGS product release or stable compatibility promise.

```text
fork/*, feature/*, or agent/* -> pull request -> main
```

`main` is the integration trunk. Short-lived branches should merge frequently enough that incompatible assumptions surface early. One coherent PR normally uses squash merge. The intended public posture is protected `main`, required current-head checks, and explicit owner review for foundational authority.

Ordinary low-consequence development changes may merge after complete author-side review when repository policy and configured protections permit. Independent review is still required when objective risk, repository protection, CODEOWNERS, or owner instruction triggers it.

Release-candidate and product-release review requirements are not imposed on every development PR. Private or public repository visibility never waives a safeguard triggered by security, persistence, concurrency, destructive behavior, public contracts, provenance, licensing, recovery, publication, or broad blast radius.

## Review roles

### Author-side review

The implementation owner reviews the complete proposed integration before marking it ready.

Author-side review may repair the branch. It is not independent approval and must not be represented as such.

### Independent review

An independent reviewer did not implement or quietly repair the reviewed head. The reviewer may inspect, test, and comment, but remediation occurs in a separate author/remediation step followed by re-review.

### Repository-owner exact-head authorization

When independent GitHub approval is structurally unavailable in a single-maintainer repository, the repository owner may authorize one exact head after all otherwise applicable review and evidence have passed.

The authorization must state:

- that independent approval is unavailable for this repository/change;
- the exact PR head SHA;
- why the exception is allowed at the current phase and risk;
- decisive checks and checks not run;
- known claim limits;
- confirmation that no blocking finding remains;
- explicit authorization to merge that head.

This is not independent review. It cannot bypass branch protection, CODEOWNERS, required checks, security/provenance evidence, migration/recovery evidence, or another substantive gate. Any head change invalidates it.

## When independent review is required

Independent review is required when any applies:

- stabilization, release candidate, public product release, incident response, or a declared full-system audit;
- branch protection, CODEOWNERS, repository policy, or owner instruction requires it;
- persisted meaning, schema compatibility, migration, rollback, or difficult recovery changes;
- security, credentials, privacy, hostile input, executable schemas, native capabilities, or trust boundaries;
- third-party implementation reuse, provenance, licensing, or distribution rights;
- destructive, irreversible, or difficult-to-reverse operations;
- difficult concurrency, publication, cancellation, reclamation, or recovery;
- public compatibility/API/ABI contracts;
- broad or opaque changes with unusually high blast radius;
- a critical sanity finding requires independent closure evidence.

A large diff alone is not the rule. A small change to a critical invariant may require independent review.

## PR author readiness

Before requesting review, the author must:

1. identify the intended base branch and exact ready-for-review head SHA;
2. confirm the PR is one coherent integration or split it by ownership/closure boundary;
3. inspect the complete changed-file surface, renames, deletions, generated forms, lockfiles, manifests, schemas, tests, documentation, and packaging effects;
4. inspect commit ancestry for unrelated or accidental commits;
5. reconcile the PR description with the actual diff and current authority;
6. run focused owner/contract validation and the cheapest relevant integration or smoke checks;
7. perform proportional self-sanity on changed semantic units and affected boundaries;
8. remove temporary instrumentation, debug bypasses, abandoned files, stale claims, and accidental generated output;
9. state checks not run, limitations, known risks, issue/closure effects, and proposed merge method;
10. stop branch mutation while a frozen-head review is active, or clearly invalidate the review before pushing new changes.

A PR is not ready merely because the code compiles or a workflow is green.

## Frozen-head review record

Every material review decision is tied to:

- repository and PR number;
- intended base branch and base SHA/merge base used for the review;
- exact reviewed head SHA;
- comparison range;
- review mode: author-side, independent, or owner exact-head authorization;
- intended outcome and governing authority;
- changed-surface accounting;
- decisive evidence and checks not run;
- findings and unresolved questions;
- result and claim limits.

Routine reviews may record this in a GitHub review/comment. Use [`../templates/pr-review.template.md`](../templates/pr-review.template.md) only when risk, independence, cross-session continuation, or release/stabilization makes a durable record useful.

## Review procedure

### 1. Verify PR identity and state

Confirm:

- PR number, title, author, open/closed state, and draft status;
- intended base and current head refs/SHAs;
- linked issue or authoritative task when one exists;
- requested outcome and closure criteria;
- labels, milestone, dependencies, stacked branches, or superseding work when material;
- repository phase and review independence required by risk/policy.

Do not review from a copied diff whose origin or head is uncertain.

### 2. Account for ancestry and the complete changed surface

Inspect the actual PR patch and changed-file inventory—not only the PR description or the latest commit.

Account for:

- every changed, added, deleted, renamed, or mode-changed file;
- unexpected commits or changes inherited through branch ancestry;
- generated artifacts and their canonical sources;
- schema, manifest, lockfile, dependency, workflow, packaging, installer, and documentation changes;
- files omitted from the diff but affected through public contracts, generation, configuration, or runtime behavior;
- binary, large, truncated, or unavailable changes that limit review.

A file list is coverage accounting, not semantic review. Group low-risk files by common owner/contract where appropriate, but do not silently sample a claimed complete PR review.

### 3. Reconstruct authority and intent

Verify that the change agrees with:

- explicit owner instruction;
- accepted ADRs and specifications;
- component manifests and registry ownership;
- the canonical assessment/plan when one was required;
- compatibility, migration, resource, security, and release policies triggered by the change.

Treat the PR body, comments, and implementation notes as claims to verify, not governing truth.

### 4. Review semantic units and affected context

Review changed code in enough surrounding context to understand callers, state, contracts, dependencies, lifecycle, and terminal behavior.

For each material semantic unit, use the core questions in [`SEMANTIC_INTERROGATION.md`](SEMANTIC_INTERROGATION.md):

- purpose and authority;
- owner and boundary;
- inputs, outputs, state, resources, and effects;
- caller and dependency assumptions;
- failure, pressure, cancellation, and terminal behavior;
- simplest credible counterexample;
- cheapest decisive evidence;
- wider impact.

Trigger deeper GPU, concurrency, memory, graph/search, persistence, compatibility, security, generated/JIT/ABI, destructive-operation, identity, or performance modules only when material.

Review the implementation that exists. Do not substitute a preferred redesign unless the current implementation violates an invariant or cannot meet the contract.

### 5. Reconcile affected boundaries and paths

Trace the changed behavior across relevant producers and consumers:

- ownership and authoritative writers;
- public/internal boundaries and dependency direction;
- units, ranges, precision, identity, version, ABI, and memory-space meaning;
- serialization, generation, JIT/cache identity, and compatibility adapters;
- resource acquisition, publication, cancellation, saturation, cleanup, and recovery;
- representative and critical end-to-end paths;
- host/device synchronization and device-closure assumptions;
- search semantics and result-quality equivalence where applicable.

A collection of locally reasonable changes can still be an invalid integration.

### 6. Evaluate tests and other evidence

Ask whether the evidence can falsify the claimed behavior.

Verify:

- tests observe the changed mechanism and expected failure modes;
- a regression test would fail against the faulty behavior where practical;
- test or benchmark thresholds, inputs, budgets, and oracles were not weakened to make the change pass;
- the baseline and proposed behavior perform equivalent work when performance is claimed;
- CI and workflow results belong to the current head;
- checks not run are relevant and disclosed;
- infrastructure failures are distinguished from repository failures with evidence.

More tests are not automatically better. Missing irrelevant tests are not findings.

### 7. Inspect discussion and review state

Read all current:

- issue/PR conversation comments;
- review submissions and requested changes;
- inline review comments and unresolved threads;
- bot findings and check annotations;
- linked findings/issues that can block integration.

A thread is complete only when its concern is fixed and verified, explicitly accepted as non-blocking by the appropriate reviewer/owner, or transferred to a durable follow-up that does not invalidate the PR outcome.

The author must not silently resolve a reviewer's blocking concern without evidence. Outdated comments still need disposition.

### 8. Perform a final whole-diff integration pass

After leaf review and fixes, inspect the entire final diff again for:

- contradictions between changed files;
- stale documentation or generated forms;
- accidental scope expansion;
- missing migration/cleanup;
- duplicated ownership or compatibility logic;
- tests that validate an obsolete intermediate design;
- unresolved blocking findings;
- changes made after earlier review evidence.

## Finding classes

Classify comments precisely:

- **Blocking defect** — violates authority/invariant, creates unacceptable risk, or lacks required evidence; must be resolved before merge.
- **Question / potential blocker** — missing context or evidence may reveal a blocker; resolve before approval.
- **Non-blocking improvement** — worthwhile but not required for this PR's correctness or closure; may be accepted, deferred, or filed separately.
- **Informational / optional** — context, praise, or preference with no integration requirement.

A useful blocking finding states:

- exact reviewed head and location;
- governing invariant;
- actual mechanism;
- consequence;
- decisive evidence or reproduction;
- smallest acceptable outcome.

Do not use blocking review to demand unrelated cleanup, personal style, speculative abstractions, or future work outside the PR's ownership and closure boundary.

## Review results

A review concludes as one of:

- **Approved exact head** — independent approval when the reviewer is independent and policy permits approval.
- **Author-side ready exact head** — complete non-independent review; not an approval claim.
- **Changes requested** — one or more blockers remain.
- **Commented / questions remain** — no approval until questions are resolved.
- **Blocked by evidence or infrastructure** — the review cannot honestly conclude; missing evidence and next action are explicit.
- **Rejected/superseded** — the PR should close without merge or be replaced by another integration.

State the exact head SHA in any ready, approval, or owner-authorization record.

## Review invalidation

### Head changes

Any head change invalidates approval/authorization for the changed surface and any dependent integration evidence.

Re-review:

- the new diff since the reviewed head;
- all findings affected by the change;
- invalidated tests/checks/evidence;
- a final whole-PR integration pass.

Do not mechanically reapprove because the latest patch “looks small.”

### Base changes

If the target branch advances, determine whether the merge base, effective diff, generated output, dependency versions, or integration behavior changed.

A harmless unrelated base advance may require only mergeability/status revalidation. A material base change requires affected integration review and tests. Record the reviewed base/merge base when the distinction matters.

### Force pushes and history rewrites

A rewritten head is a new review subject even when the displayed content appears similar. Re-establish exact ancestry and comparison.

## Required checks and infrastructure failures

Immediately before approval and merge, use results for the current head only.

- Required pending or failed checks block merge.
- A passing irrelevant workflow does not satisfy a missing relevant check.
- Retry suspected infrastructure failures and inspect steps/logs/artifacts when available.
- If a non-required check fails before executing repository steps and no logs exist, record the limitation; use equivalent local evidence only when risk/policy permits.
- An owner exception for an optional infrastructure failure must be exact-head, explicit, and must not bypass branch protection or a substantive required check.
- Never disable, rewrite, or weaken a check merely to finish the merge.

## Merge-readiness transaction

Merge is revalidated immediately before integration. Confirm:

1. the PR is open, non-draft, and targets the intended branch;
2. the current head exactly equals the approved/ready/authorized head;
3. the current base, merge base, ancestry, and mergeability are understood;
4. required reviews, CODEOWNERS, branch protection, merge queue, and checks are satisfied;
5. no unresolved blocking review thread, finding, issue, or requested change remains;
6. the PR still represents one coherent result and no superseding/conflicting work invalidates it;
7. issue-closing keywords are correct: merge alone truly satisfies the issue's closure criteria;
8. branch deletion will not break stacked PRs, recovery, audit, release, or dependent work;
9. the chosen merge method preserves exactly the history needed;
10. an expected-head guard will be used where supported.

If any check fails or the head changes, abort the merge transaction and return to review. Do not “finish quickly” by force-updating the target or bypassing protections.

## Merge-method selection

### Squash merge — default for one coherent result

Use when the PR implements one owned outcome and intermediate commits are WIP, correction, or local reasoning history with no durable value.

The squash title/message should describe the integrated result, not the sequence of edits.

### Rebase merge — preserve meaningful linear commits

Use only when each commit is independently coherent, reviewed, and worth retaining; linear history is desired; and rewritten commit SHAs do not violate provenance, signatures, dependencies, or audit needs.

Do not use rebase merely to avoid writing a good squash message.

### Merge commit — preserve branch topology or multiple durable commits

Use when branch ancestry, a coordinated integration branch, multiple independently meaningful reviewed commits, or another explicit historical need must remain visible.

A large PR does not automatically deserve a merge commit.

### Prohibited methods

- force-pushing or rewriting the protected target to simulate integration;
- direct target commits that bypass required PR review;
- merging a different head from the reviewed one;
- selecting a method only because another method failed;
- deleting a branch before dependent work and recovery needs are understood.

## Guarded merge execution

1. Record the accepted head SHA and intended base.
2. Fetch/re-read current PR metadata, review state, discussion, mergeability, and current-head checks.
3. Abort if the head, target, material base state, findings, or gates differ from the accepted state.
4. Invoke the selected merge method with the expected-head guard where supported.
5. Record the resulting target/merge commit SHA and head-to-target mapping.
6. Do not claim completion until post-merge verification passes.

## Post-merge verification

Verify:

- the PR reports merged rather than merely closed;
- the target branch now resolves to the expected integrated result;
- the resulting target SHA is known;
- the intended files/contracts are present and no unexpected commit or tree state entered;
- required target-branch checks or deployment/packaging verification run when applicable;
- issue closure occurred only when its full criteria were met;
- dependent branches/PRs are rebased or retargeted as needed;
- the source branch is deleted only when safe, or retained with an owner/removal trigger;
- status, registry, next-step, release, and handoff records use the integrated revision;
- the user/owner is told the exact merge result and any checks not completed.

A squash merge produces a new target commit SHA. Record both the reviewed head and integrated commit.

## If a bad merge is discovered

Do not rewrite shared `main` to erase the event.

- preserve the evidence and exact integrated SHA;
- assess blast radius and whether work must stop;
- open a revert PR or coherent corrective PR;
- use the same review and guarded-merge discipline;
- update affected issues, dependent branches, artifacts, and operators;
- perform incident or broader sanity review when consequence triggers it.

## Administrative restraint

- Routine author-side review belongs in the PR; no separate review file is required.
- One durable review record is justified for independent, high-consequence, cross-session, release/stabilization, or disputed review.
- The issue owns durable work outcome/current state; the PR owns the proposed integration; ADRs/specs own authority; a review record owns only unique review evidence.
- Link tests, sanity records, findings, and authority rather than copying them.
- Do not maintain a second manual changed-file ledger when GitHub provides a reliable inventory; record only reconciliation GitHub cannot express.
- Do not create one review comment per file when one root-cause finding owns several manifestations.
- Resolve the PR when additional review cannot change a material integration decision; do not continue review theater.

## Completion

PR review and merge are complete when:

- one exact head was reviewed at phase/risk-appropriate depth;
- the complete changed surface and affected integration were accounted for;
- blockers and questions were resolved or the PR was rejected/blocked;
- required checks/reviews/protections were satisfied without weakening them;
- the exact accepted head was merged through a deliberate guarded transaction;
- the target result and resulting SHA were verified;
- issue, branch, dependent work, findings, and handoff effects are accurate;
- checks not run and remaining limits are explicit.
