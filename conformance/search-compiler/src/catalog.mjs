import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  assertExactArray,
  assertInteger,
  assertString,
  canonicalIdentity,
  compareRaw,
  exactKeys,
  fail,
  sourceTextSha256,
  uniqueBy,
} from '../../../components/search-compiler/testing.mjs';

export { canonicalBytes, canonicalIdentity, sourceTextSha256 } from '../../../components/search-compiler/testing.mjs';

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

function normalizeArtifact(input, index) {
  exactKeys(input, ['role', 'sourcePath', 'sha256'], 'CATALOG_FOUNDATION_FIELDS', `foundation artifact ${index}`);
  assertString(input.role, /^(governing-specification|structural-schema|semantic-normalizer|identity-fixture)$/, 'CATALOG_FOUNDATION_ROLE', `foundation artifact ${index} role`);
  assertString(input.sourcePath, /^[a-zA-Z0-9][a-zA-Z0-9._/-]+$/, 'CATALOG_SOURCE_PATH', `foundation artifact ${index} sourcePath`);
  assertString(input.sha256, /^[0-9a-f]{64}$/, 'CATALOG_DIGEST', `foundation artifact ${index} sha256`);
  return { role: input.role, sourcePath: input.sourcePath, sha256: input.sha256 };
}

function normalizeContract(input, index) {
  exactKeys(input, ['id', 'specificationIdentity', 'version', 'status', 'semanticOwner', 'sourcePath', 'sha256', 'requirementPrefix', 'requirementCount', 'evidenceOwner'], 'CATALOG_CONTRACT_FIELDS', `contract ${index}`);
  assertString(input.id, /^SPEC-[0-9]{4}$/, 'CATALOG_CONTRACT_ID', `contract ${index} id`);
  assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+$/, 'CATALOG_SPEC_IDENTITY', `${input.id} specificationIdentity`);
  assertString(input.version, /^[0-9]+\.[0-9]+\.[0-9]+$/, 'CATALOG_VERSION', `${input.id} version`);
  if (input.status !== 'Accepted') fail('CATALOG_STATUS', `${input.id} must be Accepted`);
  if (typeof input.semanticOwner !== 'string' || input.semanticOwner.length === 0) fail('CATALOG_OWNER', `${input.id} semanticOwner is invalid`);
  assertString(input.sourcePath, /^docs\/specs\/SPEC-[0-9]{4}-[a-z0-9-]+\.md$/, 'CATALOG_SOURCE_PATH', `${input.id} sourcePath`);
  assertString(input.sha256, /^[0-9a-f]{64}$/, 'CATALOG_DIGEST', `${input.id} sha256`);
  assertString(input.requirementPrefix, /^[A-Z][A-Z0-9-]*-$/, 'CATALOG_REQUIREMENT_PREFIX', `${input.id} requirementPrefix`);
  assertInteger(input.requirementCount, 1, 'CATALOG_REQUIREMENT_COUNT', `${input.id} requirementCount`);
  assertString(input.evidenceOwner, /^IR-[A-Z-]+-01$/, 'CATALOG_PLANNED_LEAF', `${input.id} evidenceOwner`);
  return {
    id: input.id,
    specificationIdentity: input.specificationIdentity,
    version: input.version,
    status: input.status,
    semanticOwner: input.semanticOwner,
    sourcePath: input.sourcePath,
    sha256: input.sha256,
    requirementPrefix: input.requirementPrefix,
    requirementCount: input.requirementCount,
    evidenceOwner: input.evidenceOwner,
  };
}

export function normalizeContractSet(input) {
  exactKeys(input, ['schema', 'representation', 'status', 'authorityBaseline', 'sourceDigest', 'foundation', 'contracts', 'totals'], 'CATALOG_ROOT_FIELDS', 'contract set');
  if (input.schema !== CONTRACT_SET_SCHEMA) fail('CATALOG_SCHEMA', 'unsupported contract-set schema');
  if (input.representation !== REPRESENTATION) fail('CATALOG_REPRESENTATION', 'unsupported Search IR representation');
  if (input.status !== 'accepted') fail('CATALOG_STATUS', 'contract set must be accepted authority');
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
    fail('CATALOG_CONTRACT_COUNT', 'contract set must contain exactly twelve accepted contracts');
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
  exactKeys(input, ['contract', 'requirementPrefix', 'primaryOwner', 'evidenceOwner', 'currentDisposition', 'completionStatus'], 'COVERAGE_ENTRY_FIELDS', `coverage ${index}`);
  assertString(input.contract, /^SPEC-[0-9]{4}$/, 'COVERAGE_CONTRACT', `coverage ${index} contract`);
  assertString(input.requirementPrefix, /^[A-Z][A-Z0-9-]*-$/, 'COVERAGE_PREFIX', `${input.contract} requirementPrefix`);
  if (typeof input.primaryOwner !== 'string' || input.primaryOwner.length === 0) fail('COVERAGE_OWNER', `${input.contract} primaryOwner is invalid`);
  assertString(input.evidenceOwner, /^IR-[A-Z-]+-01$/, 'COVERAGE_LEAF', `${input.contract} evidenceOwner`);
  if (input.currentDisposition !== 'accepted-reference' || input.completionStatus !== 'accepted') {
    fail('COVERAGE_ACCEPTANCE_STATE', `${input.contract} is not accepted reference authority`);
  }
  return { ...input };
}

function normalizeClassification(input, index) {
  exactKeys(input, ['contract', 'requirementPrefix', 'requirementCount', 'primaryDisposition', 'supportingDispositions', 'evidenceOwner', 'evidenceStatus', 'evidenceRefs', 'classificationStatus'], 'COVERAGE_CLASSIFICATION_FIELDS', `classification ${index}`);
  assertString(input.contract, /^SPEC-[0-9]{4}$/, 'COVERAGE_CLASSIFICATION_CONTRACT', `classification ${index} contract`);
  assertString(input.requirementPrefix, /^[A-Z][A-Z0-9-]*-$/, 'COVERAGE_CLASSIFICATION_PREFIX', `${input.contract} classification prefix`);
  assertInteger(input.requirementCount, 1, 'COVERAGE_CLASSIFICATION_COUNT', `${input.requirementPrefix} requirementCount`);
  if (!FINAL_DISPOSITIONS.includes(input.primaryDisposition)) fail('COVERAGE_CLASSIFICATION_DISPOSITION', `${input.requirementPrefix} primary disposition is invalid`);
  if (!Array.isArray(input.supportingDispositions)
      || input.supportingDispositions.some((disposition) => !FINAL_DISPOSITIONS.includes(disposition) || disposition === input.primaryDisposition)
      || new Set(input.supportingDispositions).size !== input.supportingDispositions.length) {
    fail('COVERAGE_CLASSIFICATION_DISPOSITION', `${input.requirementPrefix} supporting dispositions are invalid`);
  }
  assertString(input.evidenceOwner, /^(?:IR|ENGINE)-[A-Z0-9-]+-01$/, 'COVERAGE_CLASSIFICATION_OWNER', `${input.requirementPrefix} evidenceOwner`);
  assertString(input.evidenceStatus, /^(?:accepted-reference|deferred-native)$/, 'COVERAGE_CLASSIFICATION_STATUS', `${input.requirementPrefix} evidenceStatus`);
  const expectedEvidenceStatus = input.primaryDisposition === 'native-compatible-pair-qualification' ? 'deferred-native' : 'accepted-reference';
  if (input.evidenceStatus !== expectedEvidenceStatus) fail('COVERAGE_CLASSIFICATION_STATUS', `${input.requirementPrefix} evidence status does not match its final disposition`);
  if (input.classificationStatus !== 'classified') fail('COVERAGE_CLASSIFICATION_STATUS', `${input.requirementPrefix} classificationStatus is invalid`);
  if (!Array.isArray(input.evidenceRefs) || input.evidenceRefs.length === 0
      || input.evidenceRefs.some((reference) => typeof reference !== 'string' || !/^(?:schema|normalizer|case|proof|planned):[a-zA-Z0-9./_-]+$/.test(reference))
      || new Set(input.evidenceRefs).size !== input.evidenceRefs.length) {
    fail('COVERAGE_CLASSIFICATION_EVIDENCE', `${input.requirementPrefix} evidenceRefs are invalid`);
  }
  return {
    contract: input.contract,
    requirementPrefix: input.requirementPrefix,
    requirementCount: input.requirementCount,
    primaryDisposition: input.primaryDisposition,
    supportingDispositions: [...input.supportingDispositions].sort(compareRaw),
    evidenceOwner: input.evidenceOwner,
    evidenceStatus: input.evidenceStatus,
    evidenceRefs: [...input.evidenceRefs].sort(compareRaw),
    classificationStatus: input.classificationStatus,
  };
}

function classificationKey(classification) {
  return `${classification.contract}\0${classification.requirementPrefix}`;
}

export function normalizeRequirementCoverage(input) {
  exactKeys(input, ['schema', 'contractSet', 'allowedFinalDispositions', 'contracts', 'classifications', 'totals'], 'COVERAGE_ROOT_FIELDS', 'requirement coverage');
  if (input.schema !== COVERAGE_SCHEMA || input.contractSet !== CONTRACT_SET_SCHEMA) {
    fail('COVERAGE_SCHEMA', 'coverage schema/contract-set identity is incompatible');
  }
  assertExactArray(input.allowedFinalDispositions, FINAL_DISPOSITIONS, 'COVERAGE_DISPOSITIONS', 'allowedFinalDispositions');
  if (!Array.isArray(input.contracts) || input.contracts.length !== 12) {
    fail('COVERAGE_CONTRACT_COUNT', 'coverage must contain exactly twelve contract routes');
  }
  const contracts = input.contracts.map(normalizeCoverageEntry).sort((left, right) => compareRaw(left.contract, right.contract));
  uniqueBy(contracts, 'contract', 'COVERAGE_CONTRACT_DUPLICATE', 'coverage contract');
  if (!Array.isArray(input.classifications)) fail('COVERAGE_CLASSIFICATION_COUNT', 'classifications must be an array');
  const classifications = input.classifications.map(normalizeClassification).sort((left, right) => compareRaw(classificationKey(left), classificationKey(right)));
  const classificationKeys = classifications.map(classificationKey);
  if (new Set(classificationKeys).size !== classificationKeys.length) fail('COVERAGE_CLASSIFICATION_DUPLICATE', 'classification repeats a contract/prefix');
  exactKeys(input.totals, ['contracts', 'requirements', 'classified', 'pending'], 'COVERAGE_TOTAL_FIELDS', 'coverage totals');
  if (input.totals.contracts !== 12 || input.totals.requirements !== 989
      || !Number.isSafeInteger(input.totals.classified) || !Number.isSafeInteger(input.totals.pending)
      || input.totals.classified < 0 || input.totals.pending < 0
      || input.totals.classified + input.totals.pending !== 989) {
    fail('COVERAGE_TOTALS', 'coverage totals must partition exactly 989 requirements');
  }
  return {
    schema: input.schema,
    contractSet: input.contractSet,
    allowedFinalDispositions: [...input.allowedFinalDispositions],
    contracts,
    classifications,
    totals: { ...input.totals },
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

function selectClassification(id, contract, classifications) {
  const matching = classifications
    .filter((classification) => classification.contract === contract && id.startsWith(classification.requirementPrefix))
    .sort((left, right) => right.requirementPrefix.length - left.requirementPrefix.length);
  if (matching.length > 1 && matching[0].requirementPrefix.length === matching[1].requirementPrefix.length) {
    fail('COVERAGE_CLASSIFICATION_OVERLAP', `${id} matches ambiguous classifications`);
  }
  return matching[0] ?? null;
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
    const version = metadata(text, /^\*\*Version:\*\* ([^\r\n]+)$/m, 'CATALOG_METADATA', `${contract.id} version`);
    const semanticOwner = metadata(text, /^\*\*Owner:\*\* ([^\r\n]+)$/m, 'CATALOG_METADATA', `${contract.id} owner`);
    const specificationIdentity = metadata(text, /^Specification identity is `([^`]+)`\.$/m, 'CATALOG_METADATA', `${contract.id} identity`);
    if (status !== contract.status || version !== contract.version
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
        || route.evidenceOwner !== contract.evidenceOwner) {
      fail('COVERAGE_ROUTE_DRIFT', `${contract.id} coverage route differs from its catalog owner`);
    }

    for (const id of ids) {
      if (globalIds.has(id)) fail('CATALOG_REQUIREMENT_DUPLICATE', `requirement ID ${id} is defined by multiple contracts`);
      globalIds.add(id);
      const classification = selectClassification(id, contract.id, coverage.classifications);
      requirements.push({
        id,
        contract: contract.id,
        primaryOwner: route.primaryOwner,
        currentDisposition: classification?.primaryDisposition ?? route.currentDisposition,
        supportingDispositions: classification?.supportingDispositions ?? [],
        evidenceOwner: classification?.evidenceOwner ?? route.evidenceOwner,
        evidenceStatus: classification?.evidenceStatus ?? 'pending',
        evidenceRefs: classification?.evidenceRefs ?? [],
        classificationStatus: classification?.classificationStatus ?? 'pending',
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
  for (const classification of coverage.classifications) {
    const matched = requirements.filter((requirement) => selectClassification(requirement.id, requirement.contract, coverage.classifications) === classification);
    if (matched.length !== classification.requirementCount) {
      fail('COVERAGE_CLASSIFICATION_COUNT', `${classification.requirementPrefix} expected ${classification.requirementCount}, found ${matched.length}`);
    }
  }
  const classified = requirements.filter(({ classificationStatus }) => classificationStatus === 'classified').length;
  const pending = requirements.length - classified;
  if (classified !== coverage.totals.classified || pending !== coverage.totals.pending) {
    fail('COVERAGE_TOTALS', `expanded coverage is ${classified} classified and ${pending} pending`);
  }
  for (const route of coverage.contracts) {
    const expanded = requirements.filter(({ contract }) => contract === route.contract);
    if (route.currentDisposition !== 'accepted-reference' || route.completionStatus !== 'accepted') {
      fail('COVERAGE_ROUTE_STATE', `${route.contract} route is not accepted reference authority`);
    }
    if (expanded.length === 0 || expanded.some(({ classificationStatus }) => classificationStatus !== 'classified')) {
      fail('COVERAGE_ROUTE_STATE', `${route.contract} has an unclassified accepted requirement`);
    }
    for (const requirement of expanded) {
      const expectedEvidenceStatus = requirement.currentDisposition === 'native-compatible-pair-qualification'
        ? 'deferred-native'
        : 'accepted-reference';
      if (requirement.evidenceStatus !== expectedEvidenceStatus) {
        fail('COVERAGE_ROUTE_STATE', `${requirement.id} evidence status disagrees with its final disposition`);
      }
    }
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
