# Validation Policy

**Scope:** Evidence required before a UMCGS change, test result, focus-branch result, plan-node acceptance, cleanup claim, review claim, or integration may be considered complete.

## Principle

Validation must observe the mechanism, subject, test oracle, branch output, integration, and final state being claimed. Compilation, a plausible result, a large test count, green CI, a locally accepted branch, a cleanup command, PR approval, or merge response is not proof for an unobserved boundary.

Tests, oracles, skip policy, protections, focus-branch constraints, token reserves, cleanup safeguards, and gates are never weakened merely to make work pass, look complete, look fast, or merge.

## 1. Organization and documentation

Every durable repository change runs:

```bash
./scripts/verify-docs.sh
```

This verifies required authority, status markers, links, JSON-compatible records, issue forms, project topology, manifests, and governance presence.

## 2. Assessment and planning

Substantial and critical work verifies that:

- outcome, authority, evidence, scope, assumptions, cost of no change, test consequences, and cleanup were assessed before implementation;
- strong opposing explanations/designs were considered;
- valid criticism changed design, branch map, test strategy, sequencing, validation, cleanup, or disposition;
- unknowns have evidence, falsifiers, experiments, accepted risks, blockers, test debt, cleanup debt, or revisit triggers;
- the plan defines owner boundaries, dependencies, exact outputs/consumers, testing, stop conditions, rollback, cleanup, and handoff;
- records are proportional and link authority rather than duplicate it.

## 3. Focus-branch decomposition and integration

For large or complex work verify:

- one canonical parent and integration spine own outcome, authority, invariants, vocabulary, branch map, test map, invalidation, contradictions, cleanup, and closure;
- decomposition is semantic and every leaf fits full attention including testing/validation/cleanup/handoff reserve;
- each leaf has stable ID, one primary owner/output, exact inputs, scope/write authority, output contract, test obligations, acceptance/falsifier, rollback, cleanup, and integration;
- shared-contract or oracle changes are versioned and invalidate dependent branches/evidence;
- parallel work has non-overlapping write and test ownership, compatible parent versions, acyclic dependencies, independent rollback/cleanup, and one integration owner;
- `accepted` is distinct from `integrated`;
- all branches are dispositioned and final cross-branch/end-to-end evidence belongs to one exact revision.

Use `focus-branch.template.yaml` only when durable cross-session/parallel/high-consequence state is needed.

## 4. Token and context discipline

Substantial/critical work verifies:

- current authority and exact revisions are present in the active packet;
- context is layered and large artifacts remain external by exact identity;
- targeted retrieval and changed-hypothesis retry rules were followed;
- enough reserve remained for testing, validation, integration, cleanup, review, recovery, and handoff;
- yellow/red/emergency actions did not reduce rigor;
- checkpoints preserved exact decisions, failures, partial state, test evidence, cleanup, and next action;
- no material token debt remains.

## 5. Testing and repair-loop evidence

A material testing claim must verify all applicable items below.

### Accuracy and oracle

- Each claim has an authoritative oracle.
- The oracle is independent where practical and does not simply duplicate implementation logic.
- Critical tests demonstrate sensitivity to plausible defects when consequence warrants it.
- Exact subject, test, binary/generated/package/model/schema, environment, configuration, fixture/dataset, seed/schedule, resource profile, command, and tier identity are proven.
- Test/runtime state is uncontaminated or contamination is recorded and invalidated.

### Discovery and skip accounting

- Expected, discovered, executed, passed, failed, required-skipped, conditional-skipped, optional-skipped, and not-discovered counts are explicit.
- Zero discovery of required tests fails.
- Required skips fail.
- Conditional skips name the absent capability/condition.
- Optional/informational tests do not support stronger acceptance claims.

### Completeness

Coverage is mapped from owned invariants/contracts and applicable risks:

- normal and boundary behavior;
- invalid/hostile/unknown inputs;
- lifecycle, cancellation, retry, restart, and cleanup;
- partial failure, rollback, recovery, and persistence;
- finite-resource pressure/exhaustion;
- concurrency, ordering, publication, duplication, loss, and stale state;
- compatibility/migration/versioning;
- security/privacy/provenance/permissions;
- producer-consumer and end-to-end integration;
- representative performance and search-quality degradation.

Equivalence partitions, boundaries, pairwise/risk-driven combinations, properties, metamorphic relations, deterministic samples, and synthetic domains may compress coverage. Sampling remains disclosed and cannot support a full claim.

### Test-intent banking and capsule consolidation

- Material test intents are recorded when discovered.
- Provisional reproducers remain temporary unless they are the correct durable owner.
- Related intents are consolidated into canonical owner/contract/conformance/integration capsules before branch acceptance.
- Capsules share expensive immutable setup when safe while preserving stable case IDs, independent inputs/expected results, isolated mutable state, direct single-case execution, and per-case results.
- Consolidation does not hide independent failures or stop after the first unrelated assertion.
- Pending intents are consolidated, proven already covered, superseded by stronger evidence, blocked with authority, or explicitly out of scope.
- Provisional scripts, duplicate tests/fixtures, diagnostics, and logs are removed, archived, or retained intentionally.

### Tier selection

Evidence escalates proportionally:

1. preflight identity/static/discovery checks;
2. focused fast regression/owner-local cases;
3. complete owner/contract capsule;
4. affected integration smoke;
5. deep property/fuzz/sanitizer/race/stress/migration/performance evidence;
6. forensic/release evidence.

Focused fast is the inner loop. Owner capsules run after coherent repair batches, integration smoke after local acceptance, and deep/forensic tiers only on risk, mismatch, stabilization, release, or explicit plan trigger.

### Evidence reuse and no-repeat

- An evidence key defines result identity completely.
- Identical evidence is reused rather than rerun for reassurance.
- Every repeated run has material invalidation, contamination/incompleteness, independent-replication, or statistical reason.
- Failed tests/commands are retried only after changed hypothesis, input, source/test revision, environment, configuration, or transport.
- Duplicate fast validation for one head is avoided; workflow ownership is disjoint where practical and stale runs are cancelled.

### Failure clustering and repair

- One trusted reproduction and baseline are frozen.
- Failures are clustered by first divergence, violated invariant, owner, and signature.
- Primary causes are separated from cascades.
- One root-cause hypothesis and cheapest decisive falsifier are stated.
- The authoritative owner is repaired in a coherent batch.
- The minimal affected cluster reruns first, then the owning capsule once, then required integration smoke once.
- Deep/forensic escalation occurs only when the claim remains unresolved or risk requires it.
- Raw logs remain artifacts; active evidence is bounded to causal intervals and exact locations.

### Test debt

Material pending intents, provisional-only regressions, missing evidence identity, hidden skips, duplicated oracle authority, contaminated state, or unowned test artifacts are test debt. Test debt blocks acceptance unless explicitly authorized, contained, owned, and independently actionable.

Use `test-batch.template.yaml` only when several intents/capsules/failure clusters cross sessions or agents, expensive setup must be coordinated, or completeness/skip/invalidation evidence has a real consumer.

## 6. Governed plan execution

A material node/branch verifies:

- exact parent plan/version, branch/node, owner, environment, and frozen revision;
- dependency outputs/revisions and readiness;
- authority, contracts, test oracles/capsules/evidence keys, generated inputs, and runtime trust;
- expected effects, outputs, acceptance, falsifier, testing, rollback, cleanup, integration, and escalation before mutation;
- coherent owner-sized operations with immediate actual-effect inspection;
- new test intents and invalidation are recorded;
- focused falsification and affected boundary/path/lifecycle/design/testing/cleanup reconciliation occur before continuation;
- material deviations revise parent state and invalidate dependent branches/evidence;
- no invalid partial state, stale output, test debt, token debt, abandoned resource, unowned residue, or false downstream precondition remains.

## 7. Cleanup and artifact disposition

Verify protected state remains intact, every material local/remote/generated/test/diagnostic/sensitive/external item has an intentional disposition, destructive actions use exact safeguards, remote/asynchronous state is read back, retained state has owners/triggers, and cleanup debt does not hide unsafe or incomplete work.

## 8. Sanity checking and independent review

A sanity/audit claim verifies exact frozen target and claim type, complete semantic coverage, full-attention review leaves, risk-justified depth, triggered modules, boundary/end-to-end reconciliation, test evidence/invalidation, findings, cleanup, checks not run, and claim limits. Passing leaves or capsules do not prove integrated coherence.

## 9. Pull-request review and guarded merge

A material PR verifies:

- exact PR/base/head/comparison and review mode;
- complete changed/renamed/deleted/generated/dependency/workflow/package/test/cleanup surface;
- agreement with authority, parent/branch map, execution, test evidence, cleanup, and closure;
- exact evidence keys, discovery/skip counts, failure clusters, test intents consolidated, test tiers, evidence reuse, and remaining test debt;
- current-head checks capable of falsifying the claim;
- discussion, requested changes, blockers, invalidated branches/evidence, test/token/cleanup debt;
- review invalidation after head/base/parent/shared-contract/oracle/test/artifact/environment/fixture changes.

The merge transaction revalidates exact accepted head, target, mergeability, protections/checks/reviews, discussion, issue closure, branch/worktree/dependent state, debt, and conflicts. Post-merge verification proves target SHA/tree, parent/branch/test map, issue/dependent effects, and cleanup.

## 10. Design and component boundaries

Components/contracts verify purpose/bounds, singular ownership, LEGO ports/adapters, justified SOLID/CUPID internals, domain-appropriate ranges, accurate generality, lifecycle/cleanup, test owner/oracles/capsules/invalidation, compatibility/evolution, total-system simplicity, and decisive falsification.

## 11. Schema and generated artifacts

Verify syntax/version negotiation, normalization, invalid/boundary cases, deterministic generation, source/generated correspondence, compatibility, range/alignment/precision/layout, complete cache/evidence identity, and stale-output/test-artifact disposition.

## 12. Component-local and cross-component behavior

Each component owns fast and complete capsules for public contracts, invariants, failure, lifecycle, concurrency, exhaustion, and cleanup. Cross-component suites use public surfaces and verify failure propagation, incompatible versions, resource transfer, cleanup, and exact branch/test integration.

## 13. Reference and conformance

Use deterministic references and synthetic domains to expose transpositions, cycles/history, stochastic/chance behavior, lazy/large/empty action spaces, evaluator modes, backup/reduction, pressure/exhaustion, reroot/persistence, cancellation/teardown, and cleanup. Synthetic cases share a public conformance runner while retaining domain/case identity.

## 14. CUDA/device correctness

Use triggered combinations of deterministic host-reference parity, publication/race checks, sanitizer tools, capability probes, lifetime/leak checks, cancellation/teardown/device-loss/IPC/shared-memory/failure injection, and explicit proof of device closure. Group compatible cases by complete generated-engine/model/architecture/driver/toolkit/resource evidence identity and isolate mutable search state.

## 15. Performance and search quality

Performance claims require exact identity, representative workload, baseline/target, warmup/synchronization/sample/statistics, raw results, profiler mechanism, resource bounds, semantic equivalence, stopping equivalence, and search-quality guardrails. Performance evidence is separate from correctness evidence. Temporary instrumentation/artifacts are dispositioned.

## 16. Publication and release

Before publication/release, inspect final diff/state, run all triggered tiers, update parent/branch/token/test/execution/cleanup authority, complete exact-head review/guarded merge, verify remote target/checks/artifacts/packages/issue/branch/dependent state, and record skipped evidence, retained state, debt, and claim limits.

## Current phase

UMCGS has no accepted production implementation or public release. The mandatory current check is `./scripts/verify-docs.sh`, plus task-specific assessment, focus-branch, token, testing, execution, cleanup, sanity, PR-review, merge, or specialist validation.

Project license selection remains deferred for original private pre-release work; third-party implementation reuse and public distribution still require provenance/license compatibility and donor-artifact disposition.
