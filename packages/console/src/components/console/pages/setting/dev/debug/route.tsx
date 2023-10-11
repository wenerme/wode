import React from 'react';
import { type RouteObject } from 'react-router-dom';
import DevDebug from './DevDebug';

export default {
  element: <DevDebug />,
  handle: {
    title: '开发设置',
  },
} satisfies RouteObject;
