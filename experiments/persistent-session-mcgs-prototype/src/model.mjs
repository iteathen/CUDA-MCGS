const DEFAULT_DOMAIN = new Map([
  [0, { heuristic: 0.00, actions: [{ id: 0, next: 1 }, { id: 1, next: 2 }] }],
  [1, { heuristic: 0.10, actions: [{ id: 0, next: 3 }, { id: 1, next: 4 }] }],
  [2, { heuristic: -0.05, actions: [{ id: 0, next: 4 }, { id: 1, next: 5 }] }],
  [3, { terminal: 1.00 }],
  [4, { terminal: 0.25 }],
  [5, { heuristic: -0.10, actions: [{ id: 0, next: 6 }, { id: 1, next: 2 }] }],
  [6, { terminal: -0.50 }],
  [10, { heuristic: 0.05, actions: [{ id: 0, next: 11 }, { id: 1, next: 12 }] }],
  [11, { terminal: 0.60 }],
  [12, { terminal: -0.20 }],
]);

function fail(code, detail = "") {
  const error = new Error(detail ? `${code}: ${detail}` : code);
  error.code = code;
  throw error;
}

function refKey(ref) {
  return `${ref.slot}:${ref.generation}`;
}

function cloneRef(ref) {
  return { slot: ref.slot, generation: ref.generation };
}

function freezeRanking(snapshot) {
  for (const entry of snapshot.entries) {
    Object.freeze(entry);
  }
  Object.freeze(snapshot.entries);
  return Object.freeze(snapshot);
}

export class PersistentMcgsPrototype {
  constructor({
    capacity = 7,
    maxDepth = 16,
    exploration = 1.10,
    maxRootEpoch = Number.MAX_SAFE_INTEGER,
    maxRankingGeneration = Number.MAX_SAFE_INTEGER,
    domain = DEFAULT_DOMAIN,
    rootState = 0,
  } = {}) {
    if (!Number.isSafeInteger(capacity) || capacity <= 0) fail("INVALID_CAPACITY");
    if (!Number.isSafeInteger(maxDepth) || maxDepth <= 0) fail("INVALID_MAX_DEPTH");
    if (!Number.isSafeInteger(maxRootEpoch) || maxRootEpoch < 1) fail("INVALID_MAX_ROOT_EPOCH");
    if (!Number.isSafeInteger(maxRankingGeneration) || maxRankingGeneration < 1) {
      fail("INVALID_MAX_RANKING_GENERATION");
    }

    this.capacity = capacity;
    this.maxDepth = maxDepth;
    this.exploration = exploration;
    this.maxRootEpoch = maxRootEpoch;
    this.maxRankingGeneration = maxRankingGeneration;
    this.domain = domain;
    this.status = "running";
    this.sessionId = "session-001";
    this.rootEpoch = 1;
    this.rankingGeneration = 0;
    this.latestRanking = null;
    this.nextWorkId = 1;
    this.outstanding = new Map();
    this.identity = new Map();
    this.slots = Array.from({ length: capacity }, (_, slot) => ({
      slot,
      generation: 1,
      everUsed: false,
      node: null,
    }));
    this.freeSlots = Array.from({ length: capacity }, (_, index) => capacity - index - 1);
    this.metrics = {
      completedWork: 0,
      abandonedStaleWork: 0,
      nodeAllocations: 0,
      slotReuses: 0,
      evaluations: 0,
      transpositionHits: 0,
      cycleCutoffs: 0,
      depthCutoffs: 0,
      reroots: 0,
      rankingPublishes: 0,
      rankingSorts: 0,
      reclamationPasses: 0,
      reclamationDeferred: 0,
      reclaimedNodes: 0,
    };

    this.rootRef = this.#findOrCreate(rootState);
    this.acceptedRootState = rootState;
  }

  #domainState(state) {
    const record = this.domain.get(state);
    if (!record) fail("UNKNOWN_DOMAIN_STATE", String(state));
    return record;
  }

  #resolve(ref) {
    if (!ref || !Number.isInteger(ref.slot) || ref.slot < 0 || ref.slot >= this.capacity) return null;
    const slot = this.slots[ref.slot];
    if (!slot.node || slot.generation !== ref.generation) return null;
    return slot.node;
  }

  resolveRef(ref) {
    const node = this.#resolve(ref);
    return node ? this.#publicNode(node) : null;
  }

  #publicNode(node) {
    return {
      ref: cloneRef(node.ref),
      state: node.state,
      visits: node.visits,
      expanded: node.expanded,
      evaluationReady: node.evaluationReady,
      evaluation: node.evaluation,
    };
  }

  #findOrCreate(state) {
    const existing = this.identity.get(state);
    if (existing) {
      if (this.#resolve(existing)) {
        this.metrics.transpositionHits += 1;
        return cloneRef(existing);
      }
      this.identity.delete(state);
    }

    if (this.freeSlots.length === 0) fail("NODE_CAPACITY_EXHAUSTED", `state=${state}`);
    const slotIndex = this.freeSlots.pop();
    const slot = this.slots[slotIndex];
    if (slot.everUsed) this.metrics.slotReuses += 1;
    slot.everUsed = true;
    const ref = { slot: slotIndex, generation: slot.generation };
    slot.node = {
      ref,
      state,
      visits: 0,
      expanded: false,
      edges: [],
      evaluationReady: false,
      evaluation: 0,
    };
    this.identity.set(state, cloneRef(ref));
    this.metrics.nodeAllocations += 1;
    return cloneRef(ref);
  }

  #evaluate(ref) {
    const node = this.#resolve(ref);
    if (!node) fail("STALE_NODE_REF", refKey(ref));
    if (node.evaluationReady) return node.evaluation;
    const state = this.#domainState(node.state);
    node.evaluation = Object.hasOwn(state, "terminal") ? state.terminal : state.heuristic ?? 0;
    node.evaluationReady = true;
    if (!Object.hasOwn(state, "terminal")) this.metrics.evaluations += 1;
    return node.evaluation;
  }

  #ensureExpanded(ref) {
    const node = this.#resolve(ref);
    if (!node) fail("STALE_NODE_REF", refKey(ref));
    if (node.expanded) return node;
    const state = this.#domainState(node.state);
    if (Object.hasOwn(state, "terminal")) {
      node.expanded = true;
      node.edges = [];
      return node;
    }
    node.edges = state.actions.map(({ id, next }) => ({
      action: id,
      nextState: next,
      child: null,
      visits: 0,
      reserved: 0,
      valueSum: 0,
    }));
    node.expanded = true;
    return node;
  }

  #materializeChild(parentRef, edgeIndex) {
    const parent = this.#resolve(parentRef);
    if (!parent) fail("STALE_NODE_REF", refKey(parentRef));
    const edge = parent.edges[edgeIndex];
    if (!edge) fail("INVALID_EDGE", `${refKey(parentRef)}:${edgeIndex}`);
    if (edge.child && this.#resolve(edge.child)) return cloneRef(edge.child);
    const child = this.#findOrCreate(edge.nextState);
    edge.child = cloneRef(child);
    return child;
  }

  #selectEdge(node) {
    let unvisited = null;
    for (let index = 0; index < node.edges.length; index += 1) {
      const edge = node.edges[index];
      if (edge.visits + edge.reserved === 0) {
        unvisited = index;
        break;
      }
    }
    if (unvisited !== null) return unvisited;

    const parentLoad = node.visits + node.edges.reduce((sum, edge) => sum + edge.reserved, 0);
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (let index = 0; index < node.edges.length; index += 1) {
      const edge = node.edges[index];
      const load = edge.visits + edge.reserved;
      const mean = edge.visits > 0 ? edge.valueSum / edge.visits : 0;
      const bonus = this.exploration * Math.sqrt(Math.log(parentLoad + 2) / load);
      const score = mean + bonus;
      if (score > bestScore || (score === bestScore && edge.action < node.edges[bestIndex].action)) {
        bestScore = score;
        bestIndex = index;
      }
    }
    return bestIndex;
  }

  beginSimulation() {
    if (this.status !== "running") fail("SESSION_NOT_RUNNING");
    const epoch = this.rootEpoch;
    const pathNodes = [cloneRef(this.rootRef)];
    const pathEdges = [];
    const seen = new Set([refKey(this.rootRef)]);
    let current = cloneRef(this.rootRef);
    let leafValue = 0;
    let stopReason = "depth";
    let stopped = false;

    for (let depth = 0; depth < this.maxDepth; depth += 1) {
      const node = this.#resolve(current);
      if (!node) fail("STALE_NODE_REF", refKey(current));
      const state = this.#domainState(node.state);
      if (Object.hasOwn(state, "terminal")) {
        leafValue = state.terminal;
        stopReason = "terminal";
        stopped = true;
        break;
      }

      this.#ensureExpanded(current);
      const edgeIndex = this.#selectEdge(node);
      const edge = node.edges[edgeIndex];
      edge.reserved += 1;
      pathEdges.push({ parent: cloneRef(current), edgeIndex });

      const child = this.#materializeChild(current, edgeIndex);
      const childKey = refKey(child);
      if (seen.has(childKey)) {
        this.metrics.cycleCutoffs += 1;
        leafValue = 0;
        stopReason = "cycle";
        stopped = true;
        break;
      }

      pathNodes.push(cloneRef(child));
      seen.add(childKey);
      current = child;
      const childNode = this.#resolve(child);
      if (!childNode) fail("STALE_NODE_REF", childKey);
      if (childNode.visits === 0) {
        leafValue = this.#evaluate(child);
        stopReason = "leaf";
        stopped = true;
        break;
      }
    }

    if (!stopped) {
      this.metrics.depthCutoffs += 1;
      leafValue = 0;
    }

    const work = {
      id: this.nextWorkId++,
      epoch,
      pathNodes,
      pathEdges,
      leafValue,
      stopReason,
      state: "pending",
    };
    this.outstanding.set(work.id, work);
    return work;
  }

  #releaseReservations(work) {
    for (const step of work.pathEdges) {
      const parent = this.#resolve(step.parent);
      if (!parent) continue;
      const edge = parent.edges[step.edgeIndex];
      if (edge && edge.reserved > 0) edge.reserved -= 1;
    }
  }

  commitSimulation(work) {
    const pending = this.outstanding.get(work?.id);
    if (!pending || pending !== work || work.state !== "pending") fail("UNKNOWN_WORK");

    if (work.epoch !== this.rootEpoch) {
      this.#releaseReservations(work);
      work.state = "abandoned-stale-root";
      this.outstanding.delete(work.id);
      this.metrics.abandonedStaleWork += 1;
      return { applied: false, reason: "stale-root-epoch" };
    }

    for (const step of work.pathEdges) {
      const parent = this.#resolve(step.parent);
      if (!parent) fail("STALE_WORK_PARENT", refKey(step.parent));
      const edge = parent.edges[step.edgeIndex];
      if (!edge || edge.reserved <= 0) fail("RESERVATION_ACCOUNTING");
      edge.reserved -= 1;
      edge.visits += 1;
      edge.valueSum += work.leafValue;
    }
    for (const ref of work.pathNodes) {
      const node = this.#resolve(ref);
      if (!node) fail("STALE_WORK_NODE", refKey(ref));
      node.visits += 1;
    }

    work.state = "applied";
    this.outstanding.delete(work.id);
    this.metrics.completedWork += 1;
    return { applied: true, reason: "applied" };
  }

  search(iterations, { publishEvery = 0, publishFinal = true, rankingLimit = null } = {}) {
    if (!Number.isSafeInteger(iterations) || iterations < 0) fail("INVALID_ITERATIONS");
    if (!Number.isSafeInteger(publishEvery) || publishEvery < 0) fail("INVALID_PUBLISH_CADENCE");

    for (let index = 0; index < iterations; index += 1) {
      const work = this.beginSimulation();
      const result = this.commitSimulation(work);
      if (!result.applied) fail("UNEXPECTED_STALE_WORK_IN_SERIAL_SEARCH");
      if (publishEvery > 0 && this.metrics.completedWork % publishEvery === 0) {
        this.publishRanking({ limit: rankingLimit });
      }
    }

    if (publishFinal) {
      if (!this.latestRanking ||
          this.latestRanking.rootEpoch !== this.rootEpoch ||
          this.latestRanking.completedWork !== this.metrics.completedWork) {
        this.publishRanking({ limit: rankingLimit });
      }
    }
    return this.latestRanking;
  }

  publishRanking({ limit = null } = {}) {
    if (this.rankingGeneration >= this.maxRankingGeneration) {
      fail("RANKING_GENERATION_EXHAUSTED", String(this.rankingGeneration));
    }
    const root = this.#ensureExpanded(this.rootRef);
    this.metrics.rankingSorts += 1;
    const entries = root.edges.map((edge) => {
      const child = edge.child ? this.#resolve(edge.child) : null;
      return {
        action: edge.action,
        childState: child?.state ?? null,
        visits: edge.visits,
        meanValue: edge.visits > 0 ? edge.valueSum / edge.visits : null,
        inFlight: edge.reserved,
      };
    });
    entries.sort((left, right) => {
      if (left.visits !== right.visits) return right.visits - left.visits;
      const leftMean = left.meanValue ?? -Infinity;
      const rightMean = right.meanValue ?? -Infinity;
      if (leftMean !== rightMean) return rightMean - leftMean;
      return left.action - right.action;
    });
    const bounded = limit == null ? entries : entries.slice(0, limit);
    this.rankingGeneration += 1;
    this.metrics.rankingPublishes += 1;
    const snapshot = freezeRanking({
      sessionId: this.sessionId,
      rootEpoch: this.rootEpoch,
      rootState: root.state,
      generation: this.rankingGeneration,
      completedWork: this.metrics.completedWork,
      entries: bounded,
    });
    this.latestRanking = snapshot;
    return snapshot;
  }

  #advanceRoot(nextRef, cause) {
    if (this.rootEpoch >= this.maxRootEpoch) {
      fail("ROOT_EPOCH_EXHAUSTED", String(this.rootEpoch));
    }
    const node = this.#resolve(nextRef);
    if (!node) fail("STALE_NEW_ROOT", refKey(nextRef));
    this.rootEpoch += 1;
    this.rootRef = cloneRef(nextRef);
    this.acceptedRootState = node.state;
    this.metrics.reroots += 1;
    return { rootEpoch: this.rootEpoch, rootState: node.state, cause };
  }

  rerootByAction(action) {
    const root = this.#ensureExpanded(this.rootRef);
    const edgeIndex = root.edges.findIndex((edge) => edge.action === action);
    if (edgeIndex < 0) fail("UNKNOWN_ROOT_ACTION", String(action));
    const child = this.#materializeChild(this.rootRef, edgeIndex);
    return this.#advanceRoot(child, { kind: "action", action });
  }

  replaceRoot(state) {
    const next = this.#findOrCreate(state);
    return this.#advanceRoot(next, { kind: "replacement", state });
  }

  reclaimUnreachable() {
    if (this.outstanding.size > 0) {
      this.metrics.reclamationDeferred += 1;
      return { deferred: true, reclaimed: 0 };
    }

    const reachable = new Set();
    const stack = [cloneRef(this.rootRef)];
    while (stack.length > 0) {
      const ref = stack.pop();
      const key = refKey(ref);
      if (reachable.has(key)) continue;
      const node = this.#resolve(ref);
      if (!node) continue;
      reachable.add(key);
      if (!node.expanded) continue;
      for (const edge of node.edges) {
        if (edge.child && this.#resolve(edge.child)) stack.push(cloneRef(edge.child));
      }
    }

    let reclaimed = 0;
    for (const slot of this.slots) {
      if (!slot.node) continue;
      const key = refKey(slot.node.ref);
      if (reachable.has(key)) continue;
      const state = slot.node.state;
      const indexed = this.identity.get(state);
      if (indexed && refKey(indexed) === key) this.identity.delete(state);
      slot.node = null;
      slot.generation += 1;
      if (!Number.isSafeInteger(slot.generation)) fail("SLOT_GENERATION_EXHAUSTED");
      this.freeSlots.push(slot.slot);
      reclaimed += 1;
    }

    this.metrics.reclamationPasses += 1;
    this.metrics.reclaimedNodes += reclaimed;
    return { deferred: false, reclaimed };
  }

  getNodeRefByState(state) {
    const ref = this.identity.get(state);
    return ref && this.#resolve(ref) ? cloneRef(ref) : null;
  }

  getEdge(parentState, action) {
    const parentRef = this.getNodeRefByState(parentState);
    if (!parentRef) return null;
    const parent = this.#resolve(parentRef);
    if (!parent?.expanded) return null;
    const edge = parent.edges.find((candidate) => candidate.action === action);
    if (!edge) return null;
    const child = edge.child ? this.#resolve(edge.child) : null;
    return {
      parentRef,
      action,
      childRef: edge.child ? cloneRef(edge.child) : null,
      childState: child?.state ?? null,
      visits: edge.visits,
      reserved: edge.reserved,
      valueSum: edge.valueSum,
      meanValue: edge.visits > 0 ? edge.valueSum / edge.visits : null,
    };
  }

  nodeCount() {
    return this.slots.reduce((count, slot) => count + (slot.node ? 1 : 0), 0);
  }

  totalReservations() {
    let reservations = 0;
    for (const slot of this.slots) {
      if (!slot.node?.expanded) continue;
      for (const edge of slot.node.edges) reservations += edge.reserved;
    }
    return reservations;
  }

  currentRootState() {
    const root = this.#resolve(this.rootRef);
    if (!root) fail("STALE_ROOT");
    return root.state;
  }

  searchDigest() {
    const nodes = [];
    for (const slot of this.slots) {
      const node = slot.node;
      if (!node) continue;
      nodes.push({
        state: node.state,
        generation: slot.generation,
        visits: node.visits,
        evaluationReady: node.evaluationReady,
        evaluation: node.evaluation,
        edges: node.expanded ? node.edges.map((edge) => ({
          action: edge.action,
          childState: edge.child ? this.#resolve(edge.child)?.state ?? null : null,
          visits: edge.visits,
          reserved: edge.reserved,
          valueSum: edge.valueSum,
        })) : [],
      });
    }
    nodes.sort((left, right) => left.state - right.state);
    return JSON.stringify({
      rootState: this.currentRootState(),
      rootEpoch: this.rootEpoch,
      completedWork: this.metrics.completedWork,
      nodes,
    });
  }

  metricSnapshot() {
    return { ...this.metrics, nodeCount: this.nodeCount(), outstandingWork: this.outstanding.size };
  }
}

export function expectedTopAction(engine, action) {
  const ranking = engine.latestRanking ?? engine.publishRanking();
  return ranking.entries.length > 0 && ranking.entries[0].action === action;
}
