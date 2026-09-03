import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const PRE_ACCEPT_MAIN = '2a6bc8e1da9df85b3367f3f92bb3cec6f16ea241';
const QUALIFIED_REFERENCE = '0cd3dafdbfa683048b0a0f39de21a671fd9ef841';
const CUDA_JS_REVISION = 'bc2700f2e5c654567c2e17bf8d67b882351b8681';
const CUDA_JS_PACKAGE = 'cuda-js@0.1.0-alpha.17';

function fail(message) {
  throw new Error(`accept-122: ${message}`);
}

async function readText(relative) {
  return readFile(path.join(root, relative), 'utf8');
}

async function writeText(relative, content) {
  await writeFile(path.join(root, relative), content, 'utf8');
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function replaceExact(text, before, after, expected = 1, label = before) {
  const actual = count(text, before);
  if (actual !== expected) fail(`${label}: expected ${expected} occurrence(s), found ${actual}`);
  return text.split(before).join(after);
}

function sha256Source(text) {
  return createHash('sha256').update(text.replace(/\r\n?/g, '\n'), 'utf8').digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const specs = new Map([
  ['SPEC-0000', ['docs/specs/SPEC-0000-framework-requirements.md', '0.1.0']],
  ['SPEC-0003', ['docs/specs/SPEC-0003-search-stage-and-extension-surface.md', '0.3.0']],
  ['SPEC-0004', ['docs/specs/SPEC-0004-async-stage-channels.md', '0.3.0']],
  ['SPEC-0005', ['docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md', '0.4.0']],
  ['SPEC-0006', ['docs/specs/SPEC-0006-search-session-control-and-observation.md', '0.2.0']],
  ['SPEC-0007', ['docs/specs/SPEC-0007-domain-state-action-and-transition.md', '0.1.0']],
  ['SPEC-0008', ['docs/specs/SPEC-0008-search-policy-and-backup.md', '0.1.0']],
  ['SPEC-0009', ['docs/specs/SPEC-0009-evaluator-contract.md', '0.1.0']],
  ['SPEC-0010', ['docs/specs/SPEC-0010-graph-storage-and-reclamation.md', '0.1.0']],
  ['SPEC-0011', ['docs/specs/SPEC-0011-finite-search-resources.md', '0.1.0']],
  ['SPEC-0012', ['docs/specs/SPEC-0012-device-owned-search-progress.md', '0.1.0']],
  ['SPEC-0013', ['docs/specs/SPEC-0013-result-and-observation-publication.md', '0.1.0']],
]);

for (const [id, [relative, version]] of specs) {
  let text = await readText(relative);
  text = replaceExact(text, '**Status:** Proposal', '**Status:** Accepted', 1, `${id} status`);
  text = replaceExact(text, `**Draft version:** ${version}`, `**Version:** ${version}\n\n**Accepted:** 2026-09-03 under #122 ENGINE-CONTRACT-ACCEPTANCE-01.`, 1, `${id} version`);
  text = replaceExact(text, `CUDA-MCGS-${id}@${version}-draft`, `CUDA-MCGS-${id}@${version}`, 1, `${id} identity`);
  text = text.replaceAll('This proposal ', 'This specification ');
  text = text.replaceAll('this proposal ', 'this specification ');
  text = text.replaceAll('Proposal [`SPEC-', 'Accepted [`SPEC-');
  text = text.replaceAll('proposal [`SPEC-', 'accepted [`SPEC-');
  text = text.replaceAll('integrated proposals [`SPEC-', 'accepted [`SPEC-');
  text = text.replaceAll('integrated semantic owner proposals', 'accepted semantic owner specifications');
  text = text.replaceAll('Extension-substrate proposals', 'Accepted extension-substrate specifications');
  text = text.replaceAll('This specification cannot become accepted until:', 'Acceptance under #122 required:');
  text = text.replaceAll('Acceptance remains blocked until:', 'Acceptance under #122 required:');
  text = text.replaceAll('This specification is decision-complete only when review finds no unresolved', 'Acceptance review under #122 found no unresolved');
  text += `\n\n> **#122 acceptance record (2026-09-03):** The semantic/reference conditions in this specification were discharged by the exact #36 CUDA-free packet at \`${QUALIFIED_REFERENCE}\`, the #193 CUDA-JS ownership-boundary audit, and the atomic #122 acceptance review. Any clause that explicitly requires native compatible-pair, physical memory-ordering/concurrency, performance, platform-support, or downstream product evidence remains a separate deferred qualification gate and is not claimed by semantic acceptance.\n`;
  await writeText(relative, text);
}

// Promote the active Search IR 0.2 profile/program schemas from proposal evidence to accepted semantic/reference authority.
const schemaDir = path.join(root, 'schemas/search-ir/0.2.0');
for (const entry of await readdir(schemaDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.schema.json')) continue;
  const relative = `schemas/search-ir/0.2.0/${entry.name}`;
  let text = await readText(relative);
  text = text.replaceAll('proposal-evidence', 'accepted');
  text = text.replaceAll('proposal evidence', 'accepted semantic/reference contract');
  text = text.replaceAll('proposal contract set', 'accepted contract set');
  text = text.replaceAll('proposal requirement coverage', 'accepted requirement coverage');
  await writeText(relative, text);
}

// Contract catalog becomes accepted authority and stops using planning/draft field names.
const contractSchemaPath = 'schemas/search-ir/0.2.0/contract-set.schema.json';
const contractSchema = JSON.parse(await readText(contractSchemaPath));
contractSchema.title = 'CUDA-MCGS Search IR 0.2.0 accepted contract set';
contractSchema.description = 'Closed catalog of the accepted Search IR foundation and accepted universal CUDA-MCGS contracts consumed by Search IR 0.2.0.';
contractSchema.properties.status.const = 'accepted';
const contractDef = contractSchema.$defs.contract;
contractDef.required = contractDef.required.map((key) => key === 'draftVersion' ? 'version' : key === 'plannedLeaf' ? 'evidenceOwner' : key);
contractDef.properties.specificationIdentity.pattern = '^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\\.[0-9]+\\.[0-9]+$';
contractDef.properties.version = contractDef.properties.draftVersion;
delete contractDef.properties.draftVersion;
contractDef.properties.status.const = 'Accepted';
contractDef.properties.evidenceOwner = contractDef.properties.plannedLeaf;
delete contractDef.properties.plannedLeaf;
await writeText(contractSchemaPath, stableJson(contractSchema));

const contractSetPath = 'schemas/search-ir/0.2.0/contract-set.json';
const contractSet = JSON.parse(await readText(contractSetPath));
if (contractSet.contracts.length !== 12 || contractSet.totals.requirements !== 989) fail('contract set must remain 12 contracts / 989 requirements');
contractSet.status = 'accepted';
contractSet.authorityBaseline = PRE_ACCEPT_MAIN;
for (const contract of contractSet.contracts) {
  const spec = specs.get(contract.id);
  if (!spec) fail(`unexpected contract ${contract.id}`);
  const [sourcePath, version] = spec;
  if (contract.sourcePath !== sourcePath || contract.draftVersion !== version || contract.status !== 'Proposal') fail(`${contract.id} catalog metadata drifted before acceptance`);
  contract.version = contract.draftVersion;
  delete contract.draftVersion;
  contract.specificationIdentity = contract.specificationIdentity.replace(/-draft$/, '');
  contract.status = 'Accepted';
  contract.evidenceOwner = contract.plannedLeaf;
  delete contract.plannedLeaf;
  contract.sha256 = sha256Source(await readText(sourcePath));
}
await writeText(contractSetPath, stableJson(contractSet));

// Requirement coverage records accepted semantic/reference evidence while preserving exactly 52 native-deferred routes.
const coverageSchemaPath = 'schemas/search-ir/0.2.0/requirement-coverage.schema.json';
const coverageSchema = JSON.parse(await readText(coverageSchemaPath));
coverageSchema.title = 'CUDA-MCGS Search IR 0.2.0 accepted requirement coverage';
const coverageDef = coverageSchema.$defs.coverage;
coverageDef.required = coverageDef.required.map((key) => key === 'plannedLeaf' ? 'evidenceOwner' : key);
coverageDef.properties.evidenceOwner = coverageDef.properties.plannedLeaf;
delete coverageDef.properties.plannedLeaf;
coverageDef.properties.currentDisposition.enum = ['accepted-reference'];
coverageDef.properties.completionStatus.enum = ['accepted'];
const classificationDef = coverageSchema.$defs.classification;
classificationDef.required = classificationDef.required.map((key) => key === 'plannedEvidenceOwner' ? 'evidenceOwner' : key);
classificationDef.properties.evidenceOwner = classificationDef.properties.plannedEvidenceOwner;
delete classificationDef.properties.plannedEvidenceOwner;
classificationDef.properties.evidenceStatus.enum = ['accepted-reference', 'deferred-native'];
await writeText(coverageSchemaPath, stableJson(coverageSchema));

const coveragePath = 'schemas/search-ir/0.2.0/requirement-coverage.json';
const coverage = JSON.parse(await readText(coveragePath));
for (const route of coverage.contracts) {
  route.evidenceOwner = route.plannedLeaf;
  delete route.plannedLeaf;
  route.currentDisposition = 'accepted-reference';
  route.completionStatus = 'accepted';
}
let nativeDeferred = 0;
for (const classification of coverage.classifications) {
  classification.evidenceOwner = classification.plannedEvidenceOwner;
  delete classification.plannedEvidenceOwner;
  const native = classification.primaryDisposition === 'native-compatible-pair-qualification';
  classification.evidenceStatus = native ? 'deferred-native' : 'accepted-reference';
  if (native) nativeDeferred += classification.requirementCount;
  if (!native) classification.evidenceRefs = classification.evidenceRefs.filter((reference) => !reference.startsWith('planned:'));
  const proof = native ? 'proof:native-deferred-122' : 'proof:engine-contract-acceptance-01';
  if (!classification.evidenceRefs.includes(proof)) classification.evidenceRefs.push(proof);
  classification.evidenceRefs.sort();
}
if (nativeDeferred !== 52) fail(`expected exactly 52 native-deferred requirements, found ${nativeDeferred}`);
if (coverage.totals.classified !== 989 || coverage.totals.pending !== 0) fail('coverage totals no longer prove 989 classified / 0 pending');
await writeText(coveragePath, stableJson(coverage));

// Program/package schema owns restricted Device-JS composition and MCGS-selected policy, not CUDA-JS request vocabulary.
const profileSchemaPath = 'schemas/search-ir/0.2.0/program-package-profile.schema.json';
const profileSchema = JSON.parse(await readText(profileSchemaPath));
profileSchema.title = 'CUDA-MCGS deterministic accepted Search Program composition profile';
profileSchema.properties.status.const = 'accepted';
const functionDef = profileSchema.$defs.function;
functionDef.required = functionDef.required.map((key) => key === 'kind' ? 'executionRole' : key);
functionDef.properties.executionRole = {
  enum: ['runtime-entry', 'device-callable'],
  description: 'CUDA-MCGS Search Program callability role. integration.cuda-js maps this role to a supported public CUDA-JS program/function form; these values are not CUDA-JS API vocabulary.'
};
delete functionDef.properties.kind;
const resourceDef = profileSchema.$defs.resource;
resourceDef.required = resourceDef.required.map((key) => key === 'kind' ? 'materialization' : key);
resourceDef.properties.materialization = {
  enum: ['resident-storage', 'semantic-only'],
  description: 'MCGS resource materialization requirement. The CUDA-JS adapter selects and validates actual lower allocation/view mechanisms.'
};
delete resourceDef.properties.kind;
const operationDef = profileSchema.$defs.operation;
operationDef.required = operationDef.required.filter((key) => key !== 'lifecycle');
delete operationDef.properties.lifecycle;
await writeText(profileSchemaPath, stableJson(profileSchema));

// Execution package carries MCGS-owned adapter requirements; it is deliberately not a CUDA-JS request schema.
const executionSchemaPath = 'schemas/search-ir/0.2.0/execution-package.schema.json';
const executionSchema = JSON.parse(await readText(executionSchemaPath));
executionSchema.title = 'CUDA-MCGS accepted execution package and CUDA-JS adapter requirements';
executionSchema.properties.status.const = 'accepted';
executionSchema.required = executionSchema.required.map((key) => key === 'cudaJs' ? 'cudaJsAdapter' : key);
executionSchema.properties.program.properties.functions.items = { '$ref': '#/$defs/publicFunction' };
const oldCudaJs = executionSchema.properties.cudaJs;
if (!oldCudaJs) fail('execution-package cudaJs proposal projection is missing');
delete executionSchema.properties.cudaJs;
executionSchema.properties.cudaJsAdapter = {
  type: 'object',
  additionalProperties: false,
  required: ['schema', 'publicContracts', 'searchProgram', 'resourceRequirements', 'operationRequirements', 'searchLifecycle'],
  description: 'MCGS-owned input to integration.cuda-js. Actual CUDA-JS request objects, field names, allowed variants, finite lower limits and lower resource lifecycle are validated/constructed by the adapter from the selected public CUDA-JS package.',
  properties: {
    schema: { const: 'cuda-mcgs.cuda-js-adapter-requirements/0.2.0' },
    publicContracts: { type: 'array', minItems: 2, items: { '$ref': 'primitives.schema.json#/$defs/schemaReference' } },
    searchProgram: {
      type: 'object', additionalProperties: false, required: ['source', 'functions'],
      properties: { source: { type: 'string', minLength: 1 }, functions: { type: 'array', minItems: 1, items: { '$ref': '#/$defs/publicFunction' } } }
    },
    resourceRequirements: { type: 'array', items: { '$ref': '#/$defs/resourceRequirement' } },
    operationRequirements: { type: 'array', minItems: 1, items: { '$ref': '#/$defs/operationRequirement' } },
    searchLifecycle: {
      type: 'object', additionalProperties: false, required: ['ignition', 'cancellation', 'completion'],
      properties: {
        ignition: { const: 'device-owned' },
        cancellation: { const: 'bounded-external-intent' },
        completion: { const: 'device-owned-closure' }
      }
    }
  }
};
const publicFunction = executionSchema.$defs.publicFunction;
publicFunction.required = publicFunction.required.map((key) => key === 'kind' ? 'executionRole' : key);
publicFunction.properties.executionRole = { enum: ['runtime-entry', 'device-callable'] };
delete publicFunction.properties.kind;
executionSchema.$defs.resourceRequirement = {
  type: 'object', additionalProperties: false,
  required: ['id', 'byteLength', 'alignment', 'memorySpaces', 'accessRequirements'],
  properties: {
    id: { type: 'string', pattern: '^resource-[0-9]+$' },
    byteLength: { '$ref': 'primitives.schema.json#/$defs/decimalUint' },
    alignment: { '$ref': 'primitives.schema.json#/$defs/decimalUint' },
    memorySpaces: { type: 'array', minItems: 1, items: { enum: ['host-admission', 'device-search', 'device-publication', 'durable'] } },
    accessRequirements: { type: 'array', minItems: 1, items: { enum: ['read', 'write', 'atomic', 'publish'] } }
  }
};
executionSchema.$defs.operationRequirement = {
  type: 'object', additionalProperties: false,
  required: ['id', 'function', 'bindings', 'launchPolicy'],
  properties: {
    id: { type: 'string', pattern: '^operation-[0-9]+$' },
    function: { type: 'string', pattern: '^[A-Za-z_$][A-Za-z0-9_$]*$' },
    bindings: { type: 'array', items: { '$ref': '#/$defs/publicBinding' } },
    launchPolicy: {
      type: 'object', additionalProperties: false,
      required: ['grid', 'block', 'dynamicSharedBytes', 'maxPending'],
      properties: {
        grid: { '$ref': 'program-package-profile.schema.json#/$defs/dim3' },
        block: { '$ref': 'program-package-profile.schema.json#/$defs/dim3' },
        dynamicSharedBytes: { '$ref': 'primitives.schema.json#/$defs/decimalUint' },
        maxPending: { '$ref': 'primitives.schema.json#/$defs/decimalUint' }
      }
    }
  }
};
delete executionSchema.$defs.publicResource;
delete executionSchema.$defs.publicOperation;
await writeText(executionSchemaPath, stableJson(executionSchema));

// Compatible-pair remains evidence, not accepted native proof.
const pairSchemaPath = 'schemas/search-ir/0.2.0/compatible-pair-record.schema.json';
let pairSchemaText = await readText(pairSchemaPath);
pairSchemaText = pairSchemaText.replace('exact compatible-pair record accepted semantic/reference contract', 'exact compatible-pair evidence record');
await writeText(pairSchemaPath, pairSchemaText);

// Update all active Composer/reference code and fixture status literals; semantic terms such as evaluator proposal-only are intentionally untouched.
async function walk(relative, visit) {
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const child = `${relative}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name !== 'build') await walk(child, visit);
    } else await visit(child);
  }
}
await walk('experiments/search-ir-composer-reference', async (relative) => {
  if (!relative.endsWith('.mjs') && !relative.endsWith('.json')) return;
  let text = await readText(relative);
  text = text.replaceAll("'proposal-evidence'", "'accepted'");
  text = text.replaceAll('"proposal-evidence"', '"accepted"');
  await writeText(relative, text);
});

// Catalog normalizer: accepted metadata and evidence-state enforcement.
const catalogPath = 'experiments/search-ir-composer-reference/src/catalog.mjs';
let catalog = await readText(catalogPath);
catalog = catalog.replaceAll('plannedEvidenceOwner', 'evidenceOwner').replaceAll('plannedLeaf', 'evidenceOwner');
catalog = replaceExact(catalog,
  "exactKeys(input, ['id', 'specificationIdentity', 'draftVersion', 'status', 'semanticOwner', 'sourcePath', 'sha256', 'requirementPrefix', 'requirementCount', 'evidenceOwner'], 'CATALOG_CONTRACT_FIELDS', `contract ${index}`);",
  "exactKeys(input, ['id', 'specificationIdentity', 'version', 'status', 'semanticOwner', 'sourcePath', 'sha256', 'requirementPrefix', 'requirementCount', 'evidenceOwner'], 'CATALOG_CONTRACT_FIELDS', `contract ${index}`);",
  1, 'catalog contract keys');
catalog = replaceExact(catalog,
  "assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\\.[0-9]+\\.[0-9]+-draft$/, 'CATALOG_SPEC_IDENTITY', `${input.id} specificationIdentity`);\n  assertString(input.draftVersion, /^[0-9]+\\.[0-9]+\\.[0-9]+$/, 'CATALOG_VERSION', `${input.id} draftVersion`);\n  if (input.status !== 'Proposal') fail('CATALOG_STATUS', `${input.id} must remain Proposal`);",
  "assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\\.[0-9]+\\.[0-9]+$/, 'CATALOG_SPEC_IDENTITY', `${input.id} specificationIdentity`);\n  assertString(input.version, /^[0-9]+\\.[0-9]+\\.[0-9]+$/, 'CATALOG_VERSION', `${input.id} version`);\n  if (input.status !== 'Accepted') fail('CATALOG_STATUS', `${input.id} must be Accepted`);",
  1, 'catalog accepted metadata');
catalog = catalog.replaceAll('draftVersion: input.draftVersion', 'version: input.version');
catalog = replaceExact(catalog, "if (input.status !== 'accepted') fail('CATALOG_STATUS', 'contract set must remain proposal evidence');", "if (input.status !== 'accepted') fail('CATALOG_STATUS', 'contract set must be accepted authority');", 1, 'catalog root status');
catalog = catalog.replace('exactly twelve proposal contracts', 'exactly twelve accepted contracts');
catalog = replaceExact(catalog,
  "const validRouteState = (input.currentDisposition === 'pending-owner-classification' && input.completionStatus === 'pending')\n    || (input.currentDisposition === 'section-classified' && input.completionStatus === 'in-progress');\n  if (!validRouteState) {\n    fail('COVERAGE_PREMATURE_COMPLETION', `${input.contract} has an invalid route-level classification state`);\n  }",
  "if (input.currentDisposition !== 'accepted-reference' || input.completionStatus !== 'accepted') {\n    fail('COVERAGE_ACCEPTANCE_STATE', `${input.contract} is not accepted reference authority`);\n  }",
  1, 'coverage accepted route state');
catalog = replaceExact(catalog,
  "assertString(input.evidenceStatus, /^(?:partial|pending|deferred)$/, 'COVERAGE_CLASSIFICATION_STATUS', `${input.requirementPrefix} evidenceStatus`);",
  "assertString(input.evidenceStatus, /^(?:accepted-reference|deferred-native)$/, 'COVERAGE_CLASSIFICATION_STATUS', `${input.requirementPrefix} evidenceStatus`);\n  const expectedEvidenceStatus = input.primaryDisposition === 'native-compatible-pair-qualification' ? 'deferred-native' : 'accepted-reference';\n  if (input.evidenceStatus !== expectedEvidenceStatus) fail('COVERAGE_CLASSIFICATION_STATUS', `${input.requirementPrefix} evidence status does not match its final disposition`);",
  1, 'coverage final evidence state');
catalog = catalog.replace("/^\\*\\*Draft version:\\*\\* ([^\\r\\n]+)$/m", "/^\\*\\*Version:\\*\\* ([^\\r\\n]+)$/m");
catalog = catalog.replaceAll('const draftVersion = metadata', 'const version = metadata').replaceAll('draftVersion !== contract.draftVersion', 'version !== contract.version');
await writeText(catalogPath, catalog);

// Program/package normalizer: replace lower request vocabulary with MCGS-owned source/policy roles and adapter requirements.
const programPath = 'experiments/search-ir-composer-reference/src/program-package.mjs';
let program = await readText(programPath);
program = program.replaceAll('CUDA_JS_PROJECTION_SCHEMA', 'CUDA_JS_ADAPTER_REQUIREMENTS_SCHEMA');
program = program.replaceAll("'cuda-mcgs.cuda-js-request-projection/0.2.0'", "'cuda-mcgs.cuda-js-adapter-requirements/0.2.0'");
program = program.replaceAll('DEVICE_TYPES', 'RESTRICTED_SOURCE_TYPES');
program = replaceExact(program, "exactKeys(input, ['name', 'kind', 'parameters', 'returns', 'sourceUnit', 'ownerProfile', 'semanticRole', 'calls', 'helpers'], 'COMPOSE_FUNCTION_FIELDS', `function ${index}`);", "exactKeys(input, ['name', 'executionRole', 'parameters', 'returns', 'sourceUnit', 'ownerProfile', 'semanticRole', 'calls', 'helpers'], 'COMPOSE_FUNCTION_FIELDS', `function ${index}`);", 1, 'function keys');
program = replaceExact(program, "const kind = assertEnum(input.kind, ['kernel', 'device'], 'COMPOSE_FUNCTION_KIND', `${input.name} kind`);", "const executionRole = assertEnum(input.executionRole, ['runtime-entry', 'device-callable'], 'COMPOSE_FUNCTION_ROLE', `${input.name} executionRole`);", 1, 'function execution role');
program = replaceExact(program, "if (!RETURN_TYPES.has(input.returns) || (kind === 'kernel' && input.returns !== 'void')) fail('COMPOSE_FUNCTION_RETURN', `${input.name} has an incompatible return type`);\n  if (kind === 'kernel' && parameters.some(({ type }) => type === 'bool')) fail('COMPOSE_PARAMETER_TYPE', `${input.name} uses unsupported bool kernel ABI`);", "if (!RETURN_TYPES.has(input.returns) || (executionRole === 'runtime-entry' && input.returns !== 'void')) fail('COMPOSE_FUNCTION_RETURN', `${input.name} has an incompatible MCGS Search Program return contract`);", 1, 'function lower ABI removal');
program = replaceExact(program, "return { name: input.name, kind, parameters, returns: input.returns, sourceUnit: input.sourceUnit, ownerProfile: input.ownerProfile, semanticRole: input.semanticRole, calls, helpers };", "return { name: input.name, executionRole, parameters, returns: input.returns, sourceUnit: input.sourceUnit, ownerProfile: input.ownerProfile, semanticRole: input.semanticRole, calls, helpers };", 1, 'function normalized role');
program = program.replaceAll("target.kind === 'kernel'", "target.executionRole === 'runtime-entry'");
program = replaceExact(program, "exactKeys(input, ['id', 'ownerProfile', 'providerRequirement', 'kind', 'unit', 'capacity', 'alignment', 'memorySpaces', 'access'], 'COMPOSE_RESOURCE_FIELDS', `resource ${index}`);", "exactKeys(input, ['id', 'ownerProfile', 'providerRequirement', 'materialization', 'unit', 'capacity', 'alignment', 'memorySpaces', 'access'], 'COMPOSE_RESOURCE_FIELDS', `resource ${index}`);", 1, 'resource keys');
program = replaceExact(program, "const kind = assertEnum(input.kind, ['device-memory', 'semantic-only'], 'COMPOSE_RESOURCE_KIND', `${input.id} kind`);\n  const expectedKind = provider.unit === 'bytes' && provider.memorySpaces.some((space) => ['device-search', 'device-publication'].includes(space)) ? 'device-memory' : 'semantic-only';\n  if (kind !== expectedKind || input.unit !== provider.unit || input.capacity !== provider.capacity || input.alignment !== provider.alignment)", "const materialization = assertEnum(input.materialization, ['resident-storage', 'semantic-only'], 'COMPOSE_RESOURCE_MATERIALIZATION', `${input.id} materialization`);\n  const expectedMaterialization = provider.unit === 'bytes' && provider.memorySpaces.some((space) => ['device-search', 'device-publication'].includes(space)) ? 'resident-storage' : 'semantic-only';\n  if (materialization !== expectedMaterialization || input.unit !== provider.unit || input.capacity !== provider.capacity || input.alignment !== provider.alignment)", 1, 'resource materialization');
program = program.replace("return { id: input.id, ownerProfile: input.ownerProfile, providerRequirement: input.providerRequirement, kind, unit: input.unit", "return { id: input.id, ownerProfile: input.ownerProfile, providerRequirement: input.providerRequirement, materialization, unit: input.unit");
program = program.replaceAll("resource.kind !== 'device-memory'", "resource.materialization !== 'resident-storage'");
program = replaceExact(program, "exactKeys(input, ['id', 'entryPoint', 'bindings', 'grid', 'block', 'dynamicSharedBytes', 'maxPending', 'lifecycle'], 'COMPOSE_OPERATION_FIELDS', `operation ${index}`);", "exactKeys(input, ['id', 'entryPoint', 'bindings', 'grid', 'block', 'dynamicSharedBytes', 'maxPending'], 'COMPOSE_OPERATION_FIELDS', `operation ${index}`);", 1, 'operation keys');
program = program.replaceAll("entryPoint.kind !== 'kernel'", "entryPoint.executionRole !== 'runtime-entry'");
program = program.replace("maxPending: positiveDecimal(input.maxPending, 'COMPOSE_OPERATION_PENDING', `${input.id} maxPending`), lifecycle: normalizeSchemaReference(input.lifecycle, `${input.id} lifecycle`) }", "maxPending: positiveDecimal(input.maxPending, 'COMPOSE_OPERATION_PENDING', `${input.id} maxPending`) }");
program = program.replaceAll("functions.filter(({ kind }) => kind === 'kernel')", "functions.filter(({ executionRole }) => executionRole === 'runtime-entry')");
program = program.replaceAll("map(({ name, kind, parameters, returns }) => ({ name, kind, parameters", "map(({ name, executionRole, parameters, returns }) => ({ name, executionRole, parameters");
program = program.replaceAll("lifecycle: { ...entry.lifecycle }", "");
program = program.replaceAll("filter(({ kind }) => kind === 'device-memory')", "filter(({ materialization }) => materialization === 'resident-storage')");
program = program.replaceAll("kind: 'device-memory', byteLength: entry.capacity, alignment: entry.alignment, access: [...entry.access]", "byteLength: entry.capacity, alignment: entry.alignment, memorySpaces: [...entry.memorySpaces], accessRequirements: [...entry.access]");
program = program.replaceAll("grid: [...entry.grid], block: [...entry.block], dynamicSharedBytes: entry.dynamicSharedBytes, maxPending: entry.maxPending,", "launchPolicy: { grid: [...entry.grid], block: [...entry.block], dynamicSharedBytes: entry.dynamicSharedBytes, maxPending: entry.maxPending },");
program = replaceExact(program, 'function projectCudaJsRequest(program) {', 'function buildCudaJsAdapterRequirements(program) {', 1, 'adapter projection function');
program = replaceExact(program,
  "return {\n    schema: CUDA_JS_ADAPTER_REQUIREMENTS_SCHEMA,\n    requirements: program.publicRequirements.map(({ contract }) => ({ ...contract })),\n    deviceProgram: { source: program.source, functions: program.functions.map(({ name, executionRole, parameters, returns }) => ({ name, executionRole, parameters: parameters.map((parameter) => ({ ...parameter })), returns })) },\n    resources: resources.map((entry, index) => ({ id: `resource-${index}`, byteLength: entry.capacity, alignment: entry.alignment, memorySpaces: [...entry.memorySpaces], accessRequirements: [...entry.access] })),\n    operations,\n    lifecycle: { compile: 'pre-ignition', allocate: 'pre-ignition', load: 'pre-ignition', admit: 'pre-ignition', ignite: 'single-device-owned-transition', cancel: 'public-lifecycle-operation', complete: 'public-lifecycle-operation', teardown: 'public-lifecycle-operation' },\n  };",
  "return {\n    schema: CUDA_JS_ADAPTER_REQUIREMENTS_SCHEMA,\n    publicContracts: program.publicRequirements.map(({ contract }) => ({ ...contract })),\n    searchProgram: { source: program.source, functions: program.functions.map(({ name, executionRole, parameters, returns }) => ({ name, executionRole, parameters: parameters.map((parameter) => ({ ...parameter })), returns })) },\n    resourceRequirements: resources.map((entry, index) => ({ id: `resource-${index}`, byteLength: entry.capacity, alignment: entry.alignment, memorySpaces: [...entry.memorySpaces], accessRequirements: [...entry.access] })),\n    operationRequirements: operations,\n    searchLifecycle: { ignition: 'device-owned', cancellation: 'bounded-external-intent', completion: 'device-owned-closure' },\n  };",
  1, 'adapter requirements body');
program = program.replaceAll('cudaJs: projectCudaJsRequest(program)', 'cudaJsAdapter: buildCudaJsAdapterRequirements(program)');
program = program.replaceAll('packageResult.normalized.cudaJs.operations', 'packageResult.normalized.cudaJsAdapter.operationRequirements');
program = program.replaceAll('packageResult.normalized.cudaJs.resources', 'packageResult.normalized.cudaJsAdapter.resourceRequirements');
program = program.replaceAll('packageResult.normalized.cudaJs.requirements', 'packageResult.normalized.cudaJsAdapter.publicContracts');
program = program.replaceAll('cudaJsProjectionSchema: CUDA_JS_ADAPTER_REQUIREMENTS_SCHEMA', 'cudaJsAdapterRequirementsSchema: CUDA_JS_ADAPTER_REQUIREMENTS_SCHEMA');
await writeText(programPath, program);

// Fixtures follow the MCGS-owned vocabulary and current lower public package identity.
const fixturePath = 'experiments/search-ir-composer-reference/src/program-package-fixtures.mjs';
let fixture = await readText(fixturePath);
fixture = fixture.replace("const CUDA_JS_REVISION = '05008fb988558e909cb3802fa12a73d612e70bf0';", `const CUDA_JS_REVISION = '${CUDA_JS_REVISION}';`);
fixture = fixture.replace("const CUDA_JS_PACKAGE = 'cuda-js@0.1.0-alpha.7';", `const CUDA_JS_PACKAGE = '${CUDA_JS_PACKAGE}';`);
fixture = fixture.replaceAll("kind: 'device'", "executionRole: 'device-callable'");
fixture = fixture.replaceAll("kind: 'kernel'", "executionRole: 'runtime-entry'");
fixture = fixture.replaceAll("kind: provider.unit === 'bytes' && provider.memorySpaces.some((space) => ['device-search', 'device-publication'].includes(space)) ? 'device-memory' : 'semantic-only'", "materialization: provider.unit === 'bytes' && provider.memorySpaces.some((space) => ['device-search', 'device-publication'].includes(space)) ? 'resident-storage' : 'semantic-only'");
fixture = fixture.replaceAll("find(({ kind }) => kind === 'device-memory')", "find(({ materialization }) => materialization === 'resident-storage')");
fixture = fixture.replaceAll('has no device-memory resource', 'has no resident-storage resource');
fixture = fixture.replace(", maxPending: '1', lifecycle: schemaReference('cuda-js.operation-lifecycle') }],", ", maxPending: '1' }],");
fixture = fixture.replaceAll('packageResult.normalized.cudaJs.resources', 'packageResult.normalized.cudaJsAdapter.resourceRequirements');
fixture = fixture.replaceAll('packageResult.normalized.cudaJs.operations', 'packageResult.normalized.cudaJsAdapter.operationRequirements');
fixture = fixture.replaceAll('packageResult.normalized.cudaJs.requirements', 'packageResult.normalized.cudaJsAdapter.publicContracts');
fixture = fixture.replaceAll("package: 'cuda-mcgs@0.0.0-proposal'", "package: 'cuda-mcgs@0.2.0-semantic-reference'");
await writeText(fixturePath, fixture);

// Acceptance-specific Composer falsifiers replace tests that previously asserted the local lower request projection.
const runPath = 'experiments/search-ir-composer-reference/run.mjs';
let run = await readText(runPath);
run = run.replaceAll('plannedLeaf', 'evidenceOwner').replaceAll('plannedEvidenceOwner', 'evidenceOwner');
run = run.replaceAll("status === 'Proposal' && specificationIdentity.endsWith('-draft')", "status === 'Accepted' && !specificationIdentity.endsWith('-draft')");
run = run.replace("await runCase('proposal-metadata-closed'", "await runCase('accepted-metadata-closed'");
run = run.replaceAll("mutated.contracts[0].draftVersion = '9.9.9';", "mutated.contracts[0].version = '9.9.9';");
run = run.replaceAll("mutated.contracts[0].specificationIdentity = 'CUDA-MCGS-SPEC-0000@9.9.9-draft';", "mutated.contracts[0].specificationIdentity = 'CUDA-MCGS-SPEC-0000@9.9.9';");
run = replaceExact(run,
  "await runCase('reject-premature-coverage-completion', () => {\n  const mutated = clone(coverageInput);\n  mutated.contracts[0].currentDisposition = 'structural-schema';\n  mutated.contracts[0].completionStatus = 'complete';\n  assert.throws(() => normalizeRequirementCoverage(mutated), { code: 'COVERAGE_PREMATURE_COMPLETION' });\n});",
  "await runCase('reject-nonaccepted-coverage-state', () => {\n  const mutated = clone(coverageInput);\n  mutated.contracts[0].currentDisposition = 'section-classified';\n  mutated.contracts[0].completionStatus = 'in-progress';\n  assert.throws(() => normalizeRequirementCoverage(mutated), { code: 'COVERAGE_ACCEPTANCE_STATE' });\n});",
  1, 'coverage state falsifier');
const oldCoverageCaseStart = "await runCase('coverage-honest-classification-progress', () => {";
const oldCoverageCaseEnd = "\n});\n\nawait runCase('catalog-identity-content-sensitive'";
const start = run.indexOf(oldCoverageCaseStart);
const end = run.indexOf(oldCoverageCaseEnd, start);
if (start < 0 || end < 0) fail('coverage test block not found');
const newCoverageCase = `await runCase('coverage-accepted-reference-with-native-deferred', () => {\n  assert.equal(inspected.requirements.filter(({ classificationStatus }) => classificationStatus === 'classified').length, 989);\n  assert.equal(inspected.requirements.filter(({ classificationStatus }) => classificationStatus === 'pending').length, 0);\n  const native = inspected.requirements.filter(({ primaryDisposition, evidenceStatus }) => primaryDisposition === 'native-compatible-pair-qualification' && evidenceStatus === 'deferred-native');\n  assert.equal(native.length, 52);\n  assert.equal(inspected.requirements.filter(({ primaryDisposition, evidenceStatus }) => primaryDisposition !== 'native-compatible-pair-qualification' && evidenceStatus === 'accepted-reference').length, 937);\n});`;
run = `${run.slice(0, start)}${newCoverageCase}${run.slice(end + '\n});'.length)}`;
run = run.replaceAll("mutated.functions.find(({ kind }) => kind === 'kernel')", "mutated.functions.find(({ executionRole }) => executionRole === 'runtime-entry')");
run = run.replaceAll("bounded.functions.filter(({ kind }) => kind === 'device')", "bounded.functions.filter(({ executionRole }) => executionRole === 'device-callable')");
run = run.replaceAll("mutated.functions.find(({ kind }) => kind === 'device')", "mutated.functions.find(({ executionRole }) => executionRole === 'device-callable')");
run = run.replace("'reject-kernel-call-target'", "'reject-runtime-entry-call-target'");
const projectionStart = run.indexOf("await runCase('deletion-matrix-public-cuda-js-contract-only'");
const projectionEnd = run.indexOf('\nlet realizationOne;', projectionStart);
if (projectionStart < 0 || projectionEnd < 0) fail('old CUDA-JS projection test block not found');
const adapterTests = `await runCase('deletion-matrix-adapter-requirements-only', () => {\n  for (const row of deletionMatrix) {\n    for (const composition of [row.beforeComposition, row.afterComposition]) {\n      const adapter = composition.executionPackage.normalized.cudaJsAdapter;\n      assert.equal(adapter.schema, 'cuda-mcgs.cuda-js-adapter-requirements/0.2.0');\n      assert.deepEqual(adapter.publicContracts, composition.searchProgram.normalized.publicRequirements.map(({ contract }) => contract));\n      assert.equal(JSON.stringify(adapter).includes('semanticOwner'), false);\n      assert.equal(JSON.stringify(adapter).includes('ownerProfile'), false);\n    }\n  }\n});\n\nawait runCase('adapter-resource-requirements-remain-mcgs-owned', () => {\n  const profileResources = programPackageProfiles[1].normalized.resources.filter(({ materialization }) => materialization === 'resident-storage');\n  const projected = executionPackages[1].normalized.cudaJsAdapter.resourceRequirements;\n  assert.equal(projected.length, profileResources.length);\n  assert(projected.every(({ id }) => /^resource-[0-9]+$/.test(id)));\n  assert(projected.every((entry) => !Object.hasOwn(entry, 'kind')));\n});\n\nawait runCase('adapter-operation-policy-is-not-lower-request', () => {\n  const projected = executionPackages[1].normalized.cudaJsAdapter.operationRequirements;\n  assert.deepEqual(projected.map(({ id }) => id), ['operation-0']);\n  assert.equal(projected[0].function, 'engine_step');\n  assert.deepEqual(Object.keys(projected[0].launchPolicy).sort(), ['block', 'dynamicSharedBytes', 'grid', 'maxPending']);\n});\n\nawait runCase('adapter-requirements-do-not-own-lower-lifecycle', () => {\n  const adapter = executionPackages[1].normalized.cudaJsAdapter;\n  assert.deepEqual(adapter.searchLifecycle, { ignition: 'device-owned', cancellation: 'bounded-external-intent', completion: 'device-owned-closure' });\n  const serialized = JSON.stringify(adapter);\n  for (const forbidden of ['compile', 'allocate', 'load', 'teardown', 'device-memory', 'cuda-js-request-projection']) assert.equal(serialized.includes(forbidden), false);\n});\n\nawait runCase('restricted-source-role-is-mcgs-vocabulary', () => {\n  const request = executionPackages[1].normalized.cudaJsAdapter.searchProgram;\n  assert.deepEqual(Object.keys(request).sort(), ['functions', 'source']);\n  assert(request.functions.every((entry) => Object.keys(entry).sort().join(',') === 'executionRole,name,parameters,returns'));\n  assert(request.functions.some(({ executionRole }) => executionRole === 'runtime-entry'));\n});\n`;
run = `${run.slice(0, projectionStart)}${adapterTests}${run.slice(projectionEnd)}`;
run = run.replaceAll("'Proposal contract catalog plus shared representation primitives", "'Accepted contract catalog plus shared representation primitives");
run = run.replaceAll("'The framework, domain, graph, policy, evaluator, resource, progress, output, Search Session and Search Stage requirements have final evidence lanes but remain partial, pending or deferred; no proposal contract is accepted by this capsule.'", "'All 989 semantic requirements are accepted-reference or explicitly deferred-native; exactly 52 native compatible-pair requirements remain deferred and no native claim is made by this capsule.'");
await writeText(runPath, run);

// Search Program schema and all copied function views use the MCGS execution role.
const searchProgramSchemaPath = 'schemas/search-ir/0.2.0/search-program.schema.json';
const searchProgramSchema = JSON.parse(await readText(searchProgramSchemaPath));
searchProgramSchema.title = 'CUDA-MCGS canonical accepted restricted Device-JS Search Program';
searchProgramSchema.properties.status.const = 'accepted';
await writeText(searchProgramSchemaPath, stableJson(searchProgramSchema));

// Specification index: accepted semantics are authoritative; production/native remains downstream.
let specIndex = await readText('docs/specs/README.md');
specIndex = specIndex.replace(/^> \*\*Current proposal reconciliation:\*\*.*\n\n/m, `> **Current semantic authority:** #122 accepts the qualified 989-requirement universal packet derived from #36 while preserving the #193 CUDA-JS ownership boundary. Native compatible-pair qualification remains deferred.\n\n`);
specIndex = specIndex.replace('## Current accepted contracts', '## Foundational accepted contracts');
specIndex = specIndex.replace('## Current universal proposals', '## Accepted universal 0.2 contracts');
specIndex = specIndex.replace('Universal proposal and evidence families include:', 'Universal accepted and evidence families include:');
specIndex = specIndex.replace('Universal proposal and evidence families', 'Universal accepted and evidence families');
specIndex = specIndex.replaceAll('These proposals do not authorize production lowering.', 'These accepted semantic contracts do not by themselves authorize production lowering.');
specIndex = specIndex.replace('The combined 989 proposal requirements remain unaccepted until strict schema/normalizer/Composer and consolidated CUDA-free reference evidence pass atomically at the integrated acceptance gate.', 'The combined 989 requirements are accepted semantic/reference authority under #122: 937 are accepted-reference and 52 native-compatible-pair requirements remain explicitly deferred. The #36 consolidated CUDA-free packet is the acceptance evidence; native/runtime/performance/product qualification remains downstream.');
specIndex = specIndex.replaceAll('Universal proposal and evidence', 'Universal accepted and evidence');
await writeText('docs/specs/README.md', specIndex);

// Promote registry ownership rows and remove now-accepted semantic boundaries from the planned table.
let registry = await readText('agent_files/SYSTEM_REGISTRY.md');
registry = registry.replace('Active; Search IR 0.1.0 accepted, 0.2.0 strict owner/profile/program/package proposal evidence active', 'Active; Search IR 0.1.0 foundation and 0.2.0 universal semantic/profile/program/package authority accepted; native realization deferred');
registry = registry.replace('CUDA-free proposal Search IR 0.2.0 catalog, strict owner-profile normalization, static restricted Device-JS Search Program/public-package composition, canonical identities and bounded deletion/rejection/reference-pair evidence', 'CUDA-free accepted Search IR 0.2.0 catalog, strict owner-profile normalization, restricted Device-JS Search Program/adapter-requirement composition, canonical identities and bounded deletion/rejection/reference-pair evidence');
registry = registry.replace('Bounded proposal evidence; no Device-JS compiler, contract acceptance or production/native authority', 'Accepted semantic/reference evidence; no Device-JS compiler, production/native or lower-runtime authority');
registry = registry.replace('Active bounded reference; Domain and Graph NODE/EDGE/REF/PATH/ROOT are protected-main integrated; Graph RECLAIM and later owners plus production/native authority remain pending', 'Accepted bounded CUDA-free owner/reference packet: 393/393 routes; native compatible-pair, production and performance authority remain deferred');
const promotedIds = new Set(['contract.framework','contract.domain','contract.policy','contract.evaluator','contract.graph','contract.session','contract.output','contract.extensions','contract.resources','contract.progress','contract.cuda-js-package']);
registry = registry.split('\n').filter((line) => ![...promotedIds].some((id) => line.startsWith(`| \`${id}\``))).join('\n');
const acceptedRows = `\n| \`contract.framework\` | Cross-owner LEGO composition/dependency map, normalized engine identity, lifecycle/deletion/package and integrated conformance obligations | [\`../docs/specs/SPEC-0000-framework-requirements.md\`](../docs/specs/SPEC-0000-framework-requirements.md) | Accepted 0.1.0 semantic contract; production lowering separate |\n| \`contract.domain\` | Product-neutral state/action/transition/identity/history/node-role semantics | [\`../docs/specs/SPEC-0007-domain-state-action-and-transition.md\`](../docs/specs/SPEC-0007-domain-state-action-and-transition.md) | Accepted 0.1.0 semantic contract |\n| \`contract.policy\` | Product-neutral selection/reservation/widening/statistics/value/backup/stopping/reuse semantics | [\`../docs/specs/SPEC-0008-search-policy-and-backup.md\`](../docs/specs/SPEC-0008-search-policy-and-backup.md) | Accepted 0.1.0 semantic contract |\n| \`contract.evaluator\` | Optional product-neutral evaluator capability/request/result/batching/cache semantics | [\`../docs/specs/SPEC-0009-evaluator-contract.md\`](../docs/specs/SPEC-0009-evaluator-contract.md) | Accepted 0.1.0 semantic contract |\n| \`contract.graph\` | Graph object/reference/path/transposition/root-protection/reclamation semantics | [\`../docs/specs/SPEC-0010-graph-storage-and-reclamation.md\`](../docs/specs/SPEC-0010-graph-storage-and-reclamation.md) | Accepted 0.1.0 semantic contract |\n| \`contract.session\` | Optional external Search Session/root/attention/observation coordination | [\`../docs/specs/SPEC-0006-search-session-control-and-observation.md\`](../docs/specs/SPEC-0006-search-session-control-and-observation.md) | Accepted 0.2.0 semantic contract |\n| \`contract.output\` | Bounded result/observation publication semantics | [\`../docs/specs/SPEC-0013-result-and-observation-publication.md\`](../docs/specs/SPEC-0013-result-and-observation-publication.md) | Accepted 0.1.0 semantic contract |\n| \`contract.extensions\` | Optional Stage/Channel/restricted Search Program composition with zero-residue absence | [\`../docs/specs/SPEC-0003-search-stage-and-extension-surface.md\`](../docs/specs/SPEC-0003-search-stage-and-extension-surface.md), [\`../docs/specs/SPEC-0004-async-stage-channels.md\`](../docs/specs/SPEC-0004-async-stage-channels.md), [\`../docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md\`](../docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md) | Accepted 0.3.0/0.3.0/0.4.0 semantic contracts |\n| \`contract.resources\` | Finite selected-owner resource composition/admission/accounting/pressure semantics | [\`../docs/specs/SPEC-0011-finite-search-resources.md\`](../docs/specs/SPEC-0011-finite-search-resources.md) | Accepted 0.1.0 semantic contract |\n| \`contract.progress\` | Device-owned readiness/fairness/no-progress/stop/drain/closure semantics | [\`../docs/specs/SPEC-0012-device-owned-search-progress.md\`](../docs/specs/SPEC-0012-device-owned-search-progress.md) | Accepted 0.1.0 semantic contract |\n| \`contract.cuda-js-package\` | MCGS Search Program/execution-package semantics plus MCGS-owned CUDA-JS adapter requirements; installed public CUDA-JS remains lower authority | [\`../docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md\`](../docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md), [\`../schemas/search-ir/0.2.0/execution-package.schema.json\`](../schemas/search-ir/0.2.0/execution-package.schema.json) | Accepted semantic/package boundary; #125 lower realization pending |`;
registry = registry.replace('| `reference.search-ir` | Independent deterministic interpretation of accepted publication, graph, path, resource, stop, and partial-result semantics | [`../experiments/search-ir-reference/`](../experiments/search-ir-reference/README.md) | Accepted disposable reference; no production/CUDA/product authority |', '| `reference.search-ir` | Independent deterministic interpretation of accepted publication, graph, path, resource, stop, and partial-result semantics | [`../experiments/search-ir-reference/`](../experiments/search-ir-reference/README.md) | Accepted disposable reference; no production/CUDA/product authority |' + acceptedRows);
registry = registry.replace('These IDs are planning anchors only. Exact contracts/names/implementation locations are not accepted until their version-zero specifications settle ownership.', 'The remaining IDs in this section are implementation/tool/conformance planning anchors. The universal semantic contracts promoted above are no longer planning-only.');
await writeText('agent_files/SYSTEM_REGISTRY.md', registry);

// Current state distinguishes acceptance candidate from protected integration.
const status = `# CUDA-MCGS Status\n\n**Status:** Active\n\n## Current protected authority\n\nProtected \`main\` remains \`${PRE_ACCEPT_MAIN}\` until #122 passes exact-head qualification, review, guarded integration and readback. The active acceptance subject is \`accept/122-semantic-packet\`; this file describes the candidate state and does not claim protected acceptance before merge.\n\n## #122 semantic acceptance candidate\n\nThe candidate preserves the exact qualified #36 reference lineage at \`${QUALIFIED_REFERENCE}\` and the later protected #193 CUDA-JS execution-boundary audit. The universal packet contains 12 contracts (SPEC-0000 and SPEC-0003 through SPEC-0013), 989 classified requirements, and the complete 393/393 CUDA-free owner/reference route packet.\n\nSemantic/reference disposition is 937 accepted-reference requirements plus exactly 52 native-compatible-pair requirements retained as deferred-native. The 52 deferred routes are not failures and are not silently promoted by #122.\n\nThe Search IR 0.2 catalog, owner/profile schemas, deterministic Composer, restricted Search Program and MCGS execution-package/adapter-requirement boundary are promoted together. The prior proposal-only CUDA-JS request projection is removed: MCGS owns search semantics, finite requirements, semantic access and selected geometry/concurrency policy; \`integration.cuda-js\` will construct actual lower request objects against installed/versioned public CUDA-JS. CUDA-JS remains sole owner of lower field vocabulary, provider facts, limits, validation, errors and resource lifecycle.\n\n## Qualification and claim limits\n\nThe acceptance candidate must pass governance, schema/normalizer/Composer, all owner references, the final integration packet, mutation sensitivity, deletion/product-neutrality/schedule witnesses and exact-head PR checks after the migration. Prior #36 evidence remains provenance but does not substitute for requalification after accepted identities change.\n\n#122 establishes no native GPU correctness, physical publication/memory ordering, performance, stable SDK, multi-GPU, UCI/chess/product, external-consumer release or exact compatible-pair support claim. CUDA-JS target for the later adapter is currently \`${CUDA_JS_PACKAGE}\` / \`${CUDA_JS_REVISION}\`, subject to live-state revalidation at #125.\n\n## Next dependency seam\n\n#125 \`integration.cuda-js\` remains blocked until #122 is protected-integrated and read back. After that readback, reassess live CUDA-JS and MCGS heads before implementation; compose existing public CUDA-JS LEGO resources and do not create a second runtime lifecycle or native/private escape path.\n`;
await writeText('STATUS.md', status);

const next = {
  schema_version: 105,
  updated: '2026-09-03',
  status: 'engine_contract_acceptance_01_candidate_qualification',
  objective: 'Promote the exact qualified 989-requirement universal semantic/reference packet to one accepted #122 subject while preserving protected #193 ownership corrections, then qualify/review/guardedly integrate and read back protected authority before #125 begins.',
  ownership_boundary: 'MCGS owns search semantics, Search IR, deterministic restricted Search Program generation, finite resource/pressure policy, semantic access and selected physical-profile policy. integration.cuda-js owns translation/orchestration only. CUDA-JS owns actual lower request vocabulary, limits, provider facts, validation, errors and resource lifecycle. Native/private CUDA-MCGS mechanisms remain prohibited.',
  authority: ['AGENTS.md','agent_files/AGENTS.md','agent_files/AI_RULES.md','agent_files/DESIGN_ALIGNMENT_CARD.md','docs/PROJECT_CHARTER.md','docs/decisions/ADR-0014-extract-cuda-js-runtime.md','docs/decisions/ADR-0019-pure-node-device-program-and-cuda-js-capability-escalation.md','docs/decisions/ADR-0023-parallel-first-native-execution.md','docs/decisions/ADR-0024-framework-only-production-ownership.md','docs/architecture/2026-09-03-cuda-js-execution-boundary-audit.md','docs/development/2026-09-03-engine-contract-acceptance-01-assessment-and-plan.md','docs/specs/README.md','schemas/search-ir/0.2.0/contract-set.json','schemas/search-ir/0.2.0/requirement-coverage.json','https://github.com/iteathen/CUDA-MCGS/issues/122'],
  state: { protected_authority: `main@${PRE_ACCEPT_MAIN}`, qualified_reference_candidate: `experimental/portfolio@${QUALIFIED_REFERENCE}`, active_issue: 122, active_focus_branch: 'ENGINE-CONTRACT-ACCEPTANCE-01', active_git_branch: 'accept/122-semantic-packet', review_pr: null, lower_reference: `${CUDA_JS_PACKAGE}@${CUDA_JS_REVISION}` },
  reference_route_accounting: { direct_non_channel: 352, channel_owner_evidence: 41, cuda_free_reference_total: 393, accepted_reference_requirements: 937, native_compatible_pair_deferred: 52, composer_requirements_classified: 989, composer_pending: 0 },
  preserved_red_evidence: [{ head: '6b5cb57521ba3a656e7e75ab2902d1630691eb41', finding: 'Final integration verifier failed exactly on missing integration fixture before #36 green construction.', disposition: 'Preserved as #36 red-before-green provenance.' }, { head: 'ebff2a14ac8c67e3a4145fd835d4d791bcf65458', finding: 'Initial final packet exposed incomplete promised integration mutation coverage.', disposition: 'Seven-entry mutation gate added before #36 final qualification.' }],
  mutation_matrix: ['missing owner evidence','substituted/stale owner evidence identity','missing required product-neutral/deletion/schedule witness','native-deferred route falsely promoted','Channel route loss','finite replica semantic divergence','final evidence identity mutation'],
  deliverables: ['Accepted metadata/identity for SPEC-0000 and SPEC-0003 through SPEC-0013 without changing qualified owner semantics.','Accepted Search IR 0.2 catalog/profile/program/package authority with 989/989 classified requirements and exactly 52 native-deferred routes.','CUDA-JS ownership correction: MCGS adapter requirements replace the locally invented lower request projection/lifecycle.','Exact preserved #36 owner/reference packet and #193 governance/source-boundary changes on one ancestry-correct subject.','Registry, specification index, status and next-step state reconciled to the acceptance candidate.'],
  validation: ['All accepted spec/catalog/schema/normalizer identities agree and no proposal-only authority marker remains in active accepted metadata.','Composer and final engine reference packet regenerate on accepted identities with 393/393 CUDA-free routes and 52 deferred-native requirements.','All seven integration mutations still fail and exact baseline regeneration succeeds.','MCGS execution package contains no locally normative CUDA-JS compile/load/allocate/teardown state machine, device-memory request kind or CUDA-JS request-projection schema.','Restricted source roles and MCGS selected geometry/concurrency remain explicit; actual lower realization stays adapter/CUDA-JS-owned.','Full repository/documentation and applicable owner workflows pass on the exact PR head before integration.'],
  cleanup: { generated_build_evidence: 'ignored and uncommitted', temporary_acceptance_migration: 'remove migration script/workflow after successful transformation and requalify the cleaned head', native_or_private_runtime_residue: 'none authorized or introduced', protected_main: 'unchanged until guarded reviewed merge' },
  blockers: [],
  current_gate: ['Run the asserted acceptance migration and complete CUDA-free integration qualification on the generated subject.','Remove temporary migration transport, rerun exact-head PR qualification and perform complete base-to-head review.','Record exact reviewed head/tree/checks on #122 and PR.','Guardedly integrate into protected main only after repository-owner exact-head authorization when required, then read back commit/tree.','Close #122 only after protected readback; only then reassess #125 as dependency-ready.'],
  do_not: ['Do not promote any of the 52 native-compatible-pair routes to accepted-reference.','Do not let MCGS define CUDA-JS request field names, provider limits, compiler/resource lifecycle or private/native mechanisms.','Do not change qualified search semantics merely to make acceptance metadata fit.','Do not claim native, performance, product, stable SDK, multi-GPU or external-consumer support from #122.','Do not start #125 before protected #122 readback.'],
  next_after_authorized_integration: '#125 public CUDA-JS runtime adapter assessment against the exact protected #122 surface and live public CUDA-JS head.'
};
await writeText('next_step.yaml', stableJson(next));

// Final fail-closed residue checks before CI runs the repository's own verifiers.
for (const [id, [relative]] of specs) {
  const text = await readText(relative);
  if (!text.includes('**Status:** Accepted') || text.includes('**Draft version:**') || text.includes(`CUDA-MCGS-${id}@`) && text.match(new RegExp(`CUDA-MCGS-${id}@[0-9.]+-draft`))) fail(`${id} still has proposal metadata`);
}
const finalExecution = await readText(executionSchemaPath);
for (const forbidden of ['cuda-js-request-projection', '"device-memory"', '"compile"', '"allocate"', '"load"', '"teardown"']) {
  if (finalExecution.includes(forbidden)) fail(`execution package still contains lower-owned token ${forbidden}`);
}
const finalCoverage = JSON.parse(await readText(coveragePath));
const nativeCount = finalCoverage.classifications.filter(({ evidenceStatus }) => evidenceStatus === 'deferred-native').reduce((sum, entry) => sum + entry.requirementCount, 0);
if (nativeCount !== 52) fail(`final native-deferred count is ${nativeCount}`);
console.log('accept-122 migration complete: 12 accepted contracts, 989 classified requirements, 937 accepted-reference, 52 deferred-native');
