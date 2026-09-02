import { registerOutputLifecycleCleanupCases } from './output-lifecycle-cleanup-cases.mjs';
import { registerOutputObservationCases } from './output-observation-cases.mjs';
import { registerOutputSnapshotPublicationCases } from './output-snapshot-publication-cases.mjs';
import { registerOutputTerminalCases } from './output-terminal-cases.mjs';

function allRequiredIds(prefix, count) {
  return Array.from({ length: count }, (_, index) => `${prefix}${String(index + 1).padStart(3, '0')}`);
}

export const DIRECT_OUTPUT_REQUIREMENTS = [
  ...allRequiredIds('OUTPUT-TERMINAL-', 10),
  ...allRequiredIds('OUTPUT-OBS-', 11),
  ...allRequiredIds('OUTPUT-SNAPSHOT-', 8),
  ...allRequiredIds('OUTPUT-PUB-', 11),
  ...allRequiredIds('OUTPUT-LIFE-', 8),
  ...allRequiredIds('OUTPUT-CLEANUP-', 3),
];

export function registerOutputCases(context) {
  registerOutputTerminalCases(context);
  registerOutputObservationCases(context);
  registerOutputSnapshotPublicationCases(context);
  registerOutputLifecycleCleanupCases(context);
}
