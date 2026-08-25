import { createHash } from 'node:crypto';

const VERSION = '0.1.0';
const REVISION = '125ac4de64d8db2c0027ff4e0e434f9c0a8dcb4d';
const BASE_PORTS = [
  'admit-evaluation-request', 'cancel-evaluation-request', 'classify-evaluator-reuse', 'complete-evaluation-request',
  'encode-evaluator-input', 'enqueue-evaluation-item', 'execute-evaluation-batch', 'fail-evaluation-request',
  'form-evaluation-batch', 'initialize-evaluator', 'publish-evaluator-capability',
];

function sha256(label) {
  return createHash('sha256').update(label, 'utf8').digest('hex');
}

function schemaReference(id) {
  return { id: `${id}/${VERSION}`, version: VERSION, sha256: sha256(`schema:${id}/${VERSION}`) };
}

function contentIdentity(label) {
  return { algorithm: 'sha256', sha256: sha256(`content:${label}`) };
}

function identityReference(identity) {
  return { algorithm: identity.algorithm, sha256: identity.sha256 };
}

function catalogContract(inspected, id) {
  const contract = inspected.contractSet.contracts.find((entry) => entry.id === id);
  return { kind: 'catalog', id: contract.id, specificationIdentity: contract.specificationIdentity, sha256: contract.sha256 };
}

function profileReference(result, schemaSha) {
  return {
    id: result.normalized.id,
    schema: { id: result.normalized.schema, version: '0.2.0', sha256: schemaSha },
    identity: identityReference(result.identity),
  };
}

function domainReference(domainResult, schemaSha) {
  const values = new Map(domainResult.normalized.valueSchemas.map((value) => [value.semanticRole, value]));
  const ports = new Map(domainResult.normalized.ports.map(({ id, contract }) => [id, contract]));
  return {
    ...profileReference(domainResult, schemaSha),
    stateSchema: values.get('state').schema,
    historySchema: domainResult.normalized.history.disposition === 'none' ? { kind: 'none' } : values.get('history').schema,
    validateActionPort: ports.get('validate-action'),
  };
}

function graphReference(graphResult, schemaSha) {
  const result = { ...profileReference(graphResult, schemaSha), mode: graphResult.normalized.mode };
  if (result.mode === 'materialized') result.validateReferencePort = graphResult.normalized.ports.find(({ id }) => id === 'validate-reference').contract;
  return result;
}

function bounds(random = '0', work = '256') {
  return { maxWorkUnits: work, maxReads: '128', maxWrites: '64', maxRandomInputs: random, cancellationObservationWorkUnits: '16' };
}

function numeric(profile, representation = 'floating', storageBits = '32', accumulationBits = '64') {
  return {
    representation, storageBits, accumulationBits,
    range: schemaReference(`cuda-mcgs.synthetic-${profile}-numeric-range`),
    precision: schemaReference(`cuda-mcgs.synthetic-${profile}-numeric-precision`),
    rounding: representation === 'floating' ? 'nearest-even' : 'exact',
    nonfinite: representation === 'floating' ? 'reject' : 'not-representable',
    overflow: 'typed-failure', order: 'associative-commutative',
  };
}

function shape(profile, label, axes = [['item', '1', '1']], maxBytes = '4096', variable = false) {
  const normalizedAxes = axes.map(([id, minimum, maximum]) => ({ id: `evaluator.${profile}.axis-${label}-${id}`, minimum, maximum }));
  const maxElements = normalizedAxes.reduce((value, axis) => value * BigInt(axis.maximum), 1n).toString();
  return {
    axes: normalizedAxes, maxElements, maxBytes, variable,
    lengthSemantics: schemaReference(`cuda-mcgs.synthetic-${profile}-${label}-length`),
  };
}

function coordinate(profile, output, id, perspective = 'global') {
  return {
    id: `evaluator.${profile}.coordinate-${output}-${id}`,
    unit: `evaluator.${profile}.unit-${output}-${id}`,
    perspective,
    transform: schemaReference(`cuda-mcgs.synthetic-${profile}-${output}-${id}-transform`),
  };
}

function capability(profile, id, kind, inputs, outputs, independentPublication = true) {
  return {
    id: `evaluator.${profile}.capability-${id}`, version: VERSION, kind,
    purposes: [`evaluator.${profile}.purpose-${id}`], requirementClasses: ['required'], inputs, outputs,
    independentPublication, failureIsolation: independentPublication ? 'capability' : 'request',
  };
}

function evaluatorInput(profile, id, domainResult, options = {}) {
  const sourceKind = options.sourceKind ?? 'state';
  const value = domainResult.normalized.valueSchemas.find(({ semanticRole }) => semanticRole === sourceKind);
  const dependencies = options.dependencies ?? ['purpose'];
  const keyFacts = [...new Set(['capability-set', 'encoded-input', 'evaluator-profile', 'precision-execution', 'purpose', ...dependencies, ...(options.artifact ? ['artifact-generation'] : []), ...(options.mutable ? ['state-generation'] : []), ...(options.batchSensitive ? ['batch-context'] : []), ...(options.random && options.random !== '0' ? ['randomness'] : [])])];
  return {
    id: `evaluator.${profile}.input-${id}`, owner: 'domain', sourceKind, source: value.schema,
    shape: shape(profile, `input-${id}`, options.axes ?? [['record', '1', options.maximum ?? '4096']], options.maxBytes ?? '262144', options.variable ?? true),
    unit: `evaluator.${profile}.unit-input-${id}`, numeric: numeric(profile, 'integer', '8', '64'),
    memoryExpectation: options.borrow ? 'device-resident-view' : 'device-owned-copy',
    lifetime: options.borrow ? 'protected-borrow' : 'immutable-snapshot', dependencies, keyFacts,
    encoding: schemaReference(`cuda-mcgs.synthetic-${profile}-input-${id}-encoding`),
    invalid: schemaReference(`cuda-mcgs.synthetic-${profile}-input-${id}-invalid`),
    maxRandomInputs: options.random ?? '0',
  };
}

function evaluatorOutput(profile, id, family, options = {}) {
  let coordinates = [coordinate(profile, id, 'primary', options.perspective ?? 'global')];
  if (family === 'vector') coordinates = ['objective-a', 'objective-b', 'objective-c'].map((name) => coordinate(profile, id, name, 'objective-indexed'));
  if (family === 'distribution') coordinates = ['support', 'mass'].map((name) => coordinate(profile, id, name, 'distributional'));
  if (family === 'candidate-set') coordinates = [coordinate(profile, id, 'candidate', 'namespaced')];
  return {
    id: `evaluator.${profile}.output-${id}`,
    schema: schemaReference(`cuda-mcgs.synthetic-${profile}-output-${id}`), family, coordinates,
    shape: shape(profile, `output-${id}`, options.axes ?? [['record', '1', options.maximum ?? '4096']], options.maxBytes ?? '262144', options.variable ?? true),
    numeric: numeric(profile, options.representation ?? 'floating', options.storageBits ?? '32', options.accumulationBits ?? '64'),
    validity: schemaReference(`cuda-mcgs.synthetic-${profile}-output-${id}-validity`),
    uncertainty: schemaReference(`cuda-mcgs.synthetic-${profile}-output-${id}-uncertainty`),
    invalid: schemaReference(`cuda-mcgs.synthetic-${profile}-output-${id}-invalid`),
    completeness: options.independent === false ? 'atomic-result-set' : 'independent-capability',
    compatibility: contentIdentity(`${profile}:output-${id}-compatibility`),
  };
}

function artifact(profile, kind = 'model', mutability = 'immutable') {
  return {
    id: `evaluator.${profile}.artifact-${kind}`, kind,
    schema: schemaReference(`cuda-mcgs.synthetic-${profile}-artifact-${kind}`),
    identity: contentIdentity(`${profile}:artifact-${kind}`), scope: 'engine', mutability,
    maxBytes: '1073741824', maxElements: '268435456',
    precision: schemaReference(`cuda-mcgs.synthetic-${profile}-artifact-${kind}-precision`),
    encoding: schemaReference(`cuda-mcgs.synthetic-${profile}-artifact-${kind}-encoding`),
    compatibility: schemaReference(`cuda-mcgs.synthetic-${profile}-artifact-${kind}-compatibility`),
    initialization: schemaReference(`cuda-mcgs.synthetic-${profile}-artifact-${kind}-initialization`),
    teardown: schemaReference(`cuda-mcgs.synthetic-${profile}-artifact-${kind}-teardown`), residentBeforeIgnition: true,
    provenance: {
      origin: 'first-party', revision: REVISION, license: 'Apache-2.0',
      contentSha256: contentIdentity(`${profile}:artifact-${kind}-bytes`).sha256,
      review: schemaReference(`cuda-mcgs.synthetic-${profile}-artifact-${kind}-security-review`),
    },
  };
}

function mutableState(profile, selected) {
  if (!selected) return { kind: 'none' };
  return {
    kind: 'selected', id: `evaluator.${profile}.mutable-state`,
    schema: schemaReference(`cuda-mcgs.synthetic-${profile}-mutable-state`), scope: 'engine', maxBytes: '1048576',
    initialization: schemaReference(`cuda-mcgs.synthetic-${profile}-mutable-state-initialization`),
    update: schemaReference(`cuda-mcgs.synthetic-${profile}-mutable-state-update`),
    ordering: schemaReference(`cuda-mcgs.synthetic-${profile}-mutable-state-ordering`),
    publication: schemaReference(`cuda-mcgs.synthetic-${profile}-mutable-state-publication`),
    rollback: schemaReference(`cuda-mcgs.synthetic-${profile}-mutable-state-rollback`),
    cacheInvalidation: schemaReference(`cuda-mcgs.synthetic-${profile}-mutable-state-cache-invalidation`),
    determinism: 'explicit-stochastic', cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-mutable-state-cleanup`),
  };
}

function request(profile, capabilities) {
  return {
    identity: schemaReference(`cuda-mcgs.synthetic-${profile}-request-identity`),
    lifecycle: schemaReference(`cuda-mcgs.synthetic-${profile}-request-lifecycle`),
    capabilities: capabilities.map(({ id }) => ({ capability: id, requirement: 'required', fallback: 'fail-request' })),
    admission: schemaReference(`cuda-mcgs.synthetic-${profile}-request-admission`),
    coalescing: schemaReference(`cuda-mcgs.synthetic-${profile}-request-coalescing`),
    accounting: schemaReference(`cuda-mcgs.synthetic-${profile}-request-accounting`),
    cancellationOrdering: schemaReference(`cuda-mcgs.synthetic-${profile}-request-cancellation-ordering`),
    maxActive: '4096', maxWaiters: '64', cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-request-cleanup`),
  };
}

function batching(profile, options = {}) {
  const sensitive = options.sensitive === true;
  const resumable = options.resumable === true;
  return {
    semantics: sensitive ? 'batch-sensitive' : 'batch-independent', minimumReadyItems: '1', maximumItems: options.maximumItems ?? '1',
    compatibility: schemaReference(`cuda-mcgs.synthetic-${profile}-batch-compatibility`),
    order: sensitive ? schemaReference(`cuda-mcgs.synthetic-${profile}-batch-order`) : { kind: 'none' },
    padding: schemaReference(`cuda-mcgs.synthetic-${profile}-batch-padding`),
    determinism: sensitive ? 'batch-context-bound' : (options.tolerance ? 'tolerance-equivalent' : 'deterministic'),
    randomness: sensitive ? { kind: 'explicit-input', maxInputs: '16', semantics: schemaReference(`cuda-mcgs.synthetic-${profile}-batch-randomness`) } : { kind: 'none', maxInputs: '0' },
    maxDelayWorkUnits: '128', failureDomain: options.failureDomain ?? 'item-independent',
    scatter: schemaReference(`cuda-mcgs.synthetic-${profile}-batch-scatter`),
    inactiveLane: schemaReference(`cuda-mcgs.synthetic-${profile}-inactive-lane`),
    continuation: resumable ? {
      kind: 'bounded', identity: schemaReference(`cuda-mcgs.synthetic-${profile}-continuation-identity`), maxResumes: '64', maxRetainedBytes: '1048576',
      progress: schemaReference(`cuda-mcgs.synthetic-${profile}-continuation-progress`), retry: schemaReference(`cuda-mcgs.synthetic-${profile}-continuation-retry`),
    } : { kind: 'none' },
    bounds: bounds(sensitive ? '16' : '0', resumable ? '1024' : '256'),
  };
}

function workspace(profile, scope) {
  return {
    id: `evaluator.${profile}.workspace-${scope}`, scope, maxBytes: scope === 'per-continuation' ? '1048576' : '16777216', alignment: '256',
    ownership: 'exclusive', initialization: schemaReference(`cuda-mcgs.synthetic-${profile}-${scope}-workspace-initialization`),
    mutation: schemaReference(`cuda-mcgs.synthetic-${profile}-${scope}-workspace-mutation`),
    publication: schemaReference(`cuda-mcgs.synthetic-${profile}-${scope}-workspace-publication`),
    highWaterAccounting: schemaReference(`cuda-mcgs.synthetic-${profile}-${scope}-workspace-high-water`),
    release: schemaReference(`cuda-mcgs.synthetic-${profile}-${scope}-workspace-release`),
  };
}

function publication(profile, capabilityId, independent = true) {
  return {
    capability: capabilityId, channel: schemaReference(`cuda-mcgs.synthetic-${profile}-${capabilityId.split('.').at(-1)}-publication`),
    producer: 'evaluator', consumers: ['policy'], states: ['absent', 'claimed', 'queued', 'executing', 'publishing', 'ready', 'failed', 'cancelled', 'stale'],
    visibility: 'device-release-acquire', commitValidation: schemaReference(`cuda-mcgs.synthetic-${profile}-publication-commit-validation`),
    maxWaiters: '64', progress: schemaReference(`cuda-mcgs.synthetic-${profile}-publication-progress`), terminalAuthority: 'single-publication-cas',
  };
}

function cache(profile, selected, keyFacts) {
  if (!selected) return { kind: 'none' };
  return {
    kind: 'selected', key: schemaReference(`cuda-mcgs.synthetic-${profile}-cache-key`), keyFacts,
    entryLifecycle: schemaReference(`cuda-mcgs.synthetic-${profile}-cache-entry-lifecycle`), collisionVerification: 'full-key-after-hash',
    equivalence: schemaReference(`cuda-mcgs.synthetic-${profile}-cache-equivalence`), maxEntries: '65536', maxWaiters: '64', failureCaching: 'none',
    pressureStatus: 'evaluator-cache-capacity', eviction: schemaReference(`cuda-mcgs.synthetic-${profile}-cache-eviction`),
    protection: schemaReference(`cuda-mcgs.synthetic-${profile}-cache-protection`), generation: schemaReference(`cuda-mcgs.synthetic-${profile}-cache-generation`),
    stateInvalidation: schemaReference(`cuda-mcgs.synthetic-${profile}-cache-state-invalidation`), cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-cache-cleanup`),
  };
}

function execution(profile, options = {}) {
  return {
    equivalenceClass: options.equivalence ?? 'exact', comparison: schemaReference(`cuda-mcgs.synthetic-${profile}-execution-comparison`),
    deviceOwned: true, hostProgress: 'none', idempotence: schemaReference(`cuda-mcgs.synthetic-${profile}-execution-idempotence`),
    workClasses: ['encode', 'admit', 'batch', 'execute', 'scatter', 'publish'].map((id) => `evaluator.${profile}.work-${id}`),
    stopDisposition: schemaReference(`cuda-mcgs.synthetic-${profile}-stop-disposition`), bounds: bounds(options.random ?? '0', options.work ?? '4096'),
  };
}

function statuses() {
  const classes = {
    'evaluator-absent': 'normal', 'evaluator-artifact-invalid': 'fatal', 'evaluator-batch-incompatible': 'recoverable', 'evaluator-batch-pending': 'pending',
    'evaluator-cache-capacity': 'pressure', 'evaluator-cache-miss': 'normal', 'evaluator-cancelled': 'cancellation', 'evaluator-generation-exhausted': 'fatal',
    'evaluator-input-stale': 'recoverable', 'evaluator-internal-failure': 'fatal', 'evaluator-output-invalid': 'fatal', 'evaluator-request-capacity': 'pressure',
    'evaluator-workspace-capacity': 'pressure', 'invalid-evaluator-input': 'fatal', 'invalid-evaluator-profile': 'fatal', 'unsupported-evaluator-capability': 'fatal',
  };
  return Object.entries(classes).map(([code, statusClass]) => ({ code, class: statusClass, diagnostic: true }));
}

function port(profile, id, completion = 'bounded', random = '0') {
  return {
    id, contract: schemaReference(`cuda-mcgs.synthetic-${profile}-port-${id}`), bounds: bounds(random, completion === 'finite-resumable' ? '1024' : '256'), completion,
    statuses: ['evaluator-cancelled', 'evaluator-internal-failure', 'evaluator-request-capacity'],
  };
}

function ports(profile, cacheSelected, resumable, random) {
  return [
    ...BASE_PORTS.map((id) => port(profile, id, id === 'execute-evaluation-batch' && resumable ? 'finite-resumable' : 'bounded', ['form-evaluation-batch', 'execute-evaluation-batch'].includes(id) ? random : '0')),
    ...(cacheSelected ? ['lookup-evaluator-cache', 'publish-evaluator-cache'].map((id) => port(profile, id)) : []),
    ...(resumable ? [port(profile, 'resume-evaluation-batch', 'finite-resumable')] : []),
  ];
}

function resource(profile, resourceClass, pressureStatus, maximum = '4096', unit = 'records') {
  return { id: `evaluator.${profile}.resource-${resourceClass}`, class: resourceClass, unit, minimum: '1', maximum, alignment: '8', scope: 'per-engine', pressureStatus };
}

function resources(profile, options = {}) {
  return [
    resource(profile, 'input', 'invalid-evaluator-input', '262144', 'bytes'),
    resource(profile, 'request', 'evaluator-request-capacity'), resource(profile, 'queue', 'evaluator-request-capacity', '4096', 'slots'),
    resource(profile, 'batch', 'evaluator-batch-pending', '4096', 'records'), resource(profile, 'result', 'evaluator-output-invalid', '262144', 'bytes'),
    resource(profile, 'waiter', 'evaluator-request-capacity', '4096', 'records'),
    resource(profile, 'diagnostic', 'evaluator-internal-failure', '256', 'diagnostics'),
    ...(options.artifact ? [resource(profile, 'artifact', 'evaluator-artifact-invalid', '1073741824', 'bytes')] : []),
    ...(options.mutable ? [resource(profile, 'state', 'evaluator-internal-failure', '1048576', 'bytes')] : []),
    ...(options.workspace ? [resource(profile, 'workspace', 'evaluator-workspace-capacity', '16777216', 'bytes')] : []),
    ...(options.resumable ? [resource(profile, 'continuation', 'evaluator-workspace-capacity', '1048576', 'bytes')] : []),
    ...(options.cache ? [resource(profile, 'cache', 'evaluator-cache-capacity', '65536', 'records')] : []),
    ...(options.randomness ? [resource(profile, 'randomness', 'evaluator-internal-failure', '16', 'random-inputs')] : []),
  ];
}

function lifecycle(profile) {
  return {
    states: ['profile-normalized', 'artifacts-resources-admitted', 'initialized', 'active', 'draining', 'terminal', 'released'],
    failure: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-failure`),
    quarantine: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-quarantine`),
    teardown: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-teardown`),
    admissionClosedAt: 'draining',
  };
}

function cleanup(profile, options) {
  return {
    classes: [
      'input-lease', 'request', 'waiter', 'batch', 'result', 'diagnostic',
      ...(options.artifact ? ['artifact-reference'] : []),
      ...(options.workspace ? ['workspace'] : []),
      ...(options.resumable ? ['continuation'] : []),
      ...(options.cache ? ['cache-entry'] : []),
      ...(options.mutable ? ['mutable-state'] : []),
    ],
    disposition: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-disposition`),
    quarantine: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-quarantine`),
    releaseOrder: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-release-order`),
  };
}

function reuse(profile, artifacts, state, cacheSelected) {
  const classes = ['evaluator.request', 'evaluator.result', ...artifacts.map(({ id }) => id), ...(state.kind === 'selected' ? [state.id] : []), ...(cacheSelected ? ['evaluator.cache'] : [])];
  return classes.map((classId) => ({
    classId, disposition: classId === 'evaluator.request' ? 'invalidate' : (classId === 'evaluator.result' || classId === 'evaluator.cache' ? 'retain-if-key-valid' : 'retain'),
    condition: schemaReference(`cuda-mcgs.synthetic-${profile}-${classId.replaceAll('.', '-')}-reuse-condition`),
    ordering: schemaReference(`cuda-mcgs.synthetic-${profile}-${classId.replaceAll('.', '-')}-reuse-ordering`),
    lifecycle: schemaReference(`cuda-mcgs.synthetic-${profile}-${classId.replaceAll('.', '-')}-reuse-lifecycle`),
  }));
}

function buildProfile(profile, inspected, domainResult, graphResult, domainSchemaSha, graphSchemaSha, options) {
  const artifacts = options.artifact ? [artifact(profile, options.artifactKind ?? 'model', options.mutable ? 'selected-mutable' : 'immutable')] : [];
  const state = mutableState(profile, options.mutable);
  const inputs = [
    evaluatorInput(profile, 'state', domainResult, { borrow: graphResult.normalized.mode === 'materialized', artifact: options.artifact, mutable: options.mutable, batchSensitive: options.sensitive, dependencies: ['purpose', ...(options.root ? ['root'] : [])] }),
    ...(options.history ? [evaluatorInput(profile, 'history', domainResult, { sourceKind: 'history', borrow: true, artifact: options.artifact, mutable: options.mutable, batchSensitive: options.sensitive, dependencies: ['history', 'root', 'purpose'] })] : []),
  ];
  const outputs = [];
  const capabilities = [];
  if (options.proposal) {
    const output = evaluatorOutput(profile, 'candidates', 'candidate-set', { independent: true });
    outputs.push(output); capabilities.push(capability(profile, 'proposal', 'proposal', inputs.map(({ id }) => id), [output.id]));
  }
  if (options.value) {
    const output = evaluatorOutput(profile, 'value', options.value, { independent: true, perspective: options.perspective ?? 'global', representation: options.value === 'proof' ? 'custom' : 'floating', storageBits: options.value === 'proof' ? '8' : '32', accumulationBits: options.value === 'proof' ? '8' : '64' });
    outputs.push(output); capabilities.push(capability(profile, 'value', options.value === 'proof' ? 'proof' : (options.value === 'distribution' ? 'distribution' : 'value'), inputs.map(({ id }) => id), [output.id]));
  }
  const batch = batching(profile, { sensitive: options.sensitive, resumable: options.resumable, maximumItems: options.maximumItems ?? '1', tolerance: options.tolerance, failureDomain: options.sensitive ? 'whole-batch' : 'item-independent' });
  const workspaces = [...(options.workspace ? [workspace(profile, 'per-batch')] : []), ...(options.resumable ? [workspace(profile, 'per-continuation')] : [])];
  const keyFacts = [...new Set([...inputs.flatMap(({ keyFacts }) => keyFacts), ...(options.artifact ? ['artifact-generation'] : []), ...(options.mutable ? ['state-generation'] : []), ...(options.sensitive ? ['batch-context'] : [])])];
  const cacheSelected = options.cache === true;
  return {
    schema: 'cuda-mcgs.evaluator-profile/0.2.0', representation: 'cuda-mcgs.search-ir/0.2.0', status: 'proposal-evidence',
    contract: catalogContract(inspected, 'SPEC-0009'), policyContract: catalogContract(inspected, 'SPEC-0008'),
    id: `evaluator.${profile}`, version: VERSION,
    mode: options.proposal ? (options.value ? 'combined' : 'proposal-only') : 'evaluation-only',
    domainProfile: domainReference(domainResult, domainSchemaSha), graphProfile: graphReference(graphResult, graphSchemaSha),
    capabilities, inputs, outputs, artifacts, mutableState: state, request: request(profile, capabilities), batching: batch, workspaces,
    publications: capabilities.map(({ id, independentPublication }) => publication(profile, id, independentPublication)),
    cache: cache(profile, cacheSelected, keyFacts),
    execution: execution(profile, { equivalence: options.equivalence ?? (options.tolerance ? 'tolerance-equivalent' : (options.value === 'proof' ? 'proof-certified' : 'exact')), random: options.sensitive ? '16' : '0', work: options.resumable ? '16384' : '4096' }),
    lifecycle: lifecycle(profile), cleanup: cleanup(profile, { ...options, cache: cacheSelected }),
    ports: ports(profile, cacheSelected, options.resumable, options.sensitive ? '16' : '0'), resources: resources(profile, { artifact: options.artifact, mutable: options.mutable, workspace: options.workspace, resumable: options.resumable, cache: cacheSelected, randomness: options.sensitive }),
    statuses: statuses(), reuse: reuse(profile, artifacts, state, cacheSelected),
    diagnostics: { authority: 'non-authoritative', maxRecords: '256', maxBytes: '32768', overflow: 'count', rawAddresses: false, payloadRedaction: 'default-redacted' },
    compatibility: { domainIdentityRequired: true, graphIdentityRequired: true, policyContractRequired: true, persistence: { kind: 'none' } },
    programContribution: {
      kind: 'device-program', language: 'restricted-device-js', sourceIdentity: contentIdentity(`${profile}:restricted-device-js-source`),
      inputs: [profileReference(domainResult, domainSchemaSha), profileReference(graphResult, graphSchemaSha)],
      provenance: { origin: 'first-party', revision: REVISION, license: 'Apache-2.0', review: schemaReference(`cuda-mcgs.synthetic-${profile}-program-security-review`) },
    },
    productData: [],
  };
}

export function buildEvaluatorProfiles(inspected, domainResults, graphResults, domainSchemaSha, graphSchemaSha) {
  return [
    { input: buildProfile('synthetic-vector-combined', inspected, domainResults[1], graphResults[1], domainSchemaSha, graphSchemaSha, { proposal: true, value: 'vector', history: true, root: true, artifact: true, workspace: true, cache: true, maximumItems: '8', tolerance: true }), domain: domainResults[1], graph: graphResults[1] },
    { input: buildProfile('synthetic-proposal-only-stateless', inspected, domainResults[2], graphResults[3], domainSchemaSha, graphSchemaSha, { proposal: true, value: null, maximumItems: '1' }), domain: domainResults[2], graph: graphResults[3] },
    { input: buildProfile('synthetic-proof-evaluation-only', inspected, domainResults[2], graphResults[2], domainSchemaSha, graphSchemaSha, { proposal: false, value: 'proof', artifact: true, artifactKind: 'table', workspace: true, maximumItems: '1' }), domain: domainResults[2], graph: graphResults[2] },
    { input: buildProfile('synthetic-analytic-evaluation-only', inspected, domainResults[0], graphResults[0], domainSchemaSha, graphSchemaSha, { proposal: false, value: 'scalar', maximumItems: '1' }), domain: domainResults[0], graph: graphResults[0] },
    { input: buildProfile('synthetic-batch-sensitive-resumable', inspected, domainResults[1], graphResults[1], domainSchemaSha, graphSchemaSha, { proposal: false, value: 'distribution', history: true, root: true, artifact: true, mutable: true, workspace: true, sensitive: true, resumable: true, maximumItems: '4', equivalence: 'stochastic-distributional' }), domain: domainResults[1], graph: graphResults[1] },
  ];
}

export function evaluatorSyntheticSchemaReference(id) {
  return schemaReference(id);
}

export function evaluatorSyntheticContentIdentity(label) {
  return contentIdentity(label);
}
