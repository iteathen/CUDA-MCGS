export function closeProgressThenClassifyOutput({ progress, output, progressClosureFacts, outputEnvelope }) {
  const classification = output.classifyTerminalResult({
    ...outputEnvelope,
    terminalCutReady: true,
    resultVisibleResolved: true,
  });
  const closure = progress.publishClosure(progressClosureFacts);
  return { closure, classification };
}
