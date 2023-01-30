import React, { type ReactNode, useEffect, useState } from 'react';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { memoize } from '@wener/utils';
import { LoadingIndicator } from '../../../components';
import { SiteConf, SiteModuleConf } from './schema';

export const SiteConfProvider: React.FC<{ children?: ReactNode; url?: string }> = ({
  children,
  url = '/site.conf.json',
}) => {
  const [init, setInit] = useState(false);
  useEffect(() => {
    // fixme handle error
    loadSiteConf(url).finally(() => {
      setInit(true);
    });
  }, []);
  if (!init) {
    return <LoadingIndicator />;
  }
  return <>{children}</>;
};

const loadSiteConf = memoize(async (url: string) => {
  // TODO cache to session storage make reload faster
  const conf = SiteConf.parse(await fetch(url).then((v) => v.json()));
  const partial = SiteConf.partial();
  for (let url of conf.include) {
    try {
      const part = await fetch(url)
        .then((v) => v.json())
        .then((v) => {
          // console.debug(`Site conf include ${url}`, v, partial.parse(v));
          return partial.parse(v);
        });
      // TODO better merge
      Object.assign(conf, part);
    } catch (e) {
      console.error(`load site conf failed: ${url} ${e}`);
    }
  }
  // local override
  try {
    // e.g. 禁用 tool 模块
    // localStorage['__SITE_MODULE_CONF__'] = JSON.stringify({disabled:['tool']})
    // 恢复
    // delete localStorage['__SITE_MODULE_CONF__']
    const data = SiteModuleConf.deepPartial().parse(JSON.parse(localStorage.__SITE_MODULE_CONF__));
    if (data) {
      conf.module.disabled = conf.module.disabled.concat(data.disabled || []);
    }
  } catch (e) {}
  SiteConfStore.setState(conf);

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
