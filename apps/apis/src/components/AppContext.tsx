import React, { ReactNode } from 'react';
import { ThemeProvider } from 'common/src/daisy/theme';
import { ComponentProvider } from 'common/src/system/components';
import { AppSystemAbout } from './AppSystemAbout';
import { WenerLogo } from './WenerLogo';

export const AppContext: React.FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <ComponentProvider
        components={{
          Logo: WenerLogo,
          SystemAbout: AppSystemAbout,
        }}
      >
        {children}
      </ComponentProvider>
    </ThemeProvider>
  );
};
