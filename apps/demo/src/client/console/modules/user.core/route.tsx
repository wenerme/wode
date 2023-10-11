import React from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorSuspenseBoundary } from '@wener/reaction';
import SettingPage from './SettingPage';

export default {
  element: (
    <SettingPage>
      <ErrorSuspenseBoundary>
        <Outlet />
      </ErrorSuspenseBoundary>
    </SettingPage>
  ),
};
