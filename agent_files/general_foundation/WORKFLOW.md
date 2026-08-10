# Development Workflow

**Scope:** Reusable foundation.

## 1. Orient

Read authority, inspect repository state, identify task class, existing decisions, related work, and unrelated local changes.

## 2. Establish ownership and bounds

Write down the owner, inputs, outputs, invariants, lifecycle, failures, expected ranges, memory/performance constraints, external dependencies, and out-of-scope behavior.

## 3. Inspect prior art

When mature work, standards, papers, hardware behavior, or current libraries may change the design, inspect them before committing to an architecture. Record exact revisions and licenses.

## 4. Specify unsettled foundations

Persistent layouts, public contracts, synchronization, memory policies, lifecycle, state identity, ABI, and cross-component ownership require an accepted specification or ADR before production implementation.

A disposable experiment must name the question it answers and the conditions for deletion or promotion.

## 5. Plan a coherent change

Plan by ownership boundary. Include affected components, compatibility/migration, validation, failure handling, documentation, rollback, and known unknowns.

## 6. Implement

Preserve the declared boundary. Avoid unrelated cleanup. Make limits and failures explicit. Do not erase evidence needed for correctness.

## 7. Validate

Progress from focused checks through integration, failure/exhaustion, architecture-specific checks, benchmarks, and the full relevant suite.

## 8. Reconcile authority and history

Update specs, ADRs, registry, indexes, subsystem READMEs, and archived superseded material in the same coherent change.

## 9. Publish intentionally

Inspect status and diff, stage only intended files, commit coherently, push through a verified transport, and verify the remote result.

## 10. Hand off

Record objective, authority, changes, evidence, state, risks, failed approaches, and one coherent next boundary.
