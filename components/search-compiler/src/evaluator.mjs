import * as core from './evaluator-core.mjs';
import { canonicalIdentity, compareRaw, fail } from './validation.mjs';
import { normalizeSchemaReference } from './foundation.mjs';

const MAX_PROGRAM_REQUIREMENTS = 64;

function normalizeProgramRequirements(input) {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_PROGRAM_REQUIREMENTS) {
    fail('EVALUATOR_PROGRAM_REQUIREMENT_COUNT', `program requirements must contain between 1 and ${MAX_PROGRAM_REQUIREMENTS} entries when present`);
  }
  const requirements = input.map((entry, index) => normalizeSchemaReference(entry, `program requirement ${index}`));
  requirements.sort((left, right) => compareRaw(left.id, right.id));
  const seen = new Set();
  for (const requirement of requirements) {
    if (seen.has(requirement.id)) fail('EVALUATOR_PROGRAM_REQUIREMENT_DUPLICATE', `program requirement ${requirement.id} is duplicated`);
    seen.add(requirement.id);
  }
  return requirements;
}

export function normalizeEvaluatorProfile(input, inspectedCatalog, domainResult, graphResult) {
  const program = input?.programContribution;
  if (!program || !Object.hasOwn(program, 'requirements')) {
    return core.normalizeEvaluatorProfile(input, inspectedCatalog, domainResult, graphResult);
  }

  const stripped = structuredClone(input);
  const rawRequirements = stripped.programContribution.requirements;
  delete stripped.programContribution.requirements;
  const base = core.normalizeEvaluatorProfile(stripped, inspectedCatalog, domainResult, graphResult);
  const programContribution = {
    ...base.normalized.programContribution,
    requirements: normalizeProgramRequirements(rawRequirements),
  };
  const normalized = { ...base.normalized, programContribution };
  return { normalized, identity: canonicalIdentity(normalized) };
}

export const evaluatorProgramRequirementConstants = Object.freeze({
  maxRequirements: MAX_PROGRAM_REQUIREMENTS,
});

export * from './evaluator-core.mjs';
