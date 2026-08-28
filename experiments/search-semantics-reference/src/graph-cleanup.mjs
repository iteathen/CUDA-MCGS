import { frozenCanonicalClone } from './canonical.mjs';
import { exactKeys, fail, isRecord } from './errors.mjs';

function freeze(value, label) {
  return frozenCanonicalClone(value, label);
}

function decimal(value, code, label) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail(code, `${label} must be a canonical decimal string`);
  return BigInt(value);
}

function nonEmptyString(value, code, label) {
  if (typeof value !== 'string' || value.trim().length === 0) fail(code, `${label} must be an explicit non-empty string`);
  return value;
}

const LEDGER_FIELDS = [
  'byteLedgerOutstanding',
  'diagnosticRecords',
  'edgeRecords',
  'expansionRecords',
  'nodeClaims',
  'ownerRegionLeases',
  'pathOccurrences',
  'protections',
  'retirementRecords',
  'transpositionEntries',
];

export function reconcileGraphArenaRelease(input) {
  if (!isRecord(input)) fail('GRAPH_CLEANUP_RECONCILE', 'Graph arena release reconciliation input is required');
  exactKeys(input, ['ledger', 'resourceDestructionStarted'], 'GRAPH_CLEANUP_RECONCILE', 'Graph arena release reconciliation');
  if (!isRecord(input.ledger)) fail('GRAPH_CLEANUP_RECONCILE', 'Graph cleanup ledger is required');
  exactKeys(input.ledger, LEDGER_FIELDS, 'GRAPH_CLEANUP_RECONCILE', 'Graph cleanup ledger');
  if (typeof input.resourceDestructionStarted !== 'boolean') fail('GRAPH_CLEANUP_RECONCILE', 'resourceDestructionStarted must be boolean');
  if (input.resourceDestructionStarted) fail('GRAPH_CLEANUP_ORDER', 'resource destruction cannot precede Graph cleanup reconciliation');

  const outstanding = [];
  for (const field of LEDGER_FIELDS) {
    const count = decimal(input.ledger[field], 'GRAPH_CLEANUP_RECONCILE', field);
    if (count !== 0n) outstanding.push({ field, count: count.toString() });
  }
  if (outstanding.length !== 0) {
    return freeze({ kind: 'blocked', code: 'graph-cleanup-incomplete', outstanding }, 'Graph cleanup blocked result');
  }
  return freeze({
    kind: 'ready-for-resource-destruction',
    graphCleanupComplete: true,
    resourceDestructionStarted: false,
  }, 'Graph cleanup reconciliation success');
}

function validateCompatibility(compatibleWith) {
  if (!isRecord(compatibleWith)) fail('GRAPH_CLEANUP_ARTIFACT', 'compatible retained-artifact identities are required');
  exactKeys(compatibleWith, ['packageIdentity', 'profileIdentity'], 'GRAPH_CLEANUP_ARTIFACT', 'compatible retained-artifact identities');
  return {
    packageIdentity: nonEmptyString(compatibleWith.packageIdentity, 'GRAPH_CLEANUP_ARTIFACT', 'compatible packageIdentity'),
    profileIdentity: nonEmptyString(compatibleWith.profileIdentity, 'GRAPH_CLEANUP_ARTIFACT', 'compatible profileIdentity'),
  };
}

function validateRetainedGraphArtifact(artifact, compatibleWith) {
  if (!isRecord(artifact)) fail('GRAPH_CLEANUP_ARTIFACT', 'retained Graph artifact metadata is required');
  exactKeys(artifact, ['cleanupTrigger', 'owner', 'packageIdentity', 'profileIdentity', 'recoveryPurpose'], 'GRAPH_CLEANUP_ARTIFACT', 'retained Graph artifact');
  for (const field of ['cleanupTrigger', 'owner', 'packageIdentity', 'profileIdentity', 'recoveryPurpose']) {
    nonEmptyString(artifact[field], 'GRAPH_CLEANUP_ARTIFACT', field);
  }
  if (artifact.profileIdentity !== compatibleWith.profileIdentity || artifact.packageIdentity !== compatibleWith.packageIdentity) {
    fail('GRAPH_CLEANUP_ARTIFACT_COMPATIBILITY', 'retained Graph artifact identities are not compatible with the active profile/package identities');
  }
  return freeze({ kind: 'retained-artifact-valid', ...artifact }, 'retained Graph artifact validation');
}

export function validateRetainedGraphArtifacts(input) {
  if (!isRecord(input)) fail('GRAPH_CLEANUP_ARTIFACT', 'retained Graph artifact set input is required');
  exactKeys(input, ['artifacts', 'compatibleWith'], 'GRAPH_CLEANUP_ARTIFACT', 'retained Graph artifact set');
  if (!Array.isArray(input.artifacts)) fail('GRAPH_CLEANUP_ARTIFACT', 'retained Graph artifacts must be an array');
  const compatibleWith = validateCompatibility(input.compatibleWith);
  return freeze({
    kind: 'retained-artifacts-valid',
    count: String(input.artifacts.length),
    artifacts: input.artifacts.map((artifact) => validateRetainedGraphArtifact(artifact, compatibleWith)),
  }, 'retained Graph artifact set validation');
}
