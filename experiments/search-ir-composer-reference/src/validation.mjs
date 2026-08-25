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

export function compareDecimalUint(left, right) {
  normalizeDecimalUint(left, 'left decimal unsigned integer');
  normalizeDecimalUint(right, 'right decimal unsigned integer');
  if (left.length !== right.length) return left.length < right.length ? -1 : 1;
  return compareRaw(left, right);
}

export function addDecimalUint(left, right) {
  normalizeDecimalUint(left, 'left decimal unsigned integer');
  normalizeDecimalUint(right, 'right decimal unsigned integer');
  let carry = 0;
  let result = '';
  for (let leftIndex = left.length - 1, rightIndex = right.length - 1; leftIndex >= 0 || rightIndex >= 0 || carry > 0; leftIndex -= 1, rightIndex -= 1) {
    const sum = (leftIndex >= 0 ? left.charCodeAt(leftIndex) - 48 : 0)
      + (rightIndex >= 0 ? right.charCodeAt(rightIndex) - 48 : 0)
      + carry;
    result = `${sum % 10}${result}`;
    carry = Math.floor(sum / 10);
  }
  return result;
}

export function multiplyDecimalUint(left, right) {
  normalizeDecimalUint(left, 'left decimal unsigned integer');
  normalizeDecimalUint(right, 'right decimal unsigned integer');
  if (left === '0' || right === '0') return '0';
  const digits = Array(left.length + right.length).fill(0);
  for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex -= 1) {
    for (let rightIndex = right.length - 1; rightIndex >= 0; rightIndex -= 1) {
      const position = leftIndex + rightIndex + 1;
      const product = (left.charCodeAt(leftIndex) - 48) * (right.charCodeAt(rightIndex) - 48) + digits[position];
      digits[position] = product % 10;
      digits[position - 1] += Math.floor(product / 10);
    }
  }
  return digits.join('').replace(/^0+/, '');
}

function subtractDecimalUint(left, right) {
  let borrow = 0;
  let result = '';
  for (let leftIndex = left.length - 1, rightIndex = right.length - 1; leftIndex >= 0; leftIndex -= 1, rightIndex -= 1) {
    let digit = left.charCodeAt(leftIndex) - 48 - borrow - (rightIndex >= 0 ? right.charCodeAt(rightIndex) - 48 : 0);
    if (digit < 0) {
      digit += 10;
      borrow = 1;
    } else {
      borrow = 0;
    }
    result = `${digit}${result}`;
  }
  return result.replace(/^0+(?=[0-9])/, '');
}

export function modDecimalUint(dividend, divisor) {
  normalizeDecimalUint(dividend, 'decimal dividend');
  normalizeDecimalUint(divisor, 'decimal divisor');
  if (divisor === '0') throw new RangeError('decimal divisor must be positive');
  let remainder = '0';
  for (const digit of dividend) {
    remainder = `${remainder === '0' ? '' : remainder}${digit}`.replace(/^0+(?=[0-9])/, '');
    while (compareDecimalUint(remainder, divisor) >= 0) remainder = subtractDecimalUint(remainder, divisor);
  }
  return remainder;
}
