import { test, assert } from 'vitest';
import { SiteConf, SiteModuleConf } from './schema';

test('conf schema', () => {
  assert.deepEqual(SiteModuleConf.parse({}), {
    include: [],
    disabled: [],
  });
  assert.deepEqual(SiteConf.parse({}), {
    title: 'System',
    author: {
      name: 'Wener',
    },
    include: [],
    trpc: {
      servers: {},
    },
    api: {},
    auth: {},
    module: {
      include: [],
      disabled: [],
    },
  });

  console.log(
    SiteConf.partial().parse({
      module: {
        include: ['a'],
      },
    }),
  );
});
