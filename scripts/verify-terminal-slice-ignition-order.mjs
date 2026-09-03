import assert from 'node:assert/strict';

import { terminalSliceScheduleOrders } from '../experiments/search-semantics-reference/src/terminal-slice-runtime.mjs';

function assertIgnitionBoundary(name, order) {
  const initialize = order.indexOf('framework');
  const output = order.indexOf('output');
  const ignite = order.indexOf('ignite');
  const resource = order.indexOf('resource');
  const progress = order.indexOf('progress');
  assert(initialize >= 0 && output >= 0 && ignite >= 0 && resource >= 0 && progress >= 0, `${name} must declare Framework initialization, Output pre-ignition initialization, ignition, and device-active phases`);
  assert(initialize < output, `${name}: Framework owner creation must precede Output initialization`);
  assert(output < ignite, `${name}: Output initialization must complete before Framework ignition`);
  assert(ignite < resource && ignite < progress, `${name}: device-active Resource/Progress work must not precede Framework ignition`);
}

for (const [name, order] of Object.entries(terminalSliceScheduleOrders())) assertIgnitionBoundary(name, order);

console.log('terminal_slice_ignition_order=pass');
