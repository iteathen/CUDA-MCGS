import { registerResourceAdmissionCases } from './resource-admission-cases.mjs';
import { registerResourceLifecycleCases } from './resource-lifecycle-cases.mjs';
import { registerResourcePressureExhaustionCases } from './resource-pressure-exhaustion-cases.mjs';
import { registerResourceSensitivityCases } from './resource-sensitivity-cases.mjs';

function allRequiredIds(prefix, count) {
  return Array.from({ length: count }, (_, index) => `${prefix}${String(index + 1).padStart(3, '0')}`);
}

export const DIRECT_RESOURCE_REQUIREMENTS = [
  ...allRequiredIds('RESOURCE-ADMIT-', 11),
  ...allRequiredIds('RESOURCE-PRESSURE-', 7),
  ...allRequiredIds('RESOURCE-EXHAUST-', 8),
  ...allRequiredIds('RESOURCE-LIFE-', 6),
  ...allRequiredIds('RESOURCE-CLEANUP-', 2),
];

export function registerResourceCases(context) {
  registerResourceAdmissionCases(context);
  registerResourcePressureExhaustionCases(context);
  registerResourceLifecycleCases(context);
  registerResourceSensitivityCases(context);
}
