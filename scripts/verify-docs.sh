#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

required=(
  .gitattributes
  README.md
  AGENTS.md
  STATUS.md
  next_step.yaml
  CONTRIBUTING.md
  LICENSING.md
  CLAUDE.md
  GEMINI.md
  .github/CODEOWNERS
  .github/dependabot.yml
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
  agent_files/general_foundation/ENGINEERING_JUDGMENT.md
  agent_files/general_foundation/ASSESSMENT_AND_PLANNING.md
  agent_files/general_foundation/FOCUS_BRANCHES.md
  agent_files/general_foundation/TOKEN_DISCIPLINE.md
  agent_files/general_foundation/SPEC_AND_AGENT_FILE_READING.md
  agent_files/general_foundation/CONTEXT_ROUTING.md
  agent_files/general_foundation/PLAN_EXECUTION.md
  agent_files/general_foundation/TESTING.md
  agent_files/general_foundation/DEBUGGING.md
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
  agent_files/general_foundation/DEVELOPMENT.md
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
  agent_files/templates/engineering-decision.template.yaml
  agent_files/templates/assessment-and-plan.template.md
  agent_files/templates/focus-branch.template.yaml
  agent_files/templates/token-budget.template.yaml
  agent_files/templates/document-reading.template.yaml
  agent_files/templates/test-batch.template.yaml
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
  docs/architecture/REPOSITORY_TOPOLOGY.md
  docs/specs/README.md
  docs/specs/SPEC-0000-framework-requirements.md
  docs/specs/SPEC-0001-device-search-publication-and-resources.md
  docs/specs/SPEC-0002-search-ir-and-reference-semantics.md
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
  docs/decisions/ADR-0011-focus-branch-decomposition-and-integration.md
  docs/decisions/ADR-0012-token-use-and-context-discipline.md
  docs/decisions/ADR-0013-consolidated-testing-and-repair-loop-efficiency.md
  docs/decisions/ADR-0014-extract-cuda-js-runtime.md
  docs/decisions/ADR-0015-engineering-judgment-and-value-ordering.md
  docs/decisions/ADR-0016-token-backpressure-and-practice-floor.md
  docs/decisions/ADR-0017-selective-spec-and-agent-file-reading.md
  docs/decisions/ADR-0018-universal-core-extension-product-layering.md
  docs/decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md
  docs/decisions/ADR-0027-framework-only-production-ownership.md
  docs/development/README.md
  docs/research/README.md
  docs/research/2026-08-10-cuda-js-assumption-audit.md
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
  scripts/check-doc-links.mjs
  scripts/check-project-organization.mjs
  scripts/check-structured-data.mjs
  scripts/run-search-ir-reference.mjs
  scripts/run-search-ir-composer-reference.mjs
  scripts/export-search-ir-composer-domain-profiles.mjs
  scripts/run-search-semantics-reference.mjs
  schemas/search-ir/0.1.0/search-ir.schema.json
  schemas/search-ir/0.2.0/contract-set.schema.json
  schemas/search-ir/0.2.0/contract-set.json
  schemas/search-ir/0.2.0/requirement-coverage.schema.json
  schemas/search-ir/0.2.0/requirement-coverage.json
  schemas/search-ir/0.2.0/primitives.schema.json
  schemas/search-ir/0.2.0/framework-selection.schema.json
  schemas/search-ir/0.2.0/domain-profile.schema.json
  schemas/search-ir/0.2.0/graph-profile.schema.json
  schemas/search-ir/0.2.0/policy-profile.schema.json
  schemas/search-ir/0.2.0/evaluator-profile.schema.json
  schemas/search-ir/0.2.0/resource-profile.schema.json
  schemas/search-ir/0.2.0/progress-profile.schema.json
  schemas/search-ir/0.2.0/output-profile.schema.json
  schemas/search-ir/0.2.0/session-profile.schema.json
  schemas/search-ir/0.2.0/stage-profile.schema.json
  schemas/search-ir/0.2.0/channel-profile.schema.json
  schemas/search-ir/0.2.0/program-package-profile.schema.json
  schemas/search-ir/0.2.0/search-program.schema.json
  schemas/search-ir/0.2.0/execution-package.schema.json
  schemas/search-ir/0.2.0/compatible-pair-record.schema.json
  schemas/search-ir/0.2.0/resolved-composer-input.schema.json
  experiments/search-ir-reference/README.md
  experiments/search-ir-reference/RESULTS.md
  experiments/search-ir-reference/fixtures/baseline.search-ir.json
  experiments/search-ir-reference/fixtures/boundary-capacities.json
  experiments/search-ir-reference/fixtures/invalid-mutations.json
  experiments/search-ir-reference/fixtures/expected-identity.json
  experiments/search-ir-reference/src/normalize.mjs
  experiments/search-ir-reference/src/reference.mjs
  experiments/search-ir-reference/run.mjs
  experiments/search-ir-composer-reference/README.md
  experiments/search-ir-composer-reference/RESULTS.md
  experiments/search-ir-composer-reference/fixtures/minimal.framework-selection.json
  experiments/search-ir-composer-reference/src/catalog.mjs
  experiments/search-ir-composer-reference/src/validation.mjs
  experiments/search-ir-composer-reference/src/foundation.mjs
  experiments/search-ir-composer-reference/src/domain.mjs
  experiments/search-ir-composer-reference/src/domain-fixtures.mjs
  experiments/search-ir-composer-reference/src/graph.mjs
  experiments/search-ir-composer-reference/src/graph-fixtures.mjs
  experiments/search-ir-composer-reference/src/policy.mjs
  experiments/search-ir-composer-reference/src/policy-fixtures.mjs
  experiments/search-ir-composer-reference/src/evaluator.mjs
  experiments/search-ir-composer-reference/src/evaluator-fixtures.mjs
  experiments/search-ir-composer-reference/src/resource.mjs
  experiments/search-ir-composer-reference/src/resource-fixtures.mjs
  experiments/search-ir-composer-reference/src/progress.mjs
  experiments/search-ir-composer-reference/src/progress-fixtures.mjs
  experiments/search-ir-composer-reference/src/output.mjs
  experiments/search-ir-composer-reference/src/output-fixtures.mjs
  experiments/search-ir-composer-reference/src/session.mjs
  experiments/search-ir-composer-reference/src/session-fixtures.mjs
  experiments/search-ir-composer-reference/src/stage.mjs
  experiments/search-ir-composer-reference/src/stage-fixtures.mjs
  experiments/search-ir-composer-reference/src/channel.mjs
  experiments/search-ir-composer-reference/src/channel-fixtures.mjs
  experiments/search-ir-composer-reference/src/program-package.mjs
  experiments/search-ir-composer-reference/src/program-package-fixtures.mjs
  experiments/search-ir-composer-reference/src/composer.mjs
  experiments/search-ir-composer-reference/src/composer-presets.mjs
  experiments/search-ir-composer-reference/export-domain-profiles.mjs
  experiments/search-ir-composer-reference/run.mjs
  experiments/search-semantics-reference/README.md
  experiments/search-semantics-reference/RESULTS.md
  experiments/search-semantics-reference/fixtures/neutral-schedules.json
  experiments/search-semantics-reference/fixtures/domain-cases.json
  experiments/search-semantics-reference/src/errors.mjs
  experiments/search-semantics-reference/src/canonical.mjs
  experiments/search-semantics-reference/src/schedule.mjs
  experiments/search-semantics-reference/src/mutation.mjs
  experiments/search-semantics-reference/src/domain.mjs
  experiments/search-semantics-reference/src/domain-instances.mjs
  experiments/search-semantics-reference/src/domain-cases.mjs
  experiments/search-semantics-reference/run.mjs
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

node_bin="${UMCGS_NODE:-}"
if [[ -z "$node_bin" ]]; then
  for candidate in \
    "$repo_root/build/toolchains/node-v26.7.0-win-x64/node.exe" \
    "$repo_root/../CUDA-JS/build/toolchains/node-v26.7.0-win-x64/node.exe"; do
    if [[ -x "$candidate" ]]; then
      node_bin="$candidate"
      break
    fi
  done
fi
if [[ -z "$node_bin" ]] && command -v node >/dev/null 2>&1; then
  node_bin="$(command -v node)"
fi
if [[ -z "$node_bin" ]]; then
  printf 'Node.js 26 is required to validate this repository\n' >&2
  exit 1
fi

node_major="$($node_bin -p 'process.versions.node.split(".")[0]')"
if (( node_major < 26 )); then
  printf 'Node.js 26 or newer is required; found %s\n' "$($node_bin --version)" >&2
  exit 1
fi

"$node_bin" scripts/check-project-organization.mjs
"$node_bin" scripts/check-doc-links.mjs
"$node_bin" scripts/check-structured-data.mjs
"$node_bin" scripts/run-search-ir-reference.mjs
"$node_bin" scripts/run-search-ir-composer-reference.mjs
"$node_bin" scripts/export-search-ir-composer-domain-profiles.mjs
"$node_bin" scripts/run-search-semantics-reference.mjs

native_source_files="$(find . -path './.git' -prune -o -type f \( -name '*.cu' -o -name '*.cuh' -o -name '*.ptx' \) -print)"
if [[ -n "$native_source_files" ]]; then
  printf 'CUDA-MCGS must not contain CUDA C++ or PTX source/fixtures:\n%s\n' "$native_source_files" >&2
  exit 1
fi

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

printf 'documentation, selective-authority-reading, discoverability, organization, engineering-judgment, focus-branch, universal-token-backpressure, testing, agent-governance, and cleanup checks passed\n'
