import { createGraphEdgeOracle as createCoreGraphEdgeOracle } from './graph-edge-core.mjs';

export function createGraphEdgeOracle(options = {}) {
  const oracle = createCoreGraphEdgeOracle(options);
  if (options.mutations?.allowChildBeforeAction !== true) return oracle;

  return Object.freeze({
    ...oracle,
    resolveEdgeChild(input) {
      try {
        return oracle.resolveEdgeChild(input);
      } catch (error) {
        if (error.code !== 'GRAPH_EDGE_ACTION_NOT_READY') throw error;
        oracle.publishEdgeAction({ claimer: input.claimer, edgeId: input.edgeId });
        return oracle.resolveEdgeChild(input);
      }
    },
  });
}
