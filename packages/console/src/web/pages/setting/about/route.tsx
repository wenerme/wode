import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { SystemAbout } from './SystemAbout';

export default {
  element: <SystemAbout />,
  handle: {
    title: '关于',
  },
} satisfies RouteObject;
