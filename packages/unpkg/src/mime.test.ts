import { assert, test } from 'vitest';
import { getContentType } from './mime';

test('getContentType', () => {
  for (const [k, v] of Object.entries({
    'hello.ts': 'text/plain',
    'hello.tsx': 'text/plain',
    '.gitkeep': 'text/plain',
    '.dockerignore': 'text/plain',
    '.npmrc': 'text/plain',
    'yarn.lock': 'text/plain',
    'README.md': 'text/markdown',
    README: 'text/plain',
  })) {
    assert.equal(getContentType(k), v);
  }
});
