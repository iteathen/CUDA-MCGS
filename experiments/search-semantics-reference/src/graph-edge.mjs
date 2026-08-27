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
        const resolution = options.resolveChild({ parent: null, action: null, occurrence: null, input: input.input });
        if (resolution?.kind === 'ready') return { kind: 'ready', edgeId: input.edgeId, child: resolution.reference };
        if (resolution?.kind === 'pending') return { kind: 'pending', edgeId: input.edgeId, reference: resolution.reference };
        if (resolution?.kind === 'pressure') return { kind: 'pressure', code: resolution.code };
        return { kind: 'failed', edgeId: input.edgeId, code: resolution?.code ?? 'graph-internal-failure' };
      }
    },
  });
}
