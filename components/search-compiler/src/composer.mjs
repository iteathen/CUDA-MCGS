import * as core from './composer-core.mjs';
import { normalizeAcceptedContractAuthority } from './accepted-authority.mjs';
import {
  buildExecutionPackage,
  composeSearchProgram,
  normalizeProgramPackageProfile,
} from './program-package.mjs';
import { canonicalIdentity, ValidationError } from './validation.mjs';

const STATUS = 'accepted';
const PUBLICATION_SCHEMA = 'cuda-mcgs.composer-publication/0.2.0';

function profileHasDeviceImports(profile) {
  return Boolean(profile && Object.hasOwn(profile, 'deviceImports'));
}

function resolvedValue(input) {
  return input?.normalized ?? input;
}

function stripProfileDeviceImports(profile) {
  const stripped = structuredClone(profile);
  delete stripped.deviceImports;
  return stripped;
}

function stripResolvedDeviceImports(input) {
  const stripped = structuredClone(resolvedValue(input));
  if (stripped?.profile) delete stripped.profile.deviceImports;
  return stripped;
}

function identityReference(identity) {
  return { algorithm: identity.algorithm, sha256: identity.sha256 };
}

export function createResolvedComposerInput(profileTemplate, generatorInput) {
  if (!profileHasDeviceImports(profileTemplate)) return core.createResolvedComposerInput(profileTemplate, generatorInput);
  const deviceImports = structuredClone(profileTemplate.deviceImports);
  const result = core.createResolvedComposerInput(stripProfileDeviceImports(profileTemplate), generatorInput);
  const normalized = {
    ...result.normalized,
    profile: { ...result.normalized.profile, deviceImports },
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

export function normalizeResolvedComposerInput(input) {
  const value = resolvedValue(input);
  if (!profileHasDeviceImports(value?.profile)) return core.normalizeResolvedComposerInput(value);
  const deviceImports = structuredClone(value.profile.deviceImports);
  const result = core.normalizeResolvedComposerInput(stripResolvedDeviceImports(value));
  const normalized = {
    ...result.normalized,
    profile: { ...result.normalized.profile, deviceImports },
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

export function createProgramPackageCompositionContext(resolvedInput, selection) {
  const value = resolvedValue(resolvedInput);
  if (!profileHasDeviceImports(value?.profile)) return core.createProgramPackageCompositionContext(resolvedInput, selection);
  return core.createProgramPackageCompositionContext(stripResolvedDeviceImports(value), selection);
}

export function composeResolvedEngine(resolvedInput, inspected, context) {
  const value = resolvedValue(resolvedInput);
  if (!profileHasDeviceImports(value?.profile)) return core.composeResolvedEngine(resolvedInput, inspected, context);
  const resolved = normalizeResolvedComposerInput(value);
  const authority = normalizeAcceptedContractAuthority(inspected);
  const profile = normalizeProgramPackageProfile(resolved.normalized.profile, authority, context);
  const program = composeSearchProgram(profile);
  const executionPackage = buildExecutionPackage(profile, program);
  const normalizedPublication = {
    schema: PUBLICATION_SCHEMA,
    status: STATUS,
    resolvedInput: identityReference(resolved.identity),
    compositionProfile: identityReference(profile.identity),
    searchProgram: identityReference(program.identity),
    executionPackage: identityReference(executionPackage.identity),
  };
  const publication = { normalized: normalizedPublication, identity: canonicalIdentity(normalizedPublication) };
  return { resolvedInput: resolved, compositionProfile: profile, searchProgram: program, executionPackage, publication };
}

export function tryComposeResolvedEngine(resolvedInput, inspected, context) {
  const value = resolvedValue(resolvedInput);
  if (!profileHasDeviceImports(value?.profile)) return core.tryComposeResolvedEngine(resolvedInput, inspected, context);
  try {
    return { status: 'success', publication: composeResolvedEngine(value, inspected, context), diagnostic: null };
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    return { status: 'failure', publication: null, diagnostic: { code: error.code, message: error.message } };
  }
}

export * from './composer-core.mjs';

export const composerConstants = Object.freeze({
  ...core.composerConstants,
  optionalProfileTemplateFields: Object.freeze(['deviceImports']),
});
