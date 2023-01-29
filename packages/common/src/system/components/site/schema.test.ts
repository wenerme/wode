import test from 'ava';
import { SiteConf, SiteModuleConf } from './schema';

test('conf schema', (t) => {
  t.deepEqual(SiteModuleConf.parse({}), {
    include: [],
    disabled: [],
  });
  t.deepEqual(SiteConf.parse({}), {
    title: 'System',
    author: {
      name: 'Wener',
    },
    module: {
      config: {
        include: [],
        disabled: [],
      },
    },
  });
});
