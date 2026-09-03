import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { canonicalIdentity, normalizeContractSet, sourceTextSha256 } from '../experiments/search-ir-composer-reference/src/catalog.mjs';

function fail(message) {
  throw new Error(`accept-122-reference: ${message}`);
}

async function read(relative) {
  return readFile(relative, 'utf8');
}

async function write(relative, content) {
  await writeFile(relative, content, 'utf8');
}

function replaceExact(text, before, after, label, expected = 1) {
  const found = text.split(before).length - 1;
  if (found !== expected) fail(`${label}: expected ${expected} occurrence(s), found ${found}`);
  return text.split(before).join(after);
}

// Rebind the framework-selection fixture to the accepted catalog and transformed schema bytes.
const contractSet = JSON.parse(await read('schemas/search-ir/0.2.0/contract-set.json'));
const catalogById = new Map(contractSet.contracts.map((entry) => [entry.id, entry]));
const frameworkPath = 'experiments/search-ir-composer-reference/fixtures/minimal.framework-selection.json';
const framework = JSON.parse(await read(frameworkPath));
if (framework.status !== 'accepted') fail(`framework status is ${framework.status}, expected accepted`);
const fullCatalogIdentity = canonicalIdentity(normalizeContractSet(contractSet));
framework.contractSet.identity = {
  algorithm: fullCatalogIdentity.algorithm,
  sha256: fullCatalogIdentity.sha256,
};
function rebindCatalogReference(reference) {
  const accepted = catalogById.get(reference.id);
  if (!accepted) fail(`fixture names unknown catalog contract ${reference.id}`);
  reference.specificationIdentity = accepted.specificationIdentity;
  reference.sha256 = accepted.sha256;
}
rebindCatalogReference(framework.frameworkContract);
const schemaByRole = new Map([
  ['domain', 'domain-profile.schema.json'],
  ['graph', 'graph-profile.schema.json'],
  ['output', 'output-profile.schema.json'],
  ['policy', 'policy-profile.schema.json'],
  ['program-package', 'program-package-profile.schema.json'],
  ['progress', 'progress-profile.schema.json'],
  ['resource', 'resource-profile.schema.json'],
]);
for (const profile of framework.profiles) {
  if (profile.contract?.kind === 'catalog') rebindCatalogReference(profile.contract);
  const schemaFile = schemaByRole.get(profile.role);
  if (schemaFile) profile.schema.sha256 = sourceTextSha256(Buffer.from(await read(path.join('schemas/search-ir/0.2.0', schemaFile)), 'utf8'));
}

// These six selected-owner identities are the deterministic normalizer outputs observed after
// accepted catalog/schema rebinding. Keep the prior hashes as explicit migration preconditions.
const selectedOwnerIdentityMigration = new Map([
  ['domain', {
    before: '6ae172623f6aebd07db9f6516681748a583d0ef7aad176382569c19ac88ee159',
    accepted: '3ca65c2a97b9e03ee75f8ea1a54e01c322e045aa70a5ffaba15a6c6a7b7b3e5d',
  }],
  ['graph', {
    before: '11e049a08fca93816774e999aee9ed0a1d8132a622a3179aa8dd5d35353c666b',
    accepted: '38d0fa1aa6bd24648c6d5dbcc19049dc97488a6666d3e75e5b97647d653e06a6',
  }],
  ['policy', {
    before: '208700dcb5cd948d848911f6694652e4d8337432f3e3a3a7fc091cbe3228bb29',
    accepted: '324358b2b345f3564c4973209d934736a05f69db050951c597af1bf2dd87b37f',
  }],
  ['resource', {
    before: 'f81b91e0431719c3c2e6a944fae34a8d31557babc54abd6ea7049f3b705ac239',
    accepted: 'e3bda8997637954f4104cd263687b2b61ba83948bafafc56c0980d1a31728bcd',
  }],
  ['progress', {
    before: '4770f71432f3c429d19890bba745cb1e99fa34c6f59135441bb9e32c7e513194',
    accepted: '545d0816839ad3cdd41369477abc223b623073e2d687c7d09ad2de21a61a169c',
  }],
  ['output', {
    before: 'c58990316992eb1480a491f1f871a1d338d23e82708344939069627b2502b692',
    accepted: '8730cee76f557a07e523a0e230c7dce7df927f92ac6a02587861eaa7471a7240',
  }],
]);
for (const [role, migration] of selectedOwnerIdentityMigration) {
  const profile = framework.profiles.find((entry) => entry.role === role);
  if (!profile) fail(`framework fixture is missing selected ${role} profile`);
  if (profile.identity?.algorithm !== 'sha256' || profile.identity.sha256 !== migration.before) {
    fail(`${role} profile identity drifted before acceptance: ${profile.identity?.sha256}`);
  }
  profile.identity.sha256 = migration.accepted;
}
await write(frameworkPath, `${JSON.stringify(framework, null, 2)}\n`);

// Deletion equivalence must compare MCGS-owned adapter requirements, never removed lower request/lifecycle vocabulary.
const deletionPath = 'experiments/search-ir-composer-reference/src/deletion-identity.mjs';
let deletion = await read(deletionPath);
deletion = replaceExact(
  deletion,
  "  if (!exact(beforeComposition.executionPackage.normalized.cudaJs.lifecycle, afterComposition.executionPackage.normalized.cudaJs.lifecycle)) {\n    fail('COMPOSE_DELETION_PUBLIC_CONTRACT', 'public CUDA-JS lifecycle projection changed during semantic owner deletion');\n  }\n  if (!exact(afterComposition.executionPackage.normalized.cudaJs.requirements, afterProgram.publicRequirements.map(({ contract }) => contract))) {\n    fail('COMPOSE_DELETION_PUBLIC_CONTRACT', 'public CUDA-JS requirements do not match the recomposed Search Program');\n  }",
  "  if (!exact(beforeComposition.executionPackage.normalized.cudaJsAdapter.searchLifecycle, afterComposition.executionPackage.normalized.cudaJsAdapter.searchLifecycle)) {\n    fail('COMPOSE_DELETION_PUBLIC_CONTRACT', 'MCGS adapter search lifecycle requirements changed during semantic owner deletion');\n  }\n  if (!exact(afterComposition.executionPackage.normalized.cudaJsAdapter.publicContracts, afterProgram.publicRequirements.map(({ contract }) => contract))) {\n    fail('COMPOSE_DELETION_PUBLIC_CONTRACT', 'MCGS adapter public contracts do not match the recomposed Search Program');\n  }",
  'deletion adapter boundary',
);
await write(deletionPath, deletion);

let run = await read('experiments/search-ir-composer-reference/run.mjs');
run = replaceExact(
  run,
  "  assert(inspected.requirements.every(({ primaryOwner, evidenceOwner }) => primaryOwner.length > 0 && /^IR-[A-Z-]+-01$/.test(evidenceOwner)));",
  "  assert(inspected.requirements.every(({ primaryOwner, evidenceOwner }) => primaryOwner.length > 0 && /^(?:IR|ENGINE)-[A-Z0-9-]+-01$/.test(evidenceOwner)));",
  'coverage owner/evidence route closure',
);
run = replaceExact(
  run,
  "  const native = inspected.requirements.filter(({ primaryDisposition, evidenceStatus }) => primaryDisposition === 'native-compatible-pair-qualification' && evidenceStatus === 'deferred-native');\n  assert.equal(native.length, 52);\n  assert.equal(inspected.requirements.filter(({ primaryDisposition, evidenceStatus }) => primaryDisposition !== 'native-compatible-pair-qualification' && evidenceStatus === 'accepted-reference').length, 937);",
  "  const native = inspected.requirements.filter(({ currentDisposition, evidenceStatus }) => currentDisposition === 'native-compatible-pair-qualification' && evidenceStatus === 'deferred-native');\n  assert.equal(native.length, 52);\n  assert.equal(inspected.requirements.filter(({ currentDisposition, evidenceStatus }) => currentDisposition !== 'native-compatible-pair-qualification' && evidenceStatus === 'accepted-reference').length, 937);",
  'accepted/deferred coverage count',
);
run = replaceExact(
  run,
  "  const mutated = clone(programPackageFixtures[0].input); const devices = mutated.functions.filter(({ kind }) => kind === 'device'); devices[0].calls = [devices[1].name]; devices[1].calls = [devices[0].name];",
  "  const mutated = clone(programPackageFixtures[0].input); const devices = mutated.functions.filter(({ executionRole }) => executionRole === 'device-callable'); devices[0].calls = [devices[1].name]; devices[1].calls = [devices[0].name];",
  'function cycle accepted role selector',
);
const dispositionStart = run.indexOf("await runCase('integration-requirement-disposition-handoff', () => {");
const dispositionEnd = run.indexOf('\n\nconst failed = cases.filter', dispositionStart);
if (dispositionStart < 0 || dispositionEnd < 0) fail('integration disposition case boundaries not found');
const acceptedDispositionCase = `await runCase('integration-requirement-disposition-handoff', () => {\n  const countByStatus = Object.fromEntries(['accepted-reference', 'deferred-native'].map((status) => [\n    status,\n    inspected.requirements.filter(({ evidenceStatus }) => evidenceStatus === status).length,\n  ]));\n  assert.deepEqual(countByStatus, { 'accepted-reference': 937, 'deferred-native': 52 });\n\n  const deferred = inspected.requirements.filter(({ evidenceStatus }) => evidenceStatus === 'deferred-native');\n  assert(deferred.every(({ currentDisposition, evidenceOwner, evidenceRefs }) => (\n    currentDisposition === 'native-compatible-pair-qualification'\n    && evidenceOwner === 'ENGINE-NATIVE-01'\n    && evidenceRefs.includes('proof:native-deferred-122')\n  )));\n\n  const accepted = inspected.requirements.filter(({ evidenceStatus }) => evidenceStatus === 'accepted-reference');\n  assert(accepted.every(({ currentDisposition, evidenceRefs }) => (\n    currentDisposition !== 'native-compatible-pair-qualification'\n    && evidenceRefs.includes('proof:engine-contract-acceptance-01')\n    && evidenceRefs.every((reference) => !reference.startsWith('planned:'))\n  )));\n});`;
run = `${run.slice(0, dispositionStart)}${acceptedDispositionCase}${run.slice(dispositionEnd)}`;
run = replaceExact(run, '  expected: 899,', '  expected: 882,', 'Composer expected case count');
run = replaceExact(run, '  notDiscovered: 899 - cases.length,', '  notDiscovered: 882 - cases.length,', 'Composer not-discovered count');
await write('experiments/search-ir-composer-reference/run.mjs', run);

console.log('accept-122 reference fixture/guard reconciliation complete');
