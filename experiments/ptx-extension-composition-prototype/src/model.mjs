import { createHash } from 'node:crypto';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export const OUTPUT_WORDS = 12;
export const OUTPUT_BYTES = OUTPUT_WORDS * 4;
export const KERNEL_NAME = 'cuda_mcgs_ptx_discovery';
export const CUDA_JS_REVISION = 'ad49a6c9b0cddb420e26e097180cf9c502060a65';
export const CUDA_JS_BRANCH = 'main';

const SURFACE_FIELDS = ['id', 'limits', 'points', 'ptxProfile', 'schemaVersion'];
const POINT_FIELDS = ['contextFields', 'id', 'permissions', 'resources', 'signature', 'symbol', 'version'];
const LIMIT_FIELDS = ['maxFragments', 'maxIterations', 'maxNodeCapacity', 'maxPtxBytes'];
const PROFILE_FIELDS = ['addressSize', 'target', 'version'];
const SIGNATURE_FIELDS = ['parameters', 'result'];
const POINT_RESOURCE_FIELDS = ['maxDynamicSharedBytes', 'maxStaticBytes'];
const FRAGMENT_FIELDS = ['contextFields', 'id', 'permissions', 'point', 'provenance', 'ptx', 'resources', 'schemaVersion', 'signature', 'symbol'];
const FRAGMENT_POINT_FIELDS = ['id', 'version'];
const FRAGMENT_RESOURCE_FIELDS = ['dynamicSharedBytes', 'staticBytes'];
const FRAGMENT_PTX_FIELDS = ['addressSize', 'file', 'sha256', 'target', 'version'];
const PROVENANCE_FIELDS = ['generator', 'kind', 'options'];
const CONFIG_FIELDS = ['activationStep', 'iterationBudget', 'nodeCapacity'];

function fail(code, message, details = {}) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  error.details = details;
  throw error;
}

function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function exact(value, fields, code, label) {
  if (!plain(value) || Object.keys(value).sort().join('\0') !== [...fields].sort().join('\0')) fail(code, `${label} must contain exactly: ${fields.join(', ')}.`);
}

function nonemptyAscii(value, code, label) {
  if (typeof value !== 'string' || value.length === 0 || !/^[\x20-\x7e]+$/.test(value)) fail(code, `${label} must be nonempty printable ASCII.`);
  return value;
}

function uniqueStrings(values, code, label) {
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string') || new Set(values).size !== values.length) fail(code, `${label} must be an array of unique strings.`);
}

function boundedInteger(value, minimum, maximum, code, label) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) fail(code, `${label} must be an integer from ${minimum} through ${maximum}.`, { value, minimum, maximum });
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!plain(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function validateSignature(value, code) {
  exact(value, SIGNATURE_FIELDS, code, 'signature');
  if (value.result !== 'u32' || !Array.isArray(value.parameters) || value.parameters.length < 1 || value.parameters.length > 4 || value.parameters.some((parameter) => parameter !== 'u32')) {
    fail(code, 'The discovery ABI supports a u32 result and one through four u32 parameters.');
  }
}

export function validateSurface(surface) {
  exact(surface, SURFACE_FIELDS, 'SURFACE_FIELDS', 'Extension Surface');
  if (surface.schemaVersion !== 1) fail('SURFACE_SCHEMA', 'Unsupported Extension Surface schema version.');
  nonemptyAscii(surface.id, 'SURFACE_ID', 'Surface id');
  exact(surface.limits, LIMIT_FIELDS, 'SURFACE_LIMIT_FIELDS', 'Surface limits');
  boundedInteger(surface.limits.maxFragments, 0, 8, 'SURFACE_LIMIT', 'maxFragments');
  boundedInteger(surface.limits.maxPtxBytes, 1, 1_048_576, 'SURFACE_LIMIT', 'maxPtxBytes');
  boundedInteger(surface.limits.maxNodeCapacity, 1, 32, 'SURFACE_LIMIT', 'maxNodeCapacity');
  boundedInteger(surface.limits.maxIterations, 0, 1024, 'SURFACE_LIMIT', 'maxIterations');
  exact(surface.ptxProfile, PROFILE_FIELDS, 'SURFACE_PTX_FIELDS', 'Surface PTX profile');
  if (surface.ptxProfile.version !== '8.0' || surface.ptxProfile.target !== 'sm_75' || surface.ptxProfile.addressSize !== 64) fail('SURFACE_PTX_PROFILE', 'The frozen discovery profile is PTX 8.0, sm_75, address size 64.');
  if (!Array.isArray(surface.points)) fail('SURFACE_POINTS', 'points must be an array.');
  const ids = new Set();
  const symbols = new Set();
  for (const point of surface.points) {
    exact(point, POINT_FIELDS, 'POINT_FIELDS', 'Extension Point');
    nonemptyAscii(point.id, 'POINT_ID', 'Point id');
    nonemptyAscii(point.symbol, 'POINT_SYMBOL', 'Point symbol');
    boundedInteger(point.version, 1, 1, 'POINT_VERSION', 'Point version');
    if (ids.has(point.id) || symbols.has(point.symbol)) fail('POINT_DUPLICATE', 'Point ids and symbols must be unique.');
    ids.add(point.id);
    symbols.add(point.symbol);
    validateSignature(point.signature, 'POINT_SIGNATURE');
    uniqueStrings(point.contextFields, 'POINT_CONTEXT', 'Point contextFields');
    uniqueStrings(point.permissions, 'POINT_PERMISSIONS', 'Point permissions');
    exact(point.resources, POINT_RESOURCE_FIELDS, 'POINT_RESOURCE_FIELDS', 'Point resources');
    boundedInteger(point.resources.maxStaticBytes, 0, 1_048_576, 'POINT_RESOURCES', 'maxStaticBytes');
    boundedInteger(point.resources.maxDynamicSharedBytes, 0, 49_152, 'POINT_RESOURCES', 'maxDynamicSharedBytes');
  }
  return structuredClone(surface);
}

export function inspectPtxFixture(bytes, expected, maximumBytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 1 || bytes.byteLength > maximumBytes) fail('PTX_BYTES', 'PTX bytes are empty or exceed the surface limit.', { byteLength: bytes?.byteLength ?? null, maximumBytes });
  if (bytes.includes(0) || bytes.includes(13) || [...bytes].some((byte) => byte > 0x7f)) fail('PTX_TEXT', 'PTX fixtures must be ASCII, LF-only, and contain no NUL.');
  const text = decoder.decode(bytes);
  if (!text.endsWith('\n')) fail('PTX_TEXT', 'PTX fixtures must end with LF.');
  const version = text.match(/^\.version\s+(\S+)$/m)?.[1];
  const target = text.match(/^\.target\s+(\S+)$/m)?.[1];
  const addressSize = Number(text.match(/^\.address_size\s+(\d+)$/m)?.[1]);
  if (version !== expected.version || target !== expected.target || addressSize !== expected.addressSize) fail('PTX_PROFILE_MISMATCH', 'Fixture text does not match its declared PTX profile.', { version, target, addressSize });
  return { text, version, target, addressSize, byteLength: bytes.byteLength, sha256: sha256(bytes) };
}

export function validateFragment(fragment, ptxBytes, surfaceInput) {
  const surface = validateSurface(surfaceInput);
  exact(fragment, FRAGMENT_FIELDS, 'FRAGMENT_FIELDS', 'Fragment');
  if (fragment.schemaVersion !== 1) fail('FRAGMENT_SCHEMA', 'Unsupported fragment schema version.');
  nonemptyAscii(fragment.id, 'FRAGMENT_ID', 'Fragment id');
  nonemptyAscii(fragment.symbol, 'FRAGMENT_SYMBOL', 'Fragment symbol');
  exact(fragment.point, FRAGMENT_POINT_FIELDS, 'FRAGMENT_POINT_FIELDS', 'Fragment point');
  const point = surface.points.find(({ id }) => id === fragment.point.id);
  if (!point) fail('FRAGMENT_POINT_UNKNOWN', 'Fragment targets an unknown point.', { point: fragment.point.id });
  if (fragment.point.version !== point.version) fail('FRAGMENT_POINT_VERSION', 'Fragment point version does not match.');
  if (fragment.symbol !== point.symbol) fail('FRAGMENT_SYMBOL', 'Fragment symbol does not match its point.');
  validateSignature(fragment.signature, 'FRAGMENT_SIGNATURE');
  if (canonicalJson(fragment.signature) !== canonicalJson(point.signature)) fail('FRAGMENT_SIGNATURE', 'Fragment signature does not match its point.');
  uniqueStrings(fragment.contextFields, 'FRAGMENT_CONTEXT', 'Fragment contextFields');
  if (canonicalJson(fragment.contextFields) !== canonicalJson(point.contextFields)) fail('FRAGMENT_CONTEXT', 'Fragment context does not exactly match its point.');
  uniqueStrings(fragment.permissions, 'FRAGMENT_PERMISSIONS', 'Fragment permissions');
  if (fragment.permissions.some((permission) => !point.permissions.includes(permission))) fail('FRAGMENT_PERMISSIONS', 'Fragment requests a permission not granted by its point.');
  exact(fragment.resources, FRAGMENT_RESOURCE_FIELDS, 'FRAGMENT_RESOURCE_FIELDS', 'Fragment resources');
  boundedInteger(fragment.resources.staticBytes, 0, point.resources.maxStaticBytes, 'FRAGMENT_RESOURCES', 'staticBytes');
  boundedInteger(fragment.resources.dynamicSharedBytes, 0, point.resources.maxDynamicSharedBytes, 'FRAGMENT_RESOURCES', 'dynamicSharedBytes');
  exact(fragment.ptx, FRAGMENT_PTX_FIELDS, 'FRAGMENT_PTX_FIELDS', 'Fragment PTX');
  nonemptyAscii(fragment.ptx.file, 'FRAGMENT_PTX_FILE', 'PTX file');
  if (!/^ptx\/[a-z0-9-]+\.ptx$/.test(fragment.ptx.file)) fail('FRAGMENT_PTX_FILE', 'PTX file must be a fixture-relative ptx/*.ptx path.');
  if (fragment.ptx.version !== surface.ptxProfile.version || fragment.ptx.target !== surface.ptxProfile.target || fragment.ptx.addressSize !== surface.ptxProfile.addressSize) fail('FRAGMENT_PTX_PROFILE', 'Fragment PTX profile does not match the surface.');
  exact(fragment.provenance, PROVENANCE_FIELDS, 'FRAGMENT_PROVENANCE_FIELDS', 'Fragment provenance');
  nonemptyAscii(fragment.provenance.kind, 'FRAGMENT_PROVENANCE', 'Provenance kind');
  nonemptyAscii(fragment.provenance.generator, 'FRAGMENT_PROVENANCE', 'Provenance generator');
  uniqueStrings(fragment.provenance.options, 'FRAGMENT_PROVENANCE', 'Provenance options');
  const inspected = inspectPtxFixture(ptxBytes, fragment.ptx, surface.limits.maxPtxBytes);
  if (fragment.ptx.sha256 !== inspected.sha256) fail('FRAGMENT_PTX_DIGEST', 'Fragment digest does not match exact PTX bytes.', { expected: fragment.ptx.sha256, actual: inspected.sha256 });
  const escaped = fragment.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`\\.visible\\s+\\.func[\\s\\S]*?\\b${escaped}\\s*\\(`).test(inspected.text)) fail('FRAGMENT_EXPORT', 'PTX fixture does not visibly define the declared symbol.');
  return { manifest: structuredClone(fragment), point: structuredClone(point), bytes: Uint8Array.from(ptxBytes), inspection: inspected };
}

export function validateConfig(config, surfaceInput) {
  const surface = validateSurface(surfaceInput);
  exact(config, CONFIG_FIELDS, 'CONFIG_FIELDS', 'Search configuration');
  boundedInteger(config.nodeCapacity, 1, surface.limits.maxNodeCapacity, 'CONFIG_NODE_CAPACITY', 'nodeCapacity');
  boundedInteger(config.iterationBudget, 0, surface.limits.maxIterations, 'CONFIG_ITERATIONS', 'iterationBudget');
  boundedInteger(config.activationStep, 0, config.iterationBudget, 'CONFIG_ACTIVATION', 'activationStep');
  return structuredClone(config);
}

export function buildPlan(surfaceInput, validatedFragments, configInput) {
  const surface = validateSurface(surfaceInput);
  const config = validateConfig(configInput, surface);
  if (!Array.isArray(validatedFragments) || validatedFragments.length > surface.limits.maxFragments) fail('PLAN_FRAGMENT_COUNT', 'Selected fragments exceed the surface limit.');
  const byPoint = new Map();
  for (const fragment of validatedFragments) {
    if (!fragment?.manifest || !fragment?.inspection || !(fragment.bytes instanceof Uint8Array)) fail('PLAN_FRAGMENT_INVALID', 'Plan inputs must be validated fragments.');
    const revalidated = validateFragment(fragment.manifest, fragment.bytes, surface);
    const pointId = revalidated.manifest.point.id;
    if (byPoint.has(pointId)) fail('PLAN_POINT_DUPLICATE', 'Only one fragment may bind each discovery point.', { pointId });
    byPoint.set(pointId, revalidated);
  }
  const fragments = surface.points.filter(({ id }) => byPoint.has(id)).map(({ id }) => byPoint.get(id));
  const identityInput = {
    schemaVersion: 1,
    surface: { id: surface.id, ptxProfile: surface.ptxProfile },
    config,
    generator: { id: 'cuda-mcgs.ptx-discovery.generator', version: 1 },
    fragments: fragments.map(({ manifest, inspection }) => ({
      id: manifest.id,
      point: manifest.point,
      symbol: manifest.symbol,
      signature: manifest.signature,
      ptx: { ...manifest.ptx, byteLength: inspection.byteLength, sha256: inspection.sha256 },
      provenance: manifest.provenance,
    })),
    finalTarget: surface.ptxProfile.target,
    linkOptions: [`-arch=${surface.ptxProfile.target}`],
  };
  return { schemaVersion: 1, surface, config, fragments, identityInput, sha256: sha256(encoder.encode(canonicalJson(identityInput))) };
}

function externDeclaration(point) {
  const parameters = point.signature.parameters.map((_, index) => `    .param .b32 arg${index}`).join(',\n');
  return `.extern .func (.param .b32 result) ${point.symbol}(\n${parameters}\n);`;
}

function callBlock(point, registers, prefix) {
  const parameters = registers.map((register, index) => `        .param .b32 ${prefix}_arg${index};\n        st.param.b32 [${prefix}_arg${index}], ${register};`).join('\n');
  const names = registers.map((_, index) => `${prefix}_arg${index}`).join(', ');
  return `    {\n        .param .b32 ${prefix}_result;\n${parameters}\n        call.uni (${prefix}_result), ${point.symbol}, (${names});\n        ld.param.b32 ${registers[0]}, [${prefix}_result];\n    }`;
}

export function generateCorePtx(plan) {
  const scorePoint = plan.fragments.find(({ manifest }) => manifest.point.id === 'score-transform')?.point ?? null;
  const observerPoint = plan.fragments.find(({ manifest }) => manifest.point.id === 'backup-observer')?.point ?? null;
  const declarations = [scorePoint, observerPoint].filter(Boolean).map(externDeclaration).join('\n\n');
  const extension = (scorePoint || observerPoint) ? `\n    setp.ge.u32 %p4, %r11, %r3;\n    @!%p4 bra EXTENSION_DONE;\n    add.u32 %r12, %r12, 1;\n${scorePoint ? `${callBlock(scorePoint, ['%r18', '%r15', '%r11'], 'score')}\n` : ''}${observerPoint ? `${callBlock(observerPoint, ['%r13', '%r15', '%r11', '%r18'], 'observer')}\n` : ''}EXTENSION_DONE:` : '';
  return `.version ${plan.surface.ptxProfile.version}\n.target ${plan.surface.ptxProfile.target}\n.address_size ${plan.surface.ptxProfile.addressSize}\n\n${declarations ? `${declarations}\n\n` : ''}.visible .entry ${KERNEL_NAME}(\n    .param .u64 output,\n    .param .u32 node_capacity,\n    .param .u32 iteration_budget,\n    .param .u32 activation_step\n)\n{\n    .reg .pred %p<8>;\n    .reg .b32 %r<64>;\n    .reg .b64 %rd<4>;\n\n    mov.u32 %r0, %tid.x;\n    setp.ne.u32 %p0, %r0, 0;\n    @%p0 bra DONE;\n    ld.param.u64 %rd0, [output];\n    ld.param.u32 %r1, [node_capacity];\n    ld.param.u32 %r2, [iteration_budget];\n    ld.param.u32 %r3, [activation_step];\n    mov.u32 %r4, 1;\n    mov.u32 %r5, 2;\n    mov.u32 %r6, 1;\n    mov.u32 %r7, 0;\n    mov.u32 %r8, 0;\n    mov.u32 %r9, 0;\n    mov.u32 %r10, 0;\n    mov.u32 %r11, 0;\n    mov.u32 %r12, 0;\n    mov.u32 %r13, 2166136261;\n    mov.u32 %r14, 0;\n\nLOOP:\n    setp.ge.u32 %p1, %r11, %r2;\n    @%p1 bra PUBLISH;\n    mul.lo.u32 %r15, %r4, 2;\n    add.u32 %r15, %r15, 1;\n    rem.u32 %r15, %r15, 7;\n    mov.u32 %r16, 1;\n    shl.b32 %r16, %r16, %r15;\n    and.b32 %r17, %r5, %r16;\n    setp.ne.u32 %p2, %r17, 0;\n    @%p2 bra SEEN_STATE;\n    setp.ge.u32 %p3, %r6, %r1;\n    @%p3 bra CAPACITY_STOP;\n    or.b32 %r5, %r5, %r16;\n    add.u32 %r6, %r6, 1;\n    bra IDENTITY_DONE;\nSEEN_STATE:\n    add.u32 %r7, %r7, 1;\n    setp.eq.u32 %p5, %r15, 1;\n    @%p5 add.u32 %r8, %r8, 1;\nIDENTITY_DONE:\n    mul.lo.u32 %r18, %r15, 5;\n    add.u32 %r18, %r18, 2;${extension}\n    add.u32 %r10, %r10, %r18;\n    add.u32 %r9, %r9, 1;\n    mov.u32 %r4, %r15;\n    add.u32 %r11, %r11, 1;\n    bra LOOP;\nCAPACITY_STOP:\n    mov.u32 %r14, 1;\nPUBLISH:\n    st.global.u32 [%rd0+0], 0x4d434753;\n    st.global.u32 [%rd0+4], %r11;\n    st.global.u32 [%rd0+8], %r6;\n    st.global.u32 [%rd0+12], %r7;\n    st.global.u32 [%rd0+16], %r8;\n    st.global.u32 [%rd0+20], %r9;\n    st.global.u32 [%rd0+24], %r10;\n    st.global.u32 [%rd0+28], %r14;\n    st.global.u32 [%rd0+32], %r12;\n    st.global.u32 [%rd0+36], %r13;\n    st.global.u32 [%rd0+40], %r5;\n    st.global.u32 [%rd0+44], %r4;\nDONE:\n    ret;\n}\n`;
}

export function generateFusedSource(config) {
  return `__device__ __forceinline__ unsigned int cuda_mcgs_score_transform_v1(unsigned int score, unsigned int state, unsigned int iteration) {\n  return score + ((state ^ iteration) & 7u) + 1u;\n}\n__device__ __forceinline__ unsigned int cuda_mcgs_backup_observer_v1(unsigned int checksum, unsigned int state, unsigned int iteration, unsigned int score) {\n  return checksum ^ (state + iteration * 16777619u + score);\n}\nextern "C" __global__ void ${KERNEL_NAME}(unsigned int* output, unsigned int node_capacity, unsigned int iteration_budget, unsigned int activation_step) {\n  if (threadIdx.x != 0) return;\n  unsigned int state = 1u, seen = 2u, nodes = 1u, hits = 0u, cycles = 0u, backups = 0u, accumulated = 0u, iterations = 0u, active = 0u, checksum = 2166136261u, stop = 0u;\n  while (iterations < iteration_budget) {\n    const unsigned int candidate = (state * 2u + 1u) % 7u;\n    const unsigned int bit = 1u << candidate;\n    if ((seen & bit) != 0u) { ++hits; if (candidate == 1u) ++cycles; }\n    else { if (nodes >= node_capacity) { stop = 1u; break; } seen |= bit; ++nodes; }\n    unsigned int score = candidate * 5u + 2u;\n    if (iterations >= activation_step) { ++active; score = cuda_mcgs_score_transform_v1(score, candidate, iterations); checksum = cuda_mcgs_backup_observer_v1(checksum, candidate, iterations, score); }\n    accumulated += score; ++backups; state = candidate; ++iterations;\n  }\n  output[0] = 0x4d434753u; output[1] = iterations; output[2] = nodes; output[3] = hits; output[4] = cycles; output[5] = backups; output[6] = accumulated; output[7] = stop; output[8] = active; output[9] = checksum; output[10] = seen; output[11] = state;\n}\n// frozen-config nodeCapacity=${config.nodeCapacity} iterationBudget=${config.iterationBudget} activationStep=${config.activationStep}\n`;
}

export function generateModularCudaSources(config) {
  const fused = generateFusedSource(config);
  const kernelStart = fused.indexOf('extern "C" __global__');
  if (kernelStart < 0) throw new Error('Fused source did not contain the expected kernel boundary.');
  const bias = 'extern "C" __device__ __noinline__ unsigned int cuda_mcgs_score_transform_v1(unsigned int score, unsigned int state, unsigned int iteration) { return score + ((state ^ iteration) & 7u) + 1u; }\n';
  const observer = 'extern "C" __device__ __noinline__ unsigned int cuda_mcgs_backup_observer_v1(unsigned int checksum, unsigned int state, unsigned int iteration, unsigned int score) { return checksum ^ (state + iteration * 16777619u + score); }\n';
  return {
    core: `extern "C" __device__ unsigned int cuda_mcgs_score_transform_v1(unsigned int, unsigned int, unsigned int);\nextern "C" __device__ unsigned int cuda_mcgs_backup_observer_v1(unsigned int, unsigned int, unsigned int, unsigned int);\n${fused.slice(kernelStart)}`,
    bias,
    observer,
    biasAnchored: `${bias}extern "C" __global__ void cuda_mcgs_bias_retention_anchor(unsigned int* output) { output[0] = cuda_mcgs_score_transform_v1(0u, 0u, 0u); }\n`,
    observerAnchored: `${observer}extern "C" __global__ void cuda_mcgs_observer_retention_anchor(unsigned int* output) { output[0] = cuda_mcgs_backup_observer_v1(0u, 0u, 0u, 0u); }\n`,
  };
}

export function referenceOutput(config, bindingPointIds = []) {
  const scoreBound = bindingPointIds.includes('score-transform');
  const observerBound = bindingPointIds.includes('backup-observer');
  let state = 1;
  let seen = 2;
  let nodes = 1;
  let hits = 0;
  let cycles = 0;
  let backups = 0;
  let accumulated = 0;
  let iterations = 0;
  let active = 0;
  let checksum = 2166136261;
  let stop = 0;
  while (iterations < config.iterationBudget) {
    const candidate = (state * 2 + 1) % 7;
    const bit = (1 << candidate) >>> 0;
    if ((seen & bit) !== 0) {
      hits += 1;
      if (candidate === 1) cycles += 1;
    } else {
      if (nodes >= config.nodeCapacity) { stop = 1; break; }
      seen = (seen | bit) >>> 0;
      nodes += 1;
    }
    let score = (candidate * 5 + 2) >>> 0;
    if ((scoreBound || observerBound) && iterations >= config.activationStep) {
      active += 1;
      if (scoreBound) score = (score + ((candidate ^ iterations) & 7) + 1) >>> 0;
      if (observerBound) checksum = (checksum ^ ((candidate + Math.imul(iterations, 16777619) + score) >>> 0)) >>> 0;
    }
    accumulated = (accumulated + score) >>> 0;
    backups += 1;
    state = candidate;
    iterations += 1;
  }
  return Uint32Array.of(0x4d434753, iterations, nodes, hits, cycles, backups, accumulated, stop, active, checksum, seen, state);
}
