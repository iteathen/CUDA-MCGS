import { createDomainOracle } from './domain.mjs';
import { exactKeys, fail } from './errors.mjs';

const TRANSPOSE_ID = 'domain.synthetic-transposing';
const STOCHASTIC_ID = 'domain.synthetic-stochastic-history';
const LAZY_ID = 'domain.synthetic-lazy-continuous';

function assertText(value, code, label) {
  if (typeof value !== 'string' || value.length === 0) fail(code, `${label} must be a non-empty string`);
  return value;
}

function assertBoolean(value, code, label) {
  if (typeof value !== 'boolean') fail(code, `${label} must be boolean`);
  return value;
}

function assertFinite(value, code, label, minimum = -Number.MAX_VALUE, maximum = Number.MAX_VALUE) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Object.is(value, -0) || value < minimum || value > maximum) {
    fail(code, `${label} must be a finite number in [${minimum}, ${maximum}]`);
  }
  return value;
}

function assertNonNegativeInteger(value, code, label) {
  if (!Number.isSafeInteger(value) || value < 0) fail(code, `${label} must be a non-negative safe integer`);
  return value;
}

function requiredCapacity(value) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

function transposingDefinition() {
  const actionsByState = new Map([
    ['alpha', [{ id: 'to-beta', target: 'beta' }, { id: 'to-goal', target: 'goal' }]],
    ['beta', [{ id: 'to-alpha', target: 'alpha' }]],
    ['dead-end', []],
    ['goal', []],
  ]);

  const normalizeState = (input) => {
    exactKeys(input, ['encoding', 'historyTag', 'semantic', 'terminal'], 'DOMAIN_STATE_INVALID', 'transposing state');
    const semantic = assertText(input.semantic, 'DOMAIN_STATE_INVALID', 'transposing semantic state');
    if (!actionsByState.has(semantic)) fail('DOMAIN_STATE_INVALID', `unknown transposing semantic state ${semantic}`);
    const terminal = assertBoolean(input.terminal, 'DOMAIN_STATE_INVALID', 'transposing terminal flag');
    if (terminal !== (semantic === 'goal')) fail('DOMAIN_STATE_INVALID', 'transposing terminal flag disagrees with semantic state');
    return {
      semantic,
      historyTag: assertText(input.historyTag, 'DOMAIN_STATE_INVALID', 'transposing embedded history'),
      terminal,
      encoding: assertText(input.encoding, 'DOMAIN_STATE_INVALID', 'transposing representation encoding'),
    };
  };

  const normalizeAction = (input, origin) => {
    exactKeys(input, ['id', 'target'], 'DOMAIN_ACTION_INVALID', 'transposing action');
    const normalized = {
      id: assertText(input.id, 'DOMAIN_ACTION_INVALID', 'transposing action id'),
      target: assertText(input.target, 'DOMAIN_ACTION_INVALID', 'transposing action target'),
    };
    const allowed = actionsByState.get(origin.state.semantic) ?? [];
    if (!allowed.some((action) => action.id === normalized.id && action.target === normalized.target)) {
      fail('DOMAIN_ACTION_INVALID', 'transposing action is not valid for its origin');
    }
    return normalized;
  };

  return {
    profileId: TRANSPOSE_ID,
    normalizeRoot(input) {
      exactKeys(input, ['profileId', 'scopeId', 'state'], 'DOMAIN_ROOT_INVALID', 'transposing root');
      if (input.profileId !== TRANSPOSE_ID) fail('DOMAIN_ROOT_INVALID', 'transposing root profile is incompatible');
      return { profileId: input.profileId, scopeId: input.scopeId, state: normalizeState(input.state), history: null };
    },
    normalizeState,
    normalizeHistory: null,
    stateViewProjection(view) {
      return { semantic: view.state.semantic, historyTag: view.state.historyTag, terminal: view.state.terminal };
    },
    stateKey(projection) {
      return projection.semanticStateView.terminal ? 'identity.terminal' : 'identity.collision-bucket';
    },
    classifyRole(view) {
      return view.state.terminal ? `${TRANSPOSE_ID}.role-terminal` : `${TRANSPOSE_ID}.role-decision`;
    },
    normalizeAction,
    actionProjection(action) {
      return { id: action.id, target: action.target };
    },
    actionKey(input) {
      return `action.${input.projection.id}`;
    },
    produceActions({ origin, cursor, capacity }) {
      const actions = actionsByState.get(origin.state.semantic);
      if (actions.length === 0) return { status: 'no-action-complete' };
      if (capacity === 0) return { status: 'capacity-required', requiredCapacity: 1 };
      const offset = cursor === null ? 0 : (() => {
        exactKeys(cursor, ['offset'], 'DOMAIN_CURSOR_INVALID', 'transposing cursor');
        return assertNonNegativeInteger(cursor.offset, 'DOMAIN_CURSOR_INVALID', 'transposing cursor offset');
      })();
      if (offset >= actions.length) fail('DOMAIN_CURSOR_INVALID', 'transposing cursor is exhausted');
      const batch = actions.slice(offset, offset + Math.min(capacity, 1));
      const nextOffset = offset + batch.length;
      return nextOffset < actions.length
        ? { status: 'batch-ready-more', actions: batch, nextCursor: { offset: nextOffset } }
        : { status: 'batch-ready-complete', actions: batch, nextCursor: null };
    },
    applyTransition({ origin, action, input }) {
      exactKeys(input, [], 'DOMAIN_TRANSITION_INPUT', 'deterministic transposing transition input');
      const target = action.payload.target;
      const state = normalizeState({
        semantic: target,
        historyTag: `${origin.state.historyTag}>${target}`,
        terminal: target === 'goal',
        encoding: `transition-${target}`,
      });
      const metadata = { kind: 'deterministic', source: origin.state.semantic, target };
      return { status: 'success', requiredCapacity: requiredCapacity({ state, metadata }), state, history: null, metadata };
    },
    advanceHistory: null,
    classifyPathRelation({ left, right }) {
      if (left.state.semantic !== right.state.semantic) return 'relation.not-related';
      if (left.state.historyTag !== right.state.historyTag) return 'relation.history-dependent-repeat';
      return 'relation.same-domain-identity';
    },
    terminalOutcome(view) {
      return { kind: 'constraint-result', proof: { status: 'satisfied', witness: view.state.semantic }, coordinates: [{ id: 'constraint.feasible', value: true }] };
    },
  };
}

function stochasticDefinition() {
  const normalizeState = (input) => {
    exactKeys(input, ['belief', 'phase', 'terminal'], 'DOMAIN_STATE_INVALID', 'stochastic state');
    if (!['chance', 'observation', 'custom', 'terminal'].includes(input.phase)) fail('DOMAIN_STATE_INVALID', 'stochastic state phase is invalid');
    const terminal = assertBoolean(input.terminal, 'DOMAIN_STATE_INVALID', 'stochastic terminal flag');
    if (terminal !== (input.phase === 'terminal')) fail('DOMAIN_STATE_INVALID', 'stochastic terminal flag disagrees with phase');
    if (!Array.isArray(input.belief) || input.belief.length !== 2) fail('DOMAIN_STATE_INVALID', 'stochastic belief must contain two coordinates');
    return { phase: input.phase, terminal, belief: input.belief.map((value, index) => assertFinite(value, 'DOMAIN_STATE_INVALID', `belief ${index}`, 0, 1)) };
  };

  const normalizeHistory = (input) => {
    exactKeys(input, ['observations', 'steps'], 'DOMAIN_HISTORY_INVALID', 'stochastic history');
    if (!Array.isArray(input.observations) || input.observations.some((value) => typeof value !== 'string')) fail('DOMAIN_HISTORY_INVALID', 'observations must be strings');
    const steps = assertNonNegativeInteger(input.steps, 'DOMAIN_HISTORY_INVALID', 'history steps');
    if (steps !== input.observations.length) fail('DOMAIN_HISTORY_INVALID', 'history step count must equal observations length');
    if (steps > 3) fail('DOMAIN_HISTORY_EXHAUSTED', 'stochastic reference history exhausted');
    return { observations: [...input.observations], steps };
  };

  const appendObservation = (history, observation) => normalizeHistory({ observations: [...history.observations, observation], steps: history.steps + 1 });

  const normalizeAction = (input) => {
    exactKeys(input, ['delta', 'id'], 'DOMAIN_ACTION_INVALID', 'stochastic action');
    return {
      id: assertText(input.id, 'DOMAIN_ACTION_INVALID', 'stochastic action id'),
      delta: assertFinite(input.delta, 'DOMAIN_ACTION_INVALID', 'stochastic action delta', -8, 8),
    };
  };

  return {
    profileId: STOCHASTIC_ID,
    normalizeRoot(input) {
      exactKeys(input, ['history', 'profileId', 'scopeId', 'state'], 'DOMAIN_ROOT_INVALID', 'stochastic root');
      if (input.profileId !== STOCHASTIC_ID) fail('DOMAIN_ROOT_INVALID', 'stochastic root profile is incompatible');
      return { profileId: input.profileId, scopeId: input.scopeId, state: normalizeState(input.state), history: normalizeHistory(input.history) };
    },
    normalizeState,
    normalizeHistory,
    stateViewProjection(view) {
      return { state: view.state, history: view.history };
    },
    stateKey(projection) {
      return `identity.${projection.semanticStateView.state.phase}`;
    },
    classifyRole(view) {
      return `${STOCHASTIC_ID}.role-${view.state.phase}`;
    },
    normalizeAction,
    actionProjection(action) {
      return { id: action.id, delta: action.delta };
    },
    actionKey(input) {
      return `action.bucket-${Math.abs(Math.trunc(input.projection.delta)) % 2}`;
    },
    produceActions({ cursor, capacity, randomInputs }) {
      if (capacity === 0) return { status: 'capacity-required', requiredCapacity: 1 };
      const offset = cursor === null ? 0 : (() => {
        exactKeys(cursor, ['offset'], 'DOMAIN_CURSOR_INVALID', 'stochastic cursor');
        return assertNonNegativeInteger(cursor.offset, 'DOMAIN_CURSOR_INVALID', 'stochastic cursor offset');
      })();
      if (offset >= 4) fail('DOMAIN_CURSOR_INVALID', 'stochastic sample cursor is exhausted');
      const count = Math.min(capacity, 4 - offset);
      if (randomInputs.length < count) fail('DOMAIN_RANDOM_INPUT', 'explicit stochastic action samples are required');
      const actions = randomInputs.slice(0, count).map((sample, index) => ({
        id: `sample-${offset + index}`,
        delta: Math.trunc(assertFinite(sample, 'DOMAIN_RANDOM_INPUT', `random sample ${index}`, 0, 0.999999) * 8),
      }));
      const nextOffset = offset + actions.length;
      return nextOffset < 4
        ? { status: 'batch-ready-more', actions, nextCursor: { offset: nextOffset } }
        : { status: 'batch-ready-complete', actions, nextCursor: null };
    },
    applyTransition({ origin, action, mode, input }) {
      if (mode.kind === 'sampled-stochastic') {
        exactKeys(input, ['random'], 'DOMAIN_RANDOM_INPUT', 'stochastic transition input');
        const random = assertFinite(input.random, 'DOMAIN_RANDOM_INPUT', 'transition random input', 0, 0.999999);
        const terminal = random >= 0.75;
        const state = normalizeState({
          phase: terminal ? 'terminal' : 'observation',
          terminal,
          belief: [Math.min(1, origin.state.belief[0] + action.payload.delta / 16), Math.max(0, origin.state.belief[1] - action.payload.delta / 16)],
        });
        const metadata = { kind: 'sampled-stochastic', consumedRandom: random, weight: 0.25 };
        return { status: 'success', requiredCapacity: requiredCapacity({ state, metadata }), state, history: origin.history, metadata };
      }
      if (mode.kind === 'observation-bearing') {
        exactKeys(input, ['observation'], 'DOMAIN_TRANSITION_INPUT', 'observation transition input');
        const observation = assertText(input.observation, 'DOMAIN_TRANSITION_INPUT', 'domain observation');
        const history = appendObservation(origin.history, observation);
        const state = normalizeState({ phase: 'custom', terminal: false, belief: [Math.min(1, observation.length / 10), Math.max(0, 1 - observation.length / 10)] });
        const metadata = { kind: 'domain-observation', observation, publication: 'domain-metadata-only' };
        return { status: 'success', requiredCapacity: requiredCapacity({ state, history, metadata }), state, history, metadata };
      }
      fail('DOMAIN_TRANSITION_MODE', `unsupported stochastic transition mode ${mode.kind}`);
    },
    advanceHistory({ history, input }) {
      exactKeys(input, ['observation'], 'DOMAIN_HISTORY_INPUT', 'history advance input');
      return appendObservation(history, assertText(input.observation, 'DOMAIN_HISTORY_INPUT', 'history observation'));
    },
    classifyPathRelation({ left, right }) {
      if (left.state.phase !== right.state.phase) return 'relation.not-related';
      if (JSON.stringify(left.history) !== JSON.stringify(right.history)) return 'relation.history-dependent-repeat';
      return 'relation.repetition-equivalent';
    },
    terminalOutcome(view) {
      return {
        kind: 'vector-domain-outcome',
        coordinates: [
          { id: 'objective.feasibility', value: view.state.belief[0] },
          { id: 'objective.robustness', value: view.state.belief[1] },
        ],
        perspective: 'domain.global',
      };
    },
  };
}

function lazyDefinition() {
  const normalizeState = (input) => {
    exactKeys(input, ['position', 'target', 'terminal'], 'DOMAIN_STATE_INVALID', 'lazy continuous state');
    return {
      position: assertFinite(input.position, 'DOMAIN_STATE_INVALID', 'continuous position', -1000, 1000),
      target: assertFinite(input.target, 'DOMAIN_STATE_INVALID', 'continuous target', -1000, 1000),
      terminal: assertBoolean(input.terminal, 'DOMAIN_STATE_INVALID', 'continuous terminal flag'),
    };
  };

  const normalizeAction = (input) => {
    exactKeys(input, ['id', 'value'], 'DOMAIN_ACTION_INVALID', 'continuous action');
    return {
      id: assertText(input.id, 'DOMAIN_ACTION_INVALID', 'continuous action id'),
      value: assertFinite(input.value, 'DOMAIN_ACTION_INVALID', 'continuous action value', -1, 1),
    };
  };

  return {
    profileId: LAZY_ID,
    normalizeRoot(input) {
      exactKeys(input, ['profileId', 'scopeId', 'state'], 'DOMAIN_ROOT_INVALID', 'lazy continuous root');
      if (input.profileId !== LAZY_ID) fail('DOMAIN_ROOT_INVALID', 'lazy root profile is incompatible');
      return { profileId: input.profileId, scopeId: input.scopeId, state: normalizeState(input.state), history: null };
    },
    normalizeState,
    normalizeHistory: null,
    stateViewProjection(view) {
      return { position: view.state.position, target: view.state.target, terminal: view.state.terminal };
    },
    stateKey(projection) {
      return { family: 'continuous', region: projection.semanticStateView.terminal ? 'terminal' : 'active' };
    },
    classifyRole(view) {
      return view.state.terminal ? `${LAZY_ID}.role-terminal` : `${LAZY_ID}.role-continuous`;
    },
    normalizeAction,
    actionProjection(action) {
      return { value: action.value };
    },
    actionKey(input) {
      const coordinate = Math.round((input.projection.value + 1) * 1000);
      return { family: 'continuous-coordinate', coordinate };
    },
    produceActions({ cursor, capacity }) {
      if (capacity === 0) return { status: 'capacity-required', requiredCapacity: 1 };
      const offset = cursor === null ? 0 : (() => {
        exactKeys(cursor, ['offset'], 'DOMAIN_CURSOR_INVALID', 'lazy cursor');
        return assertNonNegativeInteger(cursor.offset, 'DOMAIN_CURSOR_INVALID', 'lazy cursor offset');
      })();
      const count = Math.min(capacity, 3);
      const actions = Array.from({ length: count }, (_, index) => {
        const coordinate = offset + index;
        return { id: `coordinate-${coordinate}`, value: ((coordinate % 17) - 8) / 8 };
      });
      return { status: 'batch-ready-more', actions, nextCursor: { offset: offset + actions.length } };
    },
    applyTransition({ origin, action, input }) {
      exactKeys(input, ['stepScale'], 'DOMAIN_TRANSITION_INPUT', 'continuous transition input');
      const scale = assertFinite(input.stepScale, 'DOMAIN_TRANSITION_INPUT', 'stepScale', 0, 10);
      const position = origin.state.position + action.payload.value * scale;
      const terminal = Math.abs(origin.state.target - position) <= 0.01;
      const state = normalizeState({ position, target: origin.state.target, terminal });
      const metadata = { kind: 'continuous-step', delta: action.payload.value * scale };
      return { status: 'success', requiredCapacity: requiredCapacity({ state, metadata }), state, history: null, metadata };
    },
    advanceHistory: null,
    classifyPathRelation({ left, right }) {
      return left.state.position === right.state.position && left.state.target === right.state.target
        ? 'relation.same-domain-identity'
        : 'relation.not-related';
    },
    terminalOutcome(view) {
      return { kind: 'proof-domain-outcome', proof: { relation: 'within-tolerance', position: view.state.position, target: view.state.target } };
    },
  };
}

export function createSyntheticDomainDefinitions() {
  return new Map([
    [TRANSPOSE_ID, transposingDefinition()],
    [STOCHASTIC_ID, stochasticDefinition()],
    [LAZY_ID, lazyDefinition()],
  ]);
}

export function createSyntheticDomainOracles(projection) {
  const definitions = createSyntheticDomainDefinitions();
  const projected = new Map(projection.profiles.map((entry) => [entry.id, entry]));
  if (projected.size !== definitions.size) fail('DOMAIN_PROJECTION_SET', 'Domain projection and behavioral definition sets differ');
  const oracles = new Map();
  for (const [id, definition] of definitions) {
    const entry = projected.get(id);
    if (!entry) fail('DOMAIN_PROJECTION_SET', `Domain projection is missing ${id}`);
    oracles.set(id, createDomainOracle(entry, definition));
  }
  return Object.freeze({
    transposing: oracles.get(TRANSPOSE_ID),
    stochastic: oracles.get(STOCHASTIC_ID),
    lazy: oracles.get(LAZY_ID),
  });
}

export const syntheticDomainIds = Object.freeze({ transposing: TRANSPOSE_ID, stochastic: STOCHASTIC_ID, lazy: LAZY_ID });
