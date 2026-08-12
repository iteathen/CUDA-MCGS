const encoder = new TextEncoder();

export const COST_KERNEL_NAME = 'cuda_mcgs_extension_cost_probe';
export const COST_BLOCK_SIZE = 256;
export const COST_GRID_SIZE = 128;
export const COST_THREAD_COUNT = COST_BLOCK_SIZE * COST_GRID_SIZE;
export const COST_VALUE_BYTES = COST_THREAD_COUNT * 4;
export const COST_CLOCK_BYTES = COST_THREAD_COUNT * 8;
export const COST_OUTPUT_BYTES = COST_VALUE_BYTES + COST_CLOCK_BYTES;
export const COST_SEED = 0x6d2b79f5;

const PTX_HEADER = '.version 8.0\n.target sm_75\n.address_size 64\n';
const MULTIPLIER = 1_664_525;
const INCREMENT = 1_013_904_223;

function hookSymbol(index) {
  return `cuda_mcgs_cost_hook_${index}_v1`;
}

function hookConstant(index) {
  return (0x9e3779b1 + Math.imul(index, 0x10001)) >>> 0;
}

function hex(value) {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function operation(valueRegister, roundRegister, scratchRegister, index, indent = '    ') {
  return `${indent}add.u32 ${scratchRegister}, ${roundRegister}, ${hex(hookConstant(index))};\n${indent}xor.b32 ${valueRegister}, ${valueRegister}, ${scratchRegister};\n${indent}mul.lo.u32 ${valueRegister}, ${valueRegister}, ${MULTIPLIER};\n${indent}add.u32 ${valueRegister}, ${valueRegister}, ${INCREMENT};`;
}

function hookDefinition(index, visibility = '.visible ') {
  const symbol = hookSymbol(index);
  return `${visibility}.func (.param .b32 result) ${symbol}(\n    .param .b32 value,\n    .param .b32 round\n)\n{\n    .reg .b32 %r<4>;\n    ld.param.u32 %r0, [value];\n    ld.param.u32 %r1, [round];\n${operation('%r0', '%r1', '%r2', index)}\n    st.param.b32 [result], %r0;\n    ret;\n}`;
}

function hookDeclaration(index) {
  return `.extern .func (.param .b32 result) ${hookSymbol(index)}(\n    .param .b32 value,\n    .param .b32 round\n);`;
}

function hookCall(index, valueRegister = '%r2', roundRegister = '%r3') {
  return `    {\n        .param .b32 hook_${index}_result;\n        .param .b32 hook_${index}_value;\n        .param .b32 hook_${index}_round;\n        st.param.b32 [hook_${index}_value], ${valueRegister};\n        st.param.b32 [hook_${index}_round], ${roundRegister};\n        call.uni (hook_${index}_result), ${hookSymbol(index)}, (hook_${index}_value, hook_${index}_round);\n        ld.param.b32 ${valueRegister}, [hook_${index}_result];\n    }`;
}

function coarseSymbol(fragmentCount) {
  return `cuda_mcgs_cost_coarse_${fragmentCount}_v1`;
}

function coarseDefinition(fragmentCount) {
  const body = Array.from({ length: fragmentCount }, (_, index) => operation('%r0', '%r2', '%r3', index)).join('\n');
  return `.visible .func (.param .b32 result) ${coarseSymbol(fragmentCount)}(\n    .param .b32 value,\n    .param .b32 rounds\n)\n{\n    .reg .pred %p<2>;\n    .reg .b32 %r<5>;\n    ld.param.u32 %r0, [value];\n    ld.param.u32 %r1, [rounds];\n    mov.u32 %r2, 0;\nCOARSE_LOOP_${fragmentCount}:\n    setp.ge.u32 %p0, %r2, %r1;\n    @%p0 bra COARSE_DONE_${fragmentCount};\n${body}\n    add.u32 %r2, %r2, 1;\n    bra COARSE_LOOP_${fragmentCount};\nCOARSE_DONE_${fragmentCount}:\n    st.param.b32 [result], %r0;\n    ret;\n}`;
}

function coarseDeclaration(fragmentCount) {
  return `.extern .func (.param .b32 result) ${coarseSymbol(fragmentCount)}(\n    .param .b32 value,\n    .param .b32 rounds\n);`;
}

function coarseCall(fragmentCount) {
  return `    {\n        .param .b32 coarse_result;\n        .param .b32 coarse_value;\n        .param .b32 coarse_rounds;\n        st.param.b32 [coarse_value], %r2;\n        st.param.b32 [coarse_rounds], %r1;\n        call.uni (coarse_result), ${coarseSymbol(fragmentCount)}, (coarse_value, coarse_rounds);\n        ld.param.b32 %r2, [coarse_result];\n    }`;
}

function entryBody(fragmentCount, mode) {
  const inlineBody = Array.from({ length: fragmentCount }, (_, index) => operation('%r2', '%r3', '%r4', index)).join('\n');
  const fineCalls = Array.from({ length: fragmentCount }, (_, index) => hookCall(index)).join('\n');
  const repeatedBody = mode === 'inline' ? inlineBody : fineCalls;
  const work = mode === 'separate-coarse'
    ? coarseCall(fragmentCount)
    : `    mov.u32 %r3, 0;\nCOST_LOOP:\n    setp.ge.u32 %p0, %r3, %r1;\n    @%p0 bra COST_DONE;\n${repeatedBody ? `${repeatedBody}\n` : ''}    add.u32 %r3, %r3, 1;\n    bra COST_LOOP;\nCOST_DONE:`;
  return `.visible .entry ${COST_KERNEL_NAME}(\n    .param .u64 output,\n    .param .u32 rounds,\n    .param .u32 seed\n)\n{\n    .reg .pred %p<2>;\n    .reg .b32 %r<16>;\n    .reg .b64 %rd<8>;\n\n    ld.param.u64 %rd0, [output];\n    ld.param.u32 %r1, [rounds];\n    ld.param.u32 %r2, [seed];\n    mov.u32 %r0, %ctaid.x;\n    mov.u32 %r5, %ntid.x;\n    mov.u32 %r6, %tid.x;\n    mad.lo.u32 %r0, %r0, %r5, %r6;\n    xor.b32 %r2, %r2, %r0;\n    mov.u64 %rd3, %clock64;\n${work}\n    mov.u64 %rd4, %clock64;\n    sub.u64 %rd5, %rd4, %rd3;\n    mul.wide.u32 %rd1, %r0, 4;\n    add.s64 %rd2, %rd0, %rd1;\n    st.global.u32 [%rd2], %r2;\n    mul.wide.u32 %rd6, %r0, 8;\n    add.u64 %rd6, %rd6, ${COST_VALUE_BYTES};\n    add.s64 %rd7, %rd0, %rd6;\n    st.global.u64 [%rd7], %rd5;\n    ret;\n}`;
}

function generateProfile(id, mode, fragmentCount, benchmarkRounds = []) {
  if (!Number.isInteger(fragmentCount) || fragmentCount < 0 || fragmentCount > 8) throw new RangeError('fragmentCount must be from 0 through 8.');
  if (mode === 'same-visible' && fragmentCount !== 1) throw new RangeError('The visible same-module control is intentionally bounded to one fragment.');
  if (mode === 'separate-coarse' && fragmentCount < 1) throw new RangeError('The coarse control requires at least one operation.');
  let corePtx;
  let fragmentPtx = [];
  if (mode === 'inline') {
    corePtx = `${PTX_HEADER}\n${entryBody(fragmentCount, mode)}\n`;
  } else if (mode === 'same-internal' || mode === 'same-visible') {
    const visibility = mode === 'same-visible' ? '.visible ' : '';
    const definitions = Array.from({ length: fragmentCount }, (_, index) => hookDefinition(index, visibility)).join('\n\n');
    corePtx = `${PTX_HEADER}\n${definitions}\n\n${entryBody(fragmentCount, mode)}\n`;
  } else if (mode === 'separate-fine') {
    const declarations = Array.from({ length: fragmentCount }, (_, index) => hookDeclaration(index)).join('\n\n');
    corePtx = `${PTX_HEADER}\n${declarations}\n\n${entryBody(fragmentCount, mode)}\n`;
    fragmentPtx = Array.from({ length: fragmentCount }, (_, index) => `${PTX_HEADER}\n${hookDefinition(index)}\n`);
  } else if (mode === 'separate-coarse') {
    corePtx = `${PTX_HEADER}\n${coarseDeclaration(fragmentCount)}\n\n${entryBody(fragmentCount, mode)}\n`;
    fragmentPtx = [`${PTX_HEADER}\n${coarseDefinition(fragmentCount)}\n`];
  } else {
    throw new RangeError(`Unknown cost-probe mode ${mode}.`);
  }
  const coreFile = `cost-${id}-core.ptx`;
  const fragmentFiles = fragmentPtx.map((_, index) => `cost-${id}-fragment-${index}.ptx`);
  return {
    id,
    mode,
    fragmentCount,
    verificationRounds: fragmentCount >= 8 ? 8 : 16,
    benchmarkRounds,
    coreFile,
    fragmentFiles,
    generatedFiles: [
      { file: coreFile, text: corePtx },
      ...fragmentPtx.map((text, index) => ({ file: fragmentFiles[index], text })),
    ],
    coreByteLength: encoder.encode(corePtx).byteLength,
    inputCount: 1 + fragmentPtx.length,
    sourceCallSites: (corePtx.match(/call\.uni/g) ?? []).length,
  };
}

export function buildCostProbeProfiles() {
  return [
    generateProfile('inline-n0', 'inline', 0),
    generateProfile('inline-n1', 'inline', 1, [1, 8, 32, 128]),
    generateProfile('same-internal-n1', 'same-internal', 1, [1, 8, 32, 128]),
    generateProfile('same-visible-n1', 'same-visible', 1, [1, 8, 32, 128]),
    generateProfile('separate-fine-n1', 'separate-fine', 1, [1, 8, 32, 128]),
    generateProfile('separate-coarse-n1', 'separate-coarse', 1, [1, 8, 32, 128]),
    generateProfile('separate-fine-n2', 'separate-fine', 2),
    generateProfile('separate-fine-n4', 'separate-fine', 4),
    generateProfile('inline-n8', 'inline', 8, [1, 4, 16, 32]),
    generateProfile('same-internal-n8', 'same-internal', 8, [1, 4, 16, 32]),
    generateProfile('separate-fine-n8', 'separate-fine', 8, [1, 4, 16, 32]),
    generateProfile('separate-coarse-n8', 'separate-coarse', 8, [1, 4, 16, 32]),
  ];
}

export function costProbeValue(globalThreadId, rounds, fragmentCount, seed = COST_SEED) {
  let value = (seed ^ globalThreadId) >>> 0;
  for (let round = 0; round < rounds; round += 1) {
    for (let index = 0; index < fragmentCount; index += 1) {
      value = (value ^ ((round + hookConstant(index)) >>> 0)) >>> 0;
      value = (Math.imul(value, MULTIPLIER) + INCREMENT) >>> 0;
    }
  }
  return value;
}

export function referenceCostProbe(rounds, fragmentCount, threadCount = COST_THREAD_COUNT) {
  const output = new Uint32Array(threadCount);
  for (let index = 0; index < threadCount; index += 1) output[index] = costProbeValue(index, rounds, fragmentCount);
  return output;
}
