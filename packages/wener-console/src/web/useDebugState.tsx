import { createContext, useContext } from 'react';
import { proxyWithCompare } from '@wener/reaction/valtio';
import { structuredClone } from '@wener/utils';

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
const DebugStateContext = createContext(DefaultDebugState);

export function useDebugState() {
  return useContext(DebugStateContext);
}
