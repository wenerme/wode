import { test, beforeAll, assert, expect } from 'vitest';
import { ArrayBuffers } from './ArrayBuffers';

beforeAll(() => {
  expect(ArrayBuffers.isNativeBufferAvailable()).toBeTruthy();
  ArrayBuffers.setNativeBufferAllowed(false);
});

test('base64: ignore whitespace', function () {
  const text = '\n   YW9ldQ==  ';
  const buf = ArrayBuffers.from(text, 'base64');
  expect(ArrayBuffers.toString(buf)).toBe('aoeu');
});

test('base64: strings without padding', function () {
  expect(ArrayBuffers.toString(ArrayBuffers.from('YW9ldQ', 'base64'))).toBe('aoeu');
});

test('base64: newline in utf8 -- should not be an issue', function () {
  assert.equal(
    ArrayBuffers.toString(
      ArrayBuffers.from('LS0tCnRpdGxlOiBUaHJlZSBkYXNoZXMgbWFya3MgdGhlIHNwb3QKdGFnczoK', 'base64'),
      'utf8',
    ),
    '---\ntitle: Three dashes marks the spot\ntags:\n',
  );
});

test('base64: newline in base64 -- should get stripped', function () {
  assert.equal(
    ArrayBuffers.toString(
      ArrayBuffers.from(
        'LS0tCnRpdGxlOiBUaHJlZSBkYXNoZXMgbWFya3MgdGhlIHNwb3QKdGFnczoK\nICAtIHlhbWwKICAtIGZyb250LW1hdHRlcgogIC0gZGFzaGVzCmV4cGFuZWQt',
        'base64',
      ),
      'utf8',
    ),
    '---\ntitle: Three dashes marks the spot\ntags:\n  - yaml\n  - front-matter\n  - dashes\nexpaned-',
  );
});

test('base64: tab characters in base64 - should get stripped', function () {
  assert.equal(
    ArrayBuffers.toString(
      ArrayBuffers.from(
        'LS0tCnRpdGxlOiBUaHJlZSBkYXNoZXMgbWFya3MgdGhlIHNwb3QKdGFnczoK\t\t\t\tICAtIHlhbWwKICAtIGZyb250LW1hdHRlcgogIC0gZGFzaGVzCmV4cGFuZWQt',
        'base64',
      ),
      'utf8',
    ),
    '---\ntitle: Three dashes marks the spot\ntags:\n  - yaml\n  - front-matter\n  - dashes\nexpaned-',
  );
});

test('base64: invalid non-alphanumeric characters -- should be stripped', function () {
  expect(ArrayBuffers.toString(ArrayBuffers.from('!"#$%&\'()*,.:;<=>?@[\\]^`{|}~', 'base64'), 'utf8')).toBe('');
});

test('base64: high byte', function () {
  const highByte = ArrayBuffers.from([128]);
  assert.deepEqual(ArrayBuffers.alloc(1, ArrayBuffers.toString(highByte, 'base64'), 'base64'), highByte);
});
