import { composerConstants, createResolvedComposerInput } from '../../../components/search-compiler/testing.mjs';

const REFERENCE_GENERATOR = composerConstants.referenceGenerator;

export function resolveReferenceConvenienceCall(profileTemplate) {
  return {
    resolvedInput: createResolvedComposerInput(profileTemplate, REFERENCE_GENERATOR),
    trace: {
      kind: 'convenience-defaults',
      supplied: [],
      resolved: ['generator.maxCallDepth', 'generator.maxFunctions', 'generator.maxSourceBytes'],
    },
  };
}

export const referenceComposerPreset = REFERENCE_GENERATOR;
