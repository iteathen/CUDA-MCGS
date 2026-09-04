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
const REROOT_STATES = ['vacant', 'validating', 'admitting', 'prepared', 'committing', 'committed', 'aborting', 'aborted', 'quarantined'];
const LIFECYCLE_STATES = ['profile-normalized', 'resources-admitted', 'initialized', 'active-external-wait', 'cancelling-draining', 'terminal', 'released'];
const TEARDOWN_ORDER = ['stop-inputs', 'stop-acquisition', 'abort-reroot', 'close-publications', 'dispose-work', 'quiesce-borrows', 'release-owner-state', 'preserve-terminal-borrow', 'release-cuda-js-opaque-state'];
const REQUIRED_PORT_PHASES = new Map([
  ['validateInitialRoot', 'host-preignition'], ['applyAdvance', 'device-active'], ['prepareReroot', 'device-active'],
  ['commitReroot', 'device-active'], ['abortReroot', 'device-active'], ['applyAttentionChange', 'device-active'],
  ['requestObservation', 'host-async'], ['acquireObservation', 'host-async'], ['releaseObservation', 'host-async'],
  ['requestCancellation', 'host-async'], ['completeSession', 'device-active'], ['teardownSession', 'host-async'],
]);
const STATUS_CLASSES = new Map([
  ['invalid-session-profile', 'fatal'], ['session-command-capacity', 'pressure'], ['session-command-duplicate', 'reject'],
  ['session-command-stale', 'reject'], ['root-invalid', 'reject'], ['root-incarnation-exhausted', 'stop'], ['root-epoch-exhausted', 'stop'],
  ['advance-invalid', 'reject'], ['advance-not-ready', 'reject'], ['advance-conflict', 'reject'], ['advance-generation-exhausted', 'stop'], ['advance-accepted', 'normal'],
  ['reroot-invalid', 'reject'], ['reroot-pressure', 'pressure'], ['reroot-conflict', 'reject'], ['reroot-accepted', 'normal'],
  ['session-attention-invalid', 'reject'], ['session-attention-conflict', 'reject'], ['attention-generation-exhausted', 'stop'],
  ['session-cancelling', 'cancellation'], ['session-restart-required', 'stop'], ['session-terminal', 'normal'], ['session-internal-failure', 'fatal'],
  ['session-observation-unavailable', 'pending'], ['session-observation-stale', 'reject'], ['session-observation-pressure', 'pressure'],
]);
const BASE_COUNTER_KINDS = ['session-incarnation', 'root-incarnation', 'root-epoch', 'command', 'observation-generation', 'reclamation-generation'];
const BASE_CLEANUP_KINDS = ['command', 'old-epoch-work', 'diagnostic', 'program-artifact', 'session-counter', 'root-protection', 'shared-node-protection'];
const BASE_PUBLIC_REQUIREMENTS = ['cuda-js.device-js/0.1.0', 'cuda-js.operation-lifecycle/0.1.0', 'cuda-js.publication-mailbox/0.1.0'];
const OBSERVATION_PUBLIC_REQUIREMENTS = ['cuda-js.async-transfer/0.1.0', 'cuda-js.scoped-atomic-observation/0.1.0'];

function assertEnum(value, allowed, code, label) {
  if (!allowed.includes(value)) fail(code, `${label} is invalid`);
  return value;
}

function positiveDecimal(value, code, label) {
  const normalized = normalizeDecimalUint(value, label);
  if (normalized === '0') fail(code, `${label} must be positive`);
  return normalized;
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
    assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+$/, 'SESSION_CONTRACT_ID', `${label} specificationIdentity`);
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
  const keys = ['session', 'incarnation', 'root', 'rootIncarnation', 'rootEpoch', 'advanceGeneration', 'command', 'rerootTransaction'];
  exactKeys(input, keys, 'SESSION_IDENTITY_FIELDS', 'identity');
  return Object.fromEntries(keys.map((key) => [key, normalizeSchemaReference(input[key], `identity ${key}`)]));
}

function normalizeInput(input, index, ownerById, permissions) {
  exactKeys(input, ['id', 'kind', 'schema', 'owner', 'permission', 'authority', 'idempotence', 'epochScope', 'maxBytes', 'pressureStatus', 'effect', 'deviceApplicationPoint', 'runtimeCode'], 'SESSION_INPUT_FIELDS', `input ${index}`);
  assertNamespacedId(input.id, 'SESSION_INPUT_ID', `input ${index} id`);
  assertNamespacedId(input.owner, 'SESSION_INPUT_OWNER', `${input.id} owner`);
  if (!ownerById.has(input.owner)) fail('SESSION_INPUT_OWNER', `${input.id} names unknown owner`);
  const permission = normalizeSchemaReference(input.permission, `${input.id} permission`);
  if (!permissions.has(schemaKey(permission))) fail('SESSION_INPUT_PERMISSION', `${input.id} permission is not selected`);
  const kind = assertEnum(input.kind, ['advance', 'reroot', 'attention', 'cancellation', 'observation-request'], 'SESSION_INPUT_KIND', `${input.id} kind`);
  const deviceApplicationPoint = input.deviceApplicationPoint === null ? null : normalizeSchemaReference(input.deviceApplicationPoint, `${input.id} deviceApplicationPoint`);
  if (['advance', 'reroot', 'attention'].includes(kind) !== (deviceApplicationPoint !== null)) fail('SESSION_INPUT_APPLICATION', `${input.id} application point differs from input kind`);
  if (input.runtimeCode !== false) fail('SESSION_INPUT_RUNTIME_CODE', `${input.id} permits runtime code`);
  return {
    id: input.id, kind, schema: normalizeSchemaReference(input.schema, `${input.id} schema`), owner: input.owner, permission,
    authority: normalizeSchemaReference(input.authority, `${input.id} authority`), idempotence: normalizeSchemaReference(input.idempotence, `${input.id} idempotence`),
    epochScope: assertEnum(input.epochScope, ['session', 'root-authority', 'session-and-root-authority'], 'SESSION_INPUT_EPOCH', `${input.id} epochScope`),
    maxBytes: positiveDecimal(input.maxBytes, 'SESSION_INPUT_RANGE', `${input.id} maxBytes`), pressureStatus: input.pressureStatus,
    effect: normalizeSchemaReference(input.effect, `${input.id} effect`), deviceApplicationPoint, runtimeCode: false,
  };
}

function normalizeCommands(input, ownerById, permissions, externalWait, sessionClass) {
  exactKeys(input, ['capacity', 'maxBytes', 'order', 'conflict', 'coalescing', 'replay', 'authority', 'admissionBeforeMutation', 'hostProgress', 'inputs'], 'SESSION_COMMAND_FIELDS', 'commands');
  if (input.order !== 'arrival-total-order' || input.conflict !== 'typed-reject' || input.coalescing !== 'owner-declared-only'
      || input.replay !== 'original-terminal-or-typed-stale' || input.authority !== 'least-authority-versioned'
      || input.admissionBeforeMutation !== true || input.hostProgress !== 'none') fail('SESSION_COMMAND_CONTRACT', 'command contract is incomplete');
  const capacity = positiveDecimal(input.capacity, 'SESSION_COMMAND_RANGE', 'commands capacity');
  const maxBytes = positiveDecimal(input.maxBytes, 'SESSION_COMMAND_RANGE', 'commands maxBytes');
  if (compareDecimalUint(capacity, externalWait.maxPendingCommands) > 0 || compareDecimalUint(maxBytes, sessionClass.formula.maximumUnits) > 0) fail('SESSION_COMMAND_CAPACITY', 'command range exceeds admitted session capacity');
  if (!Array.isArray(input.inputs)) fail('SESSION_INPUT_COUNT', 'commands inputs must be an array');
  const inputs = input.inputs.map((entry, index) => normalizeInput(entry, index, ownerById, permissions)).sort((a, b) => compareRaw(a.id, b.id));
  uniqueBy(inputs, 'id', 'SESSION_INPUT_DUPLICATE', 'input');
  if (inputs.some(({ maxBytes: bytes }) => compareDecimalUint(bytes, maxBytes) > 0)) fail('SESSION_COMMAND_CAPACITY', 'input exceeds command maxBytes');
  if (inputs.filter(({ kind }) => kind === 'cancellation').length !== 1) fail('SESSION_INPUT_REQUIRED', 'exactly one cancellation input is required');
  for (const kind of ['advance', 'reroot', 'attention']) if (inputs.filter((entry) => entry.kind === kind).length > 1) fail('SESSION_INPUT_COVERAGE', `multiple ${kind} inputs are not allowed`);
  return { capacity, maxBytes, order: input.order, conflict: input.conflict, coalescing: input.coalescing, replay: input.replay, authority: input.authority, admissionBeforeMutation: true, hostProgress: 'none', inputs };
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
  exactKeys(input, ['id', 'role', 'contract', 'profile', 'cleanup', 'reroot'], 'SESSION_OWNER_FIELDS', `owner ${index}`);
  assertNamespacedId(input.id, 'SESSION_OWNER_ID', `owner ${index} id`);
  const expected = contributorById.get(input.id);
  if (!expected) fail('SESSION_OWNER_COVERAGE', `${input.id} is not a selected resource/progress contributor`);
  const contract = normalizeContract(input.contract, catalogById, `${input.id} contract`);
  const profile = normalizeProfileReference(input.profile, `${input.id} profile`);
  if (contractKey(contract) !== contractKey(expected.contract) || profileKey(profile) !== profileKey(expected.profile)) fail('SESSION_OWNER_PROFILE', `${input.id} differs from selected contributor`);
  const role = assertEnum(input.role, ['coordinator', 'participant'], 'SESSION_OWNER_ROLE', `${input.id} role`);
  if ((input.id === sessionOwnerId) !== (role === 'coordinator')) fail('SESSION_OWNER_ROLE', `${input.id} coordinator role is invalid`);
  let reroot;
  if (input.reroot?.kind === 'absent') {
    exactKeys(input.reroot, ['kind'], 'SESSION_OWNER_REROOT_FIELDS', `${input.id} reroot`);
    reroot = { kind: 'absent' };
  } else {
    exactKeys(input.reroot, ['kind', 'prepare', 'commit', 'abort', 'state'], 'SESSION_OWNER_REROOT_FIELDS', `${input.id} reroot`);
    if (input.reroot.kind !== 'selected' || role !== 'participant' || !Array.isArray(input.reroot.state) || input.reroot.state.length === 0) fail('SESSION_OWNER_REROOT', `${input.id} reroot participation is invalid`);
    const state = input.reroot.state.map((entry, stateIndex) => normalizeStateFamily(entry, stateIndex, input.id)).sort((a, b) => compareRaw(a.id, b.id));
    uniqueBy(state, 'id', 'SESSION_STATE_DUPLICATE', `${input.id} state`);
    if (state.every(({ classification }) => classification === 'root-independent-retain')) fail('SESSION_OWNER_REROOT', `${input.id} root-independent state must not participate in reroot`);
    reroot = {
      kind: 'selected',
      prepare: normalizeSchemaReference(input.reroot.prepare, `${input.id} reroot prepare`),
      commit: normalizeSchemaReference(input.reroot.commit, `${input.id} reroot commit`),
      abort: normalizeSchemaReference(input.reroot.abort, `${input.id} reroot abort`),
      state,
    };
  }
  return { id: input.id, role, contract, profile, cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`), reroot };
}

function normalizeRoot(input, ownerById) {
  exactKeys(input, ['descriptorSchema', 'validationOwner', 'graphOwner', 'incarnationCounter', 'epochCounter', 'establishment', 'publication', 'failureOutcome'], 'SESSION_INITIAL_ROOT_FIELDS', 'root');
  if (ownerById.get(input.validationOwner)?.contract.id !== 'SPEC-0007' || ownerById.get(input.graphOwner)?.contract.id !== 'SPEC-0010') fail('SESSION_ROOT_OWNER', 'initial root must bind Domain validation and Graph ownership');
  if (input.establishment !== 'pre-ignition-validate-admit-materialize' || input.publication !== 'release-after-full-initialization') fail('SESSION_ROOT_CONTRACT', 'initial root contract is incomplete');
  assertNamespacedId(input.incarnationCounter, 'SESSION_ROOT_COUNTER', 'root incarnationCounter');
  assertNamespacedId(input.epochCounter, 'SESSION_ROOT_COUNTER', 'root epochCounter');
  return {
    descriptorSchema: normalizeSchemaReference(input.descriptorSchema, 'root descriptorSchema'), validationOwner: input.validationOwner, graphOwner: input.graphOwner,
    incarnationCounter: input.incarnationCounter, epochCounter: input.epochCounter, establishment: input.establishment, publication: input.publication, failureOutcome: input.failureOutcome,
  };
}

function normalizeAdvance(input, ownerById, inputById) {
  if (input?.kind === 'absent') {
    exactKeys(input, ['kind'], 'SESSION_ADVANCE_FIELDS', 'advance');
    if ([...inputById.values()].some(({ kind }) => kind === 'advance')) fail('SESSION_ADVANCE_RESIDUE', 'advance input remains while advance is absent');
    return { kind: 'absent' };
  }
  exactKeys(input, ['kind', 'profile'], 'SESSION_ADVANCE_FIELDS', 'advance');
  if (input.kind !== 'selected') fail('SESSION_ADVANCE_KIND', 'advance kind is invalid');
  const p = input.profile;
  exactKeys(p, ['input', 'validationOwner', 'graphOwner', 'epochCounter', 'generationCounter', 'realizedTransitionRequired', 'successorReadyRequired', 'existingResourcesOnly', 'authorityPublication', 'adoption', 'cost', 'graphTraversal', 'semanticStateCopy', 'stateTransform', 'reset', 'resize', 'reclassification', 'reclamation', 'eagerCleanup', 'selectedDescendantWork', 'siblingOccurrenceWork', 'sharedTransposedNode', 'rejectedOutcome', 'acceptedOutcome', 'exhaustedOutcome', 'hostProgress'], 'SESSION_ADVANCE_PROFILE_FIELDS', 'advance profile');
  const command = inputById.get(p.input);
  if (!command || command.kind !== 'advance' || command.owner !== p.validationOwner || command.epochScope !== 'session-and-root-authority') fail('SESSION_ADVANCE_INPUT', 'advance input/owner/scope is invalid');
  if (ownerById.get(p.validationOwner)?.contract.id !== 'SPEC-0007' || ownerById.get(p.graphOwner)?.contract.id !== 'SPEC-0010') fail('SESSION_ADVANCE_OWNER', 'advance must bind Domain validation and Graph ownership');
  const exact = p.realizedTransitionRequired === true && p.successorReadyRequired === true && p.existingResourcesOnly === true
    && p.authorityPublication === 'single-authoritative-linearization' && p.adoption === 'per-device-versioned-safe-point'
    && p.cost === 'bounded-independent-of-retained-search-state' && p.graphTraversal === 'none' && p.semanticStateCopy === 'none'
    && p.stateTransform === 'none' && p.reset === 'none' && p.resize === 'none' && p.reclassification === 'none'
    && p.reclamation === 'none' && p.eagerCleanup === 'none' && p.selectedDescendantWork === 'preserve-compatible'
    && p.siblingOccurrenceWork === 'superseded-by-advance-lazy' && p.sharedTransposedNode === 'occurrence-supersession-does-not-invalidate-node'
    && p.hostProgress === 'none';
  if (!exact) fail('SESSION_ADVANCE_CONTRACT', 'advance contains reroot work or violates minimum-work semantics');
  assertNamespacedId(p.epochCounter, 'SESSION_ADVANCE_COUNTER', 'advance epochCounter');
  assertNamespacedId(p.generationCounter, 'SESSION_ADVANCE_COUNTER', 'advance generationCounter');
  return { kind: 'selected', profile: { ...p } };
}

function assertExactMembers(actual, expected, code, label) {
  if (!Array.isArray(actual) || actual.length !== expected.length || new Set(actual).size !== actual.length || actual.some((id) => !expected.includes(id))) fail(code, `${label} must exactly cover reroot participants`);
}

function normalizeRerootTransaction(input, participantIds, rerootReserve, rerootAdmission) {
  exactKeys(input, ['states', 'linearization', 'preMutationAdmission', 'prepareOrder', 'commitOrder', 'abortOrder', 'compoundAdmission', 'rejectedEffect', 'duplicateEffect', 'partialCommit', 'concurrentOrder', 'completion', 'cleanup'], 'SESSION_REROOT_TRANSACTION_FIELDS', 'reroot transaction');
  if (!Array.isArray(input.states) || input.states.length !== REROOT_STATES.length || input.states.some((state, index) => state !== REROOT_STATES[index])
      || input.linearization !== 'root-incarnation-publication' || input.preMutationAdmission !== true || input.rejectedEffect !== 'none'
      || input.duplicateEffect !== 'none' || input.partialCommit !== 'fatal-quarantine' || input.concurrentOrder !== 'single-authoritative-transaction-order') fail('SESSION_REROOT_TRANSACTION_CONTRACT', 'reroot transaction contract is incomplete');
  assertExactMembers(input.prepareOrder, participantIds, 'SESSION_REROOT_ORDER', 'reroot prepare order');
  assertExactMembers(input.commitOrder, participantIds, 'SESSION_REROOT_ORDER', 'reroot commit order');
  assertExactMembers(input.abortOrder, participantIds, 'SESSION_REROOT_ORDER', 'reroot abort order');
  if (input.commitOrder.some((id, index) => id !== input.prepareOrder[index]) || input.abortOrder.some((id, index) => id !== input.prepareOrder[input.prepareOrder.length - 1 - index])) fail('SESSION_REROOT_ORDER', 'reroot commit/abort order must preserve prepare order and reverse it for abort');
  exactKeys(input.compoundAdmission, ['resourceGroup', 'rerootReserve', 'maxTransactions', 'rollback'], 'SESSION_REROOT_ADMISSION_FIELDS', 'reroot compound admission');
  if (input.compoundAdmission.resourceGroup !== rerootAdmission.id || input.compoundAdmission.rerootReserve !== rerootReserve.id || input.compoundAdmission.maxTransactions !== rerootAdmission.maxTransactions
      || schemaKey(normalizeSchemaReference(input.compoundAdmission.rollback, 'reroot rollback')) !== schemaKey(rerootAdmission.rollback)) fail('SESSION_REROOT_ADMISSION', 'reroot compound admission differs from selected resource plan');
  return {
    states: [...input.states], linearization: input.linearization, preMutationAdmission: true,
    prepareOrder: [...input.prepareOrder], commitOrder: [...input.commitOrder], abortOrder: [...input.abortOrder],
    compoundAdmission: { resourceGroup: input.compoundAdmission.resourceGroup, rerootReserve: input.compoundAdmission.rerootReserve, maxTransactions: input.compoundAdmission.maxTransactions, rollback: normalizeSchemaReference(input.compoundAdmission.rollback, 'reroot rollback') },
    rejectedEffect: 'none', duplicateEffect: 'none', partialCommit: 'fatal-quarantine', concurrentOrder: input.concurrentOrder,
    completion: normalizeSchemaReference(input.completion, 'reroot completion'), cleanup: normalizeSchemaReference(input.cleanup, 'reroot cleanup'),
  };
}

function normalizeWorkScope(input, index, workById) {
  exactKeys(input, ['workClass', 'scope', 'staleDisposition', 'release'], 'SESSION_WORK_SCOPE_FIELDS', `reroot work scope ${index}`);
  if (!workById.has(input.workClass)) fail('SESSION_WORK_SCOPE', `${input.workClass} is unknown`);
  const scope = assertEnum(input.scope, ['engine', 'session', 'root-authority'], 'SESSION_WORK_SCOPE', `${input.workClass} scope`);
  const staleDisposition = assertEnum(input.staleDisposition, ['not-applicable', 'applied-before-authority-change', 'abandoned-stale-root', 'owner-declared'], 'SESSION_WORK_SCOPE', `${input.workClass} staleDisposition`);
  if ((scope === 'root-authority' && staleDisposition === 'not-applicable') || (scope !== 'root-authority' && staleDisposition !== 'not-applicable')) fail('SESSION_WORK_STALE', `${input.workClass} stale disposition does not match authority scope`);
  return { workClass: input.workClass, scope, staleDisposition, release: normalizeSchemaReference(input.release, `${input.workClass} release`) };
}

function normalizeReroot(input, owners, inputById, workById, rerootReserve, rerootAdmission) {
  if (input?.kind === 'absent') {
    exactKeys(input, ['kind'], 'SESSION_REROOT_FIELDS', 'reroot');
    if ([...inputById.values()].some(({ kind }) => kind === 'reroot') || owners.some(({ reroot }) => reroot.kind === 'selected')) fail('SESSION_REROOT_RESIDUE', 'reroot-owned input/owner state remains while reroot is absent');
    return { kind: 'absent' };
  }
  exactKeys(input, ['kind', 'profile'], 'SESSION_REROOT_FIELDS', 'reroot');
  if (input.kind !== 'selected') fail('SESSION_REROOT_KIND', 'reroot kind is invalid');
  const p = input.profile;
  exactKeys(p, ['input', 'transaction', 'oldRoot', 'materialization', 'publication', 'reuseClassification', 'workScopes', 'pressureOutcome', 'rejectedOutcome', 'acceptedOutcome', 'exhaustedOutcome', 'hostProgress'], 'SESSION_REROOT_PROFILE_FIELDS', 'reroot profile');
  if (!rerootReserve || !rerootAdmission) fail('SESSION_REROOT_ADMISSION', 'selected reroot requires its protected admission reserve');
  const command = inputById.get(p.input);
  const domainOwnerId = owners.find(({ contract }) => contract.id === 'SPEC-0007')?.id;
  if (!command || command.kind !== 'reroot' || command.owner !== domainOwnerId || command.epochScope !== 'session-and-root-authority') fail('SESSION_REROOT_INPUT', 'reroot input/owner/scope is invalid');
  if (p.oldRoot !== 'authoritative-until-commit' || p.materialization !== 'prepare-nonauthoritative' || p.publication !== 'release-after-full-initialization'
      || p.reuseClassification !== 'owner-declared-reroot-only' || !['reject-keep-session', 'restart-required', 'reserved-admit'].includes(p.pressureOutcome) || p.hostProgress !== 'none') fail('SESSION_REROOT_CONTRACT', 'reroot contract is incomplete');
  const participantIds = owners.filter(({ reroot }) => reroot.kind === 'selected').map(({ id }) => id);
  if (participantIds.length < 3) fail('SESSION_REROOT_OWNER', 'reroot requires affected owners');
  const transaction = normalizeRerootTransaction(p.transaction, participantIds, rerootReserve, rerootAdmission);
  if (!Array.isArray(p.workScopes) || p.workScopes.length === 0) fail('SESSION_REROOT_WORK_SCOPE', 'reroot workScopes must not be empty');
  const workScopes = p.workScopes.map((entry, index) => normalizeWorkScope(entry, index, workById)).sort((a, b) => compareRaw(a.workClass, b.workClass));
  uniqueBy(workScopes, 'workClass', 'SESSION_REROOT_WORK_DUPLICATE', 'reroot work scope');
  if (workScopes.length !== workById.size || [...workById.keys()].some((id) => !workScopes.some(({ workClass }) => workClass === id))) fail('SESSION_REROOT_WORK_COVERAGE', 'reroot work scopes must exactly cover selected progress work classes');
  return { kind: 'selected', profile: { input: p.input, transaction, oldRoot: p.oldRoot, materialization: p.materialization, publication: p.publication, reuseClassification: p.reuseClassification, workScopes, pressureOutcome: p.pressureOutcome, rejectedOutcome: p.rejectedOutcome, acceptedOutcome: p.acceptedOutcome, exhaustedOutcome: p.exhaustedOutcome, hostProgress: 'none' } };
}

function normalizeAttention(input, ownerById, inputById) {
  if (input?.kind === 'absent') {
    exactKeys(input, ['kind'], 'SESSION_ATTENTION_FIELDS', 'attention');
    if ([...inputById.values()].some(({ kind }) => kind === 'attention')) fail('SESSION_ATTENTION_RESIDUE', 'attention input remains while attention is absent');
    return { kind: 'absent' };
  }
  exactKeys(input, ['kind', 'profile'], 'SESSION_ATTENTION_FIELDS', 'attention');
  if (input.kind !== 'selected') fail('SESSION_ATTENTION_KIND', 'attention kind is invalid');
  const p = input.profile;
  exactKeys(p, ['id', 'owner', 'input', 'schema', 'authority', 'identity', 'idempotence', 'generationCounter', 'effect', 'applicationPoint', 'visibility', 'coalescing', 'application', 'steadyStatePolling', 'applicationCost', 'existingWork', 'rootAuthorityEffect', 'graphWork', 'reclamation', 'synchronization', 'multiDeviceVisibility', 'pressureOutcome', 'hostProgress'], 'SESSION_ATTENTION_PROFILE_FIELDS', 'attention profile');
  const command = inputById.get(p.input);
  const owner = ownerById.get(p.owner);
  if (!command || command.kind !== 'attention' || command.owner !== p.owner || command.epochScope !== 'session' || owner?.role !== 'participant') fail('SESSION_ATTENTION_INPUT', `${p.id} attention input/owner/scope is invalid`);
  const schema = normalizeSchemaReference(p.schema, `${p.id} schema`);
  const authority = normalizeSchemaReference(p.authority, `${p.id} authority`);
  const idempotence = normalizeSchemaReference(p.idempotence, `${p.id} idempotence`);
  const effect = normalizeSchemaReference(p.effect, `${p.id} effect`);
  const applicationPoint = normalizeSchemaReference(p.applicationPoint, `${p.id} applicationPoint`);
  if (schemaKey(schema) !== schemaKey(command.schema) || schemaKey(authority) !== schemaKey(command.authority) || schemaKey(idempotence) !== schemaKey(command.idempotence)
      || schemaKey(effect) !== schemaKey(command.effect) || schemaKey(applicationPoint) !== schemaKey(command.deviceApplicationPoint)
      || !['none', 'latest-unapplied-version'].includes(p.coalescing) || p.application !== 'queued-device-control-work-at-existing-safe-point'
      || p.steadyStatePolling !== 'none' || p.applicationCost !== 'bounded-independent-of-search-state' || p.existingWork !== 'unchanged'
      || p.rootAuthorityEffect !== 'none' || p.graphWork !== 'none' || p.reclamation !== 'none' || p.synchronization !== 'no-global-barrier'
      || p.multiDeviceVisibility !== 'per-device-versioned-safe-point' || p.hostProgress !== 'none') fail('SESSION_ATTENTION_CONTRACT', `${p.id} violates attention separation`);
  assertNamespacedId(p.generationCounter, 'SESSION_ATTENTION_COUNTER', 'attention generationCounter');
  return { kind: 'selected', profile: { ...p, schema, authority, idempotence, effect, applicationPoint, identity: normalizeSchemaReference(p.identity, `${p.id} identity`), visibility: normalizeSchemaReference(p.visibility, `${p.id} visibility`) } };
}

function normalizeObservation(input, index, outputObservation, inputById, outputProfile) {
  exactKeys(input, ['id', 'outputProfile', 'requestInput', 'rootEpochBinding', 'acquisition', 'release', 'unavailable', 'stale', 'pressure', 'maxPendingRequests', 'maxBorrows', 'maxTransfers', 'readOnly', 'hostProgress', 'runtimeSchema', 'teardown'], 'SESSION_OBSERVATION_FIELDS', `observation ${index}`);
  assertNamespacedId(input.id, 'SESSION_OBSERVATION_ID', `observation ${index} id`);
  if (!outputObservation || input.outputProfile !== outputObservation.id) fail('SESSION_OBSERVATION_OUTPUT', `${input.id} names unknown output observation`);
  const request = inputById.get(input.requestInput);
  if (!request || request.kind !== 'observation-request' || schemaKey(request.schema) !== schemaKey(outputObservation.request.identity) || schemaKey(request.permission) !== schemaKey(outputObservation.request.permission)) fail('SESSION_OBSERVATION_REQUEST', `${input.id} request differs from output contract`);
  const rootEpochBinding = normalizeSchemaReference(input.rootEpochBinding, `${input.id} rootEpochBinding`);
  const acquisition = normalizeSchemaReference(input.acquisition, `${input.id} acquisition`);
  const release = normalizeSchemaReference(input.release, `${input.id} release`);
  if (schemaKey(rootEpochBinding) !== schemaKey(outputProfile.snapshot.rootEpoch) || schemaKey(acquisition) !== schemaKey(outputProfile.publication.acquireRead)
      || schemaKey(release) !== schemaKey(outputProfile.publication.borrowRelease) || input.readOnly !== true || input.hostProgress !== 'none' || input.runtimeSchema !== 'prohibited') fail('SESSION_OBSERVATION_CONTRACT', `${input.id} violates read-only publication ownership`);
  const maxPendingRequests = positiveDecimal(input.maxPendingRequests, 'SESSION_OBSERVATION_RANGE', `${input.id} maxPendingRequests`);
  const maxBorrows = positiveDecimal(input.maxBorrows, 'SESSION_OBSERVATION_RANGE', `${input.id} maxBorrows`);
  const maxTransfers = positiveDecimal(input.maxTransfers, 'SESSION_OBSERVATION_RANGE', `${input.id} maxTransfers`);
  if (compareDecimalUint(maxPendingRequests, outputObservation.maxRequests) > 0 || compareDecimalUint(maxBorrows, outputObservation.maxBorrows) > 0 || compareDecimalUint(maxTransfers, outputObservation.maxTransfers) > 0) fail('SESSION_OBSERVATION_RANGE', `${input.id} exceeds output bounds`);
  return { id: input.id, outputProfile: input.outputProfile, requestInput: input.requestInput, rootEpochBinding, acquisition, release, unavailable: input.unavailable, stale: input.stale, pressure: input.pressure, maxPendingRequests, maxBorrows, maxTransfers, readOnly: true, hostProgress: 'none', runtimeSchema: 'prohibited', teardown: normalizeSchemaReference(input.teardown, `${input.id} teardown`) };
}

function normalizeObservations(input, outputProfile, inputById) {
  const selected = outputProfile.observations;
  if (selected.kind === 'absent') {
    exactKeys(input, ['kind'], 'SESSION_OBSERVATIONS_FIELDS', 'observations');
    if (input.kind !== 'absent' || [...inputById.values()].some(({ kind }) => kind === 'observation-request')) fail('SESSION_OBSERVATION_RESIDUE', 'observation absence must remove coordination');
    return { kind: 'absent' };
  }
  exactKeys(input, ['kind', 'profiles'], 'SESSION_OBSERVATIONS_FIELDS', 'observations');
  if (input.kind !== 'selected' || !Array.isArray(input.profiles)) fail('SESSION_OBSERVATIONS_KIND', 'selected output observations require session coordination');
  const outputById = new Map(selected.profiles.map((entry) => [entry.id, entry]));
  const profiles = input.profiles.map((entry, index) => normalizeObservation(entry, index, outputById.get(entry.outputProfile), inputById, outputProfile)).sort((a, b) => compareRaw(a.id, b.id));
  uniqueBy(profiles, 'id', 'SESSION_OBSERVATION_DUPLICATE', 'observation');
  if (profiles.length !== outputById.size || [...outputById.keys()].some((id) => !profiles.some(({ outputProfile: outputId }) => outputId === id))) fail('SESSION_OBSERVATION_COVERAGE', 'session observations do not exactly cover output observations');
  return { kind: 'selected', profiles };
}

function normalizeReclamation(input) {
  exactKeys(input, ['advanceSeparate', 'rerootCommitSeparate', 'fullGraphSynchronous', 'protectedReferences', 'generationSafety', 'gracePeriod', 'pressureOutcome', 'failureOutcome', 'cleanup'], 'SESSION_RECLAMATION_FIELDS', 'reclamation');
  if (input.advanceSeparate !== true || input.rerootCommitSeparate !== true || input.fullGraphSynchronous !== false) fail('SESSION_RECLAMATION_AUTHORITY', 'authority change and reclamation separation is incomplete');
  const allowed = ['old-epoch-work', 'observation', 'borrow', 'reroot-transaction', 'shared-node-reference'];
  const protectedReferences = [...input.protectedReferences].sort(compareRaw);
  if (protectedReferences.length < 4 || new Set(protectedReferences).size !== protectedReferences.length || protectedReferences.some((entry) => !allowed.includes(entry)) || !protectedReferences.includes('shared-node-reference')) fail('SESSION_RECLAMATION_PROTECTION', 'reclamation protections are incomplete');
  return { advanceSeparate: true, rerootCommitSeparate: true, fullGraphSynchronous: false, protectedReferences, generationSafety: normalizeSchemaReference(input.generationSafety, 'reclamation generationSafety'), gracePeriod: normalizeSchemaReference(input.gracePeriod, 'reclamation gracePeriod'), pressureOutcome: input.pressureOutcome, failureOutcome: input.failureOutcome, cleanup: normalizeSchemaReference(input.cleanup, 'reclamation cleanup') };
}

function normalizeCounter(input, index) {
  exactKeys(input, ['id', 'kind', 'maximum', 'reserved', 'exhaustionThreshold', 'rollover', 'exhaustionOutcome', 'staleAliasProhibited'], 'SESSION_COUNTER_FIELDS', `counter ${index}`);
  assertNamespacedId(input.id, 'SESSION_COUNTER_ID', `counter ${index} id`);
  const kind = assertEnum(input.kind, [...BASE_COUNTER_KINDS, 'advance-generation', 'attention-generation'], 'SESSION_COUNTER_KIND', `${input.id} kind`);
  const maximum = positiveDecimal(input.maximum, 'SESSION_COUNTER_RANGE', `${input.id} maximum`);
  const reserved = normalizeDecimalUint(input.reserved, `${input.id} reserved`);
  const exhaustionThreshold = positiveDecimal(input.exhaustionThreshold, 'SESSION_COUNTER_RANGE', `${input.id} exhaustionThreshold`);
  if (compareDecimalUint(reserved, exhaustionThreshold) >= 0 || compareDecimalUint(exhaustionThreshold, maximum) > 0) fail('SESSION_COUNTER_RANGE', `${input.id} counter range is invalid`);
  const rollover = assertEnum(input.rollover, ['prohibited', 'new-session-incarnation'], 'SESSION_COUNTER_ROLLOVER', `${input.id} rollover`);
  if ((kind === 'session-incarnation') !== (rollover === 'prohibited') || input.staleAliasProhibited !== true) fail('SESSION_COUNTER_ROLLOVER', `${input.id} rollover can alias stale state`);
  return { id: input.id, kind, maximum, reserved, exhaustionThreshold, rollover, exhaustionOutcome: input.exhaustionOutcome, staleAliasProhibited: true };
}

function normalizeLifecycle(input, progressProfile, outputProfile, selected) {
  exactKeys(input, ['states', 'cancellationOrder', 'cancellationIdempotent', 'completion', 'health', 'restart', 'persistence', 'postIgnitionInteractions', 'hostProgress', 'teardownOrder', 'terminalResultBinding'], 'SESSION_LIFECYCLE_FIELDS', 'lifecycle');
  if (!Array.isArray(input.states) || input.states.some((state, index) => state !== LIFECYCLE_STATES[index]) || input.states.length !== LIFECYCLE_STATES.length
      || input.cancellationOrder !== 'authority-and-attention-version-order' || input.cancellationIdempotent !== true || input.restart !== 'new-session-incarnation'
      || input.persistence !== 'none' || input.hostProgress !== 'none' || !Array.isArray(input.teardownOrder) || input.teardownOrder.some((entry, index) => entry !== TEARDOWN_ORDER[index])) fail('SESSION_LIFECYCLE_CONTRACT', 'session lifecycle is incomplete');
  const expectedInteractions = [...(selected.advance ? ['advance'] : []), ...(selected.reroot ? ['reroot'] : []), ...(selected.attention ? ['attention-change'] : []), ...(selected.observations ? ['observation-read'] : []), 'cancellation', 'completion', 'teardown'];
  if (!Array.isArray(input.postIgnitionInteractions) || input.postIgnitionInteractions.length !== expectedInteractions.length || input.postIgnitionInteractions.some((entry, index) => entry !== expectedInteractions[index])) fail('SESSION_LIFECYCLE_RESIDUE', 'post-ignition interactions differ from selected capabilities');
  exactKeys(input.completion, ['freezeCommands', 'progressClosure', 'terminalCapture', 'authorityClosure', 'borrowQuiescence'], 'SESSION_COMPLETION_FIELDS', 'lifecycle completion');
  const progressClosure = normalizeSchemaReference(input.completion.progressClosure, 'completion progressClosure');
  const terminalCapture = normalizeSchemaReference(input.completion.terminalCapture, 'completion terminalCapture');
  const borrowQuiescence = normalizeSchemaReference(input.completion.borrowQuiescence, 'completion borrowQuiescence');
  if (input.completion.freezeCommands !== true || schemaKey(progressClosure) !== schemaKey(progressProfile.closure.publication) || schemaKey(terminalCapture) !== schemaKey(outputProfile.terminal.cleanup) || schemaKey(borrowQuiescence) !== schemaKey(outputProfile.publication.borrowExpiry)) fail('SESSION_COMPLETION_BINDING', 'completion differs from progress/output closure');
  return { states: [...input.states], cancellationOrder: input.cancellationOrder, cancellationIdempotent: true, completion: { freezeCommands: true, progressClosure, terminalCapture, authorityClosure: normalizeSchemaReference(input.completion.authorityClosure, 'completion authorityClosure'), borrowQuiescence }, health: normalizeSchemaReference(input.health, 'lifecycle health'), restart: input.restart, persistence: input.persistence, postIgnitionInteractions: [...input.postIgnitionInteractions], hostProgress: 'none', teardownOrder: [...input.teardownOrder], terminalResultBinding: normalizeSchemaReference(input.terminalResultBinding, 'lifecycle terminalResultBinding') };
}

function normalizeStatus(input, index) {
  exactKeys(input, ['code', 'class', 'diagnostic'], 'SESSION_STATUS_FIELDS', `status ${index}`);
  assertString(input.code, /^[a-z][a-z0-9-]*$/, 'SESSION_STATUS_CODE', `status ${index} code`);
  const statusClass = assertEnum(input.class, ['normal', 'pending', 'pressure', 'reject', 'stop', 'fatal', 'cancellation'], 'SESSION_STATUS_CLASS', `${input.code} class`);
  if (typeof input.diagnostic !== 'boolean' || (STATUS_CLASSES.has(input.code) && STATUS_CLASSES.get(input.code) !== statusClass)) fail('SESSION_STATUS_CLASS', `${input.code} status is invalid`);
  return { code: input.code, class: statusClass, diagnostic: input.diagnostic };
}

function normalizePort(input, index, permissions, statusCodes) {
  exactKeys(input, ['id', 'phase', 'input', 'output', 'maxWorkUnits', 'permission', 'statuses', 'mechanism', 'hostProgress'], 'SESSION_PORT_FIELDS', `port ${index}`);
  const expectedPhase = REQUIRED_PORT_PHASES.get(input.id);
  if (!expectedPhase || input.phase !== expectedPhase || input.mechanism !== 'public-cuda-js-contract' || input.hostProgress !== 'none') fail('SESSION_PORT_CONTRACT', `${input.id} port phase/mechanism is invalid`);
  const permission = normalizeSchemaReference(input.permission, `${input.id} permission`);
  if (!permissions.has(schemaKey(permission))) fail('SESSION_PORT_PERMISSION', `${input.id} permission is not selected`);
  const statuses = [...input.statuses].sort(compareRaw);
  if (statuses.length === 0 || new Set(statuses).size !== statuses.length || statuses.some((status) => !statusCodes.has(status))) fail('SESSION_PORT_STATUS', `${input.id} status outcomes are invalid`);
  return { id: input.id, phase: input.phase, input: normalizeSchemaReference(input.input, `${input.id} input`), output: normalizeSchemaReference(input.output, `${input.id} output`), maxWorkUnits: positiveDecimal(input.maxWorkUnits, 'SESSION_PORT_RANGE', `${input.id} maxWorkUnits`), permission, statuses, mechanism: input.mechanism, hostProgress: 'none' };
}

function normalizeSecurity(input, sessionClass) {
  exactKeys(input, ['untrustedUntilValidated', 'rawPointers', 'cudaHandles', 'callbacks', 'arbitraryCode', 'privateOwnerPaths', 'maxDiagnosticRecords', 'maxDiagnosticBytes', 'diagnosticOverflow', 'partialCommit'], 'SESSION_SECURITY_FIELDS', 'security');
  if (input.untrustedUntilValidated !== true || input.rawPointers !== false || input.cudaHandles !== false || input.callbacks !== false || input.arbitraryCode !== false || input.privateOwnerPaths !== false || input.diagnosticOverflow !== 'count' || input.partialCommit !== 'quarantine') fail('SESSION_SECURITY_CONTRACT', 'session security boundary is incomplete');
  const maxDiagnosticRecords = positiveDecimal(input.maxDiagnosticRecords, 'SESSION_SECURITY_RANGE', 'security maxDiagnosticRecords');
  const maxDiagnosticBytes = positiveDecimal(input.maxDiagnosticBytes, 'SESSION_SECURITY_RANGE', 'security maxDiagnosticBytes');
  if (compareDecimalUint(maxDiagnosticBytes, sessionClass.formula.maximumUnits) > 0) fail('SESSION_SECURITY_RANGE', 'diagnostics exceed session resource capacity');
  return { ...input, maxDiagnosticRecords, maxDiagnosticBytes };
}

function normalizeCompatibility(input) {
  exactKeys(input, ['ownerSemanticsRequired', 'operationSeparationRequired', 'packageIdentityRequired', 'sidebandTransportOpaque', 'nativeQualification', 'persistence'], 'SESSION_COMPATIBILITY_FIELDS', 'compatibility');
  exactKeys(input.persistence, ['kind'], 'SESSION_PERSISTENCE_FIELDS', 'compatibility persistence');
  if (input.ownerSemanticsRequired !== true || input.operationSeparationRequired !== true || input.packageIdentityRequired !== true || input.sidebandTransportOpaque !== true || input.nativeQualification !== 'separate-selected-profile' || input.persistence.kind !== 'none') fail('SESSION_COMPATIBILITY_CONTRACT', 'session compatibility is incomplete');
  return { ownerSemanticsRequired: true, operationSeparationRequired: true, packageIdentityRequired: true, sidebandTransportOpaque: true, nativeQualification: input.nativeQualification, persistence: { kind: 'none' } };
}

function normalizeCleanup(input, selected) {
  exactKeys(input, ['kinds', 'disposition', 'quarantine', 'releaseOrder', 'ownerOrder', 'retainedEvidence', 'terminalBorrowPreservedUntilRelease'], 'SESSION_CLEANUP_FIELDS', 'cleanup');
  const expected = [...BASE_CLEANUP_KINDS, ...(selected.advance ? ['advance-publication'] : []), ...(selected.reroot ? ['reroot-transaction', 'compound-lease'] : []), ...(selected.attention ? ['attention-publication'] : []), ...(selected.observations ? ['observation-request', 'borrow', 'transfer'] : [])].sort(compareRaw);
  const kinds = [...input.kinds].sort(compareRaw);
  if (kinds.length !== expected.length || new Set(kinds).size !== kinds.length || expected.some((kind) => !kinds.includes(kind)) || input.terminalBorrowPreservedUntilRelease !== true) fail('SESSION_CLEANUP_COVERAGE', 'cleanup does not exactly cover selected session state');
  return { kinds, disposition: normalizeSchemaReference(input.disposition, 'cleanup disposition'), quarantine: normalizeSchemaReference(input.quarantine, 'cleanup quarantine'), releaseOrder: normalizeSchemaReference(input.releaseOrder, 'cleanup releaseOrder'), ownerOrder: normalizeSchemaReference(input.ownerOrder, 'cleanup ownerOrder'), retainedEvidence: normalizeSchemaReference(input.retainedEvidence, 'cleanup retainedEvidence'), terminalBorrowPreservedUntilRelease: true };
}

function normalizeProgram(input, requiredProfiles, observationSelected) {
  exactKeys(input, ['kind', 'language', 'sourceIdentity', 'inputs', 'requirements', 'provenance'], 'SESSION_PROGRAM_FIELDS', 'programContribution');
  if (input.kind !== 'device-program' || input.language !== 'restricted-device-js') fail('SESSION_PROGRAM_LANGUAGE', 'session contribution must be restricted Device-JS');
  const inputs = input.inputs.map((entry, index) => normalizeProfileReference(entry, `program input ${index}`)).sort((a, b) => compareRaw(a.id, b.id));
  uniqueBy(inputs, 'id', 'SESSION_PROGRAM_INPUT_DUPLICATE', 'program input');
  const actual = new Map(inputs.map((profile) => [profile.id, profileKey(profile)]));
  if (actual.size !== requiredProfiles.size || [...requiredProfiles].some(([id, profile]) => actual.get(id) !== profileKey(profile))) fail('SESSION_PROGRAM_INPUTS', 'program inputs differ from selected public owner profiles');
  const requirements = input.requirements.map((entry, index) => normalizeSchemaReference(entry, `program requirement ${index}`)).sort((a, b) => compareRaw(a.id, b.id));
  uniqueBy(requirements, 'id', 'SESSION_PROGRAM_REQUIREMENT_DUPLICATE', 'program requirement');
  const expected = [...BASE_PUBLIC_REQUIREMENTS, ...(observationSelected ? OBSERVATION_PUBLIC_REQUIREMENTS : [])];
  if (requirements.length !== expected.length || expected.some((id) => !requirements.some((entry) => entry.id === id))) fail('SESSION_PROGRAM_REQUIREMENTS', 'program requirements are not the bounded public CUDA-JS set');
  exactKeys(input.provenance, ['origin', 'revision', 'license', 'review'], 'SESSION_PROGRAM_PROVENANCE_FIELDS', 'program provenance');
  if (input.provenance.origin !== 'first-party') fail('SESSION_PROGRAM_ORIGIN', 'session program must be first-party');
  assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'SESSION_PROGRAM_REVISION', 'program revision');
  assertString(input.provenance.license, /\S/, 'SESSION_PROGRAM_LICENSE', 'program license');
  return { kind: input.kind, language: input.language, sourceIdentity: normalizeContentIdentity(input.sourceIdentity, 'SESSION_PROGRAM_SOURCE', 'program sourceIdentity'), inputs, requirements, provenance: { origin: input.provenance.origin, revision: input.provenance.revision, license: input.provenance.license, review: normalizeSchemaReference(input.provenance.review, 'program review') } };
}

function normalizeProductData(input, index) {
  exactKeys(input, ['ownerContract', 'schema', 'identity'], 'SESSION_PRODUCT_FIELDS', `productData ${index}`);
  if (input.ownerContract?.kind !== 'namespaced') fail('SESSION_PRODUCT_OWNER', 'product data owner must be namespaced');
  return { ownerContract: normalizeContract(input.ownerContract, new Map(), `productData ${index} owner`), schema: normalizeSchemaReference(input.schema, `productData ${index} schema`), identity: normalizeContentIdentity(input.identity, 'SESSION_PRODUCT_IDENTITY', `productData ${index} identity`) };
}

export function normalizeSessionProfile(input, inspectedCatalog, resourceResult, progressResult, outputResult) {
  exactKeys(input, ['schema', 'representation', 'status', 'contract', 'id', 'version', 'resourcePlan', 'progressPlan', 'outputProfile', 'resourceContribution', 'progressContribution', 'identity', 'commands', 'root', 'advance', 'reroot', 'owners', 'attention', 'observations', 'reclamation', 'counters', 'lifecycle', 'ports', 'statuses', 'permissions', 'security', 'compatibility', 'cleanup', 'programContribution', 'productData'], 'SESSION_ROOT_FIELDS', 'session profile');
  if (input.schema !== SESSION_SCHEMA || input.representation !== REPRESENTATION || input.status !== 'accepted') fail('SESSION_SCHEMA', 'unsupported session schema/representation/status');
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

  const rerootReserve = resourceResult.normalized.reserves.find(({ purpose }) => purpose === 'reroot-admission');
  const rerootClass = rerootReserve ? resourceResult.normalized.classes.find(({ id, contributor }) => id === rerootReserve.class && contributor === resourceSession.id) : null;
  const rerootAdmission = rerootClass ? resourceResult.normalized.admissionGroups.find(({ classes }) => classes.includes(rerootClass.id)) : null;
  const sessionWork = progressResult.normalized.workClasses.find(({ owner }) => owner === progressSession.id);
  const sessionControlClasses = resourceResult.normalized.classes.filter(({ id, contributor }) => contributor === resourceSession.id && id !== rerootClass?.id && sessionWork?.resources?.includes(id));
  const sessionClass = sessionControlClasses.length === 1 ? sessionControlClasses[0] : null;
  const externalWait = progressResult.normalized.noProgress.externalWait;
  if (!sessionClass || sessionWork?.kind !== 'external-control' || sessionWork.reserve !== null
      || externalWait.kind !== 'session-only' || externalWait.owner !== progressSession.id || !progressSession.publicTransitions.some((entry) => schemaKey(entry) === schemaKey(externalWait.state))) fail('SESSION_UPSTREAM_CONTRACT', 'selected resource/progress Session boundary is incomplete');
  if (rerootReserve && (!rerootClass || !rerootAdmission || rerootReserve.borrow.kind !== 'none')) fail('SESSION_REROOT_ADMISSION', 'reroot reserve is incomplete');

  const contributorById = new Map(progressResult.normalized.contributors.map((entry) => [entry.id, entry]));
  const owners = input.owners.map((entry, index) => normalizeOwner(entry, index, catalogById, contributorById, progressSession.id)).sort((a, b) => compareRaw(a.id, b.id));
  uniqueBy(owners, 'id', 'SESSION_OWNER_DUPLICATE', 'owner');
  if (owners.length !== contributorById.size || [...contributorById.keys()].some((id) => !owners.some((entry) => entry.id === id))) fail('SESSION_OWNER_COVERAGE', 'owners do not exactly cover selected contributors');
  const ownerById = new Map(owners.map((entry) => [entry.id, entry]));
  const contractIds = new Set(owners.map(({ contract: ownerContract }) => ownerContract.id));
  for (const required of ['SPEC-0006', 'SPEC-0007', 'SPEC-0008', 'SPEC-0010', 'SPEC-0011', 'SPEC-0012', 'SPEC-0013']) if (!contractIds.has(required)) fail('SESSION_OWNER_REQUIRED', `selected Session profile lacks ${required} owner`);

  const permissions = input.permissions.map((entry, index) => normalizeSchemaReference(entry, `permission ${index}`)).sort((a, b) => compareRaw(schemaKey(a), schemaKey(b)));
  if (permissions.length === 0 || new Set(permissions.map(schemaKey)).size !== permissions.length) fail('SESSION_PERMISSION', 'permissions must be nonempty and unique');
  const permissionKeys = new Set(permissions.map(schemaKey));
  const commands = normalizeCommands(input.commands, ownerById, permissionKeys, externalWait, sessionClass);
  const inputById = new Map(commands.inputs.map((entry) => [entry.id, entry]));
  const root = normalizeRoot(input.root, ownerById);
  const advance = normalizeAdvance(input.advance, ownerById, inputById);
  const workById = new Map(progressResult.normalized.workClasses.map((entry) => [entry.id, entry]));
  const reroot = normalizeReroot(input.reroot, owners, inputById, workById, rerootReserve, rerootAdmission);
  const attention = normalizeAttention(input.attention, ownerById, inputById);
  const observations = normalizeObservations(input.observations, outputResult.normalized, inputById);
  const selected = { advance: advance.kind === 'selected', reroot: reroot.kind === 'selected', attention: attention.kind === 'selected', observations: observations.kind === 'selected' };
  if (!selected.reroot && rerootReserve) fail('SESSION_REROOT_RESIDUE', 'reroot admission reserve remains while reroot is absent');
  if (selected.advance !== commands.inputs.some(({ kind }) => kind === 'advance') || selected.reroot !== commands.inputs.some(({ kind }) => kind === 'reroot') || selected.attention !== commands.inputs.some(({ kind }) => kind === 'attention')) fail('SESSION_INPUT_COVERAGE', 'selected operation objects differ from command inputs');
  const observationInputs = commands.inputs.filter(({ kind }) => kind === 'observation-request');
  if ((selected.observations ? observations.profiles.length : 0) !== observationInputs.length) fail('SESSION_OBSERVATION_COVERAGE', 'observation command inputs differ from selected observations');

  const reclamation = normalizeReclamation(input.reclamation);
  const counters = input.counters.map(normalizeCounter).sort((a, b) => compareRaw(a.kind, b.kind));
  uniqueBy(counters, 'id', 'SESSION_COUNTER_DUPLICATE', 'counter'); uniqueBy(counters, 'kind', 'SESSION_COUNTER_KIND_DUPLICATE', 'counter kind');
  const expectedCounterKinds = [...BASE_COUNTER_KINDS, ...(selected.advance ? ['advance-generation'] : []), ...(selected.attention ? ['attention-generation'] : [])];
  if (counters.length !== expectedCounterKinds.length || expectedCounterKinds.some((kind) => !counters.some((entry) => entry.kind === kind))) fail('SESSION_COUNTER_COVERAGE', 'finite counter coverage is incomplete');
  const rootIncarnationCounter = counters.find(({ kind }) => kind === 'root-incarnation');
  const rootEpochCounter = counters.find(({ kind }) => kind === 'root-epoch');
  if (root.incarnationCounter !== rootIncarnationCounter.id || root.epochCounter !== rootEpochCounter.id || compareDecimalUint(rootIncarnationCounter.maximum, sessionClass.range.generationMaximum) > 0 || compareDecimalUint(rootEpochCounter.maximum, sessionClass.range.generationMaximum) > 0) fail('SESSION_ROOT_COUNTER', 'root counters differ from selected resource generation range');
  if (selected.advance) {
    const advanceCounter = counters.find(({ kind }) => kind === 'advance-generation');
    if (advance.profile.generationCounter !== advanceCounter.id || advance.profile.epochCounter !== rootEpochCounter.id) fail('SESSION_ADVANCE_COUNTER', 'advance counters are invalid');
  }
  if (selected.attention && attention.profile.generationCounter !== counters.find(({ kind }) => kind === 'attention-generation').id) fail('SESSION_ATTENTION_COUNTER', 'attention generation counter is invalid');
  const observationCounter = counters.find(({ kind }) => kind === 'observation-generation');
  if (outputResult.normalized.observations.kind === 'selected' && outputResult.normalized.observations.profiles.some(({ maxSequence }) => compareDecimalUint(maxSequence, observationCounter.maximum) > 0)) fail('SESSION_OBSERVATION_COUNTER', 'observation counter is narrower than output sequence');

  const statuses = input.statuses.map(normalizeStatus).sort((a, b) => compareRaw(a.code, b.code));
  uniqueBy(statuses, 'code', 'SESSION_STATUS_DUPLICATE', 'status');
  const statusCodes = new Set(statuses.map(({ code }) => code));
  const requiredStatusCodes = [...STATUS_CLASSES.keys()].filter((code) => (selected.advance || !code.startsWith('advance-')) && (selected.reroot || !code.startsWith('reroot-')) && (selected.attention || (!code.startsWith('session-attention-') && code !== 'attention-generation-exhausted')) && (selected.observations || !code.startsWith('session-observation-')));
  if (statusCodes.size !== requiredStatusCodes.length || requiredStatusCodes.some((code) => !statusCodes.has(code))) fail('SESSION_STATUS_REQUIRED', 'status vocabulary differs from selected Session capabilities');
  for (const command of commands.inputs) if (!statusCodes.has(command.pressureStatus)) fail('SESSION_INPUT_STATUS', `${command.id} pressure status is undeclared`);
  const referenced = [root.failureOutcome, reclamation.pressureOutcome, reclamation.failureOutcome];
  if (selected.advance) referenced.push(advance.profile.rejectedOutcome, advance.profile.acceptedOutcome, advance.profile.exhaustedOutcome);
  if (selected.reroot) referenced.push(reroot.profile.rejectedOutcome, reroot.profile.acceptedOutcome, reroot.profile.exhaustedOutcome);
  if (selected.attention) referenced.push(attention.profile.pressureOutcome);
  if (selected.observations) for (const observation of observations.profiles) referenced.push(observation.unavailable, observation.stale, observation.pressure);
  for (const status of referenced) if (!statusCodes.has(status)) fail('SESSION_STATUS_REFERENCE', `${status} is undeclared`);

  const lifecycle = normalizeLifecycle(input.lifecycle, progressResult.normalized, outputResult.normalized, selected);
  const ports = input.ports.map((entry, index) => normalizePort(entry, index, permissionKeys, statusCodes)).sort((a, b) => compareRaw(a.id, b.id));
  uniqueBy(ports, 'id', 'SESSION_PORT_DUPLICATE', 'port');
  const requiredPortIds = ['validateInitialRoot', 'requestCancellation', 'completeSession', 'teardownSession'];
  if (selected.advance) requiredPortIds.push('applyAdvance');
  if (selected.reroot) requiredPortIds.push('prepareReroot', 'commitReroot', 'abortReroot');
  if (selected.attention) requiredPortIds.push('applyAttentionChange');
  if (selected.observations) requiredPortIds.push('requestObservation', 'acquireObservation', 'releaseObservation');
  if (ports.length !== requiredPortIds.length || requiredPortIds.some((id) => !ports.some((entry) => entry.id === id))) fail('SESSION_PORT_COVERAGE', 'semantic ports differ from selected capabilities');
  const referencedPermissions = new Set([...commands.inputs, ...ports].map(({ permission }) => schemaKey(permission)));
  if (permissionKeys.size !== referencedPermissions.size || [...referencedPermissions].some((key) => !permissionKeys.has(key))) fail('SESSION_PERMISSION_COVERAGE', 'permissions differ from selected inputs and ports');

  const security = normalizeSecurity(input.security, sessionClass);
  const compatibility = normalizeCompatibility(input.compatibility);
  if (lifecycle.persistence !== compatibility.persistence.kind) fail('SESSION_PERSISTENCE', 'lifecycle/compatibility persistence differs');
  const cleanup = normalizeCleanup(input.cleanup, selected);
  const requiredProgramProfiles = new Map([[resourcePlan.id, resourcePlan], [progressPlan.id, progressPlan], [outputProfile.id, outputProfile]]);
  for (const owner of owners.filter(({ role }) => role === 'participant')) if (!requiredProgramProfiles.has(owner.profile.id)) requiredProgramProfiles.set(owner.profile.id, owner.profile);
  const programContribution = normalizeProgram(input.programContribution, requiredProgramProfiles, selected.observations);
  const productData = input.productData.map(normalizeProductData).sort((a, b) => compareRaw(a.ownerContract.id, b.ownerContract.id));
  uniqueBy(productData.map(({ ownerContract }) => ({ id: ownerContract.id })), 'id', 'SESSION_PRODUCT_DUPLICATE', 'product owner');

  const normalized = {
    schema: input.schema, representation: input.representation, status: input.status, contract, id: input.id, version: input.version,
    resourcePlan, progressPlan, outputProfile, resourceContribution, progressContribution, identity: normalizeIdentity(input.identity),
    commands, root, advance, reroot, owners, attention, observations, reclamation, counters, lifecycle, ports, statuses, permissions,
    security, compatibility, cleanup, programContribution, productData,
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}
