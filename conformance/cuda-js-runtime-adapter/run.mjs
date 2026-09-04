import assert from 'node:assert/strict';

import { prepareCudaJsExecution } from '../../adapters/runtimes/cuda-js/index.mjs';

assert.equal(typeof prepareCudaJsExecution, 'function', 'integration.cuda-js must expose prepareCudaJsExecution');

console.log('CUDA-JS runtime adapter portable capsule reached the production adapter boundary.');
