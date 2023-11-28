import React, { useContext } from 'react';
import { structuredClone } from '@wener/utils';
import { proxyWithCompare } from '../components/valtio';

declare type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
declare type Side = 'left' | 'right' | 'top' | 'bottom';

export interface DebugState {
  ReactQuery: {
    devtools: {
      // open: boolean;
      enable?: boolean;
      position?: Corner;
    };
  };
  api?: {
    url?: string;
  };
  trpc?: {
    servers?: Record<string, { url: string }>;
  };
  modules?: Record<
    string,
    {
      enabled?: boolean;
    }
  >;
}

const InitialState: DebugState = {
  ReactQuery: {
    devtools: {
      enable: false,
    },
  },
};
const DefaultDebugState = proxyWithCompare(structuredClone(InitialState));
const DebugStateContext = React.createContext(DefaultDebugState);

export function useDebugState() {
  return useContext(DebugStateContext);
}
