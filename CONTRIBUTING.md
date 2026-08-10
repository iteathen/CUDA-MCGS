# Contributing to UMCGS

UMCGS is private and documentation-first. Read [`AGENTS.md`](AGENTS.md), [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md), [`ENGINEERING_JUDGMENT.md`](agent_files/general_foundation/ENGINEERING_JUDGMENT.md), [`CONTEXTUAL_DESIGN_WEIGHTING.md`](agent_files/general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md), [`ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md), [`FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md), [`TOKEN_DISCIPLINE.md`](agent_files/general_foundation/TOKEN_DISCIPLINE.md), [`TESTING.md`](agent_files/general_foundation/TESTING.md), [`DEBUGGING.md`](agent_files/general_foundation/DEBUGGING.md), [`PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md), and [`CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md) before a material change.

## Before production implementation

A change needs:

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
- a context/token strategy preserving capacity for inspection, validation, integration, cleanup, review, recovery, and handoff;
- a test strategy tied to owned invariants, authoritative oracles, case-intent banking, owning capsules, evidence invalidation, escalation tiers, and consolidation;
- expected local/wider effects and downstream output revisions;
- a LEGO boundary with explicit ports, injected dependencies, adapters, lifecycle, and replaceability;
- domain-appropriate foundations and total-system simplicity, including decision review, branch coordination, context reconstruction, tests, operations, and cleanup;
- validation capable of falsifying the selected path and final integrated behavior;
- prior-art/provenance inspection where it can reshape the design.

## Engineering judgment and value ordering

Specifications are obligations, not themes. Existing code, tests, comments, examples, plans, and previous agent output are evidence—not automatic authority.

Translate each material value into one of:

- hard gate;
- mission objective;
- supporting quality;
- process cost or tie-breaker.

Eliminate gate-failing paths before comparing preferences. Weighted scoring cannot compensate for failed authority, safety, semantic correctness, required accuracy/deadline/resource/compatibility, lifecycle, recovery, or evidence bounds.

When no subsystem-specific order exists, use the accepted fallback:

```text
authority / legality / explicit ethics
    → unacceptable irreversible harm
    → semantic correctness and hard mission bounds
    → mission-sustaining reliability / compatibility / operability
    → mission quality and performance
    → maintainability / usability / observability / portability
    → delivery speed / token cost / convenience / polish
```

A subsystem may promote another concern into a gate only with explicit purpose, threshold, consequence, owner, evidence, and revisit trigger.

Compare credible no-change, minimal, proposed, materially different, experiment/staged, and fallback paths where material. Prefer reversible evidence-producing steps under high uncertainty and consequence. Choose the lowest complete total system—not the easiest file change.

Prioritize P0 containment, P1 gate/foundation, P2 information/risk/dependency unlock, P3 mission value/measured efficiency, then P4 supporting quality/polish.

Routine work needs no separate decision record. Use [`agent_files/templates/engineering-decision.template.yaml`](agent_files/templates/engineering-decision.template.yaml) only for foundational, contested, cross-component, high-consequence, empirically uncertain, difficult-to-reverse, or cross-session choices.

## Token, testing, focus branches, and cleanup

Optimize verified lifecycle progress rather than shortest output. Preserve required validation/integration/cleanup/handoff reserve. Decompose large work into semantic focus branches; do not confuse those with Git branches.

Capture material test intents immediately, use minimal reproducers, consolidate cases into owning capsules, reuse exact evidence, cluster failures by root cause, and avoid unchanged reassurance runs.

Protect user/pre-existing work, project authority, evidence, recovery state, shared resources, protected branches, and active dependents. Every material decision record, file, test artifact, branch, process, device resource, credential, backup, and external object receives an intentional verified disposition.

## Organization

UMCGS is organized for large-project scale from inception. Follow [`PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and [`REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

New production components require `README.md`, `component.yaml`, registry entry, dependency declaration, public contract, validation/test ownership, canonical capsule commands, teardown, and disposition. Engineering-decision records, focus branches, token budgets, and test batches do not create components by themselves.

## Documentation and validation

Substantial Markdown below `docs/` must carry a recognized status. Update specifications, ADRs, engineering-decision/parent/focus-branch/token/test/plan/execution/cleanup state, indexes, and registry entries in the same coherent change. Link authority rather than copying it; archive useful stale guidance rather than keeping competing active versions.

Run:

```bash
./scripts/verify-docs.sh
```

## Pull requests

Before requesting review:

- freeze exact head/base and account for the complete changed surface;
- show engineering-contract and specification traceability;
- disclose hard gates, value order, credible candidates, selected path, alternatives rejected, priority, tradeoffs, confidence, and decision debt;
- account for branch statuses/outputs, token/context discipline, test evidence, execution fidelity, cleanup, and affected contracts;
- disclose authoritative oracles, evidence keys, discovery/skip counts, test intents, failure clusters, tiers, evidence reused/repeated, and checks not run;
- rerun only evidence invalidated by head, base, specification, decision, shared contract, source/test revision, generated artifact, model, environment, fixture, seed, or resource profile;
- disclose decision/test/token/cleanup debt, issue closure, Git branch/worktree effects, and merge method.

Every material PR receives author-side complete-diff review. Independent review is triggered by phase, policy, owner instruction, or objective consequence. Merge is a separate expected-head transaction followed by target, engineering-decision, focus-branch, test-evidence, dependency, debt, and cleanup verification.

Do not describe a convenient implementation as the best path without gate/evidence comparison, branch-local work as integrated, raw test count as completeness, a short output as token-efficient without lifecycle evidence, author-side review as independent approval, or a merge response as verified completion.
