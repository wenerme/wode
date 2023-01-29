import { type ReactElement } from 'react';
import { type MaybePromise } from '@wener/utils';
import { type RouteObjects } from '../../router';

export interface Module {
  id: string;
  title?: string;
  description?: string;
  version?: string;

  icon?: ReactElement;
  category?: string;
  tags?: string;

  // hook into root routes
  createRoutes?: () => MaybePromise<RouteObjects>;
  // installed into root
  element?: ReactElement;
  module: DynamicModule; // imported module
}

export interface DynamicModule {
  createRoutes?: () => RouteObjects;
  createModule?: () => Partial<Module>;

  [k: string | symbol]: any;
}
