import { createHash } from 'node:crypto';
import { TextDecoder } from 'node:util';

const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true });

export class ValidationError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = 'ValidationError';
    this.code = code;
  }
}

export function fail(code, message) {
  throw new ValidationError(code, message);
}

export function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function compareRaw(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function exactKeys(value, expected, code, label) {
  if (!isRecord(value)) fail(code, `${label} must be an object`);
  const actual = Object.keys(value).sort(compareRaw);
  const canonicalExpected = [...expected].sort(compareRaw);
  if (actual.length !== canonicalExpected.length || actual.some((key, index) => key !== canonicalExpected[index])) {
    fail(code, `${label} fields must be exactly ${canonicalExpected.join(', ')}`);
  }
}

export function assertString(value, pattern, code, label) {
  if (typeof value !== 'string' || !pattern.test(value)) fail(code, `${label} is invalid`);
}

export function assertInteger(value, minimum, code, label) {
  if (!Number.isSafeInteger(value) || value < minimum) fail(code, `${label} is invalid`);
}

export function assertExactArray(actual, expected, code, label) {
  if (!Array.isArray(actual)
      || actual.length !== expected.length
      || actual.some((value, index) => value !== expected[index])) {
    fail(code, `${label} is not canonical`);
  }
}

export function uniqueBy(values, key, code, label) {
  const seen = new Set();
  for (const value of values) {
    const identity = value[key];
    if (seen.has(identity)) fail(code, `${label} duplicates ${identity}`);
    seen.add(identity);
  }
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.keys(value).sort(compareRaw).map((key) => [key, canonicalValue(value[key])]));
}

export function canonicalBytes(value) {
  return Buffer.from(JSON.stringify(canonicalValue(value)), 'utf8');
}

export function canonicalIdentity(value) {
  const bytes = canonicalBytes(value);
  return {
    algorithm: 'sha256',
    byteLength: bytes.byteLength,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

export function sourceTextSha256(bytes) {
  let text;
  try {
    text = UTF8_DECODER.decode(bytes);
  } catch {
    fail('SOURCE_UTF8', 'source text is not valid UTF-8');
  }
  const normalized = Buffer.from(text.replace(/\r\n?/g, '\n'), 'utf8');
  return createHash('sha256').update(normalized).digest('hex');
}

export function normalizeDecimalUint(value, label = 'decimal unsigned integer') {
  if (typeof value !== 'string' || !/^(?:0|[1-9][0-9]*)$/.test(value)) {
    fail('FOUNDATION_DECIMAL_UINT', `${label} must use canonical unsigned decimal string encoding`);
  }
  return value;
}
