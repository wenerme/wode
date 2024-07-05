import React from 'react';
import { type RouteObject } from 'react-router-dom';
import { DevDebugPage } from '@/web/pages';

export default {
  element: <DevDebugPage />,
  handle: {
    title: '开发设置',
  },
} satisfies RouteObject;
