import type { ReactNode } from 'react';
import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ThemeStateReactor } from 'common/src/daisy/theme';
import { Router as RemixRouter } from '@remix-run/router';

declare module 'react-router-dom' {
  export interface IndexRouteObject {
    meta?: RouteObjectMeta;
  }

  export interface NonIndexRouteObject {
    meta?: RouteObjectMeta;
  }
}

export interface RouteObjectMeta {
  id?: string;
  title?: string;
  icon?: ReactNode;
  menu?: Record<string, any>;

  [k: string]: any;
}

export function createPrimaryRouters(): RouteObject[] {
  return [
    {
      element: <div>Hello</div>,
    },
  ];
}

let router: RemixRouter;

export const WenerApisApp: React.FC = () => {
  // react-router-dom 6.5.0
  router ||=
    typeof window === 'undefined'
      ? createMemoryRouter(createPrimaryRouters())
      : createBrowserRouter(createPrimaryRouters(), {});

  return (
    <>
      <ThemeStateReactor />
      {router && <RouterProvider router={router} />}
    </>
  );
};
export default WenerApisApp;
