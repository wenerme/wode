import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { createPrimaryLayoutRoutes } from './createPrimaryLayoutRoutes';
import { createRoutes } from './createRoutes';

export function createPrimaryRoutes(): RouteObject[] {
  return createPrimaryLayoutRoutes(createRoutes());
}
