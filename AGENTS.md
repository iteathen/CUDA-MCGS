# UMCGS Agent Entry Point

This file is the mandatory first read for every human or automated developer. The canonical operating manual is [`agent_files/AGENTS.md`](agent_files/AGENTS.md). Tool-specific files are compatibility pointers only and may not create competing rules.

## Startup sequence

Before changing anything:

1. Read this file.
2. Read [`agent_files/AGENTS.md`](agent_files/AGENTS.md) and [`agent_files/AI_RULES.md`](agent_files/AI_RULES.md).
3. Read [`agent_files/SYSTEM_REGISTRY.md`](agent_files/SYSTEM_REGISTRY.md) to identify the owning boundary and source of truth.
4. Read [`agent_files/general_foundation/PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and the UMCGS layout in [`agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md) before creating, moving, or splitting project artifacts.
5. Read the accepted ADRs and specifications relevant to the task.
6. Inspect repository status, existing work, and current project state.
7. Apply the reasoning gate before editing.

## Authority order

When instructions conflict, apply this order:

1. Explicit project-owner instruction for the current task.
2. This root `AGENTS.md` and `agent_files/AGENTS.md`.
3. Accepted ADRs in `docs/decisions/`.
4. Accepted normative specifications in `docs/specs/`.
5. `agent_files/AI_RULES.md`, `SYSTEM_REGISTRY.md`, and `VALIDATION_POLICY.md`.
6. The accepted project charter.
7. Accepted application-specific agent guidance.
8. Architecture explanations.
9. Research notes and proposals.
10. Archived or superseded material.

Do not silently resolve a contradiction in favor of the easiest implementation. Report it and stop at the reasoning gate when it affects correctness, architecture, safety, memory, synchronization, ABI, lifecycle, ownership, or dependency direction.

## Current phase

UMCGS is documentation-first and is defining a universal GPU-resident Monte Carlo Graph Search framework. Production implementation may begin only for a clearly owned boundary with accepted governing specifications or an explicitly authorized disposable experiment.

The first product is the generic framework, not a chess engine. Chess, Go, text search, planning, optimization, policy-only search, evaluation-only search, partially observable search, and other workloads are adapters or conformance domains. None may permanently shape the core.

## Non-negotiable project invariants

- Organize the repository from the beginning as though it will become a very large project. Current file count is never justification for a flat, unowned, or temporary layout.
- Universal at contracts and compilation boundaries; specialized in generated hot paths.
- Every concrete engine is finite and has an explicit GPU-memory and resource plan.
- After search ignition, no active search decision may require a CPU-produced intermediate result.
- The selected search engine, evaluator/model, work queues, and mutable search state remain GPU-resident during active search.
- State identity, transpositions, history, cycles, action production, evaluation outputs, backup semantics, output semantics, and resource exhaustion are explicit contracts.
- No hidden assumption of a game, board, player count, zero-sum value, alternating turns, fixed action count, fixed state size, scalar value, deterministic transition, tree, DAG, rollout, or neural evaluator.
- Foundational ranges and representations may not encode accidental limits from the first domain or first GPU.
- Cross-component dependencies must be declared, acyclic, and made through public contracts rather than deep imports.
- Tests, safety checks, validation gates, and benchmark requirements may not be weakened to make a change pass.

See [`agent_files/application_specific/UMCGS_PROFILE.md`](agent_files/application_specific/UMCGS_PROFILE.md), [`ARCHITECTURE_GUARDRAILS.md`](agent_files/application_specific/ARCHITECTURE_GUARDRAILS.md), and [`REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

## Large-project organization rule

The organizational hierarchy is:

```text
repository
  -> product area
    -> component
      -> subsystem/module
        -> file
```

Every production artifact must have a declared home and owner. New components require a component manifest, README, registry entry, dependency declaration, and validation boundary in the same coherent change.

Do not create root-level source files, catch-all `utils`, `common`, `shared`, `misc`, or `helpers` dumping grounds, or cross-component deep imports. Organizational scaffolding is established early; runtime abstractions, extra repositories, and deployable services are created only when an independent lifecycle justifies them.

## Reasoning gate

Architecture, CUDA synchronization, memory layout, lifetimes, concurrency, JIT/ABI work, schemas, persistent state, hot-path changes, component creation, dependency-direction changes, and repository splits require high-confidence reasoning supported by authority and evidence. An agent that cannot establish the required reasoning must not edit that boundary. It must record a decision-ready blocker and next action in `next_step.yaml`.

The gate is not permission to abandon hard work. Research, inspect, test, and narrow the uncertainty first.

## Work and evidence rules

- Work in the largest safe coherent unit owned by one boundary; avoid repeated tiny passes that cause context drift.
- Decide the artifact's organizational home before writing it.
- Diagnose before repairing: observe, compare with the contract, locate ownership, make one coherent repair, retest.
- Never apply speculative fixes or optimize an unmeasured symptom.
- Preserve raw evidence and label claims as owner requirement, accepted authority, verified observation, inference, proposal, or unresolved assumption.
- Performance claims require reproducible workload, hardware/software profile, methodology, raw results, and comparison.
- Archive historically useful stale material with provenance rather than silently deleting it.
- External implementation reuse requires exact revision and license review before copying or adapting code.

## Required validation

At the current stage, run:

```bash
./scripts/verify-docs.sh
```

Additional validation is determined by [`agent_files/VALIDATION_POLICY.md`](agent_files/VALIDATION_POLICY.md). A task is not complete merely because files were edited.
