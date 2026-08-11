# Contributing to UMCGS

UMCGS is private and documentation-first. Read [`AGENTS.md`](AGENTS.md), [`agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md`](agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md), [`CONTEXT_ROUTING.md`](agent_files/general_foundation/CONTEXT_ROUTING.md), [`PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md), [`ENGINEERING_JUDGMENT.md`](agent_files/general_foundation/ENGINEERING_JUDGMENT.md), [`CONTEXTUAL_DESIGN_WEIGHTING.md`](agent_files/general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md), [`ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md), [`FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md), [`TOKEN_DISCIPLINE.md`](agent_files/general_foundation/TOKEN_DISCIPLINE.md), [`TESTING.md`](agent_files/general_foundation/TESTING.md), [`DEBUGGING.md`](agent_files/general_foundation/DEBUGGING.md), [`PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md), and [`CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md) when applicable.

## Before production implementation

A change needs:

- the mandatory operating kernel and every target-path instruction chain;
- the smallest authority-complete reading set: direct governing authority, required normative references, triggered specialist doctrine, and material producer/consumer/lifecycle/test/cleanup adjacency;
- a proportional assessment whose disposition permits implementation;
- an engineering contract covering outcome, consumers, authority, semantics, bounds, resources, lifecycle/failure/recovery/cleanup, compatibility, non-goals, and completion evidence;
- traceability from material specification obligations to owners, mechanisms, failure consequences, and test capsules;
- explicit resolution or blocking of specification ambiguities, conflicts, gaps, stale meaning, unimplementable obligations, and oracle mismatches;
- hard gates, mission objectives, supporting qualities, and process costs classified for the subsystem;
- credible alternative paths, decisive evidence, selected-path rationale, accepted tradeoffs, confidence, priority P0–P4, and revisit triggers;
- the strongest credible adversarial objection and its resolution, experiment, risk, or blocker;
- a clear product-area/component owner and accepted contract authority;
- a current plan version and dependency-ready node;
- a focus-branch map when work exceeds one focused session or spans semantic owners/contracts/paths/unknowns;
- a token-backpressure strategy preserving the risk-appropriate practice floor and enough capacity for inspection, validation, integration, cleanup, review, recovery, and handoff;
- a test strategy tied to owned invariants, authoritative oracles, case-intent banking, owning capsules, evidence invalidation, escalation tiers, and consolidation;
- expected local/wider effects and downstream output revisions;
- a LEGO boundary with explicit ports, injected dependencies, adapters, lifecycle, and replaceability;
- domain-appropriate foundations and total-system simplicity, including decision review, branch coordination, context reconstruction, tests, operations, and cleanup;
- validation capable of falsifying the selected path and final integrated behavior;
- prior-art/provenance inspection where it can reshape the design.

## Selective specification and agent-file reading

Do not recursively read the whole repository, and do not read only the files named in the request.

For every task:

1. state the task signature—outcome, target paths/symbols/artifacts, operations, owner, claim, and exact revision;
2. read the mandatory kernel;
3. discover every applicable `AGENTS.md` from repository root toward each target path;
4. use registry, indexes, manifests, stable IDs, search, and references to find direct authority;
5. check status, owner, scope, version, revision, and supersession before applying a document;
6. classify plausible documents as kernel, governing, triggered, adjacent-check, evidence-only, not-applicable, superseded/archive, or blocked/missing;
7. read governing and materially triggered documents to semantic closure, including definitions, normative references, conditions, lifecycle/failure/compatibility/security/cleanup, and conformance evidence;
8. scan material producers, consumers, dependencies, generated forms, persistence, lifecycle, tests, packaging, and cleanup;
9. repeat routing when scope or authority changes;
10. refresh the final changed surface before acceptance or review.

Accepted status does not imply universal applicability. Proposals, research, architecture, examples, implementation, tests, plans, PR descriptions, and summaries remain beneath accepted authority.

Routine obvious work needs no standalone document-reading ledger. Use [`agent_files/templates/document-reading.template.yaml`](agent_files/templates/document-reading.template.yaml) only when cross-session, cross-agent, cross-repository, critical, disputed, or review-sensitive work needs durable applicability and invalidation evidence.

## Engineering judgment and value ordering

Specifications are obligations, not themes. Existing code, tests, comments, examples, plans, and previous agent output are evidence—not automatic authority.

Translate each material value into a hard gate, mission objective, supporting quality, or process cost/tie-breaker. Eliminate gate-failing paths before comparing preferences. Weighted scoring cannot compensate for failed authority, safety, semantic correctness, required accuracy/deadline/resource/compatibility, lifecycle, recovery, or evidence bounds.

When no subsystem-specific order exists, use:

```text
authority / legality / explicit ethics
    → unacceptable irreversible harm
    → semantic correctness and hard mission bounds
    → mission-sustaining reliability / compatibility / operability
    → mission quality and performance
    → maintainability / usability / observability / portability
    → delivery speed / token cost / convenience / polish
```

Compare credible alternatives where material, prefer reversible evidence-producing steps under high uncertainty, choose the lowest complete total system, and prioritize P0 containment through P4 polish.

Routine work needs no separate decision record. Use [`agent_files/templates/engineering-decision.template.yaml`](agent_files/templates/engineering-decision.template.yaml) only when a durable decision has a real consumer.

## Universal token backpressure and minimum practice floor

Token backpressure applies from the first retrieval or mutation. Every task establishes exact outcome/authority, relevant current state, smallest coherent scope, risk-appropriate practice floor, decisive verification, reserve, pressure triggers, and optional work to defer.

When pressure rises:

```text
remove duplication
  → reuse authority and evidence
  → batch coherent work and tests
  → narrow context and output
  → defer optional breadth and polish
  → reduce scope or claim
  → split, rebranch, or hand off
  → pause on a blocker
```

Reduce waste before breadth and breadth before rigor. A broad claim may not be preserved by cutting required evidence. Routine work uses an implicit micro-budget; substantial/critical work preserves explicit reserves and split/handoff triggers.

## Testing, focus branches, and cleanup

Capture material test intents immediately, use minimal reproducers, consolidate cases into owning capsules, reuse exact evidence, cluster failures by root cause, and avoid unchanged reassurance runs. A second repair cycle without stronger first-divergence evidence or a changed hypothesis requires replan.

Token pressure may remove duplicate tests and unnecessary tiers. It may not remove authoritative oracles, evidence identity, discovery/skip accounting, required owner capsules, or integration evidence.

Decompose large work into semantic focus branches sized for their complete mechanism, consequences, testing, cleanup, and handoff reserve.

Protect user/pre-existing work, authority, evidence, recovery state, shared resources, protected branches, and active dependents. Every material created/obsolete item receives an intentional verified disposition.

## Organization

UMCGS is organized for large-project scale from inception. Follow [`PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and [`REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

New production components require `README.md`, `component.yaml`, registry entry, dependency declaration, public contract, validation/test ownership, canonical capsule commands, teardown, and disposition. Reading maps, engineering decisions, focus branches, token budgets, and test batches do not create components by themselves.

## Documentation and validation

Substantial Markdown below `docs/` must carry a recognized status and support selective discovery through clear owner, scope, normative references, supersession, indexes, and registry linkage. Update specifications, ADRs, reading/decision/parent/focus-branch/token/test/plan/execution/cleanup state, indexes, and registry entries in the same coherent change.

Run:

```bash
./scripts/verify-docs.sh
```

Token pressure cannot waive objectively triggered validation.

## Pull requests

Before requesting review:

- freeze exact head/base and account for the complete changed surface;
- show the instruction chains, governing documents, triggered doctrine, material adjacency, applicability exclusions, exact revisions, and final authority refresh for substantial work;
- show engineering-contract and specification traceability;
- disclose hard gates, value order, candidate paths, selected path, alternatives rejected, priority, tradeoffs, confidence, and decision debt;
- account for branch statuses/outputs, token practice floor/reserve/backpressure actions, test evidence, execution fidelity, cleanup, and affected contracts;
- disclose authoritative oracles, evidence keys, discovery/skip counts, test intents, failure clusters, tiers, evidence reused/repeated, and checks not run;
- rerun only evidence invalidated by head, base, specification, decision, shared contract, source/test revision, generated artifact, model, environment, fixture, seed, or resource profile;
- disclose budget extension, narrowed claim, deferred work, split/handoff, document-reading/decision/test/token/cleanup debt, issue closure, branch/worktree effects, and merge method.

Every material PR receives author-side complete-diff review. Independent review is triggered by phase, policy, owner instruction, or objective consequence. Merge is a separate expected-head transaction followed by target, authority, focus-branch, test-evidence, dependency, debt, and cleanup verification.

Do not describe shallow reading as selectivity, low raw token use as efficiency, a convenient implementation as the best path, branch-local work as integrated, raw test count as completeness, author-side review as independent approval, or a merge response as verified completion.
