import { createHash } from 'node:crypto';
import { canonicalIdentity, exactKeys, fail } from './validation.mjs';

function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

// One selected physical service profile, not a replacement for engine-wide
// Progress. The caller admits a finite already-produced cohort and invokes this
// collective from every lane of one block. Owner callbacks retain payload truth.
export function createEvaluatorCohortService(progressResult, evaluatorResult, runtime, options) {
  exactKeys(options, ['name', 'cancellationParameter', 'blockSize'], 'PROGRESS_COHORT_OPTIONS', 'cohort service options');
  const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
  if (!identifier.test(options.name) || !identifier.test(options.cancellationParameter)
      || !Number.isSafeInteger(options.blockSize) || options.blockSize < 1 || options.blockSize > 0xffff_ffff) fail('PROGRESS_COHORT_OPTIONS', 'service names and block size must be explicit');
  const profile = progressResult.normalized;
  const evaluator = evaluatorResult.normalized;
  if (profile?.schema !== 'cuda-mcgs.progress-profile/0.2.0' || evaluator?.schema !== 'cuda-mcgs.evaluator-profile/0.2.0'
      || runtime.device?.serviceProtocol?.contract !== 'cuda-mcgs.evaluator-finite-cohort-service/0.1.0') fail('PROGRESS_COHORT_OWNER', 'selected Progress/evaluator and finite cohort protocol are required');
  if (canonicalIdentity(profile).sha256 !== progressResult.identity?.sha256 || canonicalIdentity(evaluator).sha256 !== evaluatorResult.identity?.sha256) fail('PROGRESS_COHORT_OWNER', 'selected normalized owner identity has drifted');
  const sourceIdentity = createHash('sha256').update(runtime.device.source.replace(/\r\n?/g, '\n').replace(/\n+$/g, '') + '\n').digest('hex');
  if (evaluator.programContribution.sourceIdentity.sha256 !== sourceIdentity) fail('PROGRESS_COHORT_OWNER', 'runtime differs from selected evaluator source');
  const contributors = profile.contributors.filter(({ profile: selected }) => selected.id === evaluator.id && selected.identity.sha256 === evaluatorResult.identity.sha256);
  if (contributors.length !== 1) fail('PROGRESS_COHORT_OWNER', 'Progress must bind the exact selected evaluator identity');
  const classes = profile.workClasses.filter(({ owner }) => owner === contributors[0].id);
  if (classes.length !== 1) fail('PROGRESS_COHORT_CLASS', 'first cohort profile requires exactly one evaluator work class');
  const work = classes[0];
  const itemCapacity = runtime.execution.itemCapacity;
  const requests = runtime.execution.requestCapacity;
  if (!Number.isSafeInteger(itemCapacity) || itemCapacity < 1 || !Number.isSafeInteger(requests) || requests < 1
      || options.blockSize < itemCapacity || runtime.execution.maxConcurrentBatches !== 1
      || work.batch.kind !== 'device-flush' || work.batch.minimumItems !== '1' || work.batch.hostTimeout !== 'none'
      || BigInt(work.batch.maximumItems) < BigInt(itemCapacity) || BigInt(evaluator.batching.maximumItems) !== BigInt(itemCapacity)
      || !work.readiness.independentReady || work.claim !== 'idempotent-cooperative'
      || !['cancel', 'abandon'].includes(work.stopDisposition)) fail('PROGRESS_COHORT_PROFILE', 'selected work class does not admit this bounded independent cohort service');
  const rounds = Math.ceil(requests / itemCapacity);
  if (BigInt(rounds) > BigInt(work.bounds.maxStepsPerAttempt) || BigInt(requests) > BigInt(work.bounds.maxAdmitted)) fail('PROGRESS_COHORT_BOUNDS', 'cohort exceeds selected Progress bounds');
  const functions = new Map(runtime.device.functions.map((fn) => [fn.name, fn]));
  const protocol = runtime.device.serviceProtocol;
  const service = functions.get(protocol.serviceItem);
  if (!service || service.parameters[0]?.name !== 'itemIndex' || service.parameters[0]?.type !== 'u32') fail('PROGRESS_COHORT_ABI', 'item service lacks its explicit index argument');
  const parameters = service.parameters.slice(1).map(({ name, type }) => ({ name, type }));
  if (parameters.some(({ name }) => name === options.cancellationParameter || name === 'mcgsServiceLane' || name === 'mcgsServiceRound')) fail('PROGRESS_COHORT_ABI', 'cohort parameter collides with control names');
  const byName = new Map(parameters.map(({ name, type }) => [name, type]));
  const invoke = (name, item = false) => {
    const fn = functions.get(name);
    if (!fn || fn.parameters.some((parameter, index) => !(item && index === 0) && byName.get(parameter.name) !== parameter.type)) fail('PROGRESS_COHORT_ABI', 'owner callback pointer ABI is incomplete');
    return `${name}(${fn.parameters.map(({ name }, index) => item && index === 0 ? 'mcgsServiceLane' : name).join(', ')})`;
  };
  const batch = invoke(protocol.formBatch), item = invoke(protocol.serviceItem, true), cancel = invoke(protocol.cancelPending), quiet = invoke(protocol.quiescent);
  parameters.push({ name: options.cancellationParameter, type: 'sideband<host-to-device,u32>', sidebandRole: 'framework-cancellation' });
  const source = `function ${options.name}(${parameters.map(({ name }) => name).join(', ')}) {
  let mcgsServiceLane = gpu.thread.x();
  for (let mcgsServiceRound = gpu.u32(0); mcgsServiceRound < gpu.u32(${rounds}); mcgsServiceRound = mcgsServiceRound + gpu.u32(1)) {
    if (mcgsServiceLane === gpu.u32(0)) {
      if (gpu.mailbox.loadAcquireSystem(${options.cancellationParameter}) !== gpu.u32(0)) { ${cancel}; }
      ${batch};
    }
    gpu.barrier.block();
    if (mcgsServiceLane < gpu.u32(${itemCapacity})) { ${item}; }
    gpu.barrier.block();
  }
  return ${quiet};
}\n`;
  return freeze({
    ownerProfile: profile.id, workClass: work.id, source,
    sourceIdentity: Object.freeze({ algorithm: 'sha256', sha256: createHash('sha256').update(source).digest('hex') }),
    function: Object.freeze({ name: options.name, executionRole: 'device-callable', parameters, returns: 'bool', ownerProfile: profile.id, semanticRole: work.id,
      calls: [protocol.formBatch, protocol.serviceItem, protocol.cancelPending, protocol.quiescent], helpers: ['gpu.thread.x', 'gpu.barrier.block', 'gpu.mailbox.loadAcquireSystem'],
      launchConstraint: { grid: ['1', '1', '1'], block: [String(options.blockSize), '1', '1'] } }),
    launch: Object.freeze({ grid: ['1', '1', '1'], block: [String(options.blockSize), '1', '1'] }),
    contract: 'cuda-mcgs.progress-evaluator-cohort/0.1.0',
    preconditions: Object.freeze(['one-block-all-lanes-enter-collective', 'finite-cohort-published-before-entry', 'no-later-producer', 'parent-owns-global-closure']),
  });
}
