import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeStateReactor } from 'common/src/daisy/theme';
import { createRouters } from './createRouters';

const router = createBrowserRouter(createRouters(), {});

export const WenerApisApp: React.FC = () => {
  return (
    <>
      <ThemeStateReactor />
      <RouterProvider router={router} />
    </>
  );
};
export default WenerApisApp;
