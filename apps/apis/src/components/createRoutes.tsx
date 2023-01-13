import type { ReactNode } from 'react';
import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { createSystemRoutes } from './createSystemRoutes';
import { createHashRoutes } from './hash/createHashRoutes';
import { createIpfsRoutes } from './ipfs/createIpfsRoutes';
import { createPasswordRoutes } from './password/createPasswordRoutes';
import { createToolRoutes } from './tool/createToolRoutes';

export function createRoutes(): RouteObject[] {
  return [
    ...createIpfsRoutes(),
    ...createHashRoutes(),
    ...createSystemRoutes(),
    ...createPasswordRoutes(),
    ...createToolRoutes(),
  ];
}
