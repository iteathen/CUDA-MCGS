import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const CONTRACT_SET_SCHEMA = 'cuda-mcgs.search-ir.contract-set/0.2.0';
const COVERAGE_SCHEMA = 'cuda-mcgs.search-ir.requirement-coverage/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const FINAL_DISPOSITIONS = [
  'structural-schema',
  'semantic-normalizer',
  'deterministic-composition',
  'ir-identity-deletion-rejection',
  'engine-reference-oracle',
  'cross-specification-proof',
  'native-compatible-pair-qualification',
];

export class CatalogError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = 'CatalogError';
    this.code = code;
  }
}

function fail(code, message) {
  throw new CatalogError(code, message);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, expected, code, label) {
  if (!isRecord(value)) fail(code, `${label} must be an object`);
  const actual = Object.keys(value).sort(compareRaw);
  const canonicalExpected = [...expected].sort(compareRaw);
  if (actual.length !== canonicalExpected.length || actual.some((key, index) => key !== canonicalExpected[index])) {
    fail(code, `${label} fields must be exactly ${canonicalExpected.join(', ')}`);
  }
}

function compareRaw(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function assertString(value, pattern, code, label) {
  if (typeof value !== 'string' || !pattern.test(value)) fail(code, `${label} is invalid`);
}

function assertInteger(value, minimum, code, label) {
  if (!Number.isSafeInteger(value) || value < minimum) fail(code, `${label} is invalid`);
}

function assertExactArray(actual, expected, code, label) {
  if (!Array.isArray(actual)
      || actual.length !== expected.length
      || actual.some((value, index) => value !== expected[index])) {
    fail(code, `${label} is not canonical`);
  }
}

function uniqueBy(values, key, code, label) {
  const seen = new Set();
  for (const value of values) {
    const identity = value[key];
    if (seen.has(identity)) fail(code, `${label} duplicates ${identity}`);
    seen.add(identity);
  }
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.keys(value).sort(compareRaw).map((key) => [key, canonicalValue(value[key])]));
}

export function canonicalBytes(value) {
  return Buffer.from(JSON.stringify(canonicalValue(value)), 'utf8');
}

export function canonicalIdentity(value) {
  const bytes = canonicalBytes(value);
  return {
    algorithm: 'sha256',
    byteLength: bytes.byteLength,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

export function sourceTextSha256(bytes) {
  const normalized = Buffer.from(bytes.toString('utf8').replace(/\r\n?/g, '\n'), 'utf8');
  return createHash('sha256').update(normalized).digest('hex');
}

function normalizeArtifact(input, index) {
  exactKeys(input, ['role', 'sourcePath', 'sha256'], 'CATALOG_FOUNDATION_FIELDS', `foundation artifact ${index}`);
  assertString(input.role, /^(governing-specification|structural-schema|semantic-normalizer|identity-fixture)$/, 'CATALOG_FOUNDATION_ROLE', `foundation artifact ${index} role`);
  assertString(input.sourcePath, /^[a-zA-Z0-9][a-zA-Z0-9._/-]+$/, 'CATALOG_SOURCE_PATH', `foundation artifact ${index} sourcePath`);
  assertString(input.sha256, /^[0-9a-f]{64}$/, 'CATALOG_DIGEST', `foundation artifact ${index} sha256`);
  return { role: input.role, sourcePath: input.sourcePath, sha256: input.sha256 };
}

function normalizeContract(input, index) {
  exactKeys(input, ['id', 'specificationIdentity', 'draftVersion', 'status', 'semanticOwner', 'sourcePath', 'sha256', 'requirementPrefix', 'requirementCount', 'plannedLeaf'], 'CATALOG_CONTRACT_FIELDS', `contract ${index}`);
  assertString(input.id, /^SPEC-[0-9]{4}$/, 'CATALOG_CONTRACT_ID', `contract ${index} id`);
  assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+-draft$/, 'CATALOG_SPEC_IDENTITY', `${input.id} specificationIdentity`);
  assertString(input.draftVersion, /^[0-9]+\.[0-9]+\.[0-9]+$/, 'CATALOG_VERSION', `${input.id} draftVersion`);
  if (input.status !== 'Proposal') fail('CATALOG_STATUS', `${input.id} must remain Proposal`);
  if (typeof input.semanticOwner !== 'string' || input.semanticOwner.length === 0) fail('CATALOG_OWNER', `${input.id} semanticOwner is invalid`);
  assertString(input.sourcePath, /^docs\/specs\/SPEC-[0-9]{4}-[a-z0-9-]+\.md$/, 'CATALOG_SOURCE_PATH', `${input.id} sourcePath`);
  assertString(input.sha256, /^[0-9a-f]{64}$/, 'CATALOG_DIGEST', `${input.id} sha256`);
  assertString(input.requirementPrefix, /^[A-Z][A-Z0-9-]*-$/, 'CATALOG_REQUIREMENT_PREFIX', `${input.id} requirementPrefix`);
  assertInteger(input.requirementCount, 1, 'CATALOG_REQUIREMENT_COUNT', `${input.id} requirementCount`);
  assertString(input.plannedLeaf, /^IR-[A-Z-]+-01$/, 'CATALOG_PLANNED_LEAF', `${input.id} plannedLeaf`);
  return {
    id: input.id,
    specificationIdentity: input.specificationIdentity,
    draftVersion: input.draftVersion,
    status: input.status,
    semanticOwner: input.semanticOwner,
    sourcePath: input.sourcePath,
    sha256: input.sha256,
    requirementPrefix: input.requirementPrefix,
    requirementCount: input.requirementCount,
    plannedLeaf: input.plannedLeaf,
  };
}

export function normalizeContractSet(input) {
  exactKeys(input, ['schema', 'representation', 'status', 'authorityBaseline', 'sourceDigest', 'foundation', 'contracts', 'totals'], 'CATALOG_ROOT_FIELDS', 'contract set');
  if (input.schema !== CONTRACT_SET_SCHEMA) fail('CATALOG_SCHEMA', 'unsupported contract-set schema');
  if (input.representation !== REPRESENTATION) fail('CATALOG_REPRESENTATION', 'unsupported Search IR representation');
  if (input.status !== 'proposal-evidence') fail('CATALOG_STATUS', 'contract set must remain proposal evidence');
  assertString(input.authorityBaseline, /^[0-9a-f]{40}$/, 'CATALOG_BASELINE', 'authorityBaseline');
  if (input.sourceDigest !== 'sha256-utf8-lf-v1') fail('CATALOG_DIGEST_CONTRACT', 'unsupported source digest contract');

  exactKeys(input.foundation, ['representation', 'governingContract', 'artifacts'], 'CATALOG_FOUNDATION_FIELDS', 'foundation');
  if (input.foundation.representation !== 'cuda-mcgs.search-ir/0.1.0'
      || input.foundation.governingContract !== 'SPEC-0002/0.1.0') {
    fail('CATALOG_FOUNDATION_IDENTITY', 'accepted Search IR foundation identity changed');
  }
  if (!Array.isArray(input.foundation.artifacts) || input.foundation.artifacts.length !== 4) {
    fail('CATALOG_FOUNDATION_COUNT', 'foundation must contain four frozen artifacts');
  }
  const artifacts = input.foundation.artifacts.map(normalizeArtifact).sort((left, right) => compareRaw(left.role, right.role));
  uniqueBy(artifacts, 'role', 'CATALOG_FOUNDATION_DUPLICATE', 'foundation artifact role');

  if (!Array.isArray(input.contracts) || input.contracts.length !== 12) {
    fail('CATALOG_CONTRACT_COUNT', 'contract set must contain exactly twelve proposal contracts');
  }
  const contracts = input.contracts.map(normalizeContract).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(contracts, 'id', 'CATALOG_CONTRACT_DUPLICATE', 'contract');

  exactKeys(input.totals, ['contracts', 'requirements'], 'CATALOG_TOTAL_FIELDS', 'contract totals');
  if (input.totals.contracts !== 12 || input.totals.requirements !== 989) {
    fail('CATALOG_TOTALS', 'contract totals must remain 12 contracts and 989 requirements');
  }

  return {
    schema: input.schema,
    representation: input.representation,
    status: input.status,
    authorityBaseline: input.authorityBaseline,
    sourceDigest: input.sourceDigest,
    foundation: {
      representation: input.foundation.representation,
      governingContract: input.foundation.governingContract,
      artifacts,
    },
    contracts,
    totals: { contracts: 12, requirements: 989 },
  };
}

function normalizeCoverageEntry(input, index) {
  exactKeys(input, ['contract', 'requirementPrefix', 'primaryOwner', 'plannedLeaf', 'currentDisposition', 'completionStatus'], 'COVERAGE_ENTRY_FIELDS', `coverage ${index}`);
  assertString(input.contract, /^SPEC-[0-9]{4}$/, 'COVERAGE_CONTRACT', `coverage ${index} contract`);
  assertString(input.requirementPrefix, /^[A-Z][A-Z0-9-]*-$/, 'COVERAGE_PREFIX', `${input.contract} requirementPrefix`);
  if (typeof input.primaryOwner !== 'string' || input.primaryOwner.length === 0) fail('COVERAGE_OWNER', `${input.contract} primaryOwner is invalid`);
  assertString(input.plannedLeaf, /^IR-[A-Z-]+-01$/, 'COVERAGE_LEAF', `${input.contract} plannedLeaf`);
  if (input.currentDisposition !== 'pending-owner-classification' || input.completionStatus !== 'pending') {
    fail('COVERAGE_PREMATURE_COMPLETION', `${input.contract} cannot claim classification in the catalog leaf`);
  }
  return { ...input };
}

export function normalizeRequirementCoverage(input) {
  exactKeys(input, ['schema', 'contractSet', 'allowedFinalDispositions', 'contracts', 'totals'], 'COVERAGE_ROOT_FIELDS', 'requirement coverage');
  if (input.schema !== COVERAGE_SCHEMA || input.contractSet !== CONTRACT_SET_SCHEMA) {
    fail('COVERAGE_SCHEMA', 'coverage schema/contract-set identity is incompatible');
  }
  assertExactArray(input.allowedFinalDispositions, FINAL_DISPOSITIONS, 'COVERAGE_DISPOSITIONS', 'allowedFinalDispositions');
  if (!Array.isArray(input.contracts) || input.contracts.length !== 12) {
    fail('COVERAGE_CONTRACT_COUNT', 'coverage must contain exactly twelve contract routes');
  }
  const contracts = input.contracts.map(normalizeCoverageEntry).sort((left, right) => compareRaw(left.contract, right.contract));
  uniqueBy(contracts, 'contract', 'COVERAGE_CONTRACT_DUPLICATE', 'coverage contract');
  exactKeys(input.totals, ['contracts', 'requirements', 'classified', 'pending'], 'COVERAGE_TOTAL_FIELDS', 'coverage totals');
  if (input.totals.contracts !== 12 || input.totals.requirements !== 989
      || input.totals.classified !== 0 || input.totals.pending !== 989) {
    fail('COVERAGE_TOTALS', 'catalog coverage must honestly report 0 classified and 989 pending');
  }
  return {
    schema: input.schema,
    contractSet: input.contractSet,
    allowedFinalDispositions: [...input.allowedFinalDispositions],
    contracts,
    totals: { contracts: 12, requirements: 989, classified: 0, pending: 989 },
  };
}

function metadata(text, pattern, code, label) {
  const match = text.match(pattern);
  if (!match) fail(code, `${label} metadata is missing`);
  return match[1];
}

function requirementIds(text) {
  return [...text.matchAll(/^([A-Z][A-Z0-9-]*-[0-9]{3})\./gm)].map((match) => match[1]);
}

export async function inspectCatalog(repositoryRoot, contractSetInput, coverageInput) {
  const contractSet = normalizeContractSet(contractSetInput);
  const coverage = normalizeRequirementCoverage(coverageInput);

  for (const artifact of contractSet.foundation.artifacts) {
    const bytes = await readFile(path.join(repositoryRoot, artifact.sourcePath));
    if (sourceTextSha256(bytes) !== artifact.sha256) fail('CATALOG_FOUNDATION_DRIFT', `${artifact.role} digest changed`);
  }

  const coverageByContract = new Map(coverage.contracts.map((entry) => [entry.contract, entry]));
  const requirements = [];
  const globalIds = new Set();
  const contractSummaries = [];

  for (const contract of contractSet.contracts) {
    const bytes = await readFile(path.join(repositoryRoot, contract.sourcePath));
    if (sourceTextSha256(bytes) !== contract.sha256) fail('CATALOG_SOURCE_DRIFT', `${contract.id} source digest changed`);
    const text = bytes.toString('utf8');
    const status = metadata(text, /^\*\*Status:\*\* ([^\r\n]+)$/m, 'CATALOG_METADATA', `${contract.id} status`);
    const draftVersion = metadata(text, /^\*\*Draft version:\*\* ([^\r\n]+)$/m, 'CATALOG_METADATA', `${contract.id} version`);
    const semanticOwner = metadata(text, /^\*\*Owner:\*\* ([^\r\n]+)$/m, 'CATALOG_METADATA', `${contract.id} owner`);
    const specificationIdentity = metadata(text, /^Specification identity is `([^`]+)`\.$/m, 'CATALOG_METADATA', `${contract.id} identity`);
    if (status !== contract.status || draftVersion !== contract.draftVersion
        || semanticOwner !== contract.semanticOwner || specificationIdentity !== contract.specificationIdentity) {
      fail('CATALOG_METADATA_DRIFT', `${contract.id} checked-in metadata differs from the catalog`);
    }

    const ids = requirementIds(text);
    if (ids.length !== contract.requirementCount) {
      fail('CATALOG_REQUIREMENT_COUNT', `${contract.id} expected ${contract.requirementCount} requirements, found ${ids.length}`);
    }
    if (new Set(ids).size !== ids.length) fail('CATALOG_REQUIREMENT_DUPLICATE', `${contract.id} repeats a requirement ID`);
    if (ids.some((id) => !id.startsWith(contract.requirementPrefix))) {
      fail('CATALOG_REQUIREMENT_PREFIX', `${contract.id} contains an ID outside ${contract.requirementPrefix}`);
    }

    const route = coverageByContract.get(contract.id);
    if (!route) fail('COVERAGE_MISSING', `${contract.id} has no coverage route`);
    if (route.requirementPrefix !== contract.requirementPrefix
        || route.primaryOwner !== contract.semanticOwner
        || route.plannedLeaf !== contract.plannedLeaf) {
      fail('COVERAGE_ROUTE_DRIFT', `${contract.id} coverage route differs from its catalog owner`);
    }

    for (const id of ids) {
      if (globalIds.has(id)) fail('CATALOG_REQUIREMENT_DUPLICATE', `requirement ID ${id} is defined by multiple contracts`);
      globalIds.add(id);
      requirements.push({
        id,
        contract: contract.id,
        primaryOwner: route.primaryOwner,
        plannedLeaf: route.plannedLeaf,
        currentDisposition: route.currentDisposition,
        completionStatus: route.completionStatus,
      });
    }
    contractSummaries.push({ id: contract.id, requirements: ids.length, sourceSha256: contract.sha256 });
  }

  if (coverageByContract.size !== contractSet.contracts.length
      || [...coverageByContract.keys()].some((id) => !contractSet.contracts.some((contract) => contract.id === id))) {
    fail('COVERAGE_UNKNOWN', 'coverage contains an unknown contract route');
  }
  if (requirements.length !== 989 || globalIds.size !== 989) {
    fail('CATALOG_REQUIREMENT_TOTAL', `expected 989 unique requirements, found ${globalIds.size}`);
  }

  return {
    contractSet,
    coverage,
    contractSummaries,
    requirements,
    identities: {
      contractSet: canonicalIdentity(contractSet),
      coverage: canonicalIdentity(coverage),
      expandedRequirements: canonicalIdentity(requirements),
    },
  };
}

export const catalogConstants = Object.freeze({
  contractSetSchema: CONTRACT_SET_SCHEMA,
  coverageSchema: COVERAGE_SCHEMA,
  representation: REPRESENTATION,
  finalDispositions: Object.freeze([...FINAL_DISPOSITIONS]),
});
