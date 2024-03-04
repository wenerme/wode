import React from 'react';
import { RouteObject } from 'react-router-dom';
import AppearanceSettingPage from '../../AppearanceSettingPage';

export default {
  element: <AppearanceSettingPage />,
  handle: {
    title: '显示设置',
  },
} as RouteObject;
