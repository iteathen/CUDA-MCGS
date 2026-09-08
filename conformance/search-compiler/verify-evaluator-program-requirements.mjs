#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  evaluatorProgramRequirementConstants,
  normalizeDomainProfile,
  normalizeEvaluatorProfile,
  normalizeGraphProfile,
  normalizeProgramPackageProfile,
} from '../../components/search-compiler/testing.mjs';
import { inspectCatalog, sourceTextSha256 } from './src/catalog.mjs';
import { buildDomainProfiles } from './src/domain-fixtures.mjs';
import {
  buildEvaluatorProfiles,
  evaluatorSyntheticSchemaReference,
} from './src/evaluator-fixtures.mjs';
import { buildGraphProfiles } from './src/graph-fixtures.mjs';
import { buildProgramPackageProfile } from './src/program-package-fixtures.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..', '..');
const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');
const RELEASE_ACQUIRE_ID = 'cuda-js.device-publication-release-acquire/0.1.0';

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const digest = (character) => ({ algorithm: 'sha256', sha256: character.repeat(64) });
const profile = (id, schema, character) => ({ normalized: { id, schema }, schemaSha: character.repeat(64), identity: digest(character) });
const sourceIdentity = (source) => ({ algorithm: 'sha256', sha256: sha256(source.replace(/\r\n?/g, '\n').replace(/\n+$/g, '') + '\n') });
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

function packageContext(evaluatorResult = null, label = 'evaluator-program-requirements') {
  const progressResult = profile(`progress.${label}`, 'cuda-mcgs.progress-profile/0.2.0', '2');
  const outputResult = {
    ...profile(`output.${label}`, 'cuda-mcgs.output-profile/0.2.0', '3'),
    normalized: {
      id: `output.${label}`, schema: 'cuda-mcgs.output-profile/0.2.0',
      terminalEnvelope: { terminalReserve: `reserve.${label}.terminal` },
      terminal: {
        schema: `output-schema.${label}.terminal`,
        borrow: evaluatorSyntheticSchemaReference(`cuda-mcgs.${label}-borrow`),
        asyncRead: evaluatorSyntheticSchemaReference(`cuda-mcgs.${label}-async-read`),
        cleanup: evaluatorSyntheticSchemaReference(`cuda-mcgs.${label}-cleanup`),
      },
      publication: { hostDelivery: 'asynchronous-bounded-read', hostEffect: 'transfer-borrow-only', maxTransfers: '1' },
    },
  };
  const resourceResult = {
    ...profile(`resource.${label}`, 'cuda-mcgs.resource-profile/0.2.0', '1'),
    normalized: {
      id: `resource.${label}`,
      schema: 'cuda-mcgs.resource-profile/0.2.0',
      contributors: [{ id: `resource-contributor.${label}-output`, profile: { id: outputResult.normalized.id } }],
      classes: [{ id: `resource-class.${label}-terminal`, contributor: `resource-contributor.${label}-output`, lifetime: 'operation', unit: 'bytes' }],
      partitions: [{ id: `resource-partition.${label}-terminal`, class: `resource-class.${label}-terminal`, pool: `resource-pool.${label}-terminal`, offset: '0', capacity: '64', alias: { kind: 'none' } }],
      pools: [{ id: `resource-pool.${label}-terminal`, providerRequirement: `provider.${label}.terminal`, unit: 'bytes', capacity: '64' }],
      reserves: [{ id: `reserve.${label}.terminal`, purpose: 'terminal-result', class: `resource-class.${label}-terminal`, partition: `resource-partition.${label}-terminal`, minimum: '64', maximum: '64', eligibleOwners: [`resource-contributor.${label}-output`] }],
      providerRequirements: [
        { id: `provider.${label}`, unit: 'bytes', capacity: '64', alignment: '8', memorySpaces: ['device-search'], access: ['read', 'write'] },
        { id: `provider.${label}.terminal`, unit: 'bytes', capacity: '64', alignment: '8', memorySpaces: ['device-search'], access: ['read', 'write'] },
      ],
    },
  };
  const profileResults = [resourceResult, progressResult, outputResult, ...(evaluatorResult ? [evaluatorResult] : [])];
  return { profileResults, resourceResult, progressResult, outputResult, sessionResult: null, stageResult: null, channelResult: null };
}

function bindReleaseAcquireHelper(fixture, evaluatorId) {
  const unit = fixture.input.sourceUnits.find(({ ownerProfile }) => ownerProfile === evaluatorId);
  assert(unit, 'selected evaluator must own one source unit');
  const fn = fixture.input.functions.find(({ sourceUnit }) => sourceUnit === unit.id);
  assert(fn, 'selected evaluator source unit must own one function');
  const source = `function ${fn.name}(readiness, index) { return gpu.atomic.loadAcquireDevice(readiness, index); }\n`;
  unit.source = source;
  unit.sourceIdentity = sourceIdentity(source);
  fn.parameters = [{ name: 'readiness', type: 'ptr<u32>' }, { name: 'index', type: 'u32' }];
  fn.returns = 'u32';
  fn.helpers = ['gpu.atomic.load-acquire-device'];
  return fn.name;
}

const contractSet = await readJson(path.join(schemaRoot, 'contract-set.json'));
const coverage = await readJson(path.join(schemaRoot, 'requirement-coverage.json'));
const inspected = await inspectCatalog(repositoryRoot, contractSet, coverage);
const domainSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'domain-profile.schema.json')));
const graphSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'graph-profile.schema.json')));
const evaluatorSchemaBytes = await readFile(path.join(schemaRoot, 'evaluator-profile.schema.json'));
const evaluatorSchemaSha = sourceTextSha256(evaluatorSchemaBytes);
const evaluatorSchema = JSON.parse(evaluatorSchemaBytes.toString('utf8'));

assert.equal(evaluatorSchema.$defs.programContribution.properties.requirements.maxItems, evaluatorProgramRequirementConstants.maxRequirements);
assert.equal(evaluatorSchema.$defs.programContribution.required.includes('requirements'), false, 'additive requirement declaration must preserve legacy 0.2.0 documents');

const domainProfiles = buildDomainProfiles(inspected).map((input) => normalizeDomainProfile(input, inspected));
const graphFixtures = buildGraphProfiles(inspected, domainProfiles, domainSchemaSha);
const graphProfiles = graphFixtures.map(({ input, domain }) => normalizeGraphProfile(input, inspected, domain));
const evaluatorFixtures = buildEvaluatorProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha);
const analytic = evaluatorFixtures.find(({ input }) => input.id === 'evaluator.synthetic-analytic-evaluation-only');
assert(analytic, 'analytic evaluator fixture is required');

const legacy = normalizeEvaluatorProfile(analytic.input, inspected, analytic.domain, analytic.graph);
assert.equal(Object.hasOwn(legacy.normalized.programContribution, 'requirements'), false, 'legacy evaluator normalization must remain exact-delegate');

const empty = structuredClone(analytic.input);
empty.programContribution.requirements = [];
assert.throws(
  () => normalizeEvaluatorProfile(empty, inspected, analytic.domain, analytic.graph),
  { code: 'EVALUATOR_PROGRAM_REQUIREMENT_COUNT' },
  'present empty requirements must not create a second zero representation',
);

const releaseAcquire = evaluatorSyntheticSchemaReference('cuda-js.device-publication-release-acquire');
const mailbox = evaluatorSyntheticSchemaReference('cuda-js.publication-mailbox');
const withRequirements = structuredClone(analytic.input);
withRequirements.programContribution.requirements = [releaseAcquire, mailbox];
const ordered = normalizeEvaluatorProfile(withRequirements, inspected, analytic.domain, analytic.graph);
const reversedInput = structuredClone(withRequirements);
reversedInput.programContribution.requirements.reverse();
const reversed = normalizeEvaluatorProfile(reversedInput, inspected, analytic.domain, analytic.graph);
assert.equal(ordered.identity.sha256, reversed.identity.sha256, 'requirement order must canonicalize');
assert.deepEqual(ordered.normalized.programContribution.requirements.map(({ id }) => id), [RELEASE_ACQUIRE_ID, 'cuda-js.publication-mailbox/0.1.0'].sort());
assert.notEqual(ordered.identity.sha256, legacy.identity.sha256, 'declared lower requirement must be identity-material');

const duplicate = structuredClone(analytic.input);
duplicate.programContribution.requirements = [releaseAcquire, { ...releaseAcquire, sha256: 'f'.repeat(64) }];
assert.throws(() => normalizeEvaluatorProfile(duplicate, inspected, analytic.domain, analytic.graph), { code: 'EVALUATOR_PROGRAM_REQUIREMENT_DUPLICATE' });

const tooMany = structuredClone(analytic.input);
tooMany.programContribution.requirements = Array.from({ length: evaluatorProgramRequirementConstants.maxRequirements + 1 }, (_, index) => evaluatorSyntheticSchemaReference(`cuda-js.synthetic-requirement-${index}`));
assert.throws(() => normalizeEvaluatorProfile(tooMany, inspected, analytic.domain, analytic.graph), { code: 'EVALUATOR_PROGRAM_REQUIREMENT_COUNT' });

const runtimeInput = structuredClone(analytic.input);
runtimeInput.programContribution.requirements = [releaseAcquire];
const runtimeEvaluator = { ...normalizeEvaluatorProfile(runtimeInput, inspected, analytic.domain, analytic.graph), schemaSha: evaluatorSchemaSha };
const runtimeContext = packageContext(runtimeEvaluator, 'evaluator-runtime-requirement');
const runtimeFixture = buildProgramPackageProfile(inspected, runtimeContext, 'evaluator-runtime-requirement');
bindReleaseAcquireHelper(runtimeFixture, runtimeEvaluator.normalized.id);
const runtimePackage = normalizeProgramPackageProfile(runtimeFixture.input, inspected, runtimeFixture.context);
const projected = runtimePackage.normalized.publicRequirements.find(({ contract }) => contract.id === RELEASE_ACQUIRE_ID);
assert(projected, 'declared evaluator helper requirement must reach Program Package');
assert(projected.consumers.includes(runtimeEvaluator.normalized.id), 'evaluator must own its projected public requirement');

const undeclaredEvaluator = { ...legacy, schemaSha: evaluatorSchemaSha };
const undeclaredContext = packageContext(undeclaredEvaluator, 'evaluator-runtime-undeclared');
const undeclaredFixture = buildProgramPackageProfile(inspected, undeclaredContext, 'evaluator-runtime-undeclared');
const undeclaredFunctionName = bindReleaseAcquireHelper(undeclaredFixture, undeclaredEvaluator.normalized.id);
const undeclaredPackage = normalizeProgramPackageProfile(undeclaredFixture.input, inspected, undeclaredFixture.context);
assert.equal(
  undeclaredPackage.normalized.publicRequirements.some(({ contract }) => contract.id === RELEASE_ACQUIRE_ID),
  false,
  'opaque helper metadata must not synthesize a CUDA-JS public requirement',
);
assert.deepEqual(
  undeclaredPackage.normalized.functions.find(({ name }) => name === undeclaredFunctionName)?.helpers,
  ['gpu.atomic.load-acquire-device'],
  'Program Package must preserve opaque helper declaration metadata without claiming lower helper support',
);

const absentContext = packageContext(null, 'evaluator-runtime-absent');
const absentFixture = buildProgramPackageProfile(inspected, absentContext, 'evaluator-runtime-absent');
const absentPackage = normalizeProgramPackageProfile(absentFixture.input, inspected, absentFixture.context);
assert.equal(absentPackage.normalized.publicRequirements.some(({ contract }) => contract.id === RELEASE_ACQUIRE_ID), false, 'evaluator absence must remove evaluator-only public requirement');
assert.equal(JSON.stringify(absentPackage.normalized).includes('evaluator.synthetic-analytic-evaluation-only'), false, 'evaluator absence must leave no evaluator profile residue');

console.log('evaluator_program_requirements=pass legacy=exact-delegate empty=reject canonical=proved duplicate=reject bounded=64 package_projection=owned helper_requirement_inference=absent absence=zero-residue');
