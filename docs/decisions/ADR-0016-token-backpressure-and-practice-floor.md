# ADR-0016: Universal Token Backpressure and Minimum Practice Floor

**Status:** Accepted

**Date:** 2026-08-10

## Context

ADR-0012 established token-use and context discipline for UMCGS, including context reserves, layered retrieval, operational bands, lossless checkpoints, and token debt. Subsequent engineering, testing, and focus-branch doctrine made it clear that token use must act as backpressure continuously across **all** tasks, not only substantial or critical work and not only when the context window is nearly exhausted.

Two opposing failures must be prevented:

- agents allow scope, context, tests, retries, branches, generated text, and administrative records to grow without pressure until testing, integration, cleanup, or handoff are starved;
- agents react to token pressure by skipping authority, reasoning, required tests, actual-effect inspection, review, recovery, or cleanup and call the reduced rigor “efficiency.”

The project owner directed that token use become backpressure on every task without excessive sacrifice of good engineering practices.

## Decision

UMCGS adopts the universal backpressure and minimum-practice-floor rules in `agent_files/general_foundation/TOKEN_DISCIPLINE.md`.

ADR-0016 extends ADR-0012. It does not supersede the existing reserve, context-layer, operational-band, checkpoint, or token-debt rules.

## Universal token posture

Every task, including routine work, begins with at least an implicit token posture:

1. exact owned outcome;
2. risk-appropriate minimum practice floor;
3. smallest coherent useful scope;
4. cheapest decisive evidence;
5. reserve for actual-effect inspection, validation, cleanup, and truthful reporting;
6. pressure signals and reduction actions.

Routine work needs no formal budget record or percentage calculation. The posture may be implicit and very small, but token pressure still applies from the first read or mutation.

## Minimum practice floor

Token pressure controls scope and work in flight. It does not reduce the evidence standard for the claim that remains in scope.

Every task preserves:

- the actual request and constraints;
- authoritative owner and current source of truth;
- relevant current-state inspection;
- coherent scope;
- expected result and decisive verification;
- operation within authority;
- actual-effect inspection;
- relevant testing/verification;
- cleanup/reconciliation of created or changed state;
- honest results, checks not run, and remaining risk.

Substantial and critical work add every objectively triggered requirement for specification alignment, dependency/integration analysis, failure/resource behavior, rollback/recovery, authoritative testing, adversarial reasoning, focus branches, security/safety, persistence/ABI/migration, independent review, and guarded integration.

No token target or schedule target waives an objectively triggered practice.

## Backpressure reduction order

When cost or context pressure rises, agents reduce in this order:

1. duplicated reads, retries, tests, summaries, agents, and records;
2. repeated authority/evidence by linking and exact reuse;
3. fragmented work by batching coherent retrieval, changes, tests, failure clusters, and review;
4. cold context, verbose output, and unbounded tool/log output;
5. optional polish, speculative work, and noncritical breadth;
6. scope or claim breadth, while keeping the remaining result coherent and fully evidenced;
7. branch size through split, rebranch, or handoff;
8. mutation itself when authority, evidence, access, recovery, or practice floor cannot be satisfied.

Agents reduce waste before breadth and breadth before rigor.

## Practice-preserving degradation

Backpressure may remove ceremony that has no distinct consumer. It may not remove substance required by consequence.

Permitted reductions include duplicate records, optional alternative exploration after a decisive path exists, repeated evidence, redundant CI, cosmetic polish, speculative abstractions, and unrelated cleanup.

Prohibited reductions include accepted authority, exact identities, hard gates, material reasoning, required test tiers, evidence identity, discovery/skip accounting, actual-effect inspection, failure/recovery/cleanup obligations, required review/protection, and truthful claim limits.

Sampling or a lower test tier is permitted only when the claim is narrowed accordingly.

## Backpressure triggers

A replan is triggered by material symptoms such as:

- an unchanged reread, retry, or reassurance run;
- a second repair cycle without stronger first-divergence evidence or a changed root-cause hypothesis;
- a new owner, contract, artifact family, or high-consequence risk;
- expansion beyond the planned operation, branch, or test capsule;
- testing beyond the planned tier without a new invalidation/risk trigger;
- tool output overwhelming causal context;
- duplicated administrative state;
- repeated loss of revisions or already established facts;
- optional work drawing from validation/integration/cleanup/handoff reserve;
- a meaningful soft-envelope overrun, with roughly 25% as a default telemetry signal rather than a quota;
- insufficient room for another complete evidence cycle and handoff.

## Budget elasticity

Backpressure is not a fixed cap.

When essential evidence or cleanup requires more capacity, agents explicitly extend the budget, narrow scope, split/rebranch, defer optional work, hand off, or pause. They do not stop at a soft estimate while required in-scope safety, correctness, recovery, cleanup, or handoff remains incomplete and a sound extension or split is available.

They also do not continue a poor path merely because tokens have already been spent. Sunk token cost is not a reason to preserve a failing approach.

## Operational bands and reserves

ADR-0012’s defaults remain:

- substantial work reserves at least 30% of usable context;
- critical, large, or cross-branch work reserves at least 40% after loading the branch packet;
- routine work keeps enough semantic headroom for inspection, verification, cleanup, and truthful reporting without a fixed percentage.

Green, yellow, red, and emergency states remain semantic controls. Yellow opens no new scope. Red stops new mutation. Emergency preserves exact state only.

## Interaction with testing

Token backpressure must improve test selection, batching, consolidation, exact evidence reuse, failure clustering, and tier escalation. It may not remove required oracles, owner capsules, discovery/skip accounting, evidence identity, or integration evidence.

Repeated broad testing is reduced before coverage or accuracy. Repair-loop expansion triggers renewed first-divergence and root-cause analysis.

## Interaction with focus branches

A focus branch is invalid when its complete packet, mechanism, consequences, execution, testing, validation, cleanup, and handoff reserve no longer fit one usable window.

Pressure triggers splitting or handoff rather than maintaining several shallow partial branches or reducing the practice floor.

## Proportional administration

Routine tasks do not require a token ledger. Durable token-budget records remain limited to work whose cross-session, cross-agent, telemetry, consequence, parallelism, or repeated pressure gives the record a real consumer.

The doctrine must reduce administrative duplication rather than add another mandatory form to every task.

## Consequences

- Token cost constrains work in flight from the beginning of every task.
- Optional breadth and ceremony yield before verification rigor.
- Routine work receives lightweight backpressure without paperwork.
- Substantial and critical work preserve explicit reserves and stop conditions.
- Scope is narrowed, split, or handed off before evidence is starved.
- Budget extensions are allowed when essential practice has high marginal value.
- Sunk token cost no longer justifies continuing an invalid path.
- Testing and repair loops use selection, consolidation, and evidence reuse rather than repeated broad runs.
- Agent quality is judged by verified results, rework, escaped defects, repeated retrieval, missed integration, unsafe residue, and continuation cost—not raw token count.

## Alternatives considered

### Token limits only for substantial and critical work

Rejected. Routine tasks can still expand through broad reading, repeated retries, optional polish, and unnecessary testing. They need implicit backpressure even when no record is warranted.

### Fixed hard token caps

Rejected. Hard caps can starve safety, correctness, evidence, cleanup, and handoff and cannot account for varying consequence or uncertainty.

### “Never sacrifice good practices” without proportionality

Rejected as incomplete. Not every best practice is mandatory for every task; forcing all ceremony onto routine work creates waste. The doctrine distinguishes a risk-triggered practice floor from optional practice ceiling.

### Always finish the original scope

Rejected. Scope reduction and focus-branch splitting are safer than shallow incomplete work when the original scope exceeds the evidence and context envelope.

### Stop immediately whenever the estimate is exceeded

Rejected. Soft estimates are backpressure signals, not authority. Essential evidence may justify extending or restructuring the budget.

### Judge agents by token count

Rejected. Low raw usage can reflect omitted evidence, and high usage can reflect durable value. Quality-adjusted lifecycle progress is the relevant measure.

## Validation

A conforming task demonstrates, proportionally:

- at least an implicit token posture from orientation;
- a preserved risk-appropriate practice floor;
- coherent scope and enough reserve for proof/cleanup/handoff;
- targeted retrieval, reasoning, generation, testing, and tool use;
- application of the reduction ladder when pressure appears;
- optional scope/ceremony reduced before rigor;
- explicit extend/narrow/split/handoff decisions when the envelope changes;
- no material token debt or unsupported broad claim;
- truthful checks not run and final state.

Agent entry points, hard rules, principles, workflow, validation, review, planning/PR templates, indexes, status, and governance checks must route to this decision.

## Revisit triggers

Revisit when agents still starve testing or cleanup, routine tasks gain excessive bookkeeping, fixed percentages are treated as quotas, agents stop prematurely at soft budgets, broad scopes repeatedly require rescue handoffs, or evidence shows the reduction ladder removes the wrong kinds of work.
