'use client';

import type React from 'react';
import type { PropsWithChildren } from 'react';
import { Toaster } from 'react-hot-toast';
import { LoadingIndicator } from '@wener/console/console';
import { ThemeStateReactor } from '@wener/console/daisy';
import { useExposeDebug } from '@wener/console/hooks';
import dayjs from 'dayjs';
import { useInit } from '@/utils/init/useInit';

export const RootContext: React.FC<PropsWithChildren> = ({ children }) => {
  useExposeDebug({ dayjs });
  const { done } = useInit();

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
