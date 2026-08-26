import { createHash } from 'node:crypto';
import { TextDecoder } from 'node:util';

import { compareRaw, fail, isRecord } from './errors.mjs';

const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true });

function canonicalValue(value, active, label) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Object.is(value, -0)) fail('HARNESS_CANONICAL_VALUE', `${label} contains a non-canonical number`);
    return value;
  }
  if (typeof value !== 'object') fail('HARNESS_CANONICAL_VALUE', `${label} contains an unsupported value`);
  if (active.has(value)) fail('HARNESS_CANONICAL_CYCLE', `${label} contains a cyclic value`);
  active.add(value);
  let result;
  if (Array.isArray(value)) {
    result = value.map((entry, index) => canonicalValue(entry, active, `${label}[${index}]`));
  } else {
    if (!isRecord(value)) fail('HARNESS_CANONICAL_VALUE', `${label} contains a non-record object`);
    result = Object.fromEntries(Object.keys(value).sort(compareRaw).map((key) => [key, canonicalValue(value[key], active, `${label}.${key}`)]));
  }
  active.delete(value);
  return result;
}

export function canonicalBytes(value, label = 'value') {
  return Buffer.from(JSON.stringify(canonicalValue(value, new Set(), label)), 'utf8');
}

export function canonicalClone(value, label = 'value') {
  return JSON.parse(canonicalBytes(value, label).toString('utf8'));
}

export function canonicalIdentity(value, label = 'value') {
  const bytes = canonicalBytes(value, label);
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
    fail('HARNESS_SOURCE_UTF8', 'source text is not valid UTF-8');
  }
  return createHash('sha256').update(Buffer.from(text.replace(/\r\n?/g, '\n'), 'utf8')).digest('hex');
}

export function frozenCanonicalClone(value, label = 'value') {
  const clone = canonicalClone(value, label);
  const freeze = (candidate) => {
    if (candidate !== null && typeof candidate === 'object' && !Object.isFrozen(candidate)) {
      for (const child of Object.values(candidate)) freeze(child);
      Object.freeze(candidate);
    }
    return candidate;
  };
  return freeze(clone);
}
