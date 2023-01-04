import React from 'react';
import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ThemeStateReactor } from 'common/src/daisy/theme';
import type { Router as RemixRouter } from '@remix-run/router';
import { createPrimaryRouters } from './createPrimaryRouters';

let router: RemixRouter;

export const WenerApisApp: React.FC = () => {
  // react-router-dom 6.5.0
  router ||=
    typeof window === 'undefined'
      ? createMemoryRouter(createPrimaryRouters())
      : createBrowserRouter(createPrimaryRouters());

  return (
    <>
      <ThemeStateReactor />
      {router && <RouterProvider router={router} />}
    </>
  );
};
export default WenerApisApp;
