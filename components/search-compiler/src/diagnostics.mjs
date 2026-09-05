import { createResolvedComposerInput } from './composer.mjs';
import { ValidationError } from './validation.mjs';

function validationDiagnostic(error) {
  if (!(error instanceof ValidationError)) throw error;
  return Object.freeze({ code: error.code, message: error.message });
}

export function tryCreateResolvedComposerInput(profileTemplate, generatorInput) {
  try {
    return Object.freeze({
      status: 'success',
      resolvedInput: createResolvedComposerInput(profileTemplate, generatorInput),
      diagnostic: null,
    });
  } catch (error) {
    return Object.freeze({
      status: 'failure',
      resolvedInput: null,
      diagnostic: validationDiagnostic(error),
    });
  }
}
