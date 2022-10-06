import test from 'ava';
import { getContentType } from './mime';

test('getContentType', (t) => {
  for (const [k, v] of Object.entries({
    'hello.ts': 'text/plain',
    'hello.tsx': 'text/plain',
    '.gitignore': 'text/plain',
    'README.md': 'text/markdown',
    README: 'text/plain',
  })) {
    t.is(getContentType(k), v);
  }
});
