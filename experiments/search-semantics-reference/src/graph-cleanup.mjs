import { frozenCanonicalClone } from './canonical.mjs';
import { exactKeys, fail, isRecord } from './errors.mjs';

function freeze(value, label) {
  return frozenCanonicalClone(value, label);
}

function decimal(value, code, label) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail(code, `${label} must be a canonical decimal string`);
  return BigInt(value);
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
  exactKeys(input, ['ledger', 'nativeResourcesDestroyed'], 'GRAPH_CLEANUP_RECONCILE', 'Graph arena release reconciliation');
  if (!isRecord(input.ledger)) fail('GRAPH_CLEANUP_RECONCILE', 'Graph cleanup ledger is required');
  exactKeys(input.ledger, LEDGER_FIELDS, 'GRAPH_CLEANUP_RECONCILE', 'Graph cleanup ledger');
  if (typeof input.nativeResourcesDestroyed !== 'boolean') fail('GRAPH_CLEANUP_RECONCILE', 'nativeResourcesDestroyed must be boolean');
  if (input.nativeResourcesDestroyed) fail('GRAPH_CLEANUP_ORDER', 'CUDA-JS/native resources cannot be destroyed before Graph cleanup reconciliation succeeds');

  const outstanding = [];
  for (const field of LEDGER_FIELDS) {
    const count = decimal(input.ledger[field], 'GRAPH_CLEANUP_RECONCILE', field);
    if (count !== 0n) outstanding.push({ field, count: count.toString() });
  }
  if (outstanding.length !== 0) {
    return freeze({ kind: 'blocked', code: 'graph-cleanup-incomplete', outstanding }, 'Graph cleanup blocked result');
  }
  return freeze({
    kind: 'ready-for-native-destruction',
    graphCleanupComplete: true,
    nativeResourcesDestroyed: false,
  }, 'Graph cleanup reconciliation success');
}

export function validateRetainedGraphArtifact(input) {
  if (!isRecord(input)) fail('GRAPH_CLEANUP_ARTIFACT', 'retained Graph artifact metadata is required');
  exactKeys(input, ['cleanupTrigger', 'owner', 'packageIdentity', 'profileIdentity', 'recoveryPurpose'], 'GRAPH_CLEANUP_ARTIFACT', 'retained Graph artifact');
  for (const field of ['cleanupTrigger', 'owner', 'packageIdentity', 'profileIdentity', 'recoveryPurpose']) {
    if (typeof input[field] !== 'string' || input[field].trim().length === 0) fail('GRAPH_CLEANUP_ARTIFACT', `${field} must be an explicit non-empty string`);
  }
  return freeze({ kind: 'retained-artifact-valid', ...input }, 'retained Graph artifact validation');
}

export function validateRetainedGraphArtifacts(inputs) {
  if (!Array.isArray(inputs)) fail('GRAPH_CLEANUP_ARTIFACT', 'retained Graph artifacts must be an array');
  return freeze({
    kind: 'retained-artifacts-valid',
    count: String(inputs.length),
    artifacts: inputs.map((input) => validateRetainedGraphArtifact(input)),
  }, 'retained Graph artifact set validation');
}
