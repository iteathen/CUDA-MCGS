import { registerProgressFairnessCases } from './progress-fairness-cases.mjs';
import { registerProgressNoProgressCases } from './progress-no-progress-cases.mjs';
import { registerProgressSensitivityCases } from './progress-sensitivity-cases.mjs';
import { registerProgressStopLifecycleCases } from './progress-stop-lifecycle-cases.mjs';
import { registerProgressWorkReadinessCases } from './progress-work-readiness-cases.mjs';

function allRequiredIds(prefix, count) {
  return Array.from({ length: count }, (_, index) => `${prefix}${String(index + 1).padStart(3, '0')}`);
}

export const DIRECT_PROGRESS_REQUIREMENTS = [
  ...allRequiredIds('PROGRESS-WORK-', 7),
  ...allRequiredIds('PROGRESS-FAIR-', 6),
  ...allRequiredIds('PROGRESS-NOPROGRESS-', 7),
  ...allRequiredIds('PROGRESS-STOP-', 7),
  ...allRequiredIds('PROGRESS-LIFE-', 4),
];

export function registerProgressCases(context) {
  registerProgressWorkReadinessCases(context);
  registerProgressFairnessCases(context);
  registerProgressNoProgressCases(context);
  registerProgressStopLifecycleCases(context);
  registerProgressSensitivityCases(context);
}
