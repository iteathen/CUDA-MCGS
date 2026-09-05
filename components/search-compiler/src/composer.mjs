import {
  canonicalIdentity,
  compareRaw,
  exactKeys,
  fail,
  ValidationError,
} from './validation.mjs';
import {
  buildExecutionPackage,
  composeSearchProgram,
  normalizeProgramGenerator,
  normalizeProgramPackageProfile,
} from './program-package.mjs';

const RESOLVED_INPUT_SCHEMA = 'cuda-mcgs.resolved-composer-input/0.2.0';
const SEARCH_IR_REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const PROGRAM_PACKAGE_SCHEMA = 'cuda-mcgs.program-package-profile/0.2.0';
const STATUS = 'accepted';
const PROFILE_TEMPLATE_FIELDS = [
  'schema',
  'representation',
  'status',
  'contract',
  'id',
  'version',
  'semanticEngine',
  'sourceUnits',
  'functions',
  'programUnits',
  'publicRequirements',
  'resources',
  'deliveries',
  'operations',
  'manifests',
  'provenance',
  'compatibility',
  'deletion',
];
const GENERATOR_FIELDS = [
  'id',
  'version',
  'revision',
  'language',
  'canonicalization',
  'maxSourceBytes',
  'maxFunctions',
  'maxCallDepth',
];
const REFERENCE_GENERATOR = Object.freeze({
  id: 'composer.reference-search-program',
  version: '0.1.0',
  revision: '711a0570115ecf08d005a07408ee77f3c6671cba',
  language: 'restricted-device-js',
  canonicalization: 'utf8-lf-source-units-by-js-code-unit-v1',
  maxSourceBytes: '1048576',
  maxFunctions: '1024',
  maxCallDepth: '64',
});
const RULES = Object.freeze([
  Object.freeze({ field: 'generator.maxCallDepth', key: 'maxCallDepth', reason: 'composer.reason.bounded-call-graph' }),
  Object.freeze({ field: 'generator.maxFunctions', key: 'maxFunctions', reason: 'composer.reason.bounded-function-set' }),
  Object.freeze({ field: 'generator.maxSourceBytes', key: 'maxSourceBytes', reason: 'composer.reason.bounded-source-snapshot' }),
]);

function assertString(value, pattern, code, label) {
  if (typeof value !== 'string' || !pattern.test(value)) fail(code, `${label} is invalid`);
}

function normalizeRule(input, index, policy, generator) {
  exactKeys(input, ['field', 'owner', 'reason', 'version', 'revision', 'selection', 'material', 'value'], 'COMPOSER_RULE_FIELDS', `resolution rule ${index}`);
  const definition = RULES.find(({ field }) => field === input.field);
  if (!definition) fail('COMPOSER_RULE_FIELD', `resolution rule ${index} names an unsupported field`);
  if (input.owner !== policy.id || input.version !== policy.version || input.revision !== policy.revision) {
    fail('COMPOSER_RULE_OWNER', `${input.field} provenance conflicts with its resolution policy`);
  }
  if (input.reason !== definition.reason) fail('COMPOSER_RULE_REASON', `${input.field} has an incompatible reason`);
  if (!['default-equivalent', 'explicit-override'].includes(input.selection)) {
    fail('COMPOSER_RULE_SELECTION', `${input.field} has an unsupported selection`);
  }
  if (input.material !== true) fail('COMPOSER_RULE_MATERIALITY', `${input.field} must remain identity-material`);
  const value = input.value;
  if (value !== generator[definition.key]) fail('COMPOSER_RULE_VALUE', `${input.field} differs from the resolved generator`);
  const expectedSelection = usesReferencePolicy(generator) ? 'default-equivalent' : 'explicit-override';
  if (input.selection !== expectedSelection) fail('COMPOSER_RULE_SELECTION', `${input.field} selection does not match its effective value`);
  return {
    field: input.field,
    owner: input.owner,
    reason: input.reason,
    version: input.version,
    revision: input.revision,
    selection: input.selection,
    material: true,
    value,
  };
}

function normalizeResolution(input, generator) {
  exactKeys(input, ['policy', 'rules'], 'COMPOSER_RESOLUTION_FIELDS', 'resolution');
  exactKeys(input.policy, ['id', 'version', 'revision'], 'COMPOSER_POLICY_FIELDS', 'resolution policy');
  const policy = {
    id: input.policy.id,
    version: input.policy.version,
    revision: input.policy.revision,
  };
  assertString(policy.id, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/, 'COMPOSER_POLICY_OWNER', 'resolution policy id');
  assertString(policy.version, /^[0-9]+\.[0-9]+\.[0-9]+$/, 'COMPOSER_POLICY_VERSION', 'resolution policy version');
  assertString(policy.revision, /^[0-9a-f]{40}$/, 'COMPOSER_POLICY_REVISION', 'resolution policy revision');
  if (policy.id !== generator.id || policy.version !== generator.version || policy.revision !== generator.revision) {
    fail('COMPOSER_POLICY_CONFLICT', 'resolution policy conflicts with the resolved generator owner/version/revision');
  }
  if (!Array.isArray(input.rules) || input.rules.length !== RULES.length) {
    fail('COMPOSER_RULE_COUNT', `resolution must contain exactly ${RULES.length} material rules`);
  }
  const rules = input.rules.map((rule, index) => normalizeRule(rule, index, policy, generator));
  rules.sort((left, right) => compareRaw(left.field, right.field));
  if (rules.some((rule, index) => rule.field !== RULES[index].field)) {
    fail('COMPOSER_RULE_COVERAGE', 'resolution rules must cover every material generator field exactly once');
  }
  return { policy, rules };
}

function identityReference(identity) {
  return { algorithm: identity.algorithm, sha256: identity.sha256 };
}

function usesReferencePolicy(generator) {
  return GENERATOR_FIELDS.every((field) => generator[field] === REFERENCE_GENERATOR[field]);
}

export function createResolvedComposerInput(profileTemplate, generatorInput) {
  const templateFields = [...PROFILE_TEMPLATE_FIELDS];
  if (Object.hasOwn(profileTemplate, 'sidebands')) templateFields.splice(templateFields.indexOf('deliveries'), 0, 'sidebands');
  exactKeys(profileTemplate, templateFields, 'COMPOSER_PROFILE_TEMPLATE_FIELDS', 'program-package profile template');
  if (profileTemplate.schema !== PROGRAM_PACKAGE_SCHEMA) fail('COMPOSER_PROFILE_SCHEMA', 'profile template schema is incompatible');
  const generator = normalizeProgramGenerator(generatorInput);
  const profile = structuredClone(profileTemplate);
  profile.generator = generator;
  const referencePolicy = usesReferencePolicy(generator);
  const rules = RULES.map(({ field, key, reason }) => ({
    field,
    owner: generator.id,
    reason,
    version: generator.version,
    revision: generator.revision,
    selection: referencePolicy ? 'default-equivalent' : 'explicit-override',
    material: true,
    value: generator[key],
  }));
  return normalizeResolvedComposerInput({
    schema: RESOLVED_INPUT_SCHEMA,
    representation: SEARCH_IR_REPRESENTATION,
    status: STATUS,
    profile,
    resolution: {
      policy: { id: generator.id, version: generator.version, revision: generator.revision },
      rules,
    },
  });
}

export function normalizeResolvedComposerInput(input) {
  exactKeys(input, ['schema', 'representation', 'status', 'profile', 'resolution'], 'COMPOSER_ROOT_FIELDS', 'resolved Composer input');
  if (input.schema !== RESOLVED_INPUT_SCHEMA || input.representation !== SEARCH_IR_REPRESENTATION) {
    fail('COMPOSER_SCHEMA', 'resolved Composer input schema/representation is incompatible');
  }
  if (input.status !== STATUS) fail('COMPOSER_STATUS', 'resolved Composer input must remain proposal evidence');
  const profileFields = [...PROFILE_TEMPLATE_FIELDS];
  if (Object.hasOwn(input.profile, 'sidebands')) profileFields.splice(profileFields.indexOf('deliveries'), 0, 'sidebands');
  exactKeys(input.profile, [...profileFields, 'generator'], 'COMPOSER_PROFILE_FIELDS', 'resolved program-package profile');
  if (input.profile.schema !== PROGRAM_PACKAGE_SCHEMA
      || input.profile.representation !== SEARCH_IR_REPRESENTATION
      || input.profile.status !== STATUS) {
    fail('COMPOSER_PROFILE_SCHEMA', 'resolved program-package profile schema/representation/status is incompatible');
  }
  const generator = normalizeProgramGenerator(input.profile.generator);
  const normalized = {
    schema: input.schema,
    representation: input.representation,
    status: input.status,
    profile: { ...structuredClone(input.profile), generator },
    resolution: normalizeResolution(input.resolution, generator),
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

export function composeResolvedEngine(resolvedInput, inspected, context) {
  const resolved = normalizeResolvedComposerInput(resolvedInput);
  const profile = normalizeProgramPackageProfile(resolved.normalized.profile, inspected, context);
  const program = composeSearchProgram(profile);
  const executionPackage = buildExecutionPackage(profile, program);
  const normalizedPublication = {
    schema: 'cuda-mcgs.composer-publication/0.2.0',
    status: STATUS,
    resolvedInput: identityReference(resolved.identity),
    compositionProfile: identityReference(profile.identity),
    searchProgram: identityReference(program.identity),
    executionPackage: identityReference(executionPackage.identity),
  };
  const publication = { normalized: normalizedPublication, identity: canonicalIdentity(normalizedPublication) };
  return { resolvedInput: resolved, compositionProfile: profile, searchProgram: program, executionPackage, publication };
}

export function tryComposeResolvedEngine(resolvedInput, inspected, context) {
  try {
    return { status: 'success', publication: composeResolvedEngine(resolvedInput, inspected, context), diagnostic: null };
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    return { status: 'failure', publication: null, diagnostic: { code: error.code, message: error.message } };
  }
}

export const composerConstants = Object.freeze({
  resolvedInputSchema: RESOLVED_INPUT_SCHEMA,
  representation: SEARCH_IR_REPRESENTATION,
  status: STATUS,
  profileTemplateFields: Object.freeze([...PROFILE_TEMPLATE_FIELDS]),
  generatorFields: Object.freeze([...GENERATOR_FIELDS]),
  referenceGenerator: REFERENCE_GENERATOR,
  rules: RULES,
});
