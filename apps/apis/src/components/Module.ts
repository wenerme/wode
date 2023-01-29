import { ReactElement } from 'react';
import { RouteObjects } from 'common/src/router';
import { MaybePromise } from '@wener/utils';

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
