import React, { useContext } from 'react';
import { structuredClone } from '@wener/utils';
import { proxyWithCompare } from '../../valtio';

export declare type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export declare type Side = 'left' | 'right' | 'top' | 'bottom';

export interface DebugState {
  ReactQuery: {
    devtools: {
      // open: boolean;
      enable?: boolean;
      position?: Corner;
    };
  };
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
