import type { ReactNode } from 'react';
import React from 'react';
import 'dayjs/locale/en';
import 'dayjs/locale/zh';
import 'dayjs/locale/zh-cn';
import { useSnapshot } from 'valtio';
import { useMounted } from '@wener/reaction';
import { getDayjs } from '../runtime';
import { useDebugState } from '../system/components';
import { Toaster } from '../toast';

export const Setup: React.FC<{ init?: boolean; children: ReactNode; devtools?: { query?: boolean } }> = ({
  children,
  devtools,
}) => {
  if (!Setup.defaultProps?.init) {
    Setup.defaultProps ||= {};
    Setup.defaultProps.init = true;
    getDayjs();
  }
  return (
    <>
      <Toaster />
      {children}
      <Devtools {...devtools} />
    </>
  );
};
Setup.defaultProps = { init: false };

const ReactQueryDevtools = React.lazy(() =>
  import('@tanstack/react-query-devtools').then((v) => ({ default: v.ReactQueryDevtools })),
);
const ReactQueryDevtoolsPanel = React.lazy(() =>
  import('@tanstack/react-query-devtools').then((v) => ({ default: v.ReactQueryDevtoolsPanel })),
);

const ReactTableDevtools = React.lazy(() =>
  import('@tanstack/react-table-devtools').then((v) => ({ default: v.ReactTableDevtools })),
);

const Devtools: React.FC<{ query?: boolean }> =
  process.env.NODE_ENV === 'development'
    ? ({ query = true }) => {
        const mounted = useMounted();
        const state = useDebugState().ReactQuery.devtools;
        const { enable, position } = useSnapshot(state);

        if (!mounted) {
          return null;
        }

        return (
          <React.Suspense fallback={'Devtools'}>
            {query && enable && <ReactQueryDevtools position={position} />}
          </React.Suspense>
        );
      }
    : () => null;
