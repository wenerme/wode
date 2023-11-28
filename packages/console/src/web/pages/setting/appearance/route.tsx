import React from 'react';
import { RouteObject } from 'react-router-dom';
import AppearanceSetting from './AppearanceSetting';

export default {
  element: <AppearanceSetting />,
  handle: {
    title: '显示设置',
  },
} as RouteObject;
