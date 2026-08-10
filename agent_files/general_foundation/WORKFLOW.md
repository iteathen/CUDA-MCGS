# Development Workflow

**Scope:** Reusable foundation.

## 1. Orient

Read authority, inspect repository state, identify task class, existing decisions, related work, unrelated local changes, and the current product-area/component organization.

## 2. Establish ownership, placement, and bounds

Write down:

- product area and component owner;
- durable repository path;
- public/internal surface;
- allowed and affected dependencies;
- purpose, inputs, outputs, invariants, and lifecycle;
- expected ranges;
- memory/performance constraints;
- failures, recovery, and observability;
- external dependencies;
- out-of-scope behavior.

If the component does not exist, apply the organization gate before implementation.

## 3. Inspect prior art

When mature work, standards, papers, hardware behavior, or current libraries may change the design, inspect them before committing to an architecture. Record exact revisions and licenses.

## 4. Apply the design hierarchy

For component, contract, dependency, foundational representation, compatibility, or reusable-name work:

1. establish domain truth, authority, purpose, bounds, and contextual concern weighting;
2. define the LEGO owner, state/lifecycle ownership, ports, injected dependencies, adapters, and non-responsibilities;
3. define SOLID internal responsibilities only where meaning, change, testing, concurrency, resource lifetime, or substitution requires separation;
4. define CUPID quality expectations;
5. prove domain-appropriate ranges/capacities and maximum-accurate-generality;
6. compare total-system complexity, including complexity moved elsewhere;
7. identify decisive falsifiers and revisit triggers.

Use `templates/design-review.template.md` when the design is foundational, contested, or difficult to reconstruct.

## 5. Specify unsettled foundations

Persistent layouts, public contracts, synchronization, memory policies, lifecycle, state identity, ABI, cross-component ownership, and dependency direction require an accepted specification or ADR before production implementation.

A disposable experiment must name the question it answers, live under the experiment product area, and state deletion or promotion conditions.

## 6. Plan a coherent change

Plan by ownership boundary. Include:

- product area/component placement;
- component manifest and registry changes;
- public/internal contract effects;
- dependency graph changes;
- affected components;
- compatibility/migration;
- validation;
- failure handling;
- documentation;
- rollback;
- known unknowns.

## 7. Implement

Preserve the declared boundary. Avoid unrelated cleanup. Make limits and failures explicit. Do not erase evidence needed for correctness. Do not introduce root-level source, deep imports, generic dumping grounds, or unregistered components.

## 8. Validate

Progress from organization/documentation checks through focused checks, integration, failure/exhaustion, architecture-specific checks, benchmarks, and the full relevant suite.

## 9. Reconcile authority and history

Update specifications, ADRs, component manifests, registry, indexes, subsystem READMEs, and archived superseded material in the same coherent change.

## 10. Publish intentionally

Inspect status and diff, stage only intended files, commit coherently, push through a verified transport, and verify the remote result.

## 11. Hand off

Record objective, product area/component, authority, changes, evidence, repository state, risks, failed approaches, and one coherent next boundary.
