import { createHash } from 'node:crypto';

const REVISION = '05d4925b8241537d586d4e44672b4e23647bc297';
const VERSION = '0.1.0';
const VALUE_ROLES = [
  'action',
  'action-cursor',
  'action-key',
  'diagnostic',
  'history',
  'identity-key',
  'operation-status',
  'path-relation',
  'random-input',
  'role-key',
  'root-descriptor',
  'state',
  'terminal-outcome',
  'transition-input',
  'transition-metadata',
  'transition-output',
  'truth-value',
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

function catalogContract(catalogById, id) {
  const contract = catalogById.get(id);
  return {
    kind: 'catalog',
    id,
    specificationIdentity: contract.specificationIdentity,
    sha256: contract.sha256,
  };
}

function valueSchemas(profile, overrides = {}) {
  const defaults = {
    action: ['variable-record', '64', ['device-search']],
    'action-cursor': ['fixed-record', '16', ['device-search']],
    'action-key': ['fixed-record', '16', ['device-search']],
    diagnostic: ['variable-record', '128', ['device-publication', 'device-search']],
    history: ['unit', '0', ['device-search']],
    'identity-key': ['fixed-record', '16', ['device-search']],
    'operation-status': ['tagged-union', '16', ['device-search']],
    'path-relation': ['tagged-union', '16', ['device-search']],
    'random-input': ['unit', '0', ['device-search']],
    'role-key': ['fixed-record', '8', ['device-search']],
    'root-descriptor': ['variable-record', '512', ['device-search', 'host-admission']],
    state: ['variable-record', '256', ['device-search']],
    'terminal-outcome': ['tagged-union', '128', ['device-publication', 'device-search']],
    'transition-input': ['unit', '0', ['device-search']],
    'transition-metadata': ['unit', '0', ['device-search']],
    'transition-output': ['variable-record', '512', ['device-search']],
    'truth-value': ['scalar', '1', ['device-search']],
  };
  return VALUE_ROLES.map((semanticRole) => {
    const [family, maxEncodedBytes, memorySpaces] = overrides[semanticRole] ?? defaults[semanticRole];
    return {
      id: `domain.${profile}.value-${semanticRole}`,
      semanticRole,
      schema: schemaReference(`cuda-mcgs.synthetic-${profile}-${semanticRole}`),
      family,
      maxEncodedBytes,
      alignmentBytes: family === 'unit' ? '1' : '8',
      memorySpaces,
      decoding: ['state', 'action', 'history'].includes(semanticRole) ? 'profile-semantic-equivalence' : 'canonical-bytes',
    };
  });
}

function valueId(profile, role) {
  return `domain.${profile}.value-${role}`;
}

function bounds({ work = '64', reads = '16', writes = '16', random = '0', cancellation = '16' } = {}) {
  return {
    maxWorkUnits: work,
    maxReads: reads,
    maxWrites: writes,
    maxRandomInputs: random,
    cancellationObservationWorkUnits: cancellation,
  };
}

function noRandomness() {
  return { kind: 'none', maxInputs: '0' };
}

function explicitRandomness(profile, label, maxInputs = '4') {
  return { kind: 'explicit-input', maxInputs, semantics: schemaReference(`cuda-mcgs.synthetic-${profile}-${label}-randomness`) };
}

function port(profile, id, inputs, outputs, failures, options = {}) {
  return {
    id,
    contract: schemaReference(`cuda-mcgs.synthetic-${profile}-port-${id}`),
    inputs: inputs.map((role) => valueId(profile, role)),
    outputs: outputs.map((role) => valueId(profile, role)),
    failures,
    bounds: bounds(options.bounds),
    completion: options.resumable
      ? {
          kind: 'resumable',
          continuationValue: valueId(profile, 'action-cursor'),
          maxResumptions: options.maxResumptions ?? '64',
          partialPublication: 'forbidden',
        }
      : { kind: 'bounded' },
  };
}

function basePorts(profile, { history = false, intrinsic = true, random = '0' } = {}) {
  const result = [
    port(profile, 'action-key', ['state', 'history', 'action'], ['action-key', 'operation-status'], ['invalid-action-scope', 'domain-internal-failure']),
    port(profile, 'apply-transition', ['state', 'history', 'action', 'transition-input', 'random-input'], ['state', 'history', 'transition-output', 'transition-metadata', 'operation-status'], ['invalid-action-scope', 'capacity-required', 'cancelled', 'domain-internal-failure'], { bounds: { random } }),
    port(profile, 'classify-path-relation', ['state', 'history'], ['path-relation', 'operation-status'], ['invalid-state', 'domain-internal-failure']),
    port(profile, 'classify-role', ['state', 'history'], ['role-key', 'operation-status'], ['invalid-state', 'domain-internal-failure']),
    port(profile, 'equal-action', ['state', 'history', 'action'], ['truth-value', 'operation-status'], ['invalid-action-scope', 'domain-internal-failure']),
    port(profile, 'equal-state', ['state', 'history'], ['truth-value', 'operation-status'], ['invalid-state', 'domain-internal-failure']),
    port(profile, 'identity-key', ['state', 'history'], ['identity-key', 'operation-status'], ['invalid-state', 'domain-internal-failure']),
    port(profile, 'terminal-outcome', ['state', 'history'], ['terminal-outcome', 'operation-status'], ['invalid-state', 'unsupported-domain-case', 'domain-internal-failure']),
    port(profile, 'validate-action', ['state', 'history', 'action'], ['action', 'operation-status'], ['invalid-action-scope', 'incompatible-action-producer', 'domain-internal-failure']),
    port(profile, 'validate-root', ['root-descriptor'], ['state', 'history', 'role-key', 'operation-status'], ['invalid-root', 'invalid-state', 'capacity-required', 'domain-internal-failure']),
  ];
  if (history) {
    result.push(port(profile, 'advance-history', ['state', 'history', 'action', 'transition-metadata'], ['history', 'operation-status'], ['domain-history-exhausted', 'capacity-required', 'cancelled', 'domain-internal-failure'], { resumable: true }));
  }
  if (intrinsic) {
    result.push(port(profile, 'produce-actions', ['state', 'history', 'action-cursor', 'random-input'], ['action', 'action-cursor', 'operation-status'], ['invalid-cursor', 'capacity-required', 'cancelled', 'domain-internal-failure'], { resumable: true, bounds: { random } }));
  }
  return result;
}

function failures() {
  const kinds = {
    cancelled: 'cancellation',
    'capacity-required': 'capacity',
    'domain-history-exhausted': 'exhaustion',
    'domain-internal-failure': 'internal',
    'incompatible-action-producer': 'compatibility',
    'invalid-input': 'input',
    'invalid-action-scope': 'input',
    'invalid-cursor': 'input',
    'invalid-profile': 'input',
    'invalid-root': 'input',
    'invalid-state': 'input',
    'unsupported-domain-case': 'unsupported',
  };
  return Object.entries(kinds).map(([code, kind]) => ({ code, kind, diagnostic: true }));
}

function resources(profile, { history = '0', random = '0', actions = '64' } = {}) {
  return [
    { id: `domain.${profile}.resource-action-output`, unit: 'records', minimum: '1', maximum: actions, alignment: '8', memorySpaces: ['device-search'], scope: 'per-invocation', pressureOutcome: 'capacity-required' },
    { id: `domain.${profile}.resource-history`, unit: 'bytes', minimum: history === '0' ? '0' : '1', maximum: history, alignment: '8', memorySpaces: ['device-search'], scope: 'per-engine', pressureOutcome: 'domain-history-exhausted' },
    { id: `domain.${profile}.resource-random-input`, unit: 'random-inputs', minimum: '0', maximum: random, alignment: '8', memorySpaces: ['device-search'], scope: 'per-invocation', pressureOutcome: 'capacity-required' },
    { id: `domain.${profile}.resource-state`, unit: 'bytes', minimum: '1', maximum: '4096', alignment: '8', memorySpaces: ['device-search'], scope: 'per-engine', pressureOutcome: 'capacity-required' },
    { id: `domain.${profile}.resource-work-scratch`, unit: 'work-units', minimum: '1', maximum: '1024', alignment: '8', memorySpaces: ['device-search'], scope: 'per-worker', pressureOutcome: 'capacity-required' },
  ];
}

function common(profile, catalogById, overrides = {}) {
  return {
    schema: 'cuda-mcgs.domain-profile/0.2.0',
    representation: 'cuda-mcgs.search-ir/0.2.0',
    status: 'proposal-evidence',
    contract: catalogContract(catalogById, 'SPEC-0007'),
    id: `domain.${profile}`,
    version: VERSION,
    valueSchemas: valueSchemas(profile, overrides.valueSchemas),
    identity: overrides.identity,
    history: overrides.history,
    rootForms: [{
      id: `domain.${profile}.root-complete`,
      authority: overrides.rootAuthority ?? 'complete-state',
      schema: schemaReference(`cuda-mcgs.synthetic-${profile}-root`),
      valueSchema: valueId(profile, 'root-descriptor'),
    }],
    roles: overrides.roles,
    actionSources: overrides.actionSources,
    transitionModes: overrides.transitionModes,
    ports: overrides.ports,
    resources: overrides.resources,
    failures: failures(),
    diagnostics: { authority: 'non-authoritative', maxRecords: '64', maxBytes: '8192', overflow: 'count' },
    compatibility: {
      crossProfileEquality: 'false-unless-versioned-compatibility',
      persistence: { kind: 'none' },
      hostDeviceRepresentation: { kind: 'identical' },
    },
    programContribution: {
      language: 'restricted-device-js',
      sourceIdentity: contentIdentity(`${profile}:restricted-device-js-source`),
      inputs: [{
        id: `domain.${profile}.program-inputs`,
        schema: schemaReference(`cuda-mcgs.synthetic-${profile}-program-inputs`),
        identity: contentIdentity(`${profile}:program-inputs`),
      }],
      provenance: { origin: 'first-party', revision: REVISION, license: 'Apache-2.0' },
    },
    productData: [],
  };
}

function deterministicTransposing(catalogById) {
  const profile = 'synthetic-transposing';
  const sourceId = `domain.${profile}.source-paged`;
  const transitionId = `domain.${profile}.transition-deterministic`;
  const decisionRole = `domain.${profile}.role-decision`;
  const terminalRole = `domain.${profile}.role-terminal`;
  return common(profile, catalogById, {
    identity: {
      scope: 'engine-incarnation',
      keyValue: valueId(profile, 'identity-key'),
      stateEquality: 'semantic-port',
      actionEquality: 'semantic-port',
      actionScope: { kind: 'origin-state-view-and-production-incarnation' },
      collisionVerification: 'authoritative-equality-port',
      behaviorFacts: [`domain.${profile}.fact-state`, `domain.${profile}.fact-embedded-history`],
      readyPayloads: 'immutable',
    },
    history: {
      disposition: 'embedded',
      valueSchema: valueId(profile, 'history'),
      identityParticipation: 'embedded-state',
      finiteRule: { kind: 'none' },
      reuse: [
        { boundary: 'root-advance', disposition: 'valid' },
        { boundary: 'restart', disposition: 'invalid' },
        { boundary: 'persistence', disposition: 'invalid' },
      ],
    },
    actionSources: [{
      id: sourceId,
      kind: 'intrinsic',
      mode: 'paged',
      ordering: 'semantic',
      multiplicity: 'unique',
      cursorValue: valueId(profile, 'action-cursor'),
      candidateValue: valueId(profile, 'action'),
      maxActions: '16',
      bounds: bounds(),
      completion: 'finite-complete',
      randomness: noRandomness(),
      semantics: schemaReference(`cuda-mcgs.synthetic-${profile}-paged-actions`),
    }],
    transitionModes: [{
      id: transitionId,
      kind: 'deterministic',
      inputValue: valueId(profile, 'transition-input'),
      outputValue: valueId(profile, 'transition-output'),
      metadataValue: valueId(profile, 'transition-metadata'),
      randomness: noRandomness(),
      observation: 'none',
      numericRules: [],
      semantics: schemaReference(`cuda-mcgs.synthetic-${profile}-transition`),
    }],
    roles: [
      { id: decisionRole, category: 'decision', terminal: false, selectorAuthority: `domain.${profile}.authority-policy`, actionSources: [sourceId], transitionMode: transitionId, successorRoles: [decisionRole, terminalRole], zeroActionDisposition: `domain.${profile}.dead-end-outcome` },
      { id: terminalRole, category: 'terminal', terminal: true, terminalOutcomeValue: valueId(profile, 'terminal-outcome') },
    ],
    ports: basePorts(profile),
    resources: resources(profile),
  });
}

function stochasticHistory(catalogById) {
  const profile = 'synthetic-stochastic-history';
  const sampled = `domain.${profile}.source-sampled`;
  const admitted = `domain.${profile}.source-admitted`;
  const combined = `domain.${profile}.source-combined`;
  const stochastic = `domain.${profile}.transition-stochastic`;
  const observation = `domain.${profile}.transition-observation`;
  const chanceRole = `domain.${profile}.role-chance`;
  const observationRole = `domain.${profile}.role-observation`;
  const customRole = `domain.${profile}.role-custom`;
  const terminalRole = `domain.${profile}.role-terminal`;
  return common(profile, catalogById, {
    valueSchemas: {
      history: ['variable-record', '256', ['device-search']],
      'random-input': ['vector', '64', ['device-search']],
      'transition-input': ['tagged-union', '128', ['device-search']],
      'transition-metadata': ['variable-record', '256', ['device-search']],
    },
    identity: {
      scope: 'session-incarnation',
      keyValue: valueId(profile, 'identity-key'),
      stateEquality: 'semantic-port',
      actionEquality: 'semantic-port',
      actionScope: { kind: 'origin-state-view-and-production-incarnation' },
      collisionVerification: 'authoritative-equality-port',
      behaviorFacts: [`domain.${profile}.fact-state`, `domain.${profile}.fact-history`, `domain.${profile}.fact-observation`],
      readyPayloads: 'immutable',
    },
    history: {
      disposition: 'carried',
      valueSchema: valueId(profile, 'history'),
      identityParticipation: 'carried-history',
      finiteRule: { kind: 'exact-summary', bound: '256', exhaustion: 'domain-history-exhausted' },
      reuse: [
        { boundary: 'root-advance', disposition: 'resettable' },
        { boundary: 'restart', disposition: 'invalid' },
        { boundary: 'persistence', disposition: 'invalid' },
      ],
    },
    rootAuthority: 'external-environment',
    actionSources: [
      {
        id: sampled,
        kind: 'intrinsic',
        mode: 'sampled',
        ordering: 'non-semantic',
        multiplicity: 'repeatable-sample',
        cursorValue: valueId(profile, 'action-cursor'),
        candidateValue: valueId(profile, 'action'),
        maxActions: '8',
        bounds: bounds({ random: '4' }),
        completion: 'sample-bounded',
        randomness: explicitRandomness(profile, 'sampled-source'),
        semantics: schemaReference(`cuda-mcgs.synthetic-${profile}-sampled-actions`),
      },
      {
        id: admitted,
        kind: 'admitted-proposal',
        ordering: 'non-semantic',
        multiplicity: 'unique',
        candidateValue: valueId(profile, 'action'),
        producerContract: catalogContract(catalogById, 'SPEC-0009'),
        producerSchema: schemaReference(`cuda-mcgs.synthetic-${profile}-proposal-producer`),
        candidateAuthority: schemaReference(`cuda-mcgs.synthetic-${profile}-candidate-authority`),
      },
      {
        id: combined,
        kind: 'combined',
        members: [sampled, admitted],
        ordering: 'non-semantic',
        multiplicity: 'repeatable-sample',
        deduplication: 'preserve-multiplicity',
        completion: 'budget-bounded',
      },
    ],
    transitionModes: [
      {
        id: stochastic,
        kind: 'sampled-stochastic',
        inputValue: valueId(profile, 'transition-input'),
        outputValue: valueId(profile, 'transition-output'),
        metadataValue: valueId(profile, 'transition-metadata'),
        randomness: explicitRandomness(profile, 'stochastic-transition'),
        observation: 'none',
        numericRules: [schemaReference(`cuda-mcgs.synthetic-${profile}-probability-rules`)],
        semantics: schemaReference(`cuda-mcgs.synthetic-${profile}-stochastic-transition`),
      },
      {
        id: observation,
        kind: 'observation-bearing',
        inputValue: valueId(profile, 'transition-input'),
        outputValue: valueId(profile, 'transition-output'),
        metadataValue: valueId(profile, 'transition-metadata'),
        randomness: noRandomness(),
        observation: 'history-update',
        numericRules: [],
        semantics: schemaReference(`cuda-mcgs.synthetic-${profile}-observation-transition`),
      },
    ],
    roles: [
      { id: chanceRole, category: 'chance', terminal: false, selectorAuthority: `domain.${profile}.authority-chance`, actionSources: [sampled], transitionMode: stochastic, successorRoles: [chanceRole, observationRole, terminalRole], zeroActionDisposition: `domain.${profile}.invalid-zero-sample` },
      { id: observationRole, category: 'observation', terminal: false, selectorAuthority: `domain.${profile}.authority-environment-model`, actionSources: [admitted], transitionMode: observation, successorRoles: [customRole, terminalRole], zeroActionDisposition: `domain.${profile}.missing-observation` },
      { id: customRole, category: 'custom', terminal: false, selectorAuthority: `domain.${profile}.authority-composed`, actionSources: [combined], transitionMode: stochastic, successorRoles: [chanceRole, observationRole, terminalRole], zeroActionDisposition: `domain.${profile}.budget-exhausted` },
      { id: terminalRole, category: 'custom', terminal: true, terminalOutcomeValue: valueId(profile, 'terminal-outcome') },
    ],
    ports: basePorts(profile, { history: true, intrinsic: true, random: '4' }),
    resources: resources(profile, { history: '65536', random: '4096', actions: '256' }),
  });
}

function lazyContinuous(catalogById) {
  const profile = 'synthetic-lazy-continuous';
  const sourceId = `domain.${profile}.source-lazy`;
  const transitionId = `domain.${profile}.transition-deterministic`;
  const customRole = `domain.${profile}.role-continuous`;
  const terminalRole = `domain.${profile}.role-terminal`;
  return common(profile, catalogById, {
    valueSchemas: {
      action: ['vector', '1024', ['device-search']],
      'terminal-outcome': ['vector', '512', ['device-publication', 'device-search']],
    },
    identity: {
      scope: 'engine-incarnation',
      keyValue: valueId(profile, 'identity-key'),
      stateEquality: 'semantic-port',
      actionEquality: 'semantic-port',
      actionScope: { kind: 'origin-state-view-and-production-incarnation' },
      collisionVerification: 'authoritative-equality-port',
      behaviorFacts: [`domain.${profile}.fact-state`, `domain.${profile}.fact-horizon`],
      readyPayloads: 'immutable',
    },
    history: {
      disposition: 'none',
      valueSchema: valueId(profile, 'history'),
      identityParticipation: 'none',
      finiteRule: { kind: 'none' },
      reuse: [
        { boundary: 'root-advance', disposition: 'valid' },
        { boundary: 'restart', disposition: 'invalid' },
        { boundary: 'persistence', disposition: 'invalid' },
      ],
    },
    actionSources: [{
      id: sourceId,
      kind: 'intrinsic',
      mode: 'lazy',
      ordering: 'non-semantic',
      multiplicity: 'unique',
      cursorValue: valueId(profile, 'action-cursor'),
      candidateValue: valueId(profile, 'action'),
      maxActions: '32',
      bounds: bounds({ work: '256', reads: '32', writes: '32', cancellation: '32' }),
      completion: 'budget-bounded-open',
      randomness: noRandomness(),
      semantics: schemaReference(`cuda-mcgs.synthetic-${profile}-lazy-action-region`),
    }],
    transitionModes: [{
      id: transitionId,
      kind: 'deterministic',
      inputValue: valueId(profile, 'transition-input'),
      outputValue: valueId(profile, 'transition-output'),
      metadataValue: valueId(profile, 'transition-metadata'),
      randomness: noRandomness(),
      observation: 'none',
      numericRules: [schemaReference(`cuda-mcgs.synthetic-${profile}-continuous-numerics`)],
      semantics: schemaReference(`cuda-mcgs.synthetic-${profile}-transition`),
    }],
    roles: [
      { id: customRole, category: 'custom', terminal: false, selectorAuthority: `domain.${profile}.authority-domain-rule`, actionSources: [sourceId], transitionMode: transitionId, successorRoles: [customRole, terminalRole], zeroActionDisposition: `domain.${profile}.finite-domain-outcome` },
      { id: terminalRole, category: 'terminal', terminal: true, terminalOutcomeValue: valueId(profile, 'terminal-outcome') },
    ],
    ports: basePorts(profile),
    resources: resources(profile, { actions: '4096' }),
  });
}

export function buildDomainProfiles(inspectedCatalog) {
  const catalogById = new Map(inspectedCatalog.contractSet.contracts.map((contract) => [contract.id, contract]));
  return [deterministicTransposing(catalogById), stochasticHistory(catalogById), lazyContinuous(catalogById)];
}

export function syntheticSchemaReference(id) {
  return schemaReference(id);
}

export function syntheticContentIdentity(label) {
  return contentIdentity(label);
}
