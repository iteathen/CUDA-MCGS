# CUDA-MCGS development

**Status:** Informational

This directory contains development plans, assessments, and public-repository guidance. Detailed engineering methods are maintained in [agent guidance](../../agent_files/README.md).

## Start here

- [Contributing](../../CONTRIBUTING.md): contributor workflow.
- [Developer entry point](../../AGENTS.md): applicable instructions and required checks.
- [Current status](../../STATUS.md) and [next step](../../next_step.yaml): active work and dependencies.
- [Conformance](../../conformance/README.md): reference, package, adapter, and native evidence paths.
- [Public repository guidance](PUBLIC_REPOSITORY.md): collaboration and release-related procedures.

From the repository root, the documentation and repository gate is:

```bash
./scripts/verify-docs.sh
```

Use Bash with the script's required development tools available. The gate includes reference/source-boundary checks; it does not establish physical GPU qualification.

## Plans and historical assessments

Dated plans and assessment records preserve their original scope and evidence. Use current status to determine which work remains active; a historical next action is not the current queue.

The [forward plan](2026-08-12-v0-forward-plan.md) provides planning context. Accepted [decisions](../decisions/README.md) and [specifications](../specs/README.md) govern implementation.
