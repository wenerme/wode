import type React from 'react';
import { useState, type PropsWithChildren } from 'react';
import { LoadingIndicator } from '@wener/console/loader';
import { useAsyncEffect } from '@wener/reaction';
import { getSiteStore, type SiteConfInit } from './SiteStore';

export const SiteLoader: React.FC<
  PropsWithChildren & {
    getSiteConf?: () => Promise<SiteConfInit>;
  }
> = ({ children, getSiteConf }) => {
  const [init, setInit] = useState(!getSiteConf);

  useAsyncEffect(async () => {
    if (!getSiteConf) return;
    const cfg = await getSiteConf();
    getSiteStore().getState().load(cfg);
    setTimeout(() => {
      setInit(true);
    }, 0);
  }, []);

  if (!init) {
    return <LoadingIndicator />;
  }

  return children;
};
