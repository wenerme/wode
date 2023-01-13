import React, { ReactNode } from 'react';
import { createHashRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ThemeStateReactor } from 'common/src/daisy/theme';
import { ComponentProvider } from 'common/src/system/components/ComponentContext';
import { WenerLogo } from './WenerLogo';
import { createPrimaryRouters } from './createPrimaryRouters';

let router: any;

export const WenerApisApp: React.FC<{ path?: string }> = ({ path = '/' }) => {
  path = path.replace(/^\/?/, '/');
  // https://github.com/vercel/next.js/issues/37825
  // react-router-dom 6.5.0
  // NOTE ssr not works as expected
  router ||=
    typeof window === 'undefined'
      ? createMemoryRouter(createPrimaryRouters(), { initialEntries: [path] })
      : createHashRouter(createPrimaryRouters());

  if (typeof window === 'undefined') {
    console.log('\nSSR Render:', path);
  }
  return (
    <WenerApisContext>
      <ThemeStateReactor />
      {router && <RouterProvider router={router} />}
    </WenerApisContext>
  );
};
export default WenerApisApp;

const WenerApisContext: React.FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <ComponentProvider
      components={{
        Logo: WenerLogo,
      }}
    >
      {children}
    </ComponentProvider>
  );
};
