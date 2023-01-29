import React, { ReactNode, useEffect, useState } from 'react';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createLazyPromise } from '@wener/utils';
import { LoadingIndicator } from '../../../components';
import { getBaseUrl } from '../../../runtime';
import { SiteConf, SiteModuleConf } from './schema';

export const SiteConfProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const [init, setInit] = useState(false);
  useEffect(() => {
    // fixme handle error
    Loader.finally(() => setInit(true));
  }, []);
  if (!init) {
    return <LoadingIndicator />;
  }
  return <>{children}</>;
};
const Loader = createLazyPromise(async () => {
  const conf = SiteConf.parse(await fetch(`${getBaseUrl()}/site.conf.json`).then((v) => v.json()));
  SiteConfStore.setState(conf);
  if (conf.module.src) {
    const moduleConf = SiteModuleConf.parse(await fetch(conf.module.src).then((v) => v.json()));
    // local override
    try {
      // e.g. 禁用 tool 模块
      // localStorage['__SITE_MODULE_CONF__'] = JSON.stringify({disabled:['tool']})
      // 恢复
      // delete localStorage['__SITE_MODULE_CONF__']
      let data = SiteModuleConf.deepPartial().parse(JSON.parse(localStorage['__SITE_MODULE_CONF__']));
      if (data) {
        moduleConf.disabled = moduleConf.disabled.concat(data.disabled || []);
      }
    } catch (e) {}

    SiteConfStore.setState((s) => {
      Object.assign(s.module.config, moduleConf);
    });
  }
  return conf;
});

const SiteConfStore = createStore<SiteConf>()(
  immer(() => {
    return SiteConf.parse({});
  }),
);

export function getSiteConfStore() {
  return SiteConfStore;
}
export function getSiteConf() {
  return getSiteConfStore().getState();
}
