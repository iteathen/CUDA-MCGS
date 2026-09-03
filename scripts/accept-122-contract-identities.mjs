import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const primitivePath = 'schemas/search-ir/0.2.0/primitives.schema.json';
const primitives = JSON.parse(await readFile(primitivePath, 'utf8'));
const contractReference = primitives.$defs?.catalogContractReference?.properties?.specificationIdentity;
if (contractReference?.pattern !== '^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\\.[0-9]+\\.[0-9]+-draft$') {
  throw new Error(`accept-122-identities: unexpected primitive contract-reference pattern ${contractReference?.pattern}`);
}
contractReference.pattern = '^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\\.[0-9]+\\.[0-9]+$';
primitives.description = 'Representation-only primitives shared by accepted Search IR owner schemas. Semantic meaning remains with the referencing owner contract.';
await writeFile(primitivePath, `${JSON.stringify(primitives, null, 2)}\n`, 'utf8');

const sourceRoot = 'experiments/search-ir-composer-reference/src';
let replacements = 0;
for (const entry of await readdir(sourceRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.mjs')) continue;
  const file = path.join(sourceRoot, entry.name);
  let text = await readFile(file, 'utf8');
  const before = text;
  const matches = text.match(/-draft\$\//g) ?? [];
  replacements += matches.length;
  text = text.replaceAll('-draft$/', '$/');
  if (text !== before) await writeFile(file, text, 'utf8');
}
if (replacements < 10) {
  throw new Error(`accept-122-identities: expected catalog identity validators across owner modules; found only ${replacements}`);
}
console.log(`accept-122 accepted contract-reference validators migrated=${replacements}`);
