import {
  assertString,
  canonicalIdentity,
  compareDecimalUint,
  compareRaw,
  exactKeys,
  fail,
  normalizeDecimalUint,
  uniqueBy,
} from './validation.mjs';
import {
  assertNamespacedId,
  assertSha256,
  assertVersion,
  normalizeContentIdentity,
  normalizeSchemaReference,
} from './foundation.mjs';

const SESSION_SCHEMA = 'cuda-mcgs.session-profile/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const SESSION_CONTRACT = 'SPEC-0006';
const TRANSACTION_STATES = ['vacant', 'validating', 'admitting', 'prepared', 'committing', 'committed', 'aborting', 'aborted', 'quarantined'];
const LIFECYCLE_STATES = ['profile-normalized', 'resources-admitted', 'initialized', 'active-external-wait', 'cancelling-draining', 'terminal', 'released'];
const TEARDOWN_ORDER = ['stop-inputs', 'stop-acquisition', 'abort-prepared', 'dispose-work', 'quiesce-borrows', 'release-owner-state', 'preserve-terminal-borrow', 'release-cuda-js-opaque-state'];
const REQUIRED_PORTS = new Map([
  ['validateSessionInput', 'host-preignition'], ['prepareRootUpdate', 'device-active'], ['prepareControlChange', 'device-active'],
  ['commitSessionTransaction', 'device-active'], ['abortSessionTransaction', 'device-active'], ['requestObservation', 'host-async'],
  ['acquireObservation', 'host-async'], ['releaseObservation', 'host-async'], ['requestCancellation', 'host-async'],
  ['completeSession', 'device-active'], ['teardownSession', 'host-async'],
]);
const REQUIRED_STATUSES = new Map([
  ['invalid-session-profile', 'fatal'], ['session-command-capacity', 'pressure'], ['session-command-duplicate', 'reject'],
  ['session-command-stale', 'reject'], ['session-control-invalid', 'reject'], ['session-control-conflict', 'reject'],
  ['root-invalid', 'reject'], ['root-update-pressure', 'pressure'], ['root-update-conflict', 'reject'],
  ['root-epoch-exhausted', 'stop'], ['session-cancelling', 'cancellation'], ['session-restart-required', 'stop'],
  ['session-terminal', 'normal'], ['session-internal-failure', 'fatal'], ['root-update-accepted', 'normal'],
  ['session-observation-unavailable', 'pending'], ['session-observation-stale', 'reject'], ['session-observation-pressure', 'pressure'],
]);
const CONTROL_STATUSES = new Set(['session-control-invalid', 'session-control-conflict']);
const OBSERVATION_STATUSES = new Set(['session-observation-unavailable', 'session-observation-stale', 'session-observation-pressure']);
const COUNTER_KINDS = ['session-incarnation', 'root-epoch', 'command', 'observation-generation', 'reclamation-generation'];
const BASE_CLEANUP_KINDS = ['command', 'transaction', 'compound-lease', 'old-epoch-work', 'diagnostic', 'program-artifact', 'session-counter', 'root-protection'];
const OBSERVATION_CLEANUP_KINDS = ['observation-request', 'borrow', 'transfer'];
const BASE_PUBLIC_REQUIREMENTS = [
  'cuda-js.device-js/0.1.0',
  'cuda-js.operation-lifecycle/0.1.0',
  'cuda-js.publication-mailbox/0.1.0',
];
const OBSERVATION_PUBLIC_REQUIREMENTS = [
  'cuda-js.async-transfer/0.1.0',
  'cuda-js.scoped-atomic-observation/0.1.0',
];

function assertEnum(value, allowed, code, label) {
  if (!allowed.includes(value)) fail(code, `${label} is invalid`);
  return value;
}

function positiveDecimal(value, code, label) {
  const normalized = normalizeDecimalUint(value, label);
  if (normalized === '0') fail(code, `${label} must be positive`);
  return normalized;
}

function namespacedSet(input, code, label, minimum = 0) {
  if (!Array.isArray(input) || input.length < minimum) fail(code, `${label} must contain at least ${minimum} item(s)`);
  const normalized = input.map((value, index) => (assertNamespacedId(value, code, `${label} ${index}`), value));
  if (new Set(normalized).size !== normalized.length) fail(code, `${label} contains a duplicate`);
  return normalized.sort(compareRaw);
}

function schemaKey(reference) { return `${reference.id}\0${reference.version}\0${reference.sha256}`; }
function profileKey(profile) { return `${profile.id}\0${schemaKey(profile.schema)}\0${profile.identity.sha256}`; }
function contractKey(contract) {
  return contract.kind === 'catalog'
    ? `${contract.kind}\0${contract.id}\0${contract.specificationIdentity}\0${contract.sha256}`
    : `${contract.kind}\0${contract.id}\0${contract.version}\0${contract.schema}\0${contract.sha256}`;
}

function normalizeProfileReference(input, label) {
  exactKeys(input, ['id', 'schema', 'identity'], 'SESSION_PROFILE_REFERENCE_FIELDS', label);
  assertNamespacedId(input.id, 'SESSION_PROFILE_REFERENCE_ID', `${label} id`);
  return {
    id: input.id,
    schema: normalizeSchemaReference(input.schema, `${label} schema`),
    identity: normalizeContentIdentity(input.identity, 'SESSION_PROFILE_REFERENCE_IDENTITY', `${label} identity`),
  };
}

function normalizeContract(input, catalogById, label) {
  if (input?.kind === 'catalog') {
    exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], 'SESSION_CONTRACT_FIELDS', label);
    assertString(input.id, /^SPEC-[0-9]{4}$/, 'SESSION_CONTRACT_ID', `${label} id`);
    assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+-draft$/, 'SESSION_CONTRACT_ID', `${label} specificationIdentity`);
    assertSha256(input.sha256, 'SESSION_CONTRACT_DIGEST', `${label} sha256`);
    const expected = catalogById.get(input.id);
    if (!expected || expected.specificationIdentity !== input.specificationIdentity || expected.sha256 !== input.sha256) fail('SESSION_CONTRACT_DRIFT', `${label} differs from frozen catalog`);
    return { ...input };
  }
  exactKeys(input, ['kind', 'id', 'version', 'schema', 'sha256'], 'SESSION_CONTRACT_FIELDS', label);
  if (input.kind !== 'namespaced') fail('SESSION_CONTRACT_KIND', `${label} kind is invalid`);
  assertNamespacedId(input.id, 'SESSION_CONTRACT_ID', `${label} id`);
  assertVersion(input.version, 'SESSION_CONTRACT_VERSION', `${label} version`);
  assertString(input.schema, /^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/, 'SESSION_CONTRACT_SCHEMA', `${label} schema`);
  assertSha256(input.sha256, 'SESSION_CONTRACT_DIGEST', `${label} sha256`);
  if (!input.schema.endsWith(`/${input.version}`)) fail('SESSION_CONTRACT_VERSION', `${label} schema/version differ`);
  return { ...input };
}

function normalizeIdentity(input) {
  exactKeys(input, ['session', 'incarnation', 'root', 'rootEpoch', 'command', 'transaction'], 'SESSION_IDENTITY_FIELDS', 'identity');
  return Object.fromEntries(Object.keys(input).map((key) => [key, normalizeSchemaReference(input[key], `identity ${key}`)]));
}

function normalizeInput(input, index, ownerById, permissions) {
  exactKeys(input, ['id', 'kind', 'schema', 'owner', 'permission', 'authority', 'idempotence', 'epochScope', 'maxBytes', 'pressureStatus', 'effect', 'deviceApplicationPoint', 'runtimeCode'], 'SESSION_INPUT_FIELDS', `input ${index}`);
  assertNamespacedId(input.id, 'SESSION_INPUT_ID', `input ${index} id`);
  assertNamespacedId(input.owner, 'SESSION_INPUT_OWNER', `${input.id} owner`);
  if (!ownerById.has(input.owner)) fail('SESSION_INPUT_OWNER', `${input.id} names unknown owner`);
  const permission = normalizeSchemaReference(input.permission, `${input.id} permission`);
  if (!permissions.has(schemaKey(permission))) fail('SESSION_INPUT_PERMISSION', `${input.id} permission is not selected`);
  const kind = assertEnum(input.kind, ['root-update', 'control', 'cancellation', 'observation-request'], 'SESSION_INPUT_KIND', `${input.id} kind`);
  const deviceApplicationPoint = input.deviceApplicationPoint === null ? null : normalizeSchemaReference(input.deviceApplicationPoint, `${input.id} deviceApplicationPoint`);
  if (['root-update', 'control'].includes(kind) !== (deviceApplicationPoint !== null)) fail('SESSION_INPUT_APPLICATION', `${input.id} application point differs from input kind`);
  if (input.runtimeCode !== false) fail('SESSION_INPUT_RUNTIME_CODE', `${input.id} permits runtime code`);
  return {
    id: input.id, kind, schema: normalizeSchemaReference(input.schema, `${input.id} schema`), owner: input.owner, permission,
    authority: normalizeSchemaReference(input.authority, `${input.id} authority`), idempotence: normalizeSchemaReference(input.idempotence, `${input.id} idempotence`),
    epochScope: assertEnum(input.epochScope, ['session', 'root-epoch', 'session-and-root-epoch'], 'SESSION_INPUT_EPOCH', `${input.id} epochScope`),
    maxBytes: positiveDecimal(input.maxBytes, 'SESSION_INPUT_RANGE', `${input.id} maxBytes`), pressureStatus: input.pressureStatus,
    effect: normalizeSchemaReference(input.effect, `${input.id} effect`), deviceApplicationPoint, runtimeCode: false,
  };
}

function normalizeCommands(input, ownerById, permissions, externalWait, rootClass, liveObservation) {
  exactKeys(input, ['capacity', 'maxBytes', 'order', 'conflict', 'coalescing', 'replay', 'authority', 'admissionBeforeMutation', 'hostProgress', 'inputs'], 'SESSION_COMMAND_FIELDS', 'commands');
  if (input.order !== 'arrival-total-order' || input.conflict !== 'typed-reject' || input.coalescing !== 'owner-declared-only'
      || input.replay !== 'original-terminal-or-typed-stale' || input.authority !== 'least-authority-versioned'
      || input.admissionBeforeMutation !== true || input.hostProgress !== 'none') fail('SESSION_COMMAND_CONTRACT', 'command contract is incomplete');
  const capacity = positiveDecimal(input.capacity, 'SESSION_COMMAND_RANGE', 'commands capacity');
  const maxBytes = positiveDecimal(input.maxBytes, 'SESSION_COMMAND_RANGE', 'commands maxBytes');
  if (compareDecimalUint(capacity, externalWait.maxPendingCommands) > 0 || compareDecimalUint(maxBytes, rootClass.formula.maximumUnits) > 0) fail('SESSION_COMMAND_CAPACITY', 'command range exceeds admitted progress/resource capacity');
  if (!Array.isArray(input.inputs)) fail('SESSION_INPUT_COUNT', 'commands inputs must be an array');
  const inputs = input.inputs.map((entry, index) => normalizeInput(entry, index, ownerById, permissions)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(inputs, 'id', 'SESSION_INPUT_DUPLICATE', 'input');
  if (inputs.some(({ maxBytes: inputBytes }) => compareDecimalUint(inputBytes, maxBytes) > 0)) fail('SESSION_COMMAND_CAPACITY', 'input exceeds command maxBytes');
  for (const kind of ['root-update', 'cancellation']) if (!inputs.some((entry) => entry.kind === kind)) fail('SESSION_INPUT_REQUIRED', `required ${kind} input is absent`);
  if (liveObservation !== inputs.some((entry) => entry.kind === 'observation-request')) fail('SESSION_INPUT_REQUIRED', 'observation request input differs from selected output observation');
  if (inputs.filter(({ kind }) => kind === 'root-update').length !== 1 || inputs.filter(({ kind }) => kind === 'cancellation').length !== 1) fail('SESSION_INPUT_COVERAGE', 'root/cancellation input cardinality is invalid');
  return { capacity, maxBytes, order: input.order, conflict: input.conflict, coalescing: input.coalescing, replay: input.replay, authority: input.authority, admissionBeforeMutation: true, hostProgress: input.hostProgress, inputs };
}

function normalizeStateFamily(input, index, ownerId) {
  exactKeys(input, ['id', 'classification', 'validity', 'transform', 'staleDisposition', 'release'], 'SESSION_STATE_FIELDS', `${ownerId} state ${index}`);
  assertNamespacedId(input.id, 'SESSION_STATE_ID', `${ownerId} state ${index} id`);
  const classification = assertEnum(input.classification, ['root-independent-retain', 'retain-if-key-valid', 'transform', 'reset', 'invalidate-retire', 'product-defined'], 'SESSION_STATE_CLASSIFICATION', `${input.id} classification`);
  const validity = input.validity === null ? null : normalizeSchemaReference(input.validity, `${input.id} validity`);
  const transform = input.transform === null ? null : normalizeSchemaReference(input.transform, `${input.id} transform`);
  if ((classification === 'retain-if-key-valid') !== (validity !== null) || (classification === 'transform') !== (transform !== null)) fail('SESSION_STATE_CLASSIFICATION', `${input.id} validity/transform differs from classification`);
  return { id: input.id, classification, validity, transform, staleDisposition: normalizeSchemaReference(input.staleDisposition, `${input.id} staleDisposition`), release: normalizeSchemaReference(input.release, `${input.id} release`) };
}

function normalizeOwner(input, index, catalogById, contributorById, sessionOwnerId) {
  exactKeys(input, ['id', 'role', 'contract', 'profile', 'prepare', 'commit', 'abort', 'cleanup', 'state'], 'SESSION_OWNER_FIELDS', `owner ${index}`);
  assertNamespacedId(input.id, 'SESSION_OWNER_ID', `owner ${index} id`);
  const expected = contributorById.get(input.id);
  if (!expected) fail('SESSION_OWNER_COVERAGE', `${input.id} is not a selected resource/progress contributor`);
  const contract = normalizeContract(input.contract, catalogById, `${input.id} contract`);
  const profile = normalizeProfileReference(input.profile, `${input.id} profile`);
  if (contractKey(contract) !== contractKey(expected.contract) || profileKey(profile) !== profileKey(expected.profile)) fail('SESSION_OWNER_PROFILE', `${input.id} differs from selected contributor`);
  const role = assertEnum(input.role, ['coordinator', 'participant'], 'SESSION_OWNER_ROLE', `${input.id} role`);
  if ((input.id === sessionOwnerId) !== (role === 'coordinator')) fail('SESSION_OWNER_ROLE', `${input.id} coordinator role is invalid`);
  if (!Array.isArray(input.state) || input.state.length === 0) fail('SESSION_STATE_COUNT', `${input.id} state must not be empty`);
  const state = input.state.map((entry, stateIndex) => normalizeStateFamily(entry, stateIndex, input.id)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(state, 'id', 'SESSION_STATE_DUPLICATE', `${input.id} state`);
  return {
    id: input.id, role, contract, profile,
    prepare: normalizeSchemaReference(input.prepare, `${input.id} prepare`), commit: normalizeSchemaReference(input.commit, `${input.id} commit`),
    abort: normalizeSchemaReference(input.abort, `${input.id} abort`), cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`), state,
  };
}

function assertExactMembers(actual, expected, code, label) {
  if (!Array.isArray(actual) || actual.length !== expected.length || new Set(actual).size !== actual.length || actual.some((id) => !expected.includes(id))) fail(code, `${label} must exactly cover participating owners`);
}

function normalizeTransaction(input, participantIds, rootReserve, rootAdmission) {
  exactKeys(input, ['states', 'linearization', 'preMutationAdmission', 'prepareOrder', 'commitOrder', 'abortOrder', 'compoundAdmission', 'rejectedEffect', 'duplicateEffect', 'partialCommit', 'concurrentOrder', 'completion', 'cleanup'], 'SESSION_TRANSACTION_FIELDS', 'transaction');
  if (!Array.isArray(input.states) || input.states.length !== TRANSACTION_STATES.length || input.states.some((state, index) => state !== TRANSACTION_STATES[index])
      || input.linearization !== 'root-epoch-publication' || input.preMutationAdmission !== true || input.rejectedEffect !== 'none'
      || input.duplicateEffect !== 'none' || input.partialCommit !== 'fatal-quarantine' || input.concurrentOrder !== 'single-authoritative-transaction-order') fail('SESSION_TRANSACTION_CONTRACT', 'transaction contract is incomplete');
  assertExactMembers(input.prepareOrder, participantIds, 'SESSION_TRANSACTION_ORDER', 'prepareOrder');
  assertExactMembers(input.commitOrder, participantIds, 'SESSION_TRANSACTION_ORDER', 'commitOrder');
  assertExactMembers(input.abortOrder, participantIds, 'SESSION_TRANSACTION_ORDER', 'abortOrder');
  if (input.abortOrder.some((id, index) => id !== [...input.prepareOrder].reverse()[index])) fail('SESSION_TRANSACTION_ORDER', 'abortOrder must reverse prepareOrder');
  exactKeys(input.compoundAdmission, ['resourceGroup', 'rootReserve', 'maxTransactions', 'rollback'], 'SESSION_ADMISSION_FIELDS', 'compoundAdmission');
  const maxTransactions = positiveDecimal(input.compoundAdmission.maxTransactions, 'SESSION_ADMISSION_RANGE', 'compoundAdmission maxTransactions');
  if (input.compoundAdmission.resourceGroup !== rootAdmission.id || input.compoundAdmission.rootReserve !== rootReserve.id
      || compareDecimalUint(maxTransactions, rootAdmission.maxTransactions) > 0 || schemaKey(normalizeSchemaReference(input.compoundAdmission.rollback, 'compoundAdmission rollback')) !== schemaKey(rootAdmission.rollback)) fail('SESSION_ADMISSION_BINDING', 'compound admission differs from resource plan');
  return {
    states: [...input.states], linearization: input.linearization, preMutationAdmission: true,
    prepareOrder: [...input.prepareOrder], commitOrder: [...input.commitOrder], abortOrder: [...input.abortOrder],
    compoundAdmission: { resourceGroup: input.compoundAdmission.resourceGroup, rootReserve: input.compoundAdmission.rootReserve, maxTransactions, rollback: normalizeSchemaReference(input.compoundAdmission.rollback, 'compoundAdmission rollback') },
    rejectedEffect: input.rejectedEffect, duplicateEffect: input.duplicateEffect, partialCommit: input.partialCommit, concurrentOrder: input.concurrentOrder,
    completion: normalizeSchemaReference(input.completion, 'transaction completion'), cleanup: normalizeSchemaReference(input.cleanup, 'transaction cleanup'),
  };
}

function normalizeWorkScope(input, index, workById) {
  exactKeys(input, ['workClass', 'scope', 'staleDisposition', 'release'], 'SESSION_WORK_SCOPE_FIELDS', `workScope ${index}`);
  assertNamespacedId(input.workClass, 'SESSION_WORK_SCOPE_ID', `workScope ${index} workClass`);
  if (!workById.has(input.workClass)) fail('SESSION_WORK_SCOPE_COVERAGE', `${input.workClass} is not selected progress work`);
  const scope = assertEnum(input.scope, ['engine', 'session', 'root-epoch'], 'SESSION_WORK_SCOPE', `${input.workClass} scope`);
  const staleDisposition = assertEnum(input.staleDisposition, ['not-applicable', 'applied-before-commit', 'abandoned-stale-root', 'transformed', 'owner-declared'], 'SESSION_WORK_STALE', `${input.workClass} staleDisposition`);
  if ((scope === 'root-epoch') === (staleDisposition === 'not-applicable')) fail('SESSION_WORK_STALE', `${input.workClass} stale disposition differs from epoch scope`);
  return { workClass: input.workClass, scope, staleDisposition, release: normalizeSchemaReference(input.release, `${input.workClass} release`) };
}

function normalizeRoot(input, ownerById, workById) {
  exactKeys(input, ['descriptorSchema', 'validationOwner', 'graphOwner', 'epochCounter', 'pressureOutcome', 'materialization', 'commit', 'oldRoot', 'publication', 'workScopes', 'rejectedOutcome', 'acceptedOutcome', 'exhaustedOutcome'], 'SESSION_ROOT_FIELDS', 'root');
  if (ownerById.get(input.validationOwner)?.contract.id !== 'SPEC-0007' || ownerById.get(input.graphOwner)?.contract.id !== 'SPEC-0010') fail('SESSION_ROOT_OWNER', 'root validation/graph owner is invalid');
  if (input.materialization !== 'prepare-nonauthoritative' || input.commit !== 'single-authoritative-linearization'
      || input.oldRoot !== 'authoritative-until-commit' || input.publication !== 'release-after-full-initialization') fail('SESSION_ROOT_CONTRACT', 'root authority contract is incomplete');
  const workScopes = input.workScopes.map((entry, index) => normalizeWorkScope(entry, index, workById)).sort((left, right) => compareRaw(left.workClass, right.workClass));
  uniqueBy(workScopes.map(({ workClass }) => ({ id: workClass })), 'id', 'SESSION_WORK_SCOPE_DUPLICATE', 'workScope');
  if (workScopes.length !== workById.size || [...workById.keys()].some((id) => !workScopes.some(({ workClass }) => workClass === id))) fail('SESSION_WORK_SCOPE_COVERAGE', 'root work scopes do not exactly cover selected progress work');
  assertNamespacedId(input.epochCounter, 'SESSION_ROOT_COUNTER', 'root epochCounter');
  return {
    descriptorSchema: normalizeSchemaReference(input.descriptorSchema, 'root descriptorSchema'), validationOwner: input.validationOwner, graphOwner: input.graphOwner, epochCounter: input.epochCounter,
    pressureOutcome: assertEnum(input.pressureOutcome, ['reject-keep-session', 'restart-required', 'reserved-admit'], 'SESSION_ROOT_PRESSURE', 'root pressureOutcome'),
    materialization: input.materialization, commit: input.commit, oldRoot: input.oldRoot, publication: input.publication, workScopes,
    rejectedOutcome: input.rejectedOutcome, acceptedOutcome: input.acceptedOutcome, exhaustedOutcome: input.exhaustedOutcome,
  };
}

function normalizeControl(input, index, ownerById, inputById) {
  exactKeys(input, ['id', 'owner', 'input', 'schema', 'authority', 'identity', 'idempotence', 'epochScope', 'effect', 'applicationPoint', 'visibility', 'pressureOutcome', 'mutationAfterCommit', 'hostProgress'], 'SESSION_CONTROL_FIELDS', `control ${index}`);
  assertNamespacedId(input.id, 'SESSION_CONTROL_ID', `control ${index} id`);
  const command = inputById.get(input.input);
  if (!command || command.kind !== 'control' || command.owner !== input.owner || ownerById.get(input.owner)?.role !== 'participant') fail('SESSION_CONTROL_INPUT', `${input.id} control input/owner is invalid`);
  const schema = normalizeSchemaReference(input.schema, `${input.id} schema`);
  const authority = normalizeSchemaReference(input.authority, `${input.id} authority`);
  const idempotence = normalizeSchemaReference(input.idempotence, `${input.id} idempotence`);
  const effect = normalizeSchemaReference(input.effect, `${input.id} effect`);
  const applicationPoint = normalizeSchemaReference(input.applicationPoint, `${input.id} applicationPoint`);
  if (schemaKey(schema) !== schemaKey(command.schema) || schemaKey(authority) !== schemaKey(command.authority) || schemaKey(idempotence) !== schemaKey(command.idempotence)
      || input.epochScope !== command.epochScope || schemaKey(effect) !== schemaKey(command.effect) || schemaKey(applicationPoint) !== schemaKey(command.deviceApplicationPoint)
      || input.mutationAfterCommit !== true || input.hostProgress !== 'none') fail('SESSION_CONTROL_CONTRACT', `${input.id} differs from admitted device-visible control`);
  return {
    id: input.id, owner: input.owner, input: input.input, schema, authority, identity: normalizeSchemaReference(input.identity, `${input.id} identity`), idempotence,
    epochScope: input.epochScope, effect, applicationPoint, visibility: normalizeSchemaReference(input.visibility, `${input.id} visibility`),
    pressureOutcome: input.pressureOutcome, mutationAfterCommit: true, hostProgress: input.hostProgress,
  };
}

function normalizeObservation(input, index, outputObservation, inputById, outputProfile) {
  exactKeys(input, ['id', 'outputProfile', 'requestInput', 'rootEpochBinding', 'acquisition', 'release', 'unavailable', 'stale', 'pressure', 'maxPendingRequests', 'maxBorrows', 'maxTransfers', 'readOnly', 'hostProgress', 'runtimeSchema', 'teardown'], 'SESSION_OBSERVATION_FIELDS', `observation ${index}`);
  assertNamespacedId(input.id, 'SESSION_OBSERVATION_ID', `observation ${index} id`);
  if (!outputObservation || input.outputProfile !== outputObservation.id) fail('SESSION_OBSERVATION_OUTPUT', `${input.id} names unknown output observation`);
  const request = inputById.get(input.requestInput);
  if (!request || request.kind !== 'observation-request' || schemaKey(request.schema) !== schemaKey(outputObservation.request.identity)
      || schemaKey(request.permission) !== schemaKey(outputObservation.request.permission)) fail('SESSION_OBSERVATION_REQUEST', `${input.id} request differs from output contract`);
  const rootEpochBinding = normalizeSchemaReference(input.rootEpochBinding, `${input.id} rootEpochBinding`);
  const acquisition = normalizeSchemaReference(input.acquisition, `${input.id} acquisition`);
  const release = normalizeSchemaReference(input.release, `${input.id} release`);
  if (schemaKey(rootEpochBinding) !== schemaKey(outputProfile.snapshot.rootEpoch) || schemaKey(acquisition) !== schemaKey(outputProfile.publication.acquireRead)
      || schemaKey(release) !== schemaKey(outputProfile.publication.borrowRelease) || input.readOnly !== true || input.hostProgress !== 'none' || input.runtimeSchema !== 'prohibited') fail('SESSION_OBSERVATION_CONTRACT', `${input.id} violates read-only publication ownership`);
  const maxPendingRequests = positiveDecimal(input.maxPendingRequests, 'SESSION_OBSERVATION_RANGE', `${input.id} maxPendingRequests`);
  const maxBorrows = positiveDecimal(input.maxBorrows, 'SESSION_OBSERVATION_RANGE', `${input.id} maxBorrows`);
  const maxTransfers = positiveDecimal(input.maxTransfers, 'SESSION_OBSERVATION_RANGE', `${input.id} maxTransfers`);
  if (compareDecimalUint(maxPendingRequests, outputObservation.maxRequests) > 0 || compareDecimalUint(maxBorrows, outputObservation.maxBorrows) > 0 || compareDecimalUint(maxTransfers, outputObservation.maxTransfers) > 0) fail('SESSION_OBSERVATION_RANGE', `${input.id} exceeds output bounds`);
  return {
    id: input.id, outputProfile: input.outputProfile, requestInput: input.requestInput, rootEpochBinding, acquisition, release,
    unavailable: input.unavailable, stale: input.stale, pressure: input.pressure, maxPendingRequests, maxBorrows, maxTransfers,
    readOnly: true, hostProgress: input.hostProgress, runtimeSchema: input.runtimeSchema, teardown: normalizeSchemaReference(input.teardown, `${input.id} teardown`),
  };
}

function normalizeObservations(input, outputProfile, inputById) {
  const selected = outputProfile.observations;
  if (selected.kind === 'absent') {
    exactKeys(input, ['kind'], 'SESSION_OBSERVATIONS_FIELDS', 'observations');
    if (input.kind !== 'absent') fail('SESSION_OBSERVATION_RESIDUE', 'output observation absence must remove session observation coordination');
    return { kind: 'absent' };
  }
  exactKeys(input, ['kind', 'profiles'], 'SESSION_OBSERVATIONS_FIELDS', 'observations');
  if (input.kind !== 'selected' || !Array.isArray(input.profiles)) fail('SESSION_OBSERVATIONS_KIND', 'selected output observations require session coordination');
  const outputById = new Map(selected.profiles.map((entry) => [entry.id, entry]));
  const profiles = input.profiles.map((entry, index) => normalizeObservation(entry, index, outputById.get(entry.outputProfile), inputById, outputProfile)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(profiles, 'id', 'SESSION_OBSERVATION_DUPLICATE', 'observation');
  if (profiles.length !== outputById.size || [...outputById.keys()].some((id) => !profiles.some(({ outputProfile: outputId }) => outputId === id))) fail('SESSION_OBSERVATION_COVERAGE', 'session observations do not exactly cover selected output observations');
  return { kind: 'selected', profiles };
}

function normalizeReclamation(input) {
  exactKeys(input, ['rootCommitSeparate', 'fullGraphSynchronous', 'protectedReferences', 'generationSafety', 'gracePeriod', 'pressureOutcome', 'failureOutcome', 'cleanup'], 'SESSION_RECLAMATION_FIELDS', 'reclamation');
  if (input.rootCommitSeparate !== true || input.fullGraphSynchronous !== false) fail('SESSION_RECLAMATION_AUTHORITY', 'reroot and reclamation are not separate');
  const expected = ['borrow', 'observation', 'old-epoch-work', 'transaction'];
  const protectedReferences = [...input.protectedReferences].sort(compareRaw);
  if (protectedReferences.length !== expected.length || new Set(protectedReferences).size !== expected.length || expected.some((entry) => !protectedReferences.includes(entry))) fail('SESSION_RECLAMATION_PROTECTION', 'reclamation protections are incomplete');
  return {
    rootCommitSeparate: true, fullGraphSynchronous: false, protectedReferences,
    generationSafety: normalizeSchemaReference(input.generationSafety, 'reclamation generationSafety'), gracePeriod: normalizeSchemaReference(input.gracePeriod, 'reclamation gracePeriod'),
    pressureOutcome: input.pressureOutcome, failureOutcome: input.failureOutcome, cleanup: normalizeSchemaReference(input.cleanup, 'reclamation cleanup'),
  };
}

function normalizeCounter(input, index) {
  exactKeys(input, ['id', 'kind', 'maximum', 'reserved', 'exhaustionThreshold', 'rollover', 'exhaustionOutcome', 'staleAliasProhibited'], 'SESSION_COUNTER_FIELDS', `counter ${index}`);
  assertNamespacedId(input.id, 'SESSION_COUNTER_ID', `counter ${index} id`);
  const kind = assertEnum(input.kind, COUNTER_KINDS, 'SESSION_COUNTER_KIND', `${input.id} kind`);
  const maximum = positiveDecimal(input.maximum, 'SESSION_COUNTER_RANGE', `${input.id} maximum`);
  const reserved = normalizeDecimalUint(input.reserved, `${input.id} reserved`);
  const exhaustionThreshold = positiveDecimal(input.exhaustionThreshold, 'SESSION_COUNTER_RANGE', `${input.id} exhaustionThreshold`);
  if (compareDecimalUint(reserved, exhaustionThreshold) >= 0 || compareDecimalUint(exhaustionThreshold, maximum) > 0) fail('SESSION_COUNTER_RANGE', `${input.id} counter range is invalid`);
  const rollover = assertEnum(input.rollover, ['prohibited', 'new-session-incarnation'], 'SESSION_COUNTER_ROLLOVER', `${input.id} rollover`);
  if ((kind === 'session-incarnation') !== (rollover === 'prohibited') || input.staleAliasProhibited !== true) fail('SESSION_COUNTER_ROLLOVER', `${input.id} rollover can alias stale state`);
  return { id: input.id, kind, maximum, reserved, exhaustionThreshold, rollover, exhaustionOutcome: input.exhaustionOutcome, staleAliasProhibited: true };
}

function normalizeLifecycle(input, progressProfile, outputProfile, controlSelected, observationSelected) {
  exactKeys(input, ['states', 'cancellationOrder', 'cancellationIdempotent', 'completion', 'health', 'restart', 'persistence', 'postIgnitionInteractions', 'hostProgress', 'teardownOrder', 'terminalResultBinding'], 'SESSION_LIFECYCLE_FIELDS', 'lifecycle');
  if (!Array.isArray(input.states) || input.states.length !== LIFECYCLE_STATES.length || input.states.some((state, index) => state !== LIFECYCLE_STATES[index])
      || input.cancellationOrder !== 'transaction-linearized' || input.cancellationIdempotent !== true || input.restart !== 'new-session-incarnation'
      || input.persistence !== 'none'
      || input.hostProgress !== 'none' || !Array.isArray(input.teardownOrder) || input.teardownOrder.some((entry, index) => entry !== TEARDOWN_ORDER[index])) fail('SESSION_LIFECYCLE_CONTRACT', 'session lifecycle is incomplete');
  const expectedInteractions = ['root-update', ...(controlSelected ? ['control-change'] : []), ...(observationSelected ? ['observation-read'] : []), 'cancellation', 'completion', 'teardown'];
  if (!Array.isArray(input.postIgnitionInteractions) || input.postIgnitionInteractions.length !== expectedInteractions.length || input.postIgnitionInteractions.some((entry, index) => entry !== expectedInteractions[index])) fail('SESSION_LIFECYCLE_RESIDUE', 'post-ignition interactions differ from selected capabilities');
  exactKeys(input.completion, ['freezeCommands', 'progressClosure', 'terminalCapture', 'transactionClosure', 'borrowQuiescence'], 'SESSION_COMPLETION_FIELDS', 'lifecycle completion');
  const progressClosure = normalizeSchemaReference(input.completion.progressClosure, 'completion progressClosure');
  const terminalCapture = normalizeSchemaReference(input.completion.terminalCapture, 'completion terminalCapture');
  const borrowQuiescence = normalizeSchemaReference(input.completion.borrowQuiescence, 'completion borrowQuiescence');
  if (input.completion.freezeCommands !== true || schemaKey(progressClosure) !== schemaKey(progressProfile.closure.publication)
      || schemaKey(terminalCapture) !== schemaKey(outputProfile.terminal.cleanup) || schemaKey(borrowQuiescence) !== schemaKey(outputProfile.publication.borrowExpiry)) fail('SESSION_COMPLETION_BINDING', 'completion differs from progress/output closure');
  return {
    states: [...input.states], cancellationOrder: input.cancellationOrder, cancellationIdempotent: true,
    completion: { freezeCommands: true, progressClosure, terminalCapture, transactionClosure: normalizeSchemaReference(input.completion.transactionClosure, 'completion transactionClosure'), borrowQuiescence },
    health: normalizeSchemaReference(input.health, 'lifecycle health'), restart: input.restart, persistence: input.persistence,
    postIgnitionInteractions: [...input.postIgnitionInteractions], hostProgress: input.hostProgress, teardownOrder: [...input.teardownOrder],
    terminalResultBinding: normalizeSchemaReference(input.terminalResultBinding, 'lifecycle terminalResultBinding'),
  };
}

function normalizeStatus(input, index) {
  exactKeys(input, ['code', 'class', 'diagnostic'], 'SESSION_STATUS_FIELDS', `status ${index}`);
  assertString(input.code, /^[a-z][a-z0-9-]*$/, 'SESSION_STATUS_CODE', `status ${index} code`);
  const statusClass = assertEnum(input.class, ['normal', 'pending', 'pressure', 'reject', 'stop', 'fatal', 'cancellation'], 'SESSION_STATUS_CLASS', `${input.code} class`);
  if (typeof input.diagnostic !== 'boolean' || (REQUIRED_STATUSES.has(input.code) && REQUIRED_STATUSES.get(input.code) !== statusClass)) fail('SESSION_STATUS_CLASS', `${input.code} status is invalid`);
  return { code: input.code, class: statusClass, diagnostic: input.diagnostic };
}

function normalizePort(input, index, permissions, statusCodes) {
  exactKeys(input, ['id', 'phase', 'input', 'output', 'maxWorkUnits', 'permission', 'statuses', 'mechanism', 'hostProgress'], 'SESSION_PORT_FIELDS', `port ${index}`);
  const expectedPhase = REQUIRED_PORTS.get(input.id);
  if (!expectedPhase || input.phase !== expectedPhase || input.mechanism !== 'public-cuda-js-contract' || input.hostProgress !== 'none') fail('SESSION_PORT_CONTRACT', `${input.id} port phase/mechanism is invalid`);
  const permission = normalizeSchemaReference(input.permission, `${input.id} permission`);
  if (!permissions.has(schemaKey(permission))) fail('SESSION_PORT_PERMISSION', `${input.id} permission is not selected`);
  const statuses = [...input.statuses].sort(compareRaw);
  if (statuses.length === 0 || new Set(statuses).size !== statuses.length || statuses.some((status) => !statusCodes.has(status))) fail('SESSION_PORT_STATUS', `${input.id} status outcomes are invalid`);
  return {
    id: input.id, phase: input.phase, input: normalizeSchemaReference(input.input, `${input.id} input`), output: normalizeSchemaReference(input.output, `${input.id} output`),
    maxWorkUnits: positiveDecimal(input.maxWorkUnits, 'SESSION_PORT_RANGE', `${input.id} maxWorkUnits`), permission, statuses, mechanism: input.mechanism, hostProgress: input.hostProgress,
  };
}

function normalizeSecurity(input, rootClass) {
  exactKeys(input, ['untrustedUntilValidated', 'rawPointers', 'cudaHandles', 'callbacks', 'arbitraryCode', 'privateOwnerPaths', 'maxDiagnosticRecords', 'maxDiagnosticBytes', 'diagnosticOverflow', 'partialCommit'], 'SESSION_SECURITY_FIELDS', 'security');
  if (input.untrustedUntilValidated !== true || input.rawPointers !== false || input.cudaHandles !== false || input.callbacks !== false
      || input.arbitraryCode !== false || input.privateOwnerPaths !== false || input.diagnosticOverflow !== 'count' || input.partialCommit !== 'quarantine') fail('SESSION_SECURITY_CONTRACT', 'session security boundary is incomplete');
  const maxDiagnosticRecords = positiveDecimal(input.maxDiagnosticRecords, 'SESSION_SECURITY_RANGE', 'security maxDiagnosticRecords');
  const maxDiagnosticBytes = positiveDecimal(input.maxDiagnosticBytes, 'SESSION_SECURITY_RANGE', 'security maxDiagnosticBytes');
  if (compareDecimalUint(maxDiagnosticBytes, rootClass.formula.maximumUnits) > 0) fail('SESSION_SECURITY_RANGE', 'diagnostics exceed session resource capacity');
  return { ...input, maxDiagnosticRecords, maxDiagnosticBytes };
}

function normalizeCompatibility(input) {
  exactKeys(input, ['ownerSemanticsRequired', 'packageIdentityRequired', 'sidebandTransportOpaque', 'nativeQualification', 'persistence'], 'SESSION_COMPATIBILITY_FIELDS', 'compatibility');
  exactKeys(input.persistence, ['kind'], 'SESSION_PERSISTENCE_FIELDS', 'compatibility persistence');
  if (input.ownerSemanticsRequired !== true || input.packageIdentityRequired !== true || input.sidebandTransportOpaque !== true
      || input.nativeQualification !== 'separate-selected-profile' || input.persistence.kind !== 'none') fail('SESSION_COMPATIBILITY_CONTRACT', 'session compatibility is incomplete');
  return { ownerSemanticsRequired: true, packageIdentityRequired: true, sidebandTransportOpaque: true, nativeQualification: input.nativeQualification, persistence: { kind: 'none' } };
}

function normalizeCleanup(input, observationSelected) {
  exactKeys(input, ['kinds', 'disposition', 'quarantine', 'releaseOrder', 'ownerOrder', 'retainedEvidence', 'terminalBorrowPreservedUntilRelease'], 'SESSION_CLEANUP_FIELDS', 'cleanup');
  const kinds = [...input.kinds].sort(compareRaw);
  const expected = [...BASE_CLEANUP_KINDS, ...(observationSelected ? OBSERVATION_CLEANUP_KINDS : [])].sort(compareRaw);
  if (kinds.length !== expected.length || new Set(kinds).size !== expected.length || expected.some((kind) => !kinds.includes(kind)) || input.terminalBorrowPreservedUntilRelease !== true) fail('SESSION_CLEANUP_COVERAGE', 'cleanup does not exactly cover selected session state');
  return {
    kinds, disposition: normalizeSchemaReference(input.disposition, 'cleanup disposition'), quarantine: normalizeSchemaReference(input.quarantine, 'cleanup quarantine'),
    releaseOrder: normalizeSchemaReference(input.releaseOrder, 'cleanup releaseOrder'), ownerOrder: normalizeSchemaReference(input.ownerOrder, 'cleanup ownerOrder'),
    retainedEvidence: normalizeSchemaReference(input.retainedEvidence, 'cleanup retainedEvidence'), terminalBorrowPreservedUntilRelease: true,
  };
}

function normalizeProgram(input, requiredProfiles, observationSelected) {
  exactKeys(input, ['kind', 'language', 'sourceIdentity', 'inputs', 'requirements', 'provenance'], 'SESSION_PROGRAM_FIELDS', 'programContribution');
  if (input.kind !== 'device-program' || input.language !== 'restricted-device-js') fail('SESSION_PROGRAM_LANGUAGE', 'session contribution must be restricted Device-JS');
  const inputs = input.inputs.map((entry, index) => normalizeProfileReference(entry, `program input ${index}`)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(inputs, 'id', 'SESSION_PROGRAM_INPUT_DUPLICATE', 'program input');
  const actual = new Map(inputs.map((profile) => [profile.id, profileKey(profile)]));
  if (actual.size !== requiredProfiles.size || [...requiredProfiles].some(([id, profile]) => actual.get(id) !== profileKey(profile))) fail('SESSION_PROGRAM_INPUTS', 'program inputs differ from selected public owner profiles');
  const requirements = input.requirements.map((entry, index) => normalizeSchemaReference(entry, `program requirement ${index}`)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(requirements, 'id', 'SESSION_PROGRAM_REQUIREMENT_DUPLICATE', 'program requirement');
  const expectedRequirements = [...BASE_PUBLIC_REQUIREMENTS, ...(observationSelected ? OBSERVATION_PUBLIC_REQUIREMENTS : [])];
  if (requirements.length !== expectedRequirements.length || expectedRequirements.some((id) => !requirements.some((entry) => entry.id === id))) fail('SESSION_PROGRAM_REQUIREMENTS', 'program requirements are not the bounded consumer-neutral public CUDA-JS set');
  exactKeys(input.provenance, ['origin', 'revision', 'license', 'review'], 'SESSION_PROGRAM_PROVENANCE_FIELDS', 'program provenance');
  if (input.provenance.origin !== 'first-party') fail('SESSION_PROGRAM_ORIGIN', 'session program must be first-party');
  assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'SESSION_PROGRAM_REVISION', 'program revision');
  assertString(input.provenance.license, /\S/, 'SESSION_PROGRAM_LICENSE', 'program license');
  return {
    kind: input.kind, language: input.language, sourceIdentity: normalizeContentIdentity(input.sourceIdentity, 'SESSION_PROGRAM_SOURCE', 'program sourceIdentity'), inputs, requirements,
    provenance: { origin: input.provenance.origin, revision: input.provenance.revision, license: input.provenance.license, review: normalizeSchemaReference(input.provenance.review, 'program review') },
  };
}

function normalizeProductData(input, index) {
  exactKeys(input, ['ownerContract', 'schema', 'identity'], 'SESSION_PRODUCT_FIELDS', `productData ${index}`);
  if (input.ownerContract?.kind !== 'namespaced') fail('SESSION_PRODUCT_OWNER', 'product data owner must be namespaced');
  return { ownerContract: normalizeContract(input.ownerContract, new Map(), `productData ${index} owner`), schema: normalizeSchemaReference(input.schema, `productData ${index} schema`), identity: normalizeContentIdentity(input.identity, 'SESSION_PRODUCT_IDENTITY', `productData ${index} identity`) };
}

export function normalizeSessionProfile(input, inspectedCatalog, resourceResult, progressResult, outputResult) {
  exactKeys(input, ['schema', 'representation', 'status', 'contract', 'id', 'version', 'resourcePlan', 'progressPlan', 'outputProfile', 'resourceContribution', 'progressContribution', 'identity', 'commands', 'transaction', 'root', 'owners', 'controls', 'observations', 'reclamation', 'counters', 'lifecycle', 'ports', 'statuses', 'permissions', 'security', 'compatibility', 'cleanup', 'programContribution', 'productData'], 'SESSION_ROOT_FIELDS', 'session profile');
  if (input.schema !== SESSION_SCHEMA || input.representation !== REPRESENTATION || input.status !== 'proposal-evidence') fail('SESSION_SCHEMA', 'unsupported session schema/representation/status');
  assertNamespacedId(input.id, 'SESSION_PROFILE_ID', 'session profile id');
  assertVersion(input.version, 'SESSION_PROFILE_VERSION', 'session profile version');
  const contracts = inspectedCatalog?.contractSet?.contracts;
  if (!contracts) fail('SESSION_CATALOG', 'inspected catalog is required');
  const catalogById = new Map(contracts.map((entry) => [entry.id, entry]));
  const contract = normalizeContract(input.contract, catalogById, 'session contract');
  if (contract.id !== SESSION_CONTRACT) fail('SESSION_CONTRACT_ID', `session contract must select ${SESSION_CONTRACT}`);
  if (!resourceResult?.normalized || !resourceResult?.schemaSha || !progressResult?.normalized || !progressResult?.schemaSha || !outputResult?.normalized || !outputResult?.schemaSha) fail('SESSION_PLAN', 'exact resource, progress and output plans are required');
  const expectedRef = (result) => ({ id: result.normalized.id, schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha }, identity: result.identity });
  const resourcePlan = normalizeProfileReference(input.resourcePlan, 'resourcePlan');
  const progressPlan = normalizeProfileReference(input.progressPlan, 'progressPlan');
  const outputProfile = normalizeProfileReference(input.outputProfile, 'outputProfile');
  if (profileKey(resourcePlan) !== profileKey(expectedRef(resourceResult)) || profileKey(progressPlan) !== profileKey(expectedRef(progressResult)) || profileKey(outputProfile) !== profileKey(expectedRef(outputResult))) fail('SESSION_PLAN', 'resource/progress/output plan identity differs');
  if (profileKey(progressResult.normalized.resourcePlan) !== profileKey(resourcePlan) || profileKey(outputResult.normalized.resourcePlan) !== profileKey(resourcePlan) || profileKey(outputResult.normalized.progressPlan) !== profileKey(progressPlan)) fail('SESSION_PLAN', 'selected plans are not one closed chain');

  const resourceSession = resourceResult.normalized.contributors.find(({ contract: selected }) => selected.id === SESSION_CONTRACT);
  const progressSession = progressResult.normalized.contributors.find(({ contract: selected }) => selected.id === SESSION_CONTRACT);
  if (!resourceSession || !progressSession || profileKey(resourceSession.profile) !== profileKey(progressSession.profile)) fail('SESSION_CONTRIBUTION', 'resource/progress plans do not select one session contribution');
  const resourceContribution = normalizeProfileReference(input.resourceContribution, 'resourceContribution');
  const progressContribution = normalizeProfileReference(input.progressContribution, 'progressContribution');
  if (profileKey(resourceContribution) !== profileKey(resourceSession.profile) || profileKey(progressContribution) !== profileKey(progressSession.profile)) fail('SESSION_CONTRIBUTION', 'session contribution differs from selected plans');
  const rootReserve = resourceResult.normalized.reserves.find(({ purpose }) => purpose === 'root-update');
  const rootClass = resourceResult.normalized.classes.find(({ id, contributor }) => id === rootReserve?.class && contributor === resourceSession.id);
  const rootAdmission = resourceResult.normalized.admissionGroups.find(({ classes }) => classes.includes(rootClass?.id));
  const sessionWork = progressResult.normalized.workClasses.find(({ owner }) => owner === progressSession.id);
  const externalWait = progressResult.normalized.noProgress.externalWait;
  if (!rootReserve || !rootClass || !rootAdmission || rootReserve.class !== rootClass.id || rootReserve.borrow.kind !== 'none'
      || sessionWork?.kind !== 'external-control' || sessionWork.reserve !== rootReserve.id || externalWait.kind !== 'session-only'
      || externalWait.owner !== progressSession.id || !progressSession.publicTransitions.some((entry) => schemaKey(entry) === schemaKey(externalWait.state))) fail('SESSION_UPSTREAM_CONTRACT', 'selected resource/progress session boundary is incomplete');

  const contributorById = new Map(progressResult.normalized.contributors.map((entry) => [entry.id, entry]));
  const owners = input.owners.map((entry, index) => normalizeOwner(entry, index, catalogById, contributorById, progressSession.id)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(owners, 'id', 'SESSION_OWNER_DUPLICATE', 'owner');
  if (owners.length !== contributorById.size || [...contributorById.keys()].some((id) => !owners.some((entry) => entry.id === id))) fail('SESSION_OWNER_COVERAGE', 'owners do not exactly cover selected resource/progress contributors');
  const ownerById = new Map(owners.map((entry) => [entry.id, entry]));
  const contractIds = new Set(owners.map(({ contract: ownerContract }) => ownerContract.id));
  for (const required of ['SPEC-0006', 'SPEC-0007', 'SPEC-0008', 'SPEC-0010', 'SPEC-0011', 'SPEC-0012', 'SPEC-0013']) if (!contractIds.has(required)) fail('SESSION_OWNER_REQUIRED', `selected Session profile lacks ${required} owner`);

  const permissions = input.permissions.map((entry, index) => normalizeSchemaReference(entry, `permission ${index}`)).sort((left, right) => compareRaw(schemaKey(left), schemaKey(right)));
  if (permissions.length === 0 || new Set(permissions.map(schemaKey)).size !== permissions.length) fail('SESSION_PERMISSION', 'permissions must be nonempty and unique');
  const permissionKeys = new Set(permissions.map(schemaKey));
  const commands = normalizeCommands(input.commands, ownerById, permissionKeys, externalWait, rootClass, outputResult.normalized.observations.kind === 'selected');
  const inputById = new Map(commands.inputs.map((entry) => [entry.id, entry]));
  const participantIds = owners.filter(({ role }) => role === 'participant').map(({ id }) => id);
  const transaction = normalizeTransaction(input.transaction, participantIds, rootReserve, rootAdmission);
  const workById = new Map(progressResult.normalized.workClasses.map((entry) => [entry.id, entry]));
  const root = normalizeRoot(input.root, ownerById, workById);
  const controls = input.controls.map((entry, index) => normalizeControl(entry, index, ownerById, inputById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(controls, 'id', 'SESSION_CONTROL_DUPLICATE', 'control');
  const controlInputs = commands.inputs.filter(({ kind }) => kind === 'control');
  if (controls.length !== controlInputs.length || controlInputs.some(({ id }) => !controls.some(({ input: inputId }) => inputId === id))) fail('SESSION_CONTROL_COVERAGE', 'controls do not exactly cover admitted control inputs');
  const observations = normalizeObservations(input.observations, outputResult.normalized, inputById);
  const observationInputs = commands.inputs.filter(({ kind }) => kind === 'observation-request');
  if ((observations.kind === 'selected' ? observations.profiles.length : 0) !== observationInputs.length) fail('SESSION_OBSERVATION_COVERAGE', 'observation command inputs differ from selected observations');
  const reclamation = normalizeReclamation(input.reclamation);
  const counters = input.counters.map(normalizeCounter).sort((left, right) => compareRaw(left.kind, right.kind));
  uniqueBy(counters, 'id', 'SESSION_COUNTER_DUPLICATE', 'counter'); uniqueBy(counters, 'kind', 'SESSION_COUNTER_KIND_DUPLICATE', 'counter kind');
  if (counters.length !== COUNTER_KINDS.length || COUNTER_KINDS.some((kind) => !counters.some((entry) => entry.kind === kind))) fail('SESSION_COUNTER_COVERAGE', 'finite counter coverage is incomplete');
  const rootCounter = counters.find(({ kind }) => kind === 'root-epoch');
  const observationCounter = counters.find(({ kind }) => kind === 'observation-generation');
  if (root.epochCounter !== rootCounter.id || compareDecimalUint(rootCounter.maximum, rootClass.range.generationMaximum) > 0) fail('SESSION_ROOT_COUNTER', 'root epoch counter differs from resource generation range');
  if (outputResult.normalized.observations.kind === 'selected' && outputResult.normalized.observations.profiles.some(({ maxSequence }) => compareDecimalUint(maxSequence, observationCounter.maximum) > 0)) fail('SESSION_OBSERVATION_COUNTER', 'observation counter is narrower than output sequence');

  const statuses = input.statuses.map(normalizeStatus).sort((left, right) => compareRaw(left.code, right.code));
  uniqueBy(statuses, 'code', 'SESSION_STATUS_DUPLICATE', 'status');
  const statusCodes = new Set(statuses.map(({ code }) => code));
  const requiredStatusCodes = new Set([...REQUIRED_STATUSES.keys()].filter((code) => (controls.length > 0 || !CONTROL_STATUSES.has(code)) && (observations.kind === 'selected' || !OBSERVATION_STATUSES.has(code))));
  if (statusCodes.size !== requiredStatusCodes.size || [...requiredStatusCodes].some((code) => !statusCodes.has(code))) fail('SESSION_STATUS_REQUIRED', 'status vocabulary differs from selected session capabilities');
  for (const command of commands.inputs) if (!statusCodes.has(command.pressureStatus)) fail('SESSION_INPUT_STATUS', `${command.id} pressure status is undeclared`);
  for (const status of [root.rejectedOutcome, root.acceptedOutcome, root.exhaustedOutcome, reclamation.pressureOutcome, reclamation.failureOutcome]) if (!statusCodes.has(status)) fail('SESSION_STATUS_REFERENCE', `${status} is undeclared`);
  for (const control of controls) if (!statusCodes.has(control.pressureOutcome)) fail('SESSION_CONTROL_STATUS', `${control.id} pressure status is undeclared`);
  if (observations.kind === 'selected') for (const observation of observations.profiles) for (const status of [observation.unavailable, observation.stale, observation.pressure]) if (!statusCodes.has(status)) fail('SESSION_OBSERVATION_STATUS', `${observation.id} status ${status} is undeclared`);

  const lifecycle = normalizeLifecycle(input.lifecycle, progressResult.normalized, outputResult.normalized, controls.length > 0, observations.kind === 'selected');
  const ports = input.ports.map((entry, index) => normalizePort(entry, index, permissionKeys, statusCodes)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(ports, 'id', 'SESSION_PORT_DUPLICATE', 'port');
  const requiredPortIds = ['validateSessionInput', 'prepareRootUpdate', 'commitSessionTransaction', 'abortSessionTransaction', 'requestCancellation', 'completeSession', 'teardownSession'];
  if (controls.length > 0) requiredPortIds.push('prepareControlChange');
  if (observations.kind === 'selected') requiredPortIds.push('requestObservation', 'acquireObservation', 'releaseObservation');
  if (ports.length !== requiredPortIds.length || requiredPortIds.some((id) => !ports.some((entry) => entry.id === id))) fail('SESSION_PORT_COVERAGE', 'semantic ports differ from selected session capabilities');
  const referencedPermissions = new Set([...commands.inputs, ...ports].map(({ permission }) => schemaKey(permission)));
  if (permissionKeys.size !== referencedPermissions.size || [...referencedPermissions].some((key) => !permissionKeys.has(key))) fail('SESSION_PERMISSION_COVERAGE', 'permissions differ from selected session inputs and ports');
  const security = normalizeSecurity(input.security, rootClass);
  const compatibility = normalizeCompatibility(input.compatibility);
  if (lifecycle.persistence !== compatibility.persistence.kind) fail('SESSION_PERSISTENCE', 'lifecycle/compatibility persistence differs');
  const cleanup = normalizeCleanup(input.cleanup, observations.kind === 'selected');
  const requiredProgramProfiles = new Map([[resourcePlan.id, resourcePlan], [progressPlan.id, progressPlan], [outputProfile.id, outputProfile]]);
  for (const owner of owners.filter(({ role }) => role === 'participant')) if (!requiredProgramProfiles.has(owner.profile.id)) requiredProgramProfiles.set(owner.profile.id, owner.profile);
  const programContribution = normalizeProgram(input.programContribution, requiredProgramProfiles, observations.kind === 'selected');
  const productData = input.productData.map(normalizeProductData).sort((left, right) => compareRaw(left.ownerContract.id, right.ownerContract.id));
  uniqueBy(productData.map(({ ownerContract }) => ({ id: ownerContract.id })), 'id', 'SESSION_PRODUCT_DUPLICATE', 'product owner');
  const normalized = {
    schema: input.schema, representation: input.representation, status: input.status, contract, id: input.id, version: input.version,
    resourcePlan, progressPlan, outputProfile, resourceContribution, progressContribution, identity: normalizeIdentity(input.identity),
    commands, transaction, root, owners, controls, observations, reclamation, counters, lifecycle, ports, statuses, permissions,
    security, compatibility, cleanup, programContribution, productData,
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}
