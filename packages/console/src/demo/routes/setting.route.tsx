import React from 'react';
import { Outlet, RouteObject } from 'react-router-dom';
import { ErrorSuspenseBoundary } from '@wener/reaction';
import SettingPage from '../pages/SettingPage';

export default {
  element: (
    <SettingPage>
      <ErrorSuspenseBoundary>
        <Outlet />
      </ErrorSuspenseBoundary>
    </SettingPage>
  ),
} as RouteObject;
