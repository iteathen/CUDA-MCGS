export function closeProgressThenClassifyOutput({ progress, output, progressClosureFacts, outputEnvelope }) {
  const closure = progress.publishClosure(progressClosureFacts);
  const terminalCutReady = closure.kind === 'terminal';
  const classification = output.classifyTerminalResult({
    ...outputEnvelope,
    terminalCutReady,
    resultVisibleResolved: terminalCutReady,
  });
  return { closure, classification };
}
