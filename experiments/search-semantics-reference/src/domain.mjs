import { canonicalClone, canonicalIdentity, frozenCanonicalClone } from './canonical.mjs';
import { HarnessError, assertNamespacedId, exactKeys, fail, isRecord } from './errors.mjs';

const PROFILE_ENTRY_FIELDS = ['id', 'identity', 'normalized'];
const DEFINITION_FIELDS = [
  'actionKey',
  'actionProjection',
  'advanceHistory',
  'applyTransition',
  'classifyPathRelation',
  'classifyRole',
  'normalizeAction',
  'normalizeHistory',
  'normalizeRoot',
  'normalizeState',
  'produceActions',
  'profileId',
  'stateKey',
  'stateViewProjection',
  'terminalOutcome',
];

function domainFail(code, message, disposition = null) {
  const error = new HarnessError(code, message);
  if (disposition !== null) error.disposition = disposition;
  throw error;
}

function canonicalEqual(left, right) {
  return JSON.stringify(canonicalClone(left)) === JSON.stringify(canonicalClone(right));
}

function assertDecimalUint(value, code, label) {
  if (typeof value !== 'string' || !/^(?:0|[1-9][0-9]*)$/.test(value)) fail(code, `${label} must be a canonical decimal unsigned integer`);
  return value;
}

function assertCapacity(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) fail('DOMAIN_CAPACITY', `${label} must be a non-negative safe integer`);
  return value;
}

function assertFunctionOrNull(value, label) {
  if (value !== null && typeof value !== 'function') fail('DOMAIN_DEFINITION', `${label} must be a function or null`);
}

function mapById(values, code, label) {
  if (!Array.isArray(values)) fail(code, `${label} must be an array`);
  const result = new Map();
  for (const value of values) {
    if (!isRecord(value) || typeof value.id !== 'string') fail(code, `${label} contains an invalid entry`);
    if (result.has(value.id)) fail(code, `${label} repeats ${value.id}`);
    result.set(value.id, value);
  }
  return result;
}

export function createDomainOracle(profileEntry, definition) {
  exactKeys(profileEntry, PROFILE_ENTRY_FIELDS, 'DOMAIN_PROFILE_ENTRY', 'Domain profile projection entry');
  exactKeys(profileEntry.identity, ['algorithm', 'byteLength', 'sha256'], 'DOMAIN_PROFILE_IDENTITY', `${profileEntry.id} identity`);
  if (profileEntry.id !== profileEntry.normalized.id) fail('DOMAIN_PROFILE_IDENTITY', 'Domain profile entry ID does not match its normalized profile');
  if (!canonicalEqual(canonicalIdentity(profileEntry.normalized, `${profileEntry.id} normalized profile`), profileEntry.identity)) {
    fail('DOMAIN_PROFILE_IDENTITY', `${profileEntry.id} normalized profile does not match its Composer identity`);
  }

  exactKeys(definition, DEFINITION_FIELDS, 'DOMAIN_DEFINITION', `${profileEntry.id} definition`);
  if (definition.profileId !== profileEntry.id) fail('DOMAIN_DEFINITION', `${profileEntry.id} definition profile ID is incompatible`);
  for (const field of DEFINITION_FIELDS.filter((field) => !['advanceHistory', 'normalizeHistory', 'profileId'].includes(field))) {
    if (typeof definition[field] !== 'function') fail('DOMAIN_DEFINITION', `${profileEntry.id} ${field} must be a function`);
  }
  assertFunctionOrNull(definition.advanceHistory, `${profileEntry.id} advanceHistory`);
  assertFunctionOrNull(definition.normalizeHistory, `${profileEntry.id} normalizeHistory`);

  const profile = canonicalClone(profileEntry.normalized, `${profileEntry.id} profile`);
  const roles = mapById(profile.roles, 'DOMAIN_PROFILE_ROLE', `${profile.id} roles`);
  const sources = mapById(profile.actionSources, 'DOMAIN_PROFILE_SOURCE', `${profile.id} action sources`);
  const transitionModes = mapById(profile.transitionModes, 'DOMAIN_PROFILE_TRANSITION', `${profile.id} transition modes`);
  const ports = new Set(profile.ports.map(({ id }) => id));
  const historyDisposition = profile.history.disposition;
  if ((historyDisposition === 'carried' || historyDisposition === 'hybrid') !== ports.has('advance-history')) {
    fail('DOMAIN_PROFILE_HISTORY', `${profile.id} history disposition and advance-history port disagree`);
  }
  if (ports.has('advance-history') !== (definition.advanceHistory !== null)) {
    fail('DOMAIN_DEFINITION', `${profile.id} advanceHistory definition does not match the selected port`);
  }

  function normalizeView(input, label = 'state view') {
    exactKeys(input, ['history', 'profileId', 'scopeId', 'state'], 'DOMAIN_STATE_FIELDS', label);
    if (input.profileId !== profile.id) fail('DOMAIN_STATE_PROFILE', `${label} has the wrong profile`);
    const scopeId = assertNamespacedId(input.scopeId, 'DOMAIN_STATE_SCOPE', `${label} scopeId`);
    const state = canonicalClone(definition.normalizeState(frozenCanonicalClone(input.state, `${label} state`)), `${label} normalized state`);
    let history = null;
    if (historyDisposition === 'carried' || historyDisposition === 'hybrid') {
      history = canonicalClone(definition.normalizeHistory(frozenCanonicalClone(input.history, `${label} history`)), `${label} normalized history`);
    } else if (input.history !== null) {
      fail('DOMAIN_STATE_HISTORY', `${label} must not carry separate history for ${historyDisposition} history`);
    }
    return { profileId: profile.id, scopeId, state, history };
  }

  function stateProjection(view) {
    return canonicalClone(definition.stateViewProjection(frozenCanonicalClone(view, 'state view projection input')), 'state view projection');
  }

  function identityOf(input) {
    const view = normalizeView(input);
    const projection = {
      profileIdentity: profileEntry.identity.sha256,
      scopeId: view.scopeId,
      semanticStateView: stateProjection(view),
    };
    const key = frozenCanonicalClone(definition.stateKey(frozenCanonicalClone(projection, 'state key input')), 'state identity key');
    return Object.freeze({ view: frozenCanonicalClone(view), key, verification: canonicalIdentity(projection, 'domain state identity') });
  }

  function equalState(leftInput, rightInput) {
    if ((isRecord(leftInput) && typeof leftInput.profileId === 'string' && leftInput.profileId !== profile.id)
        || (isRecord(rightInput) && typeof rightInput.profileId === 'string' && rightInput.profileId !== profile.id)) {
      return false;
    }
    const left = identityOf(leftInput);
    const right = identityOf(rightInput);
    const equal = canonicalEqual(stateProjection(left.view), stateProjection(right.view))
      && left.view.scopeId === right.view.scopeId;
    if (equal && !canonicalEqual(left.key, right.key)) {
      domainFail('DOMAIN_IDENTITY_INCONSISTENT', 'equal state views produced different identity keys', 'quarantine-dependent-evidence');
    }
    return equal;
  }

  function roleOf(input) {
    const identity = identityOf(input);
    const roleId = assertNamespacedId(definition.classifyRole(frozenCanonicalClone(identity.view, 'classifyRole input')), 'DOMAIN_ROLE', 'role ID');
    const role = roles.get(roleId);
    if (!role) fail('DOMAIN_ROLE', `${profile.id} definition returned undeclared role ${roleId}`);
    return { identity, role: frozenCanonicalClone(role, `${roleId} role`) };
  }

  function validateRoot(rootInput, phase = 'pre-admission') {
    if (phase !== 'pre-admission') fail('DOMAIN_ROOT_PHASE', 'root validation is permitted only before admission/mutation');
    const normalized = definition.normalizeRoot(frozenCanonicalClone(rootInput, 'root descriptor'));
    exactKeys(normalized, ['history', 'profileId', 'scopeId', 'state'], 'DOMAIN_ROOT_RESULT', 'normalized root');
    const { identity, role } = roleOf(normalized);
    return frozenCanonicalClone({ view: identity.view, identity: { key: identity.key, verification: identity.verification }, role }, 'validated root');
  }

  function actionScope(originIdentity, productionIncarnation) {
    return {
      profileId: profile.id,
      scopeId: originIdentity.view.scopeId,
      originIdentity: originIdentity.verification.sha256,
      productionIncarnation: assertDecimalUint(productionIncarnation, 'DOMAIN_ACTION_INCARNATION', 'productionIncarnation'),
    };
  }

  function validateAction({ origin: originInput, productionIncarnation, candidate }) {
    const origin = identityOf(originInput);
    const scope = actionScope(origin, productionIncarnation);
    const payload = canonicalClone(definition.normalizeAction(
      frozenCanonicalClone(candidate, 'candidate action'),
      frozenCanonicalClone(origin.view, 'candidate origin'),
    ), 'normalized action');
    const projection = canonicalClone(definition.actionProjection(
      frozenCanonicalClone(payload, 'action projection payload'),
      frozenCanonicalClone(origin.view, 'action projection origin'),
    ), 'action projection');
    const key = frozenCanonicalClone(definition.actionKey(frozenCanonicalClone({ scope, projection }, 'action key input')), 'action key');
    return frozenCanonicalClone({ ...scope, key, payload }, 'validated action');
  }

  function actionProjection(scopedAction, origin) {
    return canonicalClone(definition.actionProjection(
      frozenCanonicalClone(scopedAction.payload, 'scoped action payload'),
      frozenCanonicalClone(origin.view, 'scoped action origin'),
    ), 'scoped action projection');
  }

  function assertActionScope(scopedAction, originInput, productionIncarnation = null) {
    exactKeys(scopedAction, ['key', 'originIdentity', 'payload', 'productionIncarnation', 'profileId', 'scopeId'], 'DOMAIN_ACTION_FIELDS', 'scoped action');
    const origin = identityOf(originInput);
    const expected = actionScope(origin, productionIncarnation ?? scopedAction.productionIncarnation);
    if (scopedAction.profileId !== expected.profileId
        || scopedAction.scopeId !== expected.scopeId
        || scopedAction.originIdentity !== expected.originIdentity
        || scopedAction.productionIncarnation !== expected.productionIncarnation) {
      fail('DOMAIN_ACTION_SCOPE', 'action is stale or belongs to a foreign origin/incarnation');
    }
    const normalized = validateAction({ origin: origin.view, productionIncarnation: expected.productionIncarnation, candidate: scopedAction.payload });
    if (!canonicalEqual(normalized.key, scopedAction.key) || !canonicalEqual(normalized.payload, scopedAction.payload)) {
      fail('DOMAIN_ACTION_INVALID', 'scoped action payload or key is invalid');
    }
    return { origin, action: normalized };
  }

  function equalAction(left, right, originInput) {
    const leftChecked = assertActionScope(left, originInput);
    const rightChecked = assertActionScope(right, originInput);
    const equal = leftChecked.action.productionIncarnation === rightChecked.action.productionIncarnation
      && canonicalEqual(actionProjection(leftChecked.action, leftChecked.origin), actionProjection(rightChecked.action, rightChecked.origin));
    if (equal && !canonicalEqual(leftChecked.action.key, rightChecked.action.key)) {
      domainFail('DOMAIN_ACTION_IDENTITY_INCONSISTENT', 'equal actions produced different action keys', 'quarantine-dependent-evidence');
    }
    return equal;
  }

  function normalizeCursor(cursor, origin, sourceId, productionIncarnation) {
    if (cursor === null) return null;
    exactKeys(cursor, ['originIdentity', 'productionIncarnation', 'profileId', 'scopeId', 'sourceId', 'value'], 'DOMAIN_CURSOR_FIELDS', 'action cursor');
    const expected = actionScope(origin, productionIncarnation);
    if (cursor.profileId !== expected.profileId
        || cursor.scopeId !== expected.scopeId
        || cursor.originIdentity !== expected.originIdentity
        || cursor.productionIncarnation !== expected.productionIncarnation
        || cursor.sourceId !== sourceId) {
      fail('DOMAIN_CURSOR_SCOPE', 'action cursor is stale or belongs to a foreign source/origin/incarnation');
    }
    return canonicalClone(cursor.value, 'action cursor value');
  }

  function scopedCursor(value, origin, sourceId, productionIncarnation) {
    if (value === null) return null;
    return frozenCanonicalClone({ ...actionScope(origin, productionIncarnation), sourceId, value: canonicalClone(value, 'next cursor value') }, 'scoped action cursor');
  }

  function produceActions(input) {
    exactKeys(input, ['cancelled', 'capacity', 'cursor', 'origin', 'productionIncarnation', 'randomInputs', 'sourceId'], 'DOMAIN_PRODUCE_FIELDS', 'produceActions input');
    const originRole = roleOf(input.origin);
    if (originRole.role.terminal) fail('DOMAIN_TERMINAL_ACTION', 'terminal roles cannot produce actions');
    const source = sources.get(input.sourceId);
    if (!source || !originRole.role.actionSources.includes(input.sourceId)) fail('DOMAIN_ACTION_SOURCE', 'action source is not selected for the origin role');
    if (source.kind !== 'intrinsic') fail('DOMAIN_ACTION_SOURCE_EXTERNAL', 'admitted/combined producer readiness and execution remain externally owned');
    const capacity = assertCapacity(input.capacity, 'produceActions capacity');
    const productionIncarnation = assertDecimalUint(input.productionIncarnation, 'DOMAIN_ACTION_INCARNATION', 'productionIncarnation');
    const cursor = normalizeCursor(input.cursor, originRole.identity, source.id, productionIncarnation);
    const randomInputs = canonicalClone(input.randomInputs, 'produceActions random inputs');
    if (!Array.isArray(randomInputs)) fail('DOMAIN_RANDOM_INPUT', 'produceActions randomInputs must be an array');
    if (input.cancelled === true) return frozenCanonicalClone({ status: 'cancelled', reservationDisposition: 'return-to-owner' });
    if (input.cancelled !== false) fail('DOMAIN_CANCELLATION', 'produceActions cancelled must be boolean');

    const raw = definition.produceActions({
      origin: frozenCanonicalClone(originRole.identity.view),
      role: originRole.role,
      source: frozenCanonicalClone(source),
      cursor: frozenCanonicalClone(cursor),
      capacity,
      randomInputs: frozenCanonicalClone(randomInputs),
    });
    if (!isRecord(raw) || typeof raw.status !== 'string') fail('DOMAIN_PRODUCE_RESULT', 'produceActions returned an invalid result');
    if (raw.status === 'capacity-required') {
      exactKeys(raw, ['requiredCapacity', 'status'], 'DOMAIN_PRODUCE_RESULT', 'capacity-required result');
      return frozenCanonicalClone({ status: raw.status, requiredCapacity: assertCapacity(raw.requiredCapacity, 'required action capacity'), reservationDisposition: 'return-to-owner' });
    }
    if (raw.status === 'no-action-complete') {
      exactKeys(raw, ['status'], 'DOMAIN_PRODUCE_RESULT', 'no-action-complete result');
      return frozenCanonicalClone({ status: raw.status, classification: originRole.role.zeroActionDisposition });
    }
    if (!['batch-ready-more', 'batch-ready-complete'].includes(raw.status)) fail('DOMAIN_PRODUCE_RESULT', `unsupported produceActions status ${raw.status}`);
    exactKeys(raw, ['actions', 'nextCursor', 'status'], 'DOMAIN_PRODUCE_RESULT', `${raw.status} result`);
    if (!Array.isArray(raw.actions) || raw.actions.length > capacity || raw.actions.length > Number(source.maxActions)) {
      fail('DOMAIN_PRODUCE_RESULT', 'produceActions exceeded its finite admitted capacity');
    }
    const actions = raw.actions.map((candidate) => validateAction({ origin: originRole.identity.view, productionIncarnation, candidate }));
    if (source.multiplicity === 'unique') {
      for (let index = 0; index < actions.length; index += 1) {
        for (let other = index + 1; other < actions.length; other += 1) {
          if (equalAction(actions[index], actions[other], originRole.identity.view)) fail('DOMAIN_ACTION_DUPLICATE', 'unique action source emitted duplicate semantic actions');
        }
      }
    }
    if (raw.status === 'batch-ready-more' && raw.nextCursor === null) fail('DOMAIN_CURSOR_INVALID', 'batch-ready-more requires a continuation cursor');
    if (raw.status === 'batch-ready-complete' && raw.nextCursor !== null) fail('DOMAIN_CURSOR_INVALID', 'batch-ready-complete cannot retain a continuation cursor');
    return frozenCanonicalClone({
      status: raw.status,
      actions,
      cursor: scopedCursor(raw.nextCursor, originRole.identity, source.id, productionIncarnation),
    });
  }

  function applyTransition(input) {
    exactKeys(input, ['action', 'cancelled', 'input', 'origin', 'outputCapacity', 'transitionIncarnation'], 'DOMAIN_TRANSITION_FIELDS', 'applyTransition input');
    const checked = assertActionScope(input.action, input.origin);
    const role = roles.get(definition.classifyRole(frozenCanonicalClone(checked.origin.view)));
    if (!role || role.terminal || !role.transitionMode) fail('DOMAIN_TRANSITION_ROLE', 'origin role cannot apply a transition');
    const mode = transitionModes.get(role.transitionMode);
    if (!mode) fail('DOMAIN_TRANSITION_MODE', `origin role references unknown transition mode ${role.transitionMode}`);
    const transitionIncarnation = assertDecimalUint(input.transitionIncarnation, 'DOMAIN_TRANSITION_INCARNATION', 'transitionIncarnation');
    const outputCapacity = assertCapacity(input.outputCapacity, 'transition outputCapacity');
    if (input.cancelled === true) return frozenCanonicalClone({ status: 'cancelled', reservationDisposition: 'return-to-owner' });
    if (input.cancelled !== false) fail('DOMAIN_CANCELLATION', 'applyTransition cancelled must be boolean');
    const raw = definition.applyTransition({
      origin: frozenCanonicalClone(checked.origin.view),
      action: frozenCanonicalClone(checked.action),
      mode: frozenCanonicalClone(mode),
      input: frozenCanonicalClone(input.input, 'transition input'),
      transitionIncarnation,
    });
    exactKeys(raw, ['history', 'metadata', 'requiredCapacity', 'state', 'status'], 'DOMAIN_TRANSITION_RESULT', 'transition result');
    if (raw.status !== 'success') fail('DOMAIN_TRANSITION_RESULT', `unsupported transition status ${raw.status}`);
    const requiredCapacity = assertCapacity(raw.requiredCapacity, 'transition requiredCapacity');
    if (requiredCapacity > outputCapacity) {
      return frozenCanonicalClone({ status: 'capacity-required', requiredCapacity, reservationDisposition: 'return-to-owner' });
    }
    const successorView = normalizeView({ profileId: profile.id, scopeId: checked.origin.view.scopeId, state: raw.state, history: raw.history }, 'successor state view');
    const successor = roleOf(successorView);
    if (!role.successorRoles.includes(successor.role.id)) fail('DOMAIN_TRANSITION_SUCCESSOR_ROLE', `transition produced disallowed successor role ${successor.role.id}`);
    return frozenCanonicalClone({
      status: 'success',
      successor: { view: successor.identity.view, identity: { key: successor.identity.key, verification: successor.identity.verification }, role: successor.role },
      metadata: canonicalClone(raw.metadata, 'transition metadata'),
    });
  }

  function advanceHistory(input) {
    if (definition.advanceHistory === null) fail('DOMAIN_HISTORY_PORT', `${profile.id} has no advance-history port`);
    exactKeys(input, ['history', 'input', 'state'], 'DOMAIN_HISTORY_FIELDS', 'advanceHistory input');
    const state = definition.normalizeState(frozenCanonicalClone(input.state, 'advanceHistory state'));
    const history = definition.normalizeHistory(frozenCanonicalClone(input.history, 'advanceHistory history'));
    return frozenCanonicalClone(definition.advanceHistory({
      state: frozenCanonicalClone(state),
      history: frozenCanonicalClone(history),
      input: frozenCanonicalClone(input.input, 'advanceHistory input'),
    }), 'advanced history');
  }

  function classifyPathRelation(leftInput, rightInput) {
    const left = identityOf(leftInput);
    const right = identityOf(rightInput);
    const relation = definition.classifyPathRelation({ left: frozenCanonicalClone(left.view), right: frozenCanonicalClone(right.view) });
    return assertNamespacedId(relation, 'DOMAIN_PATH_RELATION', 'path relation');
  }

  function terminalOutcome(input) {
    const { identity, role } = roleOf(input);
    if (!role.terminal) fail('DOMAIN_TERMINAL_ROLE', 'terminalOutcome requires a terminal state view');
    return frozenCanonicalClone(definition.terminalOutcome(frozenCanonicalClone(identity.view, 'terminalOutcome input')), 'terminal outcome');
  }

  function classifyReuse(boundary) {
    const selected = profile.history.reuse.find((entry) => entry.boundary === boundary);
    if (!selected) fail('DOMAIN_REUSE_BOUNDARY', `${profile.id} has no reuse classification for ${boundary}`);
    return selected.disposition;
  }

  function teardownProfile(input) {
    exactKeys(input, ['admittedRangeReferences', 'domainMetadata', 'phase'], 'DOMAIN_TEARDOWN_FIELDS', 'Domain-profile teardown input');
    if (input.phase !== 'terminal') fail('DOMAIN_TEARDOWN_PHASE', 'Domain-profile teardown requires terminal owner state');
    if (!isRecord(input.domainMetadata)) fail('DOMAIN_TEARDOWN_METADATA', 'domainMetadata must be a finite record');
    if (!Array.isArray(input.admittedRangeReferences)) fail('DOMAIN_TEARDOWN_RANGES', 'admittedRangeReferences must be an array');
    const admittedRangeReferences = input.admittedRangeReferences.map((reference) =>
      assertNamespacedId(reference, 'DOMAIN_TEARDOWN_RANGES', 'admitted range reference'));
    if (new Set(admittedRangeReferences).size !== admittedRangeReferences.length) fail('DOMAIN_TEARDOWN_RANGES', 'admitted range references must be unique');
    return frozenCanonicalClone({
      status: 'released',
      released: {
        admittedRangeReferences,
        domainMetadataEntries: Object.keys(canonicalClone(input.domainMetadata, 'domain teardown metadata')).length,
      },
      retained: { admittedRangeReferences: 0, domainMetadataEntries: 0 },
      foreignResourceDisposition: 'unchanged-by-domain',
    }, 'Domain-profile teardown result');
  }

  return Object.freeze({
    profileId: profile.id,
    profileIdentity: frozenCanonicalClone(profileEntry.identity),
    validateRoot,
    identityOf,
    equalState,
    roleOf,
    validateAction,
    equalAction,
    produceActions,
    applyTransition,
    advanceHistory,
    classifyPathRelation,
    terminalOutcome,
    classifyReuse,
    teardownProfile,
  });
}
