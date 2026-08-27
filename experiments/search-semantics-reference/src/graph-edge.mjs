import { createGraphEdgeOracle as createCoreGraphEdgeOracle } from './graph-edge-core.mjs';

export function createGraphEdgeOracle(options = {}) {
  const oracle = createCoreGraphEdgeOracle(options);

  const facade = {
    ...oracle,
    failExpansion(input) {
      const snapshot = oracle.snapshot();
      for (const edge of snapshot.edges) {
        if (edge.expansionId !== input.expansionId || !edge.batchPublished || !['action-ready', 'child-pending'].includes(edge.state)) continue;
        oracle.failEdge({ claimer: input.claimer, edgeId: edge.id, code: input.code });
      }
      return oracle.failExpansion(input);
    },
  };

  if (options.mutations?.allowChildBeforeAction === true) {
    facade.resolveEdgeChild = (input) => {
      try {
        return oracle.resolveEdgeChild(input);
      } catch (error) {
        if (error.code !== 'GRAPH_EDGE_ACTION_NOT_READY') throw error;
        oracle.publishEdgeAction({ claimer: input.claimer, edgeId: input.edgeId });
        return oracle.resolveEdgeChild(input);
      }
    };
  }

  return Object.freeze(facade);
}
