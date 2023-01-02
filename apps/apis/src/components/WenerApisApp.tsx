import React from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { NotFoundPage } from 'common/src/components';
import { PrimaryLayout } from './PrimaryLayout';

const router = createBrowserRouter(
  [
    {
      element: (
        <PrimaryLayout>
          <Outlet />
        </PrimaryLayout>
      ),
      errorElement: <NotFoundPage />,
      children: [
        {
          index: true,
          element: <div>Hello</div>,
        },
      ],
    },
  ],
  {
    // basename: '/',
  },
);

export const WenerApisApp: React.FC = () => {
  return <RouterProvider router={router} />;
};
export default WenerApisApp;
