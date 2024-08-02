import React, { PropsWithChildren, useState } from 'react';
import { LoadingIndicator } from '@wener/console/console';
import { AppConf, getAppState } from '@wener/console/state';
import { useAsyncEffect } from '@wener/reaction';

export const AppConfLoader: React.FC<
  PropsWithChildren & {
    load?: () => Promise<AppConf | undefined>;
  }
> = ({ children, load }) => {
  const [init, setInit] = useState(!load);
  const [error, setError] = useState<any>(undefined);
  useAsyncEffect(async () => {
    if (!load) return;
    try {
      let cfg = await load();
      if (cfg) {
        getAppState().loadConf(cfg);
      }
    } catch (e) {
      setError(e);
      return;
    }
    setTimeout(() => {
      setInit(true);
    }, 0);
  }, []);

  if (!init) {
    return <LoadingIndicator title={'Loading app conf'} error={error} />;
  }

  return children;
};
