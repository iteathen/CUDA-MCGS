import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { sourceTextSha256 } from './canonical.mjs';
import { registerStageCases as registerCoreStageCases } from './stage-cases-core.mjs';
import { registerStageReviewCases } from './stage-review-cases.mjs';

export const STAGE_CASE_SOURCE_HASHES = Object.freeze({
  'stage-cases-core.mjs': '78af7a37914055671e4b7bbcf93ddd089be7e99bd7705648b813fe50623d8e78',
  'stage-review-cases.mjs': '0ff75d446541e4695047b3d04c35314095671213f3d7540f3802db938e5a2beb',
});

for (const [name, expected] of Object.entries(STAGE_CASE_SOURCE_HASHES)) {
  const actual = sourceTextSha256(readFileSync(fileURLToPath(new URL(`./${name}`, import.meta.url))));
  assert.equal(actual, expected, `${name} changed without rebinding the Stage evidence registration source`);
}

export function registerStageCases(context) {
  registerCoreStageCases(context);
  registerStageReviewCases(context);
}
