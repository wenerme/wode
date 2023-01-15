import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';

export { useRouteTitles } from './useRouteTitles';

declare module 'react-router-dom' {
  export interface IndexRouteObject {
    meta?: RouteObjectMeta;
  }

  export interface NonIndexRouteObject {
    meta?: RouteObjectMeta;
  }
}

export interface RouteObjectMeta {
  id?: string;
  title?: string;
  icon?: ReactNode;
  menu?: Record<string, any>;

  [k: string]: any;
}

export type RouteObjects = RouteObject[];
