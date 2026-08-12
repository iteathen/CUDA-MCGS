const WIDTH = 7;
const HEIGHT = 6;
const MAX_MOVES = WIDTH * HEIGHT;
const FULL_MASK = (1n << BigInt(MAX_MOVES)) - 1n;

function ok(condition, message) {
  if (!condition) throw new Error(message);
}

function fail(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  Object.assign(error, details);
  throw error;
}

function expectCode(fn, code) {
  try {
    fn();
  } catch (error) {
    ok(error.code === code, `expected ${code}, got ${error.code || error.message}`);
    return error;
  }
  throw new Error(`expected ${code}`);
}

class Rng {
  constructor(seed = 0x6d2b79f5) {
    const normalized = Number(seed) >>> 0;
    this.state = normalized || 0x6d2b79f5;
  }
  nextU32() {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }
  int(limit) {
    ok(Number.isInteger(limit) && limit > 0, 'rng limit must be positive integer');
    return this.nextU32() % limit;
  }
}

function bitIndex(column, row) {
  return BigInt(row * WIDTH + column);
}

function cellMask(column, row) {
  return 1n << bitIndex(column, row);
}

function occupied(state) {
  return state.p1 | state.p2;
}

function moveCount(state) {
  let bits = occupied(state);
  let count = 0;
  while (bits) {
    bits &= bits - 1n;
    count++;
  }
  return count;
}

function stateKey(state) {
  return `${state.p1.toString(16)}:${state.p2.toString(16)}:${state.toMove}`;
}

function initialState() {
  return Object.freeze({ p1: 0n, p2: 0n, toMove: 1 });
}

function playerBits(state, player) {
  return player === 1 ? state.p1 : state.p2;
}

function hasFour(bits) {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (let row = 0; row < HEIGHT; row++) {
    for (let column = 0; column < WIDTH; column++) {
      if ((bits & cellMask(column, row)) === 0n) continue;
      for (const [dc, dr] of directions) {
        let match = true;
        for (let step = 1; step < 4; step++) {
          const c = column + dc * step;
          const r = row + dr * step;
          if (c < 0 || c >= WIDTH || r < 0 || r >= HEIGHT || (bits & cellMask(c, r)) === 0n) {
            match = false;
            break;
          }
        }
        if (match) return true;
      }
    }
  }
  return false;
}

function terminal(state) {
  if (hasFour(state.p1)) return Object.freeze({ terminal: true, winner: 1 });
  if (hasFour(state.p2)) return Object.freeze({ terminal: true, winner: 2 });
  if (occupied(state) === FULL_MASK) return Object.freeze({ terminal: true, winner: 0 });
  return Object.freeze({ terminal: false, winner: null });
}

function legalActions(state) {
  if (terminal(state).terminal) return [];
  const occ = occupied(state);
  const actions = [];
  for (let column = 0; column < WIDTH; column++) {
    if ((occ & cellMask(column, HEIGHT - 1)) === 0n) actions.push(column);
  }
  return actions;
}

function transition(state, action) {
  if (!Number.isInteger(action) || action < 0 || action >= WIDTH) fail('BAD_ACTION', { action });
  if (terminal(state).terminal) fail('TERMINAL_STATE');
  const occ = occupied(state);
  for (let row = 0; row < HEIGHT; row++) {
    const mask = cellMask(action, row);
    if ((occ & mask) !== 0n) continue;
    if (state.toMove === 1) return Object.freeze({ p1: state.p1 | mask, p2: state.p2, toMove: 2 });
    return Object.freeze({ p1: state.p1, p2: state.p2 | mask, toMove: 1 });
  }
  fail('COLUMN_FULL', { action });
}

function stateFromMoves(moves) {
  let state = initialState();
  for (const action of moves) state = transition(state, action);
  return state;
}

function winnerValue(winner, player) {
  if (winner === 0) return 0;
  return winner === player ? 1 : -1;
}

function directWinningActions(state) {
  const player = state.toMove;
  const wins = [];
  for (const action of legalActions(state)) {
    const next = transition(state, action);
    if (terminal(next).winner === player) wins.push(action);
  }
  return wins;
}

class Connect4McgsSession {
  constructor(options = {}) {
    this.maxNodes = options.maxNodes ?? 100_000;
    this.maxEdges = options.maxEdges ?? 400_000;
    this.exploration = options.exploration ?? Math.SQRT2;
    this.rng = new Rng(options.seed ?? 0x4c474d43);
    this.graph = new Map();
    this.edgeCount = 0;
    this.completed = 0;
    this.transpositionReuses = 0;
    this.epoch = 1;
    this.stopCause = null;
    this.root = this.#getOrCreateNode(options.rootState ?? initialState());
  }

  #getOrCreateNode(state) {
    const key = stateKey(state);
    const existing = this.graph.get(key);
    if (existing) return existing;
    if (this.graph.size >= this.maxNodes) fail('NODE_CAPACITY', { capacity: this.maxNodes });
    const node = {
      key,
      state,
      visits: 0,
      expanded: false,
      edges: null
    };
    this.graph.set(key, node);
    return node;
  }

  #expand(node) {
    if (node.expanded) return node.edges;
    const actions = legalActions(node.state);
    if (this.edgeCount + actions.length > this.maxEdges) fail('EDGE_CAPACITY', { capacity: this.maxEdges });
    const parentPlayer = node.state.toMove;
    const edges = actions.map(action => ({
      action,
      parentPlayer,
      childKey: null,
      visits: 0,
      valueSum: 0,
      inFlight: 0
    }));
    node.expanded = true;
    node.edges = edges;
    this.edgeCount += edges.length;
    return edges;
  }

  #chooseEdge(node) {
    const edges = this.#expand(node);
    ok(edges.length > 0, 'non-terminal node has no legal actions');
    const unvisited = edges.filter(edge => edge.visits + edge.inFlight === 0);
    if (unvisited.length) return unvisited[this.rng.int(unvisited.length)];

    const parentVisits = Math.max(1, node.visits + edges.reduce((sum, edge) => sum + edge.inFlight, 0));
    let best = null;
    let bestScore = -Infinity;
    for (const edge of edges) {
      const effectiveVisits = edge.visits + edge.inFlight;
      const mean = edge.visits ? edge.valueSum / edge.visits : 0;
      const bonus = this.exploration * Math.sqrt(Math.log(parentVisits + 1) / effectiveVisits);
      const score = mean + bonus;
      if (score > bestScore || (score === bestScore && edge.action < best.action)) {
        best = edge;
        bestScore = score;
      }
    }
    return best;
  }

  #rollout(startState) {
    let state = startState;
    for (let ply = moveCount(state); ply <= MAX_MOVES; ply++) {
      const status = terminal(state);
      if (status.terminal) return status.winner;
      const actions = legalActions(state);
      ok(actions.length > 0, 'non-terminal rollout state has no legal actions');
      state = transition(state, actions[this.rng.int(actions.length)]);
    }
    throw new Error('rollout exceeded Connect Four move bound');
  }

  #releaseReservations(pathEdges) {
    for (const edge of pathEdges) {
      ok(edge.inFlight > 0, 'reservation underflow');
      edge.inFlight--;
    }
  }

  simulate() {
    if (this.stopCause) return false;
    const pathNodes = [];
    const pathEdges = [];
    let node = this.root;
    let winner = null;

    try {
      for (;;) {
        pathNodes.push(node);
        const status = terminal(node.state);
        if (status.terminal) {
          winner = status.winner;
          break;
        }

        const edge = this.#chooseEdge(node);
        const nextState = transition(node.state, edge.action);
        const nextKey = stateKey(nextState);
        const existedBeforeBinding = this.graph.has(nextKey);
        const wasUnbound = edge.childKey === null;
        const child = this.#getOrCreateNode(nextState);
        if (wasUnbound && existedBeforeBinding) this.transpositionReuses++;
        edge.childKey = child.key;
        edge.inFlight++;
        pathEdges.push(edge);

        if (child.visits === 0) {
          pathNodes.push(child);
          winner = this.#rollout(child.state);
          break;
        }
        node = child;
      }
    } catch (error) {
      this.#releaseReservations(pathEdges);
      if (error.code === 'NODE_CAPACITY' || error.code === 'EDGE_CAPACITY') {
        this.stopCause = error.code;
        return false;
      }
      throw error;
    }

    for (const edge of pathEdges) {
      ok(edge.inFlight > 0, 'reservation missing at backup');
      edge.inFlight--;
      edge.visits++;
      edge.valueSum += winnerValue(winner, edge.parentPlayer);
    }
    for (const visited of pathNodes) visited.visits++;
    this.completed++;
    return true;
  }

  search(simulations) {
    ok(Number.isSafeInteger(simulations) && simulations >= 0, 'simulation budget must be a nonnegative safe integer');
    const start = this.completed;
    for (let i = 0; i < simulations; i++) {
      if (!this.simulate()) break;
    }
    return Object.freeze({
      requested: simulations,
      completed: this.completed - start,
      totalCompleted: this.completed,
      stopCause: this.stopCause,
      ranking: this.rank()
    });
  }

  rank() {
    const edges = this.root.edges || [];
    const entries = edges.map(edge => Object.freeze({
      action: edge.action,
      visits: edge.visits,
      mean: edge.visits ? edge.valueSum / edge.visits : null,
      inFlight: edge.inFlight,
      childKey: edge.childKey
    }));
    entries.sort((a, b) => b.visits - a.visits || (b.mean ?? -Infinity) - (a.mean ?? -Infinity) || a.action - b.action);
    return Object.freeze(entries);
  }

  reroot(action) {
    const oldRoot = this.root;
    if (!legalActions(oldRoot.state).includes(action)) fail('BAD_ACTION', { action });
    const nextState = transition(oldRoot.state, action);
    const nextKey = stateKey(nextState);
    let child = this.graph.get(nextKey);

    // Admission before root mutation. Creating the admitted node is safe because it is reusable graph state;
    // root/epoch do not change unless admission succeeds.
    if (!child) child = this.#getOrCreateNode(nextState);

    if (oldRoot.edges) {
      const edge = oldRoot.edges.find(candidate => candidate.action === action);
      if (edge) edge.childKey = child.key;
    }
    this.root = child;
    this.epoch++;
    this.stopCause = null;
    return child;
  }

  getNode(state) {
    return this.graph.get(stateKey(state)) || null;
  }

  internForTest(state) {
    return this.#getOrCreateNode(state);
  }

  digest() {
    const nodes = [...this.graph.values()].map(node => ({
      key: node.key,
      visits: node.visits,
      expanded: node.expanded,
      edges: (node.edges || []).map(edge => [edge.action, edge.childKey, edge.visits, edge.valueSum, edge.inFlight])
    })).sort((a, b) => a.key.localeCompare(b.key));
    return JSON.stringify({
      epoch: this.epoch,
      root: this.root.key,
      completed: this.completed,
      stopCause: this.stopCause,
      edgeCount: this.edgeCount,
      nodes
    });
  }
}

const tests = [];
function test(id, fn) { tests.push([id, fn]); }

test('domain-horizontal-vertical-diagonal-terminal', () => {
  const horizontal = stateFromMoves([0, 6, 1, 6, 2, 5, 3]);
  ok(terminal(horizontal).winner === 1, 'horizontal winner');
  const vertical = stateFromMoves([0, 1, 0, 1, 0, 1, 0]);
  ok(terminal(vertical).winner === 1, 'vertical winner');
  const diagonalBits = cellMask(0, 0) | cellMask(1, 1) | cellMask(2, 2) | cellMask(3, 3);
  ok(hasFour(diagonalBits), 'diagonal detection');
});

test('domain-full-column-rejected', () => {
  let state = initialState();
  for (let i = 0; i < HEIGHT; i++) state = transition(state, 0);
  ok(!legalActions(state).includes(0), 'full column remained legal');
  expectCode(() => transition(state, 0), 'COLUMN_FULL');
});

test('exact-state-identity-transposition', () => {
  const a = stateFromMoves([0, 1, 2, 3]);
  const b = stateFromMoves([2, 3, 0, 1]);
  ok(stateKey(a) === stateKey(b), 'commuting move orders should reach same exact state');
  const session = new Connect4McgsSession({ seed: 1 });
  const before = session.graph.size;
  const first = session.internForTest(a);
  const second = session.internForTest(b);
  ok(first === second, 'transposition did not reuse exact node');
  ok(session.graph.size === before + 1, 'duplicate transposition node allocated');
});

test('ranking-publication-readonly', () => {
  const session = new Connect4McgsSession({ seed: 2 });
  const before = session.digest();
  const ranking = session.rank();
  ok(ranking.length === 0, 'fresh root ranking should be empty before expansion');
  ok(session.digest() === before, 'rank mutated graph/search state');
});

test('immediate-win-search-oracle', () => {
  const state = stateFromMoves([0, 6, 1, 6, 2, 5]);
  ok(JSON.stringify(directWinningActions(state)) === '[3]', 'independent winning-action oracle');
  const session = new Connect4McgsSession({ rootState: state, seed: 0x12345678, maxNodes: 20_000, maxEdges: 70_000 });
  const result = session.search(2_000);
  ok(result.stopCause === null, `unexpected stop ${result.stopCause}`);
  ok(result.ranking[0]?.action === 3, `search missed immediate win; top=${result.ranking[0]?.action}`);
  ok(result.ranking[0].mean > 0.9, 'winning action mean should be near certain win');
});

test('search-observes-real-transposition-reuse', () => {
  const session = new Connect4McgsSession({ seed: 0xabcdef01, maxNodes: 80_000, maxEdges: 300_000 });
  const result = session.search(5_000);
  ok(result.stopCause === null, `unexpected stop ${result.stopCause}`);
  ok(session.transpositionReuses > 0, 'search did not bind any new edge to an existing transposition node');
  const incoming = new Map();
  for (const node of session.graph.values()) {
    for (const edge of node.edges || []) {
      if (!edge.childKey) continue;
      const list = incoming.get(edge.childKey) || [];
      list.push(edge);
      incoming.set(edge.childKey, list);
    }
  }
  const shared = [...incoming.values()].find(edges => edges.length > 1);
  ok(shared && shared.length > 1, 'no state node has multiple incoming parent edges');
  ok(shared[0] !== shared[1], 'incoming transposition edges share one edge-stat object');
  ok(session.graph.size < session.completed * 20, 'sanity bound on graph growth');
});

test('reroot-reuses-existing-child', () => {
  const session = new Connect4McgsSession({ seed: 0x31415926, maxNodes: 50_000, maxEdges: 200_000 });
  session.search(2_000);
  const top = session.rank()[0];
  ok(top && top.childKey, 'top action has no child');
  const childBefore = session.graph.get(top.childKey);
  const visitsBefore = childBefore.visits;
  const nodesBefore = session.graph.size;
  const epochBefore = session.epoch;
  const rootAfter = session.reroot(top.action);
  ok(rootAfter === childBefore, 'reroot lost graph node identity');
  ok(session.graph.size === nodesBefore, 'reroot allocated duplicate child');
  ok(session.epoch === epochBefore + 1, 'epoch did not advance');
  session.search(128);
  ok(rootAfter.visits > visitsBefore, 'rerooted node did not continue accumulating search');
});

test('reroot-capacity-rejection-no-root-mutation', () => {
  const session = new Connect4McgsSession({ seed: 4, maxNodes: 1, maxEdges: 32 });
  const rootKey = session.root.key;
  const epoch = session.epoch;
  const digest = session.digest();
  expectCode(() => session.reroot(0), 'NODE_CAPACITY');
  ok(session.root.key === rootKey && session.epoch === epoch, 'rejected reroot changed root/epoch');
  ok(session.digest() === digest, 'rejected reroot mutated accepted search state');
});

test('finite-node-capacity-produces-typed-stop', () => {
  const session = new Connect4McgsSession({ seed: 5, maxNodes: 8, maxEdges: 128 });
  const result = session.search(10_000);
  ok(result.stopCause === 'NODE_CAPACITY', `expected NODE_CAPACITY, got ${result.stopCause}`);
  ok(session.graph.size === 8, 'node capacity exceeded or under-accounted');
  ok(result.totalCompleted > 0, 'no valid work completed before pressure');
});

test('finite-edge-capacity-produces-typed-stop', () => {
  const session = new Connect4McgsSession({ seed: 6, maxNodes: 128, maxEdges: 6 });
  const result = session.search(10);
  ok(result.stopCause === 'EDGE_CAPACITY', `expected EDGE_CAPACITY, got ${result.stopCause}`);
  ok(session.edgeCount === 0, 'failed expansion consumed edge capacity');
  ok(session.completed === 0, 'work completed despite root expansion rejection');
});

test('seeded-search-is-deterministic', () => {
  const options = { seed: 0xdecafbad, maxNodes: 30_000, maxEdges: 120_000 };
  const a = new Connect4McgsSession(options);
  const b = new Connect4McgsSession(options);
  a.search(1_000);
  b.search(1_000);
  ok(a.digest() === b.digest(), 'same seed/profile produced different graph/search state');
  ok(JSON.stringify(a.rank()) === JSON.stringify(b.rank()), 'same seed/profile produced different ranking');
});

let passed = 0;
for (const [id, fn] of tests) {
  try {
    fn();
    passed++;
    console.log(`test=${id} result=pass`);
  } catch (error) {
    console.log(`test=${id} result=fail error=${JSON.stringify(error.stack || String(error))}`);
  }
}
console.log(`capsule=connect4-mcgs-v0 expected=${tests.length} discovered=${tests.length} executed=${tests.length} passed=${passed} failed=${tests.length - passed} required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=0`);
process.exitCode = passed === tests.length ? 0 : 1;

export {
  Connect4McgsSession,
  directWinningActions,
  hasFour,
  initialState,
  legalActions,
  stateFromMoves,
  stateKey,
  terminal,
  transition
};
