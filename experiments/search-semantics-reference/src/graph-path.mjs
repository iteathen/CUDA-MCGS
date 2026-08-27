import { canonicalClone, frozenCanonicalClone } from './canonical.mjs';
import { exactKeys, fail, isRecord } from './errors.mjs';

function decimal(value, code, label) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail(code, `${label} must be a canonical decimal string`);
  return BigInt(value);
}

function toDecimal(value) {
  return BigInt(value).toString();
}

function freeze(value, label) {
  return frozenCanonicalClone(value, label);
}

function objectByRole(profile, role) {
  const object = profile.objectKinds.find((entry) => entry.role === role);
  if (!object) fail('GRAPH_PATH_PROFILE', `Graph profile lacks ${role} object kind`);
  return object;
}

function layoutByRole(profile, role) {
  const object = objectByRole(profile, role);
  const layout = profile.layouts.find(({ objectKind }) => objectKind === object.id);
  if (!layout) fail('GRAPH_PATH_PROFILE', `Graph profile lacks ${role} layout`);
  return { object, layout };
}

function stateByTail(profile, role, tail) {
  const object = objectByRole(profile, role);
  const state = object.lifecycle.states.find((candidate) => candidate.endsWith(`state-${tail}`));
  if (!state) fail('GRAPH_PATH_PROFILE', `${role} lifecycle lacks ${tail}`);
  return state;
}

function resourceMaximum(profile, suffix, unit, scope) {
  const entries = profile.resources.filter(({ id, unit: entryUnit, scope: entryScope }) => id.endsWith(suffix) && entryUnit === unit && entryScope === scope);
  if (entries.length !== 1) fail('GRAPH_PATH_PROFILE', `Graph profile must declare exactly one ${suffix} ${unit}/${scope} resource`);
  return decimal(entries[0].maximum, 'GRAPH_PATH_PROFILE', `${entries[0].id} maximum`);
}

function publicReference(kind, arena, slot, generation) {
  return freeze({ kind, arena, slot, generation }, 'Graph PATH public reference');
}

function referenceKey(reference) {
  return `${reference.kind}\0${reference.arena}\0${reference.slot}\0${reference.generation}`;
}

function invalid(code) {
  return freeze({ kind: 'invalid', code }, 'Graph PATH invalid outcome');
}

function pressure(code) {
  return freeze({ kind: 'pressure', code }, 'Graph PATH pressure outcome');
}

function assertPortResult(result, label) {
  if (!isRecord(result) || typeof result.kind !== 'string') fail('GRAPH_PATH_PORT_RESULT', `${label} must return a typed result record`);
  return result;
}

function lifecycleHasReset(object, from) {
  return object.lifecycle.transitions.some((transition) =>
    transition.from === from
    && transition.to === object.lifecycle.initialState
    && transition.visibility === 'private');
}

function publicOwnerRegion(region) {
  return freeze({
    id: region.id,
    semanticRole: region.semanticRole,
    ownerContract: region.ownerContract,
    ownerProfile: region.ownerProfile,
    lifecycle: region.lifecycle,
    referenceHandling: region.referenceHandling,
    permissions: region.permissions,
    persistence: region.persistence,
  }, 'Graph PATH owner region');
}

export function createGraphPathOracle({
  profile,
  validateReference,
  nextGeneration,
  acquireProtection,
  releaseProtection,
  resolveChild,
  classifyPathRelation,
  ownerOccurrenceLifecycle = () => ({ status: 'ready' }),
  admission = {},
  arena = '0',
  mutations = {},
} = {}) {
  if (!isRecord(profile) || profile.mode !== 'materialized' || profile.path?.kind !== 'bounded') fail('GRAPH_PATH_PROFILE', 'materialized bounded Graph path profile is required');
  for (const [name, port] of Object.entries({ validateReference, nextGeneration, acquireProtection, releaseProtection, resolveChild, classifyPathRelation, ownerOccurrenceLifecycle })) {
    if (typeof port !== 'function') fail('GRAPH_PATH_PORT', `${name} must be an injected function`);
  }
  if (profile.path.identityBeforeRelation !== true) fail('GRAPH_PATH_PROFILE', 'Graph path profile must resolve identity before relation');
  decimal(arena, 'GRAPH_PATH_ARENA', 'arena');

  const { object: pathObject, layout: pathLayout } = layoutByRole(profile, 'active-path');
  const { object: occurrenceObject, layout: occurrenceLayout } = layoutByRole(profile, 'path-occurrence');
  if (profile.path.pathObject !== pathObject.id || profile.path.occurrenceObject !== occurrenceObject.id) fail('GRAPH_PATH_PROFILE', 'path object bindings differ from object roles');

  for (const terminal of pathObject.lifecycle.terminalStates) {
    if (!lifecycleHasReset(pathObject, terminal)) fail('GRAPH_PATH_PROFILE', `active-path terminal state ${terminal} lacks private reset-to-free transition`);
  }
  for (const reusable of [...occurrenceObject.lifecycle.readyStates, ...occurrenceObject.lifecycle.terminalStates]) {
    if (!lifecycleHasReset(occurrenceObject, reusable)) fail('GRAPH_PATH_PROFILE', `path-occurrence state ${reusable} lacks private reset-to-free transition`);
  }

  const maxPaths = decimal(profile.path.maxPaths, 'GRAPH_PATH_PROFILE', 'path maxPaths');
  const maxDepth = decimal(profile.path.maxDepth, 'GRAPH_PATH_PROFILE', 'path maxDepth');
  const profilePathSlots = resourceMaximum(profile, 'resource-active-path-slots', 'slots', 'per-engine');
  const profileOccurrenceRecords = resourceMaximum(profile, 'resource-path-records', 'records', 'per-engine');
  const profilePathDepth = resourceMaximum(profile, 'resource-path-depth', 'records', 'per-invocation');
  const pathLayoutCapacity = decimal(pathLayout.capacity, 'GRAPH_PATH_PROFILE', `${pathLayout.id} capacity`);
  const occurrenceLayoutCapacity = decimal(occurrenceLayout.capacity, 'GRAPH_PATH_PROFILE', `${occurrenceLayout.id} capacity`);

  const pathSlots = admission.pathSlots === undefined ? profilePathSlots : decimal(admission.pathSlots, 'GRAPH_PATH_ADMISSION', 'pathSlots');
  const occurrenceRecords = admission.occurrenceRecords === undefined ? profileOccurrenceRecords : decimal(admission.occurrenceRecords, 'GRAPH_PATH_ADMISSION', 'occurrenceRecords');
  const pathDepth = admission.pathDepth === undefined ? profilePathDepth : decimal(admission.pathDepth, 'GRAPH_PATH_ADMISSION', 'pathDepth');
  if (pathSlots === 0n || pathSlots > profilePathSlots || pathSlots > pathLayoutCapacity || pathSlots > maxPaths) fail('GRAPH_PATH_ADMISSION', 'pathSlots exceeds or eliminates normalized active-path capacity');
  if (occurrenceRecords === 0n || occurrenceRecords > profileOccurrenceRecords || occurrenceRecords > occurrenceLayoutCapacity) fail('GRAPH_PATH_ADMISSION', 'occurrenceRecords exceeds or eliminates normalized occurrence capacity');
  if (pathDepth === 0n || pathDepth > profilePathDepth || pathDepth > maxDepth) fail('GRAPH_PATH_ADMISSION', 'pathDepth exceeds or eliminates normalized depth capacity');

  const occurrenceRegions = profile.ownerRegions.filter(({ objectKind }) => objectKind === occurrenceObject.id);
  const requiredRegionIds = occurrenceRegions.map(({ id }) => id).sort();
  const pathFree = stateByTail(profile, 'active-path', 'free');
  const pathActive = stateByTail(profile, 'active-path', 'active');
  const pathCompleting = stateByTail(profile, 'active-path', 'completing');
  const pathReleased = stateByTail(profile, 'active-path', 'released');
  const pathAbandoned = stateByTail(profile, 'active-path', 'abandoned');
  const pathFailed = stateByTail(profile, 'active-path', 'failed');
  const occurrenceFree = stateByTail(profile, 'path-occurrence', 'free');
  const occurrenceReady = stateByTail(profile, 'path-occurrence', 'ready');
  const occurrenceFailed = stateByTail(profile, 'path-occurrence', 'failed');

  const paths = [];
  const occurrences = [];
  const events = [];
  let sequence = 0n;

  const emit = (type, detail) => {
    events.push(freeze({ sequence: toDecimal(sequence++), type, detail }, 'Graph PATH event'));
  };

  function normalizeOwnerRecords(input) {
    if (!Array.isArray(input)) fail('GRAPH_PATH_OWNER_RECORDS', 'ownerRecords must be an array');
    const byRegion = new Map();
    for (const [index, entry] of input.entries()) {
      exactKeys(entry, ['record', 'regionId'], 'GRAPH_PATH_OWNER_RECORDS', `ownerRecords ${index}`);
      if (typeof entry.regionId !== 'string' || byRegion.has(entry.regionId)) fail('GRAPH_PATH_OWNER_RECORDS', 'ownerRecords region ids must be unique strings');
      const region = occurrenceRegions.find(({ id }) => id === entry.regionId);
      if (!region) fail('GRAPH_PATH_OWNER_RECORDS', `ownerRecords names undeclared occurrence region ${entry.regionId}`);
      byRegion.set(entry.regionId, freeze(entry.record, 'Graph PATH opaque owner record'));
    }
    const actual = [...byRegion.keys()].sort();
    if (actual.length !== requiredRegionIds.length || actual.some((id, index) => id !== requiredRegionIds[index])) {
      fail('GRAPH_PATH_OWNER_RECORDS', `ownerRecords must exactly cover selected occurrence regions: ${requiredRegionIds.join(', ')}`);
    }
    return byRegion;
  }

  function resolveSlotState(input) {
    if (!isRecord(input)) return null;
    const { kind, arena: requestedArena, slot } = input;
    if (requestedArena !== arena || typeof slot !== 'string') return null;
    let entry;
    if (kind === 'active-path') entry = paths[Number(decimal(slot, 'GRAPH_PATH_SLOT', 'path slot'))];
    else if (kind === 'path-occurrence') entry = occurrences[Number(decimal(slot, 'GRAPH_PATH_SLOT', 'occurrence slot'))];
    else return null;
    if (!entry) return null;
    return freeze({ kind, arena, slot, generation: entry.generation, lifecycleState: entry.state }, 'Graph PATH slot state');
  }

  function selectPathSlot() {
    const free = paths.find((entry) => entry.state === pathFree && entry.exhausted !== true);
    if (free) return { entry: free, isNew: false };
    if (BigInt(paths.length) >= pathSlots) return null;
    return {
      entry: {
        slot: toDecimal(paths.length),
        generation: '0',
        state: pathFree,
        occurrenceSlots: [],
        exhausted: false,
      },
      isNew: true,
    };
  }

  function selectOccurrenceSlot() {
    const free = occurrences.find((entry) => entry.state === occurrenceFree && entry.exhausted !== true);
    if (free) return { entry: free, isNew: false };
    if (BigInt(occurrences.length) >= occurrenceRecords) return null;
    return {
      entry: {
        slot: toDecimal(occurrences.length),
        generation: '0',
        state: occurrenceFree,
        exhausted: false,
        pathKey: null,
        nodeReference: null,
        edgeReference: null,
        relationView: null,
        protectionTokens: [],
        ownerRecords: new Map(),
      },
      isNew: true,
    };
  }

  function pathReference(entry) {
    return publicReference('active-path', arena, entry.slot, entry.generation);
  }

  function occurrenceReference(entry) {
    return publicReference('path-occurrence', arena, entry.slot, entry.generation);
  }

  function activePathFromReference(reference) {
    const validated = assertPortResult(validateReference({ expectedKind: 'active-path', reference }), 'validateReference(active-path)');
    if (validated.kind !== 'valid') return { result: validated };
    const slot = Number(decimal(validated.reference.slot, 'GRAPH_PATH_SLOT', 'validated path slot'));
    const entry = paths[slot];
    if (!entry || entry.generation !== validated.reference.generation || entry.state !== pathActive) return { result: invalid('invalid-reference') };
    return { entry, reference: validated.reference };
  }

  function openPath() {
    const selected = selectPathSlot();
    if (!selected) {
      const exhaustedOnly = paths.length > 0 && paths.every((entry) => entry.exhausted === true);
      return exhaustedOnly
        ? freeze({ kind: 'exhausted', code: 'generation-exhausted' }, 'Graph PATH generation exhaustion')
        : pressure('path-capacity');
    }
    const { entry, isNew } = selected;
    if (isNew) paths.push(entry);
    entry.state = pathActive;
    entry.occurrenceSlots = [];
    const reference = pathReference(entry);
    emit('path-opened', { reference });
    return freeze({ kind: 'opened', reference }, 'Graph PATH open result');
  }

  function releaseTokens(tokens) {
    for (const token of [...tokens].reverse()) {
      const result = assertPortResult(releaseProtection({ token }), 'releaseProtection');
      if (result.kind !== 'released') fail('GRAPH_PATH_PROTECTION_RELEASE', `protection ${token.id ?? 'unknown'} did not release exactly once`);
    }
  }

  function releaseInitializedOwners(records, initialized) {
    for (const region of [...initialized].reverse()) {
      const result = ownerOccurrenceLifecycle(freeze({ action: 'release', region: publicOwnerRegion(region), record: records.get(region.id) }, 'Graph PATH owner release request'));
      if (!isRecord(result) || !['ready', 'released'].includes(result.status)) fail('GRAPH_PATH_OWNER_LIFECYCLE', `${region.id} release did not complete`);
    }
  }

  function appendPathOccurrence(input) {
    exactKeys(input, ['candidate', 'edgeReference', 'ownerRecords', 'pathReference'], 'GRAPH_PATH_APPEND_FIELDS', 'appendPathOccurrence input');
    const selectedPath = activePathFromReference(input.pathReference);
    if (selectedPath.result) return selectedPath.result;
    const { entry: pathEntry, reference: checkedPathReference } = selectedPath;

    if (BigInt(pathEntry.occurrenceSlots.length) >= pathDepth) return pressure('path-depth');
    const selectedOccurrence = selectOccurrenceSlot();
    if (!selectedOccurrence) return pressure('path-capacity');

    let checkedEdge = null;
    if (input.edgeReference !== null) {
      const edge = assertPortResult(validateReference({ expectedKind: 'parent-edge', reference: input.edgeReference }), 'validateReference(parent-edge)');
      if (edge.kind !== 'valid') return edge;
      checkedEdge = edge.reference;
    }

    const opaqueOwnerRecords = normalizeOwnerRecords(input.ownerRecords);
    const priorOccurrences = pathEntry.occurrenceSlots.map((slot) => occurrences[slot]);
    let relations = null;
    if (mutations.relationBeforeResolve === true && priorOccurrences.length > 0) {
      relations = priorOccurrences.map((prior) => freeze(classifyPathRelation(prior.relationView, freeze({ unresolved: true }, 'Graph PATH unresolved relation sentinel')), 'Graph PATH relation'));
      emit('relation-classified-before-resolution', { path: checkedPathReference, count: toDecimal(relations.length) });
    }

    const resolved = resolveChild(freeze(input.candidate, 'Graph PATH child candidate'));
    if (!isRecord(resolved)) fail('GRAPH_PATH_RESOLVE_CHILD', 'resolveChild must return a record');
    exactKeys(resolved, ['nodeReference', 'relationView'], 'GRAPH_PATH_RESOLVE_CHILD', 'resolveChild result');
    const node = assertPortResult(validateReference({ expectedKind: 'state-node', reference: resolved.nodeReference }), 'validateReference(state-node)');
    if (node.kind !== 'valid') return node;
    const checkedNode = node.reference;
    const relationView = freeze(resolved.relationView, 'Graph PATH relation view');
    emit('child-resolved', { nodeReference: checkedNode });

    const { entry: occurrenceEntry, isNew } = selectedOccurrence;
    const occurrenceOwner = `graph-path.${checkedPathReference.slot}.${checkedPathReference.generation}.${occurrenceEntry.slot}`;
    const acquired = [];
    const initialized = [];
    let visibleMutationEmitted = false;

    try {
      if (mutations.publishBeforeProtection === true) {
        emit('occurrence-visible', { path: checkedPathReference, slot: occurrenceEntry.slot, mutation: 'before-protection' });
        visibleMutationEmitted = true;
      }

      const nodeProtection = assertPortResult(acquireProtection({ expectedKind: 'state-node', owner: occurrenceOwner, reference: checkedNode }), 'acquireProtection(state-node)');
      if (nodeProtection.kind !== 'protected') return nodeProtection;
      acquired.push(nodeProtection.token);
      if (checkedEdge !== null) {
        const edgeProtection = assertPortResult(acquireProtection({ expectedKind: 'parent-edge', owner: occurrenceOwner, reference: checkedEdge }), 'acquireProtection(parent-edge)');
        if (edgeProtection.kind !== 'protected') {
          releaseTokens(acquired);
          return edgeProtection;
        }
        acquired.push(edgeProtection.token);
      }
      emit('occurrence-protected', { path: checkedPathReference, nodeReference: checkedNode, edgeReference: checkedEdge, protectionCount: toDecimal(acquired.length) });

      if (relations === null) {
        relations = priorOccurrences.map((prior) => freeze(classifyPathRelation(prior.relationView, relationView), 'Graph PATH relation'));
      }
      emit('path-relations-classified', { path: checkedPathReference, priorCount: toDecimal(priorOccurrences.length), relationCount: toDecimal(relations.length) });

      for (const region of occurrenceRegions) {
        const result = ownerOccurrenceLifecycle(freeze({ action: 'initialize', region: publicOwnerRegion(region), record: opaqueOwnerRecords.get(region.id) }, 'Graph PATH owner initialize request'));
        if (!isRecord(result) || result.status !== 'ready') {
          releaseInitializedOwners(opaqueOwnerRecords, initialized);
          releaseTokens(acquired);
          return freeze({ kind: 'failure', code: 'owner-lifecycle-failure' }, 'Graph PATH owner lifecycle failure');
        }
        initialized.push(region);
      }

      occurrenceEntry.state = occurrenceReady;
      occurrenceEntry.pathKey = referenceKey(checkedPathReference);
      occurrenceEntry.nodeReference = checkedNode;
      occurrenceEntry.edgeReference = checkedEdge;
      occurrenceEntry.relationView = relationView;
      occurrenceEntry.protectionTokens = [...acquired];
      occurrenceEntry.ownerRecords = opaqueOwnerRecords;
      if (isNew) occurrences.push(occurrenceEntry);
      pathEntry.occurrenceSlots.push(Number(occurrenceEntry.slot));
      const reference = occurrenceReference(occurrenceEntry);
      if (!visibleMutationEmitted) emit('occurrence-visible', { path: checkedPathReference, occurrenceReference: reference });
      return freeze({ kind: 'appended', occurrenceReference: reference, nodeReference: checkedNode, edgeReference: checkedEdge, relations }, 'Graph PATH append result');
    } catch (error) {
      if (initialized.length > 0) releaseInitializedOwners(opaqueOwnerRecords, initialized);
      if (acquired.length > 0) releaseTokens(acquired);
      occurrenceEntry.state = occurrenceFailed;
      throw error;
    }
  }

  function readPathView(input) {
    exactKeys(input, ['pathReference'], 'GRAPH_PATH_READ_FIELDS', 'readPathView input');
    const selectedPath = activePathFromReference(input.pathReference);
    if (selectedPath.result) return selectedPath.result;
    const { entry, reference } = selectedPath;
    const view = entry.occurrenceSlots.map((slot) => {
      const occurrence = occurrences[slot];
      return {
        occurrenceReference: occurrenceReference(occurrence),
        nodeReference: occurrence.nodeReference,
        edgeReference: occurrence.edgeReference,
        relationView: occurrence.relationView,
      };
    });
    return freeze({ kind: 'path-view', pathReference: reference, occurrences: view }, 'Graph PATH view');
  }

  function advanceReusableGeneration(entry, role, terminalState) {
    const result = assertPortResult(nextGeneration({ generation: entry.generation }), `nextGeneration(${role})`);
    if (result.kind === 'next') {
      entry.generation = result.generation;
      entry.state = role === 'active-path' ? pathFree : occurrenceFree;
      entry.exhausted = false;
      emit(`${role}-reusable`, { slot: entry.slot, generation: entry.generation });
      return true;
    }
    if (result.kind !== 'exhausted' || result.code !== 'generation-exhausted') fail('GRAPH_PATH_GENERATION', `${role} generation result is invalid`);
    entry.state = terminalState;
    entry.exhausted = true;
    emit(`${role}-generation-exhausted`, { slot: entry.slot, generation: entry.generation });
    return false;
  }

  function closePath(input) {
    exactKeys(input, ['disposition', 'pathReference'], 'GRAPH_PATH_CLOSE_FIELDS', 'closePath input');
    if (!['abandoned', 'failed', 'released'].includes(input.disposition)) fail('GRAPH_PATH_CLOSE_DISPOSITION', 'closePath disposition is invalid');
    const selectedPath = activePathFromReference(input.pathReference);
    if (selectedPath.result) return selectedPath.result;
    const { entry: pathEntry, reference } = selectedPath;
    const ownedOccurrences = pathEntry.occurrenceSlots.map((slot) => occurrences[slot]);

    for (const occurrence of ownedOccurrences) {
      const initialized = occurrenceRegions.filter((region) => occurrence.ownerRecords.has(region.id));
      releaseInitializedOwners(occurrence.ownerRecords, initialized);
      releaseTokens(occurrence.protectionTokens);
      emit('occurrence-protections-released', {
        occurrenceReference: occurrenceReference(occurrence),
        protectionCount: toDecimal(occurrence.protectionTokens.length),
      });
    }

    let terminalState;
    if (input.disposition === 'released') {
      pathEntry.state = pathCompleting;
      emit('path-completing', { reference });
      terminalState = pathReleased;
    } else if (input.disposition === 'abandoned') terminalState = pathAbandoned;
    else terminalState = pathFailed;
    pathEntry.state = terminalState;
    emit('path-terminal', { reference, disposition: input.disposition, occurrenceCount: toDecimal(ownedOccurrences.length) });

    let allReusable = true;
    for (const occurrence of ownedOccurrences) {
      const reusable = advanceReusableGeneration(occurrence, 'path-occurrence', occurrenceFailed);
      allReusable = allReusable && reusable;
      occurrence.pathKey = null;
      occurrence.nodeReference = null;
      occurrence.edgeReference = null;
      occurrence.relationView = null;
      occurrence.protectionTokens = [];
      occurrence.ownerRecords = new Map();
    }
    pathEntry.occurrenceSlots = [];
    allReusable = advanceReusableGeneration(pathEntry, 'active-path', terminalState) && allReusable;
    return freeze({ kind: 'closed', disposition: input.disposition, reusable: allReusable }, 'Graph PATH close result');
  }

  function snapshot() {
    return canonicalClone({
      profileId: profile.id,
      arena,
      limits: {
        pathSlots: toDecimal(pathSlots),
        occurrenceRecords: toDecimal(occurrenceRecords),
        pathDepth: toDecimal(pathDepth),
      },
      pathSlots: paths.map((entry) => ({
        reference: publicReference('active-path', arena, entry.slot, entry.generation),
        lifecycleState: entry.state,
        exhausted: entry.exhausted,
        occurrenceCount: entry.occurrenceSlots.length,
      })),
      occurrenceSlots: occurrences.map((entry) => ({
        reference: publicReference('path-occurrence', arena, entry.slot, entry.generation),
        lifecycleState: entry.state,
        exhausted: entry.exhausted,
        protectedObjects: entry.protectionTokens.length,
        ownerRegionIds: [...entry.ownerRecords.keys()].sort(),
      })),
      events,
    }, 'Graph PATH snapshot');
  }

  return Object.freeze({
    openPath,
    appendPathOccurrence,
    readPathView,
    closePath,
    resolveSlotState,
    snapshot,
  });
}
