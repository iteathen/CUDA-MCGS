import { createHash } from 'node:crypto';

const VERSION = '0.1.0';
const REVISION = 'f48f20cbacea6404362b5186dd1fdd116f241a98';
const CHANNEL_REVISION = 'b7d3141738f5586efb1e86014925ee849251e673';
const LIFECYCLE_STATES = ['profile-normalized', 'resources-admitted', 'composed', 'active', 'draining', 'terminal', 'released'];
const BASE_CLEANUP_KINDS = ['stage-item', 'surface-context', 'capability-contribution', 'permission', 'counter', 'source-owner-lease', 'diagnostic', 'program-artifact'];

function sha256(label) { return createHash('sha256').update(label, 'utf8').digest('hex'); }
function schemaReference(id) { return { id: `${id}/${VERSION}`, version: VERSION, sha256: sha256(`schema:${id}/${VERSION}`) }; }
function contentIdentity(label) { return { algorithm: 'sha256', sha256: sha256(`content:${label}`) }; }
function identityReference(identity) { return { algorithm: identity.algorithm, sha256: identity.sha256 }; }
function schemaKey(reference) { return `${reference.id}\0${reference.version}\0${reference.sha256}`; }

function catalogContract(inspected, id) {
  const contract = inspected.contractSet.contracts.find((entry) => entry.id === id);
  return { kind: 'catalog', id: contract.id, specificationIdentity: contract.specificationIdentity, sha256: contract.sha256 };
}

function namespacedContract(id) {
  return { kind: 'namespaced', id, version: VERSION, schema: `cuda-mcgs.${id.replaceAll('.', '-')}-contract/${VERSION}`, sha256: sha256(`contract:${id}`) };
}

function profileReference(result) {
  return { id: result.normalized.id, schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha }, identity: identityReference(result.identity) };
}

function profileKey(profile) { return `${profile.id}\0${schemaKey(profile.schema)}\0${profile.identity.sha256}`; }

function bounds(options = {}) {
  return {
    maxItems: options.maxItems ?? '4096', maxTransitions: options.maxTransitions ?? '65536', maxWorkUnits: options.maxWorkUnits ?? '512',
    maxReads: options.maxReads ?? '128', maxWrites: options.maxWrites ?? '64', maxScratchBytes: options.maxScratchBytes ?? '4096',
    maxPublications: options.maxPublications ?? '64', cancellationObservationWorkUnits: options.cancellationObservationWorkUnits ?? '16',
  };
}

function statusVocabulary() {
  const classes = {
    'extension-work-complete': 'normal', 'extension-pending': 'pending', 'extension-pressure': 'pressure',
    'extension-cancelled': 'cancellation', 'extension-stale': 'stop', 'extension-failed': 'fatal',
  };
  return Object.entries(classes).map(([code, statusClass]) => ({ code, class: statusClass, diagnostic: true }));
}

function counter(profile, kind) {
  return { id: `extension-counter.${profile}.${kind}`, kind, maximum: '340282366920938463463374607431768211455', reserved: '0', exhaustionThreshold: '340282366920938463463374607431768211455', rollover: 'prohibited', exhaustionOutcome: 'extension-stale', staleAliasProhibited: true };
}

function permission(profile, token, surface, capability, sourceOwner, sourcePort, access = 'read') {
  return { id: `extension-permission.${profile}.${token}`, surface, capability, sourceOwner, sourcePort, access, scope: 'invocation', lifetime: 'checkpoint', maximumUses: '64' };
}

function contextField(profile, token, sourceOwner, sourcePort, access = 'read') {
  return {
    id: `extension-context.${profile}.${token}`, sourceOwner, sourcePort, schema: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-context`), access,
    immutable: access === 'read', lifetime: 'checkpoint', generation: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-generation`),
    offsetBytes: '0', sizeBytes: '32', alignment: '16', alias: 'none',
  };
}

function stageOutcome(profile, stageToken, code, kind, target, sourceOwner) {
  return { code, kind, target, sourceOwner, publication: schemaReference(`cuda-mcgs.synthetic-${profile}-${stageToken}-${code}-publication`), workerReleased: true, mutableLeaseReleased: true };
}

function stage(profile, token, workClass, stageClasses, counters, entryOwner, options = {}) {
  const id = `extension-stage.${profile}.${token}`;
  const outcomes = [
    stageOutcome(profile, token, 'extension-work-complete', options.target ? 'transition' : 'terminal', options.target ?? null, options.stageOwner),
    stageOutcome(profile, token, 'extension-pending', 'pending', id, options.progressOwner),
    stageOutcome(profile, token, 'extension-pressure', 'pressure', null, options.resourceOwner),
    stageOutcome(profile, token, 'extension-cancelled', 'cancellation', null, options.progressOwner),
    stageOutcome(profile, token, 'extension-stale', 'terminal', null, options.stageOwner),
    stageOutcome(profile, token, 'extension-failed', 'failure', null, options.stageOwner),
  ];
  return {
    id, version: VERSION, purpose: options.purpose, invariant: options.invariant,
    workItem: { kind: `extension-work.${profile}.${token}`, identity: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-work-item`), generationCounter: counters.find(({ kind }) => kind === 'work-item-generation').id, scope: 'root-epoch' },
    transitionCounter: counters.find(({ kind }) => kind === 'stage-transition').id,
    entry: { predicate: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-entry-predicate`), sourceOwner: entryOwner, publication: options.entryPublication, workClass },
    execution: { scope: 'per-work-item', globalBarrier: false, kernelPerStage: false, physicalTopology: 'unspecified' }, outcomes,
    checkpoints: options.checkpoints ?? ['entry', 'exit'], resourceClasses: stageClasses, bounds: bounds(),
    cancellation: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-cancellation`), failure: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-failure`), cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-cleanup`),
  };
}

function surface(profile, token, stageId, checkpoint, baseContext, permissions) {
  return {
    id: `extension-surface.${profile}.${token}`, version: VERSION, stage: stageId, checkpoint, purpose: `stable ${token} extension checkpoint`,
    invocation: { scope: 'work-item', cardinality: '1' }, baseContext, permissions, ordering: 'deterministic-selected-order',
    publication: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-surface-publication`), bounds: bounds({ maxItems: '1', maxTransitions: '1' }),
    outcomes: ['extension-work-complete', 'extension-pending', 'extension-pressure', 'extension-cancelled', 'extension-failed'],
    failure: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-surface-failure`), skip: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-surface-skip`), cancellation: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-surface-cancellation`),
    hostProgress: 'none', midStage: false, cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-surface-cleanup`),
  };
}

function contribution(profile, token, kind, resourceClass, sizeBytes) {
  return { id: `extension-contribution.${profile}.${token}`, kind, schema: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-contribution`), identity: contentIdentity(`${profile}:${token}:contribution`), resourceClass, sizeBytes, alignment: '16', lifetime: kind === 'configuration' ? 'engine' : 'work-item', generation: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-contribution-generation`), cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-contribution-cleanup`) };
}

function effect(profile, token, owner, port, kind, order, commutes) {
  return { id: `extension-effect.${profile}.${token}`, owner, port, kind, order, commutes };
}

function capability(profile, token, ownerContract, semanticOwner, invocationCounter, bindings, requiredFacts, permissions, contributions, effects, options = {}) {
  return {
    id: `extension-capability.${profile}.${token}`, version: VERSION, ownerContract: namespacedContract(ownerContract), semanticOwner, invocationCounter,
    bindings, requiredFacts, permissions, contributions, effects, before: options.before ?? [], after: options.after ?? [], channels: [],
    activation: { kind: 'always', rule: null, newResources: false }, bounds: bounds(),
    outcomes: ['extension-work-complete', 'extension-pending', 'extension-pressure', 'extension-cancelled', 'extension-failed'],
    cancellation: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-capability-cancellation`), failure: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-capability-failure`), deletion: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-capability-deletion`),
    sourceIdentity: contentIdentity(`${profile}:${token}:restricted-device-js-source`), requirements: [schemaReference('cuda-js.device-js'), schemaReference('cuda-js.operation-lifecycle')],
    provenance: { origin: 'first-party', trust: 'first-party-reviewed', revision: REVISION, license: 'Apache-2.0', review: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-capability-security-review`) },
  };
}

function buildProfile(profile, inspected, resourceResult, progressResult, knownProfiles, options = {}) {
  const resource = resourceResult.normalized; const progress = progressResult.normalized;
  const stageOwner = progress.contributors.find(({ contract }) => contract.id === 'SPEC-0003');
  const domainOwner = progress.contributors.find(({ contract }) => contract.id === 'SPEC-0007');
  const graphOwner = progress.contributors.find(({ contract }) => contract.id === 'SPEC-0010');
  const policyOwner = progress.contributors.find(({ contract }) => contract.id === 'SPEC-0008');
  const resourceOwner = progress.contributors.find(({ contract }) => contract.id === 'SPEC-0011');
  const progressOwner = progress.contributors.find(({ contract }) => contract.id === 'SPEC-0012');
  const stageWork = progress.workClasses.find(({ owner }) => owner === stageOwner.id);
  const stageClasses = resource.classes.filter(({ contributor }) => contributor === stageOwner.id).map(({ id }) => id);
  const contextClass = stageClasses.find((id) => id.endsWith('class-stage-context'));
  const counters = ['work-item-generation', 'stage-transition', 'capability-invocation'].map((kind) => counter(profile, kind));
  const knownByProfile = new Map(knownProfiles.map((result) => [profileKey(profileReference(result)), result.normalized]));
  const selectedDomain = knownByProfile.get(profileKey(domainOwner.profile)); const selectedGraph = knownByProfile.get(profileKey(graphOwner.profile)); const selectedPolicy = knownByProfile.get(profileKey(policyOwner.profile));
  const domainPortFor = (id) => selectedDomain.ports.find((entry) => entry.id === id).contract;
  const graphPortFor = (id) => selectedGraph.ports.find((entry) => entry.id === id).contract;
  const policyPortFor = (id) => selectedPolicy.ports.find((entry) => entry.id === id).contract;
  let stages; let surfaces; let capabilities; let permissions;

  if (options.proof) {
    const proofStage = stage(profile, 'proof-step', stageWork.id, stageClasses, counters, graphOwner.id, { stageOwner: stageOwner.id, progressOwner: progressOwner.id, resourceOwner: resourceOwner.id, entryPublication: graphPortFor('read-path-view'), purpose: 'advance one bounded proof-search operational item', invariant: 'proof inputs are stable before capability observation' });
    const proofSurfaceId = `extension-surface.${profile}.proof-entry`;
    const proofCapabilityId = `extension-capability.${profile}.proof-budget`;
    const proofPort = domainPortFor('classify-role');
    const proofPermission = permission(profile, 'proof-domain-read', proofSurfaceId, proofCapabilityId, domainOwner.id, proofPort);
    const proofContext = contextField(profile, 'proof-domain-fact', domainOwner.id, proofPort);
    stages = [proofStage]; permissions = [proofPermission]; surfaces = [surface(profile, 'proof-entry', proofStage.id, 'entry', [proofContext], [proofPermission.id])];
    capabilities = [capability(profile, 'proof-budget', 'capability.synthetic-proof-budget', domainOwner.id, counters.find(({ kind }) => kind === 'capability-invocation').id, [proofSurfaceId], [proofContext.id], [proofPermission.id], [contribution(profile, 'proof-workspace', 'workspace', contextClass, '2048')], [effect(profile, 'proof-observe', domainOwner.id, proofPort, 'observe', '0', true)])];
  } else {
    const prepareId = `extension-stage.${profile}.prepare-candidate`;
    const commitId = `extension-stage.${profile}.commit-candidate`;
    const prepare = stage(profile, 'prepare-candidate', stageWork.id, stageClasses, counters, policyOwner.id, { stageOwner: stageOwner.id, progressOwner: progressOwner.id, resourceOwner: resourceOwner.id, entryPublication: policyPortFor('select-next'), target: commitId, purpose: 'prepare one stable candidate-selection operational item', invariant: 'candidate inputs are stable before selected capabilities run' });
    const commit = stage(profile, 'commit-candidate', stageWork.id, stageClasses, counters, graphOwner.id, { stageOwner: stageOwner.id, progressOwner: progressOwner.id, resourceOwner: resourceOwner.id, entryPublication: graphPortFor('read-path-view'), purpose: 'commit one candidate-selection operational disposition', invariant: 'selected capability effects are complete before transition publication' });
    const entrySurfaceId = `extension-surface.${profile}.candidate-entry`; const exitSurfaceId = `extension-surface.${profile}.candidate-exit`;
    const productCapabilityId = `extension-capability.${profile}.product-priority`; const auditCapabilityId = `extension-capability.${profile}.audit-consistency`;
    const domainPort = domainPortFor('classify-role'); const graphPort = graphPortFor('read-path-view'); const policyPort = policyPortFor('select-next');
    const entryContext = contextField(profile, 'candidate-domain-fact', domainOwner.id, domainPort); const exitContext = contextField(profile, 'candidate-graph-fact', graphOwner.id, graphPort);
    const productEntryPermission = permission(profile, 'product-domain-read', entrySurfaceId, productCapabilityId, domainOwner.id, domainPort);
    const productExitPermission = permission(profile, 'product-graph-read', exitSurfaceId, productCapabilityId, graphOwner.id, graphPort);
    const productControlPermission = permission(profile, 'product-policy-control', exitSurfaceId, productCapabilityId, policyOwner.id, policyPort, 'control-port');
    const auditExitPermission = permission(profile, 'audit-graph-read', exitSurfaceId, auditCapabilityId, graphOwner.id, graphPort);
    stages = [prepare, commit];
    if (options.product === false) {
      permissions = [auditExitPermission]; surfaces = [surface(profile, 'candidate-exit', commit.id, 'exit', [exitContext], [auditExitPermission.id])];
      capabilities = [capability(profile, 'audit-consistency', 'capability.synthetic-consistency-audit', graphOwner.id, counters.find(({ kind }) => kind === 'capability-invocation').id, [exitSurfaceId], [exitContext.id], [auditExitPermission.id], [contribution(profile, 'audit-diagnostic', 'diagnostic', contextClass, '512')], [effect(profile, 'audit-observe', graphOwner.id, graphPort, 'observe', '1', false)])];
    } else {
      permissions = [productEntryPermission, productExitPermission, productControlPermission, auditExitPermission];
      surfaces = [surface(profile, 'candidate-entry', prepare.id, 'entry', [entryContext], [productEntryPermission.id]), surface(profile, 'candidate-exit', commit.id, 'exit', [exitContext], [productExitPermission.id, productControlPermission.id, auditExitPermission.id])];
      capabilities = [
        capability(profile, 'product-priority', 'product.synthetic-priority', policyOwner.id, counters.find(({ kind }) => kind === 'capability-invocation').id, [entrySurfaceId, exitSurfaceId], [entryContext.id, exitContext.id], [productEntryPermission.id, productExitPermission.id, productControlPermission.id], [contribution(profile, 'product-configuration', 'configuration', contextClass, '1024')], [effect(profile, 'product-control', policyOwner.id, policyPort, 'control-port', '0', false)], { before: [auditCapabilityId] }),
        capability(profile, 'audit-consistency', 'capability.synthetic-consistency-audit', graphOwner.id, counters.find(({ kind }) => kind === 'capability-invocation').id, [exitSurfaceId], [exitContext.id], [auditExitPermission.id], [contribution(profile, 'audit-diagnostic', 'diagnostic', contextClass, '512')], [effect(profile, 'audit-observe', graphOwner.id, graphPort, 'observe', '1', false)], { after: [productCapabilityId] }),
      ];
    }
  }

  if (options.channel) {
    const product = capabilities.find(({ id }) => id.endsWith('product-priority'));
    const audit = capabilities.find(({ id }) => id.endsWith('audit-consistency'));
    if (product) product.channels.push({
      requirement: schemaReference('cuda-mcgs.channel-requirement.evaluator-request'),
      bindings: [
        { surface: product.bindings.find((id) => id.endsWith('candidate-entry')), actions: ['produce', 'cancel', 'release'] },
        { surface: product.bindings.find((id) => id.endsWith('candidate-exit')), actions: ['claim', 'observe', 'complete', 'cancel', 'release'] },
      ],
    });
    audit.channels.push({
      requirement: schemaReference('cuda-mcgs.channel-requirement.audit-feed'),
      bindings: [{ surface: audit.bindings[0], actions: ['produce', 'observe', 'cancel', 'release'] }],
    });
  }

  const ownerPorts = new Map(progress.contributors.map(({ id }) => [id, new Map()]));
  const addPort = (owner, port) => ownerPorts.get(owner).set(schemaKey(port), port);
  for (const selectedPermission of permissions) addPort(selectedPermission.sourceOwner, selectedPermission.sourcePort);
  for (const selectedStage of stages) { addPort(selectedStage.entry.sourceOwner, selectedStage.entry.publication); for (const outcome of selectedStage.outcomes) addPort(outcome.sourceOwner, outcome.publication); }
  for (const selectedCapability of capabilities) for (const selectedEffect of selectedCapability.effects) addPort(selectedEffect.owner, selectedEffect.port);
  const owners = progress.contributors.map((entry) => ({ id: entry.id, role: entry.id === stageOwner.id ? 'coordinator' : 'source', contract: entry.contract, profile: entry.profile, ports: [...ownerPorts.get(entry.id).values()], cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-${entry.id.replaceAll('.', '-')}-extension-owner-cleanup`) }));
  const requiredProfiles = new Map([[resourceResult.normalized.id, profileReference(resourceResult)], [progressResult.normalized.id, profileReference(progressResult)]]);
  for (const owner of owners.filter(({ role }) => role === 'source')) if (!requiredProfiles.has(owner.profile.id)) requiredProfiles.set(owner.profile.id, owner.profile);
  const requirements = new Map(); for (const selectedCapability of capabilities) for (const requirement of selectedCapability.requirements) requirements.set(requirement.id, requirement);

  return {
    schema: 'cuda-mcgs.stage-profile/0.2.0', representation: 'cuda-mcgs.search-ir/0.2.0', status: 'proposal-evidence', contract: catalogContract(inspected, 'SPEC-0003'), id: `extension.${profile}`, version: VERSION, generatorIdentity: contentIdentity(`${profile}:stage-profile-generator-v1`),
    resourcePlan: profileReference(resourceResult), progressPlan: profileReference(progressResult), resourceContribution: stageOwner.profile, progressContribution: stageOwner.profile,
    owners, entryStage: stages[0].id, stages, surfaces, capabilities, permissions, counters, statuses: statusVocabulary(),
    lifecycle: { states: LIFECYCLE_STATES, schedulerOwner: 'SPEC-0012', runtimeDiscovery: false, hostProgress: 'none', pendingWorkerRetention: 'none', persistence: 'none', cancellation: schemaReference(`cuda-mcgs.synthetic-${profile}-extension-lifecycle-cancellation`), stop: schemaReference(`cuda-mcgs.synthetic-${profile}-extension-lifecycle-stop`), teardown: schemaReference(`cuda-mcgs.synthetic-${profile}-extension-lifecycle-teardown`), release: schemaReference(`cuda-mcgs.synthetic-${profile}-extension-lifecycle-release`) },
    diagnostics: { authority: 'non-authoritative', maxRecords: '128', maxBytes: '16384', overflow: 'count', rawPointers: false, cudaHandles: false, nativeArtifacts: false, privateOwnerState: false },
    compatibility: { ownerSemanticsRequired: true, packageIdentityRequired: true, schedulerIdentityExcluded: true, nativeQualification: 'separate-selected-profile', migration: { kind: 'none' } },
    cleanup: { kinds: [...BASE_CLEANUP_KINDS, ...(options.channel ? ['channel-binding'] : [])], disposition: schemaReference(`cuda-mcgs.synthetic-${profile}-extension-cleanup-disposition`), quarantine: schemaReference(`cuda-mcgs.synthetic-${profile}-extension-cleanup-quarantine`), releaseOrder: schemaReference(`cuda-mcgs.synthetic-${profile}-extension-cleanup-release-order`), ownerOrder: schemaReference(`cuda-mcgs.synthetic-${profile}-extension-cleanup-owner-order`), retainedEvidence: schemaReference(`cuda-mcgs.synthetic-${profile}-extension-cleanup-retained-evidence`) },
    programContribution: { kind: 'device-program', language: 'restricted-device-js', sourceIdentity: contentIdentity(`${profile}:${capabilities.map(({ id }) => id).sort().join(',')}:restricted-device-js-extension-source`), inputs: [...requiredProfiles.values()], requirements: [...requirements.values()], runtimeRegistry: false, nativeArtifacts: false, provenance: { origin: 'first-party', trust: 'first-party-reviewed', revision: options.revision ?? REVISION, license: 'Apache-2.0', review: schemaReference(`cuda-mcgs.synthetic-${profile}-extension-program-security-review`) } },
    productData: [],
  };
}

export function buildStageProfiles(inspected, resourceResult, progressResult, knownProfiles) {
  return [
    buildProfile('synthetic-capability-pair', inspected, resourceResult, progressResult, knownProfiles),
    buildProfile('synthetic-proof-stage', inspected, resourceResult, progressResult, knownProfiles, { proof: true }),
  ];
}

export function buildStageFirstProductDeletedProfile(inspected, resourceResult, progressResult, knownProfiles) {
  return buildProfile('synthetic-capability-pair', inspected, resourceResult, progressResult, knownProfiles, { product: false });
}

export function buildChannelStageProfile(inspected, resourceResult, progressResult, knownProfiles) {
  return buildProfile('synthetic-channel-stage', inspected, resourceResult, progressResult, knownProfiles, { channel: true, revision: CHANNEL_REVISION });
}

export function buildChannelStageFirstProductDeletedProfile(inspected, resourceResult, progressResult, knownProfiles) {
  return buildProfile('synthetic-channel-stage', inspected, resourceResult, progressResult, knownProfiles, { channel: true, product: false, revision: CHANNEL_REVISION });
}

export function stageSyntheticSchemaReference(id) { return schemaReference(id); }
export function stageSyntheticContentIdentity(label) { return contentIdentity(label); }
