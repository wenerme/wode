import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { AppearanceSettingPage } from '@wener/console/pages';

export default {
  element: <AppearanceSettingPage />,
  handle: {
    title: '显示设置',
  },
} as RouteObject;
