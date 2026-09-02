import { registerStageCases as registerCoreStageCases } from './stage-cases-core.mjs';
import { registerStageReviewCases } from './stage-review-cases.mjs';

export function registerStageCases(context) {
  registerCoreStageCases(context);
  registerStageReviewCases(context);
}
