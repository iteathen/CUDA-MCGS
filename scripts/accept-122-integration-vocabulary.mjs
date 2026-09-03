import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const file = path.join(process.cwd(), 'experiments', 'search-semantics-reference', 'run-integration.mjs');
let text = await readFile(file, 'utf8');

const oldStatus = "for (const route of nativeRoutes) assert.equal(route.evidenceStatus, 'deferred', `${route.contract}:${route.requirementPrefix} native route must remain deferred`);";
const acceptedStatus = "for (const route of nativeRoutes) assert.equal(route.evidenceStatus, 'deferred-native', `${route.contract}:${route.requirementPrefix} native route must remain deferred`);";

const matches = text.split(oldStatus).length - 1;
if (matches !== 1) throw new Error(`accept-122 integration native-status guard drifted; expected 1 proposal-era assertion, found ${matches}`);
if (text.includes(acceptedStatus)) throw new Error('accept-122 integration native-status guard is already accepted before one-shot migration');

text = text.replace(oldStatus, acceptedStatus);
await writeFile(file, text, 'utf8');
console.log('accept-122 final integration native route status migrated deferred -> deferred-native');
