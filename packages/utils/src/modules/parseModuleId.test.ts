import test from 'ava';
import { parseModuleId } from './parseModuleId';

test('parseModuleId', (t) => {
  const tests = {
    '@wener/reaction': {
      id: `@wener/reaction@latest`,
      name: '@wener/reaction',
      range: 'latest',
      scoped: true,
      org: 'wener',
      pkg: 'reaction',
    },
    reaction: {
      id: `reaction@latest`,
      name: 'reaction',
      range: 'latest',
      pkg: 'reaction',
      scoped: false,
    },
    'reaction@1': {
      id: `reaction@1`,
      name: 'reaction',
      range: '1',
      pkg: 'reaction',
      scoped: false,
    },
    'reaction@1.1.1': {
      id: `reaction@1.1.1`,
      name: 'reaction',
      version: '1.1.1',
      range: '1.1.1',
      pkg: 'reaction',
      scoped: false,
    },
    'reaction@1.1.1-alpha': {
      id: `reaction@1.1.1-alpha`,
      name: 'reaction',
      version: '1.1.1-alpha',
      range: '1.1.1-alpha',
      pkg: 'reaction',

      scoped: false,
    },
    'reaction@1.1.1/index.js': {
      id: `reaction@1.1.1`,
      name: 'reaction',
      version: '1.1.1',
      range: '1.1.1',
      scoped: false,
      pkg: 'reaction',

      path: '/index.js',
    },
    'reaction@1.1.1/': {
      id: `reaction@1.1.1`,
      name: 'reaction',
      version: '1.1.1',
      range: '1.1.1',
      scoped: false,
      pkg: 'reaction',
      path: '/',
    },
  };
  for (const [k, v] of Object.entries(tests)) {
    t.deepEqual(parseModuleId(k), v);
  }
});
