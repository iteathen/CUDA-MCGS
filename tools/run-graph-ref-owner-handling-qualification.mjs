import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const file = 'tools/graph-ref-owner-handling-migration.mjs';
let text = fs.readFileSync(file, 'utf8');
const staticBlock = /\nimport \{ inspectCatalog, sourceTextSha256 \} from '\.\.\/experiments\/search-ir-composer-reference\/src\/catalog\.mjs';[\s\S]*?import \{ buildOutputProfiles \} from '\.\.\/experiments\/search-ir-composer-reference\/src\/output-fixtures\.mjs';\n/;
if (!staticBlock.test(text)) throw new Error('migration static Composer import block not found');
text = text.replace(staticBlock, '\n');

const marker = "const contractSetInput = readJson(path.join(schemaRoot, 'contract-set.json'));";
const dynamic = `const { inspectCatalog, sourceTextSha256 } = await import('../experiments/search-ir-composer-reference/src/catalog.mjs');
const { normalizeDomainProfile } = await import('../experiments/search-ir-composer-reference/src/domain.mjs');
const { buildDomainProfiles } = await import('../experiments/search-ir-composer-reference/src/domain-fixtures.mjs');
const { normalizeGraphProfile } = await import('../experiments/search-ir-composer-reference/src/graph.mjs');
const { buildGraphProfiles } = await import('../experiments/search-ir-composer-reference/src/graph-fixtures.mjs');
const { normalizeEvaluatorProfile } = await import('../experiments/search-ir-composer-reference/src/evaluator.mjs');
const { buildEvaluatorProfiles } = await import('../experiments/search-ir-composer-reference/src/evaluator-fixtures.mjs');
const { normalizePolicyProfile } = await import('../experiments/search-ir-composer-reference/src/policy.mjs');
const { buildPolicyProfiles } = await import('../experiments/search-ir-composer-reference/src/policy-fixtures.mjs');
const { normalizeResourceProfile } = await import('../experiments/search-ir-composer-reference/src/resource.mjs');
const { buildResourceProfiles } = await import('../experiments/search-ir-composer-reference/src/resource-fixtures.mjs');
const { normalizeProgressProfile } = await import('../experiments/search-ir-composer-reference/src/progress.mjs');
const { buildProgressProfiles } = await import('../experiments/search-ir-composer-reference/src/progress-fixtures.mjs');
const { normalizeOutputProfile } = await import('../experiments/search-ir-composer-reference/src/output.mjs');
const { buildOutputProfiles } = await import('../experiments/search-ir-composer-reference/src/output-fixtures.mjs');

`;
const first = text.indexOf(marker);
if (first < 0 || text.indexOf(marker, first + 1) >= 0) throw new Error('migration identity phase marker is not unique');
text = text.slice(0, first) + dynamic + text.slice(first);
fs.writeFileSync(file, text);

execFileSync(process.execPath, [file], { stdio: 'inherit' });
