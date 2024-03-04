import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { SystemAboutPage } from '../../SystemAboutPage';

export default {
  element: <SystemAboutPage />,
  handle: {
    title: '关于',
  },
} satisfies RouteObject;
