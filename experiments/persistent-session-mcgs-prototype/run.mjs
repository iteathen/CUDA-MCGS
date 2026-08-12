import { PersistentMcgsPrototype, expectedTopAction } from "./src/model.mjs";

const cases = [];
function test(id, fn) {
  cases.push({ id, fn });
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function assertCode(fn, expected) {
  try {
    fn();
  } catch (error) {
    assert(error?.code === expected, `expected ${expected}, got ${error?.code ?? error}`);
    return error;
  }
  throw new Error(`expected ${expected} to throw`);
}

function topAction(engine) {
  return engine.latestRanking?.entries?.[0]?.action ?? null;
}

function summarize(engine) {
  const metrics = engine.metricSnapshot();
  return `epoch=${engine.rootEpoch} root=${engine.currentRootState()} completed=${metrics.completedWork} nodes=${metrics.nodeCount} ` +
    `evals=${metrics.evaluations} reroots=${metrics.reroots} stale=${metrics.abandonedStaleWork} ` +
    `publishes=${metrics.rankingPublishes} reclaims=${metrics.reclaimedNodes}`;
}

test("live-ranking-running", () => {
  const engine = new PersistentMcgsPrototype();
  const first = engine.search(128, { publishEvery: 64 });
  const frozenEntries = JSON.stringify(first.entries);
  const second = engine.search(384, { publishEvery: 64 });
  assert(engine.status === "running", "search session stopped unexpectedly");
  assert(first.rootEpoch === 1 && second.rootEpoch === 1, "root epoch changed without reroot");
  assert(first.generation < second.generation, "ranking generation did not advance");
  assert(first.completedWork === 128 && second.completedWork === 512, "ranking progress metadata is wrong");
  assert(JSON.stringify(first.entries) === frozenEntries, "published snapshot mutated after publication");
  assert(Object.isFrozen(first) && Object.isFrozen(first.entries), "ranking snapshot is not immutable");
  assert(expectedTopAction(engine, 0), "stronger root action did not lead live ranking");
  return summarize(engine);
});

test("ranking-cadence-decoupled", () => {
  const eager = new PersistentMcgsPrototype();
  const batched = new PersistentMcgsPrototype();
  eager.search(512, { publishEvery: 1 });
  batched.search(512, { publishEvery: 64 });
  assert(eager.searchDigest() === batched.searchDigest(), "ranking cadence changed search state");
  assert(topAction(eager) === topAction(batched) && topAction(eager) === 0, "cadence changed top action");
  assert(eager.metrics.rankingPublishes === 512, "eager publication count mismatch");
  assert(batched.metrics.rankingPublishes === 8, "batched publication count mismatch");
  assert(eager.metrics.rankingSorts === 64 * batched.metrics.rankingSorts, "ranking sort reduction mismatch");
  return `same_search=true eager_publishes=${eager.metrics.rankingPublishes} batched_publishes=${batched.metrics.rankingPublishes}`;
});

test("transposition-edge-local-statistics", () => {
  const engine = new PersistentMcgsPrototype();
  engine.search(1024, { publishEvery: 128 });
  const state4 = engine.getNodeRefByState(4);
  const from1 = engine.getEdge(1, 1);
  const from2 = engine.getEdge(2, 0);
  assert(state4 && from1 && from2, "transposition graph was not materialized");
  assert(from1.childState === 4 && from2.childState === 4, "incoming edges do not share state 4");
  assert(from1.parentRef.slot !== from2.parentRef.slot, "incoming edge owners collapsed");
  assert(from1.visits > 0 && from2.visits > 0, "edge-local statistics were not populated");
  assert(engine.nodeCount() === 7, "transposition created duplicate state nodes");
  return summarize(engine);
});

test("reroot-reuses-retained-state", () => {
  const engine = new PersistentMcgsPrototype();
  engine.search(1024, { publishEvery: 128 });
  const state2Before = engine.getNodeRefByState(2);
  const evaluationsBefore = engine.metrics.evaluations;
  const allocationsBefore = engine.metrics.nodeAllocations;
  const oldRanking = engine.latestRanking;
  engine.rerootByAction(1);
  assert(engine.currentRootState() === 2 && engine.rootEpoch === 2, "reroot did not accept state 2");
  assert(engine.latestRanking === oldRanking && oldRanking.rootEpoch === 1 && oldRanking.rootEpoch !== engine.rootEpoch, "old ranking did not remain safely epoch-distinguishable until republish");
  assert(JSON.stringify(engine.getNodeRefByState(2)) === JSON.stringify(state2Before), "reroot replaced retained state node");
  engine.search(256, { publishEvery: 64 });
  assert(engine.metrics.evaluations === evaluationsBefore, "reroot caused retained evaluator state to be recomputed");
  assert(engine.metrics.nodeAllocations === allocationsBefore, "reroot allocated duplicate retained nodes");
  assert(engine.latestRanking.rootEpoch === 2 && engine.latestRanking.rootState === 2, "live ranking not scoped to new root epoch");
  return summarize(engine);
});

test("stale-work-rejected-after-reroot", () => {
  const engine = new PersistentMcgsPrototype();
  engine.search(256, { publishEvery: 64 });
  const completedBefore = engine.metrics.completedWork;
  const work = Array.from({ length: 32 }, () => engine.beginSimulation());
  assert(engine.totalReservations() > 0, "beginSimulation did not reserve path work");
  engine.rerootByAction(1);
  for (const pending of work) {
    const outcome = engine.commitSimulation(pending);
    assert(!outcome.applied && outcome.reason === "stale-root-epoch", "old epoch work was applied");
  }
  assert(engine.metrics.completedWork === completedBefore, "stale work changed completed statistics");
  assert(engine.totalReservations() === 0, "stale work leaked reservations");
  assert(engine.metrics.abandonedStaleWork === 32, "stale-work abandonment was not accounted");
  return summarize(engine);
});

test("reclamation-defers-and-reuses-generations", () => {
  const engine = new PersistentMcgsPrototype({ capacity: 7 });
  engine.search(1024, { publishEvery: 128 });
  assert(engine.nodeCount() === 7, "initial graph did not fill finite arena");
  const staleState1 = engine.getNodeRefByState(1);
  const work = engine.beginSimulation();
  engine.rerootByAction(1);
  const deferred = engine.reclaimUnreachable();
  assert(deferred.deferred && deferred.reclaimed === 0, "reclamation ignored outstanding work");
  assert(engine.commitSimulation(work).reason === "stale-root-epoch", "old work was not abandoned before reclaim");
  const reclaimed = engine.reclaimUnreachable();
  assert(!reclaimed.deferred && reclaimed.reclaimed === 3, `expected 3 reclaimed nodes, got ${reclaimed.reclaimed}`);
  assert(engine.resolveRef(staleState1) === null, "stale node reference survived generation change");
  assert(engine.nodeCount() === 4, "unexpected retained node count after reroot reclaim");
  engine.replaceRoot(10);
  engine.search(128, { publishEvery: 32 });
  assert(engine.nodeCount() === 7, "replacement-root search did not reuse finite slots");
  assert(engine.metrics.slotReuses >= 3, "reclaimed slots were not reused");
  assert(engine.currentRootState() === 10 && engine.latestRanking.entries[0].action === 0, "replacement-root ranking is wrong");
  assert(engine.resolveRef(staleState1) === null, "reused slot resurrected stale reference");
  return summarize(engine);
});

test("many-epoch-bounded-memory", () => {
  const engine = new PersistentMcgsPrototype({ maxRootEpoch: 4096 });
  engine.search(1024, { publishEvery: 128 });
  const allocations = engine.metrics.nodeAllocations;
  const evaluations = engine.metrics.evaluations;
  engine.rerootByAction(1); // 0 -> 2
  for (let index = 0; index < 1000; index += 1) {
    engine.search(8, { publishEvery: 8 });
    if (engine.currentRootState() === 2) {
      engine.rerootByAction(1); // 2 -> 5
    } else {
      assert(engine.currentRootState() === 5, "unexpected root during cycle reroot loop");
      engine.rerootByAction(1); // 5 -> 2
    }
    assert(engine.nodeCount() === 7, "node arena grew during repeated reroots");
  }
  engine.search(8, { publishEvery: 8 });
  assert(engine.metrics.nodeAllocations === allocations, "repeated reroot allocated new graph nodes");
  assert(engine.metrics.evaluations === evaluations, "repeated reroot recomputed retained evaluations");
  assert(engine.rootEpoch === 1002, `unexpected root epoch ${engine.rootEpoch}`);
  assert(engine.latestRanking.rootEpoch === engine.rootEpoch, "live ranking fell behind accepted root epoch");
  return summarize(engine);
});

test("root-epoch-exhaustion-fails-closed", () => {
  const engine = new PersistentMcgsPrototype({ maxRootEpoch: 3 });
  engine.search(256, { publishEvery: 64 });
  engine.rerootByAction(1); // epoch 2, state 2
  engine.search(64, { publishEvery: 32 });
  engine.rerootByAction(1); // epoch 3, state 5
  const before = engine.currentRootState();
  assertCode(() => engine.rerootByAction(1), "ROOT_EPOCH_EXHAUSTED");
  assert(engine.rootEpoch === 3 && engine.currentRootState() === before, "root epoch exhaustion mutated accepted root");
  return summarize(engine);
});

test("ranking-generation-exhaustion-fails-closed", () => {
  const engine = new PersistentMcgsPrototype({ maxRankingGeneration: 2 });
  const first = engine.publishRanking();
  const second = engine.publishRanking();
  assert(first.generation === 1 && second.generation === 2, "ranking generations incorrect before exhaustion");
  assertCode(() => engine.publishRanking(), "RANKING_GENERATION_EXHAUSTED");
  assert(engine.latestRanking === second && engine.rankingGeneration === 2, "ranking exhaustion mutated last good publication");
  return summarize(engine);
});

test("oracle-sensitivity", () => {
  const engine = new PersistentMcgsPrototype();
  engine.search(512, { publishEvery: 64 });
  assert(expectedTopAction(engine, 0), "baseline oracle does not recognize expected best action");
  assert(!expectedTopAction(engine, 1), "mutated wrong-root-action oracle was not rejected");
  return summarize(engine);
});

let passed = 0;
for (const entry of cases) {
  try {
    const detail = entry.fn();
    passed += 1;
    console.log(`test=${entry.id} result=pass ${detail}`);
  } catch (error) {
    console.log(`test=${entry.id} result=fail error=${JSON.stringify(error?.stack ?? String(error))}`);
  }
}

const expected = cases.length;
const failed = expected - passed;
console.log(`capsule=session-001 expected=${expected} discovered=${expected} executed=${expected} passed=${passed} failed=${failed} required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=0`);
process.exitCode = failed === 0 ? 0 : 1;
