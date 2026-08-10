# Contributing to UMCGS

UMCGS is private and documentation-first. Read [`AGENTS.md`](AGENTS.md), [`agent_files/general_foundation/TOKEN_DISCIPLINE.md`](agent_files/general_foundation/TOKEN_DISCIPLINE.md), [`ENGINEERING_JUDGMENT.md`](agent_files/general_foundation/ENGINEERING_JUDGMENT.md), [`PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md), [`FOCUS_BRANCHES.md`](agent_files/general_foundation/FOCUS_BRANCHES.md), [`TESTING.md`](agent_files/general_foundation/TESTING.md), [`PLAN_EXECUTION.md`](agent_files/general_foundation/PLAN_EXECUTION.md), and [`CLEANUP_AND_DISPOSITION.md`](agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md) before a material change.

## Universal token posture

Token backpressure applies to every contribution, including routine edits.

Before work expands, identify:

- exact outcome and authority;
- minimum practice floor;
- smallest coherent useful scope;
- cheapest decisive verification;
- reserve for actual-effect inspection, testing, cleanup, and reporting;
- pressure triggers and optional work to defer.

Routine work needs no token ledger. It still preserves current-state inspection, coherent scope, verification, cleanup, and honest limits.

When pressure rises, reduce in this order:

```text
remove duplication
  → reuse authority/evidence
  → batch coherent work/tests
  → narrow context/output
  → defer optional breadth/polish
  → reduce scope/claim
  → split/rebranch/handoff
  → pause on blocker
```

Do not cut required practice first. A soft budget overrun triggers replanning, not automatic stopping or reduced rigor. Extend the budget when essential evidence/cleanup has high marginal value and restore reserve through narrowing or split.

Reduced evidence narrows the claim. Sampling or a lower test tier cannot support an unchanged complete/release claim.

## Before production implementation

A change needs, proportionally:

- accepted authority and an engineering contract;
- specification traceability and resolved/blocked authority gaps;
- hard gates, value ordering, credible path comparison, selected path, priority, and tradeoffs;
- coherent ownership and organization;
- assessment and focus branches when triggered;
- token posture and practice-floor protection;
- testing tied to owned invariants and authoritative oracles;
- expected effects, falsifier, rollback/recovery, cleanup, and integration;
- evidence capable of disproving the claim.

## Testing and repair

Bank test intents, consolidate owning capsules, share safe immutable setup, isolate mutable state, reuse exact evidence, cluster failures by first divergence/root cause, and avoid unchanged reassurance runs. Token pressure may remove duplicate tests and unnecessary tiers, but not required oracles, discovery/skip accounting, evidence identity, owner capsules, or integration evidence.

## Organization and cleanup

New components require README, manifest, registry entry, dependency/public contract, validation/test ownership, teardown, and disposition. Token budgets and focus branches do not create components.

Protect user/pre-existing work, authority, evidence, recovery state, branches, credentials, device state, and external resources. Every material created/obsolete item receives an intentional verified disposition.

## Validation

Run:

```bash
./scripts/verify-docs.sh
```

Implementation adds every objectively triggered test, integration, resource/failure, cleanup, and review check. Token pressure cannot waive those checks.

## Pull requests

Before review, freeze exact head/base and disclose:

- engineering/specification alignment;
- branch and integration state;
- token practice floor, reserve, pressure triggers, reduction-ladder actions, budget extensions, narrowed claims, and token debt;
- test evidence and checks not run;
- cleanup and closure effects.

Every material PR receives exact-head author-side review; independence follows phase/risk/policy. Merge is guarded and followed by target/branch/resource/cleanup verification.

Do not describe low raw token use as efficiency without showing verified lifecycle progress and preserved practice.
