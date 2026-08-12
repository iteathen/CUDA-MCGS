import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildPlan,
  canonicalJson,
  generateCorePtx,
  generateFusedSource,
  generateModularCudaSources,
  inspectPtxFixture,
  referenceOutput,
  sha256,
  validateConfig,
  validateFragment,
  validateSurface,
} from './model.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(experimentRoot, 'fixtures');
const encoder = new TextEncoder();

async function json(relative) {
  return JSON.parse(await readFile(path.join(fixtureRoot, relative), 'utf8'));
}

function clone(value) {
  return structuredClone(value);
}

function expectCode(code) {
  return (error) => error?.code === code;
}

function words(value) {
  return [...value];
}

export async function runPortable({ outputDirectory = path.join(experimentRoot, 'build', 'portable'), writeEvidence = true } = {}) {
  assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS PTX discovery requires Node 26 or newer; found ${process.version}`);
  const surfaceInput = await json('extension-surface.json');
  const biasInput = await json('fragment-bias.json');
  const observerInput = await json('fragment-observer.json');
  const biasBytes = new Uint8Array(await readFile(path.join(fixtureRoot, biasInput.ptx.file)));
  const observerBytes = new Uint8Array(await readFile(path.join(fixtureRoot, observerInput.ptx.file)));
  const config = { nodeCapacity: 16, iterationBudget: 12, activationStep: 4 };
  const cases = [];
  const runCase = async (id, body) => {
    try {
      await body();
      cases.push({ id, status: 'pass' });
      console.log(`case=${id} result=pass`);
    } catch (error) {
      cases.push({ id, status: 'fail', error: { name: error.name, code: error.code ?? null, message: error.message } });
      console.error(`case=${id} result=fail error=${JSON.stringify(error.message)}`);
    }
  };

  let surface;
  let bias;
  let observer;
  await runCase('surface-valid', () => { surface = validateSurface(surfaceInput); });
  await runCase('bias-fragment-valid', () => { bias = validateFragment(biasInput, biasBytes, surfaceInput); });
  await runCase('observer-fragment-valid', () => { observer = validateFragment(observerInput, observerBytes, surfaceInput); });

  const noPointSurface = clone(surfaceInput);
  noPointSurface.id = 'cuda-mcgs.ptx-discovery.no-point.v1';
  noPointSurface.points = [];
  const profileDefinitions = [
    { id: 'no-point', surface: noPointSurface, fragments: [], pointIds: [] },
    { id: 'unbound', surface, fragments: [], pointIds: [] },
    { id: 'bias', surface, fragments: [bias], pointIds: ['score-transform'] },
    { id: 'observer', surface, fragments: [observer], pointIds: ['backup-observer'] },
    { id: 'bias-observer', surface, fragments: [bias, observer], pointIds: ['score-transform', 'backup-observer'] },
  ];
  const profiles = profileDefinitions.map((profile) => {
    const plan = buildPlan(profile.surface, profile.fragments, config);
    const coreText = generateCorePtx(plan);
    const coreBytes = encoder.encode(coreText);
    return { ...profile, plan, coreText, coreBytes, coreSha256: sha256(coreBytes), expected: referenceOutput(config, profile.pointIds) };
  });
  const profile = (id) => profiles.find((candidate) => candidate.id === id);

  await runCase('no-point-unbound-byte-identical', () => assert.deepEqual(profile('no-point').coreBytes, profile('unbound').coreBytes));
  await runCase('unbound-has-no-extension-residue', () => {
    assert(!profile('unbound').coreText.includes('cuda_mcgs_score_transform_v1'));
    assert(!profile('unbound').coreText.includes('cuda_mcgs_backup_observer_v1'));
    assert(!profile('unbound').coreText.includes('call.uni'));
  });
  await runCase('bias-has-one-direct-call', () => {
    assert(profile('bias').coreText.includes('cuda_mcgs_score_transform_v1'));
    assert.equal(profile('bias').coreText.match(/call\.uni/g)?.length, 1);
  });
  await runCase('observer-has-one-direct-call', () => {
    assert(profile('observer').coreText.includes('cuda_mcgs_backup_observer_v1'));
    assert.equal(profile('observer').coreText.match(/call\.uni/g)?.length, 1);
  });
  await runCase('two-fragments-have-two-direct-calls', () => assert.equal(profile('bias-observer').coreText.match(/call\.uni/g)?.length, 2));
  await runCase('fragment-selection-order-is-canonical', () => {
    const reverse = buildPlan(surface, [observer, bias], config);
    assert.equal(reverse.sha256, profile('bias-observer').plan.sha256);
  });
  await runCase('plan-identity-is-content-sensitive-and-revalidated', () => {
    assert.notEqual(profile('bias').plan.sha256, profile('bias-observer').plan.sha256);
    const tampered = { ...bias, bytes: Uint8Array.from(bias.bytes) };
    tampered.bytes[tampered.bytes.byteLength - 2] ^= 1;
    assert.throws(() => buildPlan(surface, [tampered], config), expectCode('FRAGMENT_PTX_DIGEST'));
  });
  await runCase('reference-full-budget', () => assert.deepEqual(words(profile('bias-observer').expected), [1296254803, 12, 3, 10, 4, 12, 139, 0, 8, 2166129286, 11, 1]));
  await runCase('reference-node-capacity-stop', () => assert.deepEqual(words(referenceOutput({ nodeCapacity: 1, iterationBudget: 12, activationStep: 4 }, [])), [1296254803, 0, 1, 0, 0, 0, 0, 1, 0, 2166136261, 2, 1]));
  const fusedSource = generateFusedSource(config);
  const modularSources = generateModularCudaSources(config);
  await runCase('fused-control-is-static', () => {
    assert(fusedSource.includes('__forceinline__'));
    assert(!fusedSource.includes('function pointer'));
    assert(fusedSource.includes('cuda_mcgs_score_transform_v1'));
    assert(fusedSource.includes('cuda_mcgs_backup_observer_v1'));
  });
  await runCase('modular-cuda-source-exposes-concrete-rdc-probe', () => {
    assert(modularSources.core.includes('extern "C" __device__ unsigned int cuda_mcgs_score_transform_v1'));
    assert(modularSources.bias.includes('__noinline__'));
    assert(modularSources.observer.includes('__noinline__'));
    assert(modularSources.biasAnchored.includes('retention_anchor'));
    assert(modularSources.observerAnchored.includes('retention_anchor'));
  });

  const invalid = async (id, code, body) => runCase(`reject-${id}`, () => assert.throws(body, expectCode(code)));
  await invalid('surface-unknown-field', 'SURFACE_FIELDS', () => validateSurface({ ...surfaceInput, extra: true }));
  await invalid('surface-duplicate-point', 'POINT_DUPLICATE', () => validateSurface({ ...surfaceInput, points: [...surfaceInput.points, clone(surfaceInput.points[0])] }));
  await invalid('fragment-unknown-field', 'FRAGMENT_FIELDS', () => validateFragment({ ...biasInput, extra: true }, biasBytes, surfaceInput));
  await invalid('fragment-unknown-point', 'FRAGMENT_POINT_UNKNOWN', () => validateFragment({ ...biasInput, point: { id: 'missing', version: 1 } }, biasBytes, surfaceInput));
  await invalid('fragment-point-version', 'FRAGMENT_POINT_VERSION', () => validateFragment({ ...biasInput, point: { ...biasInput.point, version: 2 } }, biasBytes, surfaceInput));
  await invalid('fragment-symbol', 'FRAGMENT_SYMBOL', () => validateFragment({ ...biasInput, symbol: 'wrong' }, biasBytes, surfaceInput));
  await invalid('fragment-signature', 'FRAGMENT_SIGNATURE', () => validateFragment({ ...biasInput, signature: { result: 'u32', parameters: ['u32'] } }, biasBytes, surfaceInput));
  await invalid('fragment-context', 'FRAGMENT_CONTEXT', () => validateFragment({ ...biasInput, contextFields: ['score'] }, biasBytes, surfaceInput));
  await invalid('fragment-permission', 'FRAGMENT_PERMISSIONS', () => validateFragment({ ...biasInput, permissions: [...biasInput.permissions, 'write:graph'] }, biasBytes, surfaceInput));
  await invalid('fragment-resource', 'FRAGMENT_RESOURCES', () => validateFragment({ ...biasInput, resources: { ...biasInput.resources, staticBytes: 1 } }, biasBytes, surfaceInput));
  await invalid('fragment-ptx-profile', 'FRAGMENT_PTX_PROFILE', () => validateFragment({ ...biasInput, ptx: { ...biasInput.ptx, target: 'sm_80' } }, biasBytes, surfaceInput));
  await invalid('fragment-digest', 'FRAGMENT_PTX_DIGEST', () => validateFragment({ ...biasInput, ptx: { ...biasInput.ptx, sha256: '0'.repeat(64) } }, biasBytes, surfaceInput));
  const missingExport = encoder.encode('.version 8.0\n.target sm_75\n.address_size 64\n');
  await invalid('fragment-export', 'FRAGMENT_EXPORT', () => validateFragment({ ...biasInput, ptx: { ...biasInput.ptx, sha256: sha256(missingExport) } }, missingExport, surfaceInput));
  await invalid('ptx-crlf', 'PTX_TEXT', () => inspectPtxFixture(encoder.encode('.version 8.0\r\n.target sm_75\r\n.address_size 64\r\n'), surfaceInput.ptxProfile, surfaceInput.limits.maxPtxBytes));
  await invalid('ptx-nul', 'PTX_TEXT', () => inspectPtxFixture(Uint8Array.of(65, 0, 10), surfaceInput.ptxProfile, surfaceInput.limits.maxPtxBytes));
  await invalid('ptx-nonascii', 'PTX_TEXT', () => inspectPtxFixture(Uint8Array.of(0xc3, 0xa9, 10), surfaceInput.ptxProfile, surfaceInput.limits.maxPtxBytes));
  await invalid('ptx-byte-limit', 'PTX_BYTES', () => inspectPtxFixture(new Uint8Array(surfaceInput.limits.maxPtxBytes + 1).fill(65), surfaceInput.ptxProfile, surfaceInput.limits.maxPtxBytes));
  await invalid('config-node-lower', 'CONFIG_NODE_CAPACITY', () => validateConfig({ ...config, nodeCapacity: 0 }, surfaceInput));
  await invalid('config-node-upper', 'CONFIG_NODE_CAPACITY', () => validateConfig({ ...config, nodeCapacity: 17 }, surfaceInput));
  await invalid('config-iteration-upper', 'CONFIG_ITERATIONS', () => validateConfig({ ...config, iterationBudget: 65, activationStep: 4 }, surfaceInput));
  await invalid('config-activation', 'CONFIG_ACTIVATION', () => validateConfig({ ...config, activationStep: 13 }, surfaceInput));
  await invalid('plan-fragment-count', 'PLAN_FRAGMENT_COUNT', () => buildPlan(surfaceInput, [bias, observer, bias], config));
  await invalid('plan-duplicate-point', 'PLAN_POINT_DUPLICATE', () => buildPlan(surfaceInput, [bias, bias], config));

  const failed = cases.filter(({ status }) => status === 'fail');
  const packageProfiles = profiles.map(({ id, plan, coreBytes, coreSha256, pointIds, expected }) => ({
    id,
    pointIds,
    planSha256: plan.sha256,
    coreFile: `core-${id}.ptx`,
    coreByteLength: coreBytes.byteLength,
    coreSha256,
    fragmentFiles: plan.fragments.map(({ manifest }) => manifest.ptx.file),
    fragmentSha256: plan.fragments.map(({ inspection }) => inspection.sha256),
    expected: words(expected),
  }));
  const portablePackage = {
    schemaVersion: 1,
    id: 'cuda-mcgs.ptx-extension-discovery.v1',
    config,
    ptxProfile: surface.ptxProfile,
    kernel: { name: 'cuda_mcgs_ptx_discovery', parameters: ['device-memory', 'u32', 'u32', 'u32'] },
    profiles: packageProfiles,
    fusedControl: { sourceFile: 'fused-bias-observer.cu', sourceSha256: sha256(encoder.encode(fusedSource)), pointIds: ['score-transform', 'backup-observer'], expected: words(referenceOutput(config, ['score-transform', 'backup-observer'])) },
    modularCudaProbe: Object.fromEntries(Object.entries(modularSources).map(([id, source]) => [id, { sourceFile: `modular-${id}.cu`, sourceSha256: sha256(encoder.encode(source)) }])),
  };
  const summary = { expected: cases.length, discovered: cases.length, executed: cases.length, passed: cases.length - failed.length, failed: failed.length, requiredSkipped: 0, conditionalSkipped: 0, optionalSkipped: 0, notDiscovered: 0 };
  const sourceRelatives = [
    'fixtures/extension-surface.json',
    'fixtures/fragment-bias.json',
    'fixtures/fragment-observer.json',
    'fixtures/ptx/bias.ptx',
    'fixtures/ptx/observer.ptx',
    'src/model.mjs',
    'src/run-portable.mjs',
  ];
  const sources = {};
  for (const relative of sourceRelatives) sources[relative] = createHash('sha256').update(await readFile(path.join(experimentRoot, relative))).digest('hex');
  const evidence = {
    schemaVersion: 1,
    capsule: portablePackage.id,
    status: failed.length === 0 ? 'pass' : 'fail',
    generatedAt: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
    packageIdentity: sha256(encoder.encode(canonicalJson(portablePackage))),
    package: portablePackage,
    sources,
    summary,
    cases,
    claimLimits: [
      'Fixture/manifest consistency, deterministic generation, bounds, and CPU reference semantics only.',
      'The text checker is not a PTX parser; only native nvJitLink establishes syntax, symbol, and relocation compatibility.',
      'No native Linux CUDA, cubin, SASS, launch, cleanup, performance, production generator, or released compatible-pair claim.',
    ],
  };
  if (writeEvidence) {
    await mkdir(outputDirectory, { recursive: true });
    await Promise.all(profiles.map(({ id, coreBytes }) => writeFile(path.join(outputDirectory, `core-${id}.ptx`), coreBytes)));
    await writeFile(path.join(outputDirectory, portablePackage.fusedControl.sourceFile), fusedSource);
    await Promise.all(Object.entries(modularSources).map(([id, source]) => writeFile(path.join(outputDirectory, `modular-${id}.cu`), source)));
    await writeFile(path.join(outputDirectory, 'package.json'), `${JSON.stringify(portablePackage, null, 2)}\n`);
    await writeFile(path.join(outputDirectory, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  }
  console.log(`capsule=${evidence.capsule} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=0`);
  console.log(`package_sha256=${evidence.packageIdentity} no_point_unbound_core_sha256=${profile('unbound').coreSha256}`);
  if (failed.length > 0) throw new Error(`Portable capsule failed ${failed.length} case(s).`);
  return evidence;
}
