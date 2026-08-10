# Validation Policy

**Scope:** Evidence required before a UMCGS change, focus-branch result, plan-node acceptance, cleanup claim, review claim, or integration may be considered complete.

## Principle

Validation must observe the mechanism, branch output, integration, and state being claimed. A passing unrelated test, successful compilation, plausible output, locally accepted branch, cleanup command, PR approval, or merge response is not evidence of correctness or final disposition for an unobserved boundary.

Tests, protections, focus-branch constraints, cleanup safeguards, and gates are never weakened merely to make a change pass, look complete, look clean, or merge.

## Validation layers

### 1. Organization and documentation

Required for every repository change that touches durable project state:

```bash
./scripts/verify-docs.sh
```

This verifies required authority, status markers, relative links, structured records, issue forms, project topology, component manifest placement, and focus-branch/cleanup governance presence.

### 2. Assessment and planning

Substantial and critical work must verify that:

- outcome, authority, evidence, scope, assumptions, cost of doing nothing, and cleanup consequences were assessed before implementation planning;
- every applicable canonical question group was answered directly or linked to current authority;
- the strongest credible opposing design or explanation was steelmanned;
- valid criticism changed design, scope, branch map, experiment, validation, cleanup, or disposition;
- consequential unknowns have evidence, falsifiers, bounded assumptions, experiments, blockers, cleanup debt, or revisit triggers;
- the plan follows coherent ownership boundaries, orders nodes/branches by dependency and uncertainty, defines exact outputs/downstream consumers, pairs validation with mechanisms, defines cleanup/disposition, and defines stop conditions;
- planning records are proportional and do not duplicate authority or create unowned accounting.

Use `agent_files/templates/assessment-and-plan.template.md` when a durable record is required.

### 3. Focus-branch decomposition and integration

When a task is large or complex, verify that:

- one canonical parent task and integration spine own final outcome, authority, plan version, global invariants, shared vocabulary, dependency graph, invalidation, contradictions, cleanup, and closure;
- the decomposition trigger is attention, semantic ownership, independent unknowns, specialist risk, cross-session work, parallelism, or integration complexity—not merely file count;
- every material leaf has a stable ID, type, status, one primary semantic owner, one primary question/output, exact inputs/revisions, minimal context packet, scope/non-goals, write permissions, preserved global invariants, expected output, downstream consumers, acceptance/falsifier, rollback, cleanup, and integration obligations;
- every leaf fits one focused session without sampling or skimming and keeps mechanism plus material consequence horizon active in context;
- branches are split/combined by semantic ownership, output, validation, rollback, cleanup, and validity transition rather than equal file/line/token/agent counts;
- a semantic focus branch is not confused with a Git branch, issue, PR, component, directory, or document;
- branch switching preserved an exact continuation checkpoint;
- shared-contract changes were routed through the integration spine, versioned, and used to invalidate every dependent branch/evidence set;
- parallel branches used one compatible parent version, non-overlapping owners/write surfaces, frozen or coordinated shared contracts/generated sources, acyclic dependencies, independent acceptance/rollback/cleanup, and one integration owner;
- each branch output has an exact revision, authority/confidence, assumptions/exclusions, evidence, checks not run, claim limits, cleanup state, and downstream effect;
- every planned branch is integrated, blocked, invalidated, superseded, authoritatively deferred, or removed from scope with a reason;
- local `accepted` status is distinguished from parent `integrated` status;
- integration reconciles terminology, ownership, dependencies, units, ranges, precision, identity, versions, memory spaces, lifecycle, ordering, failure, recovery, cleanup, contracts, generated forms, persistence, compatibility, security, provenance, resources, performance, and search quality;
- contradictions and invalidated evidence were resolved or exactly bounded;
- boundary and end-to-end validation proves the parent result against one exact final revision/artifact;
- Git/GitHub objects were created and retained only when isolation, owner, deliverable, risk, dependency, review, transport, rollback, or closure justified them.

Use `agent_files/templates/focus-branch.template.yaml` only when a branch crosses sessions/agents, runs in parallel, carries high consequence, or needs independent continuation/review.

### 4. Governed plan execution

A material plan node/focus branch must verify that:

- exact parent plan/version, focus-branch ID, node ID, owner, Git branch/environment, and frozen revision are known;
- branch/node is explicitly ready and dependencies or authorized waivers are evidenced;
- dependency outputs/revisions match expectations;
- authority, specifications, contracts, schemas, manifests, and tests are current and non-contradictory;
- repository/worktree, generated inputs, model/profile, toolchain, driver/hardware, and test/runtime state are trustworthy where material;
- expected local/wider effects, outputs, acceptance, falsifier, rollback/safe stop, cleanup, integration, and escalation were recorded before mutation;
- newly triggered design, persistence, compatibility, security, concurrency, memory, graph/search, evaluator, performance, generated/JIT/ABI, focus-branch, cleanup, sanity, packaging, or release rules were applied;
- each operation was one coherent ownership-sized validity transition inside the branch write boundary;
- actual effects were inspected immediately and compared with expectations;
- focused falsification and affected component/contract/boundary/path/lifecycle/design/cleanup/integration reconciliation occurred before continuation;
- variations/deviations were classified, with material changes revising the parent plan and invalidating affected branches;
- coordinated/irreversible work defined valid pre/post states, intermediate visibility, publication, rollback/recovery, cleanup, and acceptance;
- no invalid partial state, competing authority, stale generated form, abandoned resource, unowned residue, half-active branch, or false downstream precondition remains;
- every acceptance criterion has exact evidence and downstream consumers receive exact outputs/revisions;
- records are proportional and do not duplicate issue, parent plan, branch map, execution, cleanup, PR, and handoff history.

Use `agent_files/templates/plan-execution.template.yaml` only when durable operation state is justified.

### 5. Cleanup and artifact disposition

A material cleanup/disposition claim must verify that:

- task-created, temporarily modified, superseded, partial, generated, diagnostic, local, remote, external, sensitive, and coordination state was inventoried where triggered;
- protected user/pre-existing/uncommitted/shared/authority/evidence/provenance/recovery state remains intact;
- every material item has one explicit disposition;
- cleanup order preserves focus/Git branch dependencies, evidence, rollback, recovery, tests, releases, PRs, and downstream consumers;
- destructive operations used exact targets, narrow selectors, preview/dry-run where available, authority, recovery safeguards, and immediate actual-effect inspection;
- repository, local files, generated/build/test/cache/package output, branches/worktrees/stashes/Git operations, remote refs/PRs/issues/reviews/claims, workflow/release artifacts, processes/ports/containers/locks/leases, GPU/device state, credentials/permissions, persistence/backups, research/evidence, and external/paid resources were reconciled where applicable;
- historically useful stale material was archived with provenance rather than silently deleted;
- possible secret exposure caused revocation/rotation and bounded incident handling;
- local and remote final state was verified through the owning system;
- retained temporary state and cleanup debt have owners, reasons, protection, objective triggers, and next actions;
- cleanup debt does not hide unmet acceptance or unsafe residue;
- canonical parent/focus-branch/issue/plan/execution/PR/status/handoff records describe retained state accurately.

Use `agent_files/templates/cleanup-disposition.template.yaml` only when durable lifecycle evidence is justified.

### 6. Sanity checking and independent review

When a sanity, audit, complete-review, incident, release-readiness, or system-wide claim is made, verify that:

- exact revision/artifact and `full`, `bounded`, or `sampled` claim are explicit;
- included/excluded surfaces, owners, authority, risks, access limits, environment, external state, and review mode are declared;
- a complete semantic coverage map exists before deep inspection;
- review branches are stable semantic focus branches by owner, boundary, path, cross-cutting concern, or artifact rather than file count;
- every review leaf has one primary owner/coherent path, complete semantic-unit inventory, and full-attention sizing rationale;
- every included surface is accounted for at risk-justified depth;
- every material semantic unit answers the mandatory core and objectively triggered modules;
- component/producer-consumer boundaries, end-to-end paths, parent/focus-branch outputs, lifecycle, design, cleanup, contradictions, and invalidated evidence are reconciled;
- tools are mechanism-relevant evidence rather than semantic substitutes;
- passing leaves are not treated as integrated proof;
- violations/high-risk uncertainties have exact mechanism, consequence, owner, disposition, and revalidation;
- independent review did not quietly repair findings;
- changed revisions/contracts invalidate and rerun affected branch/boundary/path/cleanup evidence;
- checks not run, missing access/evidence, review-created state, cleanup, and claim limits are explicit;
- final claim is no broader than reconciled evidence.

### 7. Pull-request review and guarded merge

Every material PR must verify:

- PR identity, target, exact reviewed head, relevant base/merge base, comparison, and review mode;
- complete changed surface, ancestry, generated/manifest/schema/dependency/workflow/packaging/cleanup effects;
- agreement with owner instruction, ADRs/specifications, assessment, focus-branch map, governed execution, ownership, contracts, cleanup, and closure;
- every represented focus branch is accounted for by status and exact output revision;
- semantic review and reconciliation cover callers, dependencies, state, resources, lifecycle, compatibility, cleanup, and end-to-end paths;
- discussion, requested changes, threads, bot findings, linked blockers, invalidated/unintegrated branches, and cleanup debt are reconciled;
- focused tests/checks, branch integration, and cleanup evidence belong to exact head;
- review independence is labeled honestly;
- head, material base, parent-plan, or shared-contract changes invalidate/review affected evidence;
- no unresolved blocker, question, required gate, unintegrated material branch, unsafe residue, or unknown closure effect remains.

The merge transaction revalidates current head, target, ancestry/mergeability, required reviews/checks/protection/queue, discussion, issue closure, semantic/Git branch/worktree disposition, stacked/dependent work, cleanup debt, and conflicts. Use expected-head protection and never bypass target history/protection.

Post-merge verification records target SHA, proves tree/result and parent branch-map integration, reconciles issue/branch/worktree/dependent effects, completes or tracks cleanup, and states uncompleted checks.

### 8. Design and component boundaries

A component, public contract, dependency, foundational representation, compatibility boundary, or reusable name must verify:

- governing purpose, bounds, concern weighting, lifecycle, and disposition;
- singular state/lifecycle ownership and non-responsibilities;
- LEGO ports, injected dependencies, adapters, and replacement/test boundary;
- justified SOLID responsibilities and CUPID quality;
- domain-appropriate ranges, precision, capacity, and exhaustion;
- accurate-generality tests;
- total-system simplicity including focus-branch coordination and cleanup;
- compatibility/evolution, archive/supersession, and decisive falsification.

### 9. Schema and generated artifacts

Verify schema syntax/versioning, normalization, invalid/boundary cases, deterministic generation, source/generated correspondence, compatibility, range/alignment/precision/layout, cache identity, and stale-output disposition.

### 10. Component-local behavior

Each component owns focused tests for public contracts, internal invariants, failure, lifecycle, concurrency, resource exhaustion, and cleanup. The manifest lists commands.

### 11. Cross-component integration

Integration tests use public surfaces and declared dependency direction, including failure propagation, incompatible versions, resource transfer, cleanup, and exact focus-branch output integration where relevant.

### 12. Reference and conformance

Complex search behavior requires deterministic reference/synthetic cases exposing transpositions, cycles/history, chance, lazy/large actions, evaluator modes, backup/reduction, pressure/exhaustion, reroot/persistence, termination/cancellation/teardown, and retained-state cleanup.

### 13. CUDA/device correctness

Use relevant sanitizer, publication/race, deterministic, host-reference, capability, lifetime/leak, cancellation/teardown/device-loss/IPC/shared-memory/failure tests. Verify contexts, modules, allocations, queues, event/stream/graph state, and diagnostics are released or deliberately retained, and prove active search does not depend on host-produced intermediate decisions.

### 14. Performance

Performance claims require exact commit/generated-engine identity, hardware/software/model/resource profile, workload, warmup/synchronization/sample/statistics, raw results, quality/correctness guardrails, fair baseline, profiler mechanism evidence, and disposition of temporary instrumentation/artifacts/resources.

A faster result that changes semantics, quality, resource limits, stopping behavior, or cleanup is not automatically an improvement.

### 15. Publication and release

Before claiming publication/release:

- inspect final diff and repository state;
- stage only intended scope;
- run all applicable validation/cleanup layers;
- update parent/focus-branch/plan/execution/cleanup state, manifests, registry, indexes, authority, findings, and archive;
- complete exact-head review/guarded merge when integrating;
- verify remote target, checks, artifacts, issue closure, semantic/Git branch/worktree disposition, permissions, packages/releases, external resources, and dependents;
- record failures, skipped validation, retained state, cleanup debt, and claim limits.

## Current phase

UMCGS has no accepted production implementation or public release yet. The mandatory current check is `./scripts/verify-docs.sh`, plus task-specific research, specification, assessment, focus-branch, execution, cleanup, sanity, PR-review, merge, or independent-review validation.

Project license selection is deferred and does not block original private pre-release work. It remains a separate gate before public distribution and before implementation-level third-party reuse requiring compatibility analysis and donor-artifact disposition.
