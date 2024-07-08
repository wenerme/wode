import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { SystemAboutPage } from '@wener/console/pages';

export default {
  element: <SystemAboutPage />,
  handle: {
    title: '关于',
  },
} satisfies RouteObject;
