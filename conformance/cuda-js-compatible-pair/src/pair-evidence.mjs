import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertExactExecutionPackage, executionBindings } from './capsule.mjs';

const CUDA_MCGS_REPOSITORY = 'iteathen/CUDA-MCGS';
const CUDA_JS_REPOSITORY = 'iteathen/CUDA-JS';
const SOURCE_EXTENSIONS = new Set(['.mjs', '.js', '.cjs', '.d.ts', '.json']);
const FORBIDDEN_LOWER_VOCABULARY = Object.freeze([
  /cuda[-_]mcgs/i,
  /\bsearchProgram\b/,
  /\bSearch Program\b/,
  /search[-_. ]policy/i,
  /search[-_. ]graph/i,
  /program[-_. ]package\.compatible[-_. ]pair/i,
  /channel\.synthetic/i,
  /output\.synthetic/i,
]);

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function git(root, ...args) {
  try {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  } catch (error) {
    fail('PAIR_SOURCE_CHECKOUT', `cannot inspect Git checkout at ${root}: ${error.message}`);
  }
}

function githubRepository(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\\/g, '/');
  const match = /github\.com(?::|\/)([^/]+)\/([^/#]+?)(?:\.git)?$/.exec(normalized);
  return match ? `${match[1]}/${match[2]}` : null;
}

function sha256Text(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function samePairField(actual, expected) {
  return String(actual ?? '') === String(expected ?? '');
}

export async function inspectSourcePair({ mcgsRoot, cudaJsRoot }) {
  const mcgsRepository = githubRepository(git(mcgsRoot, 'remote', 'get-url', 'origin'));
  const cudaJsRepository = githubRepository(git(cudaJsRoot, 'remote', 'get-url', 'origin'));
  const packageJson = JSON.parse(await readFile(path.join(cudaJsRoot, 'package.json'), 'utf8'));
  const compatibility = JSON.parse(await readFile(path.join(cudaJsRoot, 'packaging', 'compatibility-manifest.json'), 'utf8'));
  const packageRepository = githubRepository(packageJson.repository?.url);
  if (mcgsRepository !== CUDA_MCGS_REPOSITORY) fail('PAIR_SOURCE_CHECKOUT', `CUDA-MCGS checkout origin is not ${CUDA_MCGS_REPOSITORY}`);
  if (cudaJsRepository !== CUDA_JS_REPOSITORY || packageRepository !== CUDA_JS_REPOSITORY) fail('PAIR_SOURCE_CHECKOUT', `CUDA-JS checkout provenance is not ${CUDA_JS_REPOSITORY}`);
  if (packageJson.name !== 'cuda-js' || compatibility.package?.name !== 'cuda-js' || compatibility.package?.version !== packageJson.version) fail('PAIR_SOURCE_CHECKOUT', 'CUDA-JS package and public compatibility metadata disagree');
  return Object.freeze({
    cudaMcgs: Object.freeze({
      repository: mcgsRepository,
      revision: git(mcgsRoot, 'rev-parse', 'HEAD'),
      tree: git(mcgsRoot, 'rev-parse', 'HEAD^{tree}'),
    }),
    cudaJs: Object.freeze({
      repository: cudaJsRepository,
      revision: git(cudaJsRoot, 'rev-parse', 'HEAD'),
      tree: git(cudaJsRoot, 'rev-parse', 'HEAD^{tree}'),
      package: `${packageJson.name}@${packageJson.version}`,
      apiSchema: String(compatibility.publicApi?.schemaVersion),
    }),
  });
}

export function assertExactSourcePair(actual, expected) {
  if (!actual || !expected) fail('PAIR_SOURCE_CHECKOUT', 'actual and expected source pairs are required');
  if (!samePairField(actual.cudaMcgs?.repository, expected.cudaMcgs?.repository)
      || !samePairField(actual.cudaMcgs?.revision, expected.cudaMcgs?.revision)
      || !samePairField(actual.cudaMcgs?.tree, expected.cudaMcgs?.tree)) {
    fail('PAIR_STALE_MCGS', 'CUDA-MCGS checkout does not match the exact expected revision/tree pair');
  }
  if (!samePairField(actual.cudaJs?.repository, expected.cudaJs?.repository)
      || !samePairField(actual.cudaJs?.revision, expected.cudaJs?.revision)
      || !samePairField(actual.cudaJs?.tree, expected.cudaJs?.tree)
      || !samePairField(actual.cudaJs?.package, expected.cudaJs?.package)
      || !samePairField(actual.cudaJs?.apiSchema, expected.cudaJs?.apiSchema)) {
    fail('PAIR_STALE_LOWER', 'CUDA-JS checkout does not match the exact expected revision/tree/package/API tuple');
  }
  return true;
}

export function assertPublicCudaJsIdentity(publicCudaJs, expected) {
  const lower = publicCudaJs?.CUDA_JS_COMPATIBILITY;
  const packageIdentity = lower?.package?.name && lower?.package?.version ? `${lower.package.name}@${lower.package.version}` : null;
  if (packageIdentity !== expected?.package || String(lower?.publicApi?.schemaVersion) !== String(expected?.apiSchema)) {
    fail('PAIR_STALE_LOWER', 'loaded public CUDA-JS package/API identity differs from the exact expected lower pair');
  }
  if (typeof publicCudaJs.openCudaRuntime !== 'function' || typeof publicCudaJs.compileDeviceProgram !== 'function') {
    fail('PAIR_STALE_LOWER', 'loaded public CUDA-JS root export lacks the required exact-pair public surface');
  }
  return true;
}

export function assertPairExecutionEvidence(executionPackage, capsule) {
  assertExactExecutionPackage(executionPackage, capsule);
  const handoff = executionPackage.cudaJsAdapter.searchProgram.functions.find(({ name }) => name === 'channel_handoff');
  const required = ['gpu.atomic.store-release-device', 'gpu.atomic.load-acquire-device', 'gpu.barrier.block'];
  if (!handoff || required.some((helper) => !handoff.helpers?.includes(helper))) {
    fail('PAIR_PUBLICATION', 'execution-package Channel function metadata omits required device release/acquire/barrier helpers');
  }
  if (!executionPackage.cudaJsAdapter.publicContracts.some(({ id }) => id === 'cuda-js.device-publication-release-acquire/0.1.0')) {
    fail('PAIR_PUBLICATION', 'execution package does not retain the selected Channel device publication requirement');
  }
  return true;
}

export function assertRecorderTransaction(snapshot, executionPackage, capsule) {
  if (!snapshot || snapshot.compileRequests?.length !== 1 || snapshot.compilerResults?.length !== 1 || snapshot.moduleLoads?.length !== 1 || snapshot.functionSubmits?.length !== 1) {
    fail('PAIR_EVIDENCE_TRANSACTION', 'recorder does not contain exactly one compile/load/submit transaction');
  }
  const expectedSourceSha = sha256Text(executionPackage.cudaJsAdapter.searchProgram.source);
  if (snapshot.compileRequests[0].source?.sha256 !== expectedSourceSha) fail('PAIR_EVIDENCE_TRANSACTION', 'recorded Device-JS compile input is not the execution-package source used by the adapter');
  const compiled = snapshot.compilerResults[0];
  const artifact = compiled.linker?.artifact ?? compiled.compiler?.artifact;
  const load = snapshot.moduleLoads[0];
  if (!artifact?.bytesSha256 || artifact.bytesSha256 !== load.request?.bytesSha256 || artifact.byteLength !== load.request?.byteLength || artifact.format !== load.request?.format) {
    fail('PAIR_EVIDENCE_TRANSACTION', 'recorded module load request is not the exact artifact bytes selected from the recorded compilation');
  }

  const bindings = executionBindings(executionPackage, capsule);
  const entry = executionPackage.cudaJsAdapter.searchProgram.functions.find(({ name }) => name === bindings.operation.function);
  const outputIndex = entry?.parameters.findIndex(({ name }) => name === 'output') ?? -1;
  const channelIndex = entry?.parameters.findIndex(({ name }) => name === 'channelState') ?? -1;
  const submit = snapshot.functionSubmits[0].request;
  const outputArgument = outputIndex >= 0 ? submit.arguments?.[outputIndex] : null;
  const channelArgument = channelIndex >= 0 ? submit.arguments?.[channelIndex] : null;
  if (outputArgument?.kind !== 'device-memory' || channelArgument?.kind !== 'device-memory' || outputArgument.id === channelArgument.id) {
    fail('PAIR_EVIDENCE_TRANSACTION', 'recorded submit does not preserve distinct Output and Channel memory capabilities');
  }
  if (snapshot.memoryWrites?.length !== 1 || snapshot.memoryWrites[0].memoryId !== channelArgument.id) {
    fail('PAIR_EVIDENCE_TRANSACTION', 'only the Channel resource may receive the pre-ignition host initialization write');
  }
  const read = snapshot.memoryReadsAsync?.[0];
  if (snapshot.memoryReadsAsync?.length !== 1 || read.memoryId !== outputArgument.id
      || Number(read.request?.deviceOffset) !== Number(bindings.delivery.byteOffset)
      || Number(read.request?.byteLength) !== Number(bindings.delivery.byteLength)) {
    fail('PAIR_EVIDENCE_TRANSACTION', 'terminal D2H operation is not bound to the exact recorded Output memory/range');
  }
  if ((snapshot.mailboxStores?.length ?? 0) !== 0 || (snapshot.mailboxLoads?.length ?? 0) !== 0) {
    fail('PAIR_HOST_INTERMEDIATE', 'host mailbox activity contaminated the active-search execution transaction');
  }
  return true;
}

async function walkFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'generated') continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(root, absolute));
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(entry.name.endsWith('.d.ts') ? '.d.ts' : path.extname(entry.name))) files.push(absolute);
  }
  return files;
}

export async function scanCudaJsConsumerNeutrality(cudaJsRoot) {
  const roots = [path.join(cudaJsRoot, 'components')];
  const compatibilityPath = path.join(cudaJsRoot, 'packaging', 'compatibility-manifest.json');
  const files = [];
  for (const root of roots) {
    if ((await stat(root)).isDirectory()) files.push(...await walkFiles(root));
  }
  files.push(compatibilityPath);
  files.sort((left, right) => left.localeCompare(right, 'en'));

  const identities = [];
  for (const absolute of files) {
    const text = await readFile(absolute, 'utf8');
    const relative = path.relative(cudaJsRoot, absolute).replace(/\\/g, '/');
    for (const pattern of FORBIDDEN_LOWER_VOCABULARY) {
      if (pattern.test(text)) fail('PAIR_CONSUMER_NEUTRALITY', `CUDA-MCGS search vocabulary leaked into CUDA-JS lower source/public contracts: ${relative}`);
    }
    identities.push(`${relative}\0${sha256Text(text)}`);
  }
  return Object.freeze({ filesScanned: files.length, identity: sha256Text(identities.join('\n')) });
}

export async function assertLinkedPublicCudaJs(cudaJsRoot) {
  const root = await realpath(cudaJsRoot);
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const exported = packageJson.exports?.['.']?.import;
  if (typeof exported !== 'string') fail('PAIR_PUBLIC_PACKAGE_LINK', 'CUDA-JS checkout does not declare a public root import export');
  let resolvedUrl;
  try { resolvedUrl = import.meta.resolve('cuda-js'); }
  catch (error) { fail('PAIR_PUBLIC_PACKAGE_LINK', `public cuda-js package cannot be resolved: ${error.message}`); }
  const resolved = await realpath(fileURLToPath(resolvedUrl));
  const expected = await realpath(path.join(root, exported));
  const relative = path.relative(root, resolved);
  if (resolved !== expected || relative.startsWith('..') || path.isAbsolute(relative)) {
    fail('PAIR_PUBLIC_PACKAGE_LINK', 'resolved public cuda-js root import is not the exact expected CUDA-JS checkout');
  }
  return Object.freeze({ specifier: 'cuda-js', resolvedEntry: relative.replace(/\\/g, '/'), sourceRoot: root });
}
