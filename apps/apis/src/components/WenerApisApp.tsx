import React from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { NotFoundPage } from 'common/src/components';
import { trpcClient } from '../utils/trpc';
import { PrimaryLayout } from './PrimaryLayout';
import { ZxcvbnPasswordStrength } from './ZxcvbnPasswordStrength';

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
        {
          path: 'password',
          children: [
            {
              index: true,
              element: <Navigate to={'zxcvbn'} />,
            },
            {
              path: 'zxcvbn',
              element: <ZxcvbnPasswordStrength />,
              action: ({ params: { password = '123456789' } }) => {
                return trpcClient.password.zxcvbn.query({ password });
              },
              loader: ({ request }) => {
                return trpcClient.password.zxcvbn.query({
                  password: new URL(request.url).searchParams.get('password') || '123456',
                });
              },
            },
          ],
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
