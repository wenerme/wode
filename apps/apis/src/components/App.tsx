import React, { useState } from 'react';
import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';
import { LoadingIndicator } from 'common/src/components';
import { ThemeProvider } from 'common/src/daisy/theme';
import { ComponentProvider } from 'common/src/system/components';
import { AppSystemAbout } from './AppSystemAbout';
import { WenerLogo } from './WenerLogo';
import { createPrimaryRoutes } from './createPrimaryRoutes';

export const App: React.FC<{ path?: string }> = ({ path = '/' }) => {
  path = path.replace(/^\/?/, '/');
  const [router] = useState(() =>
    typeof window === 'undefined'
      ? createMemoryRouter(createPrimaryRoutes(), { initialEntries: [path] })
      : createBrowserRouter(createPrimaryRoutes()),
  );

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
    <ThemeProvider>
      <ComponentProvider
        components={{
          Logo: WenerLogo,
          SystemAbout: AppSystemAbout,
        }}
      >
        {router && <RouterProvider router={router} fallbackElement={<LoadingIndicator />} />}
      </ComponentProvider>
    </ThemeProvider>
  );
};
export default App;
