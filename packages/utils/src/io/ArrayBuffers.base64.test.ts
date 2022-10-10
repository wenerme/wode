import test from 'ava';
import { ArrayBuffers } from './ArrayBuffers';

test.before(() => {
  ArrayBuffers.setAllowedNativeBuffer(false);
});

test('base64: ignore whitespace', function (t) {
  const text = '\n   YW9ldQ==  ';
  const buf = ArrayBuffers.from(text, 'base64');
  t.is(ArrayBuffers.toString(buf), 'aoeu');
});

test('base64: strings without padding', function (t) {
  t.is(ArrayBuffers.toString(ArrayBuffers.from('YW9ldQ', 'base64')), 'aoeu');
});

test('base64: newline in utf8 -- should not be an issue', function (t) {
  t.is(
    ArrayBuffers.toString(
      ArrayBuffers.from('LS0tCnRpdGxlOiBUaHJlZSBkYXNoZXMgbWFya3MgdGhlIHNwb3QKdGFnczoK', 'base64'),
      'utf8',
    ),
    '---\ntitle: Three dashes marks the spot\ntags:\n',
  );
});

test('base64: newline in base64 -- should get stripped', function (t) {
  t.is(
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

test('base64: tab characters in base64 - should get stripped', function (t) {
  t.is(
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

test('base64: invalid non-alphanumeric characters -- should be stripped', function (t) {
  t.is(ArrayBuffers.toString(ArrayBuffers.from('!"#$%&\'()*,.:;<=>?@[\\]^`{|}~', 'base64'), 'utf8'), '');
});

test('base64: high byte', function (t) {
  const highByte = ArrayBuffers.from([128]);
  t.deepEqual(ArrayBuffers.alloc(1, ArrayBuffers.toString(highByte, 'base64'), 'base64'), highByte);
});
