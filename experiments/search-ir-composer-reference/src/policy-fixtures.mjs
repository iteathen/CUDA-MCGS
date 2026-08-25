import { createHash } from 'node:crypto';

const VERSION = '0.1.0';
const REVISION = '8422f10894bdd5a4a352bb49e4e1d8427d975b5f';
const BASE_PORTS = ['classify-policy-reuse', 'classify-role-handler', 'decide-action-admission', 'evaluate-policy-stop', 'initialize-policy-records', 'select-next'];

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

function profileReference(id) {
  return { id, schema: schemaReference(`cuda-mcgs.${id}-profile`), identity: contentIdentity(`${id}:profile`) };
}

function catalogContract(inspected) {
  const contract = inspected.contractSet.contracts.find(({ id }) => id === 'SPEC-0008');
  return { kind: 'catalog', id: contract.id, specificationIdentity: contract.specificationIdentity, sha256: contract.sha256 };
}

function domainReference(domainResult, domainSchemaSha) {
  const ports = new Map(domainResult.normalized.ports.map(({ id, contract }) => [id, contract]));
  return {
    id: domainResult.normalized.id,
    schema: { id: domainResult.normalized.schema, version: '0.2.0', sha256: domainSchemaSha },
    identity: identityReference(domainResult.identity),
    classifyRolePort: ports.get('classify-role'),
    produceActionsPort: ports.get('produce-actions'),
    terminalOutcomePort: ports.get('terminal-outcome'),
    classifyPathRelationPort: ports.get('classify-path-relation'),
  };
}

function graphReference(graphResult, graphSchemaSha) {
  const result = {
    id: graphResult.normalized.id,
    schema: { id: graphResult.normalized.schema, version: '0.2.0', sha256: graphSchemaSha },
    identity: identityReference(graphResult.identity),
    mode: graphResult.normalized.mode,
  };
  if (result.mode === 'materialized') {
    const ports = new Map(graphResult.normalized.ports.map(({ id, contract }) => [id, contract]));
    result.reserveEdgePort = ports.get('reserve-edge');
    result.readPathViewPort = ports.get('read-path-view');
    result.validateReferencePort = ports.get('validate-reference');
  }
  return result;
}

function bounds(random = '0', work = '128') {
  return { maxWorkUnits: work, maxReads: '64', maxWrites: '32', maxRandomInputs: random, cancellationObservationWorkUnits: '16' };
}

function numeric(profile, representation = 'integer', storageBits = '64', accumulationBits = '64') {
  return {
    kind: 'finite-numeric', representation, storageBits, accumulationBits,
    range: schemaReference(`cuda-mcgs.synthetic-${profile}-numeric-range`),
    precision: schemaReference(`cuda-mcgs.synthetic-${profile}-numeric-precision`),
    rounding: representation === 'floating' ? 'nearest-even' : 'exact',
    nonfinite: representation === 'floating' ? 'reject' : 'not-representable', overflow: 'typed-stop',
    order: 'associative-commutative',
  };
}

function roleHandlers(domainResult, graphMode) {
  return domainResult.normalized.roles.map(({ id: role, category, terminal }) => {
    let selectionMode = 'custom';
    if (terminal) selectionMode = 'terminal';
    else if (category === 'decision') selectionMode = 'compare';
    else if (category === 'chance') selectionMode = 'sample';
    else if (category === 'automatic') selectionMode = 'enumerate';
    else if (category === 'observation') selectionMode = 'forward';
    return {
      role, category,
      candidateSources: terminal ? ['none'] : (graphMode === 'materialized' ? ['action-source', 'ready-edge'] : ['action-source']),
      readiness: terminal ? 'terminal' : 'required', selectionMode,
      noActionOutcome: terminal ? 'policy-budget-satisfied' : 'no-eligible-candidate', failure: 'unsupported-domain-role',
    };
  });
}

function storage(profile, objectRole, sizeBytes = '64') {
  return {
    objectRole, sizeBytes, alignmentBytes: '8',
    layout: schemaReference(`cuda-mcgs.synthetic-${profile}-${objectRole}-policy-layout`),
    lifecycle: schemaReference(`cuda-mcgs.synthetic-${profile}-${objectRole}-policy-lifecycle`),
  };
}

function record(profile, id, scope, semanticKind, objectRole, { resultVisible = false, numericRule = { kind: 'none' } } = {}) {
  return {
    id: `policy.${profile}.record-${id}`, scope, semanticKind, unit: `policy.${profile}.unit-${id}`,
    schema: schemaReference(`cuda-mcgs.synthetic-${profile}-record-${id}`), storage: storage(profile, objectRole),
    initialization: schemaReference(`cuda-mcgs.synthetic-${profile}-initialize-${id}`),
    operations: [`policy.${profile}.operation-${id}`], numeric: numericRule,
    visibility: semanticKind === 'statistic' || semanticKind === 'proof' ? 'atomic-reduction' : 'release-acquire', resultVisible,
  };
}

function records(profile, { graphMode = 'materialized', reservation = true, backup = true, proof = false } = {}) {
  const edgeStorage = graphMode === 'materialized' ? 'parent-edge' : 'separate-policy-arena';
  const result = [record(profile, 'budget', 'global', 'budget', 'separate-policy-arena', { numericRule: numeric(profile) })];
  if (backup) result.push(record(profile, proof ? 'proof' : 'completed-statistic', 'edge', proof ? 'proof' : 'statistic', edgeStorage, { resultVisible: true, numericRule: proof ? numeric(profile, 'custom', '8', '8') : numeric(profile, 'floating', '32', '64') }));
  if (reservation) result.push(record(profile, 'reservation', 'work', 'reservation', 'separate-policy-arena', { numericRule: numeric(profile) }));
  if (backup) result.push(record(profile, 'backup-transaction', 'work', 'transaction', 'separate-policy-arena'));
  return result;
}

function selection(profile, { stochastic = false, evaluatorFacts = false, graphMode = 'materialized' } = {}) {
  return {
    inputs: ['domain-role', 'policy-records', 'resource-facts', 'stop-facts', ...(evaluatorFacts ? ['evaluator-facts'] : []), ...(graphMode === 'materialized' ? ['ready-edges'] : [])],
    eligibility: schemaReference(`cuda-mcgs.synthetic-${profile}-selection-eligibility`),
    comparison: { kind: 'custom', semantics: schemaReference(`cuda-mcgs.synthetic-${profile}-selection-comparison`) },
    tie: stochastic ? 'explicit-random' : 'canonical', determinism: stochastic ? 'explicit-stochastic' : 'deterministic',
    randomness: stochastic ? { kind: 'explicit-input', maxInputs: '8', semantics: schemaReference(`cuda-mcgs.synthetic-${profile}-selection-randomness`) } : { kind: 'none', maxInputs: '0' },
    maxCandidates: '4096', bounds: bounds(stochastic ? '8' : '0'),
    noSelectionOutcomes: ['cancelled', 'no-eligible-candidate', 'policy-budget-satisfied', 'required-input-unavailable'],
  };
}

function reservation(profile, selected) {
  if (!selected) return { kind: 'none' };
  return {
    kind: 'bounded', identity: schemaReference(`cuda-mcgs.synthetic-${profile}-reservation-identity`), scopes: ['edge', 'work'],
    unit: `policy.${profile}.unit-reservation`, magnitude: schemaReference(`cuda-mcgs.synthetic-${profile}-reservation-magnitude`),
    maxActive: '4096', visibleEffect: schemaReference(`cuda-mcgs.synthetic-${profile}-reservation-effect`),
    lifecycle: schemaReference(`cuda-mcgs.synthetic-${profile}-reservation-lifecycle`),
    accounting: schemaReference(`cuda-mcgs.synthetic-${profile}-reservation-accounting`), generationExhaustion: 'policy-generation-exhausted',
  };
}

function candidateSource(profile, domainResult, kind, evaluatorProfile = null, random = '0', graphMode = 'materialized') {
  const source = kind === 'intrinsic-domain'
    ? domainResult.normalized.ports.find(({ id }) => id === 'produce-actions').contract
    : schemaReference(`cuda-mcgs.synthetic-${profile}-${kind}-source`);
  return {
    id: `policy.${profile}.source-${kind}`, kind, source,
    producerProfile: kind === 'intrinsic-domain' ? { kind: 'none' } : evaluatorProfile,
    readiness: kind === 'intrinsic-domain' ? 'required' : 'optional', fallback: kind === 'intrinsic-domain' ? 'pending' : 'skip-source',
    maxCandidates: '4096', maxBytes: '262144', maxRandomInputs: random,
    multiplicity: random === '0' ? 'unique' : 'repeatable-sample',
    edgeAdmissionIdentity: graphMode === 'materialized' ? schemaReference(`cuda-mcgs.synthetic-${profile}-${kind}-edge-admission`) : { kind: 'none' },
  };
}

function admission(profile, domainResult, { mode = 'progressive', evaluatorProposal = false, evaluatorProfile = null, intrinsic = true, random = '0', graphMode = 'materialized' } = {}) {
  const sources = [];
  if (intrinsic) sources.push(candidateSource(profile, domainResult, 'intrinsic-domain', null, random, graphMode));
  if (evaluatorProposal) sources.push(candidateSource(profile, domainResult, 'evaluator-proposal', evaluatorProfile, random, graphMode));
  return {
    mode: sources.length === 0 ? 'none' : mode, sources,
    threshold: schemaReference(`cuda-mcgs.synthetic-${profile}-admission-threshold`), pressure: 'required-input-unavailable',
    bounds: bounds(random, '256'),
  };
}

function valueAdapter(profile, domainResult, kind, evaluatorProfile = null) {
  const source = kind === 'terminal-domain'
    ? domainResult.normalized.ports.find(({ id }) => id === 'terminal-outcome').contract
    : schemaReference(`cuda-mcgs.synthetic-${profile}-${kind}-value-source`);
  return {
    id: `policy.${profile}.value-adapter-${kind}`, kind, sourceProfile: kind === 'terminal-domain' ? { kind: 'none' } : evaluatorProfile,
    source, readiness: 'required', fallback: 'pending',
    conversion: schemaReference(`cuda-mcgs.synthetic-${profile}-${kind}-conversion`),
    perspective: schemaReference(`cuda-mcgs.synthetic-${profile}-${kind}-perspective`),
  };
}

function value(profile, domainResult, { family = 'scalar', evaluatorValue = false, evaluatorProfile = null, none = false, vector = false, proof = false } = {}) {
  if (none) return { kind: 'none' };
  const coordinates = vector
    ? ['objective-a', 'objective-b', 'objective-c'].map((id) => ({ id: `policy.${profile}.coordinate-${id}`, unit: `policy.${profile}.unit-${id}`, perspective: 'objective-indexed', transform: schemaReference(`cuda-mcgs.synthetic-${profile}-${id}-transform`) }))
    : [{ id: `policy.${profile}.coordinate-primary`, unit: `policy.${profile}.unit-primary`, perspective: proof ? 'global' : 'role-relative', transform: schemaReference(`cuda-mcgs.synthetic-${profile}-primary-transform`) }];
  return {
    kind: 'algebra', schema: schemaReference(`cuda-mcgs.synthetic-${profile}-value`), family, coordinates,
    numeric: proof ? numeric(profile, 'custom', '8', '8') : numeric(profile, vector ? 'fixed' : 'floating', '32', '64'),
    comparison: { kind: proof ? 'partial-order' : 'custom', semantics: schemaReference(`cuda-mcgs.synthetic-${profile}-value-comparison`) },
    invalid: schemaReference(`cuda-mcgs.synthetic-${profile}-invalid-value`), combine: schemaReference(`cuda-mcgs.synthetic-${profile}-combine-values`),
    adapters: [valueAdapter(profile, domainResult, 'terminal-domain'), ...(evaluatorValue ? [valueAdapter(profile, domainResult, 'evaluator', evaluatorProfile)] : [])],
  };
}

function cycle(profile, domainResult, hasValue, graphMode) {
  if (graphMode === 'stateless') return { kind: 'none' };
  return {
    kind: 'bounded',
    domainRelationPort: domainResult.normalized.ports.find(({ id }) => id === 'classify-path-relation').contract,
    identityBeforeRelation: true,
    partitions: [
      { id: `policy.${profile}.cycle-novel`, relations: schemaReference(`cuda-mcgs.synthetic-${profile}-relations-novel`), response: 'continue', contribution: { kind: 'none' } },
      { id: `policy.${profile}.cycle-repeat`, relations: schemaReference(`cuda-mcgs.synthetic-${profile}-relations-repeat`), response: hasValue ? 'transform' : 'abandon', contribution: hasValue ? schemaReference(`cuda-mcgs.synthetic-${profile}-cycle-contribution`) : { kind: 'none' } },
    ],
    coverage: contentIdentity(`${profile}:cycle-partition-coverage`), pressureDistinct: true,
  };
}

function backup(profile, selected, target, { ordered = false, proof = false } = {}) {
  if (!selected) return { kind: 'none' };
  return {
    kind: 'transactional', transaction: schemaReference(`cuda-mcgs.synthetic-${profile}-backup-transaction`), direction: 'leaf-to-root',
    targets: [target], perspectiveTransform: schemaReference(`cuda-mcgs.synthetic-${profile}-backup-perspective`),
    update: schemaReference(`cuda-mcgs.synthetic-${profile}-backup-update`), algebra: proof ? 'lattice' : (ordered ? 'ordered-noncommutative' : 'associative-commutative'),
    concurrencyOrder: ordered ? 'deterministic-sequence' : 'order-insensitive',
    sequence: ordered ? schemaReference(`cuda-mcgs.synthetic-${profile}-backup-sequence`) : { kind: 'none' },
    idempotence: 'transaction-occurrence-owner-field', prefixVisibility: ordered ? 'allowed' : 'atomic-commit',
    commit: schemaReference(`cuda-mcgs.synthetic-${profile}-backup-commit`), mustDrain: 'after-first-result-visible-update',
    completedPublication: schemaReference(`cuda-mcgs.synthetic-${profile}-completed-publication`), staleEpoch: 'reject-before-mutation',
    arithmetic: proof ? numeric(profile, 'custom', '8', '8') : numeric(profile, 'floating', '32', '64'),
    maxSteps: '4096', maxScratchBytes: '65536',
  };
}

function stop(profile) {
  return {
    budgets: [{
      id: `policy.${profile}.budget-completed`, unit: `policy.${profile}.unit-completed`, scope: 'root-epoch', initial: '0', limit: '18446744073709551615',
      increment: schemaReference(`cuda-mcgs.synthetic-${profile}-budget-increment`), widthBits: '64', precision: schemaReference(`cuda-mcgs.synthetic-${profile}-budget-precision`),
      comparison: schemaReference(`cuda-mcgs.synthetic-${profile}-budget-comparison`), satisfaction: schemaReference(`cuda-mcgs.synthetic-${profile}-budget-satisfaction`),
      exhaustion: 'policy-budget-counter-exhausted', monotonicity: 'monotone',
    }],
    causePriority: ['policy-budget-satisfied', 'cancelled', 'policy-internal-failure'], lifecycle: schemaReference(`cuda-mcgs.synthetic-${profile}-stop-lifecycle`),
    maxOvershoot: '256', drain: schemaReference(`cuda-mcgs.synthetic-${profile}-stop-drain`), partialEligibility: schemaReference(`cuda-mcgs.synthetic-${profile}-partial-eligibility`),
    externalControl: 'none',
  };
}

function reuse(profile, profileRecords) {
  return profileRecords.map(({ id, scope }) => ({
    record: id, disposition: scope === 'global' ? 'retain' : (scope === 'edge' ? 'retain-if-key-valid' : 'reset'),
    condition: schemaReference(`cuda-mcgs.synthetic-${profile}-${scope}-reuse-condition`), ordering: schemaReference(`cuda-mcgs.synthetic-${profile}-${scope}-reuse-ordering`),
    lifecycle: schemaReference(`cuda-mcgs.synthetic-${profile}-${scope}-reuse-lifecycle`),
  }));
}

function statuses() {
  const classes = {
    'backup-target-stale': 'recoverable', cancelled: 'cancellation', 'duplicate-backup': 'fatal', 'invalid-action-candidate': 'recoverable',
    'invalid-policy-profile': 'fatal', 'invalid-policy-record': 'fatal', 'invalid-value': 'fatal', 'no-eligible-candidate': 'normal',
    'partial-backup-fatal': 'fatal', 'policy-budget-counter-exhausted': 'fatal', 'policy-budget-satisfied': 'stop',
    'policy-generation-exhausted': 'fatal', 'policy-internal-failure': 'fatal', 'required-input-unavailable': 'pending',
    'reservation-capacity': 'recoverable', 'reservation-imbalance': 'fatal', 'statistics-overflow': 'fatal',
    'unsupported-cycle-relation': 'fatal', 'unsupported-domain-role': 'fatal', 'value-schema-mismatch': 'fatal',
  };
  return Object.entries(classes).map(([code, statusClass]) => ({ code, class: statusClass, diagnostic: true }));
}

function port(profile, id, profileRecords, completion = 'bounded') {
  return {
    id, contract: schemaReference(`cuda-mcgs.synthetic-${profile}-port-${id}`), records: profileRecords.map(({ id: recordId }) => recordId),
    bounds: bounds('8'), completion, statuses: ['cancelled', 'policy-internal-failure', 'required-input-unavailable'],
  };
}

function ports(profile, profileRecords, { reservationSelected, backupSelected, valueSelected, evaluatorValue, cycleSelected }) {
  const result = BASE_PORTS.map((id) => port(profile, id, profileRecords));
  if (cycleSelected) result.push(port(profile, 'classify-path-response', profileRecords));
  if (reservationSelected) result.push(port(profile, 'reserve-in-flight', profileRecords), port(profile, 'release-in-flight', profileRecords));
  if (backupSelected) for (const id of ['prepare-backup', 'apply-backup-step', 'complete-backup', 'fail-backup']) result.push(port(profile, id, profileRecords, id === 'apply-backup-step' ? 'must-drain' : 'finite-resumable'));
  if (valueSelected) result.push(port(profile, 'map-terminal-outcome', profileRecords));
  if (evaluatorValue) result.push(port(profile, 'map-evaluator-output', profileRecords));
  return result;
}

function resources(profile, { reservationSelected, backupSelected, evaluatorMode }) {
  const result = [
    { id: `policy.${profile}.resource-record-bytes`, unit: 'bytes', minimum: '1', maximum: '1048576', alignment: '8', scope: 'per-engine', pressureStatus: 'policy-internal-failure' },
    { id: `policy.${profile}.resource-work`, unit: 'work-units', minimum: '1', maximum: '4096', alignment: '8', scope: 'per-worker', pressureStatus: 'required-input-unavailable' },
  ];
  if (reservationSelected) result.push({ id: `policy.${profile}.resource-reservations`, unit: 'records', minimum: '1', maximum: '4096', alignment: '8', scope: 'per-engine', pressureStatus: 'reservation-capacity' });
  if (backupSelected) result.push({ id: `policy.${profile}.resource-backup-transactions`, unit: 'transactions', minimum: '1', maximum: '4096', alignment: '8', scope: 'per-engine', pressureStatus: 'partial-backup-fatal' });
  if (evaluatorMode !== 'absent') result.push({ id: `policy.${profile}.resource-evaluator-adapters`, unit: 'records', minimum: '1', maximum: '4096', alignment: '8', scope: 'per-engine', pressureStatus: 'required-input-unavailable' });
  return result;
}

function buildProfile(profile, inspected, domainResult, graphResult, domainSchemaSha, graphSchemaSha, options) {
  const evaluatorProfile = options.evaluatorMode === 'absent' ? null : profileReference(`evaluator.synthetic-${profile}`);
  const reservationSelected = options.reservation !== false;
  const backupSelected = options.value !== 'none';
  const proof = options.value === 'proof';
  const vector = options.value === 'vector';
  const evaluatorValue = ['evaluation-only', 'combined'].includes(options.evaluatorMode);
  const evaluatorProposal = ['proposal-only', 'combined'].includes(options.evaluatorMode);
  const profileRecords = records(profile, { graphMode: graphResult.normalized.mode, reservation: reservationSelected, backup: backupSelected, proof });
  const valueInput = value(profile, domainResult, { family: proof ? 'proof-lattice' : (vector ? 'vector' : 'scalar'), evaluatorValue, evaluatorProfile, none: options.value === 'none', vector, proof });
  const target = profileRecords.find(({ resultVisible }) => resultVisible)?.id;
  const inputs = [
    { id: domainResult.normalized.id, schema: { id: domainResult.normalized.schema, version: '0.2.0', sha256: domainSchemaSha }, identity: identityReference(domainResult.identity) },
    { id: graphResult.normalized.id, schema: { id: graphResult.normalized.schema, version: '0.2.0', sha256: graphSchemaSha }, identity: identityReference(graphResult.identity) },
    ...(evaluatorProfile ? [evaluatorProfile] : []),
  ];
  return {
    schema: 'cuda-mcgs.policy-profile/0.2.0', representation: 'cuda-mcgs.search-ir/0.2.0', status: 'proposal-evidence', contract: catalogContract(inspected),
    id: `policy.${profile}`, version: VERSION,
    domainProfile: domainReference(domainResult, domainSchemaSha), graphProfile: graphReference(graphResult, graphSchemaSha), evaluatorMode: options.evaluatorMode,
    roleHandlers: roleHandlers(domainResult, graphResult.normalized.mode), records: profileRecords,
    selection: selection(profile, { stochastic: options.stochastic, evaluatorFacts: evaluatorValue, graphMode: graphResult.normalized.mode }), reservation: reservation(profile, reservationSelected),
    admission: admission(profile, domainResult, { mode: options.admissionMode, evaluatorProposal, evaluatorProfile, intrinsic: options.intrinsic !== false, random: options.stochastic ? '8' : '0', graphMode: graphResult.normalized.mode }),
    value: valueInput, cycle: cycle(profile, domainResult, options.value !== 'none', graphResult.normalized.mode),
    backup: backup(profile, backupSelected, target, { ordered: options.ordered, proof }), stop: stop(profile), reuse: reuse(profile, profileRecords),
    ports: ports(profile, profileRecords, { reservationSelected, backupSelected, valueSelected: options.value !== 'none', evaluatorValue, cycleSelected: graphResult.normalized.mode === 'materialized' }),
    resources: resources(profile, { reservationSelected, backupSelected, evaluatorMode: options.evaluatorMode }), statuses: statuses(),
    diagnostics: { authority: 'non-authoritative', maxRecords: '256', maxBytes: '32768', overflow: 'count', rawAddresses: false },
    compatibility: { domainIdentityRequired: true, graphIdentityRequired: true, persistence: { kind: 'none' } },
    programContribution: { kind: 'device-program', language: 'restricted-device-js', sourceIdentity: contentIdentity(`${profile}:restricted-device-js-source`), inputs, provenance: { origin: 'first-party', revision: REVISION, license: 'Apache-2.0' } },
    productData: [],
  };
}

export function buildPolicyProfiles(inspected, domainResults, graphResults, domainSchemaSha, graphSchemaSha) {
  return [
    { input: buildProfile('synthetic-scalar-absent', inspected, domainResults[0], graphResults[0], domainSchemaSha, graphSchemaSha, { evaluatorMode: 'absent', value: 'scalar', reservation: true, admissionMode: 'progressive' }), domain: domainResults[0], graph: graphResults[0] },
    { input: buildProfile('synthetic-vector-combined', inspected, domainResults[1], graphResults[1], domainSchemaSha, graphSchemaSha, { evaluatorMode: 'combined', value: 'vector', reservation: true, admissionMode: 'sampled', stochastic: true }), domain: domainResults[1], graph: graphResults[1] },
    { input: buildProfile('synthetic-proposal-only-stateless', inspected, domainResults[2], graphResults[3], domainSchemaSha, graphSchemaSha, { evaluatorMode: 'proposal-only', value: 'none', reservation: false, admissionMode: 'lazy', intrinsic: false }), domain: domainResults[2], graph: graphResults[3] },
    { input: buildProfile('synthetic-proof-evaluation-only', inspected, domainResults[2], graphResults[2], domainSchemaSha, graphSchemaSha, { evaluatorMode: 'evaluation-only', value: 'proof', reservation: false, admissionMode: 'lazy', ordered: true }), domain: domainResults[2], graph: graphResults[2] },
  ];
}

export function policySyntheticSchemaReference(id) {
  return schemaReference(id);
}

export function policySyntheticContentIdentity(label) {
  return contentIdentity(label);
}

export function policySyntheticProfileReference(id) {
  return profileReference(id);
}
