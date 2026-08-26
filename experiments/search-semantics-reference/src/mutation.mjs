import { canonicalClone, canonicalIdentity } from './canonical.mjs';
import { assertNamespacedId, exactKeys, fail } from './errors.mjs';

export function assertMutationDetected(input) {
  exactKeys(input, ['baseline', 'evaluate', 'expectedCode', 'id', 'mutate'], 'HARNESS_MUTATION_FIELDS', 'mutation check');
  const id = assertNamespacedId(input.id, 'HARNESS_MUTATION_ID', 'mutation id');
  if (typeof input.mutate !== 'function' || typeof input.evaluate !== 'function') fail('HARNESS_MUTATION_FUNCTION', `${id} mutate/evaluate must be functions`);
  if (typeof input.expectedCode !== 'string' || !/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/.test(input.expectedCode)) fail('HARNESS_MUTATION_EXPECTED', `${id} expectedCode is invalid`);
  const baseline = canonicalClone(input.baseline, `${id} baseline`);
  input.evaluate(canonicalClone(baseline, `${id} baseline evaluation`));
  const mutated = input.mutate(canonicalClone(baseline, `${id} mutation input`));
  const baselineIdentity = canonicalIdentity(baseline, `${id} baseline`);
  const mutatedIdentity = canonicalIdentity(mutated, `${id} mutated`);
  if (baselineIdentity.sha256 === mutatedIdentity.sha256) fail('HARNESS_MUTATION_INEFFECTIVE', `${id} did not change canonical input`);
  let detected;
  try {
    input.evaluate(canonicalClone(mutated, `${id} mutated evaluation`));
  } catch (error) {
    detected = error;
  }
  if (!detected) fail('HARNESS_MUTATION_UNDETECTED', `${id} did not falsify its evaluator`);
  if (detected.code !== input.expectedCode) fail('HARNESS_MUTATION_WRONG_FAILURE', `${id} produced ${detected.code ?? detected.name}, expected ${input.expectedCode}`);
  const record = { id, expectedCode: input.expectedCode, detectedCode: detected.code, baselineIdentity, mutatedIdentity };
  return { ...record, identity: canonicalIdentity(record, `${id} mutation evidence`) };
}
