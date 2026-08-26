export class HarnessError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = 'HarnessError';
    this.code = code;
  }
}

export function fail(code, message) {
  throw new HarnessError(code, message);
}

export function isRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function compareRaw(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function exactKeys(value, expected, code, label) {
  if (!isRecord(value)) fail(code, `${label} must be an object`);
  const actual = Object.keys(value).sort(compareRaw);
  const wanted = [...expected].sort(compareRaw);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(code, `${label} fields must be exactly ${wanted.join(', ')}`);
  }
}

export function assertNamespacedId(value, code, label) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$/.test(value)) {
    fail(code, `${label} must be a namespaced lowercase identifier`);
  }
  return value;
}

export function assertSha256(value, code, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) fail(code, `${label} must be a SHA-256 digest`);
  return value;
}

export function assertUniqueStrings(value, code, label) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string') || new Set(value).size !== value.length) {
    fail(code, `${label} must contain unique strings`);
  }
  return value;
}
