# Contributing to UMCGS

UMCGS is currently private and documentation-first. Read [`AGENTS.md`](AGENTS.md), [`agent_files/general_foundation/PRINCIPLES.md`](agent_files/general_foundation/PRINCIPLES.md), [`agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md`](agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md), and [`agent_files/README.md`](agent_files/README.md) before opening a change.

## Before production implementation

A change needs:

- a proportional assessment whose disposition permits implementation;
- the strongest credible objection and its resolution, evidence, experiment, or blocker;
- a clear ownership boundary;
- a durable product-area/component home;
- a LEGO ownership boundary with one state/lifecycle owner, meaningful ports, injected dependencies, and owned adapters;
- domain-appropriate ranges and a total-system simplicity analysis;
- accepted governing specifications, or an explicitly authorized disposable experiment;
- defined invariants, ranges, lifecycle, resource limits, and failure behavior;
- declared public/internal boundaries and dependencies;
- a validation plan;
- prior-art inspection when existing work may avoid duplication or change the design.

## Organization

UMCGS is organized as a very large project from inception. Follow [`agent_files/general_foundation/PROJECT_ORGANIZATION.md`](agent_files/general_foundation/PROJECT_ORGANIZATION.md) and [`agent_files/application_specific/REPOSITORY_ORGANIZATION.md`](agent_files/application_specific/REPOSITORY_ORGANIZATION.md).

A new production component requires `README.md`, `component.yaml`, registry entry, dependency declaration, public contract, and validation ownership. Do not place production source at root or in catch-all helper directories.

## Documentation

Substantial Markdown below `docs/` must carry a recognized status. Update indexes and registry entries in the same change. Supersede or archive historically useful stale guidance rather than silently deleting it.

## Validation

Run:

```bash
./scripts/verify-docs.sh
```

Implementation changes add boundary-specific validation under accepted specifications and component manifests.

## Pull requests

Follow [`agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md`](agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md).

Before requesting review:

- record the exact ready-for-review head and intended base;
- ensure the PR is one coherent integration;
- account for the complete changed surface and affected contracts;
- run focused validation and proportional self-sanity;
- disclose checks not run, limitations, issue closure, branch effects, and proposed merge method.

Every material PR receives author-side complete-diff review. Independent review is required by phase, protection/CODEOWNERS, owner instruction, or objective consequence. A changed head invalidates affected review.

Merge is a separate guarded transaction. Revalidate the exact accepted head, target, checks/reviews/protection, discussion, mergeability, issue closure, branch/dependent work, and merge method; use an expected-head guard where supported; then verify the target/resulting SHA and tree.

Do not describe local-only work as published, author-side review as independent approval, or a merge response as verified integration.
