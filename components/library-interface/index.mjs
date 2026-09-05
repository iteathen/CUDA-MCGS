import {
  composerConstants,
  createResolvedComposerInput,
  tryCreateResolvedComposerInput,
} from '../search-compiler/index.mjs';

export {
  composeResolvedEngine as compose,
  tryComposeResolvedEngine as tryCompose,
} from '../search-compiler/index.mjs';

export const referenceGenerator = composerConstants.referenceGenerator;

export function resolve(profileTemplate, generatorInput = referenceGenerator) {
  return createResolvedComposerInput(profileTemplate, generatorInput);
}

export function tryResolve(profileTemplate, generatorInput = referenceGenerator) {
  return tryCreateResolvedComposerInput(profileTemplate, generatorInput);
}

export const libraryConstants = Object.freeze({
  contract: 'cuda-mcgs.library-interface/0.1.0',
  version: '0.1.0',
  phase: 'prerelease',
  resolverOwner: 'tool.search-compiler',
  runtimeOwner: 'integration.cuda-js',
});
