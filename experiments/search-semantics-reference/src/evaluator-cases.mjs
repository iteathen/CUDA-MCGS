import { registerEvaluatorBatchCases } from './evaluator-batch-cases.mjs';
import { registerEvaluatorCacheCases } from './evaluator-cache-cases.mjs';
import { registerEvaluatorLifecycleCases } from './evaluator-lifecycle-cases.mjs';
import { registerEvaluatorRequestCases } from './evaluator-request-cases.mjs';
import { registerEvaluatorReuseCleanupCases } from './evaluator-reuse-cleanup-cases.mjs';
import { registerEvaluatorSensitivityCases } from './evaluator-sensitivity-cases.mjs';

function allRequiredIds(prefix, count) { return Array.from({ length: count }, (_, index) => `${prefix}${String(index + 1).padStart(3, '0')}`); }

export const DIRECT_EVALUATOR_REQUIREMENTS = [
  ...allRequiredIds('EVAL-REQUEST-', 10),
  ...allRequiredIds('EVAL-BATCH-', 10),
  ...allRequiredIds('EVAL-CACHE-', 8),
  ...allRequiredIds('EVAL-REUSE-', 6),
  ...allRequiredIds('EVAL-CLEANUP-', 3),
];

export function registerEvaluatorCases(context) {
  registerEvaluatorRequestCases(context);
  registerEvaluatorBatchCases(context);
  registerEvaluatorCacheCases(context);
  registerEvaluatorReuseCleanupCases(context);
  registerEvaluatorLifecycleCases(context);
  registerEvaluatorSensitivityCases(context);
}
