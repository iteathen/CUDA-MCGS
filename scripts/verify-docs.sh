#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

required=(
  README.md
  AGENTS.md
  STATUS.md
  next_step.yaml
  CONTRIBUTING.md
  CLAUDE.md
  GEMINI.md
  .github/CODEOWNERS
  .github/copilot-instructions.md
  .github/pull_request_template.md
  .github/workflows/docs.yml
  .github/ISSUE_TEMPLATE/bug.yml
  .github/ISSUE_TEMPLATE/cleanup-debt.yml
  .github/ISSUE_TEMPLATE/config.yml
  .github/ISSUE_TEMPLATE/implementation.yml
  .github/ISSUE_TEMPLATE/research.yml
  .github/ISSUE_TEMPLATE/sanity-finding.yml
  .github/ISSUE_TEMPLATE/specification.yml
  agent_files/README.md
  agent_files/AGENTS.md
  agent_files/AI_RULES.md
  agent_files/SYSTEM_REGISTRY.md
  agent_files/VALIDATION_POLICY.md
  agent_files/DESIGN_ALIGNMENT_CARD.md
  agent_files/general_foundation/PRINCIPLES.md
  agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md
  agent_files/general_foundation/PLAN_EXECUTION.md
  agent_files/general_foundation/CLEANUP_AND_DISPOSITION.md
  agent_files/general_foundation/SANITY_CHECKING.md
  agent_files/general_foundation/SEMANTIC_INTERROGATION.md
  agent_files/general_foundation/PULL_REQUEST_REVIEW_AND_MERGE.md
  agent_files/general_foundation/LEGO_ARCHITECTURE.md
  agent_files/general_foundation/COMPONENT_STANDARD.md
  agent_files/general_foundation/CONTRACT_STANDARD.md
  agent_files/general_foundation/COMPOSITION_AND_DEPENDENCIES.md
  agent_files/general_foundation/DOMAIN_APPROPRIATE_FOUNDATIONS.md
  agent_files/general_foundation/CONTEXTUAL_DESIGN_WEIGHTING.md
  agent_files/general_foundation/MAXIMUM_ACCURATE_GENERALITY.md
  agent_files/general_foundation/COMPATIBILITY_AND_EVOLUTION.md
  agent_files/general_foundation/FORBIDDEN_DESIGN_PATTERNS.md
  agent_files/general_foundation/PROJECT_ORGANIZATION.md
  agent_files/general_foundation/WORKFLOW.md
  agent_files/general_foundation/CONTEXT_ROUTING.md
  agent_files/general_foundation/DEVELOPMENT.md
  agent_files/general_foundation/TESTING.md
  agent_files/general_foundation/DEBUGGING.md
  agent_files/general_foundation/PLANS_AND_HANDOFFS.md
  agent_files/general_foundation/ACCOUNTABILITY.md
  agent_files/general_foundation/SECURITY.md
  agent_files/general_foundation/CHANGE_MANAGEMENT.md
  agent_files/general_foundation/REVIEW.md
  agent_files/general_foundation/DOCUMENTATION_GOVERNANCE.md
  agent_files/application_specific/UMCGS_PROFILE.md
  agent_files/application_specific/REPOSITORY_ORGANIZATION.md
  agent_files/application_specific/ARCHITECTURE_GUARDRAILS.md
  agent_files/application_specific/MEMORY_AND_PERFORMANCE.md
  agent_files/application_specific/RESEARCH_POLICY.md
  agent_files/templates/component-manifest.template.yaml
  agent_files/templates/assessment-and-plan.template.md
  agent_files/templates/plan-execution.template.yaml
  agent_files/templates/cleanup-disposition.template.yaml
  agent_files/templates/sanity-check.template.yaml
  agent_files/templates/semantic-review.template.yaml
  agent_files/templates/pr-review.template.md
  agent_files/templates/design-review.template.md
  agent_files/templates/naming-analysis.template.yaml
  agent_files/templates/decision-record.template.md
  agent_files/templates/specification.template.md
  agent_files/templates/research-note.template.md
  agent_files/templates/subsystem-readme.template.md
  agent_files/templates/handoff.template.md
  agent_files/templates/debugging-report.template.md
  agent_files/templates/benchmark-report.template.md
  agent_files/templates/task-plan.template.yaml
  agent_files/templates/next_step.template.yaml
  docs/README.md
  docs/PROJECT_CHARTER.md
  docs/architecture/README.md
  docs/architecture/FRAMEWORK_OVERVIEW.md
  docs/specs/README.md
  docs/specs/SPEC-0000-framework-requirements.md
  docs/decisions/README.md
  docs/decisions/ADR-0001-prior-art-disposition.md
  docs/decisions/ADR-0002-universal-contracts-specialized-engines.md
  docs/decisions/ADR-0003-device-resident-active-search.md
  docs/decisions/ADR-0004-large-project-organization.md
  docs/decisions/ADR-0005-lego-design-hierarchy.md
  docs/decisions/ADR-0006-adversarial-assessment-and-planning.md
  docs/decisions/ADR-0007-proportional-sanity-checking.md
  docs/decisions/ADR-0008-exact-head-pr-review-and-guarded-merge.md
  docs/decisions/ADR-0009-governed-plan-execution.md
  docs/decisions/ADR-0010-cleanup-reconciliation-and-artifact-disposition.md
  docs/development/README.md
  docs/research/README.md
  docs/research/prior-art/README.md
  docs/research/prior-art/2026-08-10-landscape.md
  docs/research/prior-art/source-register.yaml
  docs/archive/README.md
  adapters/README.md
  benchmarks/README.md
  components/README.md
  conformance/README.md
  examples/README.md
  experiments/README.md
  packaging/README.md
  schemas/README.md
  tests/README.md
  third_party/README.md
  tools/README.md
  scripts/check-doc-links.py
  scripts/check-project-organization.py
  scripts/check-structured-data.py
)

for path in "${required[@]}"; do
  [[ -s "$path" ]] || {
    printf 'missing or empty required file: %s\n' "$path" >&2
    exit 1
  }
done

while IFS= read -r -d '' path; do
  grep -Eq '^\*\*Status:\*\* (Proposal|Accepted|Superseded|Research Note|Informational)$' "$path" || {
    printf 'missing recognized status marker: %s\n' "$path" >&2
    exit 1
  }
done < <(find docs -type f -name '*.md' -print0)

for adapter in CLAUDE.md GEMINI.md .github/copilot-instructions.md; do
  grep -q 'AGENTS.md' "$adapter" || {
    printf 'tool adapter does not point to AGENTS.md: %s\n' "$adapter" >&2
    exit 1
  }
done

[[ ! -d docs/agents ]] || {
  printf 'docs/agents must not exist; canonical agent guidance belongs in agent_files/\n' >&2
  exit 1
}
[[ ! -d docs/specifications ]] || {
  printf 'docs/specifications is stale; use docs/specs/\n' >&2
  exit 1
}

python3 scripts/check-project-organization.py
python3 scripts/check-doc-links.py
python3 scripts/check-structured-data.py

for form in .github/ISSUE_TEMPLATE/*.yml; do
  if [[ "$(basename "$form")" == config.yml ]]; then
    continue
  fi
  grep -q '^name:' "$form" || { printf 'issue form missing name: %s\n' "$form" >&2; exit 1; }
  grep -q '^description:' "$form" || { printf 'issue form missing description: %s\n' "$form" >&2; exit 1; }
  grep -q '^body:' "$form" || { printf 'issue form missing body: %s\n' "$form" >&2; exit 1; }
done

if command -v ruby >/dev/null 2>&1; then
  ruby -e 'require "yaml"; Dir[".github/ISSUE_TEMPLATE/*.{yml,yaml}"].each { |f| YAML.safe_load_file(f, permitted_classes: [], aliases: false) }'
fi

printf 'documentation, organization, agent-governance, and cleanup checks passed\n'
