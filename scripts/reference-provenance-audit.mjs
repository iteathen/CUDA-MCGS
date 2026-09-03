import fs from 'node:fs';
import path from 'node:path';

const fixtureRoot = 'experiments/search-semantics-reference/fixtures';
const composerEvidence = JSON.parse(fs.readFileSync('experiments/search-ir-composer-reference/build/evidence.json', 'utf8'));
const composerIdentity = composerEvidence.representationCompositionEvidenceKey;

const generated = new Map();
for (const name of ['domain','graph','policy','evaluator','resource','progress','output','session','stage']) {
  const file = `experiments/search-ir-composer-reference/build/${name}-profiles.json`;
  if (!fs.existsSync(file)) continue;
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  generated.set(name, value.projectionIdentity ?? null);
}

function identityLike(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && value.algorithm === 'sha256'
    && Number.isSafeInteger(value.byteLength)
    && typeof value.sha256 === 'string';
}

function walk(value, prefix = '') {
  const found = [];
  if (identityLike(value)) found.push([prefix || '<root>', value]);
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key;
      found.push(...walk(child, next));
    }
  }
  return found;
}

console.log(`composer=${composerIdentity.sha256}/${composerIdentity.byteLength}`);
for (const [name, identity] of generated) console.log(`projection.${name}=${identity?.sha256}/${identity?.byteLength}`);
for (const file of fs.readdirSync(fixtureRoot).filter((name) => name.endsWith('.json')).sort()) {
  const value = JSON.parse(fs.readFileSync(path.join(fixtureRoot, file), 'utf8'));
  const ids = walk(value);
  const composer = value.composerEvidence;
  const profileProjection = value.profileProjection;
  console.log(`fixture=${file} keys=${Object.keys(value).join(',')}`);
  if (identityLike(composer)) console.log(`  composerEvidence=${composer.sha256}/${composer.byteLength} current=${composer.sha256 === composerIdentity.sha256 && composer.byteLength === composerIdentity.byteLength}`);
  if (identityLike(profileProjection)) console.log(`  profileProjection=${profileProjection.sha256}/${profileProjection.byteLength}`);
  for (const [field, identity] of ids) {
    if (field === 'composerEvidence' || field === 'profileProjection') continue;
    console.log(`  identity ${field}=${identity.sha256}/${identity.byteLength}`);
  }
}
