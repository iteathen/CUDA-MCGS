import { readFile, writeFile } from 'node:fs/promises';

const OLD_COMPOSER = {
  algorithm: 'sha256',
  byteLength: 729040,
  sha256: '1bf7703fc7758c18f0f74e7573eb126410f8ad09b1e60145cbeaccdef20e10e2',
};
const ACCEPTED_COMPOSER = {
  algorithm: 'sha256',
  byteLength: 709315,
  sha256: 'd8b6890ae4fc18e39618cd172e59fd0dedad465e48ae80e5442142235be7c4b4',
};
const OLD_DOMAIN_PROJECTION = {
  schema: 'cuda-mcgs.search-ir-composer-domain-profile-projection/0.2.0',
  algorithm: 'sha256',
  byteLength: 69524,
  sha256: '114b41e58986f236c9de0bcb013afa8763bb1bef5b91d222f1a9a6fa174ae223',
};
const ACCEPTED_DOMAIN_PROJECTION = {
  schema: 'cuda-mcgs.search-ir-composer-domain-profile-projection/0.2.0',
  algorithm: 'sha256',
  byteLength: 69473,
  sha256: '45027b1ca244d47a1c8a82cc37ec10a27e1b2c6f740a93e083333a4f507cb8ee',
};

function fail(message) {
  throw new Error(`accept-122-search-semantics: ${message}`);
}

function same(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const neutralPath = 'experiments/search-semantics-reference/fixtures/neutral-schedules.json';
const neutral = await readJson(neutralPath);
if (!same(neutral.composerEvidence, OLD_COMPOSER)) {
  fail(`neutral fixture Composer identity drifted: ${JSON.stringify(neutral.composerEvidence)}`);
}
const schedules = Object.values(neutral.schedules ?? {});
if (schedules.length !== 3 || schedules.some(({ evidenceKey }) => evidenceKey !== OLD_COMPOSER.sha256)) {
  fail('neutral schedule evidence keys are not the exact pre-acceptance Composer identity');
}
neutral.composerEvidence = { ...ACCEPTED_COMPOSER };
for (const schedule of schedules) schedule.evidenceKey = ACCEPTED_COMPOSER.sha256;
await writeJson(neutralPath, neutral);

const domainPath = 'experiments/search-semantics-reference/fixtures/domain-cases.json';
const domain = await readJson(domainPath);
if (!same(domain.composerEvidence, OLD_COMPOSER)) {
  fail(`Domain fixture Composer identity drifted: ${JSON.stringify(domain.composerEvidence)}`);
}
if (!same(domain.profileProjection, OLD_DOMAIN_PROJECTION)) {
  fail(`Domain projection identity drifted: ${JSON.stringify(domain.profileProjection)}`);
}
domain.composerEvidence = { ...ACCEPTED_COMPOSER };
domain.profileProjection = { ...ACCEPTED_DOMAIN_PROJECTION };
await writeJson(domainPath, domain);

const runPath = 'experiments/search-semantics-reference/run.mjs';
let run = await readFile(runPath, 'utf8');
const before = `const domainRequirementClassifications = requirementCoverage.classifications.filter((entry) =>\n  entry.contract === 'SPEC-0007'\n  && directDomainPrefixes.includes(entry.requirementPrefix)\n  && entry.primaryDisposition === 'engine-reference-oracle'\n  && entry.plannedEvidenceOwner === 'ENGINE-REFERENCE-01');`;
const after = `const domainRequirementClassifications = requirementCoverage.classifications.filter((entry) =>\n  entry.contract === 'SPEC-0007'\n  && directDomainPrefixes.includes(entry.requirementPrefix)\n  && entry.primaryDisposition === 'engine-reference-oracle'\n  && entry.evidenceOwner === 'ENGINE-REFERENCE-01'\n  && entry.evidenceStatus === 'accepted-reference');`;
const count = run.split(before).length - 1;
if (count !== 1) fail(`Domain accepted-evidence filter expected once, found ${count}`);
run = run.replace(before, after);
await writeFile(runPath, run, 'utf8');

console.log('accept-122 search-semantics bridge rebound to accepted Composer/Domain evidence');
