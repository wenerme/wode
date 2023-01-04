import React from 'react';
import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ThemeStateReactor } from 'common/src/daisy/theme';
import { createRouters } from './createRouters';

const router =
  typeof window === 'undefined' ? createMemoryRouter(createRouters()) : createBrowserRouter(createRouters(), {});

export const WenerApisApp: React.FC = () => {
  return (
    <>
      <ThemeStateReactor />
      <RouterProvider router={router} />
    </>
  );
};
export default WenerApisApp;
