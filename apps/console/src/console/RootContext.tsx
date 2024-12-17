'use client';

import type React from 'react';
import type { PropsWithChildren } from 'react';
import { Toaster } from 'react-hot-toast';
import type { InitDef } from '@wener/common/meta';
import { LoadingIndicator } from '@wener/console/console';
import { DaisyTheme } from '@wener/console/daisy';
import { useExposeDebug } from '@wener/console/hooks';
import { useInit } from 'common/components';
import dayjs from 'dayjs';

export const RootContext: React.FC<PropsWithChildren & { init?: Array<InitDef> }> = ({ children, init }) => {
  useExposeDebug({ dayjs });
  const { done } = useInit(init);

  if (!done) {
    return <LoadingIndicator />;
  }

  return (
    <>
      <Toaster />
      <DaisyTheme.Sidecar />
      {children}
    </>
  );
};
