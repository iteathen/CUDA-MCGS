#!/usr/bin/env node

const mode = process.argv[2] ?? 'portable';
if (mode === 'portable') {
  await import('../conformance/cuda-js-compatible-pair/run-portable.mjs');
} else if (mode === 'native') {
  await import('../conformance/cuda-js-compatible-pair/run-native.mjs');
} else {
  throw new Error(`unsupported compatible-pair mode: ${mode}`);
}
