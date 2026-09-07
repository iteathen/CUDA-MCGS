import * as core from './program-package-core.mjs';
import { assertNamespacedId } from './foundation.mjs';
import { assertString, canonicalIdentity, compareRaw, exactKeys, fail } from './validation.mjs';

const DEVICE_IMPORT_SCHEMA = 'cuda-mcgs.device-js-import-declaration/0.1.0';
const MAX_DEVICE_IMPORTS = 64;
const MAX_DEVICE_LIBRARIES = 32;
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const HEX64 = /^[0-9a-f]{64}$/;

function normalizeDeviceImportDeclaration(input, index, selectedProfiles, localFunctions) {
  exactKeys(input, ['schema', 'id', 'ownerProfile', 'importName', 'alias', 'library'], 'COMPOSE_DEVICE_IMPORT_FIELDS', `device import ${index}`);
  if (input.schema !== DEVICE_IMPORT_SCHEMA) fail('COMPOSE_DEVICE_IMPORT_SCHEMA', `device import ${index} schema is unsupported`);
  assertNamespacedId(input.id, 'COMPOSE_DEVICE_IMPORT_ID', `device import ${index} id`);
  assertNamespacedId(input.ownerProfile, 'COMPOSE_DEVICE_IMPORT_OWNER', `${input.id} ownerProfile`);
  if (!selectedProfiles.has(input.ownerProfile)) fail('COMPOSE_DEVICE_IMPORT_OWNER', `${input.id} names an unselected owner profile`);
  assertString(input.importName, IDENTIFIER, 'COMPOSE_DEVICE_IMPORT_NAME', `${input.id} importName`);
  assertString(input.alias, IDENTIFIER, 'COMPOSE_DEVICE_IMPORT_ALIAS', `${input.id} alias`);
  if (input.alias === 'gpu' || localFunctions.has(input.alias)) fail('COMPOSE_DEVICE_IMPORT_ALIAS', `${input.id} alias collides with a reserved or local Device-JS name`);
  exactKeys(input.library, ['contract', 'sha256', 'format', 'architecture', 'artifactSha256'], 'COMPOSE_DEVICE_IMPORT_LIBRARY_FIELDS', `${input.id} library`);
  if (typeof input.library.contract !== 'string' || input.library.contract.length === 0) fail('COMPOSE_DEVICE_IMPORT_LIBRARY', `${input.id} library contract is absent`);
  assertString(input.library.sha256, HEX64, 'COMPOSE_DEVICE_IMPORT_LIBRARY', `${input.id} library sha256`);
  if (!['ptx', 'lto-ir'].includes(input.library.format)) fail('COMPOSE_DEVICE_IMPORT_LIBRARY', `${input.id} library format is unsupported`);
  if (typeof input.library.architecture !== 'string' || input.library.architecture.length === 0) fail('COMPOSE_DEVICE_IMPORT_LIBRARY', `${input.id} library architecture is absent`);
  assertString(input.library.artifactSha256, HEX64, 'COMPOSE_DEVICE_IMPORT_LIBRARY', `${input.id} library artifactSha256`);
  return {
    schema: input.schema,
    id: input.id,
    ownerProfile: input.ownerProfile,
    importName: input.importName,
    alias: input.alias,
    library: { ...input.library },
  };
}

function normalizeDeviceImports(input, baseProfile) {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_DEVICE_IMPORTS) {
    fail('COMPOSE_DEVICE_IMPORT_COUNT', `deviceImports must contain 1 through ${MAX_DEVICE_IMPORTS} declarations`);
  }
  const selectedProfiles = new Set(baseProfile.semanticEngine.profiles.map(({ id }) => id));
  const localFunctions = new Set(baseProfile.functions.map(({ name }) => name));
  const imports = input.map((entry, index) => normalizeDeviceImportDeclaration(entry, index, selectedProfiles, localFunctions))
    .sort((left, right) => compareRaw(left.id, right.id));
  if (new Set(imports.map(({ id }) => id)).size !== imports.length) fail('COMPOSE_DEVICE_IMPORT_DUPLICATE', 'device import ids must be unique');
  if (new Set(imports.map(({ alias }) => alias)).size !== imports.length) fail('COMPOSE_DEVICE_IMPORT_DUPLICATE', 'device import aliases must be unique');
  const libraryKeys = new Set(imports.map(({ library }) => `${library.sha256}\0${library.format}\0${library.architecture}\0${library.artifactSha256}`));
  if (libraryKeys.size > MAX_DEVICE_LIBRARIES) fail('COMPOSE_DEVICE_IMPORT_COUNT', `deviceImports exceed the public CUDA-JS limit of ${MAX_DEVICE_LIBRARIES} distinct libraries`);
  return imports;
}

function stripImportOwnership(input) {
  const stripped = structuredClone(input);
  delete stripped.deviceImports;
  if (Array.isArray(stripped.deletion?.records)) {
    stripped.deletion.records = stripped.deletion.records.map((record) => {
      const copy = { ...record };
      delete copy.deviceImports;
      return copy;
    });
  }
  return stripped;
}

function normalizeImportDeletion(input, normalizedDeletion, imports) {
  if (!Array.isArray(input?.records)) fail('COMPOSE_DEVICE_IMPORT_DELETION', 'deletion records are required for device imports');
  const supplied = new Map();
  for (const record of input.records) {
    if (!Object.hasOwn(record, 'deviceImports') || !Array.isArray(record.deviceImports)) {
      fail('COMPOSE_DEVICE_IMPORT_DELETION', `${record?.owner ?? '<missing>'} must declare deviceImports deletion ownership`);
    }
    const ids = [...record.deviceImports].sort(compareRaw);
    if (new Set(ids).size !== ids.length) fail('COMPOSE_DEVICE_IMPORT_DELETION', `${record.owner} repeats a device import`);
    for (const id of ids) assertNamespacedId(id, 'COMPOSE_DEVICE_IMPORT_DELETION', `${record.owner} device import`);
    supplied.set(record.owner, ids);
  }
  const importById = new Map(imports.map((entry) => [entry.id, entry]));
  const seen = new Set();
  const records = normalizedDeletion.records.map((record) => {
    const ids = supplied.get(record.owner);
    if (!ids) fail('COMPOSE_DEVICE_IMPORT_DELETION', `${record.owner} lacks device import deletion ownership`);
    const expected = imports.filter(({ ownerProfile }) => ownerProfile === record.owner).map(({ id }) => id).sort(compareRaw);
    if (ids.length !== expected.length || ids.some((id, index) => id !== expected[index])) {
      fail('COMPOSE_DEVICE_IMPORT_DELETION', `${record.owner} device import deletion ownership differs from authoritative ownership`);
    }
    for (const id of ids) {
      const declaration = importById.get(id);
      if (!declaration || declaration.ownerProfile !== record.owner || seen.has(id)) fail('COMPOSE_DEVICE_IMPORT_DELETION', `${id} has invalid or duplicate deletion ownership`);
      seen.add(id);
    }
    return { ...record, deviceImports: ids };
  });
  if (seen.size !== imports.length || supplied.size !== records.length) fail('COMPOSE_DEVICE_IMPORT_DELETION', 'device import deletion ownership is incomplete');
  return { ...normalizedDeletion, records };
}

export function normalizeProgramPackageProfile(input, inspected, suppliedContext) {
  if (!Object.hasOwn(input ?? {}, 'deviceImports')) return core.normalizeProgramPackageProfile(input, inspected, suppliedContext);
  for (const record of input?.deletion?.records ?? []) {
    if (!Object.hasOwn(record, 'deviceImports')) fail('COMPOSE_DEVICE_IMPORT_DELETION', `${record?.owner ?? '<missing>'} lacks deviceImports deletion ownership`);
  }
  const base = core.normalizeProgramPackageProfile(stripImportOwnership(input), inspected, suppliedContext);
  const deviceImports = normalizeDeviceImports(input.deviceImports, base.normalized);
  const deletion = normalizeImportDeletion(input.deletion, base.normalized.deletion, deviceImports);
  const normalized = { ...base.normalized, deviceImports, deletion };
  return { normalized, identity: canonicalIdentity(normalized), semanticEngineIdentity: base.semanticEngineIdentity };
}

export function composeSearchProgram(profileResult) {
  const base = core.composeSearchProgram(profileResult);
  const deviceImports = profileResult?.normalized?.deviceImports;
  if (!deviceImports) return base;
  const normalized = { ...base.normalized, deviceImports: structuredClone(deviceImports) };
  return { normalized, identity: canonicalIdentity(normalized) };
}

export function buildExecutionPackage(profileResult, programResult) {
  const base = core.buildExecutionPackage(profileResult, programResult);
  const deviceImports = programResult?.normalized?.deviceImports;
  if (!deviceImports) return base;
  const normalized = {
    ...base.normalized,
    cudaJsAdapter: {
      ...base.normalized.cudaJsAdapter,
      searchProgram: {
        ...base.normalized.cudaJsAdapter.searchProgram,
        deviceImports: structuredClone(deviceImports),
      },
    },
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

export function assertOwnerDeletion(beforeProgram, afterProgram, removedOwnerInput, changedOwnerInput = []) {
  core.assertOwnerDeletion(beforeProgram, afterProgram, removedOwnerInput, changedOwnerInput);
  const removedOwners = new Set(Array.isArray(removedOwnerInput) ? removedOwnerInput : [removedOwnerInput]);
  const changedOwners = new Set(Array.isArray(changedOwnerInput) ? changedOwnerInput : [changedOwnerInput]);
  const stable = (program) => (program?.deviceImports ?? []).filter(({ ownerProfile }) => !removedOwners.has(ownerProfile) && !changedOwners.has(ownerProfile));
  if (JSON.stringify(stable(beforeProgram)) !== JSON.stringify(stable(afterProgram))) {
    fail('COMPOSE_DELETION_DEVICE_IMPORT', 'unaffected device imports changed during owner deletion');
  }
  for (const entry of afterProgram?.deviceImports ?? []) {
    if (removedOwners.has(entry.ownerProfile)) fail('COMPOSE_DELETION_DEVICE_IMPORT', `${entry.id} remains after owner deletion`);
  }
  return true;
}

export * from './program-package-core.mjs';

export const programPackageConstants = Object.freeze({
  ...core.programPackageConstants,
  deviceImportDeclarationSchema: DEVICE_IMPORT_SCHEMA,
  maxDeviceImports: MAX_DEVICE_IMPORTS,
  maxDeviceLibraries: MAX_DEVICE_LIBRARIES,
});
