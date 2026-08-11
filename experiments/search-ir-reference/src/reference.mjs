const DOMAIN = Object.freeze({
  root: Object.freeze({ a: 'left', b: 'right' }),
  left: Object.freeze({ x: 'shared' }),
  right: Object.freeze({ y: 'shared' }),
  shared: Object.freeze({ loop: 'left', finish: 'terminal' }),
  terminal: Object.freeze({}),
});

class Ledger {
  constructor(resource) {
    this.id = resource.id;
    this.capacity = resource.capacity;
    this.claimed = 0;
    this.published = 0;
    this.retiredUnreclaimed = 0;
    this.failedReservations = 0;
    this.highWater = 0;
  }

  reserve(units = 1) {
    const live = this.claimed + this.published + this.retiredUnreclaimed;
    if (!Number.isSafeInteger(units) || units < 1 || live + units > this.capacity) {
      this.failedReservations += 1;
      return false;
    }
    this.claimed += units;
    this.highWater = Math.max(this.highWater, live + units);
    return true;
  }

  publish(units = 1) {
    if (this.claimed < units) throw new Error(`publication without claim: ${this.id}`);
    this.claimed -= units;
    this.published += units;
  }

  rollback(units = 1) {
    if (this.claimed < units) throw new Error(`rollback without claim: ${this.id}`);
    this.claimed -= units;
  }

  release(units = 1) {
    if (this.published < units) throw new Error(`release without publication: ${this.id}`);
    this.published -= units;
  }

  record() {
    return {
      capacity: this.capacity,
      claimed: this.claimed,
      published: this.published,
      'retired-unreclaimed': this.retiredUnreclaimed,
      'failed-reservations': this.failedReservations,
      'high-water': this.highWater,
    };
  }
}

function claimComposite(ledgers, parts) {
  const claimed = [];
  for (const [id, units] of parts) {
    if (!ledgers.get(id).reserve(units)) {
      for (const [claimedId, claimedUnits] of claimed.reverse()) ledgers.get(claimedId).rollback(claimedUnits);
      return { ok: false, exhausted: id };
    }
    claimed.push([id, units]);
  }
  return { ok: true, publish() { for (const [id, units] of claimed) ledgers.get(id).publish(units); } };
}

export class PublicationModel {
  constructor(channel) {
    this.channel = channel;
    this.state = channel.initialState;
    this.payload = null;
    this.terminalPublication = false;
  }

  transition(next, payload = null) {
    if (this.terminalPublication) throw new Error('PUB_CONFLICT');
    const allowed = this.channel.transitions.some(({ from, to }) => from === this.state && to === next);
    if (!allowed) throw new Error('PUB_TRANSITION');
    this.state = next;
    if (next === this.channel.readyState) this.payload = structuredClone(payload);
    if (this.channel.terminalStates.includes(next)) this.terminalPublication = true;
  }

  acquire() {
    if (this.state !== this.channel.readyState) throw new Error('PUB_NOT_READY');
    return structuredClone(this.payload);
  }
}

export class ReferenceSearch {
  constructor(ir) {
    this.ir = ir;
    this.ledgers = new Map(ir.resources.map((resource) => [resource.id, new Ledger(resource)]));
    this.nodes = [];
    this.nodeByIdentity = new Map();
    this.edges = [];
    this.edgeByKey = new Map();
    this.stopState = 'running';
    this.firstStopCause = null;
    this.completedWork = 0;
    this.appliedBackups = 0;
    this.abandonedBackups = 0;
    this.identityResolutions = 0;
    this.cycleChecks = 0;
    this.cycleCutoffs = 0;
    this.root = this.#resolveOrCreateNode('root');
  }

  #requestStop(cause) {
    if (this.firstStopCause === null) this.firstStopCause = cause;
    if (this.stopState === 'running') this.stopState = 'stop-requested';
  }

  #resolveOrCreateNode(identity) {
    this.identityResolutions += 1;
    const existing = this.nodeByIdentity.get(identity);
    if (existing !== undefined) return this.nodes[existing];
    const claim = claimComposite(this.ledgers, [['state-nodes', 1], ['state-bytes', 1], ['transposition-slots', 1]]);
    if (!claim.ok) {
      this.#requestStop(`resource-exhausted/${claim.exhausted}`);
      return null;
    }
    const node = { id: this.nodes.length, incarnation: 1, identity, state: 'ready' };
    this.nodes.push(node);
    this.nodeByIdentity.set(identity, node.id);
    claim.publish();
    return node;
  }

  #resolveOrCreateEdge(parent, action, child) {
    const key = `${parent.id}\0${action}`;
    const existing = this.edgeByKey.get(key);
    if (existing !== undefined) {
      const edge = this.edges[existing];
      if (edge.child !== child.id || edge.childIncarnation !== child.incarnation) throw new Error('GRAPH_CHILD_CONFLICT');
      return edge;
    }
    const claim = claimComposite(this.ledgers, [['parent-edges', 1], ['action-bytes', 1]]);
    if (!claim.ok) {
      this.#requestStop(`resource-exhausted/${claim.exhausted}`);
      return null;
    }
    const edge = {
      id: this.edges.length,
      parent: parent.id,
      action,
      child: child.id,
      childIncarnation: child.incarnation,
      state: 'ready',
      inFlight: 0,
      visits: 0,
      valueSum: 0,
    };
    this.edges.push(edge);
    this.edgeByKey.set(key, edge.id);
    claim.publish();
    return edge;
  }

  execute(work) {
    if (this.stopState !== 'running' || !this.root) {
      this.abandonedBackups += 1;
      return { status: 'abandoned', cause: this.firstStopCause };
    }
    const admission = claimComposite(this.ledgers, [['active-paths', 1], ['work-queue', 1]]);
    if (!admission.ok) {
      this.#requestStop(`resource-exhausted/${admission.exhausted}`);
      this.abandonedBackups += 1;
      return { status: 'abandoned', cause: this.firstStopCause };
    }
    admission.publish();
    const pathNodes = [this.root.id];
    const pathEdges = [];
    let parent = this.root;
    let cycle = false;
    for (const action of work.actions) {
      const childIdentity = DOMAIN[parent.identity]?.[action];
      if (!childIdentity) throw new Error(`DOMAIN_ACTION_INVALID:${parent.identity}:${action}`);
      const child = this.#resolveOrCreateNode(childIdentity);
      if (!child) break;
      const edge = this.#resolveOrCreateEdge(parent, action, child);
      if (!edge) break;
      pathEdges.push(edge.id);
      this.cycleChecks += 1;
      if (pathNodes.includes(child.id)) {
        cycle = true;
        this.cycleCutoffs += 1;
        break;
      }
      pathNodes.push(child.id);
      parent = child;
    }
    let status;
    if (this.stopState === 'running') {
      for (const edgeId of pathEdges) {
        const edge = this.edges[edgeId];
        edge.visits += 1;
        edge.valueSum += work.value;
      }
      this.appliedBackups += 1;
      this.completedWork += 1;
      status = cycle ? 'cycle-cutoff-applied' : 'applied';
    } else {
      this.abandonedBackups += 1;
      status = 'abandoned';
    }
    this.ledgers.get('active-paths').release(1);
    this.ledgers.get('work-queue').release(1);
    return { status, pathNodes, pathEdges, identityResolvedBeforeCycle: pathEdges.length > 0 };
  }

  finish(requestedWork) {
    if (this.stopState === 'running') this.#requestStop('budget-satisfied');
    this.stopState = 'draining';
    for (const ledger of this.ledgers.values()) {
      if (ledger.claimed !== 0) throw new Error(`RESOURCE_UNDRAINED:${ledger.id}`);
    }
    this.stopState = 'terminal';
    const completionClass = this.firstStopCause === 'budget-satisfied' && this.completedWork === requestedWork
      ? 'complete'
      : this.nodes.length > 0 ? 'valid-partial' : 'no-valid-result';
    const snapshot = {
      completionClass,
      firstStopCause: this.firstStopCause,
      completedWork: this.completedWork,
      requestedWork,
      budgetSatisfied: completionClass === 'complete',
      nodes: structuredClone(this.nodes),
      edges: structuredClone(this.edges),
      appliedBackups: this.appliedBackups,
      abandonedBackups: this.abandonedBackups,
      identityResolutions: this.identityResolutions,
      cycleChecks: this.cycleChecks,
      cycleCutoffs: this.cycleCutoffs,
      stopState: this.stopState,
      resources: Object.fromEntries([...this.ledgers].map(([id, ledger]) => [id, ledger.record()])),
    };
    validateSnapshot(snapshot);
    return snapshot;
  }
}

export function validateSnapshot(snapshot) {
  if (!['complete', 'valid-partial', 'no-valid-result'].includes(snapshot.completionClass) || snapshot.stopState !== 'terminal') throw new Error('RESULT_CLASS');
  const identities = new Set();
  const nodeIds = new Set();
  for (const node of snapshot.nodes) {
    if (node.state !== 'ready' || node.incarnation < 1 || identities.has(node.identity) || nodeIds.has(node.id)) throw new Error('GRAPH_NODE_IDENTITY');
    identities.add(node.identity);
    nodeIds.add(node.id);
  }
  for (const edge of snapshot.edges) {
    if (edge.state !== 'ready' || !nodeIds.has(edge.parent) || !nodeIds.has(edge.child) || edge.inFlight !== 0 || edge.visits < 0) throw new Error('GRAPH_EDGE_STATE');
  }
  if (snapshot.appliedBackups !== snapshot.completedWork || snapshot.appliedBackups < 0 || snapshot.abandonedBackups < 0) throw new Error('BACKUP_ACCOUNTING');
  for (const [id, ledger] of Object.entries(snapshot.resources)) {
    const live = ledger.claimed + ledger.published + ledger['retired-unreclaimed'];
    if (live < 0 || live > ledger.capacity || ledger['high-water'] > ledger.capacity || ledger['failed-reservations'] < 0) throw new Error(`RESOURCE_CONSERVATION:${id}`);
  }
  if (snapshot.completionClass === 'valid-partial' && snapshot.firstStopCause === 'budget-satisfied') throw new Error('PARTIAL_CAUSE');
  return true;
}

export function runSchedule(ir, work, order = 'fifo') {
  const search = new ReferenceSearch(ir);
  const scheduled = order === 'lifo' ? [...work].reverse() : [...work];
  for (const item of scheduled) search.execute(item);
  return search.finish(work.length);
}

export const SYNTHETIC_WORK = Object.freeze([
  Object.freeze({ id: 'left-shared-finish', actions: Object.freeze(['a', 'x', 'finish']), value: 1 }),
  Object.freeze({ id: 'right-shared-finish', actions: Object.freeze(['b', 'y', 'finish']), value: 0 }),
]);
