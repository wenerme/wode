'use client';

import React, { type PropsWithChildren } from 'react';
import { Toaster } from 'react-hot-toast';
import { LoadingIndicator } from '@wener/console/console';
import { ThemeStateReactor } from '@wener/console/daisy';
import { useExposeDebug } from '@wener/console/hooks';
import dayjs from 'dayjs';
import type { InitDef } from '@/utils/init/defineInit';
import { useInit } from '@/utils/init/useInit';

export const RootContext: React.FC<PropsWithChildren & { init?: Array<InitDef> }> = ({ children, init }) => {
  useExposeDebug({ dayjs });
  const { done } = useInit(init);

  if (!done) {
    return <LoadingIndicator />;
  }

  return (
    <>
      <Toaster />
      <ThemeStateReactor />
      {children}
    </>
  );
};
