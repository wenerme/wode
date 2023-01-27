import React from 'react';
import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';
import { LoadingIndicator } from 'common/src/components';
import { AppContext } from './AppContext';
import { createPrimaryRoutes } from './createPrimaryRoutes';

let router: any;

export const App: React.FC<{ path?: string }> = ({ path = '/' }) => {
  path = path.replace(/^\/?/, '/');
  router ||=
    typeof window === 'undefined'
      ? createMemoryRouter(createPrimaryRoutes(), { initialEntries: [path] })
      : createBrowserRouter(createPrimaryRoutes());
  // NOTE ssr not works as expected - always render home page
  if (typeof window === 'undefined') {
    console.debug('\nSSR Render:', path);
    // router built by React.lazy, can not ssr

    // const match = matchRoutes(createPrimaryRoutes(), path);
    // return <AppContext>{renderMatches(match)}</AppContext>; // Missing context
    // return (
    //   <AppContext>
    //     <RouterProvider router={router} fallbackElement={renderMatches(match)} />
    //   </AppContext>
    // );
  }

  return (
    <AppContext>
      <RouterProvider router={router} fallbackElement={<LoadingIndicator />} />
    </AppContext>
  );
};
export default App;
